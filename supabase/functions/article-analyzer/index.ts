import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompt.ts";

const MODEL = "claude-opus-5";

// The scraped body is untrusted: a literal "</raw_text>" in the text would close the
// envelope early and the rest would read as instructions. Neutralise angle brackets.
const escape = (value) =>
  String(value ?? "").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function buildEnvelope(article) {
  return [
    "<article>",
    // The outlet the text was read from, which differs from url for aggregator pages.
    `  <url>${escape(article.clean_text_url ?? article.url)}</url>`,
    `  <retrieved_at>${escape(article.scraped_at)}</retrieved_at>`,
    `  <raw_text>${escape(article.clean_text)}</raw_text>`,
    "</article>",
  ].join("\n");
}

// The prompt forbids markdown fences, but strip them anyway rather than fail on one.
function parseAnalysis(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  try {
    return JSON.parse(fenced ? fenced[1] : text);
  } catch {
    return null;
  }
}

// The schema defines statement as { text, decision_id, tier }, but accept a bare
// string too rather than lose a usable statement over its shape.
function readerFields(analysis) {
  const statement =
    typeof analysis.statement === "string" ? analysis.statement : analysis.statement?.text;
  const clean = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);
  return { statement: clean(statement), description: clean(analysis.description) };
}

// An update matching no rows is reported as success, so ask for the row back and treat
// an empty result as the failure it is.
async function write(db, articleId, fields) {
  const { data, error } = await db
    .from("article_analysis")
    .update({ ...fields, completed_at: new Date().toISOString() })
    .eq("article_id", articleId)
    .select("article_id");

  if (error) throw error;
  if (!data.length) throw new Error(`analysis row for article ${articleId} is missing`);
}

// A reply this long occasionally comes back with a misplaced bracket, so one malformed
// reply earns a second attempt before the article is marked as failed.
const ATTEMPTS = 2;

async function callModel(anthropic, article) {
  // Streamed so the long schema can't trip the SDK's request timeout. The system
  // prompt is cached; the article goes after it so each call reuses that prefix.
  const stream = anthropic.beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    output_config: { effort: "low" },
    // If a safety classifier declines the article, retry it on another model
    // rather than returning nothing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: buildEnvelope(article) }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error(`model declined: ${message.stop_details?.category ?? "unknown"}`);
  }

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return { message, text };
}

async function analyse(db, article) {
  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

  try {
    let message, text, analysis;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      ({ message, text } = await callModel(anthropic, article));
      analysis = parseAnalysis(text);
      if (analysis) break;
      console.log(`article-analyzer: article ${article.id} attempt ${attempt} returned invalid JSON`);
    }

    if (analysis) {
      const { data, error } = await db
        .from("articles")
        .update(readerFields(analysis))
        .eq("id", article.id)
        .select("id");
      if (error) throw error;
      if (!data.length) throw new Error(`article ${article.id} not found when saving statement`);
    }

    await write(db, article.id, {
      status: analysis ? "ok" : "error",
      analysis,
      raw_response: analysis ? null : text,
      error: analysis ? null : "model did not return valid JSON",
      model: message.model,
    });

    console.log(`article-analyzer: article ${article.id} ${analysis ? "ok" : "unparseable"}`);
  } catch (err) {
    console.error(`article-analyzer: article ${article.id} failed`, err);
    try {
      await write(db, article.id, { status: "error", error: String(err.message ?? err) });
    } catch (markErr) {
      console.error(`article-analyzer: article ${article.id} could not be marked failed`, markErr);
    }
  }
}

// Invoked by a trigger on `articles` (see supabase/migrations/*_article_analysis_trigger.sql).
export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req, ctx) => {
    const body = await req.json().catch(() => ({}));
    const articleId = body.article_id;
    if (!articleId) {
      return Response.json({ error: "article_id is required" }, { status: 400 });
    }

    const { data: article, error } = await ctx.supabaseAdmin
      .from("articles")
      .select("id, url, clean_text, clean_text_url, scraped_at")
      .eq("id", articleId)
      .single();

    if (error) return Response.json({ error: error.message }, { status: 404 });
    if (!article.clean_text) {
      return Response.json({ error: "article has no clean_text yet" }, { status: 400 });
    }

    // Claim the row before calling the model, so a slow or failed run is visible
    // as a stuck `pending` instead of leaving no trace at all.
    const { error: claimError } = await ctx.supabaseAdmin.from("article_analysis").upsert({
      article_id: article.id,
      status: "pending",
      model: MODEL,
      analysis: null,
      raw_response: null,
      error: null,
      requested_at: new Date().toISOString(),
      completed_at: null,
    });
    if (claimError) {
      return Response.json({ error: claimError.message }, { status: 500 });
    }

    // The model call takes minutes; the caller (pg_net) gives up after ~5 seconds.
    // So answer immediately and let the analysis finish in the background.
    EdgeRuntime.waitUntil(analyse(ctx.supabaseAdmin, article));

    return Response.json({ article_id: article.id, status: "pending" }, { status: 202 });
  }),
};

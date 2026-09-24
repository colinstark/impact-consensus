import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

// Chrome-ish, because a default Deno agent gets blocked by a lot of news sites.
const USER_AGENT =
  "Mozilla/5.0 (compatible; impact-consensus/1.0; +https://impact-consensus.netlify.app)";
const FETCH_TIMEOUT_MS = 15_000;
const MIN_BODY_CHARS = 200;

// Whole elements that never carry article text.
const STRIP = "script, style, noscript, iframe, nav, aside, footer, form, button";
// Readability scores some sibling boilerplate as content, so drop the usual suspects first.
const JUNK = /cookie|consent|banner|newsletter|subscribe|promo|advert|social|share|related|comment/i;

function extract(html) {
  const { document } = parseHTML(html);

  for (const el of document.querySelectorAll(STRIP)) el.remove();
  for (const el of document.querySelectorAll("[class], [id]")) {
    if (JUNK.test(`${el.className ?? ""} ${el.id ?? ""}`)) el.remove();
  }

  const ogTitle = document
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content")
    ?.trim();

  // Collected before Readability runs, because Readability rewrites the document.
  const links = [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));

  const parsed = new Readability(document).parse();
  const text = parsed?.textContent?.replace(/\n{3,}/g, "\n\n").trim() ?? "";

  return {
    title: ogTitle || parsed?.title?.trim() || null,
    // Too short means we got a paywall, a login wall, or a cookie interstitial.
    text: text.length >= MIN_BODY_CHARS ? text : null,
    links,
  };
}

async function fetchPage(url) {
  const { protocol } = new URL(url);
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error(`unsupported protocol ${protocol}`);
  }

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return extract(await res.text());
}

// Aggregators show a paywalled snippet but link out to the outlets that ran the story.
// Only these are followed: on an ordinary site, outbound links point at unrelated pages.
const AGGREGATORS = /(^|\.)ground\.news$/;
const NOT_AN_OUTLET =
  /ground\.news|reddit\.com|facebook\.com|twitter\.com|x\.com|instagram\.com|linkedin\.com|youtube\.com|tiktok\.com|apple\.com|google\.com|t\.me|whatsapp\.com/;
const MAX_ORIGINALS = 3;

function outletLinks(links, pageUrl) {
  const seen = new Set();
  const out = [];
  for (const href of links) {
    let url;
    try {
      url = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol) || NOT_AN_OUTLET.test(url.hostname)) continue;
    // Outlet homepages are not the story.
    if (url.pathname === "/" || url.pathname === "") continue;
    url.hash = "";
    if (!seen.has(url.href)) {
      seen.add(url.href);
      out.push(url.href);
    }
  }
  return out;
}

// Reads the article. An aggregator page is only ever a paywalled snippet, so it is
// followed through to the original, keeping whichever text is longer. Returns which
// URL the text came from.
async function read(url) {
  const page = await fetchPage(url);
  if (!AGGREGATORS.test(new URL(url).hostname)) {
    return { title: page.title, text: page.text, textUrl: page.text ? url : null };
  }

  for (const original of outletLinks(page.links, url).slice(0, MAX_ORIGINALS)) {
    try {
      const found = await fetchPage(original);
      if (found.text && found.text.length > (page.text?.length ?? 0)) {
        return { title: page.title, text: found.text, textUrl: original };
      }
    } catch (err) {
      console.log(`article-scraper: original ${original} unusable (${err.message})`);
    }
  }
  // Every original was blocked or thinner: fall back to the aggregator's own snippet.
  return { title: page.title, text: page.text, textUrl: page.text ? url : null };
}

// An update that matches no rows comes back as success with an empty list, so ask for
// the row back: without this a write blocked by RLS would look like it had worked.
async function write(db, id, fields) {
  const { data, error } = await db
    .from("articles")
    .update({ ...fields, scraped_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");

  if (error) throw error;
  if (!data.length) throw new Error(`update of article ${id} matched no rows`);
}

async function scrape(db, article) {
  try {
    const { title, text, textUrl } = await read(article.url);

    // scraped_at is set either way so a page we cannot read is not retried forever.
    // Leaving clean_text null also keeps the analyzer from running on junk. A title
    // already set (e.g. by the Ground News loader) is kept rather than replaced.
    await write(db, article.id, {
      title: article.title ?? title,
      clean_text: text,
      clean_text_url: textUrl,
    });

    const from = textUrl && textUrl !== article.url ? ` via ${new URL(textUrl).hostname}` : "";
    console.log(`article-scraper: ${article.id} ${text ? `${text.length} chars${from}` : "no usable body"}`);
  } catch (err) {
    console.error(`article-scraper: ${article.id} failed`, err);
    try {
      await write(db, article.id, {});
    } catch (markErr) {
      console.error(`article-scraper: ${article.id} could not be marked scraped`, markErr);
    }
  }
}

// Two callers: a trigger on insert sends one article_id, the hourly pg_cron sweep sends
// an empty body and picks up anything the insert-time call missed.
export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req, ctx) => {
    const body = await req.json().catch(() => ({}));

    let articles;
    if (body.article_id) {
      const { data, error } = await ctx.supabaseAdmin
        .from("articles")
        .select("id, url, title")
        .eq("id", body.article_id)
        .single();
      if (error) return Response.json({ error: error.message }, { status: 404 });
      articles = [data];
    } else {
      const { data, error } = await ctx.supabaseAdmin
        .from("articles")
        .select("id, url, title")
        .is("scraped_at", null)
        .lt("created_at", new Date(Date.now() - 5 * 60_000).toISOString())
        .order("created_at")
        .limit(20);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      articles = data;
    }

    // Fetching takes longer than the caller (pg_net) will wait, so answer straight away.
    EdgeRuntime.waitUntil(
      Promise.all(articles.map((article) => scrape(ctx.supabaseAdmin, article))),
    );

    return Response.json({ scraping: articles.length }, { status: 202 });
  }),
};

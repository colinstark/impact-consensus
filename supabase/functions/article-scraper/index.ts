import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

// Invoked hourly by pg_cron (see supabase/migrations/*_article_scraper_cron.sql).
export default {
  fetch: withSupabase({ auth: ["secret"] }, async (_req, ctx) => {
    const { data: pending, error } = await ctx.supabaseAdmin
      .from("articles")
      .select("id, url")
      .is("scraped_at", null)
      .order("created_at")
      .limit(20);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // TODO: fetch clean text per article (TinyFish) and set title, clean_text, scraped_at.
    console.log(`article-scraper: ${pending.length} pending`);

    return Response.json({ pending: pending.length });
  }),
};

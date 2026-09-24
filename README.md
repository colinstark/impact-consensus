# impact-consensus

Svelte (Vite, JS) frontend on Netlify, Supabase for database, realtime, edge functions, and cron.

## Layout

- `src/lib/supabase.js`: browser client
- `supabase/migrations/`: schema (`articles`, `votes`, `article_context`, `article_analysis`), RLS, realtime, cron
- `supabase/functions/article-scraper/`: edge function, invoked on submit and hourly by `pg_cron`
- `supabase/functions/article-analyzer/`: edge function, invoked by a trigger whenever an article gains body text

## Frontend

```sh
cp .env.example .env   # fill in project URL + publishable key
npm install
npm run dev
```

On Netlify, set the same two `VITE_*` env vars; build settings come from `netlify.toml`.

## Supabase (hosted, no Docker)

```sh
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase functions deploy article-scraper
npx supabase functions deploy article-analyzer
```

### Cron secrets (once per project)

The cron job reads the function URL and key from Vault. Run in the SQL editor:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('sb_secret_...', 'secret_key');
```

### Anthropic API key (once per project)

The analyzer calls Claude. Set the key as a function secret:

```sh
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Check runs with `select * from cron.job_run_details order by start_time desc;`
and responses with `select * from net._http_response order by created desc;`.

### First run

Push migrations, deploy both functions, set the key, then add one link in the app and
check the halves in order — the scrape before the analysis:

```sql
select id, title, scraped_at, clean_text is not null as has_text from articles
order by created_at desc limit 1;

select article_id, status, error, statement from article_analysis
order by requested_at desc limit 1;
```

`scraped_at` set with `has_text` false on a page you know is readable means the scrape
failed; the function logs say why (`npx supabase functions logs article-scraper`).

## Article analysis

Submitting a link (or the Ground News loader inserting one) runs the whole pipeline:

1. Inserting the article fires a trigger that calls `article-scraper`.
2. The scraper fetches the page and pulls the readable body out with Readability. For
   aggregator pages (Ground News), which only show a paywalled snippet, it follows the
   links to the outlets that ran the story and keeps whichever text is longer. It writes
   `clean_text`, `clean_text_url` (where that text actually came from), `scraped_at`, and
   `title` if none was set.
3. Writing `clean_text` fires a second trigger that calls `article-analyzer`.
4. The analyzer sends the text to Claude Opus 5 (`low` effort) with the system prompt in
   `supabase/functions/article-analyzer/prompt.ts`. The full JSON goes to
   `article_analysis`; `statement` and `description` are copied onto `articles`.

Every article with readable text gets both fields:

- `description` — two or three plain sentences on what the story is about.
- `statement` — one neutral sentence a reader can agree or disagree with. Its kind is
  recorded in `article_analysis.analysis -> 'statement' ->> 'kind'`:
  - `decision` — the article reports a decision or proposal, restated neutrally.
  - `claim` — no decision (an accident, a profile, a sports record), so the article's
    central claim is restated and attributed: "According to El País, …".

A malformed JSON reply gets one retry before the article is marked `error`.

The hourly cron stays as the retry path. Pages that cannot be read (paywalls, anti-bot
blocks such as El Periódico's HTTP 406) get `scraped_at` set with `clean_text` null, so they
are not retried forever and never analyzed:

```sql
select id, url from articles where scraped_at is not null and clean_text is null;
```

Both functions answer `202` immediately and work in the background via
`EdgeRuntime.waitUntil()`, because `net.http_post` gives up after ~5 seconds.
**`article_analysis.status` is the signal to watch, not `net._http_response`.**

```sql
select a.id, x.status, x.error, a.statement, a.description
from articles a left join article_analysis x on x.article_id = a.id
order by x.requested_at desc nulls last;
```

To re-run one article by hand:

```sh
curl -X POST https://<project-ref>.supabase.co/functions/v1/article-analyzer \
  -H "Content-Type: application/json" -H "apikey: sk_secret_..." \
  -d '{"article_id": 1}'
```

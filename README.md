# impact-consensus

> **Live site:** Netlify now builds the React front end in [`frontend-react/`](frontend-react/) (see `netlify.toml`). The Svelte app at the root is kept for reference but not deployed.

Svelte (Vite, JS) frontend on Netlify, Supabase for database, realtime, edge functions, and cron.

## Layout

- `src/lib/supabase.js`: browser client
- `supabase/migrations/`: schema (`articles`, `votes`, `article_context`), RLS, realtime, cron
- `supabase/functions/article-scraper/`: edge function, invoked hourly by `pg_cron`

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
```

### Cron secrets (once per project)

The cron job reads the function URL and key from Vault. Run in the SQL editor:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('sb_secret_...', 'secret_key');
```

Check runs with `select * from cron.job_run_details order by start_time desc;`
and responses with `select * from net._http_response order by created desc;`.

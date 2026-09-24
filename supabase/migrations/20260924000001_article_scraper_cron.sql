-- Invokes the article-scraper edge function hourly.
-- Requires two Vault secrets per environment (see README): project_url, secret_key.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'article-scraper',
  '0 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/article-scraper',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'secret_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

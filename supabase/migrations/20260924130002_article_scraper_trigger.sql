-- Scrapes a newly submitted article straight away instead of waiting for the hourly
-- cron sweep, which stays in place as the retry path for anything this call misses.
-- Reuses the same two Vault secrets as the cron (see README): project_url, secret_key.

-- security definer: the trigger runs as the submitting user, who cannot read the Vault.
create or replace function request_article_scrape()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url');
  api_key text := (select decrypted_secret from vault.decrypted_secrets where name = 'secret_key');
begin
  -- This runs inside the user's own write. Missing secrets must not make that write
  -- fail, so skip the call and leave a warning in the Postgres logs instead.
  if base_url is null or api_key is null then
    raise warning 'article-scraper: vault secrets project_url/secret_key missing, skipping article %', new.id;
    return null;
  end if;

  perform net.http_post(
    url := base_url || '/functions/v1/article-scraper',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', api_key),
    body := jsonb_build_object('article_id', new.id)
  );
  return null;
end;
$$;

create trigger scrape_new_article
after insert on articles
for each row
execute function request_article_scrape();

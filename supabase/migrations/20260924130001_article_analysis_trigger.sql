-- Calls the article-analyzer edge function whenever an article gains new body text.
-- Reuses the same two Vault secrets as the scraper cron (see README): project_url, secret_key.
create extension if not exists pg_net;

-- security definer: the trigger runs as whoever wrote the row, who cannot read the Vault.
create or replace function request_article_analysis()
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
    raise warning 'article-analyzer: vault secrets project_url/secret_key missing, skipping article %', new.id;
    return null;
  end if;

  perform net.http_post(
    url := base_url || '/functions/v1/article-analyzer',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', api_key),
    body := jsonb_build_object('article_id', new.id)
  );
  return null;
end;
$$;

-- Two triggers rather than one: OLD does not exist on insert, so the "changed"
-- comparison can only be written in the update trigger.
create trigger analyze_new_article
after insert on articles
for each row
when (new.clean_text is not null)
execute function request_article_analysis();

create trigger analyze_updated_article
after update on articles
for each row
when (new.clean_text is not null and new.clean_text is distinct from old.clean_text)
execute function request_article_analysis();

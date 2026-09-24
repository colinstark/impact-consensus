-- The full neutral analysis per article, produced by the article-analyzer edge function.
-- The two reader-facing fields, statement and description, are copied onto articles.
create type analysis_status as enum ('pending', 'ok', 'error');

create table article_analysis (
  article_id bigint primary key references articles on delete cascade,
  status analysis_status not null default 'pending',
  analysis jsonb,
  -- Kept only when the model's reply would not parse as JSON, so it can be inspected.
  raw_response text,
  model text,
  error text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index on article_analysis (status) where status <> 'ok';

alter table article_analysis enable row level security;

-- Readable by everyone; only the edge function (service role, which bypasses RLS)
-- ever writes, so there are deliberately no insert/update/delete policies.
create policy "analysis is public" on article_analysis for select using (true);

alter publication supabase_realtime add table article_analysis;

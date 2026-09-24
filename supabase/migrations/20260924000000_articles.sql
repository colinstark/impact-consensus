create type vote_stance as enum ('agree', 'disagree');

create table articles (
  id bigint generated always as identity primary key,
  url text not null unique,
  title text,
  clean_text text,
  scraped_at timestamptz,
  submitted_by uuid references auth.users on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table votes (
  article_id bigint not null references articles on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  stance vote_stance not null,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

-- Supplemental context on an article: a comment, a link, or both.
create table article_context (
  id bigint generated always as identity primary key,
  article_id bigint not null references articles on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  body text,
  url text,
  created_at timestamptz not null default now(),
  check (body is not null or url is not null)
);

create index on article_context (article_id);
create index on articles (created_at) where scraped_at is null;

alter table articles enable row level security;
alter table votes enable row level security;
alter table article_context enable row level security;

create policy "articles are public" on articles for select using (true);
create policy "signed-in users submit articles" on articles for insert to authenticated
  with check (submitted_by = (select auth.uid()));

create policy "votes are public" on votes for select using (true);
create policy "users cast own vote" on votes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users change own vote" on votes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users retract own vote" on votes for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "context is public" on article_context for select using (true);
create policy "users add context" on article_context for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users delete own context" on article_context for delete to authenticated
  using (user_id = (select auth.uid()));

alter publication supabase_realtime add table articles, votes, article_context;

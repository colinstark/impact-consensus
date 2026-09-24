-- Enums for Ground News coverage metadata
create type public.coverage_type as enum ('simple', 'blindspot');
create type public.political_lean as enum ('left', 'center', 'right');

-- Articles gain provenance + story-level metadata
alter table public.articles
  add column source text not null default 'user'
    check (source in ('user', 'ground_news')),
  add column published_at timestamptz,
  add column location text;

comment on column public.articles.source is 'Where the row came from: user submission or the Ground News scraper.';
comment on column public.articles.published_at is 'First publication time of the story (UTC).';
comment on column public.articles.location is 'Place tag, when more specific than the scraped interest itself.';

create index articles_published_at_idx on public.articles (published_at desc nulls last);
create index articles_source_idx on public.articles (source);

-- Political bias coverage for a story (1:1 with articles)
create table public.article_coverage (
  article_id          bigint primary key references public.articles(id) on delete cascade,
  coverage_type       public.coverage_type,
  left_pct            smallint check (left_pct between 0 and 100),
  center_pct          smallint check (center_pct between 0 and 100),
  right_pct           smallint check (right_pct between 0 and 100),
  left_sources        smallint check (left_sources >= 0),
  center_sources      smallint check (center_sources >= 0),
  right_sources       smallint check (right_sources >= 0),
  rated_sources       smallint not null default 0 check (rated_sources >= 0),
  total_sources       smallint not null default 0 check (total_sources >= 0),
  blindspot_for       public.political_lean,
  coverage_statement  text,
  updated_at          timestamptz not null default now(),
  constraint article_coverage_pct_sum check (
    (left_pct is null and center_pct is null and right_pct is null)
    or (left_pct + center_pct + right_pct = 100)
  ),
  constraint article_coverage_rated_lte_total check (rated_sources <= total_sources),
  constraint article_coverage_blindspot_typed check (
    (blindspot_for is null) or (coverage_type = 'blindspot')
  )
);

comment on table public.article_coverage is 'Ground News political-bias coverage breakdown for a story. Percentages are null when Ground News has no bias data (typically rated_sources = 0).';
comment on column public.article_coverage.rated_sources is 'Outlets with a bias rating - the denominator behind the percentages.';
comment on column public.article_coverage.total_sources is 'All outlets covering the story.';

create index article_coverage_blindspot_idx on public.article_coverage (blindspot_for)
  where blindspot_for is not null;

-- Topic tags
create table public.topics (
  id   bigint generated always as identity primary key,
  name text not null unique
);

create table public.article_topics (
  article_id bigint not null references public.articles(id) on delete cascade,
  topic_id   bigint not null references public.topics(id) on delete cascade,
  primary key (article_id, topic_id)
);

create index article_topics_topic_id_idx on public.article_topics (topic_id);

-- RLS: scraped data is world-readable, written only by the loader (service role)
alter table public.article_coverage enable row level security;
alter table public.topics           enable row level security;
alter table public.article_topics   enable row level security;

create policy "coverage is public" on public.article_coverage for select to public using (true);
create policy "topics are public"  on public.topics           for select to public using (true);
create policy "article topics are public" on public.article_topics for select to public using (true);
;

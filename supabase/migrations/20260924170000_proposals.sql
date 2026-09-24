-- Community proposals: residents suggest a question, and 100 upvotes within 48 hours turns it
-- into a topic. Each upvote comes with the voter's yes/no answer, which becomes their vote
-- on the topic once it's accepted.

create table proposals (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  question text not null check (length(question) between 1 and 300),
  context text check (length(context) <= 1000),
  area text not null,
  created_by uuid references auth.users on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours',
  -- The topic it became. Set by accept_proposal(), never by users.
  article_id bigint references articles on delete set null
);

create table proposal_upvotes (
  proposal_id uuid not null references proposals on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  answer vote_stance not null,
  created_at timestamptz not null default now(),
  primary key (proposal_id, user_id)
);

create index on proposals (city, created_at);

alter table proposals enable row level security;
alter table proposal_upvotes enable row level security;

-- Guests (anonymous sign-ins) can propose and upvote, the same as they can vote.
create policy "proposals are public" on proposals for select using (true);
create policy "users propose" on proposals for insert to authenticated
  with check (created_by = (select auth.uid()) and article_id is null);

create policy "upvotes are public" on proposal_upvotes for select using (true);
create policy "users upvote open proposals" on proposal_upvotes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from proposals p where p.id = proposal_id and p.article_id is null and p.expires_at > now())
  );

-- A proposal with its live count, tally and status, which is what the app reads.
create view proposal_tallies with (security_invoker = true) as
select p.*,
       count(u.user_id)::int as upvotes,
       (count(u.user_id) filter (where u.answer = 'agree'))::int as yes,
       (count(u.user_id) filter (where u.answer = 'disagree'))::int as no,
       case when p.article_id is not null then 'accepted'
            when p.expires_at <= now() then 'expired'
            else 'open' end as status
from proposals p
left join proposal_upvotes u on u.proposal_id = p.id
group by p.id;

-- The 100th upvote promotes the proposal to an article, and every upvote's answer becomes a
-- vote on it. The url is a placeholder (articles need a unique one); scraping skips it below.
create or replace function accept_proposal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.proposals;
  new_id bigint;
begin
  -- Lock the row so two simultaneous 100th upvotes can't both promote it.
  select * into p from public.proposals where id = new.proposal_id for update;
  if p.article_id is not null
     or (select count(*) from public.proposal_upvotes where proposal_id = p.id) < 100 then
    return null;
  end if;

  insert into public.articles (url, title, statement, description, location, submitted_by, scraped_at)
  values ('placa:proposal/' || p.id, p.question, p.question, p.context, p.area, p.created_by, now())
  returning id into new_id;

  insert into public.votes (article_id, user_id, stance, created_at)
  select new_id, user_id, answer, created_at from public.proposal_upvotes where proposal_id = p.id;

  update public.proposals set article_id = new_id where id = p.id;
  return null;
end;
$$;

create trigger accept_proposal
after insert on proposal_upvotes
for each row
execute function accept_proposal();

-- Proposal articles have no page to scrape.
drop trigger scrape_new_article on articles;
create trigger scrape_new_article
after insert on articles
for each row
when (new.url not like 'placa:%')
execute function request_article_scrape();

alter publication supabase_realtime add table proposals, proposal_upvotes;

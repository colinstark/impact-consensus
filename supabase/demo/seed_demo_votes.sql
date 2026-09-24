-- Demo data: 400 fake guest voters and their votes on every analysed article.
-- Every fake voter is tagged {"demo": true}, so remove_demo_votes.sql deletes them
-- (and, through the foreign key, all their votes) in one go.

begin;

insert into auth.users (id, instance_id, aud, role, is_anonymous, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', true,
       '{"demo": true}'::jsonb, '{}'::jsonb, now() - interval '30 days', now()
from generate_series(1, 400);

with demo_users as (
  -- Each fake voter lives in a random Barcelona barrio.
  select u.id,
         (select b.id from barrios b where b.municipality = 'Barcelona' order by random(), u.id limit 1) as barrio
  from auth.users u
  where u.raw_app_meta_data ->> 'demo' = 'true'
),
topics as (
  -- Each article gets its own popularity (8 to ~118 votes) and its own lean.
  select id, (8 + floor(power(random(), 2) * 110))::int as n, 0.15 + random() * 0.7 as lean
  from articles
  where statement is not null
),
picks as (
  select t.id as article_id, t.lean, t.n, u.id as user_id, u.barrio,
         row_number() over (partition by t.id order by random()) as rn
  from topics t cross join demo_users u
)
insert into votes (article_id, user_id, stance, barrio_id, created_at)
select article_id, user_id,
       (case when random() < lean then 'agree' else 'disagree' end)::vote_stance,
       barrio,
       -- More votes in recent days than a month ago, so the timeline climbs.
       now() - (power(random(), 1.8) * interval '30 days')
from picks
where rn <= n;

commit;

select (select count(*) from auth.users where raw_app_meta_data ->> 'demo' = 'true') as demo_voters,
       (select count(*) from votes v join auth.users u on u.id = v.user_id
         where u.raw_app_meta_data ->> 'demo' = 'true') as demo_votes,
       (select count(*) from votes) as all_votes;

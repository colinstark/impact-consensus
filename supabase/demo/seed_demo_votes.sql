-- Demo data: 400 fake guest voters and their votes on every analysed article.
-- Every fake voter is tagged {"demo": true}, so remove_demo_votes.sql deletes them
-- (and, through the foreign key, all their votes) in one go.
-- Needs the age_bracket and gender columns (migration 20260924160000_vote_demographics).

begin;

insert into auth.users (id, instance_id, aud, role, is_anonymous, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', true,
       '{"demo": true}'::jsonb, '{}'::jsonb, now() - interval '30 days', now()
from generate_series(1, 400);

with demo_users as (
  -- Each fake voter has a Barcelona barrio, an age group and a gender, fixed across all their votes.
  select u.id,
         (select b.id from barrios b where b.municipality = 'Barcelona' order by random(), u.id limit 1) as barrio,
         (array['18-24','25-34','25-34','35-44','35-44','45-54','45-54','55-64','65+','65+','u18','na'])[1 + floor(random() * 12)::int] as age_bracket,
         (array['female','female','male','male','nb'])[1 + floor(random() * 4.2)::int] as gender
  from auth.users u
  where u.raw_app_meta_data ->> 'demo' = 'true'
),
topics as (
  -- Each article gets its own popularity (8 to ~118 votes), its own overall lean, and its own
  -- differences by age and gender, so the insights charts show real splits.
  select id,
         (8 + floor(power(random(), 2) * 110))::int as n,
         0.15 + random() * 0.7 as lean,
         (random() - 0.5) * 0.5 as age_slope,
         (random() - 0.5) * 0.3 as gender_gap
  from articles
  where statement is not null
),
picks as (
  select t.id as article_id, t.n, u.id as user_id, u.barrio, u.age_bracket, u.gender,
         -- Younger voters pull one way, older the other; the gap between women and men varies by topic.
         least(0.95, greatest(0.05,
           t.lean
           + t.age_slope * (case u.age_bracket when 'u18' then -1 when '18-24' then -0.67 when '25-34' then -0.33
                                               when '35-44' then 0 when '45-54' then 0.33 when '55-64' then 0.67
                                               when '65+' then 1 else 0 end)
           + t.gender_gap * (case u.gender when 'female' then 1 when 'male' then -1 else 0 end)
         )) as p_yes,
         row_number() over (partition by t.id order by random()) as rn
  from topics t cross join demo_users u
)
insert into votes (article_id, user_id, stance, barrio_id, age_bracket, gender, created_at)
select article_id, user_id,
       (case when random() < p_yes then 'agree' else 'disagree' end)::vote_stance,
       barrio, age_bracket, gender,
       -- More votes in recent days than a month ago, so the timeline climbs.
       now() - (power(random(), 1.8) * interval '30 days')
from picks
where rn <= n;

commit;

select (select count(*) from auth.users where raw_app_meta_data ->> 'demo' = 'true') as demo_voters,
       (select count(*) from votes v join auth.users u on u.id = v.user_id
         where u.raw_app_meta_data ->> 'demo' = 'true') as demo_votes,
       (select count(*) from votes) as all_votes;

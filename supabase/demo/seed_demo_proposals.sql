-- Demo data: four community proposals, upvoted by the fake guests from seed_demo_votes.sql
-- (run that first). Rerunnable: it replaces the previous copies, so the 48-hour clocks restart.
-- Bicing sits at 99 upvotes, so one scan of its QR code on stage promotes it to a topic.
-- remove_demo_votes.sql deletes the fake guests and, through the foreign key, their upvotes.

begin;

delete from proposals where question in (
  'Should Bicing run 24 hours a day?',
  'Should Rambla de Catalunya be fully pedestrianised?',
  'Should local shops be allowed to open on Sundays in every district?',
  'Should the Port Olímpic get a public sea-water pool?'
);

with seed (question, context, area, hours_ago, yes, no) as (
  values
    ('Should Bicing run 24 hours a day?',
     'Bicing currently has reduced service overnight. Night-shift workers say they have no good way home.',
     'Barcelona', 30, 71, 28),
    ('Should Rambla de Catalunya be fully pedestrianised?', null, 'Eixample', 12, 40, 24),
    ('Should local shops be allowed to open on Sundays in every district?', null, 'Barcelona', 4, 9, 14),
    ('Should the Port Olímpic get a public sea-water pool?', null, 'Sant Martí', 60, 30, 8)
),
created as (
  insert into proposals (city, question, context, area, created_by, created_at, expires_at)
  select 'barcelona', question, context, area, null,
         now() - hours_ago * interval '1 hour', now() - hours_ago * interval '1 hour' + interval '48 hours'
  from seed
  returning id, question
),
guests as (
  select id, row_number() over (order by random()) as n
  from auth.users where raw_app_meta_data ->> 'demo' = 'true'
)
insert into proposal_upvotes (proposal_id, user_id, answer, created_at)
select c.id, g.id, case when g.n <= s.yes then 'agree' else 'disagree' end::vote_stance, now()
from created c
join seed s using (question)
join guests g on g.n <= s.yes + s.no;

commit;

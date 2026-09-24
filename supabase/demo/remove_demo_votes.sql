-- Removes everything seed_demo_votes.sql added: the fake voters and, with them, their votes.
-- Real voters and their votes are untouched.

delete from auth.users where raw_app_meta_data ->> 'demo' = 'true';

select count(*) as votes_left from votes;

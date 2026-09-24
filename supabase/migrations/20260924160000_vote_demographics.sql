-- Who the voter was when they voted, for the age and gender breakdowns on the insights page.
-- Like barrio_id, it's a snapshot on the vote rather than a lookup on the profile.
-- Values match the front end's AgeBracket and Gender types.
alter table votes
  add column age_bracket text check (age_bracket in ('u18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'na')),
  add column gender text check (gender in ('female', 'male', 'nb'));

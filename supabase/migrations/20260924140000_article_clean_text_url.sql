-- Where clean_text was actually read from. Differs from url when the scraper follows an
-- aggregator page (Ground News) through to the outlet that published the story.
alter table articles add column clean_text_url text;

comment on column articles.clean_text_url is 'URL the clean_text was extracted from; null means url itself.';

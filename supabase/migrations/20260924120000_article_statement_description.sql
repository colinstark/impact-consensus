-- Filled in by an edge function after scraping.
alter table articles
  add column statement text,
  add column description text;

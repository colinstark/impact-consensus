# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Barcelona residents. They open it, mostly on a phone, to see how a news story lands in their own barrio and to say where they stand with one quick vote per story.

## Product Purpose

Impact Consensus shows where Barcelona agrees and where it splits on the news that affects it. Each story is reduced to a single statement. Residents vote agree or disagree, and the result reads neighbourhood by neighbourhood instead of as one citywide number. It is working when a resident can tell at a glance whether their barrio sees a story the way the rest of the city does.

## Positioning

A hyperlocal consensus map. Agreement is broken down by barrio (the 73 official Barcelona barrios, grouped by district), so the product shows where the city actually splits. A comment section or a generic poll site only gives one aggregate number.

## Operating Context

- Stories come from two sources: an hourly Ground News scraper (Supabase edge function plus `pg_cron`) and user submissions by URL.
- Each story carries a scraper-written `statement` (the claim people vote on) and a `description`.
- Ground News coverage metadata (left/center/right source counts, rated vs. total outlets, coverage statement, topics, location) is stored with each story.
- Votes, articles, and context update live through Supabase realtime.

## Capabilities and Constraints

- Voting is binary: `agree` / `disagree`. There is one vote per user per story, and it can be changed or retracted.
- Guests can vote anonymously. Claiming a nickname, choosing a barrio (optional), and adding context all require an account.
- Sign-in is by magic link (email, no password).
- Context is a comment, a link, or both, attached to a story.
- Routes currently in use: the card feed and the article detail page (the statement is the headline).
- **Multilingual:** Catalan, Spanish, and English are all in scope. The current copy is English only, and i18n is not built yet.
- **Mobile-first:** phones are the primary device and desktop is secondary.
- Stack: Svelte 5 (Vite, JS), Supabase, Netlify.
- Undecided: how the per-barrio breakdown is presented. The data model supports it, but no surface shows it yet.

## Brand Commitments

- Name: **Impact Consensus**.
- **Non-partisan:** the product must never look like it takes a side. Left/center/right coverage cues and agree/disagree cues stay neutral and must not read as a political signal.

## Evidence on Hand

- Barrio and district reference data: `supabase/migrations/20260924110000_profiles.sql`.
- Live story and coverage data comes from the Ground News scraper.
- There are no user research findings, testimonials, usage numbers, or press yet. Do not invent any.

## Product Principles

1. **The barrio is the unit.** Frame each result around the barrio before the city, because the barrio split is the insight.
2. **One claim, one tap.** A story is reduced to a single statement you can vote on, and voting should take about a second on a phone.
3. **Neutral by construction.** Nothing in language, ordering, or emphasis should suggest which side is right.
4. **Local in its own languages.** Catalan and Spanish get the same treatment as English, not an afterthought translation.

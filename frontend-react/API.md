# Plaça API contract

The front end talks to the backend through the `Api` interface in `src/api/types.ts`.
With no `VITE_API_URL` set it uses an in-browser mock (`src/api/mock.ts`); set it to switch to HTTP:

```sh
VITE_API_URL=https://api.example.com npm run dev
```

All bodies are JSON. Types (`Topic`, `Tally`, `Choice`, `TrendPoint`) are defined in `src/api/types.ts`.

| Method | Path | Body / query | Returns |
|---|---|---|---|
| GET | `/topics` | `?city=barcelona` | `Topic[]`, ordered by activity (most-voted first) |
| GET | `/topics/:slug` | — | `Topic` or **404** |
| PUT | `/topics/:id/votes` | `{ choice: "yes" \| "no", deviceId, source?, districtId? }` | `Tally` (updated counts) |
| GET | `/devices/:deviceId/votes` | — | `{ [topicId]: Choice }` |
| PATCH | `/devices/:deviceId` | `{ districtId }` | **204**; tags this device's past and future votes |
| GET | `/topics/:id/insights` | — | `Insights`: cumulative daily tallies overall and by district, age and gender |
| PUT | `/profile` | `UserProfile` + `deviceId` | **204** |
| DELETE | `/profile` | `{ deviceId, email }` | **204**; GDPR erasure |
| GET | `/proposals` | `?city=barcelona` | `Proposal[]` (open first, then accepted, then expired) |
| GET | `/proposals/:id` | | `Proposal` or 404 |
| POST | `/proposals` | `{ city, question, context?, area, answer, deviceId }` | `Proposal` |
| PUT | `/proposals/:id/upvotes` | `{ answer: "yes" \| "no", deviceId }` | `Proposal` (updated) |
| GET | `/devices/:deviceId/upvotes` | — | `{ [proposalId]: Choice }` |
| POST | `/auth/magic-link` | `{ email }` | **204** |

## Notes

- **One vote per device per topic.** `PUT` replaces any earlier vote from the same `deviceId`
  (so people can change their mind, or go from "skip" to yes/no). `deviceId` is a random UUID stored
  in the browser, so no account is needed to vote.
- **`source`** is the `?src=` value from the entry URL (e.g. `qr-rambla-01`), so you can see which
  posters bring people in. It's kept for the whole browser session.
- **`headlineYesShare`** (optional, 0–1) is what media coverage implies the "yes" share is. It's shown
  as a marker on the results bar next to the real result.
- **Cities:** only `barcelona` is live. The city picker lists others as "coming soon" (`src/data/cities.ts`).
- **Districts:** ids are the Ajuntament's two-digit codes (`01` Ciutat Vella … `10` Sant Martí). Names match
  `barrios.district` in Supabase. The postcode → district lookup runs on the device (`src/data/districts.ts`);
  only the `districtId` is sent, never the postcode.
- **Sources** (`Topic.sources`) power "I don't know — tell me more". Each is `{ outlet, title, url, publishedAt? }`,
  which maps directly onto the `articles` table. The mock uses `kind: "search"` links to each outlet's coverage
  until real articles are served. Leave `kind` out for real articles.
- **Proposals:** one upvote per device, and every upvote carries a yes/no answer. When `upvotes` reaches 100 before
  `expiresAt` (created + 48 h), set `status: "accepted"`, create a topic, carry the upvote answers over as its
  votes, and return its `topicSlug`. After 48 h without 100 upvotes the status becomes `expired`.
- **Sponsored questions:** a topic with `sponsor: { name, url?, about? }` is a paid question from a local business.
  The front end handles placement: never in the first three, at most one per later batch of three (last slot),
  always labelled, and never required to unlock more topics (`src/lib/feed.ts`). Sponsors should only ever get
  the same public results as everyone else. With Supabase, the demo sponsored questions still come from the mock
  until there's a `sponsor` column or table.
- **Insights** (`/t/:slug/insights`, sign-up required): every array in `Insights` lines up with `dates`, one entry
  per day from the question's first vote to today, and holds running totals. This lets the page scrub and play
  through time. The UI hides any group with fewer than 5 votes; the backend should apply the same rule before
  returning data.
- **Sign-up profile:** name, email, postcode (→ `districtId`), `ageBracket`, `gender` (`female` | `male` | `nb` =
  non-binary / prefer not to say), `shareWithThirdParties` (opt-in, default **false**), `acceptedTermsAt`,
  `consentVersion`. For the Supabase version this needs columns on `profiles` (or a new table). Until then, the
  profile is kept in the browser, and real topics show district and time views but no age/gender.
  **Never** export individual rows for users with `shareWithThirdParties = false`; only aggregates.
- **Localised fields** (`question`, `context`, `category`) are `{ en, es, ca }` objects.
- **Trend** `yesShare` = yes / (yes + no) cumulative up to that day; `votes` = cumulative yes + no.
- **Magic link:** the email should link to the front end with a token. The front end currently keeps
  `{ email }` in localStorage after sign-in (see `src/lib/auth.tsx`). Swap in a real session/token check
  when the endpoint exists.

# Plaça API contract

The front end talks to the backend through the `Api` interface in `src/api/types.ts`.
With no `VITE_API_URL` set it uses an in-browser mock (`src/api/mock.ts`); set it to switch to HTTP:

```sh
VITE_API_URL=https://api.example.com npm run dev
```

All bodies are JSON. Types (`Topic`, `Tally`, `Choice`, `TrendPoint`) are defined in `src/api/types.ts`.

| Method | Path | Body / query | Returns |
|---|---|---|---|
| GET | `/topics` | — | `Topic[]`, ordered by activity (most-voted first) |
| GET | `/topics/:slug` | — | `Topic` or **404** |
| PUT | `/topics/:id/votes` | `{ choice: "yes" \| "no" \| "skip", deviceId, source? }` | `Tally` (updated counts) |
| GET | `/devices/:deviceId/votes` | — | `{ [topicId]: Choice }` |
| GET | `/topics/:id/trend` | `?range=1m\|3m\|all` | `TrendPoint[]` (daily, oldest first) |
| POST | `/auth/magic-link` | `{ email }` | **204** |

## Notes

- **One vote per device per topic.** `PUT` replaces any earlier vote from the same `deviceId`
  (so people can change their mind, or go from "skip" to yes/no). `deviceId` is a random UUID stored
  in the browser, so no account is needed to vote.
- **`skip`** means "don't mind, just show me the results". It counts toward `tally.skip` but is left out
  of the yes/no percentages.
- **`source`** is the `?src=` value from the entry URL (e.g. `qr-rambla-01`), so you can see which
  posters bring people in. It's kept for the whole browser session.
- **`headlineYesShare`** (optional, 0–1) is what media coverage implies the "yes" share is. It's shown
  as a marker on the results bar next to the real result.
- **Localised fields** (`question`, `context`, `category`) are `{ en, es, ca }` objects.
- **Trend** `yesShare` = yes / (yes + no) cumulative up to that day; `votes` = cumulative yes + no.
- **Magic link:** the email should link to the front end with a token. The front end currently keeps
  `{ email }` in localStorage after sign-in (see `src/lib/auth.tsx`). Swap in a real session/token check
  when the endpoint exists.

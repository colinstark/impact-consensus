# Plaça — front end

Mobile-first web app for voting on local Barcelona issues and seeing where the community really stands.

```sh
npm install
npm run dev        # http://localhost:5173 (also exposed on your LAN, so you can test on a phone)
npm run build
```

Runs on an in-browser mock by default. See [API.md](API.md) to connect the real backend.

## Routes

| Path | What |
|---|---|
| `/city` | First-visit city picker (Barcelona only for now) |
| `/` | Top 3 trending topics. Results stay hidden until you vote; answering all 3 unlocks the next 3. Community proposals below. |
| `/t/:slug` | One topic. **QR codes should point here**, e.g. `/t/tourists-go-home?src=qr-rambla-01`. Skips the city picker. |
| `/t/:slug/insights` | Sign-up required. Timeline slider with play, overall donut, results by barrio (map), age or gender, and the opinion-over-time line chart |
| `/proposals` | Community-proposed questions: 100 upvotes in 48 h adds one to the main list |
| `/proposals/new` | Propose a question |
| `/signin` | Sign up (name, email, postcode, age, gender, consent) or sign in by email link |
| `/privacy`, `/terms` | Draft GDPR privacy policy and terms (need legal review) |
| `/about` | About, plus "Your data": sharing opt-in toggle, download, delete account |

Voting is Yes / No. "I don't know — tell me more" opens the news coverage behind the topic and leaves Yes/No available.

## Structure

- `src/api/` — types (the contract), mock, HTTP client, seed topics
- `src/lib/` — i18n (ca / es / en), device id, auth, vote store
- `src/components/` — `VotePanel`, `ResultBar`, `TrendChart`, `TopicCard`, `TopBar`, …
- `src/data/` — cities, districts, postcode lookup, generated map shapes (`scripts/build-districts.py`)
- `src/pages/` — one file per route

Design: iOS-style system font, grouped backgrounds, frosted top bar and spring animations, with separate
light and dark themes. Yes/No colours (blue/orange) pass colour-blind and contrast checks in both modes.

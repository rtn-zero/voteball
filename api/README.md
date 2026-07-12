# Voteball API

Backend for **Voteball** — the crowdsourced World Cup match-prediction app. Ingests votes,
aggregates them into a live crowd prediction per match, and serves it back to the frontend.

- **Stack:** Node.js + Express + Mongoose, MongoDB Atlas (M0).
- **Frontend:** static site on Cloudflare Pages (`voteball.pages.dev`) — this API is a separate service.

## Run locally

```bash
npm install
cp .env.example .env        # then paste your Atlas URI into .env
npm run seed                # loads baseline votes for each match
npm run dev                 # starts on http://localhost:3000 (auto-reload)
```

```bash
npm test                    # unit tests for the aggregation logic (no DB needed)
```

## API

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET  | `/api/health` | — | `{ "ok": true }` |
| GET  | `/api/matches` | — | `{ matches: [...], next_match_id }` |
| GET  | `/api/matches/:match_id` | — | one match, or `404` |
| POST | `/api/votes` | `{ match_id, win_rate }` | `{ match_id, prediction, vote_count }`, or `400`/`404` |

`prediction` is the crowd-mean win % for the **LEFT** team in `match_id` (`"<LEFT>_<RIGHT>"`);
the right team's implied chance is `100 - prediction`. `next_match_id` is an engagement nudge
(fewest votes, tie-broken by "most contested").

Edit fixtures in [`src/data/matches.js`](src/data/matches.js), then re-run `npm run seed`.

## Smoke test (curl)

```bash
curl -s $BASE/api/health
curl -s $BASE/api/matches | jq
curl -s -X POST $BASE/api/votes \
  -H 'Content-Type: application/json' \
  -d '{"match_id":"ARG_FRA","win_rate":70}' | jq
```

## Deploy (Render + Atlas)

See the hosting walkthrough handed off with this repo. In short: Atlas M0 cluster → Network Access
`0.0.0.0/0` → copy connection string → Render Web Service from this repo (`npm install` build,
`npm start` start) → set `MONGODB_URI` + `CORS_ORIGIN` env vars → run the seed once → point the
frontend at the live URL.

> **Render free tier cold start:** the service sleeps after ~15 min idle and takes ~30–50s to wake.
> Hit `/api/health` right before demoing.

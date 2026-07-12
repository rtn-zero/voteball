# Voteball API

Backend for **Voteball** — the crowdsourced World Cup match-prediction app. It ingests votes,
aggregates them into a live crowd prediction per match, and serves it back to the frontend.
It is the **single source of truth** for both the fixtures and the predictions.

- **Stack:** Node.js + Express + Mongoose, MongoDB Atlas (M0).
- **Frontend:** static site on Cloudflare Pages (`voteball.pages.dev`), same repo, served separately.
- **Deploy:** Render Web Service with **Root Directory = `api`**. See [HOSTING.md](HOSTING.md).

## Outcome model — 3-way vs 2-way

Each fixture in [`src/data/matches.js`](src/data/matches.js) has a `stage`:

| stage | outcomes | why |
|-------|----------|-----|
| `group` | `home` / `draw` / `away` | group games can end level |
| `knockout` | `home` / `away` | knockouts are settled by extra time / penalties — no draw |

The stage drives everything: the valid vote choices, the prediction keys, and whether the
frontend shows the Draw button.

## Run locally

```bash
npm install
cp .env.example .env        # paste your Atlas URI (or a local mongodb:// URI)
npm run seed                # seed baseline votes for each match
npm run dev                 # http://localhost:3000 (auto-reload)
npm test                    # aggregation unit tests (no DB needed)
```

## API

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET  | `/api/health` | — | `{ "ok": true }` |
| GET  | `/api/matches` | — | `{ matches: [...], next_match_id }` |
| GET  | `/api/matches/:match_id` | — | one match, or `404` |
| POST | `/api/votes` | `{ match_id, choice }` | `{ match_id, prediction, vote_count }`, or `400`/`404` |

A match object:

```json
{
  "match_id": "ARG_SUI",
  "stage": "group",
  "outcomes": ["home", "draw", "away"],
  "home": { "code": "ARG", "name": "Argentina", "flag": "arg.svg" },
  "away": { "code": "SUI", "name": "Switzerland", "flag": "sui.svg" },
  "prediction": { "home": 61, "draw": 24, "away": 15 },
  "vote_count": 20
}
```

`prediction` is keyed by the match's outcomes and always sums to 100. `choice` on `POST /api/votes`
must be valid for the match's stage — posting `"draw"` to a knockout fixture returns `400`.
`next_match_id` is an engagement nudge (fewest votes, tie-broken by "most contested").

## How it works with MongoDB

One collection: **`votes`**. Every vote is one document — the DB stores *raw votes*, never
pre-computed percentages, so the crowd prediction is always derived fresh and can't drift.

```
{ match_id: "ARG_SUI", choice: "home", created_at: 2026-07-12T... }
```

- **Fixtures are NOT in Mongo.** Teams/flags/stages live in `src/data/matches.js` (hardcoded,
  they don't change during a match). Mongo only holds votes. This keeps the DB tiny and the
  fixtures editable without a migration.
- **Seeding** (`npm run seed`) wipes `votes` and inserts `SEED_WEIGHT` (default 20) baseline
  votes per match, split by the public baseline percentages. This gives each prediction inertia
  so the first real vote doesn't swing a match to 100%.
- **Reading** (`GET /api/matches`): fetch all vote docs, group by `match_id` in memory, and run
  the pure `predict()` function (largest-remainder rounding → integer % summing to 100).
- **Writing** (`POST /api/votes`): validate the choice for the match's stage, `insert` one vote
  document, then re-aggregate that match and return the updated split.
- **Indexing:** `match_id` is indexed so per-match reads stay fast as votes accumulate.
- **Concurrency:** votes are append-only inserts (no read-modify-write on a shared counter), so
  simultaneous voters can't clobber each other — the aggregate is recomputed from the source rows.

For a hackathon this is deliberately simple: at low volume, reading all votes and grouping in JS
is fine. If it ever gets big, swap the `Vote.find()` in `routes/matches.js` for a Mongo
`$group` aggregation — the `predict()` contract stays the same.

## Smoke test (curl)

```bash
BASE=http://localhost:3000
curl -s $BASE/api/health
curl -s $BASE/api/matches | python3 -m json.tool
# group match: home/draw/away is valid
curl -s -X POST $BASE/api/votes -H 'Content-Type: application/json' -d '{"match_id":"ARG_SUI","choice":"draw"}'
# knockout match: draw is rejected (400)
curl -s -X POST $BASE/api/votes -H 'Content-Type: application/json' -d '{"match_id":"FRA_MAR","choice":"draw"}'
```

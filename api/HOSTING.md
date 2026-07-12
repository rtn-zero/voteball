# Voteball API — hosting walkthrough (Atlas + Render)

Do these in order. Total time ~20 min.

## 0. Where the code lives

The backend lives in the team repo `rtn-zero/voteball` under the **`api/`** subfolder (monorepo
alongside the static frontend). Once the PR is merged, Render deploys from that repo with the
**Root Directory set to `api`** (see step 2). The Cloudflare Pages frontend build is unaffected —
it serves the static root and ignores `api/`.

## 1. MongoDB Atlas — free cluster + connection string

1. Sign in at <https://cloud.mongodb.com> → **Build a Database** → **M0 (Free)** → pick a nearby region → Create.
2. **Database Access** → Add New Database User → username + password (autogenerate & save it). Role: *Read and write to any database*.
3. **Network Access** → Add IP Address → **Allow Access from Anywhere (`0.0.0.0/0`)**. Render's outbound IPs are dynamic, so this is required for a hackathon; tighten later if you care.
4. **Database → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>`, and insert the DB name **`voteball`** before the `?`:
   ```
   mongodb+srv://<user>:PASS@cluster0.xxxxx.mongodb.net/voteball?retryWrites=true&w=majority
   ```

## 2. Deploy to Render

1. <https://dashboard.render.com> → **New → Web Service** → connect the `rtn-zero/voteball` GitHub repo.
2. Settings:
   - **Root Directory:** `api`   ← important, the backend is in a subfolder
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Create the service (first deploy will fail health until env vars are set — that's fine).

## 3. Set environment variables (Render → your service → Environment)

| Key | Value |
|-----|-------|
| `MONGODB_URI` | the string from step 1.4 |
| `CORS_ORIGIN` | `https://voteball.pages.dev` |

(`PORT` is injected by Render automatically — don't set it.) Save → Render redeploys.

## 4. Seed the database (once)

Easiest: run it locally against Atlas (the same URI works from anywhere):

```bash
# in voteball-api/, with MONGODB_URI in your local .env
npm run seed
```

Or use Render's **Shell** tab: `npm run seed`.

## 5. Point the frontend at the live API

In `voteball/script.js`, set the production branch of `API_BASE` to your real Render URL
(shown at the top of the Render service page, e.g. `https://voteball-api.onrender.com`), then
commit/push — Cloudflare Pages redeploys the frontend automatically.

## 6. Smoke test with curl

```bash
BASE=https://voteball-api.onrender.com

curl -s $BASE/api/health                       # {"ok":true}
curl -s $BASE/api/matches | jq                 # matches + next_match_id

# a good vote -> returns updated prediction
curl -s -X POST $BASE/api/votes \
  -H 'Content-Type: application/json' \
  -d '{"match_id":"ARG_FRA","win_rate":70}' | jq

# validation: bad win_rate -> 400
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/api/votes \
  -H 'Content-Type: application/json' -d '{"match_id":"ARG_FRA","win_rate":150}'

# validation: unknown match -> 404
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/api/votes \
  -H 'Content-Type: application/json' -d '{"match_id":"XXX_YYY","win_rate":50}'
```

## ⚠️ Demo-day gotcha: cold starts

Render's free tier sleeps after ~15 min idle; the first request then takes **30–50s**. Right before
demoing, hit `curl $BASE/api/health` (or just load the site) to wake it. If you want it always-warm,
set an UptimeRobot monitor pinging `/api/health` every 10 min.

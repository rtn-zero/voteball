# Voteball API — hosting walkthrough (Atlas + Render)

Do these in order. Total time ~20 min.

## 0. Where the code lives

The backend is in the team repo `rtn-zero/voteball` under the **`api/`** subfolder (monorepo
alongside the static frontend). Render deploys from that repo with the **Root Directory set to
`api`** (step 2). The Cloudflare Pages frontend build is unaffected — it serves the static root
and ignores `api/`.

## 1. MongoDB Atlas — free cluster + connection string

1. Sign in at <https://cloud.mongodb.com> → **Build a Database** → **M0 (Free)** → nearby region → Create.
2. **Database Access** → Add New Database User → username + password (save it). Role: *Read and write to any database*.
3. **Network Access** → Add IP Address → **Allow Access from Anywhere (`0.0.0.0/0`)**. Render's outbound IPs are dynamic, so this is required for a hackathon.
4. **Database → Connect → Drivers** → copy the string and insert the db name **`voteball`**:
   ```
   mongodb+srv://<user>:<PASS>@cluster0.xxxxx.mongodb.net/voteball?retryWrites=true&w=majority
   ```

## 2. Deploy to Render

1. <https://dashboard.render.com> → **New → Web Service** → connect the `rtn-zero/voteball` repo.
2. Settings:
   - **Root Directory:** `api`   ← important, the backend is in a subfolder
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Create the service (first deploy fails health until env vars are set — that's fine).

## 3. Environment variables (Render → service → Environment)

| Key | Value |
|-----|-------|
| `MONGODB_URI` | the string from step 1.4 |
| `CORS_ORIGIN` | `https://voteball.pages.dev` |

(`PORT` is injected by Render — don't set it.) Save → Render redeploys.

## 4. Seed the database (once)

Run locally against Atlas (the URI works from anywhere), or use Render's **Shell** tab:

```bash
npm run seed
```

## 5. Point the frontend at the live API

In `script.js`, set the production branch of `API_BASE` to your Render URL
(e.g. `https://voteball-api.onrender.com`), commit & push — Cloudflare Pages redeploys automatically.

## 6. Smoke test with curl

```bash
BASE=https://<your-service>.onrender.com

curl -s $BASE/api/health                       # {"ok":true}
curl -s $BASE/api/matches                       # matches + next_match_id

# group match -> home/draw/away allowed
curl -s -X POST $BASE/api/votes -H 'Content-Type: application/json' \
  -d '{"match_id":"ARG_SUI","choice":"home"}'

# knockout match -> draw rejected (400)
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/api/votes \
  -H 'Content-Type: application/json' -d '{"match_id":"FRA_MAR","choice":"draw"}'

# unknown match -> 404
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/api/votes \
  -H 'Content-Type: application/json' -d '{"match_id":"XXX_YYY","choice":"home"}'
```

## ⚠️ Demo-day gotcha: cold starts

Render's free tier sleeps after ~15 min idle; the first request then takes **30–50s**. Hit
`curl $BASE/api/health` right before demoing, or set an UptimeRobot monitor pinging `/api/health`
every 10 min.

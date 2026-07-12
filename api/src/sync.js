import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import { Match } from "./models/Match.js";
import { Vote } from "./models/Vote.js";
import { outcomesFor } from "./data/matches.js";

// Pulls upcoming fixtures from football-data.org into the `matches` collection.
// Designed to run on a schedule (see .github/workflows/sync-fixtures.yml).
//
// Env:
//   FOOTBALL_DATA_TOKEN  (required) — free API key from football-data.org
//   FOOTBALL_DATA_COMP   (optional) — competition code, default "WC" (FIFA World Cup)
//   MONGODB_URI          (required)

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const COMP = process.env.FOOTBALL_DATA_COMP || "WC";
const SEED_WEIGHT = 20; // baseline votes for brand-new matches (gives predictions inertia)

const mapStage = (s) => (s === "GROUP_STAGE" ? "group" : "knockout");
const baselineFor = (stage) =>
  stage === "group" ? { home: 34, draw: 33, away: 33 } : { home: 50, away: 50 };

async function sync() {
  if (!TOKEN) throw new Error("FOOTBALL_DATA_TOKEN is not set");
  await connectDB(process.env.MONGODB_URI);

  const res = await fetch(`https://api.football-data.org/v4/competitions/${COMP}/matches`, {
    headers: { "X-Auth-Token": TOKEN },
  });
  if (!res.ok) throw new Error(`football-data.org responded ${res.status}`);
  const { matches = [] } = await res.json();

  // Only games still to be played, with both teams decided — skip games already
  // finished and undecided "TBD" knockout slots. Keeps the app to the live slate.
  const seen = new Set();
  const fixtures = [];
  for (const m of matches) {
    const h = m.homeTeam || {};
    const a = m.awayTeam || {};
    if (m.status === "FINISHED" || !h.tla || !a.tla) continue;
    const match_id = `${h.tla}_${a.tla}`;
    if (seen.has(match_id)) continue;
    seen.add(match_id);
    const stage = mapStage(m.stage);
    fixtures.push({
      match_id,
      stage,
      home: { code: h.tla, name: h.name, flag: `${h.tla.toLowerCase()}.svg` },
      away: { code: a.tla, name: a.name, flag: `${a.tla.toLowerCase()}.svg` },
      baseline: baselineFor(stage),
      utcDate: m.utcDate,
    });
  }

  // Refresh the fixture metadata (safe — no votes stored here).
  await Match.deleteMany({});
  if (fixtures.length) await Match.insertMany(fixtures);

  // Give ONLY brand-new matches baseline inertia — never touch existing votes,
  // so the schedule can run repeatedly without wiping the real crowd.
  let seededVotes = 0;
  for (const f of fixtures) {
    if ((await Vote.countDocuments({ match_id: f.match_id })) > 0) continue;
    const docs = [];
    for (const outcome of outcomesFor(f)) {
      const n = Math.round(((f.baseline[outcome] || 0) * SEED_WEIGHT) / 100);
      for (let i = 0; i < n; i++) docs.push({ match_id: f.match_id, choice: outcome });
    }
    if (docs.length) {
      await Vote.insertMany(docs);
      seededVotes += docs.length;
    }
  }

  console.log(
    `Synced ${fixtures.length} ${COMP} fixtures; seeded ${seededVotes} baseline votes for new matches.`
  );
  for (const f of fixtures) console.log(`  ${f.match_id} (${f.stage})`);
  await mongoose.disconnect();
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});

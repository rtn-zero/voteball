import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import { Vote } from "./models/Vote.js";
import { getFixtures } from "./data/fixtures.js";
import { outcomesFor } from "./data/matches.js";

// How many baseline votes each match starts with (spread across outcomes by baseline %).
const SEED_WEIGHT = 20;

// Manual reset: WIPES all votes and re-seeds baselines for the active fixtures
// (synced matches if present, else the hardcoded fallback). Use for a clean slate.
// NOTE: the sync job seeds new matches WITHOUT wiping — use that in production.
async function seed() {
  await connectDB(process.env.MONGODB_URI);
  const fixtures = await getFixtures();
  await Vote.deleteMany({});

  const docs = [];
  for (const m of fixtures) {
    for (const outcome of outcomesFor(m)) {
      const pct = (m.baseline && m.baseline[outcome]) || 0;
      const count = Math.round((pct * SEED_WEIGHT) / 100);
      for (let i = 0; i < count; i++) docs.push({ match_id: m.match_id, choice: outcome });
    }
  }
  if (docs.length) await Vote.insertMany(docs);

  console.log(`Seeded ${docs.length} baseline votes across ${fixtures.length} fixtures:`);
  for (const m of fixtures) console.log(`  ${m.match_id} (${m.stage})`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

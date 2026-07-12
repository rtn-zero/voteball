import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import { Vote } from "./models/Vote.js";
import { MATCHES, outcomesFor } from "./data/matches.js";

// How many baseline votes each match starts with (spread across outcomes by baseline %).
// Smaller = each new vote moves the needle more (good for demos); larger = more stable.
const SEED_WEIGHT = 20;

// Wipes the votes collection and seeds each match's baseline as real vote documents,
// so predictions have sensible inertia (one vote doesn't swing a match to 100%).
async function seed() {
  await connectDB(process.env.MONGODB_URI);
  await Vote.deleteMany({});

  const docs = [];
  for (const m of MATCHES) {
    for (const outcome of outcomesFor(m)) {
      const pct = m.baseline[outcome] || 0;
      const count = Math.round((pct * SEED_WEIGHT) / 100);
      for (let i = 0; i < count; i++) docs.push({ match_id: m.match_id, choice: outcome });
    }
  }
  await Vote.insertMany(docs);

  console.log(`Seeded ${docs.length} baseline votes across ${MATCHES.length} matches:`);
  for (const m of MATCHES) {
    console.log(`  ${m.match_id} (${m.stage}) -> ${JSON.stringify(m.baseline)}`);
  }
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import { Vote } from "./models/Vote.js";
import { MATCHES } from "./data/matches.js";

// Wipes the votes collection and inserts one baseline vote per match.
// Re-runnable: `npm run seed`.
async function seed() {
  await connectDB(process.env.MONGODB_URI);
  await Vote.deleteMany({});
  const docs = MATCHES.map((m) => ({ match_id: m.match_id, win_rate: m.baseline }));
  await Vote.insertMany(docs);
  console.log(`Seeded ${docs.length} baseline votes:`);
  for (const d of docs) console.log(`  ${d.match_id} -> ${d.win_rate}%`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

import mongoose from "mongoose";

// A fixture synced from an external source (football-data.org). Metadata only —
// no votes live here. Refreshed by `npm run sync`; falls back to the hardcoded
// list in data/matches.js when the collection is empty.
const teamSchema = new mongoose.Schema(
  { code: String, name: String, flag: String },
  { _id: false }
);

const matchSchema = new mongoose.Schema({
  match_id: { type: String, required: true, unique: true, index: true },
  stage: { type: String, required: true }, // "group" | "knockout"
  home: teamSchema,
  away: teamSchema,
  baseline: { type: Object, default: {} },
  utcDate: String,
  source: { type: String, default: "football-data.org" },
});

export const Match = mongoose.model("Match", matchSchema);

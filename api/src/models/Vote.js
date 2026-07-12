import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  match_id: { type: String, required: true, index: true },
  choice: { type: String, required: true, enum: ["home", "draw", "away"] },
  created_at: { type: Date, default: Date.now },
});

export const Vote = mongoose.model("Vote", voteSchema);

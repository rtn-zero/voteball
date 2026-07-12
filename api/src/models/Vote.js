import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  match_id: { type: String, required: true, index: true },
  win_rate: { type: Number, required: true, min: 0, max: 100 },
  created_at: { type: Date, default: Date.now },
});

export const Vote = mongoose.model("Vote", voteSchema);

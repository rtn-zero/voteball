import { Router } from "express";
import { Vote } from "../models/Vote.js";
import { MATCHES, MATCHES_BY_ID } from "../data/matches.js";
import { predict, pickNextMatch } from "../lib/aggregate.js";

const router = Router();

// Build the public shape of a match from its (hardcoded) metadata + its votes.
function toDTO(match, votes) {
  const { prediction, vote_count } = predict(votes);
  return {
    match_id: match.match_id,
    left: match.left,
    right: match.right,
    prediction: prediction ?? match.baseline, // fall back to baseline if somehow no votes
    vote_count,
  };
}

// GET /api/matches — all matches + the "vote on this next" nudge.
router.get("/", async (_req, res, next) => {
  try {
    const votes = await Vote.find().lean();
    const byMatch = new Map(MATCHES.map((m) => [m.match_id, []]));
    for (const v of votes) {
      if (byMatch.has(v.match_id)) byMatch.get(v.match_id).push(v);
    }
    const matches = MATCHES.map((m) => toDTO(m, byMatch.get(m.match_id)));
    res.json({ matches, next_match_id: pickNextMatch(matches) });
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:match_id — one match.
router.get("/:match_id", async (req, res, next) => {
  try {
    const match = MATCHES_BY_ID.get(req.params.match_id);
    if (!match) return res.status(404).json({ error: "Unknown match_id" });
    const votes = await Vote.find({ match_id: match.match_id }).lean();
    res.json(toDTO(match, votes));
  } catch (err) {
    next(err);
  }
});

export default router;

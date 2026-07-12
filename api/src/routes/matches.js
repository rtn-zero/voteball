import { Router } from "express";
import { Vote } from "../models/Vote.js";
import { getFixtures, getMatchById } from "../data/fixtures.js";
import { outcomesFor } from "../data/matches.js";
import { predict, pickNextMatch } from "../lib/aggregate.js";

const router = Router();

// Public shape of a match: team metadata + allowed outcomes + live crowd prediction.
function toDTO(match, votes) {
  const outcomes = outcomesFor(match);
  const { prediction, vote_count } = predict(votes, outcomes);
  const shown = vote_count === 0 ? match.baseline : prediction;
  return {
    match_id: match.match_id,
    stage: match.stage,
    outcomes,
    home: match.home,
    away: match.away,
    prediction: shown,
    vote_count,
  };
}

// GET /api/matches — all active fixtures + the "vote on this next" nudge.
router.get("/", async (_req, res, next) => {
  try {
    const fixtures = await getFixtures();
    const votes = await Vote.find().lean();
    const byMatch = new Map(fixtures.map((m) => [m.match_id, []]));
    for (const v of votes) {
      if (byMatch.has(v.match_id)) byMatch.get(v.match_id).push(v);
    }
    const matches = fixtures.map((m) => toDTO(m, byMatch.get(m.match_id)));
    res.json({ matches, next_match_id: pickNextMatch(matches) });
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:match_id — one match.
router.get("/:match_id", async (req, res, next) => {
  try {
    const match = await getMatchById(req.params.match_id);
    if (!match) return res.status(404).json({ error: "Unknown match_id" });
    const votes = await Vote.find({ match_id: match.match_id }).lean();
    res.json(toDTO(match, votes));
  } catch (err) {
    next(err);
  }
});

export default router;

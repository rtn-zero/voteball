import { Router } from "express";
import { Vote } from "../models/Vote.js";
import { MATCHES_BY_ID, outcomesFor } from "../data/matches.js";
import { predict } from "../lib/aggregate.js";

const router = Router();

// POST /api/votes — cast a vote, get back the updated crowd prediction.
// Body: { match_id, choice }. `choice` must be valid FOR THIS MATCH'S STAGE
// (e.g. "draw" is rejected on a knockout fixture).
router.post("/", async (req, res, next) => {
  try {
    const { match_id, choice } = req.body ?? {};

    const match = MATCHES_BY_ID.get(match_id);
    if (!match) return res.status(404).json({ error: "Unknown match_id" });

    const outcomes = outcomesFor(match);
    if (!outcomes.includes(choice)) {
      return res.status(400).json({ error: `choice must be one of: ${outcomes.join(", ")}` });
    }

    await Vote.create({ match_id, choice });

    const votes = await Vote.find({ match_id }).lean();
    const { prediction, vote_count } = predict(votes, outcomes);
    res.status(201).json({ match_id, prediction, vote_count });
  } catch (err) {
    next(err);
  }
});

export default router;

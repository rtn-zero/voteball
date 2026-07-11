import { Router } from "express";
import { Vote } from "../models/Vote.js";
import { MATCHES_BY_ID } from "../data/matches.js";
import { predict } from "../lib/aggregate.js";

const router = Router();

// POST /api/votes — cast a vote, get back the updated crowd prediction.
router.post("/", async (req, res, next) => {
  try {
    const { match_id, win_rate } = req.body ?? {};

    if (!MATCHES_BY_ID.has(match_id)) {
      return res.status(404).json({ error: "Unknown match_id" });
    }
    if (!Number.isInteger(win_rate) || win_rate < 0 || win_rate > 100) {
      return res.status(400).json({ error: "win_rate must be an integer between 0 and 100" });
    }

    await Vote.create({ match_id, win_rate });

    const votes = await Vote.find({ match_id }).lean();
    const { prediction, vote_count } = predict(votes);
    res.status(201).json({ match_id, prediction, vote_count });
  } catch (err) {
    next(err);
  }
});

export default router;

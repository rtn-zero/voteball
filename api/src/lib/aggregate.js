// Pure aggregation functions — no DB, no framework. Unit-tested in test/aggregate.test.js.
// Swap the internals here later (recency-weighted / trimmed mean) without touching routes.

/**
 * Aggregate a match's votes into a live crowd prediction.
 * @param {Array<{win_rate: number}>} votes
 * @returns {{ prediction: number|null, vote_count: number }}
 *   prediction = rounded mean of the LEFT team's win %, or null when there are no votes.
 */
export function predict(votes) {
  const vote_count = votes.length;
  if (vote_count === 0) return { prediction: null, vote_count: 0 };
  const sum = votes.reduce((acc, v) => acc + v.win_rate, 0);
  return { prediction: Math.round(sum / vote_count), vote_count };
}

/**
 * Engagement nudge: which match should we steer the next voter toward?
 * Rule: fewest votes first; tie-break on "most contested" (prediction closest to 50).
 * @param {Array<{match_id: string, prediction: number|null, vote_count: number}>} matches
 * @returns {string|null} the winning match_id, or null when there are no matches.
 */
export function pickNextMatch(matches) {
  if (matches.length === 0) return null;
  const contested = (m) => Math.abs((m.prediction ?? 50) - 50);
  return matches
    .slice()
    .sort((a, b) => {
      if (a.vote_count !== b.vote_count) return a.vote_count - b.vote_count;
      return contested(a) - contested(b);
    })[0].match_id;
}

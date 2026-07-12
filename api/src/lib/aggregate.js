// Pure aggregation functions — no DB, no framework. Unit-tested in test/aggregate.test.js.
// Swap the internals here later (recency-weighted / trimmed) without touching routes.

// Turn raw outcome counts into integer percentages that ALWAYS sum to 100, using the
// largest-remainder method (so 1/3+1/3+1/3 -> 34/33/33, never 33/33/33 = 99).
function toPercentages(counts, outcomes) {
  const total = outcomes.reduce((acc, o) => acc + (counts[o] || 0), 0);
  if (total === 0) {
    return Object.fromEntries(outcomes.map((o) => [o, 0]));
  }
  const exact = outcomes.map((o) => ({ o, raw: ((counts[o] || 0) * 100) / total }));
  const floored = exact.map((e) => ({ ...e, base: Math.floor(e.raw), rem: e.raw - Math.floor(e.raw) }));
  let leftover = 100 - floored.reduce((acc, e) => acc + e.base, 0);
  // hand the leftover points to the largest remainders first
  floored
    .slice()
    .sort((a, b) => b.rem - a.rem)
    .forEach((e) => {
      if (leftover > 0) { e.base += 1; leftover -= 1; }
    });
  return Object.fromEntries(floored.map((e) => [e.o, e.base]));
}

/**
 * Aggregate a match's votes into a live crowd prediction.
 * @param {Array<{choice: string}>} votes
 * @param {string[]} outcomes  allowed outcomes for this match (from outcomesFor)
 * @returns {{ prediction: Object, vote_count: number }}
 *   prediction is keyed by outcome (e.g. {home,draw,away} or {home,away}) summing to 100.
 */
export function predict(votes, outcomes) {
  const counts = {};
  for (const v of votes) {
    if (outcomes.includes(v.choice)) counts[v.choice] = (counts[v.choice] || 0) + 1;
  }
  return { prediction: toPercentages(counts, outcomes), vote_count: votes.length };
}

/**
 * Engagement nudge: which match should we steer the next voter toward?
 * Rule: fewest votes first; tie-break on "most contested" (lowest leading outcome %).
 * @param {Array<{match_id: string, prediction: Object, vote_count: number}>} matches
 * @returns {string|null}
 */
export function pickNextMatch(matches) {
  if (matches.length === 0) return null;
  const leader = (m) => Math.max(0, ...Object.values(m.prediction || {}));
  return matches
    .slice()
    .sort((a, b) => {
      if (a.vote_count !== b.vote_count) return a.vote_count - b.vote_count;
      return leader(a) - leader(b);
    })[0].match_id;
}

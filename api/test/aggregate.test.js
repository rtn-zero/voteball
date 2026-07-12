import { test } from "node:test";
import assert from "node:assert/strict";
import { predict, pickNextMatch } from "../src/lib/aggregate.js";

const THREE = ["home", "draw", "away"];
const TWO = ["home", "away"];

test("predict: no votes -> all zero, count 0", () => {
  assert.deepEqual(predict([], THREE), { prediction: { home: 0, draw: 0, away: 0 }, vote_count: 0 });
});

test("predict: 3-way tally as percentages summing to 100", () => {
  const votes = [
    ...Array(6).fill({ choice: "home" }),
    ...Array(2).fill({ choice: "draw" }),
    ...Array(2).fill({ choice: "away" }),
  ];
  const { prediction, vote_count } = predict(votes, THREE);
  assert.equal(vote_count, 10);
  assert.deepEqual(prediction, { home: 60, draw: 20, away: 20 });
});

test("predict: percentages ALWAYS sum to 100 (largest remainder)", () => {
  // 1/1/1 would naively round to 33/33/33 = 99; largest-remainder fixes it to 34/33/33
  const votes = [{ choice: "home" }, { choice: "draw" }, { choice: "away" }];
  const { prediction } = predict(votes, THREE);
  assert.equal(prediction.home + prediction.draw + prediction.away, 100);
});

test("predict: 2-way (knockout) has no draw key", () => {
  const votes = [...Array(3).fill({ choice: "home" }), ...Array(1).fill({ choice: "away" })];
  const { prediction } = predict(votes, TWO);
  assert.deepEqual(prediction, { home: 75, away: 25 });
  assert.equal("draw" in prediction, false);
});

test("predict: votes for outcomes not in this match's set are ignored", () => {
  // a stray "draw" on a knockout match must not count
  const votes = [{ choice: "home" }, { choice: "draw" }, { choice: "away" }];
  const { prediction } = predict(votes, TWO);
  assert.equal(prediction.home + prediction.away, 100);
});

test("pickNextMatch: no matches -> null", () => {
  assert.equal(pickNextMatch([]), null);
});

test("pickNextMatch: fewest votes wins", () => {
  const matches = [
    { match_id: "A", prediction: { home: 50, away: 50 }, vote_count: 10 },
    { match_id: "B", prediction: { home: 50, away: 50 }, vote_count: 2 },
    { match_id: "C", prediction: { home: 50, away: 50 }, vote_count: 7 },
  ];
  assert.equal(pickNextMatch(matches), "B");
});

test("pickNextMatch: ties broken by most-contested (lowest leading %)", () => {
  const matches = [
    { match_id: "A", prediction: { home: 90, draw: 5, away: 5 }, vote_count: 5 }, // leader 90
    { match_id: "B", prediction: { home: 40, draw: 35, away: 25 }, vote_count: 5 }, // leader 40 <- most contested
    { match_id: "C", prediction: { home: 70, draw: 20, away: 10 }, vote_count: 5 }, // leader 70
  ];
  assert.equal(pickNextMatch(matches), "B");
});

test("pickNextMatch: does not mutate the input array", () => {
  const matches = [
    { match_id: "A", prediction: { home: 50, away: 50 }, vote_count: 10 },
    { match_id: "B", prediction: { home: 50, away: 50 }, vote_count: 2 },
  ];
  const snapshot = matches.map((m) => m.match_id);
  pickNextMatch(matches);
  assert.deepEqual(matches.map((m) => m.match_id), snapshot);
});

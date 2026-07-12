import { test } from "node:test";
import assert from "node:assert/strict";
import { predict, pickNextMatch } from "../src/lib/aggregate.js";

test("predict: no votes -> null prediction, zero count", () => {
  assert.deepEqual(predict([]), { prediction: null, vote_count: 0 });
});

test("predict: single vote returns that value", () => {
  assert.deepEqual(predict([{ win_rate: 65 }]), { prediction: 65, vote_count: 1 });
});

test("predict: mean is rounded to an integer", () => {
  // (65 + 80 + 50) / 3 = 65
  assert.deepEqual(predict([{ win_rate: 65 }, { win_rate: 80 }, { win_rate: 50 }]), {
    prediction: 65,
    vote_count: 3,
  });
  // (50 + 51) / 2 = 50.5 -> 51
  assert.equal(predict([{ win_rate: 50 }, { win_rate: 51 }]).prediction, 51);
});

test("pickNextMatch: no matches -> null", () => {
  assert.equal(pickNextMatch([]), null);
});

test("pickNextMatch: fewest votes wins", () => {
  const matches = [
    { match_id: "A", prediction: 50, vote_count: 10 },
    { match_id: "B", prediction: 50, vote_count: 2 },
    { match_id: "C", prediction: 50, vote_count: 7 },
  ];
  assert.equal(pickNextMatch(matches), "B");
});

test("pickNextMatch: ties broken by most-contested (closest to 50)", () => {
  const matches = [
    { match_id: "A", prediction: 90, vote_count: 5 }, // |90-50| = 40
    { match_id: "B", prediction: 55, vote_count: 5 }, // |55-50| = 5  <- most contested
    { match_id: "C", prediction: 20, vote_count: 5 }, // |20-50| = 30
  ];
  assert.equal(pickNextMatch(matches), "B");
});

test("pickNextMatch: does not mutate the input array", () => {
  const matches = [
    { match_id: "A", prediction: 50, vote_count: 10 },
    { match_id: "B", prediction: 50, vote_count: 2 },
  ];
  const snapshot = matches.map((m) => m.match_id);
  pickNextMatch(matches);
  assert.deepEqual(matches.map((m) => m.match_id), snapshot);
});

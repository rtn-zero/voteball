// Hardcoded fixtures — the single source of truth for teams AND the outcome set.
// THIS is the file to edit as the tournament progresses.
//
// `stage` decides how many outcomes a match has:
//   "group"    -> 3-way: home / draw / away   (group games can end level)
//   "knockout" -> 2-way: home / away          (knockouts are settled by ET/penalties)
//
// `baseline` = public pre-match percentages, seeded so predictions aren't empty on
// first load. Its keys MUST match the stage's outcomes and sum to 100:
//   group    -> { home, draw, away }
//   knockout -> { home, away }
//
// match_id is "<HOME>_<AWAY>" using FIFA 3-letter codes. `flag` is a file in
// /assets/flags/. NOTE: pairings/percentages are placeholders — swap for the real draw.

export const STAGE_OUTCOMES = {
  group: ["home", "draw", "away"],
  knockout: ["home", "away"],
};

export const MATCHES = [
  {
    match_id: "FRA_MAR",
    stage: "knockout",
    home: { code: "FRA", name: "France", flag: "fra.svg" },
    away: { code: "MAR", name: "Morocco", flag: "mar.svg" },
    baseline: { home: 80, away: 20 },
  },
  {
    match_id: "ESP_BEL",
    stage: "group",
    home: { code: "ESP", name: "Spain", flag: "esp.svg" },
    away: { code: "BEL", name: "Belgium", flag: "bel.svg" },
    baseline: { home: 58, draw: 25, away: 17 },
  },
  {
    match_id: "NOR_ENG",
    stage: "group",
    home: { code: "NOR", name: "Norway", flag: "nor.svg" },
    away: { code: "ENG", name: "England", flag: "eng.svg" },
    baseline: { home: 25, draw: 26, away: 49 },
  },
  {
    match_id: "ARG_SUI",
    stage: "group",
    home: { code: "ARG", name: "Argentina", flag: "arg.svg" },
    away: { code: "SUI", name: "Switzerland", flag: "sui.svg" },
    baseline: { home: 61, draw: 24, away: 15 },
  },
];

// The valid outcomes for a match, derived from its stage.
export function outcomesFor(match) {
  return STAGE_OUTCOMES[match.stage] || STAGE_OUTCOMES.group;
}

export const MATCHES_BY_ID = new Map(MATCHES.map((m) => [m.match_id, m]));

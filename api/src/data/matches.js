// Hardcoded fixtures — quarter-final stage. THIS is the file to edit as results come in.
// match_id is "<LEFT>_<RIGHT>" using FIFA 3-letter codes.
// baseline = a public pre-match win % for the LEFT team, seeded so cards aren't blank on first load.
//
// NOTE: these are placeholder pairings/percentages — swap for the real QF draw before the demo.
export const MATCHES = [
  { match_id: "ARG_FRA", left: { code: "ARG", name: "Argentina" },   right: { code: "FRA", name: "France" },      baseline: 52 },
  { match_id: "BRA_ENG", left: { code: "BRA", name: "Brazil" },      right: { code: "ENG", name: "England" },     baseline: 58 },
  { match_id: "ESP_NED", left: { code: "ESP", name: "Spain" },       right: { code: "NED", name: "Netherlands" }, baseline: 60 },
  { match_id: "GER_POR", left: { code: "GER", name: "Germany" },     right: { code: "POR", name: "Portugal" },    baseline: 55 },
];

// Fast lookup for validation / single-match routes.
export const MATCHES_BY_ID = new Map(MATCHES.map((m) => [m.match_id, m]));

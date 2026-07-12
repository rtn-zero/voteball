import { Match } from "../models/Match.js";
import { MATCHES } from "./matches.js";

// The active fixture set: synced matches from the DB if any exist, otherwise the
// hardcoded fallback in matches.js. This keeps the app working before the first
// sync (and if football-data.org is ever unreachable).
export async function getFixtures() {
  const docs = await Match.find().lean();
  return docs.length ? docs : MATCHES;
}

export async function getMatchById(id) {
  const doc = await Match.findOne({ match_id: id }).lean();
  if (doc) return doc;
  return MATCHES.find((m) => m.match_id === id) || null;
}

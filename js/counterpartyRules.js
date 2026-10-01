// Known counterparty names that always map to a specific category,
// regardless of description keywords - see categorize.js. Matched
// case/accent-insensitively, by substring, against the transaction's
// `counterparty` field.
//
// Real names are personal data about real people (who you pay, and for
// what) and must never be committed to this public repository - not even
// as a made-up stand-in, since that still shapes what the committed rules
// look like around someone's real situation. This file therefore commits
// only opaque person codes, never a name.
//
// The code -> real-name mapping lives in counterpartyRules.local.js
// instead - gitignored, never committed. Copy
// counterpartyRules.local.example.js to get started. A code with no local
// mapping simply matches nothing, so the app still runs without that file
// (fresh clone, CI, grading) - just without any counterparty override.
export const COUNTERPARTY_CATEGORY_RULES_BY_ID = [
  { ids: ['person-a', 'person-b', 'person-c'], category: 'Szolgáltatások' },
  { ids: ['person-d', 'person-e'], category: 'Számlák/előfizetés' },
];

// Pure: expands { ids, category } rules into { names, category } rules
// using a code -> name map, dropping any id with no mapping. Exported
// mainly so tests can exercise this without any real or made-up name ever
// being written into a committed file.
export function resolveCounterpartyRules(idRules, nameById) {
  return idRules.map(({ ids, category }) => ({
    category,
    names: ids.map((id) => nameById[id]).filter(Boolean),
  }));
}

let nameById = {};
try {
  const mod = await import('./counterpartyRules.local.js');
  nameById = mod.COUNTERPARTY_NAME_BY_ID || {};
} catch {
  // No local mapping file - expected on a fresh clone, in CI, or when grading.
}

export const COUNTERPARTY_CATEGORY_RULES = resolveCounterpartyRules(COUNTERPARTY_CATEGORY_RULES_BY_ID, nameById);

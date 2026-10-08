import { normalizeNameForGrouping } from './util.js';

// Some real people's names appear in more than one format across a bank's
// exports (e.g. with or without a middle name) in a way the general
// accent/case/word-order grouping (normalizeNameForGrouping) can't
// recognize as the same person on its own, since the two forms' word sets
// genuinely differ. This lets the user declare specific known aliases that
// should still group together.
//
// Real names (even the user's own, paired with which other spellings are
// "the same person") are personal data and must never be committed to
// this public repository - same reasoning as counterpartyRules.js and
// deviceOwners.js. This file ships only the matching mechanism; the real
// list lives in nameAliases.local.js (gitignored). Copy
// nameAliases.local.example.js to get started.
let rawAliasMap = {};
try {
  const mod = await import('./nameAliases.local.js');
  rawAliasMap = mod.NAME_ALIASES || {};
} catch {
  // No local file - expected on a fresh clone, in CI, or when grading.
}

// Returns the canonical display name for a raw label, if a configured
// alias matches it (accent/case/word-order-insensitively), else the label
// unchanged. `overrideAliases`, if given (raw alias text -> canonical
// name), is used instead of the real local mapping - lets tests exercise
// this without any real name, committed or not, ever appearing in a test
// file.
export function resolveNameAlias(label, overrideAliases = rawAliasMap) {
  const key = normalizeNameForGrouping(label);
  const match = Object.entries(overrideAliases).find(([alias]) => normalizeNameForGrouping(alias) === key);
  return match ? match[1] : label;
}

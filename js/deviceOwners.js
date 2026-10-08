import { normalizeText } from './util.js';

// A Revolut top-up's description names the funding device/card, not a
// person (e.g. "Apple Pay összegű feltöltés a(z) *0117 eszközödön") - see
// isCardTopUpMovement in categorize.js. This maps that device reference to
// a display name, so the joint-account income list can show whose card a
// top-up came from instead of just the device code.
//
// Whose card is whose is personal information (not just "a name" but "a
// name together with which of their devices this is") and must never be
// committed to this public repository - same reasoning as
// counterpartyRules.js. This file ships only the matching mechanism and an
// empty default. Your own real mapping goes in deviceOwners.local.js
// instead - gitignored, never committed. Copy
// deviceOwners.local.example.js to get started.
// Matched against normalizeText()-normalized text (accent-stripped), so
// the pattern itself must be accent-stripped too ("eszkozodon", not
// "eszközödön").
const DEVICE_REF_PATTERN = /\*(\d+)\s*eszkozodon/i;

export function extractDeviceRef(description) {
  const match = normalizeText(description).match(DEVICE_REF_PATTERN);
  return match ? `*${match[1]}` : null;
}

let ownerByDeviceRef = {};
try {
  const mod = await import('./deviceOwners.local.js');
  ownerByDeviceRef = mod.DEVICE_OWNER_BY_REF || {};
} catch {
  // No local mapping file - expected on a fresh clone, in CI, or when grading.
}

// Returns the display name for a transaction description's top-up device
// reference, or null if the description isn't a recognized top-up or its
// device has no known owner. `overrideMap`, if given, is used instead of
// the real local mapping - lets tests exercise this without any real name,
// committed or not, ever appearing in a test file.
export function deviceOwnerLabel(description, overrideMap = ownerByDeviceRef) {
  const ref = extractDeviceRef(description);
  if (!ref) return null;
  return overrideMap[ref] || null;
}

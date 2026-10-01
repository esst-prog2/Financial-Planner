// Known counterparty names that always map to a specific category,
// regardless of description keywords - grounded in the user's real
// ground-truth data, where keyword matching structurally cannot tell two
// same-shaped transactions apart (a name carries no merchant-type
// information). Matched case/accent-insensitively, by substring, against
// the transaction's `counterparty` field - see categorize.js.
//
// Real names are personal data about real people (who you pay, and for
// what) and must never be committed to this public repository. This file
// therefore ships only a documented, clearly fictional example pair, so
// the override mechanism is still exercised by the test suite with no
// real data involved.
//
// Your own real rules go in counterpartyRules.local.js instead - gitignored,
// never committed. Copy counterpartyRules.local.example.js to get started.
// When present, its rules are tried first, before the example pair below.
export const EXAMPLE_COUNTERPARTY_CATEGORY_RULES = [
  { names: ['teszt szolgáltató'], category: 'Szolgáltatások' },
  { names: ['teszt bérbeadó'], category: 'Számlák/előfizetés' },
];

let localRules = [];
try {
  const mod = await import('./counterpartyRules.local.js');
  localRules = mod.COUNTERPARTY_CATEGORY_RULES_LOCAL || [];
} catch {
  // No local file - expected on a fresh clone, in CI, or when grading.
}

export const COUNTERPARTY_CATEGORY_RULES = [...localRules, ...EXAMPLE_COUNTERPARTY_CATEGORY_RULES];

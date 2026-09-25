// Known counterparty names that always map to a specific category,
// regardless of description keywords - grounded in the user's real
// ground-truth data, where keyword matching structurally cannot tell two
// same-shaped transactions apart (a name carries no merchant-type
// information). Matched case/accent-insensitively, by substring, against
// the transaction's `counterparty` field - see categorize.js.
export const COUNTERPARTY_CATEGORY_RULES = [
  {
    names: ['redacted person a', 'redacted person b', 'redacted person c'],
    category: 'Szolgáltatások',
  },
  {
    names: ['redacted person d', 'redacted person e'],
    category: 'Számlák/előfizetés',
  },
];

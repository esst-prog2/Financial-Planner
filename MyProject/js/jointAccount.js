import { extractNamedTransferCounterparty, normalizeNameForGrouping } from './util.js';

// Contributions are specifically incoming ("tőle") - an outgoing ("neki")
// transfer from the joint account is spending, not a contribution, so this
// intentionally does not also match that direction.
export function extractContributorName(description) {
  return extractNamedTransferCounterparty(description, 'tőle');
}

export function isJointContribution(transaction) {
  return transaction.source === 'revolut-joint' && extractContributorName(transaction.description) !== null;
}

export function splitJointAmount(amount) {
  return amount / 2;
}

// Grouped by name regardless of accents, case, or word order (see
// normalizeNameForGrouping) - the same contributor's transfers shouldn't
// split into separate rows just because a name got formatted differently.
export function summarizeContributors(transactions) {
  const grouped = new Map(); // normalized key -> { label, total }
  for (const t of transactions) {
    const name = isJointContribution(t) ? extractContributorName(t.description) : null;
    if (!name) continue;
    const key = normalizeNameForGrouping(name);
    const existing = grouped.get(key);
    if (existing) existing.total += t.amount;
    else grouped.set(key, { label: name, total: t.amount });
  }
  const totals = new Map();
  for (const { label, total } of grouped.values()) totals.set(label, total);
  return totals;
}

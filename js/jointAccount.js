import { extractNamedTransferCounterparty, normalizeNameForGrouping, monthOf } from './util.js';

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

// Everything that put money into the joint account, not just transfers
// matching the "Átutalás tőle:" pattern - e.g. a card/Apple Pay top-up is
// real money arriving in the account too, even though it's excluded from
// the user's personal Bevétel elsewhere (see isCardTopUpMovement in
// categorize.js). Grouped by the already-extracted `counterparty` field
// (revolutCounterparty() in parseRevolut.js: the named sender when
// extractable, otherwise the raw description), normalized the same way as
// summarizeContributors so the same real source isn't split across rows.
// month: required - scopes to that month only, like the rest of the joint
// view's month-scoped pieces (the category pie). An earlier version of
// this list was all-time, like the old contributor list it replaced - that
// read as wrong once there was more than one month of data and multiple
// top-ups to reconcile against a single month's bank statement, so this
// list is month-scoped instead, unlike the still-all-time contributor
// totals summarizeContributors itself computes for the exclusion logic.
// Returns [label, total] pairs sorted largest first, like incomeBySource.
export function summarizeJointIncome(transactions, month) {
  const grouped = new Map(); // normalized key -> { label, total }
  for (const t of transactions) {
    if (t.amount <= 0) continue;
    if (monthOf(t.date) !== month) continue;
    const label = t.counterparty || t.description || '';
    const key = normalizeNameForGrouping(label);
    const existing = grouped.get(key);
    if (existing) existing.total += t.amount;
    else grouped.set(key, { label, total: t.amount });
  }
  return [...grouped.values()].map(({ label, total }) => [label, total]).sort(([, a], [, b]) => b - a);
}

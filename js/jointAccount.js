import { extractNamedTransferCounterparty, normalizeNameForGrouping, monthOf } from './util.js';
import { deviceOwnerLabel } from './deviceOwners.js';
import { resolveNameAlias } from './nameAliases.js';

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

// The label a joint-account income row (and its click-to-list) uses for a
// transaction: a known device owner first (see deviceOwners.js - a card
// top-up has no sender name in the bank data itself, just a device
// reference, but the user can map that device to a real name locally),
// then the already-extracted counterparty (the named sender, when the
// description is an "Átutalás tőle/neki:" transfer), then the raw
// description as a last resort - then a known name alias (see
// nameAliases.js), if the result matches one.
//
// `overrides.deviceOwners` / `overrides.nameAliases`, if given, replace the
// real local mappings for this call - lets tests exercise the full label
// resolution without depending on whatever (if anything) happens to be in
// this machine's gitignored local files.
export function jointIncomeLabel(transaction, overrides = {}) {
  const label = deviceOwnerLabel(transaction.description, overrides.deviceOwners) || transaction.counterparty || transaction.description || '';
  return resolveNameAlias(label, overrides.nameAliases);
}

// Everything that put money into the joint account, not just transfers
// matching the "Átutalás tőle:" pattern - e.g. a card/Apple Pay top-up is
// real money arriving in the account too, even though it's excluded from
// the user's personal Bevétel elsewhere (see isCardTopUpMovement in
// categorize.js). Grouped by jointIncomeLabel(), normalized the same way
// as summarizeContributors so the same real source isn't split across
// rows. month: required - scopes to that month only, like the rest of the
// joint view's month-scoped pieces (the category pie). An earlier version
// of this list was all-time, like the old contributor list it replaced -
// that read as wrong once there was more than one month of data and
// multiple top-ups to reconcile against a single month's bank statement,
// so this list is month-scoped instead, unlike the still-all-time
// contributor totals summarizeContributors itself computes for the
// exclusion logic.
// Returns [label, total] pairs sorted largest first, like incomeBySource.
// `overrides` is forwarded to jointIncomeLabel() - see there.
export function summarizeJointIncome(transactions, month, overrides = {}) {
  const grouped = new Map(); // normalized key -> { label, total }
  for (const t of transactions) {
    if (t.amount <= 0) continue;
    if (monthOf(t.date) !== month) continue;
    const label = jointIncomeLabel(t, overrides);
    const key = normalizeNameForGrouping(label);
    const existing = grouped.get(key);
    if (existing) existing.total += t.amount;
    else grouped.set(key, { label, total: t.amount });
  }
  return [...grouped.values()].map(({ label, total }) => [label, total]).sort(([, a], [, b]) => b - a);
}

import { monthOf } from './pipeline.js';
import { normalizeNameForGrouping } from './util.js';

// Pure aggregation logic for the dashboard - no DOM, no i18n, so it's
// independently unit-testable. Every category total here is a *signed*
// sum across a period's line items, with absolute value taken only where
// a caller needs a display-ready number - never per item before summing.
// That distinction matters once a positive (refund) amount can land in a
// spending category: summing per-item absolute values would double-count
// it as additional spending instead of netting it out.

// month: null/undefined means "all periods" (used by the joint pie, which
// has no month selector). jointOnly: true scopes to rev-joint transactions
// using their full (unhalved) amountHuf; false uses personalAmountHuf
// (already halved for joint lines) across every source.
export function categoryTotals(items, { month = null, jointOnly = false } = {}) {
  const totals = new Map();
  for (const item of items) {
    if (jointOnly && item.source !== 'revolut-joint') continue;
    if (item.category === 'Bevétel') continue;
    if (month && monthOf(item.date) !== month) continue;
    const amount = jointOnly ? item.amountHuf : item.personalAmountHuf;
    totals.set(item.category, (totals.get(item.category) || 0) + amount);
  }
  return totals;
}

// A category whose signed total is zero or positive nets to a refund, not
// spending - nothing to show as a pie slice for it that period. Remaining
// rows are sorted largest to smallest.
export function pieEligibleRows(totals) {
  return [...totals.entries()]
    .filter(([, value]) => value < 0)
    .map(([category, value]) => ({ category, value: Math.abs(value) }))
    .sort((a, b) => b.value - a.value);
}

export function monthlySummary(items, month) {
  let income = 0;
  let netSpending = 0;
  for (const item of items) {
    if (monthOf(item.date) !== month) continue;
    if (item.category === 'Bevétel') income += item.personalAmountHuf;
    else netSpending += item.personalAmountHuf;
  }
  return { income, spending: Math.abs(netSpending), balance: income + netSpending };
}

export function monthlyTrend(items, category, { jointOnly = false } = {}) {
  const totals = new Map();
  for (const item of items) {
    if (jointOnly && item.source !== 'revolut-joint') continue;
    if (item.category === 'Bevétel') continue;
    if (category && item.category !== category) continue;
    const month = monthOf(item.date);
    const amount = jointOnly ? item.amountHuf : item.personalAmountHuf;
    totals.set(month, (totals.get(month) || 0) + amount);
  }
  return [...totals.entries()]
    .map(([month, netAmount]) => [month, Math.abs(netAmount)])
    .sort(([a], [b]) => a.localeCompare(b));
}

// Groups a month's Bevétel line items by counterparty (falling back to the
// raw description when no counterparty was extracted), summing repeated
// income from the same source into one row, sorted largest first. Grouped
// by name regardless of accents, case, or word order (see
// normalizeNameForGrouping) - the same real person can appear formatted
// differently across OTP and Revolut (e.g. sending money via both), and
// should still collapse into a single row, not one per bank.
export function incomeBySource(items, month) {
  const totals = new Map(); // normalized key -> { label, total }
  for (const item of items) {
    if (item.category !== 'Bevétel') continue;
    if (monthOf(item.date) !== month) continue;
    const source = item.counterparty || item.description || '';
    const key = normalizeNameForGrouping(source);
    const existing = totals.get(key);
    if (existing) existing.total += item.personalAmountHuf;
    else totals.set(key, { label: source, total: item.personalAmountHuf });
  }
  return [...totals.values()].map(({ label, total }) => [label, total]).sort(([, a], [, b]) => b - a);
}

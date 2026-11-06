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
// categories: null means "every category" (the category filter sidebar's
// all-checked default); otherwise a Set of category names to include -
// anything not in it contributes nothing to the totals, same as if it
// didn't exist in items at all.
export function categoryTotals(items, { month = null, jointOnly = false, categories = null } = {}) {
  const totals = new Map();
  for (const item of items) {
    if (jointOnly && item.source !== 'revolut-joint') continue;
    if (item.category === 'Bevétel') continue;
    if (month && monthOf(item.date) !== month) continue;
    if (categories && !categories.has(item.category)) continue;
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

// jointOnly: true scopes to revolut-joint items using their full (unhalved)
// amountHuf - the joint view's own summary - instead of personalAmountHuf
// across every source, same convention as categoryTotals/monthlyTrend above.
export function monthlySummary(items, month, { jointOnly = false } = {}) {
  let income = 0;
  let netSpending = 0;
  let netSavings = 0;
  for (const item of items) {
    if (jointOnly && item.source !== 'revolut-joint') continue;
    if (monthOf(item.date) !== month) continue;
    const amount = jointOnly ? item.amountHuf : item.personalAmountHuf;
    if (item.category === 'Bevétel') income += amount;
    else netSpending += amount;
    if (item.category === 'Megtakarítás') netSavings += amount;
  }
  // Same netting convention as categoryTotals/pieEligibleRows: a category
  // that nets to zero or positive (a withdrawal month) has nothing to show
  // as spending, so it displays 0 rather than a negative figure.
  return { income, spending: Math.abs(netSpending), balance: income + netSpending, savings: Math.max(0, -netSavings) };
}

// categories: null means "every category"; otherwise a Set of category
// names to include - see categoryTotals above for the same convention.
//
// Nets per CATEGORY first, then excludes a category whose net is zero or
// positive (same rule pieEligibleRows applies for the pie chart), and only
// then sums the remaining categories' absolute values - not a single
// combined net-then-abs across every checked category. Summing raw first
// would let a refund-heavy category (net positive) silently cancel out
// another category's real spending before the total is ever shown, which
// doesn't match the pie chart showing the same checked categories for the
// same month - a found-via-use bug (the two charts briefly disagreed on
// one month's total with multiple categories checked, see PLANNING_LOG).
export function monthlyTrend(items, categories, { jointOnly = false } = {}) {
  const perMonth = new Map(); // month -> Map(category -> signed total)
  for (const item of items) {
    if (jointOnly && item.source !== 'revolut-joint') continue;
    if (item.category === 'Bevétel') continue;
    if (categories && !categories.has(item.category)) continue;
    const month = monthOf(item.date);
    const amount = jointOnly ? item.amountHuf : item.personalAmountHuf;
    if (!perMonth.has(month)) perMonth.set(month, new Map());
    const catTotals = perMonth.get(month);
    catTotals.set(item.category, (catTotals.get(item.category) || 0) + amount);
  }
  return [...perMonth.entries()]
    .map(([month, catTotals]) => [month, pieEligibleRows(catTotals).reduce((sum, r) => sum + r.value, 0)])
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

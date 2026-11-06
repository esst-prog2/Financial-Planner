## Context

See proposal.md - Why/What Changes for motivation. Current state, confirmed by reading the code:

- `renderDeductionHistory()` (js/app.js) is hardcoded to `monthSelect.value` and `deductionHistoryRowsEl`, and never filters `deductionHistory` entries by the deducted-from expense's source - it groups and shows every entry regardless of personal vs. joint.
- `findTransactionById(id)` (js/app.js) already searches both `state.items` and `state.jointRaw`, but its return value drops the `source` field, even though the underlying transaction object has one (confirmed: `categoryTotals()` in aggregate.js already filters on `item.source !== 'revolut-joint'`, and joint-sourced transactions mirror into `state.items` too per the transaction-corrections "Transaction identity" requirement).
- `renderJointView()` is the single place that already re-renders everything joint-specific (pie, bar, contributors) and is called from every point that needs it: initial upload, the view-switch click handler, and `afterTransactionsChanged()`. `jointMonthSelect`'s own `change` handler separately calls the joint pie/income renderers (not `renderJointView()` itself, to avoid re-rendering the bar chart's canvas unnecessarily).
- `monthlySummary(items, month)` (js/aggregate.js) has no `jointOnly` option; `categoryTotals()` and `monthlyTrend()` already share that convention (`jointOnly: true` -> filter to `revolut-joint` items, use `amountHuf` instead of `personalAmountHuf`).

## Goals / Non-Goals

**Goals:**
- Joint view gets a monthly summary card and a deduction-history panel, in the same relative layout as the personal view.
- Deduction-history content is correctly scoped by source from here on, including for deductions logged before this change (no migration needed - scoping is computed from the live expense's `source`, not stored on the deduction entry itself).

**Non-Goals:**
- No change to how a deduction is applied or undone - only to how the history is displayed.
- No change to the allocation panel, delete bar, or selection mechanics.

## Decisions

- **Generalize `renderDeductionHistory` into one parameterized function, called twice.** Give it `{ month, container, jointOnly }` and have it filter groups by `findTransactionById(expenseId).source` matching `jointOnly`. Alternative considered: two separate near-duplicate functions (mirroring the historical `toggleIncomeSourceDetail`/`toggleJointIncomeDetail` split) - rejected because that pair was later refactored into one shared `toggleTransactionDetail` specifically to avoid this duplication (see PLANNING_LOG, HW6 review 5), so repeating the duplicated-copy pattern here would be inconsistent with that established preference.
- **`findTransactionById` gains a `source` field on its return value.** Minimal, additive change; every existing caller ignores unknown fields.
- **`monthlySummary` gains a `jointOnly` option, following `categoryTotals`'s exact existing convention** (default `false`, so every existing call site and test is unaffected) rather than introducing a new `jointMonthlySummary` function - keeps one aggregation function per concept, consistent with how `categoryTotals`/`monthlyTrend` already handle the personal/joint split.
- **Wire the two new joint renders (`renderJointSummary`, the joint-scoped `renderDeductionHistory` call) into `renderJointView()` and into `jointMonthSelect`'s `change` handler** - the same two places joint pie/income/bar rendering already hooks in, so the new gadgets stay in sync with every existing joint-refresh path (upload, view switch, month switch, `afterTransactionsChanged()`) without new call sites to remember.
- **Layout**: reuse the personal view's existing `#income-deduction-split` CSS grid rule for a new `#joint-income-deduction-split` id, rather than converting the existing rule to a shared class - the project's established spec-vs-styling convention (PLANNING_LOG, HW6 review 6/N continued) only specs behavior, and css/style.css's existing pattern for the four click-to-list containers is already ID-based duplication, not shared classes.

## Risks / Trade-offs

- [Risk] A deduction entry whose expense has since been deleted entirely has no live `source` to check (`findTransactionById` returns `null`). → Same as today's existing behavior for a deleted expense: `originalAmountForExpense`'s `remaining` computes to 0 via the `current?.amount ?? 0` fallback, so the group is filtered out by the existing "remaining > 0" rule before source-scoping ever runs - no new edge case introduced.
- [Risk] Splitting deduction-history by source is a user-visible behavior change for anyone who already has joint-sourced deductions logged (they move from the personal panel to the new joint panel). → Acceptable and intended per the user's explicit choice (see conversation); no data is lost or altered, only which panel displays it.

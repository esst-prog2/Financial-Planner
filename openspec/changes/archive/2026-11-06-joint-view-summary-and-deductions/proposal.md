## Why

The personal view shows a monthly summary (income/spending/balance) and a permanent deduction-history panel; the joint view has neither, even though joint-sourced transactions can already be selected, deleted, and deducted from one another (the "Select transactions for correction"/"Deduct an income transaction..." requirements already cover the joint category and joint income lists). The user explicitly asked for parity: the joint view should get the same summary and deductions gadgets as the personal view. Investigating the existing deduction-history panel while scoping this change also surfaced a real gap worth fixing now rather than carrying forward: it currently groups every deduction entry together regardless of whether the deducted-from expense was a personal or a joint-account transaction, and only renders into the personal view, filtered by the personal month selector - so a deduction against a joint expense is invisible when the joint view is open, and can appear mixed into the personal panel if the personal month happens to match.

## What Changes

- Add a joint monthly summary card to the joint view: total joint spending, total joint contributions (income), and the balance, for the currently-selected joint month - the joint-view equivalent of the personal "Monthly summary" requirement, using full (unhalved) joint amounts rather than the personal view's halved amounts.
- Add a "Levonások" (deduction history) panel to the joint view, in the same position relative to the contributors card as the personal view's deduction-history panel is to its income-sources card (a 2/3-1/3 split), scoped to the currently-selected joint month.
- **BREAKING (behavior change)**: split the existing deduction-history panel's content by source. The personal view's panel now shows only deductions against non-joint-sourced expenses; the new joint panel shows only deductions against joint-sourced (`revolut-joint`) expenses. Previously, every deduction appeared in the one personal-view panel regardless of source.
- `monthlySummary()` in `js/aggregate.js` gains a `jointOnly` option (mirroring `categoryTotals()`'s and `monthlyTrend()`'s existing convention): when true, scopes to `revolut-joint` items using their full `amountHuf` instead of `personalAmountHuf`.
- `renderDeductionHistory()` in `js/app.js` is parameterized by source scope (joint vs. not) and by which month-select/container pair to use, instead of being hardcoded to the personal view's elements and `state.items` only.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `spending-dashboard`: new requirement "Joint monthly summary" (joint-view equivalent of the existing "Monthly summary" requirement, using full joint amounts).
- `transaction-corrections`: "Deduction history" requirement modified to scope each panel (personal vs. joint) to its own source, plus a new "joint view has its own deduction-history panel" scenario.

## Impact

- `js/aggregate.js` (`monthlySummary`), `js/app.js` (`renderSummary`/a new joint-summary render function, `renderDeductionHistory` generalized into a shared helper called twice), `index.html` (`#joint-summary` card, `#joint-income-deduction-split` grid with `#joint-deduction-history`), `css/style.css` (reuse the existing `#income-deduction-split` grid rule, generalized or duplicated for the joint id), `tests/aggregate.test.js` (new `monthlySummary` jointOnly tests).

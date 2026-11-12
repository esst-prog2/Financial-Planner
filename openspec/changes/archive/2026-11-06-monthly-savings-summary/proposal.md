## Why

The user wants to see, at a glance in the monthly summary, how much she put into savings that month, without having to open the category pie chart and find the Megtakarítás slice separately.

## What Changes

- The personal view's monthly summary gains a new line, placed immediately after income (before spending and balance): that month's total Megtakarítás-category spending, computed the same way the category pie/pipeline already compute a category's signed total (net of any refund/withdrawal within the category, never per-line-item absolute value before summing), shown as a positive magnitude - 0 if the category nets to zero or a withdrawal-dominated (non-negative) total that month, consistent with how such a month already excludes that category from the pie chart.
- The Megtakarítás line also shows what percentage of that month's income it represents (rounded to one decimal place; 0% when income is zero, never a division error) - per the user's explicit request, revising this change's first draft, which placed the line last with no percentage.
- Personal view only, by the user's explicit choice - the joint view's own monthly summary (added earlier today) does not gain this line.
- `monthlySummary()` in js/aggregate.js gains a `savings` field on its return value, computed via the same per-category netting `categoryTotals()` already does (not a new, separate calculation).
- `summaryLines()` in js/i18n.js reorders to income, savings, spending, balance, and includes a `percent` alongside the savings line when a `savings` value is passed - the joint view's call site keeps passing none, so it is unaffected.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `spending-dashboard`: "Monthly summary" requirement gains the savings line, scenario, and fixed-order update (personal view only).

## Impact

- `js/aggregate.js` (`monthlySummary`), `js/i18n.js` (`summaryLines`), `js/app.js` (`renderSummary` passes the new value; `renderJointSummary` unchanged), `tests/aggregate.test.js`, `tests/i18n.test.js`.

## 1. Aggregation logic

- [x] 1.1 In js/aggregate.js, add a `savings` field to `monthlySummary()`'s return value: the signed sum of that month's Megtakarítás-category line items (within the same existing loop, not a second pass), clamped to 0 when the net is zero or positive, shown as a positive magnitude otherwise
- [x] 1.2 Add tests in tests/aggregate.test.js: a month with only Megtakarítás deposits, a month with a deposit and a smaller withdrawal (net reduces the figure), a month that nets to zero or positive (shows 0, not negative), and confirm `jointOnly: true` still computes it correctly too (even though the personal-only UI choice means it won't be rendered there - the aggregation function itself shouldn't special-case that)

## 2. Display

- [x] 2.1 In js/i18n.js, add a `summarySavingsLabel` string (hu/en) and give `summaryLines()` an optional `savings` parameter: when provided, insert a line right after income (before spending and balance), with the Megtakarítás label; when omitted, return exactly the existing three lines (backward compatible for the joint view's call site)
- [x] 2.2 Add a test in tests/i18n.test.js: `summaryLines` with `savings` provided returns four lines in income, savings, spending, balance order with the right label; without it, returns exactly the existing three (regression - confirms the joint view's call site is unaffected)
- [x] 2.3 In js/app.js, update `renderSummary()` to pass `savings` from `monthlySummary()`'s result into `summaryLines()`; leave `renderJointSummary()` unchanged (no `savings` argument, per the user's choice)

## 3. Percentage of income (added after the user's follow-up request)

- [x] 3.1 In js/app.js, compute the savings line's percentage of income (`income > 0 ? round(savings/income * 1000)/10 : 0`, one decimal place, matching the pie legend's existing rounding convention in `withPercentages`) and pass it to `summaryLines()` as `savingsPercent`
- [x] 3.2 In js/i18n.js, have `summaryLines()` attach a `percent` field to the savings line only (not the other three) when `savingsPercent` is given
- [x] 3.3 In js/app.js, update `renderSummary()`'s line-rendering map to append ` (X%)` after the amount only for a line that carries a `percent` field
- [x] 3.4 Add tests: `summaryLines` attaches the right `percent` value to the savings line only; a zero-income case yields `0`, not `NaN`/`Infinity`

## 4. Final verification

- [x] 4.1 Run `npm test` and verify the full suite passes
- [x] 4.2 Verify manually in the browser: the personal view's monthly summary shows income, then "Megtakarítás: X HUF (Y%)" (Y matching X's share of the income line above it), then spending, then balance; a month with no net savings shows "Megtakarítás: 0 HUF (0%)"; the joint view's summary still shows only three lines - live-verified by the user

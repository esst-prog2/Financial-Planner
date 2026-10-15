All tasks below describe work already implemented and shipped (this change retroactively documents it - see proposal.md).

## 1. Month navigation

- [x] 1.1 `populateMonthOptions()`: grid layout, one column per calendar month, same-month-across-years stacking - verified by manual walkthrough (DOM-rendering logic, no dedicated unit test)
- [x] 1.2 Grid columns sized to fit the available width without horizontal scrolling (`minmax(0, 1fr)` columns) - verified by manual walkthrough
- [x] 1.3 `selectMonth()` helper, used both by tab clicks and by the view-switch handler for cross-view carry-over - verified by manual walkthrough

## 2. Monthly summary

- [x] 2.1 `summaryLines()` (`js/i18n.js`) returns income/spending/balance in that fixed order; `renderSummary()` renders them as a bulleted list - verified by `tests/i18n.test.js`'s `summaryLines` test

## 3. Category transaction table

- [x] 3.1 `expenseTableHtml()`: date/description/amount columns, sorted oldest-first - verified by manual walkthrough

187 tests pass (`npm test`).

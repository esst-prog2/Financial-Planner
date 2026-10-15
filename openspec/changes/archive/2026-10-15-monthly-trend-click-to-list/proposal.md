## Why

The category pie chart lets the user click a slice to see its individual transactions, but the monthly trend bar chart has no equivalent - clicking a bar does nothing. The user wants the same click-to-list behavior on the bar chart, for the month that bar represents.

## What Changes

- Clicking a bar in the monthly trend chart (personal or joint) displays a transaction table - same date/description/amount, oldest-first, selectable-checkbox format the pie chart's click already uses - listing every transaction from that bar's month across every currently-checked category (not a single category, since a bar is the sum of the whole checked set, unlike a pie slice).
- Clicking a bar SHALL NOT change the dashboard's currently-selected month (`monthSelect`/`jointMonthSelect`) - the rest of the dashboard (summary, pie chart, income sources) keeps showing whichever month was already selected; only the new transaction list reflects the clicked bar's month. The user explicitly chose this over switching the whole dashboard to the clicked month.
- `expenseTableHtml()`'s first parameter changes from a category (internally translated via `categoryLabel()`) to a plain heading string, so it can be reused for both a category name (pie click) and a month string (bar click) without forcing every caller through category translation.
- **Added mid-flow, same session**: clicking the bar (or pie slice) that is already open closes its transaction list instead of re-rendering it - a toggle, not a one-way reveal. This extends to the pie chart too, so both charts behave consistently.

## Capabilities

### Modified Capabilities
- `spending-dashboard`: "Month-by-month trend with category filter" gains click-to-list and toggle-to-close behavior; "Category pie chart" gains the same toggle-to-close behavior on its existing click-to-list.

## Impact

- `js/app.js`: `expenseTableHtml(category, rows, amountField)` becomes `expenseTableHtml(heading, rows, amountField)`; its two existing call sites (`renderCategoryTransactionList`, `renderJointCategoryTransactionList`) pass `categoryLabel(category, lang)` explicitly instead of the raw category. `renderMonthlyBar()`/`renderJointMonthlyBar()` gain a Chart.js `onClick` handler, calling new `renderMonthlyTransactionList(month)`/`renderJointMonthlyTransactionList(month)` functions that filter `state.items` by the clicked month and the relevant checked-categories Set (`selectedCategories`/`jointSelectedCategories`), reusing `expenseTableHtml()` with the month string as heading.
- `index.html`: two new empty containers below the trend charts (`#monthly-bar-transactions`, `#joint-monthly-bar-transactions`), mirroring `#category-transactions`/`#joint-category-transactions`.
- `css/style.css`: the existing `#category-transactions`/`#joint-category-transactions` table styling is ID-selector-based (confirmed by reading the file, not a shared class), so the two new container ids need adding to each of those selector lists to get the same table styling.
- No change to `js/aggregate.js` or `js/i18n.js`.

## 1. Generalize the shared table renderer

- [x] 1.1 Change `expenseTableHtml(category, rows, amountField)` to `expenseTableHtml(heading, rows, amountField)` in js/app.js - use `heading` directly in the `<h3>` instead of calling `categoryLabel()` internally.
- [x] 1.2 Update `renderCategoryTransactionList()` and `renderJointCategoryTransactionList()` to pass `categoryLabel(category, lang)` explicitly - existing pie-chart click-to-list heading text unchanged.

## 2. Markup for the new containers

- [x] 2.1 Added `<div id="monthly-bar-transactions"></div>` below `#monthly-bar`'s canvas in index.html, and `<div id="joint-monthly-bar-transactions"></div>` below `#joint-monthly-bar`'s canvas.
- [x] 2.2 Added `#monthly-bar-transactions`/`#joint-monthly-bar-transactions` to the existing `#category-transactions`/`#joint-category-transactions` table-styling selector lists in css/style.css.

## 3. Click behavior in app.js

- [x] 3.1 Added `renderMonthlyTransactionList(month)`: filters `state.items` to that month and `selectedCategories.has(i.category)`, renders via `expenseTableHtml(month, rows, 'personalAmountHuf')` into `#monthly-bar-transactions`.
- [x] 3.2 Added `renderJointMonthlyTransactionList(month)`: filters to `i.source === 'revolut-joint'`, that month, and `jointSelectedCategories.has(i.category)`, renders via `expenseTableHtml(month, rows, 'amountHuf')` into `#joint-monthly-bar-transactions`.
- [x] 3.3 Added `onClick` to `renderMonthlyBar()`'s Chart.js config, reading the clicked bar's month from `trend[elements[0].index][0]` - does not touch `monthSelect.value`.
- [x] 3.4 Added the same `onClick` to `renderJointMonthlyBar()`.
- [x] 3.5 Added clearing of `#monthly-bar-transactions`/`#joint-monthly-bar-transactions` (and, per 4.1 below, their `data-open` tracking) at every point `#category-transactions`/`#joint-category-transactions` already clear: the upload handler, `monthSelect`/`jointMonthSelect`'s change handlers, `afterTransactionsChanged()`, and the language-switch handler.

## 4. Toggle-to-close (added mid-flow, same session, for both the bar and the pie chart)

- [x] 4.1 Added a shared `toggleDetailContainer(container, key, render)` helper: if `container.dataset.open === key`, clears the container and the attribute instead of re-rendering; otherwise calls `render()` and sets `container.dataset.open = key`. Added a `clearDetailContainer(container)` helper (clears both `innerHTML` and `data-open`) and replaced every existing bare `X.innerHTML = ''` clear (for all four containers) with it, so a stale `data-open` can never survive a clear.
- [x] 4.2 Wrapped all four click-to-list functions (`renderCategoryTransactionList`, `renderJointCategoryTransactionList`, `renderMonthlyTransactionList`, `renderJointMonthlyTransactionList`) in `toggleDetailContainer`, keyed by category for the pie-chart functions and by month for the bar-chart functions.

## 5. Verification

- [x] 5.1 Run `npm test` and confirm all tests pass. 192/192 pass (no pure-logic module changes).
- [x] 5.2 Manually verified by the user in the browser ("jól működik"): toggle-to-close confirmed working on both the bar chart and the pie chart.
- [x] 5.3 Append a dated PLANNING_LOG.md entry describing the change and who decided it.

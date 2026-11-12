## Context

`expenseTableHtml(category, rows, amountField)` (js/app.js) already renders the shared transaction-table markup the pie chart's click uses, but hardcodes the heading to `categoryLabel(category, lang)`. The bar chart's `onClick` needs the same table for a *month*, not a category, so the heading needs generalizing. See proposal.md for why the click doesn't switch the dashboard's selected month.

## Goals / Non-Goals

**Goals:**
- Reuse the exact table markup/checkbox behavior the pie chart's click-to-list already provides, for both views' bar charts.

**Non-Goals:**
- No change to what the bar itself displays or how its total is computed (js/aggregate.js untouched) - purely adding a click handler and a result container.
- No persistence of the clicked-bar transaction list across a page reload - matches the existing pie-chart click list, which is also session-only, rebuilt from scratch on every click.

## Decisions

**Generalize `expenseTableHtml`'s first parameter from `category` to a plain `heading` string.** Its two existing callers now pass `categoryLabel(category, lang)` directly. This is the minimal change that lets the bar-click handlers pass a month string (e.g. "2026-03") as the heading instead - no new table-building function duplicating the same markup.

**The bar-click transaction list filters by the clicked month AND the relevant checked-categories Set, not just the month.** A bar's own value already excludes unchecked categories (monthlyTrend's existing behavior) - the list behind it has to match what the bar actually represents, or the two would disagree the same way the pie/bar totals disagreed before the earlier bug fix.

**Two new containers, not a shared one.** `#monthly-bar-transactions`/`#joint-monthly-bar-transactions`, directly mirroring `#category-transactions`/`#joint-category-transactions` (one pair per view, same existing pattern throughout this codebase) rather than introducing a single shared container that would need to disambiguate which view's click filled it.

**CSS: add the two new ids to the existing `#category-transactions`/`#joint-category-transactions` selector lists**, rather than introducing a shared class - matches this file's existing ID-duplication convention for parallel personal/joint elements (confirmed by reading css/style.css: there's no existing shared class for this table styling to extend).

**Toggle-to-close tracks the currently-open category/month as a `data-open` attribute on each container, not a separate module-level variable.** Mirrors the codebase's existing pattern for `toggleTransactionDetail` (which reads `detail.hidden` directly off the DOM rather than tracking open/closed state elsewhere) - the open/closed state lives with the element it describes. All four containers (`#category-transactions`, `#joint-category-transactions`, `#monthly-bar-transactions`, `#joint-monthly-bar-transactions`) get this same attribute. Every existing and new place that clears one of these containers (`innerHTML = ''`) must also clear its `data-open` attribute, or a stale value could make the next click on that same category/month incorrectly look like "already open" and close instead of show - added to task 3.5 in this change, which was already touching every one of those clear sites for the two new containers.

## Risks / Trade-offs

[A user could be confused that clicking a bar for a different month doesn't move the rest of the dashboard to that month] → Accepted - this was the user's own explicit choice between the two options presented, over switching the whole dashboard's selected month.

## Why

Three pieces of the dashboard's navigation and summary display were built ad hoc (no OpenSpec change) during post-homework feature work and were never captured in the spending-dashboard spec: how months are selected at all (the original spec never described this), how the monthly summary is laid out, and how a category's transaction list is presented. This change retroactively documents them as part of HW6's "review your whole codebase" pass.

## What Changes

- Months are shown as a row of tab buttons, one column per calendar month, so the same calendar month recurring in a later year stacks under its earlier occurrence instead of just continuing the row; the whole row fits the available width without horizontal scrolling.
- The currently-selected month carries over when switching between the personal and joint views, instead of each view resetting to its own default.
- The monthly summary is a bulleted list, in a fixed order: income, then spending, then the difference.
- A category's (or the joint view's) listed transactions appear as a date/description/amount table, sorted oldest-first.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `spending-dashboard`: adds a month-navigation requirement (previously undocumented), and modifies the monthly-summary and category-pie-chart requirements to describe the list/table format and sort order actually shown.

## Impact

- `js/app.js`: `populateMonthOptions()`/`selectMonth()` (month-tab grid, cross-view sync), `renderSummary()` (list format), `expenseTableHtml()` (table format, date sort).
- `index.html` / `css/style.css`: the month-tab bar markup/grid layout, the summary list, the transaction table styling.

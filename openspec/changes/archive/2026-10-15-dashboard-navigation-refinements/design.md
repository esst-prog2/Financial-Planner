## Context

See proposal.md for motivation. This document describes the architecture actually shipped (retroactive, per HW6's "review your whole codebase").

## Goals / Non-Goals

**Goals:**
- Document the actual implementation precisely enough for the spec's scenarios to be testable against it.

**Non-Goals:**
- Any visual/CSS-only change (fonts, colors, the pink/rose theme, the pie-chart palette) - this project's established convention only specs *behavior*, not styling, and that convention is preserved here.

## Decisions

**Month tabs as a CSS grid, column = calendar month, not a plain wrapping flex row.**
`populateMonthOptions()` (`js/app.js`) computes, for each month in the data, which calendar-month column it belongs to (assigned in first-appearance order) and which occurrence row within that column, then sets `grid-column`/`grid-row` inline styles per button and a `--month-columns` custom property on the container, which the CSS reads via `grid-template-columns: repeat(var(--month-columns, 12), minmax(0, 1fr))`. `minmax(0, 1fr)` columns (rather than `max-content`) is what makes the whole row fit the available width without scrolling - the grid shrinks each column to share the space.

**Cross-view month sync via a shared `selectMonth()` helper, not duplicated toggle logic.**
`selectMonth(selectEl, month)` sets `.value`, toggles the `.active` class, and dispatches `'change'` - the same thing a tab click already did, now callable programmatically. The view-switch handler calls it on the newly-active view's month-select, passing the other view's current value; it no-ops when that month isn't among the target's own tab buttons, which is what produces the "falls back gracefully" scenario for free, without a separate existence check.

**The expense table's sort is applied at render time, not stored.**
`expenseTableHtml()` sorts its rows by date immediately before building the table markup, every time it's called - there is no persisted "sorted" state; a re-render (e.g. after a correction) naturally re-sorts.

## Risks / Trade-offs

- **The `--month-columns` CSS custom property couples the grid's column count to JS-computed state** → Accepted; the alternative (a fixed 12-column grid regardless of how many distinct calendar months are actually present) would leave empty trailing columns when fewer than 12 months are in the data.

## Context

Today's layout (index.html, personal view): a Summary card, then `#income-pie-split` (a 2fr/1fr grid holding income-sources + the category pie chart together in the left 2/3, and the sticky deduction-history aside in the right 1/3), then a separate full-width monthly-trend card below with its own `<select id="category-filter">` dropdown. The joint view mirrors this minus income-sources/deduction-history: a pie-chart card, a trend card with its own `<select id="joint-category-filter">`, then a contributors card.

See proposal.md for why a single multi-select, left-positioned filter driving both charts replaces the two single-category dropdowns.

## Goals / Non-Goals

**Goals:**
- One filter sidebar per view, positioned to the left of that view's pie chart and bar chart, both of which it filters together.
- Default state is "everything checked" (equivalent to today's unfiltered view).

**Non-Goals:**
- No persistence of filter state across a page reload - this change doesn't touch js/preferences.js. Unchecking categories only lasts for the current session, same as today's dropdown selection already behaves (page reload resets everything regardless).
- No change to the monthly trend chart becoming a multi-series chart (one bar/line per checked category). It stays a single series - the sum of whatever's checked - generalizing today's "all" and "exactly one category" dropdown states to "any checked subset," not introducing per-category breakdown into the bar chart.
- No change to income-sources, deduction-history, summary, or joint-contributors - the filter only touches the two chart cards named in the proposal.

## Decisions

**Layout: a persistent, full-height left sidebar per view (not a row paired with just the pie chart).**

This went through three iterations with the user, the first two implemented and then revised: (1) pulling the pie chart out into a new row with the filter and the trend chart - rejected as too disruptive to the existing income/deduction-history pairing; (2) income-sources moved to its own full-width section, filter sidebar placed beside just the pie chart, deduction-history re-paired with income-sources - implemented, then the user asked "wouldn't it be better to use more of the screen" and asked to see the alternative before deciding. A two-artboard mockup (current narrow layout vs. a wide page with a full-height sidebar) was built and published as an Artifact for comparison; the user picked the wide version. That is what this change now implements: the filter sidebar runs the full height of its view's content (sticky), beside a single right-hand content column holding every other card for that view, in their existing relative order - so the sidebar's reach is visible, not just functional.

New personal-view structure (`#personal-view` itself becomes the flex row):
```
[ Filter sidebar (sticky, full height) ] [ Summary ]
                                          [ income-sources | deduction-history ]
                                          [ category-pie card ]
                                          [ monthly-trend card ]
```

The joint view gets the identical structural pattern (same `.dashboard-layout`/`.dashboard-content`/`.category-filter-sidebar` classes, not a one-off):
```
[ Filter sidebar (sticky, full height) ] [ joint-contributors ]
                                          [ joint-category-pie card ]
                                          [ joint-monthly-trend card ]
```

**The page itself widens from `max-width: 960px` to `1600px`.** A full-height sidebar needs real width to its right to avoid cramming every card into a narrow column; the mockup comparison made this concrete enough for the user to approve both changes together. The page stays centered (`margin-inline: auto`) and the existing 760px mobile breakpoint (single column, sidebar no longer sticky) is unaffected - a narrow viewport was already laid out as one column before this change and still is.

**`categoryTotals`/`monthlyTrend` take a `Set<string>|null`, not a boolean mask or a second array parameter.**
Matches the existing `{ month, jointOnly }` options-object style for `categoryTotals` (add `categories` to that same object) and keeps `monthlyTrend`'s existing positional second argument, just changing what it accepts (a `Set` instead of a single string), rather than inventing a new third way to pass a filter. `null` keeps meaning "no filter," identical to today's falsy-category meaning - the one existing test (`monthlyTrend(items, null)`) keeps passing unchanged.

**Checkbox list markup mirrors the existing month-tabs/transaction-checkbox patterns already in app.js**, not a native `<select multiple>` - the proposal explicitly asks for every option visible at once, which a native multi-select doesn't do well across browsers. Each checkbox re-renders with its checked state read from the relevant Set, the same `set.has(id)`-driven re-check pattern `transactionRowHtml` already uses for selection checkboxes.

## Risks / Trade-offs

[Widening the page to 1600px could leave very wide, sparse-looking cards on an already-wide monitor] → Accepted by the user after reviewing a rendered mockup at this width; the sidebar's `max-width: 280px` keeps it from stretching, and `.dashboard-content`'s cards keep their own natural content-driven widths rather than stretching to fill all 1600px themselves.

[Generalizing `monthlyTrend`'s second parameter from a string to a `Set` is a breaking change to that function's signature] → Acceptable: it's an internal pure function (js/aggregate.js), not a persisted data shape or external API: the only call sites are in js/app.js (updated by this change) and its own test file (one `null` call, unaffected).

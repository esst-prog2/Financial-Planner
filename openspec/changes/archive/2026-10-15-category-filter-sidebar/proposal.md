## Why

The category pie chart has no filter at all today (it always shows every category), and the monthly trend bar chart only lets the user narrow to exactly one category at a time via a dropdown. The user wants one persistent, multi-select filter - all categories checked by default - that controls both charts at once from a single place, instead of two separate, inconsistent filtering mechanisms.

## What Changes

- Replace the existing single-category dropdowns (`#category-filter`, `#joint-category-filter`) with a persistent, left-positioned checkbox list covering all 12 spending categories plus the 2 non-income non-spending buckets (`Készpénzfelvét`, `Egyéb`) - the same set `ALL_CATEGORIES` already covers - defaulting to every category checked.
- The checked set filters both the category pie chart and the monthly trend bar chart simultaneously: a category pie slice only appears if its category is checked, and the bar chart's monthly totals only sum checked categories' line items.
- Add a "Mind kijelölése" (select all) button that re-checks every category in one click.
- The personal view and the joint view each get their own independent filter and checkbox state - checking/unchecking in one view does not affect the other.
- **BREAKING**: `monthlyTrend(items, category, opts)` in js/aggregate.js changes its second parameter from a single category string (or falsy for "all") to a `Set<string>|null` of categories to include (null means "all", matching today's "no filter" meaning). `categoryTotals(items, opts)` gains a new `categories` option with the same `Set<string>|null` meaning, used to filter which categories contribute pie slices.

## Capabilities

### Modified Capabilities
- `spending-dashboard`: "Category pie chart" gains category-filter awareness; "Month-by-month trend with category filter" is rewritten from a single-category dropdown to the shared multi-select filter.

## Impact

- `js/aggregate.js`: `categoryTotals()` gains a `categories` filter option; `monthlyTrend()`'s category parameter changes from a string to a `Set|null`.
- `js/app.js`: removes `renderCategoryFilterOptions()`'s dropdown-building logic, replaced by a checkbox-list builder for two independent filter sidebars (personal, joint); `renderCategoryPie()`, `renderJointCategoryPie()`, `renderMonthlyBar()`, `renderJointMonthlyBar()` read from the new checked-category state instead of a dropdown's `.value`.
- `index.html`: removes the two `<select>` filter dropdowns, adds two checkbox-list sidebars (one per view), and restructures each view (`#personal-view`, `#joint-view`) into a full-height sidebar + content-column layout, so the filter sits beside every card it affects, not just one chart.
- `css/style.css`: new `.dashboard-layout`/`.dashboard-content`/`.category-filter-sidebar` rules for the sidebar layout, and the page's own `max-width` widens from 960px to 1600px to give the sidebar room (confirmed against a rendered mockup before implementing - see design.md).
- `js/i18n.js`: new string for the "select all" button; the existing `categoryFilterLabel` string is reused as the sidebar's heading.
- `tests/aggregate.test.js`: existing `monthlyTrend` test already passes `null` for "all categories", unaffected; new tests needed for the `Set`-based filtering in both functions.

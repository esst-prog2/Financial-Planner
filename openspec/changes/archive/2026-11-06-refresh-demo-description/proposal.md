## Why

README.md section 1 ("The demo") is the script for the HW8 presentation and must describe what the app actually does today. It currently says: "I select 'Groceries' from a category dropdown, and the same chart updates to show only my grocery spending, month by month." That dropdown no longer exists - it was replaced by a persistent, multi-select category filter sidebar (checkbox list, all categories checked by default, a bidirectional "select all" checkbox) that filters both the pie chart and the monthly-trend bar chart together. The demo text needs to match the UI that will actually be shown.

## What Changes

- Rewrite the one sentence in README.md section 1 that describes category filtering, replacing "a category dropdown" with the multi-select sidebar checkbox filter, and keeping the description of what it does (narrows the trend chart to chosen categories).
- No other sentence in section 1 changes - the rest of the demo path (upload, pie chart, click-to-list, summary, income by source, joint view, language toggle) still matches the current app.
- Documentation only. No code, test, or spec behavior changes.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none - the underlying "Category filter sidebar" requirement already exists in `openspec/specs/spending-dashboard/spec.md`, archived under `2026-10-15-category-filter-sidebar`. This change only brings the README's prose description in line with that already-specified, already-implemented behavior; it changes no requirement.)

## Impact

- `README.md` only (section 1, one sentence).

## 1. Markup

- [x] 1.1 In index.html, change `#category-filter-select-all` and `#joint-category-filter-select-all` from `<button type="button">` to `<input type="checkbox" checked>` wrapped in a `<label>` carrying the existing `data-i18n="selectAllCategoriesLabel"` text - ids and `data-i18n` attribute unchanged so existing JS/i18n wiring still finds them.

## 2. Behavior in app.js

- [x] 2.1 Changed the `categoryFilterSelectAll`/`jointCategoryFilterSelectAll` `'click'` listeners to `'change'` listeners: when checked, reset the relevant Set to `new Set(ALL_CATEGORIES)`; when unchecked, reset it to `new Set()`; both cases re-render the checkbox list and both charts.
- [x] 2.2 In `renderCategoryFilterCheckboxes()`, set `categoryFilterSelectAll.checked`/`jointCategoryFilterSelectAll.checked` from whether the relevant Set's size equals `ALL_CATEGORIES.length`.
- [x] 2.3 In the per-category checkbox delegated change listener, after updating the Set, also set the master checkbox's `.checked` to reflect whether every category is now checked.

## 3. Verification

- [x] 3.1 Run `npm test` and confirm all tests pass (no pure-logic module changes expected from this UI-only change).
- [ ] 3.2 Manually verify in the browser (no automated browser tool available in this environment - ask the user to confirm): the master checkbox starts checked; unchecking one category unchecks the master checkbox; checking the master checkbox re-selects everything; unchecking the master checkbox from the all-checked state deselects everything and both charts go empty; personal and joint sidebars behave independently.
- [ ] 3.3 Append a dated PLANNING_LOG.md entry describing the change and who decided it.

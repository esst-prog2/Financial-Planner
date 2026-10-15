## Why

The category filter sidebar's "select all" is currently a one-way button - it can only re-check everything, with no equivalent "deselect all" action. The user wants a single control that both shows and toggles the "everything checked" state, matching the familiar master-checkbox pattern (checked = everything selected; unchecking it clears the selection; it also reflects back to unchecked whenever the user manually leaves out any one category).

## What Changes

- Replace the "Mind kijelölése" button (`#category-filter-select-all`, `#joint-category-filter-select-all`) with a checkbox of the same name/label: checked by default (matching the existing all-checked default), checking it selects every category, unchecking it deselects every category.
- The checkbox's own checked state SHALL reflect the current selection automatically: checked only when every category is currently checked, unchecked the moment the user manually unchecks even one category - not just a one-way action button anymore.

## Capabilities

### Modified Capabilities
- `spending-dashboard`: "Category filter sidebar" - the "select all" control becomes a bidirectional checkbox instead of a one-way button.

## Impact

- `index.html`: `#category-filter-select-all`/`#joint-category-filter-select-all` change from `<button>` to `<input type="checkbox">` (same ids, wrapped in a `<label>` with the existing translated text).
- `js/app.js`: the select-all click handlers become change handlers with two-way logic (check -> select all, uncheck -> deselect all); the per-category checkbox change handler additionally syncs the master checkbox's own checked state after every toggle; `renderCategoryFilterCheckboxes()` also sets the master checkbox's initial checked state from the relevant Set.
- No change to `js/aggregate.js`, `js/i18n.js` (reuses the existing `selectAllCategoriesLabel` string), or `css/style.css`.

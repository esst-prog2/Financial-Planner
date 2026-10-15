## Context

`#category-filter-select-all`/`#joint-category-filter-select-all` are currently `<button>` elements with a one-way click handler that resets the relevant Set (`selectedCategories`/`jointSelectedCategories`) to `new Set(ALL_CATEGORIES)`. See proposal.md for why the user wants a bidirectional checkbox instead.

## Goals / Non-Goals

**Goals:**
- One checkbox per view that both shows and controls the "everything checked" state.

**Non-Goals:**
- No indeterminate/tri-state visual for "some but not all checked" - per the user's explicit choice, the master checkbox is simply unchecked whenever not every category is checked, same as a plain checked/unchecked binary.

## Decisions

**Reuse the existing ids, just change the tag from `<button>` to `<input type="checkbox">`.** No new ids needed; `js/app.js`'s existing `categoryFilterSelectAll`/`jointCategoryFilterSelectAll` element references stay as-is, only the event (`'click'` -> `'change'`) and handler body change.

**Sync the master checkbox's state from two places, not a computed getter re-run on every render.** `renderCategoryFilterCheckboxes()` sets it once per rebuild (`categoryFilterSelectAll.checked = selectedCategories.size === ALL_CATEGORIES.length`), and the per-category checkbox's own change listener sets it again immediately after updating the Set - so it's never stale between full rebuilds (e.g. right after unchecking one box, before any render call happens). This mirrors the project's existing pattern of keeping a derived DOM state in sync at the same points the underlying Set changes (e.g. `transactionRowHtml`'s `selectedForDeletion.has(id)` re-check), rather than introducing a reactive/computed-property mechanism this codebase doesn't otherwise use.

**The master checkbox's own change handler only distinguishes checked vs. unchecked, not "was this triggered by a user click vs. a script setting `.checked`."** Setting `.checked` from app.js directly (per the sync rule above) does not fire a `'change'` event in the DOM, so there's no risk of the sync write re-triggering the select-all/deselect-all handler recursively.

## Risks / Trade-offs

[A user might expect an indeterminate (dash) visual for "some checked," which plain unchecked doesn't convey] → Accepted per the user's explicit choice of the simpler binary behavior over the more complex tri-state one.

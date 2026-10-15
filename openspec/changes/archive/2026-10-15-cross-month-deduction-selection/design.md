## Context

`selectedForDeletion` (a module-level `Set` of transaction ids in js/app.js) already survives a month switch - it's never reset on `monthSelect`'s `change` handler, and `transactionRowHtml`/`expenseTableHtml` already re-check a box whose id is still in the set when a list is rebuilt. The gap is narrower than "selection doesn't survive months": two specific functions bypass that set and read the live DOM instead, so they only see whatever month happens to be rendered right now:

- `updateActionBar()` decides whether to show the "Levonás..." button via `app.querySelector('.tx-select:checked[data-kind="income"]')` / `[data-kind="expense"]`.
- `renderAllocationPanel()` builds its rows via `app.querySelectorAll('.tx-select:checked[data-kind="expense"]')` the same way.

Both need to know a selected transaction's *kind* (income/expense) to do their job, and today that only exists as the DOM's `data-kind` attribute - the `Set` itself holds ids only. See proposal.md for why this blocks cross-month deduction.

## Goals / Non-Goals

**Goals:**
- Make `updateActionBar()` and `renderAllocationPanel()` correct regardless of which month is currently displayed, using the already-persistent selection rather than the DOM.

**Non-Goals:**
- No change to how a selection is cleared or reset (clear-selection, delete, post-mutation refresh keep working exactly as today).
- No change to checkbox markup, to `findTransactionById()` (already month-independent), or to the delete/deduct/undo data flow once ids are resolved.
- No UI change indicating *which* month a selected-but-off-screen transaction belongs to - out of scope for this change; the existing "Törlés (N)" count already reflects the true total.

## Decisions

**Track kind in a `Map` alongside the existing `Set`, not inside a new combined structure.**
A `let selectedKinds = new Map()` (id -> `'income'|'expense'`), updated at the exact same four points `selectedForDeletion` already is: the delegated `.tx-select` change listener (`checkbox.dataset.kind` is already available there), `clearSelectionButton`'s handler, `deleteButton`'s handler, and `afterTransactionsChanged()`. Keeping it a sibling of `selectedForDeletion` rather than folding both into one `Map<id, {kind}>` avoids touching every existing `selectedForDeletion.has(...)`/`.add(...)`/`.delete(...)` call site in `transactionRowHtml`/`expenseTableHtml`/`updateActionBar`'s count/the rest of the file - only the two DOM-querying functions need to change at all.

**`updateActionBar()` and `renderAllocationPanel()` iterate `selectedKinds` instead of querying `app`.**
`updateActionBar()`: `hasIncome`/`hasExpense` become `[...selectedKinds.values()].includes('income')` / `'expense'`. `renderAllocationPanel()`: `incomeIds`/`expenseIds` become `[...selectedKinds].filter(([, k]) => k === 'income').map(([id]) => id)` (and the `'expense'` equivalent), replacing the two `querySelectorAll` calls. `findTransactionById(id)` already resolves against the full `state.items`/`state.jointRaw` regardless of month, so nothing downstream of id-resolution needs to change.

**A cross-month deduction is tracked under the expense's own month without any further change.**
`renderDeductionHistory()` already groups and filters strictly by `monthOf(current.date)`, where `current` is resolved via `findTransactionById(expenseId)` - i.e. the expense's own date, never the income's date or whichever month happened to be selected when Apply was clicked. This already matches the clarified requirement (see specs delta) and needs no code change; it's called out here only so a reviewer doesn't go looking for a change that isn't there.

## Risks / Trade-offs

[A selected transaction's checkbox, scrolled off-screen by a month switch, gives no visual reminder of *which* month it's in] → Acceptable for this change: the action bar's existing selection count already surfaces that something off-screen is selected, and re-adding a cross-month indicator is a separate, user-facing design decision outside this change's scope (see proposal.md's Impact section - UI markup is explicitly not touched here).

[`selectedKinds` could drift out of sync with `selectedForDeletion` if a future change adds a new reset point for one but not the other] → Mitigation: keep both updated together at the same four call sites named above, so a code reviewer sees them side by side.

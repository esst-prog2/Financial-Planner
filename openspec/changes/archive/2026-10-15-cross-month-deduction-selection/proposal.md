## Why

Selecting transactions for deletion or deduction only works reliably within a single month today: the "Levonás..." button and the allocation panel it opens both read directly from the DOM's currently-checked checkboxes, which only exist for the month currently being displayed. Switching months to pick a second transaction silently drops the first one from the deduction flow, even though the underlying selection (`selectedForDeletion`) already survives the switch. This blocks a real use case - deducting an income transaction from an expense dated in a different month (e.g. a contribution received in October that offsets a November bill).

## What Changes

- Track each selected transaction's kind (`income`/`expense`) in a module-level map alongside the existing `selectedForDeletion` set, updated at the same points (checkbox change, clear-selection, delete, post-mutation reset) - not derived from the live DOM.
- `updateActionBar()` decides whether to show the "Levonás..." button from that map instead of `app.querySelector('.tx-select:checked[...]')`, so it correctly reflects a selection spanning more than one month.
- `renderAllocationPanel()` builds its rows from the same map instead of `app.querySelectorAll('.tx-select:checked[...]')`, so an expense or income selected in a different, currently-not-displayed month is still included.
- No change to the checkbox markup, to how a selection is cleared, or to how deletion/deduction/undo apply once a selection is resolved to ids - `findTransactionById()` already resolves across the full dataset regardless of month, so only the two DOM-querying functions above need to change.

## Capabilities

### Modified Capabilities
- `transaction-corrections`: "Select transactions for correction" gains an explicit guarantee that a selection persists across a month switch; "Deduct an income transaction from one or more expenses" gains an explicit guarantee that the selected income and expense(s) may belong to different months.

## Impact

- `js/app.js`: `updateActionBar()`, `renderAllocationPanel()`, the delegated `.tx-select` change listener, and the selection-reset points (`clearSelectionButton` handler, `deleteButton` handler, `afterTransactionsChanged()`) - all logic, no markup or CSS changes.
- No change to `js/util.js`, `js/preferences.js`, `index.html`, or persisted data shapes (`deletedTransactionIds`, `transactionAdjustments`, `deductionHistory` are untouched).

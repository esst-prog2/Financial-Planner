## 1. Track selection kind independently of the DOM

- [x] 1.1 Add `let selectedKinds = new Map()` in js/app.js alongside `selectedForDeletion`, and update it in the delegated `.tx-select` change listener (`checkbox.dataset.kind` -> set/delete by `checkbox.dataset.txId`) - verify by checking an income and an expense box and inspecting `selectedKinds` in the console shows both entries.
- [x] 1.2 Clear `selectedKinds` at every point `selectedForDeletion` is reset: `clearSelectionButton`'s handler and `afterTransactionsChanged()` (which the delete button's own handler already routes through, so it needs no separate reset) - verify by clicking "Kijelölések visszavonása" (or completing a delete/deduction) and confirming `selectedKinds.size === 0` afterward.

## 2. Make the action bar and allocation panel month-independent

- [x] 2.1 Change `updateActionBar()` to compute `hasIncome`/`hasExpense` from `selectedKinds.values()` instead of `app.querySelector('.tx-select:checked[...]')` - verify the existing same-month allocate-button tests in tests/ (or a manual same-month check) still pass unchanged.
- [x] 2.2 Change `renderAllocationPanel()` to build `incomeIds`/`expenseIds` from `selectedKinds` instead of `app.querySelectorAll('.tx-select:checked[...]')` - verify a same-month deduction still opens the allocation panel with the right rows.
- [x] 2.3 Manually verify the new cross-month case end to end: select an income transaction in one month, switch months, select an expense transaction in a different month, confirm the "Levonás..." button is visible and the allocation panel includes a row for the off-screen-month expense, then apply and confirm the entry appears in the Levonások panel when the expense's own month is selected, and does not appear under the income's month or whichever month was active during the action. Confirmed working by the user against the real sample dataset in the browser.

## 3. Tests and documentation

- [x] 3.1 No test seam exists for this: `updateActionBar`/`renderAllocationPanel` are DOM-wired functions in app.js, and (per this project's established convention, confirmed in the HW6 "Testing" review) app.js has no dedicated test file - only the pure logic modules (util.js, aggregate.js, etc.) are unit tested. Verified manually instead (task 2.3), confirmed working by the user.
- [x] 3.2 Run `npm test` and confirm all tests pass before marking this change complete. 187/187 pass, unchanged by this change (no pure-logic module touched).
- [x] 3.3 Append a dated PLANNING_LOG.md entry describing the fix and who decided it, per this project's standing convention.

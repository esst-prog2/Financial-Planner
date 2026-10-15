All tasks below describe work already implemented and shipped (this change retroactively documents it - see proposal.md). Checked off accordingly; verification notes point to where each behavior lives.

## 1. Transaction identity

- [x] 1.1 Add `assignTransactionIds()` to `js/util.js` and call it from `parseOtpSheet()`/`parseRevolutSheet()` - verified by `tests/util.test.js`'s `assignTransactionIds` tests and `tests/pipeline.test.js`'s cross-view id-matching test
- [x] 1.2 Thread `id` through `buildLineItems()` in `js/pipeline.js` for both the main and fee line items - verified by the same pipeline test

## 2. Selection and the action bar

- [x] 2.1 Add a checkbox to every transaction row in the four relevant lists, delegated `.tx-select` change handling in `js/app.js` - verified by manual walkthrough (DOM-rendering logic; no dedicated unit test)
- [x] 2.2 Floating action bar (`#delete-bar`) with delete and clear-selection buttons, shown only once something is selected - verified by manual walkthrough

## 3. Delete

- [x] 3.1 `deleteButton` handler: add selected ids to `deletedTransactionIds`, persist via `preferences.js`, `recomputeState()` - verified by manual walkthrough and `tests/util.test.js`'s `applyTransactionOverrides` deletion tests
- [x] 3.2 Re-apply `deletedTransactionIds` on every upload via `applyTransactionOverrides()` so deletion survives a different, overlapping export - verified by manual walkthrough

## 4. Deduct

- [x] 4.1 Reveal the "Levonás..." action only when exactly one income and at least one expense are selected - verified by manual walkthrough
- [x] 4.2 Allocation panel: one row per selected expense, quick-fill buttons (smaller/bigger x full/half) and a percent-of-original control, main amount input capped to the expense's own remaining amount - verified by manual walkthrough
- [x] 4.3 Validation: block applying when the total allocated exceeds the income, or when nothing is allocated - verified by manual walkthrough
- [x] 4.4 Apply handler: shrink each expense via `transactionAdjustments`, delete the income if fully used or shrink it if partially used, `recomputeState()` - verified by manual walkthrough and `applyTransactionOverrides` adjustment tests

## 5. Deduction history and undo

- [x] 5.1 `renderDeductionHistory()`: group by expense, compute original amount and percent deducted via `originalAmountForExpense()`, scope to the selected month, drop fully-deducted expenses - verified by manual walkthrough
- [x] 5.2 Record `id`/`incomeId` on each new deduction-history entry - verified by manual walkthrough
- [x] 5.3 `undoDeductionEntry()`: reverse one entry's effect on its expense and recompute its income's state from the remaining entries - verified by manual walkthrough
- [x] 5.4 `migrateLegacyDeductionEntries()`: best-effort backfill of `id`/`incomeId` on pre-undo entries, only when unambiguous - verified by manual walkthrough

## 6. Layout

- [x] 6.1 Two-column (2/3-1/3) personal-view layout with the Levonások panel in the right column - verified by manual walkthrough

187 tests pass (`npm test`).

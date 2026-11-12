## 1. Aggregation logic

- [x] 1.1 Add a `jointOnly` option to `monthlySummary()` in js/aggregate.js (mirroring `categoryTotals()`'s convention: filter to `revolut-joint` items, use `amountHuf` instead of `personalAmountHuf`), default `false`, and verify `npm test` still passes with no change needed to existing calls
- [x] 1.2 Add tests in tests/aggregate.test.js for `monthlySummary` with `jointOnly: true` (income/spending/balance computed from full joint amounts, ignoring non-joint items) and verify the new tests pass

## 2. Joint monthly summary

- [x] 2.1 Add `#joint-summary` card to index.html's joint view (mirroring `#summary`'s markup/heading pattern) positioned above the contributors/deduction-history row
- [x] 2.2 Add `renderJointSummary()` in js/app.js calling `monthlySummary(state.items, jointMonthSelect.value, { jointOnly: true })`, rendered the same way `renderSummary()` renders `#summary-text`, and wire it into `renderJointView()` and `jointMonthSelect`'s `change` handler
- [x] 2.3 Verify manually in the browser: open the joint view, confirm the summary shows full (unhalved) joint totals matching the joint pie chart's total spending for that month, and that switching the joint month updates it - live-verified by the user

## 3. Deduction-history source scoping

- [x] 3.1 Add a `source` field to `findTransactionById()`'s return value in js/app.js and verify no existing caller breaks (`npm test` passes; manual check that the allocation panel and deduction-history's existing behavior are unchanged)
- [x] 3.2 Generalize `renderDeductionHistory()` to accept `{ month, container, jointOnly }`, filtering each expense group by whether `findTransactionById(expenseId).source === 'revolut-joint'` matches `jointOnly`
- [x] 3.3 Update every existing call site of the old no-argument `renderDeductionHistory()` (personal: `renderAll()`, `monthSelect`'s `change` handler, and anywhere else it's called after a delete/undo/allocation) to pass `{ month: monthSelect.value, container: deductionHistoryRowsEl, jointOnly: false }`, and verify `npm test` passes plus a manual check that the personal panel still shows personal deductions as before - tests pass (214/214); live-verified by the user

## 4. Joint deduction-history panel

- [x] 4.1 Add `#joint-deduction-history` aside and a `#joint-income-deduction-split` grid wrapper to index.html's joint view (mirroring `#income-deduction-split`/`#deduction-history`), pairing it with the contributors card the same way the personal view pairs income-sources with deduction-history
- [x] 4.2 Add the matching `#joint-income-deduction-split` CSS grid rule in css/style.css (copy of the existing `#income-deduction-split` rule, per design.md's ID-based-duplication decision)
- [x] 4.3 Call the generalized `renderDeductionHistory({ month: jointMonthSelect.value, container: jointDeductionHistoryRowsEl, jointOnly: true })` from `renderJointView()` and `jointMonthSelect`'s `change` handler
- [x] 4.4 Add a delegated click listener on the new joint deduction-history container for its own `.deduction-undo` buttons, calling the existing `undoDeductionEntry()` (same as the personal listener), and verify manually: deduct a joint expense, confirm the entry appears only in the joint panel (not the personal one) even when both months match, then undo it and confirm it disappears and the expense/income amounts are restored - live-verified by the user

## 5. Final verification

- [x] 5.1 Run `npm test` and verify the full suite passes (214/214)
- [x] 5.2 Manually tested the full flow in the browser - confirmed working by the user: the summary and deduction-history panel appear in the same relative layout as the personal view, a joint deduction shows only in the joint panel, undo restores it, and switching joint months updates both

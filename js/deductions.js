// Pure deduction-bookkeeping logic, extracted from js/app.js's DOM event
// handlers (the allocation panel's Apply button and the deduction-history
// panel's undo button) so the arithmetic itself - not just its rendering -
// has test coverage, the same separation applyTransactionOverrides already
// has in util.js. None of these functions touch the DOM or module-level
// state; each takes the relevant slice of state and returns a new one,
// without mutating its inputs.

// An expense's full magnitude before any deduction ever chipped away at
// it: its current (live, already-shrunk) remaining amount plus every
// deduction logged against it added back. `remaining`: the expense's
// current amount magnitude (already rounded/abs'd by the caller).
export function computeOriginalAmount(remaining, deductionHistory, expenseId) {
  const totalDeducted = deductionHistory.filter((e) => e.expenseId === expenseId).reduce((sum, e) => sum + e.amount, 0);
  return remaining + totalDeducted;
}

// Applies a new deduction, splitting `incomeAmount` across `allocations`
// ([{ expenseId, expenseDescription, amount }, ...] - a non-positive
// `amount` is ignored, same as the original inline logic skipping an
// empty row). Returns the new { deductionHistory, transactionAdjustments,
// deletedTransactionIds }, leaving the given state object's own fields
// untouched. `makeEntryId` generates each new log entry's id (defaults to
// crypto.randomUUID - injectable so a test can assert on exact entries
// without depending on a real random id).
export function applyDeduction(
  { deductionHistory, transactionAdjustments, deletedTransactionIds },
  { incomeId, incomeDescription, incomeAmount, allocations },
  { makeEntryId = () => crypto.randomUUID() } = {},
) {
  const newTransactionAdjustments = { ...transactionAdjustments };
  const newEntries = [];
  let totalAllocated = 0;

  for (const { expenseId, expenseDescription, amount } of allocations) {
    if (amount <= 0) continue;
    totalAllocated += amount;
    newTransactionAdjustments[expenseId] = (newTransactionAdjustments[expenseId] || 0) + amount;
    newEntries.push({ id: makeEntryId(), expenseId, expenseDescription, incomeId, incomeDescription, amount });
  }

  const newDeletedTransactionIds = new Set(deletedTransactionIds);
  if (totalAllocated >= incomeAmount) {
    // Fully used up (the caller already validates that allocations can't
    // exceed the income) - remove it the same way a plain delete does.
    newDeletedTransactionIds.add(incomeId);
  } else {
    // Only partially used - shrink the income by what got deducted from
    // it, rather than deleting it; it's still genuine income for the
    // remainder. A negative delta on a positive amount moves it toward
    // zero, the same "toward zero" rule applyTransactionOverrides uses
    // for an expense's positive delta.
    newTransactionAdjustments[incomeId] = (newTransactionAdjustments[incomeId] || 0) - totalAllocated;
  }

  return {
    deductionHistory: [...deductionHistory, ...newEntries],
    transactionAdjustments: newTransactionAdjustments,
    deletedTransactionIds: newDeletedTransactionIds,
  };
}

// Reverses exactly one logged deduction entry, independently of any other
// deduction - including other entries against the same expense or from the
// same income. Returns the unchanged state (by reference, so a caller can
// detect the no-op with `===`) when `entryId` doesn't match any entry.
export function undoDeduction({ deductionHistory, transactionAdjustments, deletedTransactionIds }, entryId) {
  const entry = deductionHistory.find((e) => e.id === entryId);
  if (!entry) return { deductionHistory, transactionAdjustments, deletedTransactionIds };

  const newDeductionHistory = deductionHistory.filter((e) => e.id !== entryId);
  const newTransactionAdjustments = { ...transactionAdjustments };

  newTransactionAdjustments[entry.expenseId] = (newTransactionAdjustments[entry.expenseId] || 0) - entry.amount;
  if (!newTransactionAdjustments[entry.expenseId]) delete newTransactionAdjustments[entry.expenseId];

  const newDeletedTransactionIds = new Set(deletedTransactionIds);
  newDeletedTransactionIds.delete(entry.incomeId);

  // The same income may have funded several expenses in one action, or
  // across separate actions - restore only this entry's share: fully, if
  // no other still-active entry also drew from that income; otherwise
  // leaving the income at whatever amount the remaining entries still
  // account for.
  const stillAllocated = newDeductionHistory.filter((e) => e.incomeId === entry.incomeId).reduce((sum, e) => sum + e.amount, 0);
  if (stillAllocated > 0) newTransactionAdjustments[entry.incomeId] = -stillAllocated;
  else delete newTransactionAdjustments[entry.incomeId];

  return { deductionHistory: newDeductionHistory, transactionAdjustments: newTransactionAdjustments, deletedTransactionIds: newDeletedTransactionIds };
}

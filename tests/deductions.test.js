import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeOriginalAmount, applyDeduction, undoDeduction } from '../js/deductions.js';

// Worked example from the teacher's HW6 feedback: 7000 remaining plus
// deductions of 2000 and 1000 is 10000 original; 30% of that is 3000 -
// this is exactly what the allocation panel's %-of-original quick-fill
// computes (originalAmount * pct / 100, see js/app.js).
test('computeOriginalAmount: 7000 remaining + 2000 + 1000 deducted = 10000 original (teacher-provided example)', () => {
  const deductionHistory = [
    { expenseId: 'rent', amount: 2000 },
    { expenseId: 'rent', amount: 1000 },
  ];
  const original = computeOriginalAmount(7000, deductionHistory, 'rent');
  assert.equal(original, 10000);
  assert.equal(Math.round((original * 30) / 100), 3000);
});

test('computeOriginalAmount ignores deductions logged against a different expense', () => {
  const deductionHistory = [
    { expenseId: 'rent', amount: 2000 },
    { expenseId: 'groceries', amount: 500 },
  ];
  assert.equal(computeOriginalAmount(7000, deductionHistory, 'rent'), 9000);
});

test('computeOriginalAmount with no deductions logged is just the remaining amount', () => {
  assert.equal(computeOriginalAmount(5000, [], 'rent'), 5000);
});

const EMPTY_STATE = () => ({ deductionHistory: [], transactionAdjustments: {}, deletedTransactionIds: new Set() });

test('applyDeduction splitting the full income across two expenses deletes the income and adjusts both expenses', () => {
  const ids = ['e1-entry', 'e2-entry'];
  let i = 0;
  const result = applyDeduction(
    EMPTY_STATE(),
    {
      incomeId: 'income1',
      incomeDescription: 'Salary',
      incomeAmount: 5000,
      allocations: [
        { expenseId: 'E1', expenseDescription: 'Rent', amount: 2000 },
        { expenseId: 'E2', expenseDescription: 'Utilities', amount: 3000 },
      ],
    },
    { makeEntryId: () => ids[i++] },
  );

  assert.equal(result.transactionAdjustments.E1, 2000);
  assert.equal(result.transactionAdjustments.E2, 3000);
  assert.ok(result.deletedTransactionIds.has('income1'));
  assert.equal(result.transactionAdjustments.income1, undefined);
  assert.deepEqual(result.deductionHistory, [
    { id: 'e1-entry', expenseId: 'E1', expenseDescription: 'Rent', incomeId: 'income1', incomeDescription: 'Salary', amount: 2000 },
    { id: 'e2-entry', expenseId: 'E2', expenseDescription: 'Utilities', incomeId: 'income1', incomeDescription: 'Salary', amount: 3000 },
  ]);
});

test('applyDeduction allocating less than the full income shrinks it instead of deleting it', () => {
  const result = applyDeduction(EMPTY_STATE(), {
    incomeId: 'income1',
    incomeDescription: 'Salary',
    incomeAmount: 5000,
    allocations: [{ expenseId: 'E1', expenseDescription: 'Rent', amount: 2000 }],
  });
  assert.equal(result.transactionAdjustments.income1, -2000);
  assert.ok(!result.deletedTransactionIds.has('income1'));
});

test('applyDeduction skips a non-positive allocation row', () => {
  const result = applyDeduction(EMPTY_STATE(), {
    incomeId: 'income1',
    incomeDescription: 'Salary',
    incomeAmount: 5000,
    allocations: [
      { expenseId: 'E1', expenseDescription: 'Rent', amount: 0 },
      { expenseId: 'E2', expenseDescription: 'Utilities', amount: -100 },
    ],
  });
  assert.equal(result.deductionHistory.length, 0);
  assert.equal(result.transactionAdjustments.E1, undefined);
});

test('applyDeduction does not mutate the state object it was given', () => {
  const state = EMPTY_STATE();
  applyDeduction(state, {
    incomeId: 'income1',
    incomeDescription: 'Salary',
    incomeAmount: 5000,
    allocations: [{ expenseId: 'E1', expenseDescription: 'Rent', amount: 2000 }],
  });
  assert.deepEqual(state.deductionHistory, []);
  assert.deepEqual(state.transactionAdjustments, {});
  assert.equal(state.deletedTransactionIds.size, 0);
});

// Worked example from the teacher's HW6 feedback: a 5000 income split
// 2000/3000 across two expenses (E1/E2); after undoing just the E1 entry,
// E1's adjustment should be gone, the income's adjustment should be
// -3000 (E2's share is still active), and the income should not be back
// in deletedTransactionIds (it's genuinely spent, not fully reinstated).
test('undoDeduction: undoing one of two entries against the same income restores only that entry\'s share (teacher-provided example)', () => {
  const ids = ['e1-entry', 'e2-entry'];
  let i = 0;
  const applied = applyDeduction(
    EMPTY_STATE(),
    {
      incomeId: 'income1',
      incomeDescription: 'Salary',
      incomeAmount: 5000,
      allocations: [
        { expenseId: 'E1', expenseDescription: 'Rent', amount: 2000 },
        { expenseId: 'E2', expenseDescription: 'Utilities', amount: 3000 },
      ],
    },
    { makeEntryId: () => ids[i++] },
  );
  // Sanity check on the starting point this undo acts on: the income was
  // fully allocated (2000 + 3000 = 5000), so applyDeduction deleted it.
  assert.ok(applied.deletedTransactionIds.has('income1'));

  const result = undoDeduction(applied, 'e1-entry');

  assert.equal(result.transactionAdjustments.E1, undefined);
  assert.equal(result.transactionAdjustments.income1, -3000);
  assert.ok(!result.deletedTransactionIds.has('income1'));
  assert.deepEqual(
    result.deductionHistory.map((e) => e.id),
    ['e2-entry'],
  );
});

test('undoDeduction: undoing an expense\'s only deduction entry fully restores it', () => {
  const applied = applyDeduction(EMPTY_STATE(), {
    incomeId: 'income1',
    incomeDescription: 'Salary',
    incomeAmount: 2000,
    allocations: [{ expenseId: 'E1', expenseDescription: 'Rent', amount: 2000 }],
  });
  const [entry] = applied.deductionHistory;

  const result = undoDeduction(applied, entry.id);

  assert.equal(result.transactionAdjustments.E1, undefined);
  assert.equal(result.transactionAdjustments.income1, undefined);
  assert.equal(result.deductionHistory.length, 0);
});

test('undoDeduction with an unknown entry id returns the same state unchanged', () => {
  const state = EMPTY_STATE();
  const result = undoDeduction(state, 'does-not-exist');
  assert.equal(result.deductionHistory, state.deductionHistory);
  assert.equal(result.transactionAdjustments, state.transactionAdjustments);
  assert.equal(result.deletedTransactionIds, state.deletedTransactionIds);
});

test('undoDeduction does not mutate the state object it was given', () => {
  const applied = applyDeduction(EMPTY_STATE(), {
    incomeId: 'income1',
    incomeDescription: 'Salary',
    incomeAmount: 2000,
    allocations: [{ expenseId: 'E1', expenseDescription: 'Rent', amount: 2000 }],
  });
  const historyBefore = applied.deductionHistory;
  undoDeduction(applied, applied.deductionHistory[0].id);
  assert.equal(applied.deductionHistory, historyBefore);
  assert.equal(applied.deductionHistory.length, 1);
});

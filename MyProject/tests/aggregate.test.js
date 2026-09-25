import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryTotals, pieEligibleRows, monthlySummary, monthlyTrend, incomeBySource } from '../js/aggregate.js';

function item(overrides) {
  return {
    source: 'otp',
    date: '2026-09-10',
    description: '',
    counterparty: '',
    category: 'Élelmiszer',
    amountHuf: -1000,
    personalAmountHuf: -1000,
    isFee: false,
    ...overrides,
  };
}

test('categoryTotals sums a category with only spending (signed, stays negative)', () => {
  const items = [item({ personalAmountHuf: -3000 }), item({ personalAmountHuf: -2000 })];
  const totals = categoryTotals(items, { month: '2026-09' });
  assert.equal(totals.get('Élelmiszer'), -5000);
});

test('categoryTotals nets a category with only a refund (signed, stays positive)', () => {
  const items = [item({ personalAmountHuf: 3000 })];
  const totals = categoryTotals(items, { month: '2026-09' });
  assert.equal(totals.get('Élelmiszer'), 3000);
});

test('categoryTotals nets spending and a smaller refund to a still-negative total', () => {
  const items = [item({ personalAmountHuf: -8000 }), item({ personalAmountHuf: 3000 })];
  const totals = categoryTotals(items, { month: '2026-09' });
  assert.equal(totals.get('Élelmiszer'), -5000);
});

test('categoryTotals nets spending and a larger refund to a non-negative total', () => {
  const items = [item({ personalAmountHuf: -2000 }), item({ personalAmountHuf: 5000 })];
  const totals = categoryTotals(items, { month: '2026-09' });
  assert.equal(totals.get('Élelmiszer'), 3000);
});

test('categoryTotals excludes Bevétel and respects the month filter', () => {
  const items = [
    item({ category: 'Bevétel', personalAmountHuf: 350000 }),
    item({ date: '2026-08-01', personalAmountHuf: -1000 }),
  ];
  const totals = categoryTotals(items, { month: '2026-09' });
  assert.equal(totals.size, 0);
});

test('categoryTotals with jointOnly uses full amountHuf, scoped to revolut-joint', () => {
  const items = [
    item({ source: 'revolut-joint', amountHuf: -6000, personalAmountHuf: -3000 }),
    item({ source: 'otp', amountHuf: -1000, personalAmountHuf: -1000 }),
  ];
  const totals = categoryTotals(items, { jointOnly: true });
  assert.equal(totals.get('Élelmiszer'), -6000);
});

test('pieEligibleRows excludes non-negative categories and sorts descending', () => {
  const totals = new Map([
    ['Élelmiszer', -5000],
    ['Sport', 2000],
    ['Orvos', -9000],
  ]);
  const rows = pieEligibleRows(totals);
  assert.deepEqual(rows, [
    { category: 'Orvos', value: 9000 },
    { category: 'Élelmiszer', value: 5000 },
  ]);
});

test('monthlySummary: a refund reduces total spending instead of adding to it', () => {
  const items = [
    item({ personalAmountHuf: -8000 }),
    item({ personalAmountHuf: 3000 }),
    item({ category: 'Bevétel', personalAmountHuf: 350000 }),
  ];
  const summary = monthlySummary(items, '2026-09');
  assert.equal(summary.spending, 5000);
  assert.equal(summary.income, 350000);
  assert.equal(summary.balance, 345000);
});

test('monthlyTrend nets per month rather than summing absolute values', () => {
  const items = [
    item({ date: '2026-08-05', personalAmountHuf: -4000 }),
    item({ date: '2026-09-05', personalAmountHuf: -8000 }),
    item({ date: '2026-09-06', personalAmountHuf: 3000 }),
  ];
  const trend = monthlyTrend(items, null);
  assert.deepEqual(trend, [
    ['2026-08', 4000],
    ['2026-09', 5000],
  ]);
});

test('incomeBySource groups repeated income from the same counterparty and sorts descending', () => {
  const items = [
    item({ category: 'Bevétel', counterparty: 'Employer Kft.', personalAmountHuf: 350000 }),
    item({ category: 'Bevétel', counterparty: 'Teszt Anna', personalAmountHuf: 5000 }),
    item({ category: 'Bevétel', counterparty: 'Teszt Anna', personalAmountHuf: 7000 }),
  ];
  const rows = incomeBySource(items, '2026-09');
  assert.deepEqual(rows, [
    ['Employer Kft.', 350000],
    ['Teszt Anna', 12000],
  ]);
});

test('incomeBySource combines the same person across banks despite accent/case/word-order differences', () => {
  const items = [
    item({ category: 'Bevétel', counterparty: 'Fikció Hanna', personalAmountHuf: 20000 }),
    item({ category: 'Bevétel', counterparty: 'hanna fikcio', personalAmountHuf: 5000 }),
  ];
  const rows = incomeBySource(items, '2026-09');
  assert.deepEqual(rows, [['Fikció Hanna', 25000]]);
});

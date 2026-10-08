import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractContributorName, isJointContribution, splitJointAmount, summarizeContributors, summarizeJointIncome } from '../js/jointAccount.js';

test('50% split of a joint expense', () => {
  assert.equal(splitJointAmount(-12000), -6000);
});

test('extracts a contributor name from "Átutalás tőle: <name>"', () => {
  assert.equal(extractContributorName('Átutalás tőle: T TIBI'), 'T TIBI');
  assert.equal(extractContributorName('Átutalás tőle: VARGA JUTKA'), 'VARGA JUTKA');
  assert.equal(extractContributorName('Lidl'), null);
});

test('summarizes contribution totals per contributor', () => {
  const transactions = [
    { source: 'revolut-joint', description: 'Átutalás tőle: T TIBI', amount: 20000 },
    { source: 'revolut-joint', description: 'Átutalás tőle: VARGA JUTKA', amount: 15000 },
    { source: 'revolut-joint', description: 'Átutalás tőle: T TIBI', amount: 5000 },
    { source: 'revolut-joint', description: 'Lidl', amount: -3000 },
  ];
  const totals = summarizeContributors(transactions);
  assert.equal(totals.get('T TIBI'), 25000);
  assert.equal(totals.get('VARGA JUTKA'), 15000);
  assert.equal(isJointContribution(transactions[0]), true);
  assert.equal(isJointContribution(transactions[3]), false);
});

test('the same contributor combines into one row even with accent/case/word-order differences', () => {
  const transactions = [
    { source: 'revolut-joint', description: 'Átutalás tőle: Fikció Hanna', amount: 20000 },
    { source: 'revolut-joint', description: 'Átutalás tőle: hanna fikcio', amount: 5000 },
  ];
  const totals = summarizeContributors(transactions);
  assert.equal(totals.size, 1);
  assert.equal([...totals.values()][0], 25000);
});

test('summarizeJointIncome includes a named contributor and a non-"tőle" top-up, not just named transfers', () => {
  const transactions = [
    { source: 'revolut-joint', date: '2026-09-10', description: 'Átutalás tőle: T TIBI', counterparty: 'T TIBI', amount: 20000 },
    { source: 'revolut-joint', date: '2026-09-12', description: 'Apple Pay összegű feltöltés a(z) *6052 eszközödön', counterparty: 'Apple Pay összegű feltöltés a(z) *6052 eszközödön', amount: 15000 },
    { source: 'revolut-joint', date: '2026-09-15', description: 'Lidl', counterparty: 'Lidl', amount: -3000 },
  ];
  const rows = summarizeJointIncome(transactions, '2026-09');
  assert.deepEqual(rows, [
    ['T TIBI', 20000],
    ['Apple Pay összegű feltöltés a(z) *6052 eszközödön', 15000],
  ]);
});

test('summarizeJointIncome groups the same contributor written differently into one row', () => {
  const transactions = [
    { source: 'revolut-joint', date: '2026-09-10', description: 'Átutalás tőle: Fikció Hanna', counterparty: 'Fikció Hanna', amount: 20000 },
    { source: 'revolut-joint', date: '2026-09-14', description: 'Átutalás tőle: hanna fikcio', counterparty: 'hanna fikcio', amount: 5000 },
  ];
  const rows = summarizeJointIncome(transactions, '2026-09');
  assert.deepEqual(rows, [['Fikció Hanna', 25000]]);
});

test('summarizeJointIncome only includes the selected month, not every month', () => {
  const transactions = [
    { source: 'revolut-joint', date: '2026-09-10', description: 'Átutalás tőle: T TIBI', counterparty: 'T TIBI', amount: 20000 },
    { source: 'revolut-joint', date: '2026-10-05', description: 'Átutalás tőle: T TIBI', counterparty: 'T TIBI', amount: 9000 },
  ];
  assert.deepEqual(summarizeJointIncome(transactions, '2026-09'), [['T TIBI', 20000]]);
  assert.deepEqual(summarizeJointIncome(transactions, '2026-10'), [['T TIBI', 9000]]);
});

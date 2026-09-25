import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractContributorName, isJointContribution, splitJointAmount, summarizeContributors } from '../js/jointAccount.js';

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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectSelfTransferIndices } from '../js/selfTransfer.js';

test('excludes an OTP-to-Revolut top-up pair (same amount, same date, opposite sign)', () => {
  const transactions = [
    { source: 'otp', date: '2026-09-18', amount: -5000, currency: 'HUF', description: 'Revolut**2024*' },
    { source: 'revolut-hu', date: '2026-09-18', amount: 5000, currency: 'HUF', description: 'Feltöltés' },
    { source: 'otp', date: '2026-09-10', amount: -4500, currency: 'HUF', description: 'SPAR' },
  ];
  const excluded = detectSelfTransferIndices(transactions, {});
  assert.equal(excluded.has(0), true);
  assert.equal(excluded.has(1), true);
  assert.equal(excluded.has(2), false);
});

test('excludes a Revolut-to-own-name transfer', () => {
  const transactions = [
    { source: 'revolut-hu', date: '2026-09-09', amount: -20000, currency: 'HUF', description: 'Átutalás neki: FIKCIÓ HANNA' },
    { source: 'revolut-hu', date: '2026-09-12', amount: -3000, currency: 'HUF', description: 'Lidl' },
  ];
  const excluded = detectSelfTransferIndices(transactions, { ownerName: 'Fikció Hanna' });
  assert.equal(excluded.has(0), true);
  assert.equal(excluded.has(1), false);
});

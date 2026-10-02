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

test('regression: still matches when the export strips accents from the owner name and/or "átutalás"', () => {
  const transactions = [
    { source: 'revolut-hu', date: '2026-09-09', amount: -20000, currency: 'HUF', description: 'Atutalas neki: FIKCIO HANNA' },
  ];
  const excluded = detectSelfTransferIndices(transactions, { ownerName: 'Fikció Hanna' });
  assert.equal(excluded.has(0), true);
});

test('excludes any mention of the owner\'s given name, not just an "Átutalás neki:" pattern, on either side', () => {
  const transactions = [
    // No "átutalás" at all, own name only in counterparty - e.g. an OTP
    // transfer funding the user's own joint account.
    { source: 'otp', date: '2026-09-05', amount: -20000, currency: 'HUF', description: 'ÁTVEZETÉS', counterparty: 'Fikció Hanna' },
    // Own name in description, accent-stripped, mixed case.
    { source: 'revolut-joint', date: '2026-09-06', amount: -8000, currency: 'HUF', description: 'hanna FIKCIO kozos szamla' },
    // A real merchant - must not be caught.
    { source: 'otp', date: '2026-09-07', amount: -3000, currency: 'HUF', description: 'VÁSÁRLÁS KÁRTYÁVAL', counterparty: 'SPAR' },
  ];
  const excluded = detectSelfTransferIndices(transactions, { ownerName: 'Fikció Hanna' });
  assert.equal(excluded.has(0), true);
  assert.equal(excluded.has(1), true);
  assert.equal(excluded.has(2), false);
});

test('does not exclude an incoming (positive-amount) transaction just because it names the owner, e.g. a salary memo', () => {
  const transactions = [
    { source: 'otp', date: '2026-09-10', amount: 350000, currency: 'HUF', description: 'MUNKABÉR ÁTUTALÁS MUN Fikció Hanna', counterparty: '' },
  ];
  const excluded = detectSelfTransferIndices(transactions, { ownerName: 'Fikció Hanna' });
  assert.equal(excluded.has(0), false);
});

test('matching the surname alone ("Karácsony", which also means "Christmas") would false-positive, so only the given name is used', () => {
  const transactions = [
    { source: 'otp', date: '2026-09-08', amount: -5000, currency: 'HUF', description: 'KARÁCSONYI VÁSÁR', counterparty: '' },
  ];
  const excluded = detectSelfTransferIndices(transactions, { ownerName: 'Fikció Hanna' });
  assert.equal(excluded.has(0), false);
});

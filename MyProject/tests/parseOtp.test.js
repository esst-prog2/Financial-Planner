import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOtpSheet } from '../js/parseOtp.js';
import { MissingColumnError } from '../js/util.js';

function reportHeaderBlock() {
  // 14 rows standing in for the real "Számlatörténet" report metadata block.
  return Array.from({ length: 14 }, (_, i) => [`meta row ${i + 1}`]);
}

function fixtureRows() {
  return [
    ...reportHeaderBlock(),
    ['Számlaszám', 'Ellenoldali számla', 'Ellenoldali név', 'Forgalom típusa', 'Közlemény', 'Tranzakció kategória', 'Banki azonosító', 'Tranzakció idő', 'Könyvelt', 'Összeg', 'Devizanem'],
    ['', '', 'SPAR MAGYARORSZAG KFT.', 'VÁSÁRLÁS KÁRTYÁVAL', '', 'Bevásárlás', '1', '2026.09.10 15:49:08', 'x', -4500, 'HUF'],
    ['', '', '', 'MUNKABÉR ÁTUTALÁS', 'MUN Fikció Hanna', 'Egyéb', '2', '2026.09.10 13:59:00', 'x', 350000, 'HUF'],
  ];
}

test('parses OTP transaction rows starting after the fixed 14-row report header', () => {
  const transactions = parseOtpSheet(fixtureRows());
  assert.equal(transactions.length, 2);
  assert.equal(transactions[0].source, 'otp');
  assert.equal(transactions[0].date, '2026-09-10');
  assert.equal(transactions[0].amount, -4500);
  assert.equal(transactions[0].currency, 'HUF');
  assert.match(transactions[0].description, /SPAR MAGYARORSZAG/);
  assert.equal(transactions[0].counterparty, 'SPAR MAGYARORSZAG KFT.');
});

test('counterparty falls back to an empty string when Ellenoldali név is blank', () => {
  const [, salary] = parseOtpSheet(fixtureRows());
  assert.equal(salary.counterparty, '');
});

test('throws MissingColumnError when a required column is absent', () => {
  const rows = [
    ...reportHeaderBlock(),
    ['Számlaszám', 'Ellenoldali név', 'Forgalom típusa', 'Összeg', 'Devizanem'], // no "Tranzakció idő"
    ['', 'SPAR', 'VÁSÁRLÁS', -100, 'HUF'],
  ];
  assert.throws(() => parseOtpSheet(rows), MissingColumnError);
});

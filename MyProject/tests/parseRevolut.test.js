import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRevolutSheet } from '../js/parseRevolut.js';
import { MissingColumnError } from '../js/util.js';

const HEADER = ['Típus', 'Termék', 'Kezdés dátuma', 'Teljesítés dátuma', 'Leírás', 'Összeg', 'Díj', 'Pénznem', 'State', 'Egyenleg'];

test('parses Revolut rows and tags them with their source account', () => {
  const rows = [
    HEADER,
    ['Kártyás fizetés', 'Folyószámla', '2026.09.01 18:14', '2026.09.02 13:14', 'Gyn Obs', -12000, 0, 'HUF', 'ELVÉGEZVE', 238000],
  ];
  const [tx] = parseRevolutSheet(rows, 'revolut-hu');
  assert.equal(tx.source, 'revolut-hu');
  assert.equal(tx.description, 'Gyn Obs');
  assert.equal(tx.amount, -12000);
  assert.equal(tx.currency, 'HUF');
});

test('canonical date uses "Kezdés dátuma", not "Teljesítés dátuma"', () => {
  const rows = [
    HEADER,
    ['Kártyás fizetés', 'Folyószámla', '2026.09.01 18:14', '2026.09.02 13:14', 'Gyn Obs', -12000, 0, 'HUF', 'ELVÉGEZVE', 238000],
  ];
  const [tx] = parseRevolutSheet(rows, 'revolut-hu');
  assert.equal(tx.date, '2026-09-01');
});

test('counterparty is extracted from an "Átutalás tőle:" pattern', () => {
  const rows = [
    HEADER,
    ['Átutalás', 'Folyószámla', '2026.09.05 10:43', '2026.09.05 10:53', 'Átutalás tőle: T TIBI', 20000, 0, 'HUF', 'ELVÉGEZVE', ''],
  ];
  const [tx] = parseRevolutSheet(rows, 'revolut-hu');
  assert.equal(tx.counterparty, 'T TIBI');
});

test('counterparty is extracted from an "Átutalás neki:" pattern', () => {
  const rows = [
    HEADER,
    ['Átutalás', 'Folyószámla', '2026.09.05 10:43', '2026.09.05 10:53', 'Átutalás neki: Landlord Kft.', -20000, 0, 'HUF', 'ELVÉGEZVE', ''],
  ];
  const [tx] = parseRevolutSheet(rows, 'revolut-hu');
  assert.equal(tx.counterparty, 'Landlord Kft.');
});

test('counterparty falls back to the raw description when no transfer pattern matches', () => {
  const rows = [
    HEADER,
    ['Kártyás fizetés', 'Folyószámla', '2026.09.01 18:14', '2026.09.02 13:14', 'Gyn Obs', -12000, 0, 'HUF', 'ELVÉGEZVE', 238000],
  ];
  const [tx] = parseRevolutSheet(rows, 'revolut-hu');
  assert.equal(tx.counterparty, 'Gyn Obs');
});

test('throws MissingColumnError when a required column is absent', () => {
  const rows = [
    ['Típus', 'Leírás', 'Összeg'], // no "Kezdés dátuma" / "Pénznem"
    ['Kártyás fizetés', 'Gyn Obs', -12000],
  ];
  assert.throws(() => parseRevolutSheet(rows, 'revolut-hu'), MissingColumnError);
});

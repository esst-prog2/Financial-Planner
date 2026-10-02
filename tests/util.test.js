import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toIsoDate, normalizeText, normalizeNameForGrouping, resolveSheetName } from '../js/util.js';

test('parses a text-formatted date (bank export style)', () => {
  assert.equal(toIsoDate('2026.09.10 15:49:08'), '2026-09-10');
});

test('parses a JS Date instance (SheetJS with cellDates: true)', () => {
  assert.equal(toIsoDate(new Date(Date.UTC(2026, 8, 10))), '2026-09-10');
});

test('parses a raw Excel date serial number (SheetJS without cellDates, or a non-date-formatted cell)', () => {
  // 2024-01-01 is serial 45292 under Excel's day-0-is-1899-12-30 scheme.
  const serial = (Date.UTC(2024, 0, 1) - Date.UTC(1899, 11, 30)) / 86400000;
  assert.equal(toIsoDate(serial), '2024-01-01');
});

test('regression: a raw Excel serial must not be misread as a millisecond timestamp landing on 1970-01-01', () => {
  const serial = (Date.UTC(2026, 8, 10) - Date.UTC(1899, 11, 30)) / 86400000;
  const result = toIsoDate(serial);
  assert.notEqual(result, '1970-01-01');
  assert.equal(result, '2026-09-10');
});

test('returns null for empty/missing values', () => {
  assert.equal(toIsoDate(''), null);
  assert.equal(toIsoDate(null), null);
  assert.equal(toIsoDate(undefined), null);
});

test('normalizeText strips accents and lowercases, so accent-stripped and accented forms match', () => {
  assert.equal(normalizeText('Müller'), normalizeText('Muller'));
  assert.equal(normalizeText('Pékség'), normalizeText('Pekseg'));
  assert.equal(normalizeText('ÁRVÍZTŰRŐ TÜKÖRFÚRÓGÉP'), normalizeText('arvizturo tukorfurogep'));
});

test('normalizeText handles empty/missing values without throwing', () => {
  assert.equal(normalizeText(''), '');
  assert.equal(normalizeText(null), '');
  assert.equal(normalizeText(undefined), '');
});

test('normalizeNameForGrouping treats accent, case, and word-order variants as the same name', () => {
  assert.equal(normalizeNameForGrouping('Fikció Hanna'), normalizeNameForGrouping('hanna fikcio'));
  assert.equal(normalizeNameForGrouping('Fikció Hanna'), normalizeNameForGrouping('FIKCIO HANNA'));
  assert.notEqual(normalizeNameForGrouping('Fikció Hanna'), normalizeNameForGrouping('Minta Anna'));
});

test('resolveSheetName finds the canonical name directly when present', () => {
  assert.equal(resolveSheetName(['otp', 'rev-hu', 'rev-eur'], 'rev-hu'), 'rev-hu');
});

test('resolveSheetName falls back to a known alias (rev-huf for rev-hu)', () => {
  assert.equal(resolveSheetName(['otp', 'rev-huf', 'rev-eur'], 'rev-hu'), 'rev-huf');
});

test('resolveSheetName returns null when neither the canonical name nor an alias is present', () => {
  assert.equal(resolveSheetName(['otp', 'rev-eur'], 'rev-hu'), null);
});

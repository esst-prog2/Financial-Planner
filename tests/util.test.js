import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toIsoDate, normalizeText, normalizeNameForGrouping, resolveSheetName, formatHuf, assignTransactionIds, applyTransactionOverrides } from '../js/util.js';

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

test('formatHuf rounds to whole forints instead of leaking float fraction digits', () => {
  assert.equal(formatHuf(896611.0660000001), '896 611');
});

test('formatHuf still groups a clean integer amount with thousands separators', () => {
  assert.equal(formatHuf(341715), '341 715');
});

test('assignTransactionIds gives distinct transactions distinct, stable ids', () => {
  const [a, b] = assignTransactionIds([
    { source: 'otp', date: '2026-01-05', description: 'Tesco', amount: -4500, currency: 'HUF' },
    { source: 'otp', date: '2026-01-06', description: 'Spar', amount: -2200, currency: 'HUF' },
  ]);
  assert.notEqual(a.id, b.id);
  assert.ok(a.id);
  assert.ok(b.id);
});

test('assignTransactionIds gives the same ordered input the same ids every time (stable across separate parses of the same rows)', () => {
  const rows = [
    { source: 'revolut-joint', date: '2026-02-01', description: 'Kartyas vasarlas', amount: -3000, currency: 'HUF' },
    { source: 'revolut-joint', date: '2026-02-03', description: 'Kartyas vasarlas', amount: -1500, currency: 'HUF' },
  ];
  const first = assignTransactionIds(rows);
  const second = assignTransactionIds(rows);
  assert.deepEqual(
    first.map((t) => t.id),
    second.map((t) => t.id),
  );
});

test('assignTransactionIds disambiguates two genuinely identical-looking rows (same merchant, date and amount) by occurrence order', () => {
  const [first, second] = assignTransactionIds([
    { source: 'otp', date: '2026-01-05', description: 'Kavezo', amount: -890, currency: 'HUF' },
    { source: 'otp', date: '2026-01-05', description: 'Kavezo', amount: -890, currency: 'HUF' },
  ]);
  assert.notEqual(first.id, second.id);
});

test('applyTransactionOverrides drops any transaction whose id is in deletedIds', () => {
  const transactions = [
    { id: 'a', amount: 100 },
    { id: 'b', amount: 200 },
  ];
  const result = applyTransactionOverrides(transactions, { deletedIds: new Set(['a']) });
  assert.deepEqual(result.map((t) => t.id), ['b']);
});

test('applyTransactionOverrides adds the adjustment back to a negative expense, moving it toward zero', () => {
  const transactions = [{ id: 'rent', amountHuf: -200000, personalAmountHuf: -200000 }];
  const [result] = applyTransactionOverrides(transactions, { adjustments: { rent: 100000 } });
  assert.equal(result.amountHuf, -100000);
  assert.equal(result.personalAmountHuf, -100000);
});

test('applyTransactionOverrides leaves a transaction with no matching deletion or adjustment unchanged', () => {
  const transactions = [{ id: 'x', amount: -500 }];
  const [result] = applyTransactionOverrides(transactions, { deletedIds: new Set(['other']), adjustments: { other: 50 } });
  assert.equal(result.amount, -500);
});

test('applyTransactionOverrides only touches fields the transaction actually has', () => {
  const [raw] = applyTransactionOverrides([{ id: 'r', amount: -1000 }], { adjustments: { r: 200 } });
  assert.equal(raw.amount, -800);
  assert.ok(!('amountHuf' in raw));
});

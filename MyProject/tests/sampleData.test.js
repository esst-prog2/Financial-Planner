import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSampleWorkbookData } from '../js/sampleData.js';
import { parseOtpSheet } from '../js/parseOtp.js';
import { parseRevolutSheet } from '../js/parseRevolut.js';
import { categorizeTransaction } from '../js/categorize.js';

const REV_SHEETS = ['rev-eur', 'rev-hu', 'rev-joint'];

test('generates the same 4 sheets and columns as the real export, with no template placeholders leaking into the OTP header rows only', () => {
  const data = generateSampleWorkbookData({ seed: 42 });
  assert.deepEqual(Object.keys(data).sort(), ['otp', 'rev-eur', 'rev-hu', 'rev-joint'].sort());

  const otpHeaderRow = data.otp[14];
  assert.deepEqual(otpHeaderRow, ['Számlaszám', 'Ellenoldali számla', 'Ellenoldali név', 'Forgalom típusa', 'Közlemény', 'Tranzakció kategória', 'Banki azonosító', 'Tranzakció idő', 'Könyvelt', 'Összeg', 'Devizanem']);

  for (const name of REV_SHEETS) {
    assert.deepEqual(data[name][0], ['Típus', 'Termék', 'Kezdés dátuma', 'Teljesítés dátuma', 'Leírás', 'Összeg', 'Díj', 'Pénznem', 'State', 'Egyenleg']);
  }
});

test('parses cleanly with the real parsers (no real data - just structural output)', () => {
  const data = generateSampleWorkbookData({ seed: 7 });
  assert.doesNotThrow(() => parseOtpSheet(data.otp));
  for (const name of REV_SHEETS) {
    assert.doesNotThrow(() => parseRevolutSheet(data[name], name));
  }
});

test('every transaction row has a non-empty Összeg, and every Revolut row has a non-empty Egyenleg', () => {
  const data = generateSampleWorkbookData({ seed: 99 });

  const otpTransactions = parseOtpSheet(data.otp);
  assert.ok(otpTransactions.length > 0);
  assert.ok(otpTransactions.every((t) => typeof t.amount === 'number' && t.amount !== 0));

  for (const name of REV_SHEETS) {
    const rows = data[name].slice(1);
    assert.ok(rows.length > 0);
    const egyenlegIndex = data[name][0].indexOf('Egyenleg');
    const osszegIndex = data[name][0].indexOf('Összeg');
    assert.ok(rows.every((r) => r[osszegIndex] !== '' && r[osszegIndex] !== undefined));
    assert.ok(rows.every((r) => r[egyenlegIndex] !== '' && r[egyenlegIndex] !== undefined));
  }
});

test('mixes recurring (multi-row) and one-off (single-row) merchant/person names', () => {
  const data = generateSampleWorkbookData({ seed: 3, days: 60 });
  const descriptions = [
    ...parseOtpSheet(data.otp).map((t) => t.description),
    ...REV_SHEETS.flatMap((name) => parseRevolutSheet(data[name], name).map((t) => t.description)),
  ];
  const counts = new Map();
  for (const d of descriptions) counts.set(d, (counts.get(d) || 0) + 1);

  const repeated = [...counts.values()].some((c) => c > 1);
  const oneOff = [...counts.values()].some((c) => c === 1);
  assert.ok(repeated, 'expected at least one name to repeat');
  assert.ok(oneOff, 'expected at least one one-off name');
});

test('generated spending descriptions actually categorize as intended, not just Egyéb fallback', () => {
  const data = generateSampleWorkbookData({ seed: 11, days: 60 });
  const spendingRows = [
    ...parseOtpSheet(data.otp),
    ...REV_SHEETS.flatMap((name) => parseRevolutSheet(data[name], name)),
  ].filter((t) => t.amount < 0 && !t.description.includes('KÉSZPÉNZFELVÉT') && !t.description.includes('Revolut**2024*'));

  const miscategorized = spendingRows.filter((t) => categorizeTransaction(t) === 'Egyéb');
  assert.deepEqual(
    miscategorized.map((t) => t.description),
    [],
    'every generated merchant name should contain a keyword for its intended category',
  );
});

test('the two joint-account contributors pay in exactly the same total amount', () => {
  const data = generateSampleWorkbookData({ seed: 5, days: 60 });
  const jointTransactions = parseRevolutSheet(data['rev-joint'], 'revolut-joint');

  const totals = new Map();
  for (const t of jointTransactions) {
    const match = t.description.match(/Átutalás tőle: (.+)/);
    if (!match) continue;
    totals.set(match[1], (totals.get(match[1]) || 0) + t.amount);
  }

  assert.equal(totals.size, 2, 'expected exactly two contributors');
  const [a, b] = [...totals.values()];
  assert.equal(a, b);
});

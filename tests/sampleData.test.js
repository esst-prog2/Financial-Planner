import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSampleWorkbookData, MERCHANTS, OWNER_NAME } from '../js/sampleData.js';
import { parseOtpSheet } from '../js/parseOtp.js';
import { parseRevolutSheet } from '../js/parseRevolut.js';
import { categorizeTransaction } from '../js/categorize.js';
import { buildLineItems } from '../js/pipeline.js';

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

test('every merchant name in the sample pools categorizes into its own category', () => {
  for (const [category, { recurring, oneOff }] of Object.entries(MERCHANTS)) {
    for (const name of [...recurring, ...oneOff]) {
      const asCardPayment = { description: `VÁSÁRLÁS KÁRTYÁVAL ${name}`, counterparty: name, amount: -1000 };
      const asRevolutRow = { description: name, counterparty: name, amount: -1000 };
      assert.equal(categorizeTransaction(asCardPayment), category, `${name} (card payment)`);
      assert.equal(categorizeTransaction(asRevolutRow), category, `${name} (Revolut row)`);
    }
  }
});

test('one-off merchants appear at most once, across the whole workbook', () => {
  const data = generateSampleWorkbookData({ seed: 21, days: 90 });
  const descriptions = [
    ...parseOtpSheet(data.otp).map((t) => t.counterparty),
    ...REV_SHEETS.flatMap((name) => parseRevolutSheet(data[name], name).map((t) => t.description)),
  ];
  for (const { oneOff } of Object.values(MERCHANTS)) {
    for (const name of oneOff) {
      const count = descriptions.filter((d) => d === name).length;
      assert.ok(count <= 1, `${name} appeared ${count} times`);
    }
  }
});

test('through the full pipeline, only the bank charge and a currency-exchange fee land in Egyéb', () => {
  const data = generateSampleWorkbookData({ seed: 11, days: 60 });
  const items = buildLineItems(data, { ownerName: OWNER_NAME });

  const egyeb = items.filter((i) => i.category === 'Egyéb');
  assert.ok(egyeb.length > 0, 'expected the bank charge to be present');
  assert.deepEqual(
    egyeb.filter((i) => !i.description.includes('ESETI MEGBÍZÁSOK') && !(i.isFee && i.description.includes('Devizaváltás'))),
    [],
  );
});

test("internal movements between the user's own accounts never show up as spending or income", () => {
  const data = generateSampleWorkbookData({ seed: 2026, days: 45 });
  const rawTransactions = [
    ...parseOtpSheet(data.otp),
    ...REV_SHEETS.flatMap((name) => parseRevolutSheet(data[name], name)),
  ];
  // The sample really contains each kind of internal movement...
  assert.ok(rawTransactions.some((t) => t.description.includes('Devizaváltás')), 'expected a currency exchange');
  assert.ok(rawTransactions.some((t) => t.counterparty === 'PERSELY SZÁMLA' && t.amount > 0), 'expected money returning from the piggy bank');
  assert.ok(rawTransactions.some((t) => t.source === 'otp' && t.counterparty.startsWith('Revolut*')), 'expected OTP <-> Revolut transfers');

  // ...and none of them survives into the line items (a fee on an exchange
  // is the one thing that still counts, as its own Egyéb line).
  const items = buildLineItems(data, { ownerName: OWNER_NAME });
  assert.deepEqual(items.filter((i) => i.description.includes('Devizaváltás') && !i.isFee), []);
  assert.deepEqual(items.filter((i) => i.counterparty === 'PERSELY SZÁMLA' && i.amountHuf > 0), []);
  assert.deepEqual(items.filter((i) => i.counterparty.startsWith('Revolut*')), []);
});

test('the currency exchange shows up on both the EUR and the HUF sheet, in both directions', () => {
  const data = generateSampleWorkbookData({ seed: 2026, days: 45 });
  for (const name of ['rev-eur', 'rev-hu']) {
    const exchanges = parseRevolutSheet(data[name], name).filter((t) => t.description.includes('Devizaváltás'));
    assert.ok(exchanges.some((t) => t.amount > 0), `${name}: expected an incoming side`);
    assert.ok(exchanges.some((t) => t.amount < 0), `${name}: expected an outgoing side`);
  }
});

test('person-to-person transfers, rent, salary and refunds land in the intended categories', () => {
  const data = generateSampleWorkbookData({ seed: 2026, days: 45 });
  const items = buildLineItems(data, { ownerName: OWNER_NAME });
  const of = (category) => items.filter((i) => i.category === category);

  assert.ok(of('Utalás').length > 0, 'expected outgoing transfers to people');
  assert.ok(of('Utalás').every((i) => i.amountHuf < 0));
  assert.ok(of('Számlák/előfizetés').some((i) => i.description.includes('Havi Lakbér')), 'expected rent');
  assert.ok(of('Szolgáltatások').some((i) => i.description.includes('Fodrász')), 'expected the hairdresser transfer');

  const income = of('Bevétel');
  assert.ok(income.some((i) => i.counterparty === 'Minta Munkáltató Kft.' && i.amountHuf === 380000), 'expected the salary');
  assert.ok(income.some((i) => i.counterparty !== 'Minta Munkáltató Kft.'), 'expected income from a person');

  const refunds = items.filter((i) => i.description.includes('VISSZATÉRÍTÉS'));
  assert.ok(refunds.length > 0, 'expected at least one refund');
  assert.ok(refunds.every((i) => i.amountHuf > 0 && i.category !== 'Bevétel'));
});

test('the Revolut balance never goes negative', () => {
  const data = generateSampleWorkbookData({ seed: 2026, days: 45 });
  for (const name of REV_SHEETS) {
    const egyenlegIndex = data[name][0].indexOf('Egyenleg');
    assert.ok(data[name].slice(1).every((r) => r[egyenlegIndex] >= 0), `${name} went negative`);
  }
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

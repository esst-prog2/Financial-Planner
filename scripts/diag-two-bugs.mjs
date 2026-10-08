// Throwaway diagnostic, not committed to the repo's test suite. Answers two
// specific questions about one real export without printing out the whole
// file: (1) why does the salary row disappear entirely, (2) why does a
// "Madal Cafe" line show up with an amount that isn't in the source file.
import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';
import { buildLineItems } from '../js/pipeline.js';
import { detectSelfTransferIndices } from '../js/selfTransfer.js';
import { parseOtpSheet } from '../js/parseOtp.js';
import { parseRevolutSheet } from '../js/parseRevolut.js';
import { resolveSheetName } from '../js/util.js';

const [, , inputPath, ownerName = ''] = process.argv;
if (!inputPath) {
  console.error('Usage: node scripts/diag-two-bugs.mjs <export.xlsx> [ownerName]');
  process.exit(1);
}

const workbook = XLSX.read(readFileSync(inputPath), { type: 'buffer' });
const CANONICAL = ['otp', 'rev-eur', 'rev-hu', 'rev-joint'];
const sheets = {};
for (const name of CANONICAL) {
  const actual = resolveSheetName(workbook.SheetNames, name);
  sheets[name] = actual ? XLSX.utils.sheet_to_json(workbook.Sheets[actual], { header: 1, raw: true }) : [];
}

// --- Question 1: the salary ---
const raw = [
  ...parseOtpSheet(sheets.otp),
  ...parseRevolutSheet(sheets['rev-eur'], 'revolut-eur'),
  ...parseRevolutSheet(sheets['rev-hu'], 'revolut-hu'),
  ...parseRevolutSheet(sheets['rev-joint'], 'revolut-joint'),
];

const salaryCandidates = raw
  .map((t, i) => ({ t, i }))
  .filter(({ t }) => t.source === 'otp' && t.amount > 100000); // salary-sized OTP credits

const excluded = detectSelfTransferIndices(raw, { ownerName });

console.log('--- Q1: large OTP credits (salary-sized) ---');
const items = buildLineItems(sheets, { ownerName });
for (const { t, i } of salaryCandidates) {
  const isExcluded = excluded.has(i);
  let pairedWith = null;
  if (isExcluded) {
    pairedWith = raw.find(
      (b, j) => j !== i && b.source !== 'otp' && b.date === t.date && b.currency === t.currency && Math.abs(b.amount) === Math.abs(t.amount) && Math.sign(b.amount) !== Math.sign(t.amount),
    );
  }
  const matchingItem = items.find((it) => it.source === 'otp' && it.date === t.date && it.amountHuf === t.amount);
  console.log({
    date: t.date,
    amount: t.amount,
    excludedAsSelfTransfer: isExcluded,
    pairedAgainst: pairedWith ? { source: pairedWith.source, date: pairedWith.date, amount: pairedWith.amount } : null,
    foundInLineItems: Boolean(matchingItem),
    lineItemCategory: matchingItem ? matchingItem.category : null,
    monthOfDate: t.date ? t.date.slice(0, 7) : null,
  });
}

// --- Question 2: Madal Cafe ---
console.log('\n--- Q2: every raw row and every line item mentioning "Madal" ---');
const madalRaw = raw.filter((t) => `${t.description} ${t.counterparty}`.toLowerCase().includes('madal'));
console.log('raw rows:', madalRaw.map((t) => ({ source: t.source, date: t.date, amount: t.amount, currency: t.currency, fee: t.fee })));

const madalItems = items.filter((i) => `${i.description} ${i.counterparty}`.toLowerCase().includes('madal'));
console.log('line items:', madalItems.map((i) => ({ source: i.source, date: i.date, category: i.category, amountHuf: i.amountHuf, personalAmountHuf: i.personalAmountHuf, isFee: i.isFee })));

// --- Question 3: Apple Pay top-up(s) wrongly counted as income ---
console.log('\n--- Q3: "feltöltés ... eszközödön" rows ---');
const topupRaw = raw.filter((t) => /eszközödön/i.test(t.description));
console.log('raw:', topupRaw.map((t) => ({ source: t.source, date: t.date, amount: t.amount, currency: t.currency })));
const topupItems = items.filter((i) => /eszközödön/i.test(i.description));
console.log('line items:', topupItems.map((i) => ({ source: i.source, date: i.date, category: i.category, amountHuf: i.amountHuf })));

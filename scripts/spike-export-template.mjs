// Dev-only, not part of the browser app. Step 1 of the keyword-
// generalization spike (see PLANNING_LOG.md): turns a real bank export for
// a month NOT covered by Kategoriak_v2.pdf into a CSV you hand-label.
//
// Usage: node scripts/spike-export-template.mjs <your-real-export.xlsx> [output.csv]
//
// The input file and the output CSV both contain your real transaction
// data - neither is committed (see .gitignore's spike/ entry; keep the
// output there, or anywhere else outside this repo).
import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseOtpSheet } from '../js/parseOtp.js';
import { parseRevolutSheet } from '../js/parseRevolut.js';
import { csvEscape } from './spike-csv.mjs';

const [, , inputPath, outputPath = 'spike/transactions-to-label.csv'] = process.argv;

if (!inputPath) {
  console.error('Usage: node scripts/spike-export-template.mjs <your-real-export.xlsx> [output.csv]');
  process.exit(1);
}

const workbook = XLSX.read(readFileSync(inputPath), { type: 'buffer' });

function sheetRows(name) {
  const sheet = workbook.Sheets[name];
  return sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) : null;
}

const transactions = [];
const otpRows = sheetRows('otp');
if (otpRows) transactions.push(...parseOtpSheet(otpRows));
for (const name of ['rev-eur', 'rev-hu', 'rev-joint']) {
  const rows = sheetRows(name);
  if (rows) transactions.push(...parseRevolutSheet(rows, name));
}

if (transactions.length === 0) {
  console.error('No transactions found - expected sheets named otp, rev-eur, rev-hu, rev-joint.');
  process.exit(1);
}

const header = 'index,date,source,description,counterparty,amount,hand_label\n';
const lines = transactions.map((t, i) =>
  [i, t.date, t.source, csvEscape(t.description), csvEscape(t.counterparty), t.amount, ''].join(','),
);

writeFileSync(outputPath, header + lines.join('\n') + '\n');
console.log(`Written ${transactions.length} rows to ${outputPath}.`);
console.log('Either fill in hand_label here directly, or (fewer rows to label) run:');
console.log(`  node scripts/spike-dedupe-for-labeling.mjs ${outputPath}`);

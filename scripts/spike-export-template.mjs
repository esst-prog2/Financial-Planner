// Dev-only, not part of the browser app. Step 1 of the keyword-
// generalization spike (see PLANNING_LOG.md): turns a real bank export for
// a month NOT covered by Kategoriak_v2.pdf into a CSV you hand-label.
//
// Usage: node scripts/spike-export-template.mjs <your-real-export.xlsx> [output.csv] [ownerName]
//
// ownerName is the same value you'd type into the app's "Saját név" field -
// used to catch a self-transfer to your own name. Uses the app's own
// buildLineItems(), so this list already excludes exactly what the live
// app excludes from everything (self-transfers - including to your own
// other account, joint-account contributions, the OTP piggy-bank, currency
// conversions, OTP<->Revolut link rows) and keeps only real spending
// (including fees): positive amounts (income, refunds) are left out, since
// only expense categorization is being measured here.
//
// The input file and the output CSV both contain your real transaction
// data - neither is committed (see .gitignore's spike/ entry; keep the
// output there, or anywhere else outside this repo).
import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'node:fs';
import { buildLineItems } from '../js/pipeline.js';
import { resolveSheetName } from '../js/util.js';
import { csvEscape, ensureDirFor } from './spike-csv.mjs';

const [, , inputPath, outputPath = 'spike/transactions-to-label.csv', ownerName = ''] = process.argv;

if (!inputPath) {
  console.error('Usage: node scripts/spike-export-template.mjs <your-real-export.xlsx> [output.csv] [ownerName]');
  process.exit(1);
}

const workbook = XLSX.read(readFileSync(inputPath), { type: 'buffer' });

const CANONICAL_SHEET_NAMES = ['otp', 'rev-eur', 'rev-hu', 'rev-joint'];
const sheets = {};
for (const name of CANONICAL_SHEET_NAMES) {
  const actualName = resolveSheetName(workbook.SheetNames, name);
  if (!actualName) {
    console.error(`Missing sheet "${name}" (checked known aliases too). Sheets found: ${workbook.SheetNames.join(', ')}`);
    process.exit(1);
  }
  sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[actualName], { header: 1, raw: true });
}

const items = buildLineItems(sheets, { ownerName }).filter((item) => item.amountHuf < 0);

if (items.length === 0) {
  console.error('No spending rows found after exclusions.');
  process.exit(1);
}

const header = 'index,date,source,description,counterparty,amount,hand_label\n';
const lines = items.map((item, i) =>
  [i, item.date, item.source, csvEscape(item.description), csvEscape(item.counterparty), item.amountHuf, ''].join(','),
);

ensureDirFor(outputPath);
writeFileSync(outputPath, header + lines.join('\n') + '\n');
console.log(`Written ${items.length} spending rows to ${outputPath} (income and internal transfers excluded; fees included).`);
console.log('Either fill in hand_label here directly, or (fewer rows to label) run:');
console.log(`  node scripts/spike-dedupe-for-labeling.mjs ${outputPath}`);

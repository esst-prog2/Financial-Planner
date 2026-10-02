// Dev-only. Takes your hand-labeled unique-merchant list (from
// spike-dedupe-for-labeling.mjs) and the full per-row template (from
// spike-export-template.mjs, still unlabeled), and fills every row's
// hand_label in from its matching unique merchant - so you only ever
// label each real merchant once.
//
// Usage: node scripts/spike-expand-labels.mjs <full-template.csv> <labeled-unique-merchants.csv> [output.csv]
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv, csvEscape, ensureDirFor } from './spike-csv.mjs';

const [, , fullPath, labeledUniquePath, outputPath = 'spike/transactions-labeled.csv'] = process.argv;
if (!fullPath || !labeledUniquePath) {
  console.error('Usage: node scripts/spike-expand-labels.mjs <full-template.csv> <labeled-unique-merchants.csv> [output.csv]');
  process.exit(1);
}

const fullRows = parseCsv(readFileSync(fullPath, 'utf8'));
const uniqueRows = parseCsv(readFileSync(labeledUniquePath, 'utf8'));

const labelByKey = new Map();
for (const row of uniqueRows) {
  labelByKey.set(`${row.description}␟${row.counterparty}`, (row.hand_label || '').trim());
}

let missing = 0;
const header = 'index,date,source,description,counterparty,amount,hand_label\n';
const lines = fullRows.map((row) => {
  const label = labelByKey.get(`${row.description}␟${row.counterparty}`) || '';
  if (!label) missing++;
  return [row.index, row.date, row.source, csvEscape(row.description), csvEscape(row.counterparty), row.amount, label].join(',');
});

ensureDirFor(outputPath);
writeFileSync(outputPath, header + lines.join('\n') + '\n');
console.log(`Written ${fullRows.length} rows to ${outputPath}.`);
if (missing > 0) {
  console.log(`${missing} row(s) had no matching label - check labeled-unique-merchants.csv for blanks or mismatched text.`);
} else {
  console.log('Every row got a label. Now run:');
  console.log(`  node scripts/spike-measure-accuracy.mjs ${outputPath}`);
}

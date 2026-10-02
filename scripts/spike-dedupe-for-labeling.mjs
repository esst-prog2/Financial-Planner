// Dev-only. Optional step between spike-export-template.mjs and
// spike-measure-accuracy.mjs: turns the full per-row template (which
// repeats every time a merchant recurs that month) into one row per unique
// (description, counterparty) pair, so you only label each real merchant
// once, however many times it recurs. spike-expand-labels.mjs then fills
// the label back onto every matching row.
//
// Known limitation: this groups purely by text, not by amount sign, so a
// refund sharing its merchant's exact description/counterparty gets the
// same hand_label as the original purchase. That matches how the app's
// own categorizer already treats a refund (same category as the purchase,
// not income) - see categorize.js's refund-reclassification rule - so it's
// not expected to distort results in practice.
//
// Usage: node scripts/spike-dedupe-for-labeling.mjs <full-template.csv> [output.csv]
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv, csvEscape, ensureDirFor } from './spike-csv.mjs';

const [, , inputPath, outputPath = 'spike/unique-merchants-to-label.csv'] = process.argv;
if (!inputPath) {
  console.error('Usage: node scripts/spike-dedupe-for-labeling.mjs <full-template.csv> [output.csv]');
  process.exit(1);
}

const rows = parseCsv(readFileSync(inputPath, 'utf8'));

const byKey = new Map(); // key -> { description, counterparty, count }
for (const row of rows) {
  const key = `${row.description}␟${row.counterparty}`; // unit-separator, won't collide with real text
  const existing = byKey.get(key);
  if (existing) existing.count++;
  else byKey.set(key, { description: row.description, counterparty: row.counterparty, count: 1 });
}

const header = 'description,counterparty,row_count,hand_label\n';
const lines = [...byKey.values()]
  .sort((a, b) => b.count - a.count)
  .map(({ description, counterparty, count }) => [csvEscape(description), csvEscape(counterparty), count, ''].join(','));

ensureDirFor(outputPath);
writeFileSync(outputPath, header + lines.join('\n') + '\n');
console.log(`Written ${byKey.size} unique merchants (from ${rows.length} rows) to ${outputPath}.`);
console.log("Fill in hand_label for every row, then run spike-expand-labels.mjs.");

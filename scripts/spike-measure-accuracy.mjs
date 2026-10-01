// Dev-only. Step 2 of the keyword-generalization spike (see
// PLANNING_LOG.md): measures how well the FROZEN js/keywords.js
// generalizes to merchants never used to tune it.
//
// Usage: node scripts/spike-measure-accuracy.mjs <hand-labeled.csv>
//
// Reads your hand-labeled CSV (from spike-export-template.mjs) and prints
// + writes ONLY aggregate counts to spike-results.json - never the
// underlying transaction rows. spike-results.json is safe to commit; the
// CSV it reads is not (it holds your real bank data).
import { readFileSync, writeFileSync } from 'node:fs';
import { categorizeTransaction } from '../js/categorize.js';
import { normalizeText } from '../js/util.js';
import { KNOWN_MERCHANTS_FROM_GROUND_TRUTH } from './spike-known-merchants.mjs';
import { parseCsv } from './spike-csv.mjs';

const [, , inputPath] = process.argv;
if (!inputPath) {
  console.error('Usage: node scripts/spike-measure-accuracy.mjs <hand-labeled.csv>');
  process.exit(1);
}

const KNOWN_NORMALIZED = new Set(KNOWN_MERCHANTS_FROM_GROUND_TRUTH.map(normalizeText));

function rate(n, d) {
  return d ? Math.round((n / d) * 1000) / 10 : null; // one decimal place, as a percentage
}

const rows = parseCsv(readFileSync(inputPath, 'utf8'));

let seenTotal = 0, seenCorrect = 0;
let newTotal = 0, newCorrect = 0, newEgyeb = 0;
let skippedUnlabeled = 0;

for (const row of rows) {
  if (!row.hand_label || !row.hand_label.trim()) {
    skippedUnlabeled++;
    continue;
  }
  const merchantText = row.counterparty || row.description;
  const isSeen = KNOWN_NORMALIZED.has(normalizeText(merchantText));
  const predicted = categorizeTransaction({
    description: row.description,
    counterparty: row.counterparty,
    amount: Number(row.amount),
  });
  const correct = predicted === row.hand_label.trim();

  if (isSeen) {
    seenTotal++;
    if (correct) seenCorrect++;
  } else {
    newTotal++;
    if (correct) newCorrect++;
    if (predicted === 'Egyéb') newEgyeb++;
  }
}

const result = {
  seenMerchants: { count: seenTotal, accuracyPercent: rate(seenCorrect, seenTotal) },
  newMerchants: {
    count: newTotal,
    accuracyPercent: rate(newCorrect, newTotal),
    egyebFractionPercent: rate(newEgyeb, newTotal),
  },
  skippedUnlabeledRows: skippedUnlabeled,
};

console.log(JSON.stringify(result, null, 2));
writeFileSync('spike-results.json', JSON.stringify(result, null, 2) + '\n');
console.log('\nWritten spike-results.json - counts only, safe to commit.');

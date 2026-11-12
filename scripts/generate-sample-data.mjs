// Dev-only script: writes the synthetic demo workbook to sample-data/.
// Not part of the browser app - run with `node scripts/generate-sample-data.mjs`.
import * as XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateSampleWorkbookData } from '../js/sampleData.js';

// A full year (not just 45 days) so demo screenshots have a real monthly
// trend to show, not just the first month or two - see the teacher's HW8
// feedback.
const data = generateSampleWorkbookData({ seed: 2026, days: 365 });

const workbook = XLSX.utils.book_new();
for (const [name, rows] of Object.entries(data)) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

const outPath = fileURLToPath(new URL('../sample-data/minta-penzugyi-adatok.xlsx', import.meta.url));
const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
writeFileSync(outPath, buffer);
console.log(`Written: ${outPath}`);

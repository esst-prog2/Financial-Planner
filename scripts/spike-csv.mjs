// Dev-only. Tiny shared CSV helpers for the spike scripts - no quoting
// edge cases beyond what these scripts themselves write (comma, double
// quote, newline).
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// writeFileSync doesn't create missing parent directories (e.g. a fresh
// clone's gitignored spike/ folder) - call this right before it.
export function ensureDirFor(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

export function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function splitCsvLine(line, delimiter) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) { cells.push(cur); cur = ''; }
    else cur += c;
  }
  cells.push(cur);
  return cells;
}

// Strips a leading UTF-8 BOM (Excel writes one) and auto-detects the
// delimiter: Excel under a Hungarian locale saves CSV with ';' (since ','
// is the decimal separator there), not ','.
export function parseCsv(text) {
  const cleaned = text.replace(/^﻿/, '');
  const [headerLine, ...lines] = cleaned.trim().split('\n').map((l) => l.replace(/\r$/, ''));
  const delimiter = (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length ? ';' : ',';
  const headers = splitCsvLine(headerLine, delimiter);
  return lines.filter((l) => l.trim() !== '').map((line) => {
    const cells = splitCsvLine(line, delimiter);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
  });
}

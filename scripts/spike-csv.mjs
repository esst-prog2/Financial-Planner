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

function splitCsvLine(line) {
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
    else if (c === ',') { cells.push(cur); cur = ''; }
    else cur += c;
  }
  cells.push(cur);
  return cells;
}

export function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split('\n');
  const headers = headerLine.split(',');
  return lines.filter((l) => l.trim() !== '').map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
  });
}

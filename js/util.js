export class MissingColumnError extends Error {
  constructor(column, sheetName) {
    super(`${sheetName} export is missing the expected "${column}" column`);
    this.name = 'MissingColumnError';
    this.column = column;
    this.sheetName = sheetName;
  }
}

export function buildColumnIndex(headerRow) {
  const index = {};
  (headerRow || []).forEach((name, i) => {
    if (typeof name === 'string' && name.trim()) index[name.trim()] = i;
  });
  return index;
}

export function assertColumns(columnIndex, requiredColumns, sheetName) {
  for (const column of requiredColumns) {
    if (!(column in columnIndex)) throw new MissingColumnError(column, sheetName);
  }
}

// Sheet names a real export has used, beyond the canonical one this app
// looks for - observed to vary between OTP/Revolut export runs.
const SHEET_NAME_ALIASES = {
  'rev-hu': ['rev-huf'],
};

// Returns the sheet name actually present in the workbook for a canonical
// name (the canonical name itself, or a known alias), or null if neither
// is present.
export function resolveSheetName(availableNames, canonicalName) {
  if (availableNames.includes(canonicalName)) return canonicalName;
  const alias = (SHEET_NAME_ALIASES[canonicalName] || []).find((name) => availableNames.includes(name));
  return alias || null;
}

export function isBlankRow(row) {
  return !row || row.every((cell) => cell === undefined || cell === null || cell === '');
}

// Strips Hungarian (and other Latin) diacritics so accent-stripped real
// export text (e.g. "Muller") still matches accented keywords (e.g.
// "müller") and vice versa. NFD decomposes a letter+accent into two code
// points; stripping the combining-mark range then drops the accent.
export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Groups a person's name regardless of accents, case, or word order - two
// banks can format the same real person differently (e.g. "Fikció Hanna"
// vs "hanna fikcio"), and a naive exact-string group would wrongly treat
// them as two different people. Used as a Map key, never for display -
// callers keep the first raw string they saw as the human-readable label.
export function normalizeNameForGrouping(name) {
  return normalizeText(name).split(/\s+/).filter(Boolean).sort().join(' ');
}

// Shared "Átutalás tőle/neki: <name>" pattern matcher, used both for the
// joint-account contributor extraction (tőle only - an incoming
// contribution) and the general transaction counterparty field (either
// direction - see parseRevolut.js).
export function extractNamedTransferCounterparty(description, direction) {
  const pattern = new RegExp(`átutalás\\s*${direction}:\\s*(.+)`, 'i');
  const match = (description || '').match(pattern);
  return match ? match[1].trim() : null;
}

export function toNumber(value) {
  if (typeof value === 'number') return value;
  if (value === undefined || value === null || value === '') return 0;
  const normalized = String(value).trim().replace(/\s/g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isNaN(n) ? 0 : n;
}

// Excel stores dates as a serial day count from 1899-12-30 (the "day 0"
// that also absorbs Excel's fictitious 1900-02-29 leap-day bug). Without
// this conversion, a raw serial number misread as a JS millisecond
// timestamp lands on 1970-01-01 - which is exactly the bug this guards
// against for real, natively-dated Excel cells.
function fromExcelSerial(serial) {
  return new Date(Date.UTC(1899, 11, 30) + Math.round(serial * 86400000));
}

export function toIsoDate(value) {
  if (value === undefined || value === null || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number') {
    const d = fromExcelSerial(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  const s = String(value).trim();
  const match = s.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

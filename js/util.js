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

export function monthOf(dateIso) {
  return dateIso ? dateIso.slice(0, 7) : null;
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

// Forint amounts never carry subunits, but plain `.toLocaleString('hu-HU')`
// shows up to 3 fraction digits whenever a value isn't a clean integer
// (e.g. after summing EUR-converted amounts) - round to whole HUF first so
// every displayed total reads as a normal forint figure.
export function formatHuf(amount) {
  return Math.round(amount).toLocaleString('hu-HU');
}

// A stable per-transaction identity, for the transaction-deletion feature:
// the same underlying bank row needs the same id wherever it gets parsed
// again - a joint-account row is parsed twice (once inside buildLineItems
// for the personal-view mirror, once directly for the joint view), and
// both parses must land on the same id for a joint-view deletion to also
// remove the mirrored entry from the personal view. Built from fields every
// parsed transaction already carries (source+date+description+amount+
// currency), plus an occurrence counter so two genuinely different but
// identical-looking rows (e.g. the same coffee bought twice in one day)
// still get distinct ids - counted in array order, which is the same order
// both parses produce for the same sheet, so the Nth duplicate always lines
// up with the Nth duplicate on the other side.
export function assignTransactionIds(transactions) {
  const seen = new Map();
  return transactions.map((t) => {
    const base = [t.source, t.date, t.description, t.amount, t.currency].join('\u0001');
    const occurrence = (seen.get(base) || 0) + 1;
    seen.set(base, occurrence);
    return { ...t, id: `${base}\u0001${occurrence}` };
  });
}

// Re-applies persisted deletions and amount adjustments (the "deduct one
// transaction from another" feature) to a freshly parsed array, by id -
// used both right after upload and after the user deducts an income
// transaction from one or more expenses, since both need the exact same
// drop-this / shrink-that logic. Works on either a raw parsed transaction
// (`amount`) or a processed line item (`amountHuf`/`personalAmountHuf`),
// touching whichever of those fields the object actually has.
// `adjustments[id]` is a positive HUF figure meaning "this much has been
// deducted from this transaction's magnitude" - added back so a -200000
// expense with a 100000 adjustment reads as -100000, moving it toward
// zero regardless of the transaction's own sign.
export function applyTransactionOverrides(transactions, { deletedIds = new Set(), adjustments = {} } = {}) {
  return transactions
    .filter((t) => !deletedIds.has(t.id))
    .map((t) => {
      const delta = adjustments[t.id];
      if (!delta) return t;
      const adjusted = { ...t };
      if ('amount' in adjusted) adjusted.amount += delta;
      if ('amountHuf' in adjusted) adjusted.amountHuf += delta;
      if ('personalAmountHuf' in adjusted) adjusted.personalAmountHuf += delta;
      return adjusted;
    });
}

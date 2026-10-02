import { buildColumnIndex, assertColumns, isBlankRow, toNumber, toIsoDate, MissingColumnError } from './util.js';

// The real OTP "Számlatörténet" export always has a 14-row report-header
// block (account number, query timestamp, filter conditions) before the
// real transaction table - the header row is always row 15 (index 14).
const HEADER_ROW_INDEX = 14;

// OTP has shipped at least two spellings of the date column ("Tranzakció
// idő" and the fuller "Tranzakció időpontja") across different exports -
// both accepted, first match wins.
const DATE_COLUMN_CANDIDATES = ['Tranzakció idő', 'Tranzakció időpontja'];
const REQUIRED_COLUMNS = ['Összeg', 'Devizanem'];
const DESCRIPTION_COLUMNS = ['Forgalom típusa', 'Közlemény', 'Ellenoldali név'];

export function parseOtpSheet(rows) {
  const headerRow = rows[HEADER_ROW_INDEX] || [];
  const columnIndex = buildColumnIndex(headerRow);
  assertColumns(columnIndex, REQUIRED_COLUMNS, 'OTP');

  const dateColumn = DATE_COLUMN_CANDIDATES.find((c) => c in columnIndex);
  if (!dateColumn) throw new MissingColumnError(DATE_COLUMN_CANDIDATES[0], 'OTP');

  const descriptionColumns = DESCRIPTION_COLUMNS.filter((c) => c in columnIndex);
  const dataRows = rows.slice(HEADER_ROW_INDEX + 1).filter((row) => !isBlankRow(row));

  return dataRows.map((row) => {
    const description = descriptionColumns
      .map((c) => row[columnIndex[c]])
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
      .join(' ');

    return {
      source: 'otp',
      date: toIsoDate(row[columnIndex[dateColumn]]),
      description,
      counterparty: columnIndex['Ellenoldali név'] !== undefined ? String(row[columnIndex['Ellenoldali név']] || '').trim() : '',
      amount: toNumber(row[columnIndex['Összeg']]),
      currency: String(row[columnIndex['Devizanem']] || 'HUF').trim(),
      fee: 0,
    };
  });
}

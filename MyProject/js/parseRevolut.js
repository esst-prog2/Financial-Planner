import { buildColumnIndex, assertColumns, isBlankRow, toNumber, toIsoDate, extractNamedTransferCounterparty } from './util.js';

const REQUIRED_COLUMNS = ['Kezdés dátuma', 'Leírás', 'Összeg', 'Pénznem'];

function revolutCounterparty(description) {
  return (
    extractNamedTransferCounterparty(description, 'tőle') ||
    extractNamedTransferCounterparty(description, 'neki') ||
    description
  );
}

// sourceAccount: 'revolut-eur' | 'revolut-hu' | 'revolut-joint'
export function parseRevolutSheet(rows, sourceAccount) {
  const headerRow = rows[0] || [];
  const columnIndex = buildColumnIndex(headerRow);
  assertColumns(columnIndex, REQUIRED_COLUMNS, 'Revolut');

  const dataRows = rows.slice(1).filter((row) => !isBlankRow(row));

  return dataRows.map((row) => {
    const description = String(row[columnIndex['Leírás']] || '').trim();
    return {
      source: sourceAccount,
      type: columnIndex['Típus'] !== undefined ? row[columnIndex['Típus']] : undefined,
      // Canonical date is always "Kezdés dátuma" (start date), never
      // "Teljesítés dátuma" - keeps the matching key stable against OTP's
      // single timestamp and Revolut's own start/completion lag.
      date: toIsoDate(row[columnIndex['Kezdés dátuma']]),
      description,
      counterparty: revolutCounterparty(description),
      amount: toNumber(row[columnIndex['Összeg']]),
      fee: columnIndex['Díj'] !== undefined ? toNumber(row[columnIndex['Díj']]) : 0,
      currency: String(row[columnIndex['Pénznem']] || 'HUF').trim(),
    };
  });
}

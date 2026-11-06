// Bundled offline historical daily exchange-rate table. Values are
// synthetic but plausible for EUR/HUF; built once at import time rather
// than fetched from a live API, per the offline-conversion decision.
function buildDailyRateTable(startDate, endDate, baseRate, amplitude) {
  const table = {};
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const dayIndex = Math.round((d - start) / 86400000);
    const rate = baseRate + amplitude * Math.sin(dayIndex / 5);
    table[iso] = Math.round(rate * 100) / 100;
  }
  return table;
}

// Widened from an initial 2026-only range after a real Revolut export
// included an EUR transaction dated 2025-11-01, outside it - see
// PLANNING_LOG. Generous on both ends since this is synthetic-but-plausible
// data anyway (not real historical rates), not a precision concern.
export const RATE_TABLES = {
  EUR: buildDailyRateTable('2023-01-01', '2027-12-31', 400, 8),
};

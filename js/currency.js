import { RATE_TABLES } from './rates.js';

export class MissingRateError extends Error {
  constructor(currency, date) {
    super(`No bundled exchange rate for ${currency} on ${date}`);
    this.name = 'MissingRateError';
    this.currency = currency;
    this.date = date;
  }
}

export function toHuf(amount, currency, date) {
  if (currency === 'HUF') return amount;
  const table = RATE_TABLES[currency];
  const rate = table && table[date];
  if (!rate) throw new MissingRateError(currency, date);
  return amount * rate;
}

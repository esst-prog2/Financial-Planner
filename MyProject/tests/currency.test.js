import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toHuf, MissingRateError } from '../js/currency.js';
import { RATE_TABLES } from '../js/rates.js';

test('HUF amounts pass through unconverted', () => {
  assert.equal(toHuf(-4500, 'HUF', '2026-09-10'), -4500);
});

test('EUR amounts convert to HUF using the bundled rate table', () => {
  const rate = RATE_TABLES.EUR['2026-09-05'];
  assert.equal(toHuf(-10, 'EUR', '2026-09-05'), -10 * rate);
});

test('throws MissingRateError for a date outside the bundled table', () => {
  assert.throws(() => toHuf(-10, 'EUR', '2020-01-01'), MissingRateError);
});

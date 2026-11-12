import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, CATEGORY_LABELS, LANGUAGES, t, categoryLabel, summaryLines } from '../js/i18n.js';
import { SPENDING_CATEGORIES, NON_SPENDING_CATEGORIES } from '../js/categorize.js';

test('every UI string has both languages', () => {
  for (const [key, entry] of Object.entries(STRINGS)) {
    for (const lang of LANGUAGES) {
      assert.ok(entry[lang], `missing "${lang}" translation for "${key}"`);
    }
  }
});

test('every real category (spending + non-spending) has a display label in both languages', () => {
  for (const category of [...SPENDING_CATEGORIES, ...NON_SPENDING_CATEGORIES]) {
    assert.ok(CATEGORY_LABELS[category], `missing CATEGORY_LABELS entry for "${category}"`);
    for (const lang of LANGUAGES) {
      assert.ok(CATEGORY_LABELS[category][lang], `missing "${lang}" label for "${category}"`);
    }
  }
});

test('t() falls back to Hungarian for an unknown language', () => {
  assert.equal(t('navJoint', 'fr'), t('navJoint', 'hu'));
});

test('categoryLabel() returns the category itself for canonical (Hungarian) rendering', () => {
  assert.equal(categoryLabel('Élelmiszer', 'hu'), 'Élelmiszer');
  assert.equal(categoryLabel('Élelmiszer', 'en'), 'Groceries');
});

test('summaryLines returns income, then spending, then the balance, in that order', () => {
  const values = { spending: 341715, income: 380000, balance: 38285 };
  const huLines = summaryLines('hu', values);
  assert.deepEqual(
    huLines.map((l) => l.label),
    ['Bevétel', 'Kiadás', 'Különbözet'],
  );
  assert.deepEqual(
    huLines.map((l) => l.amount),
    [380000, 341715, 38285],
  );
  assert.deepEqual(
    summaryLines('en', values).map((l) => l.label),
    ['Income', 'Spending', 'Balance'],
  );
});

test('summaryLines inserts a savings line right after income only when given one', () => {
  const withSavings = summaryLines('hu', { spending: 341715, income: 380000, balance: 38285, savings: 25000 });
  assert.deepEqual(
    withSavings.map((l) => l.label),
    ['Bevétel', 'Megtakarítás', 'Kiadás', 'Különbözet'],
  );
  assert.equal(withSavings[1].amount, 25000);

  const withoutSavings = summaryLines('hu', { spending: 341715, income: 380000, balance: 38285 });
  assert.deepEqual(
    withoutSavings.map((l) => l.label),
    ['Bevétel', 'Kiadás', 'Különbözet'],
  );
});

test('summaryLines attaches a percent field to the savings line only, when savingsPercent is given', () => {
  const lines = summaryLines('hu', { spending: 341715, income: 380000, balance: 38285, savings: 25000, savingsPercent: 6.6 });
  const [income, savingsLine, spending, balance] = lines;
  assert.equal(savingsLine.percent, 6.6);
  assert.equal(income.percent, undefined);
  assert.equal(spending.percent, undefined);
  assert.equal(balance.percent, undefined);
});

test('summaryLines: the savings line has no percent field when savingsPercent is omitted', () => {
  const lines = summaryLines('hu', { spending: 341715, income: 380000, balance: 38285, savings: 25000 });
  assert.equal(lines[1].percent, undefined);
});

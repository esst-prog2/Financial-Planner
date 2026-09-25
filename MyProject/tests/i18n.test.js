import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, CATEGORY_LABELS, LANGUAGES, t, categoryLabel, summaryText } from '../js/i18n.js';
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

test('summaryText formats numbers and picks the right sentence per language', () => {
  const values = { spending: 341715, income: 380000, balance: 38285 };
  assert.match(summaryText('hu', values), /elköltve/);
  assert.match(summaryText('en', values), /spent/);
});

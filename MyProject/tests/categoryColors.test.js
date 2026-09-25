import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_COLORS, categoryColor } from '../js/categoryColors.js';
import { SPENDING_CATEGORIES, NON_SPENDING_CATEGORIES } from '../js/categorize.js';

test('every real category (spending + non-spending) has a color', () => {
  for (const category of [...SPENDING_CATEGORIES, ...NON_SPENDING_CATEGORIES]) {
    assert.ok(CATEGORY_COLORS[category], `missing color for "${category}"`);
  }
});

test('no two categories share the same light-mode color', () => {
  const lightColors = Object.values(CATEGORY_COLORS).map((c) => c.light);
  assert.equal(new Set(lightColors).size, lightColors.length);
});

test('no two categories share the same dark-mode color', () => {
  const darkColors = Object.values(CATEGORY_COLORS).map((c) => c.dark);
  assert.equal(new Set(darkColors).size, darkColors.length);
});

test('categoryColor picks the light or dark value explicitly', () => {
  assert.equal(categoryColor('Élelmiszer', false), '#2a78d6');
  assert.equal(categoryColor('Élelmiszer', true), '#3987e5');
});

test('categoryColor falls back gracefully for an unknown category', () => {
  assert.equal(typeof categoryColor('Nonexistent', false), 'string');
});

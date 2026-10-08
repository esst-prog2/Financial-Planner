import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNameAlias } from '../js/nameAliases.js';

test('resolveNameAlias returns the canonical name for a configured alias', () => {
  const aliases = { 'REKA ZSUZSANNA KARACSONY': 'Karácsony Réka' };
  assert.equal(resolveNameAlias('REKA ZSUZSANNA KARACSONY', aliases), 'Karácsony Réka');
});

test('resolveNameAlias matches accent/case-insensitively', () => {
  const aliases = { 'Teszt Elek Alias': 'Teszt Elek' };
  assert.equal(resolveNameAlias('teszt elek alias', aliases), 'Teszt Elek');
  assert.equal(resolveNameAlias('TESZT ELEK ALIAS', aliases), 'Teszt Elek');
});

test('resolveNameAlias returns the label unchanged when no alias matches', () => {
  const aliases = { 'Teszt Elek Alias': 'Teszt Elek' };
  assert.equal(resolveNameAlias('Lidl', aliases), 'Lidl');
});

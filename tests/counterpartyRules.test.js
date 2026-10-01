import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCounterpartyRules } from '../js/counterpartyRules.js';

test('resolveCounterpartyRules expands ids into names using the given map', () => {
  const idRules = [{ ids: ['a', 'b'], category: 'Szolgáltatások' }];
  const nameById = { a: 'teszt egy', b: 'teszt kettő' };
  assert.deepEqual(resolveCounterpartyRules(idRules, nameById), [
    { names: ['teszt egy', 'teszt kettő'], category: 'Szolgáltatások' },
  ]);
});

test('resolveCounterpartyRules drops an id with no entry in the map, instead of erroring', () => {
  const idRules = [{ ids: ['a', 'missing'], category: 'Szolgáltatások' }];
  const nameById = { a: 'teszt egy' };
  assert.deepEqual(resolveCounterpartyRules(idRules, nameById), [
    { names: ['teszt egy'], category: 'Szolgáltatások' },
  ]);
});

test('resolveCounterpartyRules with an empty map (no local file) yields rules with no names', () => {
  const idRules = [{ ids: ['a', 'b'], category: 'Szolgáltatások' }];
  assert.deepEqual(resolveCounterpartyRules(idRules, {}), [{ names: [], category: 'Szolgáltatások' }]);
});

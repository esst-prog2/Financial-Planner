import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPreferences, savePreferences } from '../js/preferences.js';

// A minimal fake localStorage - these tests never touch a real browser
// store, consistent with how the rest of this project injects an override
// instead of relying on an ambient global.
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
  };
}

test('loadPreferences returns an empty object when nothing has been saved yet', () => {
  assert.deepEqual(loadPreferences(fakeStorage()), {});
});

test('savePreferences then loadPreferences round-trips the saved values', () => {
  const storage = fakeStorage();
  savePreferences({ lang: 'en', ownerName: 'Jane Doe' }, storage);
  assert.deepEqual(loadPreferences(storage), { lang: 'en', ownerName: 'Jane Doe' });
});

test('savePreferences merges into existing preferences instead of replacing them', () => {
  const storage = fakeStorage();
  savePreferences({ lang: 'hu' }, storage);
  savePreferences({ lastView: 'joint' }, storage);
  assert.deepEqual(loadPreferences(storage), { lang: 'hu', lastView: 'joint' });
});

test('savePreferences overwrites only the keys it is given', () => {
  const storage = fakeStorage();
  savePreferences({ lang: 'hu', lastMonth: '2026-01' }, storage);
  savePreferences({ lastMonth: '2026-02' }, storage);
  assert.deepEqual(loadPreferences(storage), { lang: 'hu', lastMonth: '2026-02' });
});

test('loadPreferences recovers from corrupted JSON instead of throwing', () => {
  const storage = fakeStorage({ 'expense-tracker:preferences': 'not valid json' });
  assert.deepEqual(loadPreferences(storage), {});
});

test('loadPreferences and savePreferences are no-ops without a storage backend', () => {
  assert.deepEqual(loadPreferences(null), {});
  assert.doesNotThrow(() => savePreferences({ lang: 'en' }, null));
});

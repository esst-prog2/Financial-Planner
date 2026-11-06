import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPreferences, savePreferences, loadCorruptedBackup, clearCorruptedBackup } from '../js/preferences.js';

const BACKUP_KEY = 'expense-tracker:preferences:corrupted-backup';

// A minimal fake localStorage - these tests never touch a real browser
// store, consistent with how the rest of this project injects an override
// instead of relying on an ambient global.
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
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

test('savePreferences repairs trailing garbage in place instead of discarding the blob (the real incident reproduced)', () => {
  const storage = fakeStorage();
  savePreferences({ lang: 'hu', lastMonth: '2026-01' }, storage);
  const raw = storage.getItem('expense-tracker:preferences');
  storage.setItem('expense-tracker:preferences', `${raw}BROKEN`);

  savePreferences({ lastMonth: '2026-02' }, storage);

  assert.deepEqual(loadPreferences(storage), { lang: 'hu', lastMonth: '2026-02' });
  // Repaired in place - nothing was unrecoverable, so no backup was needed.
  assert.equal(storage.getItem(BACKUP_KEY), null);
});

test('loadPreferences repairs trailing garbage in place instead of discarding the blob', () => {
  const storage = fakeStorage({ 'expense-tracker:preferences': '{"lang":"hu","lastMonth":"2026-01"}EXTRA' });
  assert.deepEqual(loadPreferences(storage), { lang: 'hu', lastMonth: '2026-01' });
});

test('savePreferences backs up an unparsable blob before overwriting it', () => {
  const storage = fakeStorage({ 'expense-tracker:preferences': 'not valid json' });
  savePreferences({ lastMonth: '2026-02' }, storage);
  assert.equal(storage.getItem(BACKUP_KEY), 'not valid json');
  // The save itself still goes through, starting fresh.
  assert.deepEqual(loadPreferences(storage), { lastMonth: '2026-02' });
});

test('savePreferences does not replace an existing backup with a later corrupted value', () => {
  const storage = fakeStorage({
    'expense-tracker:preferences': 'still not valid json',
    [BACKUP_KEY]: 'the original corrupted value',
  });
  savePreferences({ lastMonth: '2026-03' }, storage);
  assert.equal(storage.getItem(BACKUP_KEY), 'the original corrupted value');
});

test('savePreferences does not create a backup when nothing was saved yet', () => {
  const storage = fakeStorage();
  savePreferences({ lang: 'hu' }, storage);
  assert.equal(storage.getItem(BACKUP_KEY), null);
});

test('loadCorruptedBackup returns the raw backed-up value, or null if none exists', () => {
  assert.equal(loadCorruptedBackup(fakeStorage()), null);
  const storage = fakeStorage({ [BACKUP_KEY]: 'raw corrupted value' });
  assert.equal(loadCorruptedBackup(storage), 'raw corrupted value');
});

test('clearCorruptedBackup removes the backup', () => {
  const storage = fakeStorage({ [BACKUP_KEY]: 'raw corrupted value' });
  clearCorruptedBackup(storage);
  assert.equal(loadCorruptedBackup(storage), null);
});

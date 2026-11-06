// Small-setting persistence (language, owner name, last-viewed month/view) -
// one JSON blob under one localStorage key. Takes an optional `storage`
// override (mirroring this project's other injectable-override functions)
// so tests never depend on a real browser `localStorage`, and so the app
// itself can degrade silently when storage is unavailable (private
// browsing, disabled storage, quota) instead of throwing.
import { repairJson } from './util.js';

const STORAGE_KEY = 'expense-tracker:preferences';
// Holds the raw value of a preferences blob found unparsable AND
// unrepairable (see repairJson in util.js), so a save made after the
// corruption doesn't silently discard it for good - see savePreferences's
// own comment below for why that matters. A blob repairJson can fix never
// reaches this key at all - it's recovered immediately, in place, the first
// time anything tries to read or save over it.
const BACKUP_KEY = 'expense-tracker:preferences:corrupted-backup';

function defaultStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

// Parses `raw`, repairing it first if it doesn't parse as-is (e.g. trailing
// garbage from an interrupted write - see repairJson). Returns null if
// nothing works, same as a genuinely absent value - callers tell the two
// apart by checking `raw` itself first, same as before this existed.
function parseStoredValue(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    const repaired = repairJson(raw);
    return repaired && typeof repaired === 'object' ? repaired : null;
  }
}

export function loadPreferences(storage = defaultStorage()) {
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = parseStoredValue(raw);
    if (parsed) return parsed;
    // Degrading to {} (so the app starts fresh rather than crashing) is
    // still the right call when even repair fails, but logging means a
    // real problem (e.g. hand-edited localStorage left invalid) is visible
    // instead of just quietly resetting every saved preference with no
    // explanation.
    console.warn('[preferences] stored preferences could not be read, even after attempting repair - starting fresh');
    return {};
  } catch (err) {
    console.warn('[preferences] could not read saved preferences, starting fresh:', err.message);
    return {};
  }
}

export function savePreferences(partial, storage = defaultStorage()) {
  if (!storage) return;
  try {
    // Reads the raw value itself (not via loadPreferences) so a genuine
    // parse failure can be told apart from "nothing saved yet" (no raw
    // value at all) - only the former needs repairing or backing up.
    // Without this, a corrupted blob gets silently replaced by whatever
    // this call's `partial` happens to be, and every value it didn't
    // carry - possibly everything the user ever had saved - is gone for
    // good the moment this runs (see PLANNING_LOG). repairJson fixes the
    // common case (an otherwise-intact blob with something appended, or
    // a write cut short) in place, so this never even reaches that point;
    // only a value repair itself can't fix falls through to the backup.
    const raw = storage.getItem(STORAGE_KEY);
    let current = {};
    if (raw) {
      const parsed = parseStoredValue(raw);
      if (parsed) {
        current = parsed;
      } else {
        if (!storage.getItem(BACKUP_KEY)) storage.setItem(BACKUP_KEY, raw);
        console.warn('[preferences] stored preferences could not be read, even after attempting repair - backed up the raw value and starting fresh');
      }
    }
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...partial }));
  } catch (err) {
    // Storage unavailable or full - nothing persists this session, but the
    // app itself keeps working off in-memory state either way. Logged for
    // the same reason as above: silent here just means a confusing "my
    // settings keep resetting" report later with no clue why.
    console.warn('[preferences] could not save preferences:', err.message);
  }
}

// Returns the raw backed-up value from a past corrupted save (see
// savePreferences above), or null if none exists. Returns the raw string,
// not a parsed object - a caller restoring from it is responsible for
// parsing (and for deciding what to do if the backup turns out to be
// unparsable too, which this module has no opinion on).
export function loadCorruptedBackup(storage = defaultStorage()) {
  if (!storage) return null;
  try {
    return storage.getItem(BACKUP_KEY) || null;
  } catch (err) {
    return null;
  }
}

// Clears the backup once a caller has consumed it, so it isn't reapplied on
// a later upload.
export function clearCorruptedBackup(storage = defaultStorage()) {
  if (!storage) return;
  try {
    storage.removeItem(BACKUP_KEY);
  } catch (err) {
    // Removal failing just leaves the backup lingering - no worse than if
    // it had never been cleared.
  }
}

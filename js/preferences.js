// Small-setting persistence (language, owner name, last-viewed month/view) -
// one JSON blob under one localStorage key. Takes an optional `storage`
// override (mirroring this project's other injectable-override functions)
// so tests never depend on a real browser `localStorage`, and so the app
// itself can degrade silently when storage is unavailable (private
// browsing, disabled storage, quota) instead of throwing.
const STORAGE_KEY = 'expense-tracker:preferences';

function defaultStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function loadPreferences(storage = defaultStorage()) {
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function savePreferences(partial, storage = defaultStorage()) {
  if (!storage) return;
  try {
    const current = loadPreferences(storage);
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...partial }));
  } catch {
    // Storage unavailable or full - nothing persists this session, but the
    // app itself keeps working off in-memory state either way.
  }
}

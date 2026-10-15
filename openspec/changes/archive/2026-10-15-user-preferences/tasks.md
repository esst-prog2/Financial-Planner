All tasks below describe work already implemented and shipped (this change retroactively documents it - see proposal.md).

## 1. Storage module

- [x] 1.1 `js/preferences.js`: `loadPreferences()`/`savePreferences()` over one `localStorage` key, injectable `storage` parameter - verified by `tests/preferences.test.js`
- [x] 1.2 Graceful degradation (no-op / empty object) when storage is unavailable or throws - verified by `tests/preferences.test.js`'s no-storage and corrupted-JSON tests

## 2. Wiring into the app

- [x] 2.1 Restore language and owner name immediately on load - verified by manual walkthrough (DOM-level, no dedicated unit test)
- [x] 2.2 Save language on change, owner name on change - verified by manual walkthrough
- [x] 2.3 Restore last month/view after the first upload of a session, via the existing `selectMonth()` no-op-if-absent behavior - verified by manual walkthrough
- [x] 2.4 Save last month on month-tab change, last view on view-switch click - verified by manual walkthrough

187 tests pass (`npm test`).

## Context

See proposal.md for motivation. No backend exists; the only persistence mechanism available is browser `localStorage`. This document describes the architecture actually shipped (retroactive, per HW6's "review your whole codebase").

## Goals / Non-Goals

**Goals:**
- Document the actual implementation precisely enough for the spec's scenarios to be testable against it.

**Non-Goals:**
- Persisting the uploaded dataset itself (considered and explicitly deferred to a future, separate IndexedDB-based change, since it needs a materially larger design).
- Syncing settings across devices or browsers - this is deliberately per-browser, `localStorage`-scoped.

## Decisions

**One `localStorage` key holding one JSON blob, not one key per setting.**
`js/preferences.js` exports `loadPreferences()`/`savePreferences(partial)`, both taking an optional `storage` parameter (defaulting to `localStorage` when available). `savePreferences` merges `partial` into whatever is already stored, so callers only ever write the keys they changed. Alternative considered: a separate `localStorage` key per setting - rejected as unnecessary indirection for a handful of small values that are always read/written together.

**Injectable storage parameter, not a direct `localStorage` reference.**
Every function takes `storage` as a parameter, defaulting to `localStorage` via a small `defaultStorage()` helper that returns `null` when `localStorage` is unavailable (e.g. Node's test runner, or a browser with storage disabled). This mirrors the project's established pattern (e.g. `categorizeTransaction`'s `counterpartyRules` override) for keeping tests independent of any real environment.

**Month restoration only on the first upload of a session, not on every month-tab render.**
`app.js` reads the remembered month/view once, right after the first upload's `renderMonthOptions()`/`renderJointMonthOptions()` calls, using the existing `selectMonth()` helper (which already no-ops when the target month isn't among the current options). After that first upload, the user's own in-session choices take over; the module-level `prefs` snapshot is never re-read.

## Risks / Trade-offs

- **Silent failure on corrupted or unavailable storage** → Mitigation: `loadPreferences`/`savePreferences` catch and log (see the HW6 "errors that disappear" review) rather than throwing, so a corrupted value just resets to defaults instead of breaking the app.
- **Per-browser, per-device only** → Accepted; matches the project's no-backend constraint.

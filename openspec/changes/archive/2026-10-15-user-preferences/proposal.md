## Why

Every time the user reopened the dashboard, the language, their own name, and whichever month/view they'd last been looking at reset to defaults - small but real friction for a tool meant to be reopened often. This was built ad hoc (no OpenSpec change) during post-homework feature work; this change retroactively documents it as part of HW6's "review your whole codebase" pass.

## What Changes

- Language and owner name are remembered across page reloads and restored immediately on load.
- The last-viewed month and the last-active view (personal/joint) are remembered and restored after the first file upload of a session.
- All of it degrades silently (the app still works, nothing is remembered) when browser storage is unavailable.

## Capabilities

### New Capabilities
- `user-preferences`: persisting and restoring small, per-browser display settings (language, owner name, last-viewed month, last-active view) across page reloads.

### Modified Capabilities
(none)

## Impact

- `js/preferences.js`: new module, `loadPreferences()`/`savePreferences()` over one `localStorage` key, takes an injectable storage parameter.
- `js/app.js`: reads/writes preferences at the relevant UI entry points (language select, owner-name input, month-tab clicks, the view switch, and the file-upload handler for the first-upload restoration).

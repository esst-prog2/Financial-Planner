## Why

The user lost every transaction deletion and deduction she had made: `js/preferences.js`'s `savePreferences()` reads the stored blob, and if it can't be parsed it silently treats it as `{}` - but then writes `{...{}, ...partial}` back over the *entire* stored key, permanently discarding everything else that was in it. Confirmed in her browser's console: the surviving blob held only `lastView`/`lastMonth` (the only two things saved since whatever corrupted it), with `deductionHistory`, `deletedTransactionIds`, `transactionAdjustments`, `lang`, and `ownerName` all gone. There is no backend, so once this happens the data is unrecoverable from inside the app as it exists today. This change makes that failure non-destructive going forward and gives the user a way to recover even from a full storage wipe (which a purely in-browser fix can't protect against on its own, since a full wipe takes any backup key with it too).

## What Changes

- `savePreferences()` backs up the raw stored value under a separate key (`expense-tracker:preferences:corrupted-backup`) before overwriting it, the first time it finds the existing value unparsable. The backup is never overwritten by a later corruption event, so the oldest recoverable snapshot survives.
- On the next file upload, if that backup key exists and contains recoverable `deletedTransactionIds`/`transactionAdjustments`/`deductionHistory`, the system merges them into the live state (union with whatever's already live, never dropping anything currently active), re-applies them against the newly-parsed transactions via the existing transaction-identity matching, shows a visible notice naming how much was restored, and clears the backup key so it doesn't reapply again.
- New manual "export corrections to a file" / "import corrections from a file" controls (in the deduction-history card): export downloads a small JSON file with the current `deletedTransactionIds`/`transactionAdjustments`/`deductionHistory`; import reads a previously-exported file and merges it in the same way as the automatic backup-restore path. This is the only protection against a full storage wipe (private browsing, "clear site data," a new machine/browser) - a purely in-browser backup can't survive that, since the whole origin's storage disappears at once.
- No change to how a deletion or deduction is applied, displayed, or undone day-to-day - only to what happens when the stored record of them is lost.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `user-preferences`: new requirement - preserve an unreadable preferences blob instead of letting it be silently discarded by the next save.
- `transaction-corrections`: new requirements - recover deletions/deductions on upload from an available backup, and manually export/import them to/from a file.

## Impact

- `js/preferences.js` (`savePreferences`'s corruption handling).
- `js/app.js` (upload handler gains a recovery step; new export/import UI wiring; a shared merge helper for deletedTransactionIds/transactionAdjustments/deductionHistory).
- `index.html` (export/import controls in the deduction-history card; a new recovery-notice element).
- `tests/preferences.test.js` (new backup-on-corruption tests).

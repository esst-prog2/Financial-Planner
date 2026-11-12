## Context

See proposal.md - Why for the incident that motivated this. Current state, confirmed by reading the code:

- `savePreferences(partial, storage)` always does `storage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...partial }))`, where `current` comes from `loadPreferences(storage)` - which returns `{}` on any parse failure. So the very next save after a corruption event, whatever its `partial` happens to be, becomes the entire new stored value.
- `deletedTransactionIds`, `transactionAdjustments`, and `deductionHistory` already live in this same blob (confirmed: `savePreferences({ deletedTransactionIds: [...] })` etc. throughout js/app.js), even though `openspec/specs/user-preferences/spec.md` only documents language/owner-name/last-month/last-view - this change's delta additions sit correctly in transaction-corrections instead, where that data is actually owned.
- The existing "Transaction identity"/"a deletion survives a later, different upload" mechanism (transaction-corrections) already tolerates an id that doesn't match anything in the current data - restoring from a backup or an imported file is just feeding that same tolerant mechanism from an alternate source.

## Goals / Non-Goals

**Goals:**
- Corruption of the single stored blob no longer silently destroys the rest of it.
- The user has a real, out-of-browser recovery path (export/import) that survives a full storage wipe, which no in-browser mechanism can.
- Recovery reuses the existing id-matching logic rather than inventing new matching rules.

**Non-Goals:**
- Not attempting to recover the specific data already lost in the incident that prompted this - that raw value was already overwritten multiple times before being noticed.
- Not changing how deletions/deductions are applied, displayed, or undone - only how they survive storage loss.
- Not adding automatic/scheduled export (e.g. auto-download on every change) - export is a manual, user-initiated action.

## Decisions

- **Attempt an in-place repair before ever backing anything up - revised after live testing.** The original version of this design assumed "there's no reliable partial-recovery of broken JSON worth building" and went straight to backup-then-discard. Testing it against a reproduction of the real incident (append unrelated bytes to an otherwise-valid blob - plausibly what actually happened) showed that assumption was wrong in a way that broke the whole feature: the backup key, by construction, only ever holds a value that already failed `JSON.parse` once - so naively `JSON.parse`-ing it again at restore time fails every single time, and nothing is ever actually restored. `repairJson()` (js/util.js) fixes the root problem instead of only mitigating it: it tries progressively shorter prefixes (recovers "valid JSON plus trailing garbage" - the reproduced case) and tries closing whatever brackets a bracket-depth scan finds still open (recovers a write cut short mid-structure), skipping over bracket characters that appear inside a string literal so they're not miscounted as real structure. Both `loadPreferences` and `savePreferences` call this before giving up, so a repairable blob self-heals immediately - no backup, no notice, no re-upload ever needed for that case. The backup/restore-on-upload path described below now only matters for the strictly smaller set of corruptions that are truly unrepairable (e.g. a cut-short text value, where there's no way to tell how much was lost).
- **Not attempting to repair a truncated string value.** If the blob is cut off mid-string (an unterminated quote), closing it anyway would produce a value that parses but silently contains truncated, wrong text - worse than visibly failing, since nothing would signal that the recovered data might be incomplete. Falling through to the backup path is safer: the user keeps a path to notice and recover via the (less automatic) mechanisms below, rather than quietly running on guessed-at data.
- **One shared merge helper for all three recovery sources** (auto-backup-on-upload, manual import, and - implicitly - the existing live state): `mergeCorrections(current, incoming)` returns `{ deletedTransactionIds, transactionAdjustments, deductionHistory }` as a union - `deletedTransactionIds` via Set union; `transactionAdjustments` via `{...incoming, ...current}` (current wins on key conflict, since it's presumably newer/more authoritative than a backup); `deductionHistory` concatenated and de-duplicated by `entry.id` when present, otherwise by exact `(expenseId, incomeId, amount)` match. Reused by both the upload-time auto-restore and the manual import, so the two paths can't drift apart.
- **The corrupted-backup key is consumed (cleared) once successfully merged**, so it can't reapply on a later upload and silently resurrect something the user deliberately changed since. Alternative considered: leave it and let the merge's own idempotency handle repeats - rejected because an already-cleared live correction (e.g. the user re-added back an expense they'd undone a deduction on, now wanting a *different* allocation) could get silently re-merged from a stale backup with no way for the user to tell.
- **Export/import operates on deletedTransactionIds/transactionAdjustments/deductionHistory only**, not language/owner-name/last-view - those are low-stakes UI conveniences the user doesn't need an out-of-browser backup for, and bundling them would make the exported file's purpose (and its filename/UI label) less clear.
- **Import requires a file already uploaded.** Without `rawItems`/`rawJointRaw` loaded, there's nothing to match the imported ids against; the import control stays available but importing before any upload simply has no visible effect yet (consistent with the existing "an id with no matching transaction has no effect" tolerance) rather than being specially disabled/blocked.
- **The recovery notice is a new, separate element** (not the existing `#error-message`, which has `role="alert"` and is reserved for real errors) - a successful restore isn't an error, so it gets its own, less alarming, `role="status"` element.

## Risks / Trade-offs

- [Risk] A corrupted backup could itself be from a very old upload, restoring deletions/deductions the user no longer wants. → Mitigated by only restoring what's a union with current state (nothing already-active is removed) and by the ids-must-match-current-transactions tolerance; worst case the user manually undoes an unwanted restored deduction the same way they would any other, or deletes the restored transaction again.
- [Risk] Export/import is opt-in and easy to forget. → Out of scope to force; the automatic backup-on-corruption path still covers the (more common) corruption case with zero effort from the user.

## Open Questions

- None - see proposal.md for the agreed scope (confirmed in conversation: both the automatic backup-on-corruption path and the manual export/import path, combined, with recovery triggered on upload).

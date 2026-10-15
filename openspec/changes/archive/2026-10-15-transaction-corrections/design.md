## Context

See proposal.md for motivation. This document describes the architecture actually shipped (retroactive, per HW6's "review your whole codebase"). No backend exists; everything runs client-side, and the only persistence is `localStorage` via `js/preferences.js`.

## Goals / Non-Goals

**Goals:**
- Document the actual, current implementation precisely enough that the spec's scenarios are testable against it.
- Capture the one architectural decision that most shapes the feature: how `state.items`/`state.jointRaw` get recomputed, since it's what makes undo possible at all.

**Non-Goals:**
- Changing any behavior. This change adds no new code.
- A richer correction history (e.g. undoing a plain deletion, or a dedicated "deleted items" recovery view) - out of scope; the user explicitly chose "no restore UI" for deletions and accepted that limitation.

## Decisions

**Recompute state from the raw parse, rather than patch filtered arrays in place.**
`js/app.js` keeps `rawItems`/`rawJointRaw` - the unfiltered output of the last upload's parse - alongside the live `state.items`/`state.jointRaw`. Every mutation (upload, delete, deduct, undo) calls `recomputeState()`, which re-derives `state` by passing `rawItems`/`rawJointRaw` through `applyTransactionOverrides()` (in `js/util.js`) with the current `deletedTransactionIds`/`transactionAdjustments`.
Alternative considered: filter/adjust `state.items`/`state.jointRaw` incrementally in place (the original implementation, before undo existed). Rejected once undo was added, because a fully-deleted transaction is not present in the filtered array at all - there is nothing to "add back" without re-deriving from the raw source.

**Deletion and deduction share one override-application function.**
`applyTransactionOverrides(transactions, { deletedIds, adjustments })` is the single function both the initial upload and every later correction route through. `adjustments[id]` is a signed HUF delta added to whichever of a transaction's `amount`/`amountHuf`/`personalAmountHuf` fields it has - positive moves a negative (expense) amount toward zero, negative moves a positive (income) amount toward zero - so one function handles both sides of a deduction with the same "move toward zero" rule.

**Deduction history is a separate, append-only log from the numeric adjustments.**
`transactionAdjustments` is just the net numbers `applyTransactionOverrides` needs. `deductionHistory` is a parallel array of `{ id, expenseId, expenseDescription, incomeId, incomeDescription, amount }` records - the human-readable "what happened and why" the Levonások panel and undo both read. Keeping them separate means the numeric state never has to be parsed back into a narrative, and the narrative never has to double as the arithmetic source of truth.

**Undo recomputes from the log's remaining entries, not from a stored "before" snapshot.**
Reversing one entry removes it from `deductionHistory`, subtracts its amount back out of `transactionAdjustments[expenseId]`, then recomputes the income's adjustment from scratch as `-sum(remaining entries referencing that income)` (or fully un-deletes it if that sum is zero). This correctly handles one income having funded several expenses in a single action: undoing one entry only gives back that entry's share.

**Best-effort migration for deduction-history entries created before undo existed.**
Entries logged before `id`/`incomeId` were added to the record lack both fields. `migrateLegacyDeductionEntries()`, run once per upload, searches the raw parse for a transaction matching the entry's recorded income description that is currently deleted or carries a negative adjustment; it backfills the missing fields only when exactly one such candidate exists, leaving an ambiguous or absent match alone rather than risk wiring undo to the wrong transaction.

## Risks / Trade-offs

- **No undo for a plain deletion** → Mitigation: re-uploading the same (or a different, overlapping) export restores the transaction in that session, since deletion only ever filters, never discards, the raw source on disk.
- **Deduction-history entries from before the undo feature can't always be backfilled** → Mitigation: the migration above recovers unambiguous cases automatically; ambiguous cases (the same income description shared by more than one real transaction) were resolved in practice by the user resetting and redoing those specific corrections.
- **`localStorage` is per-browser, per-device** → Mitigation: already an accepted constraint of `js/preferences.js` generally, not specific to this feature.

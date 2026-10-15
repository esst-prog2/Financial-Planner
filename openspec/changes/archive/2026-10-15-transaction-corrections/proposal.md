## Why

Real bank exports contain transactions that need a correction after the fact: a miscategorized or unwanted row the user wants gone, or an incoming transfer that is not really income but offsets a specific expense (e.g. a roommate's rent contribution, which should reduce the rent expense rather than inflate income). This capability was built and shipped ad hoc (no branch, no OpenSpec change) across several short iterations; this change retroactively documents it as part of HW6's "review your whole codebase" pass, so the spec catches up with the code instead of the other way around.

## What Changes

- Every individual transaction row (personal income-by-source, personal category table, joint category table, joint income) gets a checkbox.
- A floating action bar appears once at least one box is checked, with a delete button and a clear-selection button.
- Checking a transaction of each kind (one income + at least one expense) reveals a third action: open a panel to split the income across the checked expenses, with quick-fill shortcuts and an explicit percent-of-original control, partial allocation allowed.
- A new, permanent "Levonások" panel in the personal view shows, per expense, what has been deducted from it and by how much, with per-entry undo.
- Deletions and deductions persist across reloads and across a later upload of a different (but overlapping) export, matched by a stable per-transaction identity.

## Capabilities

### New Capabilities
- `transaction-corrections`: deleting transactions and deducting one transaction's amount from one or more others, both persisted and both undoable at the level the feature supports (deletion is undoable only by re-uploading; a deduction is undoable per entry via the Levonások panel).

### Modified Capabilities
(none - this is purely additive; it does not change any existing spending-dashboard, transaction-categorization, transaction-import, currency-conversion, joint-account-handling, or sample-data-generation requirement)

## Impact

- `js/app.js`: the majority of the new UI logic (checkbox wiring, the action bar, the allocation panel, the Levonások panel, `recomputeState()`).
- `js/util.js`: `assignTransactionIds()` (stable per-transaction id, used by this feature to track deletions/deductions) and `applyTransactionOverrides()` (applies a deletion/adjustment set to a raw transaction array).
- `js/preferences.js`: three new persisted keys (`deletedTransactionIds`, `transactionAdjustments`, `deductionHistory`), no change to the module itself.
- `index.html` / `css/style.css`: new markup and styling for the action bar, allocation panel, and the personal view's new two-column (2/3-1/3) layout.
- `js/parseOtp.js` / `js/parseRevolut.js`: both now call `assignTransactionIds()` before returning, so every parsed transaction carries the stable id this feature depends on.

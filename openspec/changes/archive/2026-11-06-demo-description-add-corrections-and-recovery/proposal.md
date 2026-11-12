## Why

The previous demo-description update deliberately left out the transaction deletion/deduction feature and the data-loss recovery feature, reasoning that neither was a demo walk-through moment and that the brief favors a short script. The user explicitly overrode that call: both should be included.

## What Changes

- Add a sentence describing selecting transactions with a checkbox, deleting ones that shouldn't count, and deducting part of an income from one or more expenses it actually offsets, with a running deduction-history list and a one-click undo per entry.
- Add a sentence describing that a corrupted save repairs itself automatically, or can be restored from a backup file.
- Documentation only. No code, test, or spec behavior changes.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none - both features are already implemented and already specified, in transaction-corrections and in user-preferences/transaction-corrections respectively. This change only brings the README's prose in line with that already-specified, already-implemented behavior.)

## Impact

- `README.md` only (section 1, two more sentences).

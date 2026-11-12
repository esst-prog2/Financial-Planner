## Why

README.md section 1 is the HW8 demo script, due before the December presentation, and the user explicitly asked to bring it up to date with today's app. Since it was last written, the monthly summary gained a savings figure (with its share of income) and the joint view gained its own monthly summary and deduction-history panel, mirroring the personal view - none of that is reflected in the current text.

## What Changes

- Add one sentence describing the monthly summary's savings line ("Megtakarítás: X HUF (Y%)"), placed right after the existing summary sentence it extends.
- Add one clause to the joint-view sentence noting it also has its own monthly summary and deduction history, mirroring the personal view's shape.
- Deliberately NOT adding the transaction deletion/deduction/undo feature or the data-loss recovery (corrupted-storage self-heal, export/import) - both are real, but neither is a walk-through moment for a tight 5-minute demo; the brief's own guidance ("three to six sentences") argues against growing this further than the two additions above, which are small, concrete extensions of sentences already there.
- Documentation only. No code, test, or spec behavior changes.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none - the underlying behavior already exists and is already specified in `openspec/specs/spending-dashboard/spec.md` under "Monthly summary", "Joint monthly summary", and the "Deduction history" requirement in transaction-corrections. This change only brings the README's prose in line with that already-specified, already-implemented behavior.)

## Impact

- `README.md` only (section 1, two additions).

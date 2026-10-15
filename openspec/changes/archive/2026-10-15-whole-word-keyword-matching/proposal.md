## Why

A keyword short enough to appear as a substring inside unrelated words (e.g. "one" inside "vodafone") risks matching transactions it was never meant to match. This behavior - matching such a keyword only as its own whole word, not wherever the substring happens to appear - was added ad hoc while fixing a real miscategorized merchant and was never captured in the transaction-categorization spec. This change retroactively documents it as part of HW6's "review your whole codebase" pass.

## What Changes

- A keyword may be matched as a whole word only (not as a substring anywhere in the description), for keywords short or generic enough that plain substring matching would risk false positives.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `transaction-categorization`: adds a scenario to the existing "Uniform keyword-based categorization" requirement, documenting whole-word matching as an available matching mode alongside the existing substring matching.

## Impact

- `js/categorize.js`: the text being matched is already wrapped in a leading/trailing space before matching, which a space-padded keyword relies on.
- `js/keywords.js`: the specific keyword entry that needed this (a space-padded `' one '` alongside the pre-existing, more specific `'simplep*one'`).

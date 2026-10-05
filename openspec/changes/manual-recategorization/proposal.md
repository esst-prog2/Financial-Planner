## Why

A spike (2026-10-02, see PLANNING_LOG.md) measured that keyword-based categorization alone correctly categorizes 95.5% of merchants already used to tune `keywords.js`, but only 64.8% of merchants it has never seen before (62.5% among confidently hand-labeled rows, excluding ambiguous "Egyéb" non-answers) - well below the ~70% bar the course set for "keyword rules scale." Below that bar, keyword rules alone don't generalize, and the only way the categorizer gets better over time is if the user can correct it and have that correction stick. Manual recategorization was listed as a later-level idea on 2026-10-01; this spike result promotes it into this term's MVP scope instead.

This proposal writes that decision down as a requirement so it can be implemented against directly, rather than staying only as a log entry.

## What Changes

- The user can change a transaction's assigned category in the UI.
- That correction is remembered, keyed by the transaction's counterparty/merchant (matched the same accent/case-insensitive, substring way `counterpartyRules.js`'s name override already matches), and automatically re-applied to every other transaction - past and future - from that same merchant.
- A remembered manual correction takes priority over both keyword matching and the existing counterparty-name override, since it's the most specific, most recently expressed signal about what a merchant actually is.
- Corrections persist across page reloads (browser-local storage - this app has no backend and no account system, so there is nowhere else to keep them).

## Capabilities

### New Capabilities
(none - this is a modified capability, not a new one)

### Modified Capabilities
- `transaction-categorization`: adds a new requirement, Manual recategorization override, and amends the existing Uniform keyword-based categorization and Counterparty-name override requirements' priority statements to mention that a manual correction, when present, wins over both.

## Impact

- `js/categorize.js`: `categorizeTransaction()` needs a new, highest-priority lookup step before the existing counterparty-name override.
- A new module (e.g. `js/manualCorrections.js`) to read/write the correction map, likely to `localStorage`.
- `js/app.js`: a UI affordance (e.g. a category dropdown per transaction row, or a click-to-recategorize action on the existing click-to-list transaction view) to record a correction, and a re-render/re-categorize pass after one is recorded.
- `js/pipeline.js`: `buildLineItems()` needs to pass the correction map (or a lookup function) down to `categorizeTransaction()`.
- No change to `keywords.js`, `counterpartyRules.js`, or any existing exclusion logic (self-transfer, joint contribution, piggy bank, currency conversion) - this only adds a new override layer on top of categorization.
- This is a proposal only. No implementation code changes are part of this change; `tasks.md` is for a future `apply` session.

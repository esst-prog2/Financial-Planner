## 1. Correction storage

- [ ] 1.1 Add `js/manualCorrections.js`: `getCorrection(merchantText)`, `setCorrection(merchantText, category)`, keyed by `normalizeText()`-normalized merchant text, backed by `localStorage`; verify with unit tests covering set → get round-trip and accent/case-insensitive key matching
- [ ] 1.2 Handle `localStorage` being unavailable (private browsing, quota) without crashing the app; verify with a test that stubs `localStorage` to throw

## 2. Categorization priority

- [ ] 2.1 Wire a manual-correction lookup into `categorizeTransaction()` as the first check, before the counterparty-name override; verify with a test asserting a manual correction wins over both a matching counterparty-override name and a matching category keyword
- [ ] 2.2 Confirm `buildLineItems()` picks up corrections on every call (no stale caching across an upload/re-render cycle); verify with a pipeline test that records a correction, rebuilds line items, and checks the corrected category appears

## 3. UI

- [ ] 3.1 Add a way to change a transaction's category from the existing click-to-list category/transaction view (exact placement per design.md's Open Questions, resolved during this task)
- [ ] 3.2 Recording a correction re-renders the current view so the change is visible immediately; verify manually (upload sample data, correct a transaction, confirm its category and its totals update without a page reload)
- [ ] 3.3 Add the new UI strings to `js/i18n.js` for both languages; verify by switching the language selector and confirming no missing-key fallback text appears

## 4. Spec sync

- [ ] 4.1 After the above is implemented and tested, run `openspec-sync-specs` (or the equivalent sync step) to merge this change's delta into `openspec/specs/transaction-categorization/spec.md`, then archive the change

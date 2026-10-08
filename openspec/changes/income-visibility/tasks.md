## 1. Joint-account income list

- [x] 1.1 Add `summarizeJointIncome(transactions)` to `js/jointAccount.js`: groups every positive-amount transaction by its (already-extracted) `counterparty`, normalized via `normalizeNameForGrouping`, summing repeats; verify with unit tests covering a named contributor, a card top-up (non-"tőle" description), and the same contributor written two ways collapsing into one row
- [x] 1.2 Keep `summarizeContributors`, `isJointContribution`, `extractContributorName` unchanged - they're still used by `pipeline.js`'s exclusion logic; verify the existing pipeline/selfTransfer/jointAccount tests still pass unmodified

## 2. Joint-account view rendering

- [x] 2.1 Add a container for the joint income list's click-to-list output (new element near `#joint-contributors` in `index.html`)
- [x] 2.2 Update `renderJointView()` in `js/app.js` to render `summarizeJointIncome(state.jointRaw)` instead of `summarizeContributors(state.jointRaw)`, with each row clickable
- [x] 2.3 Add a render function listing a clicked row's individual transactions (date, amount), filtering `state.jointRaw` by the same normalized grouping key; verified programmatically on sample data (filtered rows' sum matches the summary total for every row) - no browser tool was available in this session to click through it visually; a visual spot-check is still recommended when convenient

## 3. Personal income-by-source click-to-list

- [x] 3.1 Add `#income-source-transactions` container under the income-sources list in `index.html`
- [x] 3.2 Make each `renderIncomeBySource()` row clickable; add a render function listing that source's individual Bevétel transactions for the selected month (date, amount), filtering `state.items` by category === 'Bevétel', the selected month, and the row's normalized counterparty key
- [x] 3.3 Verified programmatically on sample data (filtered rows' sum matches the summary total for every source) - same caveat as 2.3, no browser tool available; a visual spot-check is still recommended when convenient

## 4. i18n and polish

- [x] 4.1 No new static strings needed - the expanded lists' headings are the dynamic source/category label itself (same pattern as the existing category click-to-list), the one existing string that needed updating (`contributorsHeading`, since the section's scope broadened) was updated in both languages
- [x] 4.2 Run `npm test` and confirm all existing tests still pass (159 pass, 0 fail)

## 5. Spec sync

- [ ] 5.1 After implementation and manual verification above, run the spec-sync step to merge this change's deltas into `openspec/specs/joint-account-handling/spec.md` and `openspec/specs/spending-dashboard/spec.md`, then archive the change

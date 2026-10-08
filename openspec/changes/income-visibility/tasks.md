## 1. Joint-account income list

- [ ] 1.1 Add `summarizeJointIncome(transactions)` to `js/jointAccount.js`: groups every positive-amount transaction by its (already-extracted) `counterparty`, normalized via `normalizeNameForGrouping`, summing repeats; verify with unit tests covering a named contributor, a card top-up (non-"tőle" description), and the same contributor written two ways collapsing into one row
- [ ] 1.2 Keep `summarizeContributors`, `isJointContribution`, `extractContributorName` unchanged - they're still used by `pipeline.js`'s exclusion logic; verify the existing pipeline/selfTransfer/jointAccount tests still pass unmodified

## 2. Joint-account view rendering

- [ ] 2.1 Add a container for the joint income list's click-to-list output (new element near `#joint-contributors` in `index.html`)
- [ ] 2.2 Update `renderJointView()` in `js/app.js` to render `summarizeJointIncome(state.jointRaw)` instead of `summarizeContributors(state.jointRaw)`, with each row clickable
- [ ] 2.3 Add a render function listing a clicked row's individual transactions (date, amount), filtering `state.jointRaw` by the same normalized grouping key; verify manually (upload sample data with a top-up, click it, confirm the listed rows match)

## 3. Personal income-by-source click-to-list

- [ ] 3.1 Add `#income-source-transactions` container under the income-sources list in `index.html`
- [ ] 3.2 Make each `renderIncomeBySource()` row clickable; add a render function listing that source's individual Bevétel transactions for the selected month (date, amount), filtering `state.items` by category === 'Bevétel', the selected month, and the row's normalized counterparty key
- [ ] 3.3 Verify manually (upload sample data, click an income source with 2+ transactions, confirm both are listed with correct dates/amounts)

## 4. i18n and polish

- [ ] 4.1 Add any new UI strings (e.g. section headings for the expanded lists) to `js/i18n.js` for both languages
- [ ] 4.2 Run `npm test` and confirm all existing tests still pass

## 5. Spec sync

- [ ] 5.1 After implementation and manual verification above, run the spec-sync step to merge this change's deltas into `openspec/specs/joint-account-handling/spec.md` and `openspec/specs/spending-dashboard/spec.md`, then archive the change

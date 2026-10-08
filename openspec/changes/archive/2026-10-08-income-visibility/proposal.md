## Why

Two gaps the user found while actually using the app on their real September-October export (HW5):

1. The joint-account view's "who contributed how much" list only picks up transactions matching the "Átutalás tőle: <name>" description pattern. It misses other real money coming into the joint account - most concretely, a card/Apple Pay top-up (just fixed to correctly stay out of Bevétel, since it's not income - but it's still real money arriving in the joint account that the joint view currently shows nowhere at all).
2. The personal dashboard's income-by-source list only shows a per-source total. To see which individual transactions made up that total (and when), the user has to go hunting through the raw file - the category pie chart already solved exactly this problem for spending with its click-to-list behavior; income has no equivalent.

## What Changes

- The joint-account view's contributor list is replaced by a broader list of everyone/everything that put money into the joint account that period - any positive-amount joint transaction, not only ones matching the "Átutalás tőle:" pattern - labeled the same way the app already extracts a counterparty (named sender if extractable, else the raw description, e.g. for a card top-up). This includes money excluded from Bevétel elsewhere (e.g. the card top-up fixed this week) - this list's job is "what came into the joint account," not "what counts as income."
- Clicking a row in the personal income-by-source list expands to show that source's individual transactions for the selected month (date and amount), mirroring the existing category-pie click-to-list behavior.
- For consistency, the same click-to-expand behavior is added to the new joint-account income list.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `joint-account-handling`: the "contributor" requirement (showing who transferred into the joint account, identified by the "Átutalás tőle:" pattern) is replaced by a broader "all money in" requirement, and gains click-to-list behavior.
- `spending-dashboard`: the income-by-source requirement gains click-to-list behavior, matching the existing category-pie requirement's.

## Impact

- `js/jointAccount.js`: new `summarizeJointIncome()` alongside the existing `summarizeContributors()` (kept - `isJointContribution`/`extractContributorName` are still needed to exclude contributions from personal totals in `pipeline.js`; this change only replaces what the joint view *displays*).
- `js/app.js`: `renderJointView()` uses the new summary function; new click handlers and a new list-rendering function for both the joint income list and the personal income-by-source list (mirroring the existing `renderCategoryTransactionList`).
- `index.html`: a new container element for the expanded transaction list under the income-by-source card (the joint view's category click-to-list container is reused for consistency, or a sibling added - decided in design.md).
- No change to `js/pipeline.js`'s exclusion/categorization logic - this is a display-layer change only, using data that's already computed.

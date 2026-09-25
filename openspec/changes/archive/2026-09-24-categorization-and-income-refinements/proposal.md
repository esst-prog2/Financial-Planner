## Why

The user supplied a ground-truth PDF of ~130 real, manually-categorized bank transactions. Comparing it against the shipped categorizer surfaced systematic gaps (accent-stripped merchant names, wrong category assignments, missing keywords, positive-amount transactions that aren't real income) and a real aggregation bug that would double-count refunds as spending. Fixing these against real data now, while the discrepancies are fresh and documented, is far cheaper than discovering them piecemeal later.

## What Changes

- Keyword matching becomes accent-insensitive (normalizes diacritics on both the description text and the keyword lists before comparing) - real exports often strip Hungarian accents (e.g. "Muller" vs "Müller").
- Bakery/pékség-type keywords move from "Eating out" to "Élelmiszer"; hobby/könyvesbolt-type keywords move from "Ruházat/bevásárlás" to "Szórakozás" - both corrections grounded in the user's real categorization.
- New keywords added across several categories based on real merchant names observed in the PDF (burgers, bisztró, food-delivery apps, pharmacies, optometrists, transit apps, parking garages, the state treasury, rent, cinema/ticketing/book-store brands, and a ride-share app).
- New counterparty-name override: a small set of known counterparty names always map to a specific category (personal service providers paid by transfer, and rent-related recipients), taking priority over generic keyword/Utalás-fallback categorization.
- New `counterparty` field on the unified transaction model, sourced from OTP's "Ellenoldali név" column and, for Revolut, extracted from the "Átutalás tőle/neki: `<name>`" description pattern (generalizing the existing joint-account contributor extractor).
- New OTP "persely számla" (piggy-bank sub-account) exclusion: a positive-amount transaction whose counterparty is the piggy-bank sub-account is excluded entirely from income and totals, the same way a self-transfer is - it's the user's own money moving between their own OTP sub-accounts. The existing negative-amount case (money going into savings) is unchanged.
- **BREAKING** (behavior change from the shipped MVP): the "Income override" rule no longer applies unconditionally. A positive-amount transaction whose description matches a merchant/service-type spending category's keywords (not Utalás) is now categorized into that category instead of Bevétel, treating it as a refund that reduces that category rather than generic income.
- Category totals are now computed as a signed sum across a category's line items for a period, with absolute value taken only on the final total - not per-item, before summing. This fixes a latent bug: once a positive (refund) amount can land in a spending category, summing per-item absolute values would double-count it as additional spending instead of netting it out. A category whose signed total for the period is zero or positive is excluded from that period's pie chart (there's nothing to show as spending), but the monthly total spending figure still reflects the reduction correctly.
- New income-by-source view: a card within the existing personal dashboard (not a separate tab) showing, for the selected month, a prominent total income figure and an itemized list of income grouped by counterparty, amounts from the same source summed together.
- Pie charts (personal category pie and joint category pie) now sort categories in descending order by amount and use a fixed, category-specific color palette, so the same category always renders the same color and no two categories ever share a color.

## Capabilities

### New Capabilities
_None - all changes modify existing capabilities._

### Modified Capabilities
- `transaction-import`: new `counterparty` field on the unified transaction model; new OTP piggy-bank sub-account exclusion requirement.
- `transaction-categorization`: accent-insensitive matching; category keyword reassignments and additions; new counterparty-name override requirement; the "Income override" requirement changes to allow refund reclassification into a matching spending category (Utalás excepted).
- `spending-dashboard`: category-total aggregation becomes a signed sum (fixing the refund double-counting bug) with pie-chart exclusion of non-negative categories; new income-by-source requirement; new pie-chart sort-and-color requirement.
- `joint-account-handling`: the same signed-sum aggregation fix and pie-chart sort-and-color requirement apply to the joint account's pie and monthly trend.

## Impact

- Affected code: `js/keywords.js` (keyword reassignment/additions, accent handling), `js/categorize.js` (accent-insensitive matching, counterparty-name override, refund reclassification), `js/util.js` (shared diacritic-normalizing helper, shared counterparty-extraction helper), `js/parseOtp.js` / `js/parseRevolut.js` (new `counterparty` field), `js/jointAccount.js` (reuse the shared counterparty extractor instead of its own copy), `js/pipeline.js` (piggy-bank exclusion, carrying `counterparty` through), and a new pure aggregation module extracted from `js/app.js` (signed-sum category totals, pie eligibility, income-by-source grouping) so this logic is unit-testable - `js/app.js` and `index.html` then consume it and add the new income-by-source card and the sorted/colored pie rendering.
- No new external dependencies.
- The synthetic sample dataset (`sample-data/minta-penzugyi-adatok.xlsx`) will need regenerating after the keyword changes, since some generated merchant names may now categorize differently.
- `README.md` and `PLANNING_LOG.md` need follow-up updates once implemented, consistent with how prior changes were documented.

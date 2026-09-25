## Context

This change is driven by comparing the shipped categorizer against a ~130-row ground-truth PDF of the user's real, manually-categorized transactions (see PLANNING_LOG.md for the full discovery/decision trail). See proposal.md for motivation; see the delta specs under `specs/` for the exact behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Make keyword matching robust to accent-stripped real-world merchant names.
- Let a small, curated set of known counterparty names override generic keyword matching, for cases keywords structurally cannot resolve (a person's name carries no merchant-type information).
- Correctly net refunds against spending instead of double-counting them.
- Surface income by source without new architecture - reuse the existing "grouped, summed list" pattern already used for joint-account contributors.

**Non-Goals:**
- No general-purpose accounting reversal/matching (e.g. pairing a specific refund to the specific purchase it reverses by date proximity). The category-level netting in this change is coarser and intentionally so - see Risks below.
- No UI for the user to edit the counterparty-name override list themselves; it's a small hardcoded list for now, extendable the way keyword lists already are.
- No change to how joint-account 50% splitting or self-transfer/joint-contribution exclusion work - the piggy-bank exclusion is a new, third case alongside them, not a change to the existing two.

## Decisions

**Accent normalization via `String.prototype.normalize('NFD')` + diacritic strip, no library.** Both the transaction description and the keyword lists are normalized before substring comparison. Keyword lists are normalized once at module load (they're static); each transaction's description is normalized once per categorization call. Alternative considered: hand-maintain both accented and unaccented keyword variants. Rejected - it doubles every keyword list and still misses variants nobody thought to add, whereas normalization fixes the whole class of mismatch at once.

**Counterparty-name override is substring matching on the normalized `counterparty` field, evaluated before keyword matching.** A small ordered list, e.g. `[{ names: [...], category: 'Szolgáltatások' }, ...]`, lives in its own file (`js/counterpartyRules.js`) rather than inside `keywords.js`, since it's a fundamentally different kind of rule (a specific person, not a merchant-type keyword) and likely to be edited directly by the user as their own contacts change. Substring (not exact) matching was chosen so a fuller name variant (e.g. "Redacted Person D Full") is still caught by a rule written for "Redacted Person D" - consistent with how the rest of the categorizer already matches.

**Refund reclassification checks merchant-category keywords, not a separate "is this a refund" signal.** There's no reliable structural marker for a refund in either bank's export (no "REFUND" flag) - the only real signal available is "does this positive-amount transaction's description look like a known merchant/service". This is deliberately scoped to exclude Utalás, preserving the earlier explicit decision that incoming transfers are always income.

**Category aggregation logic is extracted into a new pure module, `js/aggregate.js`.** It currently lives inline in `app.js` as `Math.abs()`-per-item-then-sum, which is exactly the bug this change fixes; pulling it out makes it unit-testable (consistent with the project's "core logic as pure, testable functions" goal) and gives the joint-account view and the new income-by-source card a shared, single implementation instead of three parallel copies. It exposes: a signed per-category total for a period, a pie-eligible/sorted view over those totals (excluding non-negative categories), and an income-by-counterparty grouping.

**Pie category colors: a fixed category→color map, chosen using the project's dataviz color guidance at implementation time (not hardcoded here).** The map is keyed by canonical (Hungarian) category name, so a category's color is stable regardless of display language, which pie it's on (personal or joint), or where it falls in that month's sort order.

## Risks / Trade-offs

- **[Risk]** Category-level refund netting is coarser than transaction-level reversal matching - a large refund landing in a month with little other spending in that category could make the category's true "what did I actually keep" number hard to read at a glance (though never wrong, since it's a correct net). → **Mitigation:** accepted for this MVP; the alternative (matching a refund to its specific original purchase by date/amount proximity) is significantly more complex and was explicitly scoped out.
- **[Risk]** The counterparty-name override list is hardcoded and specific to this user's real contacts - it has zero value for anyone else's data and needs manual editing as their circle of contacts changes. → **Mitigation:** accepted; this mirrors how the keyword lists themselves are already grounded in this user's real merchant vocabulary, not a general solution.
- **[Risk]** Substring matching on counterparty names could, in principle, false-positive-match an unrelated person who happens to share a name fragment. → **Mitigation:** accepted as a known limitation, consistent with the same accepted risk already documented for keyword matching generally.
- **[Risk]** If refunds across *all* categories in a month somehow exceed total spending, the monthly "total spent" figure could net to zero or a small positive value. → **Mitigation:** accepted as correct, if unusual, behavior - the figure is still mathematically accurate; no special-cased display is added for this rare case.

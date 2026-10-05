## Context

See proposal.md for motivation (the spike result) and the delta spec under `specs/transaction-categorization/spec.md` for the exact behavioral requirements. This app is browser-only with no backend and no accounts (see README.md), so "remembered" can only ever mean "remembered in this browser."

## Goals / Non-Goals

**Goals:**
- A correction made once on one transaction applies to every transaction from that merchant, past and future, without the user repeating it.
- A manual correction is the single highest-priority signal in categorization - it wins over both keyword matching and the existing counterparty-name override.
- Reuse the existing merchant-matching approach (accent/case-insensitive substring match via `normalizeText`, the same mechanism `counterpartyRules.js`'s override already uses) rather than inventing a second matching strategy.

**Non-Goals:**
- No undo/history of past corrections - only the current correction per merchant is kept, matching how `counterpartyRules.js` has no versioning either.
- No cross-device or cross-browser sync - corrections live in this browser only, same constraint as the rest of the app's state.
- No change to `keywords.js`, `counterpartyRules.js`, or any exclusion logic (self-transfer, joint contribution, piggy bank, currency conversion) - this is strictly a new, higher-priority layer on top of the existing categorization step.
- No UI mockup here - the exact interaction (dropdown on a transaction row vs. an edit affordance on the existing click-to-list view) is an implementation-time decision, not a spec-level one.

## Decisions

**Storage: browser `localStorage`, keyed by normalized merchant text.** The app already has no backend; `localStorage` is the only persistence mechanism available and is already implied by "no accounts, browser-only." A correction is stored as `{ [normalizedMerchantKey]: category }`. Alternative considered: `sessionStorage` - rejected, since a correction must survive a page reload/new session to be useful at all, which is the entire point of "remembering" it.

**Matching key: the same `normalizeText()`-normalized counterparty/description text `counterpartyRules.js` already uses, not a new fuzzy-matching layer.** This keeps "same merchant" meaning one consistent thing across the app (the counterparty-override list, the income-by-source grouping, and now manual corrections all agree on what counts as "the same name/merchant"). Alternative considered: a separate, looser merchant-matching heuristic (e.g. ignoring store-location suffixes like "LIDL HU 101 Balatonlel" vs "LIDL HU 274 Budapest" so both count as "the same merchant"). Rejected for this change - it's a bigger, separate design question (how to define "merchant" vs. "specific transaction description") that the spike didn't measure and shouldn't be bundled into this requirement; starting with exact-text matching is the smallest thing that satisfies the requirement, consistent with how `counterpartyRules.js` already works.

**Priority order: manual correction → counterparty-name override → keyword matching → Egyéb fallback.** A manual correction is the most specific and most recent signal about a given merchant, so it should never be silently overridden by a generic keyword or an older hardcoded counterparty mapping. This is a strict total order, not a merge - exactly one of the four paths decides a transaction's category.

**Re-categorization is applied at read time (every `categorizeTransaction()` call consults the correction map), not by mutating already-computed line items.** Since `buildLineItems()` already re-runs categorization from raw transactions on every file upload (nothing is cached across sessions except the correction map itself), a newly recorded correction takes effect the next time line items are built - which, in practice, is immediately after the user records it, since recording a correction is what triggers a re-render. Alternative considered: eagerly walk and mutate all currently-rendered line items in place. Rejected - more state to keep in sync for no behavioral difference, since a full rebuild from raw transactions already happens on re-render.

## Risks / Trade-offs

- **[Risk]** Exact-text merchant matching means two differently-formatted descriptions from the same real-world merchant (e.g. a store with multiple location codes) won't share a correction. → Mitigation: this matches the existing, accepted limitation of `counterpartyRules.js`'s own matching; a future change can revisit "what counts as the same merchant" for all three mechanisms at once if it proves to be a real problem.
- **[Risk]** `localStorage` is per-browser - a correction made on one device/browser doesn't help on another. → Mitigation: explicitly a non-goal (see above); no backend exists to sync it anywhere else.
- **[Risk]** A correction recorded for a merchant that later coincidentally matches a different, unrelated transaction's counterparty text (same accepted-limitation class as the existing counterparty-name override). → Mitigation: same substring-matching trade-off the project already accepted for `counterpartyRules.js`; not a new risk introduced by this change.

## Open Questions

- Exact UI placement (per-row dropdown vs. an edit action on the click-to-list detail view) - deferred to `tasks.md`/implementation; doesn't change the spec or the storage/priority decisions above.

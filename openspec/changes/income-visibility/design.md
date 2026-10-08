## Context

See proposal.md for motivation. The existing click-to-list pattern (`renderCategoryTransactionList` in `js/app.js`, rendering into `#category-transactions` / `#joint-category-transactions`) already solves "click a summary row, see the underlying transactions" for spending categories; this change applies the same pattern to income.

## Goals / Non-Goals

**Goals:**
- One shared mental model for "click a summary row to see its transactions," reused (not reinvented) for income.
- The joint-account income list reflects everything that actually arrived in the joint account, independent of whether it counts as personal Bevétel.

**Non-Goals:**
- No change to what counts as Bevétel, or to any exclusion logic in `pipeline.js` - this is a display-layer change over data that's already computed correctly.
- No month selector added to the joint-account view's income list - it stays all-time/unfiltered, consistent with the existing contributor list and the joint monthly-trend chart (neither of those is month-scoped either).

## Decisions

**New, dedicated containers rather than reusing the category click-to-list containers.** `#income-source-transactions` (personal view) and a replacement for `#joint-contributors`'s content area (joint view) are separate DOM elements from `#category-transactions` / `#joint-category-transactions`. Alternative considered: reuse the same container so only one list shows at a time. Rejected - a user clicking an income source and then a category slice (or vice versa) would silently lose the other list with no indication why; separate containers let both be open at once, which is simpler to reason about than adding "clear the other list" logic for no real benefit.

**The joint income list is built from the raw parsed `rev-joint` transactions (`state.jointRaw`), not from `state.items`.** `state.items` has already had contributions/top-ups excluded (that's the whole point of the exclusion). Since this list's job is "show everything that arrived," it has to look at the pre-exclusion data, same source the current `summarizeContributors` already uses.

**Grouping key: the already-extracted `counterparty` field (`revolutCounterparty()` in `parseRevolut.js`), not a new extraction.** That function already tries the named "tőle"/"neki" pattern and falls back to the raw description - exactly the fallback behavior proposal.md asks for (named sender when extractable, else the raw description), so no new parsing logic is needed, only a new filter (`amount > 0`) and grouping step.

**Click-to-list filters by the same grouping key used to build the summary row, not by exact description-string equality.** Two transactions summed into one row (e.g. two top-ups from the same card) must both appear when that row is clicked. Implementation detail: pass the row's normalized key through to the click handler (closures over the row's source list), not just its display label, since the label alone can't be re-normalized unambiguously in every case (accent/case/word-order variants normalize to the same key but aren't string-identical).

## Risks / Trade-offs

- **[Risk]** Showing non-Bevétel money (top-ups) in the joint income list, right next to Bevétel-sourced contributions, could read as "this is all income" even though it isn't. → Mitigation: this is an intentional, explicit decision (see proposal.md) - the list's purpose is "what came into the joint account," a different question from "what is Bevétel." Labeling/wording in the UI (not a spec-level concern) can make this distinction clear at implementation time.
- **[Risk]** `state.jointRaw` is unfiltered raw data - a transaction excluded as a currency-conversion or piggy-bank movement (neither applies to `rev-joint` today, but nothing prevents it in principle) would still show up here. → Mitigation: out of scope for this change; `rev-joint` has no such real-world case today, and the behavior (show it) is arguably still correct per this list's stated purpose ("what arrived"), not a bug to fix now.

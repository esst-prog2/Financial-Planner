## Context

Greenfield project - no existing code. Two real bank export formats drive the design: OTP's "Számlatörténet" report (a 14-row metadata header followed by a transaction table) and Revolut's export (three sheets sharing one schema: personal EUR, personal HUF, joint HUF). See proposal.md for motivation; see the per-capability specs under `specs/` for full behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Keep all processing (parsing, categorization, currency conversion, charting) client-side, so the user's real financial data never leaves their machine.
- Keep the app zero-install for the user's classmates: open a file, no server, no build step.
- Keep core business logic (parser, categorizer, deduper, currency converter) as pure, independently testable functions.

**Non-Goals:**
- No backend, accounts, login, or cross-device sync.
- No live bank sync or live FX API calls (offline rate table only, per `currency-conversion` spec).
- No budgeting or forecasting - backward-looking analysis only (per the original README brief, still true).
- No manual re-categorization UI for individual transactions - categorization is fully automatic for this MVP.

## Decisions

**Static client-side app, no backend.** Alternative considered: a small Python server (mirroring this course's other assignment, `casino`, which uses `uv run python server.py`). Rejected because it would require classmates to install Python/uv before they could try the demo, and because a server round-trip is unnecessary risk for real personal financial data that can be processed entirely in the browser.

**Core logic tested with Node's built-in test runner (`node:test`).** Alternative: a test framework (Jest/Vitest). Rejected to keep the dependency footprint at zero for testing, consistent with the course's minimal-dependency style (`casino`'s `pyproject.toml` has zero runtime dependencies).

**Native `.xlsx` parsing via a bundled spreadsheet-parsing library (e.g. SheetJS), loaded via CDN.** `.xlsx` is a binary (zip-based) format that cannot be hand-parsed the way CSV can. Alternative considered: ask users to export/save as CSV first, keeping zero parsing dependencies. Rejected - the user explicitly wants native Excel upload, prioritizing user convenience over dependency purity.

**Charting via Chart.js, loaded via CDN.** Alternative: hand-rolled SVG/canvas charts. Chosen for implementation speed; a CDN `<script>` tag doesn't reintroduce a build step, so it doesn't compromise the "open index.html and it works" goal.

**Currency conversion via a bundled offline historical rate table**, not a live FX API. Chosen for demo reliability - a classmate opening the app shouldn't hit a broken chart because an external API was down, rate-limited, or blocked by CORS. Scope is currently limited to EUR (the only non-HUF currency observed in the real export).

**Single, bank-agnostic keyword categorizer; OTP's native "Tranzakció kategória" column is ignored.** Alternative: use OTP's own category column directly for OTP rows, and keyword-match only Revolut rows. Rejected for consistency - a two-rule-set design would let the same kind of merchant land in different categories depending on which bank the transaction came from.

**Self-transfer matching key: (amount, canonical date), where canonical date is always Revolut's "Kezdés dátuma".** Never "Teljesítés dátuma" - keeps the matching key stable against OTP's single timestamp and against Revolut's own start/completion lag (observed up to ~1 day in the sample data).

**Joint account: flat 50% split for personal totals, with a full-detail dedicated view as the reconciliation backstop.** Alternative considered and rejected: a contribution-ratio-weighted split (count each period's joint spending proportionally to who contributed how much that period). The weighted approach is more accurate but adds real complexity - a time-windowed contribution ratio, and an undefined answer for periods with no contributions yet. The user explicitly accepted the flat-50% trade-off on the condition that the dedicated joint view always shows real per-contributor amounts, so the simplification is auditable rather than hidden.

**Sample-data merchant names are derived directly from the categorizer's own keyword lists (`keywords.js`), not a separate hand-written list.** The first version hand-wrote merchant names that were merely *intended* to contain the right keyword, which silently drifted out of sync and miscategorized most of the demo data as Egyéb. Deriving names programmatically from the same source of truth the categorizer reads makes that class of bug structurally impossible, at the cost of slightly less varied-looking merchant names.

**Language toggle is a presentation-only layer (`i18n.js`); category *identity* stays canonical Hungarian everywhere else.** Alternative considered: translate the category strings themselves and carry the display language through categorize.js/pipeline.js. Rejected - that would mean categorization, tests, and specs all need to know about the active language. Instead, every internal category value stays the Hungarian string it always was (`categorize.js`, `keywords.js`, filtering, tests are all untouched by language), and `i18n.js` only maps a category to its displayed label at render time.

## Risks / Trade-offs

- **[Risk]** The flat 50% joint split can misstate the user's real personal spending in periods of unequal contribution. → **Mitigation:** the dedicated joint-account view always shows full, unhalved amounts and the real per-contributor breakdown, so the user can manually reconcile.
- **[Risk]** Keyword-based categorization will misclassify or fail to match transactions with non-merchant-like descriptions (bank codes instead of readable names) - the user's own README already anticipates this. → **Mitigation:** unmatched transactions fall into Egyéb rather than crashing or being silently dropped (per `transaction-categorization` spec).
- **[Risk]** Currency handling only covers EUR today; a future export with a new currency would have no matching rate-table entry. → **Mitigation:** a missing rate surfaces as an explicit error rather than computing a wrong or zero amount (per `currency-conversion` spec).
- **[Risk]** SheetJS and Chart.js are real external dependencies, a step back from an ideal zero-dependency build. → **Mitigation:** both load via CDN `<script>` tags with no build step, preserving "open index.html and it works" for classmates.
- **[Risk]** Matching self-transfers purely by (amount, date) could, in principle, false-positive-match two unrelated transactions that happen to share both. → **Mitigation:** accepted as a known MVP limitation - this is also the exact matching rule the user's original README specified as the success criterion.

## Open Questions

- Exact per-category keyword lists are an implementation detail to be filled in against the real merchant vocabulary observed in the sample/real data; this doesn't change the spec, approach, or task breakdown.
- Exact amount ranges and starting balance for the synthetic sample dataset (e.g. plausible salary magnitude) are deferred to when that dataset is actually generated, per `sample-data-generation`'s spec.

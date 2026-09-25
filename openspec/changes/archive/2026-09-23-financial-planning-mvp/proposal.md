## Why

The user currently has no visibility into where their money goes across two banks (OTP and Revolut, including a joint account shared with another person). This change builds the first useful version of a browser-only spending dashboard: import both banks' Excel exports, categorize and deduplicate the transactions, and show a monthly spending overview — so the user can both use it themselves and demo it to their class as a course project.

## What Changes

- New static, client-side web app (HTML/CSS/JS, no backend/server) — all parsing, categorization, and charting run in the browser so the user's real financial data never leaves their machine.
- Native Excel (`.xlsx`) upload and parsing for four source sheets: OTP (single HUF account) and three Revolut sheets (personal EUR, personal HUF, and a joint HUF account) — **not** CSV, superseding the original README brief.
- A unified transaction model built from both banks' differing export schemas, including OTP's fixed 14-row report-header block.
- Self-transfer detection and exclusion: money moving between the user's own accounts (OTP→Revolut top-up, Revolut→own name) is excluded entirely from both spending and income totals, matched on Revolut's "Kezdés dátuma" (start date).
- A single unified keyword-based categorizer (not per-bank; OTP's own built-in category column is ignored) covering 9 spending categories — Élelmiszer, Vendéglátás, Ruházat/bevásárlás, Egészség/szépség, Szolgáltatások, Orvos, Sport, Közlekedés, Számlák/előfizetés — plus 3 non-spending buckets: Bevétel (any positive amount that isn't an excluded self-transfer), Készpénzfelvét (cash withdrawals), and Egyéb (bank-imposed fees, e.g. currency-conversion fees, even on otherwise-excluded rows). **BREAKING** relative to the original README brief, which scoped 5–8 categories.
- Offline currency conversion: non-HUF Revolut transactions (only the personal EUR sheet) are converted to HUF using a bundled historical daily exchange-rate table, not a live API call.
- Joint-account handling: only 50% of every joint-account expense counts toward the user's personal totals/categories; a dedicated joint-account view shows full (unhalved) category spending plus a per-contributor breakdown of who transferred in how much (parsed from the "Átutalás tőle: <name>" pattern). **BREAKING** relative to the original README brief, which explicitly excluded multi-user/sharing features.
- A monthly summary (income/spending/balance), a category pie chart, and a month-by-month bar chart with a category filter dropdown, per the original README's acceptance criteria.
- A freshly generated synthetic sample dataset matching the real 4-sheet structure (no real names, merchants, or amounts) for demoing to the user's class.

## Capabilities

### New Capabilities
- `transaction-import`: parsing OTP and Revolut `.xlsx` exports into a unified transaction model, including OTP's fixed report-header skip and self-transfer detection/exclusion between the user's own accounts.
- `transaction-categorization`: the unified keyword-based categorizer across the 9 spending categories and 3 non-spending buckets, including the income-sign override rule and the bank-fee-to-Egyéb rule.
- `currency-conversion`: converting non-HUF Revolut transaction amounts to HUF using a bundled offline historical exchange-rate table.
- `joint-account-handling`: the 50% personal-split rule and the dedicated joint-account view (full category spending + per-contributor breakdown).
- `spending-dashboard`: the browser UI — file upload, monthly summary, category pie chart, and month-by-month bar chart with category filtering.
- `sample-data-generation`: producing the synthetic demo dataset matching the real 4-sheet Excel structure.

### Modified Capabilities
_None — greenfield project, no existing specs._

## Impact

- New project: no existing code. Adds a static web app (`index.html` + JS modules + CSS), with core logic (parser, categorizer, deduper, currency converter) as testable pure JS functions run via Node's built-in test runner (`node:test`).
- New dependencies (both via CDN, no build step): a spreadsheet-parsing library (e.g. SheetJS) for `.xlsx` parsing, and Chart.js for the pie/bar charts.
- New project asset: a bundled offline historical HUF exchange-rate table (data file), scoped to the currencies actually observed (EUR).
- New project asset: a synthetic sample `.xlsx` workbook for demos, generated from scratch (not derived from the user's real uploaded file).
- `README.md` will need a follow-up update: it currently describes CSV input and a 5–8 category cap, and explicitly excludes multi-user/sharing features — all superseded by decisions in this change (see `PLANNING_LOG.md` for full rationale). Not part of this change's scope.

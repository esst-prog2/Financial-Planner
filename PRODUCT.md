# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

static HTML/CSS/JS, matching the main app (no build step, no framework)

## Users

People who share a household (and a joint bank account) with someone else, and are tired of mentally recalculating who owes what. People who use more than one bank. People who regularly use an account in a currency they don't normally think in. Primary job: see everything they actually spent, correctly accounted for, without doing the arithmetic themselves.

## Product Purpose

Expense Overview merges a user's OTP and Revolut bank exports - a personal EUR account, a personal HUF account, and a joint account shared with one other person - into one categorized spending dashboard. It converts every currency to HUF automatically, counts only the user's fair half of a joint expense toward their own totals (with a separate full-picture view of the joint account), and lets the user correct a transaction after the fact - delete one that shouldn't count, or mark part of an income as a reimbursement for a specific expense it actually offsets - so a split or reimbursed cost never distorts personal income or spending totals.

## Positioning

Unlike a banking app (which only shows its own single account) or a manual spreadsheet (which requires copying every transaction by hand), Expense Overview reads the bank's own export files directly, categorizes automatically, and remembers every correction across a later re-upload. Unlike a Splitwise-style expense-splitting app (which only knows what the user manually logs), it starts from the real joint-account transactions themselves and lets the user correct the ones that aren't genuinely shared.

## Operating Context

The user uploads an Excel export from OTP (personal account) and Revolut (personal EUR, personal HUF, and a joint HUF account) directly in the browser. No server round-trip, no live bank connection, no account credentials ever leave the browser. The dashboard updates immediately; corrections (deletions, deductions) persist in the browser's local storage and survive a later upload of a different, overlapping export.

## Capabilities and Constraints

- Parses both banks' Excel export formats; converts non-HUF amounts via a bundled offline historical exchange-rate table (no live API, works offline).
- Auto-categorizes transactions by merchant keyword, with manual correction (delete / deduct-and-undo) for anything miscategorized or double-counted.
- Joint-account expenses count at 50% toward personal totals; a dedicated joint view shows the full amount and each contributor's share.
- No live/automatic bank syncing, no accounts/login/multi-device sharing, no budgeting or forecasting (backward-looking analysis only), no mobile app - browser only.
- Demoable without real financial data: `sample-data/minta-penzugyi-adatok.xlsx`, a synthetic one-year workbook generated from scratch (`npm run generate-sample`), not derived from the author's real data.

## Brand Commitments

Working name: "Expense Overview" (matches the app's own page title, `pageTitle` in `js/i18n.js`: "Kiadás-áttekintő" / "Expense overview"). No logo or fixed visual identity yet - open to a name/identity decided during design work on the promo page itself.

## Evidence on Hand

- The real, finished application lives in this repository (`index.html` + `js/`), browser-only, no backend - it can be deployed and tried live, not just described.
- `sample-data/minta-penzugyi-adatok.xlsx` - a synthetic, made-up one-year workbook anyone can upload to try the app without needing real bank data.
- `README.md` section 1 - the existing demo script (what a presenter shows when walking through the app).
- No testimonials, case studies, press, or user metrics exist - this is a university coursework project with one user (the author) so far; the promo page must not fabricate any of these.

## Product Principles

1. One honest number, not several conflicting ones - a joint or reimbursed expense is accounted for correctly the first time, not approximately.
2. No live bank connection, ever - the user's financial data never leaves their own browser.
3. Read the bank's own files; never make the user re-type a transaction.
4. A correction (delete, deduct, undo) must survive a later, different upload of overlapping data - the user's manual work is never silently lost.
5. Backward-looking and honest about its limits - no forecasting, no budgeting advice, no automation that could quietly get a number wrong.

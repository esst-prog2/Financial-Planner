## 1. Project setup

- [x] 1.1 Create the project structure (`index.html`, `css/`, `js/` modules, `tests/`) and verify the files exist
- [x] 1.2 Add SheetJS and Chart.js via CDN `<script>` tags in `index.html` and verify both load with no console errors
- [x] 1.3 Set up `node --test` as the test command (in `package.json`) and verify it runs successfully with zero tests

## 2. Transaction import (OTP + Revolut parsing)

- [x] 2.1 Implement the OTP sheet parser (skip the fixed 14-row header block, read from row 15) and verify with a unit test against a fixture OTP sheet
- [x] 2.2 Implement the Revolut sheet parser (shared schema across `rev-eur`/`rev-hu`/`rev-joint`) and verify with a unit test that tags each transaction with its source account
- [x] 2.3 Implement missing-column error handling for the OTP parser and verify with a unit test that a missing column produces an error, not a crash or silent skip
- [x] 2.4 Implement the unified transaction model, mapping OTP's "Tranzakció idő" and Revolut's "Kezdés dátuma" to a single canonical date field (never "Teljesítés dátuma"), and verify with a unit test using a Revolut row where start and completion dates differ
- [x] 2.5 Implement self-transfer detection (match by amount + canonical date across OTP and Revolut sheets) and verify with unit tests covering an OTP-to-Revolut top-up and a Revolut-to-own-name transfer

## 3. Currency conversion

- [x] 3.1 Build the bundled offline historical HUF exchange-rate table (EUR only, for now) as a data file, and verify it covers the sample data's date range
- [x] 3.2 Implement the HUF-passthrough and EUR-to-HUF conversion function and verify with unit tests for both a HUF and a EUR transaction
- [x] 3.3 Implement missing-rate error handling and verify with a unit test using a date outside the bundled table's range

## 4. Categorization

- [x] 4.1 Define the per-category keyword lists (9 spending categories + Bevétel/Készpénzfelvét/Egyéb), grounded in the merchant names observed in the real export structure
- [x] 4.2 Implement the unified keyword categorizer function and verify with unit tests covering at least one example transaction per spending category
- [x] 4.3 Implement the income-sign override rule (positive amount → Bevétel) and verify with a unit test
- [x] 4.4 Implement cash-withdrawal detection → Készpénzfelvét and verify with a unit test
- [x] 4.5 Implement the bank-fee → Egyéb rule, including fees on otherwise-excluded self-transfer rows, and verify with a unit test
- [x] 4.6 Implement the no-keyword-match → Egyéb fallback and verify with a unit test

## 5. Joint account handling

- [x] 5.1 Implement the 50% personal-split calculation for `rev-joint` expenses and verify with a unit test that personal totals include half of a fixture joint expense
- [x] 5.2 Implement contributor-name extraction from the "Átutalás tőle: <name>" pattern and verify with a unit test covering two different contributor names
- [x] 5.3 Implement exclusion of joint-account contributions-in (both the user's own and the co-holder's) from personal Bevétel and verify with a unit test

## 6. Dashboard UI

- [x] 6.1 Build the file-upload UI and wire it to the parse → dedupe → categorize → convert pipeline; verify by uploading a sample workbook and confirming transactions render
- [x] 6.2 Build the monthly summary (spending/income/balance) and verify the displayed values match a hand-computed total from a fixture workbook
- [x] 6.3 Build the category pie chart with click-to-list-transactions and verify by clicking a slice and checking the listed transactions match that category
- [x] 6.4 Build the month-by-month bar chart with a category-filter dropdown and verify by selecting a category and checking the chart updates to show only that category
- [x] 6.5 Build the dedicated joint-account view (full unhalved category spending + contributor breakdown) and verify against a fixture with two contributors

## 7. Sample data generation

- [x] 7.1 Implement the synthetic workbook generator matching the real 4-sheet structure and verify the output has the same sheets and columns as the real export
- [x] 7.2 Implement plausible Összeg and Egyenleg generation and verify every transaction row has a non-empty Összeg, and every Revolut-sheet row has a non-empty Egyenleg
- [x] 7.3 Implement recurring vs. one-off merchant/person name mixing and verify at least one name repeats and at least one appears only once in the output
- [x] 7.4 Generate the actual sample workbook for class-demo use and verify it opens correctly and matches the app's expected input format

## 8. Documentation

- [x] 8.1 Update README.md to reflect Excel (not CSV) input, the 9+3 category list, and the joint-account capability, and verify its "how we'd know it works" section matches the specs in this change

## 9. Enhancements (post-MVP feedback)

- [x] 9.1 Add a 10th category, Megtakarítás (savings), to `keywords.js`, and verify with a unit test that a savings-keyword description categorizes correctly
- [x] 9.2 Derive `sampleData.js`'s merchant-name pools and category list directly from `keywords.js` instead of a separate hand-written list, and verify with a unit test that no generated spending description falls back to Egyéb
- [x] 9.3 Show each category's percentage of total spending in the pie chart's legend labels (personal and joint views) and verify visually in a browser
- [x] 9.4 Add a month-by-month bar chart with category filter to the joint-account view (full, unhalved amounts) and verify visually in a browser
- [x] 9.5 Make the two joint-account contributors in the generated sample data pay in exactly equal total amounts, and verify with a unit test
- [x] 9.6 Add a Hungarian/English language toggle (`i18n.js`) covering all static UI text and category display labels, without changing the underlying (Hungarian) category values used for filtering/categorization, and verify visually in a browser that switching language re-renders all text

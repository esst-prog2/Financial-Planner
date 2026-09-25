## 1. Accent-insensitive matching

- [x] 1.1 Add a diacritic-stripping normalizer to `js/util.js` and verify with a unit test that "Müller" and "Muller" normalize to the same string
- [x] 1.2 Apply the normalizer to both the description text and the keyword lists in `js/categorize.js`'s matching path, and verify with a unit test that an accent-stripped merchant name (e.g. "Muller Drogeria") still categorizes correctly

## 2. Keyword corrections from the real-data PDF

- [x] 2.1 Move bakery/pékség-type keywords from "Eating out" to "Élelmiszer" in `js/keywords.js` and verify with a unit test that a bakery-type description categorizes as Élelmiszer, not Eating out
- [x] 2.2 Move hobby/könyvesbolt-type keywords from "Ruházat/bevásárlás" to "Szórakozás" in `js/keywords.js` and verify with a unit test that a hobby/book-shop description categorizes as Szórakozás, not Ruházat/bevásárlás
- [x] 2.3 Add the missing keywords identified from the real-data PDF across the affected categories (Eating out, Egészség/szépség, Közlekedés, Megtakarítás, Számlák/előfizetés, Szórakozás) and verify with unit tests covering at least one real example per new keyword group

## 3. Counterparty field on the transaction model

- [x] 3.1 Generalize the existing "Átutalás tőle/neki: `<name>`" extraction in `js/jointAccount.js` into a shared helper in `js/util.js`, and verify existing joint-account tests still pass unchanged
- [x] 3.2 Add a `counterparty` field to `js/parseOtp.js` from the "Ellenoldali név" column, and verify with a unit test
- [x] 3.3 Add a `counterparty` field to `js/parseRevolut.js` using the shared extractor with a raw-description fallback, and verify with a unit test covering both the pattern-match and fallback cases
- [x] 3.4 Carry the `counterparty` field through `js/pipeline.js`'s line items and verify with a unit test

## 4. OTP piggy-bank (persely) exclusion

- [x] 4.1 Add "persely" to the savings-related keyword/detection list and implement the exclusion in `js/pipeline.js`: a positive-amount transaction whose counterparty matches is excluded entirely (like a self-transfer); a negative-amount match is unaffected. Verify with unit tests covering both directions

## 5. Counterparty-name override

- [x] 5.1 Create `js/counterpartyRules.js` with the known name→category mapping (service-provider names → Szolgáltatások; rent-related names → Számlák/előfizetés) and verify with a unit test that a listed name overrides what keyword matching alone would produce
- [x] 5.2 Wire the override into `js/categorize.js` ahead of keyword matching and verify with a unit test that it takes priority over both a conflicting keyword match and the no-match Egyéb fallback

## 6. Refund reclassification

- [x] 6.1 Implement the income-override exception in `js/categorize.js`: a positive-amount transaction matching a merchant/service-type category's keywords (excluding Utalás) is categorized into that category instead of Bevétel. Verify with unit tests covering a refund case, the Utalás exception (stays Bevétel), and the untouched no-match-stays-Bevétel case

## 7. Aggregation module and the netting fix

- [x] 7.1 Extract the category-total, pie-eligibility, and monthly-trend aggregation logic out of `js/app.js` into a new pure module `js/aggregate.js`, computing each category's total as a signed sum (not per-item absolute value before summing), and verify with unit tests: a category with only spending, a category with only a refund, and a category with both spending and a smaller refund (net still negative) and a larger refund (net zero/positive)
- [x] 7.2 Implement pie-eligibility filtering (categories with a zero or positive signed total are excluded from the pie) and descending sort by amount in `js/aggregate.js`, and verify with a unit test
- [x] 7.3 Update `js/app.js`'s monthly summary, category pie, monthly trend, and joint-account pie/trend rendering to use `js/aggregate.js` instead of the old per-item-abs logic, and verify by hand-computing a fixture with a refund and confirming the displayed total matches

## 8. Pie chart colors

- [x] 8.1 Load the project's dataviz color guidance and define a fixed, category-keyed color palette covering all 15 categories (12 spending + Bevétel/Készpénzfelvét/Egyéb), readable in both light and dark mode
- [x] 8.2 Apply the palette to both the personal and joint category pies in `js/app.js` so a given category always renders the same color on both, and verify visually in a browser that no two simultaneously-displayed categories share a color

## 9. Income-by-source view

- [x] 9.1 Implement `incomeBySource(items, month)` in `js/aggregate.js` (group Bevétel transactions by counterparty, sum, sort descending) and verify with a unit test covering repeated income from the same counterparty
- [x] 9.2 Add the income-by-source card to the personal view in `index.html` (prominent total + itemized list) and wire it in `js/app.js`, with `js/i18n.js` strings for both languages, and verify visually in a browser by uploading a workbook with repeated income from one source

## 10. Sample data and documentation

- [x] 10.1 Regenerate `sample-data/minta-penzugyi-adatok.xlsx` and verify the full test suite still passes against the updated keyword lists
- [x] 10.2 Update README.md and PLANNING_LOG.md to reflect the changes in this document, consistent with how prior changes were documented

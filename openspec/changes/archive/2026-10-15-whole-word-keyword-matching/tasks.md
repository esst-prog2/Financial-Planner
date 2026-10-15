All tasks below describe work already implemented and shipped (this change retroactively documents it - see proposal.md).

## 1. Whole-word keyword matching

- [x] 1.1 Add a space-padded `' one '` keyword to `js/keywords.js`'s Számlák/előfizetés list, alongside the existing `'simplep*one'` - verified by `tests/categorize.test.js`'s bare-"One" test
- [x] 1.2 Regression coverage: a keyword appearing only as a substring inside another word does not match - verified by `tests/categorize.test.js`'s "Stonebridge Market" regression test

187 tests pass (`npm test`).

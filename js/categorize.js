import { SPENDING_CATEGORY_KEYWORDS, CASH_WITHDRAWAL_KEYWORDS, CURRENCY_CONVERSION_KEYWORDS, OTP_REVOLUT_LINK_KEYWORDS, PIGGY_BANK_KEYWORDS } from './keywords.js';
import { COUNTERPARTY_CATEGORY_RULES } from './counterpartyRules.js';
import { normalizeText } from './util.js';

export const SPENDING_CATEGORIES = SPENDING_CATEGORY_KEYWORDS.map((c) => c.category);
export const NON_SPENDING_CATEGORIES = ['Bevétel', 'Készpénzfelvét', 'Egyéb'];

// Keyword lists are normalized once at module load (they're static) so
// matching stays accent-insensitive against real export text, which often
// has Hungarian diacritics stripped (e.g. "Muller" for "Müller").
const NORMALIZED_SPENDING_CATEGORY_KEYWORDS = SPENDING_CATEGORY_KEYWORDS.map(({ category, keywords }) => ({
  category,
  keywords: keywords.map(normalizeText),
}));
const NORMALIZED_CASH_WITHDRAWAL_KEYWORDS = CASH_WITHDRAWAL_KEYWORDS.map(normalizeText);
const NORMALIZED_CURRENCY_CONVERSION_KEYWORDS = CURRENCY_CONVERSION_KEYWORDS.map(normalizeText);
const NORMALIZED_OTP_REVOLUT_LINK_KEYWORDS = OTP_REVOLUT_LINK_KEYWORDS.map(normalizeText);
const NORMALIZED_PIGGY_BANK_KEYWORDS = PIGGY_BANK_KEYWORDS.map(normalizeText);

function normalizeCounterpartyRules(rules) {
  return rules.map(({ names, category }) => ({
    names: names.map(normalizeText),
    category,
  }));
}

const DEFAULT_NORMALIZED_COUNTERPARTY_RULES = normalizeCounterpartyRules(COUNTERPARTY_CATEGORY_RULES);

// A positive amount matching one of these can be a refund reducing that
// category, rather than generic income - see the "refund" branch in
// categorizeTransaction(). Utalás is deliberately excluded: an incoming
// transfer always stays Bevétel, so it's never conflated with a refund.
const REFUND_ELIGIBLE_CATEGORY_KEYWORDS = NORMALIZED_SPENDING_CATEGORY_KEYWORDS.filter((c) => c.category !== 'Utalás');

function matchRefundEligibleCategory(text) {
  for (const { category, keywords } of REFUND_ELIGIBLE_CATEGORY_KEYWORDS) {
    if (matchesAny(text, keywords)) return category;
  }
  return null;
}

function matchesAny(text, keywords) {
  return keywords.some((k) => text.includes(k));
}

// A known counterparty always wins, regardless of amount sign or what its
// description would otherwise suggest - see counterpartyRules.js. `rules`
// defaults to the real (locally-loaded) ones; tests pass their own
// throwaway rules instead, so no name - real or made-up - needs to live in
// a committed file just to exercise this mechanism.
function counterpartyOverrideCategory(transaction, rules = DEFAULT_NORMALIZED_COUNTERPARTY_RULES) {
  const text = normalizeText(transaction.counterparty);
  if (!text) return null;
  const rule = rules.find(({ names }) => names.some((n) => text.includes(n)));
  return rule ? rule.category : null;
}

// True for a transaction touching the OTP piggy-bank sub-account ("persely
// számla"), regardless of amount sign - the user's own money moving
// between their own OTP sub-accounts, like the OTP<->Revolut self-transfer
// case, so the pipeline excludes it entirely, both signs.
export function isPiggyBankMovement(transaction) {
  const text = normalizeText(transaction.counterparty || transaction.description);
  return matchesAny(text, NORMALIZED_PIGGY_BANK_KEYWORDS);
}

// True for Revolut's own currency-exchange-between-own-pockets rows (e.g.
// "Devizaváltás HUF pénznemre"), which appear on both the source and
// destination currency sheets. Unlike the savings-account case, this
// excludes BOTH signs - neither the outgoing nor the incoming side of an
// internal currency conversion is real spending or income.
export function isCurrencyConversionMovement(transaction) {
  const text = normalizeText(transaction.description);
  return matchesAny(text, NORMALIZED_CURRENCY_CONVERSION_KEYWORDS);
}

// True for an OTP row tied to the user's own Revolut account/card (e.g.
// "Revolut**2024*", "Revolut*HANNA ESZTER"). This is always the user's
// own money moving between their own OTP and Revolut accounts - excluded
// entirely regardless of sign, same as isCurrencyConversionMovement, and
// independent of whether the matching Revolut-side row happens to be in
// the uploaded date range (see selfTransfer.js for the pair-matching path,
// which this complements rather than replaces).
export function isOtpRevolutLinkTransaction(transaction) {
  if (transaction.source !== 'otp') return false;
  const text = normalizeText(transaction.description);
  return matchesAny(text, NORMALIZED_OTP_REVOLUT_LINK_KEYWORDS);
}

// Categorizes a transaction's own amount. A row's Díj (fee), if any, is
// categorized separately - see categorizeFee. `counterpartyRules`, if
// given, overrides the real counterparty rules for this call only - see
// counterpartyOverrideCategory.
export function categorizeTransaction(transaction, { counterpartyRules } = {}) {
  const normalizedCounterpartyRules = counterpartyRules ? normalizeCounterpartyRules(counterpartyRules) : undefined;
  const overrideCategory = counterpartyOverrideCategory(transaction, normalizedCounterpartyRules);
  if (overrideCategory) return overrideCategory;

  const text = ` ${normalizeText(transaction.description)} `;

  if (transaction.amount > 0) {
    return matchRefundEligibleCategory(text) || 'Bevétel';
  }
  if (matchesAny(text, NORMALIZED_CASH_WITHDRAWAL_KEYWORDS)) return 'Készpénzfelvét';

  for (const { category, keywords } of NORMALIZED_SPENDING_CATEGORY_KEYWORDS) {
    if (matchesAny(text, keywords)) return category;
  }

  return 'Egyéb';
}

// A nonzero fee is always Egyéb, even when the row it's attached to is
// otherwise excluded as a self-transfer.
export function categorizeFee(transaction) {
  return transaction.fee ? 'Egyéb' : null;
}

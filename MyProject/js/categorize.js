import { SPENDING_CATEGORY_KEYWORDS, CASH_WITHDRAWAL_KEYWORDS, CURRENCY_CONVERSION_KEYWORDS, OTP_REVOLUT_LINK_KEYWORDS } from './keywords.js';
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

const SAVINGS_KEYWORDS = NORMALIZED_SPENDING_CATEGORY_KEYWORDS.find((c) => c.category === 'Megtakarítás').keywords;

const NORMALIZED_COUNTERPARTY_RULES = COUNTERPARTY_CATEGORY_RULES.map(({ names, category }) => ({
  names: names.map(normalizeText),
  category,
}));

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
// description would otherwise suggest - see counterpartyRules.js.
function counterpartyOverrideCategory(transaction) {
  const text = normalizeText(transaction.counterparty);
  if (!text) return null;
  const rule = NORMALIZED_COUNTERPARTY_RULES.find(({ names }) => names.some((n) => text.includes(n)));
  return rule ? rule.category : null;
}

// True for a transaction touching a savings-type sub-account (e.g. the OTP
// piggy-bank "persely számla"), regardless of amount sign. The pipeline
// uses this to exclude only the *positive* case entirely (money returning
// from the sub-account isn't income) - a negative match still flows
// through categorizeTransaction() as Megtakarítás, unaffected.
export function isSavingsAccountMovement(transaction) {
  const text = normalizeText(transaction.counterparty || transaction.description);
  return matchesAny(text, SAVINGS_KEYWORDS);
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
// categorized separately - see categorizeFee.
export function categorizeTransaction(transaction) {
  const overrideCategory = counterpartyOverrideCategory(transaction);
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

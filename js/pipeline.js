import { parseOtpSheet } from './parseOtp.js';
import { parseRevolutSheet } from './parseRevolut.js';
import { detectSelfTransferIndices } from './selfTransfer.js';
import { isJointContribution, splitJointAmount } from './jointAccount.js';
import { categorizeTransaction, categorizeFee, isPiggyBankMovement, isCurrencyConversionMovement, isOtpRevolutLinkTransaction } from './categorize.js';
import { toHuf } from './currency.js';

// sheets: { otp, 'rev-eur', 'rev-hu', 'rev-joint' } - each a 2D array of
// rows as produced by XLSX.utils.sheet_to_json(sheet, { header: 1 }).
// Returns a flat list of processed line items ready for aggregation: each
// carries category, amountHuf (full amount) and personalAmountHuf (halved
// for rev-joint lines, per the joint-account split rule).
export function buildLineItems(sheets, { ownerName } = {}) {
  const raw = [
    ...parseOtpSheet(sheets.otp),
    ...parseRevolutSheet(sheets['rev-eur'], 'revolut-eur'),
    ...parseRevolutSheet(sheets['rev-hu'], 'revolut-hu'),
    ...parseRevolutSheet(sheets['rev-joint'], 'revolut-joint'),
  ];

  const excludedSelfTransfer = detectSelfTransferIndices(raw, { ownerName });
  const lineItems = [];

  raw.forEach((t, i) => {
    const isJoint = t.source === 'revolut-joint';
    const feeHuf = t.fee ? toHuf(t.fee, t.currency, t.date) : 0;

    if (feeHuf) {
      const amountHuf = -Math.abs(feeHuf);
      lineItems.push({
        source: t.source,
        date: t.date,
        description: t.description,
        counterparty: t.counterparty,
        category: categorizeFee(t),
        amountHuf,
        personalAmountHuf: isJoint ? splitJointAmount(amountHuf) : amountHuf,
        isFee: true,
      });
    }

    // Money moving either direction between the main account and the OTP
    // piggy-bank sub-account is the user's own money, not spending or
    // income - excluded entirely, like a self-transfer, regardless of sign.
    const isExcludedPiggyBankMovement = isPiggyBankMovement(t);

    // Revolut's own currency-exchange-between-own-pockets rows (e.g.
    // "Devizaváltás HUF pénznemre") appear on both the source and
    // destination currency sheets - neither side is spending or income, so
    // both signs are excluded, unlike the savings-account case above.
    const isExcludedCurrencyConversion = isCurrencyConversionMovement(t);

    // An OTP row tied to the user's own Revolut account/card
    // ("Revolut**2024*", "Revolut*HANNA ESZTER") is a self-transfer even
    // when the matching Revolut-side row isn't in the uploaded date range,
    // so detectSelfTransferIndices' pair-matching can't find it - this
    // pattern-based check catches those regardless.
    const isExcludedOtpRevolutLink = isOtpRevolutLinkTransaction(t);

    if (
      excludedSelfTransfer.has(i) ||
      isJointContribution(t) ||
      isExcludedPiggyBankMovement ||
      isExcludedCurrencyConversion ||
      isExcludedOtpRevolutLink
    ) {
      return;
    }

    const amountHuf = toHuf(t.amount, t.currency, t.date);
    lineItems.push({
      source: t.source,
      date: t.date,
      description: t.description,
      counterparty: t.counterparty,
      category: categorizeTransaction(t),
      amountHuf,
      personalAmountHuf: isJoint ? splitJointAmount(amountHuf) : amountHuf,
      isFee: false,
    });
  });

  return lineItems;
}

export function monthOf(dateIso) {
  return dateIso ? dateIso.slice(0, 7) : null;
}

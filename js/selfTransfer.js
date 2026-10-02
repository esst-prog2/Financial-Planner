import { normalizeText } from './util.js';

// Detects transfers of the user's own money between their own accounts, so
// the pipeline can exclude them from both spending and income totals.
export function detectSelfTransferIndices(transactions, { ownerName } = {}) {
  const excluded = new Set();

  // OTP <-> Revolut top-up: an OTP row and a Revolut row on the same
  // canonical date, same currency, same magnitude, opposite sign.
  for (let i = 0; i < transactions.length; i++) {
    const a = transactions[i];
    if (a.source !== 'otp' || excluded.has(i)) continue;
    for (let j = 0; j < transactions.length; j++) {
      if (i === j || excluded.has(j)) continue;
      const b = transactions[j];
      if (b.source === 'otp') continue;
      const sameDay = a.date === b.date;
      const sameCurrency = a.currency === b.currency;
      const sameMagnitude = Math.abs(a.amount) === Math.abs(b.amount);
      const oppositeSign = Math.sign(a.amount) !== Math.sign(b.amount) && a.amount !== 0;
      if (sameDay && sameCurrency && sameMagnitude && oppositeSign) {
        excluded.add(i);
        excluded.add(j);
        break;
      }
    }
  }

  // Any OUTGOING (negative-amount) transaction mentioning the owner's own
  // given name, in description OR counterparty, on either side (OTP or
  // Revolut) - deliberately blunt, not limited to a specific "Átutalás
  // neki: <name>" pattern, so it also catches cases like an OTP transfer
  // funding the user's own joint account, which doesn't pair-match
  // (different date/amount) and doesn't mention "revolut". Positive
  // amounts are deliberately excluded from this check - real incoming
  // payments routinely name the recipient (e.g. a salary memo like "MUN
  // Fikció Hanna"), which would otherwise wrongly exclude real income.
  // Matches accent/case-insensitively (real exports often strip accents).
  // Only the given name (ownerName's last word, Hungarian surname-first
  // order) is used, not the full name - matching the surname too risks
  // false positives when it's also an ordinary word (e.g. "Karácsony" also
  // means "Christmas"). A transfer to someone else who shares that given
  // name would also match - an accepted limitation.
  if (ownerName) {
    const nameParts = normalizeText(ownerName.trim()).split(/\s+/).filter(Boolean);
    const needle = nameParts[nameParts.length - 1];
    if (needle) {
      transactions.forEach((t, i) => {
        if (excluded.has(i) || !(t.amount < 0)) return;
        const text = normalizeText(`${t.description || ''} ${t.counterparty || ''}`);
        if (text.includes(needle)) excluded.add(i);
      });
    }
  }

  return excluded;
}

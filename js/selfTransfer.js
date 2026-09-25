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

  // Revolut -> own name: e.g. "Átutalás neki: <ownerName>". Matches on the
  // literal owner name, so a transfer to someone else who shares that first
  // name would also match - an accepted MVP limitation.
  if (ownerName) {
    const needle = ownerName.trim().toLowerCase();
    transactions.forEach((t, i) => {
      if (t.source === 'otp' || excluded.has(i)) return;
      const desc = (t.description || '').toLowerCase();
      if (desc.includes('átutalás') && desc.includes(needle)) {
        excluded.add(i);
      }
    });
  }

  return excluded;
}

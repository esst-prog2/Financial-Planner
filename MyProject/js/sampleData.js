// Generates synthetic sample data matching the real 4-sheet OTP/Revolut
// export structure, with no real personal data - see
// specs/sample-data-generation/spec.md.

import { SPENDING_CATEGORY_KEYWORDS } from './keywords.js';

const OTP_HEADER = ['Számlaszám', 'Ellenoldali számla', 'Ellenoldali név', 'Forgalom típusa', 'Közlemény', 'Tranzakció kategória', 'Banki azonosító', 'Tranzakció idő', 'Könyvelt', 'Összeg', 'Devizanem'];
const REV_HEADER = ['Típus', 'Termék', 'Kezdés dátuma', 'Teljesítés dátuma', 'Leírás', 'Összeg', 'Díj', 'Pénznem', 'State', 'Egyenleg'];

const NAME_PREFIXES = ['Minta', 'Teszt', 'Fikció', 'Példa'];

function keywordToMerchantName(keyword, index) {
  const clean = keyword.trim();
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `${NAME_PREFIXES[index % NAME_PREFIXES.length]} ${capitalized}`;
}

// Merchant name pools are built directly from the categorizer's own
// keyword lists (keywords.js) instead of a separate hand-written list, so
// a generated name is *structurally guaranteed* to categorize into the
// category it was drawn from - it can't silently drift out of sync with
// the real categorization rules the way a hand-picked name could.
// Recurring merchants/people appear on most days sampled; one-off ones
// appear exactly once, per the "mixed name frequency" requirement.
function buildNamePools() {
  const recurring = {};
  const oneOff = {};
  for (const { category, keywords } of SPENDING_CATEGORY_KEYWORDS) {
    const names = keywords.map(keywordToMerchantName);
    recurring[category] = names.filter((_, i) => i % 2 === 0);
    oneOff[category] = names.filter((_, i) => i % 2 === 1);
    // Categories with very few keywords could otherwise end up with an
    // empty bucket - fall back to the full set rather than pick() on [].
    if (recurring[category].length === 0) recurring[category] = names;
    if (oneOff[category].length === 0) oneOff[category] = names;
  }
  return { recurring, oneOff };
}

const { recurring: RECURRING, oneOff: ONE_OFF } = buildNamePools();

const DEFAULT_AMOUNT_RANGE = [1000, 10000];

const CATEGORY_AMOUNT_RANGE = {
  Élelmiszer: [1500, 8000],
  'Eating out': [1000, 6000],
  'Ruházat/bevásárlás': [3000, 25000],
  'Egészség/szépség': [2000, 12000],
  Szolgáltatások: [2000, 20000],
  Orvos: [3000, 20000],
  Sport: [4000, 15000],
  Közlekedés: [500, 15000],
  'Számlák/előfizetés': [2000, 30000],
  Megtakarítás: [10000, 50000],
  Szórakozás: [2000, 15000],
  Utalás: [2000, 30000],
};

const CONTRIBUTOR_NAMES = ['Teszt Anna', 'Minta Béla'];
// A joint-contribution "round" is a same-day, same-amount pair - one
// transaction per contributor - so their running totals stay exactly
// equal by construction, not by chance.
const CONTRIBUTION_ROUND_INTERVAL_DAYS = 9;

function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function randomInt(random, min, max) {
  return Math.round(min + random() * (max - min));
}

function formatOtpDate(date) {
  const iso = date.toISOString();
  return `${iso.slice(0, 10).replaceAll('-', '.')} ${iso.slice(11, 19)}`;
}

function formatRevolutDate(date) {
  const iso = date.toISOString();
  return `${iso.slice(0, 10).replaceAll('-', '.')} ${iso.slice(11, 16)}`;
}

function reportHeaderBlock(accountNumber, startDate, endDate) {
  const rows = Array.from({ length: 14 }, () => ['']);
  rows[0] = ['Számlatörténet'];
  rows[2] = ['Számlaszám', `[${accountNumber}]`];
  rows[3] = ['Lekérdezés időpontja', new Date().toISOString().slice(0, 19).replace('T', ' ')];
  rows[4] = ['Lekérdezés kezdete', startDate];
  rows[5] = ['Lekérdezés vége', endDate];
  return rows;
}

// Derived from keywords.js, not CATEGORY_AMOUNT_RANGE's own keys, so a
// category added there is automatically included here too.
function categoryList() {
  return SPENDING_CATEGORY_KEYWORDS.map((c) => c.category);
}

function spendingRow(random, date) {
  const category = pick(random, categoryList());
  const useRecurring = random() < 0.6;
  const pool = useRecurring ? RECURRING[category] : ONE_OFF[category];
  const merchant = pick(random, pool);
  const [min, max] = CATEGORY_AMOUNT_RANGE[category] || DEFAULT_AMOUNT_RANGE;
  const amount = -randomInt(random, min, max);
  return { date, merchant, amount };
}

// Builds the sheet data (2D arrays) for all 4 sheets. Deterministic given
// the same seed, so tests can assert on it reliably.
export function generateSampleWorkbookData({ seed = 1, days = 45, salaryHuf = 380000 } = {}) {
  const random = mulberry32(seed);
  const start = new Date('2026-08-08T00:00:00Z');

  const otpRows = [...reportHeaderBlock('1177309200582944', '2026.08.08', '2026.09.22'), OTP_HEADER];
  const revEur = [REV_HEADER];
  const revHu = [REV_HEADER];
  const revJoint = [REV_HEADER];

  let revEurBalance = 150000;
  let revHuBalance = 90000;
  let revJointBalance = 40000;
  let nextContributionDay = 0;

  for (let day = 0; day < days; day++) {
    const date = new Date(start.getTime() + day * 86400000);

    // Salary, once a month, on the 10th.
    if (date.getUTCDate() === 10) {
      otpRows.push(['', '', '', 'MUNKABÉR ÁTUTALÁS', 'Minta Munkáltató Kft. jövedelem', '', String(otpRows.length), formatOtpDate(date), 'x', salaryHuf, 'HUF']);
    }

    // A handful of OTP spending rows most days.
    if (random() < 0.7) {
      const { merchant, amount } = spendingRow(random, date);
      otpRows.push(['', '', merchant, 'VÁSÁRLÁS KÁRTYÁVAL', '', '', String(otpRows.length), formatOtpDate(date), 'x', amount, 'HUF']);
    }

    // Occasional cash withdrawal.
    if (random() < 0.08) {
      otpRows.push(['', '', '', 'KÉSZPÉNZFELVÉT ATM-BŐL', 'Budapest, Teszt utca 1', '', String(otpRows.length), formatOtpDate(date), 'x', -randomInt(random, 10000, 40000), 'HUF']);
    }

    // rev-eur: occasional EUR spending.
    if (random() < 0.3) {
      const { merchant } = spendingRow(random, date);
      const eurAmount = -randomInt(random, 5, 40);
      revEurBalance += eurAmount;
      revEur.push(['Kártyás fizetés', 'Folyószámla', formatRevolutDate(date), formatRevolutDate(new Date(date.getTime() + 3600000)), merchant, eurAmount, 0, 'EUR', 'ELVÉGEZVE', revEurBalance]);
    }

    // rev-hu: occasional HUF spending.
    if (random() < 0.4) {
      const { merchant, amount } = spendingRow(random, date);
      revHuBalance += amount;
      revHu.push(['Kártyás fizetés', 'Folyószámla', formatRevolutDate(date), formatRevolutDate(new Date(date.getTime() + 3600000)), merchant, amount, 0, 'HUF', 'ELVÉGEZVE', revHuBalance]);
    }

    // OTP -> Revolut (rev-hu) top-up, matched pair, a couple of times.
    if (random() < 0.06) {
      const topUp = randomInt(random, 5000, 20000);
      otpRows.push(['', '', 'Revolut**2024*', 'VÁSÁRLÁS KÁRTYÁVAL', '', '', String(otpRows.length), formatOtpDate(date), 'x', -topUp, 'HUF']);
      revHuBalance += topUp;
      revHu.push(['Feltöltés', 'Folyószámla', formatRevolutDate(date), formatRevolutDate(date), 'Apple Pay összegű feltöltés a(z) *0117 eszközödön', topUp, 0, 'HUF', 'ELVÉGEZVE', revHuBalance]);
    }

    // Joint account: both co-holders contribute the same amount, same day.
    if (day === nextContributionDay) {
      const contribution = randomInt(random, 15000, 40000);
      for (const contributor of CONTRIBUTOR_NAMES) {
        revJointBalance += contribution;
        revJoint.push(['Átutalás', 'Folyószámla', formatRevolutDate(date), formatRevolutDate(date), `Átutalás tőle: ${contributor}`, contribution, 0, 'HUF', 'ELVÉGEZVE', revJointBalance]);
      }
      nextContributionDay += CONTRIBUTION_ROUND_INTERVAL_DAYS;
    }
    if (random() < 0.35) {
      const { merchant, amount } = spendingRow(random, date);
      revJointBalance += amount;
      revJoint.push(['Kártyás fizetés', 'Folyószámla', formatRevolutDate(date), formatRevolutDate(new Date(date.getTime() + 3600000)), merchant, amount, 0, 'HUF', 'ELVÉGEZVE', revJointBalance]);
    }
  }

  return { otp: otpRows, 'rev-eur': revEur, 'rev-hu': revHu, 'rev-joint': revJoint };
}

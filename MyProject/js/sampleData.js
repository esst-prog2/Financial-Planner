// Generates synthetic sample data matching the real 4-sheet OTP/Revolut
// export structure - see specs/sample-data-generation/spec.md.
//
// Merchant/business names are taken verbatim from the user's own manually
// categorized transaction list (Kategoriak_v2.pdf), since a shop or company
// name isn't personal data and it keeps the demo looking like the real
// statements. Every *person* (transfer recipients, senders, landlord,
// service providers) is invented - no real personal name appears here.

const OTP_HEADER = ['Számlaszám', 'Ellenoldali számla', 'Ellenoldali név', 'Forgalom típusa', 'Közlemény', 'Tranzakció kategória', 'Banki azonosító', 'Tranzakció idő', 'Könyvelt', 'Összeg', 'Devizanem'];
const REV_HEADER = ['Típus', 'Termék', 'Kezdés dátuma', 'Teljesítés dátuma', 'Leírás', 'Összeg', 'Díj', 'Pénznem', 'State', 'Egyenleg'];

// Card-purchase merchants per category. `recurring` names are drawn many
// times (regular shops); each `oneOff` name is used at most once per
// generated workbook, per the "mixed name frequency" requirement. Each name
// must categorize into its own category with the real keyword lists - the
// sampleData test asserts that, so this can't silently drift out of sync.
export const MERCHANTS = {
  Élelmiszer: {
    recurring: ['SPAR MAGYARORSZAG KFT.', 'SPAR MAGYARORSZÁG KFT', 'LIDL HU 274 Budapest', 'Lidl', 'LIPÓTI PÉKSÉG', 'COOP MINI ÉLELMISZER'],
    oneOff: ['LIDL HU 101 Balatonlel', 'LIDL HU 335 Budapest', 'Szerelmes Level Pekmuh', 'Szerelmes Levél', 'Lipoti Pekseg Bartok', 'PRÍMA PÉK', 'SPAR Food & Fuel', 'arán bakery'],
  },
  'Eating out': {
    recurring: ['MCD ALLEE', 'Cafe+Co HU 223562', 'SMPLPAY*KNORR-BREMSE 6', 'HELOPAY*KNORR-BREMSE 6', 'foodora', 'My Green Cup'],
    oneOff: [
      'Padthai Wokbar (Allee)', 'NYX*CocaColaHBCMagyaro', 'Figurans Bisztro', 'Cafe+Co HU 223549', 'JonoYogo Etele',
      'LÁGYMÁNYOS CAMPUS', "Quentin's Burger Budap", 'CAFE FREI ETELE PLÁZA', 'BELLOZZO ETELE', 'PHO 1993',
      "Simon's Burger Allee -", 'Allegro Ristorante Bar', 'KEG Sörművház', 'Kfc', 'Knorr-Bremse', 'Tradíció Rétesház',
    ],
  },
  'Ruházat/bevásárlás': {
    recurring: ['PIREX PAPÍR ETELE', 'RESERVED ALLEE 6912320', 'DECATHLON-CORVIN', 'Tchibo 7855'],
    oneOff: [
      'BERSHKA BUDAPEST', 'RESERVED CORVIN 691220', 'DECATHLON NYUGATI TÉR', 'ISTYLE ETELE', 'HU0353 H&M ETELE PLAZA',
      'MANGO BUDAPEST MAMMUT', 'ARENA MAGYARORSZAG KFT', 'RESERVED BUDAPEST ARKA', 'PIREX PAPÍR CORVIN',
      'Calzedonia - Etele', 'LUSH Allee', "Women's Secret  Etele", 'PRIMARK 846 Budape', 'Tezenis - Etele',
      'Pirex Papier', 'New Garden', 'Stradivarius', 'PIREX ALLEE',
    ],
  },
  'Egészség/szépség': {
    recurring: ['DM 233.SZ.', 'Muller Drogeria 5257', 'ROSSMANN 241.'],
    oneOff: [
      'DM 080 VÁMHÁZ KÖRÚ', 'Notino HU Mammut', 'MAMMUT PATIKA', 'VISION EXPRESS 523.', 'DM 388.', 'Muller Drogeria 5253',
      'Muller Drogeria Magyar', 'DM 205 HENGERHALOM', 'ECOFAMILY ÚJBUDA', 'BENU ARANY MÉRLEG', 'Ujhullam Fodraszkellek',
      'VISION EXPRESS 545.',
    ],
  },
  // The invented "person" service providers: a SumUp terminal payment names
  // the provider's business, and the keyword is 'sumup' - not the person.
  Szolgáltatások: {
    recurring: ['SumUp *Teszt Edina E'],
    oneOff: ['SumUp *Minta Fanni F'],
  },
  Orvos: {
    recurring: ['Dentalia Medicina'],
    oneOff: ['Gyn Obs'],
  },
  Sport: {
    recurring: ['Pesti Pilates'],
    oneOff: [],
  },
  Szórakozás: {
    recurring: ['B CINEMA CITY ALLEE', 'Kreativ Hobby - Allee', 'BARION *Jegy.hu'],
    oneOff: [
      'LIBRO-TRADE KFT.', 'Kreativ Hobby - Pop -', 'TROPICAL AND RARE KFT', 'Budapest Park', 'Reflexshop Budai Szaku',
      'LÍRA KÖNYVÁRUHÁZ', 'puzzlegarden.hu', 'Kreatív Hobby', 'Oxford Könyvesbolt',
    ],
  },
  Közlekedés: {
    recurring: ['BKK AUTOMATA - I11', 'SIMPLEP*BudapestGO app', 'Bolt'],
    oneOff: ['SIMPLEP*mav-start', 'BKK AUTOMATA - G99'],
  },
  Megtakarítás: {
    recurring: ['Magyar Államkincstár'],
    oneOff: ['SIMPLEP*webkincstar'],
  },
};

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
  Megtakarítás: [10000, 30000],
  Szórakozás: [2000, 15000],
};

// How often each account draws from each category - a shopping-heavy
// personal account, a EUR card used for everyday trips, a household joint
// account. Utalás and Számlák/előfizetés aren't here: transfers and bills
// are generated as their own scheduled/structured events below.
const PERSONAL_WEIGHTS = {
  Élelmiszer: 6, 'Eating out': 5, 'Ruházat/bevásárlás': 3, 'Egészség/szépség': 2.5, Szolgáltatások: 1,
  Orvos: 0.7, Sport: 1.2, Szórakozás: 2, Közlekedés: 3, Megtakarítás: 0.3,
};
const EUR_WEIGHTS = { Közlekedés: 3, 'Eating out': 3, Élelmiszer: 2, 'Ruházat/bevásárlás': 1.5, Szórakozás: 1 };
const JOINT_WEIGHTS = { Élelmiszer: 6, 'Eating out': 2, Szórakozás: 2, 'Egészség/szépség': 1, 'Ruházat/bevásárlás': 1 };

const CONTRIBUTOR_NAMES = ['Teszt Anna', 'Minta Béla'];
// The first co-holder is the sample workbook's owner: type this into the
// app's "Saját név" field so "Átutalás neki: Teszt Anna" counts as a
// self-transfer.
export const OWNER_NAME = CONTRIBUTOR_NAMES[0];

// A joint-contribution "round" is a same-day, same-amount pair - one
// transaction per contributor - so their running totals stay exactly
// equal by construction, not by chance.
const CONTRIBUTION_ROUND_INTERVAL_DAYS = 9;

// Invented people for person-to-person transfers.
const TRANSFER_RECIPIENTS = ['Példa Kata', 'Fikció Zsolt', 'Minta Zsuzsanna'];
const TRANSFER_SENDERS = ['Fikció Zsolt', 'Példa Kata'];
const LANDLORD_NAME = 'Minta Péter';
const HAIRDRESSER_NAME = 'Példa Fanni';
const EMPLOYER_NAME = 'Minta Munkáltató Kft.';

// Fictional exchange rate, only used to make the two sides of a currency
// exchange line up plausibly.
const HUF_PER_EUR = 400;

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

function pickWeighted(random, weights) {
  const entries = Object.entries(weights);
  let roll = random() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1][0];
}

function randomInt(random, min, max) {
  return Math.round(min + random() * (max - min));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function formatOtpDate(date) {
  const iso = date.toISOString();
  return `${iso.slice(0, 10).replaceAll('-', '.')} ${iso.slice(11, 19)}`;
}

function formatRevolutDate(date) {
  const iso = date.toISOString();
  return `${iso.slice(0, 10).replaceAll('-', '.')} ${iso.slice(11, 16)}`;
}

function formatQueryDate(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '.');
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

// Hands out merchant names: mostly a recurring one, sometimes a one-off
// that is then used up so it can't repeat.
function createMerchantPicker(random) {
  const oneOffLeft = Object.fromEntries(Object.entries(MERCHANTS).map(([category, m]) => [category, [...m.oneOff]]));
  return function pickMerchant(category) {
    const left = oneOffLeft[category];
    if (left.length > 0 && random() < 0.4) {
      return left.splice(Math.floor(random() * left.length), 1)[0];
    }
    return pick(random, MERCHANTS[category].recurring);
  };
}

// Builds the sheet data (2D arrays) for all 4 sheets. Deterministic given
// the same seed (apart from the OTP report's "Lekérdezés időpontja"
// timestamp), so tests can assert on it reliably.
export function generateSampleWorkbookData({ seed = 1, days = 45, salaryHuf = 380000 } = {}) {
  const random = mulberry32(seed);
  const pickMerchant = createMerchantPicker(random);
  const start = new Date('2026-08-08T00:00:00Z');
  const end = new Date(start.getTime() + (days - 1) * 86400000);

  const otpRows = [...reportHeaderBlock('1177309200582944', formatQueryDate(start), formatQueryDate(end)), OTP_HEADER];
  const sheets = {
    eur: { rows: [REV_HEADER], balance: 600, currency: 'EUR' },
    hu: { rows: [REV_HEADER], balance: 300000, currency: 'HUF' },
    joint: { rows: [REV_HEADER], balance: 150000, currency: 'HUF' },
  };

  function otp(date, { type, counterparty = '', memo = '', amount }) {
    otpRows.push(['', '', counterparty, type, memo, '', String(otpRows.length), formatOtpDate(date), 'x', amount, 'HUF']);
  }

  // A Revolut row moves the running Egyenleg by the amount and any fee.
  function revolut(sheet, date, { type = 'Kártyás fizetés', description, amount, fee = 0, completedAt }) {
    sheet.balance = round2(sheet.balance + amount - fee);
    const completed = completedAt || new Date(date.getTime() + 3600000);
    sheet.rows.push([type, 'Folyószámla', formatRevolutDate(date), formatRevolutDate(completed), description, amount, fee, sheet.currency, 'ELVÉGEZVE', sheet.balance]);
  }

  function spending(weights) {
    const category = pickWeighted(random, weights);
    const merchant = pickMerchant(category);
    const [min, max] = CATEGORY_AMOUNT_RANGE[category] || DEFAULT_AMOUNT_RANGE;
    return { category, merchant, amount: -randomInt(random, min, max) };
  }

  // The state-savings transfer is a bank transfer; everything else is a card payment.
  const otpTypeFor = (merchant) => (merchant.includes('Államkincstár') ? 'ÁTUTALÁS' : 'VÁSÁRLÁS KÁRTYÁVAL');

  let nextContributionDay = 0;

  for (let day = 0; day < days; day++) {
    const date = new Date(start.getTime() + day * 86400000);
    const dom = date.getUTCDate();

    // --- Scheduled monthly events ---

    if (dom === 10) {
      otp(date, { type: 'MUNKABÉR ÁTUTALÁS', counterparty: EMPLOYER_NAME, memo: 'jövedelem', amount: salaryHuf });
    }

    // Own savings sub-account: money in on the 11th (Megtakarítás), some
    // coming back on the 19th (own money returning, not income).
    if (dom === 11) {
      otp(date, { type: 'ÁTUTALÁS', counterparty: 'PERSELY SZÁMLA', amount: -randomInt(random, 10000, 25000) });
    }
    if (dom === 19 && random() < 0.6) {
      otp(date, { type: 'ÁTUTALÁS', counterparty: 'PERSELY SZÁMLA', amount: randomInt(random, 8000, 15000) });
    }

    // Recurring bills and subscriptions (Számlák/előfizetés).
    if (dom === 9) {
      revolut(sheets.eur, date, { description: 'Anthropic', amount: -18 });
    }
    if (dom === 12) {
      otp(date, { type: 'VÁSÁRLÁS KÁRTYÁVAL', counterparty: 'SIMPLEP*one', amount: -randomInt(random, 1500, 4000) });
    }
    if (dom === 14) {
      otp(date, { type: 'VÁSÁRLÁS KÁRTYÁVAL', counterparty: 'APPLE.COM/BILL', amount: -1490 });
    }
    // Rent is a transfer to a person - its "Havi Lakbér" memo (not the
    // invented landlord's name) is what categorizes it as a bill.
    if (dom === 15) {
      otp(date, { type: 'ÁTUTALÁS', counterparty: LANDLORD_NAME, memo: 'Havi Lakbér', amount: -110000 });
    }
    if (dom === 18) {
      revolut(sheets.joint, date, { description: 'MVM NEXT ENERGIAK', amount: -randomInt(random, 12000, 28000) });
    }
    if (dom === 20) {
      revolut(sheets.joint, date, { description: 'TelekomSzaml*100200301', amount: -randomInt(random, 7000, 11000) });
    }
    if (dom === 22) {
      otp(date, { type: 'VÁSÁRLÁS KÁRTYÁVAL', counterparty: 'SIMPLEP*TELEKOM2597', amount: -randomInt(random, 5000, 9000) });
    }

    // Bank charge - a fee that isn't tied to any merchant (Egyéb).
    if (dom === 25) {
      otp(date, { type: 'ESETI MEGBÍZÁSOK KÖLTSÉGE', amount: -randomInt(random, 100, 400) });
      // Money coming back from the user's own Revolut account, with no
      // matching Revolut-side row in the export.
      otp(date, { type: 'ÁTUTALÁS', counterparty: `Revolut*${OWNER_NAME}`, amount: randomInt(random, 10000, 30000) });
    }

    // Hairdresser paid by bank transfer: the "Fodrász" memo categorizes it
    // as a service, where a plain transfer to a person would be Utalás.
    if (dom === 23) {
      otp(date, { type: 'ÁTUTALÁS', counterparty: HAIRDRESSER_NAME, memo: 'Fodrász', amount: -randomInt(random, 6000, 12000) });
    }

    // Revolut currency exchange: appears on BOTH currency sheets, and is
    // neither spending nor income. HUF -> EUR in the first month sampled,
    // EUR -> HUF after that; the first carries a small fee.
    if (dom === 13) {
      if (date.getUTCMonth() === 7) {
        const eur = 150;
        revolut(sheets.hu, date, { type: 'Csere', description: 'Devizaváltás EUR pénznemre', amount: -eur * HUF_PER_EUR, fee: 300 });
        revolut(sheets.eur, date, { type: 'Csere', description: 'Devizaváltás EUR pénznemre', amount: eur });
      } else {
        const eur = 60;
        revolut(sheets.eur, date, { type: 'Csere', description: 'Devizaváltás HUF pénznemre', amount: -eur });
        revolut(sheets.hu, date, { type: 'Csere', description: 'Devizaváltás HUF pénznemre', amount: eur * HUF_PER_EUR });
      }
    }

    // --- Day-to-day spending ---

    if (random() < 0.9) {
      const { merchant, amount } = spending(PERSONAL_WEIGHTS);
      otp(date, { type: otpTypeFor(merchant), counterparty: merchant, amount });
    }

    if (random() < 0.08) {
      otp(date, { type: 'KÉSZPÉNZFELVÉT ATM-BŐL', memo: 'Budapest, Teszt utca 1', amount: -randomInt(random, 10000, 40000) });
    }

    if (random() < 0.3) {
      const { merchant } = spending(EUR_WEIGHTS);
      revolut(sheets.eur, date, { description: merchant, amount: -randomInt(random, 5, 40) });
    }

    if (random() < 0.6) {
      const { merchant, amount } = spending(PERSONAL_WEIGHTS);
      revolut(sheets.hu, date, { description: merchant, amount });
    }

    // A refund from a shop: a positive amount that reduces its category
    // instead of counting as income.
    if (random() < 0.03) {
      const category = pick(random, ['Ruházat/bevásárlás', 'Egészség/szépség', 'Szórakozás']);
      const [min, max] = CATEGORY_AMOUNT_RANGE[category];
      otp(date, { type: 'VISSZATÉRÍTÉS', counterparty: pick(random, MERCHANTS[category].recurring), amount: randomInt(random, min, max) });
    }

    // --- Transfers between the user's own accounts ---

    // OTP -> Revolut (rev-hu) top-up: a matched pair (same day, same
    // amount, opposite sign), so neither side counts as spending or income.
    if (random() < 0.06) {
      const topUp = randomInt(random, 5000, 20000);
      otp(date, { type: 'VÁSÁRLÁS KÁRTYÁVAL', counterparty: 'Revolut**2024*', amount: -topUp });
      revolut(sheets.hu, date, { type: 'Feltöltés', description: 'Apple Pay összegű feltöltés a(z) *0117 eszközödön', amount: topUp, completedAt: date });
    }

    // Revolut (rev-hu) -> OTP: the reverse direction, also a matched pair.
    if (random() < 0.08) {
      const back = randomInt(random, 10000, 30000);
      revolut(sheets.hu, date, { type: 'Átutalás', description: `Átutalás neki: ${OWNER_NAME}`, amount: -back });
      otp(date, { type: 'ÁTUTALÁS', counterparty: `Revolut*${OWNER_NAME}`, amount: back });
    }

    // --- Transfers with other people ---

    if (random() < 0.05) {
      revolut(sheets.hu, date, { type: 'Átutalás', description: `Átutalás neki: ${pick(random, TRANSFER_RECIPIENTS)}`, amount: -randomInt(random, 2000, 30000) });
    }
    if (random() < 0.04) {
      otp(date, { type: 'AZONNALI FIZETÉS', counterparty: pick(random, TRANSFER_RECIPIENTS), amount: -randomInt(random, 2000, 30000) });
    }

    // Incoming transfers are income. The same sender shows up on both
    // accounts, written differently (word order), so the income-by-source
    // list has to merge them into one person.
    if (random() < 0.04) {
      revolut(sheets.hu, date, { type: 'Átutalás', description: `Átutalás tőle: ${pick(random, TRANSFER_SENDERS)}`, amount: randomInt(random, 3000, 25000) });
    }
    if (random() < 0.03) {
      const reversed = pick(random, TRANSFER_SENDERS).split(' ').reverse().join(' ');
      otp(date, { type: 'ÁTUTALÁS', counterparty: reversed, amount: randomInt(random, 3000, 25000) });
    }

    // --- Joint account ---

    // Both co-holders contribute the same amount, same day. The owner's
    // half comes out of the OTP account (a pair with the joint-side row).
    if (day === nextContributionDay) {
      const contribution = randomInt(random, 15000, 40000);
      otp(date, { type: 'ÁTUTALÁS', counterparty: `Revolut*${OWNER_NAME}`, memo: 'Közös számla', amount: -contribution });
      for (const contributor of CONTRIBUTOR_NAMES) {
        revolut(sheets.joint, date, { type: 'Átutalás', description: `Átutalás tőle: ${contributor}`, amount: contribution, completedAt: date });
      }
      nextContributionDay += CONTRIBUTION_ROUND_INTERVAL_DAYS;
    }
    if (random() < 0.35) {
      const { merchant, amount } = spending(JOINT_WEIGHTS);
      revolut(sheets.joint, date, { description: merchant, amount });
    }
  }

  return { otp: otpRows, 'rev-eur': sheets.eur.rows, 'rev-hu': sheets.hu.rows, 'rev-joint': sheets.joint.rows };
}

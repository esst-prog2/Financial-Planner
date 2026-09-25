// Static UI text and category display labels, in Hungarian (default) and
// English. Category keys themselves stay Hungarian everywhere else in the
// codebase (categorize.js, specs, tests) - this is a presentation-only
// translation layer, so switching language never changes categorization.
export const LANGUAGES = ['hu', 'en'];
export const DEFAULT_LANGUAGE = 'hu';

export const STRINGS = {
  pageTitle: { hu: 'Kiadás-áttekintő', en: 'Expense overview' },
  ownerNameLabel: { hu: 'Saját név (a self-transfer felismeréshez, opcionális)', en: 'Your name (for self-transfer detection, optional)' },
  ownerNamePlaceholder: { hu: 'pl. Fikció Hanna', en: 'e.g. Jane Doe' },
  uploadLabel: { hu: 'Excel feltöltése (OTP + Revolut export)', en: 'Upload Excel file (OTP + Revolut export)' },
  navPersonal: { hu: 'Személyes áttekintő', en: 'Personal overview' },
  navJoint: { hu: 'Közös számla', en: 'Joint account' },
  summaryHeading: { hu: 'Havi összesítő', en: 'Monthly summary' },
  incomeHeading: { hu: 'Bevétel forrásonként', en: 'Income by source' },
  categoryPieHeading: { hu: 'Kategória szerinti bontás', en: 'Spending by category' },
  monthlyTrendHeading: { hu: 'Havi trend', en: 'Monthly trend' },
  categoryFilterLabel: { hu: 'Kategória szűrő:', en: 'Category filter:' },
  allCategoriesOption: { hu: 'Összes', en: 'All' },
  jointPieHeading: { hu: 'Közös számla - teljes kiadás kategóriánként', en: 'Joint account - full spending by category' },
  jointTrendHeading: { hu: 'Közös számla - havi trend', en: 'Joint account - monthly trend' },
  contributorsHeading: { hu: 'Befizetők', en: 'Contributors' },
  languageLabel: { hu: 'Nyelv', en: 'Language' },
  noDescription: { hu: '(nincs leírás)', en: '(no description)' },
};

export const CATEGORY_LABELS = {
  Élelmiszer: { hu: 'Élelmiszer', en: 'Groceries' },
  'Eating out': { hu: 'Eating out', en: 'Eating out' },
  'Ruházat/bevásárlás': { hu: 'Ruházat/bevásárlás', en: 'Clothing/Shopping' },
  'Egészség/szépség': { hu: 'Egészség/szépség', en: 'Health/Beauty' },
  Szolgáltatások: { hu: 'Szolgáltatások', en: 'Services' },
  Orvos: { hu: 'Orvos', en: 'Doctor' },
  Sport: { hu: 'Sport', en: 'Sport' },
  Közlekedés: { hu: 'Közlekedés', en: 'Transport' },
  'Számlák/előfizetés': { hu: 'Számlák/előfizetés', en: 'Bills/Subscriptions' },
  Megtakarítás: { hu: 'Megtakarítás', en: 'Savings' },
  Szórakozás: { hu: 'Szórakozás', en: 'Entertainment' },
  Utalás: { hu: 'Utalás', en: 'Transfer' },
  Bevétel: { hu: 'Bevétel', en: 'Income' },
  Készpénzfelvét: { hu: 'Készpénzfelvét', en: 'Cash withdrawal' },
  Egyéb: { hu: 'Egyéb', en: 'Other' },
};

export function t(key, lang) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] || entry[DEFAULT_LANGUAGE];
}

export function categoryLabel(category, lang) {
  const entry = CATEGORY_LABELS[category];
  if (!entry) return category;
  return entry[lang] || entry[DEFAULT_LANGUAGE];
}

export function summaryText(lang, { spending, income, balance }) {
  const spendingStr = spending.toLocaleString('hu-HU');
  const incomeStr = income.toLocaleString('hu-HU');
  const balanceStr = balance.toLocaleString('hu-HU');
  return lang === 'en'
    ? `This month: ${spendingStr} HUF spent, ${incomeStr} HUF income, ${balanceStr} HUF remaining.`
    : `Ez a hónap: ${spendingStr} HUF elköltve, ${incomeStr} HUF bevétel, ${balanceStr} HUF marad.`;
}

export function missingSheetMessage(sheetName, lang) {
  return lang === 'en'
    ? `The uploaded file is missing the "${sheetName}" sheet`
    : `A feltöltött fájlból hiányzik a(z) "${sheetName}" munkalap`;
}

export function genericErrorMessage(lang) {
  return lang === 'en'
    ? 'An unknown error occurred while processing the file.'
    : 'Ismeretlen hiba történt a fájl feldolgozása közben.';
}

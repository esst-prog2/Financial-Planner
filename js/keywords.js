// Keyword lists grounded in the merchant names observed in the real OTP +
// Revolut export structure (including a ~130-row ground-truth PDF the user
// manually categorized from their real statements). Matching is
// accent-insensitive substring search against the transaction's combined
// description text (see categorize.js / util.js's normalizeText). Order
// matters: earlier entries win on overlapping matches.
export const SPENDING_CATEGORY_KEYWORDS = [
  {
    category: 'Élelmiszer',
    keywords: ['lidl', 'spar', 'aldi', 'tesco', 'penny', 'coop', 'pékség', 'bakery', 'pék', 'szerelmes lev'],
  },
  {
    category: 'Eating out',
    keywords: [
      'mcd', 'kfc', 'wokbar', 'wok', 'cafe', 'café', 'kávé', 'sörműhely', 'sörház', 'sörművház',
      'rétesház', 'étterem', 'pizzé', 'pizza', 'burger', 'bisztro', 'foodora', 'pho', 'ristorante',
      'knorr-bremse', 'my green cup', 'cocacola', 'jonoyogo', 'lágymányos', 'bellozzo',
    ],
  },
  {
    category: 'Ruházat/bevásárlás',
    keywords: [
      'bershka', 'stradivarius', 'zara', 'h&m', 'ruházat', 'tienda', 'decathlon', 'reserved',
      'istyle', 'pirex', 'mango', 'arena', 'calzedonia', 'lush', "women's secret", 'primark',
      'tezenis', 'new garden', 'tchibo', 'sportshop',
    ],
  },
  {
    category: 'Egészség/szépség',
    // 'fodraszkellek' (hairdressing *supplies*, a product purchase) must be
    // checked here, before Szolgáltatások's generic 'fodrász' (the *service*
    // itself, e.g. an actual salon visit) - this category comes first in
    // the array, so it already wins.
    keywords: ['dm ', 'rossmann', 'drogéria', 'müller', 'patika', 'gyógyszertár', 'benu', 'notino', 'vision express', 'ecofamily', 'fodraszkellek'],
  },
  {
    category: 'Szolgáltatások',
    keywords: ['fodrász', 'szépségszalon', 'műköröm', 'sumup'],
  },
  {
    category: 'Orvos',
    keywords: ['orvos', 'fogorvos', 'dent', 'medic', 'gyn ', 'gyn obs', 'klinika'],
  },
  {
    category: 'Sport',
    keywords: ['pilates', 'edzőterem', 'fitness', 'gym', 'uszoda'],
  },
  {
    // Deliberately before Közlekedés: 'könyvesbolt' (bookshop) contains the
    // substring 'bolt', which Közlekedés also matches (the Bolt ride-share
    // app) - checking Szórakozás first keeps a book shop from being
    // miscategorized as transport.
    category: 'Szórakozás',
    keywords: [
      'mozi', 'színház', 'koncert', 'szórakozás', 'bowling', 'kaszinó', 'hobby', 'könyvesbolt', 'cinema',
      'könyváruház', 'jegy.hu', 'libro-trade', 'tropical and rare', 'budapest park', 'reflexshop', 'puzzlegarden',
    ],
  },
  {
    category: 'Közlekedés',
    // 'bolt' (the ride-share app) is a known, accepted collision risk with
    // the generic Hungarian word "bolt" (shop) - kept anyway per explicit
    // user request, since it only misfires when a shop name matches no
    // earlier, more specific category first.
    keywords: ['mav-start', 'mav ', 'bkk', 'volánbusz', 'taxi', 'üzemanyag', 'benzinkút', 'budapestgo', 'garázs', 'bolt'],
  },
  {
    category: 'Számlák/előfizetés',
    // 'simplep*one' is the full payment reference, not bare "one" - a bare
    // "one" would false-positive-match all over the place.
    keywords: ['mvm', 'apple.com', 'netflix', 'spotify', 'anthropic', 'telekom', 'vodafone', 'yettel', 'lakbér', 'simplep*one'],
  },
  {
    category: 'Megtakarítás',
    // 'persely' is kept here too (even though isPiggyBankMovement below
    // excludes it from the pipeline entirely, both signs) so a direct
    // categorizeTransaction() call - outside the pipeline, e.g. in a test -
    // still gives a sensible answer rather than falling to Egyéb.
    keywords: ['megtakarítás', 'betétlekötés', 'sajátszámla', 'befektetés', 'kincstár', 'persely'],
  },
  {
    // Deliberately last: a generic catch-all for outgoing person-to-person
    // transfers that aren't already excluded as a self-transfer or joint
    // contribution (see selfTransfer.js / jointAccount.js) and don't match
    // anything more specific above - without this, they'd fall to Egyéb.
    // Only ever reached for negative amounts; a positive amount is always
    // Bevétel regardless of keyword (see categorize.js's income override).
    category: 'Utalás',
    keywords: ['utalás', 'átutalás', 'azonnali fizetés'],
  },
];

export const CASH_WITHDRAWAL_KEYWORDS = ['készpénzfelvét', 'atm'];

// The OTP piggy-bank sub-account ("PERSELY SZÁMLA" in Ellenoldali név) -
// money moving either direction between the main account and this
// sub-account is the user's own money, not spending or income, so it's
// excluded entirely (both signs), the same way as an OTP<->Revolut
// self-transfer - see isPiggyBankMovement in categorize.js and its use in
// pipeline.js. Kept separate from Megtakarítás's own keyword list above
// (which also includes 'persely') so this exclusion stays scoped to the
// piggy bank specifically, not every Megtakarítás-category keyword - a
// real state-treasury transfer (kincstár) should still count as real
// savings spending, not be excluded like this.
export const PIGGY_BANK_KEYWORDS = ['persely'];

// Revolut's own currency-exchange-between-own-pockets transactions (e.g.
// "Devizaváltás HUF pénznemre") - appears on BOTH the source and
// destination currency sheets (confirmed against the user's real EUR and
// HUF sheets). Neither side is real spending or income, so both are
// excluded entirely, regardless of sign - see isCurrencyConversionMovement
// in categorize.js and its use in pipeline.js.
export const CURRENCY_CONVERSION_KEYWORDS = ['devizaváltás'];

// OTP labels any transaction tied to the user's own Revolut card/account
// as "Revolut*<reference>" (a top-up: "Revolut**2024*"; money coming back:
// "Revolut*<account holder's name>") - always the user's own money moving
// between their own OTP and Revolut accounts, never a real purchase or
// income, even when the matching Revolut-side row falls outside the
// uploaded date range and pair-matching (selfTransfer.js) can't find it.
export const OTP_REVOLUT_LINK_KEYWORDS = ['revolut'];

// The merchant/business names from the user's original ~130-row
// ground-truth PDF (Kategoriak_v2.pdf) - i.e. exactly what justified
// keywords.js's current keyword list. Used only to split a later month's
// transactions into "seen before" vs "new" merchants for the keyword-
// generalization spike - see spike-measure-accuracy.mjs.
//
// Business/shop names only - a shop or company name isn't personal data
// (see js/sampleData.js for the same reasoning). The PDF's real people
// (Szolgáltatások and Utalás entries naming specific individuals) are
// deliberately excluded here; they're handled by the separate, gitignored
// counterparty-rules mechanism and aren't "merchant keywords" in the sense
// this spike measures.
export const KNOWN_MERCHANTS_FROM_GROUND_TRUTH = [
  // Eating out
  'SMPLPAY*KNORR-BREMSE 6', 'MCD ALLEE', 'Padthai Wokbar (Allee)', 'My Green Cup', 'NYX*CocaColaHBCMagyaro',
  'Cafe+Co HU 223562', 'Figurans Bisztro', 'HELOPAY*KNORR-BREMSE 6', 'Cafe+Co HU 223549', 'JonoYogo Etele',
  'foodora', 'LÁGYMÁNYOS CAMPUS', "Quentin's Burger Budap", 'CAFE FREI ETELE PLÁZA', 'BELLOZZO ETELE', 'PHO 1993',
  "Simon's Burger Allee -", 'Allegro Ristorante Bar', 'KEG Sörművház', 'Kfc', 'Knorr-Bremse', 'Tradíció Rétesház',
  // Egészség/szépség
  'DM 080 VÁMHÁZ KÖRÚ', 'ROSSMANN 241.', 'Muller Drogeria 5257', 'Notino HU Mammut', 'MAMMUT PATIKA', 'DM 233.SZ.',
  'VISION EXPRESS 523.', 'DM 388.', 'Muller Drogeria 5253', 'Muller Drogeria Magyar', 'DM 205 HENGERHALOM',
  'ECOFAMILY ÚJBUDA', 'BENU ARANY MÉRLEG', 'Ujhullam Fodraszkellek', 'SZERETET GYÓGYSZERTÁ', 'VISION EXPRESS 545.',
  // Egyéb
  'ESETI MEGBÍZÁSOK KÖLTSÉGE', 'Devizaváltás HUF pénznemre',
  // Élelmiszer
  'SPAR MAGYARORSZAG KFT.', 'SPAR MAGYARORSZÁG KFT', 'LIDL HU 101 Balatonlel', 'LIDL HU 274 Budapest',
  'Szerelmes Level Pekmuh', 'Lipoti Pekseg Bartok', 'LIDL HU 335 Budapest', 'LIPÓTI PÉKSÉG', 'COOP MINI ÉLELMISZER',
  'PRÍMA PÉK', 'SPAR Food & Fuel', 'Lidl', 'Szerelmes Levél', 'arán bakery',
  // Közlekedés
  'SIMPLEP*mav-start', 'BKK AUTOMATA - I11', 'Bolt', 'BKK AUTOMATA - G99', 'SIMPLEP*BudapestGO app',
  'LURDY-HÁZ MÉLYGARÁZ',
  // Megtakarítás
  'Magyar Államkincstár', 'SIMPLEP*webkincstar',
  // Orvos
  'Gyn Obs', 'Dentalia Medicina',
  // Ruházat/bevásárlás
  'BERSHKA BUDAPEST', 'DECATHLON-CORVIN', 'RESERVED CORVIN 691220', 'DECATHLON NYUGATI TÉR',
  'RESERVED ALLEE 6912320', 'ISTYLE ETELE', 'PIREX PAPÍR ETELE', 'HU0353 H&M ETELE PLAZA', 'MANGO BUDAPEST MAMMUT',
  'ALLEE BESTYTE', 'ARENA MAGYARORSZAG KFT', 'RESERVED BUDAPEST ARKA', 'PIREX PAPÍR CORVIN', 'Calzedonia - Etele',
  'LUSH Allee', "Women's Secret  Etele", 'PRIMARK   846 Budape', 'Tezenis - Etele', 'Pirex Papier', 'New Garden',
  'Stradivarius', 'Tchibo 7855', 'PIREX ALLEE',
  // Sport
  'Pesti Pilates',
  // Számlák/előfizetés
  'SIMPLEP*one', 'APPLE.COM/BILL', 'MVM NEXT ENERGIAK', 'SIMPLEP*TELEKOM2597', 'TelekomSzaml*920535970',
  'TelekomSzaml*906667568', 'TelekomSzaml*897085915', 'Havi Lakber', 'TelekomSzaml*894294120', 'MVM Next',
  'Anthropic',
  // Szórakozás
  'LIBRO-TRADE KFT.', 'Kreativ Hobby - Pop -', 'BARION *Jegy.hu', 'TROPICAL AND RARE KFT', 'Budapest Park',
  'Reflexshop Budai Szaku', 'B CINEMA CITY ALLEE', 'LÍRA KÖNYVÁRUHÁZ', 'Kreativ Hobby - Allee', 'puzzlegarden.hu',
  'Kreatív Hobby', 'Oxford Könyvesbolt',
];

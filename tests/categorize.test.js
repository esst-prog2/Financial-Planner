import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categorizeTransaction, categorizeFee, isSavingsAccountMovement, isCurrencyConversionMovement, isOtpRevolutLinkTransaction } from '../js/categorize.js';

const examples = [
  ['Élelmiszer', 'SPAR MAGYARORSZAG KFT.'],
  ['Eating out', 'Padthai Wokbar'],
  ['Ruházat/bevásárlás', 'BERSHKA BUDAPEST'],
  ['Egészség/szépség', 'DM 080 VÁMHÁZ KÖRU'],
  ['Szolgáltatások', 'SumUp *Teszt Edina E'],
  ['Orvos', 'Gyn Obs'],
  ['Sport', 'Pesti Pilates'],
  ['Közlekedés', 'SIMPLEP*mav-start'],
  ['Számlák/előfizetés', 'MVM Next'],
  ['Megtakarítás', 'Havi megtakarítás átvezetés'],
  ['Szórakozás', 'Mozijegy foglalás'],
  ['Utalás', 'Átutalás neki: Landlord Kft.'],
];

for (const [expected, description] of examples) {
  test(`categorizes "${description}" as ${expected}`, () => {
    const category = categorizeTransaction({ description, amount: -1000 });
    assert.equal(category, expected);
  });
}

test('a positive amount with no merchant-category match stays Bevétel', () => {
  const category = categorizeTransaction({ description: 'MUNKABÉR ÁTUTALÁS', amount: 350000 });
  assert.equal(category, 'Bevétel');
});

test('a positive amount matching a merchant category is a refund into that category, not Bevétel', () => {
  const category = categorizeTransaction({ description: 'SPAR MAGYARORSZAG KFT.', amount: 500 });
  assert.equal(category, 'Élelmiszer');
});

test('a positive amount matching Megtakarítás keywords is still refund-eligible (not just Bevétel)', () => {
  const category = categorizeTransaction({ description: 'Megtakarítás visszavezetés', amount: 2000 });
  assert.equal(category, 'Megtakarítás');
});

test('Utalás only ever applies to outgoing transfers - an incoming one is still Bevétel', () => {
  const category = categorizeTransaction({ description: 'Átutalás tőle: Landlord Kft.', amount: 20000 });
  assert.equal(category, 'Bevétel');
});

test('cash withdrawals are categorized as Készpénzfelvét', () => {
  const category = categorizeTransaction({ description: 'OTP KÉSZPÉNZFELVÉT ATM-BŐL', amount: -20000 });
  assert.equal(category, 'Készpénzfelvét');
});

test('accent-stripped merchant name still matches (Muller vs Müller)', () => {
  const category = categorizeTransaction({ description: 'Muller Drogeria 5257', amount: -1500 });
  assert.equal(category, 'Egészség/szépség');
});

test('a bakery is Élelmiszer, not Eating out', () => {
  const category = categorizeTransaction({ description: 'Lipoti Pekseg Bartok', amount: -1200 });
  assert.equal(category, 'Élelmiszer');
});

test('a hobby/book shop is Szórakozás, not Ruházat/bevásárlás', () => {
  assert.equal(categorizeTransaction({ description: 'Kreativ Hobby - Allee', amount: -3000 }), 'Szórakozás');
  assert.equal(categorizeTransaction({ description: 'Oxford Könyvesbolt', amount: -5000 }), 'Szórakozás');
});

const newKeywordExamples = [
  ['Eating out', "Quentin's Burger Budap"],
  ['Eating out', 'Figurans Bisztro'],
  ['Eating out', 'foodora'],
  ['Eating out', 'PHO 1993'],
  ['Eating out', 'Allegro Ristorante Bar'],
  ['Eating out', 'HELOPAY*KNORR-BREMSE 6'],
  ['Egészség/szépség', 'MAMMUT PATIKA'],
  ['Egészség/szépség', 'SZERETET GYÓGYSZERTÁR'],
  ['Egészség/szépség', 'BENU ARANY MÉRLEG'],
  ['Egészség/szépség', 'Notino HU Mammut'],
  ['Egészség/szépség', 'VISION EXPRESS 523.'],
  ['Közlekedés', 'SIMPLEP*BudapestGO app'],
  ['Közlekedés', 'LURDY-HÁZ MÉLYGARÁZS'],
  ['Közlekedés', 'Bolt'],
  ['Megtakarítás', 'Magyar Államkincstár'],
  ['Számlák/előfizetés', 'Havi Lakber'],
  ['Szórakozás', 'B CINEMA CITY ALLEE'],
  ['Szórakozás', 'LÍRA KÖNYVÁRUHÁZ'],
  ['Szórakozás', 'BARION *Jegy.hu'],
  // Second pass over the real-data PDF: these were missed the first time
  // (only a curated subset was added), and landed in Egyéb on the user's
  // real file - reported directly against real upload output.
  ['Élelmiszer', 'Szerelmes Levél'],
  ['Ruházat/bevásárlás', 'Pirex Papier'],
  ['Ruházat/bevásárlás', 'PIREX PAPÍR ETELE'],
  ['Ruházat/bevásárlás', 'DECATHLON-CORVIN'],
  ['Ruházat/bevásárlás', 'RESERVED CORVIN 691220'],
  ['Ruházat/bevásárlás', 'ISTYLE ETELE'],
  ['Ruházat/bevásárlás', 'MANGO BUDAPEST MAMMUT'],
  ['Ruházat/bevásárlás', 'ARENA MAGYARORSZAG KFT'],
  ['Ruházat/bevásárlás', 'Calzedonia - Etele'],
  ['Ruházat/bevásárlás', 'LUSH Allee'],
  ['Ruházat/bevásárlás', "Women's Secret Etele"],
  ['Ruházat/bevásárlás', 'PRIMARK 846 Budape'],
  ['Ruházat/bevásárlás', 'Tezenis - Etele'],
  ['Ruházat/bevásárlás', 'New Garden'],
  ['Ruházat/bevásárlás', 'Tchibo 7855'],
  ['Eating out', 'My Green Cup'],
  ['Eating out', 'NYX*CocaColaHBCMagyaro'],
  ['Eating out', 'JonoYogo Etele'],
  ['Eating out', 'LÁGYMÁNYOS CAMPUS'],
  ['Eating out', 'BELLOZZO ETELE'],
  ['Egészség/szépség', 'ECOFAMILY ÚJBUDA'],
  ['Egészség/szépség', 'Ujhullam Fodraszkellek'],
  ['Számlák/előfizetés', 'SIMPLEP*one'],
  ['Szórakozás', 'LIBRO-TRADE KFT.'],
  ['Szórakozás', 'TROPICAL AND RARE KFT'],
  ['Szórakozás', 'Budapest Park'],
  ['Szórakozás', 'Reflexshop Budai Szaku'],
  ['Szórakozás', 'puzzlegarden.hu'],
];

for (const [expected, description] of newKeywordExamples) {
  test(`categorizes "${description}" as ${expected} (real-data keyword addition)`, () => {
    assert.equal(categorizeTransaction({ description, amount: -1000 }), expected);
  });
}

test('an unrecognized description falls back to Egyéb instead of erroring', () => {
  const category = categorizeTransaction({ description: 'XJ4-99183', amount: -100 });
  assert.equal(category, 'Egyéb');
});

test('a nonzero fee is categorized as Egyéb regardless of the row', () => {
  assert.equal(categorizeFee({ fee: 107.97 }), 'Egyéb');
  assert.equal(categorizeFee({ fee: 0 }), null);
});

test('a known counterparty name overrides keyword matching', () => {
  const category = categorizeTransaction({ description: 'AZONNALI FIZETÉS', counterparty: 'Teszt Szolgáltató', amount: -8000 });
  assert.equal(category, 'Szolgáltatások');
});

test('a known counterparty name overrides the no-match Egyéb fallback too', () => {
  const category = categorizeTransaction({ description: '', counterparty: 'Teszt Bérbeadó', amount: -50000 });
  assert.equal(category, 'Számlák/előfizetés');
});

test('a fuller name variant still matches a counterparty rule by substring', () => {
  const category = categorizeTransaction({ description: '', counterparty: 'Teszt Bérbeadó Teljes Névvel', amount: -30000 });
  assert.equal(category, 'Számlák/előfizetés');
});

test('isSavingsAccountMovement recognizes the OTP piggy-bank sub-account, sign-independent', () => {
  assert.equal(isSavingsAccountMovement({ counterparty: 'PERSELY SZÁMLA', amount: 15000 }), true);
  assert.equal(isSavingsAccountMovement({ counterparty: 'PERSELY SZÁMLA', amount: -15000 }), true);
  assert.equal(isSavingsAccountMovement({ counterparty: 'SPAR MAGYARORSZAG KFT.', amount: -4500 }), false);
});

test('isCurrencyConversionMovement recognizes Revolut own-pocket currency exchange, sign-independent', () => {
  assert.equal(isCurrencyConversionMovement({ description: 'Devizaváltás HUF pénznemre', amount: -20 }), true);
  assert.equal(isCurrencyConversionMovement({ description: 'Devizaváltás HUF pénznemre', amount: 7500 }), true);
  assert.equal(isCurrencyConversionMovement({ description: 'SPAR MAGYARORSZAG KFT.', amount: -4500 }), false);
});

test('isOtpRevolutLinkTransaction recognizes an OTP row tied to the user\'s own Revolut account, sign-independent', () => {
  assert.equal(isOtpRevolutLinkTransaction({ source: 'otp', description: 'VÁSÁRLÁS KÁRTYÁVAL Revolut**2024*', amount: -5000 }), true);
  assert.equal(isOtpRevolutLinkTransaction({ source: 'otp', description: 'Revolut*HANNA ESZTER', amount: 12000 }), true);
  assert.equal(isOtpRevolutLinkTransaction({ source: 'otp', description: 'SPAR MAGYARORSZAG KFT.', amount: -4500 }), false);
});

test('isOtpRevolutLinkTransaction never applies to Revolut-side rows themselves', () => {
  assert.equal(isOtpRevolutLinkTransaction({ source: 'revolut-hu', description: 'Revolut something', amount: 5000 }), false);
});

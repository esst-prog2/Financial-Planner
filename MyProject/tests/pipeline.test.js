import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLineItems, monthOf } from '../js/pipeline.js';
import { RATE_TABLES } from '../js/rates.js';

const OTP_HEADER = ['Számlaszám', 'Ellenoldali számla', 'Ellenoldali név', 'Forgalom típusa', 'Közlemény', 'Tranzakció kategória', 'Banki azonosító', 'Tranzakció idő', 'Könyvelt', 'Összeg', 'Devizanem'];
const REV_HEADER = ['Típus', 'Termék', 'Kezdés dátuma', 'Teljesítés dátuma', 'Leírás', 'Összeg', 'Díj', 'Pénznem', 'State', 'Egyenleg'];

function otpSheet() {
  return [
    ...Array.from({ length: 14 }, () => ['meta']),
    OTP_HEADER,
    ['', '', 'SPAR MAGYARORSZAG KFT.', 'VÁSÁRLÁS KÁRTYÁVAL', '', '', '1', '2026.09.10 15:49:08', 'x', -4500, 'HUF'],
    ['', '', '', 'MUNKABÉR ÁTUTALÁS', 'MUN Fikció Hanna', '', '2', '2026.09.10 13:59:00', 'x', 350000, 'HUF'],
    ['', '', 'Revolut**2024*', 'VÁSÁRLÁS KÁRTYÁVAL', '', '', '3', '2026.09.18 09:22:06', 'x', -5000, 'HUF'],
  ];
}

function sheets() {
  return {
    otp: otpSheet(),
    'rev-eur': [
      REV_HEADER,
      ['Kártyás fizetés', 'Folyószámla', '2026.09.05 10:43', '2026.09.05 11:34', 'Gyn Obs', -10, 0.13, 'EUR', 'ELVÉGEZVE', ''],
    ],
    'rev-hu': [
      REV_HEADER,
      ['Feltöltés', 'Folyószámla', '2026.09.18 09:22', '2026.09.18 09:22', 'Apple Pay összegű feltöltés', 5000, 0, 'HUF', 'ELVÉGEZVE', ''],
      ['Kártyás fizetés', 'Folyószámla', '2026.09.12 18:09', '2026.09.13 13:58', 'Lidl', -3000, 0, 'HUF', 'ELVÉGEZVE', ''],
    ],
    'rev-joint': [
      REV_HEADER,
      ['Kártyás fizetés', 'Folyószámla', '2026.09.07 19:57', '2026.09.08 13:45', 'SPAR Food & Fuel', -6000, 0, 'HUF', 'ELVÉGEZVE', ''],
      ['Átutalás', 'Folyószámla', '2026.09.05 10:43', '2026.09.05 10:53', 'Átutalás tőle: T TIBI', 20000, 0, 'HUF', 'ELVÉGEZVE', ''],
    ],
  };
}

test('full pipeline: parses, excludes self-transfers and contributions, categorizes, converts, splits joint expenses', () => {
  const items = buildLineItems(sheets(), { ownerName: 'Fikció Hanna' });

  // OTP<->Revolut top-up (-5000 / +5000 on 2026-09-18) must not appear at all.
  assert.ok(!items.some((i) => i.description.includes('Revolut**2024*')));
  assert.ok(!items.some((i) => i.description.includes('Apple Pay összegű feltöltés')));
  // The joint contribution-in must not appear either.
  assert.ok(!items.some((i) => i.description.includes('Átutalás tőle: T TIBI')));

  const grocery = items.find((i) => i.description.includes('SPAR MAGYARORSZAG'));
  assert.equal(grocery.category, 'Élelmiszer');
  assert.equal(grocery.amountHuf, -4500);
  assert.equal(grocery.personalAmountHuf, -4500);
  assert.equal(grocery.counterparty, 'SPAR MAGYARORSZAG KFT.');

  const salary = items.find((i) => i.description.includes('MUNKABÉR'));
  assert.equal(salary.category, 'Bevétel');

  const jointGrocery = items.find((i) => i.description === 'SPAR Food & Fuel');
  assert.equal(jointGrocery.category, 'Élelmiszer');
  assert.equal(jointGrocery.amountHuf, -6000);
  assert.equal(jointGrocery.personalAmountHuf, -3000);

  const eurRate = RATE_TABLES.EUR['2026-09-05'];
  const doctor = items.find((i) => i.description === 'Gyn Obs' && !i.isFee);
  assert.equal(doctor.category, 'Orvos');
  assert.equal(doctor.amountHuf, -10 * eurRate);

  const fee = items.find((i) => i.isFee && i.description === 'Gyn Obs');
  assert.equal(fee.category, 'Egyéb');
  assert.equal(fee.amountHuf, -(0.13 * eurRate));
});

test('OTP piggy-bank (persely) sub-account: positive is excluded entirely, negative is Megtakarítás', () => {
  const otpRows = [
    ...Array.from({ length: 14 }, () => ['meta']),
    OTP_HEADER,
    ['', '', 'PERSELY SZÁMLA', 'ÁTVEZETÉS', '', '', '1', '2026.09.10 15:49:08', 'x', 8000, 'HUF'],
    ['', '', 'PERSELY SZÁMLA', 'ÁTVEZETÉS', '', '', '2', '2026.09.11 15:49:08', 'x', -3000, 'HUF'],
  ];
  const emptyRev = [REV_HEADER];
  const items = buildLineItems({ otp: otpRows, 'rev-eur': emptyRev, 'rev-hu': emptyRev, 'rev-joint': emptyRev }, {});

  assert.equal(items.length, 1, 'the positive persely movement must not appear at all');
  assert.equal(items[0].category, 'Megtakarítás');
  assert.equal(items[0].amountHuf, -3000);
});

test('Revolut own-pocket currency conversion: both EUR-side and HUF-side rows are excluded entirely, but a fee on the row still counts as Egyéb', () => {
  const revEur = [
    REV_HEADER,
    ['Átváltás', 'Folyószámla', '2026.09.05 10:43', '2026.09.05 10:43', 'Devizaváltás HUF pénznemre', -30, 0.13, 'EUR', 'ELVÉGEZVE', ''],
  ];
  const revHu = [
    REV_HEADER,
    ['Átváltás', 'Folyószámla', '2026.09.05 10:43', '2026.09.05 10:43', 'Devizaváltás HUF pénznemre', 11817.3, 0, 'HUF', 'ELVÉGEZVE', ''],
  ];
  const emptyOtp = [...Array.from({ length: 14 }, () => ['meta']), OTP_HEADER];
  const emptyRev = [REV_HEADER];
  const items = buildLineItems({ otp: emptyOtp, 'rev-eur': revEur, 'rev-hu': revHu, 'rev-joint': emptyRev }, {});

  assert.ok(!items.some((i) => !i.isFee && i.description === 'Devizaváltás HUF pénznemre'), 'neither the EUR-side nor the HUF-side conversion row should appear');
  const fee = items.find((i) => i.isFee);
  assert.equal(fee.category, 'Egyéb');
});

test('an OTP Revolut-link row is excluded even with no matching Revolut-side row in range at all (regression: "Revolut*NAME" showing up as Bevétel)', () => {
  const otpRows = [
    ...Array.from({ length: 14 }, () => ['meta']),
    OTP_HEADER,
    ['', '', '', 'AZONNALI FIZETÉS', 'Revolut*HANNA ESZTER', '', '1', '2026.09.09 12:00:00', 'x', 30000, 'HUF'],
  ];
  const emptyRev = [REV_HEADER];
  const items = buildLineItems({ otp: otpRows, 'rev-eur': emptyRev, 'rev-hu': emptyRev, 'rev-joint': emptyRev }, {});

  assert.equal(items.length, 0, 'the unpaired Revolut-link row must still be excluded, not counted as Bevétel');
});

test('monthOf buckets by the canonical date', () => {
  assert.equal(monthOf('2026-09-18'), '2026-09');
  assert.equal(monthOf(null), null);
});

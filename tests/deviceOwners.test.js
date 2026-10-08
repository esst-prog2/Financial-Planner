import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractDeviceRef, deviceOwnerLabel } from '../js/deviceOwners.js';

test('extractDeviceRef pulls the device reference out of a top-up description', () => {
  assert.equal(extractDeviceRef('Apple Pay összegű feltöltés a(z) *0117 eszközödön'), '*0117');
  assert.equal(extractDeviceRef('APPLE PAY OSSZEGU FELTOLTES A(Z) *6052 ESZKOZODON'), '*6052');
});

test('extractDeviceRef returns null for a non-top-up description', () => {
  assert.equal(extractDeviceRef('Lidl'), null);
  assert.equal(extractDeviceRef('Átutalás tőle: T TIBI'), null);
});

test('deviceOwnerLabel looks up the owner from a given map, never a committed one', () => {
  const map = { '*0117': 'Teszt Elek' };
  assert.equal(deviceOwnerLabel('Apple Pay összegű feltöltés a(z) *0117 eszközödön', map), 'Teszt Elek');
  assert.equal(deviceOwnerLabel('Apple Pay összegű feltöltés a(z) *9999 eszközödön', map), null);
  assert.equal(deviceOwnerLabel('Lidl', map), null);
});

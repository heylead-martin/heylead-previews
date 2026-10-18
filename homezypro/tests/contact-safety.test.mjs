import test from 'node:test';
import assert from 'node:assert/strict';
import {isPlaceholderPhone, applyContactSafety, placeholderNumbersIn, OTHER_LOCATIONS} from '../src/lib/contact-safety.mjs';

test('placeholder numbers are detected', () => {
  for (const n of ['+65 9123 4567', '+65 1234 5678', '+65 8123 4567', '+65 6123 4567', '+65 8765 4321', '+65 9876 5432', '+65 8888 8888', '+65 9888 8888', '+65 1111', '12345678'])
    assert.ok(isPlaceholderPhone(n), n);
  for (const n of ['+65 8810 4924', '+65 6465 9595', '+65 9448 8108', '+65 8713 8713', '+65 3158 0123'])
    assert.ok(!isPlaceholderPhone(n), n);
  assert.deepEqual(placeholderNumbersIn('WhatsApp: +65 9123 4567 or https://wa.me/6588104924'), ['91234567']);
});

test('placeholder WhatsApp is hidden and registered towns are not card locations', () => {
  const c = applyContactSafety({slug: 'x', phone: {value: '+65 8810 4924'}, whatsapp: {value: '+65 9123 4567'}, address: {kind: 'registered', value: '776 Woodlands Crescent'}, area: 'Woodlands'});
  assert.equal(c.whatsapp, undefined);
  assert.equal(c.area, OTHER_LOCATIONS);
  const p = applyContactSafety({slug: 'y', phone: {value: '+65 9123 4567'}, alternatePhones: [{value: '+65 6465 9595', sourceUrl: 'https://e.g/'}], area: 'Bedok', address: {kind: 'premises'}});
  assert.equal(p.phone.value, '+65 6465 9595');
  assert.equal(p.area, 'Bedok');
});

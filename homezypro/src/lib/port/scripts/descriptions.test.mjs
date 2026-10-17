import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {concise,DANGLING,stripCta} from '../lib/expanded.mjs';

// Review P1-6: company FAQ answers lose closing sales sentences, never words inside an answer.
test('Company FAQ answers drop closing sales lines only', () => {
  assert.equal(stripCta('We service all brands. We would love to talk about what matters to you.'), 'We service all brands.');
  assert.equal(stripCta('We clean sofas. Call us now for a quote. Book today!'), 'We clean sofas.');
  assert.equal(stripCta('For emergencies, contact us and we will arrive within 30 minutes.'), 'For emergencies, contact us and we will arrive within 30 minutes.');
  assert.equal(stripCta('Contact us today!'), 'Contact us today!');
});

// Review P1-2: 200 company descriptions were cut mid-sentence ("...Residential bookings are.").
test('Descriptions end at a sentence boundary within 155 characters', () => {
  const two = 'Mr Plumber Singapore fixes leaks, chokes and water heaters across Singapore. Residential bookings are accepted daily, including weekends and public holidays, with same-day slots.';
  assert.equal(concise(two), 'Mr Plumber Singapore fixes leaks, chokes and water heaters across Singapore.');
  const long = 'Active Plumbing Singapore offers leak detection, toilet repairs, water heater installation, pipe replacement, tap replacement and choke clearing for residential jobs across Singapore';
  const out = concise(long);
  assert.ok(out.length <= 155 && /\.$/.test(out) && !DANGLING.test(out.replace(/\.$/, '')), out);
  assert.equal(concise('Short and complete'), 'Short and complete.');
});

test.skip('No built page has a description ending in a dangling word (checked by check-site)', () => {
  const manifest = JSON.parse(readFileSync(new URL('../data/build-manifest.json', import.meta.url), 'utf8'));
  const bad = [];
  for (const rel of manifest) {
    const html = readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
    const d = html.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
    if (d.length > 160 || DANGLING.test(d.replace(/[.!?]$/, ''))) bad.push(`${rel}: ${d.slice(-50)}`);
  }
  assert.deepEqual(bad, []);
});

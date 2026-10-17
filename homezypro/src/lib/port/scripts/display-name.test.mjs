import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cleanName,derivedFrom,displayNames,makesClaim,OVERRIDES} from '../lib/display-name.mjs';

const cases = [
  ['SJR Aircon - #1 Best Aircon Servicing in Singapore', 'SJR Aircon'],
  ['AR Contractor Pte Ltd (Best Painting & Aircon Service Provider in Singapore)', 'AR Contractor Pte Ltd'],
  ['PlumberMENG @ 98530163 - Singapore\'s Premier Plumbing Specialist', 'PlumberMENG'],
  ['WI ELECTRICAL PTE. LTD. | LEW Singapore - Electrical License Renewal - LEW Services', 'WI Electrical Pte. Ltd.'],
  ['ART OF CLEANING PTE. LTD.', 'Art of Cleaning Pte. Ltd.'],
  ['BEST M&E ENGINEERING PTE. LTD.', 'Best M&E Engineering Pte. Ltd.'],
  ['DJR PLUMBING & JETTING', 'DJR Plumbing & Jetting'],
  ['HDB PLUMBER SG', 'HDB Plumber SG'],
  ['SNOWFLAKE SERVICES LLP', 'Snowflake Services LLP'],
  ["KIM'S AIRCON PTE LTD", "Kim's Aircon Pte Ltd"],
  ['DR PENGUIN AIRCON ENGINEERING PTE LTD', 'Dr Penguin Aircon Engineering Pte Ltd'],
  ['LANDSPECT SG PTE.LTD', 'Landspect SG Pte.Ltd'],
  ['💧SG1 Plumber Singapore - Plumbing Service', 'SG1 Plumber Singapore'],
  ['Handover Haus Singapore | Post Renovation Cleaning, Move Out Cleaning & End of Tenancy Repair Services', 'Handover Haus Singapore'],
  ['BUTLER Housekeeping - Singapore\'s Finest Housekeeping and Home Services Company Since 2016.', 'BUTLER Housekeeping'],
  ['Cheap Aircon Service Singapore', 'Aircon Service Singapore'],
  ['hdbplumber service sg', 'Hdbplumber Service SG'],
  ['LS Handyman Service ( S ) Pte Ltd', 'LS Handyman Service (S) Pte Ltd'],
  ['Plumbing & Electrical (SG) Pte. Ltd.', 'Plumbing & Electrical (SG) Pte. Ltd.'],
  ['B+W Integrated Services (B+W Builders Private Limited)', 'B+W Integrated Services (B+W Builders Private Limited)'],
  ['24 Hours Electrician - Lotus', '24 Hours Electrician - Lotus'],
  ['Cool-Air Control - Aircon Servicing', 'Cool-Air Control'],
  ['Best Plumbing', 'Best Plumbing']
];

test('SEO tails, claims, phone numbers, emoji and casing are cleaned', () => {
  for (const [source, want] of cases) assert.equal(cleanName(source), want, source);
});

test('display names never add words to the source name', () => {
  for (const [source] of cases) assert.ok(derivedFrom(cleanName(source), source), source);
  assert.equal(derivedFrom('Goodcool Aircon', 'Best Aircon servicing and installation by Goodcool'), true);
  assert.equal(derivedFrom('Goodcool Experts', 'Best Aircon servicing and installation by Goodcool'), false);
});

test('overrides only drop words from the release name', async () => {
  const {companies} = JSON.parse(await readFile(new URL('../../../data/companies.json', import.meta.url), 'utf8'));
  for (const [slug, name] of Object.entries(OVERRIDES)) {
    const source = companies.find(c => c.slug === slug);
    assert.ok(source, `override for unknown slug ${slug}`);
    assert.ok(derivedFrom(name, source.name), `${slug}: ${name}`);
    // Best Painting SG is the trading name (bestpaintingsg.com); other overrides make no claim.
    assert.ok(!makesClaim(name) || name === 'Best Painting SG', name);
  }
});

test('a cleaned name that collides with another company keeps the source names', () => {
  const names = displayNames([{slug: 'a', name: 'Reliable Plumbing Services (Licensed Plumber)'}, {slug: 'b', name: 'Reliable Plumbing Services'}]);
  assert.deepEqual([names.get('a'), names.get('b')], ['Reliable Plumbing Services (Licensed Plumber)', 'Reliable Plumbing Services']);
});

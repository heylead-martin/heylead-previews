// HomezyPro rules on top of roster's ported unit tests (src/lib/port/scripts/*.test.mjs).
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {isIndexable, robotsFor, robotsTxt} from '../src/config/site.mjs';
import {markets, activeMarket} from '../src/config/markets.mjs';
import {guardPublication, compareCounts, rebrandSummaries, EXPECTED, WITHHELD_FOR_REVIEW, PINNED} from '../scripts/import-data.mjs';
import {BLOCKED} from '../src/lib/port/scripts/import-db.mjs';
import {guideEvidence, sourcedRates} from '../src/lib/port/lib/sourced-rates.mjs';

const json = async f => JSON.parse(await readFile(new URL('../' + f, import.meta.url), 'utf8'));
const report = await json('src/data/import-report.json');
const {companies} = await json('src/data/companies.json');

test('indexing switch: only SITE_INDEXABLE=true on homezypro.com is indexable', () => {
  assert.equal(isIndexable({}), false);
  assert.equal(isIndexable({SITE_INDEXABLE: 'true'}), true, 'default SITE_URL is homezypro.com');
  assert.equal(isIndexable({SITE_INDEXABLE: 'true', SITE_URL: 'https://homezypro.com/'}), true);
  assert.equal(isIndexable({SITE_INDEXABLE: 'true', SITE_URL: 'https://preview.homezypro.pages.dev'}), false);
  assert.equal(isIndexable({SITE_INDEXABLE: 'true', SITE_URL: 'https://www.homezypro.com'}), false);
  assert.equal(isIndexable({SITE_INDEXABLE: '1', SITE_URL: 'https://homezypro.com'}), false);
  assert.equal(isIndexable({SITE_URL: 'https://homezypro.com'}), false);
});

test('robots meta and robots.txt follow the switch', () => {
  assert.equal(robotsFor('/plumbing/', false), 'noindex, nofollow, noarchive');
  assert.equal(robotsFor('/plumbing/', true), 'index, follow');
  assert.equal(robotsFor('/search/', true), 'noindex, follow');
  assert.equal(robotsTxt(false), '# Preview build. Every HTML page also carries noindex.\nUser-agent: *\nDisallow: /\n');
  assert.equal(robotsTxt(true, 'https://homezypro.com'), 'User-agent: *\nAllow: /\n\nSitemap: https://homezypro.com/sitemap.xml\n');
});

test('markets: Singapore is the only active market; brand carries no market suffix', () => {
  assert.equal(activeMarket.id, 'sg');
  assert.deepEqual(Object.values(markets).filter(m => m.status === 'active').map(m => m.id), ['sg']);
  assert.equal(markets.us.status, 'placeholder');
  assert.equal(markets.au.status, 'placeholder');
});

test('import: pinned r15.1 release, roster counts, needs-human-review withheld', () => {
  assert.equal(report.sourceRelease, PINNED.companies.file);
  assert.equal(report.sourceSha256, PINNED.companies.sha256);
  assert.equal(report.logos.bundleSha256, PINNED.logos.sha256);
  assert.deepEqual(compareCounts(report), []);
  assert.equal(report.publishedCount, EXPECTED.total);
  assert.ok(BLOCKED.has('needs-human-review'));
  for (const id of WITHHELD_FOR_REVIEW) {
    const row = report.excluded.find(r => r.id === id);
    assert.ok(row?.reasons.includes('needs-human-review'), `${id} withheld for review`);
    assert.ok(!report.published.some(p => p.id === id));
  }
});

test('import guard stops when a needs-human-review row would be published', () => {
  const db = {companies: [{id: 'x1', flags: ['needs-human-review']}]};
  assert.throws(() => guardPublication(db, {report: {published: [{id: 'x1'}]}}), /blocking flags/);
  assert.throws(() => guardPublication({companies: []}, {report: {published: [{id: WITHHELD_FOR_REVIEW[0]}]}}), /needs-human-review/);
  assert.doesNotThrow(() => guardPublication(db, {report: {published: []}}));
});

test('directory-generated summaries carry the HomezyPro name; company text is untouched', () => {
  const rows = [{enrichment: {summary: {text: 'X is a plumber. Roster found no prices.'}, about: [{text: 'Roster Street office'}]}}];
  assert.equal(rebrandSummaries(rows), 1);
  assert.equal(rows[0].enrichment.summary.text, 'X is a plumber. HomezyPro found no prices.');
  assert.equal(rows[0].enrichment.about[0].text, 'Roster Street office');
  assert.ok(!companies.some(c => /\bRoster\b/.test(c.enrichment?.summary?.text || '')));
});

test('condenser-cleaning lines never count as general servicing or chemical wash', () => {
  const published = companies.filter(c => c.publish !== false);
  assert.ok(published.some(c => (c.enrichment?.priceLines || []).some(p => p.job === 'condenser-cleaning')), 'release has condenser-cleaning lines');
  for (const [key, spec] of Object.entries(guideEvidence)) {
    if (/condenser/.test(spec.match.source)) continue;
    for (const {line} of sourcedRates(spec, published)) assert.notEqual(line.job, 'condenser-cleaning', `${key} counted a condenser-cleaning line`);
  }
});

test('rendered pages: no rating schema, business types, card label, indicative prices hidden', async () => {
  const render = await import('../src/lib/render.mjs');
  const allowed = new Set(['LocalBusiness', 'HomeAndConstructionBusiness', 'HVACBusiness', 'Plumber', 'Electrician']);
  assert.equal(render.publishedCompanies.length, EXPECTED.total);
  for (const c of render.publishedCompanies) {
    const page = render.companyPage(c);
    assert.doesNotMatch(page.jsonLdText, /aggregateRating|ratingValue|reviewCount|"@type":"(?:Review|Rating|AggregateRating|Offer|FAQPage)"/, c.slug);
    const business = JSON.parse(page.jsonLdText)['@graph'].find(n => String(n['@id']).endsWith('#business'));
    assert.ok(allowed.has(business['@type']), `${c.slug} ${business['@type']}`);
    assert.doesNotMatch(page.body, /General price guide, not a company quote/, `${c.slug} shows an indicative price`);
    // Full profiles carry the price box; compact (limited-details) profiles have none, as on roster.
    if (c.listingDepth?.full) assert.match(page.body, /<span class="kicker">EXAMPLE SERVICE PRICE<\/span>/, c.slug);
  }
  for (const trade of render.trades) {
    const hub = render.hubPage(trade);
    const cards = hub.body.match(/<li class="(?:business-card catalogue-card|compact-company)"/g) || [];
    assert.ok(cards.length > 0, trade.id);
    assert.equal((hub.body.match(/<span class="price-eyebrow">Example service price<\/span>/g) || []).length, cards.length, `${trade.id}: one price label per card`);
    assert.ok(!hub.body.includes('data-aircon-matrix="units"'));
  }
  const home = render.homePage();
  assert.match(home.jsonLdText, /"@type":"Organization"/);
  assert.match(home.jsonLdText, /homezypro-logo-512\.png/);
});

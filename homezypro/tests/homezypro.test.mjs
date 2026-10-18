// HomezyPro rules on top of roster's ported unit tests (src/lib/port/scripts/*.test.mjs).
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {isIndexable, robotsFor, robotsTxt} from '../src/config/site.mjs';
import {markets, activeMarket} from '../src/config/markets.mjs';
import {guardPublication, compareCounts, rebrandSummaries, EXPECTED, WITHHELD_FOR_REVIEW, PINNED, KEEP_RETIRED, NEVER_PUBLISH_SLUGS, INFORMATIONAL_FLAGS} from '../scripts/import-data.mjs';
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
  // Cloudflare builds: only the production branch can be indexable.
  assert.equal(isIndexable({SITE_INDEXABLE: 'true', CF_PAGES: '1', CF_PAGES_BRANCH: 'main'}), true);
  assert.equal(isIndexable({SITE_INDEXABLE: 'true', CF_PAGES: '1', CF_PAGES_BRANCH: 'feature-x'}), false);
  assert.equal(isIndexable({SITE_INDEXABLE: 'true', CF_PAGES: '1', CF_PAGES_BRANCH: 'release', HOMEZYPRO_PRODUCTION_BRANCH: 'release'}), true);
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

test('import: pinned r15.2 release, expected counts, needs-human-review withheld', () => {
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

test('r15.2: Billy Aircon kept retired, 201823211K slugs never published, lead-gen flag informational', async () => {
  for (const [id, slug] of Object.entries(KEEP_RETIRED)) {
    assert.ok(report.excluded.find(r => r.id === id)?.reasons.includes('kept-retired'), `${id} kept retired`);
    assert.ok(!companies.some(c => c.slug === slug));
  }
  assert.throws(() => guardPublication({companies: []}, {report: {published: [{id: 'roster-billy-aircon', slug: 'billy-aircon'}]}}), /kept retired/);
  for (const slug of NEVER_PUBLISH_SLUGS) {
    assert.ok(!companies.some(c => c.slug === slug), slug);
    assert.throws(() => guardPublication({companies: []}, {report: {published: [{id: 'x', slug}]}}), /never be published/);
  }
  const registry = await json('src/data/slug-registry.json');
  assert.equal(registry['201823211K'], 'direct-painters-plastering');
  assert.ok(!Object.values(registry).includes('city-cleaning'));
  const {retiredListings, retiredRedirects} = await import('../src/config/retired.mjs');
  assert.ok(!retiredListings.some(r => NEVER_PUBLISH_SLUGS.includes(r.slug)), 'no stub page or redirect for 201823211K slugs');
  assert.ok(!retiredRedirects().some(r => /city-cleaning|direct-painters/.test(r)));
  for (const f of INFORMATIONAL_FLAGS) assert.ok(!BLOCKED.has(f), `${f} must not withhold`);
  // The six lead-gen network sites are withheld by no-sg-postal-code, never by the new flag.
  const leadGen = report.excluded.filter(r => r.reasons.includes('lead-gen-network-site'));
  assert.deepEqual(leadGen, []);
});

test('r15.2: address.kind is carried; a registered (ACRA) address is labelled and kept out of structured data', async () => {
  const {importDatabase} = await import('../src/lib/port/scripts/import-db.mjs');
  const src = 'https://example.sg/';
  const row = kind => ({id: 'k-' + kind, name: 'Kind Test ' + kind, primary_trade: 'handyman', categories: ['handyman'], segment: 'profiled', website: src,
    about: [{text: 'We fix things.', sourceUrl: src}], services: [{name: 'drilling-mounting', sourceUrl: src}], phone: {value: '+65 6000 0000', sourceUrl: src},
    address: {value: '1 Test Road, Singapore 123456', postal: '123456', kind, ...(kind === 'registered' ? {registeredAddress: true, premises: false} : {}), sourceUrl: 'https://data.gov.sg/x'}});
  const seeds = {companies: {companies: []}, profiles: {}, presentation: {}};
  const out = importDatabase({checked: '2026-10-18', companies: [row('registered'), row('premises')]}, seeds, {});
  const bySlug = Object.fromEntries(out.companies.companies.map(c => [c.databaseId, c]));
  assert.equal(bySlug['k-registered'].address.kind, 'registered');
  assert.equal(bySlug['k-registered'].address.registeredAddress, true);
  assert.equal(bySlug['k-premises'].address.kind, 'premises');
  assert.throws(() => importDatabase({checked: '2026-10-18', companies: [{...row('premises'), address: {...row('premises').address, kind: 'office'}}]}, seeds, {}), /Unknown address.kind/);

  const registered = companies.filter(c => c.address?.kind === 'registered');
  assert.equal(registered.length, 6, 'six r15.2 profiles show an ACRA registered address');
  const render = await import('../src/lib/render.mjs');
  for (const c of registered) {
    const page = render.companyPage(c);
    assert.match(page.body, /data-registered-address><div class="map-address">[\s\S]*?<p class="kicker">Registered address<\/p>/, c.slug);
    assert.doesNotMatch(page.body, /before visiting|Look up this address|Get directions|<iframe/, c.slug);
    assert.doesNotMatch(page.jsonLdText, /PostalAddress|streetAddress|hasMap/, c.slug);
  }
  const premises = companies.find(c => c.address?.kind === 'premises');
  const page = render.companyPage(premises);
  assert.doesNotMatch(page.body, /data-registered-address/);
  assert.match(page.jsonLdText, /"@type":"PostalAddress"/);
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

test('retired listings: 301 per URL form, skipped once a company is published again', async () => {
  const {retiredListings, retiredRedirects, redirectsFile, validateRedirects} = await import('../src/config/retired.mjs');
  const rules = retiredRedirects();
  assert.equal(rules.length, retiredListings.length * 4);
  assert.ok(rules.includes('/company/hedircool-pte-ltd/ /plumbing/ 301') && rules.includes('/roster/company/hedircool-pte-ltd/ /plumbing/ 301'));
  assert.ok(!retiredRedirects(new Set(['billy-aircon'])).some(r => r.includes('billy-aircon')));
  const file = redirectsFile(new Set(), '/roster / 301\n/roster/* /:splat 301\n');
  assert.deepEqual(validateRedirects(file).problems, []);
  assert.match(validateRedirects('/a/* /b 301\n/c /d 301').problems.join(), /static rule after a dynamic rule/);
  assert.match(validateRedirects('/a /b 404\nexample.com/* /x 301').problems.join(), /unsupported status 404.*source must be a path/);
});

test('capture dates go with their separator', async () => {
  const {stripCaptureDates} = await import('../src/lib/port/lib/no-dates.mjs');
  assert.equal(stripCaptureDates('<p class="record-label">About the business · Checked 10 Oct 2026</p>'), '<p class="record-label">About the business</p>');
  assert.equal(stripCaptureDates('<p>Google Maps · 2026-10-10</p>'), '<p>Google Maps</p>');
});

test('search ranks primary-trade matches first for a trade word', async () => {
  const {filterCatalogue} = await import('../src/lib/port/assets/catalogue-filter.mjs');
  const {rankCompanies} = await import('../src/lib/port/assets/catalogue-card.mjs');
  const rows = [
    {slug: 'air', name: 'Cool Aircon', category: 'aircon', categories: ['aircon', 'cleaning'], offerings: ['condenser cleaning'], serviceAreas: [], ratingCount: 900, ratingValue: 4.9, evidenceScore: 7},
    {slug: 'clean', name: 'Art of Cleaning Pte. Ltd.', category: 'cleaning', categories: ['cleaning'], offerings: ['deep cleaning'], serviceAreas: [], ratingCount: 10, ratingValue: 4.5, evidenceScore: 1}
  ];
  // An aircon firm offering "condenser cleaning" is not a cleaning company for the query "cleaning".
  assert.deepEqual(rankCompanies(filterCatalogue(rows, {query: 'cleaning'}).matches).map(c => c.slug), ['clean']);
  // Name and service matches stay, ranked after primary-trade matches.
  rows[0].name = 'Cool Aircon and Cleaning';
  assert.deepEqual(rankCompanies(filterCatalogue(rows, {query: 'cleaning'}).matches).map(c => c.slug), ['clean', 'air']);
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
  const claim = render.otherPages.get('claim-listing')();
  assert.ok(claim.body.includes('data-claim-static') && !/<form|<input|mailto:/.test(claim.body), 'claim page is static');
  for (const t of render.trades) {
    const best = render.otherPages.get(`${t.slug}/best`)();
    const types = JSON.parse(best.jsonLdText)['@graph'].map(n => n['@type']);
    assert.ok(types.includes('ItemList') && types.includes('FAQPage'), `${t.id} best-of schema`);
    assert.doesNotMatch(best.jsonLdText, /ratingValue|reviewCount|aggregateRating/i);
  }
  // r15.2: VS Handyman's sourced coverage adds /handyman/novena/ and /handyman/sembawang/ (109 -> 111).
  assert.deepEqual(render.counts, {guides: 47, areaPages: 111, blogPosts: 25, intents: 2});
  const home = render.homePage();
  assert.match(home.jsonLdText, /"@type":"Organization"/);
  assert.match(home.jsonLdText, /"logo":\{"@type":"ImageObject","url":"https:\/\/homezypro\.com\/brand\/logo-512\.png","width":512,"height":512\}/);
});

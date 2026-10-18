// HomezyPro checks on the built site in dist/ (run after `npm run build`): the indexing switch,
// brand, page counts per type against roster, retired-listing redirects, cards, schema, visible-text
// rules, every internal link and the logo limits. Roster's own page-family checks run as
// scripts/check-site-roster.mjs (generated from roster/scripts/check-site.mjs); `npm run check:site`
// runs both.
import assert from 'node:assert/strict';
import {readFile, readdir, stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SITE_URL, INDEXABLE, robotsTxt, robotsFor} from '../src/config/site.mjs';
import {EXPECTED, WITHHELD_FOR_REVIEW} from './import-data.mjs';
import {DANGLING} from '../src/lib/port/lib/expanded.mjs';
import {retiredListings, redirectsFile} from '../src/config/retired.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const companies = JSON.parse(await readFile(path.join(root, 'src/data/companies.json'), 'utf8')).companies;
const report = JSON.parse(await readFile(path.join(root, 'src/data/import-report.json'), 'utf8'));
const published = companies.filter(c => c.publish !== false);

async function walk(dir, out = []) {
  for (const e of await readdir(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out); else out.push(p);
  }
  return out;
}
const files = await walk(dist);
const htmlFiles = files.filter(f => f.endsWith('.html'));
const rel = f => '/' + path.relative(dist, f).split(path.sep).join('/');
const pagePath = f => rel(f).replace(/index\.html$/, '');
const failures = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);

const HUBS = {'aircon-servicing': 'aircon', plumbing: 'plumbing', electrician: 'electrician', handyman: 'handyman', 'home-cleaning': 'cleaning'};
const BUSINESS_TYPES = new Set(['LocalBusiness', 'HomeAndConstructionBusiness', 'HVACBusiness', 'Plumber', 'Electrician']);
const BANNED_KEYS = /"(?:aggregateRating|ratingValue|reviewCount|review|reviews|offers|offer|priceRange|bestRating|worstRating)"\s*:/;
const BANNED_TYPES = /"@type"\s*:\s*"(?:AggregateRating|Review|Rating|Offer|AggregateOffer)"/;
// Pages where "best" may appear in the title/H1: the five best-of pages.
const BEST_PAGES = new Set(Object.keys(HUBS).map(h => `/${h}/best/`));
const visibleText = html => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<head>[\s\S]*?<\/head>/, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');

// ---- Page inventory ----
const built = new Set(htmlFiles.map(pagePath));
const publishedSlugs = new Set(published.map(c => c.slug));
const retiredPaths = new Set(retiredListings.filter(r => !publishedSlugs.has(r.slug)).map(r => `/company/${r.slug}/`));
const companyPages = [...built].filter(p => /^\/company\/[a-z0-9-]+\/$/.test(p) && !retiredPaths.has(p));
// Page counts per type equal roster's built pages (roster/: 955 index.html, of which 8 parked account
// pages are omitted here), plus dist/404.html.
const ROSTER_COUNTS = {home: 1, hub: 5, company: 738, 'retired listing': 9, search: 1, 'intent directory': 2, guide: 47, 'how-it-works': 1, 'what-service-do-i-need': 1, 'town page': 109, 'best-of': 5, 'blog index': 1, 'blog post': 25, 'claim-listing': 1, 'logo-removal': 1, '404': 1};
const kindOf = (p, html) => p === '/' ? 'home' : p === '/404.html' ? '404' : retiredPaths.has(p) ? 'retired listing' : p.startsWith('/company/') ? 'company'
  : p === '/blog/' ? 'blog index' : p.startsWith('/blog/') ? 'blog post' : /^\/[a-z-]+\/best\/$/.test(p) ? 'best-of' : html.includes('data-area-page=') ? 'town page'
  : p === '/search/' ? 'search' : html.includes('directory-page') ? (p.split('/').length === 3 ? 'hub' : 'intent directory')
  : html.includes('data-editorial-id=') && p !== '/how-it-works/' ? 'guide' : p.replace(/\//g, '');
const kinds = {};
assert.ok(built.has('/'), 'home page');
for (const hub of Object.keys(HUBS)) assert.ok(built.has(`/${hub}/`), `hub /${hub}/`);
assert.equal(companyPages.length, published.length, 'one company page per published company');
assert.equal(published.length, EXPECTED.total, `published count equals roster's ${EXPECTED.total}`);
for (const [trade, n] of Object.entries(EXPECTED.byTrade)) assert.equal(published.filter(c => (c.primaryTrade || c.category) === trade).length, n, `${trade} count`);
// needs-human-review rows are withheld: not published, no page.
const withheld = report.excluded.filter(r => WITHHELD_FOR_REVIEW.includes(r.id));
assert.equal(withheld.length, WITHHELD_FOR_REVIEW.length, 'needs-human-review rows are in the excluded list');
for (const r of withheld) {
  assert.ok(r.reasons.includes('needs-human-review'), `${r.id} excluded for needs-human-review`);
  assert.ok(!published.some(c => c.databaseId === r.id), `${r.id} not published`);
}
assert.ok(retiredPaths.has('/company/hedircool-pte-ltd/'), 'HEDIRCOOL is retired, not published');

// ---- Retired listings: 301 in _redirects, noindex HTML fallback ----
assert.equal(await readFile(path.join(dist, '_redirects'), 'utf8'), redirectsFile(publishedSlugs), '_redirects lists every retired listing');
for (const r of retiredListings.filter(r => !publishedSlugs.has(r.slug))) {
  const html = await readFile(path.join(dist, 'company', r.slug, 'index.html'), 'utf8');
  assert.ok(html.includes('data-retired-listing') && html.includes(`<meta http-equiv="refresh" content="0;url=${r.target}">`) && html.includes('<meta name="robots" content="noindex, follow">'), `retired fallback for ${r.slug}`);
}

// ---- robots.txt ----
assert.equal(await readFile(path.join(dist, 'robots.txt'), 'utf8'), robotsTxt(), 'robots.txt follows the indexing switch');
if (!INDEXABLE) assert.match(await readFile(path.join(dist, 'robots.txt'), 'utf8'), /Disallow: \/\n/);

// ---- Per-page checks ----
const missingLinks = new Map();
let cards = 0, exampleLabels = 0;
for (const file of htmlFiles) {
  const p = pagePath(file);
  const html = await readFile(file, 'utf8');
  const kind = kindOf(p, html);
  kinds[kind] = (kinds[kind] || 0) + 1;
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] || '';
  const robots = head.match(/<meta name="robots" content="([^"]+)">/)?.[1];
  // Retired fallbacks and the 404 are never indexed, whatever the switch says.
  const wantRobots = kind === 'retired listing' || kind === '404' ? 'noindex, follow' : robotsFor(p);
  if (robots !== wantRobots) fail(p, `robots "${robots}", expected "${wantRobots}"`);
  if (!INDEXABLE && !/noindex/.test(robots || '')) fail(p, 'indexable meta on a non-production build');
  const canonical = head.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (kind === '404') { if (canonical) fail(p, '404 must not have a canonical'); }
  else if (canonical !== SITE_URL + p) fail(p, `canonical ${canonical}`);
  // No separator left dangling where a capture date was removed ("About the business ·").
  const stray = html.match(/[^\s>]{0,30}\s*·\s*<\/(?:p|span|small|li|h[1-6]|strong)>/);
  if (stray) fail(p, `stray separator: ${stray[0]}`);
  if (!/<title>[^<]{10,}<\/title>/.test(head)) fail(p, 'title');
  const description = head.match(/<meta name="description" content="([^"]+)">/)?.[1] || '';
  if (description.length < 50 || description.length > 160) fail(p, `description length ${description.length}`);
  // Moved from roster's descriptions.test.mjs: descriptions end at a sentence, never "...jobs across."
  if (DANGLING.test(description.replace(/&amp;/g, '&').replace(/[.!?)]+$/, ''))) fail(p, `description ends in a dangling word: ${description.slice(-40)}`);
  for (const tag of ['og:title', 'og:description', ...(kind === '404' ? [] : ['og:url']), 'og:image', 'og:site_name']) if (!head.includes(`property="${tag}"`)) fail(p, `missing ${tag}`);
  if (!head.includes('name="twitter:card"')) fail(p, 'missing twitter:card');
  if (!head.includes('<meta property="og:site_name" content="HomezyPro">')) fail(p, 'og:site_name is not HomezyPro');
  const title = head.match(/<title>([^<]*)<\/title>/)?.[1] || '';
  if (!/\| HomezyPro$/.test(title) && p !== '/') fail(p, `title brand: ${title}`);
  if (/HomezyPro\s*SG|HomezyProSG/i.test(html)) fail(p, 'brand must not carry SG');
  if (/\bRoster\b|\/roster\/|previews\.heylead\.com/.test(html)) fail(p, `roster brand or path leaked: ${html.match(/.{0,40}(?:\bRoster\b|\/roster\/|previews\.heylead\.com).{0,40}/)?.[0]}`);
  if (/<form[\s>]/i.test(html.replace(/<form action="\/search\/" method="get" class="hero-quick-form">[\s\S]*?<\/form>/g, ''))) fail(p, 'form element');
  if (/mailto:|supabase|formspree/i.test(html)) fail(p, 'mailto/supabase/form hook');
  // JSON-LD
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (blocks.length !== 1) fail(p, `${blocks.length} JSON-LD blocks`);
  for (const b of blocks) {
    let graph;
    try { graph = JSON.parse(b)['@graph']; } catch { fail(p, 'JSON-LD does not parse'); continue; }
    if (BANNED_KEYS.test(b) || BANNED_TYPES.test(b)) fail(p, `banned schema: ${b.match(BANNED_KEYS)?.[0] || b.match(BANNED_TYPES)?.[0]}`);
    if (kind === 'best-of') {
      for (const type of ['ItemList', 'FAQPage', 'BreadcrumbList']) if (!graph.some(n => n['@type'] === type)) fail(p, `best-of page without ${type}`);
    }
    if (kind === 'company') {
      // Company answers are their own claims: shown with attribution, never as FAQPage schema.
      if (graph.some(n => n['@type'] === 'FAQPage')) fail(p, 'FAQPage schema on a company page');
      const business = graph.find(n => String(n['@id'] || '').endsWith('#business'));
      if (!business || !BUSINESS_TYPES.has(business['@type'])) fail(p, `business node type ${business?.['@type']}`);
      else {
        for (const k of ['name', 'telephone', 'url']) if (!business[k]) fail(p, `business.${k} missing`);
        if (business.name !== business.name.toUpperCase() || !/[A-Z]{5,}/.test(business.name)) { /* title case or short acronym: ok */ } else fail(p, `ALL-CAPS business name ${business.name}`);
      }
    }
  }
  // "best": only the five best-of pages may use it in their title or H1.
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
  if (h1s.length !== 1) fail(p, `${h1s.length} H1`);
  // Company names may contain the word, so on profiles only the title after the name is checked.
  const ownWords = kind === 'company' ? title.split(' | ').slice(1).join(' ') : `${title} ${h1s.join(' ')} ${description}`;
  if (!BEST_PAGES.has(p) && /\bbest\b/i.test(ownWords)) fail(p, `"best" outside the best-of pages: ${ownWords.slice(0, 80)}`);
  if (kind === 'company' && h1s[0] && /[A-Z]{3,}\s+[A-Z]{3,}\s+[A-Z]{3,}/.test(h1s[0].replace(/&amp;/g, '&'))) fail(p, `H1 not title case: ${h1s[0]}`);
  // Visible text rules
  const text = visibleText(html);
  if (/\bChecked \d{1,2} [A-Z][a-z]{2} \d{4}\b|\bLast checked\b|\bas printed on \d/.test(text)) fail(p, `visible capture date: ${text.match(/.{0,30}(?:Checked \d|Last checked|as printed on \d).{0,30}/)?.[0]}`);
  if (/General price guide, not a company quote/.test(text)) fail(p, 'indicative price shown');
  if (html.includes('data-aircon-matrix="units"')) fail(p, 'units matrix shown');
  // Card rules (ART OF CLEANING standard): one example price label, Google-only headline rating.
  for (const card of html.matchAll(/<li class="(?:business-card catalogue-card|compact-company)"[\s\S]*?<\/article><\/li>/g)) {
    cards++;
    const c = card[0];
    if (!c.includes('<span class="price-eyebrow">Example service price</span>')) fail(p, 'card without "Example service price" label');
    else exampleLabels++;
    const label = c.match(/<span class="average-label">([^<]*)<\/span>/)?.[1];
    if (label && label !== 'Google Maps' && label !== 'Reviews') fail(p, `card headline rating from ${label}`);
  }
  // Internal links
  for (const m of html.matchAll(/\s(?:href|src)="(\/[^"#?]*)/g)) {
    const target = m[1];
    if (target.startsWith('//')) continue;
    const candidates = [path.join(dist, target), path.join(dist, target, 'index.html')];
    if (candidates.some(f => existsSync(f) && (f.endsWith('.html') || !target.endsWith('/')))) continue;
    missingLinks.set(target, (missingLinks.get(target) || 0) + 1);
  }
}
for (const [target, n] of missingLinks) fail(target, `broken internal link (${n} references)`);

// ---- Hubs: counts, cards, payload budget ----
for (const [hub, trade] of Object.entries(HUBS)) {
  const html = await readFile(path.join(dist, hub, 'index.html'), 'utf8');
  const n = EXPECTED.byTrade[trade];
  if (!html.includes(`<strong>${n}</strong>`)) fail(`/${hub}/`, `hub count ${n} not shown`);
  const indexName = html.match(/data-index="\/data\/index\/([a-z-]+)\.json\?v=[0-9a-f]{12}"/)?.[1];
  if (indexName !== trade) fail(`/${hub}/`, 'directory index reference');
  const index = await readFile(path.join(dist, 'data/index', `${trade}.json`));
  const total = Buffer.byteLength(html) + index.length;
  if (total > 300 * 1024) fail(`/${hub}/`, `HTML + JSON ${Math.round(total / 1024)} KB over the 300 KB budget`);
}

// ---- Logos: WebP <= 256 px and <= 30 KB ----
function webpSize(buf) {
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (chunk === 'VP8L') { const b = buf.readUInt32LE(21); return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)]; }
  if (chunk === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  return [0, 0];
}
const logos = files.filter(f => f.includes(`${path.sep}logos${path.sep}`));
let webp = 0, svg = 0;
for (const f of logos) {
  if (f.endsWith('.webp')) {
    webp++;
    const buf = await readFile(f);
    const [w, h] = webpSize(buf);
    if (!w || Math.max(w, h) > 256) fail(rel(f), `logo ${w}x${h} over 256 px`);
    if (buf.length > 30 * 1024) fail(rel(f), `logo ${buf.length} bytes over 30 KB`);
  } else if (f.endsWith('.svg')) svg++;
  else fail(rel(f), 'unexpected logo format');
}

// ---- Counts per type vs roster ----
for (const k of new Set([...Object.keys(ROSTER_COUNTS), ...Object.keys(kinds)]))
  if ((kinds[k] || 0) !== (ROSTER_COUNTS[k] || 0)) fail(k, `${kinds[k] || 0} pages, roster has ${ROSTER_COUNTS[k] || 0}`);

// ---- Sitemap and llms.txt basics (roster's full sitemap rules: check-site-roster.mjs) ----
const sitemapIndex = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
for (const family of ['core', 'best', 'guides', 'towns', 'blog', 'companies'])
  if (!sitemapIndex.includes(`<loc>${SITE_URL}/sitemap-${family}.xml</loc>`)) fail('/sitemap.xml', `missing sitemap-${family}.xml`);
const companiesMap = await readFile(path.join(dist, 'sitemap-companies.xml'), 'utf8');
if ((companiesMap.match(/<url>/g) || []).length !== published.length) fail('/sitemap-companies.xml', 'one URL per published company');
for (const r of retiredPaths) if (companiesMap.includes(`${SITE_URL}${r}<`)) fail('/sitemap-companies.xml', `retired ${r} listed`);
const llmsTxt = await readFile(path.join(dist, 'llms.txt'), 'utf8');
if (!llmsTxt.startsWith('# HomezyPro') || !llmsTxt.includes(`${SITE_URL}/plumbing/`)) fail('/llms.txt', 'brand or URLs');

if (failures.length) {
  console.error(failures.slice(0, 60).join('\n'));
  console.error(`FAIL: ${failures.length} problems`);
  process.exit(1);
}
console.log(`PASS: ${htmlFiles.length} pages, counts per type equal roster's (${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ')}); all internal links resolve; ${cards} cards with "Example service price"; robots ${INDEXABLE ? 'index' : 'noindex'}; ${retiredPaths.size} retired listings as 301s + noindex fallbacks; ${webp} WebP logos <= 256 px / 30 KB, ${svg} SVG logos.`);

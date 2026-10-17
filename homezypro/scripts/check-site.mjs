// Checks the built site in dist/ (run after `npm run build`). Ported in spirit from
// roster/scripts/check-site.mjs; covers the page types built so far (home, trade hubs, company
// profiles) plus site-wide rules. Links to route families that are not ported yet are listed as
// pending, never silently passed: see docs/PORTING-PLAN.md.
import assert from 'node:assert/strict';
import {readFile, readdir, stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SITE_URL, INDEXABLE, robotsTxt, robotsFor} from '../src/config/site.mjs';
import {EXPECTED, WITHHELD_FOR_REVIEW} from './import-data.mjs';
import {DANGLING} from '../src/lib/port/lib/expanded.mjs';

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
// Pages where "best" may appear in the title/H1 (the five best-of pages, not built yet).
const BEST_PAGES = new Set(Object.keys(HUBS).map(h => `/${h}/best/`));
const visibleText = html => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<head>[\s\S]*?<\/head>/, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');

// ---- Page inventory ----
const built = new Set(htmlFiles.map(pagePath));
const companyPages = [...built].filter(p => /^\/company\/[a-z0-9-]+\/$/.test(p));
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
assert.ok(!built.has('/company/hedircool-pte-ltd/'), 'HEDIRCOOL has no profile page');

// ---- robots.txt ----
assert.equal(await readFile(path.join(dist, 'robots.txt'), 'utf8'), robotsTxt(), 'robots.txt follows the indexing switch');
if (!INDEXABLE) assert.match(await readFile(path.join(dist, 'robots.txt'), 'utf8'), /Disallow: \/\n/);

// ---- Per-page checks ----
const missingLinks = new Map();
const pendingLinks = new Map();
const PENDING = /^\/(?:how-it-works|blog|what-service-do-i-need|claim-listing|logo-removal|search|aircon|aircon-servicing|plumbing|electrician|handyman|home-cleaning)\//;
let cards = 0, exampleLabels = 0;
for (const file of htmlFiles) {
  const p = pagePath(file);
  const html = await readFile(file, 'utf8');
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] || '';
  const robots = head.match(/<meta name="robots" content="([^"]+)">/)?.[1];
  if (robots !== robotsFor(p)) fail(p, `robots "${robots}", expected "${robotsFor(p)}"`);
  if (!INDEXABLE && !/noindex/.test(robots || '')) fail(p, 'indexable meta on a non-production build');
  const canonical = head.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (canonical !== SITE_URL + p) fail(p, `canonical ${canonical}`);
  if (!/<title>[^<]{10,}<\/title>/.test(head)) fail(p, 'title');
  const description = head.match(/<meta name="description" content="([^"]+)">/)?.[1] || '';
  if (description.length < 50 || description.length > 160) fail(p, `description length ${description.length}`);
  // Moved from roster's descriptions.test.mjs: descriptions end at a sentence, never "...jobs across."
  if (DANGLING.test(description.replace(/&amp;/g, '&').replace(/[.!?)]+$/, ''))) fail(p, `description ends in a dangling word: ${description.slice(-40)}`);
  for (const tag of ['og:title', 'og:description', 'og:url', 'og:image', 'og:site_name']) if (!head.includes(`property="${tag}"`)) fail(p, `missing ${tag}`);
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
    if (p.startsWith('/company/')) {
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
  const ownWords = p.startsWith('/company/') ? title.split(' | ').slice(1).join(' ') : `${title} ${h1s.join(' ')} ${description}`;
  if (!BEST_PAGES.has(p) && /\bbest\b/i.test(ownWords)) fail(p, `"best" outside the best-of pages: ${ownWords.slice(0, 80)}`);
  if (p.startsWith('/company/') && h1s[0] && /[A-Z]{3,}\s+[A-Z]{3,}\s+[A-Z]{3,}/.test(h1s[0].replace(/&amp;/g, '&'))) fail(p, `H1 not title case: ${h1s[0]}`);
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
    const bucket = PENDING.test(target) && !/^\/company\//.test(target) && !Object.keys(HUBS).some(h => target === `/${h}/`) ? pendingLinks : missingLinks;
    bucket.set(target, (bucket.get(target) || 0) + 1);
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

if (failures.length) {
  console.error(failures.slice(0, 60).join('\n'));
  console.error(`FAIL: ${failures.length} problems`);
  process.exit(1);
}
const pendingTotal = [...pendingLinks.values()].reduce((a, b) => a + b, 0);
console.log(`PASS: ${htmlFiles.length} pages (home, ${Object.keys(HUBS).length} hubs, ${companyPages.length} company profiles); ${cards} cards with "Example service price"; robots ${INDEXABLE ? 'index' : 'noindex'}; ${webp} WebP logos <= 256 px / 30 KB, ${svg} SVG logos served as sanitised originals.`);
console.log(`Pending route families (not ported yet, ${pendingLinks.size} URLs, ${pendingTotal} links): ${[...new Set([...pendingLinks.keys()].map(t => t.split('/').slice(0, 2).join('/') + '/'))].join(' ')}`);

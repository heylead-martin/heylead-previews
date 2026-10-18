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
import {EXPECTED, WITHHELD_FOR_REVIEW, KEEP_RETIRED, NEVER_PUBLISH_SLUGS} from './import-data.mjs';
import {DANGLING} from '../src/lib/port/lib/expanded.mjs';
import {retiredListings, redirectsFile, validateRedirects} from '../src/config/retired.mjs';

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
// r15.2: companies follow the import (EXPECTED.total); city-cleaning is no longer a retired stub (404);
// two handyman town pages (Novena, Sembawang) are new from VS Handyman's sourced coverage.
const ROSTER_COUNTS = {home: 1, hub: 5, company: EXPECTED.total, 'retired listing': 8, search: 1, 'intent directory': 2, guide: 47, 'how-it-works': 1, 'what-service-do-i-need': 1, 'town page': 111, 'best-of': 5, 'blog index': 1, 'blog post': 25, 'claim-listing': 1, 'logo-removal': 1, '404': 1};
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
// Kept retired (Billy Aircon): excluded by the importer, still a 301 + noindex fallback.
for (const [id, slug] of Object.entries(KEEP_RETIRED)) {
  assert.ok(report.excluded.some(r => r.id === id && r.reasons.includes('kept-retired')), `${id} kept retired`);
  assert.ok(retiredPaths.has(`/company/${slug}/`) && !publishedSlugs.has(slug), `${slug} stays retired`);
}
// 201823211K's slugs (city-cleaning, direct-painters-plastering): plain 404. No page, no stub, no redirect,
// no sitemap/llms/search-index entry and the names appear nowhere in dist/.
for (const slug of NEVER_PUBLISH_SLUGS) {
  assert.ok(!publishedSlugs.has(slug) && !retiredListings.some(r => r.slug === slug), `${slug} is neither published nor retired`);
  assert.ok(!existsSync(path.join(dist, 'company', slug)), `no dist/company/${slug}/`);
}
{
  const gone = new RegExp(`${NEVER_PUBLISH_SLUGS.join('|')}|City Cleaning|Direct Painters`, 'i');
  for (const f of files.filter(f => /\.(?:html|xml|txt|json|js)$/.test(f) || /_redirects$|_headers$/.test(f))) {
    const t = await readFile(f, 'utf8');
    if (gone.test(t)) fail(rel(f), `names a 404-only listing: ${t.match(new RegExp(`.{0,40}(?:${gone.source}).{0,40}`, 'i'))?.[0]}`);
  }
}

// ---- Registered (ACRA) addresses: labelled "Registered address", no visiting wording, no look-up link or
// map, and never in structured data (they may be home addresses). Premises addresses are unchanged.
const registered = published.filter(c => c.address?.kind === 'registered');
for (const c of registered) {
  const html = await readFile(path.join(dist, 'company', c.slug, 'index.html'), 'utf8');
  const block = html.match(/<div class="company-map[^"]*" data-registered-address>[\s\S]*?<\/div><\/div><\/div>/)?.[0] || '';
  if (!block.includes('<p class="kicker">Registered address</p>')) fail(`/company/${c.slug}/`, 'registered address without the "Registered address" label');
  if (/before visiting|Look up this address|Get directions|<iframe/i.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) fail(`/company/${c.slug}/`, 'registered address shown as a place to visit or look up');
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  if (JSON.stringify(graph).includes('PostalAddress') || graph.some(n => n.hasMap)) fail(`/company/${c.slug}/`, 'registered address in structured data');
}
for (const f of htmlFiles) {
  const html = await readFile(f, 'utf8');
  for (const c of registered) if (html.includes(`"streetAddress":${JSON.stringify(c.address.street)}`)) fail(rel(f), `registered address of ${c.slug} marked up`);
  if (html.includes('data-registered-address') && !registered.some(c => rel(f) === `/company/${c.slug}/index.html`)) fail(rel(f), '"Registered address" on a company without a registered address');
}

// ---- _redirects: generated retired 301s + public/_redirects, valid syntax, within limits ----
const redirectsText = await readFile(path.join(dist, '_redirects'), 'utf8');
assert.equal(redirectsText, redirectsFile(publishedSlugs, await readFile(path.join(root, 'public/_redirects'), 'utf8')), '_redirects = retired rules + public/_redirects');
const redirectCheck = validateRedirects(redirectsText);
assert.deepEqual(redirectCheck.problems, [], `_redirects: ${redirectCheck.problems.join('; ')}`);
assert.match(redirectsText, /^\/roster\/\* \/:splat 301$/m, '/roster/* moves to the root');
for (const line of redirectsText.split('\n').filter(l => l && !l.startsWith('#'))) {
  const [, to] = line.split(/\s+/);
  const target = to.replace(':splat', '');
  if (!existsSync(path.join(dist, target, 'index.html')) && !existsSync(path.join(dist, target))) failures.push(`_redirects: target ${to} is not a built page`);
}
// ---- Retired listings: 301 in _redirects, noindex HTML fallback ----
for (const r of retiredListings.filter(r => !publishedSlugs.has(r.slug))) {
  const html = await readFile(path.join(dist, 'company', r.slug, 'index.html'), 'utf8');
  assert.ok(html.includes('data-retired-listing') && html.includes(`<meta http-equiv="refresh" content="0;url=${r.target}">`) && html.includes('<meta name="robots" content="noindex, follow">'), `retired fallback for ${r.slug}`);
}

// ---- robots.txt ----
assert.equal(await readFile(path.join(dist, 'robots.txt'), 'utf8'), robotsTxt(), 'robots.txt follows the indexing switch');
if (!INDEXABLE) assert.match(await readFile(path.join(dist, 'robots.txt'), 'utf8'), /Disallow: \/\n/);

// ---- Per-page checks ----
let sitemapSummary = '';
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
  for (const link of ['<link rel="icon" href="/favicon.ico" sizes="48x48">', '<link rel="icon" href="/favicon.svg" type="image/svg+xml">', '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">', '<link rel="manifest" href="/site.webmanifest">'])
    if (!head.includes(link)) fail(p, `head link missing: ${link}`);
  if (!html.includes('class="brand-logo"') || !html.includes('class="brand-logo brand-logo-foot"')) fail(p, 'logo missing from header or footer');
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
    const types = new Set(graph.map(n => n['@type']));
    const unesc = s => String(s).replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const visibleHtml = unesc(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<head>[\s\S]*?<\/head>/, ''));
    if (kind !== '404') {
      const pageNode = graph.find(n => n['@type'] === 'WebPage');
      if (!pageNode || pageNode.publisher?.['@id'] !== `${SITE_URL}/#organization`) fail(p, 'WebPage with publisher Organization @id');
    }
    // Breadcrumbs: schema wherever the trail is visible, one item per visible crumb.
    const crumbItems = (html.match(/<nav class="crumbs"[\s\S]*?<\/nav>/)?.[0].match(/<li>/g) || []).length;
    if (crumbItems && graph.find(n => n['@type'] === 'BreadcrumbList')?.itemListElement?.length !== crumbItems) fail(p, `BreadcrumbList does not match the ${crumbItems} visible crumbs`);
    // FAQPage only for site-voice FAQs that are visible on the page.
    const faq = graph.find(n => n['@type'] === 'FAQPage');
    if (faq) for (const q of faq.mainEntity) if (!visibleHtml.includes(q.name) || !visibleHtml.includes(q.acceptedAnswer.text.slice(0, 60))) fail(p, `FAQPage question not visible: ${q.name}`);
    if ((kind === 'guide' || kind === 'blog post') && !types.has('Article')) fail(p, 'Article schema');
    if (kind !== 'guide' && kind !== 'blog post' && kind !== 'how-it-works' && types.has('Article')) fail(p, 'Article schema outside guides and blog');
    if (kind === 'home') {
      const site = graph.find(n => n['@type'] === 'WebSite'), org = graph.find(n => n['@type'] === 'Organization');
      if (site?.potentialAction?.target?.urlTemplate !== `${SITE_URL}/search/?q={search_term_string}` || site?.potentialAction?.['query-input'] !== 'required name=search_term_string') fail(p, 'WebSite SearchAction');
      if (org?.['@id'] !== `${SITE_URL}/#organization` || !/\.png$/.test(org?.logo?.url || '') || org.logo.width < 112 || !existsSync(path.join(dist, org.logo.url.slice(SITE_URL.length)))) fail(p, 'Organization logo (PNG >= 112 px)');
    }
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

// ---- Brand: icons, manifest, logo files ----
function pngSize(buf) { return buf.toString('ascii', 1, 4) === 'PNG' ? [buf.readUInt32BE(16), buf.readUInt32BE(20)] : [0, 0]; }
const ICONS = {'favicon-16x16.png': 16, 'favicon-32x32.png': 32, 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512, 'icon-maskable-192.png': 192, 'icon-maskable-512.png': 512, 'brand/logo-512.png': 512};
for (const [file, side] of Object.entries(ICONS)) {
  const f = path.join(dist, file);
  if (!existsSync(f)) { fail(`/${file}`, 'missing'); continue; }
  const [w, h] = pngSize(await readFile(f));
  if (w !== side || h !== side) fail(`/${file}`, `${w}x${h}, want ${side}x${side}`);
}
{
  const [w, h] = pngSize(await readFile(path.join(dist, 'brand/logo.png')));
  if (w !== 1200 || h < 112) fail('/brand/logo.png', `${w}x${h}`);
  const [ow, oh] = pngSize(await readFile(path.join(dist, 'brand/og-default.png')));
  if (ow !== 1200 || oh !== 630) fail('/brand/og-default.png', `${ow}x${oh}, want 1200x630`);
  // ICO directory: type 1, one entry per size (a width/height byte of 0 means 256).
  const ico = await readFile(path.join(dist, 'favicon.ico'));
  const sizes = ico.readUInt16LE(2) === 1 ? Array.from({length: ico.readUInt16LE(4)}, (_, i) => ico[6 + i * 16] || 256).sort((a, b) => a - b) : [];
  if (sizes.join() !== '16,32,48') fail('/favicon.ico', `sizes ${sizes.join(',')}, want 16,32,48`);
  for (const svg of ['favicon.svg', 'brand/logo.svg', 'brand/logo-mark.svg', 'brand/logo-mono.svg']) {
    const t = await readFile(path.join(dist, svg), 'utf8');
    if (!/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]* viewBox="[^"]+"/.test(t) || /<script|<text|href=/.test(t)) fail(`/${svg}`, 'not a self-contained outline SVG');
  }
  let manifest;
  try { manifest = JSON.parse(await readFile(path.join(dist, 'site.webmanifest'), 'utf8')); } catch { fail('/site.webmanifest', 'invalid JSON'); }
  if (manifest) {
    if (manifest.name !== 'HomezyPro' || !manifest.short_name || manifest.start_url !== '/' || !/^#[0-9a-f]{6}$/i.test(manifest.theme_color || '') || !/^#[0-9a-f]{6}$/i.test(manifest.background_color || '')) fail('/site.webmanifest', 'name, short_name, start_url, theme_color and background_color');
    for (const icon of manifest.icons || []) {
      const f = path.join(dist, icon.src);
      const [w, h] = existsSync(f) ? pngSize(await readFile(f)) : [0, 0];
      if (icon.sizes !== `${w}x${h}` || icon.type !== 'image/png') fail('/site.webmanifest', `icon ${icon.src} declared ${icon.sizes}, file ${w}x${h}`);
    }
    for (const purpose of ['any', 'maskable']) for (const side of [192, 512]) if (!(manifest.icons || []).some(i => i.purpose === purpose && i.sizes === `${side}x${side}`)) fail('/site.webmanifest', `missing ${purpose} ${side}px icon`);
  }
}

// ---- _headers: rule count and line limits, pages.dev noindex, one Cache-Control per family ----
{
  const text = await readFile(path.join(dist, '_headers'), 'utf8');
  const lines = text.split('\n');
  const rules = []; let current = null;
  for (const line of lines) {
    if (line.length > 2000) fail('/_headers', 'line over 2,000 characters');
    if (!line.trim() || line.startsWith('#')) continue;
    if (!/^\s/.test(line)) rules.push(current = {path: line.trim(), headers: []});
    else if (current) current.headers.push(line.trim());
    else fail('/_headers', `header before any path: ${line}`);
  }
  if (rules.length > 100) fail('/_headers', `${rules.length} rules, limit 100`);
  for (const r of rules) for (const h of r.headers) if (!/^(?:! )?[A-Za-z-]+(?::\s*\S.*)?$/.test(h)) fail('/_headers', `bad header line under ${r.path}: ${h}`);
  for (const host of ['https://:project.pages.dev/*', 'https://:version.:project.pages.dev/*'])
    if (!rules.some(r => r.path === host && r.headers.some(h => /^X-Robots-Tag:\s*noindex/i.test(h)))) fail('/_headers', `no X-Robots-Tag noindex rule for ${host}`);
  // Overlapping families must not both set Cache-Control (Cloudflare comma-joins duplicates).
  const caching = rules.filter(r => r.headers.some(h => h.startsWith('Cache-Control:'))).map(r => r.path);
  if (caching.includes('/*')) fail('/_headers', 'Cache-Control on /* would be joined with the per-family values');
  const csp = rules.find(r => r.path === '/*')?.headers.find(h => h.startsWith('Content-Security-Policy:')) || '';
  if (/'unsafe-inline'|'unsafe-eval'/.test(csp) || !/frame-ancestors 'none'/.test(csp)) fail('/_headers', 'CSP must stay strict');
}

// ---- Sitemaps: index, children, every URL a built canonical page, images exist ----
{
  const index = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
  if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>\n<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(index)) fail('/sitemap.xml', 'not a sitemap index');
  const children = [...index.matchAll(/<sitemap><loc>([^<]+)<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod><\/sitemap>/g)].map(m => m[1]);
  if (children.length !== (index.match(/<sitemap>/g) || []).length) fail('/sitemap.xml', 'every child needs a lastmod');
  for (const want of ['core', 'best', 'guides', 'towns', 'blog', 'companies', 'images']) if (!children.includes(`${SITE_URL}/sitemap-${want}.xml`)) fail('/sitemap.xml', `missing sitemap-${want}.xml`);
  const UTILITY = /\/(?:search|claim-listing|logo-removal)\/$/;
  let urls = 0, images = 0;
  for (const child of children) {
    const file = child.slice(SITE_URL.length + 1);
    const xml = await readFile(path.join(dist, file), 'utf8');
    if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) fail(`/${file}`, 'not a urlset');
    for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g)) {
      urls++;
      const loc = m[1].replace(/&amp;/g, '&');
      if (!loc.startsWith(SITE_URL + '/')) { fail(`/${file}`, `foreign URL ${loc}`); continue; }
      const p = loc.slice(SITE_URL.length);
      const page = path.join(dist, p, 'index.html');
      if (!existsSync(page)) { fail(`/${file}`, `URL is not a built page: ${p}`); continue; }
      if (UTILITY.test(p) || retiredPaths.has(p)) fail(`/${file}`, `noindex utility or retired page listed: ${p}`);
      if (!(await readFile(page, 'utf8')).includes(`<link rel="canonical" href="${loc}">`)) fail(`/${file}`, `not canonical-self: ${p}`);
      if (file !== 'sitemap-images.xml' && !/^<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>$|^$/.test(m[2])) fail(`/${file}`, `lastmod: ${p}`);
      for (const img of m[2].matchAll(/<image:image><image:loc>([^<]+)<\/image:loc><\/image:image>/g)) {
        images++;
        const src = img[1].replace(/&amp;/g, '&');
        if (!src.startsWith(SITE_URL + '/') || !existsSync(path.join(dist, src.slice(SITE_URL.length)))) fail(`/${file}`, `image not built: ${src}`);
      }
    }
  }
  if (images < published.length / 2) fail('/sitemap-images.xml', `only ${images} images`);
  sitemapSummary = `${children.length} child sitemaps, ${urls} URLs, ${images} images`;
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
console.log(`PASS: ${htmlFiles.length} pages, ${registered.length} registered addresses labelled and kept out of structured data, counts per type equal roster's (${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ')}); all internal links resolve; ${cards} cards with "Example service price"; robots ${INDEXABLE ? 'index' : 'noindex'}; ${retiredPaths.size} retired listings as 301s + noindex fallbacks; _redirects ${redirectCheck.staticCount} static + ${redirectCheck.dynamicCount} dynamic rules; ${sitemapSummary}; icons, manifest, _headers and JSON-LD structure valid; ${webp} WebP logos <= 256 px / 30 KB, ${svg} SVG logos.`);

// Editorial checks on HomezyPro's own copy (ported from roster/scripts/check-editorial.mjs).
// Source-level rules run now; the per-page guide/blog assertions (one H1, FAQ schema matching the
// visible FAQ, contents anchors, canonicals) switch on automatically once those routes are built.
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadGuides, wordCount} from '../src/lib/port/lib/editorial.mjs';
import {loadBlog, proseChunks, officialHosts} from '../src/lib/port/lib/blog.mjs';
import {SITE_URL} from '../src/config/site.mjs';
import {sitemapXml} from '../src/lib/port/lib/sitemaps.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = path.join(root, 'src/lib/port');
const dist = path.join(root, 'dist');
const guides = await loadGuides(port);
const method = await readFile(path.join(port, 'content/how-it-works.md'), 'utf8');
const blog = await loadBlog(port, {renderRates: key => key});

assert.ok(guides.length >= 47, `${guides.length} guides`);
for (const g of guides) {
  assert.ok(g.words >= 1000, `${g.id}: ${g.words} words, minimum 1000`);
  assert.ok(g.faqs.length >= 1, `${g.id}: FAQs`);
  assert.ok(!/\[VERIFY\]|lorem ipsum|guaranteed response|verified bookings/i.test(g.markdown), `${g.id}: unsupported claim`);
}
assert.ok(wordCount(method) >= 1000, 'method page length');

// The brand is HomezyPro everywhere in our own copy; "best" is reserved for the best-of pages.
const own = [
  ['content/how-it-works.md', method],
  ...guides.map(g => [`content/guides/${g.id}.md`, g.markdown]),
  ...await Promise.all((await readdir(path.join(port, 'content/blog'))).filter(f => f.endsWith('.md')).map(async f => [`content/blog/${f}`, await readFile(path.join(port, 'content/blog', f), 'utf8')])),
  ['data/service-guides.json', await readFile(path.join(port, 'data/service-guides.json'), 'utf8')]
];
for (const [file, text] of own) {
  assert.ok(!/\bbest\b/i.test(text.replace(/\]\([^)]*\)/g, ']')), `"best" in our own copy: ${file}: ${text.match(/.{0,40}\bbest\b.{0,30}/i)?.[0]}`);
  assert.ok(!/\bRoster\b|\/roster\//.test(text), `old brand in ${file}`);
  assert.ok(!/HomezyPro\s*SG/i.test(text), `brand with SG in ${file}`);
}

// Blog posts: length, contents, short FAQ, official sources only, no unsourced prices or numbers.
assert.ok(blog.length >= 5, 'At least five blog posts');
for (const b of blog) {
  assert.ok(b.words >= 900 && b.words <= 1500, `${b.slug}: ${b.words} words, want 900 to 1500`);
  assert.ok(b.toc.length >= 4, `${b.slug}: table of contents`);
  assert.ok(b.faqs.length >= 2 && b.faqs.length <= 5, `${b.slug}: short FAQ`);
  for (const s of b.sources) assert.ok(officialHosts.includes(new URL(s.url).host), `${b.slug}: unofficial source ${s.url}`);
  for (const chunk of proseChunks(b.markdown)) {
    assert.ok(!/\$|\bSGD\b|per cent|%/i.test(chunk), `${b.slug}: prices and percentages only in sourced rate tables: ${chunk.slice(0, 60)}`);
    if (/\d/.test(chunk.replace(/\]\([^)]+\)/g, ']'))) assert.ok(/\]\(https:\/\/www1?\.(?:pub|ema|nea|hdb|police|scdf|bca)\.gov\.sg\//.test(chunk), `${b.slug}: number without an official source in: ${chunk.slice(0, 60)}`);
  }
  assert.ok(!/guaranteed|best in singapore|cheapest/i.test(b.markdown), `${b.slug}: unsupported claims`);
}
assert.equal(new Set(blog.map(b => b.h1.toLowerCase())).size, blog.length, 'Duplicate blog headline');

// Built guide pages (ported from roster/scripts/check-editorial.mjs).
const read = rel => readFile(path.join(dist, rel), 'utf8');
const sitemap = await sitemapXml(dist);
let builtGuides = 0;
for (const g of guides) {
  const html = await read(`${g.slug}/index.html`);
  builtGuides++;
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${g.id}: one H1`);
  assert.ok(html.includes('<html lang="en-SG">'), `${g.id}: lang`);
  assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}${g.path}">`), `${g.id}: canonical`);
  const article = html.match(new RegExp(`<article[^>]+data-editorial-id="${g.id}">([\\s\\S]*?)<\\/article>`))?.[1];
  assert.ok(article, `${g.id}: server-rendered article`);
  const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const faq = json['@graph'].find(n => n['@type'] === 'FAQPage');
  assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), g.faqs, `${g.id}: FAQ schema matches visible FAQ`);
  for (const t of g.toc) assert.ok(article.includes(`id="${t.id}"`), `${g.id}: contents anchor ${t.id}`);
  assert.ok(html.includes('class="footer-guides"'), `${g.id}: footer guides`);
  assert.ok(!/\[VERIFY\]|lorem ipsum|guaranteed response|verified bookings/i.test(article), `${g.id}: unsupported claim`);
  assert.ok(sitemap.includes(`<loc>${SITE_URL}${g.path}</loc>`), `${g.id}: guide missing from sitemap`);
  if (g.directoryPath) {
    const directory = await read(`${g.directoryPath.replace(/^\//, '')}index.html`);
    assert.ok(!directory.includes('data-editorial-id='), `${g.id}: directory must not embed long-form content`);
    assert.ok(directory.includes('id="guide"'), `${g.id}: old guide anchor stays useful`);
    assert.ok(directory.includes(`href="${g.path}"`), `${g.id}: directory links to standalone guide`);
    assert.ok(html.includes(`href="${g.directoryPath}"`), `${g.id}: guide links back to directory`);
    const directorySchema = JSON.parse(directory.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.ok(!directorySchema['@graph'].some(n => n['@type'] === 'Article' || n['@type'] === 'FAQPage'), `${g.id}: guide schema belongs only on the guide page`);
  }
}
// The aircon price guide shows the BTU (unit size) matrix; the "by number of units" matrix stays hidden.
{
  const priceGuide = await read('aircon/servicing-price/index.html');
  assert.ok(priceGuide.includes('data-aircon-matrix="sizes"'), 'BTU / unit-size matrix on the aircon price guide');
  assert.ok(!priceGuide.includes('data-aircon-matrix="units"') && !priceGuide.includes('data-average-vs-median'), 'Units matrix must stay hidden');
}

// Built blog pages (ported from roster/scripts/check-editorial.mjs).
const blogIndex = await read('blog/index.html');
assert.ok(sitemap.includes(`<loc>${SITE_URL}/blog/</loc>`), 'Blog index missing from sitemap');
for (const b of blog) {
  const html = await read(`blog/${b.slug}/index.html`);
  assert.ok(blogIndex.includes(`href="${b.path}"`), `${b.slug}: blog index link`);
  assert.ok(sitemap.includes(`<loc>${SITE_URL}${b.path}</loc>`), `${b.slug}: missing from sitemap`);
  assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}${b.path}">`), `${b.slug}: canonical`);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${b.slug}: one H1`);
  const article = html.match(/<article class="guide-article" data-blog-post="[^"]+">([\s\S]*?)<\/article>/)?.[1];
  assert.ok(article, `${b.slug}: article`);
  for (const t of b.toc) { assert.ok(article.includes(`<h2 id="${t.id}">`), `${b.slug}: contents anchor ${t.id}`); assert.ok(html.includes(`href="#${t.id}"`), `${b.slug}: contents link ${t.id}`); }
  assert.ok(html.includes('By HomezyPro editorial team') && /Updated <time datetime="\d{4}-\d{2}-\d{2}">/.test(html), `${b.slug}: author and updated date`);
  assert.ok(/<figcaption><a href="https:\/\/www\.pexels\.com\/photo\/[^"]+">Illustrative photo: [^<]+ \/ Pexels<\/a><\/figcaption>/.test(html) && html.includes('src="/assets/hero/'), `${b.slug}: credited self-hosted hero`);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const art = graph.find(n => n['@type'] === 'Article');
  assert.ok(art && art.author.name === 'HomezyPro editorial team' && art.dateModified === b.updated, `${b.slug}: Article schema`);
  assert.ok(graph.some(n => n['@type'] === 'BreadcrumbList'), `${b.slug}: BreadcrumbList`);
  const faq = graph.find(n => n['@type'] === 'FAQPage');
  assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), b.faqs, `${b.slug}: FAQ schema`);
  const visible = article.replaceAll('&#39;', "'").replaceAll('&quot;', '"').replaceAll('&amp;', '&');
  for (const [q, a] of b.faqs) assert.ok(visible.includes(`<h3>${q}</h3>`) && visible.includes(a.slice(0, 60)), `${b.slug}: FAQ not visible: ${q}`);
  const ctas = [...article.matchAll(/data-blog-cta>[\s\S]*?<a class="btn btn-solid" href="(\/[^"]+)"/g)].map(m => m[1]);
  assert.ok(ctas.length >= 2 && ctas.length <= 4 && ctas.length === b.ctas, `${b.slug}: 2 to 4 CTAs`);
  assert.equal(new Set(ctas).size, ctas.length, `${b.slug}: CTA targets repeat`);
  const parts = article.split('data-blog-cta>');
  for (const part of parts.slice(1, -1)) assert.ok(part.includes('<h2 '), `${b.slug}: CTAs must be spread across sections`);
  assert.ok(parts[0].includes('<h2 '), `${b.slug}: first CTA comes after the opening section`);
  assert.ok((article.match(/href="\/(?!blog\/)[^"#]+"/g) || []).length > ctas.length + 2, `${b.slug}: contextual in-text links`);
  assert.ok(b.sources.length >= 1 && html.includes('data-blog-sources'), `${b.slug}: official sources linked`);
  for (const t of article.matchAll(/<table data-sourced-rates="([^"]+)">/g)) assert.ok(b.markdown.includes(`[[rates ${t[1]}]]`), `${b.slug}: rate table not requested`);
}
for (const b of blog) assert.ok(!guides.some(g => g.h1.toLowerCase() === b.h1.toLowerCase() || g.slug.endsWith('/' + b.slug)), `${b.slug}: duplicates a guide`);
// Method page and symptom finder.
{
  const how = await read('how-it-works/index.html');
  assert.ok(how.includes('data-editorial-id="method"') || how.includes('How HomezyPro works'), 'method page');
  assert.ok((await read('what-service-do-i-need/index.html')).includes('data-symptom-finder'), 'symptom finder');
}
// The home page links every hub guide.
if (existsSync(path.join(dist, 'index.html'))) {
  const home = await readFile(path.join(dist, 'index.html'), 'utf8');
  for (const g of guides.filter(g => g.hub)) assert.ok(home.includes(`href="${g.path}"`), `home links ${g.path}`);
}
console.log(`PASS: ${guides.length} guides (${guides.reduce((s, g) => s + g.words, 0)} words, all >= 1000), method page ${wordCount(method)} words, ${blog.length} blog posts; brand and "best" rules on our own copy; ${builtGuides} guide pages and ${blog.length} blog pages: one H1, canonicals, contents anchors, FAQ schema = visible FAQ, sitemap entries, CTAs and sources; BTU matrix shown, units matrix hidden.`);

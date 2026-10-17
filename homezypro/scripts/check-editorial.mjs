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

// Built guide pages (from round 2): page-level assertions.
let builtGuides = 0;
for (const g of guides) {
  const file = path.join(dist, g.slug, 'index.html');
  if (!existsSync(file)) continue;
  builtGuides++;
  const html = await readFile(file, 'utf8');
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${g.id}: one H1`);
  assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}${g.path}">`), `${g.id}: canonical`);
  const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const faq = json['@graph'].find(n => n['@type'] === 'FAQPage');
  assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), g.faqs, `${g.id}: FAQ schema matches visible FAQ`);
  for (const t of g.toc) assert.ok(html.includes(`id="${t.id}"`), `${g.id}: contents anchor ${t.id}`);
}
// The home page links every hub guide.
if (existsSync(path.join(dist, 'index.html'))) {
  const home = await readFile(path.join(dist, 'index.html'), 'utf8');
  for (const g of guides.filter(g => g.hub)) assert.ok(home.includes(`href="${g.path}"`), `home links ${g.path}`);
}
console.log(`PASS: ${guides.length} guides (${guides.reduce((s, g) => s + g.words, 0)} words, all >= 1000), method page ${wordCount(method)} words, ${blog.length} blog posts; brand and "best" rules on our own copy; ${builtGuides} guide pages built (page-level checks run when built).`);

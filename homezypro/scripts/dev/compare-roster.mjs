// Dev check: page counts per type and rendered <main> parity against roster's built pages
// (after the path/brand rewrite). Run from homezypro/ after a build:  node scripts/dev/compare-roster.mjs
import fs from 'node:fs';
import path from 'node:path';

const R = path.resolve('../roster'), D = path.resolve('dist');
const walk = (root, dir = root, out = []) => { for (const e of fs.readdirSync(dir, {withFileTypes: true})) { if (e.name === 'node_modules') continue; const p = path.join(dir, e.name); e.isDirectory() ? walk(root, p, out) : e.name === 'index.html' && out.push(path.relative(root, p)); } return out; };
const kind = (rel, html) => {
  const p = rel.split('/');
  if (rel === 'index.html') return 'home';
  if (p[0] === 'company') return html.includes('data-retired-listing') ? 'retired listing' : 'company';
  if (p[0] === 'blog') return p.length === 2 ? 'blog index' : 'blog post';
  if (p[1] === 'best') return 'best-of';
  if (html.includes('data-area-page=')) return 'town page';
  if (html.includes('directory-page')) return p.length === 2 ? (p[0] === 'search' ? 'search' : 'hub') : 'intent directory';
  if (html.includes('data-editorial-id=')) return 'guide';
  return p.length === 2 ? p[0] : rel;
};
const rb = t => t.replace(/\/roster\/assets\/logos\/web\//g, '/logos/').replace(/\/roster\/assets\/logos\//g, '/logos/').replace(/\/roster\/assets\//g, '/assets/').replace(/https:\/\/previews\.heylead\.com\/roster/g, 'https://homezypro.com').replace(/\/roster\//g, '/').replace(/\bRoster\b/g, 'HomezyPro').replace(/\bROSTER\b/g, 'HOMEZYPRO');
const main = t => (t.match(/<main[^>]*>([\s\S]*)<\/main>/) || [])[1]?.trim() || '';
const count = (root, files) => { const c = {}; for (const f of files) { const k = kind(f, fs.readFileSync(path.join(root, f), 'utf8')); c[k] = (c[k] || 0) + 1; } return c; };
const rf = walk(R), df = walk(D);
const rc = count(R, rf), dc = count(D, df);
console.log('type'.padEnd(26), 'roster', 'homezypro');
for (const k of [...new Set([...Object.keys(rc), ...Object.keys(dc)])].sort()) console.log(k.padEnd(26), String(rc[k] || 0).padStart(6), String(dc[k] || 0).padStart(9));
console.log('total'.padEnd(26), String(rf.length).padStart(6), String(df.length).padStart(9));
const differs = {};
let same = 0;
for (const f of df) {
  if (!fs.existsSync(path.join(R, f))) continue;
  const a = rb(fs.readFileSync(path.join(R, f), 'utf8')), b = fs.readFileSync(path.join(D, f), 'utf8');
  if (main(a) === main(b)) { same++; continue; }
  const k = kind(f, b);
  (differs[k] ||= []).push(f);
}
console.log(`<main> identical: ${same}; differs by type:`, Object.fromEntries(Object.entries(differs).map(([k, v]) => [k, v.length])));
if (process.argv[2]) {
  const f = process.argv[2], a = main(rb(fs.readFileSync(path.join(R, f), 'utf8'))), b = main(fs.readFileSync(path.join(D, f), 'utf8'));
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  console.log('roster:   ', a.slice(Math.max(0, i - 100), i + 160));
  console.log('homezypro:', b.slice(Math.max(0, i - 100), i + 160));
} else for (const [k, v] of Object.entries(differs)) console.log(k, v.slice(0, 4).join(' '));

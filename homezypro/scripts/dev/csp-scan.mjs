// Dev helper: count constructs in dist/ that a strict CSP (no 'unsafe-inline') would block.
// Run from homezypro/ after a build: node scripts/dev/csp-scan.mjs
import fs from 'node:fs';
import path from 'node:path';

const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, {withFileTypes: true})) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(html|js|mjs|svg)$/.test(e.name)) files.push(p); } })('dist');
const rules = {
  'style attribute': /\sstyle="/g,
  'inline handler': /\son[a-z]+="/g,
  'inline script': /<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/g,
  'style element': /<style[\s>]/g,
  'eval': /\beval\(|new Function\(/g,
  'style= in JS strings': /style=\\?["'`]/g
};
const found = {};
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const group = f.endsWith('.html') ? (f.includes('/company/') ? 'company pages' : f.split(path.sep)[1]) : f.replace(/^dist\//, '');
  for (const [name, re] of Object.entries(rules)) {
    const n = (text.match(re) || []).length;
    if (!n) continue;
    found[name] ||= {};
    found[name][group] = (found[name][group] || 0) + n;
  }
}
console.log(JSON.stringify(found, null, 1));

// One-time port of roster/ (the reference implementation) into homezypro/src/lib/port/.
// Copies roster's renderers, client assets, editorial content and reference data, rewriting
// "/roster/..." paths to root paths and the Roster brand to HomezyPro. Account/Supabase code is
// not copied (parked features are omitted from HomezyPro).
//
// Run from the repository root:  node homezypro/scripts/dev/port-from-roster.mjs
// Re-running overwrites local edits under src/lib/port/ and public/assets/; review the diff.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const H = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const R = path.resolve(H, '../roster');
const skip = new Set([
  'lib/account-pages.mjs', 'assets/supabase-client.mjs', 'assets/account-client.mjs', 'assets/account-model.mjs',
  'assets/accounts.js', 'assets/accounts.css', 'assets/accounts-licenses.txt', 'assets/logo-fit.css'
]);
export const rebrand = t => t
  .replace(/\/roster\/assets\/logos\/web\//g, '/logos/')
  .replace(/\/roster\/assets\/logos\//g, '/logos/')
  .replace(/\/roster\/assets\//g, '/assets/')
  .replace(/\\\/roster\\\//g, '\\/')
  .replace(/\/roster\//g, '/')
  .replace(/\bRoster\b/g, 'HomezyPro')
  .replace(/\bROSTER\b/g, 'HOMEZYPRO');
const copy = (from, to, tx = true) => {
  fs.mkdirSync(path.dirname(to), {recursive: true});
  const b = fs.readFileSync(from);
  fs.writeFileSync(to, tx ? rebrand(b.toString('utf8')) : b);
};
const walk = (d, cb) => { for (const e of fs.readdirSync(d, {withFileTypes: true})) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, cb) : cb(p); } };

// HomezyPro-owned replacements that a re-run must not overwrite.
const owned = new Set(['lib/site-config.mjs']);
for (const f of fs.readdirSync(path.join(R, 'lib'))) if (!skip.has('lib/' + f) && !(owned.has('lib/' + f) && fs.existsSync(path.join(H, 'src/lib/port/lib', f)))) copy(path.join(R, 'lib', f), path.join(H, 'src/lib/port/lib', f));
for (const f of fs.readdirSync(path.join(R, 'assets'))) {
  const rel = 'assets/' + f;
  if (skip.has(rel) || fs.statSync(path.join(R, rel)).isDirectory()) continue;
  if (/\.mjs$/.test(f)) {
    // Server-side copies drop the browser cache-busting query from import specifiers.
    copy(path.join(R, rel), path.join(H, 'src/lib/port/assets', f));
    const file = path.join(H, 'src/lib/port/assets', f);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/(from '\.\/[a-z-]+\.mjs)\?v=[^']*'/g, "$1'"));
  }
  if (/\.(mjs|js|css)$/.test(f)) copy(path.join(R, rel), path.join(H, 'public/assets', f));
}
copy(path.join(R, 'scripts/import-db.mjs'), path.join(H, 'src/lib/port/scripts/import-db.mjs'));
{
  // Keep the library; drop roster's CLI block (it names a personal Drive path). HomezyPro's entry
  // point is scripts/import-data.mjs.
  const file = path.join(H, 'src/lib/port/scripts/import-db.mjs');
  const src = fs.readFileSync(file, 'utf8');
  const cut = src.indexOf('const script=fileURLToPath(import.meta.url);');
  if (cut < 0) throw new Error('import-db.mjs CLI block not found');
  fs.writeFileSync(file, src.slice(0, cut) + '// CLI removed in HomezyPro: run `npm run import:data` (scripts/import-data.mjs).\n');
}
// Roster's unit tests for the ported modules run unchanged (bar the rebrand) beside import-db.mjs.
for (const t of ['import-db', 'aircon-matrix', 'best-of', 'presentation', 'display-name', 'sourced-rates', 'descriptions', 'review-policy'])
{
  const to = path.join(H, 'src/lib/port/scripts', t + '.test.mjs');
  copy(path.join(R, 'scripts', t + '.test.mjs'), to);
  // HomezyPro keeps imported data in src/data/ and hero files in public/. The built-page
  // description test moves to scripts/check-site.mjs (it needs dist/, which tests do not).
  fs.writeFileSync(to, fs.readFileSync(to, 'utf8')
    .replace(/new URL\('\.\.\/data\/companies\.json'/g, "new URL('../../../data/companies.json'")
    .replace("new URL('..'+size.src.replace('/roster',''),import.meta.url)", "new URL('../../../../public'+size.src,import.meta.url)")
    .replace("test('No built page has a description ending in a dangling word'", "test.skip('No built page has a description ending in a dangling word (checked by check-site)'"));
}
// build.mjs becomes src/lib/render.mjs only once; after that render.mjs is edited by hand.
if (!fs.existsSync(path.join(H, 'src/lib/render.mjs'))) copy(path.join(R, 'build.mjs'), path.join(H, 'src/lib/render.mjs'));
walk(path.join(R, 'content'), p => copy(p, path.join(H, 'src/lib/port', path.relative(R, p))));
for (const f of ['service-guides.json', 'hero-photos.json', 'planning-area-adjacency.json', 'singapore-outline.json', 'map-pins.json'])
  copy(path.join(R, 'data', f), path.join(H, 'src/lib/port/data', f));
// Import inputs owned by HomezyPro from now on: curated seeds and the slug registry.
walk(path.join(R, 'data/curated'), p => copy(p, path.join(H, 'src/data/curated', path.basename(p))));
copy(path.join(R, 'data/slug-registry.json'), path.join(H, 'src/data/slug-registry.json'));
walk(path.join(R, 'assets/hero'), p => copy(p, path.join(H, 'public/assets/hero', path.relative(path.join(R, 'assets/hero'), p)), false));
walk(path.join(R, 'assets/companies'), p => copy(p, path.join(H, 'public/assets/companies', path.relative(path.join(R, 'assets/companies'), p)), false));
console.log('Ported roster into', H);

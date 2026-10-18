// Import a Roster DB release into HomezyPro.
//
//   npm run import:data [-- <companies-release.json> <logos-release.tar.gz>]
//
// Inputs default to the pinned r15.2 release in HOMEZYPRO_RELEASE_DIR (default /workspace/roster-release),
// which is read only. Both files are checked against their adjacent .sha256 files AND the pinned
// checksums below; any mismatch stops the import before anything is written.
//
// Publication rules are roster's own (src/lib/port/scripts/import-db.mjs, copied from
// roster/scripts/import-db.mjs): blocking flags, including needs-human-review, exclude a row.
// This script adds explicit guards for the r15.1/r15.2 import notes: the two needs-human-review rows
// are withheld, no published row carries a blocking flag, listings kept retired stay unpublished, the
// slugs in NEVER_PUBLISH_SLUGS are never assigned, and the informational lead-gen-network-site flag
// withholds nothing by itself.
//
// Writes src/data/{companies,profiles,presentation,operator-groups,import-report,slug-registry}.json
// and the served logos in public/logos/ (+ public/assets/logo-fit.css) via scripts/logos.py.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {importDatabase, verifyRelease, BLOCKED} from '../src/lib/port/scripts/import-db.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = process.env.HOMEZYPRO_RELEASE_DIR || '/workspace/roster-release';
export const PINNED = {
  companies: {file: 'companies-20261018-1004.json', sha256: 'd8c388bf6d0232905fe8f781a2ec1f3b4adc198382fda732876172290bec2bcb'},
  logos: {file: 'logos-20261018-0059.tar.gz', sha256: '2df3c41423ca0385412ff3abc75f8dcbfef5c08b449b043cfa7d2b880143cfc3'}
};
// Published counts for r15.2 (this importer, with the rules below). r15.1 published 738.
export const EXPECTED = {total: 745, byTrade: {aircon: 231, plumbing: 101, electrician: 116, handyman: 100, cleaning: 197}};
export const PREVIOUS = {release: 'r15.1', total: 738, byTrade: {aircon: 231, plumbing: 100, electrician: 116, handyman: 99, cleaning: 192}};
export const WITHHELD_FOR_REVIEW = ['web-hedircool-sg-com', '201823211K'];
// Listings that stay retired even when their release data passes the bar (r15.2: Billy Aircon meets the
// full bar; un-retiring it is an editorial decision). Excluded with the reason 'kept-retired'.
export const KEEP_RETIRED = {'roster-billy-aircon': 'billy-aircon'};
// Slugs that must never be published or named on the site: 201823211K's old slug city-cleaning (tied to
// scam reports, never live) and its r15.2 slug direct-painters-plastering (row withheld). Both 404.
export const NEVER_PUBLISH_SLUGS = ['city-cleaning', 'direct-painters-plastering'];
// Informational flags: must not be in the importer's blocking set.
export const INFORMATIONAL_FLAGS = ['lead-gen-network-site'];

async function verified(file, pinned) {
  const bytes = await readFile(file);
  const sidecar = await readFile(file + '.sha256', 'utf8');
  const actual = verifyRelease(bytes, sidecar); // throws on mismatch with the .sha256 file
  if (pinned && path.basename(file) === pinned.file && actual !== pinned.sha256) throw new Error(`Pinned checksum mismatch for ${pinned.file}. Import stopped.`);
  return {bytes, sha256: actual};
}

export function guardPublication(db, data) {
  if (!BLOCKED.has('needs-human-review')) throw new Error('Importer does not withhold needs-human-review. Import stopped.');
  const published = new Set(data.report.published.map(p => p.id));
  for (const id of WITHHELD_FOR_REVIEW) if (published.has(id)) throw new Error(`${id} is flagged needs-human-review but would be published. Import stopped.`);
  for (const id of Object.keys(KEEP_RETIRED)) if (published.has(id)) throw new Error(`${id} is kept retired but would be published. Import stopped.`);
  for (const p of data.report.published) if (NEVER_PUBLISH_SLUGS.includes(p.slug)) throw new Error(`Slug ${p.slug} must never be published (${p.id}). Import stopped.`);
  for (const f of INFORMATIONAL_FLAGS) if (BLOCKED.has(f)) throw new Error(`${f} is informational but the importer treats it as blocking. Import stopped.`);
  for (const row of db.companies) {
    if (!published.has(row.id)) continue;
    const blocking = (row.flags || []).filter(f => BLOCKED.has(f));
    if (blocking.length) throw new Error(`${row.id} published with blocking flags ${blocking.join(', ')}`);
  }
}

// Release summaries are directory-generated sentences ("Roster found no published prices..."), not
// company quotes, so the directory's own name in them becomes HomezyPro. Source excerpts are untouched.
export function rebrandSummaries(companies) {
  let n = 0;
  for (const c of companies) {
    const s = c.enrichment?.summary;
    if (s?.text && /\bRoster\b/.test(s.text)) { s.text = s.text.replace(/\bRoster\b/g, 'HomezyPro'); n++; }
  }
  return n;
}

export function compareCounts(report, expected = EXPECTED) {
  const diffs = [];
  if (report.publishedCount !== expected.total) diffs.push(`total ${report.publishedCount} vs ${expected.total}`);
  for (const [trade, n] of Object.entries(expected.byTrade)) if (report.byTrade[trade]?.published !== n) diffs.push(`${trade} ${report.byTrade[trade]?.published} vs ${n}`);
  return diffs;
}

const script = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === script) {
  const companiesFile = process.argv[2] || path.join(releaseDir, PINNED.companies.file);
  const logosFile = process.argv[3] || path.join(releaseDir, PINNED.logos.file);
  if (path.basename(companiesFile) === 'companies.json') throw new Error('Use a checksum-verified release, not a working companies.json');
  const companies = await verified(companiesFile, PINNED.companies);
  const logos = await verified(logosFile, PINNED.logos);
  console.log(`Checksums OK: ${path.basename(companiesFile)} ${companies.sha256.slice(0, 8)}…, ${path.basename(logosFile)} ${logos.sha256.slice(0, 8)}…`);

  const db = JSON.parse(companies.bytes.toString('utf8'));
  const dataDir = path.join(root, 'src/data');
  const seeds = {};
  for (const f of ['companies', 'profiles', 'presentation']) seeds[f] = JSON.parse(await readFile(path.join(dataDir, 'curated', f + '.json'), 'utf8'));
  const registry = JSON.parse(await readFile(path.join(dataDir, 'slug-registry.json'), 'utf8'));
  // r15.2: profile.retiredSlugs are reserved for good; a row whose registry slug was retired moves to its
  // new profile slug (201823211K: city-cleaning -> direct-painters-plastering, no redirect).
  const reservedSlugs = new Set(NEVER_PUBLISH_SLUGS);
  for (const row of db.companies) for (const r of row.profile?.retiredSlugs || []) {
    reservedSlugs.add(r.slug);
    if (registry[row.id] === r.slug && row.profile?.slug) registry[row.id] = row.profile.slug;
  }
  const withhold = Object.fromEntries(Object.keys(KEEP_RETIRED).map(id => [id, 'kept-retired']));
  const data = importDatabase(db, seeds, registry, {withhold, reservedSlugs: [...reservedSlugs]});
  guardPublication(db, data);
  data.report.rebrandedSummaries = rebrandSummaries(data.companies.companies);
  data.report.sourceSha256 = companies.sha256;
  data.report.sourceRelease = path.basename(companiesFile);

  // Logos: verify every published logo against its release sha256, then serve optimised copies.
  const wanted = data.report.published.map(c => data.presentation[c.slug]?.logoAsset).filter(Boolean);
  // Chrome-rendered copies of large SVGs (scripts/dev/rasterize-svg-logos.py), keyed by SVG sha256.
  let rasters = {};
  try { rasters = JSON.parse(await readFile(path.join(dataDir, 'svg-rasters.json'), 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const result = JSON.parse(execFileSync('python3', [path.join(root, 'scripts/logos.py')], {
    input: JSON.stringify({bundle: logosFile, publicDir: path.join(root, 'public'), logos: wanted, rasters}), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
  }));
  for (const entry of Object.values(data.presentation)) {
    if (!entry.logo) continue;
    const served = result.variants[entry.logo];
    if (!served) throw new Error(`No served copy for ${entry.logo}`);
    entry.logo = served.src; // logoAsset keeps the original path and checksum as the import record
  }
  data.report.logos = {...result.stats, bundle: path.basename(logosFile), bundleSha256: logos.sha256};

  await mkdir(dataDir, {recursive: true});
  for (const [name, key] of [['companies', 'companies'], ['profiles', 'profiles'], ['presentation', 'presentation'], ['operator-groups', 'groups'], ['import-report', 'report'], ['slug-registry', 'registry']])
    await writeFile(path.join(dataDir, name + '.json'), JSON.stringify(data[key], null, 2) + '\n');
  console.log(`Imported ${data.report.publishedCount} profiles; excluded ${data.report.excludedCount} rows.`);
  console.table(data.report.byTrade);
  console.log('Logos:', JSON.stringify(result.stats));
  const diffs = compareCounts(data.report);
  console.log(diffs.length ? `Counts differ from expected: ${diffs.join('; ')}` : `Counts match expected: ${EXPECTED.total} (${Object.entries(EXPECTED.byTrade).map(([t, n]) => `${t} ${n}`).join(', ')})`);
  if (diffs.length) process.exitCode = 1;
  // Content hash of the generated data, so a re-import can be compared quickly.
  console.log('companies.json sha256', createHash('sha256').update(JSON.stringify(data.companies, null, 2) + '\n').digest('hex').slice(0, 16));
}

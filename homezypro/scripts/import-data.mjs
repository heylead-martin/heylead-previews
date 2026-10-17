// Import a Roster DB release into HomezyPro.
//
//   npm run import:data [-- <companies-release.json> <logos-release.tar.gz>]
//
// Inputs default to the pinned r15.1 release in HOMEZYPRO_RELEASE_DIR (default /workspace/roster-release),
// which is read only. Both files are checked against their adjacent .sha256 files AND the pinned
// checksums below; any mismatch stops the import before anything is written.
//
// Publication rules are roster's own (src/lib/port/scripts/import-db.mjs, copied from
// roster/scripts/import-db.mjs): blocking flags, including needs-human-review, exclude a row.
// This script adds explicit guards for the r15.1 import note: the two needs-human-review rows
// are withheld and no published row carries a blocking flag.
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
  companies: {file: 'companies-20261018-0125.json', sha256: 'f317b17d90fa5eb5512deb570f6fbe844b305b20b38dce3215c8c10f2a046f7a'},
  logos: {file: 'logos-20261018-0059.tar.gz', sha256: '2df3c41423ca0385412ff3abc75f8dcbfef5c08b449b043cfa7d2b880143cfc3'}
};
// Roster's current published counts for r15.1 (roster/data/import-report.json).
export const EXPECTED = {total: 738, byTrade: {aircon: 231, plumbing: 100, electrician: 116, handyman: 99, cleaning: 192}};
export const WITHHELD_FOR_REVIEW = ['web-hedircool-sg-com', '201823211K'];

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
  if (report.publishedCount !== expected.total) diffs.push(`total ${report.publishedCount} vs roster ${expected.total}`);
  for (const [trade, n] of Object.entries(expected.byTrade)) if (report.byTrade[trade]?.published !== n) diffs.push(`${trade} ${report.byTrade[trade]?.published} vs roster ${n}`);
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
  const data = importDatabase(db, seeds, registry);
  guardPublication(db, data);
  data.report.rebrandedSummaries = rebrandSummaries(data.companies.companies);
  data.report.sourceSha256 = companies.sha256;
  data.report.sourceRelease = path.basename(companiesFile);

  // Logos: verify every published logo against its release sha256, then serve optimised copies.
  const wanted = data.report.published.map(c => data.presentation[c.slug]?.logoAsset).filter(Boolean);
  const result = JSON.parse(execFileSync('python3', [path.join(root, 'scripts/logos.py')], {
    input: JSON.stringify({bundle: logosFile, publicDir: path.join(root, 'public'), logos: wanted}), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
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
  console.log(diffs.length ? `Counts differ from roster: ${diffs.join('; ')}` : `Counts match roster: ${EXPECTED.total} (${Object.entries(EXPECTED.byTrade).map(([t, n]) => `${t} ${n}`).join(', ')})`);
  if (diffs.length) process.exitCode = 1;
  // Content hash of the generated data, so a re-import can be compared quickly.
  console.log('companies.json sha256', createHash('sha256').update(JSON.stringify(data.companies, null, 2) + '\n').digest('hex').slice(0, 16));
}

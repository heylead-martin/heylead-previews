// Cache-busting for ES-module imports inside public/assets: rewrite "./catalogue-card.mjs?v=..." in the
// files that import it to the module's content hash. Runs before every build (npm "prebuild").
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public/assets');
export const moduleHash = async name => createHash('sha256').update(await readFile(path.join(assets, name))).digest('hex').slice(0, 12);
export const IMPORTERS = {'catalogue-card.mjs': ['catalogue.js', 'job-results.js']};
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [mod, files] of Object.entries(IMPORTERS)) {
    const v = await moduleHash(mod);
    for (const f of files) {
      const p = path.join(assets, f), src = await readFile(p, 'utf8');
      const out = src.replace(new RegExp(`(\\./${mod.replace('.', '\\.')})\\?v=[\\w-]+`, 'g'), `$1?v=${v}`);
      if (out !== src) { await writeFile(p, out); console.log(`${f}: ${mod}?v=${v}`); }
    }
  }
}

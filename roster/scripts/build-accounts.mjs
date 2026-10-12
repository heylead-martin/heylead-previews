import {build} from 'esbuild';
import {readFile,writeFile,rm,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {readPublicAccountConfig} from './account-config.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
let config;
try { config = await readPublicAccountConfig(); }
catch (error) {
  await rm(root+'accounts.public.json', {force:true});
  throw error;
}
await build({
  absWorkingDir: root,
  entryPoints: ['assets/account-client.mjs'],
  outfile: 'assets/accounts.js',
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  legalComments: 'linked',
  banner: {js:'/* Third-party licenses: /roster/assets/accounts-licenses.txt */'}
});
const licenseFiles = [
  '@supabase/supabase-js/LICENSE', '@supabase/auth-js/LICENSE',
  '@supabase/functions-js/LICENSE', '@supabase/postgrest-js/LICENSE',
  '@supabase/realtime-js/LICENSE', '@supabase/storage-js/LICENSE',
  '@supabase/phoenix/LICENSE.md', 'iceberg-js/LICENSE', 'tslib/LICENSE.txt'
];
const licenses = await Promise.all(licenseFiles.map(async file => `${file}\n\n${await readFile(root+'node_modules/'+file,'utf8')}`));
await writeFile(root+'assets/accounts-licenses.txt',licenses.join('\n\n'));
await writeFile(root+'accounts.public.json.tmp',JSON.stringify(config)+'\n');
await rename(root+'accounts.public.json.tmp',root+'accounts.public.json');
console.log(config.configured ? 'Account integration built. Public runtime configuration generated outside git.' : 'Account integration built in disconnected preview mode.');

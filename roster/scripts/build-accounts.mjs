import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateAccountConfig} from '../assets/account-model.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(new URL('../accounts.json', import.meta.url), 'utf8'));
const configured = validateAccountConfig(config);
await build({
  absWorkingDir: root,
  entryPoints: ['assets/account-client.mjs'],
  outfile: 'assets/accounts.js',
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  legalComments: 'linked',
  banner: {js:'/* Third-party licenses: /roster/assets/accounts-licenses.txt */'},
  define: {'ROSTER_ACCOUNT_CONFIG': JSON.stringify({...config, configured})}
});
const licenseFiles = [
  '@supabase/supabase-js/LICENSE', '@supabase/auth-js/LICENSE',
  '@supabase/functions-js/LICENSE', '@supabase/postgrest-js/LICENSE',
  '@supabase/realtime-js/LICENSE', '@supabase/storage-js/LICENSE',
  '@supabase/phoenix/LICENSE.md', 'iceberg-js/LICENSE', 'tslib/LICENSE.txt'
];
const licenses = await Promise.all(licenseFiles.map(async file => `${file}\n\n${await readFile(root+'node_modules/'+file,'utf8')}`));
await writeFile(root+'assets/accounts-licenses.txt',licenses.join('\n\n'));
console.log(configured ? 'Account integration built for the configured Supabase project.' : 'Account integration built. Provider configuration is still required.');

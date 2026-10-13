import {readFile, readdir, lstat} from 'node:fs/promises';
import {resolve, relative, join} from 'node:path';
import {previewFeatures} from '../assets/features.mjs';
import {validateAccountConfig} from '../assets/account-model.mjs';

const root = resolve(process.argv[2] || '_site');
async function inspect(folder) {
  for (const name of await readdir(folder)) {
    const file = join(folder, name);
    const path = relative(root, file);
    const stat = await lstat(file);
    if (stat.isSymbolicLink()) throw new Error(`Symbolic links cannot be deployed: ${path}`);
    if (name === 'node_modules' || name === '.git' || name === '.temp' || /^\.env(?:\.|$)/.test(name) && name !== '.env.example' || /(?:^|\.)password-local/.test(name) || name === '.oculogica-preview-login.local.txt') {
      throw new Error(`Local-only file found in deployment artifact: ${path}`);
    }
    if (stat.isDirectory()) await inspect(file);
  }
}
try {
  const config = JSON.parse(await readFile(join(root, 'roster/accounts.public.json'), 'utf8'));
  const allowed = new Set(['url','publishableKey','googleEnabled','configured']);
  if (Object.keys(config).some(key => !allowed.has(key))) throw new Error('Unexpected fields in public account configuration.');
  if (previewFeatures && (!validateAccountConfig(config) || config.configured !== true)) throw new Error('The deployed account configuration must be connected.');
  if (previewFeatures && !/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(config.publishableKey)) throw new Error('Only a publishable key may be deployed.');
  if(!previewFeatures && (config.configured!==false || config.url!=='' || config.publishableKey!=='' || config.googleEnabled!==false)) throw new Error('Parked accounts must contain no connection values.');
  await inspect(root);
  for (const file of ['index.html','login.html','auth.js','auth-config.js','CNAME','roster/index.html','roster/sign-in/index.html','roster/saved/index.html']) {
    if (!(await lstat(join(root,file))).isFile()) throw new Error(`Required site file is missing: ${file}`);
  }
  console.log('PASS: Complete preview artifact, public-only account config, no local credentials, CLI state or dependencies.');
} catch (error) {
  console.error(error.code ? 'Deployment artifact is incomplete or unreadable.' : error.message);
  process.exitCode = 1;
}

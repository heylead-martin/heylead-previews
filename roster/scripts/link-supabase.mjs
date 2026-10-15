import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readPublicAccountConfig} from './account-config.mjs';

try {
  const config = await readPublicAccountConfig();
  if (!config.configured) throw new Error('Linking requires the project URL and publishable key in roster/.env.local.');
  const ref = new URL(config.url).hostname.split('.')[0];
  const root = fileURLToPath(new URL('../', import.meta.url));
  const child = spawn(root+'node_modules/.bin/supabase', ['link','--project-ref',ref], {cwd:root, stdio:'inherit'});
  child.on('error',()=>{console.error('Could not start Supabase CLI. Run npm ci in roster first.');process.exitCode=1;});
  child.on('exit',code=>{process.exitCode=code ?? 1;});
} catch (error) {
  console.error(error.message);
  process.exitCode=1;
}

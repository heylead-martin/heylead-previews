import {readFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {validateAccountConfig} from '../assets/account-model.mjs';

export async function readAccountEnv({file = new URL('../.env.local', import.meta.url), env = process.env} = {}) {
  let local = {};
  try { local = parseEnv(await readFile(file, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Could not read roster/.env.local. Check its format and permissions.');
  }
  return {...local, ...env};
}

export async function readPublicAccountConfig(options) {
  const env = await readAccountEnv(options);
  // Explicit allowlist: never serialize the environment or any server credentials.
  const url = (env.ROSTER_PUBLIC_SUPABASE_URL || '').trim();
  const publishableKey = (env.ROSTER_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim();
  if (!url && !publishableKey && env.ROSTER_ACCOUNT_PREVIEW === '1') {
    return {url:'', publishableKey:'', googleEnabled:false, configured:false};
  }
  if (!url || !publishableKey) throw new Error('Missing Roster Supabase configuration. Set ROSTER_PUBLIC_SUPABASE_URL and ROSTER_PUBLIC_SUPABASE_PUBLISHABLE_KEY in roster/.env.local. For a disconnected design preview only, set ROSTER_ACCOUNT_PREVIEW=1.');
  if (!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(publishableKey)) {
    throw new Error('ROSTER_PUBLIC_SUPABASE_PUBLISHABLE_KEY must contain a publishable key. Secret, service-role and legacy keys are not accepted by this setup.');
  }
  validateAccountConfig({url, publishableKey});
  const google = env.ROSTER_PUBLIC_SUPABASE_GOOGLE_ENABLED || '';
  if (!['', 'true', 'false'].includes(google)) throw new Error('ROSTER_PUBLIC_SUPABASE_GOOGLE_ENABLED must be empty, true or false.');
  return {url, publishableKey, googleEnabled:google === 'true', configured:true};
}

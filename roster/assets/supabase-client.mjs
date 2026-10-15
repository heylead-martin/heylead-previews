import {createClient} from '@supabase/supabase-js';
import {validateAccountConfig} from './account-model.mjs';

let browserClient;
export async function loadAccountConfig(fetcher = fetch) {
  let response;
  try { response = await fetcher('/roster/accounts.public.json', {cache:'no-store', credentials:'same-origin', signal:AbortSignal.timeout(10000)}); }
  catch { throw new Error('Account configuration could not be loaded. Please reload and try again.'); }
  if (!response.ok) throw new Error('Account configuration is missing. Build and deploy the generated public account configuration.');
  let config;
  try { config = await response.json(); }
  catch { throw new Error('Account configuration is invalid. Rebuild the public account configuration.'); }
  const configured = validateAccountConfig(config);
  if (!configured && config?.configured !== false) throw new Error('Supabase configuration is missing. Set the public project URL and publishable key, then rebuild.');
  return {url:config.url || '', publishableKey:config.publishableKey || '', configured, googleEnabled:configured && config.googleEnabled === true};
}

export function getSupabaseClient(config) {
  if (!validateAccountConfig(config)) throw new Error('Supabase configuration is missing. Set the public project URL and publishable key, then rebuild.');
  browserClient ||= createClient(config.url, config.publishableKey, {
    auth:{flowType:'pkce', detectSessionInUrl:false, persistSession:true, autoRefreshToken:true, storageKey:'roster-auth-v1'}
  });
  return browserClient;
}

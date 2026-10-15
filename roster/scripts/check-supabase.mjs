import {createClient} from '@supabase/supabase-js';
import {readPublicAccountConfig} from './account-config.mjs';

try {
  const config = await readPublicAccountConfig();
  if (!config.configured) throw new Error('Connection check requires the project URL and publishable key. Preview mode is disconnected.');
  const response = await fetch(config.url+'/auth/v1/settings', {
    headers:{apikey:config.publishableKey}, signal:AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Supabase connection check failed (HTTP ${response.status}). Check the public configuration and project status.`);
  const settings = await response.json();
  if (!settings || typeof settings.external !== 'object') throw new Error('Supabase returned an unexpected settings response.');
  console.log('PASS: Supabase accepted the publishable key. Read-only connection check succeeded.');
  if (process.argv.includes('--schema')) {
    const client = createClient(config.url, config.publishableKey, {
      auth:{persistSession:false, autoRefreshToken:false, detectSessionInUrl:false},
      global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(10000)})}
    });
    const {error} = await client.from('roster_saved_companies').select('company_slug').limit(0);
    if (error?.code === '42501') console.log('PASS: Saved-company table is present and denies anonymous reads.');
    else if (error) throw new Error('Saved-company schema check failed. Confirm the reviewed migration is applied.');
    else throw new Error('Saved-company schema check failed: anonymous reads should be denied. Review table grants and RLS.');
  }
} catch (error) {
  // Never print response bodies, request headers, keys or SDK errors.
  const safe = /^(Missing Roster|ROSTER_PUBLIC_|Use the HTTPS|Could not read|Connection check|Supabase connection|Supabase returned|Saved-company)/.test(error.message);
  console.error(safe ? error.message : 'Supabase connection check failed. Check network access and project availability.');
  process.exitCode = 1;
}

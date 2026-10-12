import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readPublicAccountConfig} from './account-config.mjs';
import {loadAccountConfig,getSupabaseClient} from '../assets/supabase-client.mjs';

const key = 'sb_publishable_'+'fixture_only_not_a_real_key';
const env = {ROSTER_PUBLIC_SUPABASE_URL:'https://project.supabase.co',ROSTER_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key};

test('Missing configuration fails unless disconnected preview is explicit',async()=>{
  const dir = await mkdtemp(join(tmpdir(),'roster-env-'));
  try {
    const file=join(dir,'.env.local');
    await assert.rejects(readPublicAccountConfig({file,env:{}}),/Missing Roster/);
    assert.equal((await readPublicAccountConfig({file,env:{ROSTER_ACCOUNT_PREVIEW:'1'}})).configured,false);
    await assert.rejects(readPublicAccountConfig({file,env:{ROSTER_ACCOUNT_PREVIEW:'1',ROSTER_PUBLIC_SUPABASE_URL:env.ROSTER_PUBLIC_SUPABASE_URL}}),/Missing Roster/);
  } finally {await rm(dir,{recursive:true,force:true});}
});
test('Local env loads without shell execution; process env overrides and secrets are excluded',async()=>{
  const dir = await mkdtemp(join(tmpdir(),'roster-env-'));
  try {
    const file=join(dir,'.env.local');
    await writeFile(file,`ROSTER_PUBLIC_SUPABASE_URL=https://local.supabase.co\nROSTER_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${key}\nSUPABASE_SECRET_KEY=must_not_ship\nDATABASE_PASSWORD=must_not_ship\n`);
    const config=await readPublicAccountConfig({file,env:{ROSTER_PUBLIC_SUPABASE_URL:env.ROSTER_PUBLIC_SUPABASE_URL}});
    assert.deepEqual(config,{url:env.ROSTER_PUBLIC_SUPABASE_URL,publishableKey:key,googleEnabled:false,configured:true});
    assert.equal(JSON.stringify(config).includes('must_not_ship'),false);
    await writeFile(file,'ROSTER_PUBLIC_SUPABASE_URL=$(echo wrong)\n');
    await assert.rejects(readPublicAccountConfig({file,env:{ROSTER_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key}}),/HTTPS/);
  } finally {await rm(dir,{recursive:true,force:true});}
});
test('Public configuration rejects elevated keys without including their values in errors',async()=>{
  for (const bad of ['sb_secret_'+'sensitive_fixture_value','service_role_fixture_value']) {
    await assert.rejects(readPublicAccountConfig({file:'/nonexistent-roster-env',env:{...env,ROSTER_PUBLIC_SUPABASE_PUBLISHABLE_KEY:bad}}),error=>{
      assert.equal(error.message.includes(bad),false);
      return /publishable key/.test(error.message);
    });
  }
});
test('Runtime loading validates the response and never silently accepts missing configuration',async()=>{
  await assert.rejects(loadAccountConfig(async()=>new Response('',{status:404})),/configuration is missing/);
  await assert.rejects(loadAccountConfig(async()=>new Response('{}')),/configuration is missing/);
  await assert.rejects(loadAccountConfig(async()=>new Response('<html>')),/configuration is invalid/);
  await assert.rejects(loadAccountConfig(async()=>{throw new Error('private network detail');}),/could not be loaded/);
  assert.throws(()=>getSupabaseClient({}),/configuration is missing/);
  const preview=await loadAccountConfig(async()=>Response.json({configured:false}));
  assert.equal(preview.configured,false);
  const config=await loadAccountConfig(async()=>Response.json({url:env.ROSTER_PUBLIC_SUPABASE_URL,publishableKey:key,googleEnabled:'true'}));
  assert.equal(config.configured,true);
  assert.equal(config.googleEnabled,false);
});

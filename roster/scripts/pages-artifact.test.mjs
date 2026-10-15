import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const checker = fileURLToPath(new URL('./check-pages-artifact.mjs',import.meta.url));
const config = {configured:false,url:'',publishableKey:'',googleEnabled:false};
async function fixture(action) {
  const root=await mkdtemp(join(tmpdir(),'roster-pages-test-'));
  try {
    for(const file of ['index.html','login.html','auth.js','auth-config.js','CNAME','roster/index.html','roster/sign-in/index.html','roster/saved/index.html']) {
      await mkdir(dirname(join(root,file)),{recursive:true});
      await writeFile(join(root,file),'fixture');
    }
    await writeFile(join(root,'roster/accounts.public.json'),JSON.stringify(config));
    await action(root,()=>spawnSync(process.execPath,[checker,root],{encoding:'utf8'}));
  } finally {await rm(root,{recursive:true,force:true});}
}
test('Deployment accepts disconnected empty configuration and complete sites',()=>fixture(async(root,run)=>{
  assert.equal(run().status,0);
}));
test('Deployment refuses local environment files and CLI state',()=>fixture(async(root,run)=>{
  const file=join(root,'roster/.env.local');
  await writeFile(file,'local fixture');
  assert.notEqual(run().status,0);
  await rm(file);
  await mkdir(join(root,'roster/supabase/.temp'),{recursive:true});
  assert.notEqual(run().status,0);
}));
test('Deployment refuses unexpected configuration and active accounts while parked',()=>fixture(async(root,run)=>{
  for(const data of [{...config,SUPABASE_SECRET_KEY:'fixture_must_not_ship'},{...config,configured:true},{...config,publishableKey:'sb_secret_fixture_must_not_ship'}]) {
    await writeFile(join(root,'roster/accounts.public.json'),JSON.stringify(data));
    const result=run();assert.notEqual(result.status,0);assert.equal(result.stderr.includes('fixture_must_not_ship'),false);
  }
}));
test('Deployment refuses a missing shared preview entry point',()=>fixture(async(root,run)=>{
  await rm(join(root,'auth.js'));assert.notEqual(run().status,0);
}));

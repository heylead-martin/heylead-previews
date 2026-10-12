import test from 'node:test';
import assert from 'node:assert/strict';
import {createSavedStore,safeNext,validateAccountConfig,normalizeSaved,GUEST_KEY} from '../assets/account-model.mjs';
const origin='https://previews.heylead.com';
function fixture(initial=[]) {
  const data=new Map([[GUEST_KEY,JSON.stringify(initial)]]);
  const accounts=new Map([['alice',['alice-company']],['bob',['bob-company']]]);
  const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  const remote={
    list:async id=>[...(accounts.get(id)||[])],
    add:async (id,slugs)=>accounts.set(id,[...new Set([...(accounts.get(id)||[]),...slugs])]),
    remove:async (id,slug)=>accounts.set(id,(accounts.get(id)||[]).filter(x=>x!==slug))
  };
  return {storage,remote,accounts,store:createSavedStore({storage,remote})};
}
test('Account return paths reject outside origins, encoded separators and auth loops',()=>{
  for(const value of ['https://evil.example/roster/','//evil.example/roster/','/login.html','/roster/../login.html','/roster/%2f%2fevil.example','/roster/sign-in/','/roster/auth/callback/','javascript:alert(1)','\\\\evil.example/roster/']) assert.equal(safeNext(value,origin),'/roster/saved/');
  assert.equal(safeNext('/roster/company/338-aircon/#reviews',origin),'/roster/company/338-aircon/#reviews');
  assert.equal(safeNext('/roster/search/?q=aircon',origin),'/roster/search/?q=aircon');
});
test('Browser configuration refuses elevated Supabase keys and incomplete settings',()=>{
  assert.equal(validateAccountConfig({url:'',publishableKey:''}),false);
  assert.equal(validateAccountConfig({url:'https://project.supabase.co',publishableKey:'sb_publishable_12345678901234567890'}),true);
  const jwt=role=>'e30.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.signature';
  assert.equal(validateAccountConfig({url:'https://project.supabase.co',publishableKey:jwt('anon')}),true);
  for(const key of ['sb_secret_1234567890',jwt('service_role'),'']) assert.throws(()=>validateAccountConfig({url:'https://project.supabase.co',publishableKey:key}));
  assert.throws(()=>validateAccountConfig({url:'http://project.supabase.co',publishableKey:jwt('anon')}));
});
test('Guest bookmarks survive reload, stay separate from accounts, and reject malformed slugs',async()=>{
  const f=fixture(['guest-company','guest-company','../bad',null]);
  assert.deepEqual(f.store.state().saved,['guest-company']);
  await f.store.toggle('another-company');
  assert.deepEqual(JSON.parse(f.storage.getItem(GUEST_KEY)),['guest-company','another-company']);
  await f.store.setUser('alice');
  assert.deepEqual(f.store.state().saved,['alice-company']);
  await f.store.toggle('account-only');
  assert.deepEqual(JSON.parse(f.storage.getItem(GUEST_KEY)),['guest-company','another-company']);
  await f.store.setUser('bob');
  assert.deepEqual(f.store.state().saved,['bob-company']);
  await f.store.setUser(null);
  assert.deepEqual(f.store.state().saved,['guest-company','another-company']);
  assert.deepEqual(normalizeSaved(['x','<script>','UPPER','x']),['x']);
});
test('A failed account write rolls back only that bookmark, preserving another successful write',async()=>{
  const f=fixture();let reject;
  const original=f.remote.add;
  f.remote.add=(owner,slugs)=>slugs[0]==='fails'?new Promise((_,r)=>reject=r):original(owner,slugs);
  await f.store.setUser('alice');
  const failing=f.store.toggle('fails');await f.store.toggle('works');
  reject(new Error('offline'));await assert.rejects(failing);
  assert.deepEqual(f.store.state().saved,['alice-company','works']);
  assert.match(f.store.state().error,/could not be saved/);
});
test('A late response from a previous account cannot populate the new account',async()=>{
  const f=fixture();let resolve;
  f.remote.list=id=>id==='alice'?new Promise(r=>resolve=r):Promise.resolve(['bob-company']);
  const old=f.store.setUser('alice');
  await f.store.setUser('bob');resolve(['private-alice-company']);await old;
  assert.deepEqual(f.store.state().saved,['bob-company']);
  assert.equal(f.store.state().userId,'bob');
});
test('Signing out during a save cannot restore the previous account list',async()=>{
  const f=fixture(['guest-company']);let reject;
  await f.store.setUser('alice');
  f.remote.add=()=>new Promise((_,r)=>reject=r);
  const write=f.store.toggle('pending-company');
  await f.store.setUser(null);reject(new Error('offline'));await assert.rejects(write);
  assert.deepEqual(f.store.state().saved,['guest-company']);
  assert.equal(f.store.state().error,'');
});
test('Guest import is explicit, deduplicated and clears guest data only after a successful write',async()=>{
  const f=fixture(['guest-company','alice-company']);
  await f.store.setUser('alice');
  assert.equal(f.store.state().guestCount,2);
  await f.store.importGuests();
  assert.deepEqual(new Set(f.store.state().saved),new Set(['alice-company','guest-company']));
  assert.equal(f.store.state().guestCount,0);
  const failed=fixture(['guest-company']);await failed.store.setUser('alice');
  failed.remote.add=async()=>{throw new Error('offline');};
  await failed.store.importGuests();
  assert.equal(failed.store.state().guestCount,1);
  assert.match(failed.store.state().error,/still on this device/);
});
test('Unavailable browser storage rolls back a guest bookmark instead of claiming success',async()=>{
  const f=fixture();f.storage.setItem=()=>{throw new Error('storage full');};
  await assert.rejects(f.store.toggle('company'));
  assert.deepEqual(f.store.state().saved,[]);
  assert.match(f.store.state().error,/browser could not save/);
});

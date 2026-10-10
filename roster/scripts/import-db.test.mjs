import test from 'node:test';
import assert from 'node:assert/strict';
import { importDatabase, BLOCKED, blockAddress, verifyRelease } from './import-db.mjs';
import { structuredHours, concise, ratingFact } from '../lib/expanded.mjs';
const empty={companies:{companies:[]},profiles:{},presentation:{}};
const row=(id='test')=>({id,name:'Example Aircon',categories:['aircon'],checked:'2026-10-10',flags:[],website:'https://example.com',about:[{text:'Aircon services.',sourceUrl:'https://example.com',capturedAt:'2026-10-10'}],services:[{name:'general-service',excerpt:'General service',sourceUrl:'https://example.com/services',capturedAt:'2026-10-10'}],phone:{value:'+65 6123 4567',sourceUrl:'https://example.com/contact',alt:[{value:'+65 8000 0000'}]},address:{value:'123 Bedok Road #03-12, Singapore 123456',sourceUrl:'https://example.com/contact'},price_lines:[],reviews:[],profile:{websiteCheck:{result:'active'}}});
const db=companies=>({checked:'2026-10-10',companies,operatorGroups:{}});
test('Every publication-blocking flag and rollback excludes a full profile',()=>{for(const flag of BLOCKED){const result=importDatabase(db([{...row(),flags:[flag]}]),empty);assert.equal(result.companies.companies.length,0,flag);assert.ok(result.report.excluded[0].reasons.includes(flag));}assert.equal(importDatabase(db([{...row(),profile_rolled_back:{reason:'review'}}]),empty).report.excludedCount,1);});
test('Missing sourced required fields prevents publication',()=>{for(const key of ['about','services','phone','address','website'])assert.equal(importDatabase(db([{...row(),[key]:null}]),empty).report.excludedCount,1,key);});
test('Import retains only the primary phone and maintains stable slugs across reruns',()=>{const first=importDatabase(db([row('one'),row('two')]),empty);assert.equal(first.companies.companies.length,2);assert.equal(new Set(first.companies.companies.map(x=>x.slug)).size,2);assert.equal(first.companies.companies[0].phone.alt,undefined);const second=importDatabase(db([row('two'),row('one')]),empty,first.registry);assert.deepEqual(second.registry,first.registry);assert.deepEqual(second.companies,first.companies);});
test('Original content and contacts win; flagged review source is removed',()=>{const c={slug:'original',name:'Original',category:'aircon',phone:{value:'+65 6111 1111',sourceUrl:'https://original.example'},website:{value:'https://original.example'},reviews:[{sourceUrl:'https://old.example/review'}],facts:[],mapsUrl:'https://maps.google.com/?cid=1'};const p={about:['Hand-written text.'],services:[]};const seed={companies:{companies:[c]},profiles:{original:p},presentation:{original:{price:'Ask for a quote',published:false}}};const r={...row(),rosterProfile:{slug:'original'},flag_details:[{flag:'review-source-404',url:'https://old.example/review'}]};const result=importDatabase(db([r]),seed);assert.deepEqual(result.profiles.original,p);assert.equal(result.companies.companies[0].phone.value,c.phone.value);assert.equal(result.companies.companies[0].reviews.length,0);const withheld=importDatabase(db([{...r,flags:['website-inactive']}]),seed);assert.equal(withheld.report.excluded[0].curated,true);assert.deepEqual(withheld.profiles.original,p);assert.equal(withheld.companies.companies.length,0);assert.throws(()=>importDatabase(db([]),seed),/missing from the release/);});
test('Block-level map query omits unit numbers',()=>{assert.equal(blockAddress('123 Bedok Rd #03-12, Singapore 123456'),'123 Bedok Rd, Singapore 123456');assert.equal(blockAddress('88 Street Unit 02-01, Singapore 123456'),'88 Street, Singapore 123456');});
test('Google sentence has a source date and omits an absent count',()=>{const result=ratingFact({googleRating:{value:4.8,count:null,sourceUrl:'https://maps.google.com/?cid=1',checkedAt:'2026-10-10T12:00+03:00'}});assert.equal(result.text,'Google Maps: 4.8 (checked 10 Oct 2026)');assert.equal(ratingFact({rating:{value:4.8,count:10,sourceUrl:'https://example.com',label:'x'},website:{value:'https://example.com'}}).google,false);});
test('Hours schema accepts exact day/time facts only',()=>{assert.deepEqual(structuredHours({text:'Monday 9 am-5 pm; Tuesday 9:30 am-6 pm; Sunday Closed'}),['Mo 09:00-17:00','Tu 09:30-18:00']);assert.equal(structuredHours({text:'Call us anytime'}),undefined);});
test('Long metadata ends on a whole word within the limit',()=>{const s=concise('Example company '.repeat(20));assert.ok(s.length<=155);assert.ok(s.endsWith('.'));assert.ok(!s.endsWith('com.'));});

test('Removed slugs remain reserved and placeholder content is excluded',()=>{const first=importDatabase(db([row('old')]),empty);const next=importDatabase(db([row('new')]),empty,first.registry);assert.notEqual(next.registry.old,next.registry.new);const bad=row();bad.about[0].text='Fusce porta euismod magna.';assert.equal(importDatabase(db([bad]),empty).report.excludedCount,1);});
test('Space-separated and unusual-hyphen units are redacted',()=>{assert.equal(blockAddress('60 Paya Lebar Rd #07 54, Singapore 409051'),'60 Paya Lebar Rd, Singapore 409051');assert.ok(!blockAddress('6A Shenton Way #04\u201101').includes('#'));});

test('Release integrity is checked before import',()=>{
  assert.equal(verifyRelease('abc','ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad  release.json'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.throws(()=>verifyRelease('changed','ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'),/checksum mismatch/);
  for(const flag of ['not-singapore','site-spam-injection','possible-duplicate','no-sg-postal-code'])assert.ok(BLOCKED.has(flag));
});
test('Expanded sourced fields and offer conditions survive import',()=>{
  const r=row();
  r.summary={text:'Example Aircon provides aircon servicing.',sources:['https://example.com']};
  r.faqs=[{q:'Is there a warranty?',a:'A 30-day warranty applies.',source_url:'https://example.com/faq'}];
  r.warranty={value:'30 days',source_url:'https://example.com/faq'};
  r.founded_year={value:2009,source_url:'https://example.com/about'};
  r.highlights=[{text:'Publishes prices on its website',source_url:'https://example.com'}];
  r.social_links={facebook:{url:'https://facebook.com/example',source_url:'https://example.com'},unsafe:{url:'javascript:alert(1)',source_url:'https://example.com'}};
  const noPrices=importDatabase(db([r]),empty);assert.equal(noPrices.companies.companies[0].enrichment.highlights.length,0);
  r.price_lines=[{job:'general-service',service:'General servicing, two units',qty:2,price_text:'S$60',unit:'per visit',gst:'included',promo:true,was_amount_sgd:70,sourceUrl:'https://example.com/prices'}];
  const result=importDatabase(db([r]),empty),e=result.companies.companies[0].enrichment,s=result.profiles['example-aircon'].services;
  assert.equal(e.summary.text,r.summary.text);assert.equal(e.faqs[0].sourceUrl,r.faqs[0].source_url);assert.equal(e.foundedYear.value,2009);assert.equal(e.socials.length,1);
  assert.equal(s.length,1);assert.equal(s[0].prices.length,1);assert.match(s[0].prices[0].detail,/Quantity: 2/);assert.match(s[0].prices[0].detail,/GST: included/);assert.match(s[0].prices[0].detail,/Promotional rate/);
});

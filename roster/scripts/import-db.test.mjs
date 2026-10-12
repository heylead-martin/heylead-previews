import test from 'node:test';
import assert from 'node:assert/strict';
import { importDatabase, BLOCKED, blockAddress, verifyRelease, priceOption, alternatePhones, bundledLogo, reviewSources, supplementPostalAddress } from './import-db.mjs';
import { structuredHours, concise, ratingFact } from '../lib/expanded.mjs';
const empty={companies:{companies:[]},profiles:{},presentation:{}};
const row=(id='test')=>({id,name:'Example Aircon',categories:['aircon'],checked:'2026-10-10',flags:[],website:'https://example.com',about:[{text:'Aircon services.',sourceUrl:'https://example.com',capturedAt:'2026-10-10'}],services:[{name:'general-service',excerpt:'General service',sourceUrl:'https://example.com/services',capturedAt:'2026-10-10'}],phone:{value:'+65 6123 4567',sourceUrl:'https://example.com/contact',alt:[{value:'+65 8000 0000'}]},address:{value:'123 Bedok Road #03-12, Singapore 123456',sourceUrl:'https://example.com/contact'},price_lines:[],reviews:[],profile:{websiteCheck:{result:'active'}}});
const db=companies=>({checked:'2026-10-10',companies,operatorGroups:{}});
test('Bundled logos retain provenance, use hashed local paths and reject unsafe metadata',()=>{
 const logo={local_path:'logos/example.png',sha256:'a'.repeat(64),source_url:'https://example.com',url:'https://example.com/logo.png',capturedAt:'2026-10-11'};
 const asset=bundledLogo(logo);assert.equal(asset.src,'/roster/assets/logos/example-aaaaaaaaaaaa.png');assert.equal(asset.sourceUrl,'https://example.com/');
 const data=importDatabase(db([{...row(),logo}]),empty);assert.equal(data.presentation['example-aircon'].logo,asset.src);
 for(const bad of [{local_path:'logos/../../test.png'},{sha256:'bad'},{source_url:'javascript:alert(1)'}])assert.throws(()=>bundledLogo({...logo,...bad}),/Invalid/);
 assert.equal(bundledLogo(null),null);
});
test('Uncertain logos use initials without removing the business or reviving a photo fallback',()=>{
 const logo={local_path:'logos/example.png',sha256:'a'.repeat(64),source_url:'https://example.com',url:'https://example.com/logo.png',logo_unsure:true,logo_unsure_reason:'Unconfirmed brand mark',audit:{checkedAt:'2026-10-11'}};
 const candidate={...row(),logo,photos:[{kind:'logo',fileUrl:logo.url,pageUrl:logo.source_url}]};
 const result=importDatabase(db([candidate]),empty);
 assert.equal(bundledLogo(logo),null);
 assert.equal(result.report.publishedCount,1);
 assert.equal(result.presentation['example-aircon'].logo,undefined);
 assert.equal(result.presentation['example-aircon'].logoAsset,undefined);
 assert.equal(result.presentation['example-aircon'].logoReview.reason,logo.logo_unsure_reason);
 assert.ok(result.report.warnings.some(w=>w.issue==='Uncertain logo withheld; initials shown'));
 const verified=importDatabase(db([{...candidate,logo:{...logo,logo_unsure:false}}]),empty);
 assert.match(verified.presentation['example-aircon'].logo,/example-aaaaaaaaaaaa\.png$/);
 assert.equal(verified.presentation['example-aircon'].logoReview,undefined);
});
test('Release ratings preserve external sources and unknown counts but omit company widgets',()=>{
 const google={source:'Google Maps',rating:4.8,count:null,scale:5,url:'https://maps.google.com/?cid=1',capturedAt:'2026-10-11'};
 const seller={source:'Carousell',rating:5,count:7,scale:5,url:'https://www.carousell.sg/u/example/',capturedAt:'2026-10-11',method:'page',method_detail:'Seller rating includes all sales.'};
 const widget={...google,source:'Google via widget',count:10,url:'https://example.com'};
 const imported=reviewSources({ratings:[google,seller,widget,{...seller,url:'javascript:bad()'}]});
 assert.equal(imported.length,2);assert.equal(imported[0].count,null);assert.equal(imported[1].note,seller.method_detail);
 assert.deepEqual(reviewSources({ratings:[widget]}),[]);
 assert.equal(importDatabase(db([{...row(),ratings:[seller]}]),empty).companies.companies[0].reviewSources[0].name,'Carousell');
});
test('New release evidence fills only matching missing postal codes and keeps original copy',()=>{
 const current={value:'Carros Centre, 60 Jalan Lam Huat, #03-42',sourceUrl:'https://example.com/contact'};
 const incoming={value:'60 JALAN LAM HUAT #03-42, CARROS CENTRE, Singapore 737869',postal:'737869',sourceUrl:'https://example.com/address'};
 assert.equal(supplementPostalAddress(current,incoming).postal,'737869');
 assert.equal(supplementPostalAddress(current,incoming).value,current.value);
 assert.deepEqual(supplementPostalAddress(current,{...incoming,value:'60 Another Road, Singapore 737869'}),current);
 assert.deepEqual(supplementPostalAddress(current,{...incoming,sourceUrl:''}),current);
 assert.deepEqual(supplementPostalAddress({...current,postal:'111111'},incoming),{...current,postal:'111111'});
 const r={...row(),rosterProfile:{slug:'original',rating:null,rating_moved_to:'self_reported_rating'},self_reported_rating:{rating:5,count:3000,source_url:'https://example.com'},map:{status:'verified',place:{cid:'123',postal:'737869'}}};
 const seed={companies:{companies:[{...row(),slug:'original',category:'aircon',rating:{value:5,count:3000,sourceUrl:'https://example.com'}}]},profiles:{original:{about:['Original words.'],services:[]}},presentation:{original:{published:false}}};
 const result=importDatabase(db([r]),seed);
 assert.equal(result.companies.companies[0].rating,null);
 assert.equal(result.companies.companies[0].selfReportedRating.count,3000);
 assert.equal(result.companies.companies[0].mapEvidence.place.cid,'123');
 assert.deepEqual(result.profiles.original,seed.profiles.original);
});
test('Trustpilot stays a separate source and supported legacy image formats keep checksums',()=>{
 const source={source:'Trustpilot',rating:4.7,count:42,scale:'trustscore',url:'https://trustpilot.com/review/example.com',capturedAt:'2026-10-12'};
 assert.equal(reviewSources({ratings:[source]})[0].scale,'trustscore');
 assert.equal(reviewSources({website:'https://example.com',ratings:[{...source,source:'Badge',scale:5,url:'https://example.com/reviews'}]}).length,0);
 for(const ext of ['ico','gif'])assert.match(bundledLogo({local_path:`logos/example.${ext}`,sha256:'a'.repeat(64),url:`https://example.com/logo.${ext}`,source_url:'https://example.com'}).src,new RegExp(`\\.${ext}$`));
});
test('Normalised unit prices retain total quantity and minimum-booking conditions',()=>{
 const price=priceOption({service:'Three units',price_text:'S$90',unit:'total for 3 units',qty:3,unit_price_sgd:30,units_in_price:3,min_units:3,sourceUrl:'https://example.com'});
 assert.equal(price.price,'S$90');assert.match(price.detail,/Calculated per-unit price: S\$30/);assert.match(price.detail,/total for 3 units/);assert.match(price.detail,/Minimum 3 units/);
});
test('Every publication-blocking flag and rollback excludes a full profile',()=>{for(const flag of BLOCKED){const result=importDatabase(db([{...row(),flags:[flag]}]),empty);assert.equal(result.companies.companies.length,0,flag);assert.ok(result.report.excluded[0].reasons.includes(flag));}assert.equal(importDatabase(db([{...row(),profile_rolled_back:{reason:'review'}}]),empty).report.excludedCount,1);});
test('Missing sourced required fields prevents publication',()=>{for(const key of ['about','services','phone','address','website'])assert.equal(importDatabase(db([{...row(),[key]:null}]),empty).report.excludedCount,1,key);});
test('Main contact remains primary and slugs stay stable across reruns',()=>{const first=importDatabase(db([row('one'),row('two')]),empty);assert.equal(first.companies.companies.length,2);assert.equal(new Set(first.companies.companies.map(x=>x.slug)).size,2);assert.equal(first.companies.companies[0].phone.alt,undefined);const second=importDatabase(db([row('two'),row('one')]),empty,first.registry);assert.deepEqual(second.registry,first.registry);assert.deepEqual(second.companies,first.companies);});
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

test('Primary trade determines one directory and matching report totals',()=>{
  const one={...row('one'),categories:['aircon','electrician'],primary_trade:'electrician'};
  const two={...row('two'),categories:['aircon','plumbing'],primary_trade:'plumbing',flags:['website-inactive']};
  const result=importDatabase(db([one,two]),empty);
  assert.equal(result.companies.companies[0].category,'electrician');assert.equal(result.report.byTrade.electrician.published,1);assert.equal(result.report.byTrade.aircon.published,0);
  assert.equal(result.report.byTrade.plumbing.excluded,1);assert.equal(result.report.byTrade.aircon.excluded,0);
});
test('Alternate phones require a source, carry its label and never replace the main number',()=>{
  const r=row();r.phone.alt=[{value:'+65 6123 4567',sourceUrl:'https://example.com'},{value:'+65 8765 4321',sourceUrl:'https://data.gov.sg/example',sourceLabel:'BCA register (old file)'},{value:'+65 8000 0000'},{value:'+65 8765 4321',sourceUrl:'https://example.com'}];
  const c=importDatabase(db([r]),empty).companies.companies[0];assert.equal(c.phone.value,'+65 6123 4567');assert.deepEqual(c.alternatePhones.map(p=>[p.value,p.sourceLabel]),[['+65 8765 4321','BCA register']]);
  assert.deepEqual(alternatePhones({alt:[{value:'+65 8123 4567',sourceUrl:'javascript:alert(1)'}]},''),[]);
});
test('Monthly package scope and inferred units are explicit',()=>{
 const monthly=priceOption({service:'Regular cleaning',price_text:'S$150',unit:'per month',sessions_per_month:2,hours_per_session:3,sourceUrl:'https://example.com'});
 assert.match(monthly.detail,/per month/);assert.match(monthly.detail,/2 sessions per month/);assert.match(monthly.detail,/3 hours per session/);
 assert.match(priceOption({service:'Chemical wash',price_text:'S$80',unit:'per unit',unitInferred:true,sourceUrl:'https://example.com'}).detail,/inferred from the job type/);
});
test('Fit notes keep their sources and metadata cannot replace missing About content',()=>{
 const r=row();r.bestFor=[{text:'Offers cleaning',source_url:'https://example.com/services'},{text:'Uncited claim'}];r.poorFit=[{text:'Minimum booking applies',source_url:'https://example.com/prices'}];
 const e=importDatabase(db([r]),empty).companies.companies[0].enrichment;assert.equal(e.bestFor.length,1);assert.equal(e.poorFit[0].sourceUrl,'https://example.com/prices');
 r.about=[];r.self_description={text:'Marketing metadata',sourceUrl:'https://example.com'};assert.equal(importDatabase(db([r]),empty).report.excluded[0].reasons[0],'missing-sourced-about');
});

test('Full-bar evidence is preserved and undated alternate numbers remain undated',()=>{
 const r=row();r.profile_bar={meetsFullBar:true,priceWithJob:true,summary:true,checkedAt:'2026-10-11'};
 const c=importDatabase(db([r]),empty).companies.companies[0];assert.equal(c.listingDepth.full,true);assert.equal(c.listingDepth.checkedAt,'2026-10-11');
 assert.equal(importDatabase(db([row()]),empty).companies.companies[0].listingDepth.full,false);
 const dated=alternatePhones({alt:[{value:'+65 8123 4567',sourceUrl:'https://example.com',capturedAt:'2026-10-09'}]},'');assert.equal(dated[0].capturedAt,'2026-10-09');
});
test('Price labels drop UI noise and the build never invents a missing unit',()=>{
 const source={job:'regular-cleaning',service:'Decrease/Increase quantity for Weekly Cleaning',price_text:'S$150',sourceUrl:'https://example.com'};
 assert.equal(priceOption(source).label,'Regular cleaning');assert.equal(priceOption(source).detail,'');
 for(const label of ['Login','+65 9662 2361','1. What is the standard rate?']) assert.equal(priceOption({...source,service:label}).label,'Regular cleaning');
});

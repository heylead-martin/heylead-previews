import test from 'node:test';
import assert from 'node:assert/strict';
import {profileIntro, priceView, servicePrice, tidyPriceLabel} from '../lib/profile-copy.mjs';
import {sampleSources, weightedRating} from '../assets/review-model.mjs';
import {ratingSummary} from '../lib/rating-summary.mjs';
import {splitDirectory,rankCompanies} from '../assets/catalogue-card.mjs';
import {companyMatch} from '../assets/company-match.mjs';
import {filterCatalogue} from '../assets/catalogue-filter.mjs';
import {encodeCatalogue,decodeCatalogue} from '../assets/catalogue-data.mjs';

test('Compact catalogue format preserves every field, null and optional value through JSON',()=>{
 const rows=[{name:'A',category:'aircon',ratingValue:null,logo:'image.png',average:null},{name:'B',category:'cleaning',ratingValue:4.5,average:{count:null,value:4.5,sources:[]},offerings:['Cleaning'],fullProfile:false}];
 assert.deepEqual(decodeCatalogue(JSON.parse(JSON.stringify(encodeCatalogue(rows)))),rows);
 assert.deepEqual(decodeCatalogue({companies:rows}),rows);
 assert.throws(()=>decodeCatalogue({format:'unknown',companies:rows}),/Unsupported/);
 assert.throws(()=>decodeCatalogue({format:'roster-columns-v1',fields:['name'],companies:[{999:'bad'}]}),/Invalid/);
});

test('Combined scores weight the number of reviews rather than averaging sources equally', () => {
  assert.deepEqual(weightedRating([{rating:5,count:90},{rating:1,count:10}]), {rating:4.6,count:100,sources:2});
  for (let n=2;n<=5;n++) {
    const sources=sampleSources.slice(0,n), result=weightedRating(sources);
    assert.equal(result.count,sources.reduce((sum,s)=>sum+s.count,0));
    assert.equal(result.sources,n);
  }
});
test('Unusable scores and identified mirrors do not count toward a combined rating', () => {
  assert.deepEqual(weightedRating([{rating:4,count:10},{rating:4,count:10,mirrorsSource:'Google'},{rating:8,count:10,scale:10},{rating:5,count:0},{rating:5,count:null}]),{rating:4,count:10,sources:1});
  assert.deepEqual(weightedRating([]),{rating:null,count:0,sources:0});
});
test('Public summaries use sourced services and do not invent islandwide or residential coverage', () => {
  const c={name:'Example Plumbing',category:'plumbing',enrichment:{supportedServices:[{name:'Leak repair'}]}};
  assert.match(profileIntro(c),/Example Plumbing offers leak repairs in Singapore/);
  assert.doesNotMatch(profileIntro(c),/residential|across Singapore|\b(?:we|our)\b|website mentions/i);
  c.enrichment.serviceArea={value:'islandwide',sourceUrl:'https://example.com'};
  c.enrichment.residential={value:'yes',sourceUrl:'https://example.com'};
  assert.match(profileIntro(c),/residential jobs across Singapore/);
});
test('Price formatting removes duplicated job names without losing qualifiers, scope or source evidence', () => {
  const price={price:'WC Flush Cistern Replacement | SGD 80',label:'WC Flush Cistern Replacement | SGD 80',detail:'per job, inferred; GST not stated',excerpt:'WC Flush Cistern Replacement | SGD 80'};
  const view=priceView(price);
  assert.equal(view.price,'S$80');assert.equal(view.label,'WC Flush Cistern Replacement');
  assert.equal(view.detail,price.detail);assert.equal(view.excerpt,price.excerpt);
  assert.equal(priceView({...price,price:'Job | from SGD 80 onwards'}).price,'from S$80 onwards');
  assert.equal(priceView({...price,price:'S$80 labour, parts extra'}).price,'S$80 labour, parts extra');
  assert.equal(servicePrice({prices:[{price:'S$80',detail:'per month, two visits'},{price:'S$120',detail:'per month, four visits'}]}),'S$80 - S$120');
  assert.equal(servicePrice({prices:[{price:'S$80',indicative:true}]}),'Price guide');
});

// P1-4 (Martin, 18 Oct 2026): the headline rating is Google Maps alone; nothing is blended in.
test('The headline rating is the Google Maps rating; Carousell, Yelp, mirrors and Trustpilot never blend in', () => {
  const c={googleRating:{value:3.4,count:34,sourceUrl:'https://maps.google.com/?cid=1',checkedAt:'2026-10-10'}};
  assert.deepEqual([ratingSummary(c).value,ratingSummary(c).count,ratingSummary(c).sourceCount],[3.4,34,1]);
  c.reviewSources=[{name:'Yelp',rating:4.5,count:10,scale:5,sourceUrl:'https://yelp.com/biz/example',checkedAt:'2026-10-11'},{name:'Carousell',rating:5,count:12,scale:5,sourceUrl:'https://carousell.sg/u/x',checkedAt:'2026-10-11'},{name:'Trustpilot',rating:4.2,count:6,scale:'trustscore',sourceUrl:'https://trustpilot.com/review/x',checkedAt:'2026-10-11'},{name:'Mirror',rating:5,count:100,scale:5,sourceUrl:'https://example.com/reviews',checkedAt:'2026-10-11',mirrorsSource:'Google Maps'}];
  assert.deepEqual([ratingSummary(c).value,ratingSummary(c).count,ratingSummary(c).sources.map(s=>s.name)],[3.4,34,['Google Maps']]);
  assert.equal(ratingSummary({reviewSources:c.reviewSources}),null);
  assert.equal(ratingSummary({}),null);
});
test('TrustScores never affect the combined average or supply a missing rating',()=>{
 const source={name:'Trustpilot',rating:4.7,count:42,scale:'trustscore',sourceUrl:'https://trustpilot.com/review/example',checkedAt:'2026-10-12'};
 assert.equal(ratingSummary({reviewSources:[source]}),null);
 const google={value:5,count:100,sourceUrl:'https://maps.google.com/?cid=1',checkedAt:'2026-10-12'};
 assert.equal(ratingSummary({googleRating:google,reviewSources:[source]}).value,5);
 assert.equal(ratingSummary({googleRating:google,reviewSources:[{...source,scale:5}]}).count,100);
});

test('Claim matching preselects a slug, ignores punctuation and only autofills unambiguous names', () => {
  const companies=[{slug:'sg1-plumber',name:'💧SG1 Plumber Singapore'},{slug:'acme-one',name:'Acme One Pte. Ltd.'},{slug:'acme-two',name:'Acme Two'}];
  assert.equal(companyMatch('sg1-plumber',companies).slug,'sg1-plumber');
  assert.equal(companyMatch('sg1',companies).name,'💧SG1 Plumber Singapore');
  assert.equal(companyMatch('ACME ONE PTE LTD',companies).slug,'acme-one');
  assert.equal(companyMatch('Acme',companies),null);
  companies.push({slug:'sg1-electrician',name:'SG1 Electrician'});
  assert.equal(companyMatch('sg1',companies),null);
  assert.equal(companyMatch('sg1 plumber',companies).slug,'sg1-plumber');
  assert.equal(companyMatch('New company',companies),null);
  assert.equal(companyMatch('',companies),null);
});

 test('Shortlists contain at most eight full profiles, with every remaining company in the compact list', () => {
  const rows=Array.from({length:12},(_,i)=>({slug:`company-${i}`,name:`Company ${i}`,fullProfile:i<10,evidenceScore:i===0?7:5,ratingValue:i===0?3:5,ratingCount:20}));
  const groups=splitDirectory(rows);
  assert.equal(groups.shortlist.length,8);assert.equal(groups.shortlist[0].slug,'company-0');
  assert.ok(groups.shortlist.every(c=>c.fullProfile));
  assert.equal(new Set([...groups.shortlist,...groups.others].map(c=>c.slug)).size,12);
  assert.ok(splitDirectory(rows,'rating').shortlist.every(c=>c.ratingValue===5));
  assert.equal(splitDirectory(rows.filter(c=>!c.fullProfile)).shortlist.length,0);
 });

const filterRows=[
  {slug:'a',name:'A Plumbing',trade:'Plumbing',category:'plumbing',area:'Eunos',serviceAreas:['Bedok'],ratingValue:4.9,published:true,hasReviews:true,whatsapp:'123',services:['Leak repair']},
  {slug:'b',name:'B Services',trade:'Handyman',category:'handyman',area:'Eunos',serviceAreas:['Bedok'],ratingValue:5,published:false,hasReviews:false,whatsapp:'456',offerings:['Plumbing']},
  {slug:'c',name:'C Plumbing',category:'plumbing',area:'Eunos',serviceAreas:['Bedok'],ratingValue:4.5,published:true,hasReviews:false,services:[]},
  {slug:'d',name:'D Plumbing',category:'plumbing',area:'Tampines',serviceAreas:['Tampines'],ratingValue:5,published:true,hasReviews:true,whatsapp:'789',services:[]},
  {slug:'e',name:'E Cleaning',category:'cleaning',area:'Eunos',serviceAreas:['Bedok'],ratingValue:null,published:false,hasReviews:true,whatsapp:'012',services:[]}
];

test('Checkbox counts combine search, location and rating filters across the full matching set', () => {
  const result=filterCatalogue(filterRows,{query:'  PLUMBING  ',area:'bedok',rating:'4.8',savedSlugs:['b','d']});
  assert.deepEqual(result.matches.map(c=>c.slug),['a','b']);
  assert.deepEqual(result.counts,{price:1,reviews:1,whatsapp:2,saved:1});
});

test('A trade word matches the primary trade first, never words inside another trade\'s services', () => {
  const rows=[
    {slug:'air',name:'Cool Aircon',category:'aircon',offerings:['condenser cleaning','chemical washes'],description:'Aircon cleaning and chemical wash'},
    {slug:'handy',name:'Fix It',category:'handyman',offerings:['Cleaning after repairs']},
    {slug:'clean',name:'Art of Cleaning Pte. Ltd.',category:'cleaning',offerings:['deep cleaning']},
    {slug:'maid',name:'Maid Co',category:'cleaning',offerings:[]}
  ];
  const {matches}=filterCatalogue(rows,{query:'cleaning'});
  assert.deepEqual(matches.map(c=>c.slug).sort(),['clean','handy','maid']);
  assert.deepEqual(rankCompanies(matches,'name').map(c=>c.slug),['clean','maid','handy']);
  assert.deepEqual(filterCatalogue(rows,{query:'chemical wash'}).matches.map(c=>c.slug),['air']);
});

test('Service selection and multiword search narrow the counts as well as the cards', () => {
  const result=filterCatalogue(filterRows,{query:'plumbing Eunos',category:'plumbing'});
  assert.deepEqual(result.matches.map(c=>c.slug),['a','c']);
  assert.deepEqual(result.counts,{price:2,reviews:1,whatsapp:1,saved:0});
  assert.deepEqual(filterCatalogue(filterRows,{query:'leak repair'}).matches.map(c=>c.slug),['a']);
});

test('Selected checkboxes intersect and every count reflects all active restrictions', () => {
  const result=filterCatalogue(filterRows,{area:'bedok',active:['price','whatsapp'],savedSlugs:['b']});
  assert.deepEqual(result.matches.map(c=>c.slug),['a']);
  assert.deepEqual(result.counts,{price:1,reviews:1,whatsapp:1,saved:0});
  assert.deepEqual(filterCatalogue(filterRows,{active:['reviews']}).matches.map(c=>c.slug),['a','d','e']);
});

test('Saved counts respect the current filters and update when the saved set changes', () => {
  const options={area:'bedok',rating:'4.8',active:['saved']};
  const before=filterCatalogue(filterRows,{...options,savedSlugs:['a','d','missing']});
  assert.deepEqual(before.matches.map(c=>c.slug),['a']);
  assert.deepEqual(before.counts,{price:1,reviews:1,whatsapp:1,saved:1});
  const after=filterCatalogue(filterRows,{...options,savedSlugs:['b','b','d']});
  assert.deepEqual(after.matches.map(c=>c.slug),['b']);
  assert.deepEqual(after.counts,{price:0,reviews:0,whatsapp:1,saved:1});
});

test('Empty results zero every count and resetting restores the full directory counts', () => {
  const result=filterCatalogue(filterRows,{query:'no matching business'});
  assert.equal(result.matches.length,0);
  assert.deepEqual(result.counts,{price:0,reviews:0,whatsapp:0,saved:0});
  assert.deepEqual(filterCatalogue(filterRows).counts,{price:3,reviews:3,whatsapp:4,saved:0});
  assert.deepEqual(filterCatalogue([]).counts,{price:0,reviews:0,whatsapp:0,saved:0});
});

test('Counts cover every match, including companies beyond the first page', () => {
  const rows=Array.from({length:30},(_,i)=>({...filterRows[0],slug:`company-${i}`}));
  const result=filterCatalogue(rows,{rating:'4.8'});
  assert.equal(result.matches.length,30);
  assert.equal(result.counts.price,30);
  assert.equal(result.counts.reviews,30);
  assert.equal(result.counts.whatsapp,30);
});

test('Price labels drop leftovers of a removed amount but keep real qualifiers',()=>{
  const cases=[
    ['Residential Cleaning - Affordable cleaning (as low as )','Residential Cleaning - Affordable cleaning'],
    ['Your Reliable House Cleaning Agency - The best option for keeping your home sparkling clean. Recurring service begins at .','Your Reliable House Cleaning Agency - The best option for keeping your home sparkling clean.'],
    ['Aircon Servicing Singapore | Service Aircon Frm','Aircon Servicing Singapore | Service Aircon'],
    ['Trial 4-hour session - . Trial price is applicable to first-time customers only.','Trial 4-hour session. Trial price is applicable to first-time customers only.'],
    ['General Weekly Bi-weekly Home Cleaning - .Minimum 3hours. Let','General Weekly Bi-weekly Home Cleaning. Minimum 3hours.'],
    ['Aircon Cleaning Servicing - Reliable aircon service and cleaning for homes and offices, . Our technicians clean key componen','Aircon Cleaning Servicing - Reliable aircon service and cleaning for homes and offices.'],
    ['Site survey - Overhaul Treatment *(For Contract rate )','Site survey - Overhaul Treatment (For Contract rate)']
  ];
  for(const [raw,expected] of cases)assert.equal(tidyPriceLabel(raw),expected);
  for(const kept of ['General servicing, 3 units (from)','3-Bedroom: from','General servicing, 1st split FCU/CU (<3hp), incl. transport','FLOOR TRAP :from $60.(labor Only)','Normal Servicing, 2 fan coils'])assert.equal(tidyPriceLabel(kept),kept);
  assert.equal(priceView({label:'Affordable cleaning (as low as )',price:'S$18'}).label,'Affordable cleaning');
});

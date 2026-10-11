import test from 'node:test';
import assert from 'node:assert/strict';
import {profileIntro, priceView, servicePrice} from '../lib/profile-copy.mjs';
import {sampleSources, weightedRating} from '../assets/review-model.mjs';
import {ratingSummary} from '../lib/rating-summary.mjs';
import {splitDirectory} from '../assets/catalogue-card.mjs';
import {companyMatch} from '../assets/company-match.mjs';

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

test('Real averages use one source as-is and weight independent sources while excluding sample fixtures and mirrors', () => {
  const c={googleRating:{value:3.4,count:34,sourceUrl:'https://maps.google.com/?cid=1',checkedAt:'2026-10-10'}};
  assert.equal(ratingSummary(c).value,3.4);
  assert.equal(ratingSummary(c).count,34);
  assert.equal(ratingSummary(c).sourceCount,1);
  c.reviewSources=[{name:'Trustpilot',rating:4.5,count:10,scale:5,sourceUrl:'https://trustpilot.com/review/example',checkedAt:'2026-10-11'}, {name:'Mirror',rating:5,count:100,scale:5,sourceUrl:'https://example.com/reviews',checkedAt:'2026-10-11',mirrorsSource:'Google Maps'}];
  assert.equal(ratingSummary(c).value,(3.4*34+4.5*10)/44);
  assert.equal(ratingSummary(c).count,44);
  assert.equal(ratingSummary(c).sourceCount,2);
  assert.equal(ratingSummary({}),null);
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

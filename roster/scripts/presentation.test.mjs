import test from 'node:test';
import assert from 'node:assert/strict';
import {profileIntro, priceView, servicePrice} from '../lib/profile-copy.mjs';
import {sampleSources, weightedRating} from '../assets/review-model.mjs';

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

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderLogo,renderCard,renderCompactCard,rankCompanies} from '../assets/catalogue-card.mjs';
import {renderSelfReported,noRatingText} from '../assets/evidence-display.mjs';
import {ratingSummary} from '../lib/rating-summary.mjs';
import {directoryRecord} from '../lib/expanded.mjs';
import {previewFeatures} from '../assets/features.mjs';
const base={slug:'test',name:'Example Company',area:'Bedok',trade:'Plumbing',category:'plumbing',price:'Quote on request',quoteEvidence:{sourceUrl:'https://example.com/prices',excerpt:'We quote before work.',capturedAt:'2026-10-11'}};
test('Full and compact cards preserve explicit quote evidence after catalogue rendering',()=>{
 for(const renderer of [renderCard,renderCompactCard]){
  const html=renderer(base);
  for(const text of ['Quote on request','Their site: &quot;We quote before work.&quot;','https://example.com/prices','2026-10-11',noRatingText])assert.ok(html.includes(text));
  assert.ok(!html.includes('data-save='));
 }
});
test('Initials have no label; every real logo has a removal route',()=>{
 assert.doesNotMatch(renderLogo(base),/LOGO|<img|logo-owner-note/);
 const html=renderLogo({...base,logo:'/roster/assets/logos/example.png'});
 assert.match(html,/Logos belong to their owners/);assert.match(html,/href="\/roster\/logo-removal\/"/);
});
test('Self-reported scores stay plain text and never supply sorting values',()=>{
 const selfReportedRating={rating:5,count:9000,source_url:'https://example.com/reviews'};
 const c={...base,website:{value:'https://example.com'},selfReportedRating,rating:{value:5,count:9000,sourceUrl:selfReportedRating.source_url}};
 assert.equal(ratingSummary(c),null);
 assert.equal(ratingSummary({...c,reviewSources:[{name:'Review badge',rating:5,count:9000,scale:5,sourceUrl:selfReportedRating.source_url,checkedAt:'2026-10-11'}]}),null);
 const record=directoryRecord(c,{price:'Ask for a quote'},{name:'Plumbing'});
 assert.equal(record.ratingValue,null);assert.equal(record.ratingCount,0);
 const independent={...record,slug:'independent',name:'Independent',ratingValue:4,ratingCount:10};
 assert.equal(rankCompanies([record,independent],'rating')[0].slug,'independent');
 assert.equal(renderSelfReported(selfReportedRating),'<p class="self-reported-rating"><a href="https://example.com/reviews">The company says it has a 5.0 rating from 9,000 reviews on its own site.</a></p>');
});
test('Public features default off and hero photo files match their pinned checksums',async()=>{
 assert.equal(previewFeatures,false);
 const photos=JSON.parse(await readFile(new URL('../data/hero-photos.json',import.meta.url)));
 assert.equal(Object.keys(photos).length,5);
 for(const p of Object.values(photos))for(const size of Object.values(p.sizes)){
  assert.ok(p.url.includes(String(p.id)));assert.ok(size.src.includes(`pexels-${p.id}-`));
  const file=await readFile(new URL('..'+size.src.replace('/roster',''),import.meta.url));
  assert.equal(createHash('sha256').update(file).digest('hex'),size.sha256);
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderLogo,renderCard,renderCompactCard,rankCompanies} from '../assets/catalogue-card.mjs';
import {renderSelfReported,ratingSourceNote,noRatingText} from '../assets/evidence-display.mjs';
import {ratingSummary} from '../lib/rating-summary.mjs';
import {directoryRecord} from '../lib/expanded.mjs';
import {previewFeatures} from '../assets/features.mjs';
const base={slug:'test',name:'Example Company',area:'Bedok',trade:'Plumbing',category:'plumbing',price:'Quote on request',quoteEvidence:{sourceUrl:'https://example.com/prices',excerpt:'We quote before work.',capturedAt:'2026-10-11'}};
test('Full and compact cards preserve explicit quote evidence after catalogue rendering',()=>{
 for(const renderer of [renderCard,renderCompactCard]){
  const html=renderer(base);
  for(const text of ['Quote on request','Their site: &quot;We quote before work.&quot;','https://example.com/prices',noRatingText,'Example service price'])assert.ok(html.includes(text),text);
  // No visible capture dates on cards (Martin, 18 Oct 2026); the date stays in the data.
  assert.ok(!html.includes('2026-10-11')&&!/Captured/.test(html));
  assert.ok(!html.includes('data-save='));
 }
});
test('Initials have no label; card logos carry no note, the company page logo keeps the removal route',()=>{
 assert.doesNotMatch(renderLogo(base),/LOGO|<img|logo-owner-note/);
 const card=renderLogo({...base,logo:'/logos/example.png'});
 assert.match(card,/<img/);assert.doesNotMatch(card,/Logos belong to their owners/);
 const page=renderLogo({...base,logo:'/logos/example.png'},true);
 assert.match(page,/Logos belong to their owners/);assert.match(page,/href="\/logo-removal\/"/);
});
test('Cards: Google Maps rating without a date, one price label, no self-reported sentence',()=>{
 const c={...base,average:{value:4.8,count:120,sourceCount:2,sources:[{name:'Google Maps',sourceUrl:'https://maps.google.com/?cid=1',rating:4.9,count:100},{name:'Carousell',sourceUrl:'https://carousell.sg/x'}]},
  selfReportedRating:{rating:4.9,count:370,source_url:'https://example.com'},quoteEvidence:null,price:'From $19.5',priceDetail:'General service, 1 unit. See service details for inclusions.'};
 for(const renderer of [renderCard,renderCompactCard]){
  const html=renderer(c);
  assert.match(html,/<strong>4\.9<\/strong>[\s\S]*Google Maps[\s\S]*100 reviews/);
  assert.doesNotMatch(html,/The company says|20\d\d-\d\d-\d\d|Average rating|Published pricing|See published prices/);
  assert.equal((html.match(/Example service price/g)||[]).length,1);
  assert.match(html,/From S\$19\.50<\/strong><span class="price-context">General service, 1 unit\.<\/span>/);
 }
 assert.match(renderCard({...c,price:'See published prices'}),/Ask for a quote<\/strong><span class="price-context">No published price found yet/);
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
test('Self-reported counts preserve structured qualifiers and legacy source wording',()=>{
 const source={rating:5,count:3388,source_url:'https://example.com/reviews'};
 assert.match(renderSelfReported({...source,count_qualifier:'plus'}),/from 3,388\+ reviews/);
 assert.match(renderSelfReported({...source,excerpt:'5.0 from 3,388+ reviews'}),/from 3,388\+ reviews/);
 assert.match(renderSelfReported({...source,count:3000,count_qualifier:'more_than'}),/from more than 3,000 reviews/);
 assert.match(renderSelfReported({...source,count:3000,excerpt:'4.9 and more than 3,000, on the electrician page'}),/from more than 3,000 reviews/);
 assert.match(renderSelfReported({...source,excerpt:'More than 3588 homes fixed; 3,388 reviews.'}),/from 3,388 reviews/);
 assert.match(renderSelfReported({...source,excerpt:'13,388+ reviews on another page'}),/from 3,388 reviews/);
 assert.match(renderSelfReported({...source,count_qualifier:'exact',excerpt:'3,388+ from an older source'}),/from 3,388 reviews/);
 assert.match(renderSelfReported({...source,count:1}),/from 1 review on/);
});
test('Rating notes omit retired sorting instructions while keeping source differences',()=>{
 assert.equal(ratingSourceNote('Google shows 4.9 from 1,551. The sort uses 4.9 and 1,551. The company widget differs.'),'Google shows 4.9 from 1,551. The company widget differs.');
 assert.equal(ratingSourceNote('The sort uses 4.7 and 102.'),'');
 assert.equal(ratingSourceNote('The sort uses the electrician-page claim'),'');
 assert.equal(ratingSourceNote('A dated source differs from the company widget.'),'A dated source differs from the company widget.');
});
test('Conflicting or missing company-claimed counts never produce an invented exact total',()=>{
 const source={rating:4.9,count:10338,source_url:'https://example.com/reviews'};
 const conflict=renderSelfReported({...source,count_conflict:true});
 assert.match(conflict,/its pages give different review counts/);
 assert.doesNotMatch(conflict,/10,338|\bstar\b|★/);
 assert.equal(renderSelfReported({...source,count:null}),'<p class="self-reported-rating"><a href="https://example.com/reviews">The company says it has a 4.9 rating on its own site.</a></p>');
});
test('Public features default off and hero photo files match their pinned checksums',async()=>{
 assert.equal(previewFeatures,false);
 const photos=JSON.parse(await readFile(new URL('../data/hero-photos.json',import.meta.url)));
 assert.equal(Object.keys(photos).length,5);
 for(const p of Object.values(photos))for(const size of Object.values(p.sizes)){
  assert.ok(p.url.includes(String(p.id)));assert.ok(size.src.includes(`pexels-${p.id}-`));
  const file=await readFile(new URL('../../../../public'+size.src,import.meta.url));
  assert.equal(createHash('sha256').update(file).digest('hex'),size.sha256);
 }
});

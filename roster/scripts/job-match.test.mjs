import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {interpretJob,matchJob,selectedVisible,jobUrl} from '../assets/job-match.mjs';
import {decodeCatalogue} from '../assets/catalogue-data.mjs';
const company=(slug,serviceAreas,extra={})=>({slug,name:slug,category:'plumbing',offerings:['leak repairs','sink plumbing'],serviceAreas,evidenceScore:3,ratingValue:4.8,ratingCount:30,published:true,...extra});

test('A full sentence identifies service, town and all named jobs without turning budget or timing into a promise',()=>{
 const r=interpretJob('My kitchen sink is leaking in Bedok. I need someone tomorrow, ideally under $100.');
 assert.equal(r.trade,'plumbing');assert.equal(r.area.name,'Bedok');assert.deepEqual(r.jobs.map(j=>j.id),['leak','sink']);assert.equal(r.preferences.timing,true);assert.equal(r.preferences.budget,true);
});
test('Aircon problems are not misclassified as general cleaning or plumbing',()=>{
 assert.equal(interpretJob('My aircon is leaking in Tampines').trade,'aircon');
 assert.deepEqual(interpretJob('My aircon is not cooling in Tampines').jobs.map(j=>j.id),['aircon-repair']);
 assert.equal(interpretJob('I need chemical cleaning for my aircon').trade,'aircon');
});
test('Ambiguous trades and multiple areas ask for a choice instead of arbitrary recommendations',()=>{
 assert.equal(matchJob([], 'I need a plumber and an electrician').intent.needsTrade,true);
 assert.equal(interpretJob('I need plumbing in Bedok or Woodlands').needsArea,true);
 const chosen=interpretJob('I need a plumber and an electrician in Bedok or Woodlands',{trade:'plumbing',area:'woodlands'});
 assert.equal(chosen.needsTrade,false);assert.equal(chosen.needsArea,false);assert.equal(chosen.area.name,'Woodlands');
 assert.equal(interpretJob('Help please').needsTrade,true);
});
test('Town coverage ranks ahead of region and islandwide; missing or nonmatching coverage is excluded',()=>{
 const rows=[company('island',['Islandwide'],{ratingValue:5,evidenceScore:10}),company('town',['Bedok'],{ratingValue:4.2}),company('region',['East']),company('unknown',[],{area:'Bedok'}),company('other',['Woodlands'])];
 assert.deepEqual(matchJob(rows,'My sink is leaking in Bedok').matches.map(c=>c.slug),['town','region','island']);
 assert.equal(matchJob(rows,'My sink is leaking in Bedok',{area:''}).matches.length,5);
});
test('Region selection requires region coverage, while an explicit town gives more precise matches',()=>{
 const rows=[company('island',['Islandwide']),company('town',['Bedok']),company('region',['East']),company('unknown',[]),company('elsewhere',['North'])];
 assert.deepEqual(matchJob(rows,'My sink is leaking',{area:'region:east'}).matches.map(c=>c.slug),['region','island']);
 assert.deepEqual(matchJob(rows,'My sink is leaking in Bedok',{area:'region:east'}).matches.map(c=>c.slug),['town','region','island']);
 assert.equal(interpretJob('My sink is leaking in Woodlands',{area:'region:east'}).areaConflict,true);
 assert.equal(matchJob(rows,'My sink is leaking in Woodlands',{area:'region:east'}).matches.length,0);
 assert.equal(interpretJob('Plumbing in Bedok or Tampines',{area:'region:east'}).needsArea,true);
 assert.equal(interpretJob('Plumbing',{area:'region:north-east'}).area.region,'North-East');
});
test('Every named job must be listed, and office addresses never create coverage claims',()=>{
 const rows=[company('both',['Islandwide']),company('sink-only',['Bedok'],{offerings:['sink plumbing']}),company('office',[],{area:'Bedok'}),company('wrong-trade',['Bedok'],{category:'cleaning'})];
 const r=matchJob(rows,'My sink is leaking in Bedok');assert.deepEqual(r.matches.map(c=>c.slug),['both']);
 assert.ok(r.matches[0].reasons.includes('States islandwide coverage'));
});
test('Excluded requests do not become detected service or area keywords',()=>{
 const r=interpretJob("I need a cleaner in Bedok. I don't need plumbing in Woodlands.");
 assert.equal(r.trade,'cleaning');assert.equal(r.area.name,'Bedok');
});
test('Unknown jobs produce no random shortlist until a supported category is chosen',()=>{
 const rows=[company('sample',['Islandwide'])];assert.equal(matchJob(rows,'I need pest control').matches.length,0);
 assert.equal(matchJob(rows,'I need help',{trade:'plumbing'}).matches.length,1);
});
test('Selected recipients are unique, visible and within the chosen limit',()=>{
 const rows=Array.from({length:12},(_,i)=>company(String(i),[]));
 assert.deepEqual(selectedVisible(['0','0','4','6','missing'],rows,5),['0','4']);
 assert.deepEqual(selectedVisible(['0','4','6','10'],rows,10),['0','4','6']);
 assert.deepEqual(selectedVisible(['0'],[],5),[]);
});
test('Descriptions use a URL fragment and round-trip without becoming a server query',()=>{
 const text='My sink is leaking in Bedok. <script>& What now?';const result=jobUrl(text);
 assert.ok(result.startsWith('/roster/matches/#job='));const u=new URL(result,'http://localhost');
 assert.equal(u.search,'');assert.equal(new URLSearchParams(u.hash.slice(1)).get('job'),text);
 assert.equal(new URLSearchParams(jobUrl('x'.repeat(3000)).split('#')[1]).get('job').length,1200);
});
test('Real beta examples return sourced matches with unchanged prices and ratings',async()=>{
 const rows=decodeCatalogue(JSON.parse(await readFile(new URL('../data/index/all.json',import.meta.url),'utf8')));
 for(const query of ['My kitchen sink is leaking in Bedok.','I need aircon servicing in Tampines.','I need a cleaner for an end of tenancy clean in Woodlands.']){
  const {matches,intent}=matchJob(rows,query);assert.ok(matches.length>=5,query);
  for(const c of matches){const original=rows.find(row=>row.slug===c.slug);assert.equal(c.price,original.price);assert.deepEqual(c.average,original.average);assert.ok(c.coverage);assert.equal(c.category,intent.trade);}
 }
});

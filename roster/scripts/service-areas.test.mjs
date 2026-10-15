import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseServiceLocations,renderServiceAreas} from '../lib/service-areas.mjs';
import {planningAreas,coverageMatch,findArea} from '../assets/service-areas.mjs';
import {filterCatalogue} from '../assets/catalogue-filter.mjs';
import {rankCompanies,splitDirectory,coverageBadges} from '../assets/catalogue-card.mjs';
import {encodeCatalogue,decodeCatalogue} from '../assets/catalogue-data.mjs';
import {readFile} from 'node:fs/promises';
const entry=(name,overrides={})=>({name,kind:'stated',excerpt:'We serve this area.',source_url:'https://example.com/areas',capturedAt:'2026-10-12',...overrides});
const ctx={esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),icon:()=>'<svg></svg>'};

test('Coverage imports only supported, sourced, dated own-site statements and preserves evidence',()=>{
 const got=normaliseServiceLocations([entry('Woodlands'),entry('Woodlands'),entry('North'),entry('Islandwide')],'https://www.example.com');
 assert.equal(got.length,3);assert.equal(got[0].sourceUrl,'https://example.com/areas');assert.equal(got[0].excerpt,'We serve this area.');
 for(const patch of [{name:'Unknown town'},{kind:'office'},{excerpt:''},{capturedAt:''},{source_url:'https://unrelated.com/'},{source_url:'javascript:alert(1)'},{source_url:'https://user:pass@example.com'}])assert.equal(normaliseServiceLocations([entry('Woodlands',patch)],'https://example.com').length,0);
});
test('Official planning areas resolve normalized URL slugs and region matches',()=>{
 assert.equal(planningAreas.length,55);assert.equal(findArea('Woodlands').region,'North');assert.equal(findArea('ang-mo-kio').region,'North-East');assert.equal(findArea('Bukit Timah').region,'Central');assert.equal(findArea('Eunos'),undefined);
 assert.equal(coverageMatch(['North','Islandwide'],'woodlands').rank,1);
 assert.equal(coverageMatch(['Woodlands','North','Islandwide'],'woodlands').rank,0);
 assert.equal(coverageMatch(['East'],'woodlands'),null);
});
const rows=[
 {slug:'island',name:'A',serviceAreas:['Islandwide'],fullProfile:true,ratingValue:5,ratingCount:100,evidenceScore:9,published:true,category:'plumbing'},
 {slug:'town',name:'B',serviceAreas:['Woodlands'],fullProfile:false,ratingValue:4,ratingCount:1,published:true,category:'plumbing'},
 {slug:'region',name:'C',serviceAreas:['North'],fullProfile:true,ratingValue:4.5,ratingCount:5,category:'plumbing'},
 {slug:'unknown',name:'D',area:'Woodlands',serviceAreas:[],ratingValue:5,category:'plumbing'},
 {slug:'other',name:'E',serviceAreas:['Bedok'],category:'plumbing'},
 {slug:'cleaner',name:'F',serviceAreas:['Woodlands'],category:'cleaning',ratingValue:4.8}
];
test('Town, region and islandwide coverage rank ahead of unstated, even under a different sort',()=>{
 const result=filterCatalogue(rows,{area:'woodlands',category:'plumbing',includeUnstated:true});
 for(const sort of ['name','rating','reviews','evidence'])assert.deepEqual(rankCompanies(result.matches,sort).map(c=>c.slug),['town','region','island','unknown']);
 const groups=splitDirectory(result.matches,'rating');assert.equal(groups.shortlist.length,0);assert.deepEqual(groups.others.map(c=>c.slug),['town','region','island','unknown']);
});
test('Unknown coverage is opt-in and never inferred from an office address',()=>{
 const result=filterCatalogue(rows,{area:'woodlands',category:'plumbing'});
 assert.equal(result.unknownCount,1);assert.equal(result.matches.length,3);assert.equal(result.counts.price,2);
 const optional=filterCatalogue(rows,{area:'woodlands',category:'plumbing',includeUnstated:true});assert.equal(optional.matches.length,4);
 assert.equal(optional.matches.find(c=>c.slug==='unknown').areaMatch.kind,'unstated');
 assert.equal(filterCatalogue(rows).matches.length,6);
});
test('Coverage combines with rating, trade, saved and pricing filters before counts and pagination',()=>{
 const options={area:'woodlands',category:'plumbing',rating:'4.8',active:['price'],savedSlugs:['island','unknown']};
 const result=filterCatalogue(rows,options);assert.deepEqual(result.matches.map(c=>c.slug),['island']);assert.deepEqual(result.counts,{price:1,reviews:0,whatsapp:0,saved:1});assert.equal(result.unknownCount,0);
 assert.equal(filterCatalogue(rows,{area:'woodlands',query:'D'}).unknownCount,1);
});
test('Area badges identify exact matches and islandwide coverage without inventing claims',()=>{
 assert.match(coverageBadges({serviceAreas:['Islandwide'],areaMatch:{label:'Serves Woodlands'}}),/Serves Woodlands/);
 assert.match(coverageBadges({serviceAreas:['Islandwide']}),/Islandwide/);
 assert.equal(coverageBadges({area:'Woodlands'}),'');
});
test('No coverage hides the section; coverage displays without source and capture-date rows',()=>{
 assert.equal(renderServiceAreas([],ctx),'');
 const island=renderServiceAreas(normaliseServiceLocations([entry('Islandwide'),entry('North')],'https://example.com'),ctx);
 assert.match(island,/Serves all of Singapore/);assert.match(island,/North region/);assert.doesNotMatch(island,/area-sources|Source:|captured|company website/);
 const region=renderServiceAreas(normaliseServiceLocations([entry('East')],'https://example.com'),ctx);assert.match(region,/East region/);assert.doesNotMatch(region,/Serves all of Singapore/);
});
test('Long town lists group by region and disclose towns beyond the first twelve',()=>{
 const entries=normaliseServiceLocations(planningAreas.slice(0,18).map(a=>entry(a.name)),'https://example.com');
 const html=renderServiceAreas(entries,ctx);assert.match(html,/Show 6 more areas/);assert.match(html,/class="area-region"/);
 const [before,after]=html.split('<details class="area-more">');assert.equal((before.match(/<li>/g)||[]).length,12);assert.equal((after.match(/<li>/g)||[]).length,6);
 for(const item of entries)assert.ok(html.includes(item.name));
});
test('Area dictionary round-trip is lossless and rejects invalid references',()=>{
 const data=encodeCatalogue(rows);assert.equal(data.format,'roster-columns-v2');assert.deepEqual(decodeCatalogue(JSON.parse(JSON.stringify(data))),rows);
 const field=String(data.fields.indexOf('serviceAreas'));data.companies[0][field]=[999];assert.throws(()=>decodeCatalogue(data),/Invalid service-area reference/);
});
test('Release evidence remains intact for all published service locations',async()=>{
 const companies=JSON.parse(await readFile(new URL('../data/companies.json',import.meta.url),'utf8')).companies;
 const withCoverage=companies.filter(c=>c.enrichment.serviceLocations?.length);assert.ok(withCoverage.length>0);
 const classic=companies.find(c=>c.slug==='338-aircon');assert.ok(classic.enrichment.serviceLocations.some(a=>a.name==='Woodlands'));assert.ok(classic.enrichment.serviceLocations.some(a=>a.name==='Islandwide'));
 for(const c of withCoverage)for(const loc of c.enrichment.serviceLocations){assert.ok(loc.excerpt&&loc.sourceUrl&&loc.capturedAt);}
});

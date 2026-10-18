import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {selectAreaPages,townCoverage,nearbyMap,nearbyTowns,serviceCounts,AREA_PAGE_MINIMUM} from '../lib/area-pages.mjs';
import {planningAreas} from '../assets/service-areas.mjs';

const company=(slug,names,category='plumbing')=>({slug,name:slug,category,enrichment:{serviceLocations:names.map(name=>({name}))}});
const trades=[{id:'plumbing',slug:'plumbing'}];

test('A town page needs five companies naming the town; islandwide and regions never count',()=>{
 const rows=[...Array(4)].map((_,i)=>company(`t${i}`,['Bedok'])).concat([company('island',['Islandwide']),company('east',['East']),company('both',['Islandwide','East'])]);
 assert.equal(selectAreaPages(rows,trades).pages.length,0);
 const five=rows.concat(company('t4',['Bedok','Islandwide']));
 const {pages}=selectAreaPages(five,trades);
 assert.deepEqual(pages.map(p=>[p.slug,p.count,p.path]),[['plumbing/bedok',5,'/plumbing/bedok/']]);
 assert.equal(AREA_PAGE_MINIMUM,5);
});

test('Only the primary trade counts, and region names are not towns',()=>{
 const rows=[...Array(5)].map((_,i)=>company(`a${i}`,['Bedok','North'],'aircon'));
 assert.equal(selectAreaPages(rows,trades).pages.length,0);
 assert.deepEqual(selectAreaPages(rows,[{id:'aircon',slug:'aircon-servicing'}]).pages.map(p=>p.slug),['aircon-servicing/bedok']);
});

test('A town slug that collides with an existing page is skipped and reported',()=>{
 const rows=[...Array(5)].map((_,i)=>company(`t${i}`,['Bedok','Tampines']));
 const {pages,collisions}=selectAreaPages(rows,trades,new Set(['plumbing/bedok']));
 assert.deepEqual(pages.map(p=>p.town),['Tampines']);
 assert.deepEqual(collisions,[{trade:'plumbing',town:'Bedok',slug:'plumbing/bedok'}]);
});

test('Coverage buckets: town first, then region, then islandwide',()=>{
 const rows=[company('town',['Bedok']),company('region',['East']),company('island',['Islandwide']),company('none',[]),company('other',['Bedok'],'aircon')];
 const got=townCoverage(rows,'plumbing','Bedok');
 assert.deepEqual([got.town,got.region,got.islandwide].map(l=>l.map(c=>c.slug)),[['town'],['region'],['island']]);
});

test('Nearby towns are real planning areas, symmetric, and cover every built town',async()=>{
 const names=new Set(planningAreas.map(a=>a.name));
 for(const [town,list] of nearbyMap){assert.ok(names.has(town),town);for(const n of list){assert.ok(names.has(n),n);assert.ok(nearbyTowns(n).includes(town),`${n} -> ${town}`);assert.notEqual(n,town);}}
 const launch=JSON.parse(await readFile(new URL('../../../../dist/data/seo-launch-pages.json',import.meta.url),'utf8'));
 for(const p of launch.pages.filter(p=>p.kind==='area'))assert.ok(nearbyTowns(p.town).length>=2,`No nearby towns for ${p.town}`);
});

test('Nearby map leaves out towns that do not share a boundary',()=>{
 for(const [a,b] of [['Woodlands','Yishun'],['Hougang','Tampines'],['Bukit Batok','Jurong West'],['Paya Lebar','Serangoon']])assert.ok(!nearbyTowns(a).includes(b),`${a} / ${b}`);
});

test('Nearby towns come from the official boundaries: real neighbours only',async()=>{
 const adj=JSON.parse(await readFile(new URL('../data/planning-area-adjacency.json',import.meta.url),'utf8'));
 assert.match(adj.source,/data\.gov\.sg/);assert.match(adj.licence,/Open Data Licence/);
 const names=new Set(planningAreas.map(a=>a.name));
 for(const [a,b,m] of adj.pairs){assert.ok(names.has(a)&&names.has(b),`${a} / ${b}`);assert.ok(m>=200);}
 for(const [a,b] of [['Bedok','Changi'],['Hougang','Punggol'],['Boon Lay','Tuas'],['Bishan','Novena']])assert.ok(!nearbyTowns(a).includes(b),`${a} / ${b}`);
 for(const [a,b] of [['Bedok','Tampines'],['Woodlands','Sembawang'],['Toa Payoh','Bishan'],['Jurong West','Boon Lay']])assert.ok(nearbyTowns(a).includes(b),`${a} / ${b}`);
 assert.ok(!nearbyTowns('Bishan').includes('Central Water Catchment'),'catchments are not towns');
});

test('Service counts merge case and count each company once',()=>{
 const rows=[{enrichment:{supportedServices:[{name:'Leak repair'},{name:'leak repair'}]}},{enrichment:{supportedServices:[{name:'Leak Repair'},{name:'Sink'}]}}];
 assert.deepEqual(serviceCounts(rows),[['Leak repair',2],['Sink',1]]);
});

test('Directory script keeps the canonical on the hub and sets noindex, follow for ?area= (QA 18 Oct 2026)',async()=>{
 const js=await readFile(new URL('../../../../public/assets/catalogue.js',import.meta.url),'utf8');
 assert.match(js,/\[data-area-pages\]/);assert.match(js,/canonical\.href=hubCanonical;/);assert.match(js,/'noindex, follow'/);
 const hub=await readFile(new URL('../../../../dist/plumbing/index.html',import.meta.url),'utf8');
 assert.match(hub,/data-area-pages="\{[^"]*&quot;bedok&quot;:&quot;\/plumbing\/bedok\/&quot;/);
 assert.match(hub,/<link rel="canonical" href="[^"]+\/plumbing\/">/);
});

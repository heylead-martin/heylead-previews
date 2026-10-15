import {planningAreas,areaSlug} from '../assets/service-areas.mjs';
import adjacency from '../data/planning-area-adjacency.json' with {type:'json'};

// Static trade x town pages (/roster/<trade>/<town>/).
// Rule: a town is a URA Master Plan 2019 planning area. A page is built when at least
// AREA_PAGE_MINIMUM published companies whose primary trade is that trade name the town
// itself in their sourced service locations. "Islandwide" and region names (North, East...)
// never count toward a town; those companies appear only under "Wider coverage".
export const AREA_PAGE_MINIMUM = 5;
// Mostly non-residential planning areas get no static page, whatever the count; the
// ?area= filter still covers them and nearby links point there.
export const NON_RESIDENTIAL = new Set(['Lim Chu Kang','Tuas','Sungei Kadut','Pioneer','Seletar','Mandai','Changi']);
// check-site: two area pages of one trade may share at most this share of their 5-word phrases.
export const AREA_MAX_SIMILARITY = 0.75;
// ...and each must have at least this many 5-word phrases the other page lacks.
export const AREA_MIN_DISTINCT = 80;

const townNames = new Set(planningAreas.map(a=>a.name));
export const townRegion = town => planningAreas.find(a=>a.name===town)?.region || '';
const stated = c => new Set((c.enrichment?.serviceLocations||[]).map(l=>l.name));

export function townCoverage(companies, tradeId, town) {
  const region=townRegion(town), rows=companies.filter(c=>c.category===tradeId);
  const local=[],wider=[],islandwide=[];
  for(const c of rows){const names=stated(c);if(names.has(town))local.push(c);else if(region&&names.has(region))wider.push(c);else if(names.has('Islandwide'))islandwide.push(c);}
  return {town:local.sort((a,b)=>a.name.localeCompare(b.name)),region:wider,islandwide};
}

// reserved: Set of existing page slugs ("plumbing/tap-replacement"). A town slug that would
// land on one is skipped and reported, never overwritten.
export function selectAreaPages(companies, trades, reserved = new Set()) {
  const pages=[],collisions=[];
  for(const trade of trades){
    const counts=new Map();
    for(const c of companies.filter(c=>c.category===trade.id))for(const name of stated(c))if(townNames.has(name))counts.set(name,(counts.get(name)||0)+1);
    for(const [town,count] of [...counts].sort((a,b)=>a[0].localeCompare(b[0]))){
      if(count<AREA_PAGE_MINIMUM||NON_RESIDENTIAL.has(town))continue;
      const slug=`${trade.slug}/${areaSlug(town)}`;
      if(reserved.has(slug)){collisions.push({trade:trade.id,town,slug});continue;}
      pages.push({trade:trade.id,town,slug,path:`/roster/${slug}/`,count});
    }
  }
  return {pages,collisions};
}

// Nearby towns: planning areas that share at least 200 m of boundary on the URA Master Plan 2019
// map, computed from the official boundaries by scripts/build-adjacency.py (data.gov.sg, Singapore
// Open Data Licence). Catchments, offshore islands and reclaimed land with no homes are not shown.
export const NOT_A_TOWN = new Set(['Central Water Catchment','Western Water Catchment','Southern Islands','Western Islands','North-Eastern Islands','Changi Bay','Straits View','Marina East','Marina South','Simpang']);
export const nearbyMap = (()=>{
  const map=new Map();
  for(const [a,b] of adjacency.pairs)for(const [x,y] of [[a,b],[b,a]]){if(NOT_A_TOWN.has(x)||NOT_A_TOWN.has(y))continue;if(!map.has(x))map.set(x,new Set());map.get(x).add(y);}
  return new Map([...map].map(([k,v])=>[k,[...v].sort()]));
})();
export const nearbyTowns = town => nearbyMap.get(town) || [];

// Readable names for the release's service names in area intros. Keys are the lower-cased
// release names; the release itself is not changed. check-site fails on an intro service
// without an entry, so new odd names get a label before they reach a page.
export const serviceLabels = {
  'chemical overhaul':'chemical overhaul','chemical wash':'chemical wash','gas top up':'gas top-up','general service':'general servicing','installation':'aircon installation','repair':'aircon repair',
  'carpet':'carpet cleaning','curtain':'curtain cleaning','deep cleaning':'deep cleaning','disinfection':'disinfection','mattress':'mattress cleaning','upholstery sofa':'sofa and upholstery cleaning',
  'ceiling fan':'ceiling fan installation','db box':'DB box work','light installation':'light installation','power point':'power points','power trip':'power trip repair','rewiring':'rewiring','water heater point':'water heater points',
  'door lock':'door locks','drilling mounting':'drilling and mounting','electrical':'electrical jobs','furniture assembly':'furniture assembly','painting':'painting',
  'choke clearing':'choke clearing','floor trap':'floor traps','leak repair':'leak repair','pipe replacement':'pipe replacement','sink':'sinks','tap mixer':'taps and mixers','toilet bowl':'toilet bowls','water heater':'water heaters'
};
export const serviceLabel = name => serviceLabels[String(name).toLowerCase()];

// Services the companies name on their own sites, most common first.
export function serviceCounts(companies) {
  const counts=new Map();
  for(const c of companies){const names=new Set((c.enrichment?.supportedServices||[]).map(s=>String(s?.name||'').trim()).filter(Boolean).map(n=>n.charAt(0).toUpperCase()+n.slice(1).toLowerCase()));for(const n of names)counts.set(n,(counts.get(n)||0)+1);}
  return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
}

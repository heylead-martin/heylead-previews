import {planningAreas,areaSlug} from '../assets/service-areas.mjs';

// Static trade x town pages (/roster/<trade>/<town>/).
// Rule: a town is a URA Master Plan 2019 planning area. A page is built when at least
// AREA_PAGE_MINIMUM published companies whose primary trade is that trade name the town
// itself in their sourced service locations. "Islandwide" and region names (North, East...)
// never count toward a town; those companies appear only under "Wider coverage".
export const AREA_PAGE_MINIMUM = 5;
// check-site: two area pages of one trade may share at most this share of their 5-word phrases.
export const AREA_MAX_SIMILARITY = 0.85;
// ...and each must have at least this many 5-word phrases the other page lacks.
export const AREA_MIN_DISTINCT = 40;

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
      if(count<AREA_PAGE_MINIMUM)continue;
      const slug=`${trade.slug}/${areaSlug(town)}`;
      if(reserved.has(slug)){collisions.push({trade:trade.id,town,slug});continue;}
      pages.push({trade:trade.id,town,slug,path:`/roster/${slug}/`,count});
    }
  }
  return {pages,collisions};
}

// Nearby towns: planning areas that share a boundary (or face each other across a narrow
// river or reservoir) on the URA Master Plan 2019 map. Edges are listed once and used both ways.
const edges = [
  ['Ang Mo Kio','Bishan'],['Ang Mo Kio','Serangoon'],['Ang Mo Kio','Hougang'],['Ang Mo Kio','Sengkang'],['Ang Mo Kio','Yishun'],['Ang Mo Kio','Seletar'],
  ['Bedok','Tampines'],['Bedok','Paya Lebar'],['Bedok','Marine Parade'],['Bedok','Changi'],['Bedok','Geylang'],
  ['Bishan','Toa Payoh'],['Bishan','Serangoon'],['Bishan','Novena'],
  ['Boon Lay','Jurong West'],['Boon Lay','Pioneer'],
  ['Bukit Batok','Bukit Panjang'],['Bukit Batok','Choa Chu Kang'],['Bukit Batok','Jurong East'],['Bukit Batok','Jurong West'],['Bukit Batok','Clementi'],['Bukit Batok','Bukit Timah'],['Bukit Batok','Tengah'],
  ['Bukit Merah','Queenstown'],['Bukit Merah','Outram'],['Bukit Merah','Tanglin'],['Bukit Merah','River Valley'],
  ['Bukit Panjang','Choa Chu Kang'],['Bukit Panjang','Bukit Timah'],['Bukit Panjang','Sungei Kadut'],
  ['Bukit Timah','Clementi'],['Bukit Timah','Queenstown'],['Bukit Timah','Tanglin'],['Bukit Timah','Novena'],
  ['Changi','Tampines'],['Changi','Pasir Ris'],
  ['Choa Chu Kang','Tengah'],['Choa Chu Kang','Sungei Kadut'],['Choa Chu Kang','Lim Chu Kang'],
  ['Clementi','Jurong East'],['Clementi','Queenstown'],
  ['Downtown Core','Rochor'],['Downtown Core','Museum'],['Downtown Core','Singapore River'],['Downtown Core','Outram'],['Downtown Core','Kallang'],
  ['Geylang','Kallang'],['Geylang','Paya Lebar'],['Geylang','Marine Parade'],['Geylang','Toa Payoh'],
  ['Hougang','Serangoon'],['Hougang','Sengkang'],['Hougang','Punggol'],['Hougang','Paya Lebar'],['Hougang','Pasir Ris'],['Hougang','Tampines'],
  ['Jurong East','Jurong West'],
  ['Jurong West','Tengah'],['Jurong West','Pioneer'],
  ['Kallang','Toa Payoh'],['Kallang','Novena'],['Kallang','Rochor'],['Kallang','Marine Parade'],
  ['Lim Chu Kang','Sungei Kadut'],['Lim Chu Kang','Tengah'],
  ['Mandai','Woodlands'],['Mandai','Yishun'],['Mandai','Sungei Kadut'],
  ['Newton','Novena'],['Newton','Orchard'],['Newton','Tanglin'],['Newton','Rochor'],['Newton','Museum'],
  ['Novena','Toa Payoh'],['Novena','Tanglin'],['Novena','Rochor'],
  ['Orchard','Tanglin'],['Orchard','River Valley'],['Orchard','Museum'],
  ['Outram','Singapore River'],['Outram','River Valley'],
  ['Pasir Ris','Tampines'],['Pasir Ris','Punggol'],
  ['Paya Lebar','Tampines'],['Paya Lebar','Serangoon'],
  ['Pioneer','Tuas'],['Boon Lay','Tuas'],
  ['Punggol','Sengkang'],['Punggol','Seletar'],
  ['Queenstown','Tanglin'],
  ['Seletar','Sengkang'],['Seletar','Yishun'],
  ['Sembawang','Yishun'],['Sembawang','Woodlands'],['Sembawang','Simpang'],
  ['Sengkang','Serangoon'],
  ['Serangoon','Toa Payoh'],
  ['Sungei Kadut','Woodlands'],
  ['Woodlands','Yishun']
];
export const nearbyMap = (()=>{
  const map=new Map();
  for(const [a,b] of edges){for(const [x,y] of [[a,b],[b,a]]){if(!map.has(x))map.set(x,new Set());map.get(x).add(y);}}
  return new Map([...map].map(([k,v])=>[k,[...v].sort()]));
})();
export const nearbyTowns = town => nearbyMap.get(town) || [];

// Services the companies name on their own sites, most common first.
export function serviceCounts(companies) {
  const counts=new Map();
  for(const c of companies){const names=new Set((c.enrichment?.supportedServices||[]).map(s=>String(s?.name||'').trim()).filter(Boolean).map(n=>n.charAt(0).toUpperCase()+n.slice(1).toLowerCase()));for(const n of names)counts.set(n,(counts.get(n)||0)+1);}
  return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
}

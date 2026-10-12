import {coverageMatch,findArea} from './service-areas.mjs';
export function filterCatalogue(rows, {query='', area='', category='', rating='', active=[], savedSlugs=[],includeUnstated=false}={}) {
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const saved=new Set(savedSlugs),selected=findArea(area);
  const facets={price:c=>Boolean(c.published),reviews:c=>Boolean(c.hasReviews),whatsapp:c=>Boolean(c.whatsapp),saved:c=>saved.has(c.slug)};
  const base=rows.filter(c=>
    words.every(word=>[c.name,c.trade,c.area,c.description,...(c.services||[]),...(c.offerings||[])].join(' ').toLowerCase().includes(word))&&
    (!category||c.category===category)&&(!rating||(c.ratingValue!=null&&c.ratingValue>=Number(rating)))&&
    active.every(key=>!facets[key]||facets[key](c))
  );
  const unknownCount=selected?base.filter(c=>!c.serviceAreas?.length).length:0;
  const matches=selected?base.flatMap(c=>{
    const areaMatch=coverageMatch(c.serviceAreas,selected.slug);
    return areaMatch&&(areaMatch.kind!=='unstated'||includeUnstated)?[{...c,areaMatch}]:[];
  }):base;
  const counts=Object.fromEntries(Object.entries(facets).map(([key,predicate])=>[key,matches.filter(predicate).length]));
  return {matches,counts,unknownCount};
}

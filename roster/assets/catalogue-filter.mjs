import {coverageMatch,findArea} from './service-areas.mjs';
// Trade words in a query ("cleaning", "plumber", "aircon") match a company's primary trade, its name,
// or a service that starts with the word ("Plumbing repairs"), not words inside other service text:
// an aircon firm listing "condenser cleaning" or "chemical wash" is not a cleaning company. Primary-trade
// matches rank first. Only the first trade word is read this way; others match text as usual.
const tradeWords=[[/^(?:clean|cleaner|cleaners|cleaning|housekeeping|maid|maids)$/,'cleaning'],[/^(?:aircon|air-?con|aircond|ac)$/,'aircon'],[/^(?:plumb|plumber|plumbers|plumbing)$/,'plumbing'],[/^(?:electric|electrical|electrician|electricians)$/,'electrician'],[/^(?:handyman|handymen)$/,'handyman']];
export const queryTrade=word=>tradeWords.find(([re])=>re.test(word))?.[1]||null;
export function filterCatalogue(rows, {query='', area='', category='', rating='', active=[], savedSlugs=[],includeUnstated=false}={}) {
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const tradeIndex=words.findIndex(queryTrade),trade=tradeIndex<0?null:queryTrade(words[tradeIndex]);
  const saved=new Set(savedSlugs),selected=findArea(area);
  const facets={price:c=>Boolean(c.published),reviews:c=>Boolean(c.hasReviews),whatsapp:c=>Boolean(c.whatsapp),saved:c=>saved.has(c.slug)};
  const text=c=>[c.name,c.trade,c.area,c.description,...(c.services||[]),...(c.offerings||[])].join(' ').toLowerCase();
  const base=rows.filter(c=>
    words.every((word,i)=>i===tradeIndex?c.category===trade||c.name.toLowerCase().includes(word)||[...(c.services||[]),...(c.offerings||[])].some(s=>String(s).toLowerCase().startsWith(word)):text(c).includes(word))&&
    (!category||c.category===category)&&(!rating||(c.ratingValue!=null&&c.ratingValue>=Number(rating)))&&
    active.every(key=>!facets[key]||facets[key](c))
  ).map(c=>trade?{...c,queryRank:c.category===trade?0:1}:c);
  const unknownCount=selected?base.filter(c=>!c.serviceAreas?.length).length:0;
  const matches=selected?base.flatMap(c=>{
    const areaMatch=coverageMatch(c.serviceAreas,selected.slug);
    return areaMatch&&(areaMatch.kind!=='unstated'||includeUnstated)?[{...c,areaMatch}]:[];
  }):base;
  const counts=Object.fromEntries(Object.entries(facets).map(([key,predicate])=>[key,matches.filter(predicate).length]));
  return {matches,counts,unknownCount};
}

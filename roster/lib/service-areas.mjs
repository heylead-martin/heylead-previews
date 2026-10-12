import {regions,planningAreas,locationNames} from '../assets/service-areas.mjs';
const tidy=value=>typeof value==='string'?value.replace(/[\u2013\u2014]/g,'-').replace(/\s+/g,' ').trim():'';
export function normaliseServiceLocations(entries, website) {
  let owned;
  try{owned=new URL(website).hostname.replace(/^www\./,'');}catch{return [];}
  const seen=new Set();
  return (Array.isArray(entries)?entries:[]).flatMap(entry=>{
    const name=tidy(entry?.name),kind=entry?.kind,excerpt=tidy(entry?.excerpt),capturedAt=tidy(entry?.capturedAt);
    let url;try{url=new URL(entry?.source_url||entry?.sourceUrl);}catch{return [];}
    const host=url.hostname.replace(/^www\./,'');
    if(!locationNames.has(name)||!['stated','area-page'].includes(kind)||!excerpt||!/^\d{4}-\d{2}-\d{2}$/.test(capturedAt)||!Number.isFinite(Date.parse(capturedAt))||!['http:','https:'].includes(url.protocol)||url.username||url.password||!(host===owned||host.endsWith('.'+owned)))return [];
    const key=[name,url.href,capturedAt].join('|');if(seen.has(key))return [];seen.add(key);
    return [{name,kind,excerpt,sourceUrl:url.href,capturedAt}];
  });
}
export function renderServiceAreas(entries, {esc,icon}) {
  if(!entries?.length)return '';
  const names=new Set(entries.map(e=>e.name)),towns=planningAreas.filter(a=>names.has(a.name)).sort((a,b)=>a.name.localeCompare(b.name));
  const chips=values=>`<ul class="area-chips">${values.map(name=>`<li>${esc(name)}</li>`).join('')}</ul>`;
  const grouped=values=>towns.length>8?Object.keys(regions).map(region=>{const subset=values.filter(a=>a.region===region);return subset.length?`<div class="area-region"><h3>${region}</h3>${chips(subset.map(a=>a.name))}</div>`:'';}).join(''):chips(values.map(a=>a.name));
  const sorted=towns.length>8?Object.keys(regions).flatMap(r=>towns.filter(a=>a.region===r)):towns;
  return `<div class="service-area-card">${names.has('Islandwide')?`<p class="islandwide-badge">${icon('pin')}Serves all of Singapore</p>`:''}${chips(Object.keys(regions).filter(r=>names.has(r)).map(r=>r+' region'))}${towns.length?`<div class="area-groups">${grouped(sorted.slice(0,12))}</div>${towns.length>12?`<details class="area-more"><summary><span class="area-show">Show all ${towns.length} areas</span><span class="area-hide">Show fewer areas</span>${icon('chevron')}</summary><div class="area-groups">${grouped(sorted.slice(12))}</div></details>`:''}`:''}</div>`;
}
export function renderAreaFilter() {
 return `<div class="area-picker" data-area-picker><label class="filter-select" for="service-area">Area</label><div class="area-input-wrap"><input id="service-area" data-area type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="area-options" aria-describedby="area-help" autocomplete="off" placeholder="Any area" disabled><button type="button" data-area-clear aria-label="Clear area" hidden>×</button></div><p class="area-help" id="area-help">Where you need the service</p><div class="area-options" id="area-options" role="listbox" aria-label="Areas by region" hidden></div></div>`;
}

import {planningAreas,coverageMatch,findArea,regions,areaSlug} from './service-areas.mjs';

export const serviceTypes = [
  {id:'aircon',name:'Aircon',pattern:/\b(?:air\s?con|air\s?conditioning|air conditioner|ac unit)\b/},
  {id:'plumbing',name:'Plumbing',pattern:/\b(?:plumb\w*|toilet|sink|tap|faucet|drain|pipe|water heater|water leak|leaking water)\b/},
  {id:'electrician',name:'Electrical',pattern:/\b(?:electric\w*|power trip|power point|socket|rewiring|circuit|ceiling fan|lights?|lighting)\b/},
  {id:'handyman',name:'Handyman',pattern:/\b(?:handyman|carpentry|painting|mount\w*|furniture|door|curtain rail|shelves|shelf)\b/},
  {id:'cleaning',name:'Cleaning',pattern:/\b(?:clean\w*|cleaner|maid|housekeeping|mattress|sofa|carpet|upholstery)\b/}
];
// These are transparent beta keyword rules, not an AI model or availability check.
export const jobTypes = [
  {id:'aircon-chemical',trade:'aircon',label:'Chemical cleaning',pattern:/\bchemical\s+(?:wash|clean\w*|overhaul)\b/,offer:/chemical/},
  {id:'aircon-gas',trade:'aircon',label:'Aircon gas top-up',pattern:/\b(?:gas top\s?up|refrigerant)\b/,offer:/refrigerant|gas/},
  {id:'aircon-repair',trade:'aircon',label:'Aircon repair',pattern:/\b(?:air\s?con|air conditioner)\b.{0,30}\b(?:leak\w*|repair|not cold|not cooling)\b/,offer:/repair|troubleshooting/},
  {id:'drain',trade:'plumbing',label:'Drain clearing',pattern:/\b(?:chok\w*|clogg\w*|blocked|blockage)\b|\bdrain\s+(?:clear\w*|unblock\w*)\b/,offer:/drain clearing|choke|jetting/},
  {id:'leak',trade:'plumbing',label:'Leak repairs',pattern:/\b(?:leak\w*|dripping)\b/,offer:/leak|pipe repair/},
  {id:'toilet',trade:'plumbing',label:'Toilet plumbing',pattern:/\b(?:toilet|cistern|flush)\b/,offer:/toilet|wc |cistern/},
  {id:'heater',trade:'plumbing',label:'Water heater services',pattern:/\bwater heater\b/,offer:/water heater/},
  {id:'tap',trade:'plumbing',label:'Tap & mixer services',pattern:/\b(?:tap|faucet|mixer)\b/,offer:/tap|mixer/},
  {id:'sink',trade:'plumbing',label:'Sink plumbing',pattern:/\bsink\b/,offer:/sink/},
  {id:'trip',trade:'electrician',label:'Power trip repair',pattern:/\b(?:power trip|power keeps tripping|circuit breaker|power cut)\b/,offer:/power trip|distribution board|db box|troubleshooting/},
  {id:'light',trade:'electrician',label:'Lighting',pattern:/\b(?:light|lights|lighting)\b/,offer:/light/},
  {id:'socket',trade:'electrician',label:'Power points',pattern:/\b(?:socket|power point|electrical outlet)\b/,offer:/power point|socket/},
  {id:'fan',trade:'electrician',label:'Ceiling fans',pattern:/\bceiling fan\b/,offer:/fan/},
  {id:'furniture',trade:'handyman',label:'Furniture assembly',pattern:/\b(?:furniture|flat\s?pack|assemble|assembly)\b/,offer:/furniture assembly|carpentry/},
  {id:'mount',trade:'handyman',label:'Wall mounting',pattern:/\b(?:mount\w*|tv bracket|shelves|shelf)\b/,offer:/mount|bracket|drilling/},
  {id:'door',trade:'handyman',label:'Door & lock services',pattern:/\b(?:door|lock)\b/,offer:/door|lock|carpentry/},
  {id:'painting',trade:'handyman',label:'Painting',pattern:/\bpaint\w*\b/,offer:/painting/},
  {id:'move-clean',trade:'cleaning',label:'Move-in or move-out cleaning',pattern:/\b(?:mov(?:e|ing)\s?(?:in|out)|end of tenancy)\b/,offer:/move.in|move.out|move in out/},
  {id:'renovation-clean',trade:'cleaning',label:'Post-renovation cleaning',pattern:/\b(?:post renovation|after (?:a )?renovation)\b/,offer:/post.renovation/},
  {id:'sofa-clean',trade:'cleaning',label:'Sofa & upholstery cleaning',pattern:/\b(?:sofa|upholstery)\b/,offer:/sofa|upholstery/},
  {id:'mattress-clean',trade:'cleaning',label:'Mattress cleaning',pattern:/\bmattress\b/,offer:/mattress/},
  {id:'carpet-clean',trade:'cleaning',label:'Carpet cleaning',pattern:/\bcarpet\b/,offer:/carpet/},
  {id:'regular-clean',trade:'cleaning',label:'Regular home cleaning',pattern:/\b(?:weekly|fortnightly|regular)\b/,offer:/regular|weekly|home cleaning/},
  {id:'deep-clean',trade:'cleaning',label:'Deep cleaning',pattern:/\b(?:deep clean\w*|spring clean\w*)\b/,offer:/deep clean|spring clean/}
];
const normalize = text => String(text||'').slice(0,1200).toLowerCase().replace(/[\u2013\u2014-]/g,' ').replace(/\s+/g,' ').trim();
const positiveText = text => text.replace(/\b(?:don't need|do not need|not looking for|no need for|not in)\b[^,.!?;]*(?=[,.!?;]|$)/g,'');
export function interpretJob(text,{trade:override='',area:areaOverride='auto'}={}) {
  const query=normalize(text),positive=positiveText(query);
  const jobs=jobTypes.filter(j=>j.pattern.test(positive));
  let trades=serviceTypes.filter(t=>t.pattern.test(positive)).map(t=>t.id);
  if(trades.includes('aircon')) {
    // Cleaning and water leaks describe aircon work unless another fixture is named.
    if(!/\b(?:home|house|flat|sofa|carpet|mattress|tenancy|renovation)\b/.test(positive))trades=trades.filter(t=>t!=='cleaning');
    if(!/\b(?:pipe|sink|toilet|tap|water heater|plumb\w*)\b/.test(positive))trades=trades.filter(t=>t!=='plumbing');
  }
  if(!trades.length)trades=[...new Set(jobs.map(j=>j.trade))];
  const validOverride=serviceTypes.some(t=>t.id===override)?override:'';
  const trade=validOverride||(trades.length===1?trades[0]:'');
  const areas=planningAreas.filter(a=>new RegExp(`\\b${a.name.toLowerCase().replace(/-/g,' ')}\\b`).test(positive));
  const region=Object.keys(regions).find(name=>areaOverride===`region:${areaSlug(name)}`);
  // A named town within the selected region remains the more precise job location.
  const conflict=!!region&&areas.some(a=>a.region!==region);
  const area=region?(areas.length===1&&!conflict?areas[0]:{name:`${region} region`,region,slug:areaOverride,kind:'region'}):areaOverride==='auto'?(areas.length===1?areas[0]:null):findArea(areaOverride);
  return {trade,tradeName:serviceTypes.find(t=>t.id===trade)?.name||'',jobs:jobs.filter(j=>j.trade===trade),area,
    needsTrade:!trade,needsArea:conflict||((areaOverride==='auto'||!!region)&&areas.length>1),areaConflict:conflict,detectedTrades:trades,detectedAreas:areas,
    preferences:{timing:/\b(?:today|tonight|tomorrow|urgent|asap|weekend|emergency)\b/.test(query),budget:/\$|\b(?:budget|under \d|less than \d|cheap|affordable)\b/.test(query)}};
}
export function matchJob(rows,text,options={}) {
  const intent=interpretJob(text,options);
  if(intent.needsTrade||intent.needsArea)return {intent,matches:[]};
  const matches=rows.flatMap(c=>{
    if(c.category!==intent.trade)return [];
    const offerings=(c.offerings||[]).join(' ').toLowerCase();
    if(intent.jobs.some(job=>!job.offer.test(offerings)))return [];
    const coverage=intent.area?.kind==='region'
      ? c.serviceAreas?.includes(intent.area.region)?{rank:1,kind:'region',label:`Serves the ${intent.area.region} region`}
        :c.serviceAreas?.includes('Islandwide')?{rank:2,kind:'islandwide',label:'Islandwide'}:null
      :intent.area?coverageMatch(c.serviceAreas,intent.area.slug):null;
    if(intent.area&&(!coverage||coverage.kind==='unstated'))return [];
    const reasons=[intent.jobs.length?`Lists ${intent.jobs.map(j=>j.label.toLowerCase()).join(' and ')}`:`Listed under ${intent.tradeName.toLowerCase()}`];
    if(coverage)reasons.push(coverage.label==='Islandwide'?'States islandwide coverage':coverage.label);
    else if(c.serviceAreas?.includes('Islandwide'))reasons.push('States islandwide coverage');
    if(c.published)reasons.push('Has published service prices');
    return [{...c,coverage,reasons}];
  }).sort((a,b)=>(a.coverage?.rank??0)-(b.coverage?.rank??0)||(b.evidenceScore||0)-(a.evidenceScore||0)||(b.ratingValue??-1)-(a.ratingValue??-1)||(b.ratingCount||0)-(a.ratingCount||0)||a.name.localeCompare(b.name));
  return {intent,matches};
}
export function selectedVisible(slugs,rows,limit=5) {
  const allowed=new Set(rows.slice(0,limit).map(c=>c.slug));
  return [...new Set(slugs)].filter(slug=>allowed.has(slug));
}
export const jobUrl=text=>'/matches/#'+new URLSearchParams({job:String(text).trim().slice(0,1200)}).toString();

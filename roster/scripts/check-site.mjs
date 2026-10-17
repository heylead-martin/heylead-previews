import { readFile, stat, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {decodeCatalogue} from '../assets/catalogue-data.mjs';
import {serviceCounts,serviceLabel,selectAreaPages,townCoverage,nearbyTowns,AREA_PAGE_MINIMUM,AREA_MAX_SIMILARITY,AREA_MIN_DISTINCT,NON_RESIDENTIAL} from '../lib/area-pages.mjs';
import {areaSlug} from '../assets/service-areas.mjs';
import {airconMatrix,unitColumns,sizeColumns,unitRowProblem} from '../lib/aircon-matrix.mjs';
import {profileRowProblem,guideEvidence, sourcedRates, rateProblem, isFromPrice, minimumCompanies, maxLabelLength} from '../lib/sourced-rates.mjs';
import {displayNames,derivedFrom,makesClaim} from '../lib/display-name.mjs';
import {BEST_OF,rankBestOf,bestOfScore} from '../lib/best-of.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const load=async f=>JSON.parse(await readFile(path.join(root,f),'utf8'));
const data=await load('data/companies.json'),manifest=await load('data/build-manifest.json'),report=await load('data/import-report.json');
// Pages use display names (lib/display-name.mjs), so alphabetical lists sort on those, as in the build.
{const names=displayNames(data.companies);for(const c of data.companies){c.sourceName=c.name;c.name=names.get(c.slug);}}
const pins=await load('data/map-pins.json');
const presentation=await load('data/presentation.json');
for(const c of data.companies) {
 const logo=presentation[c.slug]?.logoAsset;
 if(!logo)continue;
 const image=await readFile(path.join(root,logo.src.replace(/^\/roster\//,'')));
 assert.equal(createHash('sha256').update(image).digest('hex'),logo.sha256,`Logo checksum: ${c.slug}`);
}
const old=await load('data/curated/profiles.json'),current=await load('data/profiles.json');
for(const [slug,content] of Object.entries(old))assert.deepEqual(current[slug],content,`Hand-written content changed: ${slug}`);
assert.equal(data.companies.length,report.publishedCount);assert.equal(report.sourceRows,report.publishedCount+report.excludedCount);
const pages=new Map();const descriptions=new Set();const titles=new Set();
for(const rel of manifest) {
 const html=await readFile(path.join(root,rel),'utf8');pages.set(rel,html);
 assert.ok(html.includes('content="noindex, nofollow, noarchive"'),rel);
 assert.ok(html.includes('href="/roster/claim-listing/"'),`Missing footer claim link: ${rel}`);
 assert.ok(!/[\u2013\u2014]/.test(html),`Long dash: ${rel}`);
 assert.ok(!/\b(?:undefined|null|NaN|LOGO)\b|â€/.test(html),`Invalid generated text: ${rel}`);
 assert.ok(!/\bsort uses\b/i.test(html),`Obsolete sorting note: ${rel}`);
 assert.ok(!/S\$[\d,]+\.\d(?!\d)/.test(html.replace(/<script[\s\S]*?<\/script>/g,'')),`Money with one decimal (show S$19.50, not S$19.5): ${rel}`);
 assert.ok(!/\b1 sourced excerpts\b/.test(html),`Singular review excerpt grammar: ${rel}`);
 assert.ok(!/\b1 units\b/.test(html),`Singular unit grammar: ${rel}`);
 assert.ok(!/\bfrom 1 reviews\b|\b1 companies\b|\b1 towns\b/.test(html),`Singular count grammar: ${rel}`);
 assert.ok(!/\(\s*(?:as low as|from|at)\s+\)|\b(?:begins at|starts at|from|at)\s+\.(?=[\s<])|,\s*,/.test(html),`Broken price or address text: ${rel}`);
 const ogImage=html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
 if(ogImage)assert.ok(/^https:\/\//.test(ogImage),`Relative share image: ${rel}`);
 const desc=html.match(/<meta name="description" content="([^"]+)"/)[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 assert.ok(desc.length<=160&&/[.?!)]$/.test(desc),`Description length/ending: ${rel}`);
 assert.ok(!descriptions.has(desc),`Duplicate description: ${rel}`);descriptions.add(desc);
 const title=html.match(/<title>(.*?)<\/title>/)[1];assert.ok(!titles.has(title),`Duplicate title: ${rel}`);titles.add(title);
 assert.ok(!/data-save=|data-account-form|data-job-matches|data-job-start|data-quote-start|data-quote-steps|class="saved-link"/.test(html),`Parked feature leaked: ${rel}`);
 assert.ok(!/src="[^"]*(?:accounts\.js|job-results\.js|quote-start\.js)/.test(html),`Parked script leaked: ${rel}`);
 const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.ok(!/[$★☆]/.test(JSON.stringify(ld)),`Currency or stars in schema: ${rel}`);
 assert.ok(!/"(?:aggregateRating|review|offers|priceRange)"|"@type":"(?:AggregateRating|Review|Offer|Rating)"/.test(JSON.stringify(ld)),`Forbidden schema: ${rel}`);
 if(rel.startsWith('company/')&&!html.includes('data-retired-listing')){
  assert.ok(html.includes('class="listing-logo listing-logo-large'),`Missing logo slot: ${rel}`);
  const record=data.companies.find(c=>rel===`company/${c.slug}/index.html`);
  assert.ok(!html.includes('data-review-preview'),`Sample ratings on live profile: ${rel}`);
  if(!record.listingDepth.full) assert.ok(html.includes(record.imported?'Limited details':'Some details unconfirmed')&&!html.includes('data-review-preview'),`Missing compact profile: ${rel}`);
  assert.ok(html.includes('src="/roster/assets/review-preview.mjs?'),`Missing review selector script: ${rel}`);
  if(record.quoteEvidence){assert.ok(html.includes('Quote on request'),`Missing explicit quote price: ${rel}`);assert.ok(html.includes(record.quoteEvidence.excerpt.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;')),`Missing quote excerpt: ${rel}`);assert.ok(!html.includes('>Ask for a quote<'),`Generic quote replacing sourced statement: ${rel}`);}
  if(record.selfReportedRating)assert.ok(html.includes('The company says it has a '),`Missing self-reported rating: ${rel}`);
  if(record.selfReportedRating?.count_conflict===true)assert.ok(/The company says it has a [\d.]+ rating on its own site; its pages give different review counts\./.test(html)&&!/The company says it has a [\d.]+ rating from /.test(html),`Conflicting self-reported count shown: ${rel}`);
  for(const image of html.matchAll(/data-company-logo src="([^"]+)"/g))assert.ok(image[1].startsWith('/roster/assets/logos/'),`Hotlinked logo: ${rel}`);
  const intro=html.match(/<p class="company-intro">(.*?)<\/p>/)?.[1]||'';
  assert.ok(intro&&!/Its website mentions|Its site says|Roster found no/.test(intro),`Research wording remains: ${rel}`);
  assert.ok(!JSON.stringify(ld).includes('sample reviews'),`Sample reviews leaked into schema: ${rel}`);
  const business=ld['@graph'].find(x=>String(x['@id']).endsWith('#business'));assert.ok(business?.telephone&&business.sameAs?.length,`Missing business schema: ${rel}`);
  if(presentation[record.slug]?.logoAsset)assert.ok(html.includes(`src="${presentation[record.slug].logoAsset.src}"`),`Missing bundled logo: ${rel}`);
  assert.ok(!html.includes('No dated excerpts')&&!html.includes('rating-value'),`Empty review block or bare score: ${rel}`);
  const ids=[...html.matchAll(/<section class="profile-section" id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids[0],'pricing');const hasAreas=!!record.enrichment?.serviceLocations?.length;assert.equal(ids.includes('areas-served'),hasAreas);assert.deepEqual(ids.slice(0,hasAreas?4:3),hasAreas?['pricing','areas-served','overview','contact']:['pricing','overview','contact']);if(ids.includes('reviews'))assert.equal(ids.at(-2),'reviews');
  for(const m of html.matchAll(/<iframe[^>]+src="([^"]+)"/g)){const src=m[1].replaceAll('&amp;','&');const u=new URL(src);if(u.searchParams.has('q'))assert.ok(!/#\s*\d|\bUnit\s+\d/i.test(u.searchParams.get('q')),`Unit in map: ${rel}`);}
 }
}
// Sourced-rate tables: the rows the release supports, starting prices and ranges as printed, plain labels.
const unescape=s=>s.replace(/<[^>]+>/g,'').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const rateTables=new Set();
for(const [rel,html] of pages)for(const table of html.matchAll(/<table data-sourced-rates="([^"]+)">([\s\S]*?)<\/table>/g)){
 const [,key,body]=table,spec=guideEvidence[key];assert.ok(spec,`Unknown rate table ${key}: ${rel}`);rateTables.add(key);
 const rows=[...body.matchAll(/<tr><th scope="row"><a href="\/roster\/company\/([^/]+)\/#pricing">[\s\S]*?<\/a><\/th><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><td><a href="([^"]+)"/g)].map(m=>({slug:m[1],label:unescape(m[2]),cell:unescape(m[3]),source:unescape(m[4])}));
 assert.ok(rows.length>=minimumCompanies,`Rate table under ${minimumCompanies} companies: ${key} ${rel}`);
 const expected=sourcedRates(spec,data.companies);
 assert.deepEqual(rows.map(r=>r.slug),expected.map(r=>r.company.slug),`Rate table rows differ from release: ${key} ${rel}`);
 rows.forEach((row,i)=>{
  const p=expected[i].line,where=`${key} ${row.slug}: ${rel}`;
  assert.equal(rateProblem(p,spec),null,`Not a ${spec.noun} price: ${where}`);
  assert.equal(row.source,p.sourceUrl,`Rate source: ${where}`);
  assert.ok(row.label.length<=maxLabelLength&&!/\|\s*(?:each|per\b|\/)|\s\|$|\$\d/.test(row.label),`Service label fragment: ${where}: ${row.label}`);
  assert.ok(!/as printed/.test(row.cell),`Unit placeholder in rate: ${where}`);
  // Independent of the renderer: read the release fields directly.
  const printedRange=new RegExp(String.raw`\$\s*${p.amount_sgd}(?:\.0+)?\s*(?:-|to)\s*(?:S?\$)?\s*\d`).test(String(p.price_text).replace(/,(?=\d{3})/g,''));
  // A release maximum counts only when this row's own text or excerpt prints it (P1-7: Cool Earth's
  // "from S$80" row carries S$100 from a separate FAQ sentence).
  const maxPrinted=p.amount_max_sgd>p.amount_sgd&&[p.price_text,p.excerpt].some(t=>new RegExp(String.raw`(?:\$|-|to)\s*${p.amount_max_sgd}(?:\.0+)?(?!\d)`).test(String(t||'').replace(/,(?=\d{3})/g,'')));
  const fromText=/\b(?:from|frm|starting|starts?)\b\s*(?:price)?\s*:?\s*(?:from\s*)?(?:S\$|SGD\s*\$?|SG\s*\$|\$)\s*[\d,.]+/i.test(p.price_text);
  if(maxPrinted||printedRange)assert.ok(/ to S\$/.test(row.cell),`Range shortened to its low end: ${where}: ${row.cell}`);
  if(fromText)assert.ok(row.cell.startsWith('From S$'),`Starting price shown as firm: ${where}: ${row.cell}`);
  if(/\$\s*[\d.]+\s*(?:and|&)\s*above/i.test(p.price_text))assert.ok(row.cell.includes(' and above'),`"and above" dropped: ${where}: ${row.cell}`);
  assert.ok(!/S\$\d+\.\d(?!\d)/.test(row.cell),`Money with one decimal: ${where}: ${row.cell}`);
  if(/\bper (?:unit|piece|hour)\b|\/\s*(?:hour|hr|unit|pc)\b/i.test(p.price_text)&&p.unitInferred)assert.match(row.cell,/ per (?:unit|piece|hour|additional)/,`Source unit dropped: ${where}`);
  assert.ok(!/\bbooked their\b|\bno upsell\b|\bvery good service\b|\bno chemical wash needed\b|\badds \$|\+\$\d/i.test(`${row.label} ${p.price_text}`),`Review, surcharge or negated entry: ${where}`);
 });
}
for(const [key,spec] of Object.entries(guideEvidence))if(!rateTables.has(key))assert.ok(sourcedRates(spec,data.companies).length<minimumCompanies,`Rate table missing: ${key}`);
// Static area pages: the selection rule, real coverage lists, sourced town rates, visible FAQs,
// breadcrumbs, nearby links, hub links and distinct copy. Rule and nearby map: lib/area-pages.mjs.
{
 const tradeSlugs={aircon:'aircon-servicing',plumbing:'plumbing',electrician:'electrician',handyman:'handyman',cleaning:'home-cleaning'};
 // Guide and intent pages already built own their slugs; selection must skip them, as the build does.
 const reserved=new Set([...pages].filter(([rel,html])=>!rel.startsWith('company/')&&!html.includes('data-area-page=')).map(([rel])=>rel.replace(/\/?index\.html$/,'')));
 const expected=selectAreaPages(data.companies,Object.entries(tradeSlugs).map(([id,slug])=>({id,slug})),reserved);
 const launch=await load('data/seo-launch-pages.json');
 // Sitemap: every URL is a built page whose canonical is itself, and every area page is listed.
 // Pages stay noindex (checked for every page above) until the production domain is approved.
 const locs=[...(await readFile(path.join(root,'sitemap.xml'),'utf8')).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
 assert.equal(new Set(locs).size,locs.length,'Duplicate sitemap URL');
 for(const loc of locs){
  assert.ok(loc.startsWith('https://previews.heylead.com/roster/'),`Sitemap URL must be absolute preview URL: ${loc}`);
  const rel=loc.replace('https://previews.heylead.com/roster/','').replace(/\/?$/,'/').replace(/^\/$/,'')+'index.html';
  const html=pages.get(rel);assert.ok(html,`Sitemap URL is not a built page: ${loc}`);
  assert.ok(html.includes(`<link rel="canonical" href="${loc}">`),`Sitemap URL is not canonical-self: ${loc}`);
  assert.ok(!html.includes('data-retired-listing'),`Retired page in sitemap: ${loc}`);
 }
 for(const page of launch.pages)assert.ok(locs.includes(`https://previews.heylead.com${page.path}`),`Launch page missing from sitemap: ${page.path}`);
 const text=html=>unescape(html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1].replace(/<script[\s\S]*?<\/script>/g,' ')).replace(/\s+/g,' ').trim();
 const shingles=s=>{const w=s.toLowerCase().split(/\W+/).filter(Boolean),out=new Set();for(let i=0;i+5<=w.length;i++)out.add(w.slice(i,i+5).join(' '));return out;};
 const intros=new Map(),byTrade={};
 for(const page of expected.pages){
  assert.ok(locs.includes(`https://previews.heylead.com${page.path}`),`Area page missing from sitemap: ${page.path}`);
  assert.ok(!NON_RESIDENTIAL.has(page.town),`Non-residential area page: ${page.path}`);
  const rel=`${page.slug}/index.html`,html=pages.get(rel);assert.ok(html,`Missing area page: ${rel}`);
  assert.ok(page.count>=AREA_PAGE_MINIMUM,`Area page under minimum: ${rel}`);
  assert.ok(launch.pages.some(p=>p.kind==='area'&&p.path===page.path),`Area page missing from launch manifest: ${rel}`);
  assert.ok(html.includes(`data-area-page="${page.trade}|${page.town}"`),`Area page marker: ${rel}`);
  const {town:local}=townCoverage(data.companies,page.trade,page.town);assert.equal(local.length,page.count);
  const listed=[...html.match(/<ul class="area-company-list">([\s\S]*?)<\/ul>/)[1].matchAll(/<li><div><a href="\/roster\/company\/([^/]+)\//g)].map(m=>m[1]);
  assert.deepEqual(listed,local.map(c=>c.slug),`Area company list differs from stated coverage: ${rel}`);
  // Martin decision D1: no per-row coverage link and no capture-date intro; the evidence stays in the data.
  const listHtml=html.match(/<ul class="area-company-list">([\s\S]*?)<\/ul>/)[1];
  assert.equal((listHtml.match(/<a /g)||[]).length,listed.length,`Area rows must carry only the company link: ${rel}`);
  assert.ok(!/Coverage stated on|Coverage was captured/.test(html),`Coverage evidence line on area page: ${rel}`);
  assert.ok(html.includes(`${page.count===1?'its own website that it serves':'their own websites that they serve'} ${page.town}. Confirm your address when you call. Listed alphabetically.`),`Area list note: ${rel}`);
  assert.match(html,new RegExp(`<link rel="canonical" href="https://[^"/]+${page.path}">`),`Canonical: ${rel}`);
  const intro=unescape(html.match(/<p class="guide-dek" data-area-intro>([\s\S]*?)<\/p>/)[1]);
  assert.ok(intro.startsWith(`${page.count} `)&&intro.includes(page.town),`Area intro must state the town and count: ${rel}`);
  for(const [name] of serviceCounts(local).filter(([,n])=>n>=2).slice(0,4))assert.ok(serviceLabel(name),`Area intro service needs a display name in lib/area-pages.mjs: ${name}`);
  assert.ok(!intros.has(intro),`Duplicate area intro: ${rel} and ${intros.get(intro)}`);intros.set(intro,rel);
  for(const table of html.matchAll(/<table data-area-rates="([^"]+)">([\s\S]*?)<\/table>/g)){
   const spec=guideEvidence[table[1]],rows=[...table[2].matchAll(/<tr><th scope="row"><a href="\/roster\/company\/([^/]+)\/#pricing">[\s\S]*?<td><a href="([^"]+)"/g)];
   assert.ok(spec&&spec.trade===page.trade,`Area rate table trade: ${rel}`);assert.ok(rows.length>=minimumCompanies,`Area rate table under ${minimumCompanies} companies: ${rel}`);
   const want=sourcedRates(spec,local);assert.deepEqual(rows.map(m=>m[1]),want.map(r=>r.company.slug),`Area rate rows differ from the town's companies: ${table[1]} ${rel}`);
   rows.forEach((m,i)=>assert.equal(unescape(m[2]),want[i].line.sourceUrl,`Area rate source: ${rel}`));
  }
  // P1-15: aircon town pages lead with one-unit general servicing rates from the matrix rule.
  if(page.trade==='aircon'){
   const want=airconMatrix(local,[unitColumns[0]])[0].cells[0].entries,table=html.match(/<table data-area-general="[^"]+">([\s\S]*?)<\/table>/)?.[1];
   if(want.length>=minimumCompanies){
    assert.ok(table,`Aircon town page missing general servicing rates: ${rel}`);
    assert.deepEqual([...table.matchAll(/<tr><th scope="row"><a href="\/roster\/company\/([^/]+)\//g)].map(m=>m[1]),want.map(e=>e.company.slug),`General servicing rows differ from the matrix rule: ${rel}`);
    const charge=html.match(/<span>What do aircon[^<]*charge\?<\/span>[\s\S]*?<p>([^<]*)<\/p>/)?.[1]||'';
    assert.ok(charge.startsWith('For general servicing of one unit'),`Town FAQ must answer general servicing first: ${rel}`);
   }else assert.ok(!table,`General servicing table under ${minimumCompanies} companies: ${rel}`);
  }
  const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.equal(ld.find(x=>x['@type']==='BreadcrumbList')?.itemListElement.length,3,`Area breadcrumbs: ${rel}`);
  assert.ok(html.includes('<nav class="crumbs" aria-label="Breadcrumb">'),`Visible breadcrumbs: ${rel}`);
  const faq=ld.find(x=>x['@type']==='FAQPage');
  if(faq)for(const q of faq.mainEntity){const vis=html.replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&amp;','&');assert.ok(vis.includes(`<span>${q.name}</span>`)&&vis.includes(`<p>${q.acceptedAnswer.text.replace(/SGD /g,'S$')}</p>`),`FAQ schema not visible on page: ${rel}: ${q.name}`);}
  const nearby=html.match(/<div class="areas-we-serve-links" data-nearby>([\s\S]*?)<\/div>/)?.[1]||'';
  assert.ok(nearby.includes(`href="/roster/${tradeSlugs[page.trade]}/"`),`Nearby block must link back to the hub: ${rel}`);
  for(const town of nearbyTowns(page.town)){const target=expected.pages.find(p=>p.trade===page.trade&&p.town===town);assert.ok(nearby.includes(target?`href="${target.path}"`:`?area=${areaSlug(town)}#company-results`),`Nearby link ${town}: ${rel}`);}
  (byTrade[page.trade]||=[]).push([rel,shingles(text(html))]);
 }
 // Thin or duplicate copy: pages in one trade must not share most of their 5-word phrases.
 let maxSim=0,minDistinct=Infinity;
 for(const list of Object.values(byTrade))for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
  const [a,sa]=list[i],[b,sb]=list[j];let both=0;for(const s of sa)if(sb.has(s))both++;
  const jaccard=both/(sa.size+sb.size-both);maxSim=Math.max(maxSim,jaccard);minDistinct=Math.min(minDistinct,sa.size-both,sb.size-both);assert.ok(Math.min(sa.size,sb.size)-both>=AREA_MIN_DISTINCT,`Area pages lack distinct content: ${a} ${b}`);assert.ok(jaccard<AREA_MAX_SIMILARITY,`Area pages too similar (${jaccard.toFixed(2)}): ${a} ${b}`);
 }
 // Hubs link each static page and keep ?area= only for towns without one.
 for(const [id,slug] of Object.entries(tradeSlugs)){
  const hub=pages.get(`${slug}/index.html`),section=hub.match(/<section class="areas-we-serve"[\s\S]*?<\/section>/)[0];
  const map=JSON.parse(unescape(section.match(/data-area-pages="([^"]*)"/)[1]));
  for(const page of expected.pages.filter(p=>p.trade===id)){assert.ok(section.includes(`href="${page.path}"`),`Hub missing area page link: ${page.path}`);assert.ok(!section.includes(`?area=${areaSlug(page.town)}#`),`Hub still filters a town with a page: ${page.path}`);assert.equal(map[areaSlug(page.town)],page.path);}
 }
 console.log(`Area pages: ${expected.pages.length} (${Object.entries(byTrade).map(([t,l])=>`${t} ${l.length}`).join(', ')}); collisions: ${expected.collisions.length}; highest similarity ${maxSim.toFixed(2)}, fewest distinct phrases ${minDistinct}`);
}
// Gap features: aircon price matrix cells match the release, quick picks use sourced fields,
// licence lookups only on electrician and plumbing hubs, symptom finder listed.
{
 const priceGuide=pages.get('aircon/servicing-price/index.html');
 for(const [id,columns] of [['units',unitColumns],['sizes',sizeColumns]]){
  const rows=airconMatrix(data.companies,columns);
  const section=priceGuide.match(new RegExp(`<section[^>]+data-aircon-matrix="${id}">([\\s\\S]*?)</section>`))?.[1];assert.ok(section,`Missing aircon matrix ${id}`);
  let shown=0;
  for(const r of rows)for(const c of r.cells){
   const td=section.match(new RegExp(`<td data-matrix-cell="${id}\\|${c.column.id.replace('+','\\+')}" data-count="(\\d+)"[^>]*>([\\s\\S]*?)</td>`,'g'))?.[rows.indexOf(r)];
   assert.ok(td,`Matrix cell missing: ${id} ${r.service.id} ${c.column.id}`);
   const [,count,inner]=td.match(/data-count="(\d+)"[^>]*>([\s\S]*?)<\/td>/);
   assert.equal(Number(count),c.count,`Matrix count differs from release: ${id} ${r.service.id} ${c.column.id}`);
   if(c.count>=minimumCompanies){shown+=c.count;assert.ok(inner.includes('S$'),`Matrix cell should show a range: ${id} ${r.service.id} ${c.column.id}`);}
   else assert.ok(!/S\$|\d+\s*to\s/.test(inner),`Matrix cell under ${minimumCompanies} companies shows a price: ${id} ${r.service.id} ${c.column.id}`);
  }
  // P0-4: every rate behind a shown cell must agree with the cell on the release's own fields.
  for(const r of rows)for(const c of r.cells.filter(c=>c.shown))for(const e of c.entries){
   const p=e.line,where=`${id} ${r.service.id} ${c.column.id} ${e.company.slug} S$${p.amount_sgd}`;
   const units=p.units_in_price,want=id==='units'?Number(c.column.id.replace('+','')):1;
   assert.ok(c.column.id.endsWith('+')?units>=want:units===want,`Matrix row units disagree with cell: ${where}`);
   assert.ok(p.qty==null||p.qty===units,`Matrix row qty ${p.qty} disagrees with cell: ${where}`);
   assert.ok(p.min_units==null||p.min_units<=1,`Matrix row has a minimum of ${p.min_units} units: ${where}`);
   assert.ok(units>1?p.unit===`total for ${units} units`:!/^total for/.test(p.unit),`Matrix row unit "${p.unit}" disagrees with cell: ${where}`);
   assert.ok(!/\badditional\b/i.test(p.price_text)&&!/(?<![\d.$,])\b\d+\s*(?:units?|fan coil units?)?\s*(?:and|&)\s*above/i.test(`${p.price_text} ${String(p.excerpt||'').split('|').pop()}`),`Additional or minimum-quantity rate in a units cell: ${where}`);
   assert.ok(!/contract|yearly|quarterly|annual|\/\s*year/i.test(`${p.service} ${p.price_text}`),`Contract rate in matrix: ${where}`);
   assert.equal(unitRowProblem(p),null,`Matrix row rule: ${where}`);
  }
  const sources=section.match(new RegExp(`<table data-matrix-sources="${id}">([\\s\\S]*?)</table>`))[1];
  // P0-5 and P1-8: "Service as listed" is the row's own wording, within 90 characters, never a slogan.
  for(const m of sources.matchAll(/<tr><th scope="row">[\s\S]*?<\/th><td>[^<]*<\/td><td>([^<]*)<\/td>/g)){const label=unescape(m[1]);assert.ok(label.length<=maxLabelLength&&!/\b(?:best|cheapest|affordable)\b|#1|\|\s*[A-Z][\w ]+$/i.test(label)&&!/\$\d/.test(label),`Matrix source label: ${id}: ${label}`);}
  assert.equal((sources.match(/<tr><th scope="row">/g)||[]).length,shown,`Matrix sources must list every rate behind shown cells: ${id}`);
 }
 assert.ok(pages.get('aircon-servicing/index.html').includes('href="/roster/aircon/servicing-price/"'),'Aircon hub links the price guide');
 for(const [id,slug] of Object.entries({aircon:'aircon-servicing',plumbing:'plumbing',electrician:'electrician',handyman:'handyman',cleaning:'home-cleaning'})){
  const hub=pages.get(`${slug}/index.html`),section=hub.match(/<section class="guide-discovery quick-picks"[\s\S]*?<\/section>/)?.[0];assert.ok(section,`Quick picks missing: ${slug}`);
  assert.ok(!/\b(?:best|top|leading|recommended|number one|#1)\b/i.test(unescape(section.replace(/<a href="\/roster\/company\/[^"]+">[^<]*<\/a>|<caption>[\s\S]*?<\/caption>/g,'')).replace(/not rankings or recommendations/,'')),`Quick picks must not make editorial claims: ${slug}`);
  const rows=data.companies.filter(c=>(c.primaryTrade||c.category)===id);
  const want={prices:rows.filter(c=>presentation[c.slug]?.published).length,islandwide:rows.filter(c=>c.enrichment.serviceLocations.some(l=>l.name==='Islandwide')).length,emergency:rows.filter(c=>c.enrichment.emergency?.value===true&&c.enrichment.emergency.excerpt).length};
  for(const [pick,n] of Object.entries(want)){const got=section.match(new RegExp(`data-quick-pick="${pick}" data-count="(\\d+)"`))?.[1];if(n)assert.equal(Number(got),n,`Quick pick ${pick} count: ${slug}`);}
  const licence=hub.match(/<section[^>]+data-licence-lookup>[\s\S]*?<\/section>/)?.[0];
  assert.equal(!!licence,['electrician','plumbing'].includes(id),`Licence lookup block only on electrician and plumbing hubs: ${slug}`);
  if(licence){for(const m of licence.matchAll(/href="(https:[^"]+)"/g))assert.match(new URL(m[1]).host,/(?:^|\.)(?:ema|pub)\.gov\.sg$/,`Licence lookup links must be EMA or PUB: ${m[1]}`);assert.ok(!/data-slug|\/roster\/company\//.test(licence),'No per-company licence status');}
 }
 // The /roster/aircon/ guide hub carries the same Areas section as the aircon servicing directory.
 const airconHub=pages.get('aircon/index.html'),airconAreas=airconHub.match(/<section class="areas-we-serve"[\s\S]*?<\/section>/)?.[0];
 assert.ok(airconAreas,'Areas section on /roster/aircon/');
 assert.equal(airconAreas,pages.get('aircon-servicing/index.html').match(/<section class="areas-we-serve"[\s\S]*?<\/section>/)[0],'Aircon hub areas match the aircon servicing directory');
 const finder=pages.get('what-service-do-i-need/index.html');assert.ok(finder?.includes('data-symptom-finder'),'Symptom finder page');
 assert.ok((await readFile(path.join(root,'sitemap.xml'),'utf8')).includes('<loc>https://previews.heylead.com/roster/what-service-do-i-need/</loc>'),'Symptom finder in sitemap');
}
// "best" in Roster's own copy: allowed only in the five best-rated pages' titles, H1s and breadcrumbs,
// in links to those pages, and inside company names or quoted company text. Quoted text is
// recognised by its wording: the word before and after "best" must appear in the company data.
{
 const norm=s=>` ${String(s).toLowerCase().replace(/&amp;/g,'&').replace(/&#39;|’/g,"'").replace(/'s\b/g,'').replace(/[^a-z0-9]+/g,' ').trim()} `;
 const corpus=norm(JSON.stringify([data.companies,current]));
 // Company names (display and source) are names, not claims; longest first so they are removed whole.
 const bestNames=[...new Set(data.companies.flatMap(c=>[c.name,c.sourceName]).map(norm).filter(n=>n.includes(' best ')))].sort((a,b)=>b.length-a.length);
 const hits=[];
 for(const [rel,html] of pages){
  if(/^[a-z-]+\/best\/index\.html$/.test(rel))continue;
  // One text node (or attribute value) at a time, so neighbouring names do not run together.
  const chunks=html.replace(/<script[\s\S]*?<\/script>/g,'<x>').replace(/<title>[\s\S]*?<\/title>/,'<x>').replace(/<a [^>]*href="\/roster\/[a-z-]+\/best\/"[^>]*>[\s\S]*?<\/a>/g,'<x>').replace(/<[^>]*?(?:content|value|label|aria-label|alt|title)="([^"]*)"[^>]*>/g,'<x>$1<x>').split(/<[^>]*>/);
  for(const chunk of chunks){
   let t=norm(unescape(chunk));if(!t.includes(' best '))continue;
   for(const n of bestNames)t=t.split(n).join(' | ');
   const w=t.trim().split(' ');
   w.forEach((x,i)=>{if(x!=='best')return;const win=[w[i-1],x,w[i+1]].filter(v=>v&&v!=='|').join(' ');if(!corpus.includes(` ${win} `))hits.push(`${rel}: …${win}…`);});
  }
 }
 assert.deepEqual(hits,[],`"best" in Roster's own copy:\n${hits.slice(0,20).join('\n')}`);
}
// Display names only remove or re-case words from the source name.
for(const c of data.companies)assert.ok(derivedFrom(c.name,c.sourceName),`Display name adds words: ${c.slug}: ${c.name}`);
// Best-rated pages: Google rating only, the 20-review minimum, the printed formula, ties, schema,
// links from the hub and hub guide, sitemap, and "best" only in the title, H1, breadcrumbs and links.
{
 const sitemap=await readFile(path.join(root,'sitemap.xml'),'utf8'),out=[];
 assert.ok(bestOfScore(5,20)<bestOfScore(4.8,900),'5.0 from 20 must rank below 4.8 from 900');
 for(const [id,slug] of Object.entries({aircon:'aircon-servicing',plumbing:'plumbing',electrician:'electrician',handyman:'handyman',cleaning:'home-cleaning'})){
  const href=`/roster/${slug}/best/`,rel=`${slug}/best/index.html`,html=pages.get(rel);assert.ok(html,`Missing best-rated page: ${rel}`);
  const want=rankBestOf(data.companies,id);
  assert.ok(want.qualifiers.length>=BEST_OF.top,`Best-rated ${id}: under ${BEST_OF.top} qualifiers`);
  const rows=[...html.matchAll(/<li data-best-of-rank="(\d+)" data-slug="([^"]+)">([\s\S]*?)<\/li>/g)];
  assert.deepEqual(rows.map(m=>[Number(m[1]),m[2]]),want.ranked.map(x=>[x.rank,x.company.slug]),`Best-rated rows differ from the rule: ${rel}`);
  assert.ok(rows.length<=BEST_OF.top&&rows.length>0,`Best-rated length: ${rel}`);
  for(const [, ,slugRow,inner] of rows){
   const c=data.companies.find(x=>x.slug===slugRow),g=c.googleRating;
   assert.ok((c.primaryTrade||c.category)===id&&Number.isInteger(g.count)&&g.count>=BEST_OF.minReviews&&g.checkedAt&&g.sourceUrl,`Best-rated qualifier: ${slugRow}`);
   assert.ok(inner.includes(`${g.value.toFixed(1)} on Google Maps · ${g.count.toLocaleString('en-SG')} reviews · checked `)&&inner.includes(`href="${g.sourceUrl.replaceAll('&','&amp;')}"`),`Best-rated row must show the Google figure and link: ${slugRow}`);
  }
  assert.ok(!/[★☆]/.test(html),`Star glyph: ${rel}`);
  assert.ok(html.includes(`m = ${BEST_OF.m} and K = ${BEST_OF.K}`)&&html.includes(`Minimum: ${BEST_OF.minReviews} Google reviews.`),`Method box must print the settings: ${rel}`);
  const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.ok(!/ratingValue|reviewCount|bestRating|"Review"|"Rating"/.test(JSON.stringify(ld)),`Rating schema on best-rated page: ${rel}`);
  const list=ld.find(n=>n['@type']==='ItemList');assert.deepEqual(list.itemListElement.map(i=>i.item['@id']),want.ranked.map(x=>`https://previews.heylead.com/roster/company/${x.company.slug}/#business`),`ItemList: ${rel}`);
  assert.ok(ld.some(n=>n['@type']==='WebPage')&&ld.some(n=>n['@type']==='BreadcrumbList'),`WebPage and breadcrumbs: ${rel}`);
  const vis=html.replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&amp;','&');
  for(const q of ld.find(n=>n['@type']==='FAQPage').mainEntity)assert.ok(vis.includes(`<span>${q.name}</span>`)&&vis.includes(`<p>${q.acceptedAnswer.text}</p>`),`FAQ schema not visible: ${rel}: ${q.name}`);
  // Visible copy: "best" only in the H1, breadcrumbs and links to these pages. Company names are the companies' own.
  const main=html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1].replace(/<script[\s\S]*?<\/script>/g,'').replace(/<h1>[\s\S]*?<\/h1>/,'').replace(/<nav class="crumbs"[\s\S]*?<\/nav>/,'').replace(/<a href="\/roster\/(?:company\/[^"]+|[a-z-]+\/best\/)">[^<]*<\/a>/g,'');
  assert.ok(!/\bbest\b/i.test(unescape(main)),`"best" outside the title, H1, breadcrumbs and links: ${rel}`);
  const linkedFrom=[...pages].filter(([r,h])=>r!==rel&&h.includes(`href="${href}"`)).map(([r])=>r);
  assert.ok(linkedFrom.includes(`${slug}/index.html`),`Hub must link the best-rated page: ${slug}`);
  assert.ok(linkedFrom.some(r=>r!==`${slug}/index.html`&&!r.startsWith('company/')&&/data-editorial-id=/.test(pages.get(r))),`Hub guide must link the best-rated page: ${slug}`);
  for(const r of linkedFrom){const t=pages.get(r).match(/<section class="directory-guide-card best-of-teaser"[\s\S]*?<\/section>/)?.[0];if(t)assert.ok(!/\bbest\b/i.test(unescape(t.replace(/<a [^>]*href="[^"]+\/best\/"[^>]*>[\s\S]*?<\/a>/,''))),`"best" in teaser copy: ${r}`);}
  assert.ok(sitemap.includes(`<loc>https://previews.heylead.com${href}</loc>`),`Best-rated page missing from sitemap: ${href}`);
  out.push(`${id} ${want.qualifiers.length} qualify, ${rows.length} listed`);
 }
 console.log(`Best-rated pages: ${out.join('; ')}`);
}
const claim=pages.get('claim-listing/index.html');
assert.match(claim, /<input id="claim-company"[^>]+list="claim-companies"/);
assert.ok(!claim.includes('<select id="claim-company"'));
for (const [rel,html] of pages) if(rel.startsWith('company/')&&!html.includes('data-retired-listing')) assert.ok(html.includes('average-rating-large'),`Missing prominent average: ${rel}`);
const byRel=new Map([...pages].map(([rel,html])=>[rel,new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]))]));
for(const [rel,html] of pages)for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
 const raw=match[1].replaceAll('&amp;','&');if(!raw.startsWith('/roster/')&&!raw.startsWith('#'))continue;
 const u=new URL(raw,'https://previews.heylead.com/roster/'+rel);let file=u.pathname.replace(/^\/roster\//,'');if(file.endsWith('/'))file+='index.html';
 await access(path.join(root,file));if(u.hash&&byRel.has(file))assert.ok(byRel.get(file).has(decodeURIComponent(u.hash.slice(1))),`Broken fragment ${rel}: ${raw}`);
}
let hiddenRows=0;
for(const c of data.companies){
 const rel=`company/${c.slug}/index.html`;assert.ok(pages.has(rel),`Missing page: ${c.slug}`);
 const html=pages.get(rel),e=c.enrichment;
 for(const rating of c.reviewSources||[])if(!/^google maps$/i.test(rating.name)&&!rating.mirrorsSource)assert.ok(html.includes(rating.sourceUrl.replaceAll('&','&amp;')),`Missing rating source: ${rel}`);
 const frames=[...html.matchAll(/<iframe[^>]+src="([^"]+)"/g)];
 const pin=pins[c.slug];
 assert.equal(frames.length,pin?.status==='verified'?1:0,`Unverified map: ${rel}`);
 for(const frame of frames){const u=new URL(frame[1].replaceAll('&amp;','&'));assert.equal(u.searchParams.get('q'),`${pin.latitude},${pin.longitude}`);assert.equal(u.searchParams.get('z'),'17');assert.ok(pin.latitude>1.15&&pin.latitude<1.48&&pin.longitude>103.59&&pin.longitude<104.1);}
 if(c.alternatePhones?.length){assert.ok(html.includes('Also listed:'),`Missing alternate phones: ${rel}`);for(const p of c.alternatePhones)assert.ok(html.includes(p.sourceLabel.replaceAll('&','&amp;')),`Missing alternate phone source: ${rel}`);}
 if(e.faqs?.length) assert.ok(html.includes('Answer from the company website'),`Missing sourced FAQ: ${rel}`);
 if(e.summary?.text) assert.ok(html.includes('class="company-intro"'),`Missing summary: ${rel}`);
 if(c.imported) assert.equal((html.match(/<div class="service-options"/g)||[]).length,current[c.slug].services.filter(s=>s.prices.some(p=>!profileRowProblem(p))).length,`Pricing options: ${rel}`);
 // Testimonials, headings and condition fragments captured as price rows stay out of the pricing section.
 const pricingHtml=html.match(/<section class="profile-section" id="pricing"[\s\S]*?<\/section>/)?.[0]||'';
 for(const s of current[c.slug]?.services||[])for(const p of s.prices){const why=profileRowProblem(p);if(!why)continue;hiddenRows++;
  const probe=String(p.excerpt||'').replace(/^[\W\d]*\|\s*/,'').slice(0,40).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  if(probe.length>=12)assert.ok(!pricingHtml.includes(probe),`Profile price row shown despite guard (${why}): ${rel}: ${probe}`);}
}
for(const excluded of report.excluded.filter(c=>c.curated))assert.ok(!pages.has(`company/${excluded.slug}/index.html`)||pages.get(`company/${excluded.slug}/index.html`).includes('data-retired-listing'),`Flagged full profile still published: ${excluded.slug}`);
const categories={aircon:'aircon-servicing',plumbing:'plumbing',electrician:'electrician',handyman:'handyman',cleaning:'home-cleaning'};
for(const [id,slug] of Object.entries(categories)){
 const index={companies:decodeCatalogue(await load(`data/index/${id}.json`))};assert.equal(index.companies.length,report.byTrade[id].published);assert.ok(index.companies.every(c=>c.category===id),`Wrong primary trade in ${id}`);
 for(const c of index.companies){assert.equal(c.ratingValue,c.average?.value??null);assert.equal(c.ratingCount,c.average?.count||0);const company=data.companies.find(row=>row.slug===c.slug);assert.deepEqual(c.serviceAreas,[...new Set(company.enrichment.serviceLocations.map(e=>e.name))],`Coverage index differs from evidence: ${c.slug}`);}
 const directory=pages.get(slug+'/index.html');
 assert.ok(directory.includes('Minimum average rating'));
 assert.equal((directory.match(/id="service-area"/g)||[]).length,1,'One service coverage picker per directory');
 assert.ok(!directory.includes('Business location'),'Office-address filter must not duplicate coverage');
 const highlighted=[...directory.matchAll(/class="business-card catalogue-card"[^>]+data-slug="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(highlighted.length<=8);assert.ok(highlighted.every(s=>index.companies.find(c=>c.slug===s).fullProfile));
 assert.ok(directory.includes('Other companies'));
 const bytes=(await stat(path.join(root,slug,'index.html'))).size+(await stat(path.join(root,'data/index',id+'.json'))).size;assert.ok(bytes<300*1024,`${id}: ${bytes} bytes exceeds budget`);console.log(`${slug}: ${(bytes/1024).toFixed(1)} KB HTML + JSON`);
}
assert.equal(Object.values(report.byTrade).reduce((n,t)=>n+t.published,0),report.publishedCount,'Primary-trade totals must not overlap');
const all=await load('data/index/all.json');assert.equal(all.companies.length,data.companies.length);
console.log(`Profile price rows hidden by guards: ${hiddenRows}`);
console.log(`PASS: ${pages.size} pages, all local links/fragments, unique metadata, schema restrictions, publication counts and ${Object.keys(old).length} original write-ups.`);

import { readFile, stat, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {decodeCatalogue} from '../assets/catalogue-data.mjs';
import {selectAreaPages,townCoverage,nearbyTowns,AREA_PAGE_MINIMUM,AREA_MAX_SIMILARITY,AREA_MIN_DISTINCT} from '../lib/area-pages.mjs';
import {areaSlug} from '../assets/service-areas.mjs';
import {guideEvidence, sourcedRates, rateProblem, isFromPrice, minimumCompanies, maxLabelLength} from '../lib/sourced-rates.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const load=async f=>JSON.parse(await readFile(path.join(root,f),'utf8'));
const data=await load('data/companies.json'),manifest=await load('data/build-manifest.json'),report=await load('data/import-report.json');
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
 assert.ok(!/\b1 sourced excerpts\b/.test(html),`Singular review excerpt grammar: ${rel}`);
 assert.ok(!/\b1 units\b/.test(html),`Singular unit grammar: ${rel}`);
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
  if(p.amount_max_sgd>p.amount_sgd||printedRange)assert.ok(/ to S\$/.test(row.cell),`Range shortened to its low end: ${where}: ${row.cell}`);
  else if(/\bfrom\s*(?:S\$|SGD\s*\$?|SG\s*\$|\$)\s*[\d,.]+/i.test(p.price_text)&&isFromPrice(p))assert.ok(row.cell.startsWith('From S$'),`Starting price shown as firm: ${where}: ${row.cell}`);
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
 assert.equal(await readFile(path.join(root,'sitemap.xml'),'utf8'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n','Preview sitemap must stay empty while every page is noindex');
 const text=html=>unescape(html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1].replace(/<script[\s\S]*?<\/script>/g,' ')).replace(/\s+/g,' ').trim();
 const shingles=s=>{const w=s.toLowerCase().split(/\W+/).filter(Boolean),out=new Set();for(let i=0;i+5<=w.length;i++)out.add(w.slice(i,i+5).join(' '));return out;};
 const intros=new Map(),byTrade={};
 for(const page of expected.pages){
  const rel=`${page.slug}/index.html`,html=pages.get(rel);assert.ok(html,`Missing area page: ${rel}`);
  assert.ok(page.count>=AREA_PAGE_MINIMUM,`Area page under minimum: ${rel}`);
  assert.ok(launch.pages.some(p=>p.kind==='area'&&p.path===page.path),`Area page missing from launch manifest: ${rel}`);
  assert.ok(html.includes(`data-area-page="${page.trade}|${page.town}"`),`Area page marker: ${rel}`);
  const {town:local}=townCoverage(data.companies,page.trade,page.town);assert.equal(local.length,page.count);
  const listed=[...html.match(/<ul class="area-company-list">([\s\S]*?)<\/ul>/)[1].matchAll(/<li><div><a href="\/roster\/company\/([^/]+)\//g)].map(m=>m[1]);
  assert.deepEqual(listed,local.map(c=>c.slug),`Area company list differs from stated coverage: ${rel}`);
  assert.match(html,new RegExp(`<link rel="canonical" href="https://[^"/]+${page.path}">`),`Canonical: ${rel}`);
  const intro=unescape(html.match(/<p class="guide-dek" data-area-intro>([\s\S]*?)<\/p>/)[1]);
  assert.ok(intro.startsWith(`${page.count} `)&&intro.includes(page.town),`Area intro must state the town and count: ${rel}`);
  assert.ok(!intros.has(intro),`Duplicate area intro: ${rel} and ${intros.get(intro)}`);intros.set(intro,rel);
  for(const table of html.matchAll(/<table data-area-rates="([^"]+)">([\s\S]*?)<\/table>/g)){
   const spec=guideEvidence[table[1]],rows=[...table[2].matchAll(/<tr><th scope="row"><a href="\/roster\/company\/([^/]+)\/#pricing">[\s\S]*?<td><a href="([^"]+)"/g)];
   assert.ok(spec&&spec.trade===page.trade,`Area rate table trade: ${rel}`);assert.ok(rows.length>=minimumCompanies,`Area rate table under ${minimumCompanies} companies: ${rel}`);
   const want=sourcedRates(spec,local);assert.deepEqual(rows.map(m=>m[1]),want.map(r=>r.company.slug),`Area rate rows differ from the town's companies: ${table[1]} ${rel}`);
   rows.forEach((m,i)=>assert.equal(unescape(m[2]),want[i].line.sourceUrl,`Area rate source: ${rel}`));
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
 if(c.imported) assert.equal((html.match(/<div class="service-options"/g)||[]).length,current[c.slug].services.filter(s=>s.prices.length).length,`Pricing options: ${rel}`);
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
console.log(`PASS: ${pages.size} pages, all local links/fragments, unique metadata, schema restrictions, publication counts and ${Object.keys(old).length} original write-ups.`);

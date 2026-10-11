import { readFile, stat, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const load=async f=>JSON.parse(await readFile(path.join(root,f),'utf8'));
const data=await load('data/companies.json'),manifest=await load('data/build-manifest.json'),report=await load('data/import-report.json');
const old=await load('data/curated/profiles.json'),current=await load('data/profiles.json');
for(const [slug,content] of Object.entries(old))assert.deepEqual(current[slug],content,`Hand-written content changed: ${slug}`);
assert.equal(data.companies.length,report.publishedCount);assert.equal(report.sourceRows,report.publishedCount+report.excludedCount);
const pages=new Map();const descriptions=new Set();const titles=new Set();
for(const rel of manifest) {
 const html=await readFile(path.join(root,rel),'utf8');pages.set(rel,html);
 assert.ok(html.includes('content="noindex, nofollow, noarchive"'),rel);
 assert.ok(html.includes('href="/roster/claim-listing/"'),`Missing footer claim link: ${rel}`);
 assert.ok(!/[\u2013\u2014]/.test(html),`Long dash: ${rel}`);
 assert.ok(!/>\s*(?:undefined|null|NaN|N\/A)\s*</.test(html),`Empty data text: ${rel}`);
 const desc=html.match(/<meta name="description" content="([^"]+)"/)[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 assert.ok(desc.length<=160&&/[.?!)]$/.test(desc),`Description length/ending: ${rel}`);
 assert.ok(!descriptions.has(desc),`Duplicate description: ${rel}`);descriptions.add(desc);
 const title=html.match(/<title>(.*?)<\/title>/)[1];assert.ok(!titles.has(title),`Duplicate title: ${rel}`);titles.add(title);
 const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.ok(!/"(?:aggregateRating|review|offers|priceRange)"|"@type":"(?:AggregateRating|Review|Offer|Rating)"/.test(JSON.stringify(ld)),`Forbidden schema: ${rel}`);
 if(rel.startsWith('company/')){
  assert.ok(html.includes('class="listing-logo listing-logo-large'),`Missing logo slot: ${rel}`);
  assert.ok(html.includes('data-review-preview')&&html.includes('These figures do not describe this company.'),`Unlabelled review mockup: ${rel}`);
  assert.ok(html.includes('src="/roster/assets/review-preview.mjs?'),`Missing review selector script: ${rel}`);
  const intro=html.match(/<p class="company-intro">(.*?)<\/p>/)?.[1]||'';
  assert.ok(intro&&!/Its website mentions|Its site says|Roster found no/.test(intro),`Research wording remains: ${rel}`);
  assert.ok(!JSON.stringify(ld).includes('sample reviews'),`Sample reviews leaked into schema: ${rel}`);
  const business=ld['@graph'].find(x=>String(x['@id']).endsWith('#business'));assert.ok(business?.telephone&&business.sameAs?.length,`Missing business schema: ${rel}`);
  assert.ok(!html.includes('No dated excerpts')&&!html.includes('rating-value'),`Empty review block or bare score: ${rel}`);
  const ids=[...html.matchAll(/<section class="profile-section" id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids[0],'pricing');assert.equal(ids[1],'overview');assert.equal(ids[2],'contact');if(ids.includes('reviews'))assert.equal(ids.at(-2),'reviews');
  for(const m of html.matchAll(/<iframe[^>]+src="([^"]+)"/g)){const src=m[1].replaceAll('&amp;','&');const u=new URL(src);if(u.searchParams.has('q'))assert.ok(!/#\s*\d|\bUnit\s+\d/i.test(u.searchParams.get('q')),`Unit in map: ${rel}`);}
 }
}
const claim=pages.get('claim-listing/index.html');
assert.match(claim, /<input id="claim-company"[^>]+list="claim-companies"/);
assert.ok(!claim.includes('<select id="claim-company"'));
for (const [rel,html] of pages) if(rel.startsWith('company/')) assert.ok(html.includes('average-rating-large'),`Missing prominent average: ${rel}`);
const byRel=new Map([...pages].map(([rel,html])=>[rel,new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]))]));
for(const [rel,html] of pages)for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
 const raw=match[1].replaceAll('&amp;','&');if(!raw.startsWith('/roster/')&&!raw.startsWith('#'))continue;
 const u=new URL(raw,'https://previews.heylead.com/roster/'+rel);let file=u.pathname.replace(/^\/roster\//,'');if(file.endsWith('/'))file+='index.html';
 await access(path.join(root,file));if(u.hash&&byRel.has(file))assert.ok(byRel.get(file).has(decodeURIComponent(u.hash.slice(1))),`Broken fragment ${rel}: ${raw}`);
}
for(const c of data.companies){
 const rel=`company/${c.slug}/index.html`;assert.ok(pages.has(rel),`Missing page: ${c.slug}`);
 const html=pages.get(rel),e=c.enrichment;
 if(c.alternatePhones?.length){assert.ok(html.includes('Also listed:'),`Missing alternate phones: ${rel}`);for(const p of c.alternatePhones)assert.ok(html.includes(p.sourceLabel.replaceAll('&','&amp;')),`Missing alternate phone source: ${rel}`);}
 if(e.faqs?.length) assert.ok(html.includes('Answer from the company website'),`Missing sourced FAQ: ${rel}`);
 if(e.summary?.text) assert.ok(html.includes('class="company-intro"'),`Missing summary: ${rel}`);
 if(c.imported) assert.equal((html.match(/<div class="service-options"/g)||[]).length,current[c.slug].services.filter(s=>s.prices.length).length,`Pricing options: ${rel}`);
}
for(const excluded of report.excluded.filter(c=>c.curated))assert.ok(!pages.has(`company/${excluded.slug}/index.html`),`Flagged page still published: ${excluded.slug}`);
const categories={aircon:'aircon-servicing',plumbing:'plumbing',electrician:'electrician',handyman:'handyman',cleaning:'home-cleaning'};
for(const [id,slug] of Object.entries(categories)){
 const index=await load(`data/index/${id}.json`);assert.equal(index.companies.length,report.byTrade[id].published);assert.ok(index.companies.every(c=>c.category===id),`Wrong primary trade in ${id}`);
 for(const c of index.companies){assert.equal(c.ratingValue,c.average?.value??null);assert.equal(c.ratingCount,c.average?.count||0);}
 assert.ok(pages.get(slug+'/index.html').includes('Minimum average rating'));
 const bytes=(await stat(path.join(root,slug,'index.html'))).size+(await stat(path.join(root,'data/index',id+'.json'))).size;assert.ok(bytes<300*1024,`${id}: ${bytes} bytes exceeds budget`);console.log(`${slug}: ${(bytes/1024).toFixed(1)} KB HTML + JSON`);
}
assert.equal(Object.values(report.byTrade).reduce((n,t)=>n+t.published,0),report.publishedCount,'Primary-trade totals must not overlap');
const all=await load('data/index/all.json');assert.equal(all.companies.length,data.companies.length);
console.log(`PASS: ${pages.size} pages, all local links/fragments, unique metadata, schema restrictions, publication counts and 16 original write-ups.`);

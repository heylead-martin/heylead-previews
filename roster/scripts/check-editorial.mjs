import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadGuides,wordCount} from '../lib/editorial.mjs';
import {sitemapXml} from '../lib/sitemaps.mjs';
import {loadBlog,proseChunks,officialHosts} from '../lib/blog.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const guides=await loadGuides(root),results=[];
for(const g of guides){
  const html=await readFile(`${root}/${g.slug}/index.html`,'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${g.id}: one H1`);
  assert.ok(html.includes('<html lang="en-SG">'));
  assert.ok(html.includes('content="noindex, nofollow, noarchive"'));
  assert.ok(html.includes(`href="https://previews.heylead.com${g.path}"`));
  const article=html.match(new RegExp(`<article[^>]+data-editorial-id="${g.id}">([\\s\\S]*?)<\\/article>`))?.[1];
  assert.ok(article,`${g.id}: server-rendered article`);
  assert.ok(g.words>=1000,`${g.id}: minimum original editorial word count`);
  const json=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const faq=json['@graph'].find(n=>n['@type']==='FAQPage');
  assert.deepEqual(faq.mainEntity.map(q=>[q.name,q.acceptedAnswer.text]),g.faqs);
  for(const t of g.toc)assert.ok(article.includes(`id="${t.id}"`),`${g.id}: contents anchor`);
  assert.ok(html.includes('class="footer-guides"'));
  assert.ok(!article.match(/\[VERIFY\]|lorem ipsum|guaranteed response|verified bookings/i));
  if(g.directoryPath){
    const directory=await readFile(`${root}/${g.directoryPath.replace('/roster/','')}index.html`,'utf8');
    assert.ok(!directory.includes('data-editorial-id='),`${g.id}: directory must not embed long-form content`);
    assert.ok(directory.includes('id="guide"'),`${g.id}: old guide anchor stays useful`);
    assert.ok(directory.includes(`href="${g.path}"`),`${g.id}: directory links to standalone guide`);
    assert.ok(html.includes(`href="${g.directoryPath}"`),`${g.id}: guide links back to directory`);
    const directorySchema=JSON.parse(directory.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.ok(!directorySchema['@graph'].some(node=>node['@type']==='Article'||node['@type']==='FAQPage'),`${g.id}: guide schema belongs only on the guide page`);
  }
  results.push({id:g.id,path:g.path,words:g.words,faqs:g.faqs.length,sourceReferences:g.sources.length,updated:g.updated});
}
const method=await readFile(`${root}/content/how-it-works.md`,'utf8');
// Roster's own copy never says "best"; that word is kept for the five best-rated pages (built from
// lib/best-of.mjs) and for company names and quoted company text. check-site applies the page rule.
{
 const {readdir}=await import('node:fs/promises');
 const own=[['content/how-it-works.md',method],...await Promise.all(guides.map(async g=>[`content/guides/${g.id}.md`,g.markdown])),...await Promise.all((await readdir(`${root}/content/blog`)).filter(f=>f.endsWith('.md')).map(async f=>[`content/blog/${f}`,await readFile(`${root}/content/blog/${f}`,'utf8')])),['data/service-guides.json',await readFile(`${root}/data/service-guides.json`,'utf8')]];
 for(const [file,text] of own)assert.ok(!/\bbest\b/i.test(text.replace(/\]\([^)]*\)/g,']')),`"best" in Roster's own copy: ${file}: ${text.match(/.{0,40}\bbest\b.{0,30}/i)?.[0]}`);
}
assert.ok(wordCount(method)>=1000);
// The sitemap lists the launch set for review; every page in it stays noindex.
const sitemap=await sitemapXml(root);
for(const g of guides)assert.ok(sitemap.includes(`<loc>https://previews.heylead.com${g.path}</loc>`),`${g.id}: guide missing from sitemap`);
// Blog posts: length, contents, visible FAQ with matching schema, two to four spread-out CTAs,
// official sources only, Article schema and no number or price that is not sourced.
const blog=await loadBlog(root,{renderRates:key=>key});const blogResults=[];
const blogIndex=await readFile(`${root}/blog/index.html`,'utf8');
assert.ok(sitemap.includes('<loc>https://previews.heylead.com/roster/blog/</loc>'),'Blog index missing from sitemap');
assert.ok(blog.length>=5,'At least five blog posts');
for(const b of blog){
  const html=await readFile(`${root}/blog/${b.slug}/index.html`,'utf8');
  assert.ok(blogIndex.includes(`href="${b.path}"`),`${b.slug}: blog index link`);
  assert.ok(sitemap.includes(`<loc>https://previews.heylead.com${b.path}</loc>`),`${b.slug}: missing from sitemap`);
  assert.ok(html.includes('content="noindex, nofollow, noarchive"'),`${b.slug}: noindex`);
  assert.ok(html.includes(`<link rel="canonical" href="https://previews.heylead.com${b.path}">`),`${b.slug}: canonical`);
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${b.slug}: one H1`);
  assert.ok(b.words>=900&&b.words<=1500,`${b.slug}: ${b.words} words, want 900 to 1500`);
  assert.ok(b.toc.length>=4,`${b.slug}: table of contents`);
  const article=html.match(/<article class="guide-article" data-blog-post="[^"]+">([\s\S]*?)<\/article>/)?.[1];assert.ok(article,`${b.slug}: article`);
  for(const t of b.toc){assert.ok(article.includes(`<h2 id="${t.id}">`),`${b.slug}: contents anchor ${t.id}`);assert.ok(html.includes(`href="#${t.id}"`),`${b.slug}: contents link ${t.id}`);}
  assert.ok(html.includes('By Roster editorial team')&&/Updated <time datetime="\d{4}-\d{2}-\d{2}">/.test(html),`${b.slug}: author and updated date`);
  assert.ok(/<figcaption><a href="https:\/\/www\.pexels\.com\/photo\/[^"]+">Illustrative photo: [^<]+ \/ Pexels<\/a><\/figcaption>/.test(html)&&html.includes('src="/roster/assets/hero/'),`${b.slug}: credited self-hosted hero`);
  const json=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const art=json.find(n=>n['@type']==='Article');assert.ok(art&&art.author.name==='Roster editorial team'&&art.dateModified===b.updated,`${b.slug}: Article schema`);
  assert.ok(json.some(n=>n['@type']==='BreadcrumbList'),`${b.slug}: BreadcrumbList`);
  assert.ok(b.faqs.length>=2&&b.faqs.length<=5,`${b.slug}: short FAQ`);
  const faq=json.find(n=>n['@type']==='FAQPage');assert.deepEqual(faq.mainEntity.map(q=>[q.name,q.acceptedAnswer.text]),b.faqs,`${b.slug}: FAQ schema`);
  const visible=article.replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&amp;','&');for(const [q,a] of b.faqs)assert.ok(visible.includes(`<h3>${q}</h3>`)&&visible.includes(a.slice(0,60)),`${b.slug}: FAQ not visible: ${q}`);
  const ctas=[...article.matchAll(/data-blog-cta>[\s\S]*?<a class="btn btn-solid" href="(\/roster\/[^"]+)"/g)].map(m=>m[1]);
  assert.ok(ctas.length>=2&&ctas.length<=4&&ctas.length===b.ctas,`${b.slug}: 2 to 4 CTAs`);
  assert.equal(new Set(ctas).size,ctas.length,`${b.slug}: CTA targets repeat`);
  const parts=article.split('data-blog-cta>');for(const part of parts.slice(1,-1))assert.ok(part.includes('<h2 '),`${b.slug}: CTAs must be spread across sections`);
  assert.ok(parts[0].includes('<h2 '),`${b.slug}: first CTA comes after the opening section`);
  assert.ok((article.match(/href="\/roster\/(?!blog\/)[^"#]+"/g)||[]).length>ctas.length+2,`${b.slug}: contextual in-text links`);
  assert.ok(b.sources.length>=1&&html.includes('data-blog-sources'),`${b.slug}: official sources linked`);
  for(const s of b.sources)assert.ok(officialHosts.includes(new URL(s.url).host),`${b.slug}: unofficial source ${s.url}`);
  for(const chunk of proseChunks(b.markdown)){
    assert.ok(!/\$|\bSGD\b|per cent|%/i.test(chunk),`${b.slug}: prices and percentages only in sourced rate tables: ${chunk.slice(0,60)}`);
    if(/\d/.test(chunk.replace(/\]\([^)]+\)/g,']')))assert.ok(/\]\(https:\/\/www1?\.(?:pub|ema|nea|hdb|police|scdf|bca)\.gov\.sg\//.test(chunk),`${b.slug}: number without an official source in: ${chunk.slice(0,60)}`);
  }
  assert.ok(!article.match(/\[VERIFY\]|lorem ipsum|guaranteed|best in singapore|cheapest/i),`${b.slug}: unsupported claims`);
  for(const t of article.matchAll(/<table data-sourced-rates="([^"]+)">/g))assert.ok(b.markdown.includes(`[[rates ${t[1]}]]`));
  const hero=JSON.parse(await readFile(`${root}/data/hero-photos.json`,'utf8'))[b.hero||b.trade];
  assert.ok(hero&&html.includes(`src="${hero.sizes[640].src}"`)&&html.includes(`Illustrative photo: ${hero.photographer} / Pexels`),`${b.slug}: hero photo and its credit`);
  blogResults.push({hero:b.hero||b.trade,slug:b.slug,path:b.path,words:b.words,faqs:b.faqs.length,ctas:ctas.length,sources:b.sources.length});
}
// Blog posts must not repeat a guide's topic or each other's headline, and should vary the hero photos.
for(const b of blog){assert.ok(!guides.some(g=>g.h1.toLowerCase()===b.h1.toLowerCase()||g.slug.endsWith('/'+b.slug)),`${b.slug}: duplicates a guide`);}
assert.equal(new Set(blog.map(b=>b.h1.toLowerCase())).size,blog.length,'Duplicate blog headline');
if(blog.length>=10)assert.ok(new Set(blogResults.map(b=>b.hero)).size>=4,'Vary blog hero photos across the reviewed set');
const home=await readFile(`${root}/index.html`,'utf8');
for(const g of guides.filter(g=>g.hub))assert.ok(home.includes(`href="${g.path}"`));
await writeFile(`${root}/data/editorial-audit.json`,JSON.stringify({checked:'2026-10-12',corePages:results.length,totalWords:results.reduce((s,r)=>s+r.words,0),methodPageWords:wordCount(method),pages:results,blog:blogResults},null,2)+'\n');
console.log(`PASS: ${results.length} core pages, ${blogResults.length} blog posts (${blogResults.map(b=>b.words).join(', ')} words), ${results.reduce((s,r)=>s+r.words,0)} editorial words, matching FAQs, canonicals, contents links and preview indexing safeguards.`);

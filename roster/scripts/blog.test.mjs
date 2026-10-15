import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseBlog,proseChunks} from '../lib/blog.mjs';
import {selectAreaPages,NON_RESIDENTIAL} from '../lib/area-pages.mjs';

const post=body=>`---\ntitle: T | Roster\nlabel: T\nh1: T\ndescription: D.\ntrade: plumbing\nupdated: 2026-10-15\n---\n${body}`;
const opts={renderRates:key=>key==='PL-08'?'<table data-sourced-rates="PL-08"></table>':''};

test('Blog blocks: headings, callouts, CTAs, rate tables and FAQs',()=>{
 const b=parseBlog(post('## Start here\n\nSee [PUB](https://www.pub.gov.sg/x).\n\n> Tip: Take a photo.\n\n[[cta /roster/plumbing/ | Compare plumbers | Lead text.]]\n\n[[rates PL-08]]\n\n## Questions\n\n### Is it safe?\n\nYes, mostly.'),'p',opts);
 assert.deepEqual(b.toc.map(t=>t.id),['p-start-here','p-questions']);
 assert.match(b.body,/data-blog-callout><strong>Tip<\/strong><p>Take a photo\.<\/p>/);
 assert.match(b.body,/data-blog-cta>[\s\S]*href="\/roster\/plumbing\/">Compare plumbers/);
 assert.match(b.body,/data-sourced-rates="PL-08"/);
 assert.equal(b.ctas,1);assert.deepEqual(b.faqs,[['Is it safe?','Yes, mostly.']]);
 assert.deepEqual(b.sources,[{url:'https://www.pub.gov.sg/x',title:'PUB'}]);
 assert.equal(proseChunks('a\n\n[[cta /roster/ | x | y]]\n\n[[rates PL-08]]').length,1);
});

test('Blog posts reject unofficial sources, thin rate tables and unknown blocks',()=>{
 assert.throws(()=>parseBlog(post('See [blog](https://example.com/a).'),'p',opts),/official sources/);
 assert.throws(()=>parseBlog(post('[[rates CL-12]]'),'p',opts),/too few companies/);
 assert.throws(()=>parseBlog(post('[[video x]]'),'p',opts),/unknown block/);
 assert.throws(()=>parseBlog('no front matter','p',opts),/front matter/);
});

test('Non-residential planning areas never get a static page',()=>{
 const rows=[...Array(6)].map((_,i)=>({slug:`c${i}`,category:'plumbing',enrichment:{serviceLocations:[{name:'Tuas'},{name:'Tengah'},{name:'Downtown Core'}]}}));
 assert.deepEqual(selectAreaPages(rows,[{id:'plumbing',slug:'plumbing'}]).pages.map(p=>p.town),['Downtown Core','Tengah']);
 assert.deepEqual([...NON_RESIDENTIAL].sort(),['Changi','Lim Chu Kang','Mandai','Pioneer','Seletar','Sungei Kadut','Tuas']);
});

test('Sitemap lists absolute preview URLs for area pages and the blog',async()=>{
 const xml=await readFile(new URL('../sitemap.xml',import.meta.url),'utf8');
 assert.match(xml,/<loc>https:\/\/previews\.heylead\.com\/roster\/plumbing\/bedok\/<\/loc>/);
 assert.match(xml,/<loc>https:\/\/previews\.heylead\.com\/roster\/blog\/<\/loc>/);
 assert.doesNotMatch(xml,/\/roster\/plumbing\/tuas\//);
});

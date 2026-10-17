import {readFile} from 'node:fs/promises';
import {guideCatalogue} from '../content/guides/catalogue.mjs';
export const escapeHtml = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const plainText = value => value.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*#|]/g,'').replace(/^-+$/gm,'').trim();
export const wordCount = value => (plainText(value).match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[]).length;
const slugify = value => plainText(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function inline(value) {
  return escapeHtml(value).replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>{
    if(!/^(https:\/\/|\/|#)/.test(url))throw new Error('Unsupported editorial link');
    return `<a href="${url}">${label}</a>`;
  }).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
}
// This intentionally supports only the small, escaped Markdown subset used by our editors.
export function parseGuide(markdown, id) {
  const chunks=markdown.trim().split(/\n\s*\n/), toc=[], faqs=[], sources=new Map();
  let prefix=id.toLowerCase(), question=null, answers=[], faq=false, tableCaption='Comparison at a glance';
  const flushQuestion=()=>{if(question){faqs.push([question,answers.join(' ')]);question=null;answers=[];}};
  const body=chunks.map(chunk=>{
    for(const m of chunk.matchAll(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g)) sources.set(m[2],m[1]);
    if(chunk.startsWith('## ')) {
      flushQuestion();const title=chunk.slice(3).trim(),anchor=`${prefix}-${slugify(title)}`;
      faq=/questions|faqs/i.test(title);toc.push({title,id:anchor});
      return `<h2 id="${anchor}">${inline(title)}</h2>`;
    }
    if(chunk.startsWith('### ')) {
      flushQuestion();const title=chunk.slice(4).trim();if(faq)question=plainText(title);
      return `<h3>${inline(title)}</h3>`;
    }
    if(chunk.startsWith('Table: ')){tableCaption=chunk.slice(7);return '';}
    if(chunk.startsWith('|')) {
      const rows=chunk.split('\n').map(r=>r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));
      if(rows.length<3||!rows[1].every(c=>/^:?-+:?$/.test(c)))throw new Error(`Malformed table in ${id}`);
      return `<div class="guide-table-scroll" tabindex="0" role="region" aria-label="${escapeHtml(tableCaption)}"><table><caption>${inline(tableCaption)}</caption><thead><tr>${rows[0].map(c=>`<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(2).map(r=>`<tr>${r.map((c,i)=>i===0?`<th scope="row">${inline(c)}</th>`:`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    if(chunk.startsWith('- '))return `<ul>${chunk.split('\n').map(s=>`<li>${inline(s.replace(/^- /,''))}</li>`).join('')}</ul>`;
    if(faq&&question)answers.push(plainText(chunk.replace(/\n/g,' ')));
    return `<p>${inline(chunk.replace(/\n/g,' '))}</p>`;
  }).join('\n');
  flushQuestion();
  return {body,toc,faqs,sources:[...sources].map(([url,title])=>({url,title})),words:wordCount(markdown)};
}
export async function loadGuides(root) {
  return Promise.all(guideCatalogue.map(async guide=>{
    const markdown=await readFile(`${root}/content/guides/${guide.id}.md`,'utf8');
    if(/[\u2013\u2014]|\[VERIFY\]/.test(markdown))throw new Error(`Unfinished copy in ${guide.id}`);
    return {...guide,markdown,...parseGuide(markdown,guide.id)};
  }));
}
const tradeLabels={aircon:'Aircon',cleaning:'Cleaning',plumbing:'Plumbing',electrician:'Electrical',handyman:'Handyman'};
const tradePaths={aircon:'aircon-servicing',cleaning:'home-cleaning',plumbing:'plumbing',electrician:'electrician',handyman:'handyman'};
export function guideCards(guides, heading='A little knowledge goes a long way.') {
  return `<section class="guide-discovery"><p class="kicker">THE HOMEZYPRO HOME GUIDE</p><h2>${escapeHtml(heading)}</h2><div class="guide-card-grid">${guides.map(g=>`<a class="guide-card" href="${g.path}"><span>${tradeLabels[g.trade]} guide</span><h3>${escapeHtml(g.label)}</h3><p>${escapeHtml(g.description)}</p><b>Read the guide <span aria-hidden="true">↗</span></b></a>`).join('')}</div></section>`;
}
export function renderGuideTeaser(g) {
  return `<section class="directory-guide-card" id="guide" aria-labelledby="directory-guide-title"><div><p class="kicker">BEFORE YOU BOOK</p><h2 id="directory-guide-title">A little clarity before you choose.</h2><p>${escapeHtml(g.description)}</p></div><a class="btn btn-solid" href="${g.path}">Read the ${escapeHtml(g.label.toLowerCase())} guide <span aria-hidden="true">→</span></a></section>`;
}
export function renderEditorial(g, guides, {extra='',utility=false}={}) {
  const siblings=guides.filter(s=>s.trade===g.trade&&s.id!==g.id);
  const browse=utility?'/search/':`/${tradePaths[g.trade]}/`;
  return `<section class="editorial" id="guide" aria-label="${escapeHtml(g.h1)} guide"><div class="guide-layout"><aside class="guide-aside"><details open class="guide-toc"><summary>In this guide</summary><nav aria-label="On this page">${g.toc.map((item,i)=>`<a href="#${item.id}"><span>${String(i+1).padStart(2,'0')}</span>${escapeHtml(item.title)}</a>`).join('')}</nav></details><a class="btn btn-solid" href="${browse}">Compare companies <span aria-hidden="true">→</span></a></aside><article class="guide-article" data-editorial-id="${g.id}"><div class="guide-byline"><span>By HomezyPro editorial team</span><span>Updated <time datetime="${g.updated}">${new Date(g.updated+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}</time></span><span>${Math.ceil(g.words/220)} min read</span></div><div class="guide-copy">${g.body}</div>${extra}<div class="guide-editor-note"><strong>About this guide</strong><p>Practical guidance for comparing home services. Company details come from the HomezyPro directory; technical and regulatory points link to their sources. This is not a site inspection or a professional assessment of your home.</p><a href="/how-it-works/">How HomezyPro works</a></div><div class="guide-cta"><p class="kicker">YOUR NEXT STEP</p><h2>Find the right team for your home.</h2><p>Compare services, published prices and sourced reviews. Contact the company directly to confirm your job and availability.</p><a class="btn btn-solid" href="${browse}">Explore ${escapeHtml((tradeLabels[g.trade]||'home service').toLowerCase())} companies <span aria-hidden="true">→</span></a></div></article></div>${utility?'':guideCards(siblings,'Explore related guides')}</section>`;
}
// P1-12: one author name everywhere ("HomezyPro editorial team", as on the blog), an image, and real
// first-published and last-changed dates.
export function editorialSchema(g, origin, image) {
  const url=origin+'/'+g.slug+'/';
  const nodes=[{'@type':'Article','@id':url+'#guide',headline:g.h1,name:g.h1,url,description:g.description,inLanguage:'en-SG',dateModified:g.updated,datePublished:g.published||g.updated,...(image?{image}:{}),author:{'@type':'Organization',name:'HomezyPro editorial team',url:origin+'/how-it-works/'},publisher:{'@id':origin+'/#organization'},mainEntityOfPage:url,citation:g.sources.map(s=>s.url)}];
  if(g.faqs.length)nodes.push({'@type':'FAQPage',mainEntity:g.faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});
  return nodes;
}

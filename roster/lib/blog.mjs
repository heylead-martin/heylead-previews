import {readFile,readdir} from 'node:fs/promises';
import {escapeHtml,inline,plainText,wordCount} from './editorial.mjs';

// Blog posts: content/blog/<slug>.md with a small front matter block and the guide Markdown
// subset, plus three blocks of our own:
//   > Tip: text                      a callout
//   [[cta /roster/path/ | Button | Lead sentence]]   a call to action
//   [[rates KEY]]                    a sourced rate table (lib/sourced-rates.mjs key)
// Prices never appear in the prose; they come only from [[rates]] tables with attribution.
export const officialHosts = ['www.pub.gov.sg','www.ema.gov.sg','www.nea.gov.sg','www.hdb.gov.sg','www.police.gov.sg','www.scdf.gov.sg','www1.bca.gov.sg'];
export const blogAuthor = 'Roster editorial team';
const slugify = value => plainText(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

export function parseFrontMatter(markdown) {
  const m=markdown.match(/^---\n([\s\S]*?)\n---\n/);if(!m)throw new Error('Blog post needs front matter');
  const meta=Object.fromEntries(m[1].split('\n').map(line=>{const i=line.indexOf(':');return [line.slice(0,i).trim(),line.slice(i+1).trim()];}));
  return {meta,body:markdown.slice(m[0].length)};
}
// Prose chunks a reader sees, without directives, for word counts and number checks.
export const proseChunks = body => body.trim().split(/\n\s*\n/).filter(c=>!/^\[\[(cta|rates) /.test(c.trim()));

export function parseBlog(markdown, slug, {renderRates}) {
  const {meta,body}=parseFrontMatter(markdown);
  if(/[–—]|\[VERIFY\]/.test(body))throw new Error(`Unfinished copy in blog ${slug}`);
  const toc=[],faqs=[],sources=new Map();let faq=false,question=null,answers=[],ctas=0;
  const flush=()=>{if(question){faqs.push([question,answers.join(' ')]);question=null;answers=[];}};
  const html=body.trim().split(/\n\s*\n/).map(raw=>{
    const chunk=raw.trim();
    for(const m of chunk.matchAll(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g)){if(!officialHosts.includes(new URL(m[2]).host))throw new Error(`Blog ${slug}: external links must be official sources: ${m[2]}`);sources.set(m[2],m[1]);}
    let m;
    if((m=chunk.match(/^\[\[cta (\/roster\/[a-z0-9/-]*) \| ([^|]+) \| ([^\]]+)\]\]$/))){ctas++;return `<div class="guide-cta blog-cta" data-blog-cta><p class="kicker">NEXT STEP</p><p>${inline(m[3].trim())}</p><a class="btn btn-solid" href="${m[1]}">${escapeHtml(m[2].trim())} <span aria-hidden="true">→</span></a></div>`;}
    if((m=chunk.match(/^\[\[rates ([A-Za-z0-9-]+)\]\]$/))){const table=renderRates(m[1]);if(!table)throw new Error(`Blog ${slug}: rate table ${m[1]} has too few companies`);return table;}
    if(chunk.startsWith('[['))throw new Error(`Blog ${slug}: unknown block ${chunk}`);
    if(chunk.startsWith('## ')){flush();const title=chunk.slice(3).trim(),id=`${slug}-${slugify(title)}`;faq=/^questions$/i.test(title);toc.push({title,id});return `<h2 id="${id}">${inline(title)}</h2>`;}
    if(chunk.startsWith('### ')){flush();const title=chunk.slice(4).trim();if(faq)question=plainText(title);return `<h3>${inline(title)}</h3>`;}
    if(chunk.startsWith('> ')){const text=chunk.replace(/^> ?/gm,'').replace(/\n/g,' ');const [label,rest]=text.includes(': ')?[text.slice(0,text.indexOf(': ')),text.slice(text.indexOf(': ')+2)]:['Tip',text];return `<aside class="guide-editor-note blog-callout" data-blog-callout><strong>${escapeHtml(label)}</strong><p>${inline(rest)}</p></aside>`;}
    // Comparison tables: "Table: caption" on the line above, then a Markdown table.
    if(chunk.startsWith('Table: ')&&chunk.includes('\n|')){
      const [first,...lines]=chunk.split('\n'),caption=first.slice(7).trim();
      const rows=lines.map(r=>r.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));
      if(rows.length<3||!rows[1].every(c=>/^:?-+:?$/.test(c))||rows.some(r=>r.length!==rows[0].length))throw new Error(`Blog ${slug}: malformed table`);
      return `<div class="guide-table-scroll" tabindex="0" role="region" aria-label="${escapeHtml(caption)}"><table data-blog-table><caption>${inline(caption)}</caption><thead><tr>${rows[0].map(c=>`<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(2).map(r=>`<tr>${r.map((c,i)=>i===0?`<th scope="row">${inline(c)}</th>`:`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    if(chunk.startsWith('|'))throw new Error(`Blog ${slug}: a table needs a "Table: caption" line directly above it`);
    if(chunk.startsWith('- '))return `<ul>${chunk.split('\n').map(s=>`<li>${inline(s.replace(/^- /,''))}</li>`).join('')}</ul>`;
    if(faq&&question)answers.push(plainText(chunk.replace(/\n/g,' ')));
    return `<p>${inline(chunk.replace(/\n/g,' '))}</p>`;
  }).join('\n');
  flush();
  const words=proseChunks(body).reduce((n,c)=>n+wordCount(c),0);
  return {...meta,slug,path:`/roster/blog/${slug}/`,body:html,toc,faqs,ctas,sources:[...sources].map(([url,title])=>({url,title})),words,markdown:body};
}

export async function loadBlog(root, options) {
  const dir=`${root}/content/blog`;let files=[];
  try{files=(await readdir(dir)).filter(f=>f.endsWith('.md')).sort();}catch(e){if(e.code!=='ENOENT')throw e;}
  const posts=await Promise.all(files.map(async f=>parseBlog(await readFile(`${dir}/${f}`,'utf8'),f.replace(/\.md$/,''),options)));
  return posts.sort((a,b)=>b.updated.localeCompare(a.updated)||a.title.localeCompare(b.title));
}

// Review P1-9: a sitemap index (roster/sitemap.xml) with one child per page family, each URL with a
// <lastmod> from its content or data date. Only canonical, indexable-after-launch pages are listed:
// no utilities (search, claim, logo removal, accounts), no query URLs, no retired listings.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {absUrl} from './site-config.mjs';

const xmlEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const day = value => String(value || '').match(/\d{4}-\d{2}-\d{2}/)?.[0] || null;
const latest = dates => dates.map(day).filter(Boolean).sort().at(-1) || null;

// The newest dated fact on a company record (rating check, listing check, prices, enrichment).
export function companyLastmod(c, fallback) {
  const e = c.enrichment || {};
  return latest([c.googleRating?.checkedAt, c.listingDepth?.checkedAt, e.checkedAt, e.summary?.capturedAt, ...(e.priceLines || []).map(p => p.capturedAt)]) || fallback;
}

// families: [{name:'core', urls:[{path, lastmod}]}, ...]; writes nothing, returns {index, children}.
export function buildSitemaps(families) {
  const children = families.filter(f => f.urls.length).map(f => {
    const lastmod = latest(f.urls.map(u => u.lastmod));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${f.urls.map(u => `<url><loc>${xmlEsc(absUrl(u.path))}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
    return {file: `sitemap-${f.name}.xml`, lastmod, xml, count: f.urls.length};
  });
  const index = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${children.map(c => `<sitemap><loc>${xmlEsc(absUrl('/' + c.file))}</loc>${c.lastmod ? `<lastmod>${c.lastmod}</lastmod>` : ''}</sitemap>`).join('\n')}\n</sitemapindex>\n`;
  return {index, children};
}

// For checks that look for "<loc>URL</loc>": all child-sitemap entries as one string.
export const sitemapXml = async root => (await sitemapLocs(root)).map(u => `<loc>${xmlEsc(u.loc)}</loc>`).join('\n');
// For checks: every <loc> in the index's child sitemaps, read from roster/.
export async function sitemapLocs(root) {
  const index = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  if (!index.includes('<sitemapindex')) throw new Error('sitemap.xml must be a sitemap index');
  const out = [];
  for (const m of index.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const file = m[1].replaceAll('&amp;', '&').split('/').pop();
    const xml = await readFile(path.join(root, file), 'utf8');
    for (const u of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)) out.push({loc: u[1].replaceAll('&amp;', '&'), lastmod: u[2] || null, file});
  }
  return out;
}

// Child sitemaps: core, best, guides, towns, blog, companies.
import type {APIRoute} from 'astro';
import {sitemaps} from '../lib/render.mjs';

export function getStaticPaths() {
  return sitemaps.children.map(c => ({params: {family: c.file.replace(/^sitemap-|\.xml$/g, '')}, props: {xml: c.xml}}));
}
export const GET: APIRoute = ({props}) => new Response(props.xml, {headers: {'Content-Type': 'application/xml'}});

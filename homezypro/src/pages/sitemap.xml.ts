// Sitemap index (lib/sitemaps.mjs): one child per page family, absolute URLs from SITE_URL.
import type {APIRoute} from 'astro';
import {sitemaps} from '../lib/render.mjs';

export const GET: APIRoute = () => new Response(sitemaps.index, {headers: {'Content-Type': 'application/xml'}});

// robots.txt from the indexing switch (src/config/site.mjs): Disallow everything unless
// SITE_INDEXABLE=true and SITE_URL is on homezypro.com.
import type {APIRoute} from 'astro';
import {robotsTxt} from '../config/site.mjs';

export const GET: APIRoute = () => new Response(robotsTxt(), {headers: {'Content-Type': 'text/plain; charset=utf-8'}});

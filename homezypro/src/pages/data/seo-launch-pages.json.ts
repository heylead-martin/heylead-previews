// Candidate launch pages (roster data/seo-launch-pages.json): the canonical set the sitemap lists.
import type {APIRoute} from 'astro';
import {launchManifest} from '../../lib/render.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify(launchManifest, null, 2) + '\n', {headers: {'Content-Type': 'application/json'}});

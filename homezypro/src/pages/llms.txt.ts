// llms.txt (lib/llms.mjs): page families and absolute URLs, no company contact data.
import type {APIRoute} from 'astro';
import {llms} from '../lib/render.mjs';

export const GET: APIRoute = () => new Response(llms.short, {headers: {'Content-Type': 'text/plain; charset=utf-8'}});

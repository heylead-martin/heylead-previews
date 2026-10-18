import type {APIRoute} from 'astro';
import {llms} from '../lib/render.mjs';

export const GET: APIRoute = () => new Response(llms.full, {headers: {'Content-Type': 'text/plain; charset=utf-8'}});

// Versioned directory indexes for the client catalogue (filters, sort, load more).
import type {APIRoute} from 'astro';
import {catalogueIndexes} from '../../../lib/render.mjs';

export function getStaticPaths() {
  return Object.keys(catalogueIndexes).map(name => ({params: {name}}));
}
export const GET: APIRoute = ({params}) =>
  new Response(catalogueIndexes[params.name as string], {headers: {'Content-Type': 'application/json'}});

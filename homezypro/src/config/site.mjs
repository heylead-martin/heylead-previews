// The one place for the public address and the indexing switch.
// Canonicals, og:url, JSON-LD ids, robots meta, robots.txt and (later) sitemaps all derive from here.
//
//   SITE_URL         public origin, default https://homezypro.com
//   SITE_INDEXABLE   "true" to allow indexing; takes effect only when SITE_URL's host is the
//                    production host. Everything else (previews, staging, local) stays noindex.
//
// Cloudflare Pages sets CF_PAGES=1 and CF_PAGES_BRANCH on every build. Set SITE_INDEXABLE=true only
// in the Production environment's variables. As a second guard, a Cloudflare build of any branch other
// than the production branch (HOMEZYPRO_PRODUCTION_BRANCH, default "main") is never indexable, even if
// SITE_INDEXABLE=true leaks into the Preview environment. public/_headers also sends
// X-Robots-Tag: noindex on every *.pages.dev host.
export const BRAND = 'HomezyPro';
export const PRODUCTION_HOST = 'homezypro.com';
export const SITE_URL = (process.env.SITE_URL || 'https://homezypro.com').replace(/\/+$/, '');

export function isIndexable(env = process.env) {
  const url = (env.SITE_URL || 'https://homezypro.com').replace(/\/+$/, '');
  if (env.SITE_INDEXABLE !== 'true' || new URL(url).hostname !== PRODUCTION_HOST) return false;
  if (env.CF_PAGES === '1' && env.CF_PAGES_BRANCH !== (env.HOMEZYPRO_PRODUCTION_BRANCH || 'main')) return false;
  return true;
}
export const INDEXABLE = isIndexable();

// "/plumbing/" -> "https://homezypro.com/plumbing/"
export const absUrl = pathname => SITE_URL + String(pathname);

// Pages that stay "noindex, follow" even when indexable (utilities, forms, search, 404).
export const UTILITY_PATHS = /^\/(?:search|claim-listing|logo-removal|404)\/$/;
export function robotsFor(canonicalPath, indexable = INDEXABLE) {
  if (!indexable) return 'noindex, nofollow, noarchive';
  return UTILITY_PATHS.test(canonicalPath) ? 'noindex, follow' : 'index, follow';
}

export function robotsTxt(indexable = INDEXABLE, siteUrl = SITE_URL) {
  return indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
    : `# Preview build. Every HTML page also carries noindex.\nUser-agent: *\nDisallow: /\n`;
}

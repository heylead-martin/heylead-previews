// One place for the public address of the site (review P0-1) and the launch switch (P0-3).
// Canonical links, og:url, JSON-LD @id/url, the Organization logo, the sitemaps and llms.txt all
// use absUrl(), so moving to a production domain is a one-line change here (or SITE_ORIGIN=... at
// build time). Internal links stay root-relative under /roster/; see docs/LAUNCH.md.
export const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://previews.heylead.com').replace(/\/$/, '');
export const SITE_BASE = process.env.SITE_BASE ?? '/roster';
// LAUNCH stays false until Martin approves launch. While false, every page keeps
// "noindex, nofollow, noarchive" and roster/robots.txt keeps "Disallow: /roster/".
export const LAUNCH = process.env.LAUNCH === 'true';
export const origin = SITE_ORIGIN + SITE_BASE;
// "/roster/plumbing/" -> "https://previews.heylead.com/roster/plumbing/"
export const absUrl = pathname => origin + String(pathname).replace(/^\/roster(?=\/|$)/, '');

// Pages that stay "noindex, follow" even after launch (utilities, forms, account pages).
export const UTILITY_PATHS = /^\/roster\/(?:search|claim-listing|logo-removal|matches|saved|account|auth\/callback|sign-in|sign-up|forgot-password|reset-password)\/$/;
export const robotsFor = canonicalPath => !LAUNCH ? 'noindex, nofollow, noarchive' : UTILITY_PATHS.test(canonicalPath) ? 'noindex, follow' : 'index, follow';

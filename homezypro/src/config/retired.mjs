// Withdrawn listings (from roster build.mjs `retired`). Each gets a 301 to its hub in dist/_redirects
// and a noindex HTML fallback, unless the company is published again.
export const retiredListings = [
  {slug: 'skywave-solutions-pte-ltd', name: 'Skywave Solutions Pte. Ltd.', target: '/electrician/', trade: 'electrical'},
  {slug: 'billy-aircon', name: 'Billy Aircon', target: '/aircon-servicing/', trade: 'aircon servicing'},
  {slug: 'aeon-environmental-services', name: 'Aeon Environmental Services', target: '/home-cleaning/', trade: 'home cleaning'},
  {slug: 'city-cleaning', name: 'City Cleaning', target: '/home-cleaning/', trade: 'home cleaning'},
  {slug: 'greengarden-integrated-services-pte-ltd', name: 'Greengarden Integrated Services Pte Ltd', target: '/home-cleaning/', trade: 'home cleaning'},
  {slug: 'sq-1-development-pte-ltd', name: 'SQ 1 Development Pte Ltd', target: '/home-cleaning/', trade: 'home cleaning'},
  {slug: 'flash-aircon', name: 'Signature Engineering Services Pte Ltd', target: '/aircon-servicing/', trade: 'aircon servicing'},
  {slug: 'reliable-electrical-services', name: 'Reliable Electrical Services', target: '/electrician/', trade: 'electrical'},
  // r15.1: withheld (needs-human-review) after being published under r15.
  {slug: 'hedircool-pte-ltd', name: 'HEDIRCOOL Pte. Ltd.', target: '/plumbing/', trade: 'plumbing'}
];

export const redirectsFile = (published = new Set()) => retiredListings
  .filter(r => !published.has(r.slug))
  .map(r => `/company/${r.slug}/ ${r.target} 301\n/company/${r.slug} ${r.target} 301`)
  .join('\n') + '\n';

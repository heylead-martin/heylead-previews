// Markets. HomezyPro is the brand; Singapore is the first market. Only `sg` is built.
// `us` and `au` are placeholders for later rounds: no routes, data or copy exist for them, and
// the build refuses to use a market whose status is not "active".
export const markets = {
  sg: {
    id: 'sg',
    status: 'active',
    name: 'Singapore',
    country: 'SG',
    locale: 'en-SG',
    ogLocale: 'en_SG',
    currency: 'SGD',
    currencySymbol: 'S$',
    // Routes are root-relative for the launch market (no /sg/ prefix), matching roster's paths.
    pathPrefix: '',
    trades: ['aircon', 'plumbing', 'electrician', 'handyman', 'cleaning']
  },
  us: {id: 'us', status: 'placeholder', name: 'United States', country: 'US', locale: 'en-US', currency: 'USD'},
  au: {id: 'au', status: 'placeholder', name: 'Australia', country: 'AU', locale: 'en-AU', currency: 'AUD'}
};

export const ACTIVE_MARKET_ID = process.env.HOMEZYPRO_MARKET || 'sg';
export const activeMarket = markets[ACTIVE_MARKET_ID];
if (!activeMarket || activeMarket.status !== 'active') {
  throw new Error(`Market "${ACTIVE_MARKET_ID}" is not active. Only active markets can be built.`);
}

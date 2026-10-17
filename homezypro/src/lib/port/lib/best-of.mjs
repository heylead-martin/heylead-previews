// Best-rated pages: one per trade, ranked only on the dated, linked Google rating.
// Never uses `rating` (sometimes a Trustindex or Wanderlog mirror), selfReportedRating,
// Trustpilot, Carousell, Yelp or any other source. No paid placement and no manual reordering.
//
// score = (n * r + K * m) / (n + K): small review counts are pulled toward m, so a few perfect
// reviews do not outrank hundreds of strong ones (5.0 from 20 scores 4.64; 4.8 from 900 scores 4.78).
// The page prints m, K and the review minimum from this constant.
export const BEST_OF = {m: 4.5, K: 50, minReviews: 20, top: 20};

// Businesses whose own website shows a different main trade. They stay in the directory; they are
// left out of the trade's ranking and the page says so. Not a ranking override: no one is moved up.
export const TRADE_MISMATCH = {
  'the-good-husband-laundromats-drycleaners-serangoon': 'a self-service laundromat and dry cleaner; its website describes laundry machines, not cleaning visits to homes'
};

export const bestOfScore = (r, n, {m, K} = BEST_OF) => (n * r + K * m) / (n + K);

// The dated Google rating, or null when any part is missing.
export function googleRating(company) {
  const g = company.googleRating;
  if (!g || !Number.isFinite(g.value) || g.value < 0 || g.value > 5) return null;
  if (!Number.isInteger(g.count) || g.count < 1) return null;
  if (!/^https?:\/\//.test(g.sourceUrl || '') || !/^\d{4}-\d{2}-\d{2}/.test(g.checkedAt || '')) return null;
  return g;
}

// Scores as exact fractions so ties are exact: ratings carry one decimal, so r*10 is an integer.
const fraction = (g, {m, K}) => ({num: g.count * Math.round(g.value * 10) + K * Math.round(m * 10), den: 10 * (g.count + K)});
const compare = (a, b) => b.num * a.den - a.num * b.den;

export function rankBestOf(companies, trade, config = BEST_OF, mismatch = TRADE_MISMATCH) {
  const inTrade = companies.filter(c => c.publish !== false && (c.primaryTrade || c.category) === trade && c.listingDepth);
  const excluded = inTrade.filter(c => mismatch[c.slug]).map(c => ({company: c, reason: mismatch[c.slug]}));
  const rated = inTrade.filter(c => !mismatch[c.slug] && googleRating(c));
  const qualifiers = rated.filter(c => c.googleRating.count >= config.minReviews)
    .map(c => ({company: c, rating: c.googleRating, score: bestOfScore(c.googleRating.value, c.googleRating.count, config), f: fraction(c.googleRating, config)}))
    .sort((a, b) => compare(a.f, b.f) || b.rating.count - a.rating.count || a.company.name.localeCompare(b.company.name));
  // Competition ranking (1, 1, 3). A tie group that would run past `top` is left out whole.
  const ranked = [];let cut = null;
  for (let i = 0; i < qualifiers.length && i < config.top;) {
    let j = i;while (j + 1 < qualifiers.length && compare(qualifiers[i].f, qualifiers[j + 1].f) === 0) j++;
    if (j + 1 > config.top) {cut = qualifiers.slice(i, j + 1);break;}
    for (let k = i; k <= j; k++) ranked.push({...qualifiers[k], rank: i + 1, tied: j > i});
    i = j + 1;
  }
  const dates = ranked.map(r => r.rating.checkedAt.slice(0, 10)).sort();
  return {trade, candidates: inTrade.length, rated: rated.length, qualifiers, ranked, cut, excluded, firstChecked: dates[0], lastChecked: dates.at(-1)};
}

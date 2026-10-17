import {weightedRating} from '../assets/review-model.mjs';

// Real source records only. Sample fixtures never enter this calculation.
// Martin, 18 Oct 2026 (review P1-4): the headline rating is the Google Maps rating alone. Carousell,
// Yelp and other sources are never blended in; company pages show them as separate sentences
// (lib/expanded.mjs). Trustpilot, mirrors and self-reported scores never count.
export function ratingSummary(company) {
  const candidates = [];
  if (company.googleRating) {
    const g = company.googleRating;
    candidates.push({name:'Google Maps',rating:g.value,count:g.count,scale:5,sourceUrl:g.sourceUrl,checkedAt:g.checkedAt});
  } else if (company.rating && !company.selfReportedRating && /(^|\.)google\.com$/.test(new URL(company.rating.sourceUrl).hostname)) {
    const r = company.rating;
    candidates.push({name:'Google Maps',rating:r.value,count:r.count,scale:5,sourceUrl:r.sourceUrl,checkedAt:'2026-10-10'});
  } else {
    candidates.push(...(company.reviewSources || company.enrichment?.reviewSources || []).filter(s => /^google maps$/i.test(s.name || '')));
  }
  const seen = new Set();
  const sources = candidates.filter(s => {
    const id = String(s.name || '').toLowerCase().replace(/^google maps$/, 'google');
    const host = url => {try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}};
    const ownSite = company.website?.value && host(s.sourceUrl) === host(company.website.value);
    if (!id || ownSite || /trustpilot|widget|company website|self.reported/i.test(id) || seen.has(id) || s.mirrorsSource || s.scale !== 5 || !Number.isFinite(s.rating) || s.rating < 0 || s.rating > 5 || !/^https?:\/\//.test(s.sourceUrl || '') || !/^\d{4}-\d{2}-\d{2}/.test(s.checkedAt || '')) return false;
    seen.add(id);
    return true;
  });
  const countable = sources.filter(s => Number.isInteger(s.count) && s.count > 0);
  if (countable.length) {
    const result = weightedRating(countable);
    return {value:result.rating,count:result.count,sourceCount:result.sources,sources:countable};
  }
  if (sources.length === 1) return {value:sources[0].rating,count:null,sourceCount:1,sources};
  return null;
}

// Illustrative fixtures only. Never use these records for real ratings or schema.
export const sampleSources = [
  {name:'Google', rating:4.8, count:200, mark:'G'},
  {name:'Trustpilot', rating:4.6, count:80, mark:'T'},
  {name:'Yelp', rating:4.4, count:30, mark:'Y'},
  {name:'Houzz', rating:4.5, count:20, mark:'H'},
  {name:'Reviews.io', rating:4.9, count:20, mark:'R'}
];
export function weightedRating(sources) {
  const included = sources.filter(s => s.scale === undefined || s.scale === 5).filter(s => !s.mirrorsSource && Number.isFinite(s.rating) && s.rating >= 0 && s.rating <= 5 && Number.isInteger(s.count) && s.count > 0);
  const count = included.reduce((total, s) => total + s.count, 0);
  return {rating:count ? included.reduce((total, s) => total + s.rating * s.count, 0) / count : null, count, sources:included.length};
}

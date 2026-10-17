export const normaliseName = value => String(value || '').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export function companyMatch(value, companies) {
  const query = normaliseName(value);
  const exact = companies.filter(c => c.slug === value || normaliseName(c.name) === query);
  if (exact.length === 1) return exact[0];
  if (query.length < 3 || exact.length > 1) return null;
  const partial = companies.filter(c => normaliseName(c.name).includes(query));
  return partial.length === 1 ? partial[0] : null;
}

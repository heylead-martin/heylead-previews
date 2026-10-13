const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderQuoteEvidence(evidence) {
  if (!evidence) return '';
  return `<span class="quote-evidence"><a href="${esc(evidence.sourceUrl)}">Their site: &quot;${esc(evidence.excerpt)}&quot;</a><span>Captured ${esc(evidence.capturedAt)}</span></span>`;
}
export function renderSelfReported(rating) {
  if (!rating || !Number.isFinite(rating.rating) || !Number.isInteger(rating.count) || !/^https?:\/\//.test(rating.source_url || rating.sourceUrl || '')) return '';
  return `<p class="self-reported-rating"><a href="${esc(rating.source_url || rating.sourceUrl)}">The company says it has a ${rating.rating.toFixed(1)} rating from ${rating.count.toLocaleString('en-SG')} reviews on its own site.</a></p>`;
}
export const noRatingText = 'No ratings found yet. We list ratings only from dated, linked sources.';
export const logoOwnerNote = '<span class="logo-owner-note">Logos belong to their owners. <a href="/roster/logo-removal/">Ask us to remove one.</a></span>';

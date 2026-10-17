const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderQuoteEvidence(evidence) {
  if (!evidence) return '';
  return `<span class="quote-evidence"><a href="${esc(evidence.sourceUrl)}">Their site: &quot;${esc(evidence.excerpt)}&quot;</a></span>`;
}
export function renderSelfReported(rating) {
  if (!rating || !Number.isFinite(rating.rating) || rating.rating < 0 || rating.rating > 5 || !/^https?:\/\//.test(rating.source_url || rating.sourceUrl || '')) return '';
  const prefix = `The company says it has a ${rating.rating.toFixed(1)} rating`;
  const render = sentence => `<p class="self-reported-rating"><a href="${esc(rating.source_url || rating.sourceUrl)}">${sentence}</a></p>`;
  if (rating.count_conflict === true) return render(`${prefix} on its own site; its pages give different review counts.`);
  if (!Number.isInteger(rating.count) || rating.count < 0) return render(`${prefix} on its own site.`);
  const count = rating.count.toLocaleString('en-SG');
  // Older releases keep the qualifier in the excerpt rather than a separate field.
  const number = `(?:${count}|${rating.count})`;
  const excerpt = String(rating.excerpt || '');
  const qualifier = rating.count_qualifier ?? (
    new RegExp(`\\b(?:more than|over)\\s+${number}(?!\\d|,\\d)`, 'i').test(excerpt) ? 'more_than' :
    new RegExp(`(?:^|[^\\d,])${number}\\s*\\+`).test(excerpt) ? 'plus' : 'exact'
  );
  const displayCount = qualifier === 'more_than' ? `more than ${count}` : qualifier === 'plus' ? `${count}+` : count;
  return render(`${prefix} from ${displayCount} ${rating.count === 1 && qualifier === 'exact' ? 'review' : 'reviews'} on its own site.`);
}
export function ratingSourceNote(note) {
  return String(note || '').replace(/(?:^|\s+)The sort uses\b.*?(?:\.(?=\s|$)|$)/gi, '').trim();
}
export const noRatingText = 'No ratings found yet. We list ratings only from dated, linked sources.';
export const logoOwnerNote = '<span class="logo-owner-note">Logos belong to their owners. <a href="/logo-removal/">Ask us to remove one.</a></span>';

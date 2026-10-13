import {noRatingText} from './evidence-display.mjs';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderAverage(average, href, large=false) {
  if (!average) return `<a class="average-rating average-rating-empty${large?' average-rating-large':''}" href="${esc(href)}"><span class="average-label">Reviews</span><span>${noRatingText}</span></a>`;
  const count = average.count === null ? 'Review count unavailable' : `${average.count.toLocaleString('en-SG')} ${average.count === 1 ? 'review' : 'reviews'}`;
  const names = average.sources.map(s => s.name).join(' · ');
  return `<div class="average-rating${large?' average-rating-large':''}"><a class="average-main" href="${esc(href)}"><span class="average-score"><strong>${average.value.toFixed(1)}</strong><span>/ 5</span></span><span class="average-copy"><span class="average-label">Average rating</span><strong>${count}</strong><span>${average.sourceCount} ${average.sourceCount===1?'source':'sources'}${average.sourceCount>1?' · Weighted by review count':''}</span></span><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a><div class="average-sources">${large?`<span>${esc(names)}</span>`:''}${average.sources.map(s=>`<a href="${esc(s.sourceUrl)}">${esc(s.name)} <span>· ${esc(String(s.checkedAt).slice(0,10))}</span></a>`).join('')}</div></div>`;
}

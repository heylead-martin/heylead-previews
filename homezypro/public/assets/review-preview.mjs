import {sampleSources, weightedRating} from './review-model.mjs?v=20261011';
const root = document.querySelector('[data-review-preview]');
if (root) {
  const select = root.querySelector('[data-review-source-count]');
  select.addEventListener('change', () => {
    const count = Number(select.value), score = weightedRating(sampleSources.slice(0, count));
    root.querySelector('[data-combined-rating]').textContent = score.rating.toFixed(1);
    root.querySelector('[data-combined-count]').textContent = score.count.toLocaleString('en-SG');
    root.querySelector('[data-combined-sources]').textContent = score.sources;
    root.querySelectorAll('[data-review-source-row]').forEach((row, i) => { row.hidden = i >= count; });
  });
}

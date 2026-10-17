import test from 'node:test';
import assert from 'node:assert/strict';
import {BEST_OF,bestOfScore,rankBestOf,googleRating} from '../lib/best-of.mjs';

const g = (value, count, extra = {}) => ({value, count, sourceUrl: 'https://maps.google.com/?cid=1', checkedAt: '2026-10-10T18:00+03:00', ...extra});
const co = (slug, rating, more = {}) => ({slug, name: slug, primaryTrade: 'plumbing', category: 'plumbing', listingDepth: {full: true}, googleRating: rating, ...more});

test('settings are m = 4.5, K = 50 and a 20-review minimum', () => {
  assert.deepEqual([BEST_OF.m, BEST_OF.K, BEST_OF.minReviews, BEST_OF.top], [4.5, 50, 20, 20]);
});

test('5.0 from 20 reviews ranks below 4.8 from 900', () => {
  assert.ok(bestOfScore(5, 20) < bestOfScore(4.8, 900));
  assert.equal(bestOfScore(5, 20).toFixed(2), '4.64');
  assert.equal(bestOfScore(4.8, 900).toFixed(2), '4.78');
  const {ranked} = rankBestOf([co('small', g(5, 20)), co('large', g(4.8, 900))], 'plumbing');
  assert.deepEqual(ranked.map(r => r.company.slug), ['large', 'small']);
});

test('only the dated, linked Google rating counts; rating, self-reported and other sources never do', () => {
  const list = [
    co('mirror', g(4.0, 30), {rating: {value: 5, count: 5000}, selfReportedRating: {value: 5, count: 9000}, reviewSources: [{name: 'Trustpilot', rating: 5, count: 9999}]}),
    co('undated', g(5, 500, {checkedAt: ''})),
    co('unlinked', g(5, 500, {sourceUrl: ''})),
    co('no-count', g(5, null)),
    co('rating-only', null, {rating: {value: 5, count: 5000, sourceUrl: 'https://maps.google.com/?cid=2'}}),
    co('few', g(5, 19))
  ];
  const r = rankBestOf(list, 'plumbing');
  assert.deepEqual(r.ranked.map(x => x.company.slug), ['mirror']);
  assert.equal(r.ranked[0].rating.value, 4.0);
  assert.equal(googleRating(list[1]), null);
});

test('only the primary trade and published companies qualify', () => {
  const r = rankBestOf([co('a', g(5, 100)), co('b', g(5, 100), {primaryTrade: 'handyman'}), co('c', g(5, 100), {publish: false})], 'plumbing');
  assert.deepEqual(r.ranked.map(x => x.company.slug), ['a']);
});

test('exact ties share a rank (1, 1, 3)', () => {
  const r = rankBestOf([co('x', g(4.9, 200)), co('y', g(4.9, 200)), co('z', g(4.8, 200))], 'plumbing');
  assert.deepEqual(r.ranked.map(x => [x.company.slug, x.rank, x.tied]), [['x', 1, true], ['y', 1, true], ['z', 3, false]]);
});

test('a tie group that runs past the top 20 is left out whole', () => {
  const list = Array.from({length: 19}, (_, i) => co(`top-${String(i).padStart(2, '0')}`, g(5, 1000 - i)));
  list.push(co('tie-a', g(4.5, 100)), co('tie-b', g(4.5, 100)));
  const r = rankBestOf(list, 'plumbing');
  assert.equal(r.ranked.length, 19);
  assert.deepEqual(r.cut.map(x => x.company.slug).sort(), ['tie-a', 'tie-b']);
});

test('trade mismatches are listed as excluded, never ranked', () => {
  const r = rankBestOf([co('shop', g(5, 900)), co('ok', g(4.9, 900))], 'plumbing', BEST_OF, {shop: 'a shop'});
  assert.deepEqual(r.ranked.map(x => x.company.slug), ['ok']);
  assert.deepEqual(r.excluded.map(x => x.company.slug), ['shop']);
});

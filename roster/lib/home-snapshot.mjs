import {renderSearchHero} from './job-search.mjs';
import {createHash} from 'node:crypto';
import {ratingSummary} from './rating-summary.mjs';
import {tidyPriceLabel} from './profile-copy.mjs';
import {isFromPrice, rateCell, money} from './sourced-rates.mjs';
import {unitRowProblem} from './aircon-matrix.mjs';

export const snapshotTrades = [
  {id:'aircon', name:'Aircon', noun:'aircon companies', slug:'aircon-servicing', icon:'aircon', job:'general-service', label:'General aircon service', unit:'per unit', note:'Multi-unit minimums may apply.'},
  {id:'plumbing', name:'Plumbing', noun:'plumbers', slug:'plumbing', icon:'tap', job:'choke-clearing', label:'Toilet choke clearing', unit:'per job', note:'Scope and call-out fees vary.'},
  {id:'electrician', name:'Electrician', noun:'electricians', slug:'electrician', icon:'bolt', job:'power-point', label:'Power-point installation', unit:'per point', note:'Wiring and materials vary.'},
  {id:'handyman', name:'Handyman', noun:'handymen', slug:'handyman', icon:'wrench', job:'drilling-mounting', label:'TV wall mounting', unit:'per job', note:'Brackets may cost extra.'},
  {id:'cleaning', name:'Cleaning', noun:'cleaners', slug:'home-cleaning', icon:'sparkle', job:'regular-cleaning', label:'Regular home cleaning', unit:'per hour', note:'Minimum hours or repeat bookings may apply.'}
];

export function verifiedHomePin(company, pin) {
  return pin?.status === 'verified' && pin.precision === 'building'
    && pin.addressHash === createHash('sha256').update(company.address?.value || '').digest('hex')
    && Number.isFinite(pin.latitude) && pin.latitude > 1.15 && pin.latitude < 1.48
    && Number.isFinite(pin.longitude) && pin.longitude > 103.59 && pin.longitude < 104.1;
}

// Price comparisons use one advertised starting rate per company for a named job.
// Do not mix hourly totals, packages, annual contracts or unrelated work.
export function eligibleHomePrice(price, trade) {
  if (price.job !== trade.job || !Number.isFinite(price.amount_sgd) || price.amount_sgd <= 0
      || !/^https?:\/\//.test(price.sourceUrl || '') || !/^\d{4}-\d{2}-\d{2}/.test(price.capturedAt || '')) return false;
  const name = price.service || '';
  const scope = [name, price.unit, price.excerpt, price.price_text].join(' ');
  if (price.promo || price.indicative || /indicative|cost guide|market rate|industry average|typical (?:cost|price)|annual|yearly|quarterly|trial|first.time|promotion/i.test(scope)) return false;
  // Same one-unit rule as the units matrix: no additional-unit, minimum-quantity or multi-unit rates.
  if (trade.id === 'aircon') return price.unit === 'per unit' && (price.units_in_price || 1) === 1 && !/chemical|overhaul|gas|install|cassette|repair|additional/i.test(name) && !unitRowProblem({units_in_price:1,...price});
  if (trade.id === 'cleaning') return price.unit === 'per hour' && !price.unitInferred && !/deep|spring|move.out|move.in|office|post.renovation/i.test(name);
  if (!['per job','per point','as printed'].includes(price.unit) || (price.units_in_price || 1) !== 1 || (price.qty || 1) > 1) return false;
  if (trade.id === 'plumbing') return /toilet.*(?:chok|clog)|(?:chok|clog).*toilet/i.test(name) && !/sink|floor.?trap|pipe/i.test(name);
  if (trade.id === 'electrician') return /power.*point|power.*socket|(?:additional|install|13a).*socket/i.test(name) && !/replac|double|heater|isolator|light|oven|hob|switch/i.test(name);
  return /tv.*(?:mount|bracket)|(?:mount|bracket).*tv/i.test(name) && !/mirror|shelf|shelves|fan|cabinet/i.test(name);
}

export function buildHomeSnapshot(companies, pins, presentation) {
  const active = companies.filter(c => c.publish !== false);
  const stats = {};
  for (const id of ['all', ...snapshotTrades.map(t => t.id)]) {
    const rows = active.filter(c => id === 'all' || c.category === id);
    const ratings = rows.map(ratingSummary).filter(Boolean);
    stats[id] = {total:rows.length, mapped:rows.filter(c => verifiedHomePin(c, pins[c.slug])).length,
      priced:rows.filter(c => presentation[c.slug]?.published).length,
      whatsapp:rows.filter(c => c.whatsapp?.value).length, rated:ratings.length,
      average:ratings.length ? (ratings.reduce((sum,r) => sum+r.value, 0) / ratings.length).toFixed(1) : null};
  }
  const prices = Object.fromEntries(snapshotTrades.map(trade => {
    const samples = active.filter(c => c.category === trade.id).flatMap(c => {
      const candidates = (c.enrichment?.priceLines || []).filter(p => eligibleHomePrice(p, trade)).sort((a,b) => a.amount_sgd-b.amount_sgd);
      if (!candidates.length) return [];
      const p = candidates[0];
      return [{slug:c.slug,name:c.name,amount:p.amount_sgd,service:tidyPriceLabel(p.service),sourceUrl:p.sourceUrl,checkedAt:p.capturedAt,
        unit:p.unit,unitInferred:!!p.unitInferred,condition:p.price_text || p.excerpt || '',gst:p.gst || 'not stated',from:isFromPrice(p),rate:rateCell(p)}];
    });
    return [trade.id,{samples, average:samples.length >= 3 ? Math.round(samples.reduce((sum,s)=>sum+s.amount,0)/samples.length) : null}];
  }));
  const points = active.filter(c => verifiedHomePin(c,pins[c.slug])).map(c => ({trade:c.category,latitude:pins[c.slug].latitude,longitude:pins[c.slug].longitude}));
  return {stats,prices,points};
}

const project = ([lng,lat]) => [25+(lng-103.59)*1700,18+(1.49-lat)*1700];
function mapSvg(outline, points) {
  const path = rings => rings.map(ring => ring.map((p,i) => `${i?'L':'M'}${project(p).map(n=>n.toFixed(1)).join(',')}`).join('')+'Z').join('');
  const layers = ['context','land','park','water'].map(kind => `<g class="map-${kind}">${outline.features.filter(f=>f.kind===kind).map(f=>`<path d="${path(f.rings)}"/>`).join('')}</g>`).join('');
  const dots = snapshotTrades.map(t => `<g data-map-dots="${t.id}">${points.filter(p=>p.trade===t.id).map(p=>{const [x,y]=project([p.longitude,p.latitude]);return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2"/>`;}).join('')}</g>`).join('');
  const labels = [['Woodlands',103.778,1.454],['Yishun',103.842,1.448],['Jurong',103.704,1.340],['Ang Mo Kio',103.833,1.399],['Tampines',103.957,1.373],['City centre',103.866,1.277]].map(([name,lng,lat])=>{const [x,y]=project([lng,lat]);return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${name}</text>`;}).join('');
  return `<svg class="singapore-map" viewBox="0 0 900 540" role="img" aria-labelledby="home-map-title home-map-desc"><title id="home-map-title">Home-service businesses across Singapore</title><desc id="home-map-desc">Each dot is a business address matched to its building. Use the trade buttons to filter the map. Business addresses do not indicate service coverage.</desc><defs><pattern id="map-grid" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="currentColor" stroke-width=".5"/></pattern></defs><rect width="900" height="540" class="map-ocean"/><rect width="900" height="540" fill="url(#map-grid)" class="map-grid"/><g aria-hidden="true">${layers}<g class="map-dots">${dots}</g><g class="map-labels">${labels}<text x="465" y="481" class="map-sea-label">SINGAPORE STRAIT</text></g><g class="map-compass" transform="translate(848 65)"><path d="M0 24V-9M-5-2 0-9 5-2"/><text y="-20">N</text></g></g></svg>`;
}

export function renderHomeSnapshot({companies,pins,presentation,outline,checked,esc,icon}) {
  const data = buildHomeSnapshot(companies,pins,presentation), all=data.stats.all;
  const buttons = [{id:'all',name:'All services'},...snapshotTrades].map(t=>`<button type="button" data-map-filter="${t.id}" aria-pressed="${t.id==='all'}" aria-controls="home-map-view"><span class="map-filter-dot" aria-hidden="true"></span>${esc(t.name)}</button>`).join('');
  const pricing = snapshotTrades.map(t=>{
    const s=data.stats[t.id],p=data.prices[t.id];
    return `<article class="quick-trade" data-quick-trade="${t.id}"><div class="quick-trade-info"><div class="quick-trade-heading"><span class="quick-trade-icon">${icon(t.icon)}</span><h3>${esc(t.name)}</h3></div><p class="quick-job">${esc(t.label)}</p></div><div class="quick-quote"><p class="quick-price${p.average===null?' quick-price-unknown':''}">${p.average===null?'<strong>Ask for a quote</strong>':`<strong>S$${p.average}</strong><span>/ ${t.unit.replace('per ','')}</span>`}</p><p class="quick-sample">${p.average===null?'No comparable average':`Avg. · ${p.samples.length} companies`}</p></div><div class="quick-trade-footer"><div class="quick-rating" aria-label="${esc(s.average ? `Average company rating: ${s.average} out of 5` : 'No average rating available')}">${icon('star')}<strong>${s.average||'No rating'}</strong>${s.average?'<span>/5 avg.</span>':''}</div><a href="/roster/${t.slug}/" aria-label="Compare ${s.total} ${esc(t.noun)}">Compare ${s.total}${icon('arrow')}</a></div></article>`;
  }).join('');
  const methodology = snapshotTrades.map(t=>{const p=data.prices[t.id];return `<details class="price-sample"><summary>${esc(t.label)}<span>${p.samples.length} price sources</span></summary><p>${esc(t.note)} For job prices, the unit may be inferred from the named task. Confirm inclusions before booking.</p><ul>${p.samples.map(s=>`<li><div><a href="/roster/company/${s.slug}/#pricing">${esc(s.name)}</a><span>${esc(s.service)}</span></div><div><strong>${s.from ? 'From ' : ''}${money(s.amount)}</strong><a href="${esc(s.sourceUrl)}">Source · ${esc(s.checkedAt)}</a></div></li>`).join('')}</ul></details>`;}).join('');
  const clientData = JSON.stringify({stats:data.stats,trades:snapshotTrades.map(({id,name,noun,slug})=>({id,name,noun,slug}))}).replace(/</g,'\\u003c');
  return `${renderSearchHero({esc,icon,count:all.total})}
<section class="home-explorer" aria-labelledby="explorer-title" data-home-explorer><div class="explorer-heading"><div><p class="kicker">A LITTLE LOCAL KNOWLEDGE</p><h2 id="explorer-title">See where the help is.</h2></div></div>
<div class="map-filters" role="group" aria-label="Show businesses by trade">${buttons}</div><div class="home-map-layout"><div class="home-map-card" id="home-map-view"><div class="map-caption"><span><i aria-hidden="true"></i> Singapore</span><span data-map-count>${all.mapped} business locations</span></div>${mapSvg(outline,data.points)}<div class="map-foot"><span>Each dot is a business address matched to its building. Locations may overlap.</span><a href="${esc(outline.sourceUrl)}">Map: SLA / data.gov.sg</a></div></div>
<aside class="map-snapshot" aria-label="Directory at a glance"><p class="kicker" data-map-category>ALL HOME SERVICES</p><p class="snapshot-total"><strong data-map-total>${all.total}</strong><span>companies to explore</span></p><dl><div><dt>Avg. company rating</dt><dd><strong data-map-average>${all.average||'Not available'}</strong><span data-map-scale>${all.average?' / 5':''}</span></dd></div><div><dt>Publish prices</dt><dd data-map-priced>${all.priced}</dd></div><div><dt>On WhatsApp</dt><dd data-map-whatsapp>${all.whatsapp}</dd></div></dl><p class="snapshot-context" data-map-note>${all.mapped} addresses matched to a building. Companies may also travel beyond their base.</p><a class="btn btn-solid" data-map-browse href="/roster/search/">Explore all companies ${icon('arrow')}</a><p class="map-live sr-only" data-map-live aria-live="polite" aria-atomic="true"></p></aside></div><script type="application/json" data-home-stats>${clientData}</script></section>
<section class="quick-services" id="jobs" aria-labelledby="quick-title"><div class="quick-heading"><div><p class="kicker">A QUICK LOOK BEFORE YOU BOOK</p><h2 id="quick-title">What does a little help cost?</h2></div><p>Average advertised starting rates for common jobs. Your final quote depends on the work.</p></div><div class="quick-trades">${pricing}</div><p class="quick-price-note">Minimum bookings, materials and call-out fees may apply. See the price details below.</p><details class="snapshot-method"><summary>How these figures are calculated ${icon('chevron')}</summary><div><p>Prices are averages of the lowest matching advertised rate from each company, rounded to the nearest dollar. We compare one named job and unit at a time, exclude identifiable promotions and annual packages, and require at least three companies. Minimum bookings, GST, parts and call-out fees may differ. These are directory samples, not market-wide averages or quotes.</p><p>Company ratings are averaged equally across listings with an eligible rating. Each company's score already combines compatible sources by review count. Unrated companies and incompatible scores are excluded. Counts cover published listings; dots only show current addresses matched to a building.</p>${methodology}</div></details></section>
<section class="home-reassurance" aria-label="Why use Roster"><div>${icon('shield')}<strong>Unpaid listings</strong><span>Nobody buys their way up the list.</span></div><div>${icon('link')}<strong>Details you can check</strong><span>Prices and reviews link to their sources.</span></div><div>${icon('phone')}<strong>Talk to the team</strong><span>Call or WhatsApp the company directly.</span></div></section>`;
}

import {previewFeatures} from './features.mjs';
import {renderQuoteEvidence, noRatingText, logoOwnerNote} from './evidence-display.mjs?v=20261018-cards';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Cards: one square tile for real logos and initials alike, and no logo note (the footer and the
// company page carry it). The company page passes note=true.
export function renderLogo(c, large=false, note=large) {
  const initials=String(c.name).replace(/[^\p{L}\p{N}\s]/gu,'').trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
  const tile = `<div class="listing-logo${large?' listing-logo-large':''}${c.logo?' has-logo':''}" role="img" aria-label="${esc(c.logo?c.name+' logo':'Initials placeholder for '+c.name)}"><span aria-hidden="true">${esc(initials)}</span>${c.logo?`<img data-company-logo src="${esc(c.logo)}" alt="" width="80" height="80" loading="lazy">`:''}</div>`;
  return c.logo && note ? `<figure class="company-logo${large?' company-logo-large':''}">${tile}<figcaption>${logoOwnerNote}</figcaption></figure>` : tile;
}
const arrow='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const reviews=n=>n==null?'Review count unavailable':`${n.toLocaleString('en-SG')} ${n===1?'review':'reviews'}`;
// Card rating box: the Google Maps rating when there is one, named by its source and never dated.
export function cardRating(c, url) {
  const a=c.average;if(!a)return `<div class="average-rating average-rating-empty"><a class="average-main" href="${url}#reviews"><span class="average-copy"><span class="average-label">Reviews</span><span>${esc(noRatingText)}</span></span></a></div>`;
  const g=a.sources.find(s=>s.name==='Google Maps'&&Number.isFinite(s.rating));
  const value=g?g.rating:a.value,count=g?g.count:a.count,label=g?'Google Maps':a.sources.map(s=>s.name).join(' · ');
  return `<div class="average-rating"><a class="average-main" href="${url}#reviews"><span class="average-score"><strong>${value.toFixed(1)}</strong><span>/ 5</span></span><span class="average-copy"><span class="average-label">${esc(label)}</span><strong>${reviews(count)}</strong></span>${arrow}</a></div>`;
}
// Card price box: one label, the amount as published (keeping "From" and the unit) and one short line.
const amountText=p=>/^(?:from\s+)?S?\$\s*\d/i.test(String(p||''));
const firstLine=s=>String(s||'').replace(/\s*See service details for inclusions\.?/i,'').split(/(?<=\.)\s+/)[0].trim();
// Shared by cards and the company-page price box: "S$" amounts, "From" and the unit kept, cents paired.
export const shownPrice=(price,quote)=>amountText(price)?price.replace(/^(from\s+)?\$\s*/i,(m,f)=>`${f||''}S$`).replace(/(S?\$\d[\d,]*)\.(\d)(?!\d)/g,'$1.$20'):quote?'Quote on request':'Ask for a quote';
export const shownPriceLine=(price,detail,quote)=>amountText(price)?firstLine(detail):quote?'':'No published price found yet';
export function cardPrice(c) {
  const shown=shownPrice(c.price,c.quoteEvidence);
  const line=shownPriceLine(c.price,c.priceDetail,c.quoteEvidence);
  return `<span class="price-eyebrow">Example service price</span><strong>${esc(shown)}</strong>${c.quoteEvidence&&!amountText(c.price)?renderQuoteEvidence(c.quoteEvidence):''}${line?`<span class="price-context">${esc(line)}</span>`:''}`;
}
export function coverageBadges(c) {
 const labels=[c.areaMatch?.label,...(c.serviceAreas?.includes('Islandwide')?['Islandwide']:[])].filter(Boolean);
 return labels.length?`<div class="coverage-badges">${[...new Set(labels)].map(label=>`<span>${esc(label)}</span>`).join('')}</div>`:'';
}
export function renderCard(c,saved=false) {
  const url='/company/'+encodeURIComponent(c.slug)+'/';
  return `<li class="business-card catalogue-card" data-company data-name="${esc(c.name)}" data-slug="${esc(c.slug)}"><article><div class="business-top"><div class="business-identity">${renderLogo(c)}<div><p class="business-category">${esc(c.trade)} · ${esc(c.area)}</p><h2><a href="${url}">${esc(c.name)}</a></h2></div></div>${previewFeatures?`<button type="button" class="save-button" data-save="${esc(c.slug)}" aria-label="${saved?'Unsave':'Save'} ${esc(c.name)}" aria-pressed="${saved}"><svg viewBox="0 0 24 24" class="ic" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z"/></svg></button>`:''}</div>${coverageBadges(c)}<div class="business-highlights">${cardRating(c,url)}<div class="business-price"><div>${cardPrice(c)}</div></div></div>${c.offerings?.length?`<div class="business-offer"><span class="price-eyebrow">What they offer</span><p>${c.offerings.slice(0,4).map(esc).join(' · ')}${c.offerings.length>4?` <a href="${url}#pricing">+${c.offerings.length-4} more</a>`:''}</p></div>`:c.description?`<p class="business-fit">${esc(c.description)}</p>`:''}<div class="business-bottom"><a class="profile-link" href="${url}">View company <span aria-hidden="true">→</span></a><div class="business-contact">${c.phone?`<a href="tel:${esc(c.phone.replace(/[^\d+]/g,''))}">Call</a>`:''}${c.whatsapp?`<a href="https://wa.me/${esc(c.whatsapp.replace(/\D/g,''))}">WhatsApp</a>`:''}</div></div></article></li>`;
}

export function rankCompanies(rows, sort='evidence') {
  // Area coverage first, then primary-trade matches for a trade-word query, then the chosen sort.
  return [...rows].sort((a,b)=>((a.areaMatch?.rank??0)-(b.areaMatch?.rank??0))||((a.queryRank??0)-(b.queryRank??0))||(sort==='rating'?(b.ratingValue??-1)-(a.ratingValue??-1)||b.ratingCount-a.ratingCount||a.name.localeCompare(b.name):sort==='reviews'?b.ratingCount-a.ratingCount||a.name.localeCompare(b.name):sort==='name'?a.name.localeCompare(b.name):(b.evidenceScore||0)-(a.evidenceScore||0)||(b.ratingValue??-1)-(a.ratingValue??-1)||b.ratingCount-a.ratingCount||a.name.localeCompare(b.name)));
}
export function splitDirectory(rows, sort='evidence') {
  const ordered=rankCompanies(rows,sort);
  if(rows.some(c=>c.areaMatch))return {shortlist:[],others:ordered};
  const shortlist=ordered.filter(c=>c.fullProfile).slice(0,8);
  const selected=new Set(shortlist.map(c=>c.slug));
  return {shortlist,others:ordered.filter(c=>!selected.has(c.slug))};
}
export function renderCompactCard(c,saved=false) {
  const url='/company/'+encodeURIComponent(c.slug)+'/';
  return `<li class="compact-company" data-company data-name="${esc(c.name)}" data-slug="${esc(c.slug)}"><article><div class="compact-identity">${renderLogo(c)}<div><h3><a href="${url}">${esc(c.name)}</a></h3><p>${esc(c.area)}${c.fullProfile?'':' · Limited details'}</p></div>${previewFeatures?`<button type="button" class="save-button" data-save="${esc(c.slug)}" aria-label="${saved?'Unsave':'Save'} ${esc(c.name)}" aria-pressed="${saved}"><svg viewBox="0 0 24 24" class="ic" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z"/></svg></button>`:''}</div>${coverageBadges(c)}<div class="compact-highlights">${cardRating(c,url)}<div class="compact-price business-price"><div>${cardPrice(c)}</div></div></div>${c.offerings?.length?`<p class="compact-offerings">${c.offerings.slice(0,3).map(esc).join(' · ')}${c.offerings.length>3?` <a href="${url}#pricing">+${c.offerings.length-3} more</a>`:''}</p>`:''}<div class="compact-actions"><a href="${url}">${c.fullProfile?'View company':'View listing'} <span aria-hidden="true">→</span></a>${c.phone?`<a href="tel:${esc(c.phone.replace(/[^\d+]/g,''))}">Call ${esc(c.phone)}</a>`:''}</div></article></li>`;
}

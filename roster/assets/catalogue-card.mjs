import {renderAverage} from './rating-display.mjs?v=20261013-review';
import {previewFeatures} from './features.mjs';
import {renderQuoteEvidence, renderSelfReported, noRatingText, logoOwnerNote} from './evidence-display.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderLogo(c, large=false) {
  const initials=String(c.name).replace(/[^\p{L}\p{N}\s]/gu,'').trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
  const tile = `<div class="listing-logo${large?' listing-logo-large':''}${c.logo?' has-logo':''}" role="img" aria-label="${esc(c.logo?c.name+' logo':'Initials placeholder for '+c.name)}"><span aria-hidden="true">${esc(initials)}</span>${c.logo?`<img data-company-logo src="${esc(c.logo)}" alt="" width="80" height="80" loading="lazy">`:''}</div>`;
  return c.logo ? `<figure class="company-logo${large?' company-logo-large':''}">${tile}<figcaption>${logoOwnerNote}</figcaption></figure>` : tile;
}
export function coverageBadges(c) {
 const labels=[c.areaMatch?.label,...(c.serviceAreas?.includes('Islandwide')?['Islandwide']:[])].filter(Boolean);
 return labels.length?`<div class="coverage-badges">${[...new Set(labels)].map(label=>`<span>${esc(label)}</span>`).join('')}</div>`:'';
}
export function renderCard(c,saved=false) {
  const url='/roster/company/'+encodeURIComponent(c.slug)+'/';
  return `<li class="business-card catalogue-card" data-company data-name="${esc(c.name)}" data-slug="${esc(c.slug)}"><article><div class="business-top"><div class="business-identity">${renderLogo(c)}<div><p class="business-category">${esc(c.trade)} · ${esc(c.area)}</p><h2><a href="${url}">${esc(c.name)}</a></h2></div></div>${previewFeatures?`<button type="button" class="save-button" data-save="${esc(c.slug)}" aria-label="${saved?'Unsave':'Save'} ${esc(c.name)}" aria-pressed="${saved}"><svg viewBox="0 0 24 24" class="ic" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z"/></svg></button>`:''}</div>${coverageBadges(c)}<div class="business-highlights">${renderAverage(c.average,url+'#reviews')}${renderSelfReported(c.selfReportedRating)}<div class="business-price"><div><span class="price-eyebrow">${c.examplePrice?'Example service price':c.published?'Published pricing':'Pricing'}</span><strong>${esc(c.price)}</strong>${renderQuoteEvidence(c.quoteEvidence)}${c.priceDetail?`<span class="price-context">${esc(c.priceDetail)}</span>`:''}</div></div></div>${c.offerings?.length?`<div class="business-offer"><span class="price-eyebrow">What they offer</span><p>${c.offerings.slice(0,4).map(esc).join(' · ')}${c.offerings.length>4?` <a href="${url}#pricing">+${c.offerings.length-4} more</a>`:''}</p></div>`:c.description?`<p class="business-fit">${esc(c.description)}</p>`:''}<div class="business-bottom"><a class="profile-link" href="${url}">View company <span aria-hidden="true">→</span></a><div class="business-contact">${c.phone?`<a href="tel:${esc(c.phone.replace(/[^\d+]/g,''))}">Call</a>`:''}${c.whatsapp?`<a href="https://wa.me/${esc(c.whatsapp.replace(/\D/g,''))}">WhatsApp</a>`:''}</div></div></article></li>`;
}

export function rankCompanies(rows, sort='evidence') {
  return [...rows].sort((a,b)=>((a.areaMatch?.rank??0)-(b.areaMatch?.rank??0))||(sort==='rating'?(b.ratingValue??-1)-(a.ratingValue??-1)||b.ratingCount-a.ratingCount||a.name.localeCompare(b.name):sort==='reviews'?b.ratingCount-a.ratingCount||a.name.localeCompare(b.name):sort==='name'?a.name.localeCompare(b.name):(b.evidenceScore||0)-(a.evidenceScore||0)||(b.ratingValue??-1)-(a.ratingValue??-1)||b.ratingCount-a.ratingCount||a.name.localeCompare(b.name)));
}
export function splitDirectory(rows, sort='evidence') {
  const ordered=rankCompanies(rows,sort);
  if(rows.some(c=>c.areaMatch))return {shortlist:[],others:ordered};
  const shortlist=ordered.filter(c=>c.fullProfile).slice(0,8);
  const selected=new Set(shortlist.map(c=>c.slug));
  return {shortlist,others:ordered.filter(c=>!selected.has(c.slug))};
}
export function renderCompactCard(c,saved=false) {
  const url='/roster/company/'+encodeURIComponent(c.slug)+'/';
  return `<li class="compact-company" data-company data-name="${esc(c.name)}" data-slug="${esc(c.slug)}"><article><div class="compact-identity">${renderLogo(c)}<div><h3><a href="${url}">${esc(c.name)}</a></h3><p>${esc(c.area)}${c.fullProfile?'':' · Limited details'}</p></div>${previewFeatures?`<button type="button" class="save-button" data-save="${esc(c.slug)}" aria-label="${saved?'Unsave':'Save'} ${esc(c.name)}" aria-pressed="${saved}"><svg viewBox="0 0 24 24" class="ic" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z"/></svg></button>`:''}</div>${coverageBadges(c)}<div class="compact-highlights">${c.average?`<a class="compact-average" href="${url}#reviews"><strong>${c.average.value.toFixed(1)}<small> / 5</small></strong><span>Average · ${c.average.count===null?'Count unavailable':`${c.average.count.toLocaleString('en-SG')} ${c.average.count===1?'review':'reviews'}`}<small>${c.average.sourceCount} ${c.average.sourceCount===1?'source':'sources'}</small></span></a>`:`<span class="compact-no-rating">${noRatingText}</span>`}${renderSelfReported(c.selfReportedRating)}<div class="compact-price"><span>${c.examplePrice?'Example service price':'Pricing'}</span><strong>${esc(c.price)}</strong>${renderQuoteEvidence(c.quoteEvidence)}${c.examplePrice?`<small>${esc(c.priceDetail)}</small>`:''}</div></div>${c.offerings?.length?`<p class="compact-offerings">${c.offerings.slice(0,3).map(esc).join(' · ')}${c.offerings.length>3?` <a href="${url}#pricing">+${c.offerings.length-3} more</a>`:''}</p>`:''}<div class="compact-actions"><a href="${url}">${c.fullProfile?'View company':'View listing'} <span aria-hidden="true">→</span></a>${c.phone?`<a href="tel:${esc(c.phone.replace(/[^\d+]/g,''))}">Call ${esc(c.phone)}</a>`:''}</div></article></li>`;
}

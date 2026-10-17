import {previewFeatures} from '../assets/features.mjs';
import {renderQuoteEvidence,renderSelfReported,ratingSourceNote,noRatingText} from '../assets/evidence-display.mjs';
import {renderServiceAreas} from './service-areas.mjs';
import {createHash} from 'node:crypto';
import {ratingSummary} from './rating-summary.mjs';
import {absUrl} from './site-config.mjs';
import {renderAverage} from '../assets/rating-display.mjs';
import {profileIntro, profileAbout, readerNote, friendlyService} from './profile-copy.mjs';
import {renderLogo} from '../assets/catalogue-card.mjs';
import { blockAddress, priceOption } from '../scripts/import-db.mjs';
import {profileRowProblem} from './sourced-rates.mjs';
export function dateLabel(value) {
  const match=String(value||'').match(/\d{4}-\d{2}-\d{2}/);
  if(!match) return '10 Oct 2026';
  return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(match[0]+'T12:00:00Z'));
}
// Review P1-2: descriptions end at a sentence boundary within `max`. When the first sentence alone is
// too long, cut at the last clause comma (or word) and drop a dangling word, so a description never
// ends "...bookings are." or "...jobs across.".
export const DANGLING = /\b(?:a|an|the|and|or|of|to|in|on|at|for|with|by|from|across|are|is|was|were|be|been|has|have|its|their|our|your|that|which|who|as|into|than|including|such)$/i;
export function concise(text,max=155) {
  text=String(text).replace(/\s+/g,' ').trim();
  if(text.length<=max) return /[.?!)]$/.test(text)?text:text+'.';
  let out='';
  for(const s of text.match(/[^.!?]+(?:[.!?]+|$)(?:\s+|$)/g)||[]){if((out+s).trim().length>max)break;out+=s;}
  if(out.trim()&&/[.!?]$/.test(out.trim()))return out.trim();
  let cut=text.slice(0,max-1);const clause=cut.lastIndexOf(', ');
  cut=(clause>max*0.5?cut.slice(0,clause):cut.replace(/\s+\S*$/,'')).replace(/[,:;.!?\s(&-]+$/,'');
  while(DANGLING.test(cut))cut=cut.replace(/\s*\S+$/,'').replace(/[,:;\s(&-]+$/,'');
  return cut+'.';
}
export function ratingFact(c) {
  if(c.googleRating) {const g=c.googleRating;return {text:`Google Maps: ${g.value.toFixed(1)}${g.count?` from ${g.count.toLocaleString('en-SG')} ${g.count===1?'review':'reviews'}`:''} (checked ${dateLabel(g.checkedAt)})`,url:g.sourceUrl,value:g.value,count:g.count||0,google:true};}
  const r=c.rating;if(!r||c.selfReportedRating)return null;
  const host=new URL(r.sourceUrl).hostname;
  const google=/(^|\.)(google\.com|maps\.google\.com)$/.test(host);
  const own=c.website?.value&&host.replace(/^www\./,'')===new URL(c.website.value).hostname.replace(/^www\./,'');
  return {text:`${google?'Google Maps':own?'Company website reports':'Review mirror reports'}: ${r.value.toFixed(1)}${r.count?` from ${r.count.toLocaleString('en-SG')} ${r.count===1?'review':'reviews'}`:''} (checked 9-10 Oct 2026)`,url:r.sourceUrl,value:google?r.value:null,count:google?r.count||0:0,google};
}
// Company FAQ answers keep the company's answer and lose closing sales lines ("We'd love to talk
// about what matters to you.", "Contact us today!"). An answer that is only a sales line is kept.
const CTA_TAIL = /(?:(?<=[.!?])\s+(?:We(?:'|’)?d love to|We would love to|Contact us|Call us|WhatsApp us|Message us|Get in touch|Reach out|Book (?:now|today|with us|your)|Speak (?:to|with) us|Drop us|Feel free to|Don(?:'|’)t hesitate|Let us know|Give us a call)[^.!?]*(?:[.!?]+|$))+\s*$/i;
export const stripCta = answer => String(answer||'').replace(CTA_TAIL,'').trim() || String(answer||'');
export const notFetched = s => /not fetched|was not (?:read|fetched)|blocks automated/i.test(`${s.note||''} ${s.method||''}`);
export function structuredHours(hours) {
  if(!hours?.text)return undefined;
  const days={monday:'Mo',tuesday:'Tu',wednesday:'We',thursday:'Th',friday:'Fr',saturday:'Sa',sunday:'Su'};
  const time=(h,m,ampm)=>{let n=Number(h);if(ampm==='pm'&&n!==12)n+=12;if(ampm==='am'&&n===12)n=0;return `${String(n).padStart(2,'0')}:${m||'00'}`;};
  const result=[];
  for(const part of hours.text.split(';')) {
    const m=part.trim().toLowerCase().match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if(m) result.push(`${days[m[1]]} ${time(m[2],m[3],m[4])}-${time(m[5],m[6],m[7])}`);
  }
  return result.length?result:undefined;
}
export function directoryRecord(c,display,trade) {
  const average=ratingSummary(c);
  // Cards name the source and show the Google Maps figure; check dates stay in companies.json.
  if(average)average.sources=average.sources.map(({name,sourceUrl,rating,count})=>({name,sourceUrl,...(name==='Google Maps'?{rating,count}:{})}));
  return {fullProfile:!!c.listingDepth?.full,evidenceScore:c.listingDepth?.evidenceScore||0,slug:c.slug,name:c.name,category:c.category,categories:c.categories||[c.category],trade:trade.name,area:c.area||'Other Singapore locations',serviceAreas:[...new Set((c.enrichment?.serviceLocations||[]).map(a=>a.name))],description:c.enrichment?.supportedServices?.length?'':concise(profileIntro(c),180),logo:display.logo||'',price:display.price,...(display.quoteEvidence?{quoteEvidence:display.quoteEvidence}:{}),...(c.selfReportedRating?{selfReportedRating:c.selfReportedRating}:{}),examplePrice:!!display.examplePrice,priceDetail:concise(display.detail||'',100),published:!!display.published,average,offerings:(c.enrichment?.supportedServices||[]).map(s=>friendlyService(s.name,c.category)),ratingValue:average?.value??null,ratingCount:average?.count||0,phone:c.phone?.value||'',whatsapp:c.whatsapp?.value||'',hasReviews:!!c.reviews?.length,services:c.services||[]};
}
export function createProfileRenderer(ctx) {
  const {esc,icon,tradeById,profileContent,priceSummary,renderCrumbs,pageShell,webPage,crumbsLd,faqLd,profileBusinessGraph,forbidSchema,renderServiceRow,renderForm,operatorGroups,mapPins}=ctx;
  const tel=p=>'tel:'+p.replace(/[^\d+]/g,'');
  const wa=p=>'https://wa.me/'+p.replace(/\D/g,'');
  const link=(url,label)=>url?`<a href="${esc(url)}">${esc(label)}</a>`:'';
  const source=(url,date,label='Source')=>`<span class="data-source">${link(url,label)}${date?`<span>Checked ${esc(dateLabel(date))}</span>`:''}</span>`;
  const section=(id,kicker,title,body)=>body?`<section class="profile-section" id="${id}"><div class="profile-section-heading"><div><p class="kicker">${kicker}</p><h2>${esc(title)}</h2></div></div>${body}</section>`:'';
  function map(c,content) {
    if(!c.address?.value)return '';
    const address=blockAddress(c.address.value),redacted=address!==c.address.value;
    const stored=mapPins[c.slug];
    const pin=stored?.status==='verified'&&stored.addressHash===createHash('sha256').update(c.address.value).digest('hex')&&stored.precision==='building'&&stored.latitude>1.15&&stored.latitude<1.48&&stored.longitude>103.59&&stored.longitude<104.1?stored:null;
    const target=pin?`${pin.latitude},${pin.longitude}`:address;
    const query=encodeURIComponent(target);
    const embed=pin?`https://www.google.com/maps?q=${query}&z=17&output=embed`:'';
    return `<div class="company-map${pin?'':' company-map-unresolved'}">${embed?`<iframe src="${esc(embed)}" title="Building location for ${esc(c.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`:''}<div class="map-address"><span class="map-pin">${icon('pin')}</span><div><h3>${esc(address)}</h3><p>${pin?'Pin shows the building location. Contact the company before visiting.':'Published address. Confirm the location with the company before visiting.'}</p><a href="https://www.google.com/maps/${pin?'dir/':'search/'}?api=1&amp;${pin?'destination':'query'}=${query}">${pin?'Get directions':'Look up this address'}${icon('arrow')}</a></div></div></div>`;
  }
  function review(r) {
    const initials=r.author.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('');
    const host=new URL(r.sourceUrl).hostname;
    const google=/(^|\.)(google\.com|maps\.google\.com)$/.test(host);
    const label=google?'Google review':/trustindex|wanderlog|property\.co/.test(host)?'Review mirror':'Printed on the company site';
    return `<article class="review-entry" data-review-entry><header><span class="review-avatar" aria-hidden="true">${esc(initials)}</span><div><h3>${esc(r.author)}</h3><p>${esc(r.relativeTime)}${/ago/i.test(r.relativeTime)&&!/as of|as printed/i.test(r.relativeTime)?`, as printed on ${dateLabel(r.capturedAt)}`:''}</p></div></header><p class="review-origin">${label}</p><blockquote><p>${esc(r.excerpt)}</p></blockquote><footer>${link(r.sourceUrl,'Read at source')}<details><summary>About this excerpt</summary><p>${esc(r.sourceLabel)}</p></details></footer></article>`;
  }
  return function render(c,peers) {
    const content=profileContent[c.slug],d=priceSummary(c),e=c.enrichment||{},trade=tradeById(c.category),r=ratingFact(c);
    const ratingNote=ratingSourceNote(c.rating?.note);
    const canonicalPath=`/roster/company/${c.slug}/`,url=absUrl(canonicalPath);
    const title=`${c.name} | ${trade.name} in Singapore | Roster`;
    const intro=profileIntro(c);
    const aboutParagraphs=c.imported?profileAbout(c):content.about;
    const description=concise(intro||`${c.name}. ${trade.name} in Singapore. Explore published services, pricing, hours and contact details.`);
    const date=dateLabel(e.checkedAt||content.updatedAt);
    const reviews=(c.reviews||[]).filter(x=>x.excerpt&&x.author&&x.relativeTime&&x.sourceUrl).slice(0,5);
    const fact=(label,value)=>value?`<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`:'';
    const contactSources=[...new Set([c.phone?.sourceUrl,c.whatsapp?.sourceUrl,c.email?.sourceUrl,c.address?.sourceUrl,c.website?.sourceUrl].filter(Boolean))];
    const facts=[fact('Email',c.email?.value?esc(c.email.value):''),fact('Website',link(c.website?.value,'Visit company website')),fact('Hours',e.hours?`${esc(e.hours.text)}${source(e.hours.sourceUrl,e.hours.capturedAt)}`:''),fact('Service area',e.serviceArea?`${esc(e.serviceArea.value)}${e.serviceArea.excerpt?`<p>${esc(e.serviceArea.excerpt)}</p>`:''}${source(e.serviceArea.sourceUrl,e.serviceArea.capturedAt)}`:''),fact('UEN',e.uen?`${esc(e.uen)}${source(e.uenSource,e.checkedAt)}`:'')];
    if(c.whatsapp?.note)facts.push(fact('Before you contact',esc(c.whatsapp.note)));
    for(const f of c.facts||[])facts.push(fact(f.label,`${esc(f.value)}${source(f.sourceUrl,e.checkedAt)}`));
    for(const l of e.licences||[])facts.push(fact('Qualification',`${esc(l.type.replace(/\s*\(claimed\)/i,''))}${l.number?` ${esc(l.number)}`:''} <span class="claim-label">${l.verifiedOn?'Verified at cited source':'Company claim'}</span>${l.excerpt?`<p>${esc(l.excerpt)}</p>`:''}${source(l.verifiedOn||l.claimedOn||l.sourceUrl,l.capturedAt)}`));
    const group=operatorGroups[e.operatorGroup];
    const groupHtml=group?`<div class="operator-group"><h3>Part of ${esc(group.label)}</h3>${group.members.filter(m=>m.slug!==c.slug).length?`<p>Related brands on Roster</p><ul>${group.members.filter(m=>m.slug!==c.slug).map(m=>`<li>${link(`/roster/company/${m.slug}/`,m.name)}</li>`).join('')}</ul>`:''}</div>`:'';
    const fallbackQuestions=[
      [`What services does ${c.name} offer?`,`${content.services.slice(0,6).map(s=>s.name).join(', ')}${content.services.length>6?', and other services shown in the list above':''}. Confirm the scope directly with the company.`],
      [`How much does ${c.name} charge?`,d.published?`${d.price}. ${d.detail} Confirm inclusions and the total for your job.`:`For pricing, contact ${c.name} for a quote covering the work, parts, transport and GST.`],
      [`How do I contact ${c.name}?`,`Call ${c.phone.value}.${c.whatsapp?.value?` WhatsApp: ${c.whatsapp.value}.`:''}`]
    ];
    if(e.hours?.text) fallbackQuestions.push([`What are ${c.name}'s hours?`,`${e.hours.text}. Checked ${dateLabel(e.hours.capturedAt)}.`]);
    const area=String(e.serviceArea?.value||'').trim();
    const areaAnswer=area==='islandwide'?'The company says it serves all of Singapore.':/^named areas:/i.test(area)?`The company names these service areas: ${area.replace(/^named areas:\s*/i,'').replace(/[.\s]+$/,'')}.`:`${area.replace(/^./,x=>x.toUpperCase()).replace(/[.\s]+$/,'')}.`;
    if(area)fallbackQuestions.push([`Where does ${c.name} offer services?`,`${areaAnswer} Confirm coverage for your postal code before booking.`]);
    const questions=e.faqs?.length ? e.faqs.map(f=>[f.q,stripCta(f.a)]) : fallbackQuestions;
    const faqBody=questions.map(([q,a],index)=>`<details><summary>${esc(q)}${icon('chevron')}</summary>${e.faqs?.length?'<p class="record-label">Answer from the company website</p>':''}<p>${esc(a)}</p>${e.faqs?.length?source(e.faqs[index].sourceUrl,e.faqs[index].capturedAt,'Company FAQ source'):''}</details>`).join('');
    const companyDetail=(label,item,display)=>item?`<div class="company-detail"><h3>${esc(label)}</h3><p>${esc(display??item.value)}</p>${source(item.sourceUrl,item.capturedAt,'Company source')}</div>`:'';
    const listDetail=(label,items)=>items?.length?`<div class="company-detail"><h3>${esc(label)}</h3><p>${items.map(item=>esc(item.value)).join(', ')}</p>${[...new Map(items.map(item=>[item.sourceUrl,item])).values()].map(item=>source(item.sourceUrl,item.capturedAt,'Company source')).join('')}</div>`:'';
    const extraDetails=[companyDetail('Warranty',e.warranty),companyDetail('Established',e.foundedYear),companyDetail('Emergency availability',e.emergency,e.emergency?.value?'24-hour availability advertised. Confirm a booking directly.':'No 24-hour service advertised.'),companyDetail('Response time',e.responseTime),listDetail('Brands mentioned',e.brands),listDetail('Payment methods',e.payments)].filter(Boolean).join('');
    const additionalHighlights=(e.highlights||[]).filter(h=>!/^Google rating/i.test(h.text));
    const highlightBody=additionalHighlights.length?`<div class="sourced-highlights"><h3>At a glance</h3><ul>${additionalHighlights.map(h=>`<li><p>${esc(readerNote(h.text))}</p>${source(h.sourceUrl,h.capturedAt,'Company source')}</li>`).join('')}</ul></div>`:'';
    const detailsBody=extraDetails?`<div class="company-detail-grid">${extraDetails}</div><p class="record-label">These details are as published by the company. Confirm conditions and availability before booking.</p>`:'';
    const socials=e.socials?.length?`<div class="company-socials"><h3>Find the company online</h3>${e.socials.map(s=>link(s.url,s.name.replace(/^./,c=>c.toUpperCase()))).join('')}</div>`:'';
    // Testimonials, page headings and condition fragments captured as price rows are not shown
    // (lib/sourced-rates.mjs profileRowProblem); the release and the source page keep the text.
    const keep=p=>!profileRowProblem(p);
    const serviceViews=content.services.map(s=>{const prices=s.prices.filter(keep);return {...s,prices,...(prices.length<s.prices.length&&prices.length>1?{priceSummary:`${prices.length} pricing entries`}:{})};});
    const additionalPrices=!c.imported && !content.services.some(s=>s.prices.filter(keep).length) && e.priceLines?.filter(l=>keep(priceOption(l))).length;
    if(additionalPrices) {
      const options=e.priceLines.map(priceOption).filter(keep);
      serviceViews[0]={...serviceViews[0],prices:options,priceSummary:options.every(p=>p.indicative)?'Pricing reference':`${options.length} pricing entries`};
    }
    const pricing=serviceViews.map((s,i)=>renderServiceRow({...s,quoteEvidence:c.quoteEvidence,imported:c.imported,trade:c.category},i)).join('');
    const pricingBody=`${additionalPrices?'<p class="record-label">Newly captured pricing is shown below with its source. Check inclusions before booking.</p>':''}${c.imported?'':`<p class="service-intro">${esc(content.headline)}</p>`}<p class="service-list-help">Open a service for details. Published rates are in Singapore dollars; confirm the final quote directly.</p><div class="service-price-list"><div class="service-price-list-heading" aria-hidden="true"><span>Service</span><span>Price</span><span></span></div>${pricing}</div>${c.priceNote?`<details class="source-disclosure"><summary>${additionalPrices?'Original pricing notes & conditions':'Pricing notes & conditions'}</summary><p>${esc(c.priceNote)}</p></details>`:''}${source(c.priceSourceUrl,e.checkedAt,'Pricing source')}`;
    const fitList=items=>`<ul>${items.map(f=>`<li><p>${esc(readerNote(f.text))}</p>${source(f.sourceUrl,f.capturedAt,'Company source')}</li>`).join('')}</ul>`;
    const bestFor=c.bestFor?`<p>${esc(c.bestFor)}</p>`:e.bestFor?.length?fitList(e.bestFor):'';
    const poorFit=c.poorFit?`<p>${esc(c.poorFit)}</p>`:e.poorFit?.length?fitList(e.poorFit):'';
    const fitBody=bestFor||poorFit?`<div class="company-fit">${bestFor?`<div><span class="fit-label">Worth considering for</span>${bestFor}</div>`:''}${poorFit?`<div><span class="fit-label">Things to check first</span>${poorFit}</div>`:''}</div>`:'';
    const alsoListed=c.alternatePhones?.length?`<div class="alternate-phones">${c.alternatePhones.map(p=>`<p>Also listed: <a href="${tel(p.value)}">${esc(p.value)}</a> (${link(p.sourceUrl,p.sourceLabel)})${p.capturedAt?` <span class="phone-checked">Checked ${esc(dateLabel(p.capturedAt))}</span>`:''}</p>`).join('')}</div>`:'';
    const aboutSources=[...new Set([...(content.sourceUrls||[]),...(e.summary?.sources||[])])];
    const aboutBody=`<p class="record-label">About the business · Checked ${date}</p><div class="company-story">${aboutParagraphs.map((p,i)=>`<p${i===0?' class="company-story-lead"':''}>${esc(p)}</p>`).join('')}${content.highlights?.length?`<div class="company-highlights">${content.highlights.map(h=>`<div><span>${esc(h.label)}</span><strong>${h.label==='Address'&&h.value==='Confirm directly'&&c.address?.value&&c.address.sourceUrl?'See <a href="#contact">Location &amp; contact</a>':esc(h.value)}</strong></div>`).join('')}</div>`:''}</div>${c.imported?`<details class="source-disclosure company-evidence"><summary>Company website excerpts & references</summary>${content.about.map(p=>`<p>${esc(p)}</p>`).join('')}</details>`:''}${aboutSources.length?`<p class="source-line">Based on: ${aboutSources.map(u=>link(u,new URL(u).hostname.replace(/^www\./,''))).join(' · ')}</p>`:''}${fitBody}${highlightBody}${detailsBody}${socials}${e.management?.length?`<div class="management"><h3>People at the company</h3>${e.management.map(m=>`<p><strong>${esc(m.name)}</strong>${m.role?`, ${esc(m.role)}`:''}${source(m.sourceUrl,m.capturedAt)}</p>`).join('')}</div>`:''}${groupHtml}`;
    const contactBody=`${map(c,content)}<div class="contact-options"><a href="${tel(c.phone.value)}"><span class="contact-option-icon">${icon('phone')}</span><span><small>Call the company</small><strong>${esc(c.phone.value)}</strong></span></a>${c.whatsapp?.value?`<a href="${wa(c.whatsapp.value)}"><span class="contact-option-icon">${icon('chat')}</span><span><small>Message on WhatsApp</small><strong>${esc(c.whatsapp.value)}</strong></span></a>`:''}</div>${alsoListed}<p class="source-line">Sources: ${contactSources.map(u=>link(u,new URL(u).hostname.replace(/^www\./,''))).join(' · ')}. Checked ${date}.</p><dl class="company-facts">${facts.join('')}</dl>`;
    // Other rating sources: one plain sentence each with its source, never averaged into the Google
    // Maps rating, and never a source whose page was not fetched (e.g. Yelp blocks automated reads).
    const extraRatings=(c.reviewSources||[]).filter(s=>!/^google maps$/i.test(s.name)&&!s.mirrorsSource&&!notFetched(s));
    const extraRatingBody=extraRatings.map(s=>`<div class="rating-sentence"><p>${link(s.sourceUrl,`${s.name}: ${s.rating.toFixed(1)}${s.count?` from ${s.count.toLocaleString('en-SG')} ${s.count===1?'review':'reviews'}`:' (review count unavailable)'}`)}</p><p>Shown separately. Not part of the Google Maps rating.</p>${ratingSourceNote(s.method)||ratingSourceNote(s.note)?`<details><summary>About this rating source</summary><p>${esc([s.method,s.note].map(ratingSourceNote).filter(Boolean).join('. '))}</p></details>`:''}</div>`).join('');
    const average=ratingSummary(c);
    const reviewBody=(!average?`<p>${noRatingText}</p>`:c.listingDepth?.full?renderAverage(average,'#reviews',true):'')+(r||reviews.length||extraRatings.length?`<h3 class="actual-reviews-heading">Ratings & reviews from cited sources</h3>`:'')+(r?`<div class="rating-sentence"><p>${link(r.url,r.text)}</p>${c.googleRating?'<p class="rating-context">Read from Google Maps search results. This is a source snapshot, not a Roster score.</p>':''}${ratingNote?`<details><summary>Source details & differences</summary><p>${esc(ratingNote)} ${link(c.rating.sourceUrl,'Original source')}</p></details>`:''}</div>`:'')+extraRatingBody+renderSelfReported(c.selfReportedRating)+(reviews.length?`<p class="record-label">${reviews.length} sourced ${reviews.length===1?'excerpt':'excerpts'}, not the full review history.</p><div class="review-entries">${reviews.map(review).join('')}</div>`:'');
    const areasBody=renderServiceAreas(e.serviceLocations,{esc,icon});
    const areasSection=section('areas-served','WHERE THEY WORK','Areas served',areasBody);
    const sections=[['pricing','Services & pricing'],...(areasBody?[['areas-served','Areas served']]:[]),['overview','About the company'],['contact','Location & contact'],...(reviewBody?[['reviews','Reviews']]:[]),['company-faq','FAQs']];
    const body=`${renderCrumbs([{href:`/roster/${trade.slug}/`,label:trade.name},{label:c.name}])}<section class="company-masthead" data-company data-name="${esc(c.name)}" data-slug="${c.slug}"><div><div class="company-name-line">${renderLogo({name:c.name,logo:d.logo},true)}<div><a class="company-trade" href="/roster/${trade.slug}/">${esc(trade.name)} in Singapore</a><h1>${esc(c.name)}</h1></div></div>${renderAverage(ratingSummary(c),'#reviews',true,'No ratings found yet.')}${intro?`<p class="company-intro">${esc(intro)}</p>`:''}<div class="company-actions"><a class="btn btn-solid" href="#pricing">Services & prices${icon('arrow')}</a>${previewFeatures?`<button class="btn profile-save" type="button" data-save="${c.slug}" aria-label="Save ${esc(c.name)}" aria-pressed="false">${icon('bookmark')}<span data-save-label>Save</span></button>`:''}${link(c.website?.value,'Company website')}</div></div><div class="price-snapshot"><span class="kicker">${d.examplePrice?'EXAMPLE SERVICE PRICE':d.published?'PUBLISHED PRICING':'PRICING'}</span><strong>${esc(d.price)}</strong>${renderQuoteEvidence(d.quoteEvidence)}<span>${esc(d.detail)}</span><a class="snapshot-link" href="#pricing">Explore services${icon('arrow')}</a></div></section>${d.photos?.length?`<section class="work-gallery" aria-label="Company photos">${d.photos.map(p=>`<figure><a href="${esc(p.sourceUrl)}"><img src="${esc(p.src)}" alt="${esc(p.caption)}" width="350" height="252" loading="lazy"></a><figcaption>${esc(p.caption)}</figcaption></figure>`).join('')}</section>`:''}<nav class="company-section-nav" aria-label="Company sections">${sections.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</nav><div class="company-layout"><div class="company-content">${section('pricing','KNOW THE COST','Services & pricing',pricingBody)}${areasSection}${section('overview','MEET THE BUSINESS',`About ${c.name}`,aboutBody)}${section('contact','FIND THEM & GET IN TOUCH','Location & contact',contactBody)}${section('reviews','BEFORE YOU BOOK','Reviews & reputation',reviewBody)}${section('company-faq','HELPFUL TO KNOW',`Questions about ${c.name}`,`<div class="company-faq-items">${faqBody}</div>`)}${previewFeatures&&!c.imported?`<details class="profile-quote-preview" id="quote-request"><summary><span>${icon('chat')}Want to compare a few companies?<small>Try the quote request preview. Nothing is sent.</small></span>${icon('chevron')}</summary>${renderForm(trade.jobs,[c,...peers.filter(x=>x.slug!==c.slug&&!x.imported)],'ask')}</details>`:''}</div><aside class="company-sidebar" aria-label="Contact the company"><div class="booking-card"><p class="kicker">CONTACT DIRECTLY</p><h2>Let's get it sorted.</h2><p>Ask about availability and get a quote.</p><a class="btn btn-solid" href="${tel(c.phone.value)}">${icon('phone')}Call ${esc(c.phone.value)}</a>${c.whatsapp?.value?`<a class="btn whatsapp-button" href="${wa(c.whatsapp.value)}">${icon('chat')}Message on WhatsApp</a>`:''}<p class="direct-contact-note">You're contacting the company directly.</p><div class="booking-links">${link(c.website?.value,'Company website')}<a href="#contact">Location & contact${icon('arrow')}</a></div></div><div class="owner-claim-card"><h3>Is this your business?</h3><p>Make your profile feel like you.</p><a href="/roster/claim-listing/?company=${encodeURIComponent(c.slug)}">Claim your listing${icon('arrow')}</a><span>Beta preview</span></div><p class="profile-checked">${icon('calendar')}Last checked ${date}</p></aside></div><div class="callbar" aria-label="Contact ${esc(c.name)}"><a class="btn btn-solid" href="${tel(c.phone.value)}">${icon('phone')}Call company</a><a class="btn" href="${c.whatsapp?.value?wa(c.whatsapp.value):'#contact'}">${icon(c.whatsapp?.value?'chat':'pin')}${c.whatsapp?.value?'WhatsApp':'Contact'}</a></div>`;
    const compactBody=`${renderCrumbs([{href:`/roster/${trade.slug}/`,label:trade.name},{label:c.name}])}<section class="compact-profile-hero" data-company data-name="${esc(c.name)}" data-slug="${c.slug}"><div class="company-name-line">${renderLogo({name:c.name,logo:d.logo},true)}<div><a class="company-trade" href="/roster/${trade.slug}/">${esc(trade.name)} in Singapore</a><h1>${esc(c.name)}</h1></div></div>${renderAverage(ratingSummary(c),'#reviews',true,'No ratings found yet.')}<p class="company-intro">${esc(intro)}</p><div class="limited-details-note">${c.imported?'<strong>Limited details</strong><p>Explore the services and contact details below. Some pricing or coverage information is still missing, so confirm your job with the company.</p>':'<strong>Some details unconfirmed</strong><p>Some pricing or coverage details were not confirmed in the latest data check, so confirm your job with the company.</p>'}</div><div class="company-actions"><a class="btn btn-solid" href="${tel(c.phone.value)}">${icon('phone')}Call company</a>${c.whatsapp?.value?`<a class="btn" href="${wa(c.whatsapp.value)}">${icon('chat')}WhatsApp</a>`:''}${previewFeatures?`<button class="btn profile-save" type="button" data-save="${c.slug}" aria-label="Save ${esc(c.name)}" aria-pressed="false">${icon('bookmark')}<span data-save-label>Save</span></button>`:''}${link(c.website?.value,'Company website')}</div></section><nav class="company-section-nav" aria-label="Company sections">${[['pricing','Services & pricing'],...(areasBody?[['areas-served','Areas served']]:[]),['overview','About the company'],['contact','Location & contact'],['reviews','Reviews'],['company-faq','FAQs']].map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</nav><div class="compact-profile-content">${section('pricing','SERVICES & PRICES','What they offer',pricingBody)}${areasSection}${section('overview','ABOUT THE BUSINESS',`About ${c.name}`,`<details class="compact-profile-details"><summary>Read about the company${icon('chevron')}</summary>${aboutBody}</details>`)}${section('contact','LOCATION & CONTACT','Get in touch',contactBody)}${section('reviews','RATINGS & REVIEWS','What customers say',reviewBody||`<p>${noRatingText}</p>`)}${section('company-faq','HELPFUL TO KNOW','Common questions',`<div class="company-faq-items">${faqBody}</div>`)}<div class="owner-claim-card"><h3>Is this your business?</h3><p>Help customers with current services, prices and business details.</p><a href="/roster/claim-listing/?company=${encodeURIComponent(c.slug)}">Claim your listing${icon('arrow')}</a><span>Beta preview</span></div></div>`;
    const graph=profileBusinessGraph(c,content,canonicalPath);const business=graph[0];business.description=aboutParagraphs[0];business.url=c.website.value;business.sameAs=[c.website.value,...(c.googleRating?[c.googleRating.sourceUrl]:[])];if(e.uen)business.identifier={'@type':'PropertyValue',propertyID:'UEN',value:e.uen};if(structuredHours(e.hours)) business.openingHours=structuredHours(e.hours);if(e.serviceArea?.value)business.areaServed=e.serviceArea.value;
    const ld=[{...webPage(title,canonicalPath,description),'@id':url+'#page',mainEntity:{'@id':url+'#business'}},crumbsLd([{href:`/roster/${trade.slug}/`,label:trade.name},{href:canonicalPath,label:c.name}]),...graph];forbidSchema(ld); // P1-6: no FAQPage; company answers are their claims, shown visibly with attribution.
    return pageShell({title,description,canonicalPath,current:`/roster/${trade.slug}/`,jsonLd:ld,body:cents(c.listingDepth?.full?body:compactBody),bodyClass:c.listingDepth?.full?'has-callbar company-page':'company-page compact-profile-page',shareImage:d.photos?.[0]?.src||''});
  };
}
// Roster's own money figures carry cents as pairs: "S$19.5" is shown as "S$19.50" (review P1-7).
// Only "S$" amounts are touched; quoted source text uses its own "$" wording.
export const cents = html => html.replace(/S\$(\d[\d,]*)\.(\d)(?!\d)/g, 'S$$$1.$20');

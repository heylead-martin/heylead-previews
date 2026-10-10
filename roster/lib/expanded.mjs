import { blockAddress, priceOption } from '../scripts/import-db.mjs';
export function dateLabel(value) {
  const match=String(value||'').match(/\d{4}-\d{2}-\d{2}/);
  if(!match) return '10 Oct 2026';
  return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(match[0]+'T12:00:00Z'));
}
export function concise(text,max=155) {
  text=String(text).replace(/\s+/g,' ').trim();
  if(text.length<=max) return /[.?!)]$/.test(text)?text:text+'.';
  return text.slice(0,max-1).replace(/\s+\S*$/,'').replace(/[,:;.!?]+$/,'')+'.';
}
export function ratingFact(c) {
  if(c.googleRating) {const g=c.googleRating;return {text:`Google Maps: ${g.value.toFixed(1)}${g.count?` from ${g.count.toLocaleString('en-SG')} reviews`:''} (checked ${dateLabel(g.checkedAt)})`,url:g.sourceUrl,value:g.value,count:g.count||0,google:true};}
  const r=c.rating;if(!r)return null;
  const host=new URL(r.sourceUrl).hostname;
  const google=/(^|\.)(google\.com|maps\.google\.com)$/.test(host);
  const own=c.website?.value&&host.replace(/^www\./,'')===new URL(c.website.value).hostname.replace(/^www\./,'');
  return {text:`${google?'Google Maps':own?'Company website reports':'Review mirror reports'}: ${r.value.toFixed(1)}${r.count?` from ${r.count.toLocaleString('en-SG')} reviews`:''} (checked 9-10 Oct 2026)`,url:r.sourceUrl,value:google?r.value:null,count:google?r.count||0:0,google};
}
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
  const r=ratingFact(c);
  return {slug:c.slug,name:c.name,category:c.category,categories:c.categories||[c.category],trade:trade.name,area:c.area||'Other Singapore locations',description:concise(c.imported?`Services listed: ${(c.enrichment?.supportedServices||[]).slice(0,5).map(s=>s.name.toLowerCase()).join(', ')}.`:c.bestFor,180),price:display.price,priceDetail:concise(display.detail||'',100),published:!!display.published,rating:r?.text||'',ratingUrl:r?.url||'',ratingValue:r?.google?r.value:null,ratingCount:r?.google?r.count:0,phone:c.phone?.value||'',whatsapp:c.whatsapp?.value||'',hasReviews:!!c.reviews?.length,services:c.services||[]};
}
export function createProfileRenderer(ctx) {
  const {esc,icon,tradeById,profileContent,priceSummary,renderCrumbs,pageShell,webPage,crumbsLd,faqLd,profileBusinessGraph,forbidSchema,renderServiceRow,renderForm,operatorGroups}=ctx;
  const tel=p=>'tel:'+p.replace(/[^\d+]/g,'');
  const wa=p=>'https://wa.me/'+p.replace(/\D/g,'');
  const link=(url,label)=>url?`<a href="${esc(url)}">${esc(label)}</a>`:'';
  const source=(url,date,label='Source')=>`<span class="data-source">${link(url,label)}${date?`<span>Checked ${esc(dateLabel(date))}</span>`:''}</span>`;
  const section=(id,kicker,title,body)=>body?`<section class="profile-section" id="${id}"><div class="profile-section-heading"><div><p class="kicker">${kicker}</p><h2>${esc(title)}</h2></div></div>${body}</section>`:'';
  function map(c,content) {
    if(!c.address?.value)return '';
    const address=blockAddress(c.address.value),redacted=address!==c.address.value;
    const query=encodeURIComponent(address);
    const verified=!redacted&&content.mapEmbedUrl?.startsWith('https://www.google.com/maps/embed?pb=')?content.mapEmbedUrl:'';
    const embed=verified||`https://www.google.com/maps?q=${query}&output=embed`;
    return `<div class="company-map"><iframe src="${esc(embed)}" title="Map near ${esc(c.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><div class="map-address"><span class="map-pin">${icon('pin')}</span><div><h3>${esc(address)}</h3><p>${redacted?'Map shown at block or street level. Contact the company before visiting.':'Published business address. Contact the company before visiting.'}</p><a href="https://www.google.com/maps/dir/?api=1&amp;destination=${query}">Get directions${icon('arrow')}</a></div></div></div>`;
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
    const canonicalPath=`/roster/company/${c.slug}/`,url='https://previews.heylead.com'+canonicalPath;
    const title=`${c.name} | ${trade.name} in Singapore | Roster`;
    const intro=e.summary?.text.replace(/\s*Google Maps search data.*$/i,'').trim()||'';
    const description=concise(intro||`${c.name}. ${trade.name} in Singapore. Explore published services, pricing, hours and contact details.`);
    const date=dateLabel(e.checkedAt||content.updatedAt);
    const reviews=(c.reviews||[]).filter(x=>x.excerpt&&x.author&&x.relativeTime&&x.sourceUrl).slice(0,5);
    const fact=(label,value)=>value?`<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`:'';
    const contactSources=[...new Set([c.phone?.sourceUrl,c.whatsapp?.sourceUrl,c.email?.sourceUrl,c.address?.sourceUrl,c.website?.sourceUrl].filter(Boolean))];
    const facts=[fact('Email',c.email?.value?esc(c.email.value):''),fact('Website',link(c.website?.value,'Visit company website')),fact('Hours',e.hours?`${esc(e.hours.text)}${source(e.hours.sourceUrl,e.hours.capturedAt)}`:''),fact('Service area',e.serviceArea?`${esc(e.serviceArea.value)}${source(e.serviceArea.sourceUrl,e.serviceArea.capturedAt)}`:''),fact('UEN',e.uen?`${esc(e.uen)}${source(e.uenSource,e.checkedAt)}`:'')];
    if(c.whatsapp?.note)facts.push(fact('Before you contact',esc(c.whatsapp.note)));
    for(const f of c.facts||[])facts.push(fact(f.label,`${esc(f.value)}${source(f.sourceUrl,e.checkedAt)}`));
    for(const l of e.licences||[])facts.push(fact('Qualification',`${esc(l.type.replace(/\s*\(claimed\)/i,''))}${l.number?` ${esc(l.number)}`:''} <span class="claim-label">${l.verifiedOn?'Verified at cited source':'Company claim'}</span>${l.excerpt?`<p>${esc(l.excerpt)}</p>`:''}${source(l.verifiedOn||l.claimedOn||l.sourceUrl,l.capturedAt)}`));
    const group=operatorGroups[e.operatorGroup];
    const groupHtml=group?`<div class="operator-group"><h3>Part of ${esc(group.label)}</h3>${group.members.filter(m=>m.slug!==c.slug).length?`<p>Related brands on Roster</p><ul>${group.members.filter(m=>m.slug!==c.slug).map(m=>`<li>${link(`/roster/company/${m.slug}/`,m.name)}</li>`).join('')}</ul>`:''}</div>`:'';
    const fallbackQuestions=[
      [`What services does ${c.name} publish?`,`${content.services.slice(0,6).map(s=>s.name).join(', ')}${content.services.length>6?', and other services shown in the list above':''}. Confirm the scope directly with the company.`],
      [`Does ${c.name} publish prices?`,d.published?`${d.price}. ${d.detail} Confirm inclusions and the total for your job.`:`No published rate was captured. Contact ${c.name} for a quote covering the work, parts, transport and GST.`],
      [`How do I contact ${c.name}?`,`Call ${c.phone.value}.${c.whatsapp?.value?` WhatsApp: ${c.whatsapp.value}.`:''}`]
    ];
    if(e.hours?.text) fallbackQuestions.push([`What are ${c.name}'s hours?`,`${e.hours.text}. Checked ${dateLabel(e.hours.capturedAt)}.`]);
    if(e.serviceArea?.value)fallbackQuestions.push([`Where does ${c.name} offer services?`,`${e.serviceArea.value}. Confirm coverage for your postal code before booking.`]);
    const questions=e.faqs?.length ? e.faqs.map(f=>[f.q,f.a]) : fallbackQuestions;
    const faqBody=questions.map(([q,a],index)=>`<details><summary>${esc(q)}${icon('chevron')}</summary>${e.faqs?.length?'<p class="record-label">Answer from the company website</p>':''}<p>${esc(a)}</p>${e.faqs?.length?source(e.faqs[index].sourceUrl,e.faqs[index].capturedAt,'Company FAQ source'):''}</details>`).join('');
    const companyDetail=(label,item,display)=>item?`<div class="company-detail"><h3>${esc(label)}</h3><p>${esc(display??item.value)}</p>${source(item.sourceUrl,item.capturedAt,'Company source')}</div>`:'';
    const listDetail=(label,items)=>items?.length?`<div class="company-detail"><h3>${esc(label)}</h3><p>${items.map(item=>esc(item.value)).join(', ')}</p>${[...new Map(items.map(item=>[item.sourceUrl,item])).values()].map(item=>source(item.sourceUrl,item.capturedAt,'Company source')).join('')}</div>`:'';
    const extraDetails=[companyDetail('Warranty',e.warranty),companyDetail('Established',e.foundedYear),companyDetail('Emergency availability',e.emergency,e.emergency?.value?'24-hour availability advertised. Confirm a booking directly.':'No 24-hour service advertised.'),companyDetail('Response time',e.responseTime),listDetail('Brands mentioned',e.brands),listDetail('Payment methods',e.payments)].filter(Boolean).join('');
    const additionalHighlights=(e.highlights||[]).filter(h=>!/^Google rating/i.test(h.text));
    const highlightBody=additionalHighlights.length?`<div class="sourced-highlights"><h3>What the company highlights</h3><ul>${additionalHighlights.map(h=>`<li><p>${esc(h.text)}</p>${source(h.sourceUrl,h.capturedAt,'Company source')}</li>`).join('')}</ul></div>`:'';
    const detailsBody=extraDetails?`<div class="company-detail-grid">${extraDetails}</div><p class="record-label">These details are as published by the company. Confirm conditions and availability before booking.</p>`:'';
    const socials=e.socials?.length?`<div class="company-socials"><h3>Find the company online</h3>${e.socials.map(s=>link(s.url,s.name.replace(/^./,c=>c.toUpperCase()))).join('')}</div>`:'';
    const serviceViews=content.services.map(s=>({...s}));
    const additionalPrices=!c.imported && !content.services.some(s=>s.prices.length) && e.priceLines?.length;
    if(additionalPrices) {
      const options=e.priceLines.map(priceOption);
      serviceViews[0]={...serviceViews[0],prices:options,priceSummary:options.every(p=>p.indicative)?'Pricing reference':`${options.length} pricing entries`};
    }
    const pricing=serviceViews.map(renderServiceRow).join('');
    const pricingBody=`${additionalPrices?'<p class="record-label">Newly captured pricing is shown below with its source. Check inclusions before booking.</p>':''}<p class="service-intro">${esc(c.imported?'Explore the services and published rates.':content.headline)}</p><p class="service-list-help">Open a service for details. Published rates are in Singapore dollars; confirm the final quote directly.</p><div class="service-price-list"><div class="service-price-list-heading" aria-hidden="true"><span>Service</span><span>Price</span><span></span></div>${pricing}</div>${c.priceNote?`<details class="source-disclosure"><summary>${additionalPrices?'Original pricing notes & conditions':'Pricing notes & conditions'}</summary><p>${esc(c.priceNote)}</p></details>`:''}${source(c.priceSourceUrl,e.checkedAt,'Pricing source')}`;
    const aboutSources=[...new Set([...(content.sourceUrls||[]),...(e.summary?.sources||[])])];
    const aboutBody=`<p class="record-label">${c.imported?'From the company website':'Summary of the public record'} · Checked ${date}</p><div class="company-story">${content.about.map((p,i)=>`<p${i===0?' class="company-story-lead"':''}>${esc(p)}</p>`).join('')}${content.highlights?.length?`<div class="company-highlights">${content.highlights.map(h=>`<div><span>${esc(h.label)}</span><strong>${esc(h.value)}</strong></div>`).join('')}</div>`:''}</div>${aboutSources.length?`<p class="source-line">Sources: ${aboutSources.map(u=>link(u,new URL(u).hostname.replace(/^www\./,''))).join(' · ')}</p>`:''}${c.bestFor||c.poorFit?`<div class="company-fit">${c.bestFor?`<div><span class="fit-label">Worth considering for</span><p>${esc(c.bestFor)}</p></div>`:''}${c.poorFit?`<div><span class="fit-label">Things to check first</span><p>${esc(c.poorFit)}</p></div>`:''}</div>`:''}${highlightBody}${detailsBody}${socials}${e.management?.length?`<div class="management"><h3>People at the company</h3>${e.management.map(m=>`<p><strong>${esc(m.name)}</strong>${m.role?`, ${esc(m.role)}`:''}${source(m.sourceUrl,m.capturedAt)}</p>`).join('')}</div>`:''}${groupHtml}`;
    const contactBody=`${map(c,content)}<div class="contact-options"><a href="${tel(c.phone.value)}"><span class="contact-option-icon">${icon('phone')}</span><span><small>Call the company</small><strong>${esc(c.phone.value)}</strong></span></a>${c.whatsapp?.value?`<a href="${wa(c.whatsapp.value)}"><span class="contact-option-icon">${icon('chat')}</span><span><small>Message on WhatsApp</small><strong>${esc(c.whatsapp.value)}</strong></span></a>`:''}</div><p class="source-line">Sources: ${contactSources.map(u=>link(u,new URL(u).hostname.replace(/^www\./,''))).join(' · ')}. Checked ${date}.</p><dl class="company-facts">${facts.join('')}</dl>`;
    const reviewBody=(r?`<div class="rating-sentence"><p>${link(r.url,r.text)}</p>${c.googleRating?'<p class="rating-context">Read from Google Maps search results. This is a source snapshot, not a Roster score.</p>':''}${c.rating?.note?`<details><summary>Source details & differences</summary><p>${esc(c.rating.note)} ${link(c.rating.sourceUrl,'Original source')}</p></details>`:''}</div>`:'')+(reviews.length?`<p class="record-label">${reviews.length} sourced excerpts, not the full review history.</p><div class="review-entries">${reviews.map(review).join('')}</div>`:'');
    const sections=[['pricing','Services & pricing'],['overview','About the company'],['contact','Location & contact'],...(reviewBody?[['reviews','Reviews']]:[]),['company-faq','FAQs']];
    const body=`${renderCrumbs([{href:`/roster/${trade.slug}/`,label:trade.name},{label:c.name}])}<section class="company-masthead" data-company data-name="${esc(c.name)}" data-slug="${c.slug}"><div><div class="company-name-line">${d.logo?`<div class="company-emblem"><img src="${esc(d.logo)}" alt="${esc(c.name)} logo" width="70" height="70"></div>`:''}<div><a class="company-trade" href="/roster/${trade.slug}/">${esc(trade.name)} in Singapore</a><h1>${esc(c.name)}</h1></div></div>${r?`<p class="masthead-rating">${link(r.url,r.text)}</p>`:''}${intro?`<p class="company-intro">${esc(intro)}</p>`:''}<div class="company-actions"><a class="btn btn-solid" href="#pricing">Services & prices${icon('arrow')}</a><button class="btn profile-save" type="button" data-save="${c.slug}" aria-label="Save ${esc(c.name)}" aria-pressed="false">${icon('bookmark')}<span data-save-label>Save</span></button>${link(c.website?.value,'Company website')}</div></div><a class="price-snapshot" href="#pricing"><span class="kicker">${d.published?'PUBLISHED PRICING':'PRICING'}</span><strong>${esc(d.price)}</strong><span>${esc(d.detail)}</span><span class="snapshot-link">Explore services${icon('arrow')}</span></a></section>${d.photos?.length?`<section class="work-gallery" aria-label="Company photos">${d.photos.map(p=>`<figure><a href="${esc(p.sourceUrl)}"><img src="${esc(p.src)}" alt="${esc(p.caption)}" width="350" height="252" loading="lazy"></a><figcaption>${esc(p.caption)}</figcaption></figure>`).join('')}</section>`:''}<nav class="company-section-nav" aria-label="Company sections">${sections.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</nav><div class="company-layout"><div class="company-content">${section('pricing','KNOW THE COST','Services & pricing',pricingBody)}${section('overview','MEET THE BUSINESS',`About ${c.name}`,aboutBody)}${section('contact','FIND THEM & GET IN TOUCH','Location & contact',contactBody)}${section('reviews','BEFORE YOU BOOK','Reviews & reputation',reviewBody)}${section('company-faq','HELPFUL TO KNOW',`Questions about ${c.name}`,`<div class="company-faq-items">${faqBody}</div>`)}${!c.imported?`<details class="profile-quote-preview" id="quote-request"><summary><span>${icon('chat')}Want to compare a few companies?<small>Try the quote request preview. Nothing is sent.</small></span>${icon('chevron')}</summary>${renderForm(trade.jobs,[c,...peers.filter(x=>x.slug!==c.slug&&!x.imported)],'ask')}</details>`:''}</div><aside class="company-sidebar" aria-label="Contact the company"><div class="booking-card"><p class="kicker">CONTACT DIRECTLY</p><h2>Let's get it sorted.</h2><p>Discuss your job with ${esc(c.name)} and confirm the details before booking.</p><a class="btn btn-solid" href="${tel(c.phone.value)}">${icon('phone')}Call ${esc(c.phone.value)}</a>${c.whatsapp?.value?`<a class="btn whatsapp-button" href="${wa(c.whatsapp.value)}">${icon('chat')}Message on WhatsApp</a>`:''}<p class="direct-contact-note">You're contacting the company directly.</p><div class="booking-links">${link(c.website?.value,'Company website')}<a href="#contact">Location & contact${icon('arrow')}</a></div></div><p class="profile-checked">${icon('calendar')}Last checked ${date}</p></aside></div><div class="callbar" aria-label="Contact ${esc(c.name)}"><a class="btn btn-solid" href="${tel(c.phone.value)}">${icon('phone')}Call company</a><a class="btn" href="${c.whatsapp?.value?wa(c.whatsapp.value):'#contact'}">${icon(c.whatsapp?.value?'chat':'pin')}${c.whatsapp?.value?'WhatsApp':'Contact'}</a></div>`;
    const graph=profileBusinessGraph(c,content,canonicalPath);const business=graph[0];business.url=c.website.value;business.sameAs=[c.website.value,...(c.googleRating?[c.googleRating.sourceUrl]:[])];if(e.uen)business.identifier={'@type':'PropertyValue',propertyID:'UEN',value:e.uen};if(structuredHours(e.hours)) business.openingHours=structuredHours(e.hours);if(e.serviceArea?.value)business.areaServed=e.serviceArea.value;
    const ld=[{...webPage(title,canonicalPath,description),'@id':url+'#page',mainEntity:{'@id':url+'#business'}},crumbsLd([{href:`/roster/${trade.slug}/`,label:trade.name},{href:canonicalPath,label:c.name}]),...graph,faqLd(questions)];forbidSchema(ld);
    return pageShell({title,description,canonicalPath,current:`/roster/${trade.slug}/`,jsonLd:ld,body,bodyClass:'has-callbar company-page',shareImage:d.photos?.[0]?.src||''});
  };
}

import {decodeCatalogue} from './catalogue-data.mjs?v=20261012-areas';
import {matchJob,selectedVisible} from './job-match.mjs?v=20261012-quotes';
import {validWhatsAppNumber} from './quote-contact.mjs?v=20261012-quotes';
import {renderLogo} from './catalogue-card.mjs?v=20261012-areas';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=document.querySelector('[data-job-matches]');
if(root){
 const $=selector=>root.querySelector(selector);
 const form=$('[data-job-edit]'),input=$('#match-job'),trade=$('[data-job-trade]'),area=$('[data-job-area]');
 const dialog=$('[data-quote-dialog]'),contactForm=$('[data-quote-contact]'),phone=$('#quote-phone'),email=$('#quote-email'),consent=$('[data-quote-consent]');let rows=[],matches=[],selected=[],limit=5,intent=null,loaded=false,opener=null;
 const params=new URLSearchParams(location.hash.slice(1));input.value=(params.get('job')||'').slice(0,1200);trade.value=params.get('trade')||'';area.value=params.get('area')??'auto';if(!area.selectedOptions.length)area.value='auto';limit=params.get('limit')==='10'?10:5;
 function updateHash(){const p=new URLSearchParams();if(input.value.trim())p.set('job',input.value.trim().slice(0,1200));if(trade.value)p.set('trade',trade.value);if(area.value!=='auto')p.set('area',area.value);if(limit===10)p.set('limit','10');history.replaceState(null,'',location.pathname+(p.size?'#'+p.toString():''));}
 function announce(text){$('[data-match-live]').textContent=text;}
 function current(){return matches.slice(0,limit);}
 function selection(){
  selected=selectedVisible(selected,matches,limit);
  $('[data-selected-count]').textContent=`${selected.length} selected`;$('[data-mobile-count]').textContent=selected.length;
  root.querySelectorAll('[data-quote-open]').forEach(b=>b.disabled=!selected.length);
  root.querySelectorAll('[data-select-company]').forEach(el=>{el.checked=selected.includes(el.value);el.closest('.match-card').classList.toggle('is-selected',el.checked);el.nextElementSibling.textContent=el.checked?'Selected':'Select';});
  $('[data-mobile-selection]').hidden=!matches.length;
  $('[data-select-all]').textContent=`Select all ${current().length}`;
  $('[data-clear-selection]').disabled=!selected.length;
 }
 function card(c,index){
  const url='/roster/company/'+encodeURIComponent(c.slug)+'/';
  const average=c.average;const count=average?.count;const source=average?.sources?.[0];
  return `<li class="match-card" data-company data-slug="${esc(c.slug)}" data-name="${esc(c.name)}"><article><div class="match-card-top"><span class="match-position">${String(index+1).padStart(2,'0')}</span><div class="match-identity">${renderLogo(c)}<div><p>${esc(c.trade)}</p><h3><a href="${url}">${esc(c.name)}</a></h3></div></div><label class="match-select"><input type="checkbox" data-select-company value="${esc(c.slug)}" aria-label="Select ${esc(c.name)} for quote request"><span>Select</span></label></div><div class="match-proof"><div class="match-rating">${average?`<a href="${url}#reviews"><strong>${average.value.toFixed(1)}<small>/ 5</small></strong><span>Average rating<b>${count===null?'Review count unavailable':`${Number(count).toLocaleString('en-SG')} ${count===1?'review':'reviews'}`}</b></span></a><p>${average.sourceCount} ${average.sourceCount===1?'source':'sources'}${source?` · <a href="${esc(source.sourceUrl)}">${esc(source.name)}</a> · ${esc(String(source.checkedAt).slice(0,10))}`:''}</p>`:'<strong>No rating yet</strong><p>Read the company details before deciding.</p>'}</div><div class="match-price"><span>${c.examplePrice?'Example published price':c.published?'Published service price':'Service pricing'}</span><strong>${esc(c.price)}</strong>${c.published?`<p>${esc(c.priceDetail||'Check the service details for scope and inclusions.')}</p><a href="${url}#pricing">View prices & conditions</a>`:'<p>Ask the company for a quote for your job.</p>'}</div></div><div class="match-reasons"><span>Why it’s on your list</span><ul>${c.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul></div><p class="match-offerings">${esc((c.offerings||[]).slice(0,4).join(' · '))}</p><div class="match-card-bottom"><a href="${url}">View company <span aria-hidden="true">→</span></a><a href="${url}#contact">Contact directly</a></div></article></li>`;
 }
 function showEmpty(title,copy){$('[data-match-empty]').hidden=false;$('[data-empty-title]').textContent=title;$('[data-empty-copy]').textContent=copy;$('[data-match-results]').hidden=true;}
 function render(){
  $('[data-match-cards]').innerHTML=current().map(card).join('');
  root.querySelectorAll('[data-match-limit]').forEach(b=>{b.setAttribute('aria-pressed',String(Number(b.dataset.matchLimit)===limit));b.disabled=Number(b.dataset.matchLimit)===10&&matches.length<=5;});
  $('[data-match-summary]').textContent=`${Math.min(limit,matches.length)} of ${matches.length} matching companies. Compare the details, then make your choice.`;
  $('[data-match-interpreted]').innerHTML=[intent.tradeName,intent.area?.name||'Any area',...intent.jobs.map(j=>j.label)].map(text=>`<span>${esc(text)}</span>`).join('');
  $('[data-match-results]').hidden=!matches.length;$('[data-match-empty]').hidden=!!matches.length;
  selection();
 }
 function search(focus=false){
  if(!loaded)return;selected=[];$('[data-match-notice]').hidden=true;dialog.close();
  const result=matchJob(rows,input.value,{trade:trade.value,area:area.value});matches=input.value.trim()?result.matches:[];intent=result.intent;selected=current().map(c=>c.slug);render();updateHash();
  if(!input.value.trim())showEmpty('What needs doing?','Write a sentence about your job in the quote form. Add your town to find companies that state coverage for your area.');
  else if(intent.needsTrade)showEmpty('Which service do you need?','Open Choose a service manually in the quote form to guide this beta search. For jobs across several trades, start with one service at a time.');
  else if(intent.needsArea)showEmpty('Choose the area for this job.',intent.areaConflict?'The town in your description is outside the selected region. Update your description or area so they agree.':'Your description mentions more than one town. Select a specific town, or choose Anywhere in Singapore.');
  else if(!matches.length)showEmpty('No close matches this time.','No published companies match all the detected services and stated area coverage. Try a simpler description or choose Anywhere in Singapore to broaden your search.');
  if(intent.needsTrade)$('[data-service-refine]').open=true;
  if(matches.length){announce(`${Math.min(limit,matches.length)} companies shown. ${selected.length} selected. You can untick any company.`);if(focus)$('#match-results-title').focus();}
  else {announce($('[data-empty-title]').textContent);if(focus){$('[data-empty-title]').tabIndex=-1;$('[data-empty-title]').focus();}}
 }
 async function load(){
  $('[data-match-loading]').hidden=false;$('[data-match-error]').hidden=true;form.querySelector('[type=submit]').disabled=true;
  try{const response=await fetch(root.dataset.index,{credentials:'same-origin'});if(!response.ok)throw new Error('Company index unavailable');rows=decodeCatalogue(await response.json());loaded=true;search();if(params.get('contact')==='1'){params.delete('contact');if(selected.length)openQuote(form.querySelector('[type=submit]'));}}
  catch{$('[data-match-error]').hidden=false;}
  finally{$('[data-match-loading]').hidden=true;form.querySelector('[type=submit]').disabled=false;}
 }
 form.addEventListener('submit',event=>{event.preventDefault();if(!input.value.trim()){input.setCustomValidity('Tell us a little about the job.');input.reportValidity();return;}if(!matches.length)search(true);if(selected.length)openQuote(form.querySelector('[type=submit]'));else if(matches.length){announce('Select at least one company before continuing.');$('#match-results-title').focus();}});
 function invalidate(){if(!loaded)return;matches=[];selected=[];selection();$('[data-match-results]').hidden=true;$('[data-match-notice]').hidden=true;showEmpty('Refresh your shortlist.','Your brief has changed. Choose Get started to update the companies.');}
 input.addEventListener('input',()=>{input.setCustomValidity('');invalidate();});trade.addEventListener('change',invalidate);area.addEventListener('change',invalidate);
 form.querySelector('fieldset').disabled=false;
 $('[data-match-retry]').addEventListener('click',load);
 root.querySelectorAll('[data-match-limit]').forEach(button=>button.addEventListener('click',()=>{const nextLimit=Number(button.dataset.matchLimit);if(nextLimit===limit)return;limit=nextLimit;selected=current().map(c=>c.slug);render();updateHash();announce(`${current().length} companies shown. ${selected.length} selected.`);}));
 $('[data-match-cards]').addEventListener('change',event=>{const checkbox=event.target.closest('[data-select-company]');if(!checkbox)return;selected=checkbox.checked?[...selected,checkbox.value]:selected.filter(slug=>slug!==checkbox.value);selection();});
 $('[data-select-all]').addEventListener('click',()=>{selected=current().map(c=>c.slug);selection();announce(`${selected.length} companies selected.`);});
 $('[data-clear-selection]').addEventListener('click',()=>{selected=[];selection();announce('Selection cleared.');});
 function channel(){return contactForm.querySelector('[name="reply-channel"]:checked').value;}
 function updateChannel(){
  const whatsapp=channel()==='whatsapp';
  $('[data-contact-whatsapp]').hidden=!whatsapp;$('[data-contact-email]').hidden=whatsapp;
  phone.disabled=!whatsapp;phone.required=whatsapp;email.disabled=whatsapp;email.required=!whatsapp;
  phone.value='';email.value='';phone.setCustomValidity('');consent.checked=false;
  $('#quote-sharing').textContent=`In the live service, the ${selected.length} selected ${selected.length===1?'company would':'companies would'} receive your job details and ${whatsapp?'WhatsApp number':'email address'}, then reply individually. You choose whom to book.`;
 }
 function openQuote(button){
  if(!selected.length)return;opener=button;contactForm.reset();updateChannel();
  $('[data-quote-brief]').textContent=input.value.trim();$('[data-quote-area]').textContent=intent.area?.name||'Anywhere in Singapore';
  $('[data-contact-count]').textContent=selected.length;
  $('[data-quote-list]').innerHTML=current().filter(c=>selected.includes(c.slug)).map(c=>`<li>${renderLogo(c)}<span>${esc(c.name)}</span></li>`).join('');
  $('.quote-recipient-review').open=false;dialog.showModal();$('#quote-dialog-title').focus();
 }
 root.querySelectorAll('[data-quote-open]').forEach(button=>button.addEventListener('click',()=>openQuote(button)));
 function close(){dialog.close();}
 root.querySelectorAll('[data-quote-close]').forEach(button=>button.addEventListener('click',close));
 contactForm.querySelectorAll('[name="reply-channel"]').forEach(radio=>radio.addEventListener('change',updateChannel));
 phone.addEventListener('input',()=>phone.setCustomValidity(''));
 contactForm.addEventListener('submit',event=>{
  event.preventDefault();
  if(channel()==='whatsapp'&&!validWhatsAppNumber(phone.value)){phone.setCustomValidity('Enter an 8-digit Singapore mobile number, or an international number with its country code.');phone.reportValidity();return;}
  if(!contactForm.reportValidity())return;
  const method=channel()==='whatsapp'?'WhatsApp':'email';
  close();$('[data-match-notice]').textContent=`Preview complete: ${selected.length} ${selected.length===1?'company':'companies'}, with replies by ${method}. Nothing was sent and your contact details have been cleared.`;$('[data-match-notice]').hidden=false;announce($('[data-match-notice]').textContent);
 });
 // Keep contact details out of storage, links and network requests, including on Escape.
 dialog.addEventListener('close',()=>{contactForm.reset();phone.value='';email.value='';phone.setCustomValidity('');opener?.focus();});
 window.addEventListener('pagehide',()=>{phone.value='';email.value='';consent.checked=false;});
 contactForm.querySelector('fieldset').disabled=false;
 await load();
}

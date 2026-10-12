import {decodeCatalogue} from './catalogue-data.mjs?v=20261012-areas';
import {matchJob,selectedVisible} from './job-match.mjs?v=20261012-search';
import {renderLogo} from './catalogue-card.mjs?v=20261012-areas';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=document.querySelector('[data-job-matches]');
if(root){
 const $=selector=>root.querySelector(selector);
 const form=$('[data-job-edit]'),input=$('#match-job'),trade=$('[data-job-trade]'),area=$('[data-job-area]');
 const dialog=$('[data-quote-dialog]');let rows=[],matches=[],selected=[],limit=5,intent=null,loaded=false,opener=null;
 const params=new URLSearchParams(location.hash.slice(1));input.value=(params.get('job')||'').slice(0,1200);trade.value=params.get('trade')||'';area.value=params.get('area')??'auto';if(!area.selectedOptions.length)area.value='auto';limit=params.get('limit')==='10'?10:5;
 function updateHash(){const p=new URLSearchParams();if(input.value.trim())p.set('job',input.value.trim().slice(0,1200));if(trade.value)p.set('trade',trade.value);if(area.value!=='auto')p.set('area',area.value);if(limit===10)p.set('limit','10');history.replaceState(null,'',location.pathname+(p.size?'#'+p.toString():''));}
 function announce(text){$('[data-match-live]').textContent=text;}
 function current(){return matches.slice(0,limit);}
 function selection(){
  selected=selectedVisible(selected,matches,limit);
  const recipients=current().filter(c=>selected.includes(c.slug));
  $('[data-selected-count]').textContent=`${selected.length} selected`;$('[data-quote-count]').textContent=selected.length;$('[data-mobile-count]').textContent=selected.length;
  $('[data-quote-recipients]').innerHTML=recipients.length?recipients.map(c=>`<li>${esc(c.name)}</li>`).join(''):'<li class="no-recipients">Select companies to build your request.</li>';
  root.querySelectorAll('[data-quote-open]').forEach(b=>b.disabled=!selected.length);
  root.querySelectorAll('[data-select-company]').forEach(el=>{el.checked=selected.includes(el.value);el.closest('.match-card').classList.toggle('is-selected',el.checked);});
  $('[data-mobile-selection]').hidden=!matches.length;
  $('[data-select-all]').textContent=`Select all ${current().length}`;
  $('[data-clear-selection]').disabled=!selected.length;
 }
 function card(c,index){
  const url='/roster/company/'+encodeURIComponent(c.slug)+'/';
  const average=c.average;const count=average?.count;const source=average?.sources?.[0];
  return `<li class="match-card" data-company data-slug="${esc(c.slug)}" data-name="${esc(c.name)}"><article><div class="match-card-top"><span class="match-position">${String(index+1).padStart(2,'0')}</span><div class="match-identity">${renderLogo(c)}<div><p>${esc(c.trade)}</p><h3><a href="${url}">${esc(c.name)}</a></h3></div></div><label class="match-select"><input type="checkbox" data-select-company value="${esc(c.slug)}" aria-label="Select ${esc(c.name)} for quote preview"><span>Select</span></label></div><div class="match-proof"><div class="match-rating">${average?`<a href="${url}#reviews"><strong>${average.value.toFixed(1)}<small>/ 5</small></strong><span>Average rating<b>${count===null?'Review count unavailable':`${Number(count).toLocaleString('en-SG')} ${count===1?'review':'reviews'}`}</b></span></a><p>${average.sourceCount} ${average.sourceCount===1?'source':'sources'}${source?` · <a href="${esc(source.sourceUrl)}">${esc(source.name)}</a> · ${esc(String(source.checkedAt).slice(0,10))}`:''}</p>`:'<strong>No rating yet</strong><p>Read the company details before deciding.</p>'}</div><div class="match-price"><span>${c.examplePrice?'Example published price':c.published?'Published service price':'Service pricing'}</span><strong>${esc(c.price)}</strong>${c.published?`<p>${esc(c.priceDetail||'Check the service details for scope and inclusions.')}</p><a href="${url}#pricing">View prices & conditions</a>`:'<p>Ask the company for a quote for your job.</p>'}</div></div><div class="match-reasons"><span>Why it’s on your list</span><ul>${c.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul></div><p class="match-offerings">${esc((c.offerings||[]).slice(0,4).join(' · '))}</p><div class="match-card-bottom"><a href="${url}">View company <span aria-hidden="true">→</span></a><a href="${url}#contact">Contact directly</a></div></article></li>`;
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
  const result=matchJob(rows,input.value,{trade:trade.value,area:area.value});matches=result.matches;intent=result.intent;render();updateHash();
  if(!input.value.trim())showEmpty('What needs doing?','Write a sentence about your job above. Add your town to find companies that state coverage for your area.');
  else if(intent.needsTrade)showEmpty('Which service do you need?','Choose a service above to guide this beta search. For jobs across several trades, start with one service at a time.');
  else if(intent.needsArea)showEmpty('Choose the area for this job.','Your description mentions more than one town. Select the job area above, or choose Any area.');
  else if(!matches.length)showEmpty('No close matches this time.','No published companies match all the detected services and stated area coverage. Try a simpler description or choose Any area to broaden your search.');
  if(matches.length){announce(`${Math.min(limit,matches.length)} companies shown. None selected.`);if(focus)$('#match-results-title').focus();}
  else {announce($('[data-empty-title]').textContent);if(focus){$('[data-empty-title]').tabIndex=-1;$('[data-empty-title]').focus();}}
 }
 async function load(){
  $('[data-match-loading]').hidden=false;$('[data-match-error]').hidden=true;
  try{const response=await fetch(root.dataset.index,{credentials:'same-origin'});if(!response.ok)throw new Error('Company index unavailable');rows=decodeCatalogue(await response.json());loaded=true;search();}
  catch{$('[data-match-error]').hidden=false;}
  finally{$('[data-match-loading]').hidden=true;}
 }
 form.addEventListener('submit',event=>{event.preventDefault();if(!input.value.trim()){input.setCustomValidity('Tell us a little about the job.');input.reportValidity();return;}search(true);});
 function invalidate(){if(!loaded)return;matches=[];selected=[];selection();$('[data-match-results]').hidden=true;$('[data-match-notice]').hidden=true;showEmpty('Refresh your shortlist.','Your brief has changed. Choose Find matches to update the companies.');}
 input.addEventListener('input',()=>{input.setCustomValidity('');invalidate();});trade.addEventListener('change',invalidate);area.addEventListener('change',invalidate);
 form.querySelector('fieldset').disabled=false;
 $('[data-match-retry]').addEventListener('click',load);
 root.querySelectorAll('[data-match-limit]').forEach(button=>button.addEventListener('click',()=>{limit=Number(button.dataset.matchLimit);render();updateHash();announce(`${current().length} companies shown. ${selected.length} selected.`);}));
 $('[data-match-cards]').addEventListener('change',event=>{const checkbox=event.target.closest('[data-select-company]');if(!checkbox)return;selected=checkbox.checked?[...selected,checkbox.value]:selected.filter(slug=>slug!==checkbox.value);selection();});
 $('[data-select-all]').addEventListener('click',()=>{selected=current().map(c=>c.slug);selection();announce(`${selected.length} companies selected.`);});
 $('[data-clear-selection]').addEventListener('click',()=>{selected=[];selection();announce('Selection cleared.');});
 root.querySelectorAll('[data-quote-open]').forEach(button=>button.addEventListener('click',()=>{if(!selected.length)return;opener=button;$('[data-quote-brief]').textContent=input.value.trim();$('[data-quote-list]').innerHTML=current().filter(c=>selected.includes(c.slug)).map(c=>`<li>${renderLogo(c)}<span>${esc(c.name)}</span></li>`).join('');dialog.showModal();}));
 function close(){dialog.close();opener?.focus();}
 root.querySelectorAll('[data-quote-close]').forEach(button=>button.addEventListener('click',close));
 $('[data-quote-finish]').addEventListener('click',()=>{close();$('[data-match-notice]').textContent=`Preview complete for ${selected.length} ${selected.length===1?'company':'companies'}. No quote requests were sent.`;$('[data-match-notice]').hidden=false;announce($('[data-match-notice]').textContent);});
 dialog.addEventListener('close',()=>opener?.focus());
 await load();
}

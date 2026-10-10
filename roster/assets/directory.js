/* Browsing preferences store only company slugs. Contact details are never stored. */
(function () {
  'use strict';
  var saved=[];
  function readSaved(){try{var data=JSON.parse(localStorage.getItem('roster-saved')||'[]');saved=Array.isArray(data)?data.filter(function(x){return typeof x==='string';}):[];}catch(e){saved=[];}}
  readSaved();
  var search=document.querySelector('[data-site-search]');
  var params=new URLSearchParams(location.search);
  function searchSite(){var query=search.value.trim();location.href='/roster/search/'+(query?'?q='+encodeURIComponent(query):'');}
  if(search){search.value=params.get('q')||'';search.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();searchSite();}});document.querySelector('[data-search-submit]').addEventListener('click',searchSite);}
  function updateSaved(){document.querySelectorAll('[data-save]').forEach(function(button){var active=saved.includes(button.dataset.save);button.setAttribute('aria-pressed',String(active));var card=button.closest('[data-company]');button.setAttribute('aria-label',(active?'Unsave ':'Save ')+(card?card.dataset.name:button.dataset.save));var label=button.querySelector('[data-save-label]');if(label)label.textContent=active?'Saved':'Save';});}
  document.addEventListener('click',function(event){var button=event.target.closest('[data-save]');if(!button)return;readSaved();var slug=button.dataset.save;if(saved.includes(slug))saved=saved.filter(function(s){return s!==slug;});else saved.push(slug);try{localStorage.setItem('roster-saved',JSON.stringify(saved));}catch(e){}updateSaved();window.dispatchEvent(new Event('roster-saved-change'));});
  window.addEventListener('storage',function(event){if(event.key==='roster-saved'){readSaved();updateSaved();}});
  updateSaved();
})();

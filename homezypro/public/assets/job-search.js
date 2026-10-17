import {jobUrl} from './job-match.mjs?v=20261012-search';
const hero=document.querySelector('[data-hero-search]');
if(hero){
 const tabs=[...hero.querySelectorAll('[data-search-tab]')];
 function choose(tab,focus=false){for(const t of tabs){const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;}if(focus)tab.focus();}
 for(const tab of tabs){tab.addEventListener('click',()=>choose(tab));tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const index=e.key==='Home'?0:e.key==='End'?tabs.length-1:(tabs.indexOf(tab)+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;choose(tabs[index],true);}});}
 const form=hero.querySelector('[data-job-start]'),input=hero.querySelector('#hero-job');
 form.addEventListener('submit',e=>{e.preventDefault();if(!input.value.trim()){input.setCustomValidity('Tell us a little about the job.');input.reportValidity();return;}location.href=jobUrl(input.value);});
 input.addEventListener('input',()=>input.setCustomValidity(''));
 hero.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.example;input.setCustomValidity('');input.focus();}));
 form.querySelector('fieldset').disabled=false;
}

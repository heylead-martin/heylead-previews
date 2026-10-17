import {findArea,regions,areaSlug} from './service-areas.mjs';
export function setupAreaPicker(root,onChange) {
 const box=root.querySelector('[data-area-picker]'),input=box.querySelector('[data-area]'),list=box.querySelector('[role=listbox]'),clear=box.querySelector('[data-area-clear]');
 list.innerHTML=`<button type="button" role="option" id="area-any" data-area-option="" aria-selected="true" tabindex="-1">Any area</button>${Object.entries(regions).map(([region,names])=>`<div role="group" aria-label="${region}" data-area-group><p aria-hidden="true">${region}</p>${names.map(name=>`<button type="button" role="option" id="area-${areaSlug(name)}" data-area-option="${areaSlug(name)}" data-area-region="${region}" aria-selected="false" tabindex="-1">${name}</button>`).join('')}</div>`).join('')}<p data-area-empty hidden>No matching areas</p>`;
 input.disabled=false;
 const options=[...list.querySelectorAll('[data-area-option]')];let selected='',highlight=-1;
 const visible=()=>options.filter(o=>!o.hidden);
 function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');highlight=-1;options.forEach(o=>o.classList.remove('is-active'));}
 function set(value,notify=false){const area=findArea(value);selected=area?.slug||'';input.value=area?.name||'';clear.hidden=!selected;options.forEach(o=>o.setAttribute('aria-selected',String(o.dataset.areaOption===selected)));close();if(notify)onChange();}
 function open(query=''){
  const q=query.trim().toLowerCase();list.hidden=false;input.setAttribute('aria-expanded','true');highlight=-1;input.removeAttribute('aria-activedescendant');
  options.forEach(o=>{o.hidden=!!q&&!`${o.textContent} ${o.dataset.areaRegion||''}`.toLowerCase().includes(q);o.classList.remove('is-active');});
  list.querySelectorAll('[data-area-group]').forEach(g=>g.hidden=![...g.querySelectorAll('[data-area-option]')].some(o=>!o.hidden));
  list.querySelector('[data-area-empty]').hidden=visible().length>0;
 }
 input.addEventListener('focus',()=>open());input.addEventListener('click',()=>open());
 input.addEventListener('input',()=>{if(!input.value){set('',true);}open(input.value);});
 input.addEventListener('keydown',event=>{
  if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();if(list.hidden)open();const items=visible();if(!items.length)return;highlight=highlight<0?(event.key==='ArrowDown'?0:items.length-1):(highlight+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;options.forEach(o=>o.classList.toggle('is-active',o===items[highlight]));input.setAttribute('aria-activedescendant',items[highlight].id);items[highlight].scrollIntoView({block:'nearest'});}
  else if(event.key==='Enter'&&!list.hidden){event.preventDefault();const items=visible(),exact=items.find(o=>o.textContent.toLowerCase()===input.value.toLowerCase());const option=items[highlight]||exact||(items.length===1?items[0]:null);if(option)set(option.dataset.areaOption,true);}
  else if(event.key==='Escape'){event.preventDefault();set(selected);}
  else if(event.key==='Tab')set(selected);
 });
 list.addEventListener('mousedown',e=>e.preventDefault());
 list.addEventListener('click',e=>{const option=e.target.closest('[data-area-option]');if(option){set(option.dataset.areaOption,true);input.focus();close();}});
 input.addEventListener('blur',()=>set(selected));clear.addEventListener('click',()=>{set('',true);input.focus();});
 return {get value(){return selected;},set};
}

import {renderCard,renderCompactCard,splitDirectory} from './catalogue-card.mjs?v=20261011-density';
import {filterCatalogue} from './catalogue-filter.mjs?v=20261011-counts';
import {decodeCatalogue} from './catalogue-data.mjs?v=20261012-release';
const root=document.querySelector('[data-catalogue]');
if(root) {
  const header=document.querySelector('.top');
  if(header) {
    const positionFilters=()=>root.style.setProperty('--filter-top',`${Math.ceil(header.getBoundingClientRect().height)+12}px`);
    positionFilters();
    new ResizeObserver(positionFilters).observe(header);
  }
  const list=root.querySelector('.shortlist'),status=root.querySelector('[data-result-count]'),more=root.querySelector('[data-load-more]'),error=root.querySelector('[data-index-error]');
  const otherList=root.querySelector('[data-other-list]');
  const search=root.querySelector('[data-filter-search]'),area=root.querySelector('[data-area]'),rating=root.querySelector('[data-rating]'),sort=root.querySelector('[data-sort]'),category=root.querySelector('[data-category-filter]');
  const params=new URLSearchParams(location.search);let rows=[],limit=12,loaded=false;
  const saved=()=>{try{const x=JSON.parse(localStorage.getItem('roster-saved')||'[]');return Array.isArray(x)?x.filter(s=>typeof s==='string'):[];}catch{return [];}};
  search.value=params.get('q')||'';
  if(params.get('saved')==='1')root.querySelector('[data-filter="saved"]').checked=true;
  function apply(reset=true) {
    if(!loaded)return;if(reset)limit=12;
    const savedSlugs=saved();
    const active=[...root.querySelectorAll('[data-filter]:checked')].map(x=>x.dataset.filter);
    const {matches,counts}=filterCatalogue(rows,{query:search.value,area:area.value,category:category?.value,rating:rating.value,active,savedSlugs});
    const groups=splitDirectory(matches,sort.value);
    list.innerHTML=groups.shortlist.map(c=>renderCard(c,savedSlugs.includes(c.slug))).join('');
    otherList.innerHTML=groups.others.slice(0,limit).map(c=>renderCompactCard(c,savedSlugs.includes(c.slug))).join('');
    root.querySelector('[data-shortlist-section]').hidden=!groups.shortlist.length;
    root.querySelector('[data-other-section]').hidden=!groups.others.length;
    status.textContent=`${groups.shortlist.length} on the shortlist · ${groups.others.length} other ${groups.others.length===1?'company':'companies'}`;
    root.querySelector('[data-no-results]').hidden=matches.length>0;more.hidden=groups.others.length<=limit;
    root.querySelectorAll('[data-filter-count]').forEach(el=>{el.textContent=counts[el.dataset.filterCount];});
    root.querySelector('[data-active-filters]').textContent=active.length||area.value||rating.value||category?.value||search.value.trim()?'(active)':'';
  }
  async function load() {
    more.disabled=true;error.hidden=true;
    try {const response=await fetch(root.dataset.index,{credentials:'same-origin'});if(!response.ok)throw new Error('Index unavailable');rows=decodeCatalogue(await response.json());loaded=true;apply();}
    catch {error.hidden=false;status.textContent='The full list could not be loaded. The first companies are shown below.';}
    finally{more.disabled=false;}
  }
  root.querySelector('[data-retry]').addEventListener('click',load);
  more.addEventListener('click',()=>{const nextIndex=limit;limit+=12;apply(false);otherList.children[nextIndex]?.querySelector('h3 a')?.focus();});
  root.querySelectorAll('[data-filter], [data-area], [data-rating], [data-sort], [data-category-filter]').forEach(el=>el.addEventListener('change',()=>apply()));
  search.addEventListener('input',()=>apply());
  window.addEventListener('roster-saved-change',()=>apply(false));window.addEventListener('storage',e=>{if(e.key==='roster-saved')apply(false);});
  root.querySelectorAll('[data-reset]').forEach(button=>button.addEventListener('click',()=>{search.value='';area.value='';rating.value='';sort.value='evidence';if(category)category.value='';root.querySelectorAll('[data-filter]').forEach(x=>x.checked=false);history.replaceState(null,'',location.pathname);apply();}));
  const toggle=root.querySelector('[data-toggle-filters]'),panel=root.querySelector('.filter-content'),mobile=matchMedia('(max-width:639px)');
  function showFilters(show){panel.hidden=!show;toggle.setAttribute('aria-expanded',String(show));}
  showFilters(!mobile.matches);toggle.addEventListener('click',()=>showFilters(panel.hidden));mobile.addEventListener('change',()=>showFilters(!mobile.matches));
  await load();
}

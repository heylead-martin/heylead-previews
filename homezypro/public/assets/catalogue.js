import {renderCard,renderCompactCard,splitDirectory} from './catalogue-card.mjs?v=20261018-cards';
import {filterCatalogue} from './catalogue-filter.mjs?v=20261018-trade-words';
import {decodeCatalogue} from './catalogue-data.mjs?v=20261012-areas';
import {setupAreaPicker} from './area-picker.mjs?v=20261012-areas';
import {setupSortControl} from './sort-control.mjs?v=20261012-menu';
const root=document.querySelector('[data-catalogue]');
if(root) {
  const header=document.querySelector('.top');
  if(header) {
    const positionFilters=()=>root.style.setProperty('--filter-top',`${Math.ceil(header.getBoundingClientRect().height)+12}px`);
    positionFilters();new ResizeObserver(positionFilters).observe(header);
  }
  const list=root.querySelector('.shortlist'),status=root.querySelector('[data-result-count]'),more=root.querySelector('[data-load-more]'),error=root.querySelector('[data-index-error]');
  const otherList=root.querySelector('[data-other-list]');
  const search=root.querySelector('[data-filter-search]'),rating=root.querySelector('[data-rating]'),sort=root.querySelector('[data-sort]'),category=root.querySelector('[data-category-filter]'),unstated=root.querySelector('[data-include-unstated]');
  let rows=[],limit=12,loaded=false;
  const area=setupAreaPicker(root,()=>apply());
  const sortControl=setupSortControl(sort);
  const saved=()=>window.RosterAccount?.snapshot().saved||[];
  function readParams(){
    const params=new URLSearchParams(location.search);
    search.value=params.get('q')||'';area.set(params.get('area'));rating.value=params.get('rating')||'';sort.value=params.get('sort')||'evidence';if(!sort.value)sort.value='evidence';if(category)category.value=params.get('trade')||'';
    unstated.checked=params.get('unstated')==='1';root.querySelectorAll('[data-filter]').forEach(el=>el.checked=params.get(el.dataset.filter)==='1');
  }
  function updateUrl(){
    const params=new URLSearchParams(location.search);
    for(const key of ['q','area','rating','trade','sort','unstated','price','reviews','whatsapp','saved'])params.delete(key);
    for(const [key,value] of Object.entries({q:search.value.trim(),area:area.value,rating:rating.value,trade:category?.value,sort:sort.value==='evidence'?'':sort.value,unstated:area.value&&unstated.checked?'1':''}))if(value)params.set(key,value);
    root.querySelectorAll('[data-filter]:checked').forEach(el=>params.set(el.dataset.filter,'1'));
    const query=params.toString();history.replaceState(null,'',location.pathname+(query?'?'+query:'')+location.hash);
  }
  // Towns with a static area page: point the canonical at it and offer a link while ?area= is set.
  const areaPages=JSON.parse(document.querySelector('[data-area-pages]')?.dataset.areaPages||'{}');
  const canonical=document.querySelector('link[rel="canonical"]'),hubCanonical=canonical?.href;
  const areaNote=document.createElement('p');areaNote.className='area-unstated';areaNote.dataset.areaPageNote='';areaNote.hidden=true;
  root.querySelector('[data-area-unstated]').before(areaNote);
  function syncAreaPage(){
    const page=areaPages[area.value];
    if(canonical)canonical.href=page?new URL(page,hubCanonical).href:hubCanonical;
    areaNote.hidden=!page;areaNote.textContent='';
    if(page){const link=document.createElement('a');link.href=page;link.textContent=`See the ${document.getElementById('area-'+area.value)?.textContent||'town'} page, with coverage sources and published prices`;areaNote.append(link);}
  }
  function apply(reset=true,syncUrl=true) {
    sortControl.sync();syncAreaPage();
    if(!loaded)return;if(reset)limit=12;
    const savedSlugs=saved(),active=[...root.querySelectorAll('[data-filter]:checked')].map(x=>x.dataset.filter);
    const {matches,counts,unknownCount}=filterCatalogue(rows,{query:search.value,area:area.value,category:category?.value,rating:rating.value,active,savedSlugs,includeUnstated:unstated.checked});
    const groups=splitDirectory(matches,sort.value);
    list.innerHTML=groups.shortlist.map(c=>renderCard(c,savedSlugs.includes(c.slug))).join('');
    otherList.innerHTML=groups.others.slice(0,limit).map(c=>renderCompactCard(c,savedSlugs.includes(c.slug))).join('');
    root.querySelector('[data-shortlist-section]').hidden=!groups.shortlist.length;
    root.querySelector('[data-shortlist-explanation]').hidden=!!area.value;
    root.querySelector('[data-other-section]').hidden=!groups.others.length;
    root.querySelector('[data-other-heading]').textContent=area.value?'Companies for this area':'Other companies';
    root.querySelector('[data-other-note]').textContent=area.value?'Town matches first, followed by regional and islandwide coverage.':'More options to explore. Some listings have limited details.';
    root.querySelector('[data-area-unstated]').hidden=!area.value||!unknownCount;
    root.querySelector('[data-unstated-count]').textContent=unknownCount;
    status.textContent=area.value?`${matches.length} matching ${matches.length===1?'company':'companies'}`:`${groups.shortlist.length} on the shortlist · ${groups.others.length} other ${groups.others.length===1?'company':'companies'}`;
    root.querySelector('[data-no-results]').hidden=matches.length>0;more.hidden=groups.others.length<=limit;
    root.querySelectorAll('[data-filter-count]').forEach(el=>{el.textContent=counts[el.dataset.filterCount];});
    root.querySelector('[data-active-filters]').textContent=active.length||area.value||rating.value||category?.value||search.value.trim()?'(active)':'';
    if(syncUrl)updateUrl();
    window.dispatchEvent(new Event('roster-cards-rendered'));
  }
  async function load() {
    more.disabled=true;error.hidden=true;
    try {const response=await fetch(root.dataset.index,{credentials:'same-origin'});if(!response.ok)throw new Error('Index unavailable');rows=decodeCatalogue(await response.json());loaded=true;apply();}
    catch {error.hidden=false;status.textContent='The full list could not be loaded. The first companies are shown below.';}
    finally{more.disabled=false;}
  }
  root.querySelector('[data-retry]').addEventListener('click',load);
  more.addEventListener('click',()=>{const nextIndex=limit;limit+=12;apply(false);otherList.children[nextIndex]?.querySelector('h3 a')?.focus();});
  root.querySelectorAll('[data-filter], [data-rating], [data-sort], [data-category-filter], [data-include-unstated]').forEach(el=>el.addEventListener('change',()=>apply()));
  search.addEventListener('input',()=>apply());
  window.addEventListener('roster-saved-change',()=>apply(false));window.addEventListener('storage',e=>{if(e.key==='roster-saved')apply(false);});
  window.addEventListener('popstate',()=>{readParams();apply(true,false);});
  root.querySelectorAll('[data-reset]').forEach(button=>button.addEventListener('click',()=>{search.value='';area.set('');rating.value='';sort.value='evidence';unstated.checked=false;if(category)category.value='';root.querySelectorAll('[data-filter]').forEach(x=>x.checked=false);history.replaceState(null,'',location.pathname);apply();}));
  const toggle=root.querySelector('[data-toggle-filters]'),panel=root.querySelector('.filter-content'),mobile=matchMedia('(max-width:639px)');
  function showFilters(show){panel.hidden=!show;toggle.setAttribute('aria-expanded',String(show));}
  showFilters(!mobile.matches);toggle.addEventListener('click',()=>showFilters(panel.hidden));mobile.addEventListener('change',()=>showFilters(!mobile.matches));
  readParams();syncAreaPage();await load();
}

const explorer = document.querySelector('[data-home-explorer]');
if (explorer) {
  const {stats,trades} = JSON.parse(explorer.querySelector('[data-home-stats]').textContent);
  const buttons = [...explorer.querySelectorAll('[data-map-filter]')];
  const setText = (selector,text) => { explorer.querySelector(selector).textContent=text; };
  for (const button of buttons) button.addEventListener('click', () => {
    const id=button.dataset.mapFilter, s=stats[id], trade=trades.find(t=>t.id===id);
    if (!s) return;
    for (const control of buttons) control.setAttribute('aria-pressed',String(control===button));
    for (const group of explorer.querySelectorAll('[data-map-dots]')) group.toggleAttribute('hidden',id!=='all'&&group.dataset.mapDots!==id);
    setText('[data-map-count]',`${s.mapped} business locations`);
    setText('[data-map-category]',trade?trade.name.toUpperCase():'ALL HOME SERVICES');
    setText('[data-map-total]',s.total);
    setText('[data-map-average]',s.average||'Not available');
    setText('[data-map-scale]',s.average?' / 5':'');
    setText('[data-map-priced]',s.priced);
    setText('[data-map-whatsapp]',s.whatsapp);
    setText('[data-map-note]',`${s.mapped} of ${s.total} have an address matched to a building. Companies may travel beyond their base.`);
    setText('[data-map-live]',`${trade?.name||'All services'}: ${s.total} companies, ${s.mapped} mapped, ${s.priced} with published prices. Average company rating ${s.average||'unavailable'}${s.average?' out of 5':''}, from ${s.rated} rated companies.`);
    const link=explorer.querySelector('[data-map-browse]');
    link.href=trade?`/${trade.slug}/`:'/search/';
    link.firstChild.textContent=trade?`Explore ${trade.noun} `:'Explore all companies ';
    explorer.querySelector('#home-map-desc').textContent=`${s.mapped} business addresses matched to a building for ${trade?.name.toLowerCase()||'all home services'} in Singapore. Business addresses do not indicate service coverage.`;
  });
}

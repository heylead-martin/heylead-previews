export const heroProfessions = [
 {id:'aircon',label:'Aircon',title:'aircon expert.',icon:'aircon',slug:'aircon-servicing'},
 {id:'plumbing',label:'Plumbing',title:'plumber.',icon:'tap',slug:'plumbing'},
 {id:'electrician',label:'Electrical',title:'electrician.',icon:'bolt',slug:'electrician'},
 {id:'handyman',label:'Handyman',title:'handyman.',icon:'wrench',slug:'handyman'},
 {id:'cleaning',label:'Cleaning',title:'home cleaner.',icon:'sparkle',slug:'home-cleaning'}
];

export function renderProfessionVisual({esc,icon}) {
 return `<div class="profession-visual"><div class="profession-photos" aria-hidden="true">${heroProfessions.map((p,i)=>`<img class="profession-photo${i===0?' is-active':''}" data-profession-photo="${i}" ${i===0?'src':'data-src'}="/roster/assets/hero/${p.id}-v1.jpg" ${i===0?'srcset':'data-srcset'}="/roster/assets/hero/${p.id}-v1-small.jpg 640w, /roster/assets/hero/${p.id}-v1.jpg 1200w" sizes="(max-width: 800px) 100vw, 700px" width="1200" height="800" alt="" decoding="async" ${i===0?'fetchpriority="high"':''}>`).join('')}</div><div class="profession-shade"></div><div class="profession-eyebrow">${icon('pin')} THE SINGAPORE HOME DIRECTORY</div><div class="profession-story"><h1 id="hero-title"><span class="sr-only">Find your next home service professional in Singapore.</span><span aria-hidden="true"><span class="profession-fixed">Find your next</span><span class="profession-words">${heroProfessions.map((p,i)=>`<em class="${i===0?'is-active':''}" data-profession-word="${i}">${esc(p.title)}</em>`).join('')}</span></span></h1><p>Good help starts with a little clarity.<br>Compare reviews, prices and services.</p><a class="profession-browse" data-profession-browse href="/roster/aircon-servicing/">Explore companies ${icon('arrow')}</a></div><span class="profession-photo-note">Illustrative imagery</span></div>`;
}

export function renderProfessionControls({esc,icon}) {
 return `<div class="profession-controls" role="group" aria-label="Choose a profession">${heroProfessions.map((p,i)=>`<button type="button" data-profession="${i}" data-profession-url="/roster/${p.slug}/" aria-label="Show ${esc(p.label.toLowerCase())} image" aria-pressed="${i===0?'true':'false'}" disabled>${icon(p.icon)}<span>${esc(p.label)}</span></button>`).join('')}<button type="button" class="profession-pause" data-profession-pause aria-label="Pause image rotation" title="Pause image rotation" hidden><svg class="ic pause-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg><svg class="ic play-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg></button><p class="sr-only" data-profession-live aria-live="polite" aria-atomic="true"></p></div>`;
}

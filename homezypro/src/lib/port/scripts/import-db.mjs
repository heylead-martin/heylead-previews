import {normaliseServiceLocations} from '../lib/service-areas.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// 'needs-human-review' (r15.1): a row a reviewer must clear first (e.g. HEDIRCOOL, 201823211K) is withheld.
export const BLOCKED = new Set(['needs-human-review','not-a-trade-business','not-singapore','site-spam-injection','possible-duplicate','no-sg-postal-code','marketplace','possible-platform','google-listing-mismatch','website-not-company-site','thin-profile','site-placeholder-content','website-inactive','lookup-name-looks-unrelated','trade-unclear','closed','commercial-only']);
const types = {aircon:'HVACBusiness',plumbing:'Plumber',electrician:'Electrician',handyman:'HomeAndConstructionBusiness',cleaning:'LocalBusiness'};
const cat = x => x === 'home-cleaning' ? 'cleaning' : x;
const text = x => typeof x === 'string' ? x.replace(/[\u2013\u2014]/g,'-').replace(/Â·/g,' · ').replace(/\s+/g,' ').trim() : '';
const value = x => text(typeof x === 'string' ? x : x?.value || x?.text);
export const http = x => { try { const u = new URL(x); return ['http:','https:'].includes(u.protocol) && !u.username && !u.password ? u.href : ''; } catch { return ''; } };
const clean = x => typeof x === 'string' ? text(x) : Array.isArray(x) ? x.map(clean) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k,v])=>[k,clean(v)])) : x;
const slugify = x => text(x).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90).replace(/-$/,'');
const human = x => text(x).replace(/-/g,' ').replace(/^./,x=>x.toUpperCase());
const indicative = p => p.indicative || /typically|on average|industry average|average cost|typical (?:cost|price)|prices? in singapore|cost of .+ in singapore/i.test([p.service,p.excerpt].join(' '));
const cited = x => x && http(x.sourceUrl || x.source_url);
const contact = (x, fallback) => value(x) ? {value:value(x),sourceUrl:http(x?.sourceUrl)||fallback} : null;
export function blockAddress(address) {
  return text(address).replace(/[\u2010-\u2015]/g,'-').replace(/#\s*[a-z0-9]+(?:\s*[-/]\s*[a-z0-9]+|\s+\d{1,4}\b)?/gi,'').replace(/\bunit\s*#?\s*[\w]+(?:\s*[-/]\s*[\w]+)*/gi,'').replace(/\s*,(?:\s*,)+/g,',').replace(/\s+,/g,',').replace(/,(?=[A-Za-z])/g,', ').replace(/^[\s,]+|[\s,]+$/g,'').replace(/\s{2,}/g,' ').trim();
}
export function supplementPostalAddress(current, incoming) {
  if (!current?.value || current.postal || !/^\d{6}$/.test(incoming?.postal || '') || !cited(incoming)) return current;
  const words = address => blockAddress(address).toLowerCase().replace(/\b(?:singapore|\d{6})\b/g,'').replace(/\b(?:avenue|av)\b/g,'ave').replace(/\broad\b/g,'rd').replace(/\bstreet\b/g,'st').replace(/\blane\b/g,'ln').replace(/\b(?:blk|block)\b/g,'').match(/[a-z0-9]+/g)?.sort().join(' ');
  return words(current.value) === words(incoming.value) ? {...current,postal:incoming.postal,postalSourceUrl:cited(incoming)} : current;
}
const areaNames = ['Ang Mo Kio','Bedok','Bishan','Bukit Batok','Bukit Merah','Bukit Panjang','Bukit Timah','Choa Chu Kang','Clementi','Geylang','Hougang','Jurong East','Jurong West','Kallang','Marine Parade','Pasir Ris','Punggol','Queenstown','Sembawang','Sengkang','Serangoon','Tampines','Toa Payoh','Woodlands','Yishun','Changi','Eunos','Paya Lebar','Ubi','Simei','Sungei Kadut','Tuas','Seletar','Sungei Kadut'];
function district(address) { return areaNames.find(a=>address.toLowerCase().includes(a.toLowerCase())) || 'Other Singapore locations'; }
function serviceKey(name, trade) {
  let k=slugify(name);
  const aliases={'aircon-servicing':'general-service','contract-servicing':'maintenance-contract','power-points':'power-point','electrical-troubleshooting':'troubleshooting','wiring-rewiring':'rewiring','weekly-cleaning':'regular-cleaning','weekly-clean':'regular-cleaning','one-off-clean':'one-time-cleaning','post-renovation-cleaning':'post-renovation','post-renovation-clean':'post-renovation','deep-clean':'deep-cleaning','move-in-out-clean':'move-in-out','carpet-cleaning':'carpet','mattress-cleaning':'mattress','sofa-cleaning':'upholstery-sofa','curtain-cleaning':'curtain','pipe-leak-repair':'leak-repair','choked-toilet':'toilet-bowl','power-trip-repair':'power-trip'};
  if (aliases[k]) return aliases[k];
  if (trade==='aircon') {
    if (/overhaul/.test(k)) return 'chemical-overhaul';
    if (/chemical.*wash|chemical.*clean/.test(k)) return 'chemical-wash';
    if (/gas.*top|refrigerant/.test(k)) return 'gas-top-up';
    if (/contract/.test(k)) return 'maintenance-contract';
    if (/general.*servic|normal.*servic/.test(k)) return 'general-service';
  }
  return k;
}
const serviceNames = {'general-service':'General servicing','chemical-wash':'Chemical wash','chemical-overhaul':'Chemical overhaul','maintenance-contract':'Maintenance contracts','gas-top-up':'Gas top-up','db-box':'Distribution board','lew-endorsement':'LEW endorsement','move-in-out':'Move-in & move-out cleaning','regular-cleaning':'Regular cleaning','upholstery-sofa':'Sofa & upholstery cleaning','drilling-mounting':'Drilling & mounting','tap-mixer':'Taps & mixers','choke-clearing':'Choke clearing'};
function serviceRows(row, trade) {
  const groups=new Map();
  for(const item of row.services || []) {
    if (!text(item.name)||!cited(item)) continue;
    const key=serviceKey(item.name,trade);
    if (!groups.has(key)) groups.set(key,{name:serviceNames[key]||human(item.name),description:'',explanation:text(item.excerpt),sourceUrl:http(item.sourceUrl),capturedAt:item.capturedAt,prices:[]});
  }
  for(const item of row.price_lines || []) {
    if (!text(item.service)||!text(item.price_text)||!cited(item)) continue;
    const key=serviceKey(item.job || item.service,trade);
    if (!groups.has(key)) groups.set(key,{name:serviceNames[key]||human(item.job||item.service),description:'',explanation:'',sourceUrl:http(item.sourceUrl),capturedAt:item.capturedAt,prices:[]});
    groups.get(key).prices.push(priceOption(item));
  }
  for(const s of groups.values()) {if(s.prices.length && s.prices.every(p=>p.indicative)) s.priceSummary='Pricing reference';else if(s.prices.length>1) s.priceSummary=`${s.prices.length} pricing entries`;}
  return [...groups.values()];
}

const units = n => `${n} ${Number(n) === 1 ? 'unit' : 'units'}`;
const sentenceCase = x => x.replace(/^./, c => c.toUpperCase());
export function priceOption(item) {
  const details = [
    item.qty != null ? `Quantity: ${item.qty}` : '',
    Number.isFinite(item.unit_price_sgd) ? `Calculated per-unit price: S$${item.unit_price_sgd}${Number.isFinite(item.unit_price_max_sgd)?` to S$${item.unit_price_max_sgd}`:''}${item.units_in_price?` (${units(item.units_in_price)} in the published total)`:''}` : '',
    item.min_units != null ? `Minimum ${units(item.min_units)}` : '',
    sentenceCase(text(item.unit))+(item.unitInferred?' (inferred from the job type; confirm with the company)':''),
    item.sessions_per_month != null ? `${item.sessions_per_month} sessions per month` : '',
    item.hours_per_session != null ? `${item.hours_per_session} hours per session` : '',
    text(item.gst_note || item.gst) ? `GST: ${text(item.gst_note || item.gst)}` : '',
    item.promo ? 'Promotional rate; confirm availability' : '',
    item.was_amount_sgd != null ? `Previously S$${item.was_amount_sgd}` : ''
  ];
  const longPrice=text(item.price_text).length>65 || !/(?:S?\$|SGD)\s*\d/i.test(text(item.price_text));
  const rawLabel=text(item.service);
  const noisyLabel=/^(?:login|sign in|add to cart|quantity)$/i.test(rawLabel)||/decrease\/?increase quantity|(?:increase|decrease) quantity|^\+?65[\s\d]{8,}$|^(?:\d+[.)]\s*)?(?:what|how|when|where)\b.*\?/i.test(rawLabel);
  const label=(noisyLabel||rawLabel.length>100)&&item.job ? human(item.job) : rawLabel;
  return {label,price:longPrice?'See source details':text(item.price_text),detail:details.filter(Boolean).join('. '),excerpt:text(item.excerpt)||text(item.price_text),sourceUrl:cited(item),capturedAt:item.capturedAt,indicative:indicative(item)};
}
const sourcedFact = item => cited(item) && item.value != null ? {...item,sourceUrl:cited(item)} : null;
export function verifyRelease(source, checksum) {
  const expected = String(checksum).trim().split(/\s+/)[0].toLowerCase();
  const actual = createHash('sha256').update(source).digest('hex');
  if(!/^[a-f0-9]{64}$/.test(expected) || expected !== actual) throw new Error('Release checksum mismatch. Import stopped before writing any site data.');
  return actual;
}

export function bundledLogo(logo) {
  if (logo?.logo_unsure === true || logo?.display === 'initials') return null;
  if (!logo?.local_path) return null;
  if (!/^logos\/[a-z0-9_-]+\.(?:png|jpe?g|webp|avif|svg|gif|ico)$/i.test(logo.local_path) || !/^[a-f0-9]{64}$/i.test(logo.sha256 || '') || !http(logo.source_url) || !http(logo.url)) throw new Error(`Invalid sourced logo asset metadata: ${logo.local_path}`);
  const parsed=path.posix.parse(logo.local_path), sha256=logo.sha256.toLowerCase();
  return {localPath:logo.local_path,sha256,src:`/logos/${parsed.name}-${sha256.slice(0,12)}${parsed.ext}`,sourceUrl:http(logo.source_url),originalUrl:http(logo.url),capturedAt:text(logo.capturedAt)};
}

export function reviewSources(row) {
  const siteHost=http(value(row.website)) ? new URL(http(value(row.website))).hostname.replace(/^www\./,'') : '';
  return (row.ratings||[]).filter(r=>text(r.source)&&Number.isFinite(r.rating)&&r.rating>=0&&r.rating<=5&&(r.scale===5||r.scale==='trustscore')&&http(r.url)&&/^\d{4}-\d{2}-\d{2}/.test(r.capturedAt||'')&&!/widget|company website|self.reported/i.test(r.source)&&new URL(r.url).hostname.replace(/^www\./,'')!==siteHost).map(r=>({name:text(r.source),rating:r.rating,count:Number.isInteger(r.count)&&r.count>0?r.count:null,scale:/trustpilot/i.test(r.source)?'trustscore':r.scale,sourceUrl:http(r.url),checkedAt:text(r.capturedAt),method:text(r.method),note:[text(r.method_detail),text(r.scale_note)].filter(Boolean).join(' '),mirrorsSource:text(r.mirrorsSource||r.mirrors_source)}));
}

export function alternatePhones(phone, primary) {
  const primaryDigits=String(primary||'').replace(/\D/g,'');
  const seen=new Set([primaryDigits]);
  return (Array.isArray(phone?.alt)?phone.alt:[]).flatMap(item=>{
    const number=value(item),digits=number.replace(/\D/g,''),url=cited(item);
    if(!url||!digits||seen.has(digits))return [];
    seen.add(digits);
    const host=new URL(url).hostname;
    const label=/BCA/i.test(item.sourceLabel||'')||host==='data.gov.sg'?'BCA register':/Google/i.test(item.sourceLabel||'')?'Google Maps':text(item.sourceLabel)||host.replace(/^www\./,'');
    return [{value:number,sourceUrl:url,sourceLabel:label,capturedAt:item.capturedAt||null}];
  });
}

function reviewRows(row, mapsUrl) {
  return (row.reviews||[]).filter(r=>r.excerpt && (r.author||r.author_initials_or_handle) && (r.date||r.relativeTime) && cited(r)).slice(0,5).map(r=>({excerpt:text(r.excerpt),author:text(r.author||r.author_initials_or_handle),relativeTime:text(r.date||r.relativeTime),sourceUrl:http(r.source_url||r.sourceUrl),sourceLabel:text(r.source||r.sourceLabel),mapsUrl:http(r.maps_url)||mapsUrl,capturedAt:r.capturedAt||row.checked}));
}
// HomezyPro options: `withhold` maps a row id to an editorial exclusion reason (e.g. a listing kept
// retired although its data now passes); `reservedSlugs` can never be assigned to another company
// (retired slugs, profile.retiredSlugs from the release).
export function importDatabase(db, seeds, registry={}, {withhold={}, reservedSlugs=[]}={}) {
  const report={sourceChecked:db.checked,sourceRows:db.companies.length,sourceProfiles:db.companies.filter(c=>c.segment==='profiled').length,published:[],excluded:[],warnings:[],byTrade:{}};
  for(const t of Object.keys(types)) report.byTrade[t]={published:0,excluded:0};
  const curated=new Map(seeds.companies.companies.filter(c=>c.publish!==false).map(c=>[c.slug,c]));
  const profiles=structuredClone(seeds.profiles), presentation=structuredClone(seeds.presentation);
  const companies=[]; const used=new Set([...curated.keys(),...Object.values(registry),...reservedSlugs]); const registryOut={...registry};
  for(const raw of db.companies) {
    const row=clean(raw); if(row.flags?.includes('price-indicative-only')) for(const p of row.price_lines||[]) p.indicative=true; const original=curated.get(row.rosterProfile?.slug);
    const categories=[...new Set((row.categories||[]).map(cat).filter(t=>types[t]))];
    const category=cat(row.primary_trade)||original?.category||cat(row.profile?.trade)||categories[0];
    if(row.primary_trade&&!types[category])throw new Error(`Invalid primary trade for ${row.id}`);
    const reasons=(row.flags||[]).filter(f=>BLOCKED.has(f));
    if(row.profile_rolled_back) reasons.push('profile-rolled-back');
    if(withhold[row.id]) reasons.push(withhold[row.id]);
    const website=http(value(row.website)||original?.website?.value);
    if(!original) {
      if(/lorem ipsum|fusce porta|dolor sit amet|just another wordpress|your company name/i.test((row.about||[]).map(a=>a.text).join(' '))) reasons.push('site-placeholder-content-detected');
      if(!row.about?.some(a=>text(a.text)&&cited(a))) reasons.push('missing-sourced-about');
      if(!row.services?.some(s=>s.name&&cited(s))) reasons.push('missing-sourced-services');
      if(!value(row.phone)||!cited(row.phone)) reasons.push('missing-sourced-phone');
      if(!value(row.address)||!cited(row.address)) reasons.push('missing-sourced-address');
      if(!website) reasons.push('missing-company-website');
      if(website && /(^|\.)(lookup\.sg|facebook\.com|instagram\.com|google\.com|maps\.google\.com)$/.test(new URL(website).hostname)) reasons.push('website-not-company-site');
    }
    if(!types[category]) reasons.push('missing-trade');
    if(reasons.length) {
      report.excluded.push({id:row.id,name:row.name,categories,primaryTrade:category,reasons:[...new Set(reasons)],...(original?{curated:true,slug:original.slug}: {})});
      if(types[category]) report.byTrade[category].excluded++;
      continue;
    }
    if(!types[category]) throw new Error(`Invalid trade for ${row.id}`);
    // An upgrade-in-place merge gives the survivor a new id (r15: gm-17955160989056097423 is now
    // lookup-aircon-koomax-sg). A row with no slug of its own keeps the slug of the id it absorbed,
    // so its URL does not change.
    const own=registry[row.id]||(row.merged_from||[]).map(m=>registry[m.id]).find(Boolean);
    let slug=original?.slug||own||slugify(row.profile?.slug||row.name)||slugify(row.id);
    if(!original && used.has(slug) && own!==slug) slug+=`-${slugify(row.id)}`;
    if(!original && used.has(slug) && own!==slug) throw new Error(`Duplicate slug ${slug}`);
    used.add(slug);registryOut[row.id]=slug;
    const mapsUrl=http(row.google_maps_url)||original?.mapsUrl||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.name+' Singapore')}`;
    const address=contact(row.address,website);
    if(address) {address.street=address.value;address.postal=text(row.address?.postal);}
    const enrichment={checkedAt:row.checked,supportedServices:(row.services||[]).filter(cited).map(s=>({name:human(s.name),sourceUrl:s.sourceUrl,capturedAt:s.capturedAt})),about:(row.about||[]).filter(a=>text(a.text)&&cited(a)),hours:row.hours?.text&&cited(row.hours)?row.hours:row.hours_google?.text&&cited(row.hours_google)?row.hours_google:null,serviceArea:row.service_area?.value&&cited(row.service_area)?row.service_area:null,residential:row.residential?.value&&cited(row.residential)?row.residential:null,licences:(row.licences||[]).filter(l=>l.type&&http(l.claimedOn||l.sourceUrl)),management:(row.management||[]).filter(m=>m.name&&cited(m)),uen:text(row.uen),uenSource:http(row.uen_source?.sourceUrl),operatorGroup:row.operator_group,priceLines:(row.price_lines||[]).filter(p=>p.service&&p.price_text&&cited(p)),websiteCheck:row.profile?.websiteCheck||null};
    Object.assign(enrichment, {
      serviceLocations:normaliseServiceLocations(row.service_locations,website),
      bestFor:(row.bestFor||[]).filter(f=>text(f.text)&&cited(f)).map(f=>({...f,sourceUrl:cited(f)})),
      poorFit:(row.poorFit||[]).filter(f=>text(f.text)&&cited(f)).map(f=>({...f,sourceUrl:cited(f)})),
      summary: row.summary?.text && row.summary?.sources?.some(http) ? {text:row.summary.text.replace(/\ba aircon\b/g,'an aircon').replace(/\ba electrician\b/g,'an electrician'),sources:row.summary.sources.map(http).filter(Boolean),capturedAt:row.summary.generatedAt} : null,
      faqs:(row.faqs||[]).filter(f=>text(f.q)&&text(f.a)&&cited(f)).map(f=>({q:f.q,a:f.a,sourceUrl:cited(f),capturedAt:f.capturedAt||row.checked})),
      highlights:(row.highlights||[]).filter(h=>text(h.text)&&cited(h)&&(!/publishes prices/i.test(h.text)||enrichment.priceLines.length)).map(h=>({...h,sourceUrl:cited(h)})),
      warranty:sourcedFact(row.warranty),foundedYear:sourcedFact(row.founded_year),emergency:sourcedFact(row.emergency_24_7),responseTime:sourcedFact(row.response_time),
      brands:(row.brands_serviced||[]).map(sourcedFact).filter(Boolean),payments:(row.payment_methods||[]).map(sourcedFact).filter(Boolean),
      socials:Object.entries(row.social_links||{}).filter(([,s])=>http(s.url)&&cited(s)).map(([name,s])=>({name,url:http(s.url),sourceUrl:cited(s),capturedAt:s.capturedAt}))
    });
    const base={slug,name:text(row.name),category,categories:categories.length?categories:[category],schemaType:types[category],phone:contact(row.phone,website),address,website:{value:website,sourceUrl:website},email:contact(row.contact?.email||row.email,website),whatsapp:contact(row.contact?.whatsapp,website),mapsUrl,rating:null,reviews:reviewRows(row,mapsUrl),services:(row.services||[]).map(s=>s.name).filter(s=>['chemical-wash','gas-top-up'].includes(s)),bestFor:'',poorFit:'',priceNote:'Contact the company to confirm the scope, total price and GST.',priceSourceUrl:enrichment.priceLines[0]?.sourceUrl||website,facts:[],imported:true};
    const company=original?{...structuredClone(original),imported:false}:{...base};
    if(original) {
      for(const field of ['phone','address','website','email','whatsapp']) if(!company[field]?.value&&base[field]?.value) company[field]=base[field];
      if(!company.reviews?.length) company.reviews=base.reviews;
      const deadReviews=(row.flag_details||[]).filter(f=>f.flag==='review-source-404').map(f=>f.url);
      if(deadReviews.length) {company.reviews=company.reviews.filter(r=>!deadReviews.includes(r.sourceUrl));report.warnings.push({slug,issue:'Invalidated review source removed',urls:deadReviews});}
    }
    company.databaseId=row.id;company.enrichment=enrichment;
    const quote=row.pricing_model_source;
    company.quoteEvidence=row.pricing_model==='quote_on_request' && quote?.wording==='statement' && text(quote.excerpt) && cited(quote) && /^\d{4}-\d{2}-\d{2}/.test(quote.capturedAt||'') ? {excerpt:text(quote.excerpt),sourceUrl:cited(quote),capturedAt:quote.capturedAt.slice(0,10)} : null;
    company.address=supplementPostalAddress(company.address,row.address);
    // r15.2: address.kind says what the address is. 'premises' = printed by the company site; 'registered' =
    // the ACRA registered address (shown as "Registered address", never as a place to visit, and kept out of
    // structured data). Carried only when the shown address is the release's own address.
    const addressKind=text(row.address?.kind);
    if(addressKind&&!['premises','registered'].includes(addressKind))throw new Error(`Unknown address.kind ${addressKind} for ${row.id}`);
    if(addressKind&&company.address?.value&&company.address.value===value(row.address)) company.address={...company.address,kind:addressKind,...(addressKind==='registered'?{registeredAddress:true}:{})};
    company.mapEvidence=row.map ? {status:row.map.status,precision:row.map.precision,postal:text(row.address?.postal),addressValue:value(row.address),addressSourceUrl:cited(row.address),place:row.map.place||null,geocode:row.map.geocode||null,latitude:row.map.lat,longitude:row.map.lng} : null;
    if(row.self_reported_rating||row.rosterProfile?.rating_moved_to) company.rating=null;
    company.selfReportedRating=row.self_reported_rating&&cited(row.self_reported_rating)?row.self_reported_rating:null;
    company.reviewSources=reviewSources(row);
    company.listingDepth={full:row.profile_bar?.meetsFullBar===true,evidenceScore:['priceWithJob','serviceAreaCited','residentialSentence','summary','unflagged'].filter(key=>row.profile_bar?.[key]===true).length+Number(!!enrichment.hours)+Number(!!company.reviews?.length),checkedAt:row.profile_bar?.checkedAt||null};
    company.primaryTrade=category;company.category=category;company.schemaType=types[category];
    company.alternatePhones=alternatePhones(row.phone,company.phone?.value);
    company.categories=[...new Set([category,...categories])];
    company.area=(company.address?.kind==='registered'||company.address?.registeredAddress===true)?'Other Singapore locations':district(company.address?.value||'');
    company.googleRating=Number.isFinite(row.google_rating)&&row.google_rating>0&&row.google_rating<=5&&http(row.google_maps_url)&&row.google_read_at?{value:row.google_rating,count:Number.isInteger(row.google_review_count)&&row.google_review_count>0?row.google_review_count:null,sourceUrl:http(row.google_maps_url),checkedAt:row.google_read_at,sourceType:'google-maps-search'}:null;
    if(!original) {
      const services=serviceRows(row,category);
      profiles[slug]={headline:`Services published by ${company.name}.`,about:enrichment.about.map(a=>a.text),services,highlights:[],sourceUrls:[...new Set(enrichment.about.map(a=>a.sourceUrl))],updatedAt:row.checked};
      const priced=enrichment.priceLines.filter(p=>!indicative(p));
      presentation[slug]={published:!!priced.length,price:priced.length?'See published prices':'Ask for a quote',detail:priced.length?`${priced.length} sourced pricing entries. Confirm the job, inclusions and total.`:'No company rate captured. Ask for a job-specific quote.'};
    }
    if(original && !presentation[slug].published) {const fresh=enrichment.priceLines.filter(p=>!indicative(p));if(fresh.length) presentation[slug]={...presentation[slug],published:true,price:'See published prices',detail:`${fresh.length} newly sourced pricing entries. Confirm the job, inclusions and total.`};}
    const photos=(row.photos||[]).filter(p=>http(p.fileUrl)&&http(p.pageUrl));
    const uncertainLogo=row.logo?.logo_unsure===true||row.logo?.display==='initials';
    const logoAsset=bundledLogo(row.logo);
    if(logoAsset) {presentation[slug].logo=logoAsset.src;presentation[slug].logoAsset=logoAsset;}
    if(uncertainLogo) {
      delete presentation[slug].logo;
      delete presentation[slug].logoAsset;
      presentation[slug].logoReview={status:'needs-review',reason:text(row.logo.logo_unsure_reason),sourceUrl:http(row.logo.source_url),checkedAt:text(row.logo.audit?.checkedAt)};
      report.warnings.push({slug,issue:'Uncertain logo withheld; initials shown',reason:text(row.logo.logo_unsure_reason)});
    }
    if(presentation[slug].logo && !presentation[slug].logo.startsWith('/logos/')) delete presentation[slug].logo;
    if(!presentation[slug].photos?.length) presentation[slug].photos=photos.filter(p=>p.kind!=='logo').slice(0,3).map(p=>({src:p.fileUrl,sourceUrl:p.pageUrl,caption:`${human(p.kind)} photo from ${company.name}`}));
    companies.push(company);
    report.published.push({id:row.id,slug,name:company.name,categories:company.categories,primaryTrade:category,curated:!!original});
    report.byTrade[category].published++;
    if(row.flags?.length) report.warnings.push({slug,issue:'Non-blocking database flags',flags:row.flags});
    if(company.alternatePhones.length) report.warnings.push({slug,issue:'Alternate phone shown with source label; primary phone remains the main contact'});
    if((row.address?.alt||row.alt_contacts?.some(c=>c.field==='address'))) report.warnings.push({slug,issue:'Alternate address exists; primary database address retained'});
    if(enrichment.priceLines.some(p=>p.unitInferred)) report.warnings.push({slug,issue:'Inferred price units labelled for confirmation'});
    if(enrichment.priceLines.some(indicative)) report.warnings.push({slug,issue:'General pricing references labelled separately from company rates'});
    if(enrichment.priceLines.some(p=>p.service.length>120||p.price_text.length>120||/as printed/i.test(p.unit||''))) report.warnings.push({slug,issue:'Automatically extracted price text needs editorial review; source wording retained'});
  }
  const present=new Set(companies.map(c=>c.slug));
  for(const slug of curated.keys()) if(!present.has(slug)) {
    if(!report.excluded.some(r=>r.slug===slug)) throw new Error(`Curated profile ${slug} is missing from the release. Import stopped.`);
    report.warnings.push({slug,issue:'Original write-up preserved in source data; page withheld because release has a blocking flag'});
  }
  for(const key of Object.keys(profiles)) if(!present.has(key)&&!curated.has(key)) {delete profiles[key];delete presentation[key];}
  companies.sort((a,b)=>a.slug.localeCompare(b.slug));
  const groups={};
  for(const c of companies) if(c.enrichment.operatorGroup) {
    const id=c.enrichment.operatorGroup;
    groups[id] ||= {label:db.operatorGroups?.[id]?.label || (id==='sg-city-21-woodlands-cl'?'SG City and City Cooling, 21 Woodlands Close':human(id)),members:[]};
    groups[id].members.push({slug:c.slug,name:c.name});
  }
  report.publishedCount=companies.length;report.excludedCount=report.excluded.length;
  return {companies:{capturedAt:db.checked,capturedLabel:new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(String(db.checked).slice(0,10)+'T12:00:00Z')),companies},profiles,presentation,groups,report,registry:registryOut};
}

// CLI removed in HomezyPro: run `npm run import:data` (scripts/import-data.mjs).

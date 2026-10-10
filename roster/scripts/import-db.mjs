import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const BLOCKED = new Set(['not-a-trade-business','not-singapore','site-spam-injection','possible-duplicate','no-sg-postal-code','marketplace','possible-platform','google-listing-mismatch','website-not-company-site','thin-profile','site-placeholder-content','website-inactive','lookup-name-looks-unrelated','trade-unclear']);
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
  return text(address).replace(/[\u2010-\u2015]/g,'-').replace(/#\s*[a-z0-9]+(?:\s*[-/]\s*[a-z0-9]+|\s+\d{1,4}\b)?/gi,'').replace(/\bunit\s*#?\s*[\w]+(?:\s*[-/]\s*[\w]+)*/gi,'').replace(/\s*,\s*,/g,',').replace(/\s+,/g,',').replace(/\s{2,}/g,' ').trim();
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

export function priceOption(item) {
  const details = [
    item.qty != null ? `Quantity: ${item.qty}` : '',
    text(item.unit),
    text(item.gst_note || item.gst) ? `GST: ${text(item.gst_note || item.gst)}` : '',
    item.promo ? 'Promotional rate; confirm availability' : '',
    item.was_amount_sgd != null ? `Previously S$${item.was_amount_sgd}` : ''
  ];
  const longPrice=text(item.price_text).length>65 || !/(?:S?\$|SGD)\s*\d/i.test(text(item.price_text));
  const label=text(item.service).length>100&&item.job ? human(item.job) : text(item.service);
  return {label,price:longPrice?'See source details':text(item.price_text),detail:details.filter(Boolean).join('. '),excerpt:text(item.excerpt)||text(item.price_text),sourceUrl:cited(item),capturedAt:item.capturedAt,indicative:indicative(item)};
}
const sourcedFact = item => cited(item) && item.value != null ? {...item,sourceUrl:cited(item)} : null;
export function verifyRelease(source, checksum) {
  const expected = String(checksum).trim().split(/\s+/)[0].toLowerCase();
  const actual = createHash('sha256').update(source).digest('hex');
  if(!/^[a-f0-9]{64}$/.test(expected) || expected !== actual) throw new Error('Release checksum mismatch. Import stopped before writing any site data.');
  return actual;
}

function reviewRows(row, mapsUrl) {
  return (row.reviews||[]).filter(r=>r.excerpt && (r.author||r.author_initials_or_handle) && (r.date||r.relativeTime) && cited(r)).slice(0,5).map(r=>({excerpt:text(r.excerpt),author:text(r.author||r.author_initials_or_handle),relativeTime:text(r.date||r.relativeTime),sourceUrl:http(r.source_url||r.sourceUrl),sourceLabel:text(r.source||r.sourceLabel),mapsUrl:http(r.maps_url)||mapsUrl,capturedAt:r.capturedAt||row.checked}));
}
export function importDatabase(db, seeds, registry={}) {
  const report={sourceChecked:db.checked,sourceRows:db.companies.length,published:[],excluded:[],warnings:[],byTrade:{}};
  for(const t of Object.keys(types)) report.byTrade[t]={published:0,excluded:0};
  const curated=new Map(seeds.companies.companies.filter(c=>c.publish!==false).map(c=>[c.slug,c]));
  const profiles=structuredClone(seeds.profiles), presentation=structuredClone(seeds.presentation);
  const companies=[]; const used=new Set([...curated.keys(),...Object.values(registry)]); const registryOut={...registry};
  for(const raw of db.companies) {
    const row=clean(raw); if(row.flags?.includes('price-indicative-only')) for(const p of row.price_lines||[]) p.indicative=true; const original=curated.get(row.rosterProfile?.slug);
    const categories=[...new Set((row.categories||[]).map(cat).filter(t=>types[t]))];
    const reasons=(row.flags||[]).filter(f=>BLOCKED.has(f));
    if(row.profile_rolled_back) reasons.push('profile-rolled-back');
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
    if(!categories.length&&!original) reasons.push('missing-trade');
    if(reasons.length) {
      report.excluded.push({id:row.id,name:row.name,categories,reasons:[...new Set(reasons)],...(original?{curated:true,slug:original.slug}: {})});
      for(const t of categories) report.byTrade[t].excluded++;
      continue;
    }
    const category=original?.category || cat(row.profile?.trade) || categories[0];
    if(!types[category]) throw new Error(`Invalid trade for ${row.id}`);
    let slug=original?.slug||registry[row.id]||slugify(row.profile?.slug||row.name)||slugify(row.id);
    if(!original && used.has(slug) && registry[row.id]!==slug) slug+=`-${slugify(row.id)}`;
    if(!original && used.has(slug) && registry[row.id]!==slug) throw new Error(`Duplicate slug ${slug}`);
    used.add(slug);registryOut[row.id]=slug;
    const mapsUrl=http(row.google_maps_url)||original?.mapsUrl||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.name+' Singapore')}`;
    const address=contact(row.address,website);
    if(address) {address.street=address.value;address.postal=text(row.address?.postal);}
    const enrichment={checkedAt:row.checked,supportedServices:(row.services||[]).filter(cited).map(s=>({name:human(s.name),sourceUrl:s.sourceUrl,capturedAt:s.capturedAt})),about:(row.about||[]).filter(a=>text(a.text)&&cited(a)),hours:row.hours?.text&&cited(row.hours)?row.hours:row.hours_google?.text&&cited(row.hours_google)?row.hours_google:null,serviceArea:row.service_area?.value&&cited(row.service_area)?row.service_area:null,residential:row.residential?.value&&cited(row.residential)?row.residential:null,licences:(row.licences||[]).filter(l=>l.type&&http(l.claimedOn||l.sourceUrl)),management:(row.management||[]).filter(m=>m.name&&cited(m)),uen:text(row.uen),uenSource:http(row.uen_source?.sourceUrl),operatorGroup:row.operator_group,priceLines:(row.price_lines||[]).filter(p=>p.service&&p.price_text&&cited(p)),websiteCheck:row.profile?.websiteCheck||null};
    Object.assign(enrichment, {
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
    company.categories=[...new Set([category,...categories])];
    company.area=district(company.address?.value||'');
    company.googleRating=Number.isFinite(row.google_rating)&&row.google_rating>0&&row.google_rating<=5&&http(row.google_maps_url)&&row.google_read_at?{value:row.google_rating,count:Number.isInteger(row.google_review_count)&&row.google_review_count>0?row.google_review_count:null,sourceUrl:http(row.google_maps_url),checkedAt:row.google_read_at,sourceType:'google-maps-search'}:null;
    if(!original) {
      const services=serviceRows(row,category);
      profiles[slug]={headline:`Services published by ${company.name}.`,about:enrichment.about.map(a=>a.text),services,highlights:[],sourceUrls:[...new Set(enrichment.about.map(a=>a.sourceUrl))],updatedAt:row.checked};
      const priced=enrichment.priceLines.filter(p=>!indicative(p));
      presentation[slug]={published:!!priced.length,price:priced.length?'See published prices':'Ask for a quote',detail:priced.length?`${priced.length} sourced pricing entries. Confirm the job, inclusions and total.`:'No company rate captured. Ask for a job-specific quote.'};
    }
    if(original && !presentation[slug].published) {const fresh=enrichment.priceLines.filter(p=>!indicative(p));if(fresh.length) presentation[slug]={...presentation[slug],published:true,price:'See published prices',detail:`${fresh.length} newly sourced pricing entries. Confirm the job, inclusions and total.`};}
    const photos=(row.photos||[]).filter(p=>http(p.fileUrl)&&http(p.pageUrl));
    if(!presentation[slug].logo) {const logo=photos.find(p=>p.kind==='logo');if(logo) presentation[slug].logo=logo.fileUrl;}
    if(!presentation[slug].photos?.length) presentation[slug].photos=photos.filter(p=>p.kind!=='logo').slice(0,3).map(p=>({src:p.fileUrl,sourceUrl:p.pageUrl,caption:`${human(p.kind)} photo from ${company.name}`}));
    companies.push(company);
    report.published.push({id:row.id,slug,name:company.name,categories:company.categories,curated:!!original});
    for(const t of company.categories) report.byTrade[t].published++;
    if(row.flags?.length) report.warnings.push({slug,issue:'Non-blocking database flags',flags:row.flags});
    if((row.phone?.alt||row.alt_contacts?.some(c=>c.field==='phone'))&&!original) report.warnings.push({slug,issue:'Alternate phone omitted; primary database phone retained'});
    if((row.address?.alt||row.alt_contacts?.some(c=>c.field==='address'))) report.warnings.push({slug,issue:'Alternate address exists; primary database address retained'});
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

const script=fileURLToPath(import.meta.url);
if(process.argv[1]&&path.resolve(process.argv[1])===script) {
  const root=path.resolve(path.dirname(script),'..');
  const releases=path.join(os.homedir(),'Library/CloudStorage/GoogleDrive-marinov.mvm@gmail.com/My Drive/Roster/db-expanded/releases');
  let input=process.argv[2]||process.env.ROSTER_DB_PATH;
  if(!input) {
    const latest=(await readFile(path.join(releases,'LATEST'),'utf8')).trim();
    if(path.basename(latest)!==latest || !/^companies-[a-z0-9-]+\.json$/i.test(latest)) throw new Error('Invalid release filename in LATEST');
    input=path.join(releases,latest);
  }
  if(path.basename(input)==='companies.json') throw new Error('Use a checksum-verified release, not the working companies.json');
  const source=await readFile(input,'utf8');
  const checksum=verifyRelease(source,await readFile(input+'.sha256','utf8'));
  const seeds={};for(const f of ['companies','profiles','presentation']) seeds[f]=JSON.parse(await readFile(path.join(root,'data/curated',f+'.json'),'utf8'));
  let registry={};try{registry=JSON.parse(await readFile(path.join(root,'data/slug-registry.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  const data=importDatabase(JSON.parse(source),seeds,registry);
  data.report.sourceSha256=checksum;
  data.report.sourceRelease=path.basename(input);
  await mkdir(path.join(root,'data'),{recursive:true});
  for(const [name,key] of [['companies','companies'],['profiles','profiles'],['presentation','presentation'],['operator-groups','groups'],['import-report','report'],['slug-registry','registry']]) await writeFile(path.join(root,'data',name+'.json'),JSON.stringify(data[key],null,2)+'\n');
  console.log(`Imported ${data.report.publishedCount} profiles; excluded ${data.report.excludedCount} rows.`);
  console.table(data.report.byTrade);
}

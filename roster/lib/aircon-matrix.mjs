import {rateProblem,minimumCompanies} from './sourced-rates.mjs';

// Aircon price matrix from published company rates only. Each cell takes one lowest matching
// rate per company; a cell with fewer than minimumCompanies companies is left empty.
// Rows use the release's job field. Columns are either the number of units the printed price
// covers (as the release records it) or the unit size/type the company names in the entry.
export const matrixServices = [
  {id:'general',label:'General servicing',jobs:['general-service','general-servicing'],match:/servic/i},
  {id:'wash',label:'Chemical wash',jobs:['chemical-wash'],match:/chemical wash|wash/i},
  {id:'overhaul',label:'Chemical overhaul',jobs:['chemical-overhaul'],match:/overhaul/i},
  {id:'gas',label:'Gas top-up',jobs:['gas-top-up'],match:/gas|refrigerant|r32|r410|r22/i}
];
export const unitColumns = [
  {id:'1',label:'1 unit',test:p=>p.units_in_price===1},
  {id:'2',label:'2 units',test:p=>p.units_in_price===2},
  {id:'3',label:'3 units',test:p=>p.units_in_price===3},
  {id:'4',label:'4 units',test:p=>p.units_in_price===4},
  {id:'5+',label:'5 or more units',test:p=>p.units_in_price>=5}
];
const size = n => new RegExp(String.raw`\b${n}(?:[,.]?000)?\s*(?:k\b|btu)`,'i');
const anySize = /\b\d{1,2}(?:[,.]?000)?\s*(?:k\b|btu)|cassette|ceiling/i;
const flat = s => String(s||'').replace(/(\d),(?=\d{3}\b)/g,'$1').replace(/\s+/g,' ');
// The words printed just before this amount, after the previous price in the same entry:
// "9K - 12K BTU...... $120 | 18K BTU...... $140" gives "18K BTU......" for the S$140 line.
function segment(p) {
  const n=String(p.amount_sgd),amount=n.includes('.')?n.replace('.',String.raw`\.`)+'0*':n+String.raw`(?:\.0+)?`;
  const t=flat(p.price_text),m=new RegExp(String.raw`(?:S\$|SGD\s*\$?|\$)\s*${amount}(?!\d)`,'i').exec(t);
  return m?(t.slice(0,m.index).split(/\||\$\s*\d[\d.]*/).filter(s=>/\w/.test(s)).pop()||''):'';
}
// Size named for this amount: in its own segment, else in a label that prints no other price.
function sizeText(p) {
  const seg=segment(p);if(anySize.test(seg))return seg;
  const label=flat(p.service_raw||p.service);return /\$\s*\d/.test(label)?'':label;
}
export const sizeColumns = [
  {id:'9k',label:'9,000 BTU',test:p=>size(9).test(sizeText(p))},
  {id:'12k',label:'12,000 BTU',test:p=>size(12).test(sizeText(p))},
  {id:'18k',label:'18,000 BTU',test:p=>size(18).test(sizeText(p))},
  {id:'24k',label:'24,000 BTU',test:p=>size(24).test(sizeText(p))},
  {id:'ceiling',label:'Ceiling cassette',test:p=>/cassette|ceiling/i.test(sizeText(p))}
].map(c=>({...c,test:p=>p.units_in_price===1&&!/\b(?:below|under|less than|above|over|more than|or more|and above)\b/i.test(sizeText(p))&&c.test(p)}));

// Entries that are not a one-off price for the stated number of units.
const notOneOff = /package|contract|\/\s*year|per year|yearly|annual|anti.?mould|\bgold\b|platinum|premium|warranty/i;
const perUnitWording = /\beach\b|per unit|\/\s*unit|\bx\s*\d|above|onwards|\bfrom\b/i;
function unitsAgree(p) {
  const text=`${segment(p)} ${p.units_in_price>1?flat(p.price_text):''}`;
  if(p.units_in_price>1&&perUnitWording.test(text))return false;
  const count=s=>[...s.matchAll(/\b(\d+)\s*(?:units?|fcus?|fan ?coils?)\b/gi)].map(m=>Number(m[1]));
  const label=flat(p.service_raw||p.service);
  const stated=count(segment(p)).length?count(segment(p)):/\$\s*\d/.test(label)?[]:count(label);
  return !stated.length||stated.at(-1)===p.units_in_price;
}

function usable(p, service) {
  if(!service.jobs.includes(p.job)||p.promo||p.indicative||!Number.isFinite(p.amount_sgd)||p.amount_sgd<=0)return false;
  if(!/^https?:\/\//.test(p.sourceUrl||'')||!/^\d{4}-\d{2}-\d{2}/.test(p.capturedAt||''))return false;
  if(notOneOff.test(`${p.service_raw||p.service} ${p.price_text}`)||!unitsAgree(p))return false;
  // The words before this amount name a different service ("Chemical Overhaul $80 | General ...").
  const seg=segment(p);if(!service.match.test(seg)&&matrixServices.some(s=>s!==service&&s.match.test(seg)))return false;
  const problem=rateProblem(p,{trade:'aircon',match:service.match});
  // The guard against "general" rates exists for single-service guides; it does not apply to the general-servicing row.
  return !problem||(service.id==='general'&&problem==='general rate for several services');
}
export function airconMatrix(companies, columns) {
  const rows=matrixServices.map(service=>({service,cells:columns.map(column=>{
    const lowest=new Map();
    for(const c of companies.filter(c=>c.category==='aircon'))for(const p of c.enrichment?.priceLines||[]){
      if(!usable(p,service)||!column.test(p))continue;
      const best=lowest.get(c.slug);if(!best||p.amount_sgd<best.line.amount_sgd)lowest.set(c.slug,{company:c,line:p});
    }
    const entries=[...lowest.values()].sort((a,b)=>a.line.amount_sgd-b.line.amount_sgd||a.company.name.localeCompare(b.company.name));
    const amounts=entries.map(e=>e.line.amount_sgd);
    return {column,entries,count:entries.length,shown:entries.length>=minimumCompanies,min:amounts[0],max:amounts.at(-1),median:amounts.length?(amounts.length%2?amounts[(amounts.length-1)/2]:(amounts[amounts.length/2-1]+amounts[amounts.length/2])/2):null};
  })}));
  return rows;
}

import {rateProblem,minimumCompanies,ownLabelSource,ownService} from './sourced-rates.mjs';

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
  const label=flat(ownService(p));return /\$\s*\d/.test(label)?'':label;
}
export const sizeColumns = [
  {id:'9k',label:'9,000 BTU',test:p=>size(9).test(sizeText(p))},
  {id:'12k',label:'12,000 BTU',test:p=>size(12).test(sizeText(p))},
  {id:'18k',label:'18,000 BTU',test:p=>size(18).test(sizeText(p))},
  {id:'24k',label:'24,000 BTU',test:p=>size(24).test(sizeText(p))},
  {id:'ceiling',label:'Ceiling cassette',test:p=>/cassette|ceiling/i.test(sizeText(p))}
].map(c=>({...c,test:p=>p.units_in_price===1&&!/\b(?:below|under|less than|above|over|more than|or more|and above)\b/i.test(sizeText(p))&&c.test(p)}));

// Entries that are not a one-off price for the stated number of units.
const notOneOff = /package|contract|\/\s*year|per year|yearly|annual|quarterly|anti.?mould|\bgold\b|platinum|premium|warranty/i;
const perUnitWording = /\beach\b|per unit|\/\s*unit|\bx\s*\d|above|onwards|\bfrom\b/i;
const words = {one:1,single:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
const count=s=>[...s.matchAll(/\b(\d+|one|single|two|three|four|five|six|seven|eight|nine|ten)\s*(?:units?|fcus?|fan ?coils?|fancoils?)\b/gi)].map(m=>words[m[1].toLowerCase()]||Number(m[1]));
// The words around this row's amount in one text: from the previous price to the next one.
// "$120 for 1 unit, $100 each for 2 units or more" gives "for 1 unit," for the S$120 row.
function around(text, amount) {
  const t=flat(text),prices=[...t.matchAll(/(?:S\$|SGD\s*\$?|\$)\s*(\d+(?:\.\d+)?)/gi)];
  if(!prices.length)return t;
  const i=prices.findIndex(m=>Number(m[1])===amount);if(i<0)return '';
  const start=i?prices[i-1].index+prices[i-1][0].length:0,end=prices[i+1]?.index??t.length;
  return t.slice(start,prices[i].index)+' '+t.slice(prices[i].index+prices[i][0].length,end);
}
// The row's own words: around the amount in price_text and in the last part of the excerpt, plus its
// own label (never the previous tier's) when the label prints no price.
// The label only counts when price_text is a bare amount ("S$30.00" under "3 unit and above : ...").
const ownWords = p => {const own=around(p.price_text,p.amount_sgd),label=flat(ownLabelSource(p));return [own,around(String(p.excerpt||'').split('|').pop(),p.amount_sgd),/[a-z]{3}/i.test(own)||/\$\s*\d/.test(label)?'':label].join(' | ');};
function unitsAgree(p) {
  const text=`${segment(p)} ${p.units_in_price>1?flat(p.price_text):''}`;
  if(p.units_in_price>1&&perUnitWording.test(text))return false;
  const label=flat(ownService(p));
  const stated=count(segment(p)).length?count(segment(p)):/\$\s*\d/.test(label)?[]:count(label);
  return !stated.length||stated.at(-1)===p.units_in_price;
}
// Why a row cannot sit in a "number of units" cell, or null. The release's qty, min_units and
// units_in_price must agree, and the row's own words must not make it a per-unit, additional-unit
// or minimum-quantity rate ("3 unit and above", "05 and above", "*Additional Fan Coil Unit").
export function unitRowProblem(p) {
  const n=p.units_in_price,own=ownWords(p);
  if(!Number.isInteger(n)||n<1)return 'no unit count';
  if(p.qty!=null&&p.qty!==n)return `qty ${p.qty} disagrees with ${n} units`;
  if(p.min_units!=null&&p.min_units>1)return `minimum ${p.min_units} units`;
  if(/\badditional\b|\bsubsequent\b|\bsecond unit\b|\bsucceeding\b/i.test(own))return 'additional-unit rate';
  if(/(?<![\d.$])\b\d+\s*(?:units?|fcus?|fan ?coils?|fancoils?)?\s*(?:and|&|or)\s*(?:above|more)\b|\b\d+\s*(?:units?|fcus?|fan ?coils?)\s*\+|\b\d+\s*(?:units?|fcus?|fan ?coils?)\s*above|\bunits? and above\b/i.test(own))return 'minimum-quantity rate';
  const stated=count(own);if(stated.length&&!stated.includes(n))return `text names ${stated.join('/')} units, release says ${n}`;
  // "from as low as $20 a unit. A single unit is $50": this amount is not the one-unit price.
  if(n===1){
    const t=flat(p.price_text),unit=String.raw`(?:single unit|\b1\s*(?:unit|fan ?coil|fancoil|fcu)|\bone unit)`;
    const singles=[...t.matchAll(new RegExp(String.raw`${unit}\s*(?:is|=|:|-|–|→|…|\.)*\s*(?:S\$|\$)\s*(\d+(?:\.\d+)?)`,'gi')),...t.matchAll(new RegExp(String.raw`(?:S\$|\$)\s*(\d+(?:\.\d+)?)\s*(?:for|\/)\s*(?:a\s+|one\s+)?${unit}`,'gi'))].map(m=>Number(m[1]));
    if(singles.length&&!singles.includes(p.amount_sgd))return `one-unit price printed is S$${singles[0]}`;
  }
  return null;
}
// Totals for several units checked against the same company's own one-unit price: a "total" below
// one unit's price is a per-unit rate, and one above N times it is a contract or a different table.
function tierProblem(p, oneUnit) {
  const n=p.units_in_price;if(n<=1||!oneUnit)return null;
  if(p.amount_sgd<oneUnit)return `total S$${p.amount_sgd} for ${n} units is below the one-unit price S$${oneUnit}`;
  if(p.amount_sgd>n*oneUnit)return `total S$${p.amount_sgd} for ${n} units is above ${n} × S$${oneUnit}`;
  return null;
}

function usable(p, service, oneUnit) {
  if(!service.jobs.includes(p.job)||p.promo||p.indicative||!Number.isFinite(p.amount_sgd)||p.amount_sgd<=0)return false;
  if(!/^https?:\/\//.test(p.sourceUrl||'')||!/^\d{4}-\d{2}-\d{2}/.test(p.capturedAt||''))return false;
  if(notOneOff.test(`${ownService(p)} ${p.price_text} ${String(p.excerpt||'').split('|').pop()}`)||!unitsAgree(p))return false;
  if(service.id==='gas'&&/nitrogen|pressure test|install|coil/i.test(`${ownService(p)} ${p.price_text}`))return false;
  if(oneUnit!==undefined&&(unitRowProblem(p)||tierProblem(p,oneUnit)))return false;
  // The words before this amount name a different service ("Chemical Overhaul $80 | General ...").
  const seg=segment(p);if(!service.match.test(seg)&&matrixServices.some(s=>s!==service&&s.match.test(seg)))return false;
  const problem=rateProblem(p,{trade:'aircon',match:service.match});
  // The guard against "general" rates exists for single-service guides; it does not apply to the general-servicing row.
  return !problem||(service.id==='general'&&problem==='general rate for several services');
}
// The company's own lowest genuine one-unit price for this service, or null.
export function oneUnitPrice(lines, service) {
  const ones=lines.filter(p=>p.units_in_price===1&&usable(p,service)&&!unitRowProblem(p)).map(p=>p.amount_sgd);
  return ones.length?Math.min(...ones):null;
}
// A genuine one-unit general-servicing price (used by the home page sample as well as the matrix).
export const isOneUnitRate = (p, lines) => p.units_in_price===1&&usable(p,matrixServices[0],oneUnitPrice(lines,matrixServices[0]));
export function airconMatrix(companies, columns) {
  const rows=matrixServices.map(service=>({service,cells:columns.map(column=>{
    const lowest=new Map();
    for(const c of companies.filter(c=>c.category==='aircon')){const lines=c.enrichment?.priceLines||[],oneUnit=oneUnitPrice(lines,service);for(const p of lines){
      if(!usable(p,service,oneUnit)||!column.test(p))continue;
      const best=lowest.get(c.slug);if(!best||p.amount_sgd<best.line.amount_sgd)lowest.set(c.slug,{company:c,line:p});
    }}
    const entries=[...lowest.values()].sort((a,b)=>a.line.amount_sgd-b.line.amount_sgd||a.company.name.localeCompare(b.company.name));
    const amounts=entries.map(e=>e.line.amount_sgd);
    return {column,entries,count:entries.length,shown:entries.length>=minimumCompanies,min:amounts[0],max:amounts.at(-1),median:amounts.length?(amounts.length%2?amounts[(amounts.length-1)/2]:(amounts[amounts.length/2-1]+amounts[amounts.length/2])/2):null};
  })}));
  return rows;
}

import {tidyPriceLabel} from './profile-copy.mjs';

// Guides and intent pages show only published, sourced company rates: one lowest matching
// non-promotional rate per company, each with its company, source link and capture date.
export const guideEvidence = {
  'AC-04':{name:'Aircon installation',trade:'aircon',match:/install/i,exclude:/dismantl|remov|trunking only|chemical|servic/i,title:'Published aircon installation rates',noun:'installation'},
  'AC-06':{name:'Aircon repair or troubleshooting',trade:'aircon',match:/repair|troubleshoot|diagnos|inspection|compressor/i,exclude:/servic|chemical|wash|install/i,title:'Published aircon repair and inspection rates',noun:'repair or inspection'},
  'AC-07':{name:'Aircon leak repair',trade:'aircon',match:/leak|water pump|condensate|drain/i,exclude:/servic|chemical|install/i,title:'Published rates for aircon leak work',noun:'leak-related'},
  'CL-04':{trade:'cleaning',match:/tenancy|move.?out|move.?in.*out|handover/i,title:'Published move-out and end-of-tenancy cleaning rates',noun:'move-out cleaning'},
  'CL-05':{trade:'cleaning',match:/part.?time|hourly|weekly|fortnightly|regular/i,exclude:/deep|post.?reno|office|move/i,unit:'per hour',title:'Published part-time cleaning rates',noun:'part-time cleaning'},
  'CL-06':{trade:'cleaning',match:/post.?reno/i,title:'Published post-renovation cleaning rates',noun:'post-renovation cleaning'},
  'CL-07':{trade:'cleaning',match:/steam/i,title:'Published steam cleaning rates',noun:'steam cleaning'},
  'CL-08':{trade:'cleaning',match:/office|commercial/i,exclude:/home|residential|house/i,title:'Published office cleaning rates',noun:'office cleaning'},
  'AC-08':{trade:'aircon',match:/overhaul/i,exclude:/condenser|contract|package|annual|yearly/i,unit:'per unit',title:'Published chemical overhaul rates',noun:'chemical overhaul'},
  'AC-09':{trade:'aircon',match:/condenser|outdoor unit clean/i,exclude:/tray|gas level|fan ?coil|overhaul|promotion|servicing,/i,unit:'per unit',title:'Published condenser cleaning rates',noun:'condenser cleaning'},
  'CL-10':{trade:'cleaning',match:/curtain/i,exclude:/install|track|rod|blind/i,title:'Published curtain cleaning rates',noun:'curtain cleaning'},
  'HM-05':{trade:'handyman',match:/assembl|ikea/i,exclude:/handyman help|starting prices/i,title:'Published furniture assembly rates',noun:'furniture assembly'},
  'EL-07':{trade:'electrician',match:/light|downlight/i,exclude:/repair|fan/i,title:'Published light installation rates',noun:'light installation'},
  'EL-08':{trade:'electrician',serviceOnly:true,match:/socket|power point/i,exclude:/isolator|hob|oven|water heater|aircon/i,title:'Published socket and power point rates',noun:'socket installation'},
  'HM-06':{name:'Lock replacement or repair',trade:'handyman',serviceOnly:true,match:/\block/i,exclude:/exclude lock|door repair|window repair/i,title:'Published lock replacement and repair rates',noun:'lock'},
  'HM-07':{trade:'handyman',serviceOnly:true,match:/curtain|blind/i,exclude:/tv bracket/i,title:'Published curtain and blind installation rates',noun:'curtain installation'},
  'PL-08':{name:'Tap replacement or repair',trade:'plumbing',serviceOnly:true,match:/\btap\b|faucet|mixer/i,exclude:/washing machine/i,title:'Published tap replacement and repair rates',noun:'tap'},
  'PL-09':{name:'Basin installation',trade:'plumbing',serviceOnly:true,match:/basin/i,exclude:/tap|faucet|choke|clog|mixer|hose|leak/i,title:'Published basin installation rates',noun:'basin'},
  'CL-11':{trade:'cleaning',serviceOnly:true,match:/ad.?hoc|one.?time|one.?off/i,exclude:/deep|move|post|office|aircon/i,title:'Published ad hoc cleaning rates',noun:'ad hoc cleaning'},
  'EL-09':{name:'DB box replacement',trade:'electrician',serviceOnly:true,match:/db box|distribution board/i,exclude:/trunking|cable pull/i,title:'Published DB box replacement rates',noun:'DB box'},
  'CL-12':{trade:'cleaning',serviceOnly:true,match:/disinfect|sanitis/i,exclude:/steam/i,title:'Published disinfection rates',noun:'disinfection'},
  'CL-09':{trade:'cleaning',match:/mattress/i,title:'Published mattress cleaning rates',noun:'mattress cleaning'},
  'HM-03':{trade:'handyman',match:/paint/i,title:'Published painting rates',noun:'painting'},
  'HM-04':{trade:'handyman',match:/\btv\b|television/i,title:'Published TV mounting rates',noun:'TV mounting'},
  'PL-06':{name:'Water heater installation',trade:'plumbing',match:/instant|water heater|storage heater/i,exclude:/repair|servic/i,title:'Published water heater installation rates',noun:'water heater'},
  'chemical-wash':{trade:'aircon',match:/chemical wash/i,exclude:/overhaul|contract|package|annual/i,unit:'per unit',title:'Published chemical wash rates',noun:'chemical wash'},
  'gas-top-up':{trade:'aircon',match:/gas top|refrigerant|r32|r410|r22/i,exclude:/servic|chemical|install/i,title:'Published gas top-up rates',noun:'gas top-up'}
};
// A comparison needs at least three companies; smaller samples are not rendered.
export const minimumCompanies = 3;

/* ---------- Reading the source wording ---------- */

const CUR = String.raw`(?:S\$|SGD\s*\$?|SG\s*\$|\$)\s*`;
const FROM = String.raw`(?:\bfrom|\bstarting(?:\s+(?:from|at))?|\bstarts?(?:\s+(?:from|at))?|\bbegins?\s+at|\bas low as)\s*:?\s*(?:just\s+|only\s+)?`;
// Drop thousands separators so "$1,998" can be compared with 1998.
const plain = text => String(text || '').replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/\s+/g, ' ');
const amountPattern = n => `${String(n).replace('.', String.raw`\.`)}(?:\\.0+)?(?!\\d|\\.\\d)`;
const sourceTexts = p => [p.price_text, p.service_raw || p.service];

// The source calls the amount a starting price: "From $80", "starts from just S$80", "$90 onwards".
export function isFromPrice(p) {
  if (/\bfrom\b|starting/i.test(p.unit || '')) return true;
  const amount = amountPattern(p.amount_sgd);
  const before = new RegExp(FROM + CUR + amount, 'i');
  const after = new RegExp(CUR + amount + String.raw`\s*\*?\s*(?:nett\s*)?(?:(?:\/\s*|per\s+)[a-z]+\s*)?(?:nett\s*)?onwards`, 'i');
  return sourceTexts(p).some(t => before.test(plain(t)) || after.test(plain(t)));
}

// The full printed range: the release's amount_max_sgd, or "$40-$80" printed from the shown amount.
export function priceRange(p) {
  const open = max => sourceTexts(p).some(t => new RegExp(CUR + '?' + amountPattern(max) + String.raw`\s*\+(?!\+)`).test(plain(t)));
  if (Number.isFinite(p.amount_max_sgd) && p.amount_max_sgd > p.amount_sgd) return {max:p.amount_max_sgd, open:open(p.amount_max_sgd)};
  const printed = new RegExp(CUR + amountPattern(p.amount_sgd) + String.raw`\s*(?:-|to)\s*(?:${CUR})?(\d+(?:\.\d+)?)`, 'i');
  for (const t of sourceTexts(p)) {
    const max = Number(plain(t).match(printed)?.[1]);
    if (max > p.amount_sgd) return {max, open:open(max)};
  }
  return null;
}

const unitNames = {hour:'per hour',hr:'per hour',h:'per hour',unit:'per unit',piece:'per piece',pc:'per piece',item:'per item',point:'per point',panel:'per panel',room:'per room',light:'per light',set:'per set',month:'per month',visit:'per visit',session:'per session',kg:'per kg',psig:'per psig'};
const unitWord = String.raw`(hours?|hrs?|h|units?|pieces?|pcs?|items?|points?|panels?|rooms?|lights?|sets?|months?|visits?|sessions?|kg|psig)\b`;
const unitName = (word, additional) => {
  const key = word.toLowerCase().replace(/^(hour|hr|unit|piece|pc|item|point|panel|room|light|set|month|visit|session)s$/, '$1');
  const name = unitNames[key];
  return name && additional ? name.replace('per ', 'per additional ') : name;
};
// A unit printed right after the amount ("S$60/hour", "$60 nett per unit"), or in a
// single-price label ("Furniture Assembly (per piece)").
export function statedUnit(p) {
  const after = new RegExp(CUR + amountPattern(p.amount_sgd) + String.raw`(?:\s*(?:-|to)\s*(?:${CUR})?\d+(?:\.\d+)?)?\s*\+?\*?\s*(?:nett\s*)?(?:\/\s*|per\s+|a\s+)(additional\s+)?` + unitWord, 'i');
  const text = plain(p.price_text).match(after);
  if (text) return unitName(text[2], text[1]);
  // "Subsequent Hour: $40 - $60"
  const lead = plain(p.price_text).match(new RegExp(String.raw`\b(hour|unit|piece|point|item)\s*:\s*${CUR}${amountPattern(p.amount_sgd)}`, 'i'));
  if (lead) return unitName(lead[1]);
  if ((plain(p.price_text).match(new RegExp(CUR + String.raw`\d`, 'gi')) || []).length > 1) return null;
  const label = plain(p.service_raw || p.service).match(new RegExp(String.raw`\(\s*per\s+(additional\s+)?${unitWord}\s*\)|\bper\s+(unit|piece|item|point|hour)\b`, 'i'));
  return label ? unitName(label[2] || label[3], label[1]) : null;
}
// Release units are kept unless they were inferred or left "as printed" and the source states one.
export function displayUnit(p) {
  const unit = String(p.unit || '');
  const printed = /as printed|\(from\)|starting/i.test(unit);
  const stated = (p.unitInferred || printed) && statedUnit(p);
  if (stated) return stated;
  if (printed) return /^per \w+/.exec(unit)?.[0] || '';
  return unit;
}
// Other prices printed with the same entry, such as "From $67 (per additional point)".
export function additionalRates(p) {
  const re = new RegExp(String.raw`(\bfrom\s*)?${CUR}(\d+(?:\.\d+)?)\s*\(?\s*per\s+additional\s+${unitWord}`, 'gi');
  return [...plain(p.price_text).matchAll(re)].filter(m => Number(m[2]) !== p.amount_sgd).map(m => ({from:!!m[1], amount:Number(m[2]), unit:unitName(m[3], true)}));
}

export const money = n => `S$${Number(n).toLocaleString('en-SG')}`;
export function rateCell(p) {
  const range = priceRange(p), unit = displayUnit(p);
  const amount = range ? `${money(p.amount_sgd)} to ${money(range.max)}${range.open ? '+' : ''}` : `${isFromPrice(p) ? 'From ' : ''}${money(p.amount_sgd)}`;
  const extra = additionalRates(p).map(r => `; ${r.from ? 'from ' : ''}${money(r.amount)} ${r.unit}`).join('');
  return `${amount}${unit ? ` ${unit}` : ''}${extra}`;
}

/* ---------- Is this entry a price for the guide's service? ---------- */

// Customer testimonials quoted on company sites sometimes contain an amount.
const reviewText = /\bbooked their\b|\b(?:I|we)\s+(?:booked|called|engaged|hired|used|had)\b|\bmy (?:aircon|home|house|flat|unit|place)\b|\bhighly recommend|\bwould recommend|\bno upsell|\bthank(?:s| you)\b|\b(?:great|very good|excellent|awesome|amazing|good) (?:people|service|job|work|experience)\b|👍|⭐/iu;
// Review widgets date each quote: "4 months ago | ...".
const reviewDate = /^\W*\d+\s+(?:days?|weeks?|months?|years?)\s+ago\s*\|/i;
// Market statements and general cost guides are not a company's own rate.
const marketText = /\btypical (?:cost|price)|\bindicative\b|\bcost guide\b|\bmarket rate|\bindustry average|\baverage (?:cost|price)\b/i;
// Cross-sell wording names another service without pricing it.
const crossSell = /\b(?:commonly booked with|available with any|pairs? (?:well )?with|add [\w ,/]{2,40}? (?:on|to) the same (?:visit|booking))\b[^.|]*/gi;
// Rates for several kinds of work at once ("Handyman Help (Electrical/Plumbing/Painting...)").
const generalText = /\bhandyman help\b|\bstarting prices across\b|\bgeneral (?:ac |aircon |air.?con )?servic|\bgeneral (?:handyman|repairs?|maintenance)\b|\bminor repairs\b|\bmulti.?trade\b/i;
const serviceFamilies = Object.values(guideEvidence).map(s => s.match);
// Optional extras priced on top of another booking.
const addOnText = /\badd-?ons?\b|\boptional extras?\b/i;
// Objects that belong to one trade. An entry naming another trade's objects and none of its own is misfiled.
const tradeObjects = {
  aircon:/air.?con|\bac\b|a\/c|fan.?coils?|condenser|compressor|\bbtu\b|refrigerant|\bgas\b|chemical|cassette|ducted|inverter|cooling|isolator/i,
  plumbing:/\bpipes?\b|upvc|\btaps?\b|faucet|basin|\bsinks?\b|toilet|\bbowls?\b|cistern|water heater|choke|clog|floor trap|shower|mixer|plumb/i,
  handyman:/curtain|blinds?\b|\brods?\b|shel(?:f|ves)|mirror|furniture|ikea|\btv\b|\blocks?\b|\bdoors?\b|paint|wallpaper|handyman/i,
  electrician:/socket|power point|switch|\blights?\b|lighting|db box|distribution board|wiring|isolator|electric/i,
  cleaning:/clean|mattress|sofa|carpet|upholster|disinfect|sanitis|curtain|steam/i
};

export function rateProblem(p, spec) {
  const service = plain(p.service_raw || p.service), price = plain(p.price_text), amount = amountPattern(p.amount_sgd);
  if (reviewText.test(service) || reviewText.test(price) || /^\W*[“"]\s*\|/.test(p.excerpt || '') || reviewDate.test(p.excerpt || '')) return 'review text';
  if (marketText.test(service) || marketText.test(price)) return 'market statement, not a company rate';
  if (new RegExp(String.raw`(?:\+\s*|\badds?\s+|\bextra\s+|\bsurcharge\s+(?:of\s+)?)${CUR}${amount}`, 'i').test(price)) return 'surcharge, not a service price';
  if (addOnText.test(service) || addOnText.test(price)) return 'add-on to another booking';
  if (new RegExp(String.raw`\b(?:no|without|excluding|excl\.?|not)\s+(?:[\w-]+\s+){0,2}?(?:${spec.match.source})`, 'i').test(service)) return 'service named only in a negation';
  const own = service.replace(crossSell, ' ');
  if (spec.match.test(service) && !spec.match.test(own)) return 'service named only as a cross-sell';
  if (generalText.test(service) || generalText.test(price)) return 'general rate for several services';
  // A list of four or more kinds of work naming two or more guide services.
  const list = own.replace(/\([^)]*\)/g, ' ');
  if ((list.match(/[,/]/g) || []).length >= 3 && serviceFamilies.filter(re => re.test(list)).length >= 2) return 'general rate for several services';
  const ownTrade = tradeObjects[spec.trade];
  if (!ownTrade.test(own) && Object.entries(tradeObjects).some(([trade, re]) => trade !== spec.trade && re.test(own))) return 'work from another trade';
  const siblings = Object.values(guideEvidence).filter(s => s.trade === spec.trade && s !== spec && !s.serviceOnly);
  if (!spec.match.test(own) && siblings.some(s => s.match.test(own) && !s.exclude?.test(own))) return 'priced as a different service';
  return null;
}

/* ---------- Table rows ---------- */

function eligible(p, spec) {
  const text = spec.serviceOnly ? p.service : `${p.service} ${p.job || ''}`;
  return spec.match.test(text) && !spec.exclude?.test(text) && Number.isFinite(p.amount_sgd) && p.amount_sgd > 0 && !p.indicative && !p.promo
    && /^https?:\/\//.test(p.sourceUrl || '') && /^\d{4}-\d{2}-\d{2}/.test(p.capturedAt || '') && (!spec.unit || displayUnit(p) === spec.unit);
}
// Every candidate with the reason it was left out, for tests and audits.
export function rateCandidates(spec, companies) {
  const accepted = [], rejected = [];
  for (const company of companies.filter(c => c.category === spec.trade)) for (const line of company.enrichment?.priceLines || []) {
    if (!eligible(line, spec)) continue;
    const reason = rateProblem(line, spec);
    (reason ? rejected : accepted).push({company, line, reason});
  }
  return {accepted, rejected};
}
export function sourcedRates(spec, companies) {
  const lowest = new Map();
  for (const row of rateCandidates(spec, companies).accepted) {
    const best = lowest.get(row.company.slug);
    if (!best || row.line.amount_sgd < best.line.amount_sgd) lowest.set(row.company.slug, row);
  }
  return [...lowest.values()].sort((a, b) => a.line.amount_sgd - b.line.amount_sgd);
}

/* ---------- Service labels ---------- */

export const maxLabelLength = 90;
// Headlines, slogans, questions and sentences are not service names.
const slogan = /\b(?:best|top(?![\s-]*up)|reliable|trusted|leading|affordable|cheapest|your|our|book|today|made easy|hassle.?free)\b|#1|[!?]|\.$/i;
const fragment = /^(?:each|per \w+|\/\s*\w+|nett|onwards|from|SGD|[\d\s.,$S+-]*)$/i;
const sentenceCase = text => text.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
const hasPrice = new RegExp(CUR + String.raw`\d`, 'i');
// Cut at a word boundary, never inside a word, and drop a dangling connective.
function wordCut(text, limit) {
  if (text.length <= limit) return text;
  return text.slice(0, limit + 1).replace(/\s+\S*$/, '').replace(/[\s,;:(&/-]+(?:and|or|with|for|of|to|the|a|in)?$/i, '').replace(/[\s,;:(&/-]+$/, '');
}
const squash = text => String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// Keep the parts of a label that are not prices, unless nothing else is left.
const withoutPrices = (parts, keep = s => !hasPrice.test(s)) => parts.some(keep) ? parts.filter(keep) : parts;
// A label that is only a list of unit tiers ("for 1 unit, for 2 units, ...") says nothing about the job.
export function rateLabel(p, spec, companyName = '') {
  const plainName = () => spec ? spec.name || spec.noun.replace(/^./, c => c.toUpperCase()) : sentenceCase(p.job || 'Service');
  let label = tidyPriceLabel(p.service);
  // "| each" and other unit fragments, the company's own name, and several headings joined with "|",
  // which start at the one naming the service.
  const company = squash(companyName);
  const parts = withoutPrices(label.split(/\s*\|\s*/).map(s => s.trim()).filter(s => s && !fragment.test(s) && !(company && squash(s).length >= 4 && company.includes(squash(s)))));
  const first = spec ? Math.max(0, parts.findIndex(s => spec.match.test(s))) : 0;
  label = parts.slice(first).join(' | ');
  // Prices repeated inside the label ("Chemical Wash - from $160 per unit onwards") and leftover qualifiers.
  label = withoutPrices(label.split(/\s+-\s+/)).join(' - ')
    .replace(/\s*\(\s*(?:\/\s*\w+|from|nett|onwards|[,\s]|from,?\s*nett)+\s*\)/gi, '').replace(/[\s,]+(?:from|starting|starts|at)$/i, '');
  // A section heading glued to the entry: "13A single power point: - Double power point (13A x2)".
  const section = label.match(/^([^:]{3,60}):\s*-\s+(.+)$/);
  if (section) label = !spec || spec.match.test(section[2]) ? section[2] : `${section[1]}, ${section[2]}`;
  // Qualifiers that belong to a separately shown additional rate.
  if (additionalRates(p).length) label = label.replace(/\s*\(\s*per additional [^)]*\)/gi, '');
  const own = plain(p.price_text).match(new RegExp(CUR + amountPattern(p.amount_sgd) + String.raw`\s*\(([^)$]{3,40})\)`, 'i'))?.[1];
  if (own && !/per\s/i.test(own) && !label.toLowerCase().includes(own.toLowerCase())) label = `${label} (${own})`;
  label = label.replace(/\s+-\s+(?=\()/g, ' ').replace(/[\s,|*-]+$/, '').trim();
  const tiers = /^(?:for\s+)?\d+\+?\s*(?:units?|fan coils?|pcs|pieces)\b[^.]*,\s*(?:for\s+)?\d/i.test(label) || /^for\s+\d/i.test(label);
  if (tiers || !label) return p.job ? plainName() : label;
  // Long or descriptive labels carry a heading plus description: keep the plain service name.
  const usable = s => s.length >= 3 && s.length <= maxLabelLength && !slogan.test(s);
  if (usable(label)) return label;
  // Prefer the "-" segment that names the service: "8 units - Chemical wash (fan coil, no dismantling)."
  const segments = label.split(/\s+-\s+/).map(s => s.trim().replace(/\)\.$/, ')'));
  const heading = (spec && segments.find(s => usable(s) && spec.match.test(s))) || segments.find(usable);
  if (heading) return heading;
  const cut = wordCut(segments[0].split(/(?<=[.!?])\s+/)[0], maxLabelLength);
  return usable(cut) ? cut : plainName();
}

// Public-facing copy is derived from sourced fields. The imported evidence stays intact.
const key = value => String(value || '').toLowerCase().replace(/[-&/]/g, ' ').replace(/\s+/g, ' ').trim();
const names = {
  'general service': 'routine aircon servicing', 'general servicing': 'routine aircon servicing',
  'chemical wash': 'chemical washes', 'chemical overhaul': 'chemical overhauls',
  'gas top up': 'refrigerant top-ups', 'maintenance contract': 'maintenance plans', 'maintenance contracts': 'maintenance plans',
  'dismantle replacement': 'aircon removal and replacement', 'choke clearing': 'drain clearing',
  'leak repair': 'leak repairs', 'toilet bowl': 'toilet plumbing', 'water heater': 'water heater services',
  'tap mixer': 'tap and mixer services', 'taps mixers': 'tap and mixer services', 'sink': 'sink plumbing', 'floor trap': 'floor trap services',
  'power point': 'power point installation', 'db box': 'distribution board services', 'lew endorsement': 'LEW endorsement',
  'power trip': 'power trip troubleshooting', 'light installation': 'light installation', 'ceiling fan': 'ceiling fan services',
  'electrical': 'electrical work', 'move in out': 'move-in and move-out cleaning', 'post renovation': 'post-renovation cleaning',
  'upholstery sofa': 'sofa and upholstery cleaning', 'carpet': 'carpet cleaning', 'mattress': 'mattress cleaning',
  'curtain': 'curtain cleaning', 'ad hoc': 'one-off cleaning', 'door lock': 'door and lock services',
  'drilling mounting': 'drilling and mounting', 'tiling flooring': 'tiling and flooring', 'curtain blinds': 'curtains and blinds',
  'window': 'window services', 'aircon': 'aircon services', 'tv bracket': 'TV bracket installation', 'ev charger': 'EV charger services'
};
export function friendlyService(name, trade) {
  const k = key(name);
  if (trade === 'aircon' && ['installation', 'repair', 'troubleshooting'].includes(k)) return {installation:'aircon installation',repair:'aircon repairs',troubleshooting:'aircon troubleshooting'}[k];
  return names[k] || String(name).toLowerCase();
}
export function proseName(c) {
  return c.name.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+-\s+Plumbing Service$/i, '').trim();
}
const list = values => new Intl.ListFormat('en', {style:'long', type:'conjunction'}).format(values);
const offerings = c => [...new Set((c.enrichment?.supportedServices || []).map(s => friendlyService(s.name, c.category)))];
const tradeNames = {aircon:'aircon services', plumbing:'plumbing services', electrician:'electrical services', handyman:'handyman services', cleaning:'cleaning services'};
export function coverageCopy(c) {
  const e = c.enrichment || {}, area = e.serviceArea?.value;
  const residential = e.residential?.value === 'yes' && !!e.residential.sourceUrl;
  if (area === 'islandwide') return residential ? 'The team takes residential jobs across Singapore.' : 'The team serves customers across Singapore.';
  if (area?.startsWith('named areas:')) return `Service areas include ${area.slice(12).trim()}. Contact the team to check coverage for your address.`;
  return residential ? 'Residential bookings are available. Contact the team to discuss your job and arrange a visit.' : 'Contact the team to discuss your job, check availability and arrange a quote.';
}
export function profileIntro(c) {
  const services = offerings(c).slice(0, 4);
  return `${proseName(c)} offers ${services.length ? list(services) : tradeNames[c.category]}${c.enrichment?.serviceArea?.value === 'islandwide' ? '.' : ' in Singapore.'} ${coverageCopy(c)}`;
}
export function profileAbout(c) {
  const services = offerings(c), extra = services.slice(4, 9);
  const paragraphs = [profileIntro(c)];
  if (extra.length) paragraphs.push(`Other services include ${list(extra)}. Ask the team which option suits the work you have in mind.`);
  const priced = (c.enrichment?.priceLines || []).some(p => !p.indicative);
  paragraphs.push(priced ? 'Use the service list above to compare available prices and options. Share the details of your job with the team to confirm what is included and get a final quote.' : 'For a tailored quote, share the job details, your location and any useful photos with the team. Ask about labour, materials and any call-out charges before booking.');
  return paragraphs;
}
export function readerNote(text) {
  return String(text).replace(/^Prints a (.+?) price on its site: /, (_, service) => `${service[0].toUpperCase()}${service.slice(1)}: `)
    .replace(/^Says it takes jobs 24 hours a day$/, '24-hour bookings advertised. Confirm availability with the team.')
    .replace(/^Says it offers /, 'Offers ').replace(/^States a (.+?warranty)/, '$1 available')
    .replace(/^Has a minimum booking: /, 'Minimum booking: ').replace(/^Adds a fee: /, 'Additional charge: ')
    .replace(/^Not available some days: /, 'Closed days: ');
}
// Release labels sometimes have the amount cut out ("begins at .", "(as low as )") or end mid-word.
// Tidy only the leftover connective and fragments; the price and source excerpt are shown separately.
const connective = String.raw`(?:begins at|starts at|starting at|starting from|starts from|starts|start|starting|from|frm|fr|(?:@|at) only|at|as low as|is currently|costs?|charges? (?:is|of)|charge of|typically)`;
const abbreviation = /\b(?:incl|e\.g|i\.e|approx|min|max|hrs?|etc|vs|pte|ltd|blk|st|ave|rd|dr|mr|mrs)\.$/i;
const sentencesOf = label => label.split(/(?<=[a-z0-9)]\s?[.!?])\s+/i).reduce((out, part) => {
  if (out.length && abbreviation.test(out.at(-1))) out[out.length - 1] += ` ${part}`; else out.push(part);
  return out;
}, []);
export function tidyPriceLabel(value) {
  const original = String(value || '').replace(/\s+/g, ' ').trim();
  // "(as low as )": the amount was removed from inside the brackets.
  let label = original.replace(new RegExp(String.raw`\s*\*?\(\s*(?:[^()]*?\s)?${connective}\s+\)`, 'gi'), '')
    .replace(/\s*\(\s*\/\s*[a-z]+\s*\)/gi, '').replace(/\(\s*,\s*/g, '(').replace(/\(\s*([^()]*?\S)\s+\)/g, '($1)')
    .replace(/\s+\*\s+(?=\S)/g, ' ').replace(/\s*\*(?=\()/g, ' ')
    .replace(new RegExp(String.raw`\s+(?:is currently|currently|starts from|starts)\s*-\s+`, 'gi'), ' ')
    .replace(/\s*[,-]\s+\.\s*/g, '. ');
  const stripped = new RegExp(String.raw`(?:^|[^,:(])\s\b${connective}\s*[.,]?$`, 'i');
  const trailing = new RegExp(String.raw`(?<![,:(])\s+${connective}\s*[.,]?$`, 'i');
  let sentences = sentencesOf(label);
  // Drop sentences that lost their amount or were cut off, while a complete sentence remains.
  const broken = (s, i) => stripped.test(s) || (i === sentences.length - 1 && !/[.!?)"]$/.test(s) && (original.length >= 100 || !/\s/.test(s)));
  const kept = sentences.filter((s, i) => !broken(s, i));
  if (sentences.length > 1) sentences = kept.length && kept.join(' ').length >= 15 ? kept : [sentences[0].replace(/\s*[.,]$/, '')];
  label = sentences.join(' ').replace(trailing, '').replace(/\s+([.,])/g, '$1');
  return markSic(label.replace(/[\s,|*-]+$/, '').replace(/\s:$/, '').trim());
}
// Quoted source wording keeps its typos; a word that starts with the same consonant twice
// ("Ttroubleshooting") is marked [sic]. Words like "llama" or "eerie" are not affected.
export const markSic = value => String(value).replace(/\b([b-df-hj-km-np-tv-z])\1[a-z]{3,}\b(?! \[sic\])/gi, m => `${m} [sic]`);
// Only split the unambiguous "job | price" pattern. Preserve ranges and qualifiers.
export function priceView(p) {
  const suffix = /\s*\|\s*((?:(?:from|starting at)\s+)?(?:S?\$|SGD)\s*\d[\d,.]*(?:\s*(?:-|to)\s*(?:S?\$|SGD)?\s*\d[\d,.]*)?(?:\s*(?:\+|\+\+|onwards|nett))?)\s*$/i;
  const match = String(p.price).match(suffix);
  const price = (match ? match[1] : p.price).replace(/\bSGD\s*/gi, 'S$');
  const label = tidyPriceLabel(String(p.label || '').replace(suffix, ''));
  return {...p, price, label};
}
export function servicePrice(service) {
  const prices = service.prices.map(priceView);
  if (!prices.length) return 'Ask for a quote';
  if (prices.every(p => p.indicative)) return 'Price guide';
  if (prices.length === 1) return prices[0].price;
  // A range is shown only for simple amounts; package units remain visible below.
  if (prices.every(p => !p.indicative && /^S?\$\s*\d[\d,.]*$/.test(p.price))) {
    const amounts = prices.map(p => Number(p.price.replace(/[^\d.]/g, '')));
    const min = Math.min(...amounts), max = Math.max(...amounts);
    return min === max ? `S$${min.toLocaleString('en-SG')}` : `S$${min.toLocaleString('en-SG')} - S$${max.toLocaleString('en-SG')}`;
  }
  return service.priceSummary || `${prices.length} price options`;
}
export function serviceGuide(name, trade) {
  const k = key(name);
  const guides = {
    'toilet bowl':'Help with toilet plumbing problems, including flushing issues and worn fittings. The price options below show the specific work covered.',
    'choke clearing':'Clearing a blocked drain so water can flow again. The location and severity of the blockage can affect the work and price.',
    'leak repair':'Finding and repairing leaking plumbing. Share photos and the location of the leak so the team can advise on the next step.',
    'sink':'Help with sink plumbing, drainage and fittings. Check whether the quote includes replacement parts and labour.',
    'floor trap':'Help with floor drain blockages and drainage problems. Describe where water is backing up when requesting a quote.',
    'taps mixers':'Help with taps and mixer fittings. Confirm the fitting type and whether a replacement fixture is included.',
    'water heater':'Help with water heater work. Share the heater type and the job you need, then confirm the installation or repair scope.',
    'pipe replacement':'Replacing plumbing pipework. The pipe material, access and length of the affected section can change the quote.',
    'regular cleaning':'Recurring cleaning for everyday upkeep. Agree on the rooms, tasks, visit frequency and hours included in your booking.',
    'deep cleaning':'A more detailed clean for areas that need extra attention. Share the property size and priorities to agree on the scope.',
    'post renovation':'Cleaning after renovation work. Ask which surfaces, dust removal tasks and waste handling are included.',
    'move in out':'Cleaning around a move. Confirm the rooms, appliances and any handover requirements before booking.',
    'office cleaning':'Cleaning for workplace spaces. Agree on the areas, access arrangements and cleaning schedule.',
    'disinfection':'A treatment for agreed surfaces and spaces. Ask about the method, preparation and when the area can be used again.',
    'carpet':'Cleaning for carpets and rugs. Share the material, size and any stains to help the team quote for the right treatment.',
    'mattress':'Cleaning for mattresses. Confirm the mattress size, treatment method and drying time.',
    'upholstery sofa':'Cleaning for sofas and upholstered furniture. Share the fabric, size and any stains before agreeing on a treatment.',
    'sofa upholstery cleaning':'Cleaning for sofas and upholstered furniture. Share the fabric, size and any stains before agreeing on a treatment.'
  };
  return guides[k] || `For ${friendlyService(name, trade)}, describe the job and any specific requirements to the team. Confirm the scope, materials and total cost before booking.`;
}

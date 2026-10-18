// Display names for H1s, titles, schema, quick picks and the best-rated pages (review P1-3).
// The source name stays in companies.json; the build keeps it as `sourceName`.
// Cleaning only removes or re-cases text from the source name; it never adds words.
// Rules, in order:
//   1. Drop emoji and pictographs, "@ 98530163"-style phone numbers and trailing pipes.
//   2. Split on " | ", " - ", "- ", " -" and ": ". Keep the first part. Drop a later part (and
//      everything after it) when it makes a claim (best, #1, cheap, top, premier, finest, since 2016)
//      or, if the first part is a real name, when it is only a list of service keywords.
//   3. Drop a parenthesis that makes a claim or only lists two or more service keywords.
//   4. Tidy "( S )" spacing, drop a leading "Cheap", title-case names written entirely in lower case.
// OVERRIDES cover names the rules cannot read (brand after the keyword list, CJK tag);
// each override must use only words from the source name (checked in tests).

const KEYWORDS = new Set(`aircon air con conditioner conditioners conditioning servicing service services repair repairs
installation installations install and & cleaning clean cleaner cleaners chemical wash overhaul gas top up singapore sg
plumbing plumber plumbers electrical electrician electricians works work home homes house commercial residential office
professional pro specialist specialists maintenance renovation renovations handyman contractor contractors expert experts of
in the for ac hvac acmv deep move out end tenancy post mattress carpet upholstery curtain disinfection disinfecting drilling
painting tiling lew pe licensed license licence renewal water pipe leak leaks concealed ironing mould demolition reinforcement
concrete external road drainage system systems solar north east west south central 24 24hrs hours hour active emergency
company`.split(/\s+/));
const CLAIM = /(?:^|[\s(])(?:#\s?1|no\.?\s?1)(?=$|[\s)])|\b(?:best|cheap|cheapest|top|premier|finest|leading|number one|official|approved|trusted|since \d{4})\b/i;
const PICTO = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

export const OVERRIDES = {
  'bencool-services-professional-aircon-services-airconditioner': 'Bencool Services',
  'painting-services-in-singapore-best-painting-sg': 'Best Painting SG',
  'plumbers-singapore-plumbing-services-repair-water-pipe-repai': 'Plumbers Singapore',
  'best-aircon-servicing-and-installation-by-goodcool': 'Goodcool',
  '5-star-aircon-pte-ltd-aircon-specialist-singapore': '5 Star Aircon Pte Ltd',
  'plumbing-electrical-works-singapore-arrow-electrical-enginee': 'Arrow Electrical Engineering Pte Ltd',
  'electrical-contactor-bsm-engineering-and-construction-pte-lt': 'Bsm Engineering and Construction Pte Ltd',
  // Register casing on the Best-of pages (QA 18 Oct 2026).
  'sr-power-plumber-pte-ltd': 'SR Power Plumber Pte. Ltd.',
  'ta-solutions-pte-ltd': 'Ta Solutions Pte Ltd',
  'electrolatif-llp': 'Electrolatif LLP',
  'handyman-german-maintenance-workshop-services': 'Handyman German Maintenance Workshop & Services',
  'profix-handyman-services-singapore-pte-ltd': 'Profix Handyman Services Singapore Pte. Ltd.',
  'mcaas-solutions-pte-ltd': 'MCAAS Solutions Pte Ltd'
};

const words = s => s.toLowerCase().split(/[^\p{L}\p{N}&]+/u).filter(Boolean);
const keywordOnly = s => { const w = words(s); return w.length > 0 && w.every(x => KEYWORDS.has(x) || /^\d+$/.test(x)); };
export const makesClaim = s => CLAIM.test(s);

function titleCase(s) {
  return s.replace(/[\p{L}\p{N}][\p{L}\p{N}.']*/gu, w => /^(sg|hdb|lew|uen)$/.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1));
}

// ALL-CAPS names ("ART OF CLEANING PTE. LTD.") in title case ("Art of Cleaning Pte. Ltd."). Kept in
// capitals: acronyms (M&E, LEW, SG, HDB, LLP...), words with digits or no vowels (DJR, BS), and words
// of one or two letters (WI, LK). Small words go lower case except at the start.
// Three-letter acronyms with a vowel cannot be told from words by rule, so they are listed.
const KEEP_CAPS = new Set('sg lew hdb llp acmv hvac uen ac pe pub ema nea bca scdf ikea ifc avv osk rki cje'.split(' '));
const FIXED = {pte:'Pte',ltd:'Ltd',co:'Co',dr:'Dr',mr:'Mr',an:'An',ye:'Ye'};
const SMALL = new Set('of and the for in on at by to with or'.split(' '));
function fromCaps(s) {
  let first = true;
  return s.replace(/[^\s()/]+/g, token => {
    const word = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}&+]+$/gu, ''), lower = word.toLowerCase();
    const isFirst = first; first = false;
    if (!word) return token;
    if (SMALL.has(lower) && !isFirst) return token.replace(word, lower);
    if (FIXED[lower]) return token.replace(word, FIXED[lower]);
    if (KEEP_CAPS.has(lower) || /[\d&+]/.test(word) || !/[aeiouy]/i.test(word.replace(/\.(?:ltd|pte)$/i, '')) || word.length <= 2) return token.replace(/\.LTD\b/, '.Ltd');
    return token.replace(word, lower.replace(/(^|[-.])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\.(Sg|Com|Net)$/, m => m.toLowerCase()));
  });
}
export function cleanName(name, slug = '') {
  if (OVERRIDES[slug]) return OVERRIDES[slug];
  let s = String(name).replace(PICTO, '').replace(/\s*@\s*\+?(?:65\s?)?\d{4}\s?\d{4}\b/g, '').replace(/\s+/g, ' ').trim();
  s = s.replace(/[\s|,:;-]+$/, '').replace(/^[\s|,:;-]+/, '');
  // Odd indexes hold the separators, so the kept parts re-join exactly as the source wrote them.
  const bits = s.split(/(\s+\|\s*|\s*\|\s+|\s+-\s*|\s*-\s+|:\s+)/);
  const first = bits[0];
  let out = first;
  for (let i = 2; i < bits.length; i += 2) {
    if (makesClaim(bits[i]) || (!keywordOnly(first) && keywordOnly(bits[i]))) break;
    out += bits[i - 1] + bits[i];
  }
  out = out.replace(/\s*\(([^)]*)\)/g, (m, inner) => makesClaim(inner) || (keywordOnly(inner) && words(inner).length > 1) ? '' : m);
  out = out.replace(/[\s|,:;.-]+$/, m => (/\.$/.test(m) && /\b(?:ltd|pte|co|inc)\.$/i.test(out) ? '.' : '')).trim();
  out = out.replace(/\(\s+([^()]*?)\s+\)/g, '($1)');
  // A leading price claim ("Cheap Aircon Service Singapore") goes when two or more words remain.
  // Names that start with "Best" or "Top" are kept: for those firms it is the trading name.
  if (/^cheap\s+\S+\s+\S+/i.test(out)) out = out.replace(/^cheap\s+/i, '');
  if (!/\p{Lu}/u.test(out)) out = titleCase(out);
  else if (!/\p{Ll}/u.test(out) && (out.match(/\p{L}/gu) || []).length > 4) out = fromCaps(out);
  return out || String(name).trim();
}

// Every word of the display name must come from the source name (no invented words).
export function derivedFrom(display, source) {
  const have = new Set(words(source.replace(PICTO, '')));
  return words(display).every(w => have.has(w));
}

// Applies cleanName to a list of companies. A cleaned name that would collide with another
// company's name falls back to the source name for both, so titles stay unique.
export function displayNames(companies) {
  const cleaned = new Map(companies.map(c => [c.slug, cleanName(c.name, c.slug)]));
  const seen = new Map();
  for (const [slug, n] of cleaned) { const k = n.toLowerCase(); seen.set(k, [...(seen.get(k) || []), slug]); }
  for (const slugs of seen.values()) if (slugs.length > 1) for (const slug of slugs) cleaned.set(slug, companies.find(c => c.slug === slug).name.trim());
  return cleaned;
}

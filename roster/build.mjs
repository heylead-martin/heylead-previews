import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const origin = "https://previews.heylead.com/roster";
const checked = "9 Oct 2026 and 10 Oct 2026";
// Content hashes keep cached assets in sync with each generated page.
const assetVersions = Object.fromEntries(await Promise.all(
  ["site.css", "directory.css", "experience.css", "form.js", "directory.js", "experience.js"].map(async (name) => [
    name,
    createHash("sha256").update(await readFile(path.join(root, "assets", name))).digest("hex").slice(0, 12)
  ])
));

const trades = [
  {
    id: "aircon",
    slug: "aircon-servicing",
    name: "Aircon servicing",
    h1: "Aircon servicing in Singapore",
    intro: [
      "Most HDB flats run two or three wall units on one compressor. Condos often add a ceiling cassette or a ducted unit in the living room. A normal service washes the filters and the fan coil. A chemical wash goes after the coil with a chemical. A gas top-up is for a unit that cools poorly, and it should come with a leak check.",
      "Six companies have a phone we could cite. The shortlist stops there. Ratings come from the cited source and are not one live Google pull. Company-site ratings do not decide the order. 338 Aircon publishes more than one count. SoCool's public mirrors disagree with each other. Cool Aircon's homepage shows 4.9 and also says 5.0, and its page data says 366 reviews while the badge says 360+. The conflicting counts remain visible on the profiles.",
      "Prices are what the company publishes. Where a price is missing, the company page we opened did not print one."
    ],
    jobs: ["General service", "Chemical wash", "Gas top-up", "Repair", "Not sure"],
    faqs: [
      ["How often should an HDB or condo aircon be serviced?", "A common rhythm in Singapore is a general service two to four times a year, because the units run hard and the air is humid. A condo management (MCST) can also set contractor rules for the building. Ask the office before someone drills or drains off a balcony."],
      ["What is the difference between a normal service and a chemical wash?", "A normal service cleans filters, the fan coil face, and the drainage. A chemical wash uses a chemical on the coil to break down mould and sludge a wipe does not reach. Lion City, Cool Aircon, Billy Aircon, and Cool Earth publish chemical-wash prices. Cool Earth's page prints two ranges. 338 Aircon describes chemical wash work and does not print a per-unit chemical price on the pages we opened."],
      ["When is a gas top-up the right job?", "When the unit is low on refrigerant and cools poorly. Adding gas without a leak check can mean paying for the same top-up again. Cool Aircon publishes a PSI table. Lion City names gas top-up as a service and includes it in the overhaul and the yearly contract. 338 Aircon sells a contract that includes gas. Cool Earth's not-cold line names low gas and prices a troubleshooting fee, not the gas."],
      ["What should I ask before I book?", "The price for the actual job, whether GST is included, whether the blower is washed, and what happens if they find low gas. Ask for the price in writing before they arrive."],
      ["How do I check the company myself?", "Search the company name on ACRA's BizFile, and open the Google Maps listing linked from the profile. Roster quotes a few reviews and records the page they came from. The rating line says when that page was checked."]
    ]
  },
  {
    id: "plumbing",
    slug: "plumbing",
    name: "Plumbing",
    h1: "Plumbing in Singapore",
    intro: [
      "A choked floor trap, a leaking heater, or a burst flexi hose is usually a same-day job. Singapore plumbing work that touches the water service is supposed to be done by a PUB licensed plumber. The licence number should be something the company can point to.",
      "Three companies have a phone we could cite. Direct Plumber prints 5.0 and 3,388+ reviews, and a second WhatsApp number in the footer. Kiasu Plumber prints prices and no licence number, and no review count on the pages we opened, so the missing details are noted on its profile. Mr Plumber's WhatsApp is also printed by Daylight Electrician."
    ],
    jobs: ["Choke", "Leak", "Water heater", "Other", "Not sure"],
    faqs: [
      ["Does a plumber in Singapore need a PUB licence?", "PUB licenses plumbers for water-service work. Mr Plumber prints WS17962021 on its Little India page and says its plumbers are BCA certified. This beta did not open the PUB or BCA registers, so the number is what the company publishes."],
      ["What should I ask before an emergency call-out?", "A fixed price, or the rate if they cannot see the choke yet. Ask which brand is sending the technician. The WhatsApp number on this profile is also printed by Daylight Electrician."],
      ["Why is Kiasu Plumber missing a rating?", "The homepage prices are published. The pages we opened do not print a PUB licence number, an address, or a Google rating. No rating is added without a source."],
      ["What is the second office?", "The contact page lists a central desk at 60 Paya Lebar Road #07-54, phone +65 3165 0126. The main line and the Lower Delta Road address are the ones in the facts table."]
    ]
  },
  {
    id: "electrician",
    slug: "electrician",
    name: "Electrician",
    h1: "Electrician in Singapore",
    intro: [
      "A tripped DB, a dead circuit, or a burning smell is electrical work. In Singapore that work is supposed to be done by an EMA licensed electrical worker. A company saying licensed is a claim until you see the licence.",
      "Four companies have a phone we could cite. Ratings read on Google sort first; the other companies are alphabetical. Daylight's own pages do not agree on the count. Repair.sg's pages do not agree on the score. 1st Electrical Services is 4.7 from 102 on a Trustindex page, and the homepage widget says 139. Company-site ratings do not decide the order."
    ],
    jobs: ["Power trip", "Lighting", "Distribution board", "Other", "Not sure"],
    faqs: [
      ["What does an EMA licence mean here?", "EMA licenses electrical workers in Singapore. Daylight says its electricians are licensed. This beta did not open the EMA register, so the profile keeps that as the company's statement."],
      ["Why do the review counts disagree?", "Daylight prints several different counts on its own pages, all at 5.0. Repair.sg says 4.9 and more than 3,000 on the electrician page, and 5.0 from 2,948 on an isolator page. SK Electrical's 4.9 from 856 is the figure on the Google Maps listing opened on 9 Oct 2026. 1st Electrical Services is 4.7 from 102 on Trustindex, opened 10 Oct 2026, and 139 on the homepage widget."],
      ["What should I ask before a DB or rewiring job?", "Whether the person coming is the licensed worker, what the price covers, and whether the DB needs a shutdown. For a condo, ask the MCST which contractor paperwork they want."],
      ["Why does Daylight share a WhatsApp number with a plumber?", "Daylight and Mr Plumber both print +65 8241 0032, and both sit in 1090 Lower Delta Road. Daylight's footer says powered by Everyworks. The profile says so you can ask which brand is coming."]
    ]
  },
  {
    id: "handyman",
    slug: "handyman",
    name: "Handyman",
    h1: "Handyman in Singapore",
    intro: [
      "A handyman job is the small one: a drill, a furniture build, a silicone joint, a door that sticks. It is a poor place to hide a plumber or an electrician who should carry a licence.",
      "Two companies are listed. SG Handyman Engineering prints 4.9 from 70 Google reviews on its contact page. The widget reviews on that page have names and no dates, so no excerpt is stored. ISOTeam Homecare has no Google rating stored here. mrhandyman.sg returned an error on 10 Oct 2026, so Mr Handyman is not listed."
    ],
    jobs: ["Furniture", "Mounting", "Small repair", "Other", "Not sure"],
    faqs: [
      ["Why is one profile thinner?", "ISOTeam Homecare has a RecordOwl registry entry and no signed review stored here. SG Handyman Engineering is the one with a rating on its own contact page."],
      ["What should a handyman quote include?", "The job, the price, and whether drilling into a wall or a ceiling is included. In a condo, the MCST may want approval before noisy work."],
      ["Why does one profile still have no Google rating?", "A rating goes on the page when we can point at one figure on one page. SG Handyman Engineering's contact page prints 4.9 from 70. ISOTeam did not clear that. ThreeBestRated's 4.9 for ISOTeam is that site's own score, so it is left off."],
      ["Why did one address match an electrician?", "Daylight Electrician's contact page lists a west branch at 21 Bukit Batok Crescent #09-79, the unit directories gave for Mr Handyman. mrhandyman.sg returned an error on 10 Oct 2026, so that company is not listed."]
    ]
  },
  {
    id: "cleaning",
    slug: "home-cleaning",
    name: "Home cleaning",
    h1: "Home cleaning in Singapore",
    intro: [
      "One company cleared the source bar. Sureclean prints a phone, an address, a UEN, and a Google reviews page we opened on 10 Oct 2026 that shows 4.9 from 1,551 reviews. Its weekly page prints 5 and 1,551+, and a widget on that page rendered as 1 star and 1500+. The sourced Google figure is 4.9 from 1,551.",
      "Helpling publishes hourly prices and is a marketplace, so it is not listed as one crew. Sendhelper has shut. Sureclean's weekly page says as low as $22. That page does not say per hour, and it does not say whether GST is included."
    ],
    jobs: ["Regular clean", "One-time clean", "Move-out clean", "Not sure"],
    faqs: [
      ["Why is there only one cleaner?", "A company needs a phone on its own site or on a page we opened, and a rating we can tie to one page. Marketplaces stayed off. Sureclean is the company that cleared it."],
      ["What would put another cleaner on the list?", "A working phone, a page that states a Google rating and a count, and two or three review lines with a name and a date. A marketplace that assigns a different crew each visit stays off the list."],
      ["Can I still send a request?", "The form is on the page so you can see it. It names Sureclean. The beta does not send the form."]
    ]
  }
];

const intents = [
  {
    id: "chemical-wash",
    parent: "aircon",
    slug: "aircon-servicing/chemical-wash",
    name: "Chemical wash",
    titleName: "Aircon chemical wash",
    h1: "Aircon chemical wash in Singapore",
    service: "chemical-wash",
    intro: [
      "A chemical wash is the deeper clean. The coil is treated so mould and sludge come off, which a filter wash leaves behind. It is the usual fix for a musty smell or a unit that drips because the drain pan is filthy.",
      "Lion City publishes S$87.20 per unit with GST. Cool Aircon publishes S$110 for one unit and says no GST is added. Cool Earth prints both from S$80 and S$80 to S$100 on the same page, with a Google line of 4.0 from 66 reviews. Billy Aircon publishes a range, and the page does not say whether GST is in it. 338 Aircon's install page describes chemical wash work and does not print a per-unit chemical price. SoCool stays on the aircon hub only. The pages we could read do not describe a chemical wash."
    ],
    jobs: ["Chemical wash", "Not sure if I need one"],
    faqs: [
      ["Is a chemical wash the same as a chemical overhaul?", "No. A wash treats the coil, often with the unit still on the wall. An overhaul takes the fan coil apart. Lion City prices the wash at S$87.20 and the overhaul from S$109 to S$163.50 per unit with GST. Billy prices both, as a range."],
      ["How many units are in a typical flat?", "Many HDB homes have two or three wall units. A condo living room may add a cassette. Ask for a per-unit price and a total before they arrive."],
      ["Should I chemical-wash every quarter?", "A general service is the quarterly job. A chemical wash is for smell, weak airflow, or a coil that a normal service did not fix. Lion City's own guide says a first-time symptom is often a wash, and a problem that comes back is an overhaul conversation."],
      ["Why is SoCool missing here?", "SoCool is on the aircon servicing list. A chemical-wash price or description was not on the pages we could read, so it is not on this one."]
    ]
  },
  {
    id: "gas-top-up",
    parent: "aircon",
    slug: "aircon-servicing/gas-top-up",
    name: "Gas top-up",
    titleName: "Aircon gas top-up",
    h1: "Aircon gas top-up in Singapore",
    service: "gas-top-up",
    intro: [
      "Gas top-up means adding refrigerant. It is the right job when the unit is low and cools poorly. It is a weak job when the company adds gas and skips the leak. The gas leaves again, and the bill comes back.",
      "Three companies are on this page because their own sites price gas or include it in a named package. Cool Aircon publishes a PSI table, from S$90, and says no GST is added. Lion City names gas top-up as a service, and includes it in the chemical overhaul and the yearly contract. There is no standalone gas price on the price table we opened. 338 Aircon's book-online page sells a contract with free gas at S$250, and a contract without it at S$200 for one unit. Billy Aircon, SoCool, and Cool Earth stay on the hub. Cool Earth's not-cold page names low gas as a cause and a troubleshooting fee from S$40. That is not a gas price."
    ],
    jobs: ["Gas top-up", "Unit not cold", "Not sure"],
    faqs: [
      ["Does low gas always mean a top-up?", "Low gas means the refrigerant left the system. A top-up without finding the leak is a temporary fill. Ask whether a leak check is included and what it costs if they only add gas."],
      ["What did Cool Aircon publish?", "A table by refrigerant and PSI. Under 40 PSI: R22 S$90, R410A S$120, R32 S$130. The technician is supposed to measure the pressure and confirm the cell before any gas goes in. The company says it is not GST-registered."],
      ["What did Lion City publish?", "The privacy policy lists gas top-up among the services. The price page includes gas in the yearly contract and describes it inside the overhaul. A separate gas line was not on that table."],
      ["What did 338 Aircon publish?", "Book-online lists a contract with free gas and a contract without it. That is a package, not a one-off leak-test fee."],
      ["Why are there three names?", "The page lists companies whose own pages price gas or include it in a named package. Cool Earth mentions low gas and does not price it, so it stays on the hub."]
    ]
  }
];

const howFaqs = [
  ["Can a company pay to be number 1?", "No. Companies cannot pay for their position. Ratings read directly on Google sort first by score and count. Other companies are alphabetical. Company-site figures do not decide the order."],
  ["What would a Featured slot include?", "A label, the company name, one line they write, a published price if they have one, and a call or WhatsApp button that rings them directly. It would sit under the shortlist. It would not change the number, the stars, or the reviews, and it would not include the quote requests. No company has a paid placement on this beta."],
  ["Does the quote form send my number?", "It does not. The button stays on this page. A later version can send one request to at most three companies that match the job and hold prepaid credits. A dead number, a job outside Singapore, or a job the company does not do would be refunded. That product is not switched on."],
  ["Where do the reviews come from?", "From the page named under the quote: a Google Maps listing, a Trustindex or Wanderlog mirror, property.co, or the company's own site. The words are copied as published. A review without a name and a date is left off. Roster does not run its own star score."],
  ["Why are some lists shorter than five?", "Five was the aim. A company needs a cited phone, plus a rating we can point at, or a price the company publishes when the rating is missing. One handyman profile predates that bar and says so. Home cleaning has one. Handyman has two. Inventing the rest would have been a directory, which is the thing this beta is here to avoid."]
];

function walkStrings(value, visit, trail = "") {
  if (typeof value === "string") {
    visit(value, trail);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => walkStrings(item, visit, `${trail}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      walkStrings(item, visit, `${trail}.${key}`);
    }
  }
}

function assertNoDashes(value, label) {
  walkStrings(value, (text, trail) => {
    if (text.includes("\u2013") || text.includes("\u2014")) {
      throw new Error(`Dash in ${label} ${trail}`);
    }
  });
}

function assertHttp(url, label) {
  if (!/^https?:\/\//.test(url)) throw new Error(`Bad URL for ${label}: ${url}`);
}

function validate(companies) {
  const slugs = new Set();
  for (const company of companies) {
    if (slugs.has(company.slug)) throw new Error(`Duplicate slug ${company.slug}`);
    slugs.add(company.slug);
    if (!trades.some((trade) => trade.id === company.category)) {
      throw new Error(`Bad category ${company.slug}`);
    }
    if (!company.phone?.value || !company.phone?.sourceUrl) {
      throw new Error(`Missing phone ${company.slug}`);
    }
    assertHttp(company.phone.sourceUrl, company.slug + " phone");
    assertHttp(company.mapsUrl, company.slug + " maps");
    for (const service of company.services || []) {
      if (service !== "chemical-wash" && service !== "gas-top-up") {
        throw new Error(`Bad service ${company.slug} ${service}`);
      }
    }
    if (company.rating) {
      for (const key of ["value", "count", "label", "note", "sourceUrl"]) {
        if (company.rating[key] === undefined || company.rating[key] === "") {
          throw new Error(`Rating ${key} missing on ${company.slug}`);
        }
      }
      assertHttp(company.rating.sourceUrl, company.slug + " rating");
    }
    for (const review of company.reviews || []) {
      for (const key of ["excerpt", "author", "relativeTime", "mapsUrl", "sourceUrl", "sourceLabel"]) {
        if (!review[key]) throw new Error(`Review ${key} missing on ${company.slug}`);
      }
      assertHttp(review.mapsUrl, company.slug + " review maps");
      assertHttp(review.sourceUrl, company.slug + " review source");
    }
    if (company.whatsapp?.value) assertHttp(company.whatsapp.sourceUrl, company.slug + " wa");
  }
}

function isGoogleRating(company) {
  return !!company.rating && /^(www\.)?(maps\.google\.com|google\.com|business\.google\.com)$/.test(new URL(company.rating.sourceUrl).hostname);
}

function sortCompanies(list) {
  return list.slice().sort((a, b) => {
    const av = isGoogleRating(a) ? a.rating.value : -1;
    const bv = isGoogleRating(b) ? b.rating.value : -1;
    if (bv !== av) return bv - av;
    if (av !== -1 && a.rating.count !== b.rating.count) return b.rating.count - a.rating.count;
    return a.name.localeCompare(b.name);
  });
}

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function telHref(phone) {
  return "tel:" + phone.replace(/[^\d+]/g, "");
}

function waHref(phone) {
  const digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("65")) throw new Error("WhatsApp is not a Singapore number: " + phone);
  return "https://wa.me/" + digits;
}

function tradeById(id) {
  return trades.find((trade) => trade.id === id);
}

function companyUrl(company) {
  return `${origin}/company/${company.slug}/`;
}

function abs(pathname) {
  return origin + pathname.replace(/^\/roster/, "");
}


/* ---------- Icons and illustration ----------
   Line icons on a 24 grid. They are decorative. Every one is aria-hidden. */

const iconPaths = {
  search: `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>`,
  bookmark: `<path d="M6 4h12v17l-6-4-6 4z"/>`,
  sliders: `<path d="M4 7h6m4 0h6M4 17h10m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>`,
  chevron: `<path d="m9 5 7 7-7 7"/>`,
  aircon: `<rect x="2.5" y="5" width="19" height="9" rx="2"/><path d="M6.5 11h11"/><path d="M6.5 17.5c1.2-1 2.3-1 3.5 0s2.3 1 3.5 0 2.3-1 3.5 0"/><path d="M9 21c1.2-1 2.3-1 3.5 0s2.3 1 3.5 0"/>`,
  tap: `<path d="M9 4h5M11.5 4v4.5"/><path d="M4 9h8.5a5 5 0 0 1 5 5v1.5h-4V14a1 1 0 0 0-1-1H4z"/><path d="M4 9v3M15.5 18.2l-1.1 1.7a1.3 1.3 0 0 0 2.2 0z"/>`,
  bolt: `<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12.5z"/>`,
  wrench: `<path d="M14.6 4.4a4.6 4.6 0 0 0-5.3 6.4L3 17.1 6.9 21l6.3-6.3a4.6 4.6 0 0 0 6.4-5.3l-2.9 2.9-2.9-.7-.7-2.9z"/>`,
  sparkle: `<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z"/><path d="M5 16c.3 1.7 1.3 2.7 3 3-1.7.3-2.7 1.3-3 3-.3-1.7-1.3-2.7-3-3 1.7-.3 2.7-1.3 3-3z"/>`,
  phone: `<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>`,
  chat: `<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L4 21l1.6-4.4A8.5 8.5 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>`,
  arrow: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  shield: `<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>`,
  link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`,
  pin: `<path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>`,
  list: `<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>`,
  check: `<path d="M5 12l4 4L19 7"/>`,
  quote: `<path d="M7 6h4v6H7a2 2 0 0 0-2 2v2"/><path d="M15 6h4v6h-4a2 2 0 0 0-2 2v2"/>`,
  tagIcon: `<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.25"/>`,
  dollar: `<path d="M12 3v18"/><path d="M16.5 7.5A3.5 3.5 0 0 0 13 5h-2.5a3 3 0 0 0 0 6h3a3 3 0 0 1 0 6H11a3.5 3.5 0 0 1-3.5-2.5"/>`,
  star: `<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>`
};

function icon(name, cls = "ic") {
  const d = iconPaths[name];
  if (!d) throw new Error("Unknown icon " + name);
  const filled = name === "star";
  const attrs = filled
    ? `fill="currentColor" stroke="none"`
    : `fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg class="${cls}" viewBox="0 0 24 24" ${attrs} aria-hidden="true" focusable="false">${d}</svg>`;
}

const tradeIcon = {
  aircon: "aircon",
  plumbing: "tap",
  electrician: "bolt",
  handyman: "wrench",
  cleaning: "sparkle"
};

/* The home illustration: a row of Singapore housing blocks, drawn in paper
   strokes on the deep green panel. Windows that are lit are chosen by a fixed
   seed so the build is reproducible. */
function heroIllustration() {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const blocks = [
    { x: 28, y: 132, w: 118, h: 208, cols: 5, rows: 7 },
    { x: 170, y: 72, w: 96, h: 268, cols: 4, rows: 9 },
    { x: 290, y: 150, w: 152, h: 190, cols: 6, rows: 6 },
    { x: 466, y: 104, w: 70, h: 236, cols: 3, rows: 8 }
  ];
  const parts = [];
  for (const b of blocks) {
    parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="3"/>`);
    parts.push(`<path d="M${b.x} ${b.y + b.h - 26}h${b.w}"/>`);
    const pad = 12;
    const cw = (b.w - pad * 2) / b.cols;
    const rh = (b.h - 26 - pad * 2) / b.rows;
    for (let r = 0; r < b.rows; r++) {
      for (let c = 0; c < b.cols; c++) {
        const wx = (b.x + pad + c * cw + cw * 0.22).toFixed(1);
        const wy = (b.y + pad + r * rh + rh * 0.2).toFixed(1);
        const ww = (cw * 0.56).toFixed(1);
        const wh = (rh * 0.5).toFixed(1);
        const lit = rnd() < 0.3;
        parts.push(`<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="1"${lit ? ` class="lit"` : ""}/>`);
        if (rnd() < 0.18) {
          const ax = (Number(wx) + Number(ww) * 0.15).toFixed(1);
          const ay = (Number(wy) + Number(wh) + 2).toFixed(1);
          parts.push(`<rect x="${ax}" y="${ay}" width="${(Number(ww) * 0.7).toFixed(1)}" height="3.5" rx="1" class="unit"/>`);
        }
      }
    }
    const arches = Math.max(2, Math.round(b.w / 40));
    const aw = b.w / arches;
    for (let a = 0; a < arches; a++) {
      const ax = b.x + a * aw + aw / 2;
      parts.push(`<path d="M${(ax - 8).toFixed(1)} ${b.y + b.h}v-10a8 8 0 0 1 16 0v10"/>`);
    }
  }
  const trees = [12, 158, 276, 452, 548];
  for (const tx of trees) {
    parts.push(`<path d="M${tx} 340v-22"/><path d="M${tx - 11} 318c0-8 5-13 11-13s11 5 11 13c0 6-5 9-11 9s-11-3-11-9z" class="leaf"/>`);
  }
  return `<svg class="hero-art" viewBox="0 0 560 360" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="500" cy="48" r="22"/><path d="M60 56h44M118 56h18M372 40h60M446 40h14"/><path d="M0 340h560"/>${parts.join("")}</g></svg>`;
}

function brandMark() {
  return `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="8" fill="currentColor"/><path d="M11 23V9h6.2c3 0 4.8 1.7 4.8 4.2 0 2-1.2 3.4-3 3.9L23 23h-3.2l-3.6-5.4H13.8V23z M13.8 15.3h3.1c1.6 0 2.4-.8 2.4-2.1s-.8-2-2.4-2h-3.1z" fill="#f3f0e9"/></svg>`;
}

function formatCount(n) {
  return Number(n).toLocaleString("en-SG");
}

function jobsHint(spec) {
  return spec.jobs.filter((job) => !/^(Not sure|Other)/.test(job)).join(", ");
}

/* ---------- Shell parts ---------- */

const navItems = [
  ["/roster/aircon-servicing/", "Aircon", "aircon"],
  ["/roster/plumbing/", "Plumbing", "plumbing"],
  ["/roster/electrician/", "Electrician", "electrician"],
  ["/roster/handyman/", "Handyman", "handyman"],
  ["/roster/home-cleaning/", "Cleaning", "cleaning"],
  ["/roster/how-it-works/", "How it works", null]
];

function renderNav(current) {
  const links = navItems.filter(([, , trade]) => trade).map(([href, label, trade]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${icon(tradeIcon[trade], "ic nav-ic")}<span>${esc(label)}</span></a>`).join("");
  return `<header class="top"><div class="top-inner"><a class="brand" href="/roster/">${brandMark()}<span class="wordmark">Roster<span class="brand-dot">.</span></span></a><div class="global-search" role="search"><label class="sr-only" for="site-search">Find a service or company</label>${icon("search")}<input id="site-search" type="search" placeholder="Find a service or company" autocomplete="off" data-site-search><span class="search-location">${icon("pin")} Singapore</span><button class="search-submit" type="button" aria-label="Search Roster" data-search-submit>${icon("arrow")}</button></div><a class="saved-link" aria-label="Saved companies" href="/roster/search/?saved=1">${icon("bookmark")}<span>Saved</span></a><nav class="account-nav" aria-label="Account"><a href="/roster/sign-in/">Sign in</a><a class="nav-signup" href="/roster/sign-up/">Sign up</a></nav></div><div class="nav-shell"><nav class="nav" aria-label="Services">${links}</nav><span class="nav-note">Home services. A more considered choice.</span></div></header>`;
}

function renderCrumbs(items) {
  const parts = [{ href: "/roster/", label: "Roster" }, ...items];
  const html = parts.map((item, index) => {
    if (index === parts.length - 1) return `<li><span aria-current="page">${esc(item.label)}</span></li>`;
    return `<li><a href="${item.href}">${esc(item.label)}</a></li>`;
  }).join("");
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${html}</ol></nav>`;
}

function renderFooter() {
  const jobs = trades.map((trade) => `<li><a href="/roster/${trade.slug}/">${esc(trade.name)}</a></li>`).join("");
  return `<footer class="foot"><div class="wrap foot-inner">
<div class="foot-brand"><a class="brand" href="/roster/">${brandMark()}<span class="wordmark">Roster</span></a><p>A short, unpaid list of home-service companies in Singapore, with the reviews that back it.</p><p class="foot-note">Figures checked ${checked}. Ratings and excerpts are from the cited page. They are not from one Google API pull.</p></div>
<div class="foot-col"><h2>Jobs</h2><ul>${jobs}</ul></div>
<div class="foot-col"><h2>About</h2><ul><li><a href="/roster/how-it-works/">How the list is made</a></li><li><a href="/roster/how-it-works/">What a Featured slot would be</a></li><li><a href="/roster/aircon-servicing/chemical-wash/">Aircon chemical wash</a></li><li><a href="/roster/aircon-servicing/gas-top-up/">Aircon gas top-up</a></li></ul></div>
<p class="foot-line">Singapore beta. Unpaid listings. No commission on your job. Quote requests are a preview and do not send.</p>
</div></footer>`;
}

function renderFaq(faqs, heading = "Questions") {
  const items = faqs.map(([q, a]) => `<details><summary><span>${esc(q)}</span><span class="faq-mark" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join("");
  return `<section class="faq"><h2>${esc(heading)}</h2><div class="faq-list">${items}</div></section>`;
}

function renderFeatured() {
  const slot = `<article class="ad"><p class="eyebrow">Featured, paid placement (sample)</p><p class="ad-name">Sample slot</p><p>No company is placed here. A paid slot would show a name, one line, and a WhatsApp button. It would not get a number on the list.</p></article>`;
  return `<section class="ads" aria-label="Sample placements"><div class="ads-head"><h2>Sample placements</h2><p class="note">These two slots are empty. No named company paid to appear here.</p></div>${slot}${slot}<p class="ads-foot">Featured is a monthly visibility ad. It does not change the shortlist.</p></section>`;
}

function askHeading(count) {
  if (count === 0) return "Request a quote";
  if (count === 1) return "Send this to 1 company";
  return `Send this to ${count} companies`;
}

function nameList(companies) {
  const links = companies.map((company) => `<a href="/roster/company/${company.slug}/">${esc(company.name)}</a>`);
  if (links.length < 2) return links.join("");
  if (links.length === 2) return `${links[0]} and ${links[1]}`;
  return `${links.slice(0, -1).join(", ")}, and ${links[links.length - 1]}`;
}

function renderForm(jobs, recipients, uid) {
  if (!recipients.length) return "";
  const options = jobs.map((job) => `<option>${esc(job)}</option>`).join("");
  const maximum = Math.min(3, recipients.length);
  const id = (name) => `${uid}-${name}`;
  const countChoices = Array.from({ length: maximum }, (_, index) => {
    const value = index + 1;
    const checked = value === maximum ? " checked" : "";
    return `<label class="ask-option"><input type="radio" name="company-count" value="${value}"${checked}> <span>${value}</span></label>`;
  }).join("");
  const countNote = recipients.length === 1
    ? "Only 1 published company is on this shortlist."
    : `Choose up to ${maximum} published companies from this shortlist.`;
  const names = recipients.map((company, index) => `<li data-recipient-index="${index + 1}"><a href="/roster/company/${company.slug}/">${esc(company.name)}</a></li>`).join("");
  const contactLine = maximum === 1
    ? "1 company will contact you."
    : `These ${maximum} companies will contact you.`;
  const who = `<p class="recipient">The last step names who would be contacted. At most ${maximum}. This beta does not send the request.</p>`;
  return `<section class="ask-wrap" aria-labelledby="${id("title")}"><div class="ask-copy"><p class="kicker">Quote request</p><h2 id="${id("title")}">Request a quote</h2>${who}<p class="note ask-note">${icon("shield", "ic ic-inline")}Beta: this form does not send. Nothing is stored. The homeowner pays nothing.</p></div><div class="ask" data-quote-steps><p class="ask-progress" data-progress aria-live="polite">Step 1 of 5</p><div class="ask-error" data-error role="alert" tabindex="-1" hidden></div><section class="ask-step" data-step="1" aria-labelledby="${id("job-title")}"><h3 id="${id("job-title")}">Job</h3><div class="ask-fields"><label for="${id("job")}">What do you need?<select id="${id("job")}" name="job"><option value="">Select a job</option>${options}</select></label><label for="${id("property")}">Property type<select id="${id("property")}" name="property"><option value="">Select property type</option><option>HDB</option><option>Condo or apartment</option><option>Landed</option><option>Commercial</option><option>Not sure</option></select></label><label for="${id("size")}">Number of units or rooms<input id="${id("size")}" name="size" type="number" inputmode="numeric" min="1" step="1"></label></div><div class="ask-actions"><button class="btn btn-solid" type="button" data-next>Next</button></div></section><section class="ask-step" data-step="2" aria-labelledby="${id("postal-title")}" hidden><h3 id="${id("postal-title")}">Singapore postal code</h3><div class="ask-fields"><label for="${id("postal")}">Postal code<input id="${id("postal")}" name="postal" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="6" pattern="[0-9]{6}" aria-describedby="${id("postal-hint")}"><span class="field-hint" id="${id("postal-hint")}">Enter all six digits.</span></label></div><div class="ask-actions"><button class="btn" type="button" data-back>Back</button><button class="btn btn-solid" type="button" data-next>Next</button></div></section><section class="ask-step" data-step="3" aria-labelledby="${id("when-title")}" hidden><h3 id="${id("when-title")}">When</h3><div class="ask-options" role="radiogroup" aria-label="When do you need the job?"><label class="ask-option"><input type="radio" name="when" value="This week"> <span>This week</span></label><label class="ask-option"><input type="radio" name="when" value="Flexible"> <span>Flexible</span></label></div><div class="ask-actions"><button class="btn" type="button" data-back>Back</button><button class="btn btn-solid" type="button" data-next>Next</button></div></section><section class="ask-step" data-step="4" aria-labelledby="${id("count-title")}" hidden><h3 id="${id("count-title")}">How many companies should contact you?</h3><p class="field-hint">${esc(countNote)}</p><div class="ask-options" role="radiogroup" aria-label="How many companies should contact you?">${countChoices}</div><div class="ask-actions"><button class="btn" type="button" data-back>Back</button><button class="btn btn-solid" type="button" data-next>Next</button></div></section><section class="ask-step" data-step="5" aria-labelledby="${id("contact-title")}" hidden><h3 id="${id("contact-title")}">Your contact details</h3><div class="ask-fields"><label for="${id("name")}">Name<input id="${id("name")}" name="name" type="text" autocomplete="name"></label><label for="${id("mobile")}">Singapore mobile<input id="${id("mobile")}" name="mobile" type="tel" inputmode="numeric" autocomplete="tel" maxlength="8" aria-describedby="${id("mobile-hint")}"><span class="field-hint" id="${id("mobile-hint")}">8 digits, starting with 8 or 9.</span></label><label for="${id("email")}">Email<input id="${id("email")}" name="email" type="email" autocomplete="email"></label></div><div class="ask-recipients"><p data-recipient-copy>${contactLine}</p><ol data-recipients>${names}</ol></div><div class="ask-actions"><button class="btn" type="button" data-back>Back</button><button class="btn btn-solid" type="button" data-submit>Request a quote</button></div><p class="result" data-result aria-live="polite" hidden></p></section></div></section>`;
}

function renderReview(review) {
  return `<figure class="quote"><blockquote><p>${esc(review.excerpt)}</p></blockquote><figcaption><span class="who">${esc(review.author)}</span>, ${esc(review.relativeTime)}. <a href="${esc(review.sourceUrl)}">Source</a>. <a href="${esc(review.mapsUrl)}">Maps</a>. <span class="src">${esc(review.sourceLabel)}</span></figcaption></figure>`;
}

function ratingChip(company) {
  if (!company.rating) return `<p class="rate rate-none">No sourced rating yet</p>`;
  const r = company.rating;
  const own = company.website?.value && new URL(r.sourceUrl).hostname.replace(/^www\./, "") === new URL(company.website.value).hostname.replace(/^www\./, "");
  const source = isGoogleRating(company) ? "Google" : own ? "Their site says" : "Review mirror reports";
  return `<p class="rate">${isGoogleRating(company) ? `<span class="score">${icon("star", "ic ic-star")}${r.value.toFixed(1)}</span>` : icon("star", "ic source-star")}<span>${source} <strong>${esc(r.label)}</strong></span><a class="rating-source" href="${esc(r.sourceUrl)}" aria-label="Rating source for ${esc(company.name)}">Source${icon("link")}</a></p>`;
}

function contactButtons(company, solidProfile) {
  const buttons = [`<a class="btn" href="${telHref(company.phone.value)}">${icon("phone", "ic ic-btn-lead")}Call</a>`];
  if (company.whatsapp?.value) {
    buttons.push(`<a class="btn" href="${waHref(company.whatsapp.value)}">${icon("chat", "ic ic-btn-lead")}WhatsApp</a>`);
  }
  if (solidProfile) {
    buttons.push(`<a class="btn btn-solid" href="/roster/company/${company.slug}/">Profile${icon("arrow", "ic ic-btn")}</a>`);
  }
  return buttons.join("");
}

function priceSummary(company, service) {
  const display = presentation[company.slug] || { price: "Ask for a quote", detail: "No published rate captured", published: false };
  return service ? { ...display, ...(display.services?.[service] || { price: "Ask for a quote", detail: "No standalone price captured for this job", published: false }) } : display;
}

function renderRow(company, index, service) {
  const display = priceSummary(company, service);
  const trade = tradeById(company.category);
  const media = display.logo ? `<img class="company-logo" src="${display.logo}" alt="${esc(company.name)} logo" width="88" height="64" loading="lazy">` : "";
  const searchable = [company.name, trade.name, company.bestFor, company.priceNote, ...company.services].join(" ");
  const tags = company.services.map(service => `<span>${esc(service.replaceAll("-", " "))}</span>`).join("");
  return `<li class="business-card" data-company data-name="${esc(company.name)}" data-search="${esc(searchable.toLowerCase())}" data-category="${company.category}" data-price="${!!display.published}" data-reviews="${!!company.reviews.length}" data-whatsapp="${!!company.whatsapp?.value}" data-slug="${company.slug}" data-order="${index}"><article><div class="business-top"><div><p class="business-category">${icon(tradeIcon[trade.id])}${esc(trade.name)}<span class="dot-sep">/</span> Singapore</p><h2><a href="/roster/company/${company.slug}/">${esc(company.name)}</a></h2></div><button class="save-button" type="button" data-save="${company.slug}" aria-label="Save ${esc(company.name)}" aria-pressed="false">${icon("bookmark")}</button></div>${ratingChip(company)}<div class="business-overview ${media ? "has-logo" : ""}"><div><p class="business-fit">${esc(company.bestFor)}</p>${tags ? `<div class="service-tags">${tags}</div>` : ""}</div>${media}</div><div class="business-price"><div><span class="price-eyebrow">${display.published ? "Published price" : "Pricing"}</span><strong>${esc(display.price)}</strong><span class="price-context">${esc(display.detail)}</span></div><a href="${esc(company.priceSourceUrl)}" aria-label="Price source for ${esc(company.name)}">${icon("link")}<span>Source</span></a></div><details class="card-details"><summary>What to know before you book${icon("chevron")}</summary><p>${esc(company.poorFit)}</p>${company.rating ? `<p>${esc(company.rating.note)} <a href="${esc(company.rating.sourceUrl)}">Rating source</a>.</p>` : ""}<p class="note">Figures checked ${esc(checked)}.</p>${company.reviews.length ? renderReview(company.reviews[0]) : ""}</details><div class="business-bottom"><a class="profile-link" href="/roster/company/${company.slug}/">View company${icon("arrow")}</a><div class="business-contact"><a href="${telHref(company.phone.value)}">${icon("phone")}Call</a>${company.whatsapp?.value ? `<a href="${waHref(company.whatsapp.value)}">${icon("chat")}WhatsApp</a>` : ""}</div></div></article></li>`;
}

function shortlist(companies, service) {
  return `<div class="results-toolbar"><div><h2>Companies to consider</h2><p data-result-count aria-live="polite">${companies.length} ${companies.length === 1 ? "company" : "companies"} on this shortlist</p></div><label class="sort-control">Sort by<select data-sort aria-label="Sort companies"><option value="recommended">Source order</option><option value="name">Name A to Z</option></select></label></div><p class="results-method">Unpaid listings. Google-source ratings first, then alphabetical. <a href="/roster/how-it-works/">Our approach</a></p><ol class="shortlist">${companies.map((company, index) => renderRow(company, index, service)).join("")}</ol><div class="no-results" data-no-results hidden><span class="disc">${icon("search")}</span><h3>No companies match these filters</h3><p>Try a different search or clear your filters.</p><button type="button" class="btn" data-reset>Clear filters</button></div>`;
}

function pageShell({ title, description, canonicalPath, current, jsonLd, body, bodyClass = "" }) {
  const canonical = abs(canonicalPath);
  const graph = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": jsonLd
  }).replace(/</g, "\\u003c");
  assertNoDashes(graph, canonicalPath);
  const html = `<!doctype html>
<html lang="en">
<head>
<script src="/auth-config.js"></script>
<script src="/auth.js"></script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#f3f0e9">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/roster/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,560;1,9..144,460&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/roster/assets/site.css?v=${assetVersions["site.css"]}">
<link rel="stylesheet" href="/roster/assets/directory.css?v=${assetVersions["directory.css"]}">
<link rel="stylesheet" href="/roster/assets/experience.css?v=${assetVersions["experience.css"]}">
<script type="application/ld+json">${graph}</script>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
<a class="skip" href="#content">Skip to content</a>
${renderNav(current)}
<main id="content" class="wrap">
${body}
</main>
${renderFooter()}
<script src="/roster/assets/form.js?v=${assetVersions["form.js"]}"></script>
<script src="/roster/assets/directory.js?v=${assetVersions["directory.js"]}"></script>
<script src="/roster/assets/experience.js?v=${assetVersions["experience.js"]}"></script>
</body>
</html>
`;
  assertNoDashes(html, canonicalPath);
  if (/aggregateRating/i.test(html) || /"@type":"(Review|Offer|AggregateRating)"/.test(html)) {
    throw new Error("Rating, review, or offer schema leaked into " + canonicalPath);
  }
  // Account previews use dialog forms with disabled fields until the local handler loads.
  const nonPreviewHtml = html.replace(/<form method="dialog" data-account-preview="(?:sign-in|sign-up|forgot-password|reset-password)"[^>]*>[\s\S]*?<\/form>/g, "");
  if (/<form[\s>]/i.test(nonPreviewHtml)) {
    throw new Error("A form element leaked into " + canonicalPath);
  }
  if (/mailto:|formspree|fetch\(/i.test(html)) {
    throw new Error("Outbound form hook in " + canonicalPath);
  }
  return html;
}

/* ---------- JSON-LD ---------- */

function crumbsLd(items) {
  const list = [{ href: "/roster/", label: "Roster" }, ...items];
  return {
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? abs(item.href) : undefined
    }))
  };
}

function faqLd(faqs) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };
}

function businessNode(company) {
  const node = {
    "@type": company.schemaType,
    name: company.name,
    telephone: company.phone.value,
    url: companyUrl(company)
  };
  if (company.address?.street) {
    node.address = {
      "@type": "PostalAddress",
      streetAddress: company.address.street,
      addressLocality: "Singapore",
      addressCountry: "SG"
    };
    if (company.address.postal) node.address.postalCode = company.address.postal;
  }
  return node;
}

function listLd(name, companies) {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: companies.length,
    itemListElement: companies.map((company, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: company.name,
      url: companyUrl(company),
      item: businessNode(company)
    }))
  };
}

function webPage(title, canonicalPath, description) {
  return {
    "@type": "WebPage",
    name: title,
    url: abs(canonicalPath),
    description
  };
}

function forbidSchema(node) {
  const banned = new Set(["aggregateRating", "review", "reviews", "offers", "offer", "priceRange"]);
  const bannedTypes = new Set(["AggregateRating", "Review", "Offer", "AggregateOffer", "Rating"]);
  const scan = (value) => {
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      if (banned.has(key)) throw new Error("Banned schema key " + key);
      if (key === "@type" && bannedTypes.has(value[key])) throw new Error("Banned schema type " + value[key]);
      scan(value[key]);
    }
  };
  scan(node);
}

async function writePage(rel, html) {
  const file = rel === "" ? path.join(root, "index.html") : path.join(root, rel, "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
  return file;
}

function firstThree(companies) {
  return companies.slice(0, 3);
}

/* ---------- Category and intent pages ---------- */

function airconSubnav(active) {
  const links = [
    ["/roster/aircon-servicing/", "All aircon servicing"],
    ["/roster/aircon-servicing/chemical-wash/", "Chemical wash"],
    ["/roster/aircon-servicing/gas-top-up/", "Gas top-up"]
  ].map(([href, label]) => `<a href="${href}"${href === active ? ' aria-current="page"' : ""}>${esc(label)}</a>`).join("");
  return `<nav class="subs" aria-label="Aircon jobs">${links}</nav>`;
}

function renderCollection(spec, companies, crumbs) {
  const count = companies.length;
  const title = count === 0
    ? `${spec.h1.replace(" in Singapore", "")} in Singapore: no shortlist yet | Roster`
    : `${spec.titleName || spec.name} in Singapore: shortlist of ${count} ${count === 1 ? "company" : "companies"} | Roster`;
  const description = spec.intro[0].slice(0, 155);
  const canonicalPath = `/roster/${spec.slug}/`;
  const tradeId = spec.parent || spec.id;
  const isAircon = tradeId === "aircon";
  const countLabel = count === 0 ? "No companies yet" : `${count} ${count === 1 ? "company" : "companies"}`;
  const notes = spec.intro.slice(1).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("");
  const categoryLabel = tradeId === "all" ? "Home services" : (spec.titleName || spec.name);
  const summaries = {
    plumbing: "From a stubborn choke to a leaking tap. Compare published prices, read the details, and speak to a company directly.",
    aircon: "Find the right team for your aircon. Compare published rates, sourced review details, and what each company does.",
    electrician: "A power trip, a new light, or a bigger repair. Get the details on each company before you make the call.",
    handyman: "Small jobs deserve a considered choice. Compare the companies, their contact details, and the work they describe.",
    cleaning: "Find help for your home, with the price details and review sources in one place.",
    all: "Find a company by name or explore a service. Every listing links to the facts behind it."
  };
  const filter = (key, label, n) => `<label class="filter-check"><input type="checkbox" data-filter="${key}"><span>${label}</span><small>${n}</small></label>`;
  const body = [
    renderCrumbs(crumbs),
    `<section class="directory-hero"><div><p class="kicker">THE SINGAPORE HOME DIRECTORY</p><h1>${tradeId === "all" ? "Find your next helping hand." : `${esc(categoryLabel)} <em>in Singapore.</em>`}</h1><p>${esc(summaries[tradeId])}</p></div><div class="hero-stamp"><span class="stamp-icon">${icon(tradeIcon[tradeId] || "search")}</span><div><strong>${count}</strong><span>${count === 1 ? "company to explore" : "companies to explore"}</span></div></div></section>`,
    `<div class="directory-layout" data-directory><aside class="filters" aria-label="Filter companies"><div class="filters-head"><h2>${icon("sliders")}Refine your list</h2><button type="button" class="filter-toggle" data-toggle-filters aria-controls="company-filters" aria-expanded="true">${icon("sliders")}Filters <span data-active-filters></span>${icon("chevron")}</button><button type="button" data-reset>Reset</button></div><div class="filter-content" id="company-filters"><label class="filter-search">Search this list<input type="search" placeholder="Company or keyword" data-filter-search></label><fieldset><legend>What matters to you?</legend>${filter("price", "Published pricing", companies.filter(c => priceSummary(c, spec.service).published).length)}${filter("reviews", "Dated reviews", companies.filter(c => c.reviews.length).length)}${filter("whatsapp", "WhatsApp contact", companies.filter(c => c.whatsapp?.value).length)}${filter("saved", "Saved companies", '<span data-saved-count>0</span>')}</fieldset><div class="filter-categories"><h3>Explore services</h3>${trades.map(t => `<a href="/roster/${t.slug}/"${t.id === tradeId ? ' aria-current="page"' : ""}>${icon(tradeIcon[t.id])}${esc(t.name)}${icon("chevron")}</a>`).join("")}</div><div class="filter-foot">${icon("shield")}<p>A place on Roster is unpaid.<br>Always your choice.</p></div></div></aside><div class="directory-results">`,
    isAircon ? airconSubnav(canonicalPath) : "",
    shortlist(companies, spec.service),
    `<details class="list-explainer"><summary>About this ${esc(categoryLabel.toLowerCase())} shortlist${icon("chevron")}</summary><p>${esc(spec.intro[0])}</p>${notes}<p><a href="/roster/how-it-works/">How the list is made</a>. Checked ${checked}.</p></details>`,
    `</div><aside class="discovery-rail"><section class="help-card"><span class="rail-symbol">${icon("list")}</span><p class="kicker">A LITTLE HOMEWORK HELPS</p><h2>A little clarity.<br>A better choice.</h2><p>Look beyond a star rating. A few details make the choice easier.</p><ol><li><span>1</span>Compare the price for your actual job.</li><li><span>2</span>Read what suits you, and what might not.</li><li><span>3</span>Call or WhatsApp the company directly.</li></ol><a href="/roster/how-it-works/">Get to know Roster${icon("arrow")}</a></section><section class="quote-teaser"><span class="beta">BETA PREVIEW</span><h2>One job.<br>A few options.</h2><p>Try a quote request for up to three companies.</p><a class="btn btn-solid" href="#quote-request">Preview a request${icon("arrow")}</a><small>Preview only. Nothing is sent or stored.</small></section><div class="rail-note">${icon("calendar")}<p>Facts last checked<br><strong>9-10 October 2026</strong><br>Each figure links to its source.</p></div></aside></div>`,
    tradeId !== "all" ? `<div id="quote-request">${renderForm(spec.jobs, companies, "ask")}</div>` : `<div id="quote-request" class="search-end"><h2>Start with the service you need</h2><p>Choose a service above to explore its shortlist and preview a quote request.</p></div>`,
    renderFaq(spec.faqs, "A few things worth knowing"),
    `<section class="browse-more"><p class="kicker">WHILE YOU'RE HERE</p><h2>A little help around the home.</h2><div>${trades.filter(t => t.id !== tradeId).map(t => `<a href="/roster/${t.slug}/">${icon(tradeIcon[t.id])}<span>${esc(t.name)}</span>${icon("arrow")}</a>`).join("")}</div></section>`
  ].join("\n");
  const jsonLd = [
    webPage(title, canonicalPath, description),
    { "@type": "CollectionPage", name: spec.h1, url: abs(canonicalPath) },
    crumbsLd(crumbs.map((item, index) => (
      index === crumbs.length - 1 ? { href: canonicalPath, label: item.label } : item
    ))),
    faqLd(spec.faqs)
  ];
  if (companies.length) jsonLd.push(listLd(spec.h1, companies));
  forbidSchema(jsonLd);
  return pageShell({
    title,
    description,
    canonicalPath,
    current: spec.service ? "/roster/aircon-servicing/" : canonicalPath,
    jsonLd,
    body,
    bodyClass: "directory-page"
  });
}

/* ---------- Profile ---------- */

function factRow(label, html) {
  return `<div><dt>${esc(label)}</dt><dd>${html}</dd></div>`;
}

function ratingSourceName(company) {
  if (!company.rating) return "No sourced rating";
  if (isGoogleRating(company)) return "Google rating";
  const own = company.website?.value && new URL(company.rating.sourceUrl).hostname.replace(/^www\./, "") === new URL(company.website.value).hostname.replace(/^www\./, "");
  return own ? "Rating on the company website" : "Rating on a review mirror";
}

function profileStars(value) {
  const stars = Array.from({ length: 5 }, () => icon("star")).join("");
  return `<span class="profile-stars" aria-hidden="true"><span>${stars}</span><span class="stars-fill" style="width:${Math.max(0, Math.min(100, value * 20))}%">${stars}</span></span>`;
}

function profileReview(review) {
  const initials = review.author.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("");
  return `<article class="review-entry" data-review-entry><header><span class="review-avatar" aria-hidden="true">${esc(initials)}</span><div><h3>${esc(review.author)}</h3><p>${esc(review.relativeTime)}</p></div><span class="review-label">Sourced excerpt</span></header><blockquote><p>${esc(review.excerpt)}</p></blockquote><footer><a href="${esc(review.sourceUrl)}">Read at source${icon("link")}</a><details><summary>About this excerpt</summary><p>${esc(review.sourceLabel)} Relative dates were captured on ${checked}. Individual star scores were not captured.</p></details></footer></article>`;
}

function renderProfile(company, peers) {
  const trade = tradeById(company.category);
  const title = `${company.name} - Reviews, prices & contact | Roster`;
  const description = company.bestFor.slice(0, 155);
  const canonicalPath = `/roster/company/${company.slug}/`;
  const presentation = priceSummary(company);
  const rating = company.rating;
  const photos = presentation.photos || [];
  const others = peers.filter(peer => peer.slug !== company.slug);
  const crumbs = [{ href: `/roster/${trade.slug}/`, label: trade.name }, { label: company.name }];
  const sourceName = ratingSourceName(company);
  const reviewCount = company.reviews.length;
  const facts = [];
  facts.push(factRow("Phone", `<a href="${telHref(company.phone.value)}">${esc(company.phone.value)}</a> <a class="fact-src" href="${esc(company.phone.sourceUrl)}">Source</a>`));
  if (company.whatsapp?.value) facts.push(factRow("WhatsApp", `<a href="${waHref(company.whatsapp.value)}">${esc(company.whatsapp.value)}</a> <a class="fact-src" href="${esc(company.whatsapp.sourceUrl)}">Source</a>`));
  if (company.address?.value) facts.push(factRow("Published address", `${esc(company.address.value)} <a class="fact-src" href="${esc(company.address.sourceUrl)}">Source</a>`));
  if (company.email?.value) facts.push(factRow("Email", `${esc(company.email.value)} <a class="fact-src" href="${esc(company.email.sourceUrl)}">Source</a>`));
  if (company.whatsapp?.note) facts.push(factRow("Contact note", `${esc(company.whatsapp.note)} <a class="fact-src" href="${esc(company.whatsapp.sourceUrl)}">Source</a>`));
  if (company.website?.note) facts.push(factRow("Website note", esc(company.website.note)));
  if (company.mapsNote) facts.push(factRow("Map note", esc(company.mapsNote)));
  for (const fact of company.facts || []) facts.push(factRow(fact.label, `${esc(fact.value)} <a class="fact-src" href="${esc(fact.sourceUrl)}">Source</a>`));
  const priceRows = (presentation.priceItems || []).map(item => `<tr><th scope="row">${esc(item.service)}<small>${esc(item.detail)}</small></th><td>${esc(item.price)}</td></tr>`).join("");
  const body = `
${renderCrumbs(crumbs)}
<section class="company-masthead" data-company data-name="${esc(company.name)}" data-slug="${company.slug}">
  <div class="company-identity">
    <div class="company-name-line"><span class="company-emblem">${presentation.logo ? `<img src="${presentation.logo}" alt="${esc(company.name)} logo" width="76" height="76">` : icon(tradeIcon[trade.id])}</span><div><a class="company-trade" href="/roster/${trade.slug}/">${esc(trade.name)} in Singapore</a><h1>${esc(company.name)}</h1></div></div>
    <div class="company-rating-line">${rating ? `${profileStars(rating.value)}<strong>${rating.value.toFixed(1)}</strong><a href="#reviews">${esc(rating.label)}</a>` : `<span class="unrated-label">No sourced rating yet</span>`}</div>
    <p class="company-rating-source">${rating ? `<a href="${esc(rating.sourceUrl)}">${esc(sourceName)}${icon("link")}</a><span>Checked 9-10 Oct 2026</span>` : "A rating will appear when we can link it to a source."}</p>
    <p class="company-address">${icon("pin")}${esc(company.address?.street || "Singapore - street address not captured")}</p>
    <div class="company-actions"><a class="btn btn-solid" href="#reviews">${icon("star")}Read reviews</a><button type="button" class="btn profile-save" data-save="${company.slug}" aria-pressed="false" aria-label="Save ${esc(company.name)}">${icon("bookmark")}<span data-save-label>Save</span></button><a class="btn" href="${esc(company.website?.value || company.mapsUrl)}">${icon("link")}Website${icon("arrow")}</a></div>
  </div>
  <a class="price-snapshot" href="#pricing"><span class="kicker">${presentation.published ? "PUBLISHED PRICING" : "PRICING"}</span><strong>${esc(presentation.price)}</strong><span>${esc(presentation.detail)}</span><span class="snapshot-link">${presentation.published ? "See services & prices" : "What to ask before booking"}${icon("arrow")}</span></a>
</section>
${photos.length ? `<section class="work-gallery" aria-label="Photos from the company website">${photos.map(photo => `<figure><a href="${photo.src}" aria-label="View photo: ${esc(photo.caption)}"><img src="${photo.src}" width="350" height="252" alt="${esc(photo.caption)} as published by ${esc(company.name)}" loading="lazy"></a><figcaption>${esc(photo.caption)}</figcaption></figure>`).join("")}<p>Photos published by the company. <a href="${photos[0].sourceUrl}">View source${icon("link")}</a></p></section>` : ""}
<nav class="company-section-nav" aria-label="Company sections"><a href="#reviews">Reviews <span>${reviewCount} ${reviewCount === 1 ? "excerpt" : "excerpts"}</span></a><a href="#pricing">Services & pricing</a><a href="#overview">About the company</a><a href="#contact">Contact & details</a></nav>
<div class="company-layout">
  <div class="company-content">
    <section class="profile-section" id="reviews" data-profile-reviews>
      <div class="profile-section-heading"><div><p class="kicker">BEFORE YOU BOOK</p><h2>Reviews & reputation</h2></div>${rating ? `<a class="text-link" href="${esc(rating.sourceUrl)}">View source${icon("link")}</a>` : ""}</div>
      ${rating ? `<div class="review-overview"><div class="review-overview-score"><span class="rating-value">${rating.value.toFixed(1)}<small>/ 5</small></span>${profileStars(rating.value)}<span>${esc(sourceName)}</span></div><div class="review-overview-context"><strong>${esc(rating.label)}</strong><p>This is the figure reported by the linked source. Roster does not calculate a separate rating.</p><details><summary>Source details & differences</summary><p>${esc(rating.note)}</p></details></div></div>` : `<div class="review-empty-rating">${icon("star")}<div><h3>No rating on file</h3><p>The pages we checked did not give us a rating we could cite. You can still compare the company's published details below.</p></div></div>`}
      <div class="review-toolbar"><div><h3>${reviewCount ? "What customers wrote" : "Customer review excerpts"}</h3><p>${reviewCount ? `${reviewCount} dated ${reviewCount === 1 ? "excerpt" : "excerpts"} on Roster, not the full review history.` : "We only include excerpts with a name, a date, and a source."}</p></div>${reviewCount > 1 ? `<label class="review-search">${icon("search")}<span class="sr-only">Search review excerpts</span><input type="search" placeholder="Search excerpts" data-review-search></label>` : ""}</div>
      ${reviewCount ? `<div class="review-entries">${company.reviews.map(profileReview).join("")}</div><p class="review-no-results" data-review-empty hidden>No excerpts match your search. <button type="button" data-clear-reviews>Clear search</button></p><p class="review-search-status sr-only" data-review-count aria-live="polite"></p>` : `<div class="review-empty"><span class="review-empty-icon">${icon("quote")}</span><h3>No dated excerpts to show yet</h3><p>${rating ? "The rating above is sourced, but we do not have a dated customer quote to display here." : "No dated customer review was captured for this profile."}</p><a class="btn" href="${esc(rating?.sourceUrl || company.mapsUrl)}">Explore the original listing${icon("arrow")}</a></div>`}
    </section>
    <section class="profile-section" id="pricing"><div class="profile-section-heading"><div><p class="kicker">KNOW THE COST</p><h2>Services & pricing</h2></div><span class="section-pill">${presentation.published ? "Published prices" : "Quote required"}</span></div>
      <div class="service-price-lead"><strong>${esc(presentation.price)}</strong><p>${esc(presentation.detail)}</p></div>
      ${priceRows ? `<table class="service-price-table"><caption class="sr-only">Prices published by ${esc(company.name)}</caption><thead><tr><th scope="col">Service</th><th scope="col">Published price</th></tr></thead><tbody>${priceRows}</tbody></table>` : `<div class="quote-checklist"><h3>Ask for a written quote that covers:</h3><ul><li>${icon("check")}The work and any replacement parts</li><li>${icon("check")}Transport, call-out charges, and GST</li><li>${icon("check")}Extra work and the workmanship warranty</li></ul></div>`}
      <details class="source-disclosure"><summary>Full pricing notes & conditions</summary><p>${esc(company.priceNote)}</p></details><p class="profile-source-note"><a href="${esc(company.priceSourceUrl)}">Published price source${icon("link")}</a><span>Checked 9-10 Oct 2026. Confirm the total for your job.</span></p>
    </section>
    <section class="profile-section" id="overview"><div class="profile-section-heading"><div><p class="kicker">THE ROSTER TAKE</p><h2>Is this the right fit?</h2></div></div><div class="company-fit"><div><span class="fit-label">${icon("check")}Worth considering for</span><p>${esc(company.bestFor)}</p></div><div><span class="fit-label">${icon("list")}Things to check first</span><p>${esc(company.poorFit)}</p></div></div><p class="profile-source-note">Based on the published information linked on this page.</p></section>
    <section class="profile-section" id="contact"><div class="profile-section-heading"><div><p class="kicker">THE PRACTICAL DETAILS</p><h2>Contact & company details</h2></div></div><div class="location-card">${icon("pin")}<div><h3>${esc(company.address?.value || "Singapore")}</h3><p>${company.address ? "Published address. Check before visiting." : "No street address was captured on the pages we checked."}</p><a href="${esc(company.mapsUrl)}">Open in Google Maps${icon("arrow")}</a></div></div><dl class="company-facts">${facts.join("")}</dl></section>
    <details class="profile-quote-preview" id="quote-request"><summary><span>${icon("chat")}Want to compare a few companies?<small>Try the quote request preview. Nothing is sent.</small></span>${icon("chevron")}</summary>${renderForm(trade.jobs, [company, ...others], "ask")}</details>
${others.length ? `<section class="profile-section related-companies"><div class="profile-section-heading"><div><p class="kicker">KEEP EXPLORING</p><h2>Also on your shortlist</h2></div><a class="text-link" href="/roster/${trade.slug}/">View all${icon("arrow")}</a></div><div class="related-grid">${others.slice(0, 3).map(peer => `<a href="/roster/company/${peer.slug}/"><span class="related-icon">${icon(tradeIcon[trade.id])}</span><h3>${esc(peer.name)}</h3><p>${esc(priceSummary(peer).price)}</p><span>View profile${icon("arrow")}</span></a>`).join("")}</div></section>` : ""}
  </div>
  <aside class="company-sidebar" aria-label="Contact the company"><div class="booking-card"><p class="kicker">CONTACT DIRECTLY</p><h2>Let's get it sorted.</h2><p>Discuss your job with ${esc(company.name)} and ask for a clear quote.</p><a class="btn btn-solid" href="${telHref(company.phone.value)}">${icon("phone")}Call ${esc(company.phone.value)}</a>${company.whatsapp?.value ? `<a class="btn whatsapp-button" href="${waHref(company.whatsapp.value)}">${icon("chat")}Message on WhatsApp</a>` : ""}<p class="direct-contact-note">You're contacting the company directly.</p><div class="booking-links"><a href="${esc(company.website?.value || company.mapsUrl)}">${icon("link")}Company website${icon("arrow")}</a><a href="${esc(company.mapsUrl)}">${icon("pin")}Location & directions${icon("arrow")}</a></div><a class="contact-source" href="${esc(company.phone.sourceUrl)}">Contact source</a></div><div class="shortlist-tip">${icon("bookmark")}<div><h3>A good option? Save it.</h3><p>Keep a shortlist while you compare. Saved companies stay in this browser.</p><a href="/roster/search/?saved=1">View your saved companies${icon("arrow")}</a></div></div><p class="profile-checked">${icon("calendar")}Last checked 9-10 October 2026</p></aside>
</div>
<div class="callbar" aria-label="Contact ${esc(company.name)}"><a class="btn btn-solid" href="${telHref(company.phone.value)}">${icon("phone")}Call company</a><a class="btn" href="${company.whatsapp?.value ? waHref(company.whatsapp.value) : esc(company.mapsUrl)}">${icon(company.whatsapp?.value ? "chat" : "pin")}${company.whatsapp?.value ? "WhatsApp" : "Maps"}</a></div>`;
  const jsonLd = [webPage(title, canonicalPath, description), crumbsLd(crumbs), businessNode(company)];
  forbidSchema(jsonLd);
  return pageShell({ title, description, canonicalPath, current: `/roster/${trade.slug}/`, jsonLd, body, bodyClass: "has-callbar company-page" });
}

/* ---------- Account interface previews ---------- */

function renderAccount(mode) {
  const config = {
    "sign-in": { title: "Welcome back.", intro: "Sign in to your Roster account.", action: "Sign in", prompt: "New to Roster?", link: "Create an account", href: "sign-up" },
    "sign-up": { title: "Make yourself at home.", intro: "Create your Roster account.", action: "Create account", prompt: "Already have an account?", link: "Sign in", href: "sign-in" },
    "forgot-password": { title: "Forgot your password?", intro: "Enter your email to preview password recovery.", action: "Send reset link", prompt: "Remember your password?", link: "Back to sign in", href: "sign-in" },
    "reset-password": { title: "A fresh start.", intro: "Preview setting a new password for your account.", action: "Reset password", prompt: "Already sorted?", link: "Back to sign in", href: "sign-in" }
  }[mode];
  const usesPassword = mode !== "forgot-password";
  const google = mode === "sign-in" || mode === "sign-up";
  const passwordField = (id, label, hint = "") => `<label class="account-label" for="${id}">${label}</label><div class="password-field"><input id="${id}" type="password" autocomplete="off" required minlength="8"${hint ? ` aria-describedby="password-hint"` : ""}><button type="button" data-toggle-password="${id}" aria-label="Show ${label.toLowerCase()}" aria-pressed="false">Show</button></div>${hint ? `<p class="field-hint" id="password-hint">${hint}</p>` : ""}`;
  const body = `<section class="account-layout"><div class="account-story"><p class="kicker">A LITTLE HELP FEELS GOOD</p><h2>Less searching.<br>More sorted.</h2><p>Find the people who help make your house feel like home.</p><div class="account-art">${heroIllustration()}</div><ul><li>${icon("bookmark")}A place for your favourite companies</li><li>${icon("star")}Reviews and prices, easier to compare</li><li>${icon("phone")}A direct line to your next helping hand</li></ul><a href="/roster/">Explore Roster${icon("arrow")}</a></div><div class="account-panel"><div class="account-card"><span class="account-preview-badge">ACCOUNT PREVIEW</span><h1>${config.title}</h1><p class="account-intro">${config.intro}</p><p class="account-beta-note">These are beta screens. Use sample details. Nothing is sent or saved, and no account is created.</p><noscript><p class="account-beta-note">Enable JavaScript to try the account preview.</p></noscript>
<form method="dialog" data-account-preview="${mode}" autocomplete="off"><fieldset disabled><legend class="sr-only">${config.action} preview</legend>${google ? `<button class="google-button" type="button" data-google-preview><svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c4-3.7 6-9.1 6-15.1Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4.1 1.9-6.8 1.9-5.3 0-9.8-3.6-11.4-8.4H5.7v5.3A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.4a12 12 0 0 1 0-7.7v-5.3H5.7a20 20 0 0 0 0 18.3l6.9-5.3Z"/><path fill="#EA4335" d="M24 11.7c3 0 5.6 1 7.7 3l5.8-5.7A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.7 15l6.9 5.3A12 12 0 0 1 24 11.7Z"/></svg>Continue with Google</button><div class="account-divider"><span>or continue with email</span></div>` : ""}
${mode === "sign-up" ? '<label class="account-label" for="account-name">Your name</label><input id="account-name" type="text" placeholder="Alex Tan" required autocomplete="off" maxlength="100">' : ""}
${mode !== "reset-password" ? '<label class="account-label" for="account-email">Email address</label><input id="account-email" type="email" placeholder="you@example.com" autocomplete="off" required maxlength="254">' : ""}
${usesPassword ? passwordField("account-password", mode === "reset-password" ? "New password" : "Password", mode !== "sign-in" ? "Use at least 8 characters for this preview." : "") : ""}
${mode === "reset-password" ? passwordField("account-confirm", "Confirm new password") : ""}
${mode === "sign-in" ? '<div class="account-options"><a href="/roster/forgot-password/">Forgot password?</a></div>' : ""}
<p class="account-error" data-account-error role="alert" hidden></p><button type="submit" class="btn btn-solid account-submit">${config.action}${icon("arrow")}</button></fieldset></form>
<div class="account-result" data-account-result role="status" tabindex="-1" hidden></div><p class="account-switch">${config.prompt} <a href="/roster/${config.href}/">${config.link}</a></p></div><p class="account-smallprint">Singapore beta. Real accounts are not enabled yet.</p></div></section>`;
  return pageShell({ title: `${config.action} | Roster`, description: "Preview Roster's account experience.", canonicalPath: `/roster/${mode}/`, current: "", jsonLd: [], body, bodyClass: "account-page" });
}

/* ---------- Home ---------- */

function renderHome(grouped) {
  const title = "Roster | Short unpaid lists of home services in Singapore";
  const description = "A short unpaid list of home-service companies in Singapore, with the reviews that back it.";
  const total = trades.reduce((sum, trade) => sum + grouped[trade.id].length, 0);
  const tiles = trades.map((trade, index) => {
    const count = grouped[trade.id].length;
    const meta = count === 0 ? "No companies yet" : `${count} ${count === 1 ? "company" : "companies"}`;
    const empty = count === 0 ? ` class="is-empty"` : "";
    return `<li${empty}><a href="/roster/${trade.slug}/"><span class="tile-top"><span class="disc">${icon(tradeIcon[trade.id], "ic ic-disc")}</span><span class="idx">${String(index + 1).padStart(2, "0")}</span></span><span class="job">${esc(trade.name)}</span><span class="hint">${esc(jobsHint(trade))}</span><span class="meta">${esc(meta)}${icon("arrow", "ic ic-tile")}</span></a></li>`;
  }).join("");
  const body = `
<section class="hero">
<div class="hero-copy">
<p class="kicker">Singapore beta</p>
<h1>Good people for<br>the jobs at home.</h1>
<p class="dek">Find your next helping hand. Compare local companies, explore their published prices, and get the details before you book.</p>
<p class="hero-actions"><a class="btn btn-paper" href="#jobs">Explore home services${icon("arrow", "ic ic-btn")}</a></p>
</div>
<div class="hero-visual">${heroIllustration()}</div>
</section>
<ul class="trust" aria-label="What makes the list">
<li>${icon("shield", "ic ic-disc")}<strong>Nobody pays for a place.</strong><span>Companies cannot buy their way up the list. No ads or paid placements in your results.</span></li>
<li>${icon("link", "ic ic-disc")}<strong>Every figure has a source.</strong><span>Phones, prices, ratings, and reviews link to the page they were copied from. Nothing is invented.</span></li>
<li>${icon("calendar", "ic ic-disc")}<strong>Checked ${esc(checked)}.</strong><span>${total} companies so far. Each profile says who it suits and who should look elsewhere.</span></li>
</ul>
<section class="jobs" id="jobs">
<div class="section-head"><p class="kicker">Jobs</p><h2>What needs doing?</h2><p class="lede">Five ways to make home feel like home again. Start with the service you need.</p></div>
<ol class="index">${tiles}</ol>
</section>
<section class="section how">
<h2>How it works</h2>
<div>
<ol class="steps">
<li><strong>01</strong><span class="step-title">Pick a job.</span><span>Five jobs so far. Aircon also has pages for a chemical wash and a gas top-up.</span></li>
<li><strong>02</strong><span class="step-title">Read the shortlist.</span><span>Compare sourced prices, review details, and a reason the company might or might not suit your job.</span></li>
<li><strong>03</strong><span class="step-title">Talk to the company.</span><span>Call or WhatsApp directly. You can also preview a request for up to three companies. The beta does not send it.</span></li>
</ol>
<p class="method">${icon("link", "ic ic-inline")}<a href="/roster/how-it-works/">How the list is made, and what a Featured slot would be</a>.</p>
</div>
</section>
<section class="section promise">
<h2>What every profile shows</h2>
<ul class="promise-list">
<li>${icon("phone", "ic")}<strong>Phone and WhatsApp</strong><span>as printed on the company's own page, with that page linked.</span></li>
<li>${icon("check", "ic")}<strong>Best for and poor fit</strong><span>in plain words, so you can rule a company out before you call.</span></li>
<li>${icon("dollar", "ic")}<strong>Prices the company publishes</strong><span>with the page, and a note when GST is not stated.</span></li>
<li>${icon("star", "ic ic-star")}<strong>The rating on file</strong><span>with its source and the day it was checked. Roster prints no star score of its own.</span></li>
<li>${icon("quote", "ic")}<strong>Reviews with a name and a date</strong><span>copied as published. A quote with no name or no date is left off.</span></li>
<li>${icon("pin", "ic")}<strong>Address, UEN, and licence claims</strong><span>only when the company prints them, with a note that the register was not opened.</span></li>
</ul>
</section>`;
  const jsonLd = [
    { "@type": "WebSite", name: "Roster", url: origin + "/", description },
    {
      "@type": "Organization",
      name: "Roster",
      url: origin + "/",
      description: "A short unpaid list of home-service companies in Singapore."
    },
    webPage(title, "/roster/", description),
    {
      "@type": "ItemList",
      name: "Jobs on Roster",
      numberOfItems: trades.length,
      itemListElement: trades.map((trade, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: trade.name,
        url: `${origin}/${trade.slug}/`
      }))
    }
  ];
  forbidSchema(jsonLd);
  return pageShell({
    title,
    description,
    canonicalPath: "/roster/",
    current: "/roster/",
    jsonLd,
    bodyClass: "home-page",
    body
  });
}

/* ---------- How it works ---------- */

function renderHow() {
  const title = "How Roster works | Singapore beta";
  const description = "How the shortlist is ordered, what a Featured slot would be, and why the quote form does not send.";
  const canonicalPath = "/roster/how-it-works/";
  const sections = [
    ["What gets a company on the list", [
      `A phone number on the company's own site, or on a Google Maps listing we opened. A rating goes on the page when we can point at one figure on one page. A company with no rating can still be listed when its own page publishes a price, and the profile says the rating is missing. ISOTeam Homecare was already on the beta from directories, with no rating and no price, and its profile says the site was not opened. Checked ${checked}.`,
      "A review line needs a name, a date or a relative time, and the page it was copied from. The words stay as published, including rough grammar. A quote with no date stays off the page."
    ]],
    ["How the order is chosen", [
      "Ratings captured directly from Google sort first, by score and then review count. The remaining companies are alphabetical. Ratings printed by a company or a review mirror are labeled with their source and do not decide the order. A company cannot pay for a higher position."
    ]],
    ["What a homeowner does", [
      "Pick the job, read the shortlist, and use the form if you want to see it. The form asks about the job, property, postal code, timing, company count, and contact details. It does not send. A later version can pass one request to at most three companies that do that job and hold prepaid credits. The homeowner pays nothing."
    ]],
    ["What Featured would be", [
      "A labeled slot under the shortlist and under the form. At most two on a page. The company would get a name, one line, a published price if they have one, and a button that calls or messages them directly. The slot would not include quote requests, and it would not change the number, the stars, or the reviews. A company could buy credits, or a Featured slot, or both. Credits would be charged only when a matching request is delivered.",
      "There are no paid placements on these pages."
    ]],
    ["What stays off the page", [
      "Roster does not print its own star score. It does not say we visited, we called, or an anonymous tester booked the job. A licence number appears only when the company publishes it, with the page, and with the note that the register was not opened. A UEN is the same."
    ]]
  ];
  const html = sections.map(([heading, paragraphs], index) => `<section class="section how-step"><h2><span class="step-num">${String(index + 1).padStart(2, "0")}</span>${esc(heading)}</h2><div>${paragraphs.map((p) => `<p class="lede">${esc(p)}</p>`).join("")}</div></section>`).join("\n");
  const body = `
<div class="page-head">
${renderCrumbs([{ label: "How it works" }])}
<div class="head-row"><span class="disc">${icon("list", "ic ic-disc")}</span><div><p class="kicker">Method</p><h1>How this list is made</h1></div></div>
<p class="dek">One profile per company. A short list per job. The order is unpaid.</p>
</div>
${html}
${renderFaq(howFaqs)}`;
  const jsonLd = [
    webPage(title, canonicalPath, description),
    crumbsLd([{ label: "How it works" }]),
    faqLd(howFaqs)
  ];
  forbidSchema(jsonLd);
  return pageShell({
    title,
    description,
    canonicalPath,
    current: canonicalPath,
    jsonLd,
    body
  });
}

/* ---------- Build ---------- */

const presentation = JSON.parse(await readFile(path.join(root, "data", "presentation.json"), "utf8"));

const raw = JSON.parse(await readFile(path.join(root, "data", "companies.json"), "utf8"));
assertNoDashes(raw, "companies.json");
assertNoDashes({ trades, intents, howFaqs }, "templates");
validate(raw.companies);

const publishedCompanies = raw.companies.filter((company) => company.publish !== false);
const grouped = {};
for (const trade of trades) grouped[trade.id] = [];
for (const company of publishedCompanies) grouped[company.category].push(company);
for (const trade of trades) grouped[trade.id] = sortCompanies(grouped[trade.id]);

const written = [];
written.push(await writePage("", renderHome(grouped)));
written.push(await writePage("how-it-works", renderHow()));
for (const mode of ["sign-in", "sign-up", "forgot-password", "reset-password"]) written.push(await writePage(mode, renderAccount(mode)));
written.push(await writePage("search", renderCollection({ id: "all", slug: "search", name: "Home services", h1: "Home services in Singapore", intro: ["Explore the sourced companies on Roster. Use search and filters to narrow your list."], jobs: [], faqs: howFaqs.slice(0, 3) }, sortCompanies(publishedCompanies), [{ label: "Find a company" }])));

for (const trade of trades) {
  const crumbs = [{ label: trade.name }];
  written.push(await writePage(trade.slug, renderCollection(trade, grouped[trade.id], crumbs)));
}

for (const intent of intents) {
  const parent = tradeById(intent.parent);
  const companies = grouped[intent.parent].filter((company) => company.services.includes(intent.service));
  const crumbs = [
    { href: `/roster/${parent.slug}/`, label: parent.name },
    { label: intent.name }
  ];
  written.push(await writePage(intent.slug, renderCollection(intent, sortCompanies(companies), crumbs)));
}

for (const company of publishedCompanies) {
  written.push(await writePage(
    `company/${company.slug}`,
    renderProfile(company, grouped[company.category])
  ));
}

console.log(written.length + " pages");
for (const trade of trades) {
  console.log(trade.id + ": " + grouped[trade.id].map((company) => company.slug).join(", "));
}

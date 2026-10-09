import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const origin = "https://previews.heylead.com/roster";
const checked = "9 Oct 2026 and 10 Oct 2026";

const trades = [
  {
    id: "aircon",
    slug: "aircon-servicing",
    name: "Aircon servicing",
    h1: "Aircon servicing in Singapore",
    intro: [
      "Most HDB flats run two or three wall units on one compressor. Condos often add a ceiling cassette or a ducted unit in the living room. A normal service washes the filters and the fan coil. A chemical wash goes after the coil with a chemical. A gas top-up is for a unit that cools poorly, and it should come with a leak check.",
      "Six companies have a phone we could cite. The shortlist stops there. Order is the rating figure on file, then the review count. These figures are not from one Google API pull, so the order is provisional. 338 Aircon publishes more than one count. SoCool's public mirrors disagree with each other. Cool Aircon's homepage shows 4.9 and also says 5.0, and its page data says 366 reviews while the badge says 360+. A higher SoCool count would swap 338 Aircon and SoCool.",
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
      "Three companies have a phone we could cite. Direct Plumber prints 5.0 and 3,388+ reviews, and a second WhatsApp number in the footer. Kiasu Plumber prints prices and no licence number, and no review count on the pages we opened, so it sorts last. Mr Plumber's WhatsApp is also printed by Daylight Electrician."
    ],
    jobs: ["Choke", "Leak", "Water heater", "Other", "Not sure"],
    faqs: [
      ["Does a plumber in Singapore need a PUB licence?", "PUB licenses plumbers for water-service work. Mr Plumber prints WS17962021 on its Little India page and says its plumbers are BCA certified. This beta did not open the PUB or BCA registers, so the number is what the company publishes."],
      ["What should I ask before an emergency call-out?", "A fixed price, or the rate if they cannot see the choke yet. Ask which brand is sending the technician. The WhatsApp number on this profile is also printed by Daylight Electrician."],
      ["Why is Kiasu Plumber last?", "The homepage prices are published. The pages we opened do not print a PUB licence number, an address, or a Google rating. A company with no captured rating sorts last."],
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
      "Four companies have a phone we could cite. Order is the rating figure on file, then the review count. Daylight's own pages do not agree on the count. Repair.sg's pages do not agree on the score. 1st Electrical Services is 4.7 from 102 on a Trustindex page, and the homepage widget says 139. The order is provisional."
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
      "Three companies are listed. SG Handyman Engineering prints 4.9 from 70 Google reviews on its contact page. The widget reviews on that page have names and no dates, so no excerpt is stored. ISOTeam Homecare and Mr Handyman stay thinner. Neither company's own site was opened. Neither has a Google rating we could cite."
    ],
    jobs: ["Furniture", "Mounting", "Small repair", "Other", "Not sure"],
    faqs: [
      ["Why are two profiles thinner?", "Mr Handyman's own site was not opened. The address and phone come from directories that agree with each other. ISOTeam Homecare has a RecordOwl registry entry and no signed review stored here. SG Handyman Engineering is the one with a rating on its own contact page."],
      ["What should a handyman quote include?", "The job, the price, and whether drilling into a wall or a ceiling is included. In a condo, the MCST may want approval before noisy work."],
      ["Why do two profiles still have no Google rating?", "A rating goes on the page when we can point at one figure on one page. SG Handyman Engineering's contact page prints 4.9 from 70. ISOTeam and Mr Handyman did not clear that. ThreeBestRated's 4.9 for ISOTeam is that site's own score, so it is left off."],
      ["Why does one address match an electrician?", "Daylight Electrician's contact page lists a west branch at 21 Bukit Batok Crescent #09-79, the unit directories give for Mr Handyman. Confirm who will show up."]
    ]
  },
  {
    id: "cleaning",
    slug: "home-cleaning",
    name: "Home cleaning",
    h1: "Home cleaning in Singapore",
    intro: [
      "One company cleared the source bar. Sureclean prints a phone, an address, a UEN, and a Google reviews page we opened on 10 Oct 2026 that shows 4.9 from 1,551 reviews. Its weekly page prints 5 and 1,551+, and a widget on that page rendered as 1 star and 1500+. The sort uses 4.9 and 1,551.",
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
  ["Can a company pay to be number 1?", "No. The number is the rating figure on file, then the review count. A company cannot buy a higher place. Where the count is the company's own widget, or the mirrors disagree, the page says the order is provisional."],
  ["What would a Featured slot include?", "A label, the company name, one line they write, a published price if they have one, and a call or WhatsApp button that rings them directly. It would sit under the shortlist. It would not change the number, the stars, or the reviews, and it would not include the quote requests. The slots on this beta are empty. No company paid."],
  ["Does the quote form send my number?", "It does not. The button stays on this page. A later version can send one request to at most three companies that match the job and hold prepaid credits. A dead number, a job outside Singapore, or a job the company does not do would be refunded. That product is not switched on."],
  ["Where do the reviews come from?", "From the page named under the quote: a Google Maps listing, a Trustindex or Wanderlog mirror, property.co, or the company's own site. The words are copied as published. A review without a name and a date is left off. Roster does not run its own star score."],
  ["Why are some lists shorter than five?", "Five was the aim. A company needs a cited phone, plus a rating we can point at, or a price the company publishes when the rating is missing. Two handyman profiles predate that bar and say so. Home cleaning has one. Handyman has three. Inventing the rest would have been a directory, which is the thing this beta is here to avoid."]
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

function sortCompanies(list) {
  return list.slice().sort((a, b) => {
    const av = a.rating ? a.rating.value : -1;
    const bv = b.rating ? b.rating.value : -1;
    if (bv !== av) return bv - av;
    const ac = a.rating ? a.rating.count : -1;
    const bc = b.rating ? b.rating.count : -1;
    if (bc !== ac) return bc - ac;
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
  const links = navItems.map(([href, label, trade]) => {
    const currentAttr = href === current ? ' aria-current="page"' : "";
    const ic = trade ? icon(tradeIcon[trade], "ic nav-ic") : icon("list", "ic nav-ic");
    return `<a href="${href}"${currentAttr}>${ic}<span>${esc(label)}</span></a>`;
  }).join("");
  return `<header class="top"><div class="top-inner"><a class="brand" href="/roster/">${brandMark()}<span class="wordmark">Roster</span><span class="beta">Beta</span></a><nav class="nav" aria-label="Jobs">${links}</nav></div></header>`;
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
<p class="foot-line">Singapore beta. Featured slots on this beta are empty samples. The quote form does not send.</p>
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
  const options = jobs.map((job) => `<option>${esc(job)}</option>`).join("");
  const who = recipients.length
    ? `<p class="recipient">A later version would send one request to ${nameList(recipients)}. This beta does not send it.</p>`
    : `<p class="recipient">No company is on this list to receive a request. This beta does not send the form.</p>`;
  const id = (name) => `${uid}-${name}`;
  return `<section class="ask-wrap" aria-labelledby="${id("title")}"><div class="ask-copy"><p class="kicker">Quote request</p><h2 id="${id("title")}">${esc(askHeading(recipients.length))}</h2>${who}<p class="note ask-note">${icon("shield", "ic ic-inline")}Beta: this form does not send. Nothing is stored. The homeowner pays nothing.</p></div><div class="ask"><label for="${id("estate")}">Estate</label><select id="${id("estate")}" name="estate"><option value="">Select</option><option>HDB</option><option>Condo or apartment</option><option>Landed</option><option>Commercial</option><option>Not sure</option></select><label for="${id("units")}">Units</label><input id="${id("units")}" name="units" type="number" inputmode="numeric" min="1" max="20" placeholder="1"><label for="${id("job")}">Job</label><select id="${id("job")}" name="job"><option value="">Select</option>${options}</select><label for="${id("phone")}">Phone</label><input id="${id("phone")}" name="phone" type="tel" autocomplete="tel" placeholder="+65"><button class="btn btn-solid" type="button" onclick="var n=this.parentElement.querySelector('[data-result]'); if(n){n.hidden=false; n.textContent='Beta: this request was not sent.';}">Submit request${icon("arrow", "ic ic-btn")}</button><p class="result" data-result hidden role="status"></p></div></section>`;
}

function renderReview(review) {
  return `<figure class="quote"><blockquote><p>${esc(review.excerpt)}</p></blockquote><figcaption><span class="who">${esc(review.author)}</span>, ${esc(review.relativeTime)}. <a href="${esc(review.sourceUrl)}">Source</a>. <a href="${esc(review.mapsUrl)}">Maps</a>. <span class="src">${esc(review.sourceLabel)}</span></figcaption></figure>`;
}

function ratingChip(company) {
  if (!company.rating) {
    return `<p class="rate rate-none"><span class="score score-none">Rating not captured</span></p>`;
  }
  return `<p class="rate"><span class="score">${icon("star", "ic ic-star")}${esc(company.rating.value.toFixed(1))}</span><span class="rate-label">${esc(company.rating.label)}</span></p>`;
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

function renderRow(company, index) {
  const note = company.rating ? `<p class="rating-note">${esc(company.rating.note)}</p>` : "";
  const quote = company.reviews[0]
    ? renderReview(company.reviews[0])
    : `<p class="note quote-none">No dated excerpt is stored for this beta.</p>`;
  return `<li class="row"><div class="row-num" aria-hidden="true">${String(index + 1).padStart(2, "0")}</div><div class="row-body"><div class="row-head"><h2><a href="/roster/company/${company.slug}/">${esc(company.name)}</a></h2>${ratingChip(company)}</div>${note}<p class="fit"><span class="fit-label">Best for</span>${esc(company.bestFor)}</p>${quote}<p class="actions">${contactButtons(company, true)}</p></div></li>`;
}

function shortlist(companies) {
  if (!companies.length) {
    return `<p class="empty">No company is on this shortlist.</p>`;
  }
  const n = companies.length;
  return `<div class="list-head"><h2 class="section">Unpaid shortlist</h2><p class="list-meta">${n} ${n === 1 ? "company" : "companies"}, ordered by the rating on file, then the review count</p></div><ol class="shortlist">${companies.map(renderRow).join("")}</ol>`;
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
<link rel="stylesheet" href="/roster/assets/site.css">
<script type="application/ld+json">${graph}</script>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
<a class="skip" href="#content">Skip to content</a>
${renderNav(current)}
<main id="content" class="wrap">
${body}
</main>
${renderFooter()}
<script src="/roster/assets/form.js"></script>
</body>
</html>
`;
  assertNoDashes(html, canonicalPath);
  if (/aggregateRating/i.test(html) || /"@type":"(Review|Offer|AggregateRating)"/.test(html)) {
    throw new Error("Rating, review, or offer schema leaked into " + canonicalPath);
  }
  if (/<form[\s>]/i.test(html)) {
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
  const body = [
    `<div class="page-head">`,
    renderCrumbs(crumbs),
    `<div class="head-row"><span class="disc">${icon(tradeIcon[tradeId], "ic ic-disc")}</span><div><p class="kicker">Singapore, ${esc(countLabel)}</p><h1>${esc(spec.h1)}</h1></div></div>`,
    `<p class="lede">${esc(spec.intro[0])}</p>`,
    isAircon ? airconSubnav(canonicalPath) : "",
    `</div>`,
    notes ? `<aside class="notes"><h2>${icon("list", "ic")}Notes on this list</h2>${notes}<p class="method">${icon("link", "ic ic-inline")}<a href="/roster/how-it-works/">How the list is made</a>. Checked ${checked}.</p></aside>` : `<p class="method">${icon("link", "ic ic-inline")}<a href="/roster/how-it-works/">How the list is made</a>. Checked ${checked}.</p>`,
    shortlist(companies),
    renderForm(spec.jobs, firstThree(companies), "ask"),
    renderFeatured(),
    renderFaq(spec.faqs)
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
    body
  });
}

/* ---------- Profile ---------- */

function factRow(label, html) {
  return `<div><dt>${esc(label)}</dt><dd>${html}</dd></div>`;
}

function renderProfile(company, peers) {
  const trade = tradeById(company.category);
  const title = `${company.name} - ${trade.name}, Singapore | Roster`;
  const description = company.bestFor.slice(0, 155);
  const canonicalPath = `/roster/company/${company.slug}/`;
  const facts = [];
  facts.push(factRow("Phone", `<a href="${telHref(company.phone.value)}">${esc(company.phone.value)}</a>`));
  if (company.whatsapp?.value) {
    const note = company.whatsapp.note ? ` <span class="fact-note">${esc(company.whatsapp.note)}</span>` : "";
    facts.push(factRow("WhatsApp", `<a href="${waHref(company.whatsapp.value)}">${esc(company.whatsapp.value)}</a>${note}`));
  }
  if (company.email?.value) facts.push(factRow("Email", esc(company.email.value)));
  if (company.address?.value) facts.push(factRow("Address", esc(company.address.value)));
  if (company.website?.value) {
    const note = company.website.note ? ` <span class="fact-note">${esc(company.website.note)}</span>` : "";
    const shown = company.website.value.replace(/^https?:\/\//, "").replace(/\/$/, "");
    facts.push(factRow("Website", `<a href="${esc(company.website.value)}">${esc(shown)}</a>${note}`));
  }
  facts.push(factRow("Maps", `<a href="${esc(company.mapsUrl)}">Open the listing</a>${company.mapsNote ? ` <span class="fact-note">${esc(company.mapsNote)}</span>` : ""}`));
  if (company.rating) {
    facts.push(factRow("Rating", `<strong>${esc(company.rating.label)}.</strong> <span class="fact-note">${esc(company.rating.note)}</span> <a class="fact-src" href="${esc(company.rating.sourceUrl)}">Source</a>`));
  } else {
    facts.push(factRow("Rating", "Rating not captured."));
  }
  for (const fact of company.facts || []) {
    facts.push(factRow(fact.label, `${esc(fact.value)} <a class="fact-src" href="${esc(fact.sourceUrl)}">Source</a>`));
  }
  const reviews = company.reviews.length
    ? `<div class="quotes">${company.reviews.map(renderReview).join("")}</div>`
    : `<p class="note quote-none">No dated excerpt is stored for this beta.</p>`;
  const others = peers.filter((peer) => peer.slug !== company.slug);
  const otherHtml = others.length
    ? `<ul class="peers">${others.map((peer) => `<li><a href="/roster/company/${peer.slug}/"><span class="peer-name">${esc(peer.name)}</span>${peer.rating ? `<span class="peer-rate">${icon("star", "ic ic-star")}${esc(peer.rating.value.toFixed(1))}</span>` : `<span class="peer-rate peer-none">No rating</span>`}</a></li>`).join("")}</ul>`
    : `<p class="note">No other company is on this shortlist.</p>`;
  const matched = [company, ...others].slice(0, 3);
  const crumbs = [
    { href: `/roster/${trade.slug}/`, label: trade.name },
    { label: company.name }
  ];
  const callbar = `<div class="callbar" aria-label="Contact ${esc(company.name)}"><a class="btn btn-solid" href="${telHref(company.phone.value)}">${icon("phone", "ic ic-btn-lead")}Call</a>${company.whatsapp?.value ? `<a class="btn" href="${waHref(company.whatsapp.value)}">${icon("chat", "ic ic-btn-lead")}WhatsApp</a>` : `<a class="btn" href="${esc(company.mapsUrl)}">${icon("pin", "ic ic-btn-lead")}Maps</a>`}</div>`;
  const body = [
    `<div class="page-head profile-head">`,
    renderCrumbs(crumbs),
    `<a class="tag" href="/roster/${trade.slug}/">${icon(tradeIcon[trade.id], "ic")}${esc(trade.name)} in Singapore</a>`,
    `<h1>${esc(company.name)}</h1>`,
    ratingChip(company),
    `<p class="actions actions-hero">${contactButtons(company, false)}<a class="btn btn-quiet" href="${esc(company.mapsUrl)}">${icon("pin", "ic ic-btn-lead")}Maps</a></p>`,
    `</div>`,
    `<div class="profile">`,
    `<aside class="profile-side"><div class="facts-wrap"><h2 class="facts-title">Facts, as published</h2><dl class="facts">${facts.join("")}</dl></div></aside>`,
    `<div class="profile-main">`,
    `<div class="fit-grid"><section class="fit-card good"><h2>${icon("check", "ic")}Best for</h2><p class="fit">${esc(company.bestFor)}</p></section><section class="fit-card poor"><h2>${icon("tagIcon", "ic")}Poor fit</h2><p class="fit">${esc(company.poorFit)}</p></section></div>`,
    `<section class="section price-section"><h2>${icon("dollar", "ic")}Pricing</h2><div class="price-card"><p class="price">${esc(company.priceNote)}</p><p class="byline"><a href="${esc(company.priceSourceUrl)}">Price source</a>. Prices are what the company publishes.</p></div></section>`,
    `<section class="section"><h2>${icon("quote", "ic")}What reviewers wrote</h2>${reviews}</section>`,
    renderForm(trade.jobs, matched, "ask"),
    `<section class="section"><h2>Other companies in ${esc(trade.name.toLowerCase())}</h2>${otherHtml}</section>`,
    `</div>`,
    `</div>`,
    callbar
  ].join("\n");
  const jsonLd = [
    webPage(title, canonicalPath, description),
    crumbsLd(crumbs),
    businessNode(company)
  ];
  forbidSchema(jsonLd);
  return pageShell({
    title,
    description,
    canonicalPath,
    current: `/roster/${trade.slug}/`,
    jsonLd,
    body,
    bodyClass: "has-callbar"
  });
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
<h1>Short, unpaid shortlists for home jobs in Singapore.</h1>
<p class="dek">Aircon, plumbing, electrical, handyman, and cleaning. Every list is ordered by the rating on file, never by who paid, and every figure links to the page it came from.</p>
<p class="hero-actions"><a class="btn btn-paper" href="#jobs">Pick a job${icon("arrow", "ic ic-btn")}</a><a class="btn btn-ghost" href="/roster/how-it-works/">How the list is made</a></p>
</div>
<div class="hero-visual">${heroIllustration()}</div>
</section>
<ul class="trust" aria-label="What makes the list">
<li>${icon("shield", "ic ic-disc")}<strong>Nobody pays for a place.</strong><span>Companies cannot buy a higher number. Paid slots sit apart, labeled, and stay empty on this beta.</span></li>
<li>${icon("link", "ic ic-disc")}<strong>Every figure has a source.</strong><span>Phones, prices, ratings, and reviews link to the page they were copied from. Nothing is invented.</span></li>
<li>${icon("calendar", "ic ic-disc")}<strong>Checked ${esc(checked)}.</strong><span>${total} companies so far. Each profile says who it suits and who should look elsewhere.</span></li>
</ul>
<section class="jobs" id="jobs">
<div class="section-head"><p class="kicker">Jobs</p><h2>Pick the job, then read the shortlist</h2><p class="lede">The list is as long as the sourcing allowed. Some jobs have fewer than five companies. Home cleaning has one. Handyman has three.</p></div>
<ol class="index">${tiles}</ol>
</section>
<section class="section how">
<h2>How it works</h2>
<div>
<ol class="steps">
<li><strong>01</strong><span class="step-title">Pick a job.</span><span>Five jobs so far. Aircon also has pages for a chemical wash and a gas top-up.</span></li>
<li><strong>02</strong><span class="step-title">Read the shortlist.</span><span>The order is unpaid. Each card shows the rating on file, who the company suits, and one dated review.</span></li>
<li><strong>03</strong><span class="step-title">Call, or send one request.</span><span>One request can go to at most three companies. In this beta the form does not send it.</span></li>
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
      `A phone number on the company's own site, or on a Google Maps listing we opened. A rating goes on the page when we can point at one figure on one page. A company with no rating can still be listed when its own page publishes a price, and the profile says the rating is missing. Two handyman profiles were already on the beta from directories, with no rating and no price, and those profiles say the site was not opened. Checked ${checked}.`,
      "A review line needs a name, a date or a relative time, and the page it was copied from. The words stay as published, including rough grammar. A quote with no date stays off the page."
    ]],
    ["How the order is chosen", [
      "Higher rating figure first. If the rating ties, the higher review count comes first. A company with no captured rating goes last. The figures are from the company site or a public mirror. They are not one live Google pull, so a page that publishes two counts can move when we next check it."
    ]],
    ["What a homeowner does", [
      "Pick the job, read the shortlist, and use the form if you want to see it. The form has the estate, the unit count, the job, and a phone. It does not send. A later version can pass one request to at most three companies that do that job and hold prepaid credits. The homeowner pays nothing."
    ]],
    ["What Featured would be", [
      "A labeled slot under the shortlist and under the form. At most two on a page. The company would get a name, one line, a published price if they have one, and a button that calls or messages them directly. The slot would not include quote requests, and it would not change the number, the stars, or the reviews. A company could buy credits, or a Featured slot, or both. Credits would be charged only when a matching request is delivered.",
      "The amber slots on this beta are empty. No named company paid for one."
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

const raw = JSON.parse(await readFile(path.join(root, "data", "companies.json"), "utf8"));
assertNoDashes(raw, "companies.json");
assertNoDashes({ trades, intents, howFaqs }, "templates");
validate(raw.companies);

const grouped = {};
for (const trade of trades) grouped[trade.id] = [];
for (const company of raw.companies) grouped[company.category].push(company);
for (const trade of trades) grouped[trade.id] = sortCompanies(grouped[trade.id]);

const written = [];
written.push(await writePage("", renderHome(grouped)));
written.push(await writePage("how-it-works", renderHow()));

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

for (const company of raw.companies) {
  written.push(await writePage(
    `company/${company.slug}`,
    renderProfile(company, grouped[company.category])
  ));
}

console.log(written.length + " pages");
for (const trade of trades) {
  console.log(trade.id + ": " + grouped[trade.id].map((company) => company.slug).join(", "));
}

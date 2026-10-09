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

const navItems = [
  ["/roster/aircon-servicing/", "Aircon"],
  ["/roster/plumbing/", "Plumbing"],
  ["/roster/electrician/", "Electrician"],
  ["/roster/handyman/", "Handyman"],
  ["/roster/home-cleaning/", "Cleaning"],
  ["/roster/how-it-works/", "How it works"]
];

function renderNav(current) {
  const links = navItems.map(([href, label]) => {
    const currentAttr = href === current ? ' aria-current="page"' : "";
    return `<a href="${href}"${currentAttr}>${esc(label)}</a>`;
  }).join("");
  return `<header class="top"><div class="top-inner"><div class="brand"><a class="wordmark" href="/roster/">Roster</a><span class="beta">Beta</span></div><nav class="nav" aria-label="Jobs">${links}</nav></div></header>`;
}

function renderCrumbs(items) {
  const parts = [{ href: "/roster/", label: "Roster" }, ...items];
  const html = parts.map((item, index) => {
    if (index === parts.length - 1) return `<span>${esc(item.label)}</span>`;
    return `<a href="${item.href}">${esc(item.label)}</a>`;
  }).join(" / ");
  return `<p class="crumbs">${html}</p>`;
}

function renderFooter() {
  return `<footer class="foot wrap"><p>Figures checked ${checked}. Ratings and excerpts are from the cited page. They are not from one Google API pull.</p><p>Featured slots on this beta are empty samples. <a href="/roster/how-it-works/">How the list is made</a>.</p></footer>`;
}

function renderFaq(faqs) {
  const items = faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");
  return `<section class="faq"><h2>Questions</h2>${items}</section>`;
}

function renderFeatured() {
  const slot = `<article class="ad"><p class="eyebrow">Featured - paid placement (sample)</p><p>Sample slot. No company is placed here. A paid slot would show a name, one line, and a WhatsApp button. It would not get a number on the list.</p></article>`;
  return `<section class="ads" aria-label="Sample placements"><h2>Sample placements</h2><p class="note">These two slots are empty. No named company paid to appear here.</p>${slot}${slot}<p class="ads-foot">Featured is a monthly visibility ad. It does not change the shortlist.</p></section>`;
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

function renderForm(jobs, recipients) {
  const options = jobs.map((job) => `<option>${esc(job)}</option>`).join("");
  const who = recipients.length
    ? `<p class="recipient">A later version would send one request to ${nameList(recipients)}. This beta does not send it.</p>`
    : `<p class="recipient">No company is on this list to receive a request. This beta does not send the form.</p>`;
  return `<section class="ask-wrap"><h2>${esc(askHeading(recipients.length))}</h2>${who}<p class="note">Beta: this form does not send. Nothing is stored.</p><div class="ask"><label>Estate<select name="estate"><option value="">Select</option><option>HDB</option><option>Condo or apartment</option><option>Landed</option><option>Commercial</option><option>Not sure</option></select></label><label>Units<input name="units" type="number" inputmode="numeric" min="1" max="20"></label><label>Job<select name="job"><option value="">Select</option>${options}</select></label><label>Phone<input name="phone" type="tel" autocomplete="tel"></label><button class="btn btn-solid" type="button" onclick="var n=this.parentElement.querySelector('[data-result]'); if(n){n.hidden=false; n.textContent='Beta: this request was not sent.';}">Submit request</button><p class="result" data-result hidden></p></div></section>`;
}

function renderReview(review) {
  return `<blockquote><p>${esc(review.excerpt)}</p></blockquote><p class="byline">${esc(review.author)}, ${esc(review.relativeTime)}. <a href="${esc(review.sourceUrl)}">Source</a>. <a href="${esc(review.mapsUrl)}">Maps</a>. ${esc(review.sourceLabel)}</p>`;
}

function renderRow(company, index) {
  const score = company.rating
    ? `<p class="rating"><span class="score">${esc(company.rating.value.toFixed(1))}</span></p><p class="rating-note">${esc(company.rating.note)}</p>`
    : `<p class="rating"><span class="count">Rating not captured</span></p>`;
  const quote = company.reviews[0] ? renderReview(company.reviews[0]) : `<p class="note">No dated excerpt is stored for this beta.</p>`;
  return `<li class="row"><div class="num">${String(index + 1).padStart(2, "0")}</div><div><h2><a href="/roster/company/${company.slug}/">${esc(company.name)}</a></h2>${score}<p class="fit"><span class="fit-label">Best for</span>${esc(company.bestFor)}</p>${quote}<p class="actions"><a class="btn" href="${telHref(company.phone.value)}">Call</a><a class="btn btn-solid" href="/roster/company/${company.slug}/">Profile</a></p></div></li>`;
}

function shortlist(companies) {
  if (!companies.length) {
    return `<p class="empty">No company is on this shortlist.</p>`;
  }
  return `<h2 class="section">Unpaid shortlist</h2><ol class="shortlist">${companies.map(renderRow).join("")}</ol>`;
}

function pageShell({ title, description, canonicalPath, current, jsonLd, body }) {
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
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/roster/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,560;1,9..144,460&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/roster/assets/site.css">
<script type="application/ld+json">${graph}</script>
</head>
<body>
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
  if (html.includes("aggregateRating") || html.includes("AggregateRating")) {
    throw new Error("Rating schema leaked into " + canonicalPath);
  }
  if (/mailto:|formspree|fetch\(/i.test(html)) {
    throw new Error("Outbound form hook in " + canonicalPath);
  }
  return html;
}

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
  walkStrings(node, () => {});
  const scan = (value) => {
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      if (banned.has(key)) throw new Error("Banned schema key " + key);
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

function renderCollection(spec, companies, crumbs) {
  const count = companies.length;
  const title = count === 0
    ? `${spec.h1.replace(" in Singapore", "")} in Singapore: no shortlist yet | Roster`
    : `${spec.titleName || spec.name} in Singapore: shortlist of ${count} ${count === 1 ? "company" : "companies"} | Roster`;
  const description = spec.intro[0].slice(0, 155);
  const canonicalPath = `/roster/${spec.slug}/`;
  const body = [
    renderCrumbs(crumbs),
    `<p class="kicker">Singapore</p>`,
    `<h1>${esc(spec.h1)}</h1>`,
    ...spec.intro.map((paragraph) => `<p class="lede">${esc(paragraph)}</p>`),
    `<p class="method">How this list was made. <a href="/roster/how-it-works/">Read the method</a>. Checked ${checked}.</p>`,
    shortlist(companies),
    renderForm(spec.jobs, firstThree(companies)),
    renderFeatured(),
    spec.slug === "aircon-servicing" ? `<nav class="subs" aria-label="Aircon jobs"><a href="/roster/aircon-servicing/">All aircon servicing</a><a href="/roster/aircon-servicing/chemical-wash/">Chemical wash</a><a href="/roster/aircon-servicing/gas-top-up/">Gas top-up</a></nav>` : "",
    renderFaq(spec.faqs)
  ].join("\n");
  const jsonLd = [
    webPage(title, canonicalPath, description),
    { "@type": "CollectionPage", name: spec.h1, url: abs(canonicalPath) },
    crumbsLd(crumbs.map((item, index) => index === crumbs.length - 1 ? { label: item.label } : item)),
    faqLd(spec.faqs)
  ];
  jsonLd[2] = crumbsLd(crumbs.map((item, index) => (
    index === crumbs.length - 1 ? { href: canonicalPath, label: item.label } : item
  )));
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
    const note = company.whatsapp.note ? ` ${esc(company.whatsapp.note)}` : "";
    facts.push(factRow("WhatsApp", `<a href="${waHref(company.whatsapp.value)}">${esc(company.whatsapp.value)}</a>${note}`));
  }
  if (company.email?.value) facts.push(factRow("Email", esc(company.email.value)));
  if (company.address?.value) facts.push(factRow("Address", esc(company.address.value)));
  if (company.website?.value) {
    const note = company.website.note ? ` ${esc(company.website.note)}` : "";
    facts.push(factRow("Website", `<a href="${esc(company.website.value)}">${esc(company.website.value)}</a>${note}`));
  }
  facts.push(factRow("Maps", `<a href="${esc(company.mapsUrl)}">Open the listing</a> ${esc(company.mapsNote || "")}`));
  if (company.rating) {
    facts.push(factRow("Rating", `${esc(company.rating.label)}. ${esc(company.rating.note)} <a class="fact-src" href="${esc(company.rating.sourceUrl)}">Source</a>`));
  } else {
    facts.push(factRow("Rating", "Rating not captured."));
  }
  for (const fact of company.facts || []) {
    facts.push(factRow(fact.label, `${esc(fact.value)} <a class="fact-src" href="${esc(fact.sourceUrl)}">Source</a>`));
  }
  const reviews = company.reviews.length
    ? company.reviews.map(renderReview).join("")
    : `<p class="note">No dated excerpt is stored for this beta.</p>`;
  const others = peers.filter((peer) => peer.slug !== company.slug);
  const otherHtml = others.length
    ? `<ul class="peers">${others.map((peer) => `<li><a href="/roster/company/${peer.slug}/">${esc(peer.name)}</a></li>`).join("")}</ul>`
    : `<p class="note">No other company is on this shortlist.</p>`;
  const matched = [company, ...others].slice(0, 3);
  const crumbs = [
    { href: `/roster/${trade.slug}/`, label: trade.name },
    { label: company.name }
  ];
  const body = [
    renderCrumbs(crumbs),
    `<p class="kicker">Profile</p>`,
    `<h1>${esc(company.name)}</h1>`,
    `<a class="tag" href="/roster/${trade.slug}/">${esc(trade.name)} in Singapore</a>`,
    `<div class="profile">`,
    `<aside class="profile-side"><dl class="facts">${facts.join("")}</dl></aside>`,
    `<div class="profile-main">`,
    `<section class="section"><h2>Best for</h2><p class="fit">${esc(company.bestFor)}</p></section>`,
    `<section class="section"><h2>Poor fit</h2><p class="fit poor">${esc(company.poorFit)}</p></section>`,
    `<section class="section"><h2>Pricing</h2><p class="price">${esc(company.priceNote)}</p><p class="byline"><a href="${esc(company.priceSourceUrl)}">Price source</a></p></section>`,
    `<section class="section"><h2>What reviewers wrote</h2>${reviews}</section>`,
    renderForm(trade.jobs, matched),
    `<section class="section"><h2>Other companies in ${esc(trade.name.toLowerCase())}</h2>${otherHtml}</section>`,
    `</div>`,
    `</div>`
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
    body
  });
}

function renderHome(grouped) {
  const title = "Roster | Short unpaid lists of home services in Singapore";
  const description = "A short unpaid list of home-service companies in Singapore, with the reviews that back it.";
  const rows = trades.map((trade, index) => {
    const count = grouped[trade.id].length;
    const meta = count === 0 ? "No companies yet" : `${count} ${count === 1 ? "company" : "companies"}`;
    const empty = count === 0 ? ` class="is-empty"` : "";
    return `<li${empty}><a href="/roster/${trade.slug}/"><span class="idx">${String(index + 1).padStart(2, "0")}</span><span class="job">${esc(trade.name)}</span><span class="meta">${esc(meta)}</span></a></li>`;
  }).join("");
  const body = `
<div class="intro">
<div class="intro-lead">
<p class="kicker">Singapore beta</p>
<h1>Roster</h1>
<p class="dek">A short, unpaid list of home-service companies in Singapore, with the reviews that back it.</p>
</div>
<div class="intro-body">
<p class="lede">Companies cannot pay to move up this list. Every profile says who the company is a good fit for, and who should look elsewhere.</p>
<p class="lede">The list is as long as the sourcing allowed. Some jobs have fewer than five companies. Home cleaning has one. Handyman has three.</p>
</div>
</div>
<ol class="index section">${rows}</ol>
<section class="section">
<h2>How it works</h2>
<ol class="steps">
<li><strong>01</strong> Pick a job.</li>
<li><strong>02</strong> Read the shortlist. The order is unpaid.</li>
<li><strong>03</strong> One request can go to at most three companies. In this beta the form does not send it.</li>
</ol>
<p class="method"><a href="/roster/how-it-works/">How the list is made, and what a Featured slot would be</a>.</p>
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

function renderHow() {
  const title = "How Roster works | Singapore beta";
  const description = "How the shortlist is ordered, what a Featured slot would be, and why the quote form does not send.";
  const canonicalPath = "/roster/how-it-works/";
  const body = `
${renderCrumbs([{ label: "How it works" }])}
<p class="kicker">Method</p>
<h1>How this list is made</h1>
<p class="dek">One profile per company. A short list per job. The order is unpaid.</p>
<section class="section"><h2>What gets a company on the list</h2>
<p class="lede">A phone number on the company's own site, or on a Google Maps listing we opened. A rating goes on the page when we can point at one figure on one page. A company with no rating can still be listed when its own page publishes a price, and the profile says the rating is missing. Two handyman profiles were already on the beta from directories, with no rating and no price, and those profiles say the site was not opened. Checked ${checked}.</p>
<p class="lede">A review line needs a name, a date or a relative time, and the page it was copied from. The words stay as published, including rough grammar. A quote with no date stays off the page.</p></section>
<section class="section"><h2>How the order is chosen</h2>
<p class="lede">Higher rating figure first. If the rating ties, the higher review count comes first. A company with no captured rating goes last. The figures are from the company site or a public mirror. They are not one live Google pull, so a page that publishes two counts can move when we next check it.</p></section>
<section class="section"><h2>What a homeowner does</h2>
<p class="lede">Pick the job, read the shortlist, and use the form if you want to see it. The form has the estate, the unit count, the job, and a phone. It does not send. A later version can pass one request to at most three companies that do that job and hold prepaid credits. The homeowner pays nothing.</p></section>
<section class="section"><h2>What Featured would be</h2>
<p class="lede">A labeled slot under the shortlist and under the form. At most two on a page. The company would get a name, one line, a published price if they have one, and a button that calls or messages them directly. The slot would not include quote requests, and it would not change the number, the stars, or the reviews. A company could buy credits, or a Featured slot, or both. Credits would be charged only when a matching request is delivered.</p>
<p class="lede">The amber slots on this beta are empty. No named company paid for one.</p></section>
<section class="section"><h2>What stays off the page</h2>
<p class="lede">Roster does not print its own star score. It does not say we visited, we called, or an anonymous tester booked the job. A licence number appears only when the company publishes it, with the page, and with the note that the register was not opened. A UEN is the same.</p></section>
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

import {heroPhoto,photoCredit} from './lib/hero-professions.mjs';
import {previewFeatures} from './assets/features.mjs';
import {renderQuoteEvidence,logoOwnerNote} from './assets/evidence-display.mjs';
import {accountContent,accountHome,savedContent,callbackContent} from './lib/account-pages.mjs';
import {renderMatchPage} from './lib/job-search.mjs';
import {renderQuoteComposer} from './lib/quote-flow.mjs';
import {renderAreaFilter} from './lib/service-areas.mjs';
import {ratingSummary} from './lib/rating-summary.mjs';
import {planningAreas} from './assets/service-areas.mjs';
import {selectAreaPages,townCoverage,townRegion,nearbyTowns,serviceCounts} from './lib/area-pages.mjs';
import {priceOption} from './scripts/import-db.mjs';
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {execFileSync} from 'node:child_process';

import { createProfileRenderer, directoryRecord, concise, ratingFact } from "./lib/expanded.mjs";
import {renderHomeSnapshot, buildHomeSnapshot} from './lib/home-snapshot.mjs';
import {loadGuides, parseGuide, renderEditorial, renderGuideTeaser, guideCards, editorialSchema} from './lib/editorial.mjs';
import {encodeCatalogue} from './assets/catalogue-data.mjs';
import {priceView, servicePrice, serviceGuide} from "./lib/profile-copy.mjs";
import {renderClaimPage} from "./lib/claim-page.mjs";
import {guideEvidence, sourcedRates, rateLabel, rateCell, displayUnit, isFromPrice, minimumCompanies, money} from "./lib/sourced-rates.mjs";
import { renderCard, renderCompactCard, splitDirectory } from "./assets/catalogue-card.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const editorialGuides = await loadGuides(root);
const editorialByPath = new Map(editorialGuides.map(g=>[g.path,g]));
const editorialByDirectory = new Map(editorialGuides.filter(g=>g.directoryPath).map(g=>[g.directoryPath,g]));
const methodGuide = {...parseGuide(await readFile(path.join(root,"content/how-it-works.md"),"utf8"),"method"),id:"method",slug:"how-it-works",trade:"all",h1:"How Roster works",updated:"2026-10-12",path:"/roster/how-it-works/"};
await import('./scripts/build-accounts.mjs');
console.log('Logo framing:', execFileSync('python3', [path.join(root, 'scripts/fit-logos.py')], {encoding:'utf8'}).trim());
const mapPins=JSON.parse(await readFile(path.join(root,"data/map-pins.json"),"utf8"));
const homeOutline=JSON.parse(await readFile(path.join(root,"data/singapore-outline.json"),"utf8"));
const indexVersions={};
const origin = "https://previews.heylead.com/roster";
let checked = "9 Oct 2026 and 10 Oct 2026";
// Content hashes keep cached assets in sync with each generated page.
const assetVersions = Object.fromEntries(await Promise.all(
  ["editorial.css", "sort-control.css", "accounts.css", "accounts.js", "hero-rotation.css", "hero-rotation.js", "quote-flow.css", "quote-start.js", "job-search.css", "job-search.js", "job-results.js", "service-areas.css", "home.css", "home.js", "site.css", "directory.css", "experience.css", "form.js", "directory.js", "experience.js", "expanded.css", "logo-fit.css", "catalogue.js", "catalogue-card.mjs", "claim.js", "review-preview.mjs"].map(async (name) => [
    name,
    createHash("sha256").update(await readFile(path.join(root, "assets", name))).digest("hex").slice(0, 12)
  ])
));

const trades = [
  {
    "id": "aircon",
    "slug": "aircon-servicing",
    "name": "Aircon servicing",
    "h1": "Aircon servicing in Singapore",
    "intro": [
      "Explore sourced aircon servicing companies in Singapore. Compare the services they publish, their prices and how to contact them.",
      "Listings come from company websites and cited records. Ratings name their source and check date. Missing prices are left as a request for a quote."
    ],
    "jobs": [
      "General service",
      "Chemical wash",
      "Gas top-up",
      "Repair",
      "Not sure"
    ],
    "faqs": [
      [
        "How do I compare aircon servicing companies?",
        "Start with the service you need, check the published price conditions and confirm availability directly. The location filter describes the listed business address, not its service coverage."
      ],
      [
        "Are all prices fixed quotes?",
        "No. Published figures can depend on the job, unit count or package. Check the price source and ask about parts, transport and GST."
      ],
      [
        "Where do the ratings come from?",
        "Each rating names its source and check date. Google Maps search figures are source snapshots. Company-site figures remain labelled as company-site claims."
      ],
      [
        "Does the quote preview send my details?",
        "No. The beta request panel is a preview. Nothing is sent or stored. Call or WhatsApp a company directly to discuss a job."
      ]
    ]
  },
  {
    "id": "plumbing",
    "slug": "plumbing",
    "name": "Plumbing",
    "h1": "Plumbing in Singapore",
    "intro": [
      "Explore sourced plumbing companies in Singapore. Compare the services they publish, their prices and how to contact them.",
      "Listings come from company websites and cited records. Ratings name their source and check date. Missing prices are left as a request for a quote."
    ],
    "jobs": [
      "Choke",
      "Leak",
      "Water heater",
      "Other",
      "Not sure"
    ],
    "faqs": [
      [
        "How do I compare plumbing companies?",
        "Start with the service you need, check the published price conditions and confirm availability directly. The location filter describes the listed business address, not its service coverage."
      ],
      [
        "Are all prices fixed quotes?",
        "No. Published figures can depend on the job, unit count or package. Check the price source and ask about parts, transport and GST."
      ],
      [
        "Where do the ratings come from?",
        "Each rating names its source and check date. Google Maps search figures are source snapshots. Company-site figures remain labelled as company-site claims."
      ],
      [
        "Does the quote preview send my details?",
        "No. The beta request panel is a preview. Nothing is sent or stored. Call or WhatsApp a company directly to discuss a job."
      ]
    ]
  },
  {
    "id": "electrician",
    "slug": "electrician",
    "name": "Electrician",
    "h1": "Electrician in Singapore",
    "intro": [
      "Explore sourced electrician companies in Singapore. Compare the services they publish, their prices and how to contact them.",
      "Listings come from company websites and cited records. Ratings name their source and check date. Missing prices are left as a request for a quote."
    ],
    "jobs": [
      "Power trip",
      "Lighting",
      "Distribution board",
      "Other",
      "Not sure"
    ],
    "faqs": [
      [
        "How do I compare electrician companies?",
        "Start with the service you need, check the published price conditions and confirm availability directly. The location filter describes the listed business address, not its service coverage."
      ],
      [
        "Are all prices fixed quotes?",
        "No. Published figures can depend on the job, unit count or package. Check the price source and ask about parts, transport and GST."
      ],
      [
        "Where do the ratings come from?",
        "Each rating names its source and check date. Google Maps search figures are source snapshots. Company-site figures remain labelled as company-site claims."
      ],
      [
        "Does the quote preview send my details?",
        "No. The beta request panel is a preview. Nothing is sent or stored. Call or WhatsApp a company directly to discuss a job."
      ]
    ]
  },
  {
    "id": "handyman",
    "slug": "handyman",
    "name": "Handyman",
    "h1": "Handyman in Singapore",
    "intro": [
      "Explore sourced handyman companies in Singapore. Compare the services they publish, their prices and how to contact them.",
      "Listings come from company websites and cited records. Ratings name their source and check date. Missing prices are left as a request for a quote."
    ],
    "jobs": [
      "Furniture",
      "Mounting",
      "Small repair",
      "Other",
      "Not sure"
    ],
    "faqs": [
      [
        "How do I compare handyman companies?",
        "Start with the service you need, check the published price conditions and confirm availability directly. The location filter describes the listed business address, not its service coverage."
      ],
      [
        "Are all prices fixed quotes?",
        "No. Published figures can depend on the job, unit count or package. Check the price source and ask about parts, transport and GST."
      ],
      [
        "Where do the ratings come from?",
        "Each rating names its source and check date. Google Maps search figures are source snapshots. Company-site figures remain labelled as company-site claims."
      ],
      [
        "Does the quote preview send my details?",
        "No. The beta request panel is a preview. Nothing is sent or stored. Call or WhatsApp a company directly to discuss a job."
      ]
    ]
  },
  {
    "id": "cleaning",
    "slug": "home-cleaning",
    "name": "Home cleaning",
    "h1": "Home cleaning in Singapore",
    "intro": [
      "Explore sourced home cleaning companies in Singapore. Compare the services they publish, their prices and how to contact them.",
      "Listings come from company websites and cited records. Ratings name their source and check date. Missing prices are left as a request for a quote."
    ],
    "jobs": [
      "Regular clean",
      "One-time clean",
      "Move-out clean",
      "Not sure"
    ],
    "faqs": [
      [
        "How do I compare home cleaning companies?",
        "Start with the service you need, check the published price conditions and confirm availability directly. The location filter describes the listed business address, not its service coverage."
      ],
      [
        "Are all prices fixed quotes?",
        "No. Published figures can depend on the job, unit count or package. Check the price source and ask about parts, transport and GST."
      ],
      [
        "Where do the ratings come from?",
        "Each rating names its source and check date. Google Maps search figures are source snapshots. Company-site figures remain labelled as company-site claims."
      ],
      [
        "Does the quote preview send my details?",
        "No. The beta request panel is a preview. Nothing is sent or stored. Call or WhatsApp a company directly to discuss a job."
      ]
    ]
  }
];

const intents = [
  {
    "id": "chemical-wash",
    "parent": "aircon",
    "slug": "aircon-servicing/chemical-wash",
    "name": "Chemical wash",
    "titleName": "Aircon chemical wash",
    "h1": "Aircon chemical wash in Singapore",
    "service": "chemical-wash",
    "intro": [
      "Compare companies whose sourced service list includes chemical wash. Open each profile for the published details and confirm the exact work before booking."
    ],
    "jobs": [
      "Chemical wash",
      "Not sure"
    ],
    "faqs": [
      [
        "How do I compare chemical wash prices?",
        "Check the unit or package covered by each published price, whether GST is stated and any additional work. Ask the company for a written total."
      ],
      [
        "Does every listed company publish a rate?",
        "No. A company can list the service without publishing a price. Those profiles say to ask for a quote."
      ],
      [
        "Can I contact a company directly?",
        "Yes. The phone and WhatsApp links go directly to the company. Roster does not pass on requests or take bookings."
      ]
    ]
  },
  {
    "id": "gas-top-up",
    "parent": "aircon",
    "slug": "aircon-servicing/gas-top-up",
    "name": "Gas top-up",
    "titleName": "Aircon gas top-up",
    "h1": "Aircon gas top-up in Singapore",
    "service": "gas-top-up",
    "intro": [
      "Compare companies whose sourced service list includes gas top-up. Open each profile for the published details and confirm the exact work before booking."
    ],
    "jobs": [
      "Gas top-up",
      "Not sure"
    ],
    "faqs": [
      [
        "How do I compare gas top-up prices?",
        "Check the unit or package covered by each published price, whether GST is stated and any additional work. Ask the company for a written total."
      ],
      [
        "Does every listed company publish a rate?",
        "No. A company can list the service without publishing a price. Those profiles say to ask for a quote."
      ],
      [
        "Can I contact a company directly?",
        "Yes. The phone and WhatsApp links go directly to the company. Roster does not pass on requests or take bookings."
      ]
    ]
  }
];

const howFaqs = [
  ["Can a company buy its position?", "No. Directory listings are unpaid. Recommended ordering considers the available evidence; you can also sort by average rating, review count or name."],
  ["Where do the ratings and reviews come from?", "Ratings and reviews link to external sources with capture dates. Compatible scores are weighted by review count. They are not verified Roster bookings."],
  ["Does the quote form send my number?", "No. The quote panel is a local preview. It does not send or store your contact details."],
  ["Which companies get a profile?", "Profiles use sourced services and business information. Records flagged for exclusion stay out of the directory; the original hand-written content is preserved."]
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
  return list.slice().sort((a,b) => a.name.localeCompare(b.name));
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
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>`,
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

function renderNav(current, home = false) {
  const links = navItems.filter(([, , trade]) => trade).map(([href, label, trade]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${icon(tradeIcon[trade], "ic nav-ic")}<span>${esc(label)}</span></a>`).join("");
  return `<header class="top"><div class="top-inner"><a class="brand" href="/roster/">${brandMark()}<span class="wordmark">Roster<span class="brand-dot">.</span></span></a>${home ? "" : `<div class="global-search" role="search"><label class="sr-only" for="site-search">Find a service or company</label>${icon("search")}<input id="site-search" type="search" placeholder="Find a service or company" autocomplete="off" data-site-search><span class="search-location">${icon("pin")} Singapore</span><button class="search-submit" type="button" aria-label="Search Roster" data-search-submit>${icon("arrow")}</button></div>`}${previewFeatures?`<a class="saved-link" aria-label="Saved companies" href="/roster/saved/">${icon("bookmark")}<span>Saved</span><b data-saved-count hidden></b></a><nav class="account-nav" aria-label="Account"><a data-account-guest href="/roster/sign-in/">Sign in</a><a data-account-guest class="nav-signup" href="/roster/sign-up/">Sign up</a><a data-account-member href="/roster/account/" hidden>Account</a><button data-account-member data-sign-out type="button" hidden>Sign out</button></nav>`:''}</div><div class="nav-shell"><nav class="nav" aria-label="Services">${links}</nav><span class="nav-note">Home services. A more considered choice.</span></div></header>`;
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
<div class="foot-brand"><a class="brand" href="/roster/">${brandMark()}<span class="wordmark">Roster</span></a><p>Find the right help for your home. Compare services, prices and reviews from companies across Singapore.</p><p class="foot-note">Business details and reviews link to their original sources. Last checked ${checked}.</p></div>
<div class="foot-col"><h2>Jobs</h2><ul>${jobs}</ul></div>
<div class="foot-col"><h2>About</h2><ul><li><a href="/roster/how-it-works/">How the list is made</a></li><li><a href="/roster/claim-listing/">Claim your listing</a></li><li><a href="/roster/aircon-servicing/chemical-wash/">Aircon chemical wash</a></li><li><a href="/roster/aircon-servicing/gas-top-up/">Aircon gas top-up</a></li></ul></div>
<div class="footer-guides" aria-label="Home-service guides">${trades.map(t=>`<details><summary>${esc(t.name)} guides</summary><ul>${editorialGuides.filter(g=>g.trade===t.id).map(g=>`<li><a href="${g.path}">${esc(g.label)}</a></li>`).join('')}</ul></details>`).join('')}</div>
<p class="footer-logo-ownership">${logoOwnerNote}</p><p class="foot-line">Singapore beta. Unpaid listings. No commission on your job.${previewFeatures?" Quote requests are a preview and do not send.":""}</p>
</div></footer>`;
}

function publicFaqs(faqs) {
  return previewFeatures ? faqs : faqs.filter(([question]) => !/quote (?:preview|form)/i.test(question));
}

function renderFaq(faqs, heading = "Questions") {
  const items = publicFaqs(faqs).map(([q, a]) => `<details><summary><span>${esc(q)}</span><span class="faq-mark" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`).join("");
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
  if (!previewFeatures || !recipients.length) return "";
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

function priceSummary(company, service) {
  const display = presentation[company.slug] || { price: "Ask for a quote", detail: "No published rate captured", published: false };
  if(company.quoteEvidence)return {...display,price:'Quote on request',detail:'',published:false,examplePrice:false,quoteEvidence:company.quoteEvidence};
  const sourcePrices=(company.enrichment?.priceLines||[]).filter(p=>!service||p.job===service);
  const example = company.imported ? sourcePrices.map(priceOption).map(priceView).find(p=>!p.indicative && /^(?:from\s+)?S?\$\s*\d/i.test(p.price) && p.price.length<=40 && p.label) : null;
  const cleanDisplay = example ? {...display,price:example.price,detail:`${example.label}. See service details for inclusions.`,examplePrice:true} : company.imported ? {...display, detail:display.published ? "Explore service prices and confirm your final quote with the team." : "Contact the team for a quote tailored to your job."} : display;
  if(service&&company.imported&&example)return {...cleanDisplay,published:true};
  return service ? { ...cleanDisplay, examplePrice:false, ...(display.services?.[service] || { price: "Ask for a quote", detail: "Ask the company for a quote for this service.", published: false }) } : cleanDisplay;
}

function indexName(spec) { return spec.service || spec.id; }
function indexPath(spec) { return `/roster/data/index/${indexName(spec)}.json?v=${indexVersions[indexName(spec)]}`; }
function shortlist(companies, service) {
  const records = companies.map(c => directoryRecord(c, priceSummary(c, service), tradeById(c.category)));
  const groups=splitDirectory(records);
  return `<div class="results-toolbar"><div><h2>Companies to consider</h2><p data-result-count aria-live="polite">${groups.shortlist.length} on the shortlist · ${groups.others.length} other companies</p></div><div class="sort-control"><label class="sort-native">Sort: <select data-sort aria-label="Sort companies"><option value="evidence">Recommended</option><option value="rating">Highest rated</option><option value="reviews">Most reviewed</option><option value="name">Name A to Z</option></select></label></div></div><p class="results-method">Unpaid listings. <span data-shortlist-explanation>The shortlist leads with companies that have prices for named jobs, coverage and residential service details. </span>Average ratings are weighted by review count. <a href="/roster/how-it-works/">Our approach</a></p><div class="index-error" data-index-error hidden><p>The complete list could not load. Please try again.</p><button type="button" class="btn" data-retry>Retry loading companies</button></div><div class="area-unstated" data-area-unstated hidden><label><input type="checkbox" data-include-unstated><span><strong data-unstated-count>0</strong> companies did not state their areas. Show them anyway.</span></label></div><div data-shortlist-section${groups.shortlist.length?'':' hidden'}><p class="shortlist-caption">A shortlist with fuller details</p><ol class="shortlist">${groups.shortlist.map(c=>renderCard(c)).join('')}</ol></div><section class="other-companies" data-other-section${groups.others.length?'':' hidden'}><div class="other-companies-heading"><h2 data-other-heading>Other companies</h2><p data-other-note>More options to explore. Some listings have limited details.</p></div><ol class="compact-list" data-other-list>${groups.others.slice(0,12).map(c=>renderCompactCard(c)).join('')}</ol><div class="load-more-wrap"><button class="btn" data-load-more type="button"${groups.others.length<=12?' hidden':''}>Show more companies</button></div></section><div class="no-results" data-no-results hidden><h3>No companies match these filters</h3><p>Try a different search or clear your filters.</p><button type="button" class="btn" data-reset>Clear filters</button></div><noscript><p>Enable JavaScript to filter the list. All company listings are available below.</p><ul>${companies.map(c => `<li><a href="/roster/company/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></noscript>`;
}

function pageShell({ title, description, canonicalPath, current, jsonLd, body, bodyClass = "", shareImage = "" }) {
  if (!shareImage && editorialByPath.has(canonicalPath)) shareImage = abs(heroPhoto(editorialByPath.get(canonicalPath).trade).sizes[1200].src);
  // Social crawlers ignore relative image URLs.
  if (shareImage) shareImage = new URL(shareImage, origin).href;
  const parked={'sign-in':'Sign in','sign-up':'Account sign-up','forgot-password':'Password reset','reset-password':'New password','account':'Your account','auth/callback':'Account sign-in','saved':'Saved companies','matches':'Job matching'}[canonicalPath.replace(/^\/roster\/|\/$/g,'')];
  if(!previewFeatures && parked) {
    body=`<section class="pending-feature"><p class="kicker">CONNECTION PENDING</p><h1>${canonicalPath.includes('matches')?'Job matching':canonicalPath.includes('saved')?'Saved companies':'Accounts'} preview.</h1><p>This feature is not available on the public site yet. Browse companies and contact them directly.</p><a class="btn btn-solid" href="/roster/search/">Browse companies</a></section>`;
    bodyClass='pending-page';
    // Parked routes must not advertise the feature in search snippets or share cards.
    title=`${parked}: not available yet | Roster`;
    description=`${parked}: not available on Roster yet. Browse Singapore home-service companies and contact them directly.`;
  }
  description = concise(description);
  const canonical = abs(canonicalPath);
  const graph = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": jsonLd
  }, (_key,value) => typeof value!=='string' || /^https?:\/\//.test(value) ? value : value.replace(/(^|[^A-Za-z])S?\$\s?(?=\d)/g,'$1SGD ').replace(/[★☆]/g,'')).replace(/</g, "\\u003c");
  assertNoDashes(graph, canonicalPath);
  const html = `<!doctype html>
<html lang="en-SG">
<head>
${bodyClass === "account-page" ? '<meta name="referrer" content="no-referrer">' : ""}
<script src="/auth-config.js"></script>
<script src="/auth.js"></script>
<meta charset="utf-8">
<meta name="generator" content="Roster static build">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#f3f0e9">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="${bodyClass === "guide-page" ? "article" : "website"}">
<meta property="og:site_name" content="Roster">
<meta property="og:locale" content="en_SG">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="${shareImage ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${shareImage ? `<meta property="og:image" content="${esc(shareImage)}"><meta name="twitter:image" content="${esc(shareImage)}">` : ""}
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/roster/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,560;1,9..144,460&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/roster/assets/site.css?v=${assetVersions["site.css"]}">
<link rel="stylesheet" href="/roster/assets/directory.css?v=${assetVersions["directory.css"]}">
<link rel="stylesheet" href="/roster/assets/experience.css?v=${assetVersions["experience.css"]}">
<link rel="stylesheet" href="/roster/assets/expanded.css?v=${assetVersions["expanded.css"]}">
<link rel="stylesheet" href="/roster/assets/service-areas.css?v=${assetVersions["service-areas.css"]}">
<link rel="stylesheet" href="/roster/assets/accounts.css?v=${assetVersions["accounts.css"]}">${bodyClass === "directory-page" ? `<link rel="stylesheet" href="/roster/assets/sort-control.css?v=${assetVersions["sort-control.css"]}">` : ""}
<link rel="stylesheet" href="/roster/assets/logo-fit.css?v=${assetVersions["logo-fit.css"]}">${bodyClass === "home-page" ? `\n<link rel="stylesheet" href="/roster/assets/home.css?v=${assetVersions["home.css"]}">` : ""}${["home-page","match-page"].includes(bodyClass) ? `\n<link rel="stylesheet" href="/roster/assets/job-search.css?v=${assetVersions["job-search.css"]}">` : ""}${bodyClass === "home-page" ? `\n<link rel="stylesheet" href="/roster/assets/hero-rotation.css?v=${assetVersions["hero-rotation.css"]}">` : ""}${["directory-page","match-page"].includes(bodyClass) ? `\n<link rel="stylesheet" href="/roster/assets/quote-flow.css?v=${assetVersions["quote-flow.css"]}">` : ""}
<link rel="stylesheet" href="/roster/assets/editorial.css?v=${assetVersions["editorial.css"]}">
<script type="application/ld+json">${graph}</script>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
<a class="skip" href="#content">Skip to content</a>
${renderNav(current, bodyClass === "home-page")}
<main id="content" class="wrap">
${body}
</main>
${renderFooter()}
${previewFeatures?`<script src="/roster/assets/form.js?v=${assetVersions["form.js"]}"></script>`:""}
${previewFeatures?`<script type="module" src="/roster/assets/accounts.js?v=${assetVersions["accounts.js"]}"></script>`:""}
<script src="/roster/assets/directory.js?v=${assetVersions["directory.js"]}"></script>
<script src="/roster/assets/experience.js?v=${assetVersions["experience.js"]}"></script>${bodyClass === "home-page" ? `\n<script type="module" src="/roster/assets/home.js?v=${assetVersions["home.js"]}"></script>` : ""}${bodyClass === "home-page" ? `\n${previewFeatures?`<script type="module" src="/roster/assets/job-search.js?v=${assetVersions["job-search.js"]}"></script>`:""}<script type="module" src="/roster/assets/hero-rotation.js?v=${assetVersions["hero-rotation.js"]}"></script>` : ""}${previewFeatures && bodyClass === "match-page" ? `\n<script type="module" src="/roster/assets/job-results.js?v=${assetVersions["job-results.js"]}"></script>` : ""}
${bodyClass === "claim-page" ? `<script type="module" src="/roster/assets/claim.js?v=${assetVersions["claim.js"]}"></script>` : ""}
${bodyClass.split(" ").includes("company-page") ? `<script type="module" src="/roster/assets/review-preview.mjs?v=${assetVersions["review-preview.mjs"]}"></script>` : ""}
${bodyClass === "directory-page" ? `<script type="module" src="/roster/assets/catalogue.js?v=${assetVersions["catalogue.js"]}"></script>${previewFeatures?`<script type="module" src="/roster/assets/quote-start.js?v=${assetVersions["quote-start.js"]}"></script>`:""}` : ""}
</body>
</html>
`;
  assertNoDashes(html, canonicalPath);
  if (/aggregateRating/i.test(html) || /"@type":"(Review|Offer|AggregateRating)"/.test(html)) {
    throw new Error("Rating, review, or offer schema leaked into " + canonicalPath);
  }
  // Account forms submit only through the bundled auth handler; quote and claim forms stay inert.
  const nonPreviewHtml = html.replace(/<form method="dialog" data-claim-preview[^>]*>[\s\S]*?<\/form>/g, "").replace(/<form method="dialog" data-account-form="(?:sign-in|sign-up|forgot-password|reset-password)"[^>]*>[\s\S]*?<\/form>/g, "");
  const withoutSearchForms = nonPreviewHtml
    .replace(/<form action="\/roster\/search\/" method="get" class="hero-quick-form">[\s\S]*?<\/form>/g, "")
    .replace(/<form class="hero-guided-form" data-job-start method="dialog"><fieldset disabled>[\s\S]*?<\/form>/g, "")
    .replace(/<form data-(?:job-edit|quote-start|quote-contact) method="dialog"><fieldset disabled>[\s\S]*?<\/form>/g, "");
  if (/<form[\s>]/i.test(withoutSearchForms)) {
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
    mainEntity: publicFaqs(faqs).map(([q, a]) => ({
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
      item: { "@id": companyUrl(company) + "#business" }
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
  const guide = editorialByDirectory.get(`/roster/${spec.slug}/`);
  const title = (count === 0
    ? `${spec.h1.replace(" in Singapore", "")} in Singapore: no shortlist yet | Roster`
    : `${spec.titleName || spec.name} in Singapore: shortlist of ${count} ${count === 1 ? "company" : "companies"} | Roster`);
  const description = concise(`Compare ${count} ${spec.name.toLowerCase()} companies in Singapore. Explore sourced services, published prices, ratings and contact details.`);
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
  const filter = (key, label, n) => `<label class="filter-check"><input type="checkbox" data-filter="${key}"><span>${label}</span><small data-filter-count="${key}">${n}</small></label>`;
  const body = [
    renderCrumbs(crumbs),
    `<section class="directory-hero"><div><p class="kicker">THE SINGAPORE HOME DIRECTORY</p><h1>${tradeId === "all" ? "Find your next helping hand." : `${esc(categoryLabel)} <em>in Singapore.</em>`}</h1><p>${esc(summaries[tradeId])}</p>${guide?`<a class="guide-jump" href="${guide.path}">Read the ${esc(guide.label.toLowerCase())} guide ${icon("arrow")}</a>`:""}</div><div class="hero-stamp"><span class="stamp-icon">${icon(tradeIcon[tradeId] || "search")}</span><div><strong>${count}</strong><span>${count === 1 ? "company to explore" : "companies to explore"}</span></div></div></section>`,
    `<div class="directory-layout${previewFeatures?'':' directory-browse-only'}" id="company-results" data-catalogue data-index="${indexPath(spec)}"><aside class="filters" aria-label="Filter companies"><div class="filters-head"><h2>${icon("sliders")}Refine your list</h2><button type="button" class="filter-toggle" data-toggle-filters aria-controls="company-filters" aria-expanded="true">${icon("sliders")}Filters <span data-active-filters></span>${icon("chevron")}</button><button type="button" data-reset>Reset</button></div><div class="filter-content" id="company-filters"><label class="filter-search">Search this list<input type="search" placeholder="Company or keyword" data-filter-search></label>${renderAreaFilter(esc)}<label class="filter-select">Average rating<select data-rating aria-label="Minimum average rating"><option value="">Any rating</option><option value="4">4.0 and above</option><option value="4.5">4.5 and above</option><option value="4.8">4.8 and above</option></select></label>${tradeId === "all" ? `<label class="filter-select">Service<select data-category-filter><option value="">All services</option>${trades.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>` : ""}<fieldset><legend>What matters to you?</legend>${filter("price", "Published pricing", companies.filter(c => priceSummary(c, spec.service).published).length)}${filter("reviews", "Dated reviews", companies.filter(c => c.reviews.length).length)}${filter("whatsapp", "WhatsApp contact", companies.filter(c => c.whatsapp?.value).length)}${previewFeatures?filter("saved", "Saved companies", 0):""}</fieldset><details class="filter-categories"><summary>Explore services${icon("chevron")}</summary>${trades.map(t => `<a href="/roster/${t.slug}/"${t.id === tradeId ? ' aria-current="page"' : ""}>${icon(tradeIcon[t.id])}${esc(t.name)}${icon("chevron")}</a>`).join("")}<div class="filter-foot">${icon("shield")}<p>A place on Roster is unpaid.<br>Always your choice.</p></div></details></div></aside><div class="directory-results">`,
    isAircon ? airconSubnav(canonicalPath) : "",
    shortlist(companies, spec.service),
    `<details class="list-explainer"><summary>About this ${esc(categoryLabel.toLowerCase())} shortlist${icon("chevron")}</summary><p>${esc(spec.intro[0])}</p>${notes}<p><a href="/roster/how-it-works/">How the list is made</a>. Checked ${checked}.</p></details>`,
    `</div><aside class="discovery-rail" aria-label="Directory information">${previewFeatures?`<details class="quote-rail-disclosure" open><summary>Get quotes for your job ${icon("sparkle")}</summary>${renderQuoteComposer({icon})}</details>`:''}<div class="rail-note">${icon("calendar")}<p>Facts last checked<br><strong>${esc(checked)}</strong><br>Each figure links to its source.</p></div></aside></div>`,
    previewFeatures && tradeId !== "all" ? `<div id="quote-request">${renderForm(spec.jobs, companies.filter(c => !c.imported), "ask")}</div>` : previewFeatures ? `<div id="quote-request" class="search-end"><h2>Start with the service you need</h2><p>Choose a service above to explore its shortlist and preview a quote request.</p></div>` : "",
    spec.service ? renderSourcedRates(spec.service) : "",
    tradeId !== "all" && !spec.service ? renderAreasWeServe(spec) : "",
    guide ? renderGuideTeaser(guide) : renderFaq(spec.faqs, "A few things worth knowing"),
    `<section class="browse-more"><p class="kicker">WHILE YOU'RE HERE</p><h2>A little help around the home.</h2><div>${trades.filter(t => t.id !== tradeId).map(t => `<a href="/roster/${t.slug}/">${icon(tradeIcon[t.id])}<span>${esc(t.name)}</span>${icon("arrow")}</a>`).join("")}</div></section>`
  ].join("\n");
  const jsonLd = [
    webPage(title, canonicalPath, description),
    { "@type": "CollectionPage", name: spec.h1, url: abs(canonicalPath) },
    crumbsLd(crumbs.map((item, index) => (
      index === crumbs.length - 1 ? { href: canonicalPath, label: item.label } : item
    ))),
    ...(!guide ? [faqLd(spec.faqs)] : [])
  ];
  if (companies.length) {
    const visible=splitDirectory(companies.map(c=>directoryRecord(c,priceSummary(c,spec.service),tradeById(c.category))));
    const bySlug=new Map(companies.map(c=>[c.slug,c]));
    jsonLd.push(listLd(spec.h1,[...visible.shortlist,...visible.others.slice(0,12)].map(c=>bySlug.get(c.slug))));
  }
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

function mapAddress(company) {
  if (!company.address?.street) return "";
  return /singapore/i.test(company.address.value) ? company.address.value : `${company.address.value}, Singapore`;
}

function profileBusinessGraph(company, content, canonicalPath) {
  const business = businessNode(company);
  const id = abs(canonicalPath) + "#business";
  business["@id"] = id;
  business.description = content.about[0];
  business.mainEntityOfPage = { "@id": abs(canonicalPath) + "#page" };
  business.sameAs = [company.website.value];
  if (company.email?.value) business.email = company.email.value;
  if (company.legalName) business.legalName = company.legalName;
  if (company.address) business.hasMap = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress(company))}`;
  const media = priceSummary(company);
  if (media.logo) business.logo = new URL(media.logo, origin).href;
  if (media.photos?.length) business.image = media.photos.map(photo => new URL(photo.src, origin).href);
  // Only confirmed service descriptions become Service entities.
  const services = company.imported || ["sk-electrical", "isoteam-homecare"].includes(company.slug) ? [] : content.services.map((service, index) => ({
    "@type": "Service", "@id": abs(canonicalPath) + `#service-${index + 1}`, name: service.name,
    description: service.description, provider: { "@id": id }, url: abs(canonicalPath) + `#service-price-${index + 1}`
  }));
  return [business, ...services];
}

// Release excerpts are text windows that can start or stop mid-word. Mark them as excerpts and drop a
// leading fragment that never appears as a whole word elsewhere in the sourced copy.
let excerptWords;
function excerptView(value) {
  let text = String(value || '').trim();
  if (text.length < 60) return text;
  if (/^[a-z]/.test(text)) {
    excerptWords ||= new Set(Object.values(profileContent).flatMap(p => [...(p.about || []), ...(p.services || []).map(s => s.explanation || '')]).flatMap(t => String(t).toLowerCase().match(/(?<=\s)[a-z’']+/g) || []));
    const first = text.match(/^[a-z’']+/)[0];
    if (!excerptWords.has(first)) text = text.slice(first.length).replace(/^[^\sA-Za-z0-9]*\s+/, '');
    text = `…${text}`;
  }
  return /[.!?)"”…]$/.test(text) ? text : `${text}…`;
}

function renderServiceExplanation(service) {
  const guide = service.guide ? serviceGuides[service.guide] : null;
  if (service.guide && !guide?.body) throw new Error(`Missing guide: ${service.guide}`);
  const prices = service.prices.map(priceView);
  const reference = (p) => `<details class="price-original"><summary>Price reference & conditions</summary>${p.excerpt?`<p>${esc(p.excerpt)}</p>`:''}${p.sourceUrl?`<span class="data-source"><a href="${esc(p.sourceUrl)}">View price on company website</a><span>Checked ${esc(String(p.capturedAt||'2026-10-10').slice(0,10))}</span></span>`:''}</details>`;
  const options = prices.length ? `<div class="service-options" aria-label="Service price options">${prices.map(p=>`<div class="service-option"><div class="service-option-heading"><h3>${esc(p.label || service.name)}</h3>${prices.length>1?`<strong>${esc(p.price)}</strong>`:''}</div>${p.indicative?'<span class="claim-label">General price guide, not a company quote</span>':''}${p.detail?`<p class="price-conditions">${esc(p.detail)}</p>`:''}${p.excerpt||p.sourceUrl?reference(p):''}</div>`).join('')}</div>` : '';
  const explanation = guide?.body || (service.imported ? serviceGuide(service.name,service.trade) : service.explanation);
  return `<div class="service-explanation">${service.description?`<p class="service-context">${esc(service.description)}</p>`:''}${explanation?`<p>${esc(explanation)}</p>`:''}${options}${guide?.ask?`<div class="service-booking-question"><h3>Before you book</h3><p>${esc(guide.ask)}</p></div>`:''}${service.sourceUrl?`<details class="service-reference"><summary>Service reference</summary>${service.explanation?`<p>${esc(excerptView(service.explanation))}</p>`:''}<span class="data-source"><a href="${esc(service.sourceUrl)}">View service on company website</a><span>Checked ${esc(String(service.capturedAt||'2026-10-10').slice(0,10))}</span></span></details>`:''}</div>`;
}

function renderServiceRow(service, index) {
  if (!Array.isArray(service.prices)) throw new Error(`Missing pricing state: ${service.name}`);
  if (service.prices.length > 1 && !service.priceSummary) throw new Error(`Missing price summary: ${service.name}`);
  const price = service.quoteEvidence ? 'Quote on request' : service.imported ? servicePrice(service) : service.priceSummary || service.prices[0]?.price || "Ask for a quote";
  return `<details class="service-rate" id="service-price-${index + 1}"><summary><span class="service-rate-label"><strong>${esc(service.name)}</strong></span><span class="service-rate-price${service.prices.length ? "" : " service-rate-quote"}"><strong><span class="sr-only">${service.prices.some(p=>!p.indicative) ? "Published price: " : "Pricing: "}</span>${esc(price)}</strong></span><span class="service-toggle-icon">${icon("chevron")}</span>${renderQuoteEvidence(service.quoteEvidence)}</summary>${renderServiceExplanation(service)}</details>`;
}

/* ---------- Accounts ---------- */

function renderAccount(mode) {
  const content = accountContent(mode,{icon,heroIllustration});
  return pageShell({...content,canonicalPath:`/roster/${mode}/`,current:"",jsonLd:[],bodyClass:"account-page"});
}

/* ---------- Home ---------- */

function renderHome(grouped) {
  const title = "Roster | Short unpaid lists of home services in Singapore";
  const description = "Find the right help for your home. Compare services, prices and reviews from companies across Singapore.";
  const body = renderHomeSnapshot({companies:publishedCompanies,pins:mapPins,presentation,outline:homeOutline,checked,esc,icon}) + guideCards(editorialGuides.filter(g=>g.hub));
  const jsonLd = [
    { "@type": "WebSite", "@id": origin + "/#website", name: "Roster", url: origin + "/", description, inLanguage:"en-SG" },
    {
      "@type": "Organization",
      "@id": origin + "/#organization",
      logo: abs("/roster/assets/favicon.svg"),
      name: "Roster",
      url: origin + "/",
      description: "A sourced directory of home-service companies in Singapore."
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
  const title="How Roster Works: Listings, Reviews & Prices | Roster";
  const description="Understand Roster's unpaid listings, weighted ratings, sourced prices and coverage filters. Learn what the beta quote and claim tools do.";
  const canonicalPath="/roster/how-it-works/";
  const body=renderCrumbs([{label:"How it works"}])+`<header class="guide-hero guide-hero-method"><div><p class="kicker">A LITTLE CLARITY</p><h1>How Roster works.</h1><p class="guide-dek">The details behind a more considered choice.</p></div></header>`+renderEditorial(methodGuide,editorialGuides,{utility:true});
  return pageShell({title,description,canonicalPath,current:canonicalPath,jsonLd:[webPage(title,canonicalPath,description),crumbsLd([{href:canonicalPath,label:"How it works"}]),faqLd(methodGuide.faqs)],body,bodyClass:"guide-page",shareImage:abs(heroPhoto('plumbing').sizes[1200].src)});
}

function renderGuidePage(guide) {
  const hub=editorialGuides.find(g=>g.trade===guide.trade&&g.hub);
  const trade=tradeById(guide.trade);
  const crumbs=[{href:`/roster/${trade.slug}/`,label:trade.name},...(hub.id!==guide.id?[{href:hub.path,label:hub.label}]:[]),{href:guide.path,label:guide.directoryPath?'Guide':guide.label}];
  const image=abs(heroPhoto(guide.trade).sizes[1200].src);
  const body=renderCrumbs(crumbs)+`<header class="guide-hero"><div><p class="kicker">THE ROSTER HOME GUIDE</p><h1>${esc(guide.h1)}</h1><p class="guide-dek">${esc(guide.description)}</p><div class="guide-hero-actions"><a class="btn btn-solid" href="/roster/${trade.slug}/">Compare ${esc(trade.name.toLowerCase())} companies ${icon('arrow')}</a><a href="#guide">Read the guide</a></div></div><figure><img src="${heroPhoto(guide.trade).sizes[640].src}" width="600" height="400" alt="" fetchpriority="high"><figcaption><a href="${esc(heroPhoto(guide.trade).url)}">${esc(photoCredit(guide.trade))}</a></figcaption></figure></header>`+renderEditorial(guide,editorialGuides,{extra:guide.id==='AC-03'?renderGuidePrices():renderSourcedRates(guide.id)});
  const jsonLd=[webPage(guide.title,guide.path,guide.description),crumbsLd(crumbs),...editorialSchema(guide,origin),...(guide.hub?[{"@type":"ItemList",name:`${guide.label}: related guides`,itemListElement:editorialGuides.filter(g=>g.trade===guide.trade&&g.id!==guide.id).map((g,i)=>({"@type":"ListItem",position:i+1,name:g.label,url:abs(g.path)}))}]:[])];
  forbidSchema(jsonLd);
  return pageShell({title:guide.title,description:guide.description,canonicalPath:guide.path,current:`/roster/${trade.slug}/`,jsonLd,body,bodyClass:'guide-page',shareImage:image});
}

// Guides and intent pages show only published, sourced company rates: one lowest matching
// non-promotional rate per company, each with its company, source link and capture date.
// Matching, guards, labels and rate wording live in lib/sourced-rates.mjs.
function renderSourcedRates(key,companies=publishedCompanies,{attr='data-sourced-rates',scope=''}={}) {
  const spec=guideEvidence[key];if(!spec)return '';
  const rows=sourcedRates(spec,companies);if(rows.length<minimumCompanies)return '';
  const units=new Map();for(const {line} of rows){const unit=displayUnit(line);if(unit)units.set(unit,(units.get(unit)||0)+1);}
  const [unit,count]=[...units].sort((a,b)=>b[1]-a[1])[0]||['',0];
  const same=rows.filter(r=>displayUnit(r.line)===unit).map(r=>r.line.amount_sgd);
  const range=count>=3?`<p>For the most common unit (${esc(unit)}), the lowest published rates from ${count} companies run from <strong>${money(Math.min(...same))}</strong> to <strong>${money(Math.max(...same))}</strong>. Each figure is one company's own advertised rate with its conditions, not a market average or a quote.</p>`:`<p>Each figure is one company's own advertised rate with its conditions, not a market average or a quote.</p>`;
  return `<section class="guide-price-sample" aria-labelledby="${key}-rates-title"><p class="kicker">FROM THE ROSTER DIRECTORY</p><h2 id="${key}-rates-title">${esc(spec.title+scope)}</h2>${range}<details><summary>See ${rows.length} published ${esc(spec.noun)} rates and sources</summary><div class="guide-table-scroll" tabindex="0" role="region" aria-label="${esc(spec.title)}"><table ${attr}="${esc(key)}"><caption>Lowest matching advertised rate per company, in SGD as published. "From" marks a starting price and ranges are shown in full. Check the source for minimums, GST and inclusions.</caption><thead><tr><th scope="col">Company</th><th scope="col">Service as listed</th><th scope="col">Rate</th><th scope="col">Source</th></tr></thead><tbody>${rows.map(({company:c,line:p})=>`<tr><th scope="row"><a href="/roster/company/${c.slug}/#pricing">${esc(c.name)}</a></th><td>${esc(rateLabel(p,spec,c.name))}</td><td>${esc(rateCell(p))}</td><td><a href="${esc(p.sourceUrl)}">${esc(new URL(p.sourceUrl).hostname.replace(/^www\./,''))} · ${esc(p.capturedAt.slice(0,10))}</a></td></tr>`).join('')}</tbody></table></div></details></section>`;
}

// Towns from the keyword plan, plus every town with a static area page. Towns with a page
// link to it; the rest use the coverage filter. Page selection rule: lib/area-pages.mjs.
const areaTowns = ['Ang Mo Kio','Bedok','Bishan','Bukit Batok','Bukit Panjang','Choa Chu Kang','Clementi','Hougang','Jurong West','Pasir Ris','Punggol','Queenstown','Sengkang','Serangoon','Tampines','Toa Payoh','Woodlands','Yishun'];
const townSlug = name => name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
const areaPagePath = (tradeId,town) => areaPages.find(p=>p.trade===tradeId&&p.town===town)?.path;
const areaHref = (spec,town) => areaPagePath(spec.id,town)||`/roster/${spec.slug}/?area=${townSlug(town)}#company-results`;
function renderAreasWeServe(spec) {
  const towns=[...new Set([...areaTowns,...areaPages.filter(p=>p.trade===spec.id).map(p=>p.town)])].sort((a,b)=>a.localeCompare(b));
  const map=Object.fromEntries(areaPages.filter(p=>p.trade===spec.id).map(p=>[townSlug(p.town),p.path]));
  const links=towns.map(town=>`<a href="${areaHref(spec,town)}"${areaPagePath(spec.id,town)?' data-area-page-link':''}>${esc(town)}</a>`).join('');
  return `<section class="areas-we-serve" aria-labelledby="areas-title" data-area-pages="${esc(JSON.stringify(map))}"><p class="kicker">BY TOWN</p><h2 id="areas-title">Areas we serve</h2><p>Pick a town to see the companies that name it on their own websites. A company's office address is not used as coverage, and companies that do not state their areas are shown separately.</p><div class="areas-we-serve-links">${links}</div></section>`;
}
// Wording per trade for area pages. Advice only; every number on the page comes from the data.
const areaWords = {
  plumbing:{pro:'Plumbers',noun:'plumbing',one:'plumber',kicker:'PLUMBING BY TOWN',tips:town=>`<p>Share the block number, the floor and the room with the fault, plus a photo of the pipe, trap or fitting. Say whether it is an HDB flat, a condo or a landed home, and mention any lift booking or parking arrangements the technician needs.</p><p>Leaks and chokes in shared areas, such as a common drainage stack or a corridor pipe, are normally handled by your Town Council or management office rather than a private plumber. Check with them first if water is coming from outside your unit, then book a plumber for work inside your home in ${esc(town)}.</p><p>The <a href="/roster/plumbing/leak-repair/">leak repair guide</a> and <a href="/roster/plumbing/choked-drain/">choked drain guide</a> explain what to describe for the most common jobs.</p>`},
  aircon:{pro:'Aircon servicing companies',noun:'aircon servicing',one:'aircon technician',kicker:'AIRCON SERVICING BY TOWN',tips:town=>`<p>Count your indoor units and note the brand and model of each, plus whether you need a general service, a chemical wash or a repair. A photo of the unit label and any leak or error code helps the company quote before the visit to ${esc(town)}.</p><p>Ask whether the price is per unit and whether a minimum number of units applies. The <a href="/roster/aircon-servicing/guide/">aircon servicing guide</a> explains the common service types.</p>`},
  electrician:{pro:'Electricians',noun:'electrical',one:'electrician',kicker:'ELECTRICIANS BY TOWN',tips:town=>`<p>Describe what happened, such as a trip when one appliance runs or a socket that has stopped working, and send a photo of your DB box. Give the block, floor and unit so the company can confirm it covers your part of ${esc(town)}.</p><p>The <a href="/roster/electrician/power-trip/">power trip guide</a> and <a href="/roster/electrician/licensed-electrician/">licensed electrician guide</a> explain what to check.</p>`},
  handyman:{pro:'Handymen',noun:'handyman',one:'handyman',kicker:'HANDYMEN BY TOWN',tips:town=>`<p>List every small job you want done in one visit, with photos and measurements, and say which items you are supplying. Give the block, floor and unit so the company can confirm it covers your part of ${esc(town)}.</p><p>Ask whether the price is per job, per item or per hour, and whether a minimum charge applies. The <a href="/roster/handyman/guide/">handyman guide</a> covers the common jobs.</p>`},
  cleaning:{pro:'Home cleaners',noun:'home cleaning',one:'cleaner',kicker:'HOME CLEANING BY TOWN',tips:town=>`<p>Say whether you want a one-off clean, a regular schedule or a move-out clean, and give the flat type and size. Mention pets, parking and access so the company can confirm it covers your address in ${esc(town)}.</p><p>Ask what is included, whether supplies are brought, and whether the rate is per hour or per session. The <a href="/roster/home-cleaning/guide/">home cleaning guide</a> explains the common options.</p>`}
};
const acronyms = s => s.replace(/\b(db|lew|ev|tv|hdb|ikea|ups)\b/gi,m=>m.toUpperCase());
const countText = (n,one,many) => `${n} ${n===1?one:many}`;
const listText = items => items.length<2?items.join(''):items.slice(0,-1).join(', ')+' and '+items.at(-1);
// Published rate summaries for the companies that name the town, by guideEvidence spec.
// Same rules as the guides: one lowest rate per company, and no range under minimumCompanies.
function areaRates(tradeId, local) {
  return Object.entries(guideEvidence).filter(([,spec])=>spec.trade===tradeId).map(([key,spec])=>{
    const rows=sourcedRates(spec,local);if(rows.length<minimumCompanies)return null;
    const units=new Map();for(const {line} of rows){const unit=displayUnit(line);if(unit)units.set(unit,(units.get(unit)||0)+1);}
    const [unit,count]=[...units].sort((a,b)=>b[1]-a[1])[0]||['',0];
    const same=rows.filter(r=>displayUnit(r.line)===unit);
    return {key,spec,rows,unit,count,low:count>=minimumCompanies?same[0]:null,high:count>=minimumCompanies?same.at(-1):null};
  }).filter(Boolean);
}
function renderAreaPage(page) {
  const {trade:tradeId,town}=page,trade=tradeById(tradeId),words=areaWords[tradeId],slug=townSlug(town),canonicalPath=page.path;
  const {town:local,region,islandwide}=areaCompanies(tradeId,town);
  const regionName=townRegion(town);
  const hub=editorialGuides.find(g=>g.trade===tradeId&&g.hub);
  const title=`${words.pro} Serving ${town}, Singapore | Roster`;
  const description=concise(`Compare ${local.length} ${words.noun} companies that state they serve ${town}, with coverage sources, published prices and direct contact details.`);
  const crumbs=[{href:`/roster/${trade.slug}/`,label:trade.name},{href:canonicalPath,label:town}];
  const services=serviceCounts(local).filter(([,n])=>n>=2).slice(0,4);
  const priced=local.filter(c=>presentation[c.slug]?.published).length;
  const rated=local.filter(c=>ratingSummary(c)).length;
  const emergency=local.filter(c=>c.enrichment?.emergency?.value===true).length;
  const rates=areaRates(tradeId,local);
  const lead=rates.find(r=>r.low);
  const intro=[`${countText(local.length,`${words.noun} company`,`${words.noun} companies`)} on Roster name ${town} on their own websites, in the ${regionName} region.`,
    services.length?`The services they list most often are ${listText(services.map(([n,c])=>`${acronyms(n.toLowerCase())} (${c})`))}.`:'',
    `${priced} ${priced===1?'publishes prices on its site':'publish prices on their sites'}, ${countText(rated,'has','have')} a cited rating${emergency?`, and ${countText(emergency,'describes','describe')} emergency or after-hours work`:''}.`,
    lead?`For ${lead.spec.noun} work, the lowest published rates from ${lead.count} of these companies run from ${money(lead.low.line.amount_sgd)} ${lead.unit} at ${lead.low.company.name} to ${money(lead.high.line.amount_sgd)} at ${lead.high.company.name}, as each company advertises it.`:`Fewer than ${minimumCompanies} of these companies publish a comparable rate for the same job, so no price range is shown for ${town}.`
  ].filter(Boolean).join(' ');
  const coverage=c=>(c.enrichment.serviceLocations||[]).find(l=>l.name===town);
  const item=c=>{const e=coverage(c),r=ratingSummary(c);return `<li><div><a href="/roster/company/${c.slug}/">${esc(c.name)}</a><span>${r?`${r.value.toFixed(1)} / 5 from ${r.count?r.count.toLocaleString('en-SG')+' reviews':'cited sources'}`:'No ratings found yet'}${presentation[c.slug]?.published?' · Publishes prices':''}</span></div>${e?`<a href="${esc(e.sourceUrl)}">Coverage stated on ${esc(new URL(e.sourceUrl).hostname.replace(/^www\./,''))} · ${esc(e.capturedAt)}</a>`:''}</li>`;};
  const rateTables=rates.map(r=>renderSourcedRates(r.key,local,{attr:'data-area-rates',scope:` from companies serving ${town}`})).join('');
  const nearby=nearbyTowns(town).filter(t=>planningAreas.some(a=>a.name===t));
  const nearbyLinks=nearby.map(t=>`<a href="${areaHref(trade,t)}">${esc(t)}</a>`).join('');
  const faqs=[
    [`How many ${words.noun} companies serve ${town}?`,`${countText(local.length,'company names','companies name')} ${town} on its own website and ${local.length===1?'is':'are'} listed on this page. ${countText(region.length,'more company states','more companies state')} the ${regionName} region, and ${countText(islandwide.length,'says','say')} it covers all of Singapore without naming ${town}.`],
    [`What do ${words.noun} companies serving ${town} charge?`,lead?`The lowest published ${lead.spec.noun} rates from ${lead.count} companies that name ${town} run from ${money(lead.low.line.amount_sgd)} to ${money(lead.high.line.amount_sgd)} ${lead.unit}. These are advertised rates with conditions, not quotes.`:`Fewer than ${minimumCompanies} companies that name ${town} publish a comparable rate for the same job, so Roster does not show a range. ${priced} ${priced===1?'company publishes':'companies publish'} some prices; ask the others for a quote.`],
    [`Is this list a ranking?`,`No. Companies that name ${town} are listed alphabetically. Roster listings are unpaid.`]
  ];
  const body=renderCrumbs(crumbs)+`<header class="guide-hero"><div><p class="kicker">${words.kicker}</p><h1>${esc(words.pro)} serving ${esc(town)}.</h1><p class="guide-dek" data-area-intro>${esc(intro)}</p><div class="guide-hero-actions"><a class="btn btn-solid" href="/roster/${trade.slug}/?area=${slug}#company-results">Filter all ${esc(trade.name.toLowerCase())} companies by ${esc(town)} ${icon('arrow')}</a>${hub?`<a href="${hub.path}">Read the ${esc(hub.label.toLowerCase())} guide</a>`:''}</div></div></header>
<section class="editorial area-page" data-area-page="${tradeId}|${esc(town)}"><div class="guide-copy">
<h2 id="named">Companies that name ${esc(town)}</h2><p>These companies list ${esc(town)} on their own websites. Coverage can change, so confirm your block and postal code when you call. The order is alphabetical, not a ranking.</p><ul class="area-company-list">${local.map(item).join('')}</ul>
${rateTables}
<h2 id="wider">Wider coverage</h2><p>${region.length} more ${region.length===1?'company states':'companies state'} that ${region.length===1?'it serves':'they serve'} the ${esc(regionName)} region, and ${islandwide.length} ${islandwide.length===1?'says it serves':'say they serve'} all of Singapore without naming ${esc(town)}. The <a href="/roster/${trade.slug}/?area=${slug}#company-results">area filter</a> lists them after the companies that name the town. Companies that do not state any coverage are not counted here.</p>
<h2 id="before">Before you call ${/^[aeiou]/i.test(words.one)?'an':'a'} ${words.one} in ${esc(town)}</h2>${words.tips(town)}<p>Ask for the call-out or inspection charge before the visit, and agree the price of any extra work before it starts.</p>
<h2 id="nearby">Nearby towns</h2><p>Towns next to ${esc(town)} on the URA planning area map. Linked pages list the ${esc(words.noun)} companies that name each town; the others open the area filter.</p><div class="areas-we-serve-links" data-nearby>${nearbyLinks}<a href="/roster/${trade.slug}/">All ${esc(trade.name.toLowerCase())} companies</a></div>
</div></section>`+renderFaq(faqs,`Questions about ${words.noun} in ${town}`);
  const jsonLd=[webPage(title,canonicalPath,description),crumbsLd(crumbs),faqLd(faqs)];
  forbidSchema(jsonLd);
  return pageShell({title,description,canonicalPath,current:`/roster/${trade.slug}/`,jsonLd,body,bodyClass:'guide-page'});
}
function areaCompanies(trade, town) { return townCoverage(publishedCompanies, trade, town); }

function renderGuidePrices() {
  const {samples,average}=buildHomeSnapshot(publishedCompanies,mapPins,presentation).prices.aircon;
  if(!average)return '';
  return `<section class="guide-price-sample" aria-labelledby="sample-title"><p class="kicker">FROM THE ROSTER DIRECTORY</p><h2 id="sample-title">Published general-servicing rates</h2><strong class="guide-price-number">S$${average} <small>per unit</small></strong><p>Average advertised starting rate across ${samples.length} companies. One matching rate per company, rounded to the nearest dollar. Minimum bookings and other conditions apply. These are source snapshots, not current quotes.</p><details><summary>See all ${samples.length} rates and sources</summary><div class="guide-table-scroll" tabindex="0" role="region" aria-label="Sourced aircon servicing prices"><table><caption>Advertised rates in SGD. Capture dates are shown per source.</caption><thead><tr><th scope="col">Company</th><th scope="col">Rate</th><th scope="col">Source checked</th></tr></thead><tbody>${samples.map(s=>`<tr><th scope="row"><a href="/roster/company/${s.slug}/#pricing">${esc(s.name)}</a></th><td>${esc(s.rate)}</td><td><a href="${esc(s.sourceUrl)}">${esc(s.checkedAt.slice(0,10))} · Conditions</a></td></tr>`).join('')}</tbody></table></div></details></section>`;
}

/* ---------- Build ---------- */

const presentation = JSON.parse(await readFile(path.join(root, "data", "presentation.json"), "utf8"));
const profileContent = JSON.parse(await readFile(path.join(root, "data", "profiles.json"), "utf8"));
const serviceGuides = JSON.parse(await readFile(path.join(root, "data", "service-guides.json"), "utf8"));
assertNoDashes(serviceGuides, "service-guides.json");
assertNoDashes(profileContent, "profiles.json");

const raw = JSON.parse(await readFile(path.join(root, "data", "companies.json"), "utf8"));
checked = raw.capturedLabel || checked;
assertNoDashes(raw, "companies.json");
assertNoDashes({ trades, intents, howFaqs }, "templates");
validate(raw.companies);

const operatorGroups = JSON.parse(await readFile(path.join(root, "data", "operator-groups.json"), "utf8"));
const renderProfile = createProfileRenderer({esc,icon,tradeById,profileContent,priceSummary,renderCrumbs,pageShell,webPage,crumbsLd,faqLd,profileBusinessGraph,forbidSchema,renderServiceRow,renderForm,operatorGroups,mapPins});
const publishedCompanies = raw.companies.filter((company) => company.publish !== false);
// Existing guide and intent pages own their slugs; a town page never replaces one.
const {pages:areaPages,collisions:areaCollisions}=selectAreaPages(publishedCompanies,trades,new Set([...editorialGuides.map(g=>g.slug),...intents.map(i=>i.slug)]));
const grouped = {};
for (const trade of trades) grouped[trade.id] = [];
for (const company of publishedCompanies) grouped[company.primaryTrade || company.category].push(company);
for (const trade of trades) grouped[trade.id] = sortCompanies(grouped[trade.id]);

const written = [];
await mkdir(path.join(root,'data/index'), {recursive:true});
async function writeIndex(spec, companies) {
  const records = companies.map(c => {
    const record=directoryRecord(c,priceSummary(c,spec.service),tradeById(c.category));
    // Keep the search index lean as the directory grows; omit unused card fields.
    delete record.categories;
    if(!record.fullProfile&&!record.examplePrice) delete record.priceDetail;
    for(const field of ['logo','description','whatsapp']) if(!record[field]) delete record[field];
    return record;
  });
  const output=JSON.stringify(encodeCatalogue(records))+'\n';
  indexVersions[indexName(spec)]=createHash('sha256').update(output).digest('hex').slice(0,12);
  await writeFile(path.join(root,'data/index',indexName(spec)+'.json'),output);
}
await writeIndex({id:'all'},sortCompanies(publishedCompanies));
for (const trade of trades) await writeIndex(trade,grouped[trade.id]);
for (const intent of intents) await writeIndex(intent,grouped[intent.parent].filter(c=>c.services.includes(intent.service)));

written.push(await writePage("", renderHome(grouped)));
written.push(await writePage("how-it-works", renderHow()));
written.push(await writePage("matches", renderMatchPage({esc,icon,pageShell,indexPath:indexPath({id:"all"})})));
written.push(await writePage('logo-removal',pageShell({title:'Logo removal requests | Roster',description:'Information for business owners who would like a company logo removed from Roster. The public removal contact inbox is awaiting confirmation.',canonicalPath:'/roster/logo-removal/',current:'',jsonLd:[],body:`<section class="pending-feature"><p class="kicker">FOR BUSINESS OWNERS</p><h1>Logo removal requests</h1><p>Logos belong to their owners. We can remove a logo without removing the business listing.</p><h2>Contact route pending</h2><p>The removal inbox is not connected yet. This preview cannot receive a request.</p><p>When the contact route is available, include the company name, its Roster page URL and your relationship to the logo owner. Do not send passwords or identity documents.</p><a href="/roster/">Back to Roster</a></section>`})));
written.push(await writePage("claim-listing", renderClaimPage({esc,icon,pageShell,renderCrumbs},sortCompanies(publishedCompanies))));
for (const mode of ["sign-in", "sign-up", "forgot-password", "reset-password"]) written.push(await writePage(mode, renderAccount(mode)));
written.push(await writePage('account',pageShell({title:'Your account | Roster',description:'Manage your Roster account and keep your saved Singapore home-service companies together across devices.',canonicalPath:'/roster/account/',current:'',jsonLd:[],bodyClass:'account-page',body:accountHome({icon})})));
written.push(await writePage('auth/callback',pageShell({title:'Complete sign in | Roster',description:'Complete your secure Roster sign-in or verify your email, then return to your saved Singapore home-service companies.',canonicalPath:'/roster/auth/callback/',current:'',jsonLd:[],bodyClass:'account-page',body:callbackContent})));
written.push(await writePage('saved',pageShell({title:'Your saved companies | Roster',description:'Your personal shortlist of Singapore home-service companies. Compare saved businesses, prices and reviews in one place.',canonicalPath:'/roster/saved/',current:'',jsonLd:[],bodyClass:'saved-page-body',body:savedContent({icon,indexPath:indexPath({id:'all'}),esc})})));

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

for (const guide of editorialGuides) written.push(await writePage(guide.slug,renderGuidePage(guide)));
for (const page of areaPages) written.push(await writePage(page.slug,renderAreaPage(page)));
for (const c of areaCollisions) console.log(`Area page skipped, slug in use: ${c.slug}`);

for (const company of publishedCompanies) {
  written.push(await writePage(
    `company/${company.slug}`,
    renderProfile(company, grouped[company.category])
  ));
}

// Keep previously published, withdrawn URLs useful without restoring excluded profiles.
const retired=[
  {slug:'skywave-solutions-pte-ltd',name:'Skywave Solutions Pte. Ltd.',target:'/roster/electrician/',trade:'electrical'},
  {slug:'billy-aircon',name:'Billy Aircon',target:'/roster/aircon-servicing/',trade:'aircon servicing'},
  {slug:'aeon-environmental-services',name:'Aeon Environmental Services',target:'/roster/home-cleaning/',trade:'home cleaning'},
  {slug:'city-cleaning',name:'City Cleaning',target:'/roster/home-cleaning/',trade:'home cleaning'},
  {slug:'greengarden-integrated-services-pte-ltd',name:'Greengarden Integrated Services Pte Ltd',target:'/roster/home-cleaning/',trade:'home cleaning'},
  {slug:'sq-1-development-pte-ltd',name:'SQ 1 Development Pte Ltd',target:'/roster/home-cleaning/',trade:'home cleaning'},
  {slug:'flash-aircon',name:'Signature Engineering Services Pte Ltd',target:'/roster/aircon-servicing/',trade:'aircon servicing'},
  {slug:'reliable-electrical-services',name:'Reliable Electrical Services',target:'/roster/electrician/',trade:'electrical'}
];
for(const old of retired) if(!publishedCompanies.some(c=>c.slug===old.slug)) {
  const canonicalPath=`/roster/company/${old.slug}/`;
  const redirect=pageShell({title:`${old.name}: listing unavailable | Roster`,description:concise(`The ${old.name} listing is currently unavailable. Browse other ${old.trade} companies in Singapore on Roster.`),canonicalPath,current:old.target,jsonLd:[webPage(`${old.name}: listing unavailable`,canonicalPath,'This listing is currently unavailable.')],body:`<section class="claim-hero" data-retired-listing><div><h1>This listing is currently unavailable.</h1><p>Explore other ${old.trade} companies, compare prices and get in touch directly.</p><a class="btn btn-solid" href="${old.target}">Browse ${old.trade} companies</a></div></section>`}).replace('<meta charset="utf-8">',`<meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${old.target}">`);
  written.push(await writePage(`company/${old.slug}`,redirect));
}

const currentPaths = written.map(f=>path.relative(root,f));
let previous = [];
try { previous = JSON.parse(await readFile(path.join(root,'data/build-manifest.json'),'utf8')); } catch(e) { if(e.code!=='ENOENT') throw e; }
for (const rel of previous) if(!currentPaths.includes(rel) && /^company\/[a-z0-9-]+\/index\.html$/.test(rel)) await rm(path.join(root,rel),{force:true});
await writeFile(path.join(root,'data/build-manifest.json'),JSON.stringify(currentPaths,null,2)+'\n');
// Preview pages are intentionally noindex, so none belong in a submitted sitemap.
// This review manifest is the proposed launch set, pending an approved production domain and indexing review.
const launchPages=[{path:"/roster/",kind:"home"},{path:"/roster/how-it-works/",kind:"method"},...trades.map(t=>({path:`/roster/${t.slug}/`,kind:"directory"})),...editorialGuides.map(g=>({id:g.id,path:g.path,words:g.words,kind:"guide"})),...areaPages.map(p=>({path:p.path,trade:p.trade,town:p.town,companies:p.count,kind:"area"}))];
await writeFile(path.join(root,'data/seo-launch-pages.json'),JSON.stringify({status:"preview-noindex",canonicalOrigin:origin,updated:"2026-10-12",pages:launchPages},null,2)+'\n');
await writeFile(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n');
await writeFile(path.join(root,'robots.txt'),'# Beta preview. Every HTML page also carries noindex.\nUser-agent: *\nDisallow: /roster/\n');
console.log(written.length + " pages");
for (const trade of trades) {
  console.log(trade.id + ": " + grouped[trade.id].length + " profiles");
}

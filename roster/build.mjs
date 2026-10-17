import {heroPhoto,photoCredit} from './lib/hero-professions.mjs';
import {previewFeatures} from './assets/features.mjs';
import {renderQuoteEvidence,logoOwnerNote} from './assets/evidence-display.mjs';
import {accountContent,accountHome,savedContent,callbackContent} from './lib/account-pages.mjs';
import {renderMatchPage} from './lib/job-search.mjs';
import {renderQuoteComposer} from './lib/quote-flow.mjs';
import {renderAreaFilter} from './lib/service-areas.mjs';
import {ratingSummary} from './lib/rating-summary.mjs';
import {planningAreas} from './assets/service-areas.mjs';
import {loadBlog,blogAuthor} from './lib/blog.mjs';
import {airconMatrix,unitColumns,sizeColumns} from './lib/aircon-matrix.mjs';
import {selectAreaPages,townCoverage,townRegion,nearbyTowns,serviceCounts,serviceLabel} from './lib/area-pages.mjs';
import {priceOption} from './scripts/import-db.mjs';
import {displayNames} from './lib/display-name.mjs';
import {stripCaptureDates} from './lib/no-dates.mjs';
import {origin as siteOrigin, absUrl, LAUNCH, SITE_ORIGIN, SITE_BASE, robotsFor} from './lib/site-config.mjs';
import {buildSitemaps, companyLastmod, day} from './lib/sitemaps.mjs';
import {renderLlms} from './lib/llms.mjs';
import {BEST_OF,rankBestOf,bestOfScore} from './lib/best-of.mjs';
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
import {guideEvidence, sourcedRates, rateLabel, rateCell, displayUnit, isFromPrice, minimumCompanies, money, profileRowProblem} from "./lib/sourced-rates.mjs";
import { renderCard, renderCompactCard, splitDirectory } from "./assets/catalogue-card.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const editorialGuides = await loadGuides(root);
const editorialByPath = new Map(editorialGuides.map(g=>[g.path,g]));
const editorialByDirectory = new Map(editorialGuides.filter(g=>g.directoryPath).map(g=>[g.directoryPath,g]));
const methodGuide = {...parseGuide(await readFile(path.join(root,"content/how-it-works.md"),"utf8"),"method"),id:"method",slug:"how-it-works",trade:"all",h1:"How Roster works",updated:"2026-10-12",path:"/roster/how-it-works/"};
await import('./scripts/build-accounts.mjs');
// P1-14: WebP copies (<=256 px, ~30 KB) are what pages serve; originals stay as the import record.
console.log('Logo copies:', execFileSync('python3', [path.join(root, 'scripts/optimize-logos.py')], {encoding:'utf8'}).trim());
console.log('Logo framing:', execFileSync('python3', [path.join(root, 'scripts/fit-logos.py')], {encoding:'utf8'}).trim());
const logoVariants = JSON.parse(await readFile(path.join(root, 'data/logo-variants.json'), 'utf8'));
const mapPins=JSON.parse(await readFile(path.join(root,"data/map-pins.json"),"utf8"));
const homeOutline=JSON.parse(await readFile(path.join(root,"data/singapore-outline.json"),"utf8"));
const indexVersions={};
// The public address comes from lib/site-config.mjs (SITE_ORIGIN + SITE_BASE).
const origin = siteOrigin;
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
  return absUrl(pathname);
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
<div class="foot-brand"><a class="brand" href="/roster/">${brandMark()}<span class="wordmark">Roster</span></a><p>Find the right help for your home. Compare services, prices and reviews from companies across Singapore.</p><p class="foot-note">Business details and reviews link to their original sources.</p></div>
<div class="foot-col"><h2>Jobs</h2><ul>${jobs}</ul></div>
<div class="foot-col"><h2>About</h2><ul><li><a href="/roster/how-it-works/">How the list is made</a></li><li><a href="/roster/blog/">Home advice blog</a></li><li><a href="/roster/what-service-do-i-need/">What service do I need?</a></li><li><a href="/roster/claim-listing/">Claim your listing</a></li><li><a href="/roster/aircon-servicing/chemical-wash/">Aircon chemical wash</a></li><li><a href="/roster/aircon-servicing/gas-top-up/">Aircon gas top-up</a></li></ul></div>
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
  const result = service ? { ...cleanDisplay, examplePrice:false, ...(display.services?.[service] || { price: "Ask for a quote", detail: "Ask the company for a quote for this service.", published: false }) } : cleanDisplay;
  // Cards show one example service price. "See published prices" is not a price, so use a real
  // sourced rate from the release when one passes the guards; otherwise the card uses the no-price layout.
  if(isAmount(result.price))return result;
  const line=exampleLine(company,service);
  return line ? {...result,price:rateCell(line),detail:rateLabel(line,null,company.sourceName||company.name),examplePrice:true,published:true} : result;
}
const isAmount = price => /^(?:from\s+)?S?\$\s*\d/i.test(String(price||''));
// First usable published rate, preferring the trade's everyday job (general servicing for aircon).
function exampleLine(company, service) {
  const lines=(company.enrichment?.priceLines||[]).filter(p=>(!service||p.job===service)&&Number.isFinite(p.amount_sgd)&&p.amount_sgd>0&&!p.promo&&!p.indicative&&/^https?:\/\//.test(p.sourceUrl||'')
    &&!/as printed/.test(rateCell(p))&&!profileRowProblem({label:rateLabel(p,null,company.name),price:rateCell(p),excerpt:p.excerpt})&&!(company.category==='aircon'&&p.job==='general-service'&&p.units_in_price>1));
  return (company.category==='aircon'&&lines.find(p=>p.job==='general-service'))||lines[0]||null;
}

function indexName(spec) { return spec.service || spec.id; }
function indexPath(spec) { return `/roster/data/index/${indexName(spec)}.json?v=${indexVersions[indexName(spec)]}`; }
function shortlist(companies, service) {
  const records = companies.map(c => directoryRecord(c, priceSummary(c, service), tradeById(c.category)));
  const groups=splitDirectory(records);
  return `<div class="results-toolbar"><div><h2>Companies to consider</h2><p data-result-count aria-live="polite">${groups.shortlist.length} on the shortlist · ${groups.others.length} other companies</p></div><div class="sort-control"><label class="sort-native">Sort: <select data-sort aria-label="Sort companies"><option value="evidence">Recommended</option><option value="rating">Highest rated</option><option value="reviews">Most reviewed</option><option value="name">Name A to Z</option></select></label></div></div><p class="results-method">Unpaid listings. <span data-shortlist-explanation>The shortlist leads with companies that have prices for named jobs, coverage and residential service details. </span>Ratings are Google Maps ratings; other sources appear separately on each company page. <a href="/roster/how-it-works/">Our approach</a></p><div class="index-error" data-index-error hidden><p>The complete list could not load. Please try again.</p><button type="button" class="btn" data-retry>Retry loading companies</button></div><div class="area-unstated" data-area-unstated hidden><label><input type="checkbox" data-include-unstated><span><strong data-unstated-count>0</strong> companies did not state their areas. Show them anyway.</span></label></div><div data-shortlist-section${groups.shortlist.length?'':' hidden'}><p class="shortlist-caption">A shortlist with fuller details</p><ol class="shortlist">${groups.shortlist.map(c=>renderCard(c)).join('')}</ol></div><section class="other-companies" data-other-section${groups.others.length?'':' hidden'}><div class="other-companies-heading"><h2 data-other-heading>Other companies</h2><p data-other-note>More options to explore. Some listings have limited details.</p></div><ol class="compact-list" data-other-list>${groups.others.slice(0,12).map(c=>renderCompactCard(c)).join('')}</ol><div class="load-more-wrap"><button class="btn" data-load-more type="button"${groups.others.length<=12?' hidden':''}>Show more companies</button></div></section><div class="no-results" data-no-results hidden><h3>No companies match these filters</h3><p>Try a different search or clear your filters.</p><button type="button" class="btn" data-reset>Clear filters</button></div><noscript><p>Enable JavaScript to filter the list. All company listings are available below.</p><ul>${companies.map(c => `<li><a href="/roster/company/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></noscript>`;
}

function pageShell({ title, description, canonicalPath, current, jsonLd, body, bodyClass = "", shareImage = "" }) {
  if (!shareImage && editorialByPath.has(canonicalPath)) shareImage = abs(heroPhoto(editorialByPath.get(canonicalPath).trade).sizes[1200].src);
  // P1-11: every page has a share image; the default is the brand card (scripts/make-brand-images.py).
  if (!shareImage) shareImage = abs('/roster/assets/og-default.png');
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
${LAUNCH ? "" : '<script src="/auth-config.js"></script>\n<script src="/auth.js"></script>\n'}<meta charset="utf-8">
<meta name="generator" content="Roster static build">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="${robotsFor(canonicalPath)}">${LAUNCH ? `\n<script>if(/[?&](?:area|reviews|price|rating|q|trade|sort|company|whatsapp|saved|unstated)=/.test(location.search))document.querySelector('meta[name=robots]').content='noindex, follow';</script>` : ""}
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
<link rel="icon" href="/roster/assets/roster-logo-512.png" type="image/png" sizes="512x512">
<link rel="apple-touch-icon" href="/roster/assets/roster-logo-512.png">
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
  // No visible capture dates (lib/no-dates.mjs); dates stay in the data and the JSON-LD.
  return stripCaptureDates(oncePerPage(html));
}

// Review P2-2: the rate-table disclaimer and the long table caption repeat under every table (135
// times on 62 town pages). Keep the first of each per page; later tables keep a short caption.
const RATE_DISCLAIMER = "Each figure is one company's own advertised rate with its conditions, not a market average or a quote.";
const RATE_CAPTION = 'Lowest matching advertised rate per company, in SGD as published. "From" marks a starting price and ranges are shown in full. Check the source for minimums, GST and inclusions.';
function oncePerPage(html) {
  let said = false, captioned = false;
  return html
    .replace(new RegExp(String.raw`(<p>)?( ?)${RATE_DISCLAIMER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(</p>)?`, 'g'), (m, open, space, close) => said ? (open && close ? '' : open || close || '') : (said = true, m))
    .replace(new RegExp(RATE_CAPTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), m => captioned ? 'Lowest matching rate per company, in SGD as published.' : (captioned = true, m));
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
    description,
    // P1-12: the site and its publisher are referenced by @id (defined once, on the home page).
    isPartOf: { "@id": origin + "/#website" },
    publisher: { "@id": origin + "/#organization" }
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
    `<div class="directory-layout${previewFeatures?'':' directory-browse-only'}" id="company-results" data-catalogue data-index="${indexPath(spec)}"><aside class="filters" aria-label="Filter companies"><div class="filters-head"><h2>${icon("sliders")}Refine your list</h2><button type="button" class="filter-toggle" data-toggle-filters aria-controls="company-filters" aria-expanded="true">${icon("sliders")}Filters <span data-active-filters></span>${icon("chevron")}</button><button type="button" data-reset>Reset</button></div><div class="filter-content" id="company-filters"><label class="filter-search">Search this list<input type="search" placeholder="Company or keyword" data-filter-search></label>${renderAreaFilter(esc)}<label class="filter-select">Google Maps rating<select data-rating aria-label="Minimum Google Maps rating"><option value="">Any rating</option><option value="4">4.0 and above</option><option value="4.5">4.5 and above</option><option value="4.8">4.8 and above</option></select></label>${tradeId === "all" ? `<label class="filter-select">Service<select data-category-filter><option value="">All services</option>${trades.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>` : ""}<fieldset><legend>What matters to you?</legend>${filter("price", "Published pricing", companies.filter(c => priceSummary(c, spec.service).published).length)}${filter("reviews", "Dated reviews", companies.filter(c => c.reviews.length).length)}${filter("whatsapp", "WhatsApp contact", companies.filter(c => c.whatsapp?.value).length)}${previewFeatures?filter("saved", "Saved companies", 0):""}</fieldset><details class="filter-categories"><summary>Explore services${icon("chevron")}</summary>${trades.map(t => `<a href="/roster/${t.slug}/"${t.id === tradeId ? ' aria-current="page"' : ""}>${icon(tradeIcon[t.id])}${esc(t.name)}${icon("chevron")}</a>`).join("")}<div class="filter-foot">${icon("shield")}<p>A place on Roster is unpaid.<br>Always your choice.</p></div></details></div></aside><div class="directory-results">`,
    isAircon ? airconSubnav(canonicalPath) : "",
    shortlist(companies, spec.service),
    `<details class="list-explainer"><summary>About this ${esc(categoryLabel.toLowerCase())} shortlist${icon("chevron")}</summary><p>${esc(spec.intro[0])}</p>${notes}<p><a href="/roster/how-it-works/">How the list is made</a>.</p></details>`,
    `</div><aside class="discovery-rail" aria-label="Directory information">${previewFeatures?`<details class="quote-rail-disclosure" open><summary>Get quotes for your job ${icon("sparkle")}</summary>${renderQuoteComposer({icon})}</details>`:''}<div class="rail-note">${icon("calendar")}<p>Each figure links to its source.</p></div></aside></div>`,
    previewFeatures && tradeId !== "all" ? `<div id="quote-request">${renderForm(spec.jobs, companies.filter(c => !c.imported), "ask")}</div>` : previewFeatures ? `<div id="quote-request" class="search-end"><h2>Start with the service you need</h2><p>Choose a service above to explore its shortlist and preview a quote request.</p></div>` : "",
    spec.service ? renderSourcedRates(spec.service) : "",
    tradeId !== "all" && !spec.service ? renderBestTeaser(tradeId) : "",
    tradeId !== "all" && !spec.service ? renderQuickPicks(spec, companies) : "",
    tradeId !== "all" && !spec.service ? renderLicenceLookup(tradeId) : "",
    tradeId !== "all" && !spec.service ? renderHubBlog(spec, tradeId) : "",
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
    bodyClass: "directory-page",
    // Trade hubs share the trade's credited Pexels hero (no faces); search uses the brand card.
    shareImage: tradeId !== "all" && heroPhoto(tradeId) ? abs(heroPhoto(tradeId).sizes[1200].src) : ""
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

// Review §2a evidence clutter: each price row keeps its own facts and source link, while notes that
// repeat on every row move to one page-level note (in the pricing intro, lib/expanded.mjs). The data is unchanged.
//  - "Calculated per-unit price" only when the published total covers more than one unit
//  - "Per job (inferred from the job type; confirm with the company)" -> "Per job"
//  - "GST: not stated" and "Quantity: 1" dropped; a stated GST note stays
function tidyDetail(detail) {
  return String(detail || '').split(/\.\s+(?=[A-Z])/).map(s => s.replace(/\.$/, '').trim())
    .filter(s => s && !/^GST: not stated$/i.test(s) && !/^Quantity: 1$/.test(s) && !/^Calculated per-unit price: .*\(1 unit in the published total\)$/.test(s))
    .map(s => s.replace(/\s*\(inferred from the job type; confirm with the company\)/, ''))
    .join('. ').replace(/^(.+)$/, '$1.');
}
function renderServiceExplanation(service) {
  const guide = service.guide ? serviceGuides[service.guide] : null;
  if (service.guide && !guide?.body) throw new Error(`Missing guide: ${service.guide}`);
  const prices = service.prices.map(priceView);
  const reference = (p) => `<details class="price-original"><summary>Price reference & conditions</summary>${p.excerpt?`<p>${esc(p.excerpt)}</p>`:''}${p.sourceUrl?`<span class="data-source"><a href="${esc(p.sourceUrl)}">View price on company website</a></span>`:''}</details>`;
  const options = prices.length ? `<div class="service-options" aria-label="Service price options">${prices.map(p=>{const detail=tidyDetail(p.detail);return `<div class="service-option"><div class="service-option-heading"><h3>${esc(p.label || service.name)}</h3>${prices.length>1?`<strong>${esc(p.price)}</strong>`:''}</div>${p.indicative?'<span class="claim-label">General price guide, not a company quote</span>':''}${detail?`<p class="price-conditions">${esc(detail)}</p>`:''}${p.excerpt||p.sourceUrl?reference(p):''}</div>`;}).join('')}</div>` : '';
  const explanation = guide?.body || (service.imported ? serviceGuide(service.name,service.trade) : service.explanation);
  // The service's source is one link named after the service, instead of a "Service reference" block.
  return `<div class="service-explanation">${service.description?`<p class="service-context">${esc(service.description)}</p>`:''}${explanation?`<p>${esc(explanation)}</p>`:''}${options}${guide?.ask?`<div class="service-booking-question"><h3>Before you book</h3><p>${esc(guide.ask)}</p></div>`:''}${service.sourceUrl?`<p class="data-source service-source"><a href="${esc(service.sourceUrl)}">${esc(service.name)} on the company website</a></p>`:''}</div>`;
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
      // P1-12: raster logo (Google needs at least 112 px); every other page refers to this node by @id.
      logo: { "@type": "ImageObject", url: abs("/roster/assets/roster-logo-512.png"), width: 512, height: 512 },
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
  const body=renderCrumbs(crumbs)+`<header class="guide-hero"><div><p class="kicker">THE ROSTER HOME GUIDE</p><h1>${esc(guide.h1)}</h1><p class="guide-dek">${esc(guide.description)}</p><div class="guide-hero-actions"><a class="btn btn-solid" href="/roster/${trade.slug}/">Compare ${esc(trade.name.toLowerCase())} companies ${icon('arrow')}</a><a href="#guide">Read the guide</a></div></div><figure><img src="${heroPhoto(guide.trade).sizes[640].src}" width="600" height="400" alt="" fetchpriority="high"><figcaption><a href="${esc(heroPhoto(guide.trade).url)}">${esc(photoCredit(guide.trade))}</a></figcaption></figure></header>`+renderEditorial(guide,editorialGuides,{extra:(guide.hub?renderBestTeaser(guide.trade):'')+(guide.id==='AC-03'?renderGuidePrices()+renderAirconMatrix():guide.id==='AC-01'?renderAreasWeServe(tradeById('aircon')):renderSourcedRates(guide.id))});
  const jsonLd=[webPage(guide.title,guide.path,guide.description),crumbsLd(crumbs),...editorialSchema(guide,origin,image),...(guide.hub?[{"@type":"ItemList",name:`${guide.label}: related guides`,itemListElement:editorialGuides.filter(g=>g.trade===guide.trade&&g.id!==guide.id).map((g,i)=>({"@type":"ListItem",position:i+1,name:g.label,url:abs(g.path)}))}]:[])];
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
const dateSpan = (a,b) => {
  const d=x=>new Date(x+'T00:00:00Z'),day=x=>d(x).getUTCDate(),month=x=>d(x).toLocaleDateString('en-GB',{month:'long',timeZone:'UTC'}),year=x=>d(x).getUTCFullYear();
  if(a===b)return `on ${day(a)} ${month(a)} ${year(a)}`;
  return month(a)===month(b)&&year(a)===year(b)?`between ${day(a)} and ${day(b)} ${month(b)} ${year(b)}`:`between ${day(a)} ${month(a)} and ${day(b)} ${month(b)} ${year(b)}`;
};
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
// Aircon town pages: one-unit general servicing rates from the companies that name the town, by
// the same one-unit rule as the units matrix (lib/aircon-matrix.mjs). Null under minimumCompanies.
function areaGeneralServicing(local, town) {
  const entries=airconMatrix(local,[unitColumns[0]])[0].cells[0].entries;
  if(entries.length<minimumCompanies)return null;
  const amounts=entries.map(e=>e.line.amount_sgd),spec={name:'General servicing',noun:'general servicing',match:/servic/i};
  const html=`<section class="guide-price-sample" aria-labelledby="general-servicing-rates-title"><p class="kicker">FROM THE ROSTER DIRECTORY</p><h2 id="general-servicing-rates-title">Published general servicing rates from companies serving ${esc(town)}</h2><p>For one unit, the lowest published general servicing rates from ${entries.length} companies run from <strong>${money(amounts[0])}</strong> to <strong>${money(amounts.at(-1))}</strong>. Each figure is one company's own advertised rate with its conditions, not a market average or a quote.</p><details><summary>See ${entries.length} published general servicing rates and sources</summary><div class="guide-table-scroll" tabindex="0" role="region" aria-label="Published general servicing rates"><table data-area-general="${esc(town)}"><caption>Lowest one-unit general servicing rate per company, in SGD as published. "From" marks a starting price. Check the source for minimums, GST and inclusions.</caption><thead><tr><th scope="col">Company</th><th scope="col">Service as listed</th><th scope="col">Rate</th><th scope="col">Source</th></tr></thead><tbody>${entries.map(({company:c,line:p})=>`<tr><th scope="row"><a href="/roster/company/${c.slug}/#pricing">${esc(c.name)}</a></th><td>${esc(rateLabel(p,spec,c.sourceName||c.name))}</td><td>${esc(rateCell(p))}</td><td><a href="${esc(p.sourceUrl)}">${esc(new URL(p.sourceUrl).hostname.replace(/^www\./,''))} · ${esc(p.capturedAt.slice(0,10))}</a></td></tr>`).join('')}</tbody></table></div></details></section>`;
  return {entries,low:amounts[0],high:amounts.at(-1),html};
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
  const general=tradeId==='aircon'?areaGeneralServicing(local,town):null;
  const intro=[`${countText(local.length,`${words.noun} company`,`${words.noun} companies`)} on Roster name ${town} on their own websites, in the ${regionName} region.`,
    services.length?`The services they list most often are ${listText(services.map(([n,c])=>`${(serviceLabel(n)||acronyms(n.toLowerCase()))} (${c})`))}.`:'',
    `${priced?`${priced} ${priced===1?'publishes prices on its site':'publish prices on their sites'}`:'None publishes prices on its site'}, ${rated?countText(rated,'has','have'):'none has'} a cited rating${emergency?`, and ${countText(emergency,'describes','describe')} emergency or after-hours work`:''}.`,
    general?`For general servicing of one unit, the lowest published rates from ${general.entries.length} of these companies run from ${money(general.low)} at ${general.entries[0].company.name} to ${money(general.high)} at ${general.entries.at(-1).company.name}, as each company advertises it.`:lead?`For ${lead.spec.noun} work, the lowest published rates from ${lead.count} of these companies run from ${money(lead.low.line.amount_sgd)} ${lead.unit} at ${lead.low.company.name} to ${money(lead.high.line.amount_sgd)} at ${lead.high.company.name}, as each company advertises it.`:rates.length?`Published ${rates.map(r=>r.spec.noun).join(' and ')} rates from these companies are listed below; they use different units, so no single range is shown.`:`Fewer than ${minimumCompanies} of these companies publish a comparable rate for the same job, so no price range is shown for ${town}.`
  ].filter(Boolean).join(' ');
  // Coverage evidence (source URL, capture date, excerpt) stays in the data and on each company page.
  // P1-5: the rating names its source (Google Maps, the only headline source) and carries no date.
  const item=c=>{const r=ratingSummary(c);return `<li><div><a href="/roster/company/${c.slug}/">${esc(c.name)}</a><span>${r?`${r.value.toFixed(1)} on Google Maps${r.count?` · ${r.count.toLocaleString('en-SG')} ${r.count===1?'review':'reviews'}`:''}`:'No Google Maps rating found yet'}${presentation[c.slug]?.published?' · Publishes prices':''}</span></div></li>`;};
  const rateTables=(general?.html||'')+rates.map(r=>renderSourcedRates(r.key,local,{attr:'data-area-rates',scope:` from companies serving ${town}`})).join('');
  const nearby=nearbyTowns(town).filter(t=>planningAreas.some(a=>a.name===t));
  const nearbyLinks=nearby.map(t=>`<a href="${areaHref(trade,t)}">${esc(t)}</a>`).join('');
  const unstated=publishedCompanies.filter(c=>c.category===tradeId&&!(c.enrichment.serviceLocations||[]).length).length;
  const withPages=nearby.filter(t=>areaPagePath(tradeId,t));
  const listNote=`${local.length===1?'This company says on its own website that it serves':'These companies say on their own websites that they serve'} ${town}. Confirm your address when you call. Listed alphabetically.`;
  const nearbyNote=withPages.length===nearby.length?`All ${nearby.length} have their own ${words.noun} page.`:withPages.length?`${listText(withPages)} ${withPages.length===1?'has its':'have their'} own ${words.noun} page; the others open the area filter.`:`None has its own ${words.noun} page yet, so each opens the area filter.`;
  const faqs=[
    [`How many ${words.noun} companies serve ${town}?`,`${local.length===1?`1 company names ${town} on its own website and is`:`${local.length} companies name ${town} on their own websites and are`} listed on this page. ${countText(region.length,'more company states','more companies state')} the ${regionName} region, and ${islandwide.length===1?'1 says it covers':`${islandwide.length} say they cover`} all of Singapore without naming ${town}.`],
    [`What do ${words.noun} companies serving ${town} charge?`,general?`For general servicing of one unit, the lowest published rates from ${general.entries.length} companies that name ${town} run from ${money(general.low)} to ${money(general.high)}.${lead?` Their ${lead.spec.noun} rates run from ${money(lead.low.line.amount_sgd)} to ${money(lead.high.line.amount_sgd)} ${lead.unit}.`:''} These are advertised rates with conditions, not quotes.`:lead?`The lowest published ${lead.spec.noun} rates from ${lead.count} companies that name ${town} run from ${money(lead.low.line.amount_sgd)} to ${money(lead.high.line.amount_sgd)} ${lead.unit}. These are advertised rates with conditions, not quotes.`:rates.length?`The published ${rates.map(r=>r.spec.noun).join(' and ')} rates on this page use different units, so Roster does not show a single range. Each rate links to its source.`:`Fewer than ${minimumCompanies} companies that name ${town} publish a comparable rate for the same job, so Roster does not show a range. ${priced===local.length?`All ${priced} publish some prices on their own sites; check each for what it includes.`:priced?`${priced} ${priced===1?'company publishes':'companies publish'} some prices; ask the others for a quote.`:'None publishes prices, so ask each company for a quote.'}`],
    [`Is this list a ranking?`,`No. Companies that name ${town} are listed alphabetically. Roster listings are unpaid.`]
  ];
  const body=renderCrumbs(crumbs)+`<header class="guide-hero"><div><p class="kicker">${words.kicker}</p><h1>${esc(words.pro)} serving ${esc(town)}.</h1><p class="guide-dek" data-area-intro>${esc(intro)}</p><div class="guide-hero-actions"><a class="btn btn-solid" href="/roster/${trade.slug}/?area=${slug}#company-results">Filter all ${esc(words.pro.toLowerCase())} by ${esc(town)} ${icon('arrow')}</a>${hub?`<a href="${hub.path}">Read the ${esc(hub.label.toLowerCase().replace(/ guide$/,''))} guide</a>`:''}</div></div></header>
<section class="editorial area-page" data-area-page="${tradeId}|${esc(town)}"><div class="guide-copy">
<h2 id="named">Companies that name ${esc(town)}</h2><p>${esc(listNote)}</p><ul class="area-company-list">${local.map(item).join('')}</ul>
${rateTables}
<h2 id="wider">Wider coverage</h2><p>${region.length?`${region.length} more ${region.length===1?'company states':'companies state'} that ${region.length===1?'it serves':'they serve'}`:'No other company names only'} the ${esc(regionName)} region, and ${islandwide.length} ${islandwide.length===1?'says it serves':'say they serve'} all of Singapore without naming ${esc(town)}. The <a href="/roster/${trade.slug}/?area=${slug}#company-results">area filter</a> shows them after the companies above${unstated?`, and can add the ${unstated} ${words.noun} ${unstated===1?'company that does':'companies that do'} not state ${unstated===1?'its':'their'} areas`:''}.</p>
<h2 id="before">Before you call ${/^[aeiou]/i.test(words.one)?'an':'a'} ${words.one} in ${esc(town)}</h2>${words.tips(town)}${priced===local.length?`<p>${local.length===1?'The company above publishes':`All ${priced} companies above publish`} prices on ${local.length===1?'its':'their'} own site${local.length===1?'':'s'}; check each source for what the price includes before the visit.</p>`:priced?`<p>${priced} of the ${local.length} companies above publish prices on their own sites; for the others, ask for the call-out or inspection charge before the visit.</p>`:`<p>None of the companies above publishes prices, so ask each for its call-out or inspection charge before the visit.</p>`}
<h2 id="nearby">Nearby towns</h2><p>${nearby.length} ${nearby.length===1?'town shares':'towns share'} a boundary with ${esc(town)} on the URA Master Plan 2019 map. ${esc(nearbyNote)}</p><div class="areas-we-serve-links" data-nearby>${nearbyLinks}<a href="/roster/${trade.slug}/">All ${esc(trade.name.toLowerCase())} companies</a></div>
</div></section>`+renderFaq(faqs,`Questions about ${words.pro.toLowerCase()} in ${town}`);
  const jsonLd=[webPage(title,canonicalPath,description),crumbsLd(crumbs),faqLd(faqs)];
  forbidSchema(jsonLd);
  return pageShell({title,description,canonicalPath,current:`/roster/${trade.slug}/`,jsonLd,body,bodyClass:'guide-page',shareImage:abs(heroPhoto(tradeId).sizes[1200].src)});
}
function areaCompanies(trade, town) { return townCoverage(publishedCompanies, trade, town); }

function renderGuidePrices() {
  const {samples,average}=buildHomeSnapshot(publishedCompanies,mapPins,presentation).prices.aircon;
  if(!average)return '';
  const oneUnit=airconMatrix(publishedCompanies,unitColumns)[0].cells[0];
  return `<section class="guide-price-sample" aria-labelledby="sample-title"><p class="kicker">FROM THE ROSTER DIRECTORY</p><h2 id="sample-title">Published general-servicing rates</h2><strong class="guide-price-number">S$${average} <small>per unit</small></strong><p>Average advertised starting rate across ${samples.length} companies. One matching rate per company, rounded to the nearest dollar. Minimum bookings and other conditions apply. These are source snapshots, not current quotes.</p>${oneUnit?.shown?`<p data-average-vs-median>Why two figures: this S$${average} is the average of ${samples.length} rates that each company prints as a per-unit price for one unit. The 1-unit general servicing cell in the table below is a median of ${oneUnit.count} companies (${money(oneUnit.median)}) and also counts one-unit prices printed per job or with no unit, so it covers more companies${oneUnit.median>average?' and sits higher':oneUnit.median<average?' and sits lower':''}. A median is the middle rate, so a few very low or high prices move it less than an average.</p>`:''}<details><summary>See all ${samples.length} rates and sources</summary><div class="guide-table-scroll" tabindex="0" role="region" aria-label="Sourced aircon servicing prices"><table><caption>Advertised rates in SGD, each linked to its source.</caption><thead><tr><th scope="col">Company</th><th scope="col">Rate</th><th scope="col">Source</th></tr></thead><tbody>${samples.map(s=>`<tr><th scope="row"><a href="/roster/company/${s.slug}/#pricing">${esc(s.name)}</a></th><td>${esc(s.rate)}</td><td><a href="${esc(s.sourceUrl)}">Conditions</a></td></tr>`).join('')}</tbody></table></div></details></section>`;
}

/* ---------- Gap features: aircon price matrix, quick picks, licence lookups, symptom finder ---------- */

function renderMatrixTable(id, title, note, columns) {
  const rows=airconMatrix(publishedCompanies,columns);
  const cell=c=>c.shown?`<td data-matrix-cell="${id}|${c.column.id}" data-count="${c.count}"><strong>${c.min===c.max?money(c.min):`${money(c.min)} to ${money(c.max)}`}</strong><small>${c.count} companies · median ${money(Math.round(c.median))}</small></td>`:`<td data-matrix-cell="${id}|${c.column.id}" data-count="${c.count}" class="matrix-empty"><small>${c.count?`Only ${c.count} ${c.count===1?'company':'companies'}`:'No published rates'}</small></td>`;
  const sources=rows.flatMap(r=>r.cells.filter(c=>c.shown).flatMap(c=>c.entries.map(e=>({r,c,e}))));
  return `<section class="guide-price-sample" aria-labelledby="matrix-${id}-title" data-aircon-matrix="${id}"><p class="kicker">FROM THE ROSTER DIRECTORY</p><h2 id="matrix-${id}-title">${esc(title)}</h2><p>${esc(note)} Each cell uses one lowest published rate per company and is left empty when fewer than ${minimumCompanies} companies publish one. Figures are advertised rates with conditions, not quotes or a market average.</p><div class="guide-table-scroll" tabindex="0" role="region" aria-label="${esc(title)}"><table class="aircon-matrix"><caption>SGD as published. Some figures are starting prices; see each source for conditions.</caption><thead><tr><th scope="col">Service</th>${columns.map(c=>`<th scope="col">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr data-matrix-row="${r.service.id}"><th scope="row">${esc(r.service.label)}</th>${r.cells.map(cell).join('')}</tr>`).join('')}</tbody></table></div><details><summary>See the ${sources.length} published rates and sources behind these cells</summary><div class="guide-table-scroll" tabindex="0" role="region" aria-label="${esc(title)}: sources"><table data-matrix-sources="${id}"><caption>Lowest matching rate per company in each cell, with the company's own wording.</caption><thead><tr><th scope="col">Company</th><th scope="col">Cell</th><th scope="col">Service as listed</th><th scope="col">Rate</th><th scope="col">Source</th></tr></thead><tbody>${sources.map(({r,c,e})=>`<tr><th scope="row"><a href="/roster/company/${e.company.slug}/#pricing">${esc(e.company.name)}</a></th><td>${esc(r.service.label)}, ${esc(c.column.label)}</td><td>${esc(matrixLabel(e,r.service))}</td><td>${esc(rateCell(e.line))}</td><td><a href="${esc(e.line.sourceUrl)}">${esc(new URL(e.line.sourceUrl).hostname.replace(/^www\./,''))} · ${esc(e.line.capturedAt.slice(0,10))}</a></td></tr>`).join('')}</tbody></table></div></details></section>`;
}
// The row's own wording (never the previous tier's service_raw), with the guide label guards:
// no page titles, slogans or company names, and cut at a word boundary within 90 characters.
const matrixLabel = (e,service) => rateLabel(e.line,{name:service.label,noun:service.label.toLowerCase(),match:service.match},e.company.sourceName||e.company.name);
function renderAirconMatrix() {
  return renderMatrixTable('units','Published aircon rates by number of units','Totals as printed for that many units in one booking.',unitColumns)+renderMatrixTable('sizes','Published single-unit rates by unit size','Single-unit rates where the company names the unit size or a ceiling cassette.',sizeColumns);
}

// Quick picks: groups built only from sourced fields. Not a ranking or a recommendation.
const townCount = c => new Set((c.enrichment?.serviceLocations||[]).map(l=>l.name).filter(n=>planningAreas.some(a=>a.name===n))).size;
function quickPicks(companies) {
  const byName=(a,b)=>a.name.localeCompare(b.name);
  return [
    {id:'prices',title:'Publishes prices',how:'Has at least one dated price from its own website.',order:'Alphabetical.',rows:companies.filter(c=>presentation[c.slug]?.published).sort(byName),filter:'price'},
    {id:'rating',title:'Has a cited rating',how:'Shows a rating with its source and check date.',order:'Most reviews first.',rows:companies.filter(c=>ratingSummary(c)).sort((a,b)=>(ratingSummary(b).count||0)-(ratingSummary(a).count||0)||byName(a,b)),filter:'reviews'},
    {id:'emergency',title:'Describes emergency or 24-hour work',how:'Its website mentions emergency or round-the-clock service; hours are not verified.',order:'Alphabetical.',rows:companies.filter(c=>c.enrichment?.emergency?.value===true&&c.enrichment.emergency.excerpt).sort(byName)},
    {id:'towns',title:'Names the most towns',how:'Count of planning areas named on its own website. Islandwide claims are counted separately.',order:'Most towns named first.',rows:companies.filter(c=>townCount(c)>0).sort((a,b)=>townCount(b)-townCount(a)||byName(a,b))},
    {id:'islandwide',title:'Says it serves all of Singapore',how:'States islandwide coverage on its own website.',order:'Alphabetical.',rows:companies.filter(c=>(c.enrichment?.serviceLocations||[]).some(l=>l.name==='Islandwide')).sort(byName)}
  ];
}
function renderQuickPicks(spec, companies) {
  const picks=quickPicks(companies),total=companies.length;
  const card=p=>`<div class="guide-card quick-pick" data-quick-pick="${p.id}" data-count="${p.rows.length}"><span>${p.rows.length} of ${total} companies</span><h3>${esc(p.title)}</h3><p>${esc(p.how)} ${esc(p.order)}</p><ul>${p.rows.slice(0,5).map(c=>`<li><a href="/roster/company/${c.slug}/">${esc(c.name)}</a>${p.id==='towns'?` <small>${townCount(c)} towns</small>`:''}</li>`).join('')}</ul>${p.filter?`<a href="/roster/${spec.slug}/?${p.filter}=1#company-results">Show all ${p.rows.length} in the list</a>`:''}</div>`;
  return `<section class="guide-discovery quick-picks" aria-labelledby="quick-picks-title"><p class="kicker">QUICK PICKS BY NEED</p><h2 id="quick-picks-title">Start from what matters to you.</h2><p>Each group uses one sourced field from the company's own website or a cited rating source. Groups are filters, not rankings or recommendations, and a company can appear in several.</p><div class="guide-table-scroll" tabindex="0" role="region" aria-label="Summary of sourced fields"><table class="quick-pick-summary"><caption>${esc(spec.name)} companies on Roster by sourced field</caption><thead><tr><th scope="col">Need</th><th scope="col">Companies</th><th scope="col">How we know</th></tr></thead><tbody>${picks.map(p=>`<tr><th scope="row">${esc(p.title)}</th><td>${p.rows.length} of ${total}</td><td>${esc(p.how)}</td></tr>`).join('')}</tbody></table></div><div class="guide-card-grid">${picks.filter(p=>p.rows.length).map(card).join('')}</div><p class="quick-pick-gaps">Opening hours and warranty terms are not shown yet; they need their own sourced collection.</p></section>`;
}

// Blog posts for this trade, so every post is linked from its hub as well as the blog index.
function renderHubBlog(spec, tradeId) {
  const list=blogPosts.filter(p=>p.trade===tradeId).sort((a,b)=>a.label.localeCompare(b.label));
  if(!list.length)return '';
  return `<section class="hub-blog" aria-labelledby="hub-blog-title"><p class="kicker">FROM THE BLOG</p><h2 id="hub-blog-title">Short reads before you book.</h2><ul class="areas-we-serve-links">${list.map(p=>`<li><a href="${p.path}">${esc(p.label)}</a></li>`).join('')}</ul><p><a href="/roster/blog/">All articles</a></p></section>`;
}

// Official licence lookups. Roster does not show licence status for individual companies.
const licenceLookups = {
  electrician:[['EMA: search for a licensed electrical worker','https://elise.ema.gov.sg/elise/LEWs.jsp'],['EMA: how to search for or verify a licensed electrical worker','https://www.ema.gov.sg/resources/faqs/worker-licences/electrical-worker-licence/how-do-i-search-for-or-verify-a-licensed-electrical-worker-lew'],['EMA: engaging licensed workers','https://www.ema.gov.sg/consumer-information/electricity/engaging-licensed-workers']],
  plumbing:[['PUB: licensed plumbers','https://www.pub.gov.sg/Professionals/Requirements/Licensed-Plumbers'],['PUB: requirements for plumbing works','https://www.pub.gov.sg/Professionals/Requirements/Licensed-Plumbers/Plumbing-Works']]
};
function renderLicenceLookup(tradeId) {
  const links=licenceLookups[tradeId];if(!links)return '';
  const guide={electrician:'/roster/electrician/licensed-electrician/',plumbing:'/roster/plumbing/licensed-plumber/'}[tradeId];
  return `<section class="directory-guide-card licence-lookup" aria-labelledby="licence-title" data-licence-lookup><div><p class="kicker">CHECK A LICENCE YOURSELF</p><h2 id="licence-title">Official licence lookups.</h2><p>Roster does not show licence status for individual companies. Ask the company for the name and licence number of the worker who will do your job, then check it with the official source.</p><ul>${links.map(([label,url])=>`<li><a href="${url}">${esc(label)}</a></li>`).join('')}</ul></div><a class="btn btn-solid" href="${guide}">How to check a licence <span aria-hidden="true">→</span></a></section>`;
}

// Symptom finder: routes a problem to the service and the guide that already covers it.
const symptoms = [
  ['Aircon','Water dripping from the indoor unit','Often a blocked drain line; a general service usually clears it','/roster/aircon/leaking-water/','Why is my aircon leaking water?'],
  ['Aircon','Musty smell or weak airflow after a recent service','Ask about a chemical wash or chemical overhaul','/roster/aircon-servicing/chemical-overhaul/','Chemical overhaul guide'],
  ['Aircon','Running but not cold','Ask for a repair check; it may not be a cleaning problem','/roster/aircon/repair/','Aircon repair guide'],
  ['Aircon','Due for routine upkeep','General servicing','/roster/aircon-servicing/how-often-service-aircon/','How often to service your aircon'],
  ['Plumbing','Sink, basin or floor trap draining slowly','Choke clearing','/roster/plumbing/choked-drain/','Choked drain guide'],
  ['Plumbing','Tap dripping after it is closed','Tap repair or replacement','/roster/plumbing/tap-replacement/','Tap replacement guide'],
  ['Plumbing','Toilet keeps running or leaks at the base','Toilet repair','/roster/plumbing/toilet-repair/','Toilet repair guide'],
  ['Plumbing','Damp patch, stain or drip from the ceiling','Speak to the unit above or your Town Council first; then leak detection inside your home','/roster/plumbing/leak-repair/','Leak repair guide'],
  ['Plumbing','No hot water, or the heater trips or leaks','Stop using it and book a water heater check','/roster/plumbing/water-heater/','Water heater guide'],
  ['Electrical','Breaker trips again after you reset it','Fault finding by a licensed electrician','/roster/electrician/power-trip/','Power trip guide'],
  ['Electrical','Socket scorched, loose or not working','Socket repair or replacement','/roster/electrician/socket-installation/','Socket installation guide'],
  ['Electrical','Lights flicker across a room, or a fitting needs replacing','Light repair or installation','/roster/electrician/light-installation/','Light installation guide'],
  ['Electrical','Old DB box, or no labels on the circuits','DB box inspection or replacement','/roster/electrician/db-box-replacement/','DB box guide'],
  ['Handyman','Door or window will not close or lock properly','Door and window repair','/roster/handyman/door-window-repair/','Door and window repair guide'],
  ['Handyman','Flat-pack furniture to build','Furniture assembly','/roster/handyman/furniture-assembly/','Furniture assembly guide'],
  ['Handyman','TV, shelves or curtains to mount','TV mounting or curtain installation','/roster/handyman/tv-mounting/','TV mounting guide'],
  ['Cleaning','Moving out and need the flat ready for handover','Move-out cleaning','/roster/home-cleaning/move-out-cleaning/','Move-out cleaning guide'],
  ['Cleaning','Dust everywhere after renovation','Post-renovation cleaning','/roster/home-cleaning/post-renovation-cleaning/','Post-renovation cleaning guide'],
  ['Cleaning','Stains or odours in the sofa, carpet or mattress','Upholstery, carpet or mattress cleaning','/roster/home-cleaning/sofa-carpet-cleaning/','Sofa and carpet cleaning guide']
];
function renderSymptomFinder() {
  const title='What Service Do I Need? Symptom Finder | Roster';
  const description='Match a common home problem in Singapore to the service to ask for and the Roster guide that explains it, from aircon leaks to power trips.';
  const canonicalPath='/roster/what-service-do-i-need/';
  const crumbs=[{href:canonicalPath,label:'What service do I need?'}];
  const groups=[...new Set(symptoms.map(s=>s[0]))];
  const hub={Aircon:'/roster/aircon-servicing/',Plumbing:'/roster/plumbing/',Electrical:'/roster/electrician/',Handyman:'/roster/handyman/',Cleaning:'/roster/home-cleaning/'};
  const body=renderCrumbs(crumbs)+`<header class="guide-hero guide-hero-method"><div><p class="kicker">SYMPTOM FINDER</p><h1>What service do I need?</h1><p class="guide-dek">Find your problem, see which service to ask for, and read the guide before you call. This is a starting point, not a diagnosis; the company that inspects the job may recommend something else.</p></div></header><section class="editorial" data-symptom-finder><div class="guide-copy">${groups.map(g=>`<h2 id="symptoms-${g.toLowerCase()}">${esc(g)}</h2><div class="guide-table-scroll" tabindex="0" role="region" aria-label="${esc(g)} symptoms"><table><caption>${esc(g)} problems and the service to ask for</caption><thead><tr><th scope="col">What you notice</th><th scope="col">Service to ask for</th><th scope="col">Read first</th></tr></thead><tbody>${symptoms.filter(s=>s[0]===g).map(([,s,service,href,label])=>`<tr><th scope="row">${esc(s)}</th><td>${esc(service)}</td><td><a href="${href}">${esc(label)}</a></td></tr>`).join('')}</tbody></table></div><p><a href="${hub[g]}">Compare ${esc(g.toLowerCase())} companies</a></p>`).join('')}<aside class="guide-editor-note"><strong>Safety first</strong><p>If water is near electrical points, or you smell burning or gas, switch off the supply if it is safe to do so and get help. For electrical work, read <a href="https://www.ema.gov.sg/consumer-information/electricity/electrical-safety">EMA's electrical safety guidance</a>.</p></aside></div></section>`;
  const jsonLd=[webPage(title,canonicalPath,description),crumbsLd(crumbs)];
  forbidSchema(jsonLd);
  return pageShell({title,description,canonicalPath,current:'',jsonLd,body,bodyClass:'guide-page'});
}

/* ---------- Best-rated pages (ranked on the Google rating only; rules in lib/best-of.mjs) ---------- */

// "Best" appears only in these pages' titles, H1s and breadcrumbs, and in links to them.
const bestWords={aircon:'aircon servicing',plumbing:'plumbing',electrician:'electrical',handyman:'handyman',cleaning:'home cleaning'};
const bestPath=tradeId=>`/roster/${tradeById(tradeId).slug}/best/`;
const bestLabel=tradeId=>`Best-rated ${bestWords[tradeId]} companies`;
function renderBestTeaser(tradeId){
  return `<section class="directory-guide-card best-of-teaser" aria-labelledby="best-of-teaser-${tradeId}" data-best-of-link><div><p class="kicker">RANKED ON GOOGLE RATINGS</p><h2 id="best-of-teaser-${tradeId}">Highest Google ratings, with review counts taken into account.</h2><p>A ranked list of ${esc(bestWords[tradeId])} companies on Roster with at least ${BEST_OF.minReviews} Google reviews. Small review counts are pulled toward ${BEST_OF.m}, and no company pays to appear.</p></div><a class="btn btn-solid" href="${bestPath(tradeId)}">${esc(bestLabel(tradeId))} <span aria-hidden="true">→</span></a></section>`;
}
function renderBestOf(tradeId){
  const trade=tradeById(tradeId),words=bestWords[tradeId],canonicalPath=bestPath(tradeId);
  const r=rankBestOf(publishedCompanies,tradeId);
  // Build check: a ranking needs at least `top` qualifiers; fewer means the data changed and needs review.
  if(r.qualifiers.length<BEST_OF.top)throw new Error(`Best-rated ${tradeId}: only ${r.qualifiers.length} companies have ${BEST_OF.minReviews}+ Google reviews`);
  // Check dates stay in the data (googleRating.checkedAt); pages show no capture dates.
  const n=r.ranked.length;
  const title=`Best ${words.replace(/\b\w/g,m=>m.toUpperCase())} Companies in Singapore | Roster`;
  const h1=`Best ${words} companies in Singapore`;
  const description=concise(`${n} ${words} companies in Singapore ranked on their Google rating and review count, with at least ${BEST_OF.minReviews} reviews each. No paid placement.`);
  const crumbs=[{href:`/roster/${trade.slug}/`,label:trade.name},{href:canonicalPath,label:`Best ${words} companies`}];
  const formula=`score = (reviews × rating + ${BEST_OF.K} × ${BEST_OF.m}) ÷ (reviews + ${BEST_OF.K})`;
  const excluded=r.excluded.map(e=>`${e.company.name} is left out because it is ${e.reason}.`).join(' ');
  const cut=r.cut?` ${r.cut.length} companies tie at position ${n+1}; the tie runs past ${BEST_OF.top}, so the whole group is left out and this list shows ${n}.`:'';
  const faqs=[
    ['How is this list ranked?',`By Google Maps rating and review count only. Each company's score is (reviews × rating + ${BEST_OF.K} × ${BEST_OF.m}) ÷ (reviews + ${BEST_OF.K}), so small review counts are pulled toward ${BEST_OF.m}. A company needs at least ${BEST_OF.minReviews} Google reviews to qualify.`],
    ['Why is a 5.0 rating sometimes ranked below a 4.9?',`A 5.0 from a few dozen reviews says less than a 4.9 from thousands. With these settings, 5.0 from 20 reviews scores ${bestOfScore(5,20).toFixed(2)} and 4.8 from 900 reviews scores ${bestOfScore(4.8,900).toFixed(2)}, so the larger record ranks higher.`],
    ['Can a company pay to be on this list?','No. Roster listings are unpaid, nobody can pay for a position, and Roster does not move companies up or down by hand.'],
    ['Which ratings are not used?',`Only the Google Maps rating counts. Ratings on Trustpilot, Carousell, Yelp, Facebook or a company's own website are not used, and companies with fewer than ${BEST_OF.minReviews} Google reviews or no dated Google rating are left out.`],
    ['Is this a recommendation?',`No. It is a ranking of public Google Maps ratings as Roster recorded them, not a recommendation or a quote. Ratings change, so check the current rating and ask for a written quote before you book.`]
  ];
  const row=x=>{const g=x.rating;return `<li data-best-of-rank="${x.rank}" data-slug="${x.company.slug}"><span class="best-of-rank">${x.tied?'=':''}${x.rank}</span><div><a href="/roster/company/${x.company.slug}/">${esc(x.company.name)}</a><span>${g.value.toFixed(1)} on Google Maps · ${g.count.toLocaleString('en-SG')} ${g.count===1?'review':'reviews'} · <a href="${esc(g.sourceUrl)}">Google Maps source</a></span></div></li>`;};
  const body=renderCrumbs(crumbs)+`<header class="guide-hero guide-hero-method"><div><p class="kicker">RANKED ON GOOGLE RATINGS</p><h1>${esc(h1)}</h1><p class="guide-dek">The ${n} ${esc(words)} companies on Roster with the highest Google ratings, weighted by how many reviews each has. ${r.qualifiers.length} of ${r.candidates} companies qualify with at least ${BEST_OF.minReviews} Google reviews.</p><div class="guide-hero-actions"><a class="btn btn-solid" href="/roster/${trade.slug}/">Compare all ${esc(trade.name.toLowerCase())} companies ${icon('arrow')}</a><a href="#method">How the ranking works</a></div></div></header>
<section class="editorial best-of-page" data-best-of="${tradeId}" data-qualifiers="${r.qualifiers.length}"><div class="guide-copy">
<aside class="guide-editor-note best-of-method" id="method"><strong>How this list is made</strong><ul><li>Who qualifies: companies on Roster whose main trade is ${esc(words)}, with a Google Maps rating recorded with its review count, link and check date. ${r.qualifiers.length} of ${r.candidates} qualify.</li><li>Minimum: ${BEST_OF.minReviews} Google reviews.</li><li>Score: we pull small review counts toward ${BEST_OF.m} so a few perfect reviews don't outrank hundreds of strong ones. In full: ${esc(formula)}, with m = ${BEST_OF.m} and K = ${BEST_OF.K}.</li><li>Google only. Trustpilot, Carousell, Yelp and company-website ratings are not used or averaged in.</li><li>Ratings are from Google Maps, as Roster recorded them; the live figures may have changed since.</li><li>No paid placement and no manual changes. Tied scores share a rank; a tie that runs past position ${BEST_OF.top} is left out whole.${esc(cut)}</li><li>Not a recommendation or a quote.</li></ul>${excluded?`<p>${esc(excluded)}</p>`:''}</aside>
<h2 id="ranking">The top ${n}</h2><ol class="best-of-list">${r.ranked.map(row).join('')}</ol>
<p>Each company page shows its services, published prices and contact details with their sources. <a href="/roster/how-it-works/">How Roster works</a>.</p>
</div></section>`+renderFaq(faqs,'Questions about this ranking');
  const jsonLd=[webPage(title,canonicalPath,description),crumbsLd(crumbs),listLd(h1,r.ranked.map(x=>x.company)),faqLd(faqs)];
  forbidSchema(jsonLd);
  return pageShell({title,description,canonicalPath,current:`/roster/${trade.slug}/`,jsonLd,body,bodyClass:'guide-page'});
}

/* ---------- Blog ---------- */

const longDate = iso => new Date(iso+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
// P2-7: each post links 3 related posts, same trade first (posts had only 2 inbound links each).
function relatedPosts(post) {
  const others=blogPosts.filter(p=>p.slug!==post.slug);
  const list=[...others.filter(p=>p.trade===post.trade),...others.filter(p=>p.trade!==post.trade)].slice(0,3);
  return list.length?`<section class="hub-blog" aria-labelledby="related-reads" data-related-posts><p class="kicker">KEEP READING</p><h2 id="related-reads">Related reads.</h2><ul class="areas-we-serve-links">${list.map(p=>`<li><a href="${p.path}">${esc(p.label)}</a></li>`).join('')}</ul></section>`:'';
}
function renderBlogPost(post) {
  // Hero photos are the five reviewed Pexels images; a post may borrow another trade's photo.
  const trade=tradeById(post.trade),hero=post.hero||post.trade,photo=heroPhoto(hero);
  if(!photo)throw new Error(`Blog ${post.slug}: unknown hero ${hero}`);
  const crumbs=[{href:'/roster/blog/',label:'Blog'},{href:post.path,label:post.label}];
  const sources=post.sources.length?`<div class="guide-editor-note" data-blog-sources><strong>Sources</strong><ul>${post.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ul><p>Prices come only from the sourced company rates in the Roster directory, shown with each company and capture date.</p></div>`:'';
  const body=renderCrumbs(crumbs)+`<header class="guide-hero"><div><p class="kicker">THE ROSTER BLOG</p><h1>${esc(post.h1)}</h1><p class="guide-dek">${esc(post.description)}</p><div class="guide-hero-actions"><a class="btn btn-solid" href="/roster/${trade.slug}/">Compare ${esc(trade.name.toLowerCase())} companies ${icon('arrow')}</a><a href="#${post.toc[0].id}">Start reading</a></div></div><figure><img src="${photo.sizes[640].src}" width="600" height="400" alt="" fetchpriority="high"><figcaption><a href="${esc(photo.url)}">${esc(photoCredit(hero))}</a></figcaption></figure></header>
<section class="editorial" aria-label="${esc(post.h1)}"><div class="guide-layout"><aside class="guide-aside"><details open class="guide-toc"><summary>In this article</summary><nav aria-label="On this page">${post.toc.map((t,i)=>`<a href="#${t.id}"><span>${String(i+1).padStart(2,'0')}</span>${esc(t.title)}</a>`).join('')}</nav></details><a class="btn btn-solid" href="/roster/${trade.slug}/">Compare companies <span aria-hidden="true">→</span></a></aside><article class="guide-article" data-blog-post="${post.slug}"><div class="guide-byline"><span>By ${esc(blogAuthor)}</span><span>Updated <time datetime="${post.updated}">${longDate(post.updated)}</time></span><span>${Math.ceil(post.words/220)} min read</span></div><div class="guide-copy">${post.body}</div>${sources}</article></div></section>`+relatedPosts(post);
  const url=abs(post.path);
  const jsonLd=[webPage(post.title,post.path,post.description),crumbsLd(crumbs),{'@type':'Article','@id':url+'#article',headline:post.h1,name:post.h1,url,description:post.description,inLanguage:'en-SG',datePublished:post.updated,dateModified:post.updated,image:new URL(photo.sizes[1200].src,origin).href,author:{'@type':'Organization',name:blogAuthor,url:abs('/roster/how-it-works/')},publisher:{'@id':origin+'/#organization'},mainEntityOfPage:url,citation:post.sources.map(s=>s.url)},...(post.faqs.length?[faqLd(post.faqs)]:[])];
  forbidSchema(jsonLd);
  return pageShell({title:post.title,description:post.description,canonicalPath:post.path,current:'',jsonLd,body,bodyClass:'guide-page',shareImage:abs(photo.sizes[1200].src)});
}
function renderBlogIndex(posts) {
  const title='Home Advice Blog: Singapore Home Services | Roster';
  const description='Practical articles on aircon, plumbing, electrical and cleaning jobs in Singapore homes, with official sources and sourced company prices.';
  const crumbs=[{href:'/roster/blog/',label:'Blog'}];
  const label={aircon:'Aircon',plumbing:'Plumbing',electrician:'Electrical',handyman:'Handyman',cleaning:'Cleaning'};
  const groupTitle={aircon:'Aircon servicing and repairs',plumbing:'Plumbing problems and fixes',electrician:'Electrical work and safety',handyman:'Handyman jobs, quotes and home upkeep',cleaning:'Cleaning your home'};
  // Grouped by trade in hub order; newest first, then by title, within each group.
  const groups=trades.map(t=>[t.id,posts.filter(p=>p.trade===t.id).sort((a,b)=>b.updated.localeCompare(a.updated)||a.label.localeCompare(b.label))]).filter(([,list])=>list.length);
  const body=renderCrumbs(crumbs)+`<header class="guide-hero guide-hero-method"><div><p class="kicker">THE ROSTER BLOG</p><h1>Home advice, with sources.</h1><p class="guide-dek">Short reads for common jobs around the home. Official guidance is linked, and any price comes from a company's own published rate.</p></div></header><nav class="blog-index-jump" aria-label="Articles by trade">${groups.map(([t,list])=>`<a href="#blog-${t}">${label[t]} <small>${list.length}</small></a>`).join('')}</nav>${groups.map(([t,list])=>`<section class="guide-discovery" data-blog-index data-blog-trade="${t}" aria-labelledby="blog-${t}"><p class="kicker">${label[t].toUpperCase()}</p><h2 id="blog-${t}">${esc(groupTitle[t])}</h2><div class="guide-card-grid">${list.map(p=>`<a class="guide-card" href="${p.path}"><span>Updated <time datetime="${p.updated}">${longDate(p.updated)}</time> · ${Math.ceil(p.words/220)} min read</span><h3>${esc(p.label)}</h3><p>${esc(p.description)}</p><b>Read the article <span aria-hidden="true">↗</span></b></a>`).join('')}</div></section>`).join('')}`;
  const jsonLd=[webPage(title,'/roster/blog/',description),crumbsLd(crumbs),{'@type':'ItemList',name:'Roster blog articles',itemListElement:posts.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.label,url:abs(p.path)}))}];
  forbidSchema(jsonLd);
  return pageShell({title,description,canonicalPath:'/roster/blog/',current:'',jsonLd,body,bodyClass:'guide-page',shareImage:abs(heroPhoto('plumbing').sizes[1200].src)});
}

/* ---------- Build ---------- */

const presentation = JSON.parse(await readFile(path.join(root, "data", "presentation.json"), "utf8"));
// Serve the optimised copy; logoAsset keeps the original's path and checksum.
for (const entry of Object.values(presentation)) if (entry.logo && logoVariants[entry.logo]) entry.logo = logoVariants[entry.logo].src;
const profileContent = JSON.parse(await readFile(path.join(root, "data", "profiles.json"), "utf8"));
const serviceGuides = JSON.parse(await readFile(path.join(root, "data", "service-guides.json"), "utf8"));
assertNoDashes(serviceGuides, "service-guides.json");
assertNoDashes(profileContent, "profiles.json");

const raw = JSON.parse(await readFile(path.join(root, "data", "companies.json"), "utf8"));
checked = raw.capturedLabel || checked;
assertNoDashes(raw, "companies.json");
assertNoDashes({ trades, intents, howFaqs }, "templates");
validate(raw.companies);
// Display names (lib/display-name.mjs) for every page; the source name stays as sourceName.
{const names=displayNames(raw.companies);for(const c of raw.companies){c.sourceName=c.name;c.name=names.get(c.slug);}}

const operatorGroups = JSON.parse(await readFile(path.join(root, "data", "operator-groups.json"), "utf8"));
const renderProfile = createProfileRenderer({esc,icon,tradeById,profileContent,priceSummary,renderCrumbs,pageShell,webPage,crumbsLd,faqLd,profileBusinessGraph,forbidSchema,renderServiceRow,renderForm,operatorGroups,mapPins});
const publishedCompanies = raw.companies.filter((company) => company.publish !== false);
// Existing guide and intent pages own their slugs; a town page never replaces one.
const {pages:areaPages,collisions:areaCollisions}=selectAreaPages(publishedCompanies,trades,new Set([...editorialGuides.map(g=>g.slug),...intents.map(i=>i.slug)]));
const blogPosts=await loadBlog(root,{renderRates:key=>renderSourcedRates(key)});
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
written.push(await writePage('blog',renderBlogIndex(blogPosts)));
written.push(await writePage('what-service-do-i-need',renderSymptomFinder()));
for (const trade of trades) written.push(await writePage(`${trade.slug}/best`,renderBestOf(trade.id)));
for (const post of blogPosts) written.push(await writePage(`blog/${post.slug}`,renderBlogPost(post)));
for (const c of areaCollisions) console.log(`Area page skipped, slug in use: ${c.slug}`);

// P2-7: company pages link to the town pages they appear on (up to 6) and their trade's hub guide.
const companyTowns=new Map();
for(const p of areaPages)for(const c of areaCompanies(p.trade,p.town).town){if(!companyTowns.has(c.slug))companyTowns.set(c.slug,[]);companyTowns.get(c.slug).push(p);}
function relatedLinks(company){
  const towns=(companyTowns.get(company.slug)||[]).slice().sort((a,b)=>a.town.localeCompare(b.town)).slice(0,6);
  const hubGuide=editorialGuides.find(g=>g.trade===company.category&&g.hub),trade=tradeById(company.category);
  const links=[...towns.map(p=>`<a href="${p.path}">${esc(trade.name)} in ${esc(p.town)}</a>`),hubGuide?`<a href="${hubGuide.path}">${esc(hubGuide.label)}</a>`:''].filter(Boolean);
  return links.length?`<section class="hub-blog related-links" aria-labelledby="related-${company.slug}" data-related-links><p class="kicker">MORE TO EXPLORE</p><h2 id="related-${company.slug}">${towns.length?`Where ${esc(company.name)} is listed`:'Before you book'}</h2><ul class="areas-we-serve-links">${links.map(l=>`<li>${l}</li>`).join('')}</ul></section>`:'';
}
for (const company of publishedCompanies) {
  written.push(await writePage(
    `company/${company.slug}`,
    renderProfile(company, grouped[company.category]).replace('\n</main>', `${relatedLinks(company)}\n</main>`)
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
// Blog posts whose Markdown was removed: remove the generated page and its folder.
for (const rel of previous) if(!currentPaths.includes(rel) && /^blog\/[a-z0-9-]+\/index\.html$/.test(rel)) await rm(path.join(root,path.dirname(rel)),{recursive:true,force:true});
// Area pages dropped by the selection rule: remove the file and its now-empty folder.
const tradeDirs=new Set(trades.map(t=>t.slug));
for (const rel of previous) if(!currentPaths.includes(rel) && /^[a-z-]+\/[a-z0-9-]+\/index\.html$/.test(rel) && tradeDirs.has(rel.split('/')[0])) {
  const file=path.join(root,rel);let html='';try{html=await readFile(file,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
  if(html.includes('data-area-page="'))await rm(path.dirname(file),{recursive:true,force:true});
}
await writeFile(path.join(root,'data/build-manifest.json'),JSON.stringify(currentPaths,null,2)+'\n');
// The sitemap lists the launch set (home, method, hubs, guides, area pages, blog) at the preview
// origin, as requested for review. Every page still carries noindex, nofollow, noarchive and
// robots.txt still disallows /roster/; indexing waits for an approved production domain.
const launchPages=[{path:"/roster/",kind:"home"},{path:"/roster/how-it-works/",kind:"method"},...trades.map(t=>({path:`/roster/${t.slug}/`,kind:"directory"})),...editorialGuides.map(g=>({id:g.id,path:g.path,words:g.words,kind:"guide"})),...areaPages.map(p=>({path:p.path,trade:p.trade,town:p.town,companies:p.count,kind:"area"})),{path:"/roster/what-service-do-i-need/",kind:"symptom-finder"},...trades.map(t=>({path:bestPath(t.id),trade:t.id,kind:"best-of"})),{path:"/roster/blog/",kind:"blog-index"},...blogPosts.map(b=>({path:b.path,words:b.words,kind:"blog"}))];
await writeFile(path.join(root,'data/seo-launch-pages.json'),JSON.stringify({status:"preview-noindex",canonicalOrigin:origin,updated:"2026-10-12",pages:launchPages},null,2)+'\n');
// P1-9: sitemap index + one child per family, with <lastmod> from content dates (guides, blog,
// method) or the data release / each company's newest dated fact. Utilities, query URLs and retired
// listings are left out. All files are written under roster/.
const dataDate=day(raw.capturedAt);
const sitemapFamilies=[
  {name:'core',urls:[{path:'/roster/',lastmod:dataDate},{path:'/roster/how-it-works/',lastmod:methodGuide.updated},...trades.map(t=>({path:`/roster/${t.slug}/`,lastmod:dataDate})),...intents.map(i=>({path:`/roster/${i.slug}/`,lastmod:dataDate})),{path:'/roster/what-service-do-i-need/'}]},
  {name:'best',urls:trades.map(t=>({path:bestPath(t.id),lastmod:dataDate}))},
  {name:'guides',urls:editorialGuides.map(g=>({path:g.path,lastmod:g.updated}))},
  {name:'towns',urls:areaPages.map(p=>({path:p.path,lastmod:dataDate}))},
  {name:'blog',urls:[{path:'/roster/blog/',lastmod:blogPosts.map(b=>b.updated).sort().at(-1)},...blogPosts.map(b=>({path:b.path,lastmod:b.updated}))]},
  {name:'companies',urls:publishedCompanies.map(c=>({path:`/roster/company/${c.slug}/`,lastmod:companyLastmod(c,dataDate)}))}
];
const sitemaps=buildSitemaps(sitemapFamilies);
for(const child of sitemaps.children)await writeFile(path.join(root,child.file),child.xml);
await writeFile(path.join(root,'sitemap.xml'),sitemaps.index);
console.log(`Sitemaps: ${sitemaps.children.map(c=>`${c.file} ${c.count}`).join(', ')}`);
// P1-17: branded 404 at roster/404.html: noindex (always), no canonical, links to hubs, search and the
// symptom finder. GitHub Pages serves only the repository-root 404.html, which is Martin's (LAUNCH.md).
{
  const notFound=pageShell({title:'Page not found | Roster',description:'This Roster page does not exist. Browse home-service companies in Singapore by trade, search by name, or find the service you need.',canonicalPath:'/roster/404/',current:'',jsonLd:[],bodyClass:'guide-page',
    body:`<header class="guide-hero guide-hero-method" data-not-found><div><p class="kicker">PAGE NOT FOUND</p><h1>We could not find that page.</h1><p class="guide-dek">The link may be old, or the listing may have moved. Start from a trade, search by company name, or describe the problem.</p><div class="guide-hero-actions"><a class="btn btn-solid" href="/roster/search/">Search companies ${icon('arrow')}</a><a href="/roster/what-service-do-i-need/">What service do I need?</a></div></div></header><section class="browse-more"><p class="kicker">BROWSE BY TRADE</p><h2>Home services in Singapore.</h2><div>${trades.map(t=>`<a href="/roster/${t.slug}/">${icon(tradeIcon[t.id])}<span>${esc(t.name)}</span>${icon('arrow')}</a>`).join('')}</div></section>`})
    .replace(/<link rel="canonical"[^>]*>\n?/,'').replace(/<meta property="og:url"[^>]*>\n?/,'').replace(/<meta name="robots" content="[^"]*">/,`<meta name="robots" content="${LAUNCH?'noindex, follow':'noindex, nofollow, noarchive'}">`);
  await writeFile(path.join(root,'404.html'),notFound);
}
// P1-10: llms.txt and llms-full.txt, from the same data and SITE_ORIGIN.
const llms=renderLlms({trades,guides:editorialGuides,posts:blogPosts,bestPath,bestLabel,best:BEST_OF,dataDate,counts:Object.fromEntries(trades.map(t=>[t.id,grouped[t.id].length]))});
await writeFile(path.join(root,'llms.txt'),llms.short);
await writeFile(path.join(root,'llms-full.txt'),llms.full);
// Unchanged until launch: robots.txt disallows /roster/ and every page carries noindex.
await writeFile(path.join(root,'robots.txt'),'# Beta preview. Every HTML page also carries noindex.\nUser-agent: *\nDisallow: /roster/\n');
// P0-3: with LAUNCH=true the build writes the domain-root robots.txt for Martin to place at the
// root of the final domain (docs/LAUNCH.md). It is only ever written inside roster/launch/.
if(LAUNCH){await mkdir(path.join(root,'launch'),{recursive:true});await writeFile(path.join(root,'launch/robots.txt'),`User-agent: *\nAllow: /\nDisallow: ${SITE_BASE}/data/\nSitemap: ${absUrl('/roster/sitemap.xml')}\n`);}
console.log(written.length + " pages");
for (const trade of trades) {
  console.log(trade.id + ": " + grouped[trade.id].length + " profiles");
}

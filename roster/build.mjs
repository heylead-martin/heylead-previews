import {priceOption} from './scripts/import-db.mjs';
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {execFileSync} from 'node:child_process';

import { createProfileRenderer, directoryRecord, concise, ratingFact } from "./lib/expanded.mjs";
import {priceView, servicePrice, serviceGuide} from "./lib/profile-copy.mjs";
import {renderClaimPage} from "./lib/claim-page.mjs";
import { renderCard, renderCompactCard, splitDirectory } from "./assets/catalogue-card.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
console.log('Logo framing:', execFileSync('python3', [path.join(root, 'scripts/fit-logos.py')], {encoding:'utf8'}).trim());
const mapPins=JSON.parse(await readFile(path.join(root,"data/map-pins.json"),"utf8"));
const indexVersions={};
const origin = "https://previews.heylead.com/roster";
let checked = "9 Oct 2026 and 10 Oct 2026";
// Content hashes keep cached assets in sync with each generated page.
const assetVersions = Object.fromEntries(await Promise.all(
  ["site.css", "directory.css", "experience.css", "form.js", "directory.js", "experience.js", "expanded.css", "logo-fit.css", "catalogue.js", "catalogue-card.mjs", "claim.js", "review-preview.mjs"].map(async (name) => [
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
        "Yes. The phone and WhatsApp links go directly to the company. The Roster quote request remains an unsent preview."
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
        "Yes. The phone and WhatsApp links go directly to the company. The Roster quote request remains an unsent preview."
      ]
    ]
  }
];

const howFaqs = [
  [
    "Can a company buy its position?",
    "No. Directory listings are unpaid. The default order is alphabetical; you can choose a rating or review-count sort using the cited Google Maps snapshots."
  ],
  [
    "Where do the ratings and reviews come from?",
    "Each rating and review links to its source and names when it was checked. Company-site ratings are labelled separately from Google Maps data."
  ],
  [
    "Does the quote form send my number?",
    "No. The quote panel is a local preview. It does not send or store your contact details."
  ],
  [
    "Which companies get a profile?",
    "Profiles require sourced services and company information. Flagged or incomplete database rows stay out of the directory. The original hand-checked write-ups are preserved."
  ]
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
<div class="foot-brand"><a class="brand" href="/roster/">${brandMark()}<span class="wordmark">Roster</span></a><p>Find the right help for your home. Compare services, prices and reviews from companies across Singapore.</p><p class="foot-note">Business details and reviews link to their original sources. Last checked ${checked}.</p></div>
<div class="foot-col"><h2>Jobs</h2><ul>${jobs}</ul></div>
<div class="foot-col"><h2>About</h2><ul><li><a href="/roster/how-it-works/">How the list is made</a></li><li><a href="/roster/claim-listing/">Claim your listing</a></li><li><a href="/roster/aircon-servicing/chemical-wash/">Aircon chemical wash</a></li><li><a href="/roster/aircon-servicing/gas-top-up/">Aircon gas top-up</a></li></ul></div>
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

function priceSummary(company, service) {
  const display = presentation[company.slug] || { price: "Ask for a quote", detail: "No published rate captured", published: false };
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
  return `<div class="results-toolbar"><div><h2>Companies to consider</h2><p data-result-count aria-live="polite">${groups.shortlist.length} on the shortlist · ${groups.others.length} other companies</p></div><label class="sort-control">Sort by<select data-sort aria-label="Sort companies"><option value="evidence">Most complete details</option><option value="rating">Average rating</option><option value="reviews">Review count</option><option value="name">Name A to Z</option></select></label></div><p class="results-method">Unpaid listings. The shortlist leads with companies that have prices for named jobs, coverage and residential service details. Average ratings are weighted by review count. <a href="/roster/how-it-works/">Our approach</a></p><div class="index-error" data-index-error hidden><p>The complete list could not load. Please try again.</p><button type="button" class="btn" data-retry>Retry loading companies</button></div><div data-shortlist-section${groups.shortlist.length?'':' hidden'}><p class="shortlist-caption">A shortlist with fuller details</p><ol class="shortlist">${groups.shortlist.map(c=>renderCard(c)).join('')}</ol></div><section class="other-companies" data-other-section${groups.others.length?'':' hidden'}><div class="other-companies-heading"><h2>Other companies</h2><p>More options to explore. Some listings have limited details.</p></div><ol class="compact-list" data-other-list>${groups.others.slice(0,12).map(c=>renderCompactCard(c)).join('')}</ol><div class="load-more-wrap"><button class="btn" data-load-more type="button"${groups.others.length<=12?' hidden':''}>Show more companies</button></div></section><div class="no-results" data-no-results hidden><h3>No companies match these filters</h3><p>Try a different search or clear your filters.</p><button type="button" class="btn" data-reset>Clear filters</button></div><noscript><p>Enable JavaScript to filter the list. All company listings are available below.</p><ul>${companies.map(c => `<li><a href="/roster/company/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></noscript>`;
}

function pageShell({ title, description, canonicalPath, current, jsonLd, body, bodyClass = "", shareImage = "" }) {
  description = concise(description);
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
<meta name="generator" content="Roster static build">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#f3f0e9">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Roster">
<meta property="og:locale" content="en_SG">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
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
<link rel="stylesheet" href="/roster/assets/logo-fit.css?v=${assetVersions["logo-fit.css"]}">
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
${bodyClass === "claim-page" ? `<script type="module" src="/roster/assets/claim.js?v=${assetVersions["claim.js"]}"></script>` : ""}
${bodyClass.split(" ").includes("company-page") ? `<script type="module" src="/roster/assets/review-preview.mjs?v=${assetVersions["review-preview.mjs"]}"></script>` : ""}
${bodyClass === "directory-page" ? `<script type="module" src="/roster/assets/catalogue.js?v=${assetVersions["catalogue.js"]}"></script>` : ""}
</body>
</html>
`;
  assertNoDashes(html, canonicalPath);
  if (/aggregateRating/i.test(html) || /"@type":"(Review|Offer|AggregateRating)"/.test(html)) {
    throw new Error("Rating, review, or offer schema leaked into " + canonicalPath);
  }
  // Account previews use dialog forms with disabled fields until the local handler loads.
  const nonPreviewHtml = html.replace(/<form method="dialog" data-claim-preview[^>]*>[\s\S]*?<\/form>/g, "").replace(/<form method="dialog" data-account-preview="(?:sign-in|sign-up|forgot-password|reset-password)"[^>]*>[\s\S]*?<\/form>/g, "");
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
  const title = count === 0
    ? `${spec.h1.replace(" in Singapore", "")} in Singapore: no shortlist yet | Roster`
    : `${spec.titleName || spec.name} in Singapore: shortlist of ${count} ${count === 1 ? "company" : "companies"} | Roster`;
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
  const filter = (key, label, n) => `<label class="filter-check"><input type="checkbox" data-filter="${key}"><span>${label}</span><small>${n}</small></label>`;
  const body = [
    renderCrumbs(crumbs),
    `<section class="directory-hero"><div><p class="kicker">THE SINGAPORE HOME DIRECTORY</p><h1>${tradeId === "all" ? "Find your next helping hand." : `${esc(categoryLabel)} <em>in Singapore.</em>`}</h1><p>${esc(summaries[tradeId])}</p></div><div class="hero-stamp"><span class="stamp-icon">${icon(tradeIcon[tradeId] || "search")}</span><div><strong>${count}</strong><span>${count === 1 ? "company to explore" : "companies to explore"}</span></div></div></section>`,
    `<div class="directory-layout" data-catalogue data-index="${indexPath(spec)}"><aside class="filters" aria-label="Filter companies"><div class="filters-head"><h2>${icon("sliders")}Refine your list</h2><button type="button" class="filter-toggle" data-toggle-filters aria-controls="company-filters" aria-expanded="true">${icon("sliders")}Filters <span data-active-filters></span>${icon("chevron")}</button><button type="button" data-reset>Reset</button></div><div class="filter-content" id="company-filters"><label class="filter-search">Search this list<input type="search" placeholder="Company or keyword" data-filter-search></label><label class="filter-select">Business location<select data-area aria-label="Business location"><option value="">All locations</option>${[...new Set(companies.map(c=>c.area))].filter(Boolean).sort().map(a=>`<option>${esc(a)}</option>`).join("")}</select></label><label class="filter-select">Average rating<select data-rating aria-label="Minimum average rating"><option value="">Any rating</option><option value="4">4.0 and above</option><option value="4.5">4.5 and above</option><option value="4.8">4.8 and above</option></select></label>${tradeId === "all" ? `<label class="filter-select">Service<select data-category-filter><option value="">All services</option>${trades.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>` : ""}<fieldset><legend>What matters to you?</legend>${filter("price", "Published pricing", companies.filter(c => priceSummary(c, spec.service).published).length)}${filter("reviews", "Dated reviews", companies.filter(c => c.reviews.length).length)}${filter("whatsapp", "WhatsApp contact", companies.filter(c => c.whatsapp?.value).length)}${filter("saved", "Saved companies", '<span data-saved-count>0</span>')}</fieldset><div class="filter-categories"><h3>Explore services</h3>${trades.map(t => `<a href="/roster/${t.slug}/"${t.id === tradeId ? ' aria-current="page"' : ""}>${icon(tradeIcon[t.id])}${esc(t.name)}${icon("chevron")}</a>`).join("")}</div><div class="filter-foot">${icon("shield")}<p>A place on Roster is unpaid.<br>Always your choice.</p></div></div></aside><div class="directory-results">`,
    isAircon ? airconSubnav(canonicalPath) : "",
    shortlist(companies, spec.service),
    `<details class="list-explainer"><summary>About this ${esc(categoryLabel.toLowerCase())} shortlist${icon("chevron")}</summary><p>${esc(spec.intro[0])}</p>${notes}<p><a href="/roster/how-it-works/">How the list is made</a>. Checked ${checked}.</p></details>`,
    `</div><aside class="discovery-rail"><section class="help-card"><span class="rail-symbol">${icon("list")}</span><p class="kicker">A LITTLE HOMEWORK HELPS</p><h2>A little clarity.<br>A better choice.</h2><p>Look beyond a star rating. A few details make the choice easier.</p><ol><li><span>1</span>Compare the price for your actual job.</li><li><span>2</span>Read what suits you, and what might not.</li><li><span>3</span>Call or WhatsApp the company directly.</li></ol><a href="/roster/how-it-works/">Get to know Roster${icon("arrow")}</a></section><section class="quote-teaser"><span class="beta">BETA PREVIEW</span><h2>One job.<br>A few options.</h2><p>Try a quote request for up to three companies.</p><a class="btn btn-solid" href="#quote-request">Preview a request${icon("arrow")}</a><small>Preview only. Nothing is sent or stored.</small></section><div class="rail-note">${icon("calendar")}<p>Facts last checked<br><strong>${esc(checked)}</strong><br>Each figure links to its source.</p></div></aside></div>`,
    tradeId !== "all" ? `<div id="quote-request">${renderForm(spec.jobs, companies.filter(c => !c.imported), "ask")}</div>` : `<div id="quote-request" class="search-end"><h2>Start with the service you need</h2><p>Choose a service above to explore its shortlist and preview a quote request.</p></div>`,
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

function renderServiceExplanation(service) {
  const guide = service.guide ? serviceGuides[service.guide] : null;
  if (service.guide && !guide?.body) throw new Error(`Missing guide: ${service.guide}`);
  const prices = service.prices.map(priceView);
  const reference = (p) => `<details class="price-original"><summary>Price reference & conditions</summary>${p.excerpt?`<p>${esc(p.excerpt)}</p>`:''}${p.sourceUrl?`<span class="data-source"><a href="${esc(p.sourceUrl)}">View price on company website</a><span>Checked ${esc(String(p.capturedAt||'2026-10-10').slice(0,10))}</span></span>`:''}</details>`;
  const options = prices.length ? `<div class="service-options" aria-label="Service price options">${prices.map(p=>`<div class="service-option"><div class="service-option-heading"><h4>${esc(p.label || service.name)}</h4>${prices.length>1?`<strong>${esc(p.price)}</strong>`:''}</div>${p.indicative?'<span class="claim-label">General price guide, not a company quote</span>':''}${p.detail?`<p class="price-conditions">${esc(p.detail)}</p>`:''}${p.excerpt||p.sourceUrl?reference(p):''}</div>`).join('')}</div>` : '';
  const explanation = guide?.body || (service.imported ? serviceGuide(service.name,service.trade) : service.explanation);
  return `<div class="service-explanation">${service.description?`<p class="service-context">${esc(service.description)}</p>`:''}${explanation?`<p>${esc(explanation)}</p>`:''}${options}${guide?.ask?`<div class="service-booking-question"><h4>Before you book</h4><p>${esc(guide.ask)}</p></div>`:''}${service.sourceUrl?`<details class="service-reference"><summary>Service reference</summary>${service.explanation?`<p>${esc(service.explanation)}</p>`:''}<span class="data-source"><a href="${esc(service.sourceUrl)}">View service on company website</a><span>Checked ${esc(String(service.capturedAt||'2026-10-10').slice(0,10))}</span></span></details>`:''}</div>`;
}

function renderServiceRow(service, index) {
  if (!Array.isArray(service.prices)) throw new Error(`Missing pricing state: ${service.name}`);
  if (service.prices.length > 1 && !service.priceSummary) throw new Error(`Missing price summary: ${service.name}`);
  const price = service.imported ? servicePrice(service) : service.priceSummary || service.prices[0]?.price || "Ask for a quote";
  return `<details class="service-rate" id="service-price-${index + 1}"><summary><span class="service-rate-label"><strong>${esc(service.name)}</strong></span><strong class="service-rate-price${service.prices.length ? "" : " service-rate-quote"}"><span class="sr-only">${service.prices.some(p=>!p.indicative) ? "Published price: " : "Pricing: "}</span>${esc(price)}</strong><span class="service-toggle-icon">${icon("chevron")}</span></summary>${renderServiceExplanation(service)}</details>`;
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
  return pageShell({ title: `${config.action} | Roster`, description: `Preview Roster ${config.action.toLowerCase()}. Try the beta account screens with sample details. No account is created and nothing is sent.`, canonicalPath: `/roster/${mode}/`, current: "", jsonLd: [], body, bodyClass: "account-page" });
}

/* ---------- Home ---------- */

function renderHome(grouped) {
  const title = "Roster | Short unpaid lists of home services in Singapore";
  const description = "Find the right help for your home. Compare services, prices and reviews from companies across Singapore.";
  const total = new Set(Object.values(grouped).flat().map(c=>c.slug)).size;
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
<li>${icon("calendar", "ic ic-disc")}<strong>Checked ${esc(checked)}.</strong><span>${total} companies so far. Profiles bring together the services, prices and contact details we could source.</span></li>
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
<h2>Details to help you choose</h2>
<ul class="promise-list">
<li>${icon("phone", "ic")}<strong>Phone and WhatsApp</strong><span>from cited company pages, Google Maps or public registers. Alternate numbers carry source labels.</span></li>
<li>${icon("check", "ic")}<strong>Best for and poor fit</strong><span>in plain words, so you can rule a company out before you call.</span></li>
<li>${icon("dollar", "ic")}<strong>Prices the company publishes</strong><span>with the page, and a note when GST is not stated.</span></li>
<li>${icon("star", "ic ic-star")}<strong>The rating on file</strong><span>with its source and the day it was checked. Roster prints no star score of its own.</span></li>
<li>${icon("quote", "ic")}<strong>Reviews with a name and a date</strong><span>copied as published. A quote with no name or no date is left off.</span></li>
<li>${icon("pin", "ic")}<strong>Address, UEN, and licence claims</strong><span>with sources and verification notes where available.</span></li>
</ul>
</section>`;
  const jsonLd = [
    { "@type": "WebSite", name: "Roster", url: origin + "/", description },
    {
      "@type": "Organization",
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
  const title = "How Roster works | Singapore beta";
  const description = "How the shortlist is ordered, what a Featured slot would be, and why the quote form does not send.";
  const canonicalPath = "/roster/how-it-works/";
  const sections = [
    ["What gets a company on the list", [
      `New profiles need sourced company information, services, a phone number, an address and their own website. Flagged or rolled-back records stay off the site. The original hand-checked profiles retain their write-ups. A rating is optional and always carries its source and capture date. Checked ${checked}.`,
      "A review line needs a name, a date or a relative time, and the page it was copied from. The words stay as published, including rough grammar. A quote with no date stays off the page."
    ]],
    ["How the order is chosen", [
      "Companies are alphabetical by default. You can sort by a captured Google Maps rating or review count, and filter by area, pricing and other details. Company-site and review-mirror ratings are labelled separately and do not affect the Google rating sort. A company cannot pay for a higher position."
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
<p class="dek">One profile per company. Browse by job and compare the details. The order is unpaid.</p>
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
  const output=JSON.stringify({companies:records})+'\n';
  indexVersions[indexName(spec)]=createHash('sha256').update(output).digest('hex').slice(0,12);
  await writeFile(path.join(root,'data/index',indexName(spec)+'.json'),output);
}
await writeIndex({id:'all'},sortCompanies(publishedCompanies));
for (const trade of trades) await writeIndex(trade,grouped[trade.id]);
for (const intent of intents) await writeIndex(intent,grouped[intent.parent].filter(c=>c.services.includes(intent.service)));

written.push(await writePage("", renderHome(grouped)));
written.push(await writePage("how-it-works", renderHow()));
written.push(await writePage("claim-listing", renderClaimPage({esc,icon,pageShell,renderCrumbs},sortCompanies(publishedCompanies))));
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

// Keep previously published, withdrawn URLs useful without restoring excluded profiles.
const retired=[
  {slug:'billy-aircon',name:'Billy Aircon',target:'/roster/aircon-servicing/',trade:'aircon servicing'},
  {slug:'aeon-environmental-services',name:'Aeon Environmental Services',target:'/roster/home-cleaning/',trade:'home cleaning'},
  {slug:'city-cleaning',name:'City Cleaning',target:'/roster/home-cleaning/',trade:'home cleaning'},
  {slug:'greengarden-integrated-services-pte-ltd',name:'Greengarden Integrated Services Pte Ltd',target:'/roster/home-cleaning/',trade:'home cleaning'},
  {slug:'sq-1-development-pte-ltd',name:'SQ 1 Development Pte Ltd',target:'/roster/home-cleaning/',trade:'home cleaning'}
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
const sitemapPaths=currentPaths.filter(p=>! /^(sign-in|sign-up|forgot-password|reset-password)\//.test(p)&&!retired.some(r=>p===`company/${r.slug}/index.html`));
await writeFile(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapPaths.map(p=>`<url><loc>${esc(origin+'/'+p.replace(/index\.html$/,''))}</loc></url>`).join('')}</urlset>\n`);
await writeFile(path.join(root,'robots.txt'),'# Beta preview. Every HTML page also carries noindex.\nUser-agent: *\nDisallow: /roster/\n');
console.log(written.length + " pages");
for (const trade of trades) {
  console.log(trade.id + ": " + grouped[trade.id].length + " profiles");
}

/* BiasDrop - interactive demo */
(function () {
  "use strict";

  const STORAGE_KEY = "biasdrop-wishlist-v1";

  const DROPS = [
    {
      id: "drop-skz",
      title: "STRAY KIDS THIS & THAT Official MD Kit",
      group: "Stray Kids",
      type: "preorder",
      tag: "Pre-order",
      price: 54.99,
      was: 64.99,
      ends: hoursFromNow(38),
      gradient: "g-pink",
      blurb: "Plush keyrings, necklace, mesh long sleeve - full era fit.",
    },
    {
      id: "drop-exo",
      title: "EXO We are DOLL! Mungchiz Pack",
      group: "EXO",
      type: "preorder",
      tag: "Pre-order",
      price: 39.99,
      ends: hoursFromNow(72),
      gradient: "g-gold",
      blurb: "Random figures, badges, monitor dolls. Peak second-gen chaos.",
    },
    {
      id: "drop-aespa",
      title: "aespa Mini Light Keyring Ver.2",
      group: "aespa",
      type: "restock",
      tag: "Restock",
      price: 29.99,
      ends: hoursFromNow(12),
      gradient: "g-cyan",
      blurb: "Pocket-sized glow. Last restock sold out in 11 minutes.",
    },
    {
      id: "drop-bts",
      title: "BTS Official Lightstick Keyring Ver.4",
      group: "BTS",
      type: "restock",
      tag: "Restock",
      price: 32.99,
      ends: hoursFromNow(20),
      gradient: "g-violet",
      blurb: "Army bomb energy on a keyring. Chart-eligible album bundles too.",
    },
    {
      id: "drop-ive",
      title: "IVE × MINIVE Dive Pop-up Exclusive",
      group: "IVE",
      type: "exclusive",
      tag: "Exclusive",
      price: 48.0,
      ends: hoursFromNow(96),
      gradient: "g-rose",
      blurb: "Seoul pop-up exclusive binder + limited PC set. Ships worldwide.",
    },
    {
      id: "drop-enha",
      title: "ENHYPEN Season's Greetings 2026",
      group: "ENHYPEN",
      type: "preorder",
      tag: "Pre-order",
      price: 62.5,
      ends: hoursFromNow(140),
      gradient: "g-night",
      blurb: "Calendar, diary, photocards, desk kit - annual must-buy.",
    },
  ];

  const IDOLS = [
    {
      id: "idol-felix",
      name: "Felix",
      group: "Stray Kids",
      role: "Rapper · Visual · Deep-voice legend",
      tags: ["Baking", "Aussie", "Yongbok"],
      gradient: "g-gold",
      initials: "FX",
    },
    {
      id: "idol-karina",
      name: "Karina",
      group: "aespa",
      role: "Leader · Main dancer · Center",
      tags: ["Metaverse", "Power", "Stage"],
      gradient: "g-cyan",
      initials: "KR",
    },
    {
      id: "idol-jungkook",
      name: "Jungkook",
      group: "BTS",
      role: "Main vocal · Golden maknae",
      tags: ["Solo era", "Golden", "All-rounder"],
      gradient: "g-violet",
      initials: "JK",
    },
    {
      id: "idol-wonyoung",
      name: "Wonyoung",
      group: "IVE",
      role: "Center · Visual · Variety",
      tags: ["Icon", "Fashion", "Aura"],
      gradient: "g-rose",
      initials: "WY",
    },
    {
      id: "idol-yeonjun",
      name: "Yeonjun",
      group: "TXT",
      role: "Performer · Fashion chaos",
      tags: ["4th gen it", "Dance", "Runway"],
      gradient: "g-pink",
      initials: "YJ",
    },
    {
      id: "idol-ningning",
      name: "Ningning",
      group: "aespa",
      role: "Main vocal · High notes",
      tags: ["Vocal", "China line", "Live"],
      gradient: "g-mint",
      initials: "NN",
    },
    {
      id: "idol-san",
      name: "San",
      group: "ATEEZ",
      role: "Performer · Cat energy",
      tags: ["Stage beast", "Abs", "Fangs"],
      gradient: "g-sunset",
      initials: "SN",
    },
    {
      id: "idol-jisoo",
      name: "Jisoo",
      group: "BLACKPINK",
      role: "Visual · Actress · Vocal",
      tags: ["Flower", "Solo", "Dior"],
      gradient: "g-ice",
      initials: "JS",
    },
  ];

  const PRODUCTS = {
    all: [
      { id: "p-ls-skz", name: "SKZ Official Light Stick Ver.2", cat: "lightsticks", price: 59.99, group: "Stray Kids", gradient: "g-pink" },
      { id: "p-ls-aespa", name: "aespa Official Light Stick", cat: "lightsticks", price: 54.99, group: "aespa", gradient: "g-cyan" },
      { id: "p-plush-bbok", name: "BbokAri Costume Plush", cat: "plush", price: 28.99, group: "Stray Kids", gradient: "g-gold" },
      { id: "p-plush-minive", name: "MINIVE Desk Doll Set", cat: "plush", price: 34.5, group: "IVE", gradient: "g-rose" },
      { id: "p-gad-grip", name: "Magnetic Griptok Random", cat: "gadgets", price: 17.99, group: "EXO", gradient: "g-violet" },
      { id: "p-gad-wallet", name: "Photocard Wallet Set", cat: "gadgets", price: 19.99, group: "ENHYPEN", gradient: "g-night" },
      { id: "p-alb-txt", name: "TXT The Star Chapter Album", cat: "albums", price: 24.99, group: "TXT", gradient: "g-mint" },
      { id: "p-alb-bp", name: "BLACKPINK Deadline Photobook", cat: "albums", price: 42.0, group: "BLACKPINK", gradient: "g-ice" },
      { id: "p-fit-mesh", name: "Era Mesh Long Sleeve", cat: "fashion", price: 79.99, group: "Stray Kids", gradient: "g-pink" },
      { id: "p-fit-jersey", name: "Character Baseball Uniform", cat: "fashion", price: 105.99, group: "EXO", gradient: "g-gold" },
      { id: "p-beauty-tint", name: "Idol Lip Tint Collab", cat: "beauty", price: 22.0, group: "aespa", gradient: "g-rose" },
      { id: "p-beauty-kit", name: "Glow Skincare Duo", cat: "beauty", price: 48.0, group: "IVE", gradient: "g-sunset" },
    ],
  };

  const PHOTOCARDS = [
    { id: "pc1", name: "Felix", set: "5-STAR", rarity: "SSR", gradient: "g-gold" },
    { id: "pc2", name: "Karina", set: "Armageddon", rarity: "UR", gradient: "g-cyan" },
    { id: "pc3", name: "Jungkook", set: "GOLDEN", rarity: "SSR", gradient: "g-violet" },
    { id: "pc4", name: "Wonyoung", set: "IVE SWITCH", rarity: "SR", gradient: "g-rose" },
    { id: "pc5", name: "Yeonjun", set: "minisode 3", rarity: "SR", gradient: "g-pink" },
    { id: "pc6", name: "San", set: "GOLDEN HOUR", rarity: "R", gradient: "g-sunset" },
    { id: "pc7", name: "Ningning", set: "Whiplash", rarity: "SSR", gradient: "g-mint" },
    { id: "pc8", name: "Jisoo", set: "AMORTAGE", rarity: "UR", gradient: "g-ice" },
    { id: "pc9", name: "Hyunjin", set: "ATE", rarity: "SR", gradient: "g-night" },
    { id: "pc10", name: "Winter", set: "Drama", rarity: "R", gradient: "g-lime" },
    { id: "pc11", name: "Beomgyu", set: "The Name Chapter", rarity: "SSR", gradient: "g-violet" },
    { id: "pc12", name: "Yujin", set: "HEYA", rarity: "SR", gradient: "g-rose" },
  ];

  const CALENDAR = [
    { date: "Aug 12", title: "ATEEZ world tour film", meta: "Cinema · Limited merch", badge: "Soon" },
    { date: "Aug 18", title: "NewJeans special clip", meta: "Digital drop · PC event", badge: "Teaser" },
    { date: "Aug 22", title: "SEVENTEEN fancon MD", meta: "Pre-order window opens", badge: "MD" },
    { date: "Sep 02", title: "LE SSERAFIM comeback", meta: "Title track + album 4 versions", badge: "CB" },
    { date: "Sep 10", title: "Seoul Sanrio × K-pop fest", meta: "Collab booths · Lucky draw", badge: "Pop-up" },
  ];

  const CHARTS = [
    { rank: 1, title: "Supernova (Remix)", artist: "aespa" },
    { rank: 2, title: "Chk Chk Boom", artist: "Stray Kids" },
    { rank: 3, title: "Who", artist: "Jimin" },
    { rank: 4, title: "Magnetic", artist: "ILLIT" },
    { rank: 5, title: "Home Work", artist: "TXT" },
  ];

  const INTEL = [
    {
      label: "Pop-up",
      title: "THIS & THAT Seoul zone",
      body: "Photo zones, exclusive keyrings, and a night-only lucky draw. Queue apps recommended.",
    },
    {
      label: "Collector tip",
      title: "Sleeve your SSRs",
      body: "Penny sleeve + top loader + binder ring guards. Humidity is the enemy of holograms.",
    },
    {
      label: "Stan culture",
      title: "Bias protection 101",
      body: "Mute the anti tags, stream the title track, and never reveal your full binder value in public.",
    },
  ];

  const QUIZ = [
    {
      q: "Friday night energy?",
      options: [
        { t: "Dome concert, light stick up", scores: { performer: 2, vocal: 1 } },
        { t: "Vinyl + headphones, eyes closed", scores: { vocal: 2, soft: 1 } },
        { t: "Fashion week front row energy", scores: { visual: 2, performer: 1 } },
        { t: "Late-night variety clips on loop", scores: { chaos: 2, soft: 1 } },
      ],
    },
    {
      q: "Your ideal bias sends you…",
      options: [
        { t: "A deep-voice ASMR goodnight", scores: { soft: 2, vocal: 1 } },
        { t: "A fancam that breaks the internet", scores: { performer: 2, visual: 1 } },
        { t: "A chaotic live eating snacks", scores: { chaos: 2, soft: 1 } },
        { t: "A high note that rearranges your soul", scores: { vocal: 2, performer: 1 } },
      ],
    },
    {
      q: "Merch budget mood?",
      options: [
        { t: "One legendary light stick", scores: { performer: 2 } },
        { t: "Binder full of photocards", scores: { visual: 2, soft: 1 } },
        { t: "Plush mountain on the bed", scores: { soft: 2, chaos: 1 } },
        { t: "Every album version. Charting.", scores: { vocal: 1, chaos: 2 } },
      ],
    },
    {
      q: "Pick an aesthetic",
      options: [
        { t: "Neon cyber / metaverse", scores: { visual: 2, performer: 1 } },
        { t: "Soft pastel bakery", scores: { soft: 2 } },
        { t: "Black stage smoke + lasers", scores: { performer: 2, vocal: 1 } },
        { t: "Y2K stickers everywhere", scores: { chaos: 2, visual: 1 } },
      ],
    },
  ];

  const QUIZ_RESULTS = {
    performer: {
      name: "San",
      group: "ATEEZ",
      vibe: "Stage beast energy",
      blurb: "You crave impact. Fancams, formations, and that one move that makes the crowd lose it.",
      kit: ["Official light stick", "Tour tee", "SSR stage PC"],
      gradient: "g-sunset",
    },
    vocal: {
      name: "Ningning",
      group: "aespa",
      vibe: "High-note heartbreak",
      blurb: "Live vocals first. You stream the high notes and argue about stability in the comments.",
      kit: ["Album random PC", "Mini light keyring", "Season's greetings"],
      gradient: "g-mint",
    },
    visual: {
      name: "Wonyoung",
      group: "IVE",
      vibe: "Main character aura",
      blurb: "Aesthetic is a lifestyle. Mag covers, fashion MD, and photocards that glow different.",
      kit: ["Photobook", "Fashion MD jersey", "UR concept PC"],
      gradient: "g-rose",
    },
    soft: {
      name: "Felix",
      group: "Stray Kids",
      vibe: "Soft chaos, deep voice",
      blurb: "You want comfort bias energy - plushies, baking lives, and voice notes for the soul.",
      kit: ["BbokAri plush", "Voice keyring", "Season bakery PC"],
      gradient: "g-gold",
    },
    chaos: {
      name: "Yeonjun",
      group: "TXT",
      vibe: "Fashion chaos agent",
      blurb: "Predictable is boring. You collect weird collabs, limited drops, and unhinged live moments.",
      kit: ["Random griptok", "Era hoodie", "Lucky draw ticket"],
      gradient: "g-pink",
    },
  };

  /* ---------- helpers ---------- */
  function hoursFromNow(h) {
    return Date.now() + h * 3600 * 1000;
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function formatMoney(n) {
    return "$" + n.toFixed(2);
  }

  function formatCountdown(ms) {
    const t = Math.max(0, ms - Date.now());
    const h = Math.floor(t / 3600000);
    const m = Math.floor((t % 3600000) / 60000);
    const s = Math.floor((t % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function heartSvg(filled) {
    return filled
      ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.2-4.6-9.5-8.2C.5 9.5 2.2 5.8 6 5.2c2-.3 3.8.7 4.8 2.2 1-1.5 2.8-2.5 4.8-2.2 3.8.6 5.5 4.3 3.5 7.6C19.2 16.4 12 21 12 21z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
  }

  function loadWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveWishlist(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  let wishlist = loadWishlist();
  let currentFilter = "all";
  let currentCat = "all";
  let quizIndex = 0;
  let quizScores = {};
  let toastTimer;

  /* ---------- render ---------- */
  function renderDrops() {
    const grid = $("#drop-grid");
    if (!grid) return;
    const items = DROPS.filter((d) => currentFilter === "all" || d.type === currentFilter);
    grid.innerHTML = items
      .map(
        (d) => `
      <article class="drop-card" data-id="${d.id}">
        <div class="drop-art ${d.gradient}">
          <span class="art-label">${d.group}</span>
        </div>
        <div class="drop-body">
          <div class="drop-meta">
            <span>${d.tag}</span>
            <span class="countdown" data-ends="${d.ends}">${formatCountdown(d.ends)}</span>
          </div>
          <h3>${d.title}</h3>
          <p>${d.blurb}</p>
          <div class="drop-foot">
            <div class="price">${formatMoney(d.price)}${d.was ? ` <s>${formatMoney(d.was)}</s>` : ""}</div>
            <button type="button" class="wish-btn ${isWished(d.id) ? "on" : ""}" data-wish='${escapeAttr(JSON.stringify(wishPayload(d, "drop")))}' aria-label="Add ${d.title} to wishlist" aria-pressed="${isWished(d.id)}">
              ${heartSvg(isWished(d.id))}
            </button>
          </div>
        </div>
      </article>`
      )
      .join("");
  }

  function renderIdols() {
    const rail = $("#idol-rail");
    if (!rail) return;
    rail.innerHTML = IDOLS.map(
      (i) => `
      <article class="idol-card">
        <div class="idol-avatar ${i.gradient}">
          <span class="initials">${i.initials}</span>
          <span class="group-chip">${i.group}</span>
        </div>
        <div class="idol-info">
          <h3>${i.name}</h3>
          <p class="role">${i.role}</p>
          <div class="idol-tags">${i.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
          <div class="idol-actions">
            <button type="button" class="btn btn-sm btn-neon bias-btn" data-bias="${i.name}">Set as bias</button>
            <button type="button" class="btn btn-sm btn-ghost wish-btn-text" data-wish='${escapeAttr(JSON.stringify(wishPayload({ id: i.id, title: i.name + " merch universe", price: 0, group: i.group, gradient: i.gradient }, "idol")))}'>Stash</button>
          </div>
        </div>
      </article>`
    ).join("");
  }

  function renderProducts() {
    const grid = $("#product-grid");
    const title = $("#product-panel-title");
    const sub = $("#product-panel-sub");
    if (!grid) return;
    const labels = {
      all: "Featured loot",
      lightsticks: "Light sticks",
      plush: "Plush & dolls",
      gadgets: "Gadgets",
      albums: "Albums",
      fashion: "Fashion MD",
      beauty: "K-beauty collabs",
    };
    const list =
      currentCat === "all"
        ? PRODUCTS.all.slice(0, 8)
        : PRODUCTS.all.filter((p) => p.cat === currentCat);
    if (title) title.textContent = labels[currentCat] || "Featured loot";
    if (sub)
      sub.textContent =
        currentCat === "all"
          ? "Tap a category above or wishlist anything that makes your heart race."
          : `Showing ${list.length} demo items in ${labels[currentCat]}.`;
    grid.innerHTML = list
      .map(
        (p) => `
      <article class="product-card">
        <div class="product-art ${p.gradient}">${p.group}</div>
        <div class="product-body">
          <h4>${p.name}</h4>
          <div class="meta">${p.group} · ${p.cat}</div>
          <div class="product-foot">
            <span class="price">${formatMoney(p.price)}</span>
            <button type="button" class="wish-btn ${isWished(p.id) ? "on" : ""}" data-wish='${escapeAttr(JSON.stringify(wishPayload({ id: p.id, title: p.name, price: p.price, group: p.group, gradient: p.gradient }, "product")))}' aria-label="Wishlist ${p.name}" aria-pressed="${isWished(p.id)}">
              ${heartSvg(isWished(p.id))}
            </button>
          </div>
        </div>
      </article>`
      )
      .join("");
  }

  function renderPhotocards() {
    const grid = $("#pc-grid");
    if (!grid) return;
    grid.innerHTML = PHOTOCARDS.map(
      (pc) => `
      <article class="pc-card ${pc.rarity === "UR" || pc.rarity === "SSR" ? "holographic" : ""}">
        <div class="pc-face ${pc.gradient}">
          <span class="pc-rarity rarity ${pc.rarity.toLowerCase()}">${pc.rarity}</span>
          <span class="pc-name">${pc.name}</span>
        </div>
        <div class="pc-meta">
          <strong>${pc.name}</strong>
          <span>${pc.set}</span>
          <button type="button" class="btn btn-sm btn-ghost" style="margin-top:0.35rem" data-wish='${escapeAttr(JSON.stringify(wishPayload({ id: pc.id, title: pc.name + " · " + pc.set + " PC", price: pc.rarity === "UR" ? 89 : pc.rarity === "SSR" ? 45 : pc.rarity === "SR" ? 18 : 8, group: pc.set, gradient: pc.gradient }, "pc")))}'>
            Wishlist
          </button>
        </div>
      </article>`
    ).join("");
  }

  function renderPulse() {
    const cal = $("#calendar-list");
    const chart = $("#chart-list");
    const intel = $("#intel-cards");
    if (cal) {
      cal.innerHTML = CALENDAR.map(
        (c) => `
        <li>
          <span class="cal-date">${c.date}</span>
          <div class="cal-info"><strong>${c.title}</strong><span>${c.meta}</span></div>
          <span class="cal-badge">${c.badge}</span>
        </li>`
      ).join("");
    }
    if (chart) {
      chart.innerHTML = CHARTS.map(
        (c) => `
        <li>
          <span class="chart-rank">${c.rank}</span>
          <div class="chart-info"><strong>${c.title}</strong><span>${c.artist}</span></div>
          <span class="cal-badge">Pulse</span>
        </li>`
      ).join("");
    }
    if (intel) {
      intel.innerHTML = INTEL.map(
        (i) => `
        <article class="intel-card">
          <div class="label">${i.label}</div>
          <h4>${i.title}</h4>
          <p>${i.body}</p>
        </article>`
      ).join("");
    }
  }

  function wishPayload(item, kind) {
    return {
      id: item.id,
      title: item.title || item.name,
      price: item.price || 0,
      group: item.group || "",
      gradient: item.gradient || "g-violet",
      kind,
    };
  }

  function isWished(id) {
    return wishlist.some((w) => w.id === id);
  }

  function escapeAttr(str) {
    return str.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
  }

  function updateWishlistUI() {
    const count = $("#wishlist-count");
    if (count) count.textContent = String(wishlist.length);
    renderStash();
    renderDrawer();
    // refresh heart states without full re-render of everything heavy
    $$("[data-wish]").forEach((btn) => {
      try {
        const data = JSON.parse(btn.getAttribute("data-wish").replace(/&#39;/g, "'"));
        const on = isWished(data.id);
        btn.classList.toggle("on", on);
        btn.setAttribute("aria-pressed", String(on));
        if (btn.classList.contains("wish-btn")) btn.innerHTML = heartSvg(on);
      } catch {
        /* ignore */
      }
    });
  }

  function renderStash() {
    const grid = $("#stash-grid");
    if (!grid) return;
    if (!wishlist.length) {
      grid.innerHTML =
        '<p class="empty-state" id="stash-empty">Nothing stashed yet. Go heart some loot - your wallet can cry later.</p>';
      return;
    }
    grid.innerHTML = wishlist
      .map(
        (w) => `
      <div class="stash-item">
        <div class="stash-swatch ${w.gradient}">${(w.group || "★").slice(0, 6)}</div>
        <div style="flex:1;min-width:0">
          <strong>${w.title}</strong>
          <span>${w.group || w.kind}${w.price ? " · " + formatMoney(w.price) : ""}</span>
        </div>
        <button type="button" class="wish-btn on" data-remove="${w.id}" aria-label="Remove ${w.title}">
          ${heartSvg(true)}
        </button>
      </div>`
      )
      .join("");
  }

  function renderDrawer() {
    const body = $("#drawer-body");
    if (!body) return;
    if (!wishlist.length) {
      body.innerHTML = '<p class="empty-state">Wishlist is empty. Heart drops, loot, or photocards.</p>';
      return;
    }
    body.innerHTML =
      wishlist
        .map(
          (w) => `
      <div class="stash-item">
        <div class="stash-swatch ${w.gradient}">${(w.group || "★").slice(0, 4)}</div>
        <div style="flex:1;min-width:0">
          <strong>${w.title}</strong>
          <span>${w.price ? formatMoney(w.price) : "Saved"}</span>
        </div>
        <button type="button" class="btn btn-sm btn-ghost" data-remove="${w.id}">Remove</button>
      </div>`
        )
        .join("") +
      `<p style="color:var(--muted);font-size:0.85rem;margin-top:0.5rem">Demo only - no checkout. Total vibe: ${formatMoney(
        wishlist.reduce((s, w) => s + (w.price || 0), 0)
      )}</p>`;
  }

  function toggleWish(item) {
    const idx = wishlist.findIndex((w) => w.id === item.id);
    if (idx >= 0) {
      wishlist.splice(idx, 1);
      toast("Removed from stash");
    } else {
      wishlist.unshift(item);
      toast("Stashed · " + item.title);
    }
    saveWishlist(wishlist);
    updateWishlistUI();
  }

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2400);
  }

  /* ---------- pack pull ---------- */
  function weightedPull() {
    const roll = Math.random();
    let rarity = "R";
    if (roll > 0.97) rarity = "UR";
    else if (roll > 0.85) rarity = "SSR";
    else if (roll > 0.55) rarity = "SR";
    const pool = PHOTOCARDS.filter((p) => p.rarity === rarity);
    const pick = pool[Math.floor(Math.random() * pool.length)] || PHOTOCARDS[0];
    return pick;
  }

  function openPackModal() {
    const modal = $("#pack-modal");
    const result = $("#pull-result");
    const again = $("#pack-again");
    const box = $("#pack-box");
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (result) result.hidden = true;
    if (again) again.hidden = true;
    if (box) {
      box.hidden = false;
      box.classList.remove("opening");
    }
  }

  function closePackModal() {
    const modal = $("#pack-modal");
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
  }

  function doPull() {
    const box = $("#pack-box");
    const result = $("#pull-result");
    const again = $("#pack-again");
    if (!box || !result) return;
    box.classList.add("opening");
    setTimeout(() => {
      const pull = weightedPull();
      box.hidden = true;
      result.hidden = false;
      if (again) again.hidden = false;
      result.innerHTML = `
        <div class="pull-art ${pull.gradient} holographic">
          <span class="rarity ${pull.rarity.toLowerCase()}" style="position:absolute;top:8px;right:8px">${pull.rarity}</span>
          ${pull.name}
        </div>
        <h3>You pulled ${pull.name}!</h3>
        <p>${pull.set} · ${pull.rarity} rarity (demo RNG)</p>
        <button type="button" class="btn btn-sm btn-neon" style="margin-top:0.75rem" data-wish='${escapeAttr(
          JSON.stringify(
            wishPayload(
              {
                id: "pull-" + pull.id + "-" + Date.now(),
                title: "Pulled · " + pull.name + " " + pull.rarity,
                price: pull.rarity === "UR" ? 89 : pull.rarity === "SSR" ? 45 : 12,
                group: pull.set,
                gradient: pull.gradient,
              },
              "pull"
            )
          )
        )}'>Stash this pull</button>`;
    }, 480);
  }

  /* ---------- quiz ---------- */
  function startQuiz() {
    quizIndex = 0;
    quizScores = { performer: 0, vocal: 0, visual: 0, soft: 0, chaos: 0 };
    $("#quiz-intro").hidden = true;
    $("#quiz-result").hidden = true;
    $("#quiz-play").hidden = false;
    showQuizStep();
  }

  function showQuizStep() {
    const step = QUIZ[quizIndex];
    $("#quiz-step").textContent = `Question ${quizIndex + 1} of ${QUIZ.length}`;
    $("#quiz-bar").style.width = ((quizIndex + 1) / QUIZ.length) * 100 + "%";
    $("#quiz-question").textContent = step.q;
    const opts = $("#quiz-options");
    opts.innerHTML = step.options
      .map(
        (o, i) =>
          `<button type="button" class="quiz-opt" data-opt="${i}">${o.t}</button>`
      )
      .join("");
  }

  function answerQuiz(optIndex) {
    const opt = QUIZ[quizIndex].options[optIndex];
    Object.keys(opt.scores).forEach((k) => {
      quizScores[k] = (quizScores[k] || 0) + opt.scores[k];
    });
    quizIndex++;
    if (quizIndex >= QUIZ.length) finishQuiz();
    else showQuizStep();
  }

  function finishQuiz() {
    let best = "soft";
    let max = -1;
    Object.keys(quizScores).forEach((k) => {
      if (quizScores[k] > max) {
        max = quizScores[k];
        best = k;
      }
    });
    const r = QUIZ_RESULTS[best];
    $("#quiz-play").hidden = true;
    $("#quiz-result").hidden = false;
    $("#result-card").innerHTML = `
      <div class="result-hero ${r.gradient}">
        <span>${r.group}</span>
        <h3>${r.name}</h3>
        <span>${r.vibe}</span>
      </div>
      <div class="result-body">
        <p>${r.blurb}</p>
        <div class="result-kit">${r.kit.map((k) => `<span class="tag">${k}</span>`).join("")}</div>
      </div>`;
  }

  /* ---------- sparkles ---------- */
  function spawnSparks() {
    const layer = $("#spark-layer");
    if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < 28; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 3 + "s";
      s.style.background = Math.random() > 0.5 ? "var(--cyan)" : "var(--pink)";
      layer.appendChild(s);
    }
  }

  /* ---------- events ---------- */
  function bindEvents() {
    // mobile nav
    const toggle = $("#nav-toggle");
    const mobile = $("#mobile-nav");
    if (toggle && mobile) {
      toggle.addEventListener("click", () => {
        const open = mobile.hidden;
        mobile.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
      });
      mobile.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          mobile.hidden = true;
          toggle.setAttribute("aria-expanded", "false");
        })
      );
    }

    // filters
    $$(".filter-pills .pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        $$(".filter-pills .pill").forEach((p) => {
          p.classList.remove("active");
          p.setAttribute("aria-selected", "false");
        });
        pill.classList.add("active");
        pill.setAttribute("aria-selected", "true");
        currentFilter = pill.dataset.filter;
        renderDrops();
      });
    });

    // categories
    $$(".cat-card").forEach((card) => {
      card.addEventListener("click", () => {
        currentCat = card.dataset.cat || "all";
        renderProducts();
        $("#product-grid")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });

    // delegated clicks
    document.addEventListener("click", (e) => {
      const wishEl = e.target.closest("[data-wish]");
      if (wishEl) {
        e.preventDefault();
        try {
          const raw = wishEl.getAttribute("data-wish").replace(/&#39;/g, "'");
          toggleWish(JSON.parse(raw));
        } catch {
          /* ignore */
        }
        return;
      }

      const removeEl = e.target.closest("[data-remove]");
      if (removeEl) {
        const id = removeEl.getAttribute("data-remove");
        wishlist = wishlist.filter((w) => w.id !== id);
        saveWishlist(wishlist);
        updateWishlistUI();
        toast("Removed from stash");
        return;
      }

      const biasBtn = e.target.closest(".bias-btn");
      if (biasBtn) {
        toast("Bias set · " + biasBtn.dataset.bias + " ✨");
        return;
      }

      const opt = e.target.closest(".quiz-opt");
      if (opt) {
        answerQuiz(Number(opt.dataset.opt));
      }
    });

    $("#wishlist-btn")?.addEventListener("click", () => {
      const d = $("#wishlist-drawer");
      if (!d) return;
      d.hidden = false;
      document.body.style.overflow = "hidden";
      renderDrawer();
    });

    $$("[data-close-drawer]").forEach((el) =>
      el.addEventListener("click", () => {
        $("#wishlist-drawer").hidden = true;
        document.body.style.overflow = "";
      })
    );

    $("#open-pack-btn")?.addEventListener("click", openPackModal);
    $("#open-pack-btn-2")?.addEventListener("click", openPackModal);
    $$("#pack-modal [data-close]").forEach((el) => el.addEventListener("click", closePackModal));
    $("#pack-box")?.addEventListener("click", doPull);
    $("#pack-again")?.addEventListener("click", () => {
      const box = $("#pack-box");
      const result = $("#pull-result");
      const again = $("#pack-again");
      if (result) result.hidden = true;
      if (again) again.hidden = true;
      if (box) {
        box.hidden = false;
        box.classList.remove("opening");
      }
    });

    $("#quiz-start")?.addEventListener("click", startQuiz);
    $("#quiz-again")?.addEventListener("click", startQuiz);

    $("#clear-wishlist")?.addEventListener("click", () => {
      if (!wishlist.length) return;
      wishlist = [];
      saveWishlist(wishlist);
      updateWishlistUI();
      toast("Stash cleared");
    });

    $("#cta-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = $("#cta-note");
      if (note) note.textContent = "You're on the pulse list (demo). No email was stored.";
      e.target.reset();
    });

    // countdown tick
    setInterval(() => {
      $$(".countdown[data-ends]").forEach((el) => {
        el.textContent = formatCountdown(Number(el.dataset.ends));
      });
    }, 1000);

    // escape closes modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closePackModal();
        const d = $("#wishlist-drawer");
        if (d) {
          d.hidden = true;
          document.body.style.overflow = "";
        }
      }
    });
  }

  function init() {
    spawnSparks();
    renderDrops();
    renderIdols();
    renderProducts();
    renderPhotocards();
    renderPulse();
    updateWishlistUI();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

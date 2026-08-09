/* BiasDrop - interactive demo with Pexels + free stock video media + i18n */
(function () {
  "use strict";

  const M = window.BiasDropMedia;
  const I18n = window.BiasDropI18n;
  if (!M || !I18n) {
    console.error("BiasDropMedia / BiasDropI18n missing - load media.js + i18n.js first");
    return;
  }
  const P = M.photos;
  const t = (k, v) => I18n.t(k, v);

  /** Official YouTube MV thumbnail as artist image (public thumb URL) */
  function ytImg(videoId, label) {
    return {
      src: "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg",
      srcSm: "https://i.ytimg.com/vi/" + videoId + "/mqdefault.jpg",
      photographer: "YouTube · official MV",
      photographerUrl: "https://www.youtube.com/watch?v=" + videoId,
      url: "https://www.youtube.com/watch?v=" + videoId,
      desc: (label || "Official music video") + " thumbnail",
    };
  }


  const STORAGE_KEY = "biasdrop-wishlist-v1";


  function tagFor(type) {
    if (type === "preorder") return t("tag_preorder");
    if (type === "restock") return t("tag_restock");
    if (type === "exclusive") return t("tag_exclusive");
    return type;
  }

  function getDrops() {
    return [
      { id: "drop-skz", titleKey: "drop_skz_t", blurbKey: "drop_skz_b", group: "Stray Kids", type: "preorder", price: 54.99, was: 64.99, ends: hoursFromNow(38), photo: P.concertHands },
      { id: "drop-exo", titleKey: "drop_exo_t", blurbKey: "drop_exo_b", group: "EXO", type: "preorder", price: 39.99, ends: hoursFromNow(72), photo: P.plushPink },
      { id: "drop-aespa", titleKey: "drop_aespa_t", blurbKey: "drop_aespa_b", group: "aespa", type: "restock", price: 29.99, ends: hoursFromNow(12), photo: P.neonLove },
      { id: "drop-bts", titleKey: "drop_bts_t", blurbKey: "drop_bts_b", group: "BTS", type: "restock", price: 32.99, ends: hoursFromNow(20), photo: P.concertCrowd },
      { id: "drop-ive", titleKey: "drop_ive_t", blurbKey: "drop_ive_b", group: "IVE", type: "exclusive", price: 48.0, ends: hoursFromNow(96), photo: P.seoulStreet },
      { id: "drop-enha", titleKey: "drop_enha_t", blurbKey: "drop_enha_b", group: "ENHYPEN", type: "preorder", price: 62.5, ends: hoursFromNow(140), photo: P.stageMic },
    ].map((d) => ({
      ...d,
      title: t(d.titleKey),
      blurb: t(d.blurbKey),
      tag: tagFor(d.type),
    }));
  }

  function getIdols() {
    return [
      { id: "idol-felix", name: "Felix", group: "Stray Kids", roleKey: "idol_felix_r", tags: ["Baking", "Aussie", "Yongbok"], photo: ytImg("OvioeS1ZZ7o", "Stray Kids MANIAC / Felix era"), initials: "FX", artistPath: "stray-kids" },
      { id: "idol-karina", name: "Karina", group: "aespa", roleKey: "idol_karina_r", tags: ["Metaverse", "Power", "Stage"], photo: ytImg("4TWR90KJl84", "aespa Next Level / Karina"), initials: "KR", artistPath: "aespa" },
      { id: "idol-jungkook", name: "Jungkook", group: "BTS", roleKey: "idol_jk_r", tags: ["Solo era", "Golden", "All-rounder"], photo: ytImg("QU9c0053UAU", "Jungkook Seven official MV"), initials: "JK", artistPath: "bts" },
      { id: "idol-wonyoung", name: "Wonyoung", group: "IVE", roleKey: "idol_wy_r", tags: ["Icon", "Fashion", "Aura"], photo: ytImg("Y8JFxS1HlDo", "IVE LOVE DIVE / Wonyoung"), initials: "WY", artistPath: "ive" },
      { id: "idol-yeonjun", name: "Yeonjun", group: "TXT", roleKey: "idol_yj_r", tags: ["4th gen it", "Dance", "Runway"], photo: ytImg("AG-erEMhumc", "TXT 0X1=LOVESONG / Yeonjun"), initials: "YJ", artistPath: "txt" },
      { id: "idol-ningning", name: "Ningning", group: "aespa", roleKey: "idol_nn_r", tags: ["Vocal", "China line", "Live"], photo: ytImg("Os_heh8vPfs", "aespa Spicy / Ningning"), initials: "NN", artistPath: "aespa" },
      { id: "idol-san", name: "San", group: "ATEEZ", roleKey: "idol_san_r", tags: ["Stage beast", "Abs", "Fangs"], photo: ytImg("UOxkGD8qRB4", "ATEEZ Answer / San"), initials: "SN", artistPath: "ateez" },
      { id: "idol-jisoo", name: "Jisoo", group: "BLACKPINK", roleKey: "idol_jisoo_r", tags: ["Flower", "Solo", "Dior"], photo: ytImg("gQlMMD8auMs", "BLACKPINK Pink Venom / Jisoo"), initials: "JS", artistPath: "blackpink" },
    ].map((i) => ({ ...i, role: t(i.roleKey) }));
  }

  function getProducts() {
    return [
      { id: "p-ls-skz", nameKey: "p_ls_skz", cat: "lightsticks", price: 59.99, group: "Stray Kids", photo: P.concertHands },
      { id: "p-ls-aespa", nameKey: "p_ls_aespa", cat: "lightsticks", price: 54.99, group: "aespa", photo: P.neonLove },
      { id: "p-plush-bbok", nameKey: "p_plush_bbok", cat: "plush", price: 28.99, group: "Stray Kids", photo: P.plushPink },
      { id: "p-plush-minive", nameKey: "p_plush_minive", cat: "plush", price: 34.5, group: "IVE", photo: P.plushShelf },
      { id: "p-gad-grip", nameKey: "p_gad_grip", cat: "gadgets", price: 17.99, group: "EXO", photo: P.polaroidPink },
      { id: "p-gad-wallet", nameKey: "p_gad_wallet", cat: "gadgets", price: 19.99, group: "ENHYPEN", photo: P.gadgetsTablet },
      { id: "p-alb-txt", nameKey: "p_alb_txt", cat: "albums", price: 24.99, group: "TXT", photo: P.vinylStack },
      { id: "p-alb-bp", nameKey: "p_alb_bp", cat: "albums", price: 42.0, group: "BLACKPINK", photo: P.cdsBox },
      { id: "p-fit-mesh", nameKey: "p_fit_mesh", cat: "fashion", price: 79.99, group: "Stray Kids", photo: P.boomboxPink },
      { id: "p-fit-jersey", nameKey: "p_fit_jersey", cat: "fashion", price: 105.99, group: "EXO", photo: P.fashionWoman3 },
      { id: "p-beauty-tint", nameKey: "p_beauty_tint", cat: "beauty", price: 22.0, group: "aespa", photo: P.beautyLip },
      { id: "p-beauty-kit", nameKey: "p_beauty_kit", cat: "beauty", price: 48.0, group: "IVE", photo: P.beautyFlat },
    ].map((p) => ({ ...p, name: t(p.nameKey) }));
  }

  function getPhotocards() {
    return [
      { id: "pc1", name: "Felix", set: "5-STAR", rarity: "SSR", photo: ytImg("OvioeS1ZZ7o", "Felix") },
      { id: "pc2", name: "Karina", set: "Armageddon", rarity: "UR", photo: ytImg("4TWR90KJl84", "Karina") },
      { id: "pc3", name: "Jungkook", set: "GOLDEN", rarity: "SSR", photo: ytImg("QU9c0053UAU", "Jungkook") },
      { id: "pc4", name: "Wonyoung", set: "IVE SWITCH", rarity: "SR", photo: ytImg("Y8JFxS1HlDo", "Wonyoung") },
      { id: "pc5", name: "Yeonjun", set: "minisode 3", rarity: "SR", photo: ytImg("AG-erEMhumc", "Yeonjun") },
      { id: "pc6", name: "San", set: "GOLDEN HOUR", rarity: "R", photo: ytImg("UOxkGD8qRB4", "San") },
      { id: "pc7", name: "Ningning", set: "Whiplash", rarity: "SSR", photo: ytImg("Os_heh8vPfs", "Ningning") },
      { id: "pc8", name: "Jisoo", set: "AMORTAGE", rarity: "UR", photo: ytImg("gQlMMD8auMs", "Jisoo") },
      { id: "pc9", name: "Hyunjin", set: "ATE", rarity: "SR", photo: ytImg("jYSlpC6Ud2A", "Hyunjin") },
      { id: "pc10", name: "Winter", set: "Drama", rarity: "R", photo: ytImg("WPdWvnAAurg", "Winter") },
      { id: "pc11", name: "Beomgyu", set: "The Name Chapter", rarity: "SSR", photo: ytImg("AG-erEMhumc", "Beomgyu") },
      { id: "pc12", name: "Yujin", set: "HEYA", rarity: "SR", photo: ytImg("6ZUIwj3FgUY", "Yujin") },
    ];
  }

  function getCalendar() {
    return [
      { date: "Aug 12", titleKey: "cal1_t", metaKey: "cal1_m", badgeKey: "badge_soon" },
      { date: "Aug 18", titleKey: "cal2_t", metaKey: "cal2_m", badgeKey: "badge_teaser" },
      { date: "Aug 22", titleKey: "cal3_t", metaKey: "cal3_m", badgeKey: "badge_md" },
      { date: "Sep 02", titleKey: "cal4_t", metaKey: "cal4_m", badgeKey: "badge_cb" },
      { date: "Sep 10", titleKey: "cal5_t", metaKey: "cal5_m", badgeKey: "badge_popup" },
    ].map((c) => ({ date: c.date, title: t(c.titleKey), meta: t(c.metaKey), badge: t(c.badgeKey) }));
  }

  const CHARTS = [
    { rank: 1, title: "Supernova (Remix)", artist: "aespa" },
    { rank: 2, title: "Chk Chk Boom", artist: "Stray Kids" },
    { rank: 3, title: "Who", artist: "Jimin" },
    { rank: 4, title: "Magnetic", artist: "ILLIT" },
    { rank: 5, title: "Home Work", artist: "TXT" },
  ];

  function getIntel() {
    return [
      { labelKey: "intel1_l", titleKey: "intel1_t", bodyKey: "intel1_b", photo: P.seoulNeon },
      { labelKey: "intel2_l", titleKey: "intel2_t", bodyKey: "intel2_b", photo: P.cardsCase },
      { labelKey: "intel3_l", titleKey: "intel3_t", bodyKey: "intel3_b", photo: P.concertFan },
    ].map((i) => ({ label: t(i.labelKey), title: t(i.titleKey), body: t(i.bodyKey), photo: i.photo }));
  }

  const CAT_PHOTOS = {
    lightsticks: P.concertCrowd,
    plush: P.plushShelf,
    gadgets: P.gadgetsPink,
    albums: P.vinylWall,
    fashion: P.boomboxPink,
    beauty: P.beautyKit,
  };

  function getQuiz() {
    return [
      { q: t("q1"), options: [
        { t: t("q1_a"), scores: { performer: 2, vocal: 1 } },
        { t: t("q1_b"), scores: { vocal: 2, soft: 1 } },
        { t: t("q1_c"), scores: { visual: 2, performer: 1 } },
        { t: t("q1_d"), scores: { chaos: 2, soft: 1 } },
      ]},
      { q: t("q2"), options: [
        { t: t("q2_a"), scores: { soft: 2, vocal: 1 } },
        { t: t("q2_b"), scores: { performer: 2, visual: 1 } },
        { t: t("q2_c"), scores: { chaos: 2, soft: 1 } },
        { t: t("q2_d"), scores: { vocal: 2, performer: 1 } },
      ]},
      { q: t("q3"), options: [
        { t: t("q3_a"), scores: { performer: 2 } },
        { t: t("q3_b"), scores: { visual: 2, soft: 1 } },
        { t: t("q3_c"), scores: { soft: 2, chaos: 1 } },
        { t: t("q3_d"), scores: { vocal: 1, chaos: 2 } },
      ]},
      { q: t("q4"), options: [
        { t: t("q4_a"), scores: { visual: 2, performer: 1 } },
        { t: t("q4_b"), scores: { soft: 2 } },
        { t: t("q4_c"), scores: { performer: 2, vocal: 1 } },
        { t: t("q4_d"), scores: { chaos: 2, visual: 1 } },
      ]},
    ];
  }

  function getQuizResults() {
    return {
      performer: { name: "San", group: "ATEEZ", vibe: t("res_performer_v"), blurb: t("res_performer_b"), kit: [t("kit_ls"), t("kit_tee"), t("kit_ssr")], photo: ytImg("UOxkGD8qRB4", "San") },
      vocal: { name: "Ningning", group: "aespa", vibe: t("res_vocal_v"), blurb: t("res_vocal_b"), kit: [t("kit_pc"), t("kit_key"), t("kit_sg")], photo: ytImg("Os_heh8vPfs", "Ningning") },
      visual: { name: "Wonyoung", group: "IVE", vibe: t("res_visual_v"), blurb: t("res_visual_b"), kit: [t("kit_pb"), t("kit_jersey"), t("kit_ur")], photo: ytImg("Y8JFxS1HlDo", "Wonyoung") },
      soft: { name: "Felix", group: "Stray Kids", vibe: t("res_soft_v"), blurb: t("res_soft_b"), kit: [t("kit_plush"), t("kit_voice"), t("kit_bakery")], photo: ytImg("OvioeS1ZZ7o", "Felix") },
      chaos: { name: "Yeonjun", group: "TXT", vibe: t("res_chaos_v"), blurb: t("res_chaos_b"), kit: [t("kit_grip"), t("kit_hoodie"), t("kit_lucky")], photo: ytImg("AG-erEMhumc", "Yeonjun") },
    };
  }

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

  function imgTag(photo, context, className, extra) {
    const a = M.attrs(photo, context);
    const cls = className ? ` class="${className}"` : "";
    const loading = (extra && extra.eager) ? "eager" : "lazy";
    const sizes = (extra && extra.sizes) || "(max-width: 700px) 90vw, 400px";
    return `<img${cls} src="${a.src}" srcset="${a.srcset}" sizes="${sizes}" alt="${escapeHtml(a.alt)}" title="${escapeHtml(a.title)}" loading="${loading}" decoding="async" width="900" height="650">`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(str) {
    return str.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
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

  function imgUrl(photo) {
    return photo ? photo.src : "";
  }

  /* ---------- render ---------- */
  function renderDrops() {
    const grid = $("#drop-grid");
    if (!grid) return;
    const items = getDrops().filter((d) => currentFilter === "all" || d.type === currentFilter);
    grid.innerHTML = items
      .map(
        (d) => `
      <article class="drop-card" data-id="${d.id}">
        <div class="drop-art">
          ${imgTag(d.photo, d.title + " product vibe", "media-fill", { sizes: "(max-width:700px) 100vw, 380px" })}
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
            <button type="button" class="wish-btn ${isWished(d.id) ? "on" : ""}" data-wish='${escapeAttr(JSON.stringify(wishPayload(d, "drop")))}' aria-label="${escapeHtml(t("add_wishlist", { title: d.title }))}" aria-pressed="${isWished(d.id)}">
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
    rail.innerHTML = getIdols().map(
      (i) => `
      <article class="idol-card">
        <div class="idol-avatar">
          ${imgTag(i.photo, i.name + " · " + i.group + " (official MV thumb)", "media-fill", { sizes: "260px" })}
          <span class="group-chip">${i.group}</span>
        </div>
        <div class="idol-info">
          <h3>${i.name}</h3>
          <p class="role">${i.role}</p>
          <div class="idol-tags">${i.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
          <div class="idol-actions">
            <button type="button" class="btn btn-sm btn-neon bias-btn" data-bias="${i.name}">${t("set_bias")}</button>
            <button type="button" class="btn btn-sm btn-ghost" data-wish='${escapeAttr(JSON.stringify(wishPayload({ id: i.id, title: i.name + " " + t("merch_universe"), price: 0, group: i.group, photo: i.photo }, "idol")))}'>${t("stash")}</button>
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
      all: t("product_featured"),
      lightsticks: t("label_lightsticks"),
      plush: t("label_plush"),
      gadgets: t("label_gadgets"),
      albums: t("label_albums"),
      fashion: t("label_fashion"),
      beauty: t("label_beauty"),
    };
    const list =
      currentCat === "all"
        ? getProducts().slice(0, 8)
        : getProducts().filter((p) => p.cat === currentCat);
    if (title) title.textContent = labels[currentCat] || t("product_featured");
    if (sub)
      sub.textContent =
        currentCat === "all"
          ? t("product_sub")
          : t("product_sub_cat", { n: list.length, label: labels[currentCat] });
    grid.innerHTML = list
      .map(
        (p) => `
      <article class="product-card">
        <div class="product-art">
          ${imgTag(p.photo, p.name, "media-fill", { sizes: "(max-width:800px) 45vw, 220px" })}
        </div>
        <div class="product-body">
          <h4>${p.name}</h4>
          <div class="meta">${p.group} · ${p.cat}</div>
          <div class="product-foot">
            <span class="price">${formatMoney(p.price)}</span>
            <button type="button" class="wish-btn ${isWished(p.id) ? "on" : ""}" data-wish='${escapeAttr(JSON.stringify(wishPayload({ id: p.id, title: p.name, price: p.price, group: p.group, photo: p.photo }, "product")))}' aria-label="${escapeHtml(t("wishlist_item", { title: p.name }))}" aria-pressed="${isWished(p.id)}">
              ${heartSvg(isWished(p.id))}
            </button>
          </div>
        </div>
      </article>`
      )
      .join("");
  }

  function styleCatCards() {
    $$(".cat-card").forEach((card) => {
      const cat = card.dataset.cat;
      const photo = CAT_PHOTOS[cat];
      if (!photo) return;
      const a = M.attrs(photo, card.querySelector("h3")?.textContent || cat);
      card.style.setProperty("--cat-img", `url("${a.src}")`);
      card.setAttribute("title", a.title);
      card.setAttribute("aria-label", `${card.querySelector("h3")?.textContent || cat}. ${a.credit}`);
    });
  }

  function renderPhotocards() {
    const grid = $("#pc-grid");
    if (!grid) return;
    grid.innerHTML = getPhotocards().map(
      (pc) => `
      <article class="pc-card ${pc.rarity === "UR" || pc.rarity === "SSR" ? "holographic" : ""}">
        <div class="pc-face">
          ${imgTag(pc.photo, t("pc_vibe", { name: pc.name }), "media-fill", { sizes: "180px" })}
          <span class="pc-rarity rarity ${pc.rarity.toLowerCase()}">${pc.rarity}</span>
        </div>
        <div class="pc-meta">
          <strong>${pc.name}</strong>
          <span>${pc.set}</span>
          <button type="button" class="btn btn-sm btn-ghost" style="margin-top:0.35rem" data-wish='${escapeAttr(JSON.stringify(wishPayload({ id: pc.id, title: pc.name + " · " + pc.set + " PC", price: pc.rarity === "UR" ? 89 : pc.rarity === "SSR" ? 45 : pc.rarity === "SR" ? 18 : 8, group: pc.set, photo: pc.photo }, "pc")))}'>
            ${t("wishlist")}
          </button>
        </div>
      </article>`
    ).join("");
  }

  function renderPulse() {
    const CALENDAR = getCalendar();
    const INTEL = getIntel();
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
          <div class="intel-thumb">
            ${imgTag(i.photo, i.title, "media-fill", { sizes: "320px" })}
          </div>
          <div class="intel-body">
            <div class="label">${i.label}</div>
            <h4>${i.title}</h4>
            <p>${i.body}</p>
          </div>
        </article>`
      ).join("");
    }
  }

  function renderYoutube() {
    const grid = $("#yt-grid");
    if (!grid) return;
    grid.innerHTML = M.youtube
      .map(
        (y) => `
      <figure class="yt-card">
        <div class="yt-frame">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${y.id}?rel=0"
            title="${escapeHtml(y.title)} by ${escapeHtml(y.channel)}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <figcaption>
          <strong>${escapeHtml(y.title)}</strong>
          <span>${escapeHtml(y.channel)} · ${escapeHtml(y.note)}</span>
          <a href="https://www.youtube.com/watch?v=${y.id}" target="_blank" rel="noopener noreferrer">${t("watch_yt")}</a>
        </figcaption>
      </figure>`
      )
      .join("");
  }

  function renderCredits() {
    const list = $("#credits-list");
    if (!list) return;
    const credits = M.allCredits();
    list.innerHTML = credits
      .map((c) => {
        const kind = c.type === "youtube" ? t("credits_yt") : c.type === "video" ? t("credits_video") : t("credits_photo");
        return `<li>
          <span class="credit-kind">${kind}</span>
          <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" title="Source: ${escapeHtml(c.url)}">${escapeHtml(c.desc)}</a>
          <span class="credit-by">${t("credits_by")} <a href="${escapeHtml(c.photographerUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.photographer)}</a></span>
        </li>`;
      })
      .join("");
  }

  function setupHeroVideo() {
    const v = M.videos.festivalCrowd;
    const el = $("#hero-video");
    const credit = $("#hero-video-credit");
    if (el) {
      el.poster = v.poster;
      el.src = v.src;
      el.setAttribute("title", v.desc + " · " + v.url);
      el.setAttribute("aria-label", v.desc);
    }
    if (credit) {
      credit.innerHTML = `${t("bg_video")} <a href="${v.url}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(v.desc)}">${escapeHtml(v.photographer)} ${t("on_pexels")}</a>`;
    }

    // side ambient video
    const side = $("#hero-side-video");
    const sv = M.videos.neonDance;
    if (side) {
      side.poster = sv.poster;
      side.src = sv.src;
      side.setAttribute("title", sv.desc + " · " + sv.url);
      side.setAttribute("aria-label", sv.desc);
    }
  }

  function wishPayload(item, kind) {
    return {
      id: item.id,
      title: item.title || item.name,
      price: item.price || 0,
      group: item.group || "",
      img: item.photo ? item.photo.srcSm || item.photo.src : "",
      credit: item.photo ? `Photo by ${item.photo.photographer} on Pexels` : "",
      kind,
    };
  }

  function isWished(id) {
    return wishlist.some((w) => w.id === id);
  }

  function updateWishlistUI() {
    const count = $("#wishlist-count");
    if (count) count.textContent = String(wishlist.length);
    renderStash();
    renderDrawer();
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
        `<p class="empty-state" id="stash-empty">${t("stash_empty")}</p>`;
      return;
    }
    grid.innerHTML = wishlist
      .map(
        (w) => `
      <div class="stash-item">
        <div class="stash-swatch" ${w.img ? `style="background-image:url('${w.img}')"` : ""} title="${escapeHtml(w.credit || "")}"></div>
        <div style="flex:1;min-width:0">
          <strong>${escapeHtml(w.title)}</strong>
          <span>${escapeHtml(w.group || w.kind)}${w.price ? " · " + formatMoney(w.price) : ""}</span>
        </div>
        <button type="button" class="wish-btn on" data-remove="${w.id}" aria-label="${escapeHtml(t("remove_item", { title: w.title }))}">
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
      body.innerHTML = `<p class="empty-state">${t("stash_empty_drawer")}</p>`;
      return;
    }
    body.innerHTML =
      wishlist
        .map(
          (w) => `
      <div class="stash-item">
        <div class="stash-swatch" ${w.img ? `style="background-image:url('${w.img}')"` : ""} title="${escapeHtml(w.credit || "")}"></div>
        <div style="flex:1;min-width:0">
          <strong>${escapeHtml(w.title)}</strong>
          <span>${w.price ? formatMoney(w.price) : t("saved")}</span>
        </div>
        <button type="button" class="btn btn-sm btn-ghost" data-remove="${w.id}">${t("remove")}</button>
      </div>`
        )
        .join("") +
      `<p style="color:var(--muted);font-size:0.85rem;margin-top:0.5rem">${t("demo_total", { total: formatMoney(
        wishlist.reduce((s, w) => s + (w.price || 0), 0)
      )})}</p>`;
  }

  function toggleWish(item) {
    const idx = wishlist.findIndex((w) => w.id === item.id);
    if (idx >= 0) {
      wishlist.splice(idx, 1);
      toast(t("toast_removed"));
    } else {
      wishlist.unshift(item);
      toast(t("toast_stashed", { title: item.title }));
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

  function weightedPull() {
    const roll = Math.random();
    let rarity = "R";
    if (roll > 0.97) rarity = "UR";
    else if (roll > 0.85) rarity = "SSR";
    else if (roll > 0.55) rarity = "SR";
    const pool = getPhotocards().filter((p) => p.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)] || getPhotocards()[0];
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
      const a = M.attrs(pull.photo, t("pull_pc", { name: pull.name }));
      box.hidden = true;
      result.hidden = false;
      if (again) again.hidden = false;
      result.innerHTML = `
        <div class="pull-art holographic">
          <img src="${a.src}" alt="${escapeHtml(a.alt)}" title="${escapeHtml(a.title)}" width="200" height="280" loading="eager">
          <span class="rarity ${pull.rarity.toLowerCase()}" style="position:absolute;top:8px;right:8px">${pull.rarity}</span>
        </div>
        <h3>${t("you_pulled", { name: pull.name })}</h3>
        <p>${t("rarity_demo", { set: pull.set, rarity: pull.rarity })}</p>
        <p class="pull-credit">${escapeHtml(a.credit)}</p>
        <button type="button" class="btn btn-sm btn-neon" style="margin-top:0.75rem" data-wish='${escapeAttr(
          JSON.stringify(
            wishPayload(
              {
                id: "pull-" + pull.id + "-" + Date.now(),
                title: "Pulled · " + pull.name + " " + pull.rarity,
                price: pull.rarity === "UR" ? 89 : pull.rarity === "SSR" ? 45 : 12,
                group: pull.set,
                photo: pull.photo,
              },
              "pull"
            )
          )
        )}'>${t("stash_pull")}</button>`;
    }, 480);
  }

  function startQuiz() {
    quizIndex = 0;
    quizScores = { performer: 0, vocal: 0, visual: 0, soft: 0, chaos: 0 };
    $("#quiz-intro").hidden = true;
    $("#quiz-result").hidden = true;
    $("#quiz-play").hidden = false;
    showQuizStep();
  }

  function showQuizStep() {
    const QUIZ = getQuiz();
    const step = QUIZ[quizIndex];
    $("#quiz-step").textContent = t("quiz_step", { n: quizIndex + 1, total: getQuiz().length });
    $("#quiz-bar").style.width = ((quizIndex + 1) / getQuiz().length) * 100 + "%";
    $("#quiz-question").textContent = step.q;
    const opts = $("#quiz-options");
    opts.innerHTML = step.options
      .map((o, i) => `<button type="button" class="quiz-opt" data-opt="${i}">${o.t}</button>`)
      .join("");
  }

  function answerQuiz(optIndex) {
    const opt = getQuiz()[quizIndex].options[optIndex];
    Object.keys(opt.scores).forEach((k) => {
      quizScores[k] = (quizScores[k] || 0) + opt.scores[k];
    });
    quizIndex++;
    if (quizIndex >= getQuiz().length) finishQuiz();
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
    const r = getQuizResults()[best];
    const a = M.attrs(r.photo, t("bias_match", { name: r.name }));
    $("#quiz-play").hidden = true;
    $("#quiz-result").hidden = false;
    $("#result-card").innerHTML = `
      <div class="result-hero has-photo">
        <img src="${a.src}" alt="${escapeHtml(a.alt)}" title="${escapeHtml(a.title)}" class="result-photo" loading="eager">
        <div class="result-hero-copy">
          <span>${r.group}</span>
          <h3>${r.name}</h3>
          <span>${r.vibe}</span>
        </div>
      </div>
      <div class="result-body">
        <p>${r.blurb}</p>
        <div class="result-kit">${r.kit.map((k) => `<span class="tag">${k}</span>`).join("")}</div>
        <p class="pull-credit">${escapeHtml(a.credit)}</p>
      </div>`;
  }

  function spawnSparks() {
    const layer = $("#spark-layer");
    if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < 22; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 3 + "s";
      s.style.background = Math.random() > 0.5 ? "var(--cyan)" : "var(--pink)";
      layer.appendChild(s);
    }
  }

  function bindMerchChrome() {
    const pack = $("#open-pack-btn");
    if (pack && !pack.dataset.bound) {
      pack.dataset.bound = "1";
      pack.addEventListener("click", openPackModal);
    }
    const wish = $("#wishlist-btn");
    if (wish && !wish.dataset.bound) {
      wish.dataset.bound = "1";
      wish.addEventListener("click", () => {
        const d = $("#wishlist-drawer");
        if (!d) return;
        d.hidden = false;
        document.body.style.overflow = "hidden";
        renderDrawer();
      });
    }
    updateWishlistUI();
  }
  window.BiasDropMerchRebind = bindMerchChrome;

  function bindEvents() {
    bindMerchChrome();

    // nav chrome handled by shared.js when present

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

    $$(".cat-card").forEach((card) => {
      card.addEventListener("click", () => {
        currentCat = card.dataset.cat || "all";
        renderProducts();
        $("#product-grid")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });

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
        toast(t("toast_removed"));
        return;
      }

      const biasBtn = e.target.closest(".bias-btn");
      if (biasBtn) {
        toast(t("toast_bias", { name: biasBtn.dataset.bias }));
        return;
      }

      const opt = e.target.closest(".quiz-opt");
      if (opt) answerQuiz(Number(opt.dataset.opt));
    });

    $$("[data-close-drawer]").forEach((el) =>
      el.addEventListener("click", () => {
        $("#wishlist-drawer").hidden = true;
        document.body.style.overflow = "";
      })
    );

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
      toast(t("toast_cleared"));
    });

    $("#cta-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = $("#cta-note");
      if (note) note.textContent = t("cta_ok");
      e.target.reset();
    });

    setInterval(() => {
      $$(".countdown[data-ends]").forEach((el) => {
        el.textContent = formatCountdown(Number(el.dataset.ends));
      });
    }, 1000);

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

  function renderAllDynamic() {
    setupHeroVideo();
    styleCatCards();
    renderDrops();
    renderIdols();
    renderProducts();
    renderPhotocards();
    renderPulse();
    renderYoutube();
    renderCredits();
    updateWishlistUI();
    // reset quiz view to intro on lang change if not mid-play is ok; keep state
  }

  function init() {
    // i18n + chrome are owned by shared.js on multi-page; home also boots shared first
    if (!document.documentElement.dataset.lang) I18n.init();
    spawnSparks();
    renderAllDynamic();
    bindEvents();

    window.addEventListener("biasdrop:lang", () => {
      renderAllDynamic();
      const play = $("#quiz-play");
      const result = $("#quiz-result");
      if (play && !play.hidden) showQuizStep();
      else if (result && !result.hidden) {
        try { finishQuiz(); } catch (e) { /* ignore */ }
      }
      const note = $("#cta-note");
      if (note && note.textContent) note.textContent = t("cta_ok");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

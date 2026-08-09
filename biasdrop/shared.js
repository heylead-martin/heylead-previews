/* BiasDrop shared chrome, base path, language wiring */
window.BiasDropShared = (function () {
  "use strict";

  function getBase() {
    const meta = document.querySelector('meta[name="biasdrop-base"]');
    if (meta && meta.content) return meta.content.endsWith("/") ? meta.content : meta.content + "/";
    const path = location.pathname.replace(/\/index\.html$/, "/");
    if (/\/artists\/[^/]+\/?$/.test(path)) return "../../";
    if (/\/(artists|albums|concerts|faq|about)\/?$/.test(path)) return "../";
    if (path.includes("/artists/") && path.split("/artists/")[1]) return "../../";
    return "./";
  }

  function t(key, vars) {
    return window.BiasDropI18n ? window.BiasDropI18n.t(key, vars) : key;
  }

  function photoFor(key) {
    const M = window.BiasDropMedia;
    if (!M || !M.photos) return null;
    return M.photos[key] || M.photos.seoulNeon;
  }

  function imgAttrs(photo, ctx) {
    if (!photo || !window.BiasDropMedia) return { src: "", alt: "", title: "" };
    return window.BiasDropMedia.attrs(photo, ctx);
  }

  function navItems(base) {
    return [
      { href: base + "index.html", key: "nav_home", match: "home" },
      { href: base + "artists/", key: "nav_artists", match: "artists" },
      { href: base + "albums/", key: "nav_albums_page", match: "albums" },
      { href: base + "concerts/", key: "nav_concerts", match: "concerts" },
      { href: base + "index.html#loot", key: "nav_loot", match: "loot" },
      { href: base + "faq/", key: "nav_faq", match: "faq" },
      { href: base + "about/", key: "nav_about", match: "about" },
    ];
  }

  function currentSection() {
    const p = location.pathname;
    if (p.includes("/artists")) return "artists";
    if (p.includes("/albums")) return "albums";
    if (p.includes("/concerts")) return "concerts";
    if (p.includes("/faq")) return "faq";
    if (p.includes("/about")) return "about";
    return "home";
  }

  function renderHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;
    const base = getBase();
    const sec = currentSection();
    const items = navItems(base)
      .map(
        (n) =>
          `<a href="${n.href}" class="${sec === n.match ? "is-current" : ""}" data-i18n="${n.key}">${t(n.key)}</a>`
      )
      .join("");

    mount.innerHTML = `
<header class="site-header" id="top">
  <div class="header-inner">
    <a class="logo" href="${base}index.html" data-i18n-aria="logo_home" aria-label="${t("logo_home")}">
      <span class="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40">
              <stop stop-color="#FF2D95"/><stop offset="1" stop-color="#00F0FF"/>
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" stroke="url(#lg)" stroke-width="2.5"/>
          <path d="M20 8l2.4 7.4H30l-6 4.4 2.3 7.2L20 22.6l-6.3 4.4 2.3-7.2-6-4.4h7.6z" fill="url(#lg)"/>
        </svg>
      </span>
      <span class="logo-text">Bias<span>Drop</span></span>
    </a>
    <nav class="nav-desktop" data-i18n-aria="nav_primary" aria-label="${t("nav_primary")}">${items}</nav>
    <div class="header-actions">
      <a class="btn btn-sm btn-ghost hide-sm" href="${base}concerts/" data-i18n="nav_concerts">${t("nav_concerts")}</a>
      <a class="btn btn-sm btn-neon" href="${base}artists/" data-i18n="nav_artists">${t("nav_artists")}</a>
      <a class="btn btn-sm btn-ghost hide-sm" href="${base}index.html#collect" data-i18n="open_pack">${t("open_pack")}</a>
      <button type="button" class="nav-toggle" id="nav-toggle" data-i18n-aria="menu_open" aria-label="${t("menu_open")}" aria-expanded="false" aria-controls="mobile-nav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
  <nav class="nav-mobile" id="mobile-nav" hidden data-i18n-aria="nav_mobile" aria-label="${t("nav_mobile")}">
    ${navItems(base)
      .map((n) => `<a href="${n.href}" data-i18n="${n.key}">${t(n.key)}</a>`)
      .join("")}
    <a href="${base}index.html#drops" data-i18n="nav_drops_m">${t("nav_drops_m")}</a>
    <a href="${base}index.html#quiz" data-i18n="nav_quiz">${t("nav_quiz")}</a>
  </nav>
</header>`;

    const toggle = document.getElementById("nav-toggle");
    const mobile = document.getElementById("mobile-nav");
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
  }

  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;
    const base = getBase();
    mount.innerHTML = `
<footer class="site-footer">
  <div class="footer-inner">
    <div>
      <div class="logo logo-footer"><span class="logo-text">Bias<span>Drop</span></span></div>
      <p data-i18n="footer_blurb">${t("footer_blurb")}</p>
    </div>
    <div class="footer-cols">
      <div>
        <h4 data-i18n="footer_explore">${t("footer_explore")}</h4>
        <a href="${base}artists/" data-i18n="nav_artists">${t("nav_artists")}</a>
        <a href="${base}albums/" data-i18n="nav_albums_page">${t("nav_albums_page")}</a>
        <a href="${base}concerts/" data-i18n="nav_concerts">${t("nav_concerts")}</a>
        <a href="${base}index.html#loot" data-i18n="nav_loot">${t("nav_loot")}</a>
      </div>
      <div>
        <h4 data-i18n="footer_fan">${t("footer_fan")}</h4>
        <a href="${base}faq/" data-i18n="nav_faq">${t("nav_faq")}</a>
        <a href="${base}about/" data-i18n="nav_about">${t("nav_about")}</a>
        <a href="${base}index.html#quiz" data-i18n="nav_quiz">${t("nav_quiz")}</a>
      </div>
      <div>
        <h4 data-i18n="footer_preview">${t("footer_preview")}</h4>
        <a href="https://previews.heylead.com/">HeyLead Previews</a>
        <a href="https://weverse.io/" target="_blank" rel="noopener noreferrer">Weverse</a>
        <a href="https://shop.weverse.io/en/home" target="_blank" rel="noopener noreferrer">Weverse Shop</a>
        <span class="muted" data-i18n="footer_demo">${t("footer_demo")}</span>
      </div>
    </div>
  </div>
  <div class="lang-bar" role="group" data-i18n-aria="lang_label" aria-label="${t("lang_label")}">
    <span class="lang-bar-label" data-i18n="lang_label">${t("lang_label")}</span>
    <div class="lang-pills">
      <button type="button" class="lang-pill" data-lang="bg" aria-pressed="false" title="Български">
        <span class="lang-flag" aria-hidden="true">BG</span>
        <span class="lang-name" data-i18n="lang_bg_full">${t("lang_bg_full")}</span>
      </button>
      <button type="button" class="lang-pill" data-lang="en" aria-pressed="false" title="English (UK)">
        <span class="lang-flag" aria-hidden="true">EN · UK</span>
        <span class="lang-name" data-i18n="lang_en_full">${t("lang_en_full")}</span>
      </button>
    </div>
  </div>
  <p class="footer-copy" data-i18n="footer_copy">${t("footer_copy")}</p>
</footer>`;

    wireLangPills();
  }

  function wireLangPills() {
    const I18n = window.BiasDropI18n;
    if (!I18n) return;
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      const active = btn.getAttribute("data-lang") === I18n.getLang();
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
      btn.onclick = () => {
        const next = btn.getAttribute("data-lang");
        if (!next || next === I18n.getLang()) return;
        I18n.setLang(next);
        renderHeader();
        renderFooter();
        I18n.applyStatic();
        window.dispatchEvent(new CustomEvent("biasdrop:lang", { detail: { lang: next } }));
      };
    });
  }

  function boot(pageInit) {
    const I18n = window.BiasDropI18n;
    if (I18n) I18n.init();
    renderHeader();
    renderFooter();
    if (I18n) I18n.applyStatic();
    if (typeof pageInit === "function") pageInit();
    window.addEventListener("biasdrop:lang", () => {
      if (typeof pageInit === "function") pageInit();
    });
  }

  function extLink(url, label, className) {
    if (!url) return "";
    return `<a class="${className || "ext-link"}" href="${url}" target="_blank" rel="noopener noreferrer">${label}<span class="ext-ico" aria-hidden="true">↗</span></a>`;
  }

  function formatDate(iso, lang) {
    if (!iso) return "";
    try {
      const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
      return d.toLocaleDateString(lang === "bg" ? "bg-BG" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }

  function statusLabel(status) {
    const map = {
      onsale: "status_onsale",
      announced: "status_announced",
      tba: "status_tba",
      soldout: "status_soldout",
    };
    return t(map[status] || "status_tba");
  }

  return {
    getBase,
    t,
    photoFor,
    imgAttrs,
    renderHeader,
    renderFooter,
    boot,
    extLink,
    formatDate,
    statusLabel,
    currentSection,
  };
})();

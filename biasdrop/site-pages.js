/* Page renderers for encyclopedia sections */
window.BiasDropPages = (function () {
  "use strict";

  function S() {
    return window.BiasDropShared;
  }
  function D() {
    return window.BiasDropData;
  }
  function t(k, v) {
    return S().t(k, v);
  }
  function lang() {
    return window.BiasDropI18n ? window.BiasDropI18n.getLang() : "bg";
  }

  function regionKey(r) {
    if (r === "north-america") return "region_na";
    if (r === "asia") return "region_asia";
    if (r === "europe") return "region_europe";
    if (r === "global") return "region_global";
    return "region_global";
  }

  function artistImage(a) {
    if (a.image) {
      const fb = a.imageFallback || a.image.replace("hq720", "hqdefault").replace("maxresdefault", "hqdefault");
      return {
        src: a.image,
        alt: `${a.name} — official MV thumbnail (YouTube). Source: ${a.imageSource || "YouTube"}`,
        title: `${a.imageCredit || "Official MV thumbnail"} · ${a.imageSource || ""}`,
        fallback: fb,
        onerror:
          "if(this.dataset.step==='1'){this.src=this.src.replace('hqdefault','mqdefault');this.dataset.step='2';}else if(this.dataset.step==='2'){this.onerror=null;this.src=this.dataset.fb||this.src;}else{this.dataset.step='1';this.src=this.dataset.fb||this.src.replace('hq720','hqdefault');}",
      };
    }
    const photo = S().photoFor(a.photoKey);
    return S().imgAttrs(photo, a.name);
  }

  function artistCard(a, base) {
    const attrs = artistImage(a);
    return `
    <article class="wiki-card">
      <a class="wiki-card-media" href="${base}artists/${a.id}/" style="--accent:${a.color}">
        <img src="${attrs.src}" alt="${escape(attrs.alt)}" title="${escape(attrs.title)}" loading="lazy" width="600" height="640" decoding="async" ${attrs.fallback ? `data-fb="${attrs.fallback}"` : ""} ${attrs.onerror ? `onerror='${attrs.onerror}'` : ""}>
        <span class="wiki-chip">${a.fandom}</span>
      </a>
      <div class="wiki-card-body">
        <h3><a href="${base}artists/${a.id}/">${a.name}</a></h3>
        <p class="muted">${a.agency} · ${a.gen} gen</p>
        <p class="wiki-card-bio">${escape(D().bio(a, lang()))}</p>
        <div class="wiki-card-meta">
          <span>${t("member_count", { n: a.members.length })}</span>
          <span>${a.debut.slice(0, 4)}</span>
        </div>
        <a class="btn btn-sm btn-neon" href="${base}artists/${a.id}/">${t("artists_view")}</a>
      </div>
    </article>`;
  }

  function escape(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Split encyclopedia bio text into lead + titled sections for nicer layout */
  function formatBioHtml(fullBio) {
    const paras = String(fullBio || "")
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!paras.length) return "";

    function splitHeading(p) {
      // "Short heading. Rest of body..." — heading must be brief, no years, not a full sentence dump
      const m = p.match(/^(.{3,70}?)([.!?])\s+([\s\S]{40,})$/);
      if (!m) return null;
      const title = m[1].trim();
      const words = title.split(/\s+/).filter(Boolean);
      if (words.length < 1 || words.length > 8) return null;
      if (/\d{4}/.test(title)) return null; // avoid "debut on 8 August 2016"
      if (/[,;]/.test(title) && words.length > 4) return null;
      return { title, body: m[3].trim() };
    }

    let html = '<div class="bio-prose bio-prose-rich">';
    // First paragraph is always the lead (full text)
    html += `<p class="bio-lead">${escape(paras[0])}</p>`;

    if (paras.length > 1) {
      html += '<div class="bio-sections">';
      paras.slice(1).forEach((p) => {
        const split = splitHeading(p);
        if (split) {
          html += `<article class="bio-section">
            <h3 class="bio-section-title">${escape(split.title)}</h3>
            <p>${escape(split.body)}</p>
          </article>`;
        } else {
          html += `<article class="bio-section bio-section-plain"><p>${escape(p)}</p></article>`;
        }
      });
      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  /** Polish blog HTML: drop duplicate title, lead paragraph, nicer lists */
  function formatBlogHtml(html, title) {
    let h = String(html || "");
    // remove leading <p><strong>Title</strong> is part of...</p> if it repeats the title
    h = h.replace(/^\s*<p><strong>[^<]+<\/strong>\s*е част от[\s\S]*?<\/p>/i, "");
    h = h.replace(/^\s*<p><strong>[^<]+<\/strong>\s*is part of[\s\S]*?<\/p>/i, "");
    // first remaining paragraph becomes lead
    let first = true;
    h = h.replace(/<p>([\s\S]*?)<\/p>/, (match, inner) => {
      if (!first) return match;
      first = false;
      return `<p class="blog-lead">${inner}</p>`;
    });
    // wrap h2 blocks as section cards via class on h2 (CSS handles)
    h = h.replace(/<h2>/g, '<h2 class="blog-h2">');
    h = h.replace(/<ul>/g, '<ul class="blog-list">');
    h = h.replace(/<p class="muted">/g, '<p class="blog-disclaimer">');
    return h;
  }

  function renderArtistsIndex() {
    const root = document.getElementById("page-root");
    if (!root || !D()) return;
    const base = S().getBase();
    const q = (document.getElementById("artist-search")?.value || "").trim().toLowerCase();
    let list = D().artists;
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.fandom.toLowerCase().includes(q) ||
          a.members.some((m) => m.toLowerCase().includes(q)) ||
          a.agency.toLowerCase().includes(q)
      );
    }
    root.innerHTML = `
      <section class="page-hero">
        <p class="eyebrow">${t("home_wiki_cta")}</p>
        <h1 data-i18n="artists_title">${t("artists_title")}</h1>
        <p class="section-sub" data-i18n="artists_sub">${t("artists_sub")}</p>
        <label class="search-field">
          <span class="sr-only">${t("artists_search")}</span>
          <input type="search" id="artist-search" placeholder="${t("artists_search")}" value="${escape(document.getElementById("artist-search")?.value || "")}">
        </label>
      </section>
      <div class="wiki-grid" id="artists-grid">
        ${list.length ? list.map((a) => artistCard(a, base)).join("") : `<p class="empty-state">${t("no_results")}</p>`}
      </div>`;
    document.getElementById("artist-search")?.addEventListener("input", () => renderArtistsIndex());
  }

  function renderArtistProfile(id) {
    const root = document.getElementById("page-root");
    if (!root || !D()) return;
    const base = S().getBase();
    const a = D().getArtist(id);
    if (!a) {
      root.innerHTML = `<p class="empty-state">${t("no_results")}</p><p><a href="${base}artists/">${t("artists_back")}</a></p>`;
      return;
    }
    const attrs = artistImage(a);
    const concerts = D().getConcertsByArtist(a.id);
    const L = a.links || {};
    const tr = a.trivia || null;
    const fullBio = D().bio(a, lang());
    const leadSnippet = (() => {
      const first = String(fullBio || "").split(/\n\n+/).map((p) => p.trim()).filter(Boolean)[0] || "";
      if (first.length <= 280) return first;
      const cut = first.slice(0, 277);
      const sp = cut.lastIndexOf(" ");
      return (sp > 120 ? cut.slice(0, sp) : cut) + "…";
    })();

    document.title = `${a.name} · BiasDrop`;

    root.innerHTML = `
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="${base}index.html">${t("breadcrumb_home")}</a>
      <span>/</span>
      <a href="${base}artists/">${t("nav_artists")}</a>
      <span>/</span>
      <span>${a.name}</span>
    </nav>

    <header class="profile-hero" style="--accent:${a.color}">
      <div class="profile-media">
        <img src="${attrs.src}" alt="${escape(attrs.alt)}" title="${escape(attrs.title)}" width="640" height="640" decoding="async" ${attrs.fallback ? `data-fb="${attrs.fallback}"` : ""} ${attrs.onerror ? `onerror='${attrs.onerror}'` : ""}>
        ${a.imageSource ? `<p class="img-credit"><a href="${a.imageSource}" target="_blank" rel="noopener noreferrer">${escape(a.imageCredit || "YouTube")}</a></p>` : ""}
      </div>
      <div class="profile-copy">
        <p class="eyebrow">${a.fandom} · ${a.gen} gen</p>
        <h1>${a.name}</h1>
        <p class="profile-bio lead-bio">${escape(leadSnippet)}</p>
        <p class="jump-bio"><a href="#full-bio">${t("artists_full_bio")} ↓</a></p>
        <dl class="profile-facts">
          <div><dt>${t("artists_debut")}</dt><dd>${a.debut}</dd></div>
          <div><dt>${t("artists_agency")}</dt><dd>${escape(a.agency)}</dd></div>
          <div><dt>${t("artists_fandom")}</dt><dd>${escape(a.fandom)}</dd></div>
          <div><dt>${t("artists_lightstick")}</dt><dd>${escape(a.lightstick || "—")}</dd></div>
        </dl>
        <div class="link-row">
          ${L.official ? S().extLink(L.official, t("open_official"), "btn btn-sm btn-neon") : ""}
          ${L.weverse ? S().extLink(L.weverse, t("open_weverse"), "btn btn-sm btn-ghost") : ""}
          ${L.spotify ? S().extLink(L.spotify, t("open_spotify"), "btn btn-sm btn-ghost") : ""}
          ${L.apple ? S().extLink(L.apple, t("open_apple"), "btn btn-sm btn-ghost") : ""}
          ${L.youtubeMusic ? S().extLink(L.youtubeMusic, t("open_ytmusic"), "btn btn-sm btn-ghost") : ""}
          ${L.youtube ? S().extLink(L.youtube, t("open_youtube"), "btn btn-sm btn-ghost") : ""}
        </div>
      </div>
    </header>

    ${tr ? `<section class="content-block trivia-grid">
      <h2>${t("artists_trivia")}</h2>
      <div class="about-grid">
        <article class="about-card"><h3>${t("trivia_origin")}</h3><p>${escape((tr.origin && tr.origin[lang()]) || (tr.origin && tr.origin.en) || "")}</p></article>
        <article class="about-card"><h3>${t("trivia_food")}</h3><p>${escape((tr.food && tr.food[lang()]) || (tr.food && tr.food.en) || "")}</p></article>
        <article class="about-card"><h3>${t("trivia_drink")}</h3><p>${escape((tr.drink && tr.drink[lang()]) || (tr.drink && tr.drink.en) || "")}</p></article>
        <article class="about-card"><h3>${t("trivia_fun")}</h3><p>${escape((tr.fun && tr.fun[lang()]) || (tr.fun && tr.fun.en) || "")}</p></article>
      </div>
    </section>` : ""}

    <section class="content-block bio-long" id="full-bio">
      <div class="bio-header">
        <p class="eyebrow">${a.name}</p>
        <h2>${t("artists_full_bio")}</h2>
      </div>
      ${formatBioHtml(fullBio)}
      <p class="bio-disclaimer">${t("bio_disclaimer")}</p>
    </section>

    <section class="content-block">
      <h2>${t("artists_members")}</h2>
      <ul class="member-grid">
        ${a.members.map((m) => `<li>${escape(m)}</li>`).join("")}
      </ul>
    </section>

    <section class="content-block">
      <h2>${t("artists_links")}</h2>
      <div class="link-cloud">
        ${L.spotify ? S().extLink(L.spotify, t("open_spotify")) : ""}
        ${L.apple ? S().extLink(L.apple, t("open_apple")) : ""}
        ${L.youtubeMusic ? S().extLink(L.youtubeMusic, t("open_ytmusic")) : ""}
        ${L.youtube ? S().extLink(L.youtube, t("open_youtube")) : ""}
        ${L.weverse ? S().extLink(L.weverse, t("open_weverse")) : ""}
        ${L.instagram ? S().extLink(L.instagram, t("open_ig")) : ""}
        ${L.twitter ? S().extLink(L.twitter, t("open_x")) : ""}
        ${L.wikipedia ? S().extLink(L.wikipedia, t("open_wiki")) : ""}
        ${L.official ? S().extLink(L.official, t("open_official")) : ""}
      </div>
    </section>

    <section class="content-block">
      <h2>${t("artists_discography")}</h2>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t("albums_year")}</th>
              <th>Title</th>
              <th>${t("albums_type")}</th>
              <th>${t("albums_highlight")}</th>
              <th>Stream</th>
            </tr>
          </thead>
          <tbody>
            ${(a.discography || [])
              .map(
                (d) => `<tr>
              <td>${d.year}</td>
              <td><strong>${escape(d.title)}</strong></td>
              <td>${escape(d.type)}</td>
              <td>${escape(d.highlight || "")}</td>
              <td class="stream-links">
                ${d.spotify ? S().extLink(d.spotify, "Spotify", "text-link") : ""}
                ${d.apple ? S().extLink(d.apple, "Apple", "text-link") : ""}
                ${d.youtubeMusic ? S().extLink(d.youtubeMusic, "YT Music", "text-link") : ""}
              </td>
            </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="content-block">
      <h2>${t("artists_songs")}</h2>
      <div class="song-list">
        ${(a.songs || [])
          .map(
            (s) => `<article class="song-row">
            <div>
              <h3>${escape(s.title)}</h3>
              <p class="muted">${escape(s.album)} · ${s.year}</p>
            </div>
            <div class="song-actions">
              ${s.spotify ? S().extLink(s.spotify, "Spotify", "btn btn-sm btn-ghost") : ""}
              ${s.apple ? S().extLink(s.apple, "Apple", "btn btn-sm btn-ghost") : ""}
              ${s.youtubeMusic ? S().extLink(s.youtubeMusic, "YT Music", "btn btn-sm btn-ghost") : ""}
              ${s.yt ? S().extLink(s.yt, t("artists_watch"), "btn btn-sm btn-neon") : ""}
            </div>
          </article>`
          )
          .join("")}
      </div>
    </section>

    <section class="content-block">
      <div class="section-head-inline">
        <h2>${t("artists_concerts")}</h2>
        <a href="${base}concerts/?artist=${a.id}">${t("artists_all_concerts")}</a>
      </div>
      ${
        concerts.length
          ? `<div class="concert-list">${concerts.map((c) => concertCard(c, base)).join("")}</div>`
          : `<p class="muted">${t("no_results")}</p>`
      }
    </section>

    <p class="back-row"><a href="${base}artists/">← ${t("artists_back")}</a></p>
    `;
  }

  function concertCard(c, base) {
    const artist = D().getArtist(c.artistId);
    const name = artist ? artist.name : c.artistId;
    return `
    <article class="concert-card">
      <div class="concert-date">
        <strong>${S().formatDate(c.date, lang())}</strong>
        ${c.endDate ? `<span>→ ${S().formatDate(c.endDate, lang())}</span>` : ""}
      </div>
      <div class="concert-body">
        <p class="concert-artist"><a href="${base}artists/${c.artistId}/">${escape(name)}</a></p>
        <h3>${escape(c.title)}</h3>
        <p class="muted">${escape(c.city)}, ${escape(c.country)} · ${escape(c.venue)}</p>
        ${c.note ? `<p class="concert-note">${escape(c.note)}</p>` : ""}
        <div class="concert-tags">
          <span class="tag">${t(regionKey(c.region))}</span>
          <span class="tag status-${c.status}">${S().statusLabel(c.status)}</span>
        </div>
      </div>
      <div class="concert-actions">
        ${c.tickets ? S().extLink(c.tickets, t("artists_tickets"), "btn btn-sm btn-neon") : ""}
        ${c.source ? S().extLink(c.source, t("artists_source"), "btn btn-sm btn-ghost") : ""}
      </div>
    </article>`;
  }

  function renderConcerts() {
    const root = document.getElementById("page-root");
    if (!root || !D()) return;
    const base = S().getBase();
    const params = new URLSearchParams(location.search);
    const artistFilter = document.getElementById("f-artist")?.value || params.get("artist") || "";
    const regionFilter = document.getElementById("f-region")?.value || params.get("region") || "";

    let list = [...D().concerts].sort((a, b) => a.date.localeCompare(b.date));
    if (artistFilter) list = list.filter((c) => c.artistId === artistFilter);
    if (regionFilter) list = list.filter((c) => c.region === regionFilter);

    const artistOpts = D().artists
      .map((a) => `<option value="${a.id}" ${artistFilter === a.id ? "selected" : ""}>${a.name}</option>`)
      .join("");

    root.innerHTML = `
      <section class="page-hero">
        <p class="eyebrow">${t("nav_concerts")}</p>
        <h1>${t("concerts_title")}</h1>
        <p class="section-sub">${t("concerts_sub")}</p>
        <div class="filter-bar">
          <label>
            <span>${t("concerts_artist")}</span>
            <select id="f-artist">
              <option value="">${t("concerts_all_artists")}</option>
              ${artistOpts}
            </select>
          </label>
          <label>
            <span>${t("concerts_region")}</span>
            <select id="f-region">
              <option value="">${t("concerts_all_regions")}</option>
              <option value="asia" ${regionFilter === "asia" ? "selected" : ""}>${t("region_asia")}</option>
              <option value="north-america" ${regionFilter === "north-america" ? "selected" : ""}>${t("region_na")}</option>
              <option value="europe" ${regionFilter === "europe" ? "selected" : ""}>${t("region_europe")}</option>
              <option value="global" ${regionFilter === "global" ? "selected" : ""}>${t("region_global")}</option>
            </select>
          </label>
        </div>
      </section>
      <div class="hub-grid concert-hubs">
        <a class="hub-card" href="https://www.ticketmaster.com/" target="_blank" rel="noopener noreferrer"><strong>Ticketmaster</strong><span>Global tickets hub</span></a>
        <a class="hub-card" href="https://www.globalinterpark.com/" target="_blank" rel="noopener noreferrer"><strong>Interpark Global</strong><span>Korea tickets for intl fans</span></a>
        <a class="hub-card" href="https://www.songkick.com/" target="_blank" rel="noopener noreferrer"><strong>Songkick</strong><span>Tour alerts</span></a>
        <a class="hub-card" href="https://www.bandsintown.com/" target="_blank" rel="noopener noreferrer"><strong>Bandsintown</strong><span>Artist alerts</span></a>
        <a class="hub-card" href="https://weverse.io/" target="_blank" rel="noopener noreferrer"><strong>Weverse</strong><span>Official notices</span></a>
        <a class="hub-card" href="https://kpop.fandom.com/wiki/Category:2026_concerts" target="_blank" rel="noopener noreferrer"><strong>Kpop Wiki 2026</strong><span>Community tour index</span></a>
      </div>
      <p class="muted tiny-note">${t("concerts_count", { n: list.length })}</p>
      <div class="concert-list">
        ${list.length ? list.map((c) => concertCard(c, base)).join("") : `<p class="empty-state">${t("no_results")}</p>`}
      </div>
      <p class="muted tiny-note">${t("concerts_sub")}</p>
    `;

    document.getElementById("f-artist")?.addEventListener("change", renderConcerts);
    document.getElementById("f-region")?.addEventListener("change", renderConcerts);
  }

  function openAlbumModal(album) {
    const existing = document.getElementById("album-modal");
    if (existing) existing.remove();
    const tracks = album.tracks || [];
    const modal = document.createElement("div");
    modal.id = "album-modal";
    modal.className = "album-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "album-modal-title");
    modal.innerHTML = `
      <div class="album-modal-backdrop" data-close-album></div>
      <div class="album-modal-panel" style="--accent:${album.color || "var(--violet)"}">
        <button type="button" class="modal-close" data-close-album aria-label="${t("close")}">×</button>
        <p class="eyebrow">${escape(album.artistName)} · ${album.year}</p>
        <h2 id="album-modal-title">${escape(album.title)}</h2>
        <p class="muted"><span class="tag">${escape(album.type || "")}</span>
          ${album.highlight ? ` · ${t("albums_highlight")}: <strong>${escape(album.highlight)}</strong>` : ""}
          · ${tracks.length} ${t("album_tracks_count")}
        </p>
        <div class="song-actions" style="margin:0.75rem 0 1rem">
          ${album.spotify ? S().extLink(album.spotify, "Spotify", "btn btn-sm btn-neon") : ""}
          ${album.apple ? S().extLink(album.apple, "Apple", "btn btn-sm btn-ghost") : ""}
          ${album.youtubeMusic ? S().extLink(album.youtubeMusic, "YT Music", "btn btn-sm btn-ghost") : ""}
        </div>
        <div class="album-tracklist">
          ${
            tracks.length
              ? tracks
                  .map(
                    (tr) => `<div class="album-track-row">
              <span class="track-no">${tr.no}</span>
              <span class="track-title">${escape(tr.title)}</span>
              <span class="track-links">
                ${tr.spotify ? S().extLink(tr.spotify, "Spotify", "text-link") : ""}
                ${tr.apple ? S().extLink(tr.apple, "Apple", "text-link") : ""}
                ${tr.youtubeMusic ? S().extLink(tr.youtubeMusic, "YT Music", "text-link") : ""}
                ${tr.yt ? S().extLink(tr.yt, "MV", "text-link") : ""}
              </span>
            </div>`
                  )
                  .join("")
              : `<p class="muted">${t("album_no_tracks")}</p>`
          }
        </div>
        <p class="muted tiny-note">${t("album_modal_note")}</p>
      </div>`;
    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
    const close = () => {
      modal.remove();
      document.body.style.overflow = "";
    };
    modal.querySelectorAll("[data-close-album]").forEach((el) => el.addEventListener("click", close));
    modal.addEventListener("click", (e) => {
      // don't close when clicking stream links
      if (e.target.closest("a")) e.stopPropagation();
    });
    document.addEventListener(
      "keydown",
      function esc(e) {
        if (e.key === "Escape") {
          close();
          document.removeEventListener("keydown", esc);
        }
      }
    );
  }

  function renderAlbums() {
    const root = document.getElementById("page-root");
    if (!root || !D()) return;
    const base = S().getBase();
    const artistFilter = document.getElementById("alb-artist")?.value || "";
    const mode = document.getElementById("alb-mode")?.value || "albums";

    let albums = D().getAllAlbums();
    let songs = D().getAllSongs();
    if (artistFilter) {
      albums = albums.filter((a) => a.artistId === artistFilter);
      songs = songs.filter((s) => s.artistId === artistFilter);
    }

    // stash for click handlers
    window.__biasdropAlbums = albums;

    const opts = D().artists
      .map((a) => `<option value="${a.id}" ${artistFilter === a.id ? "selected" : ""}>${a.name}</option>`)
      .join("");

    root.innerHTML = `
      <section class="page-hero">
        <p class="eyebrow">${t("nav_albums_page")}</p>
        <h1>${mode === "songs" ? t("songs_title") : t("albums_title")}</h1>
        <p class="section-sub">${mode === "songs" ? t("songs_sub") : t("albums_click_hint")}</p>
        <div class="filter-bar">
          <label>
            <span>${t("concerts_artist")}</span>
            <select id="alb-artist">
              <option value="">${t("albums_filter_all")}</option>
              ${opts}
            </select>
          </label>
          <label>
            <span>View</span>
            <select id="alb-mode">
              <option value="albums" ${mode === "albums" ? "selected" : ""}>${t("albums_title")}</option>
              <option value="songs" ${mode === "songs" ? "selected" : ""}>${t("songs_title")}</option>
            </select>
          </label>
        </div>
      </section>
      ${
        mode === "songs"
          ? `<div class="song-list">${
              songs.length
                ? songs
                    .map(
                      (s) => `<article class="song-row">
                <div>
                  <h3>${escape(s.title)}</h3>
                  <p class="muted"><a href="${base}artists/${s.artistId}/">${escape(s.artistName)}</a> · ${escape(s.album)} · ${s.year}</p>
                </div>
                <div class="song-actions">
                  ${s.spotify ? S().extLink(s.spotify, "Spotify", "btn btn-sm btn-ghost") : ""}
                  ${s.apple ? S().extLink(s.apple, "Apple", "btn btn-sm btn-ghost") : ""}
                  ${s.youtubeMusic ? S().extLink(s.youtubeMusic, "YT Music", "btn btn-sm btn-ghost") : ""}
                  ${s.yt ? S().extLink(s.yt, t("artists_watch"), "btn btn-sm btn-neon") : ""}
                </div>
              </article>`
                    )
                    .join("")
                : `<p class="empty-state">${t("no_results")}</p>`
            }</div>`
          : `<div class="album-grid">${
              albums.length
                ? albums
                    .map(
                      (d, idx) => `<article class="album-card album-card-clickable" style="--accent:${d.color}" data-album-idx="${idx}" role="button" tabindex="0" aria-label="${escape(d.title)} - ${t("album_show_tracks")}">
                <div class="album-year">${d.year}</div>
                <h3>${escape(d.title)}</h3>
                <p class="muted"><a href="${base}artists/${d.artistId}/" data-stop>${escape(d.artistName)}</a></p>
                <p><span class="tag">${escape(d.type)}</span> ${d.highlight ? `· ${escape(d.highlight)}` : ""}
                  ${(d.tracks && d.tracks.length) ? ` · <span class="track-count">${d.tracks.length} ${t("album_tracks_count")}</span>` : ""}
                </p>
                <p class="album-tap-hint">${t("album_show_tracks")}</p>
                <div class="song-actions" data-stop>
                  ${d.spotify ? S().extLink(d.spotify, "Spotify", "btn btn-sm btn-neon") : ""}
                  ${d.apple ? S().extLink(d.apple, "Apple", "btn btn-sm btn-ghost") : ""}
                  ${d.youtubeMusic ? S().extLink(d.youtubeMusic, "YT Music", "btn btn-sm btn-ghost") : ""}
                </div>
              </article>`
                    )
                    .join("")
                : `<p class="empty-state">${t("no_results")}</p>`
            }</div>`
      }
    `;

    document.getElementById("alb-artist")?.addEventListener("change", renderAlbums);
    document.getElementById("alb-mode")?.addEventListener("change", renderAlbums);

    root.querySelectorAll("[data-album-idx]").forEach((card) => {
      const open = () => {
        const idx = Number(card.getAttribute("data-album-idx"));
        const album = (window.__biasdropAlbums || [])[idx];
        if (album) openAlbumModal(album);
      };
      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-stop], a, button")) return;
        open();
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function renderFaq() {
    const root = document.getElementById("page-root");
    if (!root || !D()) return;
    const cat = document.getElementById("faq-cat")?.value || "all";
    let items = D().faqs;
    if (cat !== "all") items = items.filter((f) => f.cat === cat);

    root.innerHTML = `
      <section class="page-hero">
        <p class="eyebrow">FAQ</p>
        <h1>${t("faq_title")}</h1>
        <p class="section-sub">${t("faq_sub")}</p>
        <div class="filter-pills faq-pills">
          ${["all", "fandom", "collect", "concert", "music", "site"]
            .map((c) => {
              const key = c === "all" ? "faq_all" : "faq_" + c;
              return `<button type="button" class="pill ${cat === c ? "active" : ""}" data-faq-cat="${c}">${t(key)}</button>`;
            })
            .join("")}
        </div>
      </section>
      <div class="faq-list">
        ${items
          .map(
            (f) => `<details class="faq-item">
            <summary>${escape(D().faqText(f, "q", lang()))}</summary>
            <p>${escape(D().faqText(f, "a", lang()))}</p>
          </details>`
          )
          .join("")}
      </div>
    `;

    root.querySelectorAll("[data-faq-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const wrap = document.createElement("input");
        wrap.id = "faq-cat";
        wrap.type = "hidden";
        wrap.value = btn.getAttribute("data-faq-cat");
        const old = document.getElementById("faq-cat");
        if (old) old.remove();
        document.body.appendChild(wrap);
        renderFaq();
      });
    });
  }

  function renderAbout() {
    const root = document.getElementById("page-root");
    if (!root || !D()) return;
    root.innerHTML = `
      <section class="page-hero">
        <p class="eyebrow">BiasDrop</p>
        <h1>${t("about_title")}</h1>
        <p class="section-sub">${t("about_lead")}</p>
      </section>
      <div class="about-grid">
        <article class="about-card">
          <h2>${t("about_what_h")}</h2>
          <p>${t("about_what_p")}</p>
        </article>
        <article class="about-card">
          <h2>${t("about_sources_h")}</h2>
          <p>${t("about_sources_p")}</p>
        </article>
        <article class="about-card">
          <h2>${t("about_disclaimer_h")}</h2>
          <p>${t("about_disclaimer_p")}</p>
        </article>
      </div>
      <section class="content-block">
        <h2>${t("about_resources_h")}</h2>
        <div class="resource-grid">
          ${D()
            .resources.map(
              (r) => `<a class="resource-card" href="${r.url}" target="_blank" rel="noopener noreferrer">
              <strong>${escape(r.name)}</strong>
              <span>${escape(r.desc[lang()] || r.desc.en)}</span>
            </a>`
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderHomeHub() {
    const mount = document.getElementById("home-wiki-hub");
    if (!mount || !D()) return;
    const base = S().getBase();
    const vids = (window.BiasDropExtra && window.BiasDropExtra.homeVideos) || [];
    mount.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">${t("home_wiki_cta")}</p>
          <h2>${t("home_wiki_sub")}</h2>
        </div>
      </div>
      <div class="hub-grid">
        <a class="hub-card" href="${base}artists/"><strong>${t("home_explore_artists")}</strong><span>${D().artists.length} groups</span></a>
        <a class="hub-card" href="${base}albums/"><strong>${t("home_explore_albums")}</strong><span>${D().getAllAlbums().length}+ releases</span></a>
        <a class="hub-card" href="${base}concerts/"><strong>${t("home_explore_concerts")}</strong><span>${D().concerts.length} dates</span></a>
        <a class="hub-card" href="${base}faq/"><strong>${t("home_explore_faq")}</strong><span>${D().faqs.length} Q&A</span></a>
        <a class="hub-card" href="${base}blog/"><strong>${t("nav_blog")}</strong><span>20 ${t("blog_posts")}</span></a>
      </div>
      <div class="wiki-grid wiki-grid-home">
        ${D().artists.slice(0, 4).map((a) => artistCard(a, base)).join("")}
      </div>
    `;

    const ytMount = document.getElementById("home-yt-mvs");
    if (ytMount && vids.length) {
      ytMount.innerHTML = `
        <div class="section-head">
          <div>
            <p class="eyebrow">YouTube</p>
            <h2>${t("home_mv_title")}</h2>
            <p class="section-sub">${t("home_mv_sub")}</p>
          </div>
        </div>
        <div class="yt-grid">
          ${vids
            .map(
              (v) => `<figure class="yt-card">
              <div class="yt-frame">
                <iframe src="https://www.youtube-nocookie.com/embed/${v.id}?rel=0" title="${escape(v.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
              </div>
              <figcaption>
                <strong>${escape(v.title)}</strong>
                <span>${escape(v.artist)} · Official MV</span>
                <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer">YouTube</a>
              </figcaption>
            </figure>`
            )
            .join("")}
        </div>`;
    }
  }

  function renderBlogIndex() {
    const root = document.getElementById("page-root");
    const X = window.BiasDropExtra;
    if (!root || !X) return;
    const base = S().getBase();
    const posts = X.blogs || [];
    root.innerHTML = `
      <section class="page-hero">
        <p class="eyebrow">Blog</p>
        <h1>${t("blog_title")}</h1>
        <p class="section-sub">${t("blog_sub")}</p>
      </section>
      <div class="blog-grid">
        ${posts
          .map(
            (p, i) => `<article class="blog-card">
            <div class="blog-card-top">
              <span class="blog-num">#${String(p.num || i + 1).padStart(2, "0")}</span>
              <time class="blog-date" datetime="${escape(p.date)}">${escape(p.date)}</time>
            </div>
            <h2><a href="${base}blog/${p.slug}/">${escape(p.title)}</a></h2>
            <p class="blog-excerpt">${escape(p.excerpt)}</p>
            <div class="blog-card-tags">${(p.tags || []).map((tg) => `<span class="tag">${escape(tg)}</span>`).join("")}</div>
            <a class="btn btn-sm btn-neon" href="${base}blog/${p.slug}/">${t("blog_read")}</a>
          </article>`
          )
          .join("")}
      </div>`;
  }

  function renderBlogPost(slug) {
    const root = document.getElementById("page-root");
    const X = window.BiasDropExtra;
    if (!root || !X) return;
    const base = S().getBase();
    const posts = X.blogs || [];
    const post = posts.find((p) => p.slug === slug || p.id === slug);
    if (!post) {
      root.innerHTML = `<p class="empty-state">${t("no_results")}</p><p><a href="${base}blog/">${t("nav_blog")}</a></p>`;
      return;
    }
    const idx = posts.indexOf(post);
    const prev = idx > 0 ? posts[idx - 1] : null;
    const next = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null;
    document.title = `${post.title} · BiasDrop`;
    root.innerHTML = `
      <nav class="crumbs"><a href="${base}index.html">${t("breadcrumb_home")}</a><span>/</span><a href="${base}blog/">${t("nav_blog")}</a><span>/</span><span>${escape(post.title)}</span></nav>
      <article class="blog-article">
        <header class="blog-article-head">
          <div class="blog-card-top">
            <span class="blog-num">#${String(post.num || idx + 1).padStart(2, "0")}</span>
            <time class="blog-date" datetime="${escape(post.date)}">${escape(post.date)}</time>
          </div>
          <h1>${escape(post.title)}</h1>
          <div class="blog-card-tags">${(post.tags || []).map((tg) => `<span class="tag">${escape(tg)}</span>`).join("")}</div>
        </header>
        <div class="blog-body">${formatBlogHtml(post.html, post.title)}</div>
        <nav class="blog-pager">
          ${prev ? `<a class="blog-pager-link prev" href="${base}blog/${prev.slug}/"><span>${t("blog_prev")}</span><strong>${escape(prev.title)}</strong></a>` : `<span></span>`}
          <a class="btn btn-sm btn-ghost" href="${base}blog/">${t("nav_blog")}</a>
          ${next ? `<a class="blog-pager-link next" href="${base}blog/${next.slug}/"><span>${t("blog_next")}</span><strong>${escape(next.title)}</strong></a>` : `<span></span>`}
        </nav>
      </article>`;
  }

  function renderLegal(kind) {
    const root = document.getElementById("page-root");
    if (!root) return;
    const base = S().getBase();
    const isPrivacy = kind === "privacy";
    document.title = `${isPrivacy ? t("nav_privacy") : t("nav_terms")} · BiasDrop`;
    root.innerHTML = `
      <section class="page-hero">
        <h1>${isPrivacy ? t("nav_privacy") : t("nav_terms")}</h1>
        <p class="section-sub">${t("legal_updated")}</p>
      </section>
      <article class="bio-prose legal-prose">
        ${
          isPrivacy
            ? `<p>${t("privacy_p1")}</p><h2>${t("privacy_h2")}</h2><p>${t("privacy_p2")}</p><h2>${t("privacy_h3")}</h2><p>${t("privacy_p3")}</p><h2>${t("privacy_h4")}</h2><p>${t("privacy_p4")}</p>`
            : `<p>${t("terms_p1")}</p><h2>${t("terms_h2")}</h2><p>${t("terms_p2")}</p><h2>${t("terms_h3")}</h2><p>${t("terms_p3")}</p><h2>${t("terms_h4")}</h2><p>${t("terms_p4")}</p>`
        }
        <p class="back-row"><a href="${base}index.html">← ${t("breadcrumb_home")}</a></p>
      </article>`;
  }

  return {
    renderArtistsIndex,
    renderArtistProfile,
    renderConcerts,
    renderAlbums,
    renderFaq,
    renderAbout,
    renderHomeHub,
    renderBlogIndex,
    renderBlogPost,
    renderLegal,
  };
})();

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

  function artistCard(a, base) {
    const photo = S().photoFor(a.photoKey);
    const attrs = S().imgAttrs(photo, a.name);
    return `
    <article class="wiki-card">
      <a class="wiki-card-media" href="${base}artists/${a.id}/" style="--accent:${a.color}">
        <img src="${attrs.src}" alt="${escape(attrs.alt)}" title="${escape(attrs.title)}" loading="lazy" width="600" height="600">
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
    const photo = S().photoFor(a.photoKey);
    const attrs = S().imgAttrs(photo, a.name);
    const concerts = D().getConcertsByArtist(a.id);
    const L = a.links || {};

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
        <img src="${attrs.src}" alt="${escape(attrs.alt)}" title="${escape(attrs.title)}" width="640" height="640">
      </div>
      <div class="profile-copy">
        <p class="eyebrow">${a.fandom} · ${a.gen} gen</p>
        <h1>${a.name}</h1>
        <p class="profile-bio">${escape(D().bio(a, lang()))}</p>
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
          ${L.youtube ? S().extLink(L.youtube, t("open_youtube"), "btn btn-sm btn-ghost") : ""}
        </div>
      </div>
    </header>

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
              <th></th>
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
              <td>${d.spotify ? S().extLink(d.spotify, "Spotify", "text-link") : ""}</td>
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
              ${s.spotify ? S().extLink(s.spotify, t("artists_listen"), "btn btn-sm btn-ghost") : ""}
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
      <div class="concert-list">
        ${list.length ? list.map((c) => concertCard(c, base)).join("") : `<p class="empty-state">${t("no_results")}</p>`}
      </div>
      <p class="muted tiny-note">${t("concerts_sub")}</p>
    `;

    document.getElementById("f-artist")?.addEventListener("change", renderConcerts);
    document.getElementById("f-region")?.addEventListener("change", renderConcerts);
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

    const opts = D().artists
      .map((a) => `<option value="${a.id}" ${artistFilter === a.id ? "selected" : ""}>${a.name}</option>`)
      .join("");

    root.innerHTML = `
      <section class="page-hero">
        <p class="eyebrow">${t("nav_albums_page")}</p>
        <h1>${mode === "songs" ? t("songs_title") : t("albums_title")}</h1>
        <p class="section-sub">${mode === "songs" ? t("songs_sub") : t("albums_sub")}</p>
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
                  ${s.spotify ? S().extLink(s.spotify, t("artists_listen"), "btn btn-sm btn-ghost") : ""}
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
                      (d) => `<article class="album-card" style="--accent:${d.color}">
                <div class="album-year">${d.year}</div>
                <h3>${escape(d.title)}</h3>
                <p class="muted"><a href="${base}artists/${d.artistId}/">${escape(d.artistName)}</a></p>
                <p><span class="tag">${escape(d.type)}</span> ${d.highlight ? `· ${escape(d.highlight)}` : ""}</p>
                ${d.spotify ? S().extLink(d.spotify, t("albums_open_spotify"), "btn btn-sm btn-neon") : ""}
              </article>`
                    )
                    .join("")
                : `<p class="empty-state">${t("no_results")}</p>`
            }</div>`
      }
    `;

    document.getElementById("alb-artist")?.addEventListener("change", renderAlbums);
    document.getElementById("alb-mode")?.addEventListener("change", renderAlbums);
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
      </div>
      <div class="wiki-grid wiki-grid-home">
        ${D().artists.slice(0, 4).map((a) => artistCard(a, base)).join("")}
      </div>
    `;
  }

  return {
    renderArtistsIndex,
    renderArtistProfile,
    renderConcerts,
    renderAlbums,
    renderFaq,
    renderAbout,
    renderHomeHub,
  };
})();

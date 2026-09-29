(function () {
  const CFG_KEY = "heylead.places.cfg.v1";
  const DEFAULT_API = "https://heylead-places.martin-656.workers.dev";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const state = {
    places: [],
    query: "",
    loading: false,
    serverKey: false,
  };

  function parseCfg(raw) {
    if (!raw) return null;
    try {
      const cfg = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!cfg || typeof cfg !== "object") return null;
      return cfg;
    } catch {
      return null;
    }
  }

  function normalizeCfg(cfg) {
    return {
      apiBase: String((cfg && cfg.apiBase) || DEFAULT_API).replace(/\/+$/, "") || DEFAULT_API,
      token: String((cfg && cfg.token) || "").trim(),
      placesKey: String((cfg && cfg.placesKey) || "").trim(),
      savedAt: (cfg && cfg.savedAt) || null,
    };
  }

  function loadCfg() {
    try {
      return normalizeCfg(parseCfg(localStorage.getItem(CFG_KEY)));
    } catch {
      return normalizeCfg({});
    }
  }

  function saveCfg(cfg) {
    const next = normalizeCfg({ ...cfg, savedAt: new Date().toISOString() });
    try {
      localStorage.setItem(CFG_KEY, JSON.stringify(next));
    } catch {}
    return next;
  }

  function takeHashToken() {
    try {
      const hash = String(location.hash || "");
      if (hash.indexOf("#pl=") !== 0) return;
      let pending = "";
      try {
        pending = decodeURIComponent(hash.slice(4)).trim();
      } catch {
        pending = hash.slice(4).trim();
      }
      history.replaceState(null, "", location.pathname + location.search);
      if (!pending) return;
      const cfg = loadCfg();
      saveCfg({ ...cfg, token: pending });
    } catch {}
  }

  let cfg = loadCfg();
  takeHashToken();
  cfg = loadCfg();

  function setStatus(text, kind) {
    const pill = $("#status-pill");
    const line = $("#status-text");
    pill.textContent = text;
    pill.className = "pill" + (kind ? " " + kind : "");
    if (line && kind !== "run") {
      /* keep last detailed message in status-text when provided separately */
    }
  }

  function showFatal(msg) {
    const el = $("#fatal");
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function needsClientKey() {
    return !state.serverKey && !cfg.placesKey;
  }

  function refreshSetup() {
    const setup = $("#setup");
    const tokenMissing = !cfg.token;
    setup.hidden = !(needsClientKey() || tokenMissing);
    $("#cfg-api").value = cfg.apiBase;
    $("#cfg-token").value = cfg.token;
    $("#cfg-key").value = cfg.placesKey;
    if ($("#setup-token") && !tokenMissing) $("#setup-token").placeholder = "Saved in this browser";
  }

  async function api(path, options) {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      (options && options.headers) || {},
    );
    if (cfg.token) headers["X-App-Token"] = cfg.token;
    if (cfg.placesKey) headers["X-Places-Key"] = cfg.placesKey;
    const res = await fetch(cfg.apiBase + path, {
      method: (options && options.method) || "GET",
      headers,
      body: options && options.body ? JSON.stringify(options.body) : undefined,
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    if (!res.ok) {
      const err = new Error(data.error || "Request failed (" + res.status + ")");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function ping() {
    try {
      const health = await fetch(cfg.apiBase + "/api/health").then((r) => r.json());
      state.serverKey = health.placesKey === "server";
      refreshSetup();
      if (health.tokenRequired && !cfg.token) {
        showFatal("This Worker expects an APP_TOKEN. Open Settings or use the connect link.");
      }
    } catch {
      state.serverKey = false;
      refreshSetup();
    }
  }

  function csvEscape(value) {
    const s = String(value == null ? "" : value);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function downloadCsv(filename, rows) {
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function listingsCsv(places) {
    const header = [
      "name",
      "rating",
      "review_count",
      "phone",
      "website",
      "address",
      "maps_url",
      "type",
      "status",
      "service_area_only",
      "place_id",
    ];
    const lines = [header.join(",")];
    places.forEach((p) => {
      lines.push(
        [
          p.name,
          p.rating == null ? "" : p.rating,
          p.reviewCount || 0,
          p.phone,
          p.website,
          p.address,
          p.mapsUrl,
          p.primaryType,
          p.status,
          p.serviceAreaOnly ? "yes" : "",
          p.placeId,
        ]
          .map(csvEscape)
          .join(","),
      );
    });
    return lines;
  }

  function reviewsCsv(places) {
    const header = ["place", "place_id", "author", "rating", "when", "text", "review_maps_url"];
    const lines = [header.join(",")];
    places.forEach((p) => {
      (p.reviews || []).forEach((r) => {
        lines.push(
          [p.name, p.placeId, r.author, r.rating == null ? "" : r.rating, r.relativeTime, r.text, r.mapsUri]
            .map(csvEscape)
            .join(","),
        );
      });
    });
    return lines;
  }

  function slug(text) {
    return String(text || "places")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  }

  function stars(rating) {
    if (rating == null) return "-";
    return Number(rating).toFixed(1);
  }

  function renderStats(places) {
    $("#stats").hidden = places.length === 0;
    $("#stat-count").textContent = String(places.length);
    $("#stat-phone").textContent = String(places.filter((p) => p.phone).length);
    $("#stat-web").textContent = String(places.filter((p) => p.website).length);
    const rated = places.filter((p) => typeof p.rating === "number");
    if (!rated.length) $("#stat-rating").textContent = "-";
    else {
      const avg = rated.reduce((s, p) => s + p.rating, 0) / rated.length;
      $("#stat-rating").textContent = avg.toFixed(2);
    }
  }

  function reviewBlock(place) {
    if (!place.reviews || !place.reviews.length) {
      return '<p class="hint">No review samples on this listing. Google still caps this at five.</p>';
    }
    return place.reviews
      .map((r) => {
        const who = r.author || "Google user";
        const when = r.relativeTime || "";
        const rate = r.rating != null ? r.rating + "★" : "";
        return (
          '<article class="review"><div class="review-meta">' +
          escapeHtml(who) +
          (rate ? " · " + rate : "") +
          (when ? " · " + escapeHtml(when) : "") +
          "</div><div>" +
          escapeHtml(r.text || "") +
          "</div></article>"
        );
      })
      .join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeHttpUrl(url) {
    try {
      const parsed = new URL(String(url || ""));
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
    } catch {}
    return "";
  }

  function renderResults() {
    const root = $("#results");
    const places = state.places;
    $("#btn-export").disabled = places.length === 0;
    $("#btn-export-reviews").disabled = !places.some((p) => p.reviews && p.reviews.length);
    renderStats(places);
    if (!places.length) {
      root.innerHTML = '<div class="empty">No listings yet.</div>';
      return;
    }
    root.innerHTML =
      "<table><thead><tr>" +
      "<th>Business</th><th>Rating</th><th>Contact</th><th></th>" +
      "</tr></thead><tbody>" +
      places
        .map((p, i) => {
          const mapsUrl = safeHttpUrl(p.mapsUrl);
          const webUrl = safeHttpUrl(p.website);
          const maps = mapsUrl
            ? '<a href="' + escapeHtml(mapsUrl) + '" target="_blank" rel="noopener">Maps</a>'
            : "";
          const web = webUrl
            ? '<a href="' + escapeHtml(webUrl) + '" target="_blank" rel="noopener">Website</a>'
            : "";
          const tel = String(p.phoneIntl || p.phone || "").replace(/[^\d+]/g, "");
          const phone = p.phone
            ? '<a href="tel:' + escapeHtml(tel) + '">' + escapeHtml(p.phone) + "</a>"
            : '<span class="muted">No phone</span>';
          return (
            '<tr data-i="' +
            i +
            '"><td><div class="name">' +
            escapeHtml(p.name) +
            "</div><div class='muted'>" +
            escapeHtml(p.address) +
            "</div><div class='muted'>" +
            escapeHtml(p.primaryType) +
            (p.serviceAreaOnly ? " · mobile" : "") +
            "</div></td><td><div class='stars'>" +
            stars(p.rating) +
            "</div><div class='muted'>" +
            (p.reviewCount || 0) +
            " reviews</div></td><td>" +
            phone +
            '<div class="links">' +
            web +
            maps +
            "</div></td><td>" +
            '<button type="button" class="btn sm ghost" data-expand="' +
            i +
            '">Reviews</button>' +
            "</td></tr>" +
            '<tr class="review-row" data-reviews="' +
            i +
            '" hidden><td colspan="4"><div class="reviews" id="rev-' +
            i +
            '">' +
            reviewBlock(p) +
            "</div></td></tr>"
          );
        })
        .join("") +
      "</tbody></table>";
  }

  async function toggleReviews(index) {
    const row = document.querySelector('[data-reviews="' + index + '"]');
    if (!row) return;
    const opening = row.hidden;
    row.hidden = !opening;
    if (!opening) return;
    const place = state.places[index];
    if (place.reviews && place.reviews.length) return;
    const box = $("#rev-" + index);
    box.innerHTML = '<p class="hint">Loading the five-review sample...</p>';
    try {
      const data = await api("/api/reviews", { method: "POST", body: { placeId: place.placeId } });
      place.reviews = data.reviews || [];
      box.innerHTML = reviewBlock(place);
      $("#btn-export-reviews").disabled = !state.places.some((p) => p.reviews && p.reviews.length);
    } catch (error) {
      box.innerHTML = '<p class="hint">' + escapeHtml(error.message) + "</p>";
    }
  }

  async function runSearch(event) {
    if (event) event.preventDefault();
    if (needsClientKey()) {
      showFatal("Paste a Google Places API key first.");
      $("#setup").hidden = false;
      return;
    }
    const query = $("#q-query").value.trim();
    const location = $("#q-location").value.trim();
    if (!query || !location) {
      showFatal("Industry and city are both required.");
      return;
    }
    showFatal("");
    state.loading = true;
    setStatus("Searching", "run");
    $("#status-text").textContent = "Calling Places API...";
    $("#btn-search").disabled = true;
    try {
      const data = await api("/api/search", {
        method: "POST",
        body: {
          query,
          location,
          region: $("#q-region").value,
          maxResults: Number($("#q-max").value),
          minRating: $("#q-rating").value ? Number($("#q-rating").value) : null,
          includeReviews: $("#q-reviews").checked,
          includeServiceArea: $("#q-service").checked,
          openNow: $("#q-open").checked,
        },
      });
      state.places = data.places || [];
      state.query = data.query || query + " in " + location;
      $("#results-title").textContent = state.query;
      $("#status-text").textContent =
        data.count +
        " listings. Google cap is 5 reviews each. " +
        (data.attribution || "Powered by Google.");
      setStatus("Done", "ok");
      renderResults();
    } catch (error) {
      setStatus("Error", "err");
      $("#status-text").textContent = error.message;
      showFatal(error.message);
    } finally {
      state.loading = false;
      $("#btn-search").disabled = false;
    }
  }

  function applyPreset(btn) {
    $("#q-query").value = btn.getAttribute("data-q") || "";
    $("#q-location").value = btn.getAttribute("data-loc") || "";
    const region = btn.getAttribute("data-region");
    if (region != null) $("#q-region").value = region;
  }

  $("#search-form").addEventListener("submit", runSearch);
  $("#presets").addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-q]");
    if (!btn) return;
    applyPreset(btn);
  });
  $("#results").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-expand]");
    if (!btn) return;
    toggleReviews(Number(btn.getAttribute("data-expand")));
  });
  $("#btn-export").addEventListener("click", () => {
    if (!state.places.length) return;
    downloadCsv("places-" + slug(state.query) + ".csv", listingsCsv(state.places));
  });
  $("#btn-export-reviews").addEventListener("click", () => {
    const rows = reviewsCsv(state.places);
    if (rows.length < 2) return;
    downloadCsv("places-reviews-" + slug(state.query) + ".csv", rows);
  });
  $("#btn-settings").addEventListener("click", () => {
    refreshSetup();
    $("#settings").showModal();
  });
  $("#btn-save-cfg").addEventListener("click", async () => {
    cfg = saveCfg({
      apiBase: $("#cfg-api").value,
      token: $("#cfg-token").value,
      placesKey: $("#cfg-key").value,
    });
    showFatal("");
    await ping();
    try {
      const health = await fetch(cfg.apiBase + "/api/health").then((r) => r.json());
      setStatus(health.ok ? "Connected" : "Check Worker", health.ok ? "ok" : "err");
      $("#status-text").textContent =
        health.placesKey === "server"
          ? "Worker has a Places key."
          : "Using the key saved in this browser.";
    } catch (error) {
      setStatus("Error", "err");
      showFatal(error.message || "Could not reach the Worker.");
    }
    $("#settings").close();
    refreshSetup();
  });
  $("#btn-save-key").addEventListener("click", () => {
    cfg = saveCfg({
      ...cfg,
      token: $("#setup-token").value || cfg.token,
      placesKey: $("#setup-key").value || cfg.placesKey,
    });
    $("#setup-key").value = "";
    $("#setup-token").value = "";
    showFatal("");
    refreshSetup();
    ping();
  });

  renderResults();
  refreshSetup();
  ping();
})();

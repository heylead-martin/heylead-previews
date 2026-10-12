(function () {
  const CFG_KEY = "heylead.keywords.cfg.v1";
  const DEFAULT_API = "https://heylead-keywords.martin-656.workers.dev";
  const FALLBACK = [
    { id: "aircon", name: "Aircon servicing", keywords: ["aircon servicing", "aircon chemical wash", "aircon gas top up", "aircon repair"] },
    { id: "plumbing", name: "Plumbing", keywords: ["plumber", "choked toilet", "water leak repair", "water heater installation"] },
    { id: "electrician", name: "Electrician", keywords: ["electrician", "power trip", "electrical repair", "lighting installation"] },
    { id: "handyman", name: "Handyman", keywords: ["handyman", "furniture assembly", "tv wall mount", "small home repair"] },
    { id: "cleaning", name: "Home cleaning", keywords: ["home cleaning", "house cleaning service", "part time cleaner", "move out cleaning"] },
  ];

  const $ = (sel) => document.querySelector(sel);
  const state = { mode: "ideas", result: null, groups: FALLBACK };

  function loadCfg() {
    try {
      const raw = JSON.parse(localStorage.getItem(CFG_KEY) || "{}");
      return {
        apiBase: String(raw.apiBase || DEFAULT_API).replace(/\/+$/, "") || DEFAULT_API,
        token: String(raw.token || "").trim(),
      };
    } catch {
      return { apiBase: DEFAULT_API, token: "" };
    }
  }

  function saveCfg(cfg) {
    const next = { apiBase: cfg.apiBase || DEFAULT_API, token: String(cfg.token || "").trim(), savedAt: new Date().toISOString() };
    try { localStorage.setItem(CFG_KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function takeHashToken() {
    const hash = String(location.hash || "");
    if (hash.indexOf("#kw=") !== 0) return;
    let pending = "";
    try { pending = decodeURIComponent(hash.slice(4)).trim(); } catch { pending = hash.slice(4).trim(); }
    history.replaceState(null, "", location.pathname + location.search);
    if (!pending) return;
    cfg = saveCfg({ ...cfg, token: pending });
  }

  let cfg = loadCfg();
  takeHashToken();
  cfg = loadCfg();

  function setPill(text, kind) {
    const pill = $("#status-pill");
    pill.textContent = text;
    pill.className = "pill" + (kind ? " " + kind : "");
  }

  function showFatal(msg) {
    const el = $("#fatal");
    el.hidden = !msg;
    el.textContent = msg || "";
  }

  function refreshSetup() {
    $("#setup").hidden = Boolean(cfg.token);
    $("#setup-token").value = "";
  }

  function applyMode() {
    document.querySelectorAll(".ideas-only").forEach((el) => { el.hidden = state.mode !== "ideas"; });
    document.querySelectorAll(".forecast-only").forEach((el) => { el.hidden = state.mode !== "forecast"; });
    document.querySelectorAll("#modes button").forEach((btn) => {
      btn.classList.toggle("on", btn.getAttribute("data-mode") === state.mode);
    });
    $("#btn-search").textContent = state.mode === "forecast" ? "Forecast" : "Get volumes";
  }

  function renderPresets() {
    const wrap = $("#presets");
    wrap.replaceChildren();
    for (const group of state.groups) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = group.name;
      btn.addEventListener("click", () => {
        $("#q-keywords").value = (group.keywords || []).join("\n");
        if (state.mode === "ideas") $("#q-url").value = "";
      });
      wrap.appendChild(btn);
    }
  }

  function num(value) {
    if (value === null || value === undefined || value === "") return "-";
    return new Intl.NumberFormat("en-SG").format(value);
  }

  function money(value, currency) {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("en-SG", { style: "currency", currency: currency || "USD" }).format(value);
  }

  function lastMonth(row) {
    const volumes = row.monthlyVolumes || [];
    if (!volumes.length) return "-";
    const last = volumes[volumes.length - 1];
    return `${num(last.searches)} ${String(last.month || "").slice(0, 3).toLowerCase()} ${last.year}`;
  }

  function renderTable(result) {
    const keywords = result.keywords || [];
    const body = $("#rows");
    body.replaceChildren();
    const currency = result.bidCurrency || "USD";
    for (const row of keywords) {
      const tr = document.createElement("tr");
      const cells = [
        row.text,
        num(row.avgMonthlySearches),
        row.competition || "-",
        num(row.competitionIndex),
        money(row.lowTopOfPageBid, currency),
        money(row.highTopOfPageBid, currency),
        lastMonth(row),
      ];
      cells.forEach((value, index) => {
        const td = document.createElement("td");
        if (index) td.className = "num";
        else td.className = "name";
        td.textContent = value;
        tr.appendChild(td);
      });
      body.appendChild(tr);
      if ((row.monthlyVolumes || []).length) {
        const detail = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 7;
        td.className = "months";
        td.textContent = row.monthlyVolumes.map((item) => `${item.year} ${String(item.month).slice(0, 3).toLowerCase()}: ${num(item.searches)}`).join(" | ");
        detail.appendChild(td);
        body.appendChild(detail);
      }
    }
    $("#results-card").hidden = !keywords.length;
    $("#results-pill").textContent = result.moreAvailable ? "More exist" : `${keywords.length} shown`;
    $("#btn-csv").disabled = !keywords.length;
  }

  function renderForecast(result) {
    const card = $("#forecast-card");
    const forecast = result.forecast;
    card.hidden = !forecast;
    if (!forecast) return;
    const currency = result.currency || "SGD";
    const wrap = $("#forecast-metrics");
    wrap.replaceChildren();
    const items = [
      ["Clicks", num(forecast.clicks)],
      ["Cost", money(forecast.cost, currency)],
      ["Avg CPC", money(forecast.averageCpc, currency)],
      ["Impressions", "Not returned"],
    ];
    for (const [label, value] of items) {
      const box = document.createElement("div");
      box.className = "metric";
      const name = document.createElement("div");
      name.className = "metric-label";
      name.textContent = label;
      const val = document.createElement("div");
      val.className = "metric-val";
      val.textContent = value;
      box.append(name, val);
      wrap.appendChild(box);
    }
    $("#forecast-pill").textContent = `${result.matchType || "PHRASE"} · ${currency}`;
    $("#forecast-note").textContent = result.note || "";
  }

  function renderStats(result) {
    const keywords = result.keywords || [];
    $("#stats").hidden = false;
    $("#stat-count").textContent = result.forecast ? "1 set" : String(keywords.length);
    const top = keywords[0];
    $("#stat-top").textContent = top ? num(top.avgMonthlySearches) : "-";
    $("#stat-lang").textContent = result.languageName || "-";
    $("#stat-cache").textContent = result.cached ? "Cached" : "Live";
    $("#json-card").hidden = false;
    $("#json-out").textContent = JSON.stringify(result, null, 2);
  }

  async function api(path, body) {
    const response = await fetch(cfg.apiBase + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "X-App-Token": cfg.token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  async function checkHealth() {
    refreshSetup();
    if (!cfg.token) {
      setPill("Need token", "err");
      return;
    }
    try {
      const health = await api("/api/health");
      if (Array.isArray(health.trades) && health.trades.length) {
        state.groups = health.jobs && health.jobs.length ? health.trades.concat(health.jobs) : health.trades;
        renderPresets();
      }
      setPill(health.configured ? "Server ready" : "Not configured", health.configured ? "ok" : "err");
    } catch (error) {
      setPill("Offline", "err");
      showFatal(error.message);
    }
  }

  function payload() {
    const keywords = $("#q-keywords").value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
    const base = { keywords, language: $("#q-language").value, geo: "2702", refresh: $("#q-refresh").checked };
    if (state.mode === "ideas") {
      return { ...base, url: $("#q-url").value.trim(), pageSize: Number($("#q-size").value) };
    }
    if (state.mode === "forecast") {
      const budgetRaw = $("#q-budget").value.trim();
      return {
        ...base,
        maxCpc: Number($("#q-cpc").value),
        dailyBudget: budgetRaw === "" ? undefined : Number(budgetRaw),
        matchType: $("#q-match").value,
        currency: $("#q-currency").value,
      };
    }
    return base;
  }

  const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  function monthKey(volume) {
    const index = MONTHS.indexOf(String(volume.month || "").toUpperCase());
    const mm = index === -1 ? "00" : String(index + 1).padStart(2, "0");
    return `${volume.year}-${mm}`;
  }

  function downloadCsv() {
    const result = state.result;
    if (!result || !result.keywords) return;
    const months = [];
    const seen = new Set();
    for (const row of result.keywords) {
      for (const volume of row.monthlyVolumes || []) {
        const key = monthKey(volume);
        if (seen.has(key)) continue;
        seen.add(key);
        months.push(key);
      }
    }
    months.sort();
    const headers = ["keyword", "avg_monthly_searches", "competition", "competition_index", "low_top_of_page_bid", "high_top_of_page_bid", "average_cpc", "bid_currency", "close_variants", ...months];
    const lines = [headers.join(",")];
    for (const row of result.keywords) {
      const byMonth = new Map((row.monthlyVolumes || []).map((volume) => [monthKey(volume), volume.searches]));
      const cells = [row.text, row.avgMonthlySearches, row.competition, row.competitionIndex, row.lowTopOfPageBid, row.highTopOfPageBid, row.averageCpc, result.bidCurrency || "USD", (row.closeVariants || []).join("|"), ...months.map((month) => byMonth.get(month) ?? "")];
      lines.push(cells.map(csvCell).join(","));
    }
    const blob = new Blob([lines.join("\n") + "\n"], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "roster-keywords.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function csvCell(value) {
    if (value === null || value === undefined) return "";
    let text = String(value);
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
    return text;
  }

  $("#modes").addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    state.mode = btn.getAttribute("data-mode");
    applyMode();
  });

  $("#btn-save").addEventListener("click", () => {
    cfg = saveCfg({ ...cfg, token: $("#setup-token").value });
    showFatal("");
    checkHealth();
  });

  $("#btn-csv").addEventListener("click", downloadCsv);
  $("#btn-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("#json-out").textContent || "");
      setPill("Copied", "ok");
    } catch {
      setPill("Copy failed", "err");
    }
  });

  $("#search-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    showFatal("");
    if (!cfg.token) {
      refreshSetup();
      showFatal("Open the connect link once so this browser can call Keyword Planner.");
      return;
    }
    setPill("Running", "run");
    $("#btn-search").disabled = true;
    try {
      const path = state.mode === "ideas" ? "/api/ideas" : state.mode === "forecast" ? "/api/forecast" : "/api/historical";
      const result = await api(path, payload());
      state.result = result;
      renderStats(result);
      renderTable(result);
      renderForecast(result);
      setPill(result.cached ? "Cached" : "Live", "ok");
    } catch (error) {
      setPill("Error", "err");
      showFatal(error.message);
    } finally {
      $("#btn-search").disabled = false;
    }
  });

  renderPresets();
  applyMode();
  checkHealth();
})();

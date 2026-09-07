/* TickerLab desk - one CIO note. Paper only. */
(function () {
  const API = "https://applylab-api.martin-656.workers.dev";
  const STORE = "tickerlab.desk.v2";

  const $ = (sel) => document.querySelector(sel);
  const state = {
    amount: 10000,
    payload: null,
    book: null,
    quotes: [],
    askBusy: false,
  };
  let ws = null;

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function money(n, digits, signed) {
    if (!Number.isFinite(n)) return "-";
    const sign = signed ? (n > 0 ? "+" : n < 0 ? "-" : "") : n < 0 ? "-" : "";
    const abs = Math.abs(n);
    return sign + "$" + abs.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
  function px(n) {
    if (!Number.isFinite(n)) return "-";
    const d = n >= 100 ? 2 : n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function pct(n) {
    if (!Number.isFinite(n)) return "-";
    const sign = n > 0 ? "+" : "";
    return sign + n.toFixed(2) + "%";
  }
  function cls(n) {
    return n > 0 ? "up" : n < 0 ? "down" : "";
  }
  function escapeHtml(s) {
    return String(s || "")
      .replace(/[\u2012-\u2015]/g, "-")
      .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function windowSec(sleeve) {
    return sleeve === "crypto" ? 86400 : 23400;
  }
  function rates(amount, changePct, sleeve) {
    const day = amount * (num(changePct) / 100);
    const sec = day / windowSec(sleeve);
    return { day, hour: sec * 3600, sec };
  }

  function persist() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ amount: state.amount, book: state.book }));
    } catch (e) {}
  }
  function restore() {
    try {
      const o = JSON.parse(localStorage.getItem(STORE) || "null");
      if (!o) return;
      if (o.amount) state.amount = Math.max(100, Number(o.amount) || 10000);
      if (o.book) state.book = o.book;
    } catch (e) {}
  }

  function flattenQuotes(tape) {
    const q = (tape && tape.quotes) || {};
    return [].concat(q.stocks || [], q.etfs || [], q.crypto || [], q.pennies || []);
  }
  function byId(id) {
    return state.quotes.find((q) => q.id === id || q.symbol === id);
  }

  function formatAsOf(iso) {
    if (!iso) return "";
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(iso)) + " ET";
    } catch (e) {
      return iso;
    }
  }

  function renderCall(brief, meta) {
    const stance = brief.stance || "mixed";
    $("#call-meta").innerHTML =
      '<span class="pill ' + escapeHtml(stance) + '">' + escapeHtml(stance) + "</span>" +
      '<span class="pill">' + escapeHtml(brief.horizon || "near term") + "</span>" +
      '<span class="pill">confidence ' + escapeHtml(String(brief.confidence ?? "-")) + "</span>" +
      (meta.mode === "tape-only" ? '<span class="pill">tape only - search missed</span>' : "") +
      (meta.cached ? '<span class="pill">cached</span>' : '<span class="pill">just written</span>');
    $("#headline").textContent = brief.headline || "No call yet.";
    $("#thesis").textContent = brief.thesis || "";
  }

  function renderAlloc(brief) {
    const rows = (brief.allocations || []).slice();
    const cash = num(brief.cashPct);
    const html = rows.map((a) => {
      const dollars = state.amount * (num(a.weight) / 100);
      return '<li>' +
        '<div><div class="sym">' + escapeHtml(a.symbol) + '</div>' +
        '<div class="action ' + escapeHtml(a.action) + '">' + escapeHtml(a.action) + "</div></div>" +
        '<div><div class="alloc-name">' + escapeHtml(a.name) + "</div></div>" +
        '<div class="w"><b>' + num(a.weight).toFixed(1) + '%</b><span>' + money(dollars, 0, false) + "</span></div>" +
        '<div class="why">' + escapeHtml(a.why) +
        (a.catalyst ? " Catalyst: " + escapeHtml(a.catalyst) : "") +
        "</div></li>";
    }).join("");
    const cashHtml = cash > 0
      ? '<li class="cash-row"><div><div class="sym">CASH</div></div><div class="alloc-name">Sit this out</div>' +
        '<div class="w"><b>' + cash.toFixed(1) + '%</b><span>' + money(state.amount * cash / 100, 0, false) + "</span></div></li>"
      : "";
    $("#alloc").innerHTML = html + cashHtml || '<li class="empty">Waiting on the desk.</li>';
    $("#book-amount-label").textContent = money(state.amount, 0, false);
  }

  function renderWorld(brief, citations) {
    const items = brief.world || [];
    $("#world").innerHTML = items.length
      ? items.map((w) =>
        "<li><div class=\"world-title\">" + escapeHtml(w.title) + "</div>" +
        '<div class="so">So we: ' + escapeHtml(w.implication) + "</div></li>"
      ).join("")
      : '<li class="empty">No world items on this pass.</li>';
    const cites = (citations || []).slice(0, 6);
    $("#cites").innerHTML = cites.length
      ? "Sources: " + cites.map((u) => '<a href="' + escapeHtml(u) + '" target="_blank" rel="noopener">' + escapeHtml(u.replace(/^https?:\/\//, "").slice(0, 42)) + "</a>").join(" · ")
      : "";
    $("#kill").innerHTML = (brief.whatWouldChangeThis || []).map((t) => "<li>" + escapeHtml(t) + "</li>").join("")
      || '<li class="empty">No kill conditions listed.</li>';
  }

  function sessionLine(tape, meta) {
    const s = (tape && tape.session) || {};
    const q = flattenQuotes(tape);
    const spy = q.find((x) => x.symbol === "SPY");
    const btc = q.find((x) => x.symbol === "BTC");
    const bits = [s.label || "Session unknown"];
    if (spy) bits.push("SPY " + pct(spy.change));
    if (btc) bits.push("BTC " + pct(btc.change));
    if (meta && meta.model) bits.push(meta.model);
    $("#session-line").textContent = bits.join(" · ");
  }

  function markBook() {
    if (!state.book || !state.book.positions) {
      return { equity: state.amount, pnl: 0, day: 0, hour: 0, sec: 0, rows: [] };
    }
    let equity = 0, day = 0, hour = 0, sec = 0;
    const rows = state.book.positions.map((p) => {
      const q = byId(p.id) || byId(p.symbol);
      const last = q ? q.close : p.fill;
      const value = p.qty * last;
      const pnl = value - p.qty * p.fill;
      const r = rates(value, q ? q.change : 0, p.sleeve);
      equity += value;
      day += r.day;
      hour += r.hour;
      sec += r.sec;
      return Object.assign({}, p, { last, pnl, value });
    });
    return { equity, pnl: equity - state.amount, day, hour, sec, rows };
  }

  function renderPaper() {
    const using = !!(state.book && state.book.positions && state.book.positions.length);
    $("#paper").hidden = !using;
    if (!using) return;
    const m = markBook();
    $("#paper-label").textContent = state.book.label || "Deployed";
    const eq = $("#paper-eq");
    eq.textContent = money(m.equity, 2, false);
    eq.className = "paper-eq " + cls(m.pnl);
    $("#paper-day").textContent = money(m.day, 2, true);
    $("#paper-day").className = cls(m.day);
    $("#paper-hour").textContent = money(m.hour, 2, true);
    $("#paper-hour").className = cls(m.hour);
    const sign = m.sec > 0 ? "+" : m.sec < 0 ? "-" : "";
    $("#paper-sec").textContent = sign + "$" + Math.abs(m.sec).toFixed(4);
    $("#paper-sec").className = cls(m.sec);
    $("#holdings").innerHTML = m.rows.map((p) =>
      "<tr><td><div class=\"sym\">" + escapeHtml(p.symbol) + "</div><div class=\"alloc-name\">" +
      escapeHtml(p.name) + "</div></td><td>" + px(p.fill) + "</td><td>" + px(p.last) +
      "</td><td class=\"" + cls(p.pnl) + "\">" + money(p.pnl, 2, true) + "</td></tr>"
    ).join("");
  }

  function render() {
    const p = state.payload;
    if (!p || !p.brief) return;
    $("#amount").value = String(state.amount);
    $("#asof").textContent = (p.cached ? "Note as of " : "Written ") + formatAsOf(p.generatedAt);
    renderCall(p.brief, p);
    renderAlloc(p.brief);
    renderWorld(p.brief, p.citations);
    sessionLine(p.tape, p);
    renderPaper();
  }

  function takeBook() {
    const brief = state.payload && state.payload.brief;
    if (!brief) return;
    const positions = (brief.allocations || []).map((a) => {
      const q = byId(a.id) || byId(a.symbol);
      const fill = q ? q.close : num(a.close);
      const alloc = state.amount * (num(a.weight) / 100);
      if (!fill || alloc <= 0) return null;
      return {
        id: (q && q.id) || a.id || a.symbol,
        symbol: a.symbol,
        name: a.name,
        sleeve: a.sleeve,
        fill,
        qty: alloc / fill,
      };
    }).filter(Boolean);
    state.book = { label: brief.headline || "Desk book", at: Date.now(), positions };
    persist();
    renderPaper();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    $("#paper").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function connectWs() {
    if (ws) {
      try { ws.onclose = null; ws.close(); } catch (e) {}
      ws = null;
    }
    const pairs = state.quotes
      .filter((q) => q.sleeve === "crypto")
      .map((q) => (q.symbol + "USDT").toLowerCase());
    if (!pairs.length) return;
    try {
      ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=" + pairs.map((p) => p + "@miniTicker").join("/"));
    } catch (e) {
      return;
    }
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const d = msg.data || msg;
        const sym = String(d.s || "").replace("USDT", "");
        const q = state.quotes.find((x) => x.symbol === sym && x.sleeve === "crypto");
        if (!q) return;
        q.close = num(d.c);
        if (d.P != null) q.change = num(d.P);
      } catch (e) {}
    };
  }

  async function loadBrief(fresh) {
    $("#asof").textContent = "Writing the note...";
    $("#btn-refresh").disabled = true;
    try {
      const url = API + "/desk/brief" + (fresh ? "?fresh=1" : "");
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.brief) throw new Error(data.error || "Desk error");
      state.payload = data;
      state.quotes = flattenQuotes(data.tape);
      connectWs();
      render();
    } catch (err) {
      $("#headline").textContent = "The desk could not write.";
      $("#thesis").textContent = String(err && err.message || err) + " The worker needs an xAI key and a live tape.";
      $("#session-line").textContent = "Offline";
    } finally {
      $("#btn-refresh").disabled = false;
    }
  }

  async function ask(question) {
    if (state.askBusy) return;
    state.askBusy = true;
    $("#btn-ask").disabled = true;
    $("#ask-out").hidden = false;
    $("#ask-out").textContent = "Checking the world...";
    try {
      const res = await fetch(API + "/desk/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ask failed");
      $("#ask-out").textContent = data.answer || "";
    } catch (err) {
      $("#ask-out").textContent = String(err && err.message || err);
    } finally {
      state.askBusy = false;
      $("#btn-ask").disabled = false;
    }
  }

  function bind() {
    $("#btn-refresh").addEventListener("click", () => loadBrief(true));
    $("#btn-take").addEventListener("click", takeBook);
    $("#btn-reset").addEventListener("click", () => {
      state.book = null;
      persist();
      renderPaper();
    });
    $("#amount").addEventListener("change", (e) => {
      state.amount = Math.max(100, Number(e.target.value) || 10000);
      persist();
      render();
    });
    $("#ask-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const q = $("#ask-input").value.trim();
      if (q) ask(q);
    });
  }

  restore();
  bind();
  $("#amount").value = String(state.amount);
  loadBrief(false);

  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    if (state.book) renderPaper();
  }, 1000);
})();

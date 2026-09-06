/* TickerLab - static market desk. Paper only. */
(function () {
  const TV = "https://scanner.tradingview.com/america/scan";
  const CG = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h";
  const BN = "https://api.binance.com/api/v3/ticker/24hr";
  const NEWS = "https://news-headlines.tradingview.com/v2/headlines?client=web&lang=en";
  const STORE = "tickerlab.paper.v1";
  const COLS = [
    "name", "close", "change", "change_abs", "volume", "average_volume_10d_calc",
    "relative_volume_10d_calc", "market_cap_basic", "description", "Recommend.All",
    "RSI", "Perf.W", "Perf.1M", "price_52_week_high", "price_52_week_low", "sector",
    "exchange", "volatility.D", "type",
  ];
  const ETF_TICKERS = [
    "AMEX:SPY", "NASDAQ:QQQ", "AMEX:VOO", "AMEX:VTI", "AMEX:IWM", "AMEX:DIA",
    "AMEX:XLK", "AMEX:XLF", "AMEX:XLE", "AMEX:XLV", "AMEX:XLI", "AMEX:GLD",
    "NASDAQ:TLT", "AMEX:EEM", "AMEX:SMH", "AMEX:SOXX", "AMEX:ARKK", "AMEX:IBIT",
    "AMEX:BITO", "AMEX:HYG", "AMEX:VNQ", "AMEX:XLP",
  ];
  const PLAYBOOKS = [
    {
      id: "passive",
      name: "Passive",
      risk: "Low",
      blurb: "Broad ETFs, two mega-caps, a pinch of BTC. Built to sit there.",
      mix: { stocks: 15, etfs: 80, crypto: 5, pennies: 0 },
    },
    {
      id: "balanced",
      name: "Balanced",
      risk: "Medium",
      blurb: "Core index, quality stocks, BTC and ETH. No pennies.",
      mix: { stocks: 40, etfs: 40, crypto: 20, pennies: 0 },
    },
    {
      id: "aggressive",
      name: "Aggressive",
      risk: "High",
      blurb: "Momentum names, growth ETFs, more crypto, a small penny sleeve.",
      mix: { stocks: 35, etfs: 20, crypto: 30, pennies: 15 },
    },
    {
      id: "ultra",
      name: "Ultra aggressive",
      risk: "Extreme",
      blurb: "Concentrated high-beta crypto and pennies. Can go to zero.",
      mix: { stocks: 15, etfs: 10, crypto: 40, pennies: 35 },
    },
  ];
  const TITLES = {
    desk: ["Desk", "Live names, demo recommendations, and what paper money would print per day and per second."],
    playbooks: ["Playbooks", "Passive, balanced, aggressive, ultra. A basket, or one name if you only want a single ticket."],
    markets: ["Markets", "Stocks, ETFs, crypto, pennies. Score is a demo blend of tape, technicals, and headline pulse."],
    paper: ["Paper", "Type a virtual bankroll. Deploy a playbook, a mix, or a single name. Watch $/day and $/sec."],
  };
  const POS = /\b(beat|beats|surge|record|upgrade|upgrades|approved|approval|partnership|rally|ath|inflow|clears|deal|buyout|profit|growth|breakthrough|all-time|wins|won)\b/i;
  const NEG = /\b(miss|misses|downgrade|probe|ban|lawsuit|fraud|halt|bankruptcy|plunge|crash|investigation|delay|recall|layoff|default|warning|cuts|fine|sec charge)\b/i;

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const state = {
    view: "desk",
    sleeve: "stocks",
    playbook: "balanced",
    amount: 10000,
    mix: { stocks: 40, etfs: 40, crypto: 20, pennies: 0 },
    quotes: { stocks: [], etfs: [], crypto: [], pennies: [] },
    news: {},
    marketNews: [],
    book: null,
    sort: { key: "score", dir: "desc" },
    search: "",
    feeds: { tv: "loading", crypto: "loading", news: "loading" },
    tapePaused: false,
    sparkPaused: false,
    history: [],
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    focused: null,
  };

  let ws = null;
  let wsBackoff = 1000;

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function allQuotes() {
    return state.quotes.stocks.concat(state.quotes.etfs, state.quotes.crypto, state.quotes.pennies);
  }
  function byId(id) {
    return allQuotes().find((q) => q.id === id || q.symbol === id);
  }

  function money(n, digits = 2, signed = true) {
    if (!Number.isFinite(n)) return "-";
    const sign = signed ? (n > 0 ? "+" : n < 0 ? "-" : "") : n < 0 ? "-" : "";
    const abs = Math.abs(n);
    if (abs >= 1e9) return sign + "$" + (abs / 1e9).toFixed(2) + "B";
    if (abs >= 1e6) return sign + "$" + (abs / 1e6).toFixed(2) + "M";
    if (abs >= 1e3 && digits === 2 && abs >= 10000) {
      return sign + "$" + abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return sign + "$" + abs.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function px(n) {
    if (!Number.isFinite(n)) return "-";
    const d = n >= 100 ? 2 : n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function pct(n) {
    if (!Number.isFinite(n)) return "-";
    const sign = n > 0 ? "+" : n < 0 ? "" : "";
    return sign + n.toFixed(2) + "%";
  }
  function perSec(n) {
    if (!Number.isFinite(n)) return "-";
    const sign = n > 0 ? "+" : n < 0 ? "-" : "";
    const abs = Math.abs(n);
    const body = abs >= 0.01 ? abs.toFixed(3) : abs >= 0.0001 ? abs.toFixed(4) : abs.toFixed(6);
    return sign + "$" + body + "/sec";
  }
  function volFmt(n) {
    if (!Number.isFinite(n) || n <= 0) return "-";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(Math.round(n));
  }
  function clsPnL(n) {
    return n > 0 ? "up" : n < 0 ? "down" : "";
  }

  function nyseOpen() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => (parts.find((p) => p.type === t) || {}).value;
    const day = get("weekday");
    if (day === "Sat" || day === "Sun") return { open: false, label: "US cash closed (weekend)" };
    const hh = Number(get("hour"));
    const mm = Number(get("minute"));
    const mins = hh * 60 + mm;
    const open = mins >= 9 * 60 + 30 && mins < 16 * 60;
    return { open, label: open ? "US cash open" : "US cash closed - last session rate" };
  }

  function windowSec(sleeve) {
    return sleeve === "crypto" ? 86400 : 23400;
  }

  function rates(amount, changePct, sleeve) {
    const day = amount * (num(changePct) / 100);
    const sec = day / windowSec(sleeve);
    return { day, hour: sec * 3600, min: sec * 60, sec };
  }

  function scoreQuote(q) {
    const tv = Number.isFinite(q.recommend) ? q.recommend : 0;
    const chg = num(q.change);
    const rel = q.relVol > 0 ? q.relVol : 1;
    const rsi = q.rsi || 50;
    const week = num(q.perfW);
    const volD = num(q.volD);
    let s = 0;
    if (q.sleeve === "crypto") {
      s += 22;
      s += ((clamp(chg, -8, 8) + 8) / 16) * 28;
      s += Math.min(Math.abs(chg) > 0 ? 8 : 0, 8);
      s += chg > 0 && week >= 0 ? 6 : 0;
      s -= Math.abs(chg) > 12 ? 10 : 0;
    } else {
      s += (tv + 1) * 22.5;
      s += ((clamp(chg, -8, 8) + 8) / 16) * 20;
      s += Math.min(rel, 3) * 6;
      if (rsi >= 45 && rsi <= 65) s += 8;
      else if (rsi > 75 || rsi < 30) s -= 8;
      if ((week >= 0 && chg >= 0) || (week < 0 && chg < 0)) s += 5;
      if (Math.abs(chg) > 12) s -= 10;
      if (q.sleeve === "pennies") s -= Math.min(volD * 40, 8);
    }
    const pulse = q.newsPulse || 0;
    s += pulse * 8;
    q.score = Math.round(clamp(s, 0, 100));
    if (q.score >= 75) { q.label = "Strong buy"; q.labelClass = "strong-buy"; }
    else if (q.score >= 60) { q.label = "Accumulate"; q.labelClass = "accumulate"; }
    else if (q.score >= 45) { q.label = "Hold"; q.labelClass = "hold"; }
    else if (q.score >= 30) { q.label = "Watch"; q.labelClass = "watch"; }
    else { q.label = "Avoid"; q.labelClass = "avoid"; }
    return q;
  }

  function headlinePulse(title) {
    const t = String(title || "");
    const p = POS.test(t);
    const n = NEG.test(t);
    if (p && !n) return 1;
    if (n && !p) return -1;
    return 0;
  }
  function pulseWord(v) {
    if (v > 0.2) return { t: "constructive", c: "pos" };
    if (v < -0.2) return { t: "negative", c: "neg" };
    return { t: "mixed", c: "mix" };
  }

  function parseTV(item, sleeve) {
    const d = item.d || [];
    const full = item.s || "";
    const ex = full.includes(":") ? full.split(":")[0] : "";
    const desc = d[8] || "";
    if (/warrant|preferred|unit trust|right to buy|depositary|mandatory convertible/i.test(desc)) return null;
    if (/^(SPCX|GOOGM|GOOGN)$/.test(d[0] || "")) return null;
    const q = {
      id: full || (sleeve + ":" + d[0]),
      sleeve,
      tv: full,
      exchange: ex,
      symbol: d[0] || full,
      name: desc || d[0] || "",
      close: num(d[1]),
      change: num(d[2]),
      volume: num(d[4]),
      relVol: num(d[6]) || 1,
      marketCap: num(d[7]),
      recommend: d[9] == null ? 0 : num(d[9]),
      rsi: d[10] == null ? 50 : num(d[10]),
      perfW: num(d[11]),
      perfM: num(d[12]),
      sector: d[15] || "",
      volD: num(d[17]),
      newsPulse: 0,
      headlines: [],
    };
    if (!q.symbol || !q.close) return null;
    return q;
  }

  async function tvPost(body) {
    const res = await fetch(TV, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("TradingView " + res.status);
    return res.json();
  }

  async function loadEquities() {
    const stockBody = {
      filter: [
        { left: "type", operation: "equal", right: "stock" },
        { left: "is_primary", operation: "equal", right: true },
        { left: "typespecs", operation: "has", right: "common" },
        { left: "market_cap_basic", operation: "greater", right: 40000000000 },
      ],
      options: { lang: "en" },
      markets: ["america"],
      columns: COLS,
      sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
      range: [0, 30],
    };
    const etfBody = {
      symbols: { tickers: ETF_TICKERS, query: { types: [] } },
      columns: COLS,
      range: [0, 30],
    };
    const pennyBody = {
      filter: [
        { left: "type", operation: "equal", right: "stock" },
        { left: "is_primary", operation: "equal", right: true },
        { left: "close", operation: "less", right: 5 },
        { left: "close", operation: "greater", right: 0.5 },
        { left: "volume", operation: "greater", right: 2000000 },
        { left: "exchange", operation: "in_range", right: ["NASDAQ", "NYSE", "AMEX"] },
      ],
      options: { lang: "en" },
      markets: ["america"],
      columns: COLS,
      sort: { sortBy: "volume", sortOrder: "desc" },
      range: [0, 25],
    };
    const [stocks, etfs, pennies] = await Promise.all([
      tvPost(stockBody),
      tvPost(etfBody),
      tvPost(pennyBody),
    ]);
    state.quotes.stocks = (stocks.data || []).map((r) => parseTV(r, "stocks")).filter(Boolean);
    state.quotes.etfs = (etfs.data || []).map((r) => parseTV(r, "etfs")).filter(Boolean);
    state.quotes.pennies = (pennies.data || []).map((r) => parseTV(r, "pennies")).filter(Boolean);
    state.feeds.tv = "live";
  }

  function parseCg(c) {
    const sym = String(c.symbol || "").toUpperCase();
    return {
      id: "CRYPTO:" + sym,
      sleeve: "crypto",
      tv: "BINANCE:" + sym + "USDT",
      symbol: sym,
      name: c.name,
      close: num(c.current_price),
      change: num(c.price_change_percentage_24h),
      volume: num(c.total_volume),
      marketCap: num(c.market_cap),
      relVol: 1,
      recommend: 0,
      rsi: 50,
      perfW: 0,
      volD: Math.abs(num(c.price_change_percentage_24h)) / 100,
      newsPulse: 0,
      headlines: [],
      binance: sym + "USDT",
    };
  }

  async function loadCrypto() {
    try {
      const res = await fetch(CG);
      if (!res.ok) throw new Error("cg " + res.status);
      const data = await res.json();
      state.quotes.crypto = data.map(parseCg).filter((q) => q.close > 0);
      state.feeds.crypto = "live";
    } catch (err) {
      const res = await fetch(BN);
      if (!res.ok) throw err;
      const data = await res.json();
      const want = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "DOTUSDT", "LTCUSDT", "BCHUSDT"];
      const map = Object.fromEntries(data.map((t) => [t.symbol, t]));
      state.quotes.crypto = want.map((p) => {
        const t = map[p];
        if (!t) return null;
        const sym = p.replace("USDT", "");
        return {
          id: "CRYPTO:" + sym,
          sleeve: "crypto",
          tv: "BINANCE:" + p,
          symbol: sym,
          name: sym,
          close: num(t.lastPrice),
          change: num(t.priceChangePercent),
          volume: num(t.quoteVolume),
          marketCap: 0,
          relVol: 1,
          recommend: 0,
          rsi: 50,
          perfW: 0,
          volD: Math.abs(num(t.priceChangePercent)) / 100,
          newsPulse: 0,
          headlines: [],
          binance: p,
        };
      }).filter(Boolean);
      state.feeds.crypto = "live";
    }
  }

  async function loadFallback() {
    const res = await fetch("fallback.json");
    if (!res.ok) throw new Error("no fallback");
    const fb = await res.json();
    const lift = (row, sleeve) => {
      const q = Object.assign({ sleeve, newsPulse: 0, headlines: [], relVol: 1, rsi: 50 }, row);
      q.symbol = String(q.symbol || "").toUpperCase();
      q.id = sleeve === "crypto" ? "CRYPTO:" + q.symbol : (q.exchange || "X") + ":" + q.symbol;
      q.tv = q.id;
      q.binance = q.symbol + "USDT";
      q.name = q.name || q.symbol;
      return q;
    };
    if (!state.quotes.stocks.length) state.quotes.stocks = (fb.stocks || []).map((r) => lift(r, "stocks"));
    if (!state.quotes.etfs.length) state.quotes.etfs = (fb.etfs || []).map((r) => lift(r, "etfs"));
    if (!state.quotes.pennies.length) state.quotes.pennies = (fb.pennies || []).map((r) => lift(r, "pennies"));
    if (!state.quotes.crypto.length) state.quotes.crypto = (fb.crypto || []).map((r) => lift(r, "crypto"));
    if (state.feeds.tv !== "live") state.feeds.tv = "cached";
    if (state.feeds.crypto !== "live") state.feeds.crypto = "cached";
  }

  async function fetchNewsSymbol(tvSym) {
    const url = NEWS + "&symbol=" + encodeURIComponent(tvSym);
    const res = await fetch(url);
    if (!res.ok) throw new Error("news " + res.status);
    const data = await res.json();
    return (data.items || []).slice(0, 8).map((i) => ({
      title: i.title,
      source: i.source || i.provider || "",
      published: i.published,
      link: i.link,
      pulse: headlinePulse(i.title),
      related: (i.relatedSymbols || []).map((s) => String(s.symbol || "").split(":").pop()),
    }));
  }

  async function loadNews() {
    try {
      const uni = new Set(allQuotes().map((q) => q.symbol));
      const toItem = (i) => ({
        title: i.title,
        source: i.source || i.provider || "",
        published: i.published,
        link: i.link,
        pulse: headlinePulse(i.title),
        related: (i.relatedSymbols || []).map((s) => String(s.symbol || "").split(":").pop()),
      });
      try {
        const market = await fetch(NEWS);
        if (market.ok) {
          const data = await market.json();
          state.marketNews = (data.items || []).filter((i) => {
            const rel = (i.relatedSymbols || []).map((s) => String(s.symbol || "").split(":").pop());
            return rel.some((s) => uni.has(s));
          }).slice(0, 8).map(toItem);
        }
      } catch (e) {
        const fallbackNews = await Promise.all([
          fetchNewsSymbol("AMEX:SPY").catch(() => []),
          fetchNewsSymbol("NASDAQ:QQQ").catch(() => []),
          fetchNewsSymbol("BINANCE:BTCUSDT").catch(() => []),
        ]);
        state.marketNews = fallbackNews.flat().slice(0, 8);
      }
      const targets = [];
      const seen = new Set();
      PLAYBOOKS.forEach((p) => {
        const b = buildPlaybook(p.id);
        (b.holdings || []).concat(b.single ? [b.single] : []).forEach((h) => {
          const q = h.q || h;
          const key = q.tv || q.id;
          if (key && !seen.has(key)) { seen.add(key); targets.push(q); }
        });
      });
      allQuotes().slice().sort((a, b) => b.score - a.score).slice(0, 6).forEach((q) => {
        const key = q.tv || q.id;
        if (key && !seen.has(key)) { seen.add(key); targets.push(q); }
      });
      const chunk = targets.slice(0, 10);
      await Promise.all(chunk.map(async (q) => {
        try {
          const items = await fetchNewsSymbol(q.tv || q.id);
          state.news[q.symbol] = items;
          const avg = items.slice(0, 5).reduce((a, i) => a + i.pulse, 0) / Math.max(items.slice(0, 5).length, 1);
          q.newsPulse = avg;
          q.headlines = items.slice(0, 3);
        } catch (e) { /* keep tape-only score */ }
      }));
      state.feeds.news = "live";
    } catch (e) {
      state.feeds.news = "error";
    }
  }

  function rescore() {
    ["stocks", "etfs", "crypto", "pennies"].forEach((k) => {
      state.quotes[k].forEach((q) => {
        if (state.news[q.symbol]) {
          const items = state.news[q.symbol];
          const avg = items.slice(0, 5).reduce((a, i) => a + i.pulse, 0) / Math.max(items.slice(0, 5).length, 1);
          q.newsPulse = avg;
          q.headlines = items.slice(0, 3);
        }
        scoreQuote(q);
      });
    });
  }

  function prefer(list, symbols) {
    const map = Object.fromEntries(list.map((q) => [q.symbol, q]));
    return symbols.map((s) => map[s]).filter(Boolean);
  }
  function topRanked(list, n, fn, pred) {
    return list.filter(pred || (() => true)).slice().sort((a, b) => fn(b) - fn(a)).slice(0, n);
  }
  function weightByScore(picks, sleeveWeight) {
    if (!picks.length || sleeveWeight <= 0) return [];
    const weights = picks.map((q) => Math.max(q.score, 8));
    const sum = weights.reduce((a, b) => a + b, 0);
    return picks.map((q, i) => ({ q, weight: sleeveWeight * (weights[i] / sum) }));
  }

  function buildPlaybook(id) {
    const spec = PLAYBOOKS.find((p) => p.id === id) || PLAYBOOKS[1];
    const mix = spec.mix;
    const S = state.quotes;
    let holdings = [];

    if (id === "passive") {
      const etfPref = prefer(S.etfs, ["VOO", "SPY", "VTI", "QQQ", "GLD", "TLT"]);
      const etfW = [0.4, 0.2, 0.15, 0.1, 0.1, 0.05];
      const etfHave = etfPref.map((q, i) => ({ q, raw: etfW[i] }));
      const etfSum = etfHave.reduce((a, x) => a + x.raw, 0) || 1;
      holdings = holdings.concat(etfHave.map((x) => ({ q: x.q, weight: mix.etfs * (x.raw / etfSum) })));
      const quiet = topRanked(S.stocks, 2, (q) => q.score - num(q.volD) * 80, (q) => q.score >= 45);
      holdings = holdings.concat(weightByScore(quiet, mix.stocks));
      const btc = S.crypto.find((q) => q.symbol === "BTC");
      if (btc) holdings.push({ q: btc, weight: mix.crypto });
    } else if (id === "balanced") {
      const stocks = [];
      const seenSec = {};
      topRanked(S.stocks, 12, (q) => q.score).forEach((q) => {
        const sec = q.sector || q.symbol;
        if ((seenSec[sec] || 0) >= 1) return;
        if (stocks.length >= 4) return;
        seenSec[sec] = 1;
        stocks.push(q);
      });
      holdings = holdings.concat(weightByScore(stocks, mix.stocks));
      const etfPref = prefer(S.etfs, ["SPY", "QQQ", "GLD", "VOO", "XLK"]);
      holdings = holdings.concat(weightByScore(etfPref.slice(0, 3), mix.etfs));
      const cry = prefer(S.crypto, ["BTC", "ETH"]);
      holdings = holdings.concat(weightByScore(cry.length ? cry : S.crypto.slice(0, 2), mix.crypto));
    } else if (id === "aggressive") {
      const hot = topRanked(S.stocks, 3, (q) => q.score * (1 + Math.abs(q.change) / 20));
      holdings = holdings.concat(weightByScore(hot, mix.stocks));
      const etfPref = prefer(S.etfs, ["QQQ", "SMH", "XLK", "IBIT", "ARKK"]);
      holdings = holdings.concat(weightByScore(etfPref.slice(0, 3), mix.etfs));
      const cry = topRanked(S.crypto, 4, (q) => q.score + Math.max(q.change, 0));
      holdings = holdings.concat(weightByScore(cry, mix.crypto));
      const penn = topRanked(S.pennies, 2, (q) => q.score, (q) => q.change > -8);
      holdings = holdings.concat(weightByScore(penn, mix.pennies));
    } else {
      const hot = topRanked(S.stocks, 2, (q) => Math.abs(q.change) * q.score);
      holdings = holdings.concat(weightByScore(hot, mix.stocks));
      const etfPref = prefer(S.etfs, ["IBIT", "SMH", "ARKK", "BITO"]);
      holdings = holdings.concat(weightByScore(etfPref.slice(0, 2), mix.etfs));
      const cry = topRanked(S.crypto, 4, (q) => Math.abs(q.change) * 2 + q.score / 10);
      holdings = holdings.concat(weightByScore(cry, mix.crypto));
      const penn = topRanked(S.pennies, 3, (q) => q.volume * Math.max(q.change, 0.2));
      holdings = holdings.concat(weightByScore(penn, mix.pennies));
    }

    holdings = holdings.filter((h) => h && h.q && h.weight > 0);
    const wsum = holdings.reduce((a, h) => a + h.weight, 0) || 1;
    holdings = holdings.map((h) => ({ q: h.q, weight: h.weight / wsum }));

    const singlePool = id === "passive"
      ? holdings.filter((h) => h.q.sleeve === "etfs")
      : id === "ultra"
        ? holdings.filter((h) => h.q.sleeve === "crypto" || h.q.sleeve === "pennies")
        : holdings.filter((h) => h.q.sleeve === "stocks" || h.q.sleeve === "etfs");
    const pool = singlePool.length ? singlePool : holdings;
    const singleH = pool.slice().sort((a, b) => {
      const newsA = a.q.newsPulse || 0;
      const newsB = b.q.newsPulse || 0;
      if (id === "ultra") return Math.abs(b.q.change) - Math.abs(a.q.change);
      return (b.q.score + newsB * 10) - (a.q.score + newsA * 10);
    })[0];
    const single = singleH ? singleH.q : null;

    const basketRates = sumRates(holdings, state.amount);
    const singleRates = single ? rates(state.amount, single.change, single.sleeve) : null;
    return { spec, holdings, single, basketRates, singleRates };
  }

  function sumRates(holdings, amount) {
    const out = { day: 0, hour: 0, min: 0, sec: 0 };
    holdings.forEach((h) => {
      const r = rates(amount * h.weight, h.q.change, h.q.sleeve);
      out.day += r.day;
      out.hour += r.hour;
      out.min += r.min;
      out.sec += r.sec;
    });
    return out;
  }

  function whyText(q) {
    if (!q) return "";
    const bits = [];
    bits.push("Score " + q.score + " (" + q.label + ")");
    bits.push(pct(q.change) + (q.sleeve === "crypto" ? " 24h" : " session"));
    if (q.newsPulse) bits.push("headline pulse " + pulseWord(q.newsPulse).t);
    return bits.join(" - ");
  }

  function connectWs() {
    if (ws) {
      try { ws.close(); } catch (e) {}
      ws = null;
    }
    const pairs = state.quotes.crypto.map((q) => (q.binance || (q.symbol + "USDT")).toLowerCase());
    if (!pairs.length) return;
    const streams = pairs.map((p) => p + "@miniTicker").join("/");
    try {
      ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=" + streams);
    } catch (e) {
      return;
    }
    ws.onopen = () => { wsBackoff = 1000; };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const d = msg.data || msg;
        const sym = String(d.s || "").replace("USDT", "");
        const q = state.quotes.crypto.find((x) => x.symbol === sym);
        if (!q) return;
        q.close = num(d.c);
        if (d.P != null) q.change = num(d.P);
        scoreQuote(q);
      } catch (e) {}
    };
    ws.onclose = () => {
      ws = null;
      setTimeout(connectWs, wsBackoff);
      wsBackoff = Math.min(wsBackoff * 2, 15000);
    };
  }

  function persist() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        amount: state.amount,
        mix: state.mix,
        playbook: state.playbook,
        book: state.book,
      }));
    } catch (e) {}
  }
  function restore() {
    try {
      const o = JSON.parse(localStorage.getItem(STORE) || "null");
      if (!o) return;
      if (o.amount) state.amount = Number(o.amount) || 10000;
      if (o.mix) state.mix = o.mix;
      if (o.playbook) state.playbook = o.playbook;
      if (o.book) state.book = o.book;
    } catch (e) {}
  }

  function deployHoldings(holdings, label) {
    const positions = holdings.map((h) => {
      const alloc = state.amount * h.weight;
      const fill = h.q.close;
      return {
        id: h.q.id,
        sleeve: h.q.sleeve,
        symbol: h.q.symbol,
        name: h.q.name,
        tv: h.q.tv,
        weight: h.weight,
        fill,
        qty: fill ? alloc / fill : 0,
      };
    }).filter((p) => p.qty > 0);
    state.book = { label, at: Date.now(), positions };
    state.history = [];
    persist();
    setView("paper");
  }
  function deploySingle(q, label) {
    deployHoldings([{ q, weight: 1 }], label || ("Single " + q.symbol));
  }

  function markBook() {
    if (!state.book) return { equity: state.amount, pnl: 0, day: 0, hour: 0, min: 0, sec: 0, rows: [] };
    let equity = 0;
    let day = 0, hour = 0, min = 0, sec = 0;
    const rows = state.book.positions.map((p) => {
      const q = byId(p.id) || byId(p.symbol);
      const last = q ? q.close : p.fill;
      const value = p.qty * last;
      const pnl = value - p.qty * p.fill;
      const chg = q ? q.change : 0;
      const r = rates(value, chg, p.sleeve);
      equity += value;
      day += r.day;
      hour += r.hour;
      min += r.min;
      sec += r.sec;
      return Object.assign({}, p, { last, value, pnl, day: r.day, sec: r.sec, q });
    });
    return { equity, pnl: equity - state.amount, day, hour, min, sec, rows };
  }

  /* ---------- render ---------- */

  function setView(name) {
    state.view = name;
    $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    const t = TITLES[name] || TITLES.desk;
    $("#view-title").textContent = t[0];
    $("#view-lede").textContent = t[1];
    render();
  }

  function feedPill() {
    const tv = state.feeds.tv;
    const cg = state.feeds.crypto;
    const news = state.feeds.news;
    const el = $("#feed-pill");
    if (tv === "live" && cg === "live") {
      el.textContent = "Feeds: live" + (news === "live" ? " + news" : "");
      el.className = "pill open";
    } else if (tv === "cached" || cg === "cached") {
      el.textContent = "Feeds: cached sample";
      el.className = "pill cached";
    } else if (tv === "error" && cg === "error") {
      el.textContent = "Feeds: error";
      el.className = "pill err";
    } else {
      el.textContent = "Feeds: " + tv + " / " + cg;
      el.className = "pill";
    }
  }

  function renderSession() {
    const s = nyseOpen();
    const pill = $("#nyse-pill");
    pill.textContent = s.open ? "NYSE open" : "NYSE closed";
    pill.className = "pill " + (s.open ? "open" : "closed");
    $("#nyse-text").textContent = s.label;
    $("#dot-nyse").className = "session-dot" + (s.open ? " open" : "");
    $("#news-status").textContent = state.feeds.news === "live"
      ? "News: TradingView headlines"
      : state.feeds.news === "error" ? "News: unavailable" : "News: loading";
  }

  function renderTape() {
    const items = allQuotes().slice().sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 24);
    const html = items.map((q) => (
      '<span class="tape-item"><span class="tape-sym">' + q.symbol +
      '</span><span class="tape-price">' + px(q.close) +
      '</span><span class="tape-chg ' + clsPnL(q.change) + '">' + pct(q.change) + "</span></span>"
    )).join("");
    $("#tape").innerHTML = html + html;
    $("#tape").classList.toggle("paused", state.tapePaused);
  }

  function renderHero() {
    const pb = buildPlaybook(state.playbook);
    const marked = markBook();
    const usingBook = !!(state.book && state.book.positions && state.book.positions.length);
    const r = usingBook ? marked : pb.basketRates;
    const equity = usingBook ? marked.equity : state.amount + r.day;
    $("#hero-label").textContent = usingBook
      ? (state.book.label || "Deployed book") + " - live mark"
      : "If you deploy " + money(state.amount, 0, false) + " into " + pb.spec.name;
    const el = $("#hero-equity");
    el.textContent = money(equity, 2, false);
    el.className = "hero-equity " + clsPnL(usingBook ? marked.pnl : r.day);
    setRate("#hero-day", usingBook ? marked.pnl : r.day);
    setRate("#hero-hour", r.hour);
    setRate("#hero-min", r.min);
    setRate("#hero-sec", r.sec, true);
    const sleeves = ["stocks", "etfs", "crypto", "pennies"].map((k) => {
      const list = state.quotes[k];
      const avg = list.length ? list.reduce((a, q) => a + q.change, 0) / list.length : 0;
      const best = list.slice().sort((a, b) => b.score - a.score)[0];
      return { k, avg, best, n: list.length };
    });
    $("#sleeve-stats").innerHTML = sleeves.map((s) => (
      '<div class="stat-card"><div class="stat-label">' + s.k + '</div>' +
      '<div class="stat-val ' + clsPnL(s.avg) + '">' + (s.n ? pct(s.avg) : "-") + "</div>" +
      '<div class="stat-sub">' + (s.best ? s.best.symbol + " score " + s.best.score : "no names") + "</div></div>"
    )).join("");
  }
  function setRate(sel, n, isSec) {
    const el = $(sel);
    el.textContent = isSec ? perSec(n) : money(n);
    el.className = el.className.replace(/\bup\b|\bdown\b/g, "").trim() + " " + clsPnL(n);
  }

  function mixBar(mix) {
    return '<div class="mix-bar" aria-hidden="true">' +
      '<i class="mix-seg stocks" style="width:' + mix.stocks + '%"></i>' +
      '<i class="mix-seg etfs" style="width:' + mix.etfs + '%"></i>' +
      '<i class="mix-seg crypto" style="width:' + mix.crypto + '%"></i>' +
      '<i class="mix-seg pennies" style="width:' + mix.pennies + '%"></i></div>' +
      '<div class="mix-legend">' +
      '<span><i class="mix-swatch" style="background:#38bdf8"></i>Stocks ' + mix.stocks + '%</span>' +
      '<span><i class="mix-swatch" style="background:#4ade80"></i>ETFs ' + mix.etfs + '%</span>' +
      '<span><i class="mix-swatch" style="background:#fbbf24"></i>Crypto ' + mix.crypto + '%</span>' +
      '<span><i class="mix-swatch" style="background:#f87171"></i>Pennies ' + mix.pennies + "%</span></div>";
  }

  function playbookCardHtml(pb, selected) {
    const b = buildPlaybook(pb.id);
    const r = b.basketRates;
    const holds = b.holdings.slice(0, 5).map((h) => (
      '<div class="hold-mini-row"><span class="sym">' + h.q.symbol +
      '</span><span>' + h.q.name.slice(0, 28) + '</span><span class="w">' +
      (h.weight * 100).toFixed(0) + "%</span></div>"
    )).join("");
    const hd = (b.single && b.single.headlines && b.single.headlines[0]) ? b.single.headlines[0].title : "";
    return '<article class="playbook-card ' + pb.id + (selected ? " selected" : "") + '" data-playbook="' + pb.id + '">' +
      '<div class="playbook-kicker"><h3 class="playbook-name">' + pb.name + '</h3>' +
      '<span class="pill ' + (pb.id === "ultra" ? "err" : pb.id === "passive" ? "open" : "") + '">' + pb.risk + "</span></div>" +
      '<p class="playbook-blurb">' + pb.blurb + "</p>" +
      mixBar(pb.mix) +
      '<div class="playbook-rates">' +
      '<div class="playbook-rate-box"><div class="lbl">If ' + money(state.amount, 0, false) + ' / day</div><div class="val ' + clsPnL(r.day) + '">' + money(r.day) + "</div></div>" +
      '<div class="playbook-rate-box"><div class="lbl">Per second</div><div class="val ' + clsPnL(r.sec) + '">' + perSec(r.sec) + "</div></div>" +
      "</div>" +
      '<div class="hold-mini">' + holds + "</div>" +
      '<div class="single-callout">' +
      '<div class="k">If you only buy one</div>' +
      '<div class="sym">' + (b.single ? b.single.symbol : "-") + "</div>" +
      '<div class="why">' + (b.single ? whyText(b.single) : "") + "</div>" +
      (hd ? '<div class="headline">' + escapeHtml(hd) + "</div>" : "") +
      "</div>" +
      '<div class="playbook-actions">' +
      '<button type="button" class="btn primary sm" data-deploy-basket="' + pb.id + '">Deploy basket</button>' +
      '<button type="button" class="btn ghost sm" data-deploy-single="' + pb.id + '">Deploy single</button>' +
      "</div></article>";
  }

  function renderDeskPlaybook() {
    const pb = PLAYBOOKS.find((p) => p.id === state.playbook);
    $("#desk-playbook").innerHTML = playbookCardHtml(pb, true);
    const top = topRanked(state.quotes.stocks, 3, (q) => q.score)
      .concat(topRanked(state.quotes.etfs, 1, (q) => q.score))
      .concat(topRanked(state.quotes.crypto, 1, (q) => q.score));
    $("#desk-top5").innerHTML = top.map((q, i) => (
      '<button type="button" class="top5-row" data-focus="' + q.id + '">' +
      '<div class="top5-left"><span class="top5-rank">' + (i + 1) + '</span><div>' +
      '<div class="top5-sym">' + q.symbol + '</div><div class="top5-name">' + escapeHtml(q.name) + "</div></div></div>" +
      '<div class="top5-right"><span class="rec-chip ' + q.labelClass + '">' + q.label + "</span>" +
      '<span class="chg-cell ' + clsPnL(q.change) + '">' + pct(q.change) + "</span></div></button>"
    )).join("") || '<div class="empty-state">Waiting on quotes.</div>';
    const news = (state.marketNews.length ? state.marketNews : [].concat(...Object.values(state.news))).slice(0, 5);
    $("#desk-news").innerHTML = news.length ? news.map(newsItemHtml).join("") : '<div class="empty-state">No headlines yet.</div>';
    $("#news-pill").textContent = state.feeds.news === "live" ? "Live" : "Off";
    $("#news-pill").className = "pill " + (state.feeds.news === "live" ? "live" : "cached");
  }

  function newsItemHtml(n) {
    const pw = pulseWord(n.pulse);
    const href = n.link ? ' href="' + escapeHtml(n.link) + '" target="_blank" rel="noopener"' : "";
    const tag = (n.related && n.related[0]) ? n.related[0] : "";
    return '<a class="news-item"' + href + '><div class="news-title">' + escapeHtml(n.title) + "</div>" +
      '<div class="news-meta"><span>' + escapeHtml(n.source) + "</span>" +
      (tag ? "<span>" + escapeHtml(tag) + "</span>" : "") +
      '<span class="pulse ' + pw.c + '">' + pw.t + "</span></div></a>";
  }

  function renderPlaybooks() {
    $("#playbook-grid").innerHTML = PLAYBOOKS.map((p) => playbookCardHtml(p, p.id === state.playbook)).join("");
    const b = buildPlaybook(state.playbook);
    const rows = b.holdings.map((h) => {
      const alloc = state.amount * h.weight;
      const r = rates(alloc, h.q.change, h.q.sleeve);
      return "<tr data-focus=\"" + h.q.id + "\"><td class=\"sym-cell\">" + h.q.symbol + "</td><td class=\"name-cell\">" +
        escapeHtml(h.q.name) + "</td><td>" + (h.weight * 100).toFixed(1) + "%</td><td class=\"mono\">" + px(h.q.close) +
        "</td><td class=\"chg-cell " + clsPnL(h.q.change) + "\">" + pct(h.q.change) +
        "</td><td><span class=\"rec-chip " + h.q.labelClass + "\">" + h.q.label + "</span></td>" +
        "<td class=\"mono " + clsPnL(r.day) + "\">" + money(r.day) + "</td>" +
        "<td class=\"persec-cell " + clsPnL(r.sec) + "\">" + perSec(r.sec) + "</td></tr>";
    }).join("");
    const warn = b.spec.id === "ultra"
      ? '<div class="warn-banner">Ultra can wipe the paper book. Size is concentrated in names that move several percent a day. Demo only.</div>'
      : "";
    const hdHtml = (b.single && b.single.headlines || []).map(newsItemHtml).join("");
    $("#playbook-detail").innerHTML = warn +
      "<div class=\"card-h\"><h2>" + b.spec.name + " holdings for " + money(state.amount, 0, false) + "</h2></div>" +
      '<div class="table-wrap"><table><thead><tr><th>Symbol</th><th>Name</th><th>Weight</th><th>Last</th><th>Change</th><th>Rec</th><th>/ day</th><th>/ sec</th></tr></thead><tbody>' +
      rows + "</tbody></table></div>" +
      (hdHtml ? '<div style="margin-top:12px"><h2 style="font-size:1rem">News on the single name</h2><div class="news-list">' + hdHtml + "</div></div>" : "");
  }

  function renderMarkets() {
    $$(".market-tab").forEach((t) => {
      const on = t.dataset.sleeve === state.sleeve;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    const qstr = state.search.trim().toLowerCase();
    let rows = state.quotes[state.sleeve].slice();
    if (qstr) rows = rows.filter((q) => (q.symbol + " " + q.name).toLowerCase().includes(qstr));
    const key = state.sort.key;
    const dir = state.sort.dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = key === "dayPnL" ? rates(state.amount, a.change, a.sleeve).day
        : key === "perSec" ? rates(state.amount, a.change, a.sleeve).sec
        : a[key];
      const bv = key === "dayPnL" ? rates(state.amount, b.change, b.sleeve).day
        : key === "perSec" ? rates(state.amount, b.change, b.sleeve).sec
        : b[key];
      if (typeof av === "string") return av.localeCompare(bv) * dir;
      return (num(av) - num(bv)) * dir;
    });
    if (!rows.length) {
      $("#market-body").innerHTML = '<tr><td colspan="9"><div class="empty-state">No names in this sleeve.</div></td></tr>';
      return;
    }
    $("#market-body").innerHTML = rows.map((q) => {
      const r = rates(state.amount, q.change, q.sleeve);
      return "<tr data-focus=\"" + q.id + "\">" +
        "<td class=\"sym-cell\">" + q.symbol + "</td>" +
        "<td class=\"name-cell\">" + escapeHtml(q.name) + "</td>" +
        "<td class=\"mono\">" + px(q.close) + "</td>" +
        "<td class=\"chg-cell " + clsPnL(q.change) + "\">" + pct(q.change) + "</td>" +
        "<td class=\"mono\">" + volFmt(q.volume) + "</td>" +
        "<td>" + q.score + "</td>" +
        "<td><span class=\"rec-chip " + q.labelClass + "\">" + q.label + "</span></td>" +
        "<td class=\"mono " + clsPnL(r.day) + "\">" + money(r.day) + "</td>" +
        "<td class=\"persec-cell " + clsPnL(r.sec) + "\">" + perSec(r.sec) + "</td></tr>";
    }).join("");
    renderDetail();
  }

  function renderDetail() {
    const box = $("#name-detail");
    if (!state.focused) { box.hidden = true; box.innerHTML = ""; return; }
    const q = byId(state.focused);
    if (!q) { box.hidden = true; return; }
    box.hidden = false;
    const r = rates(state.amount, q.change, q.sleeve);
    const news = (q.headlines && q.headlines.length ? q.headlines : (state.news[q.symbol] || [])).slice(0, 4);
    box.innerHTML = '<div class="detail-head"><div><h2 class="detail-sym">' + q.symbol + '</h2>' +
      '<p class="detail-name">' + escapeHtml(q.name) + " · " + q.sleeve + "</p></div>" +
      '<span class="rec-chip ' + q.labelClass + '">' + q.label + " · " + q.score + "</span></div>" +
      "<p>" + px(q.close) + " · " + pct(q.change) + " · If " + money(state.amount, 0, false) + " then " +
      money(r.day) + "/day · " + perSec(r.sec) + "</p>" +
      "<p class=\"lede\">" + whyText(q) + "</p>" +
      '<div class="playbook-actions" style="margin:10px 0">' +
      '<button type="button" class="btn primary sm" id="btn-deploy-focus">Deploy this name</button></div>' +
      (news.length ? '<div class="news-list">' + news.map(newsItemHtml).join("") + "</div>" : "<p class=\"lede\">No headlines cached for this symbol.</p>");
    const btn = $("#btn-deploy-focus");
    if (btn) btn.onclick = () => deploySingle(q, "Single " + q.symbol);
  }

  function renderPaper() {
    $("#amount-input").value = String(state.amount);
    $("#playbook-presets").innerHTML = PLAYBOOKS.map((p) =>
      '<button type="button" class="preset-btn' + (state.playbook === p.id ? " active" : "") + '" data-playbook="' + p.id + '">' + p.name + "</button>"
    ).join("");
    const mix = state.mix;
    $("#sliders").innerHTML = ["stocks", "etfs", "crypto", "pennies"].map((k) => (
      '<div class="slider-row"><div class="slider-header"><span>' + k + '</span><span class="slider-pct">' + mix[k] +
      '%</span></div><input type="range" min="0" max="100" value="' + mix[k] + '" data-mix="' + k + '"></div>'
    )).join("");
    const marked = markBook();
    const using = !!(state.book && state.book.positions && state.book.positions.length);
    const pb = buildPlaybook(state.playbook);
    const r = using ? marked : sumRates(Object.keys(mix).map((k) => {
      const list = topRanked(state.quotes[k], 5, (q) => q.score);
      if (!list.length || mix[k] <= 0) return [];
      return weightByScore(list, mix[k] / 100);
    }).flat(), state.amount);
    const equity = using ? marked.equity : state.amount + r.day;
    $("#paper-label").textContent = using ? (state.book.label || "Deployed") : "Hypothetical mix (not deployed)";
    const eq = $("#paper-equity");
    eq.textContent = money(equity, 2, false);
    eq.className = "paper-equity-val " + clsPnL(using ? marked.pnl || r.day : r.day);
    setRate("#paper-day", r.day);
    setRate("#paper-hour", r.hour);
    setRate("#paper-min", r.min);
    setRate("#paper-sec", r.sec, true);
    const rows = using ? marked.rows : [];
    $("#holdings-body").innerHTML = rows.length ? rows.map((p) => (
      "<tr><td><div class=\"sym-cell\">" + p.symbol + "</div><div class=\"name-cell\">" + escapeHtml(p.name) +
      "</div></td><td class=\"mono\">" + p.qty.toPrecision(4) + "</td><td class=\"mono\">" + px(p.fill) +
      "</td><td class=\"mono\">" + px(p.last) + "</td><td class=\"mono " + (p.pnl >= 0 ? "gain" : "loss") + "\">" +
      money(p.pnl) + "</td><td class=\"mono " + clsPnL(p.day) + "\">" + money(p.day) +
      "</td><td class=\"persec-cell " + clsPnL(p.sec) + "\">" + perSec(p.sec) + "</td></tr>"
    )).join("") : '<tr><td colspan="7"><div class="empty-state">Deploy a playbook or mix to lock fills.</div></td></tr>';
    drawSpark(using ? marked.equity : equity);
  }

  function drawSpark(equity) {
    if (!state.sparkPaused) {
      const now = Date.now();
      const last = state.history[state.history.length - 1];
      if (!last || now - last.t > 900) {
        state.history.push({ t: now, v: equity });
        if (state.history.length > 180) state.history.shift();
      }
    }
    const c = $("#spark");
    if (!c) return;
    const ctx = c.getContext("2d");
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const pts = state.history;
    if (pts.length < 2) return;
    const vs = pts.map((p) => p.v);
    const min = Math.min.apply(null, vs);
    const max = Math.max.apply(null, vs);
    const span = max - min || 1;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = (i / (pts.length - 1)) * (w - 8) + 4;
      const y = h - 6 - ((p.v - min) / span) * (h - 12);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    const up = pts[pts.length - 1].v >= pts[0].v;
    ctx.strokeStyle = up ? "#4ade80" : "#f87171";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/[\u2012-\u2015]/g, "-")
      .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function render() {
    feedPill();
    renderSession();
    renderTape();
    if (state.view === "desk") { renderHero(); renderDeskPlaybook(); }
    if (state.view === "playbooks") renderPlaybooks();
    if (state.view === "markets") renderMarkets();
    if (state.view === "paper") renderPaper();
  }

  function applyPlaybookMix(id) {
    const spec = PLAYBOOKS.find((p) => p.id === id);
    if (!spec) return;
    state.playbook = id;
    state.mix = Object.assign({}, spec.mix);
    persist();
  }

  function onDeployBasket(id) {
    applyPlaybookMix(id);
    const b = buildPlaybook(id);
    deployHoldings(b.holdings, b.spec.name + " basket");
  }
  function onDeploySingle(id) {
    applyPlaybookMix(id);
    const b = buildPlaybook(id);
    if (b.single) deploySingle(b.single, b.spec.name + " single " + b.single.symbol);
  }

  function bind() {
    $$(".nav-item").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
    document.addEventListener("click", (e) => {
      const v = e.target.closest("[data-view]");
      if (v && v.dataset.view && !v.classList.contains("nav-item")) setView(v.dataset.view);
      const pb = e.target.closest("[data-playbook]");
      if (pb && !e.target.closest("[data-deploy-basket]") && !e.target.closest("[data-deploy-single]")) {
        applyPlaybookMix(pb.dataset.playbook);
        render();
      }
      const db = e.target.closest("[data-deploy-basket]");
      if (db) onDeployBasket(db.dataset.deployBasket);
      const ds = e.target.closest("[data-deploy-single]");
      if (ds) onDeploySingle(ds.dataset.deploySingle);
      const foc = e.target.closest("[data-focus]");
      if (foc) {
        state.focused = foc.dataset.focus;
        if (state.view !== "markets") setView("markets");
        else renderDetail();
      }
    });
    $$(".market-tab").forEach((t) => t.addEventListener("click", () => {
      state.sleeve = t.dataset.sleeve;
      renderMarkets();
    }));
    $("#market-search").addEventListener("input", (e) => { state.search = e.target.value; renderMarkets(); });
    $$("#market-table thead th").forEach((th) => th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (!key) return;
      if (state.sort.key === key) state.sort.dir = state.sort.dir === "desc" ? "asc" : "desc";
      else { state.sort.key = key; state.sort.dir = "desc"; }
      renderMarkets();
    }));
    $("#btn-refresh").addEventListener("click", () => boot(true));
    $("#tape-pause").addEventListener("click", () => {
      state.tapePaused = !state.tapePaused;
      $("#tape-pause").textContent = state.tapePaused ? "Play" : "Pause";
      $("#tape").classList.toggle("paused", state.tapePaused);
    });
    $("#spark-pause").addEventListener("click", () => {
      state.sparkPaused = !state.sparkPaused;
      $("#spark-pause").textContent = state.sparkPaused ? "Resume" : "Pause";
    });
    $("#amount-input").addEventListener("change", (e) => {
      state.amount = Math.max(100, Number(e.target.value) || 10000);
      persist();
      render();
    });
    $("#sliders").addEventListener("input", (e) => {
      const k = e.target.dataset.mix;
      if (!k) return;
      const next = Number(e.target.value);
      const others = ["stocks", "etfs", "crypto", "pennies"].filter((x) => x !== k);
      const rest = others.reduce((a, x) => a + state.mix[x], 0);
      const left = 100 - next;
      if (rest <= 0) {
        others.forEach((x, i) => { state.mix[x] = i === 0 ? left : 0; });
      } else {
        others.forEach((x) => { state.mix[x] = Math.round(state.mix[x] / rest * left); });
      }
      state.mix[k] = next;
      const drift = 100 - ["stocks", "etfs", "crypto", "pennies"].reduce((a, x) => a + state.mix[x], 0);
      state.mix[others[0]] += drift;
      persist();
      renderPaper();
    });
    $("#btn-deploy").addEventListener("click", () => {
      const holdings = ["stocks", "etfs", "crypto", "pennies"].map((k) => {
        if (state.mix[k] <= 0) return [];
        const list = topRanked(state.quotes[k], 5, (q) => q.score);
        return weightByScore(list, state.mix[k] / 100);
      }).flat();
      deployHoldings(holdings, "Custom mix");
    });
    $("#btn-reset").addEventListener("click", () => {
      state.book = null;
      state.history = [];
      persist();
      render();
    });
  }

  async function boot(isRefresh) {
    $("#feed-pill").textContent = "Feeds: loading";
    try {
      await Promise.all([
        loadEquities().catch((e) => { state.feeds.tv = "error"; throw e; }),
        loadCrypto().catch((e) => { state.feeds.crypto = "error"; throw e; }),
      ]);
    } catch (e) {
      try { await loadFallback(); } catch (e2) {}
    }
    if (!allQuotes().length) {
      try { await loadFallback(); } catch (e) {}
    }
    rescore();
    render();
    if (!ws) connectWs();
    if (!isRefresh || state.feeds.news !== "live") {
      loadNews().then(() => { rescore(); render(); }).catch(() => {});
    }
  }

  restore();
  bind();
  render();
  boot(false);

  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    render();
  }, 1000);

  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    boot(true);
  }, 30000);

  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    loadNews().then(() => { rescore(); render(); }).catch(() => {});
  }, 600000);
})();

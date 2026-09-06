import SpeedTest from "https://cdn.jsdelivr.net/npm/@cloudflare/speedtest@1.3.0/+esm";

const DOWN_URL = "https://speed.cloudflare.com/__down";
const TRACE_URL = "https://cloudflare.com/cdn-cgi/trace";
const HISTORY_KEY = "heylead-bandwidth-history-v3";
const MAX_HISTORY = 12;
const MAX_POINTS = 120;
const LIVE_STREAMS = 6;
const LIVE_CHUNK = 8e6; // 8 MB chunks, recycled continuously while monitoring

// Same ramp as speed.cloudflare.com, without packetLoss (needs a TURN server).
const FULL_MEASUREMENTS = [
  { type: "latency", numPackets: 1 },
  { type: "download", bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "latency", numPackets: 20 },
  { type: "download", bytes: 1e5, count: 9 },
  { type: "download", bytes: 1e6, count: 8 },
  { type: "upload", bytes: 1e5, count: 8 },
  { type: "upload", bytes: 1e6, count: 6 },
  { type: "download", bytes: 1e7, count: 6 },
  { type: "upload", bytes: 1e7, count: 4 },
  { type: "download", bytes: 2.5e7, count: 4 },
  { type: "upload", bytes: 2.5e7, count: 4 },
  { type: "download", bytes: 1e8, count: 3 },
  { type: "upload", bytes: 5e7, count: 3 },
  { type: "download", bytes: 2.5e8, count: 2 },
];

const el = {
  down: document.getElementById("val-down"),
  up: document.getElementById("val-up"),
  lat: document.getElementById("val-lat"),
  live: document.getElementById("val-live"),
  jitter: document.getElementById("sub-jitter"),
  liveSub: document.getElementById("sub-live"),
  barDown: document.getElementById("bar-down"),
  barUp: document.getElementById("bar-up"),
  statusPill: document.getElementById("status-pill"),
  statusText: document.getElementById("status-text"),
  history: document.getElementById("history"),
  chart: document.getElementById("chart"),
  btnRun: document.getElementById("btn-run"),
  btnMonitor: document.getElementById("btn-monitor"),
  factType: document.getElementById("fact-type"),
  factDownlink: document.getElementById("fact-downlink"),
  factRtt: document.getElementById("fact-rtt"),
  factSave: document.getElementById("fact-save"),
  factColo: document.getElementById("fact-colo"),
  factIp: document.getElementById("fact-ip"),
};

const state = {
  running: false,
  monitoring: false,
  monitorTimer: null,
  uiTickTimer: null,
  engine: null,
  liveXhrs: [],
  liveBytesWindow: 0,
  liveWindowStart: 0,
  points: [],
  peakDown: 200,
  peakUp: 50,
};

function fmt(n, digits) {
  if (n == null || !isFinite(n)) return "-";
  if (digits == null) digits = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  return Number(n).toFixed(digits);
}

function bpsToMbps(bps) {
  if (bps == null || !isFinite(bps)) return null;
  return bps / 1e6;
}

function setStatus(kind, pill, text) {
  el.statusPill.textContent = pill;
  el.statusPill.className = "pill" + (kind ? " " + kind : "");
  el.statusText.textContent = text;
}

function setBar(node, mbps, peak) {
  const pct = Math.max(0, Math.min(100, (mbps / peak) * 100));
  node.style.width = pct.toFixed(1) + "%";
}

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function pushPoint(mbps, kind) {
  if (mbps == null || !isFinite(mbps)) return;
  state.points.push({ t: Date.now(), mbps, kind: kind || "down" });
  if (state.points.length > MAX_POINTS) state.points.shift();
  drawChart();
}

function drawChart() {
  const canvas = el.chart;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 900;
  const cssH = 220;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#0d131b";
  ctx.fillRect(0, 0, cssW, cssH);

  const padL = 48;
  const padR = 12;
  const padT = 14;
  const padB = 24;
  const w = cssW - padL - padR;
  const h = cssH - padT - padB;

  let maxY = 50;
  state.points.forEach((p) => {
    if (p.mbps > maxY) maxY = p.mbps;
  });
  maxY = Math.ceil((maxY * 1.12) / 25) * 25 || 50;

  ctx.strokeStyle = "#1a2433";
  ctx.fillStyle = "#6b7c91";
  ctx.font = "11px JetBrains Mono, monospace";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = padT + (h * g) / 4;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + w, y);
    ctx.stroke();
    ctx.fillText(fmt(maxY * (1 - g / 4), maxY >= 100 ? 0 : 1), 4, y + 3);
  }

  if (state.points.length < 2) {
    ctx.fillStyle = "#5b6b80";
    ctx.fillText("Waiting for samples…", padL + 8, padT + 20);
    return;
  }

  function pathFor(kind, color) {
    const pts = state.points.filter((p) => p.kind === kind);
    if (pts.length < 2) return;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const idx = state.points.indexOf(p);
      const x = padL + (idx / Math.max(1, MAX_POINTS - 1)) * w;
      const y2 = padT + h - (p.mbps / maxY) * h;
      if (i === 0) ctx.moveTo(x, y2);
      else ctx.lineTo(x, y2);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  pathFor("down", "#3d8bfd");
  pathFor("up", "#22c55e");
  pathFor("live", "#a78bfa");
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveHistory(rows) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, MAX_HISTORY)));
  } catch (e) {}
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHistory() {
  const rows = loadHistory();
  if (!rows.length) {
    el.history.className = "history empty";
    el.history.textContent = "No tests yet in this browser.";
    return;
  }
  el.history.className = "history";
  el.history.innerHTML = rows
    .map(
      (r) =>
        '<div class="hist-row">' +
        "<span>" +
        escapeHtml(r.when) +
        "</span>" +
        "<span>↓ " +
        fmt(r.down) +
        "</span>" +
        "<span>↑ " +
        fmt(r.up) +
        "</span>" +
        "<span>" +
        fmt(r.lat, r.lat < 10 ? 1 : 0) +
        " ms</span>" +
        "</div>"
    )
    .join("");
}

function readConnectionFacts() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) {
    el.factType.textContent = "unavailable";
    el.factDownlink.textContent = "-";
    el.factRtt.textContent = "-";
    el.factSave.textContent = "-";
    return;
  }
  el.factType.textContent =
    (c.effectiveType || c.type || "unknown") +
    (c.type && c.effectiveType ? " (" + c.type + ")" : "");
  el.factDownlink.textContent = c.downlink != null ? c.downlink + " Mbps (estimate)" : "-";
  el.factRtt.textContent = c.rtt != null ? c.rtt + " ms" : "-";
  el.factSave.textContent = c.saveData ? "on" : "off";
  if (typeof c.addEventListener === "function") {
    c.addEventListener("change", readConnectionFacts);
  }
}

async function loadTrace() {
  try {
    const res = await fetch(TRACE_URL, { cache: "no-store" });
    const text = await res.text();
    const map = {};
    text.split("\n").forEach((line) => {
      const i = line.indexOf("=");
      if (i > 0) map[line.slice(0, i)] = line.slice(i + 1);
    });
    el.factColo.textContent = map.colo || "-";
    el.factIp.textContent = map.ip || "-";
  } catch (e) {
    el.factColo.textContent = "blocked / failed";
    el.factIp.textContent = "-";
  }
}

function applySummary(summary, kinds) {
  const down = bpsToMbps(summary.download);
  const up = bpsToMbps(summary.upload);
  const lat = summary.latency;
  const jitter = summary.jitter;

  if (down != null && kinds.down) {
    el.down.textContent = fmt(down);
    state.peakDown = Math.max(state.peakDown, down * 1.1, 100);
    setBar(el.barDown, down, state.peakDown);
    pushPoint(down, "down");
  }
  if (up != null && kinds.up) {
    el.up.textContent = fmt(up);
    state.peakUp = Math.max(state.peakUp, up * 1.1, 20);
    setBar(el.barUp, up, state.peakUp);
    pushPoint(up, "up");
  }
  if (lat != null && kinds.lat) {
    el.lat.textContent = fmt(lat, lat < 10 ? 1 : 0);
    if (jitter != null) el.jitter.textContent = "jitter " + fmt(jitter, 1) + " ms";
  }
  return { down, up, lat, jitter };
}

function clearUiTick() {
  if (state.uiTickTimer) {
    clearInterval(state.uiTickTimer);
    state.uiTickTimer = null;
  }
}

function runEngine(measurements) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const engine = new SpeedTest({
      autoStart: false,
      measurements,
      // Match Cloudflare site: 90th percentile of good samples.
      bandwidthPercentile: 0.9,
      latencyPercentile: 0.5,
      measureDownloadLoadedLatency: true,
      measureUploadLoadedLatency: true,
    });
    state.engine = engine;

    const paint = (type) => {
      const summary = engine.results.getSummary();
      applySummary(summary, {
        down: true,
        up: true,
        lat: true,
      });
      if (type === "download") {
        setStatus("run", "Testing", "Downloading (Cloudflare engine ramp)…");
      } else if (type === "upload") {
        setStatus("run", "Testing", "Uploading (Cloudflare engine ramp)…");
      } else if (type === "latency") {
        setStatus("run", "Testing", "Measuring latency…");
      }
    };

    engine.onResultsChange = ({ type }) => {
      if (type === "download" || type === "upload" || type === "latency") {
        paint(type);
      }
    };

    // 1 Hz UI refresh while the engine is working (not only on discrete sample completion).
    // Stopped via clearUiTick() in finish(); do not gate on engine.isRunning (not reliable across builds).
    clearUiTick();
    state.uiTickTimer = setInterval(() => {
      paint();
    }, 1000);

    const finish = (summary, err) => {
      if (settled) return;
      settled = true;
      clearUiTick();
      state.engine = null;
      if (err) reject(err);
      else resolve(summary);
    };

    engine.onFinish = (results) => {
      finish(results.getSummary());
    };

    engine.onError = (error) => {
      // Non-fatal measurement errors still let the engine finish; only reject if finished never fires.
      console.warn("speedtest measurement error:", error);
    };

    engine.play();

    // Safety timeout - gigabit ramp can take a while with 250MB downloads.
    setTimeout(() => {
      if (settled) return;
      try {
        engine.pause();
      } catch (e) {}
      const partial = engine.results.getSummary();
      if (partial && (partial.download || partial.upload || partial.latency)) {
        finish(partial);
      } else {
        finish(null, new Error("Speed test timed out"));
      }
    }, 180000);
  });
}

async function runFullTest() {
  if (state.running) return;
  state.running = true;
  el.btnRun.disabled = true;
  el.btnMonitor.disabled = true;
  setStatus("run", "Testing", "Starting Cloudflare measurement engine…");

  try {
    const summary = await runEngine(FULL_MEASUREMENTS);
    const final = applySummary(summary, { down: true, up: true, lat: true });

    if (final.down == null && final.up == null) {
      throw new Error("No bandwidth samples returned. Check blockers on speed.cloudflare.com.");
    }

    const rows = loadHistory();
    rows.unshift({
      when: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      down: final.down,
      up: final.up,
      lat: final.lat,
    });
    saveHistory(rows);
    renderHistory();

    setStatus(
      "",
      "Done",
      "Last full test at " +
        nowLabel() +
        " using @cloudflare/speedtest (same engine as speed.cloudflare.com)."
    );
  } catch (err) {
    console.error(err);
    setStatus(
      "err",
      "Error",
      (err && err.message) || "Speed test failed. Check network or blockers on speed.cloudflare.com."
    );
  } finally {
    state.running = false;
    el.btnRun.disabled = false;
    el.btnMonitor.disabled = false;
  }
}

function noteLiveBytes(delta) {
  if (!state.monitoring || !(delta > 0)) return;
  state.liveBytesWindow += delta;
}

function liveDownloadOnce() {
  return new Promise((resolve) => {
    if (!state.monitoring) {
      resolve(false);
      return;
    }
    const url = DOWN_URL + "?bytes=" + LIVE_CHUNK + "&r=" + Math.random();
    const xhr = new XMLHttpRequest();
    let lastLoaded = 0;
    state.liveXhrs.push(xhr);
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.timeout = 60000;
    xhr.onprogress = (ev) => {
      const loaded = ev.loaded || 0;
      const delta = loaded - lastLoaded;
      if (delta > 0) noteLiveBytes(delta);
      lastLoaded = loaded;
    };
    const done = () => {
      state.liveXhrs = state.liveXhrs.filter((x) => x !== xhr);
      resolve(state.monitoring);
    };
    xhr.onload = () => {
      if (xhr.response && xhr.response.byteLength > lastLoaded) {
        noteLiveBytes(xhr.response.byteLength - lastLoaded);
      }
      done();
    };
    xhr.onerror = done;
    xhr.ontimeout = done;
    xhr.onabort = done;
    xhr.send();
  });
}

async function liveWorker() {
  while (state.monitoring) {
    const keepGoing = await liveDownloadOnce();
    if (!keepGoing) break;
  }
}

function tickLiveUi() {
  if (!state.monitoring) return;
  const now = performance.now();
  const bytes = state.liveBytesWindow;
  const elapsed = Math.max(0.2, (now - state.liveWindowStart) / 1000);
  state.liveBytesWindow = 0;
  state.liveWindowStart = now;
  // Skip empty first windows before any XHR progress arrives.
  if (!(bytes > 0)) {
    el.liveSub.textContent = "warming up…";
    return;
  }
  const mbps = (bytes * 8) / elapsed / 1e6;

  el.live.textContent = fmt(mbps);
  el.liveSub.textContent = "every 1s · " + nowLabel();
  pushPoint(mbps, "live");
  state.peakDown = Math.max(state.peakDown, mbps * 1.1, 100);
  setBar(el.barDown, mbps, state.peakDown);
}

function startMonitor() {
  if (state.monitoring || state.running) return;
  state.monitoring = true;
  state.liveBytesWindow = 0;
  state.liveWindowStart = performance.now();
  state.liveXhrs = [];
  el.btnMonitor.setAttribute("aria-pressed", "true");
  el.btnMonitor.textContent = "Stop monitor";
  el.liveSub.textContent = "warming up…";
  setStatus(
    "live",
    "Live",
    "Streaming parallel downloads; Available now updates every 1 second. Congestion shows as lower Mbps."
  );

  for (let i = 0; i < LIVE_STREAMS; i++) liveWorker();
  state.monitorTimer = setInterval(tickLiveUi, 1000);
}

function stopMonitor() {
  state.monitoring = false;
  el.btnMonitor.setAttribute("aria-pressed", "false");
  el.btnMonitor.textContent = "Live monitor";
  if (state.monitorTimer) {
    clearInterval(state.monitorTimer);
    state.monitorTimer = null;
  }
  state.liveXhrs.forEach((xhr) => {
    try {
      xhr.abort();
    } catch (e) {}
  });
  state.liveXhrs = [];
  state.liveBytesWindow = 0;
  if (state.engine) {
    try {
      state.engine.pause();
    } catch (e) {}
    state.engine = null;
  }
  clearUiTick();
  setStatus("", "Ready", "Monitor stopped. Run a full speed test anytime.");
}

el.btnRun.addEventListener("click", () => {
  if (state.monitoring) stopMonitor();
  runFullTest();
});

el.btnMonitor.addEventListener("click", () => {
  if (state.monitoring) stopMonitor();
  else startMonitor();
});

window.addEventListener("resize", drawChart);

readConnectionFacts();
loadTrace();
renderHistory();
drawChart();
setStatus(
  "",
  "Ready",
  "Full test uses @cloudflare/speedtest (same as speed.cloudflare.com). Live monitor updates Available now every 1 second."
);

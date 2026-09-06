import SpeedTest from "https://cdn.jsdelivr.net/npm/@cloudflare/speedtest@1.3.0/+esm";

const TRACE_URL = "https://cloudflare.com/cdn-cgi/trace";
const HISTORY_KEY = "heylead-bandwidth-history-v3";
const MAX_HISTORY = 12;
const MAX_POINTS = 72;

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

// Short burst for live "available now" sampling (keep under ~10s on mid links).
const LIVE_MEASUREMENTS = [
  { type: "download", bytes: 1e6, count: 1, bypassMinDuration: true },
  { type: "download", bytes: 1e7, count: 4 },
  { type: "download", bytes: 2.5e7, count: 2 },
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
  liveRunning: false,
  monitoring: false,
  monitorTimer: null,
  engine: null,
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

    engine.onResultsChange = ({ type }) => {
      const summary = engine.results.getSummary();
      if (type === "download" || type === "upload" || type === "latency") {
        applySummary(summary, {
          down: type === "download",
          up: type === "upload",
          lat: type === "latency",
        });
        if (type === "download") {
          setStatus("run", "Testing", "Downloading (Cloudflare engine ramp)…");
        } else if (type === "upload") {
          setStatus("run", "Testing", "Uploading (Cloudflare engine ramp)…");
        } else if (type === "latency") {
          setStatus("run", "Testing", "Measuring latency…");
        }
      }
    };

    engine.onFinish = (results) => {
      if (settled) return;
      settled = true;
      state.engine = null;
      resolve(results.getSummary());
    };

    engine.onError = (error) => {
      // Non-fatal measurement errors still let the engine finish; only reject if finished never fires.
      console.warn("speedtest measurement error:", error);
    };

    engine.play();

    // Safety timeout - gigabit ramp can take a while with 250MB downloads.
    setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        engine.pause();
      } catch (e) {}
      state.engine = null;
      const partial = engine.results.getSummary();
      if (partial && (partial.download || partial.upload || partial.latency)) {
        resolve(partial);
      } else {
        reject(new Error("Speed test timed out"));
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

async function sampleLive() {
  if (state.running || state.liveRunning) return;
  state.liveRunning = true;
  try {
    el.liveSub.textContent = "sampling…";
    setStatus("live", "Live", "Sampling available download with Cloudflare engine…");
    const summary = await runEngine(LIVE_MEASUREMENTS);
    const mbps = bpsToMbps(summary.download);
    if (mbps == null) throw new Error("Live sample returned no download data");
    el.live.textContent = fmt(mbps);
    el.liveSub.textContent = "last " + nowLabel();
    pushPoint(mbps, "live");
    if (!el.down.textContent || el.down.textContent === "-") {
      el.down.textContent = fmt(mbps);
      state.peakDown = Math.max(state.peakDown, mbps * 1.1, 100);
      setBar(el.barDown, mbps, state.peakDown);
    }
    setStatus(
      "live",
      "Live",
      "Sampling available download about every 20s (skips if a sample is still running). Congestion shows as lower Mbps."
    );
  } catch (err) {
    console.error(err);
    el.liveSub.textContent = "sample failed";
    setStatus("err", "Monitor", (err && err.message) || "Live sample failed.");
  } finally {
    state.liveRunning = false;
  }
}

function startMonitor() {
  if (state.monitoring) return;
  state.monitoring = true;
  el.btnMonitor.setAttribute("aria-pressed", "true");
  el.btnMonitor.textContent = "Stop monitor";
  sampleLive();
  state.monitorTimer = setInterval(sampleLive, 20000);
}

function stopMonitor() {
  state.monitoring = false;
  el.btnMonitor.setAttribute("aria-pressed", "false");
  el.btnMonitor.textContent = "Live monitor";
  if (state.monitorTimer) {
    clearInterval(state.monitorTimer);
    state.monitorTimer = null;
  }
  if (state.engine) {
    try {
      state.engine.pause();
    } catch (e) {}
    state.engine = null;
  }
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
  "Uses the official @cloudflare/speedtest engine (same as speed.cloudflare.com), with a full download/upload ramp."
);

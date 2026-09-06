import SpeedTest from "https://cdn.jsdelivr.net/npm/@cloudflare/speedtest@1.3.0/+esm";

const DOWN_URL = "https://speed.cloudflare.com/__down";
const UP_URL = "https://speed.cloudflare.com/__up";
const TRACE_URL = "https://cloudflare.com/cdn-cgi/trace";
const HISTORY_KEY = "heylead-bandwidth-history-v4";
const MAX_HISTORY = 12;
const MAX_POINTS = 120;
const LIVE_STREAMS = 6;
const LIVE_UP_STREAMS = 1;
const LIVE_FAIL_LIMIT = 8;
const LIVE_PING_WINDOW = 8;
const LIVE_UP_GAP_MS = 5000;
const LIVE_DURATION_MS = 15000;

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
  subDown: document.getElementById("sub-down"),
  subUp: document.getElementById("sub-up"),
  liveSub: document.getElementById("sub-live"),
  barDown: document.getElementById("bar-down"),
  barUp: document.getElementById("bar-up"),
  barLive: document.getElementById("bar-live"),
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
  monitorStopTimer: null,
  monitorDeadline: null,
  uiTickTimer: null,
  engineTimeout: null,
  engine: null,
  liveDownXhrs: [],
  liveUpXhrs: [],
  liveHoldDown: false,
  liveBytesWindow: 0,
  liveWindowStart: 0,
  liveFails: 0,
  liveUpFails: 0,
  lastLiveMbps: null,
  lastLiveUpMbps: null,
  pingTimes: [],
  pingAbort: null,
  upBuf: null,
  lastPushed: { down: null, up: null, live: null },
  connBound: false,
  points: [],
  peakDown: 200,
  peakUp: 50,
  peakLive: 200,
};

function fmt(n, digits) {
  if (n == null || !isFinite(n)) return "-";
  if (digits == null) digits = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  return Number(n).toFixed(digits);
}

function bpsToMbps(bps) {
  if (bps == null || !isFinite(bps) || bps <= 0) return null;
  return bps / 1e6;
}

function setStatus(kind, pill, text) {
  el.statusPill.textContent = pill;
  el.statusPill.className = "pill" + (kind ? " " + kind : "");
  el.statusText.textContent = text;
}

function setBar(node, mbps, peak) {
  if (!node) return;
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

function pushPoint(mbps, kind, force) {
  if (mbps == null || !isFinite(mbps) || mbps <= 0) return;
  const prev = state.lastPushed[kind];
  if (!force && prev != null && Math.abs(prev - mbps) < 0.02 * Math.max(1, mbps)) return;
  state.lastPushed[kind] = mbps;
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
    ctx.fillText("Waiting for samples...", padL + 8, padT + 20);
    return;
  }

  const tMin = state.points[0].t;
  const tMax = state.points[state.points.length - 1].t;
  const span = Math.max(1000, tMax - tMin);

  function pathFor(kind, color) {
    const pts = state.points.filter((p) => p.kind === kind);
    if (pts.length < 2) return;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = padL + ((p.t - tMin) / span) * w;
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
        (r.lat > 0 ? fmt(r.lat, r.lat < 10 ? 1 : 0) + " ms" : "-") +
        "</span>" +
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
  if (!state.connBound && typeof c.addEventListener === "function") {
    state.connBound = true;
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

function applySummary(summary, kinds, chart) {
  if (!summary) return { down: null, up: null, lat: null, jitter: null };
  const down = bpsToMbps(summary.download);
  const up = bpsToMbps(summary.upload);
  const lat = summary.latency > 0 ? summary.latency : null;
  const jitter = summary.jitter > 0 ? summary.jitter : null;

  if (down != null && kinds.down) {
    el.down.textContent = fmt(down);
    el.subDown.textContent = "full test";
    state.peakDown = Math.max(state.peakDown, down * 1.1, 100);
    setBar(el.barDown, down, state.peakDown);
    if (chart) pushPoint(down, "down");
  }
  if (up != null && kinds.up) {
    el.up.textContent = fmt(up);
    el.subUp.textContent = "full test";
    state.peakUp = Math.max(state.peakUp, up * 1.1, 20);
    setBar(el.barUp, up, state.peakUp);
    if (chart) pushPoint(up, "up");
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

function clearEngineTimeout() {
  if (state.engineTimeout) {
    clearTimeout(state.engineTimeout);
    state.engineTimeout = null;
  }
}

function runEngine(measurements) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const engine = new SpeedTest({
      autoStart: false,
      measurements,
      bandwidthPercentile: 0.9,
      latencyPercentile: 0.5,
      measureDownloadLoadedLatency: true,
      measureUploadLoadedLatency: true,
    });
    state.engine = engine;

    const paint = (type, chart) => {
      const summary = engine.results.getSummary();
      const kinds = {
        down: !type || type === "download",
        up: !type || type === "upload",
        lat: !type || type === "latency",
      };
      applySummary(summary, kinds, chart);
      if (type === "download") {
        setStatus("run", "Testing", "Downloading (Cloudflare engine ramp)...");
      } else if (type === "upload") {
        setStatus("run", "Testing", "Uploading (Cloudflare engine ramp)...");
      } else if (type === "latency") {
        setStatus("run", "Testing", "Measuring latency...");
      }
    };

    engine.onResultsChange = ({ type }) => {
      if (type === "download" || type === "upload" || type === "latency") {
        paint(type, true);
      }
    };

    clearUiTick();
    state.uiTickTimer = setInterval(() => {
      paint(null, false);
    }, 1000);

    const finish = (summary, err) => {
      if (settled) return;
      settled = true;
      clearUiTick();
      clearEngineTimeout();
      state.engine = null;
      if (err) reject(err);
      else resolve(summary);
    };

    engine.onFinish = (results) => {
      finish(results.getSummary());
    };

    engine.onError = (error) => {
      console.warn("speedtest measurement error:", error);
    };

    engine.play();

    state.engineTimeout = setTimeout(() => {
      if (settled) return;
      try {
        engine.pause();
      } catch (e) {}
      const partial = engine.results.getSummary();
      if (partial && (partial.download > 0 || partial.upload > 0 || partial.latency > 0)) {
        finish(partial);
      } else {
        finish(null, new Error("Speed test timed out"));
      }
    }, 180000);
  });
}

async function runFullTest() {
  if (state.running) return;
  if (state.monitoring) stopMonitor(true);
  state.running = true;
  state.peakDown = 200;
  state.peakUp = 50;
  state.lastPushed.down = null;
  state.lastPushed.up = null;
  el.btnRun.disabled = true;
  el.btnMonitor.disabled = true;
  if (el.liveSub.textContent !== "idle") el.liveSub.textContent = "paused";
  el.subDown.textContent = "testing...";
  el.subUp.textContent = "testing...";
  setStatus("run", "Testing", "Starting Cloudflare measurement engine...");

  try {
    const summary = await runEngine(FULL_MEASUREMENTS);
    const final = applySummary(summary, { down: true, up: true, lat: true }, true);

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
      (err && err.message) || "Speed test failed. Check blockers on speed.cloudflare.com."
    );
  } finally {
    state.running = false;
    el.btnRun.disabled = false;
    el.btnMonitor.disabled = false;
  }
}

function noteLiveBytes(delta) {
  if (!state.monitoring || state.liveHoldDown || !(delta > 0)) return;
  state.liveBytesWindow += delta;
}

function liveChunkBytes() {
  const last = state.lastLiveMbps;
  if (last > 200) return 25e6;
  if (last > 50) return 12e6;
  if (last > 10) return 4e6;
  return 2e6;
}

function liveUpChunkBytes() {
  const last = state.lastLiveUpMbps;
  if (last > 50) return 8e6;
  if (last > 10) return 2e6;
  return 1e6;
}

function uploadBody(bytes) {
  const n = Math.max(1, Math.floor(bytes));
  if (!state.upBuf || state.upBuf.byteLength < n) {
    state.upBuf = new Uint8Array(n);
  }
  return n === state.upBuf.byteLength ? state.upBuf : state.upBuf.subarray(0, n);
}

function paintLiveUp(mbps, chart) {
  if (!(mbps > 0) || !isFinite(mbps)) return;
  state.lastLiveUpMbps = mbps;
  el.up.textContent = fmt(mbps);
  el.subUp.textContent = "live sample";
  state.peakUp = Math.max(state.peakUp, mbps * 1.1, 20);
  setBar(el.barUp, mbps, state.peakUp);
  if (chart) pushPoint(mbps, "up", true);
}

function paintLatencyFromPings() {
  const times = state.pingTimes.slice().sort((a, b) => a - b);
  if (!times.length) return;
  const mid = times[Math.floor(times.length / 2)];
  const mean = times.reduce((s, x) => s + x, 0) / times.length;
  const jitter = Math.sqrt(times.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / times.length);
  el.lat.textContent = fmt(mid, mid < 10 ? 1 : 0);
  el.jitter.textContent = "jitter " + fmt(jitter, 1) + " ms";
}

async function pingOnce(signal) {
  const t0 = performance.now();
  const res = await fetch(TRACE_URL + "?r=" + Math.random(), {
    cache: "no-store",
    signal,
  });
  await res.text();
  return performance.now() - t0;
}

async function pingLoop() {
  const abort = new AbortController();
  state.pingAbort = abort;
  while (state.monitoring) {
    try {
      const ms = await pingOnce(abort.signal);
      if (!state.monitoring) return;
      state.pingTimes.push(ms);
      if (state.pingTimes.length > LIVE_PING_WINDOW) state.pingTimes.shift();
      paintLatencyFromPings();
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
    if (!state.monitoring) return;
    await sleep(1000);
  }
}

function liveDownloadOnce() {
  return new Promise((resolve) => {
    if (!state.monitoring) {
      resolve(false);
      return;
    }
    if (state.liveHoldDown) {
      resolve("abort");
      return;
    }
    const url = DOWN_URL + "?bytes=" + liveChunkBytes() + "&r=" + Math.random();
    const xhr = new XMLHttpRequest();
    let lastLoaded = 0;
    state.liveDownXhrs.push(xhr);
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.timeout = 120000;
    xhr.onprogress = (ev) => {
      const loaded = ev.loaded || 0;
      const delta = loaded - lastLoaded;
      if (delta > 0) noteLiveBytes(delta);
      lastLoaded = loaded;
    };
    const drop = () => {
      state.liveDownXhrs = state.liveDownXhrs.filter((x) => x !== xhr);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        state.liveFails = 0;
        if (xhr.response && xhr.response.byteLength > lastLoaded) {
          noteLiveBytes(xhr.response.byteLength - lastLoaded);
        }
        drop();
        resolve(state.monitoring);
        return;
      }
      state.liveFails += 1;
      drop();
      resolve(state.monitoring);
    };
    xhr.onerror = () => {
      state.liveFails += 1;
      drop();
      resolve(state.monitoring);
    };
    xhr.ontimeout = () => {
      state.liveFails += 1;
      drop();
      resolve(state.monitoring);
    };
    xhr.onabort = () => {
      drop();
      resolve("abort");
    };
    xhr.send();
  });
}

function liveUploadOnce() {
  return new Promise((resolve) => {
    if (!state.monitoring) {
      resolve(false);
      return;
    }
    const bytes = liveUpChunkBytes();
    const xhr = new XMLHttpRequest();
    const t0 = performance.now();
    let lastLoaded = 0;
    state.liveUpXhrs.push(xhr);
    xhr.open("POST", UP_URL + "?r=" + Math.random(), true);
    xhr.timeout = 30000;
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (ev) => {
      lastLoaded = ev.loaded || lastLoaded;
      const ms = Math.max(1, performance.now() - t0);
      if (lastLoaded > 80e3) paintLiveUp((lastLoaded * 8) / (ms / 1000) / 1e6, false);
    };
    const drop = () => {
      state.liveUpXhrs = state.liveUpXhrs.filter((x) => x !== xhr);
    };
    const finishOk = (loaded) => {
      const ms = Math.max(1, performance.now() - t0);
      const n = Math.max(loaded, lastLoaded);
      if (n > 0) paintLiveUp((n * 8) / (ms / 1000) / 1e6, true);
      drop();
      resolve(state.monitoring);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        state.liveUpFails = 0;
        finishOk(bytes);
        return;
      }
      state.liveUpFails += 1;
      drop();
      resolve(state.monitoring);
    };
    xhr.onerror = () => {
      state.liveUpFails += 1;
      drop();
      resolve(state.monitoring);
    };
    xhr.ontimeout = () => {
      state.liveUpFails += 1;
      drop();
      resolve(state.monitoring);
    };
    xhr.onabort = () => {
      drop();
      resolve("abort");
    };
    try {
      xhr.send(uploadBody(bytes));
    } catch (err) {
      state.liveUpFails += 1;
      drop();
      resolve(state.monitoring);
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function liveWorker() {
  while (state.monitoring) {
    if (state.liveFails >= LIVE_FAIL_LIMIT) {
      setStatus(
        "err",
        "Monitor",
        "Live download failed repeatedly. Check blockers on speed.cloudflare.com."
      );
      el.liveSub.textContent = "failed";
      el.subDown.textContent = "failed";
      stopMonitor(true);
      return;
    }
    if (state.liveFails > 0) {
      await sleep(Math.min(4000, 300 * Math.pow(2, state.liveFails - 1)));
      if (!state.monitoring) return;
    }
    while (state.monitoring && state.liveHoldDown) await sleep(80);
    if (!state.monitoring) return;
    const keepGoing = await liveDownloadOnce();
    if (!state.monitoring || keepGoing === false) return;
  }
}

function abortDownXhrs() {
  state.liveDownXhrs.forEach((xhr) => {
    try {
      xhr.abort();
    } catch (e) {}
  });
  state.liveDownXhrs = [];
}

function abortUpXhrs() {
  state.liveUpXhrs.forEach((xhr) => {
    try {
      xhr.abort();
    } catch (e) {}
  });
  state.liveUpXhrs = [];
}

async function liveUpWorker() {
  while (state.monitoring) {
    if (state.liveUpFails >= LIVE_FAIL_LIMIT) {
      el.subUp.textContent = "failed";
      state.liveHoldDown = false;
      return;
    }
    if (state.liveUpFails > 0) {
      await sleep(Math.min(4000, 300 * Math.pow(2, state.liveUpFails - 1)));
      if (!state.monitoring) return;
    }
    state.liveHoldDown = true;
    abortDownXhrs();
    const keepGoing = await liveUploadOnce();
    state.liveHoldDown = false;
    if (!state.monitoring || keepGoing === false) return;
    await sleep(LIVE_UP_GAP_MS);
  }
}

function liveSecondsLeft() {
  if (state.monitorDeadline == null) return 0;
  return Math.max(0, Math.ceil((state.monitorDeadline - performance.now()) / 1000));
}

function currentLatency() {
  if (!state.pingTimes.length) return null;
  const times = state.pingTimes.slice().sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
}

function saveLiveSample() {
  const down = state.lastLiveMbps;
  const up = state.lastLiveUpMbps;
  const lat = currentLatency();
  if (down == null && up == null) return;
  const rows = loadHistory();
  rows.unshift({
    when: new Date().toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    down,
    up,
    lat,
  });
  saveHistory(rows);
  renderHistory();
}

function finishMonitor() {
  if (!state.monitoring) return;
  saveLiveSample();
  stopMonitor(true);
  const stamp = nowLabel();
  el.liveSub.textContent = state.lastLiveMbps != null ? "15s sample" : "idle";
  el.subDown.textContent = state.lastLiveMbps != null ? "15s sample" : "idle";
  el.subUp.textContent = state.lastLiveUpMbps != null ? "15s sample" : "idle";
  setStatus("", "Done", "15 second sample finished at " + stamp + ".");
}

function tickLiveUi() {
  if (!state.monitoring) return;
  const left = liveSecondsLeft();
  el.statusPill.textContent = left + "s";
  const now = performance.now();
  const downBytes = state.liveBytesWindow;
  if (!(downBytes > 0)) {
    if (state.lastLiveMbps == null) {
      el.liveSub.textContent = "warming up · " + left + "s left";
      el.subDown.textContent = "warming up...";
    } else {
      el.liveSub.textContent = left + "s left · " + nowLabel();
    }
    return;
  }
  const elapsed = Math.max(0.2, (now - state.liveWindowStart) / 1000);
  state.liveBytesWindow = 0;
  state.liveWindowStart = now;
  const mbps = (downBytes * 8) / elapsed / 1e6;
  state.lastLiveMbps = mbps;
  el.live.textContent = fmt(mbps);
  el.liveSub.textContent = left + "s left · " + nowLabel();
  el.down.textContent = fmt(mbps);
  el.subDown.textContent = left + "s left";
  pushPoint(mbps, "live", true);
  state.peakLive = Math.max(state.peakLive, mbps * 1.1, 100);
  state.peakDown = Math.max(state.peakDown, mbps * 1.1, 100);
  setBar(el.barLive, mbps, state.peakLive);
  setBar(el.barDown, mbps, state.peakDown);
}

function startMonitor() {
  if (state.monitoring || state.running) return;
  state.monitoring = true;
  state.liveBytesWindow = 0;
  state.liveWindowStart = performance.now();
  state.monitorDeadline = state.liveWindowStart + LIVE_DURATION_MS;
  state.liveDownXhrs = [];
  state.liveUpXhrs = [];
  state.liveHoldDown = true;
  state.liveFails = 0;
  state.liveUpFails = 0;
  state.pingTimes = [];
  state.peakLive = Math.max(state.peakLive, 100);
  el.btnMonitor.setAttribute("aria-pressed", "true");
  el.btnMonitor.textContent = "Stop monitor";
  el.liveSub.textContent = "warming up · 15s left";
  el.subDown.textContent = "warming up...";
  el.subUp.textContent = "warming up...";
  setStatus(
    "live",
    "15s",
    "15 second sample: download, upload, and ping. Stops on its own."
  );

  pingLoop();
  for (let i = 0; i < LIVE_STREAMS; i++) liveWorker();
  for (let i = 0; i < LIVE_UP_STREAMS; i++) liveUpWorker();
  state.monitorTimer = setInterval(tickLiveUi, 1000);
  if (state.monitorStopTimer) clearTimeout(state.monitorStopTimer);
  state.monitorStopTimer = setTimeout(finishMonitor, LIVE_DURATION_MS);
}

function stopMonitor(silent) {
  state.monitoring = false;
  el.btnMonitor.setAttribute("aria-pressed", "false");
  el.btnMonitor.textContent = "Live monitor";
  if (state.monitorTimer) {
    clearInterval(state.monitorTimer);
    state.monitorTimer = null;
  }
  if (state.monitorStopTimer) {
    clearTimeout(state.monitorStopTimer);
    state.monitorStopTimer = null;
  }
  state.monitorDeadline = null;
  if (state.pingAbort) {
    try {
      state.pingAbort.abort();
    } catch (e) {}
    state.pingAbort = null;
  }
  state.liveHoldDown = false;
  abortDownXhrs();
  abortUpXhrs();
  state.liveBytesWindow = 0;
  clearUiTick();
  if (!silent) {
    el.liveSub.textContent = state.lastLiveMbps != null ? "idle (last)" : "idle";
    el.subDown.textContent = state.lastLiveMbps != null ? "idle (last)" : "idle";
    el.subUp.textContent = state.lastLiveUpMbps != null ? "idle (last)" : "idle";
    setStatus("", "Ready", "Sample stopped. Start live monitor for another 15 second run, or run a full speed test.");
  }
}

el.btnRun.addEventListener("click", () => {
  runFullTest();
});

el.btnMonitor.addEventListener("click", () => {
  if (state.monitoring) stopMonitor();
  else startMonitor();
});

window.addEventListener("resize", drawChart);
window.addEventListener("pagehide", () => {
  if (state.monitoring) stopMonitor(true);
  if (state.engine) {
    try {
      state.engine.pause();
    } catch (e) {}
  }
  clearEngineTimeout();
  clearUiTick();
});

readConnectionFacts();
loadTrace();
renderHistory();
drawChart();
setStatus(
  "",
  "Ready",
  "Full test uses the official Cloudflare engine. Live monitor runs 15 seconds, then stops."
);

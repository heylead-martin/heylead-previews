(function () {
  "use strict";

  var DOWN_URL = "https://speed.cloudflare.com/__down";
  var UP_URL = "https://speed.cloudflare.com/__up";
  var TRACE_URL = "https://cloudflare.com/cdn-cgi/trace";
  var HISTORY_KEY = "heylead-bandwidth-history-v1";
  var MAX_HISTORY = 12;
  var MAX_POINTS = 60;

  var el = {
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

  var state = {
    running: false,
    monitoring: false,
    monitorTimer: null,
    points: [],
    peakDown: 100,
    peakUp: 100,
  };

  function fmt(n, digits) {
    if (n == null || !isFinite(n)) return "-";
    if (digits == null) digits = n >= 100 ? 0 : n >= 10 ? 1 : 2;
    return Number(n).toFixed(digits);
  }

  function setStatus(kind, pill, text) {
    el.statusPill.textContent = pill;
    el.statusPill.className = "pill" + (kind ? " " + kind : "");
    el.statusText.textContent = text;
  }

  function setBar(node, mbps, peak) {
    var pct = Math.max(0, Math.min(100, (mbps / peak) * 100));
    node.style.width = pct.toFixed(1) + "%";
  }

  function nowLabel() {
    var d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  async function measureLatency(samples) {
    var times = [];
    for (var i = 0; i < samples; i++) {
      var t0 = performance.now();
      var res = await fetch(DOWN_URL + "?bytes=0&r=" + Math.random(), {
        cache: "no-store",
        mode: "cors",
      });
      await res.arrayBuffer();
      times.push(performance.now() - t0);
    }
    times.sort(function (a, b) { return a - b; });
    var mid = times[Math.floor(times.length / 2)];
    var mean = times.reduce(function (s, x) { return s + x; }, 0) / times.length;
    var variance = times.reduce(function (s, x) { return s + Math.pow(x - mean, 2); }, 0) / times.length;
    return { latency: mid, jitter: Math.sqrt(variance) };
  }

  async function measureDownload(bytes, onProgress) {
    var url = DOWN_URL + "?bytes=" + bytes + "&r=" + Math.random();
    var t0 = performance.now();
    var res = await fetch(url, { cache: "no-store", mode: "cors" });
    if (!res.ok) throw new Error("Download failed (" + res.status + ")");
    if (!res.body || !res.body.getReader) {
      var buf = await res.arrayBuffer();
      var ms = performance.now() - t0;
      return (buf.byteLength * 8) / (ms / 1000) / 1e6;
    }
    var reader = res.body.getReader();
    var received = 0;
    var lastT = t0;
    var lastBytes = 0;
    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      received += chunk.value.byteLength;
      var now = performance.now();
      if (onProgress && now - lastT > 120) {
        var inst = ((received - lastBytes) * 8) / ((now - lastT) / 1000) / 1e6;
        var overall = (received * 8) / ((now - t0) / 1000) / 1e6;
        onProgress(overall, inst);
        lastT = now;
        lastBytes = received;
      }
    }
    var totalMs = performance.now() - t0;
    if (totalMs < 1) totalMs = 1;
    return (received * 8) / (totalMs / 1000) / 1e6;
  }

  async function measureUpload(bytes, onProgress) {
    var payload = new Uint8Array(bytes);
    // Avoid crypto.getRandomValues on huge buffers; filled zeros are fine for throughput.
    var t0 = performance.now();
    var lastReport = t0;
    var reported = 0;

    // Fake progressive updates during upload (fetch has no upload progress in all browsers).
    var tick = setInterval(function () {
      if (!onProgress) return;
      var elapsed = performance.now() - t0;
      if (elapsed < 80) return;
      // Assume linear until response; clamp so UI moves.
      var guessBytes = Math.min(bytes * 0.95, bytes * (elapsed / 2500));
      if (guessBytes <= reported) return;
      reported = guessBytes;
      var mbps = (guessBytes * 8) / (elapsed / 1000) / 1e6;
      onProgress(mbps, mbps);
      lastReport = performance.now();
    }, 150);

    try {
      var res = await fetch(UP_URL + "?r=" + Math.random(), {
        method: "POST",
        body: payload,
        cache: "no-store",
        mode: "cors",
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (!res.ok && res.status !== 200) {
        // Cloudflare returns 200 with empty body on success; treat other non-ok as soft fail.
        var text = "";
        try { text = await res.text(); } catch (e) {}
        if (res.status >= 400) throw new Error("Upload failed (" + res.status + ")");
        void text;
      } else {
        try { await res.arrayBuffer(); } catch (e) {}
      }
    } finally {
      clearInterval(tick);
    }

    var ms = performance.now() - t0;
    if (ms < 1) ms = 1;
    return (bytes * 8) / (ms / 1000) / 1e6;
  }

  function pushPoint(mbps, kind) {
    state.points.push({ t: Date.now(), mbps: mbps, kind: kind || "down" });
    if (state.points.length > MAX_POINTS) state.points.shift();
    drawChart();
  }

  function drawChart() {
    var canvas = el.chart;
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 900;
    var cssH = 220;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#0d131b";
    ctx.fillRect(0, 0, cssW, cssH);

    var padL = 44;
    var padR = 12;
    var padT = 14;
    var padB = 24;
    var w = cssW - padL - padR;
    var h = cssH - padT - padB;

    var maxY = 10;
    state.points.forEach(function (p) {
      if (p.mbps > maxY) maxY = p.mbps;
    });
    maxY = Math.ceil(maxY * 1.15 / 5) * 5 || 10;

    ctx.strokeStyle = "#1a2433";
    ctx.fillStyle = "#6b7c91";
    ctx.font = "11px JetBrains Mono, monospace";
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var y = padT + (h * g) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + w, y);
      ctx.stroke();
      var label = fmt(maxY * (1 - g / 4), maxY >= 50 ? 0 : 1);
      ctx.fillText(label, 6, y + 3);
    }

    if (state.points.length < 2) {
      ctx.fillStyle = "#5b6b80";
      ctx.fillText("Waiting for samples…", padL + 8, padT + 20);
      return;
    }

    function pathFor(kind, color) {
      var pts = state.points.filter(function (p) { return p.kind === kind; });
      if (pts.length < 2) return;
      ctx.beginPath();
      pts.forEach(function (p, i) {
        var idx = state.points.indexOf(p);
        var x = padL + (idx / (MAX_POINTS - 1)) * w;
        var y = padT + h - (p.mbps / maxY) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
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

  function renderHistory() {
    var rows = loadHistory();
    if (!rows.length) {
      el.history.className = "history empty";
      el.history.textContent = "No tests yet in this browser.";
      return;
    }
    el.history.className = "history";
    el.history.innerHTML = rows.map(function (r) {
      return (
        '<div class="hist-row">' +
        "<span>" + escapeHtml(r.when) + "</span>" +
        "<span>↓ " + fmt(r.down) + "</span>" +
        "<span>↑ " + fmt(r.up) + "</span>" +
        "<span>" + fmt(r.lat, 0) + " ms</span>" +
        "</div>"
      );
    }).join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readConnectionFacts() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) {
      el.factType.textContent = "unavailable";
      el.factDownlink.textContent = "-";
      el.factRtt.textContent = "-";
      el.factSave.textContent = "-";
      return;
    }
    el.factType.textContent = (c.effectiveType || c.type || "unknown") + (c.type && c.effectiveType ? " (" + c.type + ")" : "");
    el.factDownlink.textContent = c.downlink != null ? c.downlink + " Mbps (estimate)" : "-";
    el.factRtt.textContent = c.rtt != null ? c.rtt + " ms" : "-";
    el.factSave.textContent = c.saveData ? "on" : "off";
    if (typeof c.addEventListener === "function") {
      c.addEventListener("change", readConnectionFacts);
    }
  }

  async function loadTrace() {
    try {
      var res = await fetch(TRACE_URL, { cache: "no-store" });
      var text = await res.text();
      var map = {};
      text.split("\n").forEach(function (line) {
        var i = line.indexOf("=");
        if (i > 0) map[line.slice(0, i)] = line.slice(i + 1);
      });
      el.factColo.textContent = map.colo || "-";
      el.factIp.textContent = map.ip || "-";
    } catch (e) {
      el.factColo.textContent = "blocked / failed";
      el.factIp.textContent = "-";
    }
  }

  async function runFullTest() {
    if (state.running) return;
    state.running = true;
    el.btnRun.disabled = true;
    el.btnMonitor.disabled = true;
    setStatus("run", "Testing", "Measuring latency…");

    try {
      var lat = await measureLatency(5);
      el.lat.textContent = fmt(lat.latency, 0);
      el.jitter.textContent = "jitter " + fmt(lat.jitter, 1) + " ms";

      setStatus("run", "Testing", "Downloading…");
      // Warm-up small, then larger payload for accuracy.
      await measureDownload(1e6);
      var down = await measureDownload(25e6, function (overall) {
        el.down.textContent = fmt(overall);
        state.peakDown = Math.max(state.peakDown, overall * 1.2, 50);
        setBar(el.barDown, overall, state.peakDown);
        pushPoint(overall, "down");
      });
      el.down.textContent = fmt(down);
      state.peakDown = Math.max(state.peakDown, down * 1.15, 50);
      setBar(el.barDown, down, state.peakDown);
      pushPoint(down, "down");

      setStatus("run", "Testing", "Uploading…");
      var upBytes = down > 80 ? 8e6 : down > 20 ? 4e6 : 2e6;
      var up = await measureUpload(upBytes, function (overall) {
        el.up.textContent = fmt(overall);
        state.peakUp = Math.max(state.peakUp, overall * 1.2, 20);
        setBar(el.barUp, overall, state.peakUp);
        pushPoint(overall, "up");
      });
      el.up.textContent = fmt(up);
      state.peakUp = Math.max(state.peakUp, up * 1.15, 20);
      setBar(el.barUp, up, state.peakUp);
      pushPoint(up, "up");

      var rows = loadHistory();
      rows.unshift({
        when: new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        down: down,
        up: up,
        lat: lat.latency,
      });
      saveHistory(rows);
      renderHistory();

      setStatus("", "Done", "Last full test at " + nowLabel() + ". Live monitor can keep sampling available download.");
    } catch (err) {
      console.error(err);
      setStatus("err", "Error", (err && err.message) || "Speed test failed. Check network or ad blockers blocking speed.cloudflare.com.");
    } finally {
      state.running = false;
      el.btnRun.disabled = false;
      el.btnMonitor.disabled = false;
    }
  }

  async function sampleLive() {
    if (state.running) return;
    try {
      el.liveSub.textContent = "sampling…";
      var mbps = await measureDownload(2e6);
      el.live.textContent = fmt(mbps);
      el.liveSub.textContent = "last " + nowLabel();
      pushPoint(mbps, "live");
      if (!el.down.textContent || el.down.textContent === "-") {
        // Soft-fill download if user only uses monitor.
        el.down.textContent = fmt(mbps);
        state.peakDown = Math.max(state.peakDown, mbps * 1.2, 50);
        setBar(el.barDown, mbps, state.peakDown);
      }
    } catch (err) {
      el.liveSub.textContent = "sample failed";
      setStatus("err", "Monitor", (err && err.message) || "Live sample failed.");
    }
  }

  function startMonitor() {
    if (state.monitoring) return;
    state.monitoring = true;
    el.btnMonitor.setAttribute("aria-pressed", "true");
    el.btnMonitor.textContent = "Stop monitor";
    setStatus("live", "Live", "Sampling available download every ~4s. Other devices hogging the line will show as lower Mbps.");
    sampleLive();
    state.monitorTimer = setInterval(sampleLive, 4000);
  }

  function stopMonitor() {
    state.monitoring = false;
    el.btnMonitor.setAttribute("aria-pressed", "false");
    el.btnMonitor.textContent = "Live monitor";
    if (state.monitorTimer) {
      clearInterval(state.monitorTimer);
      state.monitorTimer = null;
    }
    setStatus("", "Ready", "Monitor stopped. Run a full speed test anytime.");
  }

  el.btnRun.addEventListener("click", function () {
    if (state.monitoring) stopMonitor();
    runFullTest();
  });

  el.btnMonitor.addEventListener("click", function () {
    if (state.monitoring) stopMonitor();
    else startMonitor();
  });

  window.addEventListener("resize", drawChart);

  readConnectionFacts();
  loadTrace();
  renderHistory();
  drawChart();
  setStatus("", "Ready", "Press Run speed test for a full measurement, or Live monitor to sample available download every few seconds.");
})();

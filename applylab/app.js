/* ApplyLab client - talks to Cloudflare Worker API */
(function () {
  const CFG_KEY = 'applylab.cfg.v1';
  const COOKIE_NAME = 'applylab_cfg';
  const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months
  const titles = {
    dashboard: ['Dashboard', 'Find remote roles, score matches, tailor materials, track applications.'],
    jobs: ['Job feed', 'Remote listings scored against your profile. 60+ is the shortlist.'],
    tracker: ['Application tracker', 'Prepared, applied, interviews - keep status in one place.'],
    profile: ['Profile', 'Your base resume and preferences. Better profile = better matches and tailoring.'],
    settings: ['Settings', 'Connect the ApplyLab Worker that holds your xAI key and data.'],
  };

  const state = {
    view: 'dashboard',
    jobs: [],
    selectedJobId: null,
    applications: [],
    expandedAppId: null,
    profile: null,
    tailorCache: {},
    lastJobsMeta: null,
    loading: false,
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const DEFAULT_API = 'https://applylab-api.martin-656.workers.dev';

  /* ---- durable config: localStorage + sessionStorage + long-lived cookie ---- */

  function readCookie(name) {
    try {
      const parts = String(document.cookie || '').split(';');
      for (const part of parts) {
        const i = part.indexOf('=');
        if (i < 0) continue;
        const k = part.slice(0, i).trim();
        if (k === name) return decodeURIComponent(part.slice(i + 1).trim());
      }
    } catch (_) {}
    return '';
  }

  function writeCookie(name, value, maxAge) {
    try {
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
      document.cookie =
        name +
        '=' +
        encodeURIComponent(value) +
        '; Path=/' +
        '; Max-Age=' +
        maxAge +
        '; Expires=' +
        expires +
        '; SameSite=Lax' +
        secure;
    } catch (_) {}
  }

  function deleteCookie(name) {
    try {
      document.cookie = name + '=; Path=/; Max-Age=0; SameSite=Lax';
    } catch (_) {}
  }

  function parseCfgRaw(raw) {
    if (!raw) return null;
    try {
      const cfg = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!cfg || typeof cfg !== 'object') return null;
      return cfg;
    } catch (_) {
      return null;
    }
  }

  function normalizeCfg(cfg) {
    return {
      apiBase: String((cfg && cfg.apiBase) || DEFAULT_API).replace(/\/+$/, '') || DEFAULT_API,
      token: String((cfg && cfg.token) || '').trim(),
      savedAt: (cfg && cfg.savedAt) || null,
    };
  }

  function loadCfg() {
    const layers = [];
    try {
      layers.push(parseCfgRaw(localStorage.getItem(CFG_KEY)));
    } catch (_) {}
    try {
      layers.push(parseCfgRaw(sessionStorage.getItem(CFG_KEY)));
    } catch (_) {}
    try {
      layers.push(parseCfgRaw(readCookie(COOKIE_NAME)));
    } catch (_) {}

    let merged = { apiBase: DEFAULT_API, token: '', savedAt: null };
    for (const layer of layers) {
      if (!layer) continue;
      if (layer.apiBase) merged.apiBase = layer.apiBase;
      if (layer.token) merged.token = layer.token;
      if (layer.savedAt) merged.savedAt = layer.savedAt;
    }
    return normalizeCfg(merged);
  }

  function saveCfg(cfg) {
    const payload = normalizeCfg(cfg);
    payload.savedAt = cfg && cfg.savedAt ? cfg.savedAt : new Date().toISOString();
    const raw = JSON.stringify(payload);
    try {
      localStorage.setItem(CFG_KEY, raw);
    } catch (_) {}
    try {
      sessionStorage.setItem(CFG_KEY, raw);
    } catch (_) {}
    writeCookie(COOKIE_NAME, raw, COOKIE_MAX_AGE);
    idbSetCfg(raw);
    return payload;
  }

  function clearCfg() {
    try {
      localStorage.removeItem(CFG_KEY);
    } catch (_) {}
    try {
      sessionStorage.removeItem(CFG_KEY);
    } catch (_) {}
    deleteCookie(COOKIE_NAME);
    idbSetCfg('');
  }

  function idbOpen() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('applylab', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idbSetCfg(raw) {
    idbOpen()
      .then((db) => {
        const tx = db.transaction('kv', 'readwrite');
        if (raw) tx.objectStore('kv').put(raw, 'cfg');
        else tx.objectStore('kv').delete('cfg');
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
      })
      .catch(() => {});
  }

  async function idbGetCfg() {
    try {
      const db = await idbOpen();
      const raw = await new Promise((resolve, reject) => {
        const tx = db.transaction('kv', 'readonly');
        const req = tx.objectStore('kv').get('cfg');
        req.onsuccess = () => resolve(req.result || '');
        req.onerror = () => reject(req.error);
      });
      db.close();
      return parseCfgRaw(raw);
    } catch (_) {
      return null;
    }
  }

  async function hydrateDurableCfg() {
    const local = loadCfg();
    const saved = await idbGetCfg();
    if (saved && saved.token && !local.token) {
      saveCfg({
        apiBase: saved.apiBase || local.apiBase,
        token: saved.token,
        savedAt: saved.savedAt,
      });
    } else if (local.token) {
      idbSetCfg(JSON.stringify(local));
    }
    return loadCfg();
  }

  function getCfg() {
    return loadCfg();
  }

  /** Heal partial clears: if token exists in any layer, rewrite all layers */
  function persistCfgEverywhere() {
    const cfg = loadCfg();
    if (cfg.token) saveCfg(cfg);
    return cfg;
  }

  function toast(msg, isErr) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('err', !!isErr);
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 3200);
  }

  async function api(path, opts = {}) {
    const cfg = getCfg();
    if (!cfg.apiBase) throw new Error('Set Worker URL in Settings first.');
    const base = cfg.apiBase.replace(/\/+$/, '');
    const headers = Object.assign(
      { 'Content-Type': 'application/json', Accept: 'application/json' },
      opts.headers || {}
    );
    if (cfg.token) headers['X-App-Token'] = cfg.token;
    const res = await fetch(base + path, { ...opts, headers });
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text || res.statusText };
    }
    if (!res.ok) {
      throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
    }
    return data;
  }

  function scoreClass(n) {
    if (n >= 70) return 'high';
    if (n >= 50) return 'mid';
    return 'low';
  }

  function setApiStatus(ok, label) {
    const el = $('#api-status');
    if (el) {
      el.textContent = label;
      el.classList.toggle('ok', !!ok);
      el.classList.toggle('bad', ok === false);
    }
    const btn = $('#btn-open-settings-quick');
    if (btn) {
      btn.textContent = ok ? 'API connected' : 'Connect API';
      btn.classList.toggle('primary', !ok);
      btn.classList.toggle('ghost', !!ok);
    }
  }

  async function testConnection() {
    const cfg = getCfg();
    if (!cfg.apiBase) {
      setApiStatus(false, 'API: not set');
      return false;
    }
    if (!cfg.token) {
      setApiStatus(false, 'API: token missing');
      return false;
    }
    try {
      const h = await api('/api/health');
      if (!h?.ok) throw new Error('bad health');
      // also verify auth works
      await api('/api/profile');
      // Refresh durable storage so cookie Max-Age keeps extending
      saveCfg(cfg);
      setApiStatus(true, 'API: connected');
      return true;
    } catch (e) {
      setApiStatus(false, 'API: ' + (e.message || 'error').slice(0, 28));
      return false;
    }
  }

  function showView(name) {
    state.view = name;
    $$('.view').forEach((v) => v.classList.add('hidden'));
    const view = $('#view-' + name);
    if (view) view.classList.remove('hidden');
    $$('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    const [t, d] = titles[name] || [name, ''];
    $('#view-title').textContent = t;
    $('#view-lede').textContent = d;
    if (name === 'dashboard') refreshDashboard();
    if (name === 'jobs') {
      if (!state.jobs.length) {
        loadJobs().then(() => {
          if (state.selectedJobId) selectJob(state.selectedJobId);
        });
      } else {
        renderJobList();
        if (state.selectedJobId) selectJob(state.selectedJobId);
      }
    }
    if (name === 'tracker') loadApplications();
    if (name === 'profile') fillProfileForm();
    if (name === 'settings') fillSettings();
  }

  /* ---------- jobs ---------- */

  async function loadJobs(forceRefresh) {
    const list = $('#job-list');
    list.innerHTML = '<div class="empty">Loading jobs...</div>';
    try {
      if (forceRefresh) await api('/api/jobs/refresh', { method: 'POST' });
      const q = $('#jobs-q').value.trim();
      const source = $('#jobs-source').value;
      const minScore = parseInt($('#jobs-min-score').value || '0', 10);
      const params = new URLSearchParams({ limit: '200' });
      if (q) params.set('q', q);
      if (source) params.set('source', source);
      const data = await api('/api/jobs?' + params.toString());
      state.jobs = data.jobs || [];
      state.lastJobsMeta = {
        totalCached: data.totalCached || 0,
        apiCount: data.count || 0,
        shortlistCount: data.shortlistCount,
        q,
        minScore,
      };
      renderJobList();
      if (state.selectedJobId) {
        const still = state.jobs.find((j) => j.id === state.selectedJobId);
        if (still) selectJob(still.id);
      }
      const shown = visibleJobs().length;
      const total = data.totalCached || (data.jobs || []).length;
      toast('Showing ' + shown + ' of ' + total + ' jobs' + (minScore ? ' (score ' + minScore + '+)' : ''));
    } catch (e) {
      list.innerHTML = `<div class="empty">${esc(e.message)}<br><br>Open <strong>Settings</strong>, paste APP_TOKEN, Save &amp; test, then try again.</div>`;
      toast(e.message, true);
    }
  }

  function minScore() {
    return parseInt(($('#jobs-min-score') && $('#jobs-min-score').value) || '0', 10) || 0;
  }

  function visibleJobs() {
    const min = minScore();
    return state.jobs.filter((j) => (j.matchScore || 0) >= min);
  }

  function appForJob(id) {
    return state.applications.find((a) => a.jobId === id);
  }

  function renderJobList() {
    const list = $('#job-list');
    const jobs = visibleJobs();
    if (!jobs.length) {
      const meta = state.lastJobsMeta || {};
      const bits = [];
      if (meta.q) bits.push('No results for "' + esc(meta.q) + '".');
      else bits.push('No jobs in this view.');
      if (meta.totalCached) bits.push('Cache has ' + meta.totalCached + ' jobs total.');
      bits.push('Set score to <strong>Any score</strong>, then Search - or click <strong>Refresh jobs</strong>.');
      list.innerHTML = '<div class="empty">' + bits.join(' ') + '</div>';
      return;
    }
    list.innerHTML = jobs
      .map((j) => {
        const tracked = appForJob(j.id);
        return `
      <button type="button" class="list-item ${j.id === state.selectedJobId ? 'active' : ''}" data-job="${escAttr(j.id)}">
        <div>
          <div class="list-title">${esc(cleanLabel(j.title))}</div>
          <div class="list-meta">${esc(cleanLabel(j.company))} · ${esc(j.source)} · ${esc(cleanLabel(j.location || 'Remote'))}</div>
          ${tracked ? `<div class="tracked">${esc(tracked.status)}</div>` : ''}
        </div>
        <span class="score ${scoreClass(j.matchScore || 0)}">${j.matchScore ?? '-'}</span>
      </button>`;
      })
      .join('');
  }

  function decodeEntities(s) {
    return String(s || '')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  }

  function cleanLabel(s) {
    return decodeEntities(s)
      .replace(/\s+/g, ' ')
      .replace(/[—–]/g, '-')
      .trim();
  }

  /** Turn messy job-board text into readable HTML sections */
  function formatJobDescription(raw) {
    const headers =
      'About the role|About the company|About us|What your day will look like|What you.?ll be doing|What you will do|Responsibilities|Key responsibilities|Requirements|Qualifications|Who you are|Who we.?re looking for|Nice to have|Benefits|What we offer|The role|Your role|Must have|Preferred|The opportunity|How to apply|Location';
    const headerOnlyRe = new RegExp(`^(${headers})[:\\s-]*$`, 'i');
    const headerStartRe = new RegExp(`^(${headers})[:\\s-]*`, 'i');

    function renderLines(lines) {
      if (!lines.length) return '';
      const bullets = lines.filter((l) => /^([•\-\*]|\d+[.)])\s+/.test(l));
      let out = '';
      if (bullets.length >= 2 || (lines.length >= 2 && lines.every((l) => /^([•\-\*]|\d+[.)])\s+/.test(l)))) {
        out += '<ul class="jd-list">';
        for (const l of lines) {
          const item = l.replace(/^([•\-\*]|\d+[.)])\s+/, '');
          if (item) out += `<li>${esc(item)}</li>`;
        }
        out += '</ul>';
        return out;
      }
      let para = lines.join(' ').replace(/\s+/g, ' ').trim();
      if (!para) return '';
      if (para.length > 520) {
        const parts = para.split(/(?<=[.!?])\s+(?=[A-Z])/);
        let chunk = '';
        for (const sent of parts) {
          if ((chunk + ' ' + sent).trim().length > 420 && chunk) {
            out += `<p class="jd-p">${esc(chunk.trim())}</p>`;
            chunk = sent;
          } else {
            chunk = (chunk + ' ' + sent).trim();
          }
        }
        if (chunk) out += `<p class="jd-p">${esc(chunk.trim())}</p>`;
      } else {
        out += `<p class="jd-p">${esc(para)}</p>`;
      }
      return out;
    }

    let text = decodeEntities(raw || '');
    text = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<h[1-6][^>]*>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/[—–]/g, '-')
      .trim();

    if (!text) return '<p class="jd-muted">No description available.</p>';

    // Split headers onto their own blocks WITHOUT dropping following text
    // e.g. "About the role We are hiring" -> "About the role\n\nWe are hiring"
    text = text.replace(new RegExp(`(?:^|\\n)\\s*(${headers})\\s*[:\\-]?\\s*`, 'gi'), '\n\n$1\n\n');
    // Also split mid-string glued headers: "...markets. What you'll be doing Own the..."
    text = text.replace(new RegExp(`([.!?])\\s+(${headers})\\s*[:\\-]?\\s*`, 'gi'), '$1\n\n$2\n\n');
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    // Break very long walls with no structure
    if ((text.match(/\n/g) || []).length < 3 && text.length > 400) {
      text = text.replace(/([.!?])\s+(?=[A-Z])/g, '$1\n\n');
    }

    const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    let html = '';
    let bodyChars = 0;

    for (const block of blocks) {
      let lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (!lines.length) continue;

      // Header alone, or header + body on following lines in same block
      if (headerOnlyRe.test(lines[0]) || (headerStartRe.test(lines[0]) && lines[0].length < 60)) {
        const m = lines[0].match(headerStartRe);
        const heading = (m ? m[0] : lines[0]).replace(/[:\s-]+$/, '').trim();
        const remainderOnFirst = lines[0].replace(headerStartRe, '').trim();
        html += `<h3 class="jd-h">${esc(heading)}</h3>`;
        const rest = [];
        if (remainderOnFirst) rest.push(remainderOnFirst);
        rest.push(...lines.slice(1));
        const body = renderLines(rest);
        html += body;
        bodyChars += rest.join(' ').length;
        continue;
      }

      const body = renderLines(lines);
      html += body;
      bodyChars += lines.join(' ').length;
    }

    // Safety: if we only produced headings (or almost nothing), show raw text
    if (bodyChars < 40) {
      const plain = decodeEntities(raw || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (plain.length > 40) {
        return plain
          .split(/(?<=[.!?])\s+(?=[A-Z])/)
          .reduce((acc, sent) => {
            // group into ~2 sentence paragraphs
            if (!acc.length || acc[acc.length - 1].split(/(?<=[.!?])/).length >= 2) {
              acc.push(sent);
            } else {
              acc[acc.length - 1] += ' ' + sent;
            }
            return acc;
          }, [])
          .map((p) => `<p class="jd-p">${esc(p.trim())}</p>`)
          .join('');
      }
      if (!html) return '<p class="jd-muted">No description available.</p>';
    }
    return html;
  }

  function selectJob(id) {
    state.selectedJobId = id;
    renderJobList();
    const j = state.jobs.find((x) => x.id === id);
    const box = $('#job-detail');
    if (!j) {
      box.innerHTML = '<div class="empty">Job not found.</div>';
      return;
    }
    const cached = state.tailorCache[id];
    const tracked = appForJob(id);
    const hasPacket = !!(cached?.coverLetter || cached?.tailoredResume || tracked?.coverLetter || tracked?.tailoredResume);
    const title = cleanLabel(j.title);
    const company = cleanLabel(j.company);
    const tags = (j.tags || [])
      .map(cleanLabel)
      .filter(Boolean)
      .filter((t, idx, arr) => arr.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === idx)
      .slice(0, 10);
    const jobType = cleanLabel(j.jobType || '');
    const category = cleanLabel(j.category || '');
    const chips = [
      j.location ? cleanLabel(j.location) : 'Remote',
      j.source,
      j.salary ? cleanLabel(j.salary) : '',
      jobType && !/full.?time/i.test(String(j.jobType)) ? jobType : jobType ? 'Full-time' : '',
      j.postedAt ? fmtDate(j.postedAt) : '',
      category,
      ...tags,
    ].filter(Boolean);
    // de-dupe chips case-insensitively
    const seen = new Set();
    const chipHtml = chips
      .filter((c) => {
        const k = c.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 12)
      .map((c) => `<span class="chip">${esc(c)}</span>`)
      .join('');

    const noteHtml = (j.matchNotes || []).length
      ? `<ul class="match-notes">${j.matchNotes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`
      : '';
    const packet = cached || (hasPacket ? packetFromApp(tracked) : null);

    box.innerHTML = `
      <div class="job-head">
        <div class="job-head-main">
          <h2>${esc(title)}</h2>
          <div class="company">${esc(company)}</div>
        </div>
        <span class="score ${scoreClass(j.matchScore || 0)}">${j.matchScore ?? '-'} match</span>
      </div>
      ${noteHtml}
      <div class="meta-row">${chipHtml}</div>
      <div class="detail-actions">
        <button type="button" class="btn primary" id="btn-tailor" data-id="${escAttr(j.id)}">${hasPacket ? 'Update application' : 'Prepare application'}</button>
        <a class="btn" href="${escAttr(j.url)}" target="_blank" rel="noopener">Open job listing</a>
        <button type="button" class="btn" id="btn-download-pdf" data-id="${escAttr(j.id)}" ${hasPacket ? '' : 'disabled'}>Download PDF</button>
        <button type="button" class="btn" id="btn-mark-applied" data-id="${escAttr(j.id)}" ${hasPacket && tracked?.status !== 'applied' ? '' : 'disabled'}>${tracked?.status === 'applied' ? 'Applied' : 'Mark applied'}</button>
        <button type="button" class="btn ghost" id="btn-save-prepared" data-id="${escAttr(j.id)}">Save to tracker</button>
      </div>
      <div class="materials" id="materials">${packet ? renderMaterials(packet) : ''}</div>
      <div class="jd">
        <div class="jd-label">Job description</div>
        <div class="jd-body">${formatJobDescription(j.description || '')}</div>
      </div>
    `;
    if (window.matchMedia('(max-width: 980px)').matches) {
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function packetFromApp(a) {
    if (!a) return null;
    return {
      matchScore: a.matchScore,
      matchReasons: a.matchReasons || [],
      gaps: a.gaps || [],
      applyTips: a.applyTips || [],
      interviewQuestions: a.interviewQuestions || [],
      keywordsToUse: a.keywords || [],
      coverLetter: a.coverLetter || '',
      tailoredResume: a.tailoredResume || '',
    };
  }

  function renderMaterials(m) {
    const keywords = m.keywordsToUse || m.keywords || [];
    const questions = m.interviewQuestions || [];
    return `
      ${m.matchReasons?.length ? `<div><h3>Why it matches</h3><ul class="ul-compact">${m.matchReasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
      ${m.gaps?.length ? `<div><h3>Gaps / risks</h3><ul class="ul-compact">${m.gaps.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
      ${keywords.length ? `<div><h3>Keywords <button type="button" class="btn sm ghost" data-copy="keywords">Copy</button></h3><div class="keywords">${keywords.map((k) => `<span class="chip">${esc(k)}</span>`).join('')}</div></div>` : ''}
      ${m.applyTips?.length ? `<div><h3>Apply tips</h3><ul class="ul-compact">${m.applyTips.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
      ${questions.length ? `<div><h3>Interview prompts</h3><ul class="ul-compact">${questions.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
      <div>
        <h3>Tailored resume <button type="button" class="btn sm ghost" data-copy="resume">Copy</button></h3>
        <pre id="mat-resume">${esc(m.tailoredResume || '')}</pre>
      </div>
      <div>
        <h3>Cover letter <button type="button" class="btn sm ghost" data-copy="cover">Copy</button></h3>
        <pre id="mat-cover">${esc(m.coverLetter || '')}</pre>
      </div>
    `;
  }

  async function tailorJob(id) {
    const btn = $('#btn-tailor');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Preparing...';
    }
    try {
      const data = await api('/api/tailor', {
        method: 'POST',
        body: JSON.stringify({ jobId: id }),
      });
      state.tailorCache[id] = data;
      await savePrepared(id, true);
      selectJob(id);
      toast('Application packet saved');
    } catch (e) {
      toast(e.message, true);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Prepare application';
      }
    }
  }

  async function savePrepared(id, silent) {
    const j = state.jobs.find((x) => x.id === id);
    if (!j) return null;
    const m = state.tailorCache[id] || {};
    const body = {
      jobId: j.id,
      jobTitle: j.title,
      company: j.company,
      jobUrl: j.url,
      source: j.source,
      matchScore: j.matchScore,
      status: 'prepared',
    };
    if (m.coverLetter) body.coverLetter = m.coverLetter;
    if (m.tailoredResume) body.tailoredResume = m.tailoredResume;
    if ((m.keywordsToUse || []).length) body.keywords = m.keywordsToUse;
    if ((m.gaps || []).length) body.gaps = m.gaps;
    if ((m.applyTips || []).length) body.applyTips = m.applyTips;
    if ((m.interviewQuestions || []).length) body.interviewQuestions = m.interviewQuestions;
    if ((m.matchReasons || []).length) body.matchReasons = m.matchReasons;
    try {
      const data = await api('/api/applications', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (data.application) upsertLocalApp(data.application);
      if (!silent) toast(data.updated ? 'Tracker updated' : 'Saved to tracker');
      if (state.view === 'tracker') renderTracker();
      return data.application;
    } catch (e) {
      toast(e.message, true);
      return null;
    }
  }

  function upsertLocalApp(app) {
    const idx = state.applications.findIndex((a) => a.id === app.id || (app.jobId && a.jobId === app.jobId));
    if (idx >= 0) state.applications.splice(idx, 1);
    state.applications.unshift(app);
  }

  /* ---------- applications ---------- */

  async function loadApplications(silent) {
    try {
      const data = await api('/api/applications');
      state.applications = data.applications || [];
      hydrateTailorFromApps();
      renderTracker();
      if (!silent) refreshDashAppsOnly();
    } catch (e) {
      $('#tracker-list').innerHTML = `<div class="empty">${esc(e.message)}</div>`;
      if (!silent) toast(e.message, true);
    }
  }

  function renderTracker() {
    const statusFilter = $('#tracker-status').value;
    let apps = state.applications;
    if (statusFilter) apps = apps.filter((a) => a.status === statusFilter);
    const wrap = $('#tracker-list');
    if (!apps.length) {
      wrap.innerHTML = '<div class="empty">No applications yet. Prepare a job from the shortlist and it will land here.</div>';
      return;
    }
    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Score</th>
            <th>Status</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${apps
            .map(
              (a) => `
            <tr data-app="${escAttr(a.id)}">
              <td>
                <div class="list-title">${esc(a.jobTitle)}</div>
                <div class="list-meta">${esc(a.company)} · ${esc(a.source || '')}</div>
                ${a.jobUrl ? `<a href="${escAttr(a.jobUrl)}" target="_blank" rel="noopener">Listing</a>` : ''}
              </td>
              <td><span class="score ${scoreClass(a.matchScore || 0)}">${a.matchScore ?? '-'}</span></td>
              <td>
                <select class="status-select" data-status-for="${escAttr(a.id)}">
                  ${['prepared', 'applied', 'interview', 'offer', 'rejected', 'archived']
                    .map((s) => `<option value="${s}" ${a.status === s ? 'selected' : ''}>${s}</option>`)
                    .join('')}
                </select>
              </td>
              <td class="list-meta">${esc(fmtDate(a.updatedAt || a.createdAt))}</td>
              <td>
                <button type="button" class="btn sm ghost" data-view-app="${escAttr(a.id)}">${state.expandedAppId === a.id ? 'Hide' : 'Packet'}</button>
                <button type="button" class="btn sm danger" data-del-app="${escAttr(a.id)}">Delete</button>
              </td>
            </tr>
            ${state.expandedAppId === a.id ? renderAppDetailRow(a) : ''}`
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  function renderAppDetailRow(a) {
    const packet = packetFromApp(a);
    return `
      <tr class="app-detail">
        <td colspan="5" data-packet="${escAttr(a.id)}">
          <div class="packet-actions">
            ${a.jobUrl ? `<a class="btn sm" href="${escAttr(a.jobUrl)}" target="_blank" rel="noopener">Open listing</a>` : ''}
            <button type="button" class="btn sm" data-pdf-app="${escAttr(a.id)}" ${a.coverLetter || a.tailoredResume ? '' : 'disabled'}>Download PDF</button>
            <button type="button" class="btn sm" data-applied-app="${escAttr(a.id)}" ${a.status === 'applied' ? 'disabled' : ''}>${a.status === 'applied' ? 'Applied' : 'Mark applied'}</button>
          </div>
          ${renderMaterials(packet)}
          <label>Notes
            <textarea class="input notes-box" data-notes-for="${escAttr(a.id)}">${esc(a.notes || '')}</textarea>
          </label>
          <button type="button" class="btn sm ghost" data-save-notes="${escAttr(a.id)}">Save notes</button>
        </td>
      </tr>`;
  }

  async function updateAppStatus(id, status) {
    try {
      await api('/api/applications/' + encodeURIComponent(id), {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const a = state.applications.find((x) => x.id === id);
      if (a) a.status = status;
      toast('Status updated');
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function deleteApp(id) {
    if (!confirm('Delete this application record?')) return;
    try {
      await api('/api/applications/' + encodeURIComponent(id), { method: 'DELETE' });
      state.applications = state.applications.filter((a) => a.id !== id);
      renderTracker();
      toast('Deleted');
    } catch (e) {
      toast(e.message, true);
    }
  }

  function toggleAppPacket(id) {
    state.expandedAppId = state.expandedAppId === id ? null : id;
    renderTracker();
  }

  async function markApplied(id) {
    const j = state.jobs.find((x) => x.id === id);
    let app = appForJob(id);
    if (!app && j) app = await savePrepared(id, true);
    if (!app) {
      toast('Save the job to the tracker first', true);
      return;
    }
    try {
      const data = await api('/api/applications/' + encodeURIComponent(app.id), {
        method: 'PATCH',
        body: JSON.stringify({ status: 'applied' }),
      });
      if (data.application) upsertLocalApp(data.application);
      toast('Marked applied');
      if (state.view === 'jobs' && state.selectedJobId) selectJob(state.selectedJobId);
      if (state.view === 'tracker') renderTracker();
      refreshDashAppsOnly();
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function markAppliedByApp(appId) {
    const app = state.applications.find((a) => a.id === appId);
    if (!app) return;
    try {
      const data = await api('/api/applications/' + encodeURIComponent(appId), {
        method: 'PATCH',
        body: JSON.stringify({ status: 'applied' }),
      });
      if (data.application) upsertLocalApp(data.application);
      toast('Marked applied');
      renderTracker();
      refreshDashAppsOnly();
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function saveAppNotes(id) {
    const box = document.querySelector('[data-notes-for="' + CSS.escape(id) + '"]');
    if (!box) return;
    try {
      const data = await api('/api/applications/' + encodeURIComponent(id), {
        method: 'PATCH',
        body: JSON.stringify({ notes: box.value }),
      });
      if (data.application) upsertLocalApp(data.application);
      toast('Notes saved');
    } catch (e) {
      toast(e.message, true);
    }
  }

  function hydrateTailorFromApps() {
    for (const a of state.applications) {
      if (!a.jobId || state.tailorCache[a.jobId]) continue;
      if (!a.coverLetter && !a.tailoredResume) continue;
      state.tailorCache[a.jobId] = packetFromApp(a);
    }
  }

  /* ---------- profile ---------- */

  async function fillProfileForm() {
    try {
      const data = await api('/api/profile');
      state.profile = data.profile || {};
      const f = $('#profile-form');
      const p = state.profile;
      f.fullName.value = p.fullName || '';
      f.email.value = p.email || '';
      f.phone.value = p.phone || '';
      f.location.value = p.location || '';
      f.linkedin.value = p.linkedin || '';
      f.portfolio.value = p.portfolio || '';
      f.headline.value = p.headline || '';
      f.summary.value = p.summary || '';
      f.targetRoles.value = (p.targetRoles || []).join(', ');
      f.skills.value = (p.skills || []).join(', ');
      f.yearsExperience.value = p.yearsExperience ?? '';
      f.salaryMin.value = p.salaryMin ?? '';
      f.salaryCurrency.value = p.salaryCurrency || 'EUR';
      f.preferredLocations.value = (p.preferredLocations || []).join(', ');
      f.workAuth.value = p.workAuth || '';
      f.excludeCompanies.value = (p.excludeCompanies || []).join(', ');
      f.resumeText.value = p.resumeText || '';
      const resumeLen = (p.resumeText || '').trim().length;
      $('#resume-file-label').textContent = resumeLen
        ? 'Saved resume, ' + resumeLen + ' characters'
        : 'No file yet';
      renderProfileHistory(p);
    } catch (e) {
      $('#profile-status').textContent = e.message;
    }
  }

  async function saveProfile(ev) {
    ev.preventDefault();
    const f = ev.target;
    const body = {
      fullName: f.fullName.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      location: f.location.value.trim(),
      linkedin: f.linkedin.value.trim(),
      portfolio: f.portfolio.value.trim(),
      headline: f.headline.value.trim(),
      summary: f.summary.value.trim(),
      targetRoles: f.targetRoles.value,
      skills: f.skills.value,
      yearsExperience: f.yearsExperience.value === '' ? null : Number(f.yearsExperience.value),
      salaryMin: f.salaryMin.value === '' ? null : Number(f.salaryMin.value),
      salaryCurrency: f.salaryCurrency.value.trim() || 'EUR',
      preferredLocations: f.preferredLocations.value,
      workAuth: f.workAuth.value.trim(),
      excludeCompanies: f.excludeCompanies.value,
      resumeText: f.resumeText.value,
    };
    try {
      const data = await api('/api/profile', { method: 'PUT', body: JSON.stringify(body) });
      state.profile = data.profile;
      $('#profile-status').textContent = 'Saved ' + fmtDate(new Date().toISOString());
      toast('Profile saved');
    } catch (e) {
      $('#profile-status').textContent = e.message;
      toast(e.message, true);
    }
  }

  /* ---------- resume upload (txt / pdf → plain text) ---------- */

  let pdfJsLoading = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfJsLoading) return pdfJsLoading;
    pdfJsLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error('Could not load PDF parser'));
      document.head.appendChild(s);
    });
    return pdfJsLoading;
  }

  async function extractPdfText(file) {
    const pdfjsLib = await loadPdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const parts = [];
    const maxPages = Math.min(pdf.numPages, 12);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const line = content.items.map((it) => it.str).join(' ');
      parts.push(line);
    }
    return parts.join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  async function handleResumeFile(file) {
    const status = $('#resume-upload-status');
    const label = $('#resume-file-label');
    if (!file) return;
    status.textContent = 'Reading ' + file.name + '…';
    label.textContent = file.name;
    try {
      let text = '';
      const name = (file.name || '').toLowerCase();
      if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
        text = await extractPdfText(file);
      } else {
        text = await file.text();
      }
      text = (text || '').trim();
      if (!text || text.length < 40) {
        throw new Error('Could not extract enough text. Try a text-based PDF or paste manually.');
      }
      const f = $('#profile-form');
      f.resumeText.value = text.slice(0, 50000);
      status.textContent = 'Loaded ' + text.length + ' characters. Click Save profile to store it for AI tailoring.';
      toast('Resume loaded - save profile next');
    } catch (e) {
      status.textContent = e.message || 'Upload failed';
      toast(e.message || 'Upload failed', true);
    }
  }

  /* ---------- dashboard ---------- */

  async function refreshDashboard() {
    const ok = await testConnection();
    if (!ok) {
      $('#dash-matches').innerHTML = '<div class="empty">Connect API in Settings to load matches.</div>';
      $('#dash-apps').innerHTML = '<div class="empty">-</div>';
      return;
    }
    try {
      const [jobsData, appsData, profileData] = await Promise.all([
        api('/api/jobs?limit=100'),
        api('/api/applications'),
        api('/api/profile'),
      ]);
      state.jobs = jobsData.jobs || [];
      state.applications = appsData.applications || [];
      state.profile = profileData.profile;
      hydrateTailorFromApps();

      const shortlist = state.jobs.filter((j) => (j.matchScore || 0) >= 60);
      $('#stat-jobs').textContent = String(jobsData.totalCached ?? state.jobs.length);
      $('#stat-strong').textContent = String(jobsData.shortlistCount ?? shortlist.length);
      $('#stat-apps').textContent = String(state.applications.length);
      $('#stat-prepared').textContent = String(state.applications.filter((a) => a.status === 'prepared').length);
      const nudge = $('#dash-nudge');
      if (nudge) {
        const p = state.profile || {};
        nudge.textContent = p.linkedin
          ? ''
          : 'LinkedIn is empty on your profile. Add it before you prepare letters so they can include the link.';
      }

      $('#dash-matches').innerHTML = shortlist.slice(0, 8).length
        ? shortlist
            .slice(0, 8)
            .map(
              (j) => `
          <button type="button" class="list-item" data-open-job="${escAttr(j.id)}">
            <div>
              <div class="list-title">${esc(j.title)}</div>
              <div class="list-meta">${esc(j.company)} · ${esc(j.source)}</div>
            </div>
            <span class="score ${scoreClass(j.matchScore)}">${j.matchScore}</span>
          </button>`
            )
            .join('')
        : '<div class="empty">No shortlist yet. Check target roles and preferred locations, then refresh jobs.</div>';

      refreshDashAppsOnly();
    } catch (e) {
      toast(e.message, true);
    }
  }

  function refreshDashAppsOnly() {
    const apps = state.applications.slice(0, 6);
    $('#dash-apps').innerHTML = apps.length
      ? apps
          .map(
            (a) => `
        <button type="button" class="list-item" data-open-app="${escAttr(a.id)}">
          <div>
            <div class="list-title">${esc(a.jobTitle)}</div>
            <div class="list-meta">${esc(a.company)} · ${esc(a.status)}</div>
          </div>
          <span class="score ${scoreClass(a.matchScore || 0)}">${a.matchScore ?? '-'}</span>
        </button>`
          )
          .join('')
      : '<div class="empty">No applications tracked yet.</div>';
  }

  /* ---------- settings ---------- */

  let tokenEdit = false;
  let tokenRevealed = false;

  function maskToken(token) {
    if (!token) return '';
    if (token.length <= 8) return '••••';
    return token.slice(0, 4) + '...' + token.slice(-4);
  }

  function paintSavedToken(cfg) {
    const display = $('#cfg-token-display');
    const label = $('#cfg-token-paste-label');
    const toggle = $('#btn-toggle-token');
    if (!display) return;
    if (!cfg.token) {
      display.textContent = 'No token saved yet';
      if (label) label.textContent = 'then Save & test';
      if (toggle) toggle.hidden = true;
      return;
    }
    display.textContent = tokenRevealed ? cfg.token : maskToken(cfg.token) + ' (' + cfg.token.length + ' chars)';
    if (label) label.textContent = 'only if you want to replace it';
    if (toggle) {
      toggle.hidden = false;
      toggle.textContent = tokenRevealed ? 'Hide' : 'Show';
    }
  }

  function fillSettings() {
    const cfg = persistCfgEverywhere();
    const apiInput = $('#cfg-api');
    const tokenInput = $('#cfg-token');
    if (apiInput && document.activeElement !== apiInput && !apiInput.value.trim()) {
      apiInput.value = cfg.apiBase || DEFAULT_API;
    }
    // Never copy the saved token into the paste box. Browsers clear that field.
    paintSavedToken(cfg);
    const hint = $('#cfg-token-hint');
    if (!hint) return;
    if (cfg.token) {
      const when = cfg.savedAt ? ' Saved ' + fmtDate(cfg.savedAt) + '.' : '';
      hint.textContent = 'This token stays on this device.' + when + ' An empty paste box does not remove it.';
    } else {
      hint.textContent = 'No token on this device yet. Paste APP_TOKEN once, click Save & test.';
    }
  }

  async function saveSettings() {
    const prev = getCfg();
    const apiBase = ($('#cfg-api').value.trim() || DEFAULT_API).replace(/\/+$/, '');
    // Do not wipe an existing token if the field is left blank (password managers / reloads)
    const typed = ($('#cfg-token').value || '').trim();
    const token = typed || prev.token || '';
    if (!token) {
      $('#cfg-status').textContent = 'Token required.';
      toast('Paste APP_TOKEN first', true);
      return;
    }
    saveCfg({ apiBase, token });
    tokenEdit = false;
    $('#cfg-token').value = '';
    $('#cfg-token').setAttribute('readonly', 'readonly');
    fillSettings();
    $('#cfg-status').textContent = 'Testing…';
    const ok = await testConnection();
    $('#cfg-status').textContent = ok
      ? 'Connected - token saved persistently on this device.'
      : 'Failed - check URL and token.';
    toast(ok ? 'API connected & saved' : 'Connection failed', !ok);
  }

  /* ---------- utils ---------- */

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escAttr(s) {
    return esc(s).replace(/'/g, '&#39;');
  }
  function fmtDate(d) {
    if (!d) return '';
    try {
      return new Date(d).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(d);
    }
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text || '');
      toast('Copied');
    } catch {
      toast('Copy failed', true);
    }
  }

  function renderProfileHistory(p) {
    const el = $('#profile-history');
    if (!el) return;
    const exp = Array.isArray(p.experience) ? p.experience : [];
    const edu = Array.isArray(p.education) ? p.education : [];
    if (!exp.length && !edu.length) {
      el.innerHTML = '';
      return;
    }
    const roles = exp
      .map((e) => {
        const bits = [e.title, e.company].filter(Boolean).join(' at ');
        if (!bits) return '';
        return '<div>' + esc(bits) + (e.dates ? ' <span class="soft">(' + esc(e.dates) + ')</span>' : '') + '</div>';
      })
      .join('');
    const schools = edu
      .map((e) => {
        if (e.certs) return '<div>' + esc(e.certs) + '</div>';
        const bits = [e.degree, e.school].filter(Boolean).join(', ');
        if (!bits) return '';
        return '<div>' + esc(bits) + (e.year ? ' <span class="soft">(' + esc(e.year) + ')</span>' : '') + '</div>';
      })
      .join('');
    el.innerHTML =
      '<div class="history-block"><strong>On file for tailoring</strong>' +
      roles +
      schools +
      '<div class="soft">Saving this form keeps these roles and this education on the worker.</div></div>';
  }

  function pdfSafe(s) {
    const transliterated = String(s || '')
      .replace(/\u20ac/g, 'EUR ')
      .replace(/\u00a3/g, 'GBP ')
      .replace(/\u00a5/g, 'JPY ')
      .replace(/\u2026/g, '...')
      .replace(/[\u2014\u2013]/g, '-')
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u2022/g, '-')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
    return transliterated.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
  }

  function wrapPdfLine(text, font, size, maxW) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const trial = line ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(trial, size) <= maxW) {
        line = trial;
        continue;
      }
      if (line) lines.push(line);
      if (font.widthOfTextAtSize(word, size) <= maxW) {
        line = word;
        continue;
      }
      let chunk = '';
      for (const ch of word) {
        if (font.widthOfTextAtSize(chunk + ch, size) > maxW && chunk) {
          lines.push(chunk);
          chunk = ch;
        } else chunk += ch;
      }
      line = chunk;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  let pdfLibLoading = null;
  function loadPdfLib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (pdfLibLoading) return pdfLibLoading;
    pdfLibLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
      s.onload = () => resolve(window.PDFLib);
      s.onerror = () => reject(new Error('Could not load PDF builder'));
      document.head.appendChild(s);
    });
    return pdfLibLoading;
  }

  async function downloadPacket(packet) {
    const PDFLib = await loadPdfLib();
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const title = cleanLabel(packet.jobTitle || 'Role');
    const company = cleanLabel(packet.company || 'Company');
    const sections = [
      [title + ' at ' + company, ''],
      ['Tailored resume', packet.tailoredResume || ''],
      ['Cover letter', packet.coverLetter || ''],
    ];
    const keywords = packet.keywordsToUse || packet.keywords || [];
    if (keywords.length) sections.push(['Keywords', keywords.join(', ')]);
    const pageW = 612;
    const pageH = 792;
    const margin = 54;
    const bodySize = 11;
    const lead = 15;
    const maxW = pageW - margin * 2;
    let page = doc.addPage([pageW, pageH]);
    let y = pageH - margin;
    function nextPage() {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
    function write(text, face, size) {
      if (y < margin) nextPage();
      page.drawText(text || ' ', { x: margin, y, size, font: face, color: rgb(0.09, 0.11, 0.14) });
      y -= size + 4;
    }
    for (const [heading, body] of sections) {
      write(pdfSafe(heading).slice(0, 180) || ' ', fontBold, heading === sections[0][0] ? 16 : 13);
      y -= 2;
      const paras = pdfSafe(body).split(/\n+/);
      for (const para of paras) {
        if (!para.trim()) {
          y -= 6;
          continue;
        }
        for (const line of wrapPdfLine(para, font, bodySize, maxW)) write(line, font, bodySize);
        y -= 4;
      }
      y -= lead;
    }
    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    const slug = pdfSafe(company + '-' + title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    a.href = URL.createObjectURL(blob);
    a.download = 'ApplyLab-' + (slug || 'packet') + '.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    const raw = [packet.jobTitle, packet.company, packet.tailoredResume, packet.coverLetter, (packet.keywordsToUse || []).join(' ')].join('\n');
    const simplified = pdfSafe(raw) !== raw.replace(/\r/g, '');
    toast(simplified ? 'PDF downloaded. Accents were written as plain letters.' : 'PDF downloaded');
  }

  async function downloadPdfForJob(id) {
    const j = state.jobs.find((x) => x.id === id);
    const m = state.tailorCache[id] || packetFromApp(appForJob(id)) || {};
    if (!m.coverLetter && !m.tailoredResume) {
      toast('Prepare the application first', true);
      return;
    }
    try {
      await downloadPacket({
        jobTitle: j ? j.title : '',
        company: j ? j.company : '',
        tailoredResume: m.tailoredResume,
        coverLetter: m.coverLetter,
        keywordsToUse: m.keywordsToUse || [],
      });
    } catch (e) {
      toast(e.message || 'PDF failed', true);
    }
  }

  async function downloadPdfForApp(appId) {
    const a = state.applications.find((x) => x.id === appId);
    if (!a || (!a.coverLetter && !a.tailoredResume)) {
      toast('No packet to download', true);
      return;
    }
    try {
      await downloadPacket({
        jobTitle: a.jobTitle,
        company: a.company,
        tailoredResume: a.tailoredResume,
        coverLetter: a.coverLetter,
        keywordsToUse: a.keywords || [],
      });
    } catch (e) {
      toast(e.message || 'PDF failed', true);
    }
  }

  /* ---------- events ---------- */

  function bind() {
    $$('#nav .nav-item').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => showView(b.dataset.goto)));

    $('#btn-open-settings-quick').addEventListener('click', () => showView('settings'));
    $('#btn-refresh-jobs').addEventListener('click', async () => {
      const btn = $('#btn-refresh-jobs');
      btn.disabled = true;
      const prevLabel = btn.textContent;
      btn.textContent = 'Refreshing...';
      try {
        if (state.view === 'dashboard') {
          await api('/api/jobs/refresh', { method: 'POST' });
          await refreshDashboard();
          toast('Jobs refreshed');
        } else {
          await loadJobs(true);
        }
      } catch (e) {
        toast(e.message, true);
      } finally {
        btn.disabled = false;
        btn.textContent = prevLabel;
      }
    });
    $('#btn-load-jobs').addEventListener('click', () => loadJobs(false));
    $('#jobs-min-score').addEventListener('change', () => {
      if (state.lastJobsMeta) state.lastJobsMeta.minScore = minScore();
      if (state.view === 'jobs') renderJobList();
    });
    $('#jobs-q').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadJobs(false);
    });
    $('#btn-reload-apps').addEventListener('click', () => loadApplications());
    $('#tracker-status').addEventListener('change', renderTracker);
    $('#profile-form').addEventListener('submit', saveProfile);
    $('#resume-file').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleResumeFile(file);
    });
    $('#btn-clear-resume').addEventListener('click', () => {
      const f = $('#profile-form');
      f.resumeText.value = '';
      $('#resume-file').value = '';
      $('#resume-file-label').textContent = 'No file yet';
      $('#resume-upload-status').textContent = 'Cleared. Save profile to update the server copy.';
    });
    $('#btn-save-cfg').addEventListener('click', saveSettings);
    $('#btn-toggle-token').addEventListener('click', () => {
      tokenRevealed = !tokenRevealed;
      paintSavedToken(loadCfg());
    });
    const tokenInput = $('#cfg-token');
    const apiInput = $('#cfg-api');
    [tokenInput, apiInput].forEach((input) => {
      if (!input) return;
      input.addEventListener('pointerdown', () => input.removeAttribute('readonly'));
      input.addEventListener('focus', () => input.removeAttribute('readonly'));
    });
    if (tokenInput) {
      tokenInput.addEventListener('keydown', () => {
        tokenEdit = true;
      });
      tokenInput.addEventListener('paste', () => {
        tokenEdit = true;
      });
      tokenInput.addEventListener('blur', () => {
        tokenEdit = false;
        tokenInput.setAttribute('readonly', 'readonly');
        paintSavedToken(loadCfg());
      });
    }
    if (apiInput) {
      apiInput.addEventListener('blur', () => {
        if (!apiInput.value.trim()) apiInput.value = loadCfg().apiBase || DEFAULT_API;
        apiInput.setAttribute('readonly', 'readonly');
      });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !tokenEdit) fillSettings();
    });
    window.addEventListener('pageshow', () => {
      if (!tokenEdit) fillSettings();
    });
    [50, 300, 1000, 2500].forEach((ms) => {
      setTimeout(() => {
        if (!tokenEdit) fillSettings();
      }, ms);
    });
    $('#btn-clear-cfg').addEventListener('click', () => {
      if (!confirm('Clear API URL and token from this device (storage + cookie)?')) return;
      tokenRevealed = false;
      tokenEdit = false;
      clearCfg();
      $('#cfg-token').value = '';
      $('#cfg-api').value = DEFAULT_API;
      fillSettings();
      setApiStatus(false, 'API: not set');
      toast('Cleared saved config on this device');
    });

    document.addEventListener('click', (e) => {
      const jobBtn = e.target.closest('[data-job]');
      if (jobBtn) {
        selectJob(jobBtn.dataset.job);
        return;
      }
      const openJob = e.target.closest('[data-open-job]');
      if (openJob) {
        state.selectedJobId = openJob.dataset.openJob;
        showView('jobs');
        return;
      }
      const openApp = e.target.closest('[data-open-app]');
      if (openApp) {
        state.expandedAppId = openApp.dataset.openApp;
        showView('tracker');
        return;
      }
      if (e.target.id === 'btn-tailor') {
        tailorJob(e.target.dataset.id);
        return;
      }
      if (e.target.id === 'btn-save-prepared') {
        savePrepared(e.target.dataset.id);
        return;
      }
      if (e.target.id === 'btn-mark-applied') {
        markApplied(e.target.dataset.id);
        return;
      }
      if (e.target.id === 'btn-download-pdf') {
        downloadPdfForJob(e.target.dataset.id);
        return;
      }
      const pdfApp = e.target.closest('[data-pdf-app]');
      if (pdfApp) {
        downloadPdfForApp(pdfApp.dataset.pdfApp);
        return;
      }
      const appliedApp = e.target.closest('[data-applied-app]');
      if (appliedApp) {
        markAppliedByApp(appliedApp.dataset.appliedApp);
        return;
      }
      const saveNotes = e.target.closest('[data-save-notes]');
      if (saveNotes) {
        saveAppNotes(saveNotes.dataset.saveNotes);
        return;
      }
      const copy = e.target.closest('[data-copy]');
      if (copy) {
        const holder = copy.closest('[data-packet]');
        let m = null;
        if (holder && holder.dataset.packet) {
          const app = state.applications.find((a) => a.id === holder.dataset.packet);
          m = app ? packetFromApp(app) : null;
        }
        if (!m) m = state.tailorCache[state.selectedJobId] || packetFromApp(appForJob(state.selectedJobId)) || {};
        if (copy.dataset.copy === 'cover') copyText(m.coverLetter);
        else if (copy.dataset.copy === 'keywords') copyText((m.keywordsToUse || []).join(', '));
        else copyText(m.tailoredResume);
        return;
      }
      const st = e.target.closest('[data-status-for]');
      if (st && e.target.matches('select')) {
        updateAppStatus(st.dataset.statusFor, e.target.value);
        return;
      }
      const del = e.target.closest('[data-del-app]');
      if (del) {
        deleteApp(del.dataset.delApp);
        return;
      }
      const view = e.target.closest('[data-view-app]');
      if (view) {
        toggleAppPacket(view.dataset.viewApp);
      }
    });
  }

  function takeTokenFromHash() {
    const hash = String(location.hash || '');
    if (!hash.startsWith('#al=')) return;
    let token = '';
    try {
      token = decodeURIComponent(hash.slice(4)).trim();
    } catch (_) {
      token = hash.slice(4).trim();
    }
    history.replaceState(null, '', location.pathname + location.search);
    if (token) saveCfg({ apiBase: DEFAULT_API, token });
  }

  bind();
  takeTokenFromHash();
  hydrateDurableCfg().then(() => {
    persistCfgEverywhere();
    fillSettings();
    return testConnection();
  }).then((ok) => {
    if (ok) showView('dashboard');
    else showView('settings');
    fillSettings();
  });
})();

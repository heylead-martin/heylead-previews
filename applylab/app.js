/* ApplyLab client - talks to Cloudflare Worker API */
(function () {
  const CFG_KEY = 'applylab.cfg.v1';
  const titles = {
    dashboard: ['Dashboard', 'Find remote roles, score matches, tailor materials, track applications.'],
    jobs: ['Job feed', 'Remote full-time listings scored against your profile.'],
    tracker: ['Application tracker', 'Prepared, applied, interviews - keep status in one place.'],
    profile: ['Profile', 'Your base resume and preferences. Better profile = better matches and tailoring.'],
    settings: ['Settings', 'Connect the ApplyLab Worker that holds your xAI key and data.'],
  };

  const state = {
    view: 'dashboard',
    jobs: [],
    selectedJobId: null,
    applications: [],
    profile: null,
    tailorCache: {},
    loading: false,
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const DEFAULT_API = 'https://applylab-api.martin-656.workers.dev';

  function loadCfg() {
    try {
      const cfg = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      if (!cfg.apiBase) cfg.apiBase = DEFAULT_API;
      return cfg;
    } catch {
      return { apiBase: DEFAULT_API };
    }
  }
  function saveCfg(cfg) {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }
  function getCfg() {
    return loadCfg();
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
    el.textContent = label;
    el.classList.toggle('ok', !!ok);
    el.classList.toggle('bad', ok === false);
  }

  async function testConnection() {
    const cfg = getCfg();
    if (!cfg.apiBase) {
      setApiStatus(false, 'API: not set');
      return false;
    }
    try {
      const h = await api('/api/health');
      if (!h?.ok) throw new Error('bad health');
      // also verify auth works
      await api('/api/profile');
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
    if (name === 'jobs' && !state.jobs.length) loadJobs();
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
      const params = new URLSearchParams({ limit: '150' });
      if (q) params.set('q', q);
      if (source) params.set('source', source);
      const data = await api('/api/jobs?' + params.toString());
      state.jobs = (data.jobs || []).filter((j) => (j.matchScore || 0) >= minScore);
      renderJobList();
      if (state.selectedJobId) {
        const still = state.jobs.find((j) => j.id === state.selectedJobId);
        if (still) selectJob(still.id);
      }
      toast(`Loaded ${state.jobs.length} jobs` + (data.totalCached ? ` (${data.totalCached} cached)` : ''));
    } catch (e) {
      list.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
      toast(e.message, true);
    }
  }

  function renderJobList() {
    const list = $('#job-list');
    if (!state.jobs.length) {
      list.innerHTML = '<div class="empty">No jobs match. Lower the score filter or broaden search.</div>';
      return;
    }
    list.innerHTML = state.jobs
      .map(
        (j) => `
      <button type="button" class="list-item ${j.id === state.selectedJobId ? 'active' : ''}" data-job="${escAttr(j.id)}">
        <div>
          <div class="list-title">${esc(j.title)}</div>
          <div class="list-meta">${esc(j.company)} · ${esc(j.source)} · ${esc(j.location || 'Remote')}</div>
        </div>
        <span class="score ${scoreClass(j.matchScore || 0)}">${j.matchScore ?? '-'}</span>
      </button>`
      )
      .join('');
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
    box.innerHTML = `
      <div class="meta-row" style="justify-content:space-between;align-items:flex-start">
        <div>
          <h2>${esc(j.title)}</h2>
          <div class="company">${esc(j.company)}</div>
        </div>
        <span class="score ${scoreClass(j.matchScore || 0)}">${j.matchScore ?? '-'} match</span>
      </div>
      <div class="meta-row">
        <span class="chip">${esc(j.location || 'Remote')}</span>
        <span class="chip">${esc(j.source)}</span>
        ${j.salary ? `<span class="chip">${esc(j.salary)}</span>` : ''}
        ${j.jobType ? `<span class="chip">${esc(j.jobType)}</span>` : ''}
        ${j.postedAt ? `<span class="chip">${esc(fmtDate(j.postedAt))}</span>` : ''}
        ${(j.tags || []).slice(0, 8).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}
      </div>
      <div class="detail-actions">
        <button type="button" class="btn primary" id="btn-tailor" data-id="${escAttr(j.id)}">AI tailor materials</button>
        <a class="btn" href="${escAttr(j.url)}" target="_blank" rel="noopener">Open job listing</a>
        <button type="button" class="btn ghost" id="btn-save-prepared" data-id="${escAttr(j.id)}">Save to tracker</button>
        <button type="button" class="btn ghost" id="btn-copy-cover" ${cached?.coverLetter ? '' : 'disabled'}>Copy cover letter</button>
      </div>
      <div class="desc">${esc((j.description || '').slice(0, 2500))}${(j.description || '').length > 2500 ? '…' : ''}</div>
      <div class="materials" id="materials">${cached ? renderMaterials(cached) : ''}</div>
    `;
  }

  function renderMaterials(m) {
    return `
      ${m.matchReasons?.length ? `<div><h3>Why it matches</h3><ul class="ul-compact">${m.matchReasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
      ${m.gaps?.length ? `<div><h3>Gaps / risks</h3><ul class="ul-compact">${m.gaps.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
      ${m.applyTips?.length ? `<div><h3>Apply tips</h3><ul class="ul-compact">${m.applyTips.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
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
      btn.textContent = 'Tailoring…';
    }
    try {
      const data = await api('/api/tailor', {
        method: 'POST',
        body: JSON.stringify({ jobId: id }),
      });
      state.tailorCache[id] = data;
      if (typeof data.matchScore === 'number') {
        const j = state.jobs.find((x) => x.id === id);
        if (j) j.matchScore = data.matchScore;
      }
      selectJob(id);
      toast('Materials ready');
    } catch (e) {
      toast(e.message, true);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'AI tailor materials';
      }
    }
  }

  async function savePrepared(id) {
    const j = state.jobs.find((x) => x.id === id);
    if (!j) return;
    const m = state.tailorCache[id] || {};
    try {
      await api('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobId: j.id,
          jobTitle: j.title,
          company: j.company,
          jobUrl: j.url,
          source: j.source,
          matchScore: m.matchScore ?? j.matchScore,
          coverLetter: m.coverLetter || '',
          tailoredResume: m.tailoredResume || '',
          status: m.coverLetter || m.tailoredResume ? 'prepared' : 'prepared',
        }),
      });
      toast('Saved to tracker');
      loadApplications(true);
    } catch (e) {
      toast(e.message, true);
    }
  }

  /* ---------- applications ---------- */

  async function loadApplications(silent) {
    try {
      const data = await api('/api/applications');
      state.applications = data.applications || [];
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
      wrap.innerHTML = '<div class="empty">No applications yet. Tailor a job and save it to the tracker.</div>';
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
                <button type="button" class="btn sm ghost" data-view-app="${escAttr(a.id)}">Materials</button>
                <button type="button" class="btn sm danger" data-del-app="${escAttr(a.id)}">Delete</button>
              </td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `;
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

  function viewAppMaterials(id) {
    const a = state.applications.find((x) => x.id === id);
    if (!a) return;
    const box = window.open('', '_blank');
    if (!box) {
      toast('Popup blocked - allow popups to view materials', true);
      return;
    }
    box.document.write(`<!doctype html><title>${esc(a.jobTitle)} - materials</title>
      <style>body{font-family:system-ui;max-width:720px;margin:40px auto;padding:0 16px;line-height:1.5;color:#111}
      pre{white-space:pre-wrap;background:#f4f6f8;padding:14px;border-radius:8px;font-size:13px}
      h1{font-size:1.3rem} h2{font-size:1rem;margin-top:28px}</style>
      <h1>${esc(a.jobTitle)} @ ${esc(a.company)}</h1>
      <p>Status: ${esc(a.status)} · Score: ${esc(String(a.matchScore ?? '-'))}</p>
      ${a.jobUrl ? `<p><a href="${escAttr(a.jobUrl)}">Job listing</a></p>` : ''}
      <h2>Cover letter</h2><pre>${esc(a.coverLetter || '(none)')}</pre>
      <h2>Tailored resume</h2><pre>${esc(a.tailoredResume || '(none)')}</pre>
      <h2>Notes</h2><pre>${esc(a.notes || '')}</pre>`);
    box.document.close();
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
      f.excludeCompanies.value = (p.excludeCompanies || []).join(', ');
      f.resumeText.value = p.resumeText || '';
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

      const strong = state.jobs.filter((j) => (j.matchScore || 0) >= 70);
      $('#stat-jobs').textContent = String(jobsData.totalCached ?? state.jobs.length);
      $('#stat-strong').textContent = String(strong.length);
      $('#stat-apps').textContent = String(state.applications.length);
      $('#stat-prepared').textContent = String(state.applications.filter((a) => a.status === 'prepared').length);

      $('#dash-matches').innerHTML = strong.slice(0, 6).length
        ? strong
            .slice(0, 6)
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
        : '<div class="empty">No strong matches yet. Add target roles + skills in Profile, then refresh jobs.</div>';

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
        <div class="list-item" style="cursor:default">
          <div>
            <div class="list-title">${esc(a.jobTitle)}</div>
            <div class="list-meta">${esc(a.company)} · ${esc(a.status)}</div>
          </div>
          <span class="score ${scoreClass(a.matchScore || 0)}">${a.matchScore ?? '-'}</span>
        </div>`
          )
          .join('')
      : '<div class="empty">No applications tracked yet.</div>';
  }

  /* ---------- settings ---------- */

  function fillSettings() {
    const cfg = getCfg();
    $('#cfg-api').value = cfg.apiBase || DEFAULT_API;
    // Always re-populate from localStorage so a saved token is visible after reload
    $('#cfg-token').value = cfg.token || '';
    const hint = $('#cfg-token-hint');
    if (cfg.token) {
      const mask = cfg.token.length > 8
        ? cfg.token.slice(0, 4) + '…' + cfg.token.slice(-4)
        : '••••';
      hint.textContent = 'Saved in this browser: ' + mask + ' (' + cfg.token.length + ' chars). Leave blank on save to keep it.';
    } else {
      hint.textContent = 'No token in this browser yet. Paste APP_TOKEN and click Save & test.';
    }
  }

  async function saveSettings() {
    const prev = getCfg();
    const apiBase = ($('#cfg-api').value.trim() || DEFAULT_API).replace(/\/+$/, '');
    // Do not wipe an existing token if the field is left blank (common after password managers / reloads)
    const typed = $('#cfg-token').value.trim();
    const token = typed || prev.token || '';
    if (!token) {
      $('#cfg-status').textContent = 'Token required.';
      toast('Paste APP_TOKEN first', true);
      return;
    }
    saveCfg({ apiBase, token });
    // Keep field filled so it does not "disappear" after save
    $('#cfg-token').value = token;
    fillSettings();
    $('#cfg-status').textContent = 'Testing…';
    const ok = await testConnection();
    $('#cfg-status').textContent = ok ? 'Connected.' : 'Failed - check URL and token.';
    toast(ok ? 'API connected' : 'Connection failed', !ok);
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

  /* ---------- events ---------- */

  function bind() {
    $$('#nav .nav-item').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => showView(b.dataset.goto)));

    $('#btn-open-settings-quick').addEventListener('click', () => showView('settings'));
    $('#btn-refresh-jobs').addEventListener('click', () => loadJobs(true));
    $('#btn-load-jobs').addEventListener('click', () => loadJobs(false));
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
      const input = $('#cfg-token');
      const btn = $('#btn-toggle-token');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
    });
    $('#btn-clear-cfg').addEventListener('click', () => {
      if (!confirm('Clear API URL and token from this browser?')) return;
      localStorage.removeItem(CFG_KEY);
      $('#cfg-token').value = '';
      fillSettings();
      setApiStatus(false, 'API: not set');
      toast('Cleared local config');
    });

    document.addEventListener('click', (e) => {
      const jobBtn = e.target.closest('[data-job]');
      if (jobBtn) {
        selectJob(jobBtn.dataset.job);
        return;
      }
      const openJob = e.target.closest('[data-open-job]');
      if (openJob) {
        showView('jobs');
        state.selectedJobId = openJob.dataset.openJob;
        // ensure job list has data
        if (!state.jobs.length) {
          loadJobs().then(() => selectJob(openJob.dataset.openJob));
        } else {
          selectJob(openJob.dataset.openJob);
        }
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
      if (e.target.id === 'btn-copy-cover') {
        const m = state.tailorCache[state.selectedJobId];
        if (m?.coverLetter) copyText(m.coverLetter);
        return;
      }
      const copy = e.target.closest('[data-copy]');
      if (copy) {
        const m = state.tailorCache[state.selectedJobId] || {};
        copyText(copy.dataset.copy === 'cover' ? m.coverLetter : m.tailoredResume);
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
        viewAppMaterials(view.dataset.viewApp);
      }
    });
  }

  bind();
  fillSettings();
  testConnection().then((ok) => {
    if (ok) showView('dashboard');
    else showView('settings');
  });
})();

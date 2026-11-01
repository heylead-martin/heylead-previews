/* Match Fit app logic. All data lives in localStorage on this device. */
(function () {
  'use strict';

  var D = window.MF_DATA;
  var KEY = 'matchfit.v1';
  var FLOOR = 1800;
  var S = load();
  var tab = 'today';
  var O = null;      // onboarding draft
  var P = null;      // strength session in progress
  var G = null;      // guided flow in progress
  var R = null;      // rest timer
  var gTimer = null, rTimer = null, audio = null, wake = null, resetArmed = 0;

  /* ---------- helpers ---------- */
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var keyOf = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var parseKey = function (k) { var a = k.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); };
  var todayKey = function () { return keyOf(new Date()); };
  var addDays = function (k, n) { var d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
  var diffDays = function (a, b) { return Math.round((parseKey(b) - parseKey(a)) / 864e5); };
  var dowOf = function (k) { return (parseKey(k).getDay() + 6) % 7; };
  var mondayOf = function (k) { return addDays(k, -dowOf(k)); };
  var DOW = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var DOW1 = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  var DOW3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var fmtLong = function (k) { return parseKey(k).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); };
  var fmtShort = function (k) { return parseKey(k).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
  var n0 = function (x) { return Math.round(x).toLocaleString('en-US'); };
  var r50 = function (x) { return Math.round(x / 50) * 50; };
  var r5 = function (x) { return Math.round(x / 5) * 5; };
  var kg1 = function (x) { return (Math.round(x * 10) / 10).toFixed(1); };
  var kgS = function (x) { var r = Math.round(x * 10) / 10; return r % 1 === 0 ? String(r) : r.toFixed(1); };
  var num = function (v) { var x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : null; };
  var pct = function (a, b) { return b > 0 ? Math.max(0, Math.min(100, a / b * 100)) : 0; };

  /* ---------- storage ---------- */
  function migrate(s) {
    s.weights = s.weights || {}; s.waist = s.waist || {}; s.days = s.days || {};
    s.lifts = s.lifts || {}; s.last = s.last || {}; s.checkin = s.checkin || null;
    s.profile.move = s.profile.move || 600; s.profile.kcalAdj = s.profile.kcalAdj || 0;
    return s;
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.v === 1 && s.profile) return migrate(s);
    } catch (e) {}
    return null;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast('Could not save on this device'); }
  }
  function day(k) {
    var d = S.days[k] || (S.days[k] = {});
    d.h = d.h || {}; d.food = d.food || []; d.done = d.done || {};
    return d;
  }
  function peek(k) {
    var d = S.days[k] || {};
    return { h: d.h || {}, food: d.food || [], done: d.done || {}, session: d.session };
  }

  /* ---------- program ---------- */
  var STRENGTH_IDS = ['A', 'B', 'C'], YOGA_IDS = ['yogaA', 'yogaB'], EXTRA_IDS = ['warmup', 'stretch', 'morning'];
  var TYPE_LABEL = { tennis: 'Tennis', strength: 'Lift', yoga: 'Yoga', rest: 'Walk' };
  var CYCLE = ['tennis', 'strength', 'yoga', 'rest'];
  var BW = { deadBug: 1, sidePlankKnee: 1, plank: 1, plankTaps: 1, lateralLunge: 1 };
  var BW_HOME = { pushP1: 1, pushP2: 1, pushP3: 1, pallof: 1 };

  function weekNo(k) { return Math.max(1, Math.floor(diffDays(S.profile.start, k) / 7) + 1); }
  function phaseOf(w) { return w <= 4 ? 1 : w <= 8 ? 2 : 3; }
  function typeOf(id) { return STRENGTH_IDS.indexOf(id) > -1 ? 'strength' : YOGA_IDS.indexOf(id) > -1 ? 'yoga' : id; }
  function mainSession(k) {
    var d = peek(k), i;
    if (d.session) return d.session;
    var t = S.profile.week[dowOf(k)];
    if (t === 'strength') {
      for (i = 0; i < STRENGTH_IDS.length; i++) if (d.done[STRENGTH_IDS[i]]) return STRENGTH_IDS[i];
      return S.last.strength === 'A' ? 'B' : 'A';
    }
    if (t === 'yoga') {
      for (i = 0; i < YOGA_IDS.length; i++) if (d.done[YOGA_IDS[i]]) return YOGA_IDS[i];
      return S.last.yoga === 'yogaA' ? 'yogaB' : 'yogaA';
    }
    return t;
  }
  function dayType(k) { return typeOf(mainSession(k)); }
  function dayDone(k) {
    var done = peek(k).done;
    return Object.keys(done).some(function (id) { return done[id] && EXTRA_IDS.indexOf(id) === -1; });
  }
  function flowSecs(f) { return f.steps.reduce(function (a, s) { return a + s.secs * (s.side ? 2 : 1); }, 0); }
  function sessionInfo(id, k) {
    var ph = phaseOf(weekNo(k));
    if (STRENGTH_IDS.indexOf(id) > -1) {
      var w = D.STRENGTH[ph][id];
      return w ? Object.assign({ id: id, kind: 'strength', phase: ph }, w) : null;
    }
    if (D.FLOWS[id]) return Object.assign({}, D.FLOWS[id], { id: id, kind: 'flow', flowKind: D.FLOWS[id].kind, minutes: Math.round(flowSecs(D.FLOWS[id]) / 60) });
    if (id === 'tennis') return { id: 'tennis', kind: 'tennis', title: 'Tennis day' };
    return { id: 'rest', kind: 'rest', title: 'Rest day' };
  }
  function setsFor(item, k) {
    var w = weekNo(k);
    return (phaseOf(w) === 1 && w <= 2) ? Math.min(item.sets, 2) : item.sets;
  }
  function exName(id) { var e = D.EX[id]; return typeof e.name === 'string' ? e.name : e.name[S.profile.equip] || e.name.gym; }
  function exCue(id) { var e = D.EX[id]; return typeof e.cue === 'string' ? e.cue : e.cue[S.profile.equip] || e.cue.gym; }
  function isBW(id) { return !!BW[id] || (S.profile.equip === 'home' && !!BW_HOME[id]); }

  function suggestWeek(tennis) {
    var w = [0, 1, 2, 3, 4, 5, 6].map(function () { return 'rest'; });
    tennis.forEach(function (d) { w[d] = 'tennis'; });
    var free = [0, 1, 2, 3, 4, 5, 6].filter(function (d) { return tennis.indexOf(d) === -1; });
    var dist = function (a, b) { var x = Math.abs(a - b); return Math.min(x, 7 - x); };
    var beforeTennis = function (d) { return tennis.indexOf((d + 1) % 7) > -1; };
    var afterTennis = function (d) { return tennis.indexOf((d + 6) % 7) > -1; };
    var pick = [];
    if (free.length >= 2) {
      var best = -1e9;
      for (var i = 0; i < free.length; i++) for (var j = i + 1; j < free.length; j++) {
        var a = free[i], b = free[j];
        var sc = dist(a, b) * 2 - (beforeTennis(a) ? 3 : 0) - (beforeTennis(b) ? 3 : 0);
        if (sc > best) { best = sc; pick = [a, b]; }
      }
    } else if (free.length === 1) pick = [free[0]];
    pick.forEach(function (d) { w[d] = 'strength'; });
    var rest = free.filter(function (d) { return pick.indexOf(d) === -1; });
    rest.sort(function (a, b) { return (afterTennis(b) ? 1 : 0) - (afterTennis(a) ? 1 : 0); });
    rest.slice(0, Math.min(2, Math.max(0, rest.length - 1))).forEach(function (d) { w[d] = 'yoga'; });
    return w;
  }

  /* ---------- targets ---------- */
  function baseKcal(p) { p = p || S.profile; return Math.max(FLOOR, r50(p.maint - 500 + (p.kcalAdj || 0))); }
  function kcalFor(k) {
    var t = dayType(k);
    var add = t === 'tennis' ? 200 : t === 'strength' ? 0 : -150;
    return Math.max(FLOOR, baseKcal() + add);
  }
  function proteinTarget(goal) { return Math.max(120, r5(1.8 * (goal || S.profile.goal))); }
  function waterFor(k) { return dayType(k) === 'tennis' ? 3 : 2.5; }
  function dayNote(k) {
    var t = dayType(k);
    return t === 'tennis' ? 'Tennis day, +200' : t === 'strength' ? 'Lifting day' : 'Lighter day, -150';
  }
  function eaten(k) {
    var f = peek(k).food;
    return {
      k: f.reduce(function (a, x) { return a + (+x.k || 0); }, 0),
      p: f.reduce(function (a, x) { return a + (+x.p || 0); }, 0)
    };
  }
  function treatDays(k) {
    var m = mondayOf(k), c = 0;
    for (var i = 0; i < 7; i++) if (peek(addDays(m, i)).food.some(function (x) { return x.treat; })) c++;
    return c;
  }

  function habits(k) {
    var t = dayType(k);
    var label = t === 'tennis' ? 'Play tennis' : t === 'rest' ? 'Walk 30 minutes' : t === 'yoga' ? 'Do your yoga flow' : 'Do ' + sessionInfo(mainSession(k), k).title;
    var sub = (t === 'tennis' || t === 'rest') ? 'Tap when done' : 'Ticks itself when you finish';
    return [
      { id: 'protein', t: 'Protein at every meal', s: 'About ' + proteinTarget() + ' g across the day' },
      { id: 'move', t: 'Close your Move ring', s: n0(S.profile.move) + ' active kcal on your watch' },
      { id: 'session', t: label, s: sub, auto: true, tap: (t === 'tennis' || t === 'rest') },
      { id: 'water', t: 'Drink ' + waterFor(k) + ' L of water', s: t === 'tennis' ? 'Extra today because you play' : 'Keep a bottle in sight' },
      { id: 'drinks', t: 'No beer or sugary drinks', s: 'Sparkling water, zero drinks, coffee, tea' },
      { id: 'veg', t: 'Vegetables at lunch and dinner', s: 'Half the plate' },
      { id: 'sleep', t: 'Slept 7 hours or more', s: 'Muscle gets built while you sleep' }
    ];
  }
  function habitOn(k, h) { var d = peek(k); return h.auto ? !!d.done[mainSession(k)] : !!d.h[h.id]; }

  /* ---------- weight ---------- */
  function series() { return Object.keys(S.weights).sort().map(function (k) { return { k: k, w: +S.weights[k] }; }); }
  function avgIn(a, b) {
    var v = Object.keys(S.weights).filter(function (k) { return k >= a && k <= b; }).map(function (k) { return +S.weights[k]; });
    return v.length ? v.reduce(function (x, y) { return x + y; }, 0) / v.length : null;
  }
  function currentWeight() {
    var t = todayKey(), a = avgIn(addDays(t, -6), t);
    if (a != null) return a;
    var s = series();
    return s.length ? s[s.length - 1].w : S.profile.weight0;
  }
  function weeklyRate() {
    var s = series();
    if (s.length < 2) return null;
    var t = todayKey(), first = s[0].k;
    var days = diffDays(first, t);
    if (days < 10) return null;
    var startAvg = avgIn(first, addDays(first, 6));
    return (currentWeight() - startAvg) / (Math.max(7, days - 3) / 7);
  }
  function checkin() {
    var s = series(), t = todayKey();
    if (s.length < 2 || diffDays(s[0].k, t) < 14) {
      var when = s.length ? fmtShort(addDays(s[0].k, 14)) : 'two weeks from your first weigh-in';
      return { cls: '', title: 'Check-in opens ' + (s.length ? 'on ' + when : when), msg: 'Weigh in most mornings after the bathroom, before breakfast. The first week drops water weight, so the app waits for two weeks of data.' };
    }
    var a = avgIn(addDays(t, -6), t), b = avgIn(addDays(t, -13), addDays(t, -7));
    if (a == null || b == null) return { cls: '', title: 'Need a few more weigh-ins', msg: 'Log at least a couple of mornings in each of the last two weeks.' };
    var rate = a - b;
    var wk = Object.keys(S.waist).sort();
    var waistDown = wk.length >= 2 && (S.waist[wk[wk.length - 1]] <= S.waist[wk[wk.length - 2]] - 0.5);
    var thisWeek = mondayOf(t);
    var applied = S.checkin && S.checkin.week === thisWeek;
    var rateTxt = (rate <= 0 ? 'Down ' : 'Up ') + kg1(Math.abs(rate)) + ' kg on last week.';
    if (rate <= -1.0) return { cls: 'warn', title: 'Faster than needed', msg: rateTxt + ' Losing this fast costs muscle and tennis legs. Eat 150 kcal more each day.', act: 150, applied: applied };
    if (rate <= -0.3) return { cls: 'good', title: 'Right on track', msg: rateTxt + ' Change nothing. Keep doing exactly this.' };
    if (waistDown) return { cls: 'good', title: 'Recomposition is working', msg: rateTxt + ' The scale is slow but your waist is shrinking, so you are swapping fat for muscle. Keep going.' };
    if (baseKcal() <= FLOOR) return { cls: 'warn', title: 'Slower than planned', msg: rateTxt + ' Calories are already at the floor. Add a 30 minute walk on 3 days instead of eating less.' };
    return { cls: 'warn', title: 'Slower than planned', msg: rateTxt + ' Take 150 kcal off each day, or add a 30 minute walk on 3 days.', act: -150, applied: applied };
  }

  /* ---------- icons ---------- */
  var I = {
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle class="fillme" cx="12" cy="12" r="9"/><path d="M5.8 5.8c3.1 3.4 3.1 9 0 12.4M18.2 5.8c-3.1 3.4-3.1 9 0 12.4"/></svg>',
    train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect class="fillme" x="3.5" y="7.5" width="4" height="9" rx="1"/><rect class="fillme" x="16.5" y="7.5" width="4" height="9" rx="1"/><path d="M7.5 12h9M1.5 10.5v3M22.5 10.5v3"/></svg>',
    food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="fillme" d="M3 12h18a9 9 0 0 1-18 0z"/><path d="M9 8.5c0-2 2-2 2-4.5M14 8.5c0-2 2-2 2-4.5"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4v16h18"/><path d="M6.5 8l4 5 3-2.5 4.5 5.5"/><circle class="fillme" cx="18.5" cy="16.5" r="2"/></svg>',
    tennis: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M6 6c3 3.3 3 8.7 0 12M18 6c-3 3.3-3 8.7 0 12"/></svg>',
    strength: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="4" y="8" width="3.5" height="8" rx="1"/><rect x="16.5" y="8" width="3.5" height="8" rx="1"/><path d="M7.5 12h9M2.5 10.5v3M21.5 10.5v3"/></svg>',
    yoga: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 5c2 2.5 2 7 0 10-2-3-2-7.5 0-10z"/><path d="M12 15c-3 0-6-2-7-5 3-.5 5.5.5 7 5zM12 15c3 0 6-2 7-5-3-.5-5.5.5-7 5z"/><path d="M4 18.5h16"/></svg>',
    rest: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6-2.5-2.5 1.5-5 3 3 3 1M9.5 9.5L7 12.5M12 15l3 2 1 4"/></svg>',
    check: '<svg viewBox="0 0 30 30" fill="none" stroke="#233006" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 15.5l4 4 8-9"/></svg>',
    x: '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8"/></svg>',
    play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 5l8 7-8 7M18 5v14"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 5l-8 7 8 7M6 5v14"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'
  };
  var COURT = '<svg class="lines" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="rgba(255,255,255,.17)" stroke-width="1.4">' +
    '<rect x="4" y="5" width="92" height="50" vector-effect="non-scaling-stroke"/>' +
    '<path d="M4 11H96M4 49H96M27 11V49M73 11V49M27 30H73" vector-effect="non-scaling-stroke"/>' +
    '<path d="M50 2V58" stroke-dasharray="1.5 1.5" vector-effect="non-scaling-stroke"/></g></svg>';
  function typeIcon(t) { return I[t] || I.rest; }

  /* ---------- shared pieces ---------- */
  function header(title, sub) {
    return '<header class="top"><div><h1 class="date">' + esc(title) + '</h1>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>' +
      '<button class="icon-btn" data-act="settings" aria-label="Settings">' + I.gear + '</button></header>';
  }
  function weekLabel(k) { var w = weekNo(k); return (w <= 12 ? 'Week ' + w + ' of 12' : 'Week ' + w) + ', ' + D.PHASES[phaseOf(w)].name.toLowerCase() + ' phase'; }
  function meter(label, val, target, unit, cls) {
    var over = cls !== 'protein' && val > target + 100;
    return '<div class="meter"><div class="mrow"><span><span class="big num">' + n0(val) + '</span> <span class="of">of ' + n0(target) + ' ' + unit + '</span></span>' +
      '<span class="of num">' + (val <= target ? n0(target - val) + ' ' + unit + ' ' + (cls === 'protein' ? 'to go' : 'left') : (cls === 'protein' ? 'Target hit' : n0(val - target) + ' over')) + '</span></div>' +
      '<div class="bar ' + (cls || '') + (over ? ' over' : '') + '"><i style="width:' + pct(val, target) + '%"></i></div></div>';
  }
  function planner(week, act) {
    return '<div class="week">' + week.map(function (t, i) {
      return '<button type="button" class="day" data-act="' + act + '" data-i="' + i + '" aria-label="' + DOW[i] + ', ' + TYPE_LABEL[t] + '. Tap to change.">' +
        '<span class="d">' + DOW1[i] + '</span>' + typeIcon(t) + '<span class="lbl">' + TYPE_LABEL[t] + '</span></button>';
    }).join('') + '</div>';
  }
  function tabsHtml() {
    var items = [['today', 'Today'], ['train', 'Train'], ['food', 'Food'], ['progress', 'Progress']];
    return items.map(function (x) {
      return '<button class="tab' + (tab === x[0] ? ' on' : '') + '" data-act="tab" data-tab="' + x[0] + '"' + (tab === x[0] ? ' aria-current="page"' : '') + '>' + I[x[0]] + '<span>' + x[1] + '</span></button>';
    }).join('');
  }

  /* ---------- Today ---------- */
  function hero(k) {
    var id = mainSession(k), info = sessionInfo(id, k), d = peek(k), ph = phaseOf(weekNo(k));
    var done = !!d.done[id];
    var swap = '<button class="btn-text" data-act="swap-open">Change today</button>';
    var h = '', kicker = done ? 'Done today' : 'Today', meta = '', actions = '';
    if (info.kind === 'strength') {
      h = info.title;
      meta = done ? 'Logged. Now get your protein in.' : info.minutes + ' minutes, ' + info.items.length + ' exercises. ' + D.PHASES[ph].effort;
      actions = done ? '<button class="btn-line" data-act="open" data-id="' + id + '">Open again</button>' + swap
        : '<button class="btn-ball" data-act="open" data-id="' + id + '"><span class="dot">' + I.play + '</span>Start</button>' + swap;
    } else if (info.kind === 'flow') {
      var parts = info.title.split(': ');
      h = parts[0];
      meta = done ? 'Logged. Nice and loose.' : (parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) + '. ' : '') + info.minutes + ' minutes, guided with a timer.';
      actions = done ? '<button class="btn-line" data-act="open" data-id="' + id + '">Open again</button>' + swap
        : '<button class="btn-ball" data-act="open" data-id="' + id + '"><span class="dot">' + I.play + '</span>Start</button>' + swap;
    } else if (info.kind === 'tennis') {
      h = 'Tennis day';
      meta = done ? 'Played. Stretch for 10 minutes and eat protein within 2 hours.' : 'Warm up for 7 minutes before you hit, stretch for 10 after. You get 200 extra kcal today.';
      actions = '<button class="btn-ball" data-act="open" data-id="warmup"><span class="dot">' + I.play + '</span>Warm-up</button>' +
        '<button class="btn-line" data-act="open" data-id="stretch">Stretch after</button>' +
        '<button class="btn-line" data-act="toggle-main">' + (done ? 'Undo played' : 'Mark played') + '</button>' + swap;
    } else {
      h = 'Rest day';
      meta = done ? 'Walk logged. Recovery is part of the plan.' : 'Walk 30 to 45 minutes at an easy pace. Feeling stiff? Do the Morning 5.';
      actions = '<button class="btn-ball" data-act="toggle-main"><span class="dot">' + (done ? I.x.replace('currentColor', '#D9F03C') : I.play) + '</span>' + (done ? 'Undo walk' : 'Mark walk done') + '</button>' +
        '<button class="btn-line" data-act="open" data-id="morning">Morning 5</button>' +
        (ph === 3 ? '<button class="btn-line" data-act="open" data-id="C">Bonus circuit</button>' : '') + swap;
    }
    return '<section class="court' + (done ? ' done' : '') + '">' + COURT +
      '<div class="kicker">' + kicker + '</div><h1>' + esc(h) + '</h1><p class="meta">' + esc(meta) + '</p>' +
      '<div class="actions">' + actions + '</div></section>';
  }

  function viewToday() {
    var k = todayKey(), e = eaten(k), target = kcalFor(k), pt = proteinTarget();
    var hs = habits(k), count = hs.filter(function (h) { return habitOn(k, h); }).length;
    var wToday = S.weights[k];

    var checks = '<ul class="checks">' + hs.map(function (h) {
      var on = habitOn(k, h);
      var act = h.auto ? (h.tap ? 'toggle-main' : 'open-main') : 'habit';
      return '<li><button class="check' + (on ? ' on' : '') + '" data-act="' + act + '" data-id="' + h.id + '" aria-pressed="' + on + '">' +
        '<span class="tick">' + I.check + '</span><span><span class="t">' + esc(h.t) + '</span><br><span class="s">' + esc(h.s) + '</span></span></button></li>';
    }).join('') + '</ul>';

    var weightBlock = wToday != null && !(O && O.editWeight)
      ? '<div class="panel inline-form"><span class="grow"><span class="big disp num" style="font-size:28px">' + kg1(wToday) + '</span> <span class="unit">kg logged today</span></span>' +
        '<button class="btn small" data-act="edit-weight">Change</button></div>'
      : '<div class="panel"><div class="inline-form"><label class="sr" for="wq">Weight in kg</label>' +
        '<input id="wq" class="input num" inputmode="decimal" placeholder="Weight" value="' + (wToday != null ? kg1(wToday) : '') + '">' +
        '<span class="unit">kg</span><button class="btn solid" data-act="save-weight-quick">Save</button></div></div>';

    var m = mondayOf(k);
    var strip = '<div class="week">' + [0, 1, 2, 3, 4, 5, 6].map(function (i) {
      var dk = addDays(m, i), t = dayType(dk);
      var cls = 'day' + (dk === k ? ' today' : '') + (dayDone(dk) ? ' done' : '');
      return '<div class="' + cls + '" aria-label="' + DOW[i] + ', ' + TYPE_LABEL[t] + (dayDone(dk) ? ', done' : '') + '"><span class="d">' + DOW1[i] + '</span>' + typeIcon(t) + '<span class="lbl">' + TYPE_LABEL[t] + '</span></div>';
    }).join('') + '</div>';

    return header(fmtLong(k), weekLabel(k)) + hero(k) +
      '<section class="block"><div class="block-head"><h2>Food today</h2><span class="aside">' + dayNote(k) + '</span></div>' +
      '<div class="panel">' + meter('kcal', e.k, target, 'kcal') + meter('protein', e.p, pt, 'g', 'protein') +
      '<button class="btn small" data-act="tab" data-tab="food">Log food</button></div></section>' +
      '<section class="block"><div class="block-head"><h2>Today\'s seven</h2><span class="aside num">' + count + ' of 7</span></div>' + checks + '</section>' +
      '<section class="block"><div class="block-head"><h2>Weight</h2><span class="aside">Mornings, before breakfast</span></div>' + weightBlock + '</section>' +
      '<section class="block"><div class="block-head"><h2>This week</h2><span class="aside">Yellow means done</span></div>' + strip + '</section>';
  }

  /* ---------- Train ---------- */
  function viewTrain() {
    var k = todayKey(), w = weekNo(k), ph = phaseOf(w), P1 = D.PHASES[ph];
    var track = '<div class="track" aria-hidden="true">' + Array.apply(null, Array(12)).map(function (_, i) {
      var n = i + 1; return '<i class="' + (n < w ? 'past' : n === Math.min(w, 12) ? 'now' : '') + '"></i>';
    }).join('') + '</div><div class="track-labels"><span>Easy start</span><span>Build</span><span>Steady</span></div>';

    var lib = ['A', 'B'].concat(ph === 3 ? ['C'] : []).concat(['yogaA', 'yogaB', 'warmup', 'stretch', 'morning']);
    var rows = '<ul class="rows">' + lib.map(function (id) {
      var info = sessionInfo(id, k);
      var sub = info.kind === 'strength' ? info.minutes + ' min, ' + info.items.length + ' exercises' + (id === 'C' ? ', optional' : '') : info.minutes + ' min. ' + info.blurb;
      return '<li><span class="grow"><span class="t">' + esc(info.title) + '</span><br><span class="s">' + esc(sub) + '</span></span>' +
        '<button class="btn small" data-act="open" data-id="' + id + '">Start</button></li>';
    }).join('') + '</ul>';

    var p = S.profile;
    return header('Train', weekLabel(k)) +
      '<section class="block panel"><h2 class="disp" style="font-size:26px">Phase ' + ph + ' of 3: ' + esc(P1.name) + '</h2>' +
      '<p class="muted small">' + esc(P1.weeks) + '</p>' + track +
      '<p class="mt"><b>Effort.</b> ' + esc(P1.effort) + '</p><p class="mt muted">' + esc(P1.note) + '</p></section>' +
      '<section class="block"><div class="block-head"><h2>Your week</h2><span class="aside">Tap a day to change it</span></div>' + planner(p.week, 'cycle-day') + '</section>' +
      '<section class="block"><div class="block-head"><h2>Sessions</h2><span class="aside">' + (p.equip === 'home' ? 'Home version' : 'Gym version') + '</span></div>' + rows + '</section>' +
      '<section class="block"><div class="block-head"><h2>How it works</h2></div>' +
      fold('Losing fat and building muscle together', '<p>You eat about 500 kcal under what you burn, keep protein high, and lift twice a week. The calorie gap takes the fat off. Lifting plus protein tells your body to keep and build muscle while that happens.</p><p>Expect about 0.5 to 0.7 kg a week. From ' + kgS(p.weight0) + ' to ' + kgS(p.goal) + ' kg that is roughly ' + Math.max(1, Math.round((p.weight0 - p.goal) / 0.7)) + ' to ' + Math.max(1, Math.round((p.weight0 - p.goal) / 0.5)) + ' weeks.</p>') +
      fold('When to go heavier', '<p>When you hit the top of the rep range on every set with good form, add 1 to 2 kg next time. Tap Easy after an exercise and the app reminds you next session.</p>') +
      fold('Fitting it around tennis', '<p>No heavy leg work the day before you play. Yoga works best the day after tennis. If your legs are sore on a tennis day, play anyway and go lighter on legs in the next session.</p>') +
      fold('If something hurts', '<p>Muscle soreness for a day or two is normal in the first weeks. Sharp pain or joint pain is not. Stop that exercise, swap it for the easier version, and see a physio if it lasts more than a week.</p>') +
      '</section>';
  }
  function fold(title, body) { return '<details class="fold"><summary>' + esc(title) + '</summary><div class="body">' + body + '</div></details>'; }

  /* ---------- Food ---------- */
  function viewFood() {
    var k = todayKey(), e = eaten(k), target = kcalFor(k), pt = proteinTarget(), f = peek(k).food;
    var left = target - e.k, td = treatDays(k);

    var logged = f.length ? '<ul class="rows">' + f.map(function (x, i) {
      return '<li><span class="grow"><span class="t">' + esc(x.n) + '</span><br><span class="s num">' + n0(x.k) + ' kcal, ' + n0(x.p) + ' g protein</span></span>' +
        '<button class="x" data-act="del-food" data-i="' + i + '" aria-label="Remove ' + esc(x.n) + '">' + I.x + '</button></li>';
    }).join('') + '</ul>' : '<p class="muted panel">Nothing logged yet. Tap foods below. Close enough beats perfect.</p>';

    var groups = {};
    D.FOODS.forEach(function (x, i) { (groups[x.g] = groups[x.g] || []).push('<button class="chip" data-act="add-food" data-i="' + i + '">' + esc(x.n) + ' <span class="k num">' + x.k + '</span></button>'); });
    var quick = Object.keys(groups).map(function (g) { return '<p class="small muted" style="margin:12px 0 6px">' + esc(g) + '</p><div class="chips">' + groups[g].join('') + '</div>'; }).join('');

    var meals = D.MEALS.map(function (m, gi) {
      return '<p class="small muted" style="margin:14px 0 6px">' + esc(m.when) + '</p><ul class="rows">' + m.items.map(function (x, j) {
        return '<li><span class="grow"><span class="t">' + esc(x.n) + '</span><br><span class="s num">About ' + n0(x.k) + ' kcal, ' + x.p + ' g protein</span></span>' +
          '<button class="btn small" data-act="add-meal" data-g="' + gi + '" data-j="' + j + '">Log</button></li>';
      }).join('') + '</ul>';
    }).join('');

    return header('Food', dayNote(k)) +
      '<section class="block panel">' +
      '<p class="muted small">' + (left >= 0 ? 'Left today' : 'Over today') + '</p>' +
      '<p class="hero-weight"><span class="v num">' + n0(Math.abs(left)) + '</span><span class="u">kcal</span></p>' +
      meter('kcal', e.k, target, 'kcal') + meter('protein', e.p, pt, 'g', 'protein') + '</section>' +
      '<section class="block"><div class="block-head"><h2>Logged today</h2>' + (f.length ? '<span class="aside">' + f.length + ' items</span>' : '') + '</div>' + logged + '</section>' +
      '<section class="block"><div class="block-head"><h2>Quick add</h2><span class="aside num">Treat days this week: ' + td + ' of 2</span></div>' +
      quick + '<button class="btn mt" data-act="custom-food">Add something else</button></section>' +
      '<section class="block"><div class="block-head"><h2>The five rules</h2></div><div class="panel"><ul class="rules">' +
      D.FOOD_RULES.map(function (r) { return '<li><b>' + esc(r.t) + '</b>' + esc(r.d) + '</li>'; }).join('') + '</ul></div></section>' +
      '<section class="block"><div class="block-head"><h2>Your favourites, smarter</h2></div>' +
      D.SWAPS.map(function (s) { return fold(s.t, '<p>' + esc(s.d) + '</p>'); }).join('') + '</section>' +
      '<section class="block"><div class="block-head"><h2>Meal ideas</h2><span class="aside">Tap Log to add</span></div>' + meals + '</section>' +
      '<section class="block"><div class="block-head"><h2>On tennis days</h2></div><div class="panel"><ul class="rules">' +
      D.TENNIS_FUEL.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div></section>';
  }

  /* ---------- Progress ---------- */
  function chartSvg() {
    var s = series();
    if (s.length < 2) return '<p class="muted">Log a few morning weigh-ins and your trend line shows up here.</p>';
    var W = 340, H = 190, L = 30, Rr = 8, T = 14, B = 24;
    var first = s[0].k, last = s[s.length - 1].k, span = Math.max(13, diffDays(first, last));
    var goal = S.profile.goal, ws = s.map(function (x) { return x.w; });
    var lo = Math.floor(Math.min.apply(null, ws.concat([goal])) - 0.5), hi = Math.ceil(Math.max.apply(null, ws) + 0.5);
    var X = function (k) { return L + diffDays(first, k) / span * (W - L - Rr); };
    var Y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    var step = Math.max(1, Math.round((hi - lo) / 4)), grid = '';
    for (var v = lo; v <= hi; v += step) grid += '<line class="grid" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text x="' + (L - 6) + '" y="' + (Y(v) + 3).toFixed(1) + '" text-anchor="end">' + v + '</text>';
    var dots = s.map(function (x) { return '<circle class="pt" cx="' + X(x.k).toFixed(1) + '" cy="' + Y(x.w).toFixed(1) + '" r="2.6"/>'; }).join('');
    var line = s.map(function (x, i) { return (i ? 'L' : 'M') + X(x.k).toFixed(1) + ' ' + Y(avgIn(addDays(x.k, -6), x.k)).toFixed(1); }).join(' ');
    var gy = Y(goal).toFixed(1);
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Weight trend with goal line">' + grid +
      '<line class="goal" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + gy + '" y2="' + gy + '"/>' +
      '<text class="goal-t" x="' + (W - Rr) + '" y="' + (gy - 5) + '" text-anchor="end">Goal ' + kgS(goal) + '</text>' +
      dots + '<path class="trend" d="' + line + '"/>' +
      '<text x="' + L + '" y="' + (H - 6) + '">' + fmtShort(first) + '</text><text x="' + (W - Rr) + '" y="' + (H - 6) + '" text-anchor="end">' + fmtShort(addDays(first, span)) + '</text></svg>';
  }

  function viewProgress() {
    var k = todayKey(), p = S.profile, cur = currentWeight(), lost = p.weight0 - cur, togo = Math.max(0, cur - p.goal);
    var rate = weeklyRate();
    var pace = rate != null && rate < -0.1 ? -rate : 0.6;
    var eta = togo <= 0 ? 'Reached' : fmtShort(addDays(k, Math.round(togo / pace * 7)));
    var ci = checkin();
    var ciBtn = ci.act ? (ci.applied ? '<p class="small muted mt">Applied this week. Next check-in on Monday.</p>'
      : '<button class="btn solid small mt" data-act="apply-checkin" data-v="' + ci.act + '">' + (ci.act > 0 ? 'Add 150 kcal a day' : 'Take 150 kcal off') + '</button>') : '';

    var m = mondayOf(k), planned = 0, doneW = 0;
    for (var i = 0; i < 7; i++) { var dk = addDays(m, i); if (S.profile.week[i] !== 'rest') planned++; if (dk <= k && dayDone(dk) && dayType(dk) !== 'rest') doneW++; }
    var hDays = 0, hTicks = 0;
    for (var j = 0; j < 7; j++) { var hk = addDays(k, -j); if (hk < p.start) break; hDays++; hTicks += habits(hk).filter(function (h) { return habitOn(hk, h); }).length; }
    var total = 0;
    Object.keys(S.days).forEach(function (dk2) { var dd = S.days[dk2].done || {}; Object.keys(dd).forEach(function (id) { if (dd[id] && EXTRA_IDS.indexOf(id) === -1 && id !== 'rest') total++; }); });

    var s = series().slice(-8).reverse();
    var list = s.length ? '<ul class="rows">' + s.map(function (x) {
      return '<li><span class="grow"><span class="t num">' + kg1(x.w) + ' kg</span><br><span class="s">' + fmtLong(x.k) + '</span></span>' +
        '<button class="x" data-act="del-weight" data-k="' + x.k + '" aria-label="Delete weigh-in on ' + fmtShort(x.k) + '">' + I.x + '</button></li>';
    }).join('') + '</ul>' : '';
    var wk = Object.keys(S.waist).sort(), lastWaist = wk.length ? S.waist[wk[wk.length - 1]] : null;

    return header('Progress', 'From ' + kgS(p.weight0) + ' to ' + kgS(p.goal) + ' kg') +
      '<section class="block"><p class="hero-weight"><span class="v num">' + kg1(cur) + '</span><span class="u">kg, 7 day average</span></p></section>' +
      '<div class="stats"><div class="stat"><div class="v num">' + (lost >= 0 ? kg1(lost) : '+' + kg1(-lost)) + '</div><div class="l">' + (lost >= 0 ? 'kg lost' : 'kg up') + '</div></div>' +
      '<div class="stat"><div class="v num">' + kg1(togo) + '</div><div class="l">kg to go</div></div>' +
      '<div class="stat"><div class="v">' + esc(eta) + '</div><div class="l">' + (rate != null && rate < -0.1 ? 'Goal at this pace' : 'Goal at plan pace') + '</div></div></div>' +
      '<section class="block panel">' + chartSvg() + '</section>' +
      '<section class="block"><div class="block-head"><h2>Log</h2></div><div class="panel">' +
      '<div class="field"><label for="wp">Weight today</label><div class="inline-form"><input id="wp" class="input num" inputmode="decimal" placeholder="kg" value="' + (S.weights[k] != null ? kg1(S.weights[k]) : '') + '"><button class="btn solid" data-act="save-weight">Save</button></div></div>' +
      '<div class="field" style="margin-bottom:0"><label for="wa">Waist at the belly button</label><span class="hint">Once a week, relaxed, tape level.' + (lastWaist != null ? ' Last: ' + kg1(lastWaist) + ' cm.' : '') + '</span><div class="inline-form"><input id="wa" class="input num" inputmode="decimal" placeholder="cm"><button class="btn solid" data-act="save-waist">Save</button></div></div>' +
      '</div></section>' +
      '<section class="block"><div class="block-head"><h2>Weekly check-in</h2></div><div class="note ' + ci.cls + '"><b>' + esc(ci.title) + '</b><p class="small" style="margin-top:4px">' + esc(ci.msg) + '</p>' + ciBtn + '</div></section>' +
      '<section class="block"><div class="block-head"><h2>Consistency</h2></div><div class="stats">' +
      '<div class="stat"><div class="v num">' + doneW + '/' + planned + '</div><div class="l">sessions this week</div></div>' +
      '<div class="stat"><div class="v num">' + (hDays ? Math.round(hTicks / (hDays * 7) * 100) : 0) + '%</div><div class="l">daily seven, last 7 days</div></div>' +
      '<div class="stat"><div class="v num">' + total + '</div><div class="l">sessions in total</div></div></div></section>' +
      (list ? '<section class="block"><div class="block-head"><h2>Recent weigh-ins</h2></div>' + list + '</section>' : '');
  }

  /* ---------- Onboarding ---------- */
  function newOb() { return { step: 0, weight: '', goal: '', maint: 2700, tennis: [], equip: 'gym', week: null }; }
  function viewOnboarding() {
    var o = O, steps = '<div class="steps">' + [0, 1, 2, 3].map(function (i) { return '<i class="' + (i <= o.step ? 'on' : '') + '"></i>'; }).join('') + '</div>';
    var body = '', nav = '';
    if (o.step === 0) {
      body = '<h1>Match Fit</h1><p class="lede">Lose fat, build muscle, keep playing tennis. Four quick questions and your plan is ready.</p>' +
        '<div class="field"><label for="ob-w">Your weight now</label><div class="inline-form"><input id="ob-w" class="input num" inputmode="decimal" data-ob="weight" value="' + esc(o.weight) + '" placeholder="kg"><span class="unit">kg</span></div></div>' +
        '<div class="field"><label for="ob-g">Goal weight</label><div class="inline-form"><input id="ob-g" class="input num" inputmode="decimal" data-ob="goal" value="' + esc(o.goal) + '" placeholder="kg"><span class="unit">kg</span></div></div>';
      nav = '<button class="btn solid" data-act="ob-next">Next</button>';
    } else if (o.step === 1) {
      body = '<h1>How much you burn</h1><p class="lede">Your watch already knows. Open the Activity app, tap Move, and look for the TOTAL line under the chart. Use a typical day.</p>' +
        '<div class="field"><label for="ob-m">Total kcal on a normal day</label><div class="inline-form"><input id="ob-m" class="input num" inputmode="numeric" data-ob="maint" value="' + esc(o.maint) + '"><span class="unit">kcal</span></div>' +
        '<span class="hint">Your food target will be about 500 below this.</span></div>' +
        '<button class="linkish" data-act="ob-estimate">I do not have a watch number</button>';
      nav = '<button class="btn" data-act="ob-back">Back</button><button class="btn solid" data-act="ob-next">Next</button>';
    } else if (o.step === 2) {
      var week = o.week || (o.tennis.length ? suggestWeek(o.tennis) : null);
      body = '<h1>Your week</h1><p class="lede">Pick the days you usually play tennis. The plan fits lifting and yoga around them.</p>' +
        '<div class="field"><label>Tennis days</label><div class="dow-pick">' + DOW3.map(function (d, i) {
          return '<button type="button" class="' + (o.tennis.indexOf(i) > -1 ? 'on' : '') + '" data-act="ob-tennis" data-i="' + i + '" aria-pressed="' + (o.tennis.indexOf(i) > -1) + '">' + d.slice(0, 2) + '</button>';
        }).join('') + '</div></div>' +
        '<div class="field"><label>Where you lift</label><div><span class="seg">' +
        '<button type="button" class="' + (o.equip === 'gym' ? 'on' : '') + '" data-act="ob-equip" data-v="gym">Gym</button>' +
        '<button type="button" class="' + (o.equip === 'home' ? 'on' : '') + '" data-act="ob-equip" data-v="home">Home, dumbbells</button></span></div></div>' +
        (week ? '<div class="field"><label>Suggested week</label><span class="hint">Tap a day to change it.</span>' + planner(week, 'ob-cycle') + '</div>' : '');
      nav = '<button class="btn" data-act="ob-back">Back</button><button class="btn solid" data-act="ob-next"' + (o.tennis.length ? '' : ' disabled') + '>Next</button>';
    } else {
      var prof = { maint: num(o.maint), kcalAdj: 0 }, b = baseKcal(prof), w0 = num(o.weight), g = num(o.goal);
      var wk1 = Math.max(1, Math.round((w0 - g) / 0.7)), wk2 = Math.max(1, Math.round((w0 - g) / 0.5));
      var t = todayKey();
      body = '<h1>Your plan</h1><p class="lede">Twelve weeks in three phases: easy start, build, steady. Never high intensity.</p>' +
        '<div class="summary">' +
        '<div class="row"><span>Lifting days</span><b class="num">' + n0(b) + ' kcal</b></div>' +
        '<div class="row"><span>Tennis days</span><b class="num">' + n0(Math.max(FLOOR, b + 200)) + ' kcal</b></div>' +
        '<div class="row"><span>Yoga and rest days</span><b class="num">' + n0(Math.max(FLOOR, b - 150)) + ' kcal</b></div>' +
        '<div class="row"><span>Protein every day</span><b class="num">' + proteinTarget(g) + ' g</b></div>' +
        '<div class="row"><span>Expected pace</span><b>0.5 to 0.7 kg a week</b></div>' +
        '<div class="row"><span>Reach ' + kgS(g) + ' kg</span><b>' + fmtShort(addDays(t, wk1 * 7)) + ' to ' + fmtShort(addDays(t, wk2 * 7)) + '</b></div></div>' +
        '<p class="muted small mt">Weigh in most mornings. After two weeks the app checks your pace and suggests small changes.</p>';
      nav = '<button class="btn" data-act="ob-back">Back</button><button class="btn ball" data-act="ob-finish">Start my plan</button>';
    }
    return '<div class="ob">' + steps + body + '<div class="nav">' + nav + '</div></div>';
  }
  function obNext() {
    if (O.step === 0) {
      var w = num(O.weight), g = num(O.goal);
      if (w == null || w < 40 || w > 250) return toast('Enter your weight in kg');
      if (g == null || g < 40 || g >= w) return toast('Goal should be below your current weight');
    }
    if (O.step === 1) {
      var m = num(O.maint);
      if (m == null || m < 1500 || m > 6000) return toast('Enter a daily total between 1,500 and 6,000');
    }
    if (O.step === 2) {
      if (!O.tennis.length) return toast('Pick at least one tennis day');
      if (!O.week) O.week = suggestWeek(O.tennis);
    }
    O.step = Math.min(3, O.step + 1); render(); window.scrollTo(0, 0);
  }
  function obFinish() {
    var t = todayKey(), w0 = num(O.weight);
    S = migrate({
      v: 1,
      profile: { weight0: w0, goal: num(O.goal), maint: num(O.maint), move: 600, equip: O.equip, start: t, week: O.week || suggestWeek(O.tennis), kcalAdj: 0 },
      weights: {}, waist: {}, days: {}, lifts: {}, last: {}, checkin: null
    });
    S.weights[t] = w0;
    save(); O = null; tab = 'today'; render(); window.scrollTo(0, 0);
    toast('Plan ready. Week 1 starts today.');
  }

  /* ---------- sheets ---------- */
  function openSheet(html) {
    var wrap = $('#sheet');
    wrap.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>';
    wrap.hidden = false;
    var first = wrap.querySelector('input, button'); if (first && first.tagName === 'INPUT') setTimeout(function () { first.focus(); }, 50);
  }
  function closeSheet() { var wrap = $('#sheet'); wrap.hidden = true; wrap.innerHTML = ''; resetArmed = 0; }

  function settingsHtml() {
    var p = S.profile;
    return '<h2>Settings</h2>' +
      '<div class="field"><label for="st-w0">Starting weight</label><div class="inline-form"><input id="st-w0" class="input num" inputmode="decimal" data-set="weight0" value="' + kg1(p.weight0) + '"><span class="unit">kg</span></div></div>' +
      '<div class="field"><label for="st-g">Goal weight</label><div class="inline-form"><input id="st-g" class="input num" inputmode="decimal" data-set="goal" value="' + kg1(p.goal) + '"><span class="unit">kg</span></div></div>' +
      '<div class="field"><label for="st-m">Daily total burn</label><span class="hint">Activity app, Move, the TOTAL line on a normal day. Food targets are 500 below this.</span><div class="inline-form"><input id="st-m" class="input num" inputmode="numeric" data-set="maint" value="' + p.maint + '"><span class="unit">kcal</span></div></div>' +
      '<div class="field"><label for="st-mv">Move ring goal</label><div class="inline-form"><input id="st-mv" class="input num" inputmode="numeric" data-set="move" value="' + p.move + '"><span class="unit">kcal</span></div></div>' +
      '<div class="field"><label>Where you lift</label><div><span class="seg">' +
      '<button type="button" class="' + (p.equip === 'gym' ? 'on' : '') + '" data-act="set-equip" data-v="gym">Gym</button>' +
      '<button type="button" class="' + (p.equip === 'home' ? 'on' : '') + '" data-act="set-equip" data-v="home">Home, dumbbells</button></span></div></div>' +
      '<div class="field"><label for="st-s">Plan start date</label><span class="hint">Move this to restart or skip ahead a phase.</span><input id="st-s" class="input" type="date" data-set="start" value="' + p.start + '"></div>' +
      '<div class="field"><label>Calorie adjustment from check-ins</label><div class="inline-form"><span class="grow num"><b>' + (p.kcalAdj > 0 ? '+' : '') + p.kcalAdj + ' kcal</b> <span class="muted">a day. Base now ' + n0(baseKcal()) + '.</span></span>' +
      (p.kcalAdj ? '<button class="btn small" data-act="reset-adj">Reset</button>' : '') + '</div></div>' +
      '<div class="field"><label>Rebuild the week</label><span class="hint">Keeps your tennis days, re-spaces lifting and yoga.</span><div><button class="btn small" data-act="resuggest">Suggest my week again</button></div></div>' +
      '<div class="field"><label>Backup</label><span class="hint">Everything lives in this browser on this phone. Save a backup every few weeks.</span>' +
      '<div class="inline-form"><button class="btn small" data-act="export">Save backup</button><button class="btn small" data-act="import">Restore backup</button>' +
      '<input id="importFile" type="file" accept="application/json,.json" hidden></div></div>' +
      '<div class="field"><label>Start over</label><div><button class="btn small danger" data-act="reset">Erase everything</button></div></div>' +
      '<button class="btn solid block mt" data-act="close-sheet">Done</button>';
  }

  function swapHtml() {
    var k = todayKey(), ph = phaseOf(weekNo(k)), cur = mainSession(k);
    var ids = ['A', 'B'].concat(ph === 3 ? ['C'] : []).concat(['yogaA', 'yogaB', 'tennis', 'rest']);
    return '<h2>Change today</h2><p class="muted small" style="margin:-6px 0 12px">Swapped days still count. Calories follow what you pick.</p><ul class="rows">' + ids.map(function (id) {
      var info = sessionInfo(id, k);
      var title = id === 'rest' ? 'Rest and walk' : id === 'tennis' ? 'Tennis' : info.title;
      return '<li><span class="grow"><span class="t">' + esc(title) + '</span></span>' +
        (id === cur ? '<span class="small muted">Current</span>' : '<button class="btn small" data-act="swap" data-id="' + id + '">Pick</button>') + '</li>';
    }).join('') + '</ul>' +
      (peek(k).session ? '<button class="btn block mt" data-act="swap" data-id="">Back to the plan</button>' : '') +
      '<button class="btn solid block mt" data-act="close-sheet">Close</button>';
  }

  function customFoodHtml() {
    return '<h2>Add food</h2>' +
      '<div class="field"><label for="cf-n">What</label><input id="cf-n" class="input" placeholder="Name" autocomplete="off"></div>' +
      '<div class="field"><label for="cf-k">Calories</label><div class="inline-form"><input id="cf-k" class="input num" inputmode="numeric" placeholder="0"><span class="unit">kcal</span></div></div>' +
      '<div class="field"><label for="cf-p">Protein</label><div class="inline-form"><input id="cf-p" class="input num" inputmode="numeric" placeholder="0"><span class="unit">g</span></div></div>' +
      '<label class="inline-form" style="margin-bottom:16px"><input id="cf-t" type="checkbox" style="width:22px;height:22px"> This is a treat meal</label>' +
      '<button class="btn solid block" data-act="save-custom">Add to today</button>' +
      '<button class="btn block mt" data-act="close-sheet">Cancel</button>';
  }

  /* ---------- player: strength ---------- */
  function showPlayer() { $('#player').hidden = false; $('#tabs').hidden = true; document.body.style.overflow = 'hidden'; }
  function closePlayer() {
    clearInterval(gTimer); clearInterval(rTimer); gTimer = rTimer = null; R = null;
    keepAwake(false); P = null; G = null;
    var pl = $('#player'); pl.hidden = true; pl.innerHTML = ''; document.body.style.overflow = '';
    $('#tabs').hidden = !S;
  }
  function openSession(id) {
    var k = todayKey(), info = sessionInfo(id, k);
    if (!info) return;
    if (info.kind === 'strength') {
      P = { info: info, k: k, data: {}, rounds: info.circuit ? info.circuit : 0, roundsDone: [] };
      info.items.forEach(function (it, i) {
        var last = S.lifts[it.ex];
        P.data[i] = { w: last && last.w != null ? last.w : '', sets: [], feel: null };
        var n = info.circuit ? 0 : setsFor(it, k);
        for (var s = 0; s < n; s++) P.data[i].sets.push(false);
      });
      for (var r = 0; r < P.rounds; r++) P.roundsDone.push(false);
    } else if (info.kind === 'flow') {
      var steps = [];
      info.steps.forEach(function (s) {
        if (s.side) { steps.push(Object.assign({}, s, { sideLabel: 'Left side' })); steps.push(Object.assign({}, s, { sideLabel: 'Right side' })); }
        else steps.push(s);
      });
      G = { info: info, k: k, steps: steps, i: 0, remaining: steps[0].secs, running: false, endAt: 0, started: false };
    } else return;
    renderPlayer(); showPlayer(); $('#player').scrollTop = 0;
  }
  function lastHint(l) {
    if (!l) return '';
    var w = l.w != null && l.w !== '' ? kg1(l.w) + ' kg' : 'no weight';
    var tip = l.feel === 'easy' ? 'Go a little heavier today.' : l.feel === 'hard' ? 'Stay at this weight until it feels good.' : l.feel === 'good' ? 'Same weight, try for one more rep.' : '';
    return '<div class="ex-last">Last time: ' + w + (l.feel ? ', felt ' + l.feel : '') + '. ' + tip + '</div>';
  }
  function renderStrength() {
    var info = P.info, k = P.k, w = weekNo(k), ph = phaseOf(w);
    var rounds = P.rounds ? '<div class="panel mt"><b>' + P.rounds + ' rounds.</b> Go through all five moves, rest ' + esc(info.rest) + ', repeat. Tick each round.<div class="sets mt">' +
      P.roundsDone.map(function (on, r) { return '<button class="set' + (on ? ' on' : '') + '" data-act="round" data-r="' + r + '" aria-pressed="' + on + '" aria-label="Round ' + (r + 1) + '">' + (r + 1) + '</button>'; }).join('') + '</div></div>' : '';
    var cards = info.items.map(function (it, i) {
      var x = P.data[i], bw = isBW(it.ex);
      var setBtns = x.sets.map(function (on, s) { return '<button class="set' + (on ? ' on' : '') + '" data-act="set" data-i="' + i + '" data-s="' + s + '" aria-pressed="' + on + '" aria-label="Set ' + (s + 1) + '">' + (s + 1) + '</button>'; }).join('');
      var dose = P.rounds ? it.reps : setsFor(it, k) + ' x ' + it.reps;
      return '<div class="ex"><div class="ex-head"><span class="ex-n">' + (i + 1) + '</span><div class="grow"><div class="ex-name">' + esc(exName(it.ex)) + '</div><div class="ex-dose num">' + esc(dose) + '</div></div></div>' +
        '<p class="ex-cue">' + esc(exCue(it.ex)) + ' <a href="' + D.yt(D.EX[it.ex].q) + '" target="_blank" rel="noopener">Watch how</a></p>' +
        (bw ? '' : lastHint(S.lifts[it.ex])) +
        '<div class="ex-ctrl">' + (bw ? '<span class="small muted">Bodyweight</span>' : '<label class="sr" for="kg' + i + '">Weight in kg</label><input id="kg' + i + '" class="input kg num" inputmode="decimal" placeholder="0" data-kg="' + i + '" value="' + esc(x.w) + '"><span class="unit">kg</span>') +
        (setBtns ? '<div class="sets">' + setBtns + '</div>' : '') + '</div>' +
        '<div class="feel"><span class="seg" role="group" aria-label="How did it feel">' + ['easy', 'good', 'hard'].map(function (f) {
          return '<button type="button" class="' + (x.feel === f ? 'on' : '') + '" data-act="feel" data-i="' + i + '" data-v="' + f + '">' + f.charAt(0).toUpperCase() + f.slice(1) + '</button>';
        }).join('') + '</span></div></div>';
    }).join('');
    return '<div class="wrap"><div class="player-top"><button class="icon-btn" data-act="close-player" aria-label="Close">' + I.back + '</button><h1>' + esc(info.title) + '</h1></div>' +
      '<p class="muted">' + esc(D.PHASES[ph].name) + ' phase, week ' + w + '. About ' + info.minutes + ' minutes. ' + (S.profile.equip === 'home' ? 'Home version.' : 'Gym version.') + '</p>' +
      '<div class="panel mt"><p><b>Warm up.</b> ' + esc(D.WARMUP.replace('Warm up 5 minutes: ', '5 minutes: ')) + '</p><p class="mt"><b>Effort.</b> ' + esc(D.PHASES[ph].effort) + (info.circuit ? '' : ' Rest ' + esc(info.rest) + ' between sets.') + '</p></div>' +
      rounds + '<div class="mt">' + cards + '</div>' +
      '<button class="btn ball block mt" data-act="finish-strength" style="padding:15px;font-size:17px">Finish ' + esc(info.title) + '</button></div>' +
      '<div class="dock"><div class="inner"><span class="rest-count num" id="restCount">' + restLabel() + '</span><div class="rest">' +
      [60, 90, 120].map(function (s) { return '<button class="btn small" data-act="rest" data-s="' + s + '">' + s + 's</button>'; }).join('') +
      '</div><button class="btn small" data-act="rest-stop"' + (R ? '' : ' hidden') + ' id="restStop">Stop</button></div></div>';
  }
  function restLabel() {
    if (!R) return 'Rest';
    var rem = Math.max(0, Math.ceil((R.endAt - Date.now()) / 1000));
    return rem > 0 ? Math.floor(rem / 60) + ':' + pad(rem % 60) : 'Go';
  }
  function startRest(s) {
    unlockAudio();
    R = { endAt: Date.now() + s * 1000, fired: false };
    clearInterval(rTimer);
    rTimer = setInterval(function () {
      var el = $('#restCount'); if (el) el.textContent = restLabel();
      if (R && !R.fired && Date.now() >= R.endAt) { R.fired = true; beep(); setTimeout(function () { clearInterval(rTimer); rTimer = null; R = null; var e2 = $('#restCount'); if (e2) e2.textContent = 'Rest'; var b = $('#restStop'); if (b) b.hidden = true; }, 2500); }
    }, 250);
    var el = $('#restCount'); if (el) el.textContent = restLabel();
    var b = $('#restStop'); if (b) b.hidden = false;
  }
  function finishStrength() {
    var info = P.info, k = P.k;
    info.items.forEach(function (it, i) {
      var x = P.data[i], w = num(x.w), prev = S.lifts[it.ex] || {};
      if (w != null || x.feel || x.sets.some(Boolean)) S.lifts[it.ex] = { w: w != null ? w : prev.w, feel: x.feel || prev.feel || null, date: k };
    });
    day(k).done[info.id] = true;
    if (info.id === 'A' || info.id === 'B') S.last.strength = info.id;
    save(); closePlayer(); render(); window.scrollTo(0, 0);
    toast(info.title + ' done. Nice work.');
  }

  /* ---------- player: guided flow ---------- */
  var CIRC = 2 * Math.PI * 96;
  function renderFlow() {
    var g = G, info = g.info, mins = info.minutes;
    if (!g.started) {
      var list = '<ul class="rows mt">' + info.steps.map(function (s) {
        return '<li><span class="grow"><span class="t">' + esc(s.name) + '</span><br><span class="s">' + esc(s.cue) + '</span></span><span class="small muted num" style="white-space:nowrap">' + s.secs + 's' + (s.side ? ' each' : '') + '</span></li>';
      }).join('') + '</ul>';
      return '<div class="wrap"><div class="player-top"><button class="icon-btn" data-act="close-player" aria-label="Close">' + I.back + '</button><h1>' + esc(info.title) + '</h1></div>' +
        '<p class="muted">' + esc(info.blurb) + ' About ' + mins + ' minutes.</p>' +
        '<button class="btn ball block mt" data-act="flow-start" style="padding:15px;font-size:17px">Start guided</button>' + list +
        '<button class="linkish mt" data-act="flow-done">Did it without the timer? Mark it done</button></div>';
    }
    var s = g.steps[g.i], nx = g.steps[g.i + 1];
    var frac = g.remaining / s.secs;
    return '<div class="wrap"><div class="player-top"><button class="icon-btn" data-act="close-player" aria-label="Close">' + I.back + '</button><h1>' + esc(info.title) + '</h1></div>' +
      '<div class="guide"><p class="small muted num">Pose ' + (g.i + 1) + ' of ' + g.steps.length + '</p>' +
      (s.sideLabel ? '<span class="side">' + s.sideLabel + '</span>' : '') +
      '<div class="pose">' + esc(s.name) + '</div><p class="gcue">' + esc(s.cue) + '</p>' +
      '<div class="ring"><svg viewBox="0 0 210 210" aria-hidden="true"><circle class="bg" cx="105" cy="105" r="96" fill="none" stroke-width="12"/>' +
      '<circle id="gArc" class="fg" cx="105" cy="105" r="96" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + (CIRC * (1 - frac)).toFixed(1) + '"/></svg>' +
      '<div class="count num" id="gCount" aria-live="off">' + g.remaining + '</div></div>' +
      '<p class="next">' + (nx ? 'Next: ' + esc(nx.name) + (nx.sideLabel ? ', ' + nx.sideLabel.toLowerCase() : '') : 'Last one') + '</p>' +
      '<div class="ctrls"><button class="round-btn" data-act="flow-prev" aria-label="Previous pose">' + I.prev + '</button>' +
      '<button class="round-btn main" data-act="flow-toggle" aria-label="' + (g.running ? 'Pause' : 'Resume') + '">' + (g.running ? I.pause : I.play) + '</button>' +
      '<button class="round-btn" data-act="flow-next" aria-label="Next pose">' + I.next + '</button></div>' +
      '<button class="linkish center mt" data-act="flow-done" style="align-self:center">Finish now</button></div></div>';
  }
  function gTick() {
    if (!G || !G.running) return;
    var rem = Math.max(0, Math.ceil((G.endAt - Date.now()) / 1000));
    if (rem !== G.remaining) {
      G.remaining = rem;
      var c = $('#gCount'), a = $('#gArc'), s = G.steps[G.i];
      if (c) c.textContent = rem;
      if (a) a.setAttribute('stroke-dashoffset', (CIRC * (1 - rem / s.secs)).toFixed(1));
    }
    if (rem <= 0) { beep(); gGo(G.i + 1); }
  }
  function gGo(i) {
    if (i >= G.steps.length) return finishFlow();
    G.i = Math.max(0, i); G.remaining = G.steps[G.i].secs;
    if (G.running) G.endAt = Date.now() + G.remaining * 1000;
    renderPlayer();
  }
  function finishFlow() {
    var info = G.info, k = G.k;
    day(k).done[info.id] = true;
    if (YOGA_IDS.indexOf(info.id) > -1) S.last.yoga = info.id;
    save(); closePlayer(); render(); window.scrollTo(0, 0);
    toast(info.title + ' done');
  }

  function renderPlayer() {
    var pl = $('#player'), y = pl.scrollTop;
    pl.innerHTML = P ? renderStrength() : G ? renderFlow() : '';
    pl.scrollTop = y;
  }

  /* ---------- sound, wake ---------- */
  function unlockAudio() {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) {}
  }
  function beep() {
    try {
      unlockAudio();
      var t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 880; g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.45);
    } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
  }
  function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator) navigator.wakeLock.request('screen').then(function (w) { wake = w; }).catch(function () {});
      else if (!on && wake) { wake.release(); wake = null; }
    } catch (e) {}
  }

  /* ---------- toast ---------- */
  var toastT;
  function toast(m) {
    var t = $('#toast'); t.textContent = m; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  /* ---------- backup ---------- */
  function exportData() {
    var blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'match-fit-backup-' + todayKey() + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Backup saved');
  }
  function importData(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var s = JSON.parse(r.result);
        if (!s || s.v !== 1 || !s.profile || !Array.isArray(s.profile.week)) throw new Error('bad');
        S = migrate(s); save(); closeSheet(); render(); toast('Backup restored');
      } catch (e) { toast('That file is not a Match Fit backup'); }
    };
    r.readAsText(file);
  }

  /* ---------- render ---------- */
  function render() {
    var app = $('#app'), tabs = $('#tabs');
    if (!S) {
      O = O || newOb(); tabs.hidden = true; app.className = '';
      app.innerHTML = viewOnboarding(); return;
    }
    app.className = 'app';
    if ($('#player').hidden) tabs.hidden = false;
    tabs.innerHTML = tabsHtml();
    app.innerHTML = tab === 'train' ? viewTrain() : tab === 'food' ? viewFood() : tab === 'progress' ? viewProgress() : viewToday();
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    if (e.target.id === 'sheet') return closeSheet();
    var el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    var act = el.getAttribute('data-act'), k = todayKey(), i = +el.getAttribute('data-i'), v = el.getAttribute('data-v'), id = el.getAttribute('data-id');
    switch (act) {
      case 'tab': tab = el.getAttribute('data-tab'); if (O) O.editWeight = false; render(); window.scrollTo(0, 0); break;
      case 'settings': openSheet(settingsHtml()); break;
      case 'close-sheet': closeSheet(); render(); break;

      case 'habit': { var d = day(k); d.h[id] = !d.h[id]; save(); render(); break; }
      case 'toggle-main': { var d2 = day(k), m = mainSession(k); d2.done[m] = !d2.done[m]; save(); render(); if (d2.done[m]) toast(m === 'tennis' ? 'Tennis logged. Stretch and refuel.' : 'Walk logged'); break; }
      case 'open-main': openSession(mainSession(k)); break;
      case 'open': unlockAudio(); openSession(id); break;
      case 'swap-open': openSheet(swapHtml()); break;
      case 'swap': { var d3 = day(k); if (id) d3.session = id; else delete d3.session; save(); closeSheet(); render(); break; }

      case 'edit-weight': O = O || {}; O.editWeight = true; render(); var wq = $('#wq'); if (wq) wq.focus(); break;
      case 'save-weight-quick': case 'save-weight': {
        var inp = $(act === 'save-weight' ? '#wp' : '#wq'), w = num(inp && inp.value);
        if (w == null || w < 40 || w > 250) { toast('Enter your weight in kg'); break; }
        S.weights[k] = Math.round(w * 10) / 10; if (O) O.editWeight = false; save(); render(); toast('Saved ' + kg1(w) + ' kg'); break;
      }
      case 'save-waist': {
        var cm = num($('#wa') && $('#wa').value);
        if (cm == null || cm < 50 || cm > 200) { toast('Enter your waist in cm'); break; }
        S.waist[k] = Math.round(cm * 10) / 10; save(); render(); toast('Saved ' + kg1(cm) + ' cm'); break;
      }
      case 'del-weight': delete S.weights[el.getAttribute('data-k')]; save(); render(); break;
      case 'apply-checkin': { var add = +v; S.profile.kcalAdj = (S.profile.kcalAdj || 0) + add; S.checkin = { week: mondayOf(k), act: add, date: k }; save(); render(); toast('Daily target now ' + n0(baseKcal()) + ' kcal'); break; }

      case 'add-food': { var f = D.FOODS[i]; day(k).food.push({ n: f.n, k: f.k, p: f.p, treat: !!f.treat }); save(); render(); toast('Added ' + f.n); break; }
      case 'add-meal': { var ml = D.MEALS[+el.getAttribute('data-g')].items[+el.getAttribute('data-j')]; day(k).food.push({ n: ml.n, k: ml.k, p: ml.p }); save(); render(); toast('Added to today'); break; }
      case 'del-food': day(k).food.splice(i, 1); save(); render(); break;
      case 'custom-food': openSheet(customFoodHtml()); break;
      case 'save-custom': {
        var nm = ($('#cf-n').value || '').trim(), kc = num($('#cf-k').value), pr = num($('#cf-p').value) || 0;
        if (!nm) { toast('Give it a name'); break; }
        if (kc == null || kc < 0 || kc > 5000) { toast('Enter the calories'); break; }
        day(k).food.push({ n: nm.slice(0, 60), k: Math.round(kc), p: Math.round(pr), treat: $('#cf-t').checked });
        save(); closeSheet(); render(); toast('Added ' + nm); break;
      }

      case 'cycle-day': S.profile.week[i] = CYCLE[(CYCLE.indexOf(S.profile.week[i]) + 1) % CYCLE.length]; save(); render(); break;
      case 'set-equip': S.profile.equip = v; save(); openSheet(settingsHtml()); render(); break;
      case 'reset-adj': S.profile.kcalAdj = 0; S.checkin = null; save(); openSheet(settingsHtml()); render(); break;
      case 'resuggest': {
        var tn = []; S.profile.week.forEach(function (t, j) { if (t === 'tennis') tn.push(j); });
        if (!tn.length) { toast('Mark at least one tennis day first'); break; }
        S.profile.week = suggestWeek(tn); save(); render(); toast('Week rebuilt around tennis'); break;
      }
      case 'export': exportData(); break;
      case 'import': $('#importFile').click(); break;
      case 'reset':
        if (Date.now() - resetArmed < 4000) {
          try { localStorage.removeItem(KEY); } catch (er) {}
          S = null; O = newOb(); closeSheet(); render(); window.scrollTo(0, 0);
        } else { resetArmed = Date.now(); el.textContent = 'Tap again to erase'; }
        break;

      case 'close-player': closePlayer(); render(); break;
      case 'set': { var x = P.data[i], sIdx = +el.getAttribute('data-s'); x.sets[sIdx] = !x.sets[sIdx]; renderPlayer(); if (x.sets[sIdx]) startRest(parseInt(P.info.rest, 10) >= 90 ? 90 : 60); break; }
      case 'round': { var r = +el.getAttribute('data-r'); P.roundsDone[r] = !P.roundsDone[r]; renderPlayer(); if (P.roundsDone[r] && r < P.rounds - 1) startRest(90); break; }
      case 'feel': P.data[i].feel = P.data[i].feel === v ? null : v; renderPlayer(); break;
      case 'rest': startRest(+el.getAttribute('data-s')); break;
      case 'rest-stop': clearInterval(rTimer); rTimer = null; R = null; renderPlayer(); break;
      case 'finish-strength': finishStrength(); break;

      case 'flow-start': unlockAudio(); G.started = true; G.running = true; G.endAt = Date.now() + G.remaining * 1000; clearInterval(gTimer); gTimer = setInterval(gTick, 250); keepAwake(true); renderPlayer(); $('#player').scrollTop = 0; break;
      case 'flow-toggle':
        if (G.running) { G.running = false; G.remaining = Math.max(1, Math.ceil((G.endAt - Date.now()) / 1000)); }
        else { G.running = true; G.endAt = Date.now() + G.remaining * 1000; }
        renderPlayer(); break;
      case 'flow-next': gGo(G.i + 1); break;
      case 'flow-prev': gGo(G.i - 1); break;
      case 'flow-done': finishFlow(); break;

      case 'ob-next': obNext(); break;
      case 'ob-back': O.step = Math.max(0, O.step - 1); render(); break;
      case 'ob-estimate': {
        var ww = num(O.weight) || 90; O.maint = r50(ww * 28); render();
        toast('Estimated ' + n0(O.maint) + ' kcal. Fine to start with.'); break;
      }
      case 'ob-tennis': { var at = O.tennis.indexOf(i); if (at > -1) O.tennis.splice(at, 1); else O.tennis.push(i); O.tennis.sort(); O.week = O.tennis.length ? suggestWeek(O.tennis) : null; render(); break; }
      case 'ob-equip': O.equip = v; render(); break;
      case 'ob-cycle': O.week = O.week || suggestWeek(O.tennis); O.week[i] = CYCLE[(CYCLE.indexOf(O.week[i]) + 1) % CYCLE.length]; render(); break;
      case 'ob-finish': obFinish(); break;
    }
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.hasAttribute('data-ob') && O) O[t.getAttribute('data-ob')] = t.value;
    if (t.hasAttribute('data-kg') && P) P.data[+t.getAttribute('data-kg')].w = t.value;
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'importFile' && t.files && t.files[0]) return importData(t.files[0]);
    if (!t.hasAttribute('data-set') || !S) return;
    var key = t.getAttribute('data-set'), p = S.profile;
    if (key === 'start') { if (/^\d{4}-\d{2}-\d{2}$/.test(t.value)) p.start = t.value; }
    else {
      var v = num(t.value);
      if (key === 'weight0' && v >= 40 && v <= 250) p.weight0 = v;
      else if (key === 'goal' && v >= 40 && v <= 250) p.goal = v;
      else if (key === 'maint' && v >= 1500 && v <= 6000) p.maint = Math.round(v);
      else if (key === 'move' && v >= 100 && v <= 3000) p.move = Math.round(v);
      else { toast('That value looks off, not saved'); return; }
    }
    save(); render(); toast('Saved');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!$('#sheet').hidden) closeSheet(); else if (!$('#player').hidden) { closePlayer(); render(); } }
    if (e.key === 'Enter' && e.target.id === 'wq') { e.preventDefault(); var b = document.querySelector('[data-act="save-weight-quick"]'); if (b) b.click(); }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      if (G && G.running) gTick();
      if ($('#player').hidden && $('#sheet').hidden) render();
    }
  });

  render();
})();

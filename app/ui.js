/* Glowcap app: screens and behaviour. Data lives on the phone (store.js); the rules mirror the sheet (rules.js). */
(function () {
var R = window.GCR, ST = window.GCStore, ART = 'art/';
var D = ST.load(), S = null, tab = 'today', day = today(), newDiff = 'Easy', noteT = null, pick = null;
var REALMS = ['Body', 'Mind', 'Home', 'Spirit', 'Coin', 'Work', 'Social'];
var EMOJI = ['💧', '🌲', '📖', '🧹', '🕯️', '🧘', '🪙', '🌿', '🍄', '🦊', '🌙', '✨', '🏃', '🥗', '😴', '💊', '🎨', '🎵', '💻', '📝', '🧺', '🐾', '☕', '🌸'];

document.body.insertAdjacentHTML('afterbegin',
  '<header class="hero" style="background-image:url(\'' + ART + 'app_hero.jpg\')"><div class="chips"><span class="chip" id="gold">🪙 0</span><span class="chip" id="tok">☾ 0</span>' +
  '<button class="chip gear" data-a="settings" aria-label="Settings">⚙</button></div>' +
  '<div class="in"><div class="name" id="nm">Glowcap</div><div class="title" id="ti">&nbsp;</div><div class="bar"><i id="xb" style="width:0"></i></div>' +
  '<div class="meta"><span id="xl"></span><span id="xn"></span></div></div></header><main class="wrap" id="view"></main>' +
  '<nav><div><button data-t="today" class="on"><b>🌿</b>Today</button><button data-t="side"><b>🗺️</b>Quests</button><button data-t="shop"><b>🎁</b>Rewards</button>' +
  '<button data-t="journey"><b>🌙</b>Journey</button><button data-t="den"><b>🦊</b>Den</button></div></nav>' +
  '<div id="toast" role="status"></div><div id="modal"></div><div id="sheet"><div class="pane" id="pane"></div></div>');

/* ---------- helpers ---------- */
function today() { return R.ds(new Date()); }
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function num(v, d) { v = Math.round(Number(v)); return isFinite(v) ? v : d; }
function dateObj(s) { var p = s.split('-'); return new Date(+p[0], p[1] - 1, +p[2]); }
function nice(s) { return s ? dateObj(s).toLocaleDateString(undefined, {day: 'numeric', month: 'short'}) : ''; }
function freqLabel(q) { return q.perWeek ? q.perWeek + '× week' : 'Daily'; }
function recompute() { S = R.compute(D, today()); }
function entry(s, make) { var e = D.log[s]; if (!e && make) e = D.log[s] = {q: {}}; if (e && !e.q) e.q = {}; return e; }
function tidy(s) { var e = D.log[s]; if (!e) return; Object.keys(e.q || {}).forEach(function (k) { if (!e.q[k]) delete e.q[k]; });
  if (!Object.keys(e.q || {}).length && !e.rest && !e.mood && !e.note) delete D.log[s]; }

/* every change goes through here: save on the phone, redraw, celebrate */
function commit(fn, quiet) {
  var old = S; fn(); if (!ST.save(D)) toast('⚠ Your phone refused to save. Free some space, then try again.');
  recompute(); head(); render(); if (!quiet) celebrate(old, S);
}
function celebrate(o, s) {
  if (!o) return;
  if (s.level > o.level) { modal('🌟', 'Level ' + s.level + '!', 'You are now a<br><b style="color:#f0c96a">' + esc(s.title) + '</b>'); burst(); }
  else if (s.xp > o.xp) toast('+' + (s.xp - o.xp) + ' XP ✦');
  var a = s.ach.filter(function (x, i) { return x.on && !o.ach[i].on; });
  if (a.length) setTimeout(function () { modal(a[0].icon, 'Achievement unlocked', esc(a[0].name) + '<br><span style="font-size:15px;color:#94a58a">' + esc(a[0].desc) + '</span>'); }, s.level > o.level ? 2600 : 700);
}

/* ---------- header and screens ---------- */
function head() {
  $('nm').textContent = S.name; $('ti').textContent = 'Level ' + S.level + ' · ' + S.title;
  $('xb').style.width = Math.round(Math.max(0, Math.min(1, S.progress)) * 100) + '%';
  $('xl').textContent = S.xp.toLocaleString() + ' XP'; $('xn').textContent = S.maxed ? 'Max level ✦' : (S.nextXP - S.xp).toLocaleString() + ' to ' + S.nextTitle;
  $('gold').textContent = '🪙 ' + S.gold.toLocaleString(); $('tok').textContent = '☾ ' + S.tokensLeft;
}
function render() {
  document.body.classList.toggle('compact', false);
  if (!D) { $('view').innerHTML = vWelcome(); document.querySelector('.hero').hidden = true; document.querySelector('nav').hidden = true; return; }
  document.querySelector('.hero').hidden = false; document.querySelector('nav').hidden = false;
  $('view').innerHTML = ({today: vToday, side: vSide, shop: vShop, journey: vJourney, den: vDen})[tab]();
  if (tab === 'den') mountDen();
  var n = $('note'); if (n) n.oninput = function () { clearTimeout(noteT); var d0 = day; noteT = setTimeout(function () { var e = entry(d0, true); e.note = n.value.slice(0, 500); tidy(d0); ST.save(D); }, 600); };
}

function vWelcome() {
  var h = '<div class="welcome"><img src="' + ART + 'grow5.png" alt=""><h1>Welcome to Glowcap</h1><p>Your cozy woodland quest log</p>' +
    '<label class="fld" style="text-align:left"><span>WHAT SHOULD WE CALL YOU?</span><input id="wname" maxlength="40" placeholder="e.g. Wren of the Hollow" autocomplete="nickname"></label>' +
    '<div style="text-align:left;font-weight:800;margin-top:6px">Pick your first quests</div><div class="note" style="text-align:left">You can change, add or remove quests any time.</div><div class="pickq">';
  R.STARTER_QUESTS.forEach(function (q, i) {
    h += '<label><input type="checkbox" id="sq' + i + '" ' + (i < 5 ? 'checked' : '') + '><span style="font-size:22px">' + q[0] + '</span><span>' + esc(q[1]) +
      '<small>' + (q[4] ? q[4] + '× week' : 'Daily') + ' · +' + q[3] + ' XP' + (q[5] > 1 ? ' · goal ' + q[5] + ' ' + q[6] : '') + '</small></span></label>';
  });
  return h + '</div><button class="btn" style="width:100%" data-a="begin">Begin my quest log ✦</button>' +
    '<div style="margin-top:14px"><button class="linkbtn" data-a="restoreOpen">I have a backup — restore it</button></div></div>';
}

function shroom(st) {
  if (st === null || st === undefined) return '<div class="shroom"></div>';
  if (st === -1) return '<div class="shroom"><span class="moon">🌙</span></div>';
  return '<div class="shroom' + (st >= 5 ? ' glow' : '') + '"><img src="' + ART + 'grow' + st + '.png" alt="Today\'s mushroom, stage ' + st + ' of 5"></div>';
}
function vToday() {
  var t = today(), d = dateObj(day), lbl = day === t ? 'Today' : day === R.add(t, -1) ? 'Yesterday' : d.toLocaleDateString(undefined, {weekday: 'long'});
  var h = '<div class="dnav"><button data-a="prev" aria-label="Previous day" ' + (day <= S.start ? 'disabled' : '') + '>‹</button><div class="d"><b>' + lbl + '</b><span>' +
    d.toLocaleDateString(undefined, {day: 'numeric', month: 'long', year: 'numeric'}) + '</span></div><button data-a="next" aria-label="Next day" ' + (day >= t ? 'disabled' : '') + '>›</button></div>';
  var V = S.day(day), done = S.quests.filter(function (x) { return R.isDone(x.q, V.values[x.q.id]); }).length;
  h += '<div class="ring">' + shroom(V.stage) + '<div class="t"><b>' + done + ' of ' + S.questCount + ' quests</b><span>' +
    (V.rest ? 'Resting — your streaks are safe ☾' : (done === S.questCount && done ? 'Every quest done. Splendid!' : '+' + V.xp + ' XP earned this day' + (V.stage >= 5 ? ' · glowing ✦' : ''))) + '</span></div></div>';
  S.quests.forEach(function (x) {
    var q = x.q, v = V.values[q.id], dn = R.isDone(q, v), g = q.goal || 1;
    var st = q.perWeek ? '<span class="st">' + x.week + '/' + q.perWeek + ' this week' + (x.cur ? ' · 🔥 ' + x.cur + ' wk' : '') + '</span>' : (x.cur ? '<span class="st">🔥 ' + x.cur + '-day streak</span>' : '');
    h += '<div class="q ' + (dn ? 'done' : '') + '" ' + (g > 1 ? '' : 'data-a="tick" data-k="' + q.id + '" role="button" tabindex="0" aria-pressed="' + dn + '"') + '><div class="ic">' + esc(q.icon) + '</div><div class="tx"><div class="nm">' + esc(q.name) +
      '</div><div class="sub"><span class="xp">+' + q.xp + ' XP</span>' + st + '</div>' + (g > 1 ? '<div class="pbar"><i style="width:' + Math.min(100, v / g * 100) + '%"></i></div>' : '') + '</div>' +
      (g > 1 ? '<div class="cnt"><button data-a="dec" data-k="' + q.id + '" aria-label="One less">−</button><div class="v">' + v + '/' + g + '<small>' + esc(q.unit) + '</small></div><button data-a="inc" data-k="' + q.id + '" aria-label="One more">+</button></div>' : '<div class="chk">✔</div>') + '</div>';
  });
  if (!S.quests.length) h += '<div class="panel empty">No quests yet. Add your first one below.</div>';
  h += '<div style="text-align:center"><button class="linkbtn" data-a="questMgr">✎ Add or edit quests</button></div>';
  h += '<div class="sec">Rest & reflect</div><div class="panel rest ' + (V.rest ? 'resting' : '') + '"><div class="tx"><b>☾ Rest day</b><span>' +
    (V.rest ? 'Streaks protected for this day' : S.tokensLeft + ' of ' + S.tokensPerMonth + ' rest days left this month') + '</span></div><button class="tog ' + (V.rest ? 'on' : '') + '" data-a="rest" aria-label="Rest day" aria-pressed="' + V.rest + '"></button></div>';
  h += '<div class="panel"><div style="font-weight:800;margin-bottom:6px">How did the day feel?</div><div class="moods">' + R.MOODS.map(function (m) {
    return '<button data-a="mood" data-m="' + m + '" class="' + (V.mood === m ? 'on' : '') + '">' + m + '</button>'; }).join('') +
    '</div><textarea id="note" placeholder="A line about today…" maxlength="500">' + esc(V.note) + '</textarea></div>';
  return h;
}

function vSide() {
  var h = '<div class="secrow"><div class="sec">Main quests</div><button class="linkbtn" data-a="mainEdit">+ New</button></div>';
  if (!S.mains.length) h += '<div class="panel empty">Big goals, broken into up to 4 steps. Finish them all for bonus XP.</div>';
  S.mains.forEach(function (x) {
    var m = x.m; h += '<div class="mq ' + (x.done ? 'won' : '') + '"><div class="t"><span>' + esc(m.icon || '✦') + '</span>' + esc(m.name) + '<em>' + (x.done ? '✦ complete' : '+' + m.xp + ' XP') + '</em>' +
      '<button class="ed" data-a="mainEdit" data-id="' + m.id + '" aria-label="Edit main quest">✎</button></div><div class="sub">' + esc(m.area || '') + (m.due ? (m.area ? ' · ' : '') + 'due ' + nice(m.due) : '') + '</div>' +
      '<div class="pbar"><i style="width:' + Math.round(x.pct * 100) + '%"></i></div>' + m.steps.map(function (s, i) {
        return s.name ? '<div class="st ' + (s.done ? 'on' : '') + '" data-a="step" data-id="' + m.id + '" data-i="' + i + '" role="button" tabindex="0"><b>✔</b>' + esc(s.name) + '</div>' : ''; }).join('') + '</div>';
  });
  h += '<div class="sec">New side quest</div><div class="panel"><input id="sqn" placeholder="e.g. Repot the monstera" maxlength="120" aria-label="Side quest"><div class="row pick">' +
    ['Easy', 'Tricky', 'Epic'].map(function (d) { return '<button data-a="diff" data-d="' + d + '" class="' + (newDiff === d ? 'on' : '') + '">' + d + ' · ' + R.SIDE_XP[d] + '</button>'; }).join('') +
    '</div><div class="row"><button class="btn" style="flex:1" data-a="addside">Add side quest</button></div></div>';
  var open = D.side.filter(function (s) { return !s.done; }), done = D.side.filter(function (s) { return s.done; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  h += '<div class="sec">Open side quests</div><div class="panel">' + (open.length ? open.map(function (s) {
    return '<div class="item"><div class="tx">' + esc(s.name) + '<small>' + s.diff + '</small></div><span class="badge">+' + R.SIDE_XP[s.diff] + '</span>' +
      '<button class="ed" data-a="sideEdit" data-id="' + s.id + '" aria-label="Edit side quest">✎</button><button class="btn" data-a="sdone" data-id="' + s.id + '">Done</button></div>'; }).join('') : '<div class="empty">Nothing open. A quiet road ahead ✦</div>') + '</div>';
  if (done.length) h += '<div class="sec">Recently completed</div><div class="panel">' + done.slice(0, 8).map(function (s) {
    return '<div class="item" style="opacity:.6"><div class="tx"><s>' + esc(s.name) + '</s><small>' + nice(s.date) + '</small></div><button class="btn ghost" data-a="sundo" data-id="' + s.id + '">Undo</button></div>'; }).join('') + '</div>';
  return h;
}

function vShop() {
  var h = '<div class="panel" style="text-align:center"><div style="font-size:34px">🪙</div><div style="font-family:Cinzel,serif;font-size:24px;color:var(--gold2)">' + S.gold.toLocaleString() +
    ' gold</div><div style="font-size:12px;color:var(--muted)">Every 10 XP earns 1 gold</div></div>';
  var open = D.rewards.filter(function (r) { return !r.claimed; }), got = D.rewards.filter(function (r) { return r.claimed; });
  h += '<div class="sec">Rewards shop</div><div class="panel">' + (open.length ? open.map(function (r) {
    return '<div class="item"><div class="tx">' + esc(r.name) + '<small>' + r.cost + ' gold</small></div><button class="ed" data-a="rwEdit" data-id="' + r.id + '" aria-label="Edit reward">✎</button>' +
      '<button class="btn" data-a="claim" data-id="' + r.id + '" ' + (S.gold < r.cost ? 'disabled' : '') + '>' + (S.gold < r.cost ? 'Need ' + (r.cost - S.gold) : 'Claim') + '</button></div>'; }).join('') : '<div class="empty">Add a treat to save up for.</div>') + '</div>';
  h += '<div class="sec">Add a reward</div><div class="panel"><input id="rwn" placeholder="e.g. A new candle" maxlength="120" aria-label="Reward"><div class="row"><input id="rwc" type="number" inputmode="numeric" min="1" placeholder="Gold cost" aria-label="Gold cost" style="flex:1"><button class="btn" data-a="addrw">Add</button></div></div>';
  if (got.length) h += '<div class="sec">Claimed</div><div class="panel">' + got.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 8).map(function (r) {
    return '<div class="item" style="opacity:.6"><div class="tx">' + esc(r.name) + '<small>' + nice(r.date) + ' · ' + r.cost + ' gold</small></div><button class="btn ghost" data-a="unclaim" data-id="' + r.id + '">Undo</button></div>'; }).join('') + '</div>';
  return h;
}

function vJourney() {
  var t = today(), h = '<div class="sec">The last five weeks</div><div class="panel"><div class="wk">' + ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="heat">';
  S.heat.forEach(function (r) { r.forEach(function (c) { var cl = c.pct === null ? 'fu' : c.pct === -1 ? 'hr' : c.pct >= .99 ? 'h3' : c.pct >= .5 ? 'h2' : c.pct > 0 ? 'h1' : '';
    h += '<div class="' + cl + (c.d === t ? ' td' : '') + '">' + (c.pct === -1 ? '☾' : c.day) + '</div>'; }); });
  h += '</div></div><div class="sec">XP per week</div><div class="panel"><div class="bars">';
  var mx = Math.max.apply(null, S.weekXP.concat([1])); S.weekXP.forEach(function (x) { h += '<i style="height:' + Math.max(3, x / mx * 100) + '%" title="' + x + ' XP"></i>'; });
  h += '</div></div><div class="sec">Streaks</div><div class="panel">' + (S.quests.length ? S.quests.map(function (x) { var q = x.q;
    return '<div class="item"><div class="tx">' + esc(q.icon) + ' ' + esc(q.name) + '<small>best ' + x.best + (q.perWeek ? ' weeks' : ' days') + ' · ' + Math.round(x.last30 * 100) + '% last 30 days</small></div><span class="badge">🔥 ' + x.cur + '</span></div>'; }).join('') : '<div class="empty">Add quests to start your streaks.</div>') + '</div>';
  h += '<div class="sec">Achievements · ' + S.achUnlocked + '/12</div><div class="ach">' + S.ach.map(function (a) { return '<div class="' + (a.on ? 'on' : '') + '" title="' + esc(a.desc) + '"><b>' + a.icon + '</b>' + esc(a.name) + '</div>'; }).join('') + '</div>';
  h += '<div class="sec">Mood · last 30 days</div><div class="panel" style="display:flex;justify-content:space-around">' + S.moods.map(function (m) {
    return '<div style="text-align:center;font-size:24px">' + m.e + '<div style="font-size:13px;color:var(--muted);font-weight:800">' + m.n + '</div></div>'; }).join('') + '</div>';
  return h;
}

/* the fox den plugs in here: window.GlowcapDen.mount(element, api) */
function vDen() {
  if (window.GlowcapDen && window.GlowcapDen.mount) return '<div id="den"></div>';
  return '<div class="den-soon"><div class="fox">🦊</div><h2>The fox den is being built</h2><p>Soon your mushrooms will grow into a garden here.</p><div class="plot">' +
    [0, 1, 2, 3, 4, 5].map(function (i) { return '<img src="' + ART + 'grow' + i + '.png" alt="">'; }).join('') + '</div></div>';
}
function mountDen() {
  var el = $('den'); if (!el) return;
  try { window.GlowcapDen.mount(el, {
    state: S, today: today(), data: D.den || (D.den = {}),
    save: function () { commit(function () {}, true); },
    stage: function (s) { return S.stage(s); }
  }); } catch (e) { el.innerHTML = '<div class="err">The den couldn’t open: ' + esc(e.message || e) + '</div>'; }
}

/* ---------- editors (bottom sheet) ---------- */
function sheet(h) { $('pane').innerHTML = h; $('sheet').className = 'show'; var f = $('pane').querySelector('input,select'); if (f && !('ontouchstart' in window)) f.focus(); }
function closeSheet() { $('sheet').className = ''; pick = null; }
function fld(label, input, hint) { return '<label class="fld"><span>' + label + '</span>' + input + (hint ? '<small>' + hint + '</small>' : '') + '</label>'; }
function inp(id, val, attrs) { return '<input id="' + id + '" value="' + esc(val) + '" ' + (attrs || '') + '>'; }
function confirmBox(text, act, id) { return '<div class="confirm" id="cf" hidden>' + text + '<div class="acts"><button class="btn ghost" data-a="cfNo">Keep it</button><button class="btn danger" data-a="' + act + '" data-id="' + (id || '') + '">Yes, delete</button></div></div>'; }
function emojiRow(target) { return '<div class="emo">' + EMOJI.map(function (e) { return '<button type="button" data-a="emo" data-t="' + target + '" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>'; }

function questMgr() {
  var list = D.quests.filter(function (q) { return !q.off; });
  sheet('<h3>Your quests</h3><div class="panel" style="padding:4px 12px">' + (list.length ? list.map(function (q, i) {
    return '<div class="mrow"><div class="mv"><button data-a="qUp" data-id="' + q.id + '" aria-label="Move up" ' + (i ? '' : 'disabled') + '>▲</button><button data-a="qDown" data-id="' + q.id + '" aria-label="Move down" ' + (i < list.length - 1 ? '' : 'disabled') + '>▼</button></div>' +
      '<div class="ic">' + esc(q.icon) + '</div><div class="tx">' + esc(q.name) + '<small>' + freqLabel(q) + ' · +' + q.xp + ' XP' + (q.goal > 1 ? ' · goal ' + q.goal + ' ' + esc(q.unit) : '') + '</small></div>' +
      '<button class="ed" data-a="questEdit" data-id="' + q.id + '" aria-label="Edit ' + esc(q.name) + '">✎</button></div>'; }).join('') : '<div class="empty">No quests yet.</div>') + '</div>' +
    '<div class="acts"><button class="btn ghost" data-a="close">Done</button><button class="btn" data-a="questEdit">+ New quest</button></div>');
}
function questEdit(id) {
  var q = id ? D.quests.filter(function (x) { return x.id === id; })[0] : {icon: '✦', name: '', realm: '', xp: 10, perWeek: 0, goal: 1, unit: ''};
  var opts = '<option value="0">Daily</option>' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option value="' + n + '" ' + (q.perWeek === n ? 'selected' : '') + '>' + n + '× a week</option>'; }).join('');
  sheet('<h3>' + (id ? 'Edit quest' : 'New quest') + '</h3>' +
    '<div class="two">' + fld('ICON', inp('fIcon', q.icon, 'class="icon-in" maxlength="4"')) + fld('XP', inp('fXp', q.xp, 'type="number" inputmode="numeric" min="0" max="999"')) + '</div>' + emojiRow('fIcon') + '<div style="height:10px"></div>' +
    fld('QUEST', inp('fName', q.name, 'maxlength="80" placeholder="e.g. Drink water"')) +
    '<div class="two">' + fld('HOW OFTEN', '<select id="fFreq">' + opts + '</select>') + fld('LIFE AREA', inp('fRealm', q.realm, 'list="realms" maxlength="20" placeholder="Body"') + '<datalist id="realms">' + REALMS.map(function (r) { return '<option value="' + r + '">'; }).join('') + '</datalist>') + '</div>' +
    '<div class="two">' + fld('GOAL', inp('fGoal', q.goal || 1, 'type="number" inputmode="numeric" min="1" max="99"'), '1 = a simple tick') + fld('UNIT', inp('fUnit', q.unit, 'maxlength="16" placeholder="glasses"'), 'for counted goals') + '</div>' +
    '<div class="acts">' + (id ? '<button class="btn danger" data-a="cfAsk">Delete</button>' : '<button class="btn ghost" data-a="questMgr">Back</button>') + '<button class="btn" data-a="questSave" data-id="' + (id || '') + '">Save</button></div>' +
    (id ? confirmBox('Delete this quest? Its past XP stays in your total, but it leaves your list and streaks.', 'questDel', id) : ''));
}
function mainEdit(id) {
  var m = id ? D.mains.filter(function (x) { return x.id === id; })[0] : {icon: '✦', name: '', area: '', due: '', xp: 100, steps: [{name: ''}, {name: ''}, {name: ''}, {name: ''}]};
  var steps = m.steps.concat([{name: ''}, {name: ''}, {name: ''}, {name: ''}]).slice(0, 4);
  sheet('<h3>' + (id ? 'Edit main quest' : 'New main quest') + '</h3>' +
    '<div class="two">' + fld('ICON', inp('mIcon', m.icon, 'class="icon-in" maxlength="4"')) + fld('BONUS XP', inp('mXp', m.xp, 'type="number" inputmode="numeric" min="0" max="9999"')) + '</div>' + emojiRow('mIcon') + '<div style="height:10px"></div>' +
    fld('MAIN QUEST', inp('mName', m.name, 'maxlength="80" placeholder="e.g. Make the cottage cozy for winter"')) +
    '<div class="two">' + fld('LIFE AREA', inp('mArea', m.area, 'list="realms" maxlength="20"') + '<datalist id="realms">' + REALMS.map(function (r) { return '<option value="' + r + '">'; }).join('') + '</datalist>') + fld('DUE BY', inp('mDue', m.due, 'type="date"')) + '</div>' +
    steps.map(function (s, i) { return fld('STEP ' + (i + 1), inp('mS' + i, s.name, 'maxlength="80"' + (i ? ' placeholder="optional"' : ' placeholder="first step"'))); }).join('') +
    '<div class="acts">' + (id ? '<button class="btn danger" data-a="cfAsk">Delete</button>' : '<button class="btn ghost" data-a="close">Cancel</button>') + '<button class="btn" data-a="mainSave" data-id="' + (id || '') + '">Save</button></div>' +
    (id ? confirmBox('Delete this main quest? If it was complete, its bonus XP leaves your total.', 'mainDel', id) : ''));
}
function sideEdit(id) {
  var s = D.side.filter(function (x) { return x.id === id; })[0]; pick = s.diff;
  sheet('<h3>Edit side quest</h3>' + fld('SIDE QUEST', inp('eName', s.name, 'maxlength="120"')) + '<div class="row pick" id="ediff">' + ['Easy', 'Tricky', 'Epic'].map(function (d) {
    return '<button data-a="pick" data-d="' + d + '" class="' + (s.diff === d ? 'on' : '') + '">' + d + ' · ' + R.SIDE_XP[d] + '</button>'; }).join('') + '</div>' +
    '<div class="acts"><button class="btn danger" data-a="cfAsk">Delete</button><button class="btn" data-a="sideSave" data-id="' + id + '">Save</button></div>' + confirmBox('Delete this side quest?', 'sideDel', id));
}
function rwEdit(id) {
  var r = D.rewards.filter(function (x) { return x.id === id; })[0];
  sheet('<h3>Edit reward</h3>' + fld('REWARD', inp('eName', r.name, 'maxlength="120"')) + fld('GOLD COST', inp('eCost', r.cost, 'type="number" inputmode="numeric" min="1"')) +
    '<div class="acts"><button class="btn danger" data-a="cfAsk">Delete</button><button class="btn" data-a="rwSave" data-id="' + id + '">Save</button></div>' + confirmBox('Delete this reward?', 'rwDel', id));
}
function settings() {
  var T = R.titlesOf(D);
  sheet('<h3>Settings</h3>' + fld('YOUR NAME', inp('sName', D.profile.name, 'maxlength="40"')) +
    '<div class="two">' + fld('REST DAYS / MONTH', inp('sRest', D.profile.rest, 'type="number" inputmode="numeric" min="0" max="10"'), 'keep streaks safe') +
    fld('QUEST LOG STARTS', inp('sStart', D.profile.start, 'type="date"'), 'weekly quests count weeks from here') + '</div>' +
    '<div class="fld"><span>LEVEL TITLES · XP NEEDED</span><div id="titles">' + T.map(function (t, i) { return titleRow(t, i); }).join('') + '</div>' +
    '<button class="linkbtn" data-a="titleAdd">+ Add a title</button><small>The first title always starts at 0 XP. Keep the XP going up.</small></div>' +
    '<div class="acts"><button class="btn ghost" data-a="close">Cancel</button><button class="btn" data-a="settingsSave">Save</button></div>' +
    '<div class="sec">Backup</div><div class="panel"><div class="note">Your quest log lives on this phone. Save a backup now and then, or to move to a new phone.</div>' +
    '<div class="row"><button class="btn ghost" style="flex:1" data-a="backupFile">Save backup file</button><button class="btn ghost" style="flex:1" data-a="backupCopy">Copy backup</button></div>' +
    '<div class="row"><button class="btn ghost" style="flex:1" data-a="restoreOpen">Restore a backup</button></div></div>' +
    '<div class="sec">Sync</div><div class="panel note">Signing in to sync across your devices is coming soon.</div>' +
    '<div class="sec">Start over</div><div class="panel"><div class="note">Erase everything on this phone and start a fresh quest log.</div><div class="row"><button class="btn danger" style="flex:1" data-a="cfAsk">Erase my quest log</button></div>' +
    '<div class="confirm" id="cf" hidden>This deletes all your quests, days, XP and rewards on this phone. Save a backup first if you might want them back.<div class="acts"><button class="btn ghost" data-a="cfNo">Keep it</button><button class="btn danger" data-a="wipe">Yes, erase</button></div></div></div>');
}
function titleRow(t, i) { return '<div class="trow"><input class="tName" value="' + esc(t.name) + '" maxlength="30" aria-label="Title ' + (i + 1) + '"><input class="tXp" type="number" inputmode="numeric" min="0" value="' + t.xp + '" aria-label="XP for title ' + (i + 1) + '" ' + (i ? '' : 'disabled') + '>' +
  '<button class="ed" data-a="titleDel" aria-label="Remove title" ' + (i ? '' : 'disabled') + '>✕</button></div>'; }
function restoreSheet() {
  sheet('<h3>Restore a backup</h3><div class="note">Choose your backup file, or paste the backup text. This replaces what’s on this phone.</div>' +
    fld('BACKUP FILE', '<input id="rFile" type="file" accept=".json,application/json,text/plain">') + fld('OR PASTE IT', '<textarea id="rText" class="code" placeholder="{&quot;app&quot;:&quot;glowcap&quot;…"></textarea>') +
    '<div class="err" id="rErr" hidden></div><div class="acts"><button class="btn ghost" data-a="close">Cancel</button><button class="btn" data-a="restore">Restore</button></div>');
}

/* ---------- actions ---------- */
function act(a, el, ev) {
  var id = el.dataset.id, k = el.dataset.k, q, e;
  switch (a) {
    case 'begin':
      var nm = $('wname').value.trim() || 'Adventurer'; D = R.newData(today(), nm);
      R.STARTER_QUESTS.forEach(function (x, i) { if ($('sq' + i).checked) D.quests.push(R.starterQuest(i, uid('q'))); });
      ST.save(D); recompute(); head(); render(); scrollTo(0, 0); toast('Welcome, ' + nm + ' ✦'); return;
    case 'prev': if (day > S.start) { day = R.add(day, -1); render(); } return;
    case 'next': if (day < today()) { day = R.add(day, 1); render(); } return;
    case 'tick': q = quest(k); commit(function () { e = entry(day, true); e.q[k] = !R.isDone(q, e.q[k]); tidy(day); }); if (entry(day) && entry(day).q[k]) sparks(ev); return;
    case 'inc': case 'dec': q = quest(k); commit(function () { e = entry(day, true); var was = R.isDone(q, e.q[k]); e.q[k] = Math.max(0, (Number(e.q[k]) || 0) + (a === 'inc' ? 1 : -1)); if (!was && R.isDone(q, e.q[k])) sparks(ev); tidy(day); }); return;
    case 'rest': var on = !S.day(day).rest; if (on && day.slice(0, 7) === today().slice(0, 7) && S.tokensLeft < 1) { toast('No rest days left this month ☾'); return; }
      commit(function () { entry(day, true).rest = on; tidy(day); }); return;
    case 'mood': commit(function () { e = entry(day, true); e.mood = e.mood === el.dataset.m ? '' : el.dataset.m; tidy(day); }); return;
    case 'questMgr': questMgr(); return;
    case 'questEdit': questEdit(id); return;
    case 'questSave':
      var name = $('fName').value.trim(); if (!name) { $('fName').focus(); toast('Give your quest a name'); return; }
      commit(function () { q = id ? quest(id) : {id: uid('q')}; if (!id) D.quests.push(q);
        q.icon = $('fIcon').value.trim() || '✦'; q.name = name; q.realm = $('fRealm').value.trim(); q.xp = Math.max(0, num($('fXp').value, 10));
        q.perWeek = num($('fFreq').value, 0); q.goal = Math.max(1, num($('fGoal').value, 1)); q.unit = $('fUnit').value.trim(); }, true);
      questMgr(); toast(id ? 'Quest saved' : 'Quest added ✦'); return;
    case 'questDel': commit(function () { quest(id).off = true; }, true); questMgr(); toast('Quest removed'); return;
    case 'qUp': case 'qDown': commit(function () { var i = D.quests.indexOf(quest(id)), j = i, step = a === 'qUp' ? -1 : 1;
      do { j += step; } while (j >= 0 && j < D.quests.length && D.quests[j].off); if (j < 0 || j >= D.quests.length) return;
      var t = D.quests[i]; D.quests[i] = D.quests[j]; D.quests[j] = t; }, true); questMgr(); return;
    case 'emo': $(el.dataset.t).value = el.dataset.e; return;
    case 'mainEdit': mainEdit(id); return;
    case 'mainSave':
      var mn = $('mName').value.trim(); if (!mn) { $('mName').focus(); toast('Give your main quest a name'); return; }
      commit(function () { var m = id ? main(id) : {id: uid('m'), steps: []}; if (!id) D.mains.push(m);
        var old = m.steps; m.icon = $('mIcon').value.trim() || '✦'; m.name = mn; m.area = $('mArea').value.trim(); m.due = $('mDue').value; m.xp = Math.max(0, num($('mXp').value, 100));
        m.steps = [0, 1, 2, 3].map(function (i) { var n2 = $('mS' + i).value.trim(); return {name: n2, done: !!(n2 && old[i] && old[i].name && old[i].done)}; });
        stampMain(m); });
      closeSheet(); return;
    case 'mainDel': commit(function () { D.mains = D.mains.filter(function (x) { return x.id !== id; }); }, true); closeSheet(); toast('Main quest deleted'); return;
    case 'step': var m = main(id), i2 = +el.dataset.i, wasDone = mainDone(m);
      commit(function () { m.steps[i2].done = !m.steps[i2].done; stampMain(m); });
      if (m.steps[i2].done) sparks(ev); if (!wasDone && mainDone(m)) { modal('🐉', 'Main quest complete!', esc(m.name) + '<br><b style="color:#f0c96a">+' + m.xp + ' XP</b>'); burst(); } return;
    case 'diff': newDiff = el.dataset.d; render(); return;
    case 'pick': pick = el.dataset.d; [].forEach.call($('ediff').children, function (b) { b.classList.toggle('on', b.dataset.d === pick); }); return;
    case 'addside': var sn = $('sqn').value.trim(); if (!sn) { $('sqn').focus(); return; } sparks(ev);
      commit(function () { D.side.push({id: uid('s'), name: sn.slice(0, 120), diff: newDiff, done: false, date: ''}); }, true); toast('Side quest added ✦'); return;
    case 'sdone': sparks(ev); commit(function () { var s = side(id); s.done = true; s.date = today(); }); return;
    case 'sundo': commit(function () { var s = side(id); s.done = false; s.date = ''; }, true); return;
    case 'sideEdit': sideEdit(id); return;
    case 'sideSave': var en = $('eName').value.trim(); if (!en) { $('eName').focus(); return; } commit(function () { var s = side(id); s.name = en; s.diff = pick || s.diff; }); closeSheet(); return;
    case 'sideDel': commit(function () { D.side = D.side.filter(function (x) { return x.id !== id; }); }, true); closeSheet(); toast('Side quest deleted'); return;
    case 'addrw': var rn = $('rwn').value.trim(); if (!rn) { $('rwn').focus(); return; }
      commit(function () { D.rewards.push({id: uid('r'), name: rn.slice(0, 120), cost: Math.max(1, num($('rwc').value, 10)), claimed: false, date: ''}); }, true); toast('Reward added 🎁'); return;
    case 'claim': var r = reward(id); if (S.gold < r.cost) return; sparks(ev); commit(function () { r.claimed = true; r.date = today(); }, true); modal('🎁', 'Reward claimed', 'Enjoy it — you earned this.'); return;
    case 'unclaim': commit(function () { var r2 = reward(id); r2.claimed = false; r2.date = ''; }, true); toast('Gold returned to your purse'); return;
    case 'rwEdit': rwEdit(id); return;
    case 'rwSave': var rn2 = $('eName').value.trim(); if (!rn2) { $('eName').focus(); return; } commit(function () { var r3 = reward(id); r3.name = rn2; r3.cost = Math.max(1, num($('eCost').value, r3.cost)); }, true); closeSheet(); return;
    case 'rwDel': commit(function () { D.rewards = D.rewards.filter(function (x) { return x.id !== id; }); }, true); closeSheet(); toast('Reward deleted'); return;
    case 'settings': settings(); return;
    case 'titleAdd': var rows = document.querySelectorAll('#titles .trow'), last = rows.length ? Number(rows[rows.length - 1].querySelector('.tXp').value) || 0 : 0;
      $('titles').insertAdjacentHTML('beforeend', titleRow({name: '', xp: last + 1000}, rows.length)); return;
    case 'titleDel': el.closest('.trow').remove(); return;
    case 'settingsSave':
      var st = $('sStart').value, ts = [].map.call(document.querySelectorAll('#titles .trow'), function (rw, i) { return {name: rw.querySelector('.tName').value.trim(), xp: i ? Math.max(0, num(rw.querySelector('.tXp').value, 0)) : 0}; })
        .filter(function (t) { return t.name; });
      if (!/^\d{4}-\d\d-\d\d$/.test(st) || st > today()) { toast('Pick a start date on or before today'); return; }
      commit(function () { D.profile.name = $('sName').value.trim() || 'Adventurer'; D.profile.rest = Math.max(0, num($('sRest').value, 2)); D.profile.start = st; if (ts.length) D.profile.titles = ts; if (day < st) day = st; }, true);
      closeSheet(); toast('Settings saved'); return;
    case 'backupFile':
      try { var blob = new Blob([ST.backup(D)], {type: 'application/json'}), url = URL.createObjectURL(blob), lk = document.createElement('a');
        lk.href = url; lk.download = 'glowcap-backup-' + today() + '.json'; document.body.appendChild(lk); lk.click(); lk.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        toast('Backup saved to your downloads'); } catch (er) { toast('Saving files is blocked here. Use Copy backup instead.'); } return;
    case 'backupCopy': var txt = ST.backup(D);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast('Backup copied. Paste it somewhere safe.'); }, function () { showBackup(txt); }); else showBackup(txt); return;
    case 'restoreOpen': restoreSheet(); return;
    case 'restore': doRestore(); return;
    case 'wipe': ST.clear(); D = null; S = null; closeSheet(); tab = 'today'; day = today(); render(); scrollTo(0, 0); return;
    case 'cfAsk': var c = $('cf'); if (c) { c.hidden = false; c.scrollIntoView({block: 'nearest'}); } return;
    case 'cfNo': $('cf').hidden = true; return;
    case 'close': closeSheet(); return;
  }
}
function quest(id) { return D.quests.filter(function (x) { return x.id === id; })[0]; }
function main(id) { return D.mains.filter(function (x) { return x.id === id; })[0]; }
function side(id) { return D.side.filter(function (x) { return x.id === id; })[0]; }
function reward(id) { return D.rewards.filter(function (x) { return x.id === id; })[0]; }
function mainDone(m) { var s = m.steps.filter(function (x) { return x.name; }); return s.length > 0 && s.every(function (x) { return x.done; }); }
function stampMain(m) { if (mainDone(m)) { if (!m.date) m.date = today(); } else m.date = ''; }
function showBackup(txt) { sheet('<h3>Your backup</h3><div class="note">Select all of this text and copy it somewhere safe, like a note or an email to yourself.</div><textarea class="code" id="bk" readonly style="min-height:200px">' + esc(txt) + '</textarea><div class="acts"><button class="btn" data-a="close">Done</button></div>');
  var b = $('bk'); b.focus(); b.select(); }
function doRestore() {
  var f = $('rFile').files && $('rFile').files[0], t = $('rText').value.trim(), err = $('rErr');
  function use(text) { try { D = ST.restore(text); ST.save(D); recompute(); closeSheet(); tab = 'today'; day = today(); head(); render(); scrollTo(0, 0); toast('Backup restored ✦'); }
    catch (x) { err.hidden = false; err.textContent = x instanceof SyntaxError ? 'This doesn’t look like a Glowcap backup. Check that you copied all of it.' : x.message; } }
  if (f) { var rd = new FileReader(); rd.onload = function () { use(String(rd.result)); }; rd.onerror = function () { err.hidden = false; err.textContent = 'That file couldn’t be read. Try pasting the text instead.'; }; rd.readAsText(f); }
  else if (t) use(t); else { err.hidden = false; err.textContent = 'Choose a backup file or paste the backup text first.'; }
}

/* ---------- little delights ---------- */
function toast(t) { var e = $('toast'); e.textContent = t; e.className = 'show'; clearTimeout(e._t); e._t = setTimeout(function () { e.className = ''; }, 2000); }
function modal(ic, h, p) { var m = $('modal'); m.innerHTML = '<div class="box" role="dialog" aria-modal="true"><div class="big">' + ic + '</div><h2>' + h + '</h2><p>' + p + '</p><button class="btn" id="mok">Onward</button></div>'; m.className = 'show'; $('mok').onclick = function () { m.className = ''; }; }
function sparks(ev) { var x = ev && ev.clientX || innerWidth / 2, y = ev && ev.clientY || innerHeight / 2;
  for (var i = 0; i < 10; i++) { var s = document.createElement('div'); s.className = 'spark'; s.textContent = ['✦', '✧', '✨', '·'][i % 4]; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.color = i % 2 ? '#f0c96a' : '#9fb07f';
    var an = Math.random() * Math.PI * 2, d = 40 + Math.random() * 50; s.style.setProperty('--x', Math.cos(an) * d + 'px'); s.style.setProperty('--y', Math.sin(an) * d + 'px'); document.body.appendChild(s); setTimeout(function (e) { return function () { e.remove(); }; }(s), 950); }
  if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {} }
function burst() { for (var i = 0; i < 4; i++) setTimeout(function () { sparks({clientX: innerWidth * (.2 + Math.random() * .6), clientY: innerHeight * (.25 + Math.random() * .3)}); }, i * 180); }

/* ---------- wiring ---------- */
document.addEventListener('click', function (ev) { var el = ev.target.closest('[data-a]'); if (!el || el.disabled) return; ev.preventDefault(); act(el.dataset.a, el, ev); });
document.addEventListener('keydown', function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[role=button][data-a]')) { ev.preventDefault(); act(ev.target.dataset.a, ev.target, null); }
  if (ev.key === 'Escape' && $('sheet').className) closeSheet(); });
$('sheet').addEventListener('click', function (ev) { if (ev.target === $('sheet')) closeSheet(); });
document.querySelectorAll('nav button').forEach(function (b) { b.onclick = function () { tab = b.dataset.t; document.querySelectorAll('nav button').forEach(function (x) { x.classList.toggle('on', x === b); }); render(); scrollTo(0, 0); }; });
document.addEventListener('visibilitychange', function () { if (!document.hidden && D) { var t = today(); if (day > t) day = t; recompute(); head(); render(); } });
if (D) { recompute(); head(); }
render();
})();

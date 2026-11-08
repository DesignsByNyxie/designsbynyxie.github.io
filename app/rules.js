/* Glowcap game rules — a faithful copy of the master sheet's formulas (Calc tab), working on the app's own data.
   Pure functions only: compute(data, today) -> everything the screens show. */
(function (G) {
  var SIDE_XP = {Easy: 10, Tricky: 25, Epic: 60};
  var MOODS = ['😄', '🙂', '😐', '😔', '😫'];
  var ACH = [
    ['🌱', 'First Steps', 'Complete your first quest', function (s) { return s.totalDone >= 1; }],
    ['🔥', 'Kindling', 'Reach a 3-day streak', function (s) { return s.maxDailyBest >= 3; }],
    ['🌙', 'Week of Wonders', 'Reach a 7-day streak', function (s) { return s.maxDailyBest >= 7; }],
    ['🌕', 'Full Moon Cycle', 'Reach a 30-day streak', function (s) { return s.maxDailyBest >= 30; }],
    ['✨', 'Perfect Day', 'Finish every daily quest in one day', function (s) { return s.perfectDays >= 1; }],
    ['🍄', 'Hundredfold', 'Complete 100 quests', function (s) { return s.totalDone >= 100; }],
    ['🦋', 'Moth Keeper', 'Reach level 5', function (s) { return s.level >= 5; }],
    ['🌳', 'Grove Warden', 'Reach level 8', function (s) { return s.level >= 8; }],
    ['🗺️', 'Side Quester', 'Finish 10 side quests', function (s) { return s.sideDone >= 10; }],
    ['🐉', 'Hero of Legend', 'Complete a Main Quest', function (s) { return s.mainDone >= 1; }],
    ['🎁', 'Treat Yourself', 'Claim your first reward', function (s) { return s.rewardsClaimed >= 1; }],
    ['📜', 'Moonlit Journal', 'Log your mood on 7 days', function (s) { return s.moodDays >= 7; }]
  ];
  var DEFAULT_TITLES = [['Seedling', 0], ['Sprout', 100], ['Fern Wanderer', 300], ['Mushroom Forager', 600], ['Moth Keeper', 1000],
    ['Hedge Herbalist', 1500], ['Moonlit Apothecary', 2200], ['Grove Warden', 3000], ['Forest Sage', 4000],
    ['Elder of the Wildwood', 5500], ['Keeper of the Moon', 7500], ['Ancient Oak', 10000]];
  var STARTER_QUESTS = [
    ['💧', 'Drink water', 'Body', 10, 0, 8, 'glasses'], ['🌲', 'Walk in the woods (20 min)', 'Body', 20, 0, 1, ''],
    ['📖', 'Read 20 pages', 'Mind', 15, 0, 1, ''], ['🧹', 'Tidy one corner of the cottage', 'Home', 10, 0, 1, ''],
    ['🕯️', 'Journal or sketch', 'Spirit', 15, 0, 1, ''], ['🧘', 'Stretch / yoga', 'Body', 10, 3, 1, ''],
    ['🪙', 'No-spend day', 'Coin', 15, 3, 1, ''], ['🌿', 'Water the plants', 'Home', 5, 2, 1, '']];

  /* dates are local 'YYYY-MM-DD' strings; day numbers count from 1970 in local calendar days */
  function ds(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dn(s) { var p = s.split('-'); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / 864e5); }
  function nd(n) { var d = new Date(n * 864e5); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
  function add(s, k) { return nd(dn(s) + k); }
  function firstOfMonth(s) { return s.slice(0, 8) + '01'; }

  function isDone(q, v) { return (q.goal || 1) > 1 ? (Number(v) || 0) >= q.goal : v === true || (typeof v === 'number' && v >= 1); }
  function isDaily(q) { return !q.perWeek; }

  function newData(today, name) {
    return {v: 1, profile: {name: name || 'Adventurer', rest: 2, titles: DEFAULT_TITLES.map(function (t) { return {name: t[0], xp: t[1]}; }), start: firstOfMonth(today)},
      quests: [], log: {}, side: [], mains: [], rewards: [], den: {}};
  }
  function starterQuest(i, id) { var s = STARTER_QUESTS[i]; return {id: id, icon: s[0], name: s[1], realm: s[2], xp: s[3], perWeek: s[4], goal: s[5], unit: s[6]}; }

  function titlesOf(D) {
    var t = (D.profile.titles || []).filter(function (x) { return x && x.name; }).map(function (x) { return {name: x.name, xp: Math.max(0, Number(x.xp) || 0)}; });
    t.sort(function (a, b) { return a.xp - b.xp; });
    if (!t.length || t[0].xp > 0) t.unshift({name: 'Seedling', xp: 0});
    return t;
  }

  function compute(D, today) {
    var P = D.profile, start = P.start || firstOfMonth(today), s0 = dn(start), t0 = dn(today);
    var all = D.quests, active = all.filter(function (q) { return !q.off; });
    var dailies = active.filter(isDaily), dailyCount = dailies.length, questCount = active.length;
    var log = D.log || {};
    function entry(s) { return log[s] || {}; }
    function val(s, q) { var e = entry(s); return e.q ? e.q[q.id] : undefined; }
    function wk(s) { return Math.floor((dn(s) - s0) / 7) + 1; }

    /* per-day figures (only days from the start date onward exist, like the sheet's year) */
    var days = {}, keys = Object.keys(log).filter(function (s) { return s >= start; }).sort();
    var xpDaily = 0, totalDone = 0, perfectDays = 0, moodDays = 0, weekXP = {}, weekCount = {};
    keys.forEach(function (s) {
      var e = log[s], rest = e.rest === true, xp = 0, n = 0, dDone = 0, anyDone = 0, w = wk(s);
      all.forEach(function (q) {
        if (!isDone(q, val(s, q))) return;
        anyDone++; xp += Number(q.xp) || 0;
        if (!q.off) { n++; if (isDaily(q)) dDone++; weekCount[q.id + '@' + w] = (weekCount[q.id + '@' + w] || 0) + 1; }
      });
      totalDone += anyDone; xpDaily += xp; weekXP[w] = (weekXP[w] || 0) + xp;
      var perfect = dailyCount > 0 && dDone >= dailyCount;
      if (perfect) perfectDays++;
      if (e.mood) moodDays++;
      days[s] = {xp: xp, n: n, dailyDone: dDone, rest: rest, perfect: perfect,
        pct: dailyCount > 0 ? dDone / dailyCount : (questCount > 0 ? n / questCount : 0)};
    });
    function day(s) { return days[s] || {xp: 0, n: 0, dailyDone: 0, rest: entry(s).rest === true, perfect: false, pct: 0}; }

    /* streaks: daily quests count days (a rest day keeps the run), weekly quests count weeks that met the target */
    var curW = t0 >= s0 ? wk(today) : 0, maxDailyBest = 0, maxBest = 0, curBest = 0;
    var quests = active.map(function (q) {
      var cur = 0, best = 0, last30 = 0, thisWeek = weekCount[q.id + '@' + curW] || 0;
      if (isDaily(q)) {
        var run = 0, prevRun = 0, done30 = 0, rest30 = 0;
        for (var n = s0; n <= t0; n++) {
          var s = nd(n), dnq = isDone(q, val(s, q)), r = entry(s).rest === true;
          prevRun = run; run = dnq ? run + 1 : (r ? run : 0); if (run > best) best = run;
          if (n > t0 - 30) { if (dnq) done30++; if (r) rest30++; }
        }
        cur = run > 0 ? run : (t0 > s0 ? prevRun : 0);
        last30 = Math.min(1, done30 / Math.max(1, 30 - rest30));
        if (best > maxDailyBest) maxDailyBest = best;
      } else {
        var wr = 0, met = false, prev = 0;
        for (var w = 1; w <= curW; w++) {
          met = (weekCount[q.id + '@' + w] || 0) >= q.perWeek; prev = wr; wr = met ? wr + 1 : 0; if (wr > best) best = wr;
        }
        cur = curW < 1 ? 0 : (met ? wr : prev);
        var d28 = 0; for (var m = t0 - 27; m <= t0; m++) if (m >= s0 && isDone(q, val(nd(m), q))) d28++;
        last30 = Math.min(1, d28 / (4 * q.perWeek));
      }
      if (best > maxBest) maxBest = best; if (cur > curBest) curBest = cur;
      var total = 0; keys.forEach(function (s) { if (isDone(q, val(s, q))) total++; });
      return {q: q, cur: cur, best: best, last30: last30, total: total, week: thisWeek};
    });

    /* XP, level, gold */
    var sideDone = 0, epicDone = 0, xpSide = 0;
    D.side.forEach(function (x) { if (x.done) { sideDone++; xpSide += SIDE_XP[x.diff] || 10; if (x.diff === 'Epic') epicDone++; } });
    var mainDone = 0, xpMain = 0, mains = D.mains.map(function (m) {
      var st = m.steps.filter(function (x) { return x.name; }), k = st.filter(function (x) { return x.done; }).length;
      var pct = st.length ? k / st.length : 0, done = st.length > 0 && k === st.length;
      if (done) { mainDone++; xpMain += Number(m.xp) || 0; }
      return {m: m, pct: pct, done: done};
    });
    var xp = xpDaily + xpSide + xpMain, T = titlesOf(D), li = 0;
    for (var i = 0; i < T.length; i++) if (T[i].xp <= xp) li = i;
    var floorXP = T[li].xp, maxed = li >= T.length - 1, nextXP = maxed ? floorXP : T[li + 1].xp;
    var spent = 0, rewardsClaimed = 0; D.rewards.forEach(function (r) { if (r.claimed) { spent += Number(r.cost) || 0; rewardsClaimed++; } });
    var mo = today.slice(0, 7), restUsed = 0; Object.keys(log).forEach(function (s) { if (s.slice(0, 7) === mo && log[s].rest === true) restUsed++; });
    var restPer = Math.max(0, Number(P.rest) || 0);

    var S = {today: today, start: start, name: P.name || 'Adventurer', xp: xp, xpDaily: xpDaily, level: li + 1, title: T[li].name,
      nextTitle: maxed ? 'Max level' : T[li + 1].name, floorXP: floorXP, nextXP: nextXP, maxed: maxed,
      progress: maxed ? 1 : (xp - floorXP) / (nextXP - floorXP), gold: Math.floor(xp / 10) - spent,
      tokensPerMonth: restPer, tokensLeft: Math.max(0, restPer - restUsed),
      totalDone: totalDone, perfectDays: perfectDays, moodDays: moodDays, sideDone: sideDone, epicDone: epicDone,
      mainDone: mainDone, rewardsClaimed: rewardsClaimed, maxDailyBest: maxDailyBest, maxBest: maxBest, curBest: curBest,
      dailyCount: dailyCount, questCount: questCount, quests: quests, mains: mains};
    S.ach = ACH.map(function (a) { return {icon: a[0], name: a[1], desc: a[2], on: !!a[3](S)}; });
    S.achUnlocked = S.ach.filter(function (a) { return a.on; }).length;

    /* views of a single day */
    S.day = function (s) {
      var d = day(s), e = entry(s);
      return {xp: d.xp, n: d.n, dailyDone: d.dailyDone, rest: d.rest, mood: e.mood || '', note: e.note || '', inRange: s >= start,
        values: active.reduce(function (o, q) { var v = val(s, q); o[q.id] = (q.goal || 1) > 1 ? (Number(v) || 0) : !!v && isDone(q, v); return o; }, {}),
        stage: stage(s, d)};
    };
    function stage(s, d) { d = d || day(s); if (s < start) return null; if (d.rest) return -1; if (s > today && d.n === 0) return null;
      return Math.min(5, Math.round(d.n * 5 / Math.max(1, Math.min(5, questCount)))); }
    S.stage = function (s) { return stage(s); };

    /* last five weeks, Monday first (heatmap) */
    var dow = (new Date(t0 * 864e5).getUTCDay() + 6) % 7, h0 = t0 - dow - 28;
    S.heat = []; for (var r = 0; r < 5; r++) { var row = []; for (var c = 0; c < 7; c++) { var n2 = h0 + r * 7 + c, s2 = nd(n2), d2 = day(s2);
      row.push({d: s2, day: Number(s2.slice(8)), pct: (n2 > t0 || s2 < start) ? null : (d2.rest ? -1 : d2.pct)}); } S.heat.push(row); }
    /* XP per week, last 12 weeks */
    S.weekXP = []; for (var k = curW - 11; k <= curW; k++) S.weekXP.push(k < 1 ? 0 : (weekXP[k] || 0));
    /* moods over the last 30 days */
    S.moods = MOODS.map(function (m) { var c = 0; for (var n3 = t0 - 29; n3 <= t0; n3++) { var e3 = log[nd(n3)]; if (e3 && e3.mood === m) c++; } return {e: m, n: c}; });
    return S;
  }

  G.GCR = {compute: compute, newData: newData, starterQuest: starterQuest, STARTER_QUESTS: STARTER_QUESTS, DEFAULT_TITLES: DEFAULT_TITLES,
    SIDE_XP: SIDE_XP, MOODS: MOODS, isDone: isDone, ds: ds, add: add, dn: dn, nd: nd, titlesOf: titlesOf};
})(typeof window !== 'undefined' ? window : globalThis);

/* Glowcap core: talks to the buyer's own sheet through its small "rpc" connection.
   Shared by the full app (inside the sheet's web app) and the instant Quick log (GitHub shell). */
(function (G) {
  var QL = {LOG: 'Daily Log', QB: 'Quest Board', SQ: 'Side Quests', RW: 'Rewards Shop', MQ: 'Main Quests', CALC: 'Calc',
    DAYS: 372, NQ: 20, QROW: 10, SQF: 5, SQN: 200, RWF: 5, RWN: 50, MQF: 6, MQN: 15,
    LC: {REST: 23, MOOD: 24, NOTE: 25, XP: 26}};
  var CR = {QT: 381, SR: 405, ACH: 460, HP: 474, HD: 480, WXP: 487, MOOD30: 503};
  function logRow(c) { return c === 1 ? 5 : c === 2 ? 4 : c <= 23 ? c + 3 : {24: 34, 25: 33, 26: 31, 27: 32}[c]; }
  var XP = {Easy: 10, Tricky: 25, Epic: 60};

  function todayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  var TZ = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ''; } })();

  /* everything the app shows, read in one trip */
  function reads(ds) {
    return [['@log', ds],
      [QL.CALC, 'A' + CR.SR + ':B' + (CR.SR + 59)],
      [QL.CALC, 'A' + CR.QT + ':O' + (CR.QT + QL.NQ - 1)],
      [QL.SQ, 'B' + QL.SQF + ':F' + (QL.SQF + QL.SQN - 1)],
      [QL.RW, 'B' + QL.RWF + ':E' + (QL.RWF + QL.RWN - 1)],
      [QL.CALC, 'A' + CR.ACH + ':D' + (CR.ACH + 11)],
      [QL.CALC, 'A' + CR.HP + ':G' + (CR.HP + 4)],
      [QL.CALC, 'A' + CR.HD + ':G' + (CR.HD + 4)],
      [QL.CALC, 'A' + CR.WXP + ':L' + CR.WXP],
      [QL.CALC, 'A' + CR.MOOD30 + ':E' + (CR.MOOD30 + 1)],
      [QL.MQ, 'B' + QL.MQF + ':Q' + (QL.MQF + QL.MQN - 1)],
      [QL.QB, 'C6']];
  }

  function n(v) { return Number(v) || 0; }

  function parse(res, ds) {
    var R = res.r, col = R[0], row = null;
    if (col) { row = []; for (var lc = 1; lc <= 27; lc++) row.push(col[logRow(lc) - 1][0]); }
    var S = {}; R[1].forEach(function (r) { if (r[0]) S[r[0]] = r[1]; });
    var quests = [];
    R[2].forEach(function (q, k) {
      if (q[1] === '' || q[1] === null) return;
      var v = row ? row[2 + k] : '', goal = n(q[7]) || 1;
      quests.push({k: k, name: String(q[1]), icon: q[2] || '✦', xp: n(q[3]), schedule: q[4], isDaily: q[5] === 1, perWeek: n(q[6]) || 7,
        goal: goal, unit: q[8] || '', cur: n(q[9]), best: n(q[10]), last30: n(q[11]), total: n(q[12]), week: n(q[13]), realm: q[14] || '',
        value: goal > 1 ? (typeof v === 'number' ? v : (v === true ? goal : (n(v) || 0))) : (v === true || (typeof v === 'number' && v >= 1))});
    });
    var open = [], done = [], sideRows = [];
    R[3].forEach(function (r, i) {
      if (r[0] === '' || r[0] === null) return;
      var o = {row: QL.SQF + i, name: String(r[0]), diff: r[1] || 'Easy', xp: n(r[2]) || XP[r[1]] || 10, date: r[4] || ''};
      sideRows.push(o.row); if (r[3] === true) done.push(o); else open.push(o);
    });
    done.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var rewards = [];
    R[4].forEach(function (r, i) { if (r[0] === '' || r[0] === null) return; rewards.push({row: QL.RWF + i, name: String(r[0]), cost: n(r[1]), claimed: r[2] === true, date: r[3] || ''}); });
    var ach = R[5].map(function (a) { return {icon: a[0], name: a[1], desc: a[2], on: a[3] === 1}; });
    var heat = R[6].map(function (r, i) { return r.map(function (p, j) { var d = R[7][i][j]; return {d: d || '', day: d ? Number(String(d).slice(8)) : '', pct: p === '' ? null : Number(p)}; }); });
    var weekXP = R[8][0].map(Number), moods = R[9][0].map(function (e, i) { return {e: e, n: n(R[9][1][i])}; });
    var mains = [];
    R[10].forEach(function (r, i) {
      if (r[1] === '' || r[1] === null) return;
      var steps = [];
      for (var j = 0; j < 4; j++) if (r[5 + 2 * j] !== '' && r[5 + 2 * j] !== null) steps.push({i: j, name: String(r[5 + 2 * j]), done: r[6 + 2 * j] === true});
      mains.push({row: QL.MQF + i, icon: String(r[0] || '✦'), name: String(r[1]), area: String(r[2] || ''), due: r[3] || '', xp: n(r[4]), steps: steps, pct: n(r[14]), done: r[14] === 1, date: r[15] || ''});
    });
    return {name: String(S.name || 'Adventurer'), date: ds, today: res.today, inRange: !!col, start: R[11][0][0] || '',
      level: n(S.level) || 1, title: String(S.title || ''), nextTitle: String(S.nextTitle || ''), xp: n(S.xp), floorXP: n(S.floorXP), nextXP: n(S.nextXP),
      progress: n(S.progress), gold: n(S.gold), tokensLeft: n(S.tokensLeft), tokensPerMonth: n(S.tokensPerMonth), achUnlocked: n(S.achUnlocked),
      dayXP: row ? n(row[QL.LC.XP - 1]) : 0, rest: row ? row[QL.LC.REST - 1] === true : false,
      mood: row ? String(row[QL.LC.MOOD - 1] || '') : '', note: row ? String(row[QL.LC.NOTE - 1] || '') : '',
      mains: mains, quests: quests, side: {open: open, done: done.slice(0, 8)}, sideRows: sideRows, rewards: rewards,
      ach: ach, heat: heat, weekXP: weekXP, moods: moods};
  }

  /* the writes for each action (they never depend on server-side logic, so they can be fixed here at any time) */
  var W = {
    quest: function (ds, k, v) { return [['@log', ds, logRow(3 + k), v]]; },
    rest: function (ds, on) { return [['@log', ds, logRow(QL.LC.REST), !!on]]; },
    mood: function (ds, m) { return [['@log', ds, logRow(QL.LC.MOOD), m || '']]; },
    note: function (ds, t) { return [['@log', ds, logRow(QL.LC.NOTE), String(t || '').slice(0, 500)]]; },
    side: function (row, on, day) { return [[QL.SQ, 'E' + row + ':F' + row, [[!!on, on ? '@d:' + day : '']]]]; },
    addSide: function (row, name, diff) { return [[QL.SQ, 'B' + row + ':C' + row, [[String(name).slice(0, 120), XP[diff] ? diff : 'Easy']]]]; },
    step: function (row, i, on, allDone, day) { var col = String.fromCharCode(72 + 2 * i); return [[QL.MQ, col + row, [[!!on]]], [QL.MQ, 'Q' + row, [[allDone ? '@d:' + day : '']]]]; },
    claim: function (row, day) { return [[QL.RW, 'D' + row + ':E' + row, [[true, '@d:' + day]]]]; },
    addReward: function (row, name, cost) { return [[QL.RW, 'B' + row + ':C' + row, [[String(name).slice(0, 120), Math.max(1, Math.round(Number(cost) || 10))]]]]; }
  };

  /* first empty row in a list, skipping rows already taken (including ones still saving) */
  function freeRow(used, first, count) { for (var r = first; r < first + count; r++) if (used.indexOf(r) < 0) return r; return 0; }

  G.GC = {QL: QL, W: W, reads: reads, parse: parse, freeRow: freeRow, todayStr: todayStr, TZ: TZ, XP: XP};
})(this);

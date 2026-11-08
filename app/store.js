/* Glowcap storage: everything lives on the phone first, so taps are instant and the app works offline.
   A cloud backend (Firebase) plugs in later as a "sync adapter" without touching the screens:
     GCStore.addAdapter({name, pull: () => Promise<data|null>, push: (data) => Promise})  */
(function (G) {
  var KEY = 'glowcap.app.v1', mem = null, adapters = [], timer = null;
  function read() { try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return mem; } }
  function write(D) { mem = D; try { localStorage.setItem(KEY, JSON.stringify(D)); return true; } catch (e) { return false; } }
  function valid(D) { return !!(D && D.v === 1 && D.profile && Array.isArray(D.quests) && D.log && typeof D.log === 'object'
    && Array.isArray(D.side) && Array.isArray(D.mains) && Array.isArray(D.rewards)); }

  G.GCStore = {
    load: function () { var D = read(); return valid(D) ? D : null; },
    /* saves right away on the phone; adapters get a debounced copy */
    save: function (D) {
      D.updated = Date.now(); var ok = write(D);
      clearTimeout(timer); timer = setTimeout(function () { adapters.forEach(function (a) { try { a.push(D); } catch (e) {} }); }, 1500);
      return ok;
    },
    clear: function () { mem = null; try { localStorage.removeItem(KEY); } catch (e) {} },
    valid: valid,
    backup: function (D) { return JSON.stringify({app: 'glowcap', exported: new Date().toISOString(), data: D}); },
    restore: function (text) {
      var o = JSON.parse(text), D = o && o.app === 'glowcap' ? o.data : o;
      if (!valid(D)) throw new Error('This doesn’t look like a Glowcap backup.');
      return D;
    },
    addAdapter: function (a) { adapters.push(a); }
  };
})(window);

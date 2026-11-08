/* Offline support: serve the app from cache, refresh the cache in the background. Bump VERSION on each release. */
var VERSION = 'glowcap-app-1';
var FILES = ['./', 'index.html', 'app.css', 'rules.js', 'store.js', 'ui.js', 'manifest.json', 'icon-192.png',
  'art/app_hero.jpg', 'art/grow0.png', 'art/grow1.png', 'art/grow2.png', 'art/grow3.png', 'art/grow4.png', 'art/grow5.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (r) { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});

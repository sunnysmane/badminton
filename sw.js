/* Rally Point service worker — cache-first app shell so the whole app runs offline. */
var CACHE = "rallypoint-shell-v5";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request)
        .then(function (res) {
          // cache runtime fetches too (e.g. Google Fonts) so they survive offline
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
          return res;
        })
        .catch(function () {
          return caches.match("./index.html");
        });
    })
  );
});

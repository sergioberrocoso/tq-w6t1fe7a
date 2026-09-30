const C = "troqueles-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())));
// Red primero (siempre la última versión); si no hay conexión, caché
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(C).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match("./"))));
});

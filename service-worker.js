// service-worker.js — RESET (tillfälligt)
const VERSION = "reset-3";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
    try { await self.registration.unregister(); } catch {}
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
    for (const c of clients) c.navigate(c.url);
  })());
});
self.addEventListener("fetch", e => e.respondWith(fetch(e.request)));

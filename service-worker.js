// service-worker.js — RESET (tillfälligt, bara en deploy)
const VERSION = "reset-4";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k))); // rensa alla caches
    await self.clients.claim();
    try { await self.registration.unregister(); } catch {}
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
    for (const c of clients) c.navigate(c.url); // refresha alla öppna flikar
  })());
});
self.addEventListener("fetch", e => e.respondWith(fetch(e.request))); // allt går direkt till nätet

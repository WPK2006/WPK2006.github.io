// Normal SW med network-first för HTML (så ändringar syns direkt)
const VERSION = "v1.0.10";
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

// Cacha statiska assets (inte index.html)
const PRECACHE_URLS = [
  "/styles.css?v=10",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isHTML = req.destination === "document" || (req.headers.get("accept") || "").includes("text/html");
  const sameOrigin = url.origin === self.location.origin;

  if (isHTML) {
    event.respondWith(networkFirst(req));
    return;
  }
  if (sameOrigin) {
    event.respondWith(cacheFirst(req));
    return;
  }
  event.respondWith(staleWhileRevalidate(req));
});

async function networkFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(req, { cache: "no-store" });
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response("<h1>Offline</h1>", { headers: { "Content-Type": "text/html" } });
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  const network = fetch(req).then(res => { try { cache.put(req, res.clone()); } catch {} return res; }).catch(() => undefined);
  return cached || network || fetch(req);
}

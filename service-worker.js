// service-worker.js
// HTML = network-first (så nya deployer syns)
// Assets (same-origin) = cache-first
// Cross-origin = stale-while-revalidate
// Ignorera Cypress-runnern helt (/__cypress)
const VERSION = "pwa-1.0.2";
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

// Precache bara statiska filer (inte index.html)
const PRECACHE = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  // lägg till fler statiska filer vid behov:
  // "/styles.css?v=12", "/app.js?v=3"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 1) Släpp igenom Cypress-runnern helt
  if (url.pathname.startsWith("/__cypress")) {
    return; // gör inget → låt nätet hantera (Cypress behöver injicera fritt)
  }

  // 2) HTML: network-first
  const isHTML = req.destination === "document" ||
                 (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3) Same-origin assets: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 4) Cross-origin: stale-while-revalidate
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
    return new Response("<h1>Offline</h1><p>Försök igen senare.</p>", {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(req);
  const net = fetch(req)
    .then(res => { try { cache.put(req, res.clone()); } catch {} return res; })
    .catch(() => undefined);
  return hit || net || fetch(req);
}

// service-worker.js
const VERSION = "pwa-1.0.3";              // <-- bumpa versionen!
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

const PRECACHE = [ "/manifest.json", "/https://user-gen-media-assets.s3.amazonaws.com/seedream_images/699824cc-3806-47bf-8487-666796a0c2f7.png", "/https://user-gen-media-assets.s3.amazonaws.com/seedream_images/699824cc-3806-47bf-8487-666796a0c2f7.png" ];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const c = await caches.open(STATIC_CACHE);
    await c.addAll(PRECACHE);
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

  // ✅ Lägg DETTA direkt i början av fetch-lyssnaren
  if (url.pathname.startsWith("/__cypress")) {
    return; // släpp igenom Cypress helt (ingen caching/hantering)
  }

  // HTML = network-first
  const isHTML = req.destination === "document" ||
                 (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Same-origin assets = cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Cross-origin = stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req));
});

async function networkFirst(req){
  const cache = await caches.open(RUNTIME_CACHE);
  try{
    const fresh = await fetch(req, { cache: "no-store" });
    cache.put(req, fresh.clone());
    return fresh;
  }catch{
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response("<h1>Offline</h1><p>Försök igen senare.</p>", {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}
async function cacheFirst(req){
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}
async function staleWhileRevalidate(req){
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(req);
  const net = fetch(req).then(res => { try { cache.put(req, res.clone()); } catch {} return res; })
                        .catch(() => undefined);
  return hit || net || fetch(req);
}

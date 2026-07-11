/* PlaySputnik Service Worker — offline-first static assets, network-first data */
"use strict";

importScripts("./src/module-manifest.js");

const CACHE_VERSION = "v125";
const STATIC_CACHE = `playsputnik-static-${CACHE_VERSION}`;
const DATA_CACHE = `playsputnik-data-${CACHE_VERSION}`;

// Static assets: precached on install — these rarely change between sessions
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
  "./styles/foundation.css",
  "./styles/components.css",
  "./styles/polish.css",
  "./styles/themes.css",
  "./styles/brand.css",
  "./icons/brand/playsputnik-mark.png",
  "./favicon.svg",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./src/module-manifest.js",
  ...self.PlaySputnikModules.map(({ path }) => `./${path}`),
];

// Data files: network-first, cache as fallback — fetched fresh each session
const DATA_PATHS = [
  "./data/games.json",
  "./data/price-snapshots.json",
  "./data/price-history.json",
  "./data/subscription-availability.json",
  "./data/cover-snapshots.json",
  "./data/title-aliases.json",
  "./data/source-status.json",
  "./data/data-health.json",
  "./data/dev-health.json",
  "./data/refresh-policy.json",
  "./data/taste-radar.json",
  "./data/monthly-drop.json",
  "./data/drop-calendar.json",
  "./data/catalog-workbench.json",
  "./data/catalog-backbone.json",
  "./data/search-sources.json",
  "./data/global-search-fixtures.json",
  "./data/editorial-ru.json",
];

// ── Install: precache static shell ───────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => {
        // Non-fatal: some assets might not exist yet (e.g. icons)
        console.warn("[SW] Precache partial failure:", err.message);
      }),
    ).then(() => self.skipWaiting()),
  );
});

// ── Activate: clean up stale caches ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const currentCaches = new Set([STATIC_CACHE, DATA_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !currentCaches.has(key))
          .map((key) => {
            console.info("[SW] Deleting stale cache:", key);
            return caches.delete(key);
          }),
      ),
    ).then(() => self.clients.claim()),
  );
});

// ── Fetch: routing strategy ──────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Path checks use includes() so they work both at domain root and under a
  // GitHub Pages project subpath (e.g. /playsputnik/data/...).
  const pathname = url.pathname;

  // API / local server calls — always network, never cache
  if (pathname.includes("/api/")) return;

  // Deployment config can change independently of a code release.
  if (pathname.endsWith("/runtime-config.js")) {
    event.respondWith(networkFirstWithCache(request, DATA_CACHE));
    return;
  }

  // Navigations must be network-first so returning users cannot receive an
  // old HTML shell paired with freshly requested JavaScript modules.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithCache(request, STATIC_CACHE));
    return;
  }

  // Data files — network-first, stale cache as offline fallback
  if (pathname.includes("/data/")) {
    event.respondWith(networkFirstWithCache(request, DATA_CACHE));
    return;
  }

  // Static assets — cache-first, network fallback (and update cache)
  if (
    pathname.includes("/src/") ||
    pathname.includes("/icons/") ||
    pathname.endsWith("/") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".html") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith("manifest.json")
  ) {
    event.respondWith(cacheFirstWithNetworkFallback(request, STATIC_CACHE));
    return;
  }

  // Everything else — network only
});

// ── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirstWithNetworkFallback(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — return a minimal offline page for navigation requests
    if (request.mode === "navigate") {
      const offlineCached = await caches.match("./index.html");
      if (offlineCached) return offlineCached;
    }
    return new Response("Offline — resource not cached.", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline", cached: false }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

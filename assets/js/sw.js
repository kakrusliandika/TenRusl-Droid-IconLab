/* TRDV – Service Worker (TenRusl Web DiffView) */
const VERSION = "v0.1.0-trdv-1";
const CORE_CACHE = `trdv-core-${VERSION}`;
const RUNTIME_CACHE = `trdv-runtime-${VERSION}`;

// Halaman offline (jika ada)
const OFFLINE_URL = "/pages/offline.html";

/**
 * Daftar aset inti untuk precache.
 * Pastikan hanya mencantumkan file yang memang ada di proyek DiffView.
 */
const PRECACHE = [
    // Shell
    "/",
    "/index.html",
    "/manifest.webmanifest",

    // CSS
    "/assets/css/theme.css",
    "/assets/css/chrome.css",
    "/assets/css/app.css",
    // (opsional jika ada)
    "/assets/css/pages.css",
    "/assets/css/language.css",

    // JS inti DiffView
    "/assets/js/theme.js",
    "/assets/js/language.js",
    "/assets/js/header.js",
    "/assets/js/footer.js",
    "/assets/js/app.js",

    // i18n (biar UI cepat tampil saat offline)
    "/assets/i18n/en.json",
    "/assets/i18n/id.json",

    // Vendor yang dipakai untuk export / diff
    "/assets/plugin/diff-match-patch.js",
    "/assets/plugin/htmlotimage.js",
    "/assets/plugin/jspdf.js",

    // Icons/Images
    "/assets/images/icon.svg",
    "/assets/icons/apple-touch-icon.png",

    // Offline page (opsional)
    "/pages/offline.html",
];

// Precaching yang tidak gagal walau ada resource miss/404
async function safePrecache() {
    const cache = await caches.open(CORE_CACHE);
    const tasks = PRECACHE.map(async (url) => {
        try {
            const res = await fetch(url, { cache: "no-cache" });
            if (res && res.ok) await cache.put(url, res.clone());
        } catch {
            // abaikan yang gagal
        }
    });
    await Promise.allSettled(tasks);
}

self.addEventListener("install", (e) => {
    e.waitUntil(
        (async () => {
            await safePrecache();
            await self.skipWaiting();
        })()
    );
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.filter((k) => ![CORE_CACHE, RUNTIME_CACHE].includes(k)).map((k) => caches.delete(k))
            );
            await self.clients.claim();
        })()
    );
});

self.addEventListener("fetch", (e) => {
    const req = e.request;
    if (req.method !== "GET") return;

    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;

    // Navigasi dokumen (HTML)
    const isNav =
        req.mode === "navigate" || (req.destination === "" && req.headers.get("accept")?.includes("text/html"));

    if (isNav) {
        e.respondWith(
            (async () => {
                try {
                    const net = await fetch(req);
                    (await caches.open(RUNTIME_CACHE)).put(req, net.clone());
                    return net;
                } catch {
                    return (
                        (await caches.match(OFFLINE_URL)) ||
                        (await caches.match("/index.html")) ||
                        new Response("Offline", { status: 503 })
                    );
                }
            })()
        );
        return;
    }

    // Asset same-origin (script/style/font/image): cache-first
    if (sameOrigin && ["script", "style", "font", "image"].includes(req.destination)) {
        e.respondWith(cacheFirst(RUNTIME_CACHE, req));
        return;
    }

    // Lainnya (termasuk CDN): stale-while-revalidate
    e.respondWith(staleWhileRevalidate(RUNTIME_CACHE, req));
});

/* ===== Helpers ===== */
async function cacheFirst(cacheName, request) {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    const net = await fetch(request);
    if (net && net.ok) (await caches.open(cacheName)).put(request, net.clone());
    return net;
}

async function staleWhileRevalidate(cacheName, request) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request, { ignoreVary: true });
    const fetching = fetch(request)
        .then((net) => {
            if (net && net.ok) cache.put(request, net.clone());
            return net;
        })
        .catch(() => null);
    return cached || (await fetching) || new Response("", { status: 504, statusText: "offline" });
}

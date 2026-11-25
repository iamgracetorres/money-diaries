// Keeps the app working with no internet: the app files are saved on the phone the first time it opens.
const CACHE = "money-diaries-v38";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./fonts/fredoka-latin-500-normal.woff2", "./fonts/fredoka-latin-600-normal.woff2",
  "./fonts/nunito-latin-400-normal.woff2", "./fonts/nunito-latin-600-normal.woff2", "./fonts/nunito-latin-700-normal.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== "money-diaries-logos").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Only the app's own files go through here; Google sign-in and Drive requests go straight to the network, never cached.
// Network first so updates arrive when online; fall back to the saved copy when offline.
self.addEventListener("fetch", e => {
  // App logos: saved on the phone the first time they load, so they still show offline.
  const u = new URL(e.request.url);
  if (e.request.method === "GET" && u.hostname === "www.google.com" && u.pathname.startsWith("/s2/favicons")) {
    e.respondWith(caches.open("money-diaries-logos").then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
});

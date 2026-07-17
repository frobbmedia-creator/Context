const CACHE_NAME = "context-static-v15";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=15",
  "./app.js?v=15",
  "./worker.js?v=15",
  "./tokenizer.js?v=15",
  "./compressor.js?v=15",
  "./favicon.svg?v=15",
  "./manifest.webmanifest?v=15"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(Response.error());
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

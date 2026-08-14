const CACHE = "que-te-falta-v22";
const ASSETS = ["./", "./index.html", "./styles.css?v=22", "./app.mjs?v=22", "./core.mjs?v=22", "./family-sync.mjs?v=22", "./secure-sharing.mjs?v=22", "./account-sharing.mjs?v=22", "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./manifest.webmanifest?v=22"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const previousAppCache = keys.some((key) => (key.startsWith("la-compra-v") || key.startsWith("que-te-falta-v")) && key !== CACHE);
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
    if (!previousAppCache) return;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(windows.map((client) => client.navigate(client.url).catch(() => null)));
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows[0];
      if (existing) return existing.focus();
      return clients.openWindow(event.notification.data?.url || "./");
    })
  );
});

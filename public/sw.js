// Minimal app-shell service worker.
// Goal: installable PWA with a real offline fallback, not full offline
// functionality (the checklist API always needs a network round-trip).

const CACHE = 'man-shell-v2';
const APP_SHELL = ['/', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle top-level page navigations; let API/data requests pass
  // through untouched so the checklist flow always talks to the network.
  if (request.mode !== 'navigate') return;

  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached || caches.match('/offline'))
    )
  );
});

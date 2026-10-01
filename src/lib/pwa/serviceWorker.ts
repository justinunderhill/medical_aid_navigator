/** A fresh script/cache for every deployment, served at the existing /sw.js URL. */
export function serviceWorkerScript(version: string): string {
  return `
const CACHE = ${JSON.stringify(`man-shell-${version}`)};
const APP_SHELL = ['/', '/offline'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  // An update waits until the user chooses Refresh now.
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('man-shell-') && key !== CACHE)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.mode !== 'navigate' || new URL(request.url).origin !== self.location.origin) return;
  // Network-first HTML; API responses, chats and PDFs are never cached here.
  event.respondWith(fetch(request).catch(() =>
    caches.match(request, { cacheName: CACHE }).then(cached => cached || caches.match('/offline', { cacheName: CACHE }))
  ));
});
`;
}

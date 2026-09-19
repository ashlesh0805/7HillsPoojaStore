// Service Worker for 7 Hills Pooja Store PWA
const CACHE_NAME = '7hills-cache-v6';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/index.css',
  '/app.js',
  '/icons.js',
  '/data.js',
  '/manifest.json',
  '/app-icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((res) => {
              if (res && res.status === 200) {
                return cache.put(url, res);
              }
            })
            .catch((err) => console.warn('Pre-cache skip:', url, err))
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Resilient Network-First Strategy for HTML Navigation:
// 1. Navigation (HTML): Always fetch from network first so updates show immediately. Fallback to cache only when offline.
// 2. Static Shell Assets: Stale-While-Revalidate with background cache update.
// 3. API Requests: Always live network.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Never cache backend API calls or partner admin
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/partner')) {
    return;
  }

  // Navigation requests: Always try network first
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            if (cached) return cached;
            return caches.match('/').then((rootCached) => rootCached || new Response('Offline', { status: 503 }));
          });
        })
    );
    return;
  }

  // Static Assets (CSS, JS, Icons, Images): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200 && url.origin === self.location.origin) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return networkRes;
        })
        .catch(() => cachedRes);

      return cachedRes || fetchPromise;
    })
  );
});


// Service Worker for 7 Hills Pooja Store PWA
const CACHE_NAME = '7hills-cache-v4';
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precache critical shell assets. Use individual fetches so one failure doesn't abort the entire install
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
    }).then(() => self.skipWaiting())
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

// Resilient Offline-First Strategy:
// 1. Navigation (HTML): Try network with 2.5s timeout, fallback to cached /index.html (never show 'site can't be reached')
// 2. Static Shell Assets: Stale-While-Revalidate (instant load from cache, background refresh)
// 3. API Requests: Always live network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Never cache backend API calls or partner admin
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/partner')) {
    return;
  }

  // Navigation requests: Opening the app, refreshing, or clicking internal links
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            caches.match('/index.html').then((cached) => {
              if (cached) resolve(cached);
              else caches.match('/').then((rootCached) => resolve(rootCached || fetch(event.request)));
            });
          }
        }, 2500);

        fetch(event.request)
          .then((networkRes) => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              if (networkRes && networkRes.status === 200) {
                const resClone = networkRes.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
              }
              resolve(networkRes);
            }
          })
          .catch(() => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              caches.match('/index.html').then((cached) => {
                if (cached) resolve(cached);
                else caches.match('/').then((rootCached) => resolve(rootCached || new Response('Offline', { status: 503 })));
              });
            }
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


const CACHE_NAME = 'fittracker-v4';
const STATIC_ASSETS = [
  '/fitness-tracker/',
  '/fitness-tracker/index.html',
  '/fitness-tracker/app.js',
  '/fitness-tracker/manifest.json',
  '/fitness-tracker/icons/icon-192.png',
  '/fitness-tracker/icons/icon-512.png'
];

const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  
  // API calls (IndexedDB doesn't use fetch, but for future use)
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Google Fonts - stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
  
  // Static assets - cache first
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      }).catch(() => {
        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/fitness-tracker/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background sync for future features
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-data') {
    e.waitUntil(Promise.resolve());
  }
});

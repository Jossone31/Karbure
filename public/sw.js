const CACHE_NAME = 'karbure-v2';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les appels API externes
  if (url.hostname !== 'localhost' && url.hostname !== location.hostname) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache).catch(err => {
            console.warn('Cache put error:', err);
          });
        });

        return response;
      })
      .catch(err => {
        console.warn('Fetch error:', err);
        return caches.match(request).then(response => {
          if (response) return response;
          if (request.destination === 'document') return caches.match('/index.html');
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle messages from clients (prevent async response errors)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Respond to any message to prevent timeout errors
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ success: true });
  }
});

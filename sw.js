const CACHE_NAME = 'pokemon-tracker-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

// URLs for API caching (cache-first strategy)
const apiUrlsToCache = [
  'https://pokeapi.co/api/v2/pokemon-species',
  'https://pokeapi.co/api/v2/version-group',
  'https://pokeapi.co/api/v2/pokemon/',
  'https://pokeapi.co/api/v2/pokemon-species/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Add core assets to cache
        const coreAssets = cache.addAll(urlsToCache);
        return coreAssets;
      })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = event.request.url;

  // Strategy: Cache First for API calls, then Network
  const isApiUrl = apiUrlsToCache.some(url => requestUrl.startsWith(url));
  
  if (isApiUrl) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            // If we get a valid response, update the cache
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            // Network fetch failed, which is okay if we have a cached response
            console.warn('Network request failed for:', requestUrl, err);
          });

          // Return cached response if available, otherwise wait for the network
          return response || fetchPromise;
        });
      })
    );
  } else {
    // Strategy: Cache First for static assets
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        }
      )
    );
  }
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


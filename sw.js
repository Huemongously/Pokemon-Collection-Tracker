const CACHE_NAME = 'poke-tracker-cache-v1.1';
const urlsToCache = [
    './index.html', // Crucial: use relative path
    './manifest.json', // Crucial: use relative path
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

self.addEventListener('install', event => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and added essential files.');
                return cache.addAll(urlsToCache).catch(error => {
                    console.error('Failed to cache one or more essential assets:', error);
                });
            })
    );
});

self.addEventListener('fetch', event => {
    // Serve from cache first, then fall back to network
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Important: Clone the request before fetching
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    response => {
                        // Check if we received a valid response
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Important: Clone the response before adding it to the cache
                        const responseToCache = response.clone();

                        // Cache responses for API calls (PokeAPI) to help with offline functionality
                        if (event.request.url.includes('pokeapi.co')) {
                             caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', event => {
    // Clear old caches
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


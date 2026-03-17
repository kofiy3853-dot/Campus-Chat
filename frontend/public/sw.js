const CACHE_NAME = "campus-chat-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/vite.svg",
  "/src/main.tsx",
  "/src/index.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching shell assets');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Skip caching for API calls and Cloudinary assets
  if (event.request.url.includes('/api/') || event.request.url.includes('cloudinary')) {
    return;
  }

  // Handle SPA navigation: serve index.html for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html')
            .then(response => {
              if (response) return response;
              // Fallback to direct fetch of index.html if cache fails too
              return fetch('/index.html').catch(() => {
                  // Last resort fallback (e.g. if we are completely offline and nothing is cached)
                  return new Response('Offline: Resource not available', { status: 503 });
              });
            });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).catch(() => {
          // Return nothing or a specific fallback if fetch fails
          return null;
        });
      })
  );
});

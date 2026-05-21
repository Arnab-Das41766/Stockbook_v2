const CACHE_NAME = 'stock-journal-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/style.css',
  '/css/dashboard.css',
  '/css/expandable-rows.css',
  '/css/stock-modal.css',
  '/css/chatbot.css',
  '/css/auth-modal.css',
  '/css/landing.css',
  '/js/auth.js',
  '/js/calculations.js',
  '/js/calculator.js',
  '/js/chatbot.js',
  '/js/dashboard-calculator.js',
  '/js/dashboard.js',
  '/js/expandable-rows.js',
  '/js/groq-config.js',
  '/js/stock-api.js',
  '/js/stock-grouping.js',
  '/js/supabase-config.js',
  '/js/together-ai-config.js',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Service Worker Install Event (Pre-cache assets)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static app shell assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activate Event (Cleanup old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache version:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Service Worker Fetch Event (Cache-First strategy for assets, Network-only/Network-first for APIs)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Exclude Supabase DB requests, Groq AI requests, and POST/PUT methods from local caching
  if (
    requestUrl.hostname.includes('supabase.co') ||
    requestUrl.hostname.includes('groq.com') ||
    requestUrl.hostname.includes('together.xyz') ||
    event.request.method !== 'GET'
  ) {
    // Dynamic real-time data or mutations must bypass caching and hit network
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-First with Network fallback for local static assets and fonts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache, fetch updated resource in background to keep cache fresh (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => { /* Ignore background fetch failures when offline */ });

        return cachedResponse;
      }

      // Fallback to network if not in cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Dynamically cache new static assets that weren't pre-cached
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        // If offline and request is an HTML page, we can serve standard cached files
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        throw err;
      });
    })
  );
});

/**
 * EXO GLOBAL ERP — Progressive Web App Service Worker
 * Provides offline caching, lightning-fast loads, and installability across
 * Desktop (Windows, macOS, Linux) and Mobile (Android, iOS).
 */

const CACHE_NAME = 'exo-erp-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/exologo.png',
  '/css/styles.css',
  '/js/sidebar.js',
  '/js/nav-sync.js',
  '/js/notifications.js'
];

// Install: Cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[EXO PWA] Caching app shell assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[EXO PWA] Pre-cache partial fail (safe to ignore):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[EXO PWA] Removing outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and API/socket requests from cache
  if (req.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Cache successful page & static responses
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone);
          });
        }
        return networkRes;
      })
      .catch(() => {
        // If offline or network fails, fallback to cached copy
        return caches.match(req).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          // Fallback to home page if navigating to an HTML document
          if (req.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});

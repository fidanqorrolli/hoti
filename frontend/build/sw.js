// HotiEnergieTec Service Worker für Offline-Funktionalität

const CACHE_NAME = 'hotienergietec-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://www.hotienergietec.at/images/Logo_229125.webp'
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
      })
      .catch((error) => {
        console.log('Service Worker: Caching failed', error);
      })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API calls for now (they need network)
  if (event.request.url.includes('/api/')) {
    return fetch(event.request).catch(() => {
      // Return a generic offline response for API calls
      return new Response(
        JSON.stringify({ 
          error: 'Offline - Keine Internetverbindung verfügbar',
          offline: true 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then((fetchResponse) => {
          // Cache successful responses
          if (fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
        
        // Return offline page for other requests
        return new Response(
          '<h1>Offline</h1><p>Keine Internetverbindung verfügbar</p>',
          {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
          }
        );
      })
  );
});

// Background Sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Here you could sync offline data when connection is restored
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const title = 'HotiEnergieTec';
  const options = {
    body: event.data ? event.data.text() : 'Neue Benachrichtigung',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'hotienergietec-notification'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

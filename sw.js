// Atlas Weather System — Service Worker v1.0
const CACHE_NAME = 'nms-weather-v41';

// App shell — cache these on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/Lush.jpg.png',
  '/Frozen.jpg.png',
  '/Toxic.jpg.png',
  '/Radioactive.jpg.png',
  '/Dead.jpg.png',
  '/Barren.jpg.png',
  '/Scorched.jpg.png',
  '/Volcanic.jpg.png',
  '/Water Planet.jpg.png',
  '/warp.gif',
  '/icons/4.png',
  '/icons/11.png',
  '/icons/12.png',
  '/icons/13.png',
  '/icons/20.png',
  '/icons/26.png',
  '/icons/30.png',
  '/icons/32.png',
  '/icons/40.png',
  '/sentinel.jpg',
  '/sentinel.png',
  '/race-gek.png',
  '/race-korvax.png',
  '/race-vykeen.png',
  '/favicon.png',
  '/favicon-64.png',
  '/plutonium.webp',
  '/fuscium.jpg',
  '/fuscium.png'
];

// API origins — always network-first, fall back to cache
const API_ORIGINS = [
  'api.open-meteo.com',
  'ipapi.co',
  'nominatim.openstreetmap.org'
];

// CDN scripts — cache-first (they rarely change)
const CDN_ORIGINS = [
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls — network first, cache fallback
  if (API_ORIGINS.some(o => url.hostname.includes(o))) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // CDN scripts — cache first
  if (CDN_ORIGINS.some(o => url.hostname.includes(o))) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Everything else (app shell, images, etc.) — cache first, network fallback, cache the response for next time
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

// --- Push notifications ---
// This listener is inert until a real push subscription + backend exist (see index.html VAPID_PUBLIC_KEY
// comment for what's needed to activate). Safe to ship now — it simply never fires without a subscription.
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { title: '\u25c8 ATLAS WEATHER ALERT', body: event.data ? event.data.text() : '' }; }

  const title = data.title || '\u25c8 ATLAS WEATHER ALERT';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'atlas-weather-alert',
    data: data.url || '/'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

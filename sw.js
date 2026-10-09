// Atlas Weather Station — Service Worker (v4.0 redesign)
const CACHE_NAME = 'nms-weather-v61';

// App shell — cached on install (every path here must exist, or install fails)
const SHELL_ASSETS = [
  '/', '/index.html', '/app-v2.js?v=18', '/manifest.json', '/data/haven-worlds.json',
  '/icon-mark.png', '/icon-192.png', '/badge-96.png', '/icon-512.png', '/mobile.css?v=2', '/mobile.js?v=1', '/icon-maskable-192.png', '/icon-maskable-512.png', '/favicon.png', '/favicon-64.png', '/apple-touch-icon.png',
  '/fonts/NMSAlphabet.ttf',
  '/icons/4.png', '/icons/12.png', '/icons/14.png', '/icons/26.png', '/icons/30.png', '/icons/31.png', '/icons/32.png',
  '/icons/hz-tile-heat.webp', '/icons/hz-tile-cold.webp', '/icons/hz-tile-radioactive.webp', '/icons/hz-tile-toxic.webp'
];

// APIs — network first, cache fallback (offline shows the last forecast)
const API_ORIGINS = ['api.open-meteo.com', 'air-quality-api.open-meteo.com', 'geocoding-api.open-meteo.com', 'ipapi.co', 'nominatim.openstreetmap.org', 'api.rainviewer.com'];
// Fonts — cache first
const CDN_ORIGINS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (API_ORIGINS.some(o => url.hostname === o || url.hostname.endsWith('.' + o))) {
    event.respondWith(
      fetch(event.request).then(res => { const c = res.clone(); caches.open(CACHE_NAME).then(x => x.put(event.request, c)); return res; })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (CDN_ORIGINS.some(o => url.hostname.includes(o))) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
        const c = res.clone(); caches.open(CACHE_NAME).then(x => x.put(event.request, c)); return res;
      }).catch(() => cached))
    );
    return;
  }

  // Pages and the daily-worlds data: network first so a new deploy shows straight away
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request).then(res => {
        if (res && res.ok) { const c = res.clone(); caches.open(CACHE_NAME).then(x => x.put(event.request, c)); }
        return res;
      }).catch(() => caches.match(event.request).then(c => c || caches.match('/index.html')))
    );
    return;
  }

  // Everything else (images, versioned scripts) — cache first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
      if (res && res.ok && url.origin === location.origin) { const c = res.clone(); caches.open(CACHE_NAME).then(x => x.put(event.request, c)); }
      return res;
    }))
  );
});

// --- Push notifications (fire once the VAPID key + push backend exist) ---
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: '◈ ATLAS WEATHER ALERT', body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(data.title || '◈ ATLAS WEATHER ALERT', {
    body: data.body || '', icon: data.icon || '/icon-192.png', badge: '/badge-96.png', tag: data.tag || 'atlas-weather-alert', data: data.url || '/'
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});

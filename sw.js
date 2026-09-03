const CACHE_NAME = 'spiewnik-v4';
const ASSETS = [
  'index.html',
  'manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Instalacja i natychmiastowe przejście do aktywacji
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Aktywacja i natychmiastowe przejęcie kontroli nad klientami
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Przechwytywanie zapytań sieciowych
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Strategia Network-First dla JSON oraz index.html / strony głównej
  if (url.pathname.endsWith('.json') || url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
  } else {
    // Strategia Cache-First dla zewnętrznych bibliotek i ikon
    e.respondWith(
      caches.match(e.request).then((res) => {
        return res || fetch(e.request);
      })
    );
  }
});

const CACHE_NAME = 'spiewnik-v3';
const ASSETS = [
  'index.html',
  'manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Instalacja i zapisywanie kluczowych plików w pamięci podręcznej (bez baz JSON)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Aktywacja i czyszczenie starych wersji cache (np. spiewnik-v2)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Przechwytywanie zapytań sieciowych
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Strategia dla baz danych JSON - Network-First (zawsze pytaj serwer o świeże dane)
  if (url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Jeśli udało się pobrać, zaktualizuj też wersję w cache Service Workera na wszelki wypadek
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
          }
          return response;
        })
        .catch(() => {
          // W przypadku całkowitego braku sieci, spróbuj podać wersję z cache
          return caches.match(e.request);
        })
    );
  } else {
    // Strategia Cache-First dla plików statycznych (HTML, CSS, JS, ikony)
    e.respondWith(
      caches.match(e.request).then((res) => {
        return res || fetch(e.request);
      })
    );
  }
});

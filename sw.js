const CACHE_NAME = 'edzesnaplo-v3';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// 1. TELEPÍTÉS
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// 2. AKTIVÁLÁS - Régi gyorsítótár azonnali törlése
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. KÉRÉSEK ELCSÍPÉSE - Hálózat először, offline esetén cache
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                // Ha van net, frissítjük a cache-t a legújabbal a háttérben
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // Ha nincs net (offline vagyunk), adjuk a mentett cache-t
                return caches.match(e.request);
            })
    );
});

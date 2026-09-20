const CACHE_NAME = 'edzesnaplo-auto';
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

// 2. AKTIVÁLÁS - Régi cache azonnali törlése
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

// 3. KÉRÉSEK ELCSÍPÉSE (Network First a frissüléshez)
self.addEventListener('fetch', (e) => {
    // Ha az sw.js-t vagy a főoldalt kéri, azt mindig a hálózatról próbáljuk legelőször
    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                return caches.match(e.request);
            })
    );
});

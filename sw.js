const CACHE_NAME = 'edzesnaplo-v3';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// 1. TELEPÍTÉS - Azonnali aktiválás kényszerítése
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// 2. AKTIVÁLÁS - Az összes régi cache kíméletlen törlése és azonnali átvétel
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    return caches.delete(key);
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// 3. KÉRÉSEK ELCSÍPÉSE (Network First a frissüléshez)
self.addEventListener('fetch', (e) => {
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

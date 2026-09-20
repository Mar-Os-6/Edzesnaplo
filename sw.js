const CACHE_NAME = 'edzesnaplo-v4';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// 1. TELEPÍTÉS - Azonnali átvétel kényszerítése
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

// 2. AKTIVÁLÁS - Régi cache kíméletlen törlése és regisztráció törlése az Apple Safari miatt
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    return caches.delete(key);
                })
            );
        }).then(() => {
            return self.registration.unregister();
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// 3. KÉRÉSEK ELCSÍPÉSE - Közvetlen hálózati letöltés kényszerítése cache helyett
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

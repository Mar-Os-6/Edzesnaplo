const CACHE_NAME = 'edzesnaplo-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

// 1. TELEPÍTÉS - Fájlok elmentése a telefon memóriájába (Cache)
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// 2. AKTIVÁLÁS - Régi gyorsítótár törlése frissítéskor
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
});

// 3. KÉRÉSEK ELCSÍPÉSE - Ha offline vagyunk, a telefonról tölti be a fájlokat
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || fetch(e.request);
        })
    );
});

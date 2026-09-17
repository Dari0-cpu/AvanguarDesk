const CACHE_NAME = 'avanguardesk-v2';
const ASSETS = [
    './',
    './index.html',
    './basegraf.css',
    './app.js',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

// Pulisce le vecchie cache, così un aggiornamento del codice arriva subito
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    // Niente cache per Supabase e per i suggerimenti indirizzi (Nominatim)
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    // Network-first: online mostra sempre l'ultima versione, offline usa la cache
    event.respondWith(
        fetch(req)
            .then(res => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
                return res;
            })
            .catch(() => caches.match(req))
    );
});
const CACHE_NAME = 'avanguardesk-v1';
const ASSETS = [
  './',
  './index.html',
  './basegraf.css',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.includes('supabase')) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
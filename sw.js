const CACHE_NAME = 'neon-pulse-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/Engine.js',
  './assets/music/neon-pulse-theme.mp3',
  './assets/music/start.wav',
  './assets/music/loop.wav',
  './assets/music/turn.wav',
  './assets/music/explosion.wav'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
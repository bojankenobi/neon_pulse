const CACHE_NAME = 'neon-pulse-v2'; // Povećali smo verziju da nateramo brauzer na osvežavanje
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/Engine.js',
  './js/Input.js',
  './js/Audio.js',
  './assets/music/neon-pulse-theme.mp3',
  './assets/music/start.wav',
  './assets/music/loop.wav',
  './assets/music/turn.wav',
  './assets/music/explosion.wav',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
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
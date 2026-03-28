const CACHE_NAME = 'pacman-word-hunter-v44288e1';
const urlsToCache = [
  '/PacManWordHunter/',
  '/PacManWordHunter/index.html',
  '/PacManWordHunter/style.css',
  '/PacManWordHunter/game.js',
  '/PacManWordHunter/manifest.json',
  '/PacManWordHunter/icon.svg',
  '/PacManWordHunter/background-music.mp3'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

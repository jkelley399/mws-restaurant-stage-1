const CACHE_NAME = 'restaurant-review-cache-v1';
let urlsToCache = [
    '/',
    '/css',
    '/css/styles.css',
    '/data',
    '/data/restaurants.json',
    '/img',
    '/img/1.jpg',
    '/img/1tall.jpg',
    '/img/2.jpg',
    '/img/3.jpg',
    '/img/4.jpg',
    '/img/5.jpg',
    '/img/6.jpg',
    '/img/7.jpg',
    '/img/8.jpg',
    '/img/9.jpg',
    '/img/10.jpg',
    'index.html',
    '/js',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    'restaurant.html'
];

self.addEventListener('install', function(event){
    // initial steps
    event.waitUntil(
        // according to MDN, '"caches" is a global read-only variable'...
        //     see: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage/open
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // if data in cache, return response
                if (response) {
                    return response;
                }

            return fetch(event.request)
                .then(function(response) {
                    // test for valid response
                    if(!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    // Cloning response --- response is a stream
                    let responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache)
                        });

                    return response;
                }
            );
        })
    );
});

// self.addEventListener('install',..., and self.addEventListener('fetch' based on:
//   https://developers.google.com/web/fundamentals/primers/service-workers/
//     The approach above is based on the examples in the "Install a service worker"
//     and the Cache and return requests sections in the resource immediately above.
// the constants are based upon reviewing Jake Archibald's answer in this:
//     https://stackoverflow.com/questions/42324601/wildcards-in-serviceworker-cache-api
// Also reviewed
//     https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage/open
//     https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
//     https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/caches
// reviewed 2019-07-21
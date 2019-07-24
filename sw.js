// The revised sw.js is based upon
// "Restaurant Reviews App Walkthrough Part 4 – Service Workers," which I reviewed
// at the suggestion of the first anonymous reviewer; see:
// https://matthewcranford.com/restaurant-reviews-app-walkthrough-part-4-service-workers/
// reviewed 2019-07-22

console.log('Service Worker: Registered');

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
    '/index.html',
    '/js',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/restaurant.html'
];

// installing the sw --- see, e.g.,
// https://developers.google.com/web/fundamentals/primers/service-workers/#the_service_worker_life_cycle
// reviewed 2019-07-23
self.addEventListener('install', function(event){
    // initial steps
    event.waitUntil(
        // according to MDN, '"caches" is a global read-only variable'...
        //     see: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage/open
            // reviewed 2019-07-21
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
                    // log event.request
                    console.log('Found ', event.request, ' in cache.');
                    console.log('In primary fetch(event.request), response.status= ',
                        event.status);
                    return response;
                }
                // adding this new else based on
                // https://matthewcranford.com/restaurant-reviews-app-walkthrough-part-4-service-workers/
                // reviewed 2019-07-23
                else {
                    console.log('Could not find ', event.request, ' in cache; now fetching');
                }

            return fetch(event.request)
                .then(function(response) {
                    // log event.status;
                    // TODO: not logging properly as of 2019-07-23
                    console.log('In secondary fetch(event.request), response.status= ',
                        event.status);
                    // test for valid response
                    if(!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    // Cloning response --- response is a stream
                    let responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }
            )
                // adding this new catch based on
                // https://matthewcranford.com/restaurant-reviews-app-walkthrough-part-4-service-workers/
                // reviewed 2019-07-23
                .catch(function(err) {
                    console.error(err);
            });
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
// At the suggestion of the first anonymous reviewer, I also reviewed
// https://matthewcranford.com/restaurant-reviews-app-walkthrough-part-4-service-workers/
// reviewed 2019-07-22
// https://developers.google.com/web/fundamentals/primers/service-workers/#the_service_worker_life_cycle
// https://developers.google.com/web/fundamentals/codelabs/offline/
// https://developer.mozilla.org/en-US/docs/Web/API/Cache
// https://developers.google.com/web/ilt/pwa/lab-caching-files-with-service-worker#2_cache_the_application_shell
//     Note: discusses how to see the service worker cache contents using
//         Dev Tools -> Application -> Cache -> Cache Storage
// TODO: Service Worker not working in Application/Offline ->
    // Try here next time: https://developers.google.com/web/fundamentals/codelabs/debugging-service-workers/
// reviewed 2019-07-23
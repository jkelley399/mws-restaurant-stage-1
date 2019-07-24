// The service worker registration is based upon
// "Restaurant Reviews App Walkthrough Part 4 – Service Workers," which I reviewed
// at the suggestion of the first anonymous reviewer; among other things,
// this refererence makes clear that the registration should be placed in main.js; see:
// https://matthewcranford.com/restaurant-reviews-app-walkthrough-part-4-service-workers/
// reviewed 2019-07-22
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .catch(function(err) {
      console.error(err);
    });
}

let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiamtlbGxleTM5OSIsImEiOiJjank1NWFoZm0wM3h6M2NsaWc0aG9xeDZhIn0.h5Y873apUNR4dRUnBZNvyQ',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
  // WIP: responsive image on one image to demonstrate approach
  // testing window.screen.width for responsive image
  //   approach based upon
  //   https://developer.mozilla.org/en-US/docs/Web/API/Screen/width
  // https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute
  //   reviewed 2019-07-20
    if (window.screen.width <= 800) {
      if (self.restaurants[0].photograph == '1.jpg') {
        ul.append(createRestaurantHTML(restaurant));
        let targetImage = document.querySelector('[src="/img/1.jpg"]');
        targetImage.setAttribute('src', '/img/1tall.jpg');
      } else {
        ul.append(createRestaurantHTML(restaurant));
      }
    } else {
      ul.append(createRestaurantHTML(restaurant));
    }
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('alt', 'photograph of ' + restaurant.name);
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  // using setAttribute to add tabindex at creation (here and below)
  //   approach based upon
  //   https://stackoverflow.com/questions/22191576/
  //   javascript-createelement-and-setattribute
  //   reviewed 2019-07-19
  name.setAttribute('tabindex', '0');
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.setAttribute('tabindex', '0');
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.setAttribute('tabindex', '0');
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

}
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

// REFERENCES RELIED UPON in main.js and restaurant_info.js:
// 'Udacity Restaurant Reviews App Stage 1: How to configure Mapbox access token,'
// https://medium.com/@andresaaap/
// udacity-restaurant-reviews-app-stage-1-how-to-configure-mapbox-access-token-856721074f7
// Above reviewed 2019-07-15
// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
// Above reviewed 2019-07-17
// https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets
// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
// https://html.com/attributes/select-tabindex/
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/tabIndex
// Above reviewed 2019-07-18
// https://stackoverflow.com/questions/22191576/javascript-createelement-and-setattribute
// Above reviewed 2019-07-19
// https://developer.mozilla.org/en-US/docs/Web/API/Screen/width
// https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
// https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute
// https://developer.mozilla.org/en-US/docs/Learn/Accessibility/HTML
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
// Above reviewed 2019-07-20
// https://github.com/jakearchibald/simple-serviceworker-tutorial/blob/gh-pages/index.html
// https://developers.google.com/web/fundamentals/primers/service-workers/
// https://developers.google.com/web/fundamentals/primers/service-workers/registration
// Above reviewed 2019-07-21
// At the suggestion of the first anonymous reviewer, I also reviewed
// https://matthewcranford.com/restaurant-reviews-app-walkthrough-part-4-service-workers/
// reviewed 2019-07-22

// JK WIP NOTES
// - 2019-07-18
// - Manually adding tabindex = 0; in DevTools worked
// - 2019-07-19
// - figured out how to use setAttribute to establish tabindex based on
//   - https://stackoverflow.com/questions/22191576/javascript-createelement-and-setattribute
// - 2019-07-20
// - figured out how to add multi-size images and implemented in main.js fillRestaurantsHTML()
//   - only saw one that seemed to need it, so did it for Mission Chinese Food only
// - added semantic tags to breadcrumbs in restaurant.html and restaurant_info.js fillBreadcrumb()
// - began work on ServiceWorker
// - 2019-07-21
//   - first rough pass on ServiceWorker
//   - refined basic responsive behavior
// At the suggestion of the first anonymous reviewer, I also reviewed
// https://matthewcranford.com/restaurant-reviews-app-walkthrough-part-4-service-workers/
// reviewed 2019-07-22
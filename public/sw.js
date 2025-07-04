// Service Worker for offline menu caching
const CACHE_NAME = "menushield-v1";
const MENU_CACHE_NAME = "menushield-menu-v1";

// Files to cache for offline functionality
const STATIC_ASSETS = [
  "/",
  "/menu",
  "/manifest.json",
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("MenuShield SW: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("MenuShield SW: Static assets cached");
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== MENU_CACHE_NAME) {
              console.log("MenuShield SW: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("MenuShield SW: Activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(handleStaticRequest(request));
});

// Network-first strategy for API requests
async function handleApiRequest(request) {
  const url = new URL(request.url);

  try {
    // Try network first
    const response = await fetch(request);

    // Cache menu and restaurant data for offline access
    if (url.pathname === "/api/menu" || url.pathname === "/api/restaurant") {
      const cache = await caches.open(MENU_CACHE_NAME);
      const clonedResponse = response.clone();
      await cache.put(request, clonedResponse);
      console.log("MenuShield SW: Cached menu data");
    }

    return response;
  } catch (error) {
    console.log(
      "MenuShield SW: Network failed, trying cache for:",
      url.pathname
    );

    // Fallback to cache
    const cache = await caches.open(MENU_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("MenuShield SW: Serving from cache:", url.pathname);

      // Add offline indicator header
      const headers = new Headers(cachedResponse.headers);
      headers.set("X-Served-From", "cache");

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }

    // Return offline fallback for menu requests
    if (url.pathname === "/api/menu") {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Served-From": "fallback",
        },
      });
    }

    if (url.pathname === "/api/restaurant") {
      return new Response(
        JSON.stringify({
          name: "Restaurant Menu",
          description: "Offline menu - limited information available",
          contact: "Please connect to internet for full details",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Served-From": "fallback",
          },
        }
      );
    }

    throw error;
  }
}

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to network
    const response = await fetch(request);

    // Cache successful responses
    if (response.status === 200) {
      const clonedResponse = response.clone();
      await cache.put(request, clonedResponse);
    }

    return response;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const cache = await caches.open(CACHE_NAME);
      const offlinePage = await cache.match("/");
      if (offlinePage) {
        return offlinePage;
      }
    }

    throw error;
  }
}

// Handle background sync for menu updates
self.addEventListener("sync", (event) => {
  if (event.tag === "menu-sync") {
    event.waitUntil(syncMenuData());
  }
});

async function syncMenuData() {
  try {
    console.log("MenuShield SW: Syncing menu data in background");

    // Fetch fresh menu data
    const menuResponse = await fetch("/api/menu");
    const restaurantResponse = await fetch("/api/restaurant");

    if (menuResponse.ok && restaurantResponse.ok) {
      const cache = await caches.open(MENU_CACHE_NAME);
      await cache.put("/api/menu", menuResponse.clone());
      await cache.put("/api/restaurant", restaurantResponse.clone());

      console.log("MenuShield SW: Menu data synced successfully");

      // Notify clients about update
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "MENU_UPDATED",
          timestamp: Date.now(),
        });
      });
    }
  } catch (error) {
    console.log("MenuShield SW: Background sync failed:", error);
  }
}

// Full Offline Enhanced service-worker.js
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.6.1/workbox-sw.js"
);

const CACHE_NAME = "story-app-v1";
const RUNTIME_CACHE = "runtime-cache-v1";
const OFFLINE_DATA_CACHE = "offline-data-v1";

if (workbox) {
  console.log("✅ Full Offline Workbox loaded");

  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // Complete precache list untuk full offline
  const precacheList = [
    { url: "/", revision: "1" },
    { url: "/index.html", revision: "2" },
    { url: "/app.bundle.js", revision: "3" },
    { url: "/app.css", revision: "4" },
    { url: "/manifest.json", revision: "5" },
    { url: "/favicon.png", revision: "6" },
    { url: "/favicon-192.png", revision: "7" },
    { url: "/favicon-512.png", revision: "8" },
    // Add all possible routes for offline navigation
    { url: "/#/", revision: "9" },
    { url: "/#/about", revision: "10" },
    { url: "/#/add", revision: "11" },
    { url: "/#/login", revision: "12" },
    { url: "/#/register", revision: "13" },
  ];

  console.log("📦 Full offline precaching", precacheList.length, "files");
  workbox.precaching.precacheAndRoute(precacheList);

  // API caching with offline fallback
  workbox.routing.registerRoute(
    /^https:\/\/story-api\.dicoding\.dev\/v1\/stories/,
    new workbox.strategies.NetworkFirst({
      cacheName: "stories-cache",
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        }),
        {
          cacheWillUpdate: async ({ response }) => {
            return response.status === 200 ? response : null;
          },
          cacheKeyWillBeUsed: async ({ request }) => {
            return `${request.url}?offline=true`;
          },
        },
      ],
    })
  );

  // Auth API with special handling
  workbox.routing.registerRoute(
    /^https:\/\/story-api\.dicoding\.dev\/v1\/(login|register)/,
    new workbox.strategies.NetworkOnly({
      plugins: [
        {
          handlerDidError: async () => {
            return new Response(
              JSON.stringify({
                error: true,
                message: "Authentication requires internet connection",
              }),
              {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }
            );
          },
        },
      ],
    })
  );

  // Story detail with cache fallback
  workbox.routing.registerRoute(
    /^https:\/\/story-api\.dicoding\.dev\/v1\/stories\/[^/]+$/,
    new workbox.strategies.NetworkFirst({
      cacheName: "story-details-cache",
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        }),
      ],
    })
  );

  // Images with aggressive caching
  workbox.routing.registerRoute(
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    new workbox.strategies.CacheFirst({
      cacheName: "image-cache",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        }),
      ],
    })
  );

  // Static resources
  workbox.routing.registerRoute(
    /\.(?:js|css)$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "static-resources",
    })
  );

  // Fonts
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: "google-fonts",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        }),
      ],
    })
  );

  // CDN resources
  workbox.routing.registerRoute(
    /^https:\/\/cdnjs\.cloudflare\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: "cdn-cache",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        }),
      ],
    })
  );

  // Navigation fallback - always serve index.html for SPA routes
  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.NetworkFirst({
      cacheName: "pages-cache",
      networkTimeoutSeconds: 3,
      plugins: [
        {
          cacheKeyWillBeUsed: async () => "/index.html",
          handlerDidError: async () => {
            return caches.match("/index.html");
          },
        },
      ],
    })
  );

  console.log("✅ Full offline Workbox routing configured");
} else {
  console.error("❌ Workbox failed - implementing comprehensive fallback");

  // Comprehensive manual fallback
  const urlsToCache = [
    "./",
    "./index.html",
    "./app.bundle.js",
    "./app.css",
    "./manifest.json",
    "./favicon.png",
    "./favicon-192.png",
    "./favicon-512.png",
  ];

  self.addEventListener("install", (event) => {
    console.log("Installing comprehensive offline SW...");
    event.waitUntil(
      Promise.all([
        caches.open(CACHE_NAME).then((cache) => {
          return Promise.all(
            urlsToCache.map((url) => {
              return cache.add(url).catch((err) => {
                console.warn(`Failed to cache: ${url}`, err);
                return Promise.resolve();
              });
            })
          );
        }),
        // Pre-cache some offline data
        caches.open(OFFLINE_DATA_CACHE).then((cache) => {
          return cache.put(
            "/offline-stories",
            new Response(
              JSON.stringify({
                error: false,
                message: "success",
                listStory: [
                  {
                    id: "offline-1",
                    name: "Offline Story",
                    description: "This story is available offline",
                    photoUrl: "/favicon-192.png",
                    createdAt: new Date().toISOString(),
                    lat: null,
                    lon: null,
                  },
                ],
              }),
              {
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }),
      ]).then(() => self.skipWaiting())
    );
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      Promise.all([
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (
                ![CACHE_NAME, RUNTIME_CACHE, OFFLINE_DATA_CACHE].includes(
                  cacheName
                )
              ) {
                return caches.delete(cacheName);
              }
            })
          );
        }),
        self.clients.claim(),
      ])
    );
  });

  self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Handle API requests with offline fallback
    if (url.hostname.includes("dicoding.dev")) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Provide offline fallback for API
            if (url.pathname.includes("/stories")) {
              return caches.match("/offline-stories");
            }
            return new Response(
              JSON.stringify({
                error: true,
                message: "Offline mode - limited functionality",
              }),
              {
                headers: { "Content-Type": "application/json" },
              }
            );
          })
      );
      return;
    }

    // Handle other requests
    if (url.origin === self.location.origin) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => {
              // For navigation requests, serve index.html
              if (event.request.mode === "navigate") {
                return caches.match("/index.html");
              }
              return new Response("Offline", { status: 503 });
            });
        })
      );
    }
  });
}

// Enhanced offline form handling
self.addEventListener("sync", (event) => {
  if (event.tag === "offline-story-sync") {
    event.waitUntil(syncOfflineStories());
  }
});

async function syncOfflineStories() {
  try {
    const offlineCache = await caches.open("offline-forms");
    const requests = await offlineCache.keys();

    for (const request of requests) {
      const response = await offlineCache.match(request);
      const data = await response.json();

      // Try to sync with server
      try {
        await fetch("/api/stories", {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        });

        // Remove from offline cache after successful sync
        await offlineCache.delete(request);
        console.log("Synced offline story:", data.title);
      } catch (error) {
        console.log("Sync failed, keeping offline:", error);
      }
    }
  } catch (error) {
    console.error("Sync process failed:", error);
  }
}

// Store offline form submissions
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "STORE_OFFLINE_FORM") {
    const formData = event.data.payload;

    caches.open("offline-forms").then((cache) => {
      cache.put(
        `/offline-form-${Date.now()}`,
        new Response(JSON.stringify(formData), {
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    // Schedule sync when online
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      navigator.serviceWorker.ready.then((registration) => {
        return registration.sync.register("offline-story-sync");
      });
    }
  }

  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data.payload;
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Story berhasil dibuat";
  const options = {
    body: data.options?.body || "Anda telah membuat story baru",
    icon: "./favicon.png",
    badge: "./favicon.png",
    tag: "story-notification",
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

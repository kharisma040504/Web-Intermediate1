importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.6.1/workbox-sw.js"
);

const getBasePath = () => {
  const currentLocation = self.location.pathname;
  if (currentLocation.includes("/Web-Intermediate1/")) {
    return "/Web-Intermediate1";
  }
  return "";
};

const basePath = getBasePath();

if (workbox) {
  console.log("✅ Workbox loaded successfully");

  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  workbox.precaching.precacheAndRoute([
    { url: `${basePath}/`, revision: "1" },
    { url: `${basePath}/index.html`, revision: "1" },
    { url: `${basePath}/app.bundle.js`, revision: "1" },
    { url: `${basePath}/app.css`, revision: "1" },
    { url: `${basePath}/manifest.json`, revision: "1" },
    { url: `${basePath}/favicon.png`, revision: "1" },
    { url: `${basePath}/favicon-192.png`, revision: "1" },
    { url: `${basePath}/favicon-512.png`, revision: "1" },
  ]);

  workbox.routing.registerRoute(
    ({ url }) => url.origin === "https://story-api.dicoding.dev",
    new workbox.strategies.NetworkFirst({
      cacheName: "api-cache",
      networkTimeoutSeconds: 3,
      plugins: [
        {
          cacheKeyWillBeUsed: async ({ request }) => {
            return request.url;
          },
          handlerDidError: async ({ request }) => {
            const url = new URL(request.url);

            if (url.pathname.match(/\/stories\/[^\/]+$/)) {
              return new Response(
                JSON.stringify({
                  error: false,
                  message: "success",
                  story: {
                    id: "offline-1",
                    name: "Story Offline",
                    description: "Story ini tersedia saat offline",
                    photoUrl: `${basePath}/favicon-192.png`,
                    createdAt: new Date().toISOString(),
                    lat: -6.2088,
                    lon: 106.8456,
                  },
                }),
                {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }

            if (url.pathname.includes("/stories")) {
              return new Response(
                JSON.stringify({
                  error: false,
                  message: "success",
                  listStory: [
                    {
                      id: "offline-1",
                      name: "Story Offline",
                      description: "Story offline tersedia",
                      photoUrl: `${basePath}/favicon-192.png`,
                      createdAt: new Date().toISOString(),
                      lat: -6.2088,
                      lon: 106.8456,
                    },
                  ],
                }),
                {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }

            return new Response(
              JSON.stringify({
                error: false,
                message: "Offline response",
                offline: true,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          },
        },
      ],
    })
  );

  workbox.routing.registerRoute(
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    new workbox.strategies.CacheFirst({
      cacheName: "images-cache",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    /\.(?:css|js)$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "static-resources",
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.NetworkFirst({
      cacheName: "pages-cache",
      plugins: [
        {
          cacheKeyWillBeUsed: async () => `${basePath}/index.html`,
          handlerDidError: async () => {
            return caches.match(`${basePath}/index.html`);
          },
        },
      ],
    })
  );

  console.log("✅ Workbox routing configured");
} else {
  console.error("❌ Workbox failed to load");
}

self.addEventListener("message", (event) => {
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
    icon: `${basePath}/favicon.png`,
    badge: `${basePath}/favicon.png`,
    tag: "story-notification",
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || `${basePath}/`,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || `${basePath}/`;

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

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

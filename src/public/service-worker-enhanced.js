importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.6.1/workbox-sw.js"
);

if (workbox) {
  console.log("✅ Workbox loaded successfully");

  workbox.core.skipWaiting();
  workbox.core.clientsClaim();
  workbox.precaching.precacheAndRoute([
    { url: "/", revision: "1" },
    { url: "/index.html", revision: "1" },
    { url: "/app.bundle.js", revision: "1" },
    { url: "/app.css", revision: "1" },
    { url: "/manifest.json", revision: "1" },
    { url: "/favicon.png", revision: "1" },
    { url: "/favicon-192.png", revision: "1" },
    { url: "/favicon-512.png", revision: "1" },
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
                    photoUrl: "/favicon-192.png",
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
                      photoUrl: "/favicon-192.png",
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
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.NetworkFirst({
      cacheName: "pages-cache",
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
    icon: "/favicon.png",
    badge: "/favicon.png",
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

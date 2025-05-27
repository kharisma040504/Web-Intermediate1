const CACHE_NAME = "story-app-v1";

const urlsToCache = ["./", "./index.html", "./app.bundle.js", "./favicon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache dibuka");
        return Promise.all(
          urlsToCache.map((url) => {
            return cache.add(url).catch((err) => {
              console.error(`Gagal cache: ${url}`, err);
              return Promise.resolve();
            });
          })
        );
      })
      .catch((error) => {
        console.error("Gagal menyimpan cache:", error);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Menghapus cache lama:", cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (
    requestUrl.pathname.startsWith("/v1/") ||
    requestUrl.hostname.includes("google-analytics") ||
    requestUrl.hostname.includes("googleapis") ||
    requestUrl.hostname.includes("dicoding.dev")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((err) => console.error("Gagal update cache:", err));
          }
          return networkResponse;
        })
        .catch(() => {
          console.log("Gagal fetch dari jaringan");
          return null;
        });

      return response || fetchPromise;
    })
  );
});

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
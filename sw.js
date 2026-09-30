const CACHE = "arc-v3";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg"
];

/* =========================
   INSTALL
========================= */

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* =========================
   ACTIVATE
========================= */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* =========================
   FETCH
========================= */

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then(response => {
          if (
            !response ||
            response.status !== 200 ||
            response.type === "opaque"
          ) {
            return response;
          }

          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(
              event.request,
              copy
            );
          });

          return response;
        })
        .catch(() =>
          caches.match("./index.html")
        );
    })
  );
});

/* =========================
   NOTIFICATION CLICK
========================= */

self.addEventListener(
  "notificationclick",
  event => {
    event.notification.close();

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then(clientList => {
          for (const client of clientList) {
            if ("focus" in client) {
              return client.focus();
            }
          }

          if (clients.openWindow) {
            return clients.openWindow("./");
          }
        })
    );
  }
);

/* =========================
   MESSAGE
========================= */

self.addEventListener(
  "message",
  event => {
    if (
      event.data &&
      event.data.type ===
        "SKIP_WAITING"
    ) {
      self.skipWaiting();
    }
  }
);

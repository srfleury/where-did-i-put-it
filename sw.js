// Bump this name whenever you ship changes, so phones pick up the update.
const CACHE = "wdip-v1";
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
const SHELL = [
  "./",
  "index.html",
  "firebase-config.js",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  SDK + "firebase-app.js",
  SDK + "firebase-firestore.js"
];

self.addEventListener("install", (event) => {
  // cache:"reload" skips the browser's normal cache, so an update gets the newest files.
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n.startsWith("wdip-") && n !== CACHE).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Only app files and the Firebase code. Firestore's own traffic is left alone.
  if (url.origin !== self.location.origin && url.hostname !== "www.gstatic.com") return;

  // Every page load uses the same saved copy of the app, whatever the address looks like.
  const key = req.mode === "navigate" ? "index.html" : req;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(key, { ignoreVary: true });
      const network = fetch(req).then(async (res) => {
        if (res.ok && res.type !== "opaque") await cache.put(key, res.clone());
        return res;
      });
      if (cached) {
        // Answer instantly from the phone, and refresh the saved copy in the background.
        event.waitUntil(network.catch(() => {}));
        return cached;
      }
      return network;
    })
  );
});

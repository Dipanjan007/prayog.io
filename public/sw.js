// Prayog offline cache: pages are network-first (fall back to the last copy),
// and built assets are cache-first since their file names change per build.
const CACHE = "prayog-v12";
const PRECACHE = [
  "/",
  "/learn",
  "/outliers",
  "/learn/pressure-winds",
  "/learn/motion",
  "/learn/circuits",
  "/learn/light-refraction",
  "/learn/mirrors-lenses",
  "/learn/human-eye",
  "/learn/forces",
  "/learn/magnetic-heating",
  "/learn/sky-clock",
  "/learn/forces-motion",
  "/learn/work-energy",
  "/learn/sound",
  "/learn/electricity",
  "/learn/magnetic-effects",
  "/learn/time-motion",
  "/learn/heat-transfer",
  "/learn/shadows-reflections",
  "/learn/earth-moon-sun",
  "/outliers/gravity",
  "/outliers/circular-motion",
  "/outliers/black-holes",
  "/outliers/time-dilation",
  "/outliers/length-contraction",
  "/outliers/mass-energy",
  "/learn/pressure-lab",
  "/learn/float-sink",
  "/learn/cells-compass",
  "/learn/paths-circles",
  "/learn/simple-machines",
  "/learn/sound-uses",
  "/learn/house-wiring",
  "/learn/sky-colours",
  "/learn/water-cycle",
  "/learn/friction-tension",
  "/learn/eye-defects",
  "/maths",
  "/maths/triangles",
  "/maths/pythagoras",
  "/maths/coordinates",
  "/maths/heights-distances",
  "/maths/solids",
  "/maths/similar-triangles",
  "/maths/outliers/infinite-sums",
  "/maths/outliers",
  "/maths/outliers/ciphers",
  "/maths/quadratics",
  "/maths/data",
  "/maths/probability",
  "/maths/two-variables",
  "/maths/linear-polynomials",
  "/maths/proportion",
  "/maths/percentages",
  "/maths/powers",
  "/maths/squares-cubes",
  "/maths/letter-numbers",
  "/maths/equations",
  "/maths/decimals",
  "/maths/fractions",
  "/maths/tilings",
  "/maths/parallel-lines",
  "/olympiad",
  "/me",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // Account data is never cached: it is per person and must stay fresh.
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/"))),
  );
});

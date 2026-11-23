const VERSION = "__VERSION__";
const PRECACHE = "__PRECACHE__";
const CACHE = `submerge-${VERSION}`;
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(Array.isArray(PRECACHE) ? PRECACHE : []))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k.startsWith("submerge-")).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function ranged(req, res) {
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  if (!m || !res.ok) return res;
  const buf = await res.arrayBuffer();
  const start = m[1] ? Number(m[1]) : Math.max(0, buf.byteLength - Number(m[2]));
  const end = m[1] && m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "audio/mp4",
      "Content-Range": `bytes ${start}-${end}/${buf.byteLength}`,
      "Content-Length": String(end - start + 1),
    },
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req)
          .then((r) => {
            if (r.ok || r.type === "opaque") c.put(req, r.clone());
            return r;
          })
          .catch(() => hit);
        return hit || net;
      }),
    );
    return;
  }
  if (url.origin !== location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((r) => {
          if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone()));
          return r;
        })
        .catch(async () => {
          const c = await caches.open(CACHE);
          return (await c.match(req, { ignoreSearch: true })) || (await c.match(new URL("./", self.registration.scope).href)) || Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return req.headers.has("range") ? ranged(req, hit) : hit;
      const res = await fetch(req);
      if (res.ok && res.status === 200 && !req.headers.has("range")) c.put(req, res.clone());
      return res;
    }),
  );
});

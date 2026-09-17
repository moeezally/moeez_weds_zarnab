/* Moeez & Zarnab — offline cache.
 *
 * GitHub Pages sends `cache-control: max-age=600` on everything and gives no
 * way to change it, so a guest who reopens the invite eleven minutes later
 * re-downloads all of it. This keeps our own copy instead, which the server's
 * headers cannot expire.
 *
 * BUMP VERSION whenever a file in ASSETS changes, or guests keep the old one.
 */
var VERSION = 'mz-2026-09-17b';
var ASSETS = [
  './',
  './index.html',
  './opening-poster.jpg',
  './opening.mp4',
  './swanbg.mp4',
  './invite-music.m4a',
  './fonts/cinzel-normal.woff2',
  './fonts/cormorant-normal.woff2',
  './fonts/cormorant-italic.woff2',
  './fonts/italianno-normal.woff2'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      // no addAll: one 404 would reject the whole install and leave no cache
      return Promise.all(ASSETS.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () { });
      }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === VERSION ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// <video> and <audio> ask for byte ranges, and a 206 cannot be stored in the
// Cache API. We hold the whole file and cut the range out of it ourselves.
function sliceFromCache(cached, range) {
  return cached.arrayBuffer().then(function (buf) {
    var total = buf.byteLength;
    var m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!m) return cached;
    var start = m[1] === '' ? null : parseInt(m[1], 10);
    var end = m[2] === '' ? null : parseInt(m[2], 10);
    if (start === null) { start = Math.max(0, total - (end || 0)); end = total - 1; }
    if (end === null || end >= total) end = total - 1;
    if (start > end || start >= total) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': 'bytes */' + total }
      });
    }
    var part = buf.slice(start, end + 1);
    return new Response(part, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': cached.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Length': String(part.byteLength),
        'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
        'Accept-Ranges': 'bytes'
      }
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;   // fonts go straight to the network

  // The page itself: network first, so an edited invite always reaches guests.
  if (req.mode === 'navigate' || url.pathname.slice(-5) === '.html') {
    e.respondWith(
      fetch(req).then(function (r) {
        var copy = r.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return r;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Everything else: ours if we have it, otherwise fetch and keep it.
  e.respondWith(
    caches.match(url.pathname, { ignoreSearch: true }).then(function (cached) {
      var range = req.headers.get('range');
      if (cached) return range ? sliceFromCache(cached.clone(), range) : cached;
      return fetch(req).then(function (r) {
        if (r.status === 200) {
          var copy = r.clone();
          caches.open(VERSION).then(function (c) { c.put(url.pathname, copy); });
        }
        return r;
      });
    })
  );
});

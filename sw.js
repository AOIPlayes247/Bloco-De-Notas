// Service worker do Notely: guarda o app no aparelho (abre rápido e funciona offline).
// Segurança: só mexe em GET do próprio site e só guarda os arquivos da lista abaixo.
// Ao publicar uma versão nova dos arquivos, aumente o número em VERSION.
var VERSION = "notely-v2";
var FILES = ["./", "./index.html", "./BlocoDeNotas.html", "./manifest.webmanifest",
             "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
var ALLOW = FILES.map(function (f) { return new URL(f, self.registration.scope).href; });

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Abre na hora com o que está guardado e atualiza em segundo plano para a próxima vez.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var u = new URL(req.url);
  if (u.origin !== self.location.origin) return;
  u.search = ""; u.hash = "";
  if (ALLOW.indexOf(u.href) === -1) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok && res.type === "basic") { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () {
        return hit || (req.mode === "navigate" ? caches.match("./BlocoDeNotas.html") : undefined);
      });
      return hit || net;
    })
  );
});

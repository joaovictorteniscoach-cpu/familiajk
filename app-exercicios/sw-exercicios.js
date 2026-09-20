/* Service Worker — Banco de Exercícios JV (Da Base ao Topo)
   Estratégia: network-first (sempre tenta a versão nova online), com cache de
   reserva para abrir offline. O app é 100% local: não fala com servidor nenhum,
   não carrega biblioteca de fora e não tem dado de aluno na nuvem. Os favoritos
   e o plano de aula ficam no próprio aparelho (localStorage).
   Por que importa: quadra de saibro com sinal ruim é a regra, não a exceção. */
const CACHE = 'jv-exercicios-v8';   /* sobe a cada mudanca de tela: o v2 e' apagado no activate */
const SHELL = ['./', './exercicios.js', './quadra.js', './manifest-exercicios.webmanifest',
               './jv-icone-exercicios-192.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let u;
  try { u = new URL(req.url); } catch (_) { return; }
  if (u.origin !== self.location.origin) return;   // nada de fora é interceptado
  e.respondWith(
    fetch(req)
      .then(resp => {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copia).catch(() => {}));
        return resp;
      })
      .catch(() => caches.match(req).then(m => m || caches.match('./')))
  );
});

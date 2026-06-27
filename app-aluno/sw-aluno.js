/* Service Worker — Academia João Victor Tênis (app do aluno)
   Estratégia: network-first (sempre tenta a versão nova online),
   com cache de reserva para abrir offline. NÃO intercepta o Firebase. */
const CACHE = 'jvtenis-aluno-v1';
const SHELL = ['./', './manifest-aluno.webmanifest', './jv-icone-aluno.png'];

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
  // Deixa passar direto (sem cache) o que precisa de rede ao vivo
  const h = u.hostname;
  if (h.includes('firebaseio') || h.includes('firebase') || h.includes('googleapis') ||
      h.includes('gstatic') || h.includes('google') || h.includes('whatsapp') || h.includes('wa.me')) {
    return;
  }
  e.respondWith(
    fetch(req)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy).catch(() => {}));
        return resp;
      })
      .catch(() => caches.match(req).then(m => m || caches.match('./')))
  );
});

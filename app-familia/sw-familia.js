/* Service Worker — Família JK (app de contas + investimentos)
   Estratégia: network-first (sempre tenta a versão nova online),
   com cache de reserva para abrir offline. NÃO intercepta o Firebase
   nem as APIs de cotação ao vivo (câmbio e preços dos ativos). */
const CACHE = 'jk-familia-v1';
const SHELL = ['./', './manifest-familia.webmanifest', './jk-icone-familia-192.png'];

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
  // Deixa passar direto (sem cache) o que precisa de rede ao vivo:
  // Firebase (nuvem) e as APIs de cotação (câmbio + preços dos ativos).
  const h = u.hostname;
  if (h.includes('firebaseio') || h.includes('firebase') || h.includes('googleapis') ||
      h.includes('gstatic') || h.includes('google') || h.includes('whatsapp') || h.includes('wa.me') ||
      h.includes('awesomeapi') || h.includes('brapi')) {
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

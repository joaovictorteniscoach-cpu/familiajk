/* Service Worker — Academia João Victor Tênis (app do gestao)
   Estratégia: network-first (sempre tenta a versão nova online),
   com cache de reserva para abrir offline. NÃO intercepta o Firebase. */
const CACHE = 'jvtenis-gestao-v10';
// o visual, os icones e agora o codigo do app moram em arquivo proprio:
// entram na reserva para o app abrir offline inteiro
// Com a versao no endereco, a reserva tem de guardar o MESMO endereco que a
// tela pede — senao o app pede lib/app-gestao.js?v=X, nao acha, e fica sem
// codigo justamente quando esta sem internet.
const V = '2026-09-24-5';
const SHELL = ['./', './manifest-gestao.webmanifest', './jv-icone-gestao.png',
               './jv-icone-gestao-180.png',
               './lib/estilo.css?v='+V, './lib/icones.js?v='+V, './lib/app-gestao.js?v='+V,
               '../site/img/quadra-2.webp'];

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

/* Avisos: clicar na notificação foca (ou abre) o app.
   O bloco de push fica pronto para quando houver servidor de envio. */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ls => {
      for (const c of ls) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

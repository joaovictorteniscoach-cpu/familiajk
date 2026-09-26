/* Service Worker — Academia João Victor Tênis (app do aluno)
   Estratégia: network-first (sempre tenta a versão nova online),
   com cache de reserva para abrir offline. NÃO intercepta o Firebase. */
const V = '2026-09-26-3';
const CACHE = 'jvtenis-aluno-v18';
const SHELL = ['./', './manifest-aluno.webmanifest', './jv-icone-aluno.png', './jv-icone-aluno-180.png', './assets/jv-saibro-premium.svg', './lib/icones.js?v='+V];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('jvtenis-aluno-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let u;
  try { u = new URL(req.url); } catch (_) { return; }
  // Só armazena arquivos deste app. Firebase e outros apps ficam fora.
  const scope = new URL('./', self.location.href);
  if (u.origin !== scope.origin || !u.pathname.startsWith(scope.pathname)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const resp = await fetch(req);
      if (resp.ok && !resp.redirected && resp.type === 'basic') {
        await cache.put(req, resp.clone()).catch(() => {});
      }
      return resp;
    } catch (_) {
      const saved = await cache.match(req);
      if (saved) return saved;
      // HTML é reserva apenas de navegação, nunca de JS/CSS/imagens.
      if (req.mode === 'navigate') {
        const shell = await cache.match('./');
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
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

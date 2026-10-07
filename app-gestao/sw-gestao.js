/* Service Worker — Academia João Victor Tênis (app do gestao)
   Estratégia: network-first (sempre tenta a versão nova online),
   com cache de reserva para abrir offline. NÃO intercepta o Firebase. */
const CACHE = 'jvtenis-gestao-v41';
// o visual, os icones e agora o codigo do app moram em arquivo proprio:
// entram na reserva para o app abrir offline inteiro
// Com a versao no endereco, a reserva tem de guardar o MESMO endereco que a
// tela pede — senao o app pede lib/app-gestao.js?v=X, nao acha, e fica sem
// codigo justamente quando esta sem internet.
const V = '2026-10-07-1';
const SHELL = ['./', './manifest-gestao.webmanifest', './jv-icone-gestao.png',
               './jv-icone-gestao-180.png',
               './lib/estilo.css?v='+V, './lib/estilo-saibro.css?v='+V, './lib/icones.js?v='+V, './lib/app-gestao.js?v='+V,
               './assets/jv-saibro-premium.svg', './assets/jv-saibro-realista.webp', './assets/icones3d.webp'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('jvtenis-gestao-') && k !== CACHE).map(k => caches.delete(k))))
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
      // A página sempre confere com o servidor (no-cache): sem isso o
      // navegador reaproveitava a cópia guardada por até 10 min no GitHub
      // Pages, e uma atualização publicada demorava a aparecer.
      const resp = await fetch(req, req.mode === 'navigate' ? { cache: 'no-cache' } : undefined);
      if (resp.ok && !resp.redirected && resp.type === 'basic') {
        await cache.put(req, resp.clone()).catch(() => {});
      }
      // Um erro temporário do servidor também pode usar a reserva.
      // Erros 4xx continuam visíveis, para não esconder arquivos ausentes.
      if (resp.status >= 500 && resp.status <= 599) {
        const saved = await cache.match(req);
        if (saved) return saved;
        if (req.mode === 'navigate') {
          const shell = await cache.match('./');
          if (shell) return shell;
        }
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
      const scope = new URL('./', self.location.href);
      for (const c of ls) {
        let url;
        try { url = new URL(c.url); } catch (_) { continue; }
        if (url.origin === scope.origin && url.pathname.startsWith(scope.pathname) && 'focus' in c) {
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(scope.href);
    })
  );
});

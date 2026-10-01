/* Família JK — assets locais, rede primeiro e reserva offline.
   APIs e bibliotecas de OCR seguem diretamente para a rede. */
const CACHE = 'jk-familia-black-gold-20260925-r2';
const SHELL = ['./', './index.html', './layout.css', './vendor/chart.umd.min.js',
  './vendor/xlsx.full.min.js', './manifest-familia.webmanifest',
  './icone-jk-gestao-180.png', './icone-jk-gestao-192.png',
  './icone-jk-gestao-512.png', './icone-jk-gestao-mask.png'];
const URLS = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('jk-familia-') && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !URLS.has(request.url)) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(request);
    return cached || (request.mode === 'navigate' ? await caches.match('./index.html') : null) || Response.error();
  }));
});

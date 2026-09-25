/* Ícones vetoriais locais: mesma caixa, traço e tamanho nos dois apps.
   Sem fontes de ícones, imagens pesadas ou dependências de rede. */
var NAVIC = (function () {
  var paths = {
    home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M5 5c8 1 13 6 14 14M5 19C6 11 11 6 19 5"/>',
    clip: '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m8 13 2 2 5-5m-6 8h6"/>',
    cash: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18m-5 5h5"/>',
    bars: '<path d="M5 20v-6h3v6m3 0V8h3v12m3 0V3h3v17M3 21h19"/>',
    line: '<path d="M3 3v18h18M6 16l5-6 4 3 6-8m-5 0h5v5"/>',
    trophy: '<path d="M7 3h10v5a5 5 0 0 1-10 0Zm5 10v6m-5 2h10M7 5H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4"/>',
    camera: '<path d="m8 5 2-2h4l2 2h4v15H4V5Z"/><circle cx="12" cy="12" r="4"/>',
    bell: '<path d="M6 10a6 6 0 0 1 12 0v5l2 3H4l2-3Zm4 11h4"/>',
    history: '<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6m3-5v6l4 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 4 5"/>',
    refresh: '<path d="M3 11a9 9 0 0 1 15-6l3 3m0-6v6h-6m6 5a9 9 0 0 1-15 6l-3-3m0 6v-6h6"/>',
    receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2Zm3 5h8m-8 4h8m-8 4h4"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
  }, icons = {};
  Object.keys(paths).forEach(function (key) {
    icons[key] = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths[key] + '</svg>';
  });
  return icons;
})();
function pintarIcones() {
  document.querySelectorAll('[data-ic]').forEach(function (el) {
    var icon = NAVIC[el.getAttribute('data-ic')];
    if (icon) el.innerHTML = icon;
  });
}
pintarIcones();
document.addEventListener('DOMContentLoaded', pintarIcones);

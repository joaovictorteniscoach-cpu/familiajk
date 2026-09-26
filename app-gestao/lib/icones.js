/* Ícones vetoriais locais · versão sólida dourada JV.
   A cor vem do CSS do app; os recortes internos usam a tinta verde premium. */
var NAVIC=(function(){
  var p={
    home:'<path d="M2.8 10.2 12 2.7l9.2 7.5v9.2A1.6 1.6 0 0 1 19.6 21h-5.1v-6.3h-5V21H4.4a1.6 1.6 0 0 1-1.6-1.6z"/>',
    cal:'<path fill-rule="evenodd" d="M6 3h2v2h8V3h2v2h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h1zm14 8H4v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z"/><path class="cut" d="M7 13h3v3H7zm5 0h3v3h-3z"/>',
    ball:'<circle cx="12" cy="12" r="9.5"/><path class="cut-stroke" d="M5.3 5.5c7.7 1.2 12.1 5.6 13.3 13.2M5.4 18.7C6.6 11 11 6.6 18.7 5.4"/>',
    clip:'<path d="M7 4h2.2A3 3 0 0 1 12 2a3 3 0 0 1 2.8 2H17a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"/><rect class="cut" x="9" y="4" width="6" height="3" rx="1.2"/><path class="cut-stroke" d="m8 14 2.2 2.2L16 10.5M8 19h8"/>',
    cash:'<path d="M4 5h16a2.5 2.5 0 0 1 2.5 2.5v10A2.5 2.5 0 0 1 20 20H4a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 4 5z"/><path class="cut" d="M1.5 9h21v2h-21z"/><circle class="cut" cx="17.5" cy="15.5" r="1.5"/>',
    bars:'<path d="M3 13h4v8H3zm7-6h4v14h-4zm7-5h4v19h-4z"/>',
    line:'<path d="M3 20.5V3h2v13.8l5.5-6 4 3.1L20.2 6H18V4h5v5h-2V7.7l-6.1 8.6-4.1-3.1-5.2 5.7H22v2z"/>',
    trophy:'<path d="M7 2.5h10v2h4v3a5 5 0 0 1-4.8 5A6.1 6.1 0 0 1 13 15.8V19h4.5v2.5h-11V19H11v-3.2a6.1 6.1 0 0 1-3.2-3.3A5 5 0 0 1 3 7.5v-3h4zm0 4H5v1a3 3 0 0 0 2.2 2.9A10.5 10.5 0 0 1 7 8.3zm10 0v1.8a10.5 10.5 0 0 1-.2 2.1A3 3 0 0 0 19 7.5v-1z"/>',
    camera:'<path d="M7.2 5 9 2.8h6L16.8 5H20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><circle class="cut" cx="12" cy="13" r="4"/><circle cx="12" cy="13" r="2"/>',
    bell:'<path d="M12 2.3a6.3 6.3 0 0 0-6.3 6.3v4.7L3.3 17a1.2 1.2 0 0 0 1 1.9h15.4a1.2 1.2 0 0 0 1-1.9l-2.4-3.7V8.6A6.3 6.3 0 0 0 12 2.3zM9.3 20a2.8 2.8 0 0 0 5.4 0z"/>',
    history:'<path d="M12 3a9 9 0 1 1-8.6 11.6l2.5-.8A6.4 6.4 0 1 0 7 7.3L9.5 10H3V3.5l2.2 2.2A8.9 8.9 0 0 1 12 3z"/><path class="cut" d="M11 7h2v5.1l3.4 2-1 1.7-4.4-2.6z"/>',
    user:'<circle cx="12" cy="7.5" r="4.3"/><path d="M3.5 21a8.5 8.5 0 0 1 17 0z"/>',
    users:'<circle cx="9" cy="7.5" r="3.7"/><circle cx="17.2" cy="8.2" r="3"/><path d="M1.8 21a7.2 7.2 0 0 1 14.4 0z"/><path d="M14.8 15.1c4.4 0 7.2 2.3 7.4 5.9h-4.4a9.6 9.6 0 0 0-3-5.9z"/>',
    refresh:'<path d="M12 3a9 9 0 0 1 7.1 3.5V3.8H22V11h-7.2V8.2h2.5A6.2 6.2 0 0 0 6 10.2L3.3 9.5A9 9 0 0 1 12 3zm8.7 11.5A9 9 0 0 1 4.9 17.6v2.6H2V13h7.2v2.8H6.7A6.2 6.2 0 0 0 18 13.8z"/>',
    receipt:'<path d="M5 2.5 8 4l4-1.5L16 4l3-1.5V22l-3-1.5-4 1.5-4-1.5L5 22z"/><path class="cut" d="M8 8h8v1.8H8zm0 4h8v1.8H8zm0 4h5v1.8H8z"/>',
    plus:'<circle cx="12" cy="12" r="9.5"/><path class="cut" d="M11 6.5h2v4.5h4.5v2H13v4.5h-2V13H6.5v-2H11z"/>',
    search:'<path fill-rule="evenodd" d="M10.5 2.5a8 8 0 1 1-4.7 14.5l-3.7 3.7-1.8-1.8L4 15.2A8 8 0 0 1 10.5 2.5zm0 2.7a5.3 5.3 0 1 0 0 10.6 5.3 5.3 0 0 0 0-10.6z"/>',
    check:'<circle cx="12" cy="12" r="9.5"/><path class="cut" d="m10.4 16.7-4-4 1.8-1.8 2.2 2.2 5.6-6 1.9 1.7z"/>',
    clock:'<circle cx="12" cy="12" r="9.5"/><path class="cut-stroke" d="M12 6.5v5.8l4 2.2"/>',
    coins:'<ellipse cx="12" cy="6" rx="7.2" ry="3.1"/><path d="M4.8 6v4.4c0 1.8 3.2 3.2 7.2 3.2s7.2-1.4 7.2-3.2V6"/><path d="M4.8 10.4v4.4c0 1.8 3.2 3.2 7.2 3.2s7.2-1.4 7.2-3.2v-4.4"/><path d="M4.8 14.8v2.8c0 1.9 3.2 3.4 7.2 3.4s7.2-1.5 7.2-3.4v-2.8"/>',
    target:'<circle cx="12" cy="12" r="9.5"/><circle class="cut" cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2.4"/><path d="M15.8 8.2 21 3m-2.2 0H21v2.2"/>',
    more:'<circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/>'
  },icons={};
  Object.keys(p).forEach(function(k){
    icons[k]='<svg class="jv-solid-icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false">'+p[k]+'</svg>';
  });
  return icons;
})();
function pintarIcones(){
  document.querySelectorAll('[data-ic]').forEach(function(el){
    var icon=NAVIC[el.getAttribute('data-ic')];
    if(icon)el.innerHTML=icon;
  });
}
pintarIcones();
document.addEventListener('DOMContentLoaded',pintarIcones);

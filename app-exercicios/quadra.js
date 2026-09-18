/* ==========================================================================
   DESENHO DA QUADRA — Banco de Exercícios JV · Da Base ao Topo
   --------------------------------------------------------------------------
   Transforma a montagem de cada exercício num desenho: quem está onde, para
   onde a bola vai, para onde o aluno corre, onde estão os cones e os alvos.
   É SVG puro, desenhado na hora — não são imagens. Isso quer dizer que:
     · pesa alguns bytes, não megabytes (o app abre em quadra, no 4G ruim);
     · fica nítido em qualquer tela e em qualquer zoom;
     · o desenho sai junto na impressão do plano de aula;
     · para mudar um exercício, muda-se a lista de elementos — não um arquivo
       de imagem que ninguém sabe editar depois.

   SISTEMA DE COORDENADAS — medidas reais da quadra, em metros
     x: 0 no meio · negativo à esquerda · ±4,115 linha de simples · ±5,485 dupla
     y: 0 na REDE · positivo é o lado do ALUNO (embaixo) · 11,885 é a linha de
        base · 6,40 é a linha de saque
   Ou seja: quem lê o desenho está sempre atrás do aluno, olhando para a rede.

   COMO ESCREVER O DESENHO DE UM EXERCÍCIO (campo `fig` em exercicios.js)
     fig: { base:'meia', el:[
       ['aluno', 0, 11.5, 'espera'],
       ['prof', 0, -3, 'cesta'],
       ['bola', 0,-3, 3.5,8, .3, ''],
       ['mov', 0,11.5, 3.5,8, .1, 'chega'],
       ['cone', 0, 11.9, 'volta aqui']
     ]}
   base: 'inteira' (as duas quadras) · 'meia' (só o lado do aluno, com a rede)
         · 'mini' (os dois quadrados de saque) · 'fundo' (recorte do fundo)
   ========================================================================== */

/* Medidas oficiais, em metros. */
const QD = {
  duplaX: 5.485,     // meia largura da quadra de duplas
  simplesX: 4.115,   // meia largura da quadra de simples
  fundoY: 11.885,    // rede → linha de base
  saqueY: 6.40,      // rede → linha de saque
  corredorY: 0.9     // altura visual da faixa da rede
};

/* Cada base é um recorte diferente da quadra. */
const BASES = {
  inteira: { x:-6.9, y:-13.9, w:13.8, h:27.8 },
  meia:    { x:-6.9, y:-3.4,  w:13.8, h:17.8 },
  mini:    { x:-5.7, y:-8.2,  w:11.4, h:16.4 },
  fundo:   { x:-6.9, y:2.9,   w:13.8, h:11.6 }
};

/* A moldura do desenho que está sendo montado. Serve para prender o rótulo
   dentro dela: texto que vaza para fora do viewBox e' simplesmente cortado —
   foi o primeiro defeito que apareceu ao desenhar os exercicios de verdade. */
let CAIXA = BASES.meia;

/* Rótulos já colocados neste desenho. Dois rótulos no mesmo lugar viram um
   borrão ilegível — e, com mais de cem exercícios desenhados à mão, isso ia
   acontecer em algum deles sem ninguém perceber. Então o desenho desvia
   sozinho: rótulo que cairia em cima de outro desce (ou sobe) até achar
   lugar livre. */
let ROTULOS = [];

function bate(a, b){
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}
function lugarLivre(x, y, w, h){
  var passo = h + .14, tentativas = 10, i, cand;
  for (i = 0; i < tentativas; i++) {
    cand = { x:x, y:y + passo * i, w:w, h:h };
    if (cand.y + h <= CAIXA.y + CAIXA.h - .1 && !ROTULOS.some(function(r){ return bate(cand, r); })) return cand.y;
  }
  for (i = 1; i < tentativas; i++) {   // não coube para baixo: tenta para cima
    cand = { x:x, y:y - passo * i, w:w, h:h };
    if (cand.y >= CAIXA.y + .1 && !ROTULOS.some(function(r){ return bate(cand, r); })) return cand.y;
  }
  return y;
}

/* Cores do desenho. Saibro de verdade, porque é nele que a JV dá aula. */
const CQ = {
  saibro:'#A9603C', saibroEsc:'#8E4E30', linha:'rgba(255,255,255,.82)',
  rede:'#E8E4DC', redeEsc:'#7C8A93',
  aluno:'#D8B45C', prof:'#E8EDF2', colega:'#8FB0C9',
  bola:'#D7EE86', mov:'#FFFFFF', cone:'#E0784A', zona:'#D8B45C',
  texto:'#FFFFFF', fundoTx:'rgba(9,22,35,.78)'
};

function nQ(v){ return Math.round(v * 1000) / 1000; }

/* ---------- peças do desenho ---------- */

function qLinha(x1,y1,x2,y2,larg){
  return '<line x1="'+nQ(x1)+'" y1="'+nQ(y1)+'" x2="'+nQ(x2)+'" y2="'+nQ(y2)+
         '" stroke="'+CQ.linha+'" stroke-width="'+(larg||.09)+'" stroke-linecap="square"/>';
}

/* Texto com tarja atrás: sem isso, rótulo em cima de linha branca some.
   E preso na moldura: o rótulo empurra para dentro em vez de ser cortado. */
function qTexto(x,y,txt,op){
  op = op || {};
  var tam = op.tam || .6, margem = .18;
  var cabe = CAIXA.w - margem * 2;
  var larg = String(txt).length * tam * 0.56 + tam * 0.7;
  if (larg > cabe) {                     // rótulo comprido encolhe até caber
    tam = tam * cabe / larg;
    larg = cabe;
  }
  var cor = op.cor || CQ.texto, ancora = op.ancora || 'middle';
  var dx = ancora === 'start' ? 0 : (ancora === 'end' ? -larg : -larg/2);
  var esq = CAIXA.x + margem, dir = CAIXA.x + CAIXA.w - margem;
  if (x + dx < esq)        x = esq - dx;
  if (x + dx + larg > dir) x = dir - larg - dx;
  var topo = CAIXA.y + margem + tam, base = CAIXA.y + CAIXA.h - margem - tam*.5;
  if (y < topo) y = topo;
  if (y > base) y = base;
  var alt = tam * 1.42, cima = y - tam * 0.92;
  cima = lugarLivre(x + dx, cima, larg, alt);
  y = cima + tam * 0.92;
  ROTULOS.push({ x:x + dx, y:cima, w:larg, h:alt });
  return '<g>' +
    '<rect x="'+nQ(x+dx)+'" y="'+nQ(y-tam*0.92)+'" width="'+nQ(larg)+'" height="'+nQ(tam*1.42)+
      '" rx="'+nQ(tam*0.36)+'" fill="'+(op.fundo || CQ.fundoTx)+'"/>' +
    // textLength manda o navegador caber o texto na largura calculada. Sem isso
    // a conta de largura e' so' estimativa, e uma frase mais larga que a
    // estimativa vaza para fora do desenho e some.
    '<text x="'+nQ(x)+'" y="'+nQ(y+tam*0.34)+'" text-anchor="'+ancora+'" fill="'+cor+
      '" font-size="'+nQ(tam)+'" font-weight="700" textLength="'+nQ(Math.max(larg-tam*0.7,.4))+
      '" lengthAdjust="spacingAndGlyphs">' +
      String(txt).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') +
    '</text></g>';
}

function qJogador(x,y,rot,tipo){
  var cor = tipo === 'prof' ? CQ.prof : (tipo === 'colega' ? CQ.colega : CQ.aluno);
  var letra = tipo === 'prof' ? 'P' : (tipo === 'colega' ? 'C' : 'A');
  var s = '<g>' +
    '<circle cx="'+nQ(x)+'" cy="'+nQ(y)+'" r=".62" fill="'+cor+'" stroke="rgba(9,22,35,.55)" stroke-width=".1"/>' +
    '<text x="'+nQ(x)+'" y="'+nQ(y+.26)+'" text-anchor="middle" fill="#12283E" font-size=".72" font-weight="900">'+letra+'</text>';
  // rótulo embaixo do jogador; se não couber, sobe para cima dele
  if (rot) {
    var alvoY = y + 1.6;
    if (alvoY > CAIXA.y + CAIXA.h - .5) alvoY = y - 1.25;
    s += qTexto(x, alvoY, rot, { tam:.58 });
  }
  return s + '</g>';
}

function qCone(x,y,rot){
  var s = '<g><path d="M '+nQ(x)+' '+nQ(y-.55)+' L '+nQ(x+.42)+' '+nQ(y+.3)+' L '+nQ(x-.42)+' '+nQ(y+.3)+' Z" ' +
          'fill="'+CQ.cone+'" stroke="rgba(9,22,35,.5)" stroke-width=".07"/>';
  if (rot) s += qTexto(x, y + 1.3, rot, { tam:.55 });
  return s + '</g>';
}

function qZona(x,y,larg,alt,rot){
  var s = '<g><rect x="'+nQ(x-larg/2)+'" y="'+nQ(y-alt/2)+'" width="'+nQ(larg)+'" height="'+nQ(alt)+
    '" rx=".3" fill="'+CQ.zona+'" fill-opacity=".2" stroke="'+CQ.zona+
    '" stroke-width=".11" stroke-dasharray=".5 .34"/>';
  if (rot) s += qTexto(x, y, rot, { tam:.58, fundo:'rgba(9,22,35,.62)' });
  return s + '</g>';
}

/* Caminho curvo entre dois pontos: `curva` empurra o meio para o lado. */
function qCaminho(x1,y1,x2,y2,curva,cor,tracejado,id){
  var mx = (x1+x2)/2, my = (y1+y2)/2, dx = x2-x1, dy = y2-y1;
  var comp = Math.sqrt(dx*dx + dy*dy) || 1;
  var cx = mx - dy/comp * (curva||0) * comp * .5;
  var cy = my + dx/comp * (curva||0) * comp * .5;
  return '<path id="'+id+'" d="M '+nQ(x1)+' '+nQ(y1)+' Q '+nQ(cx)+' '+nQ(cy)+' '+nQ(x2)+' '+nQ(y2)+
    '" fill="none" stroke="'+cor+'" stroke-width=".15" stroke-linecap="round"' +
    (tracejado ? ' stroke-dasharray=".62 .46"' : '') +
    ' marker-end="url(#seta-'+(tracejado?'bola':'mov')+')"/>';
}

/* ---------- a quadra ---------- */

function qCorte(base){
  var b = BASES[base] || BASES.meia, p = [];
  var dx = QD.duplaX, sx = QD.simplesX, fy = QD.fundoY, sy = QD.saqueY;
  var ladoPerto = true, ladoLonge = (base === 'inteira' || base === 'mini' || base === 'meia');

  // piso
  p.push('<rect x="'+(-dx-.7)+'" y="'+nQ(b.y)+'" width="'+nQ(dx*2+1.4)+'" height="'+nQ(b.h)+'" fill="'+CQ.saibro+'"/>');
  p.push('<rect x="'+(-dx)+'" y="'+(-fy)+'" width="'+nQ(dx*2)+'" height="'+nQ(fy*2)+
         '" fill="'+CQ.saibroEsc+'" fill-opacity=".45"/>');

  // linhas: laterais de dupla e de simples, correndo a quadra inteira
  [-dx, dx, -sx, sx].forEach(function(x){ p.push(qLinha(x, -fy, x, fy)); });
  // linhas de base
  p.push(qLinha(-dx, fy, dx, fy, .13));
  p.push(qLinha(-dx, -fy, dx, -fy, .13));
  // linhas de saque e linha central de saque
  p.push(qLinha(-sx, sy, sx, sy));
  p.push(qLinha(-sx, -sy, sx, -sy));
  p.push(qLinha(0, -sy, 0, sy));
  // marcas do centro, no fundo
  p.push(qLinha(0, fy, 0, fy - .3, .13));
  p.push(qLinha(0, -fy, 0, -fy + .3, .13));

  // rede: faixa clara com a fita em cima
  p.push('<rect x="'+nQ(-dx-.6)+'" y="-.34" width="'+nQ(dx*2+1.2)+'" height=".68" fill="'+CQ.redeEsc+'" fill-opacity=".85"/>');
  p.push('<rect x="'+nQ(-dx-.6)+'" y="-.34" width="'+nQ(dx*2+1.2)+'" height=".2" fill="'+CQ.rede+'"/>');

  return { pecas:p.join(''), caixa:b, perto:ladoPerto, longe:ladoLonge };
}

/* ---------- elementos que cada exercício declara ---------- */

function qElemento(e){
  var t = e[0];
  if (t === 'aluno')  return qJogador(e[1], e[2], e[3], 'aluno');
  if (t === 'prof')   return qJogador(e[1], e[2], e[3], 'prof');
  if (t === 'colega') return qJogador(e[1], e[2], e[3], 'colega');
  if (t === 'cone')   return qCone(e[1], e[2], e[3]);
  if (t === 'zona')   return qZona(e[1], e[2], e[3], e[4], e[5]);
  if (t === 'bola')   return qCaminho(e[1], e[2], e[3], e[4], e[5], CQ.bola, true, 'b');
  if (t === 'mov')    return qCaminho(e[1], e[2], e[3], e[4], e[5], CQ.mov, false, 'm');
  if (t === 'texto')  return qTexto(e[1], e[2], e[3], { tam:e[4] || .62 });
  if (t === 'marca')  return '<g><circle cx="'+nQ(e[1])+'" cy="'+nQ(e[2])+'" r=".2" fill="'+CQ.mov+'"/>' +
                             (e[3] ? qTexto(e[1], e[2] + 1.05, e[3], { tam:.55 }) : '') + '</g>';
  if (t === 'escada') {    // escada de agilidade: 6 degraus
    var x = e[1], y = e[2], s = '<g>';
    s += '<rect x="'+nQ(x-.55)+'" y="'+nQ(y-1.8)+'" width="1.1" height="3.6" fill="none" stroke="'+CQ.mov+'" stroke-width=".1"/>';
    for (var i = 1; i < 6; i++) s += qLinha(x-.55, y-1.8 + i*.6, x+.55, y-1.8 + i*.6, .08);
    s += '</g>';
    return s + (e[3] ? qTexto(x, y + 2.5, e[3], { tam:.55 }) : '');
  }
  if (t === 'corda') {     // corda esticada acima da rede
    return '<g><line x1="'+nQ(-QD.duplaX-.6)+'" y1="-.34" x2="'+nQ(QD.duplaX+.6)+'" y2="-.34" ' +
      'stroke="'+CQ.zona+'" stroke-width=".13" stroke-dasharray=".4 .3"/>' +
      qTexto(QD.duplaX - 1.1, -1.15, e[1] || 'corda', { tam:.55, cor:CQ.zona }) + '</g>';
  }
  return '';
}

/* ---------- o desenho pronto ---------- */

function svgQuadra(fig, op){
  if (!fig || !fig.el) return '';
  op = op || {};
  var c = qCorte(fig.base || 'meia');
  var b = c.caixa;
  CAIXA = b;                       // prende os rótulos nesta moldura
  ROTULOS = [];                    // cada desenho começa sem rótulo colocado
  // Reserva o espaço de jogadores e cones ANTES de escrever qualquer rótulo:
  // assim nenhum texto cai em cima de uma pecinha desenhada depois dele.
  fig.el.forEach(function(e){
    if (e[0] === 'aluno' || e[0] === 'prof' || e[0] === 'colega')
      ROTULOS.push({ x:e[1]-.7, y:e[2]-.7, w:1.4, h:1.4 });
    if (e[0] === 'cone')
      ROTULOS.push({ x:e[1]-.5, y:e[2]-.62, w:1.0, h:1.0 });
  });
  var corpo = fig.el.map(qElemento).join('');
  var alt = op.altura ? ' height="'+op.altura+'"' : '';
  var rotulo = fig.nota ? ' aria-label="'+String(fig.nota).replace(/"/g,'&quot;')+'"' : '';
  // a classe do recorte deixa a impressao dar altura diferente para cada tipo:
  // a quadra inteira e' um retrato 1:2 e, na mesma altura das outras, sai estreita
  return '<svg class="qd qd-' + (fig.base || 'meia') + '" viewBox="'+nQ(b.x)+' '+nQ(b.y)+' '+nQ(b.w)+' '+nQ(b.h)+'" ' +
    'width="100%"'+alt+' role="img"'+rotulo+' xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<marker id="seta-bola" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">' +
        '<path d="M 0 1 L 9 5 L 0 9 z" fill="'+CQ.bola+'"/></marker>' +
      '<marker id="seta-mov" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">' +
        '<path d="M 0 1 L 9 5 L 0 9 z" fill="'+CQ.mov+'"/></marker>' +
    '</defs>' +
    '<rect x="'+nQ(b.x)+'" y="'+nQ(b.y)+'" width="'+nQ(b.w)+'" height="'+nQ(b.h)+'" fill="#0E2337"/>' +
    c.pecas + corpo +
  '</svg>';
}

/* Legenda do desenho — as mesmas cores, explicadas uma vez. */
function legendaQuadra(){
  return '<div class="qd-leg">' +
    '<span><i style="background:'+CQ.aluno+'"></i>aluno</span>' +
    '<span><i style="background:'+CQ.prof+'"></i>professor</span>' +
    '<span><i style="background:'+CQ.colega+'"></i>colega</span>' +
    '<span><i class="tr" style="background:'+CQ.bola+'"></i>bola</span>' +
    '<span><i class="tr" style="background:'+CQ.mov+'"></i>deslocamento</span>' +
    '<span><i class="cn" style="background:'+CQ.cone+'"></i>cone</span>' +
    '<span><i class="zn"></i>alvo</span>' +
  '</div>';
}

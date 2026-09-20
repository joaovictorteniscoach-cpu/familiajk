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

   A VISTA É DE TRÁS DO FUNDO, como quem está atrás do aluno olhando para a
   rede — e não mais de cima. Um desenho visto de cima é uma planta: mostra
   posição, mas não mostra a cena. Em perspectiva o professor reconhece o
   exercício como ele acontece, e o aluno vira gente em vez de bolinha.

   O que NÃO mudou: cada exercício continua escrito em METROS DE QUADRA, do
   mesmo jeito. Quem desenha é a câmera. Foi o que permitiu virar os 116
   desenhos de uma vez, sem reescrever nenhum.

   SISTEMA DE COORDENADAS — medidas reais da quadra, em metros
     x: 0 no meio · negativo à esquerda · ±4,115 linha de simples · ±5,485 dupla
     y: 0 na REDE · positivo é o lado do ALUNO (perto da câmera) · 11,885 é a
        linha de base · 6,40 é a linha de saque
     z: altura do chão, só para quem precisa (rede, cone, jogador)

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
  redeMeio: 0.914,   // altura da rede no meio
  redePoste: 1.07,   // altura da rede no poste
  postX: 6.40        // onde fica o poste, a partir do meio
};

/* Cada base é um recorte diferente da quadra, EM METROS. Continua valendo:
   é por esta moldura que o ferramentas/checar-exercicios.js confere se uma
   peça foi colocada fora do desenho. */
const BASES = {
  inteira: { x:-6.9, y:-13.9, w:13.8, h:27.8 },
  meia:    { x:-6.9, y:-3.4,  w:13.8, h:17.8 },
  mini:    { x:-5.7, y:-8.2,  w:11.4, h:16.4 },
  fundo:   { x:-6.9, y:2.9,   w:13.8, h:11.6 }
};

/* Onde a câmera fica em cada recorte. `y` e `alt` são a posição dela em
   metros (atrás da linha de base do aluno e acima do chão); `alvo` é o ponto
   da quadra para onde ela olha, que é o que define a inclinação.
   Quanto mais baixa a câmera, mais "de dentro da quadra" fica o desenho — e
   mais as peças do fundo se espremem uma na outra. Estes números são o meio
   termo: dá para ver a cena e ainda dá para separar duas pessoas no fundo. */
const CAMERAS = {
  inteira: { y: 24.0, alt: 9.6, alvo: 0.0 },
  meia:    { y: 20.0, alt: 7.4, alvo: 3.0 },
  mini:    { y: 19.0, alt: 7.0, alvo: 1.0 },
  fundo:   { y: 18.5, alt: 5.6, alvo: 7.6 }
};

const DIST = 100;      // distância focal: só escala o desenho, o viewBox ajusta

/* Cores do desenho. Saibro de verdade, porque é nele que a JV dá aula. */
const CQ = {
  saibro:'#A85B37', saibroClaro:'#BE7049', saibroEsc:'#95502F', fora:'#8A4C2E',
  linha:'#F4EFE6', rede:'#EFEBE3', redeMalha:'#20313E', poste:'#43535E',
  aluno:'#D8B45C', prof:'#E8EDF2', colega:'#8FB0C9',
  bola:'#D7EE86', mov:'#FFFFFF', cone:'#E0784A', zona:'#D8B45C',
  texto:'#FFFFFF', fundoTx:'rgba(9,22,35,.82)', sombra:'rgba(50,20,10,.34)'
};

/* Modo miniatura: o mesmo desenho, do tamanho de um selo, na lista de
   exercícios. Nesse tamanho o rótulo vira borrão — então ele sai, e o traço
   engrossa para a quadra continuar legível. O que fica é a CENA: de onde sai
   a bola, para onde vai, quem está na rede. É por ela que o professor
   reconhece o exercício de relance. */
let MINI = false;

/* Estado do desenho que está sendo montado. */
let CAM = CAMERAS.meia;      // câmera deste recorte
let VISTA = { x:0, y:0, w:100, h:100 };   // viewBox, em unidades de tela
let ROTULOS = [];            // rótulos já colocados, para não empilhar

function nQ(v){ return Math.round(v * 100) / 100; }

/* ==========================================================================
   A CÂMERA
   ========================================================================== */

/* Projeta um ponto da quadra (metros) na tela. Câmera em (0, CAM.y, CAM.alt)
   olhando para (0, CAM.alvo, 0), inclinada para baixo.
   Devolve {x, y, z} — o z é a profundidade, usada para saber o que desenhar
   primeiro e para encolher o que está longe. */
function proj(x, y, z){
  var a = CAM.y - y;                 // quanto o ponto está à frente da câmera
  var b = CAM.alt - (z || 0);        // quanto está abaixo dela
  var d = Math.sqrt((CAM.y - CAM.alvo) * (CAM.y - CAM.alvo) + CAM.alt * CAM.alt);
  var cos = (CAM.y - CAM.alvo) / d, sen = CAM.alt / d;
  var prof = a * cos + b * sen;      // profundidade
  if (prof < 0.4) prof = 0.4;        // atrás da câmera: prende na frente dela
  var cima = a * sen - b * cos;
  return { x: DIST * x / prof, y: -DIST * cima / prof, z: prof };
}

/* Quanto um metro vale, em unidades de tela, à profundidade de um ponto.
   É o que faz o jogador do fundo ser menor que o da rede sem nenhuma conta
   extra em cada peça. */
function escalaEm(p){ return DIST / p.z; }

/* O enquadramento é a AÇÃO, não o recorte inteiro.
   Enquadrar o recorte todo deixava o exercício pequeno no meio de um mar de
   saibro: de trás da linha de base, os cantos de perto abrem muito e mandam na
   largura. Então mede-se onde as peças estão, na tela, e aperta-se nelas —
   com um mínimo de quadra em volta para o desenho dizer ONDE aquilo acontece.
   A câmera não muda; muda só o quanto dela se mostra. */
function enquadrar(base, el){
  var b = BASES[base] || BASES.meia;
  var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, achou = false;
  function por(x, y, z, folgaM){
    if (typeof x !== 'number' || typeof y !== 'number') return;
    var p = proj(x, y, z || 0);
    var f = (folgaM || 0) * escalaEm(p);
    achou = true;
    x1 = Math.min(x1, p.x - f); x2 = Math.max(x2, p.x + f);
    y1 = Math.min(y1, p.y - f); y2 = Math.max(y2, p.y + f);
  }
  (el || []).forEach(function(e){
    var t = e[0];
    if (t === 'aluno' || t === 'prof' || t === 'colega') {
      por(e[1], e[2], 0, 1.0); por(e[1], e[2], 1.95, 0.8);   // o boneco sobe do chão
    } else if (t === 'cone' || t === 'marca') { por(e[1], e[2], 0, 0.9); }
    else if (t === 'escada') { por(e[1], e[2] - 2.0, 0, .8); por(e[1], e[2] + 2.0, 0, .8); }
    else if (t === 'zona') {
      por(e[1] - e[3] / 2, e[2] - e[4] / 2, 0, .5); por(e[1] + e[3] / 2, e[2] + e[4] / 2, 0, .5);
    } else if (t === 'bola' || t === 'mov') { por(e[1], e[2], 0, .7); por(e[3], e[4], 0, .7); }
    else if (t === 'corda') { por(-QD.postX, 0, 1.9, .4); por(QD.postX, 0, 1.9, .4); }
  });

  // exercício sem peça nenhuma (quadra vazia): mostra o recorte
  if (!achou) {
    [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].forEach(function(c){
      por(c[0], c[1], 0, 0);
    });
  }

  // um mínimo de quadra em volta: sem isso, dois jogadores lado a lado viram
  // um retrato deles, e o desenho deixa de dizer ONDE na quadra aquilo
  // acontece — que é metade do que ele serve para contar. O mínimo é uma
  // fração do recorte inteiro, e não uma medida fixa: assim vale igual para o
  // recorte do fundo e para o da quadra inteira.
  var meioY = (y1 + y2) / 2, meioX = (x1 + x2) / 2;
  var fx1 = Infinity, fy1 = Infinity, fx2 = -Infinity, fy2 = -Infinity;
  [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].forEach(function(c){
    var q = proj(c[0], c[1], 0);
    fx1 = Math.min(fx1, q.x); fx2 = Math.max(fx2, q.x);
    fy1 = Math.min(fy1, q.y); fy2 = Math.max(fy2, q.y);
  });
  var minLarg = (fx2 - fx1) * 0.60, minAlt = (fy2 - fy1) * 0.60;
  if (x2 - x1 < minLarg) { x1 = meioX - minLarg / 2; x2 = meioX + minLarg / 2; }
  if (y2 - y1 < minAlt)  { y1 = meioY - minAlt / 2;  y2 = meioY + minAlt / 2; }

  // formato: mais largo que alto, como uma foto de quadra
  var alvo = MINI ? 1.30 : 1.42;
  var lg = x2 - x1, at = y2 - y1;
  if (lg / at < alvo) { var fa = (at * alvo - lg) / 2; x1 -= fa; x2 += fa; lg = at * alvo; }
  else { var fb = (lg / alvo - at) / 2; y1 -= fb; y2 += fb; at = lg / alvo; }
  // o meio vertical volta para onde a ação está, senão a moldura sobe demais
  var desvio = meioY - (y1 + y2) / 2;
  y1 += desvio * 0.35; y2 += desvio * 0.35;
  return { x:x1, y:y1, w:x2 - x1, h:y2 - y1 };
}

/* ==========================================================================
   PEÇAS DO CHÃO — tudo o que está deitado na quadra vira polígono projetado,
   e não traço de espessura fixa. É o que dá a perspectiva certa: a linha de
   base, que está longe, sai mais fina que a de perto — sozinha, sem truque.
   ========================================================================== */

function pol(pontos, preenche, op){
  var d = pontos.map(function(p){ var q = proj(p[0], p[1], p[2] || 0);
    return nQ(q.x) + ',' + nQ(q.y); }).join(' ');
  return '<polygon points="' + d + '" fill="' + preenche + '"' + (op || '') + '/>';
}

/* Uma faixa deitada no chão, de largura real em metros. */
function faixa(x1, y1, x2, y2, larg, cor){
  var dx = x2 - x1, dy = y2 - y1;
  var c = Math.sqrt(dx * dx + dy * dy) || 1;
  var nx = -dy / c * larg / 2, ny = dx / c * larg / 2;
  return pol([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny],
              [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], cor || CQ.linha);
}

/* ==========================================================================
   A QUADRA
   ========================================================================== */

function piso(base){
  var dx = QD.duplaX, sx = QD.simplesX, fy = QD.fundoY, sy = QD.saqueY;
  var lw = 0.05, lwBase = 0.10;          // largura real das linhas, em metros
  var p = [];

  // o saibro de fora, bem largo: cobre o que a moldura mostrar
  p.push(pol([[-24, -26], [24, -26], [24, 26], [-24, 26]], CQ.fora));
  // a área de jogo, um tom mais claro, com a sobra de saibro em volta. A
  // sobra atrás da linha de base é generosa (8 m, como numa quadra de verdade)
  // porque é ela que aparece no alto do desenho: com pouca sobra, o saibro
  // escuro de fora virava uma faixa preta atravessando o topo.
  p.push(pol([[-dx - 4.2, -fy - 8.0], [dx + 4.2, -fy - 8.0],
              [dx + 4.2, fy + 8.0], [-dx - 4.2, fy + 8.0]], CQ.saibro));
  p.push(pol([[-dx, -fy], [dx, -fy], [dx, fy], [-dx, fy]], CQ.saibroClaro));

  // as linhas
  [-dx, dx].forEach(function(x){ p.push(faixa(x, -fy, x, fy, lw)); });
  [-sx, sx].forEach(function(x){ p.push(faixa(x, -fy, x, fy, lw)); });
  p.push(faixa(-dx, fy, dx, fy, lwBase));
  p.push(faixa(-dx, -fy, dx, -fy, lwBase));
  p.push(faixa(-sx, sy, sx, sy, lw));
  p.push(faixa(-sx, -sy, sx, -sy, lw));
  p.push(faixa(0, -sy, 0, sy, lw));
  p.push(faixa(0, fy - 0.3, 0, fy, lwBase));
  p.push(faixa(0, -fy, 0, -fy + 0.3, lwBase));
  return p.join('');
}

/* A rede, de frente: malha, fita branca em cima e os dois postes. A barriga
   no meio é de verdade — 0,914 m no centro contra 1,07 m no poste. */
function rede(){
  var px = QD.postX, n = 14, p = [], i, x, alt;
  function alturaEm(x){
    var t = Math.abs(x) / px;
    return QD.redeMeio + (QD.redePoste - QD.redeMeio) * t * t;
  }
  // a malha: um polígono que acompanha a barriga
  var cima = [], baixo = [];
  for (i = 0; i <= n; i++) {
    x = -px + (2 * px) * i / n;
    cima.push([x, 0, alturaEm(x)]);
    baixo.push([x, 0, 0]);
  }
  p.push(pol(cima.concat(baixo.slice().reverse()), CQ.redeMalha, ' fill-opacity=".38"'));
  // os fios verticais, que é o que faz parecer rede e não parede
  for (i = 1; i < n; i++) {
    x = -px + (2 * px) * i / n;
    var a = proj(x, 0, 0), b = proj(x, 0, alturaEm(x));
    p.push('<line x1="' + nQ(a.x) + '" y1="' + nQ(a.y) + '" x2="' + nQ(b.x) + '" y2="' + nQ(b.y) +
           '" stroke="' + CQ.rede + '" stroke-opacity=".30" stroke-width="' + nQ(traco(0.018, a)) + '"/>');
  }
  // a fita branca de cima
  var fita = [], fitaB = [];
  for (i = 0; i <= n; i++) {
    x = -px + (2 * px) * i / n;
    alt = alturaEm(x);
    fita.push([x, 0, alt]);
    fitaB.push([x, 0, alt - 0.06]);
  }
  p.push(pol(fita.concat(fitaB.slice().reverse()), CQ.rede));
  // os postes
  [-px, px].forEach(function(xp){
    p.push(faixaVertical(xp, 0, QD.redePoste + 0.08, 0.12, CQ.poste));
  });
  return p.join('');
}

/* Um pedaço em pé (poste, haste): retângulo entre o chão e uma altura. */
function faixaVertical(x, y, alt, larg, cor){
  return pol([[x - larg / 2, y, 0], [x + larg / 2, y, 0],
              [x + larg / 2, y, alt], [x - larg / 2, y, alt]], cor);
}

/* Espessura de traço que respeita a distância. */
function traco(metros, p){
  return Math.max(0.35, metros * escalaEm(p) * (MINI ? 1.9 : 1));
}

/* ==========================================================================
   OS BONECOS
   ========================================================================== */

/* Um jogador, em pé, de costas para quem olha (é a vista de trás do fundo).
   Desenhado dentro de uma caixa de 1,78 m de altura e projetado nela — então
   quem está no fundo sai menor, sozinho, sem nenhum ajuste por exercício. */
function qJogador(x, y, rot, tipo){
  var cor = tipo === 'prof' ? CQ.prof : (tipo === 'colega' ? CQ.colega : CQ.aluno);
  var altura = 1.78;
  var pe = proj(x, y, 0), cabeca = proj(x, y, altura);
  var h = pe.y - cabeca.y;                    // altura na tela
  if (h < 3) h = 3;
  var l = h * 0.40;                           // largura do boneco
  var cx = (pe.x + cabeca.x) / 2;
  var base = pe.y;
  var esc = h / 100;                          // unidade local: 1/100 da altura
  function u(v){ return nQ(v * esc); }
  var s = '<g>';
  // a sombra no chão, que é o que gruda o boneco na quadra
  s += '<ellipse cx="' + nQ(cx) + '" cy="' + nQ(base) + '" rx="' + u(26) + '" ry="' + u(7) +
       '" fill="' + CQ.sombra + '"/>';
  // pernas, tronco e cabeça, num caminho só
  s += '<path d="' +
    'M ' + nQ(cx - l * 0.30) + ' ' + nQ(base) +
    ' L ' + nQ(cx - l * 0.26) + ' ' + nQ(base - h * 0.44) +
    ' L ' + nQ(cx + l * 0.26) + ' ' + nQ(base - h * 0.44) +
    ' L ' + nQ(cx + l * 0.30) + ' ' + nQ(base) +
    ' L ' + nQ(cx + l * 0.10) + ' ' + nQ(base) +
    ' L ' + nQ(cx) + ' ' + nQ(base - h * 0.40) +
    ' L ' + nQ(cx - l * 0.10) + ' ' + nQ(base) + ' Z" fill="' + cor + '"/>';
  s += '<path d="' +
    'M ' + nQ(cx - l * 0.34) + ' ' + nQ(base - h * 0.40) +
    ' L ' + nQ(cx - l * 0.42) + ' ' + nQ(base - h * 0.74) +
    ' Q ' + nQ(cx) + ' ' + nQ(base - h * 0.86) + ' ' + nQ(cx + l * 0.42) + ' ' + nQ(base - h * 0.74) +
    ' L ' + nQ(cx + l * 0.34) + ' ' + nQ(base - h * 0.40) + ' Z" fill="' + cor + '"/>';
  s += '<circle cx="' + nQ(cx) + '" cy="' + nQ(base - h * 0.90) + '" r="' + u(9) + '" fill="' + cor + '"/>';
  // o braço com a raquete: é ele que diz "tênis" antes de qualquer legenda
  var bx = cx + l * 0.62, by = base - h * 0.60;
  s += '<line x1="' + nQ(cx + l * 0.38) + '" y1="' + nQ(base - h * 0.70) +
       '" x2="' + nQ(bx) + '" y2="' + nQ(by) + '" stroke="' + cor +
       '" stroke-width="' + u(7) + '" stroke-linecap="round"/>';
  s += '<line x1="' + nQ(bx) + '" y1="' + nQ(by) + '" x2="' + nQ(bx + l * 0.22) + '" y2="' + nQ(by - h * 0.10) +
       '" stroke="' + cor + '" stroke-width="' + u(4) + '"/>';
  s += '<ellipse cx="' + nQ(bx + l * 0.34) + '" cy="' + nQ(by - h * 0.17) + '" rx="' + u(11) + '" ry="' + u(14) +
       '" fill="none" stroke="' + cor + '" stroke-width="' + u(4) + '"/>';
  s += '</g>';
  if (rot) s += qTexto(cx, base + h * 0.16, rot, { tam:h * 0.20 });
  return s;
}

function qCone(x, y, rot){
  // 0,52 m e não os 0,42 do cone de verdade: a 10 metros da câmera, um cone
  // na medida certa virava um ponto laranja de três pixels.
  var pe = proj(x, y, 0), topo = proj(x, y, 0.52);
  var h = pe.y - topo.y, l = h * 0.66;
  var cx = (pe.x + topo.x) / 2;
  var s = '<g>';
  s += '<ellipse cx="' + nQ(cx) + '" cy="' + nQ(pe.y) + '" rx="' + nQ(l * 0.62) + '" ry="' + nQ(l * 0.20) +
       '" fill="' + CQ.sombra + '"/>';
  s += '<path d="M ' + nQ(cx) + ' ' + nQ(topo.y) + ' L ' + nQ(cx + l / 2) + ' ' + nQ(pe.y) +
       ' L ' + nQ(cx - l / 2) + ' ' + nQ(pe.y) + ' Z" fill="' + CQ.cone + '"/>';
  s += '</g>';
  if (rot) s += qTexto(cx, pe.y + h * 0.5, rot, { tam:h * 0.55 });
  return s;
}

/* Alvo no chão: quatro cantos projetados. Em perspectiva ele deita na quadra
   sozinho, em vez de ficar um retângulo colado por cima do desenho. */
function qZona(x, y, larg, alt, rot){
  var cantos = [[x - larg/2, y - alt/2], [x + larg/2, y - alt/2],
                [x + larg/2, y + alt/2], [x - larg/2, y + alt/2]];
  var meio = proj(x, y, 0);
  var d = cantos.map(function(c){ var q = proj(c[0], c[1], 0); return nQ(q.x) + ',' + nQ(q.y); }).join(' ');
  var s = '<g><polygon points="' + d + '" fill="' + CQ.zona + '" fill-opacity="' + (MINI ? '.40' : '.24') +
    '" stroke="' + CQ.zona + '" stroke-width="' + nQ(traco(0.07, meio)) +
    '" stroke-dasharray="' + nQ(traco(0.34, meio)) + ' ' + nQ(traco(0.24, meio)) + '"/></g>';
  if (rot) s += qTexto(meio.x, meio.y, rot, { tam:escalaEm(meio) * 0.42, fundo:'rgba(9,22,35,.7)' });
  return s;
}

/* Caminho no chão entre dois pontos, com a curva do exercício. É amostrado em
   pedaços e projetado pedaço a pedaço: uma reta na quadra não é uma reta na
   tela depois da perspectiva, e ligar só as pontas saía torto. */
function qCaminho(x1, y1, x2, y2, curva, cor, tracejado, marcador){
  var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
  var comp = Math.sqrt(dx * dx + dy * dy) || 1;
  var cx = mx - dy / comp * (curva || 0) * comp * 0.5;
  var cy = my + dx / comp * (curva || 0) * comp * 0.5;
  var n = 16, d = '', i, t, px2, py2, p;
  for (i = 0; i <= n; i++) {
    t = i / n;
    px2 = (1-t)*(1-t)*x1 + 2*(1-t)*t*cx + t*t*x2;
    py2 = (1-t)*(1-t)*y1 + 2*(1-t)*t*cy + t*t*y2;
    p = proj(px2, py2, 0);
    d += (i ? ' L ' : 'M ') + nQ(p.x) + ' ' + nQ(p.y);
  }
  var meio = proj(cx, cy, 0);
  var w = traco(0.11, meio);
  return '<path d="' + d + '" fill="none" stroke="' + cor + '" stroke-width="' + nQ(w) +
    '" stroke-linecap="round" stroke-linejoin="round"' +
    (tracejado ? ' stroke-dasharray="' + nQ(w * 2.1) + ' ' + nQ(w * 1.5) + '"' : '') +
    ' marker-end="url(#' + marcador + ')"/>';
}

/* ==========================================================================
   RÓTULOS — já em unidades de tela, porque é na tela que eles têm que caber
   ========================================================================== */

function bate(a, b){
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

/* Acha onde o rótulo cabe: desce, sobe, e por fim anda para os lados. Sem o
   passo lateral, três rótulos perto do mesmo jogador acabavam empilhados em
   cima dele — e um desenho com o nome do exercício escrito por cima do aluno
   não serve para nada. Devolve [x, y]. */
function lugarLivre(x, y, w, h){
  var passo = h * 1.1, lado = w * 0.55, i, j, cand;
  var desvios = [0, lado, -lado, lado * 2, -lado * 2];
  for (j = 0; j < desvios.length; j++) {
    for (i = 0; i < 8; i++) {
      cand = { x:x + desvios[j], y:y + passo * i, w:w, h:h };
      if (dentroDaVista(cand) && !ROTULOS.some(function(r){ return bate(cand, r); })) return [cand.x, cand.y];
      cand = { x:x + desvios[j], y:y - passo * i, w:w, h:h };
      if (i && dentroDaVista(cand) && !ROTULOS.some(function(r){ return bate(cand, r); })) return [cand.x, cand.y];
    }
  }
  return [x, y];
}

function dentroDaVista(c){
  return c.x >= VISTA.x && c.x + c.w <= VISTA.x + VISTA.w &&
         c.y >= VISTA.y && c.y + c.h <= VISTA.y + VISTA.h;
}

function qTexto(x, y, txt, op){
  if (MINI) return '';
  op = op || {};
  var tam = Math.max(VISTA.w * 0.026, Math.min(op.tam || VISTA.w * 0.032, VISTA.w * 0.042));
  var margem = VISTA.w * 0.012;
  var cabe = VISTA.w - margem * 2;
  var larg = String(txt).length * tam * 0.56 + tam * 0.8;
  if (larg > cabe) { tam = tam * cabe / larg; larg = cabe; }
  var esq = VISTA.x + margem, dir = VISTA.x + VISTA.w - margem;
  var dx = -larg / 2;
  if (x + dx < esq)        x = esq - dx;
  if (x + dx + larg > dir) x = dir - larg - dx;
  var alt = tam * 1.5;
  var pos = lugarLivre(x + dx, y - tam * 0.75, larg, alt);
  var esqX = Math.max(esq, Math.min(pos[0], dir - larg));
  var cima = Math.max(VISTA.y, Math.min(pos[1], VISTA.y + VISTA.h - alt));
  x = esqX - dx;
  ROTULOS.push({ x:esqX, y:cima, w:larg, h:alt });
  return '<g>' +
    '<rect x="' + nQ(esqX) + '" y="' + nQ(cima) + '" width="' + nQ(larg) + '" height="' + nQ(alt) +
      '" rx="' + nQ(tam * 0.4) + '" fill="' + (op.fundo || CQ.fundoTx) + '"/>' +
    // textLength manda o navegador caber o texto na largura calculada. Sem isso
    // a conta de largura é só estimativa, e uma frase mais larga que a
    // estimativa vaza para fora do desenho e some.
    '<text x="' + nQ(x) + '" y="' + nQ(cima + alt * 0.72) + '" text-anchor="middle" fill="' +
      (op.cor || CQ.texto) + '" font-size="' + nQ(tam) + '" font-weight="700" textLength="' +
      nQ(Math.max(larg - tam * 0.8, tam)) + '" lengthAdjust="spacingAndGlyphs">' +
      String(txt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
    '</text></g>';
}

/* ==========================================================================
   OS ELEMENTOS QUE CADA EXERCÍCIO DECLARA
   ========================================================================== */

function qElemento(e){
  var t = e[0];
  if (t === 'aluno')  return qJogador(e[1], e[2], e[3], 'aluno');
  if (t === 'prof')   return qJogador(e[1], e[2], e[3], 'prof');
  if (t === 'colega') return qJogador(e[1], e[2], e[3], 'colega');
  if (t === 'cone')   return qCone(e[1], e[2], e[3]);
  if (t === 'zona')   return qZona(e[1], e[2], e[3], e[4], e[5]);
  if (t === 'bola')   return qCaminho(e[1], e[2], e[3], e[4], e[5], CQ.bola, true, 'seta-bola');
  if (t === 'mov')    return qCaminho(e[1], e[2], e[3], e[4], e[5], CQ.mov, false, 'seta-mov');
  if (t === 'texto')  { var pt = proj(e[1], e[2], 0); return qTexto(pt.x, pt.y, e[3], {}); }
  if (t === 'marca') {
    var p = proj(e[1], e[2], 0), r = Math.max(0.6, escalaEm(p) * 0.12);
    return '<g><ellipse cx="' + nQ(p.x) + '" cy="' + nQ(p.y) + '" rx="' + nQ(r) + '" ry="' + nQ(r * 0.4) +
      '" fill="' + CQ.mov + '"/></g>' +
      (e[3] ? qTexto(p.x, p.y + r * 2.4, e[3], {}) : '');
  }
  if (t === 'escada') {              // escada de agilidade: 6 degraus no chão
    var x = e[1], y = e[2], s = '<g>', i;
    s += faixa(x - 0.55, y - 1.8, x - 0.55, y + 1.8, 0.06, CQ.mov);
    s += faixa(x + 0.55, y - 1.8, x + 0.55, y + 1.8, 0.06, CQ.mov);
    for (i = 0; i <= 6; i++) s += faixa(x - 0.55, y - 1.8 + i * 0.6, x + 0.55, y - 1.8 + i * 0.6, 0.05, CQ.mov);
    s += '</g>';
    return s + (e[3] ? qTexto(proj(x, y + 2.2, 0).x, proj(x, y + 2.2, 0).y, e[3], {}) : '');
  }
  if (t === 'corda') {               // corda esticada acima da rede
    var a = proj(-QD.postX, 0, 1.75), b = proj(QD.postX, 0, 1.75);
    return '<g><line x1="' + nQ(a.x) + '" y1="' + nQ(a.y) + '" x2="' + nQ(b.x) + '" y2="' + nQ(b.y) +
      '" stroke="' + CQ.zona + '" stroke-width="' + nQ(traco(0.05, a)) +
      '" stroke-dasharray="' + nQ(traco(0.3, a)) + ' ' + nQ(traco(0.22, a)) + '"/></g>' +
      qTexto(b.x, b.y - VISTA.h * 0.03, e[1] || 'corda', { cor:CQ.zona });
  }
  return '';
}

/* O y de quem está mais longe é menor. Desenhar do fundo para a frente é o que
   faz o jogador da rede aparecer na frente da rede, e o do fundo, atrás dela. */
function profundidadeDe(e){
  var t = e[0];
  if (t === 'bola' || t === 'mov') return Math.min(e[2], e[4]) - 0.01;
  if (t === 'zona' || t === 'corda') return -99;     // alvo e corda ficam no chão, antes de tudo
  if (typeof e[2] === 'number') return e[2];
  return 0;
}

/* ==========================================================================
   O DESENHO PRONTO
   ========================================================================== */

function svgQuadra(fig, op){
  if (!fig || !fig.el) return '';
  op = op || {};
  MINI = !!op.mini;
  var base = fig.base || 'meia';
  CAM = CAMERAS[base] || CAMERAS.meia;
  VISTA = enquadrar(base, fig.el);

  // Reserva o espaço dos bonecos e dos cones ANTES de escrever qualquer
  // rótulo. Sem isso o rótulo caía em cima do aluno — e um desenho com o texto
  // escrito por cima da pessoa não serve para nada.
  ROTULOS = [];
  fig.el.forEach(function(e){
    var t = e[0];
    if (t === 'aluno' || t === 'prof' || t === 'colega') {
      var pe = proj(e[1], e[2], 0), ca = proj(e[1], e[2], 1.95);
      var h = pe.y - ca.y, l = h * 0.5;
      ROTULOS.push({ x:pe.x - l, y:ca.y, w:l * 2, h:h });
    } else if (t === 'cone') {
      var q = proj(e[1], e[2], 0), e2 = escalaEm(q);
      ROTULOS.push({ x:q.x - e2 * .3, y:q.y - e2 * .5, w:e2 * .6, h:e2 * .6 });
    }
  });

  // do fundo para a frente, com a rede no lugar dela (y = 0)
  var ordenados = fig.el.slice().sort(function(a, b){
    return profundidadeDe(a) - profundidadeDe(b);
  });
  var antes = '', depois = '';
  ordenados.forEach(function(e){
    if (profundidadeDe(e) < 0) antes += qElemento(e); else depois += qElemento(e);
  });

  // A seta do SVG é medida em espessuras de traço, e o traço agora engrossa
  // com a perspectiva. Com os valores antigos a ponta ficava maior que a
  // flecha inteira na miniatura.
  var m = MINI ? 3.4 : 3.0;
  var alt = op.altura ? ' height="' + op.altura + '"' : '';
  var rotulo = fig.nota ? ' aria-label="' + String(fig.nota).replace(/"/g, '&quot;') + '"' : '';
  return '<svg class="qd' + (MINI ? ' qd-mini-selo' : '') + ' qd-' + base + '" viewBox="' +
    nQ(VISTA.x) + ' ' + nQ(VISTA.y) + ' ' + nQ(VISTA.w) + ' ' + nQ(VISTA.h) + '" ' +
    'width="100%"' + alt + ' role="img"' + rotulo + ' xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<marker id="seta-bola" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="' + m + '" markerHeight="' + m +
        '" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill="' + CQ.bola + '"/></marker>' +
      '<marker id="seta-mov" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="' + (m * 0.9) + '" markerHeight="' + (m * 0.9) +
        '" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill="' + CQ.mov + '"/></marker>' +
      '<linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#13293D"/><stop offset="1" stop-color="#26404F"/></linearGradient>' +
    '</defs>' +
    '<rect x="' + nQ(VISTA.x) + '" y="' + nQ(VISTA.y) + '" width="' + nQ(VISTA.w) + '" height="' + nQ(VISTA.h) +
      '" fill="url(#ceu)"/>' +
    piso(base) + antes + rede() + depois +
  '</svg>';
}

/* Legenda do desenho — as mesmas cores, explicadas uma vez. */
function legendaQuadra(){
  return '<div class="qd-leg">' +
    '<span><i style="background:' + CQ.aluno + '"></i>aluno</span>' +
    '<span><i style="background:' + CQ.prof + '"></i>professor</span>' +
    '<span><i style="background:' + CQ.colega + '"></i>colega</span>' +
    '<span><i class="tr" style="background:' + CQ.bola + '"></i>bola</span>' +
    '<span><i class="tr" style="background:' + CQ.mov + '"></i>deslocamento</span>' +
    '<span><i class="cn" style="background:' + CQ.cone + '"></i>cone</span>' +
    '<span><i class="zn"></i>alvo</span>' +
  '</div>';
}

/* Gera o icone do Banco de Exercicios.
   --------------------------------------------------------------------------
   Por que existe: os apps da JV usam todos o mesmo logo, e na tela de inicio
   do celular viram tres icones iguais. Este aqui se diferencia pelo ASSUNTO —
   a quadra de saibro vista de cima, com o trajeto da bola — que e' exatamente
   a linguagem dos desenhos do banco. A familia se mantem pelo verde-limao da
   marca e pela pastilha com o nome embaixo — detalhes
   tirados do proprio icone da Gestao, que tem "GESTAO" escrito no mesmo lugar.
   O fundo e' o verde premium do app (#041A13), o mesmo da tela.

   Uso, a partir da raiz do repositorio:
       node ferramentas/gerar-icone-exercicios.js
   Escreve os PNGs direto em app-exercicios/.
*/
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const LIMA = '#CBDD4B', LIMA_CLARO = '#E2F06B';
const SAIBRO = '#B0653F', SAIBRO_ESC = '#8E4E30', LINHA = '#FFFFFF';

/* A quadra vista de cima — as mesmas proporcoes do desenho do app. */
function quadra(cx, cy, larg, alt){
  const x = cx - larg/2, y = cy - alt/2;
  const lw = larg * 0.036;          // espessura das linhas
  const sx = larg * 0.155;          // recuo da linha de simples
  const sy = alt * 0.27;            // linha de saque, a partir da rede
  return `
    <g>
      <rect x="${x}" y="${y}" width="${larg}" height="${alt}" rx="${larg*0.05}" fill="${SAIBRO}"/>
      <rect x="${x}" y="${cy-alt*0.09}" width="${larg}" height="${alt*0.18}" fill="${SAIBRO_ESC}" opacity=".28"/>
      <g stroke="${LINHA}" stroke-width="${lw}" fill="none" stroke-linecap="square">
        <rect x="${x+lw}" y="${y+lw}" width="${larg-lw*2}" height="${alt-lw*2}"/>
        <line x1="${x+sx}" y1="${y+lw}" x2="${x+sx}" y2="${y+alt-lw}"/>
        <line x1="${x+larg-sx}" y1="${y+lw}" x2="${x+larg-sx}" y2="${y+alt-lw}"/>
        <line x1="${x+sx}" y1="${cy-sy}" x2="${x+larg-sx}" y2="${cy-sy}"/>
        <line x1="${x+sx}" y1="${cy+sy}" x2="${x+larg-sx}" y2="${cy+sy}"/>
        <line x1="${cx}" y1="${cy-sy}" x2="${cx}" y2="${cy+sy}"/>
      </g>
      <rect x="${x-larg*0.022}" y="${cy-alt*0.019}" width="${larg*1.044}" height="${alt*0.038}"
            rx="${alt*0.019}" fill="#EFEBE3"/>
    </g>`;
}

/* O trajeto da bola: a assinatura dos desenhos do banco. */
function trajeto(S){
  const cy = 0.440;                 // o mesmo centro da quadra
  return `
    <circle cx="${S*(0.5-0.090)}" cy="${S*(cy-0.181)}" r="${S*0.026}" fill="#fff"/>
    <path d="M ${S*(0.5-0.079)} ${S*(cy-0.170)}
             Q ${S*(0.5+0.086)} ${S*(cy-0.017)} ${S*(0.5+0.089)} ${S*(cy+0.136)}"
      fill="none" stroke="${LIMA_CLARO}" stroke-width="${S*0.043}" stroke-linecap="round"
      marker-end="url(#pta)"/>`;
}

/* A pastilha com o nome, na mesma altura em que a Gestao e o Aluno trazem a
   delas: encostada na borda de baixo, limao com a letra escura. */
function rotulo(S){
  const larg = S*0.64, alt = S*0.108;
  const x = (S-larg)/2, y = S*0.925 - alt;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${larg}" height="${alt}" rx="${alt/2}" fill="${LIMA}"/>
      <text x="${S*0.5}" y="${y+alt*0.72}" text-anchor="middle"
            font-family="Liberation Sans, Arial, sans-serif" font-weight="700"
            font-size="${alt*0.60}" letter-spacing="${alt*0.09}"
            fill="#0B0E13">EXERC\u00cdCIOS</text>
    </g>`;
}

/* `mascara` = versao para Android, que recorta o icone num circulo: o desenho
   encolhe para caber na area segura e a borda sai (ela seria cortada). */
function svgIcone(S, mascara){
  // Sem canto arredondado no arquivo: o iPhone e o Android ja' aplicam a
  // mascara deles. Arredondar aqui tambem arredondava duas vezes, e sobrava
  // uma casquinha preta na borda do icone na tela de inicio.
  const r = 0;
  // 0.72 e nao 0.82: com a pastilha, o desenho ficou mais largo e mais alto,
  // e as pontas dela passavam do circulo seguro que o Android recorta.
  const k = mascara ? 0.72 : 1;               // escala do conteudo
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <defs>
      <linearGradient id="fundo" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stop-color="#0B3A2B"/><stop offset="1" stop-color="#041A13"/>
      </linearGradient>
      <marker id="pta" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3.5" markerHeight="3.5"
              orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill="${LIMA_CLARO}"/></marker>
      <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="${S*0.012}" stdDeviation="${S*0.018}" flood-color="#000" flood-opacity=".55"/>
      </filter>
    </defs>
    <rect width="${S}" height="${S}" rx="${r}" fill="url(#fundo)"/>
    ${mascara ? '' : `<rect x="${S*0.072}" y="${S*0.072}" width="${S*0.856}" height="${S*0.856}"
      rx="${S*0.17}" fill="none" stroke="${LIMA}" stroke-width="${S*0.026}"/>`}
    <g transform="translate(${S*0.5} ${S*0.5}) scale(${k}) translate(${-S*0.5} ${-S*0.5})">
      <g filter="url(#sombra)">${quadra(S*0.5, S*0.440, S*0.465, S*0.600)}</g>
      ${trajeto(S)}
      ${rotulo(S)}
    </g>
  </svg>`;
}

const DESTINO = path.join(__dirname, '..', 'app-exercicios');
const SAIDAS = [
  { arq:'jv-icone-exercicios-192.png',  tam:192, mascara:false },
  { arq:'jv-icone-exercicios-512.png',  tam:512, mascara:false },
  { arq:'jv-icone-exercicios.png',      tam:512, mascara:false },
  { arq:'jv-icone-exercicios-180.png',  tam:180, mascara:false },
  { arq:'jv-icone-exercicios-mask.png', tam:512, mascara:true  }
];

(async () => {
  const nav = await chromium.launch();
  for (const s of SAIDAS) {
    const ctx = await nav.newContext({ viewport:{ width:s.tam, height:s.tam }, deviceScaleFactor:1 });
    const p = await ctx.newPage();
    await p.setContent(`<body style="margin:0;background:transparent">${svgIcone(s.tam, s.mascara)}</body>`);
    await p.waitForTimeout(120);
    await p.screenshot({ path: path.join(DESTINO, s.arq), omitBackground: true });
    await ctx.close();
    const kb = fs.statSync(path.join(DESTINO, s.arq)).size / 1024;
    console.log(`  ${s.arq.padEnd(30)} ${s.tam}px  ${kb.toFixed(0)} KB${s.mascara ? '  (maskable)' : ''}`);
  }
  await nav.close();
  console.log('icones gerados em app-exercicios/');
})();

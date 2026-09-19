/* Gera o icone do Banco de Exercicios.
   --------------------------------------------------------------------------
   Por que existe: os apps da JV usam todos o mesmo logo, e na tela de inicio
   do celular viram tres icones iguais. Este aqui se diferencia pelo ASSUNTO —
   a quadra de saibro vista de cima, com o trajeto da bola — que e' exatamente
   a linguagem dos 116 desenhos do banco. A familia se mantem pelo preto e pelo
   verde-limao da marca (tirados do proprio icone da Gestao).

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
function trajeto(S, k){
  return `
    <circle cx="${S*(0.5-0.115*k)}" cy="${S*(0.5-0.235*k)}" r="${S*0.028*k}" fill="#fff"/>
    <path d="M ${S*(0.5-0.10*k)} ${S*(0.5-0.22*k)}
             Q ${S*(0.5+0.11*k)} ${S*(0.5-0.02*k)} ${S*(0.5+0.115*k)} ${S*(0.5+0.175*k)}"
      fill="none" stroke="${LIMA_CLARO}" stroke-width="${S*0.046*k}" stroke-linecap="round"
      marker-end="url(#pta)"/>`;
}

/* `mascara` = versao para Android, que recorta o icone num circulo: o desenho
   encolhe para caber na area segura e a borda sai (ela seria cortada). */
function svgIcone(S, mascara){
  // Sem canto arredondado no arquivo: o iPhone e o Android ja' aplicam a
  // mascara deles. Arredondar aqui tambem arredondava duas vezes, e sobrava
  // uma casquinha preta na borda do icone na tela de inicio.
  const r = 0;
  const k = mascara ? 0.82 : 1;               // escala do conteudo
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <defs>
      <linearGradient id="fundo" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stop-color="#151A22"/><stop offset="1" stop-color="#07090D"/>
      </linearGradient>
      <marker id="pta" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3.5" markerHeight="3.5"
              orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill="${LIMA_CLARO}"/></marker>
      <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="${S*0.012}" stdDeviation="${S*0.018}" flood-color="#000" flood-opacity=".55"/>
      </filter>
    </defs>
    <rect width="${S}" height="${S}" rx="${r}" fill="url(#fundo)"/>
    ${mascara ? '' : `<rect x="${S*0.052}" y="${S*0.052}" width="${S*0.896}" height="${S*0.896}"
      rx="${S*0.17}" fill="none" stroke="${LIMA}" stroke-width="${S*0.026}"/>`}
    <g filter="url(#sombra)">${quadra(S*0.5, S*0.5, S*0.60*k, S*0.775*k)}</g>
    ${trajeto(S, k)}
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

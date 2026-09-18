/* Confere o banco de exercicios (app-exercicios/exercicios.js).
   Pega o erro que NAO aparece na tela: um filtro escrito errado nao da erro
   nenhum, o exercicio simplesmente desaparece da busca.
   Uso, a partir da raiz do repositorio:  node ferramentas/checar-exercicios.js */
const fs = require('fs');
const src = fs.readFileSync('app-exercicios/exercicios.js', 'utf8');

// o arquivo e' declarativo (const + function): roda num escopo isolado
const sandbox = {};
new Function('g', src + `
  g.EX=EX; g.TEMAS=TEMAS; g.NIVEIS=NIVEIS; g.BLOCOS=BLOCOS; g.CAMADAS=CAMADAS;
  g.FORMATOS=FORMATOS; g.MATERIAIS=MATERIAIS; g.NECESSIDADES=NECESSIDADES;
  g.temaDoMes=temaDoMes;
`)(sandbox);

const { EX, TEMAS, NIVEIS, BLOCOS, CAMADAS, FORMATOS, MATERIAIS, NECESSIDADES } = sandbox;
const ids = o => o.map(x => x.id);
const valido = {
  tema: ids(TEMAS), niveis: ids(NIVEIS), bloco: ids(BLOCOS),
  form: ids(FORMATOS), mat: ids(MATERIAIS), nec: ids(NECESSIDADES),
  camada: CAMADAS.map(c => c.n)
};
const obrigatorios = ['id','nome','tema','camada','bloco','niveis','min','int',
                      'objetivo','montagem','execucao','prog','erro','sucesso','mat','form','nec','fonte'];

let erros = [], avisos = [], vistos = new Set();

EX.forEach((e, i) => {
  const onde = `#${i + 1} ${e.id || '(sem id)'}`;
  obrigatorios.forEach(c => {
    if (e[c] === undefined || e[c] === null || e[c] === '') erros.push(`${onde}: falta o campo "${c}"`);
  });
  if (vistos.has(e.id)) erros.push(`${onde}: id repetido`);
  vistos.add(e.id);

  [['tema','tema'],['niveis','niveis'],['form','form'],['mat','mat'],['nec','nec']].forEach(([campo, lista]) => {
    (e[campo] || []).forEach(v => {
      if (valido[lista].indexOf(v) < 0) erros.push(`${onde}: ${campo} "${v}" nao existe`);
    });
    if ((e[campo] || []).length === 0) erros.push(`${onde}: ${campo} esta vazio`);
  });
  if (valido.bloco.indexOf(e.bloco) < 0) erros.push(`${onde}: bloco "${e.bloco}" nao existe`);
  if (valido.camada.indexOf(e.camada) < 0) erros.push(`${onde}: camada "${e.camada}" nao existe`);
  if (['baixa','media','alta'].indexOf(e.int) < 0) erros.push(`${onde}: int "${e.int}" nao existe`);
  if (typeof e.min !== 'number' || e.min < 2 || e.min > 30) erros.push(`${onde}: min "${e.min}" fora de 2..30`);
  if (['apostila','banco'].indexOf(e.fonte) < 0) erros.push(`${onde}: fonte "${e.fonte}" nao existe`);

  // a progressao so pode falar dos niveis que o exercicio atende
  Object.keys(e.prog || {}).forEach(k => {
    if ((e.niveis || []).indexOf(k) < 0) erros.push(`${onde}: prog tem "${k}", que nao esta em niveis`);
  });
  (e.niveis || []).forEach(n => {
    if (!(e.prog || {})[n]) avisos.push(`${onde}: nivel "${n}" sem progressao descrita`);
  });
});

// cobertura: todo tema precisa de exercicio em todo bloco e em todo nivel
TEMAS.forEach(t => {
  const doTema = EX.filter(e => e.tema.indexOf(t.id) >= 0);
  BLOCOS.forEach(b => {
    if (!doTema.some(e => e.bloco === b.id)) avisos.push(`tema "${t.nome}": nenhum exercicio no bloco "${b.nome}"`);
  });
  NIVEIS.forEach(n => {
    if (!doTema.some(e => e.niveis.indexOf(n.id) >= 0)) avisos.push(`tema "${t.nome}": nada para o nivel "${n.nome}"`);
  });
});
NECESSIDADES.forEach(n => {
  if (!EX.some(e => e.nec.indexOf(n.id) >= 0)) avisos.push(`necessidade "${n.nome}": nenhum exercicio atende`);
});

/* ---------------------------------------------------------------------------
   Parte 1b: o desenho da quadra cabe dentro do recorte escolhido?
   Peca colocada fora da moldura simplesmente nao aparece — e o desenho fica
   contando a historia errada, sem erro nenhum na tela. Aconteceu em 4
   exercicios na primeira leva (sacador desenhado fora do recorte 'meia').
   --------------------------------------------------------------------------- */
const quadraSrc = fs.readFileSync('app-exercicios/quadra.js', 'utf8');
const caixaQ = {};
new Function('g', quadraSrc + '; g.BASES = BASES;')(caixaQ);
const BASES = caixaQ.BASES;

const PONTOS = {           // quais numeros de cada elemento sao coordenadas
  aluno:[[1,2]], prof:[[1,2]], colega:[[1,2]], cone:[[1,2]], marca:[[1,2]],
  escada:[[1,2]], texto:[[1,2]], zona:[[1,2]], bola:[[1,2],[3,4]], mov:[[1,2],[3,4]],
  corda:[]                 // a corda atravessa a quadra inteira: nao tem ponto proprio
};
const FOLGA = { aluno:.75, prof:.75, colega:.75, cone:.65, marca:.3, escada:2.0, zona:.2, texto:.2, bola:.15, mov:.15 };

EX.forEach(e => {
  if (!e.fig || !e.fig.el) { erros.push(`${e.id}: sem desenho da quadra (fig)`); return; }
  const b = BASES[e.fig.base || 'meia'];
  if (!b) { erros.push(`${e.id}: base de desenho "${e.fig.base}" nao existe`); return; }
  e.fig.el.forEach((el, i) => {
    const pares = PONTOS[el[0]];
    if (!pares) { erros.push(`${e.id}: elemento "${el[0]}" nao existe no desenho`); return; }
    const folga = FOLGA[el[0]] || .2;
    pares.forEach(([ix, iy]) => {
      const x = el[ix], y = el[iy];
      if (typeof x !== 'number' || typeof y !== 'number') {
        erros.push(`${e.id}: elemento ${i + 1} (${el[0]}) sem coordenada`); return;
      }
      if (x - folga < b.x || x + folga > b.x + b.w || y - folga < b.y || y + folga > b.y + b.h)
        erros.push(`${e.id}: ${el[0]} em (${x}, ${y}) cai fora do recorte "${e.fig.base}"`);
    });
  });
  if (!e.passos || e.passos.length < 3) erros.push(`${e.id}: passo a passo com menos de 3 passos`);
  if (!e.dica) avisos.push(`${e.id}: sem dica extra`);
});

console.log(`Banco: ${EX.length} exercicios (${EX.filter(e=>e.fonte==='apostila').length} da apostila, ${EX.filter(e=>e.fonte==='banco').length} de ampliacao)`);
TEMAS.forEach(t => console.log(`  ${t.mesesTx.padEnd(22)} ${String(EX.filter(e=>e.tema.indexOf(t.id)>=0).length).padStart(3)} exercicios · ${t.nome}`));
if (avisos.length) { console.log(`\nAVISOS (${avisos.length}) — conferir a olho:`); avisos.forEach(a => console.log('  · ' + a)); }
if (erros.length)  { console.log(`\nERROS (${erros.length}) — corrigir antes de publicar:`); erros.forEach(e => console.log('  ✗ ' + e)); process.exit(1); }

/* ---------------------------------------------------------------------------
   Parte 2: os ids que a tela procura existem no HTML?
   O app chama os ids por um atalho (`el('x')`), e por isso o checar-ids.py nao
   os ve. Esta parte devolve essa conferencia: id procurado que nao existe
   devolve null e o codigo morre ali, sem erro nenhum na tela.
   --------------------------------------------------------------------------- */
const html = fs.readFileSync('app-exercicios/index.html', 'utf8');
const existentes = new Set();
(html.match(/\sid="([^"]+)"/g) || []).forEach(m => existentes.add(m.match(/id="([^"]+)"/)[1]));
// ids criados dentro do proprio JS (montados em texto antes de ir para a tela)
(html.match(/id="?([A-Za-z][A-Za-z0-9_-]*)"?/g) || []).forEach(m => {
  const v = m.match(/id="?([A-Za-z][A-Za-z0-9_-]*)/)[1]; existentes.add(v);
});
const procurados = new Set();
(html.match(/el\('([A-Za-z0-9_-]+)'\)/g) || []).forEach(m => procurados.add(m.match(/el\('([^']+)'\)/)[1]));
const faltando = [...procurados].filter(id => !existentes.has(id));
console.log(`\nTela: ${procurados.size} ids procurados por el(), ${existentes.size} ids no arquivo`);
if (faltando.length) {
  console.log('ERROS — id procurado que nao existe:');
  faltando.forEach(id => console.log('  \u2717 el(\'' + id + '\')'));
  process.exit(1);
}

/* Parte 3: todo data-* que o clique trata tem alguem que o use, e vice-versa. */
const tratados = new Set();
(html.match(/hasAttribute\('data-([a-z]+)'\)/g) || []).forEach(m => tratados.add(m.match(/data-([a-z]+)/)[1]));
const usados = new Set();
(html.match(/data-([a-z]+)="/g) || []).forEach(m => usados.add(m.match(/data-([a-z]+)/)[1]));
const semTrato = [...usados].filter(d => !tratados.has(d));
const semUso  = [...tratados].filter(d => !usados.has(d));
if (semTrato.length) console.log('AVISO — data-' + semTrato.join(', data-') + ' aparece na tela mas o clique nao trata');
if (semUso.length)   console.log('AVISO — o clique trata data-' + semUso.join(', data-') + ' mas nada na tela usa');

console.log('\nBanco e tela OK: nenhum filtro nem id escrito errado.');

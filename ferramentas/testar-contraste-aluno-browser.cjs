/* Leitura (contraste) do app do aluno em todas as abas e janelas, nos dois
   temas (Saibro e Verde clássico). Só dados fictícios, nuvem simulada,
   relógio fixo.
   Mede pela imagem da tela, não pelo CSS: esconde as letras, fotografa o
   fundo de verdade (degradê, vidro, foto) e compara cada texto com o fundo
   que fica atrás dele. Régua WCAG AA: 4,5:1 para texto normal e 3:1 para
   texto grande (24 px, ou 18,66 px em negrito). Vale o pior pedaço do fundo
   (20% mais claro/escuro), não a média.
   JV_SHOTS=<pasta> salva a foto de cada tela; JV_CONTRASTE_JSON=<arquivo>
   grava a lista completa. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-27T10:00:00-03:00');   // terça-feira
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
const SHOTS=process.env.JV_SHOTS||'';
async function contexto(browser,base,tema){
 const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
 await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');try{localStorage.setItem('jv-tema',t);}catch(e){}},tema);
 return c;
}

/* ---------- aluno fictício com tudo preenchido ---------- */
const nota=(v)=>({mov:{espera:v,prep:v,desloc:v+1,percep:v,final:v,equil:v,recupera:v},tec:{forehand:v+1,backhand:v,voleio:v,smash:v-1,saque:v,devolucao:v},jogo:{troca:v,direcao:v,efeito:v,profund:v,leitura:v,pressao:v}});
const EU0={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:8,planoGrupo:0,creditos:5,credGrupo:0,repos:2,reposValidas:2,reposVencendo:1,
 locCred:2,mensalidade:640,status:'pendente',diaVenc:30,ativo:true,
 avaliacoes:[Object.assign({data:'2026-08-10',nivel:'Impulso',esc:5},nota(2)),
  Object.assign({data:'2026-10-05',nivel:'Construção',esc:5,prioridade:'Preparação antecipada no forehand',objetivo:'Jogar a etapa de dezembro'},nota(3))],
 registros:[{data:'2026-10-02',camada:'Base',evoluiu:'sim',intens:'media',conteudo:'Forehand cruzado',destaque:'Boa preparação',casa:'Sombra 10 min',proximo:'Backhand'},
  {data:'2026-10-16',camada:'Impulso',evoluiu:'nao',intens:'forte',conteudo:'Saque',proximo:'Devolução'}]};
const HORAS=['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const PUB0={horas:HORAS,profs:[],horarioCfg:{},horarioData:{},termoVer:0,termo:'',aviso:'Quadra 2 em manutenção na sexta de manhã.',
 precos:{avulsaPart:170,avulsaGrupo:95,locacao:70,personal:130},grupoPreco:{dupla:90,trio:85,quarteto:80},
 pix:'teste@example.invalid',pixNome:'Academia Teste',pixCidade:'Curitiba',pixTipo:'email',cardLink:'https://example.invalid/pagar',
 chuvas:[{data:'2026-10-27',hora:'08:00',ts:1,cods:['6601']}],reservasRespostas:[],
 grade:{fixos:[{id:'f1',cod:'6601',dia:5,hora:'16:00',tipo:'aula',desde:'2026-10-01'},{id:'f2',cod:'6601',dia:1,hora:'18:00',tipo:'aula',desde:'2026-10-01'}],
  eventos:[{id:'e1',cod:'6601',data:'2026-10-27',hora:'14:00',tipo:'aula'},{id:'t1',cod:'6601',data:'2026-10-29',hora:'17:00',tipo:'torneio'},
   {id:'l1',cod:'6601',data:'2026-10-30',hora:'09:00',tipo:'locacao'},{id:'x1',cod:'7702',data:'2026-10-27',hora:'17:00',tipo:'grupo',pessoas:2},
   {id:'x2',cod:'7703',data:'2026-10-27',hora:'18:00',tipo:'aula'},{id:'alm',data:'2026-10-27',hora:'12:00',tipo:'bloqueio'},
   {id:'chv',data:'2026-10-27',hora:'08:00',tipo:'bloqueio',motivo:'chuva'},{id:'x3',cod:'7704',data:'2026-10-28',hora:'11:00',tipo:'torneio'}],excecoes:[]},
 historico:{'6601':[{data:'2026-10-23',hora:'16:00'},{data:'2026-10-16',hora:'16:00'},{data:'2026-10-09',hora:'18:00',t:'torneio'},{data:'2026-10-02',hora:'16:00'}]},
 torneio:{id:'tor1',nome:'Barragem Primavera',tipo:'grupos',etapa:2,encerrada:false,nomesGrupos:{A:'Grupo Ouro'},
  jogadores:[{name:'Aluno Fictício',cod:'6601',group:'A',v:3,d:1,wo:0},{name:'Jogador Dois',group:'A',v:2,d:2,wo:0},{name:'Jogador Três',group:'A',v:1,d:3,wo:1},
   {name:'Jogadora Quatro',group:'B',v:4,d:0,wo:0},{name:'Jogadora Cinco',group:'B',v:0,d:4,wo:0}]}};
const MEU0={codigo:'6601',pedidos:[{id:'r9',data:'2026-11-03',hora:'08:00',rec:'pontual',tor:1,ts:1}],cancelados:[],confirmadas:[],espera:[{data:'2026-10-28',hora:'09:00',ts:1}],chuvaVista:[],feriadoOk:[]};

/* ---------- telas: [nome, preparo dentro da página] ---------- */
const nav=id=>`goAluno('${id}',document.getElementById('nav-al-${id}')||null)`;
const ESTADOS=[
 ['inicio',`${nav('inicio')};checarAulaHoje();checarChuva();conferirEspera();checarRenovacao();checarFeriados();`],
 ['agenda-dia',`${nav('agenda')};gotoDay(2026,9,27);`],
 ['agenda-semana',`${nav('agenda')};agDate=new Date(2026,9,27,12);setView('semana',document.querySelector('#apg-agenda .seg button[onclick*=semana]'));alunoWkZoom=1;alunoWkAutoFit=false;aplicarAlunoWkVars();`],
 ['agenda-mes',`${nav('agenda')};agDate=new Date(2026,9,27,12);setView('mes',document.querySelector('#apg-agenda .seg button[onclick*=mes]'));`],
 ['escolher-horario',`${nav('agenda')};agDate=new Date(2026,9,27,12);escolherSlot('17:00');`],
 ['agendar',`${nav('agenda')};agDate=new Date(2026,9,28,12);abrirBook('10:00',false);`],
 ['locacao',`${nav('agenda')};agDate=new Date(2026,9,28,12);escolherSlot('15:00');pickLoc();`],
 ['aulas-resumo',`${nav('aulas')};abaMinhasAulas('mes');`],
 ['aulas-proximas',`${nav('aulas')};abaMinhasAulas('prox');`],
 ['aulas-proximas-depois',`${nav('aulas')};abaMinhasAulas('prox');document.querySelectorAll('#apg-aulas details.mau-depois').forEach(d=>d.open=true);`],
 ['aulas-feitas',`${nav('aulas')};abaMinhasAulas('feitas');`],
 ['aulas-agenda-mes',`${nav('aulas')};abrirAgendaMesAluno();`],
 ['evolucao-resumo',`${nav('evolucao')};`],
 ['evolucao-fundamentos',`${nav('evolucao')};setEvoTab('fund',document.querySelector('#apg-evolucao .evo-seg button[onclick*=fund]'));`],
 ['evolucao-historico',`${nav('evolucao')};setEvoTab('hist',document.querySelector('#apg-evolucao .evo-seg button[onclick*=hist]'));`],
 ['evolucao-sem-avaliacao',`EU.avaliacoes=[];EU.registros=[];${nav('evolucao')};`],
 ['evolucao-subiu-nivel',`${nav('evolucao')};celebraNivel('Nível Construção',metalDe('Construção'));`],
 ['autoavaliacao',`${nav('evolucao')};abrirAutoAval();setAuto('mov','espera',3);`],
 ['creditos',`${nav('creditos')};`],
 ['pix',`${nav('creditos')};abrirPix(640,'Mensalidade de outubro',null);`],
 ['comprar',`${nav('creditos')};openComprar();`],
 ['planos',`${nav('creditos')};abrirPlanos();`],
 ['creditos-explica',`${nav('creditos')};popupCreditos(3,5);`],
 ['perfil',`${nav('perfil')};`],
 ['torneio',`goAluno('torneio',null);`],
 ['torneio-resultado',`goAluno('torneio',null);abrirRegResultado();`],
 ['torneio-resultado-placar',`goAluno('torneio',null);abrirRegResultado();document.getElementById('atr-grupo').value='A';atrPlayers();document.getElementById('atr-p1').value='Aluno Fictício';document.getElementById('atr-p2').value='Jogador Dois';[['atr-s1a',6],['atr-s1b',4],['atr-s2a',3],['atr-s2b',6],['atr-s3a',10],['atr-s3b',8]].forEach(([i,v])=>document.getElementById(i).value=v);atrAtualiza();`],
 ['torneio-resultado-erro',`goAluno('torneio',null);abrirRegResultado();document.getElementById('atr-grupo').value='A';atrPlayers();document.getElementById('atr-p1').value='Aluno Fictício';document.getElementById('atr-p2').value='Jogador Dois';document.getElementById('atr-s1a').value=6;document.getElementById('atr-s1b').value=6;atrAtualiza();`],
 ['torneio-resultado-wo',`goAluno('torneio',null);abrirRegResultado();document.getElementById('atr-grupo').value='A';atrPlayers();document.querySelector('input[name="atr-tipo"][value="wo"]').checked=true;atrAtualiza();`],
 ['assistente-voz',`${nav('agenda')};JVVozAluno.abrir();const t=document.getElementById('va-texto');t.value='tem horário livre amanhã?';JVVozAluno.enviar();t.value='quinta às 18 está livre?';JVVozAluno.enviar();`],
 ['assistente-voz-cancelar',`${nav('inicio')};JVVozAluno.abrir();const t=document.getElementById('va-texto');t.value='minhas aulas';JVVozAluno.enviar();t.value='cancelar sexta às 16';JVVozAluno.enviar();`],
 ['termo',`PUB.termo='Termo de uso fictício para teste de leitura.';PUB.termoVer=2;MEU.termoAceitoVer=1;checarTermo();`],
 ['cadastro-novo',`abrirCadastroNovo();`]
];

/* ---------- medição (ferramentas/medir-contraste-pixels.cjs) ---------- */
const {medir}=require('./medir-contraste-pixels.cjs');

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 const relatorio=[];let telas=0;
 try{
  for(const tema of ['saibro','classico']){
   const ca=await contexto(browser,base,tema);
   const p=await ca.newPage(),erros=[];p.on('pageerror',e=>{if(!/Clipboard/.test(e.message))erros.push(e.message);});p.on('dialog',d=>d.dismiss());
   await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-aluno/',{waitUntil:'load'});
   await p.waitForFunction(()=>typeof aulasAgendadasAluno==='function');
   await p.addStyleTag({content:'*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important}#toast{display:none!important}'});
   // tela de entrada (antes de ter aluno)
   await p.waitForTimeout(600);
   await p.evaluate(()=>document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none'));
   const entrar=await medir(p,SHOTS&&path.join(SHOTS,tema+'-entrada.png'));telas++;
   relatorio.push({tema,tela:'entrada',itens:entrar});
   for(const [nome,prep] of ESTADOS){
    await p.evaluate(({EU0,PUB0,MEU0})=>{
     init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-teste';atualizarGradeReserva=async()=>{};saveMeu=async()=>{};
     notificarJoao=()=>{};notificarLocal=()=>{};abrirWhatsApp=()=>{};_renovaAdiado=false;_lembreteFeito=true;
     EU=JSON.parse(JSON.stringify(EU0));PUB=JSON.parse(JSON.stringify(PUB0));PUB.alunos=[EU];MEU=JSON.parse(JSON.stringify(MEU0));
     window.fbDB={ref:()=>({push:async()=>{},update:async()=>{},set:async()=>{},once:async()=>({val:()=>null})})};
     VINCULO_ESTADO='ativo';agView='dia';agDate=new Date();
     try{lsSet('jvt-evo-lvl-6601-2026-10-05','1');}catch(e){}   // a comemoração de nível tem tela própria
     document.querySelectorAll('.evo-levelup,.evo-confete').forEach(x=>x.remove());
     const lg=document.getElementById('login');if(lg)lg.style.display='none';
     document.getElementById('app').style.display='block';
     document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
     if(window.JVVozAluno)JVVozAluno.fechar();
     document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
     ['lembrete-box','chuva-box','espera-box','renova-box','feriado-box'].forEach(id=>{const b=document.getElementById(id);if(b)b.style.display='none';});
     render();
    },{EU0,PUB0,MEU0});
    await p.evaluate(prep);
    await p.waitForTimeout(250);
    await p.evaluate(()=>window.scrollTo(0,0));
    relatorio.push({tema,tela:nome,itens:await medir(p,SHOTS&&path.join(SHOTS,tema+'-'+nome+'.png'))});telas++;
   }
   assert.deepEqual(erros,[],'erros na página ('+tema+')');
   await ca.close();
  }
  const falhas=[];
  for(const r of relatorio)for(const it of r.itens)if(it.ratio!==null&&it.ratio<it.minimo)falhas.push({tema:r.tema,tela:r.tela,texto:it.t,contraste:it.ratio,minimo:it.minimo,cor:it.fg,fundo:it.fundo,tam:it.fs,onde:it.onde,desativado:it.desativado});
  if(process.env.JV_CONTRASTE_JSON)fs.writeFileSync(process.env.JV_CONTRASTE_JSON,JSON.stringify({falhas,relatorio},null,1));
  const total=relatorio.reduce((n,r)=>n+r.itens.length,0);
  console.log(telas+' telas · '+total+' textos medidos · '+falhas.length+' abaixo da régua');
  if(process.env.JV_CONTRASTE_LISTA){
   for(const f of falhas)console.log(['  ',f.tema,f.tela,f.contraste+'/'+f.minimo,JSON.stringify(f.texto),f.cor,'sobre',f.fundo,f.tam+'px',f.desativado?'(desativado)':'',f.onde].join(' '));
  }
  assert.deepEqual(falhas.map(f=>f.tema+' · '+f.tela+' · '+f.texto+' · '+f.contraste),[],'textos difíceis de ler');
  console.log('\n✅ leitura ok em '+telas+' telas do app do aluno (Saibro e Verde clássico)');
 }catch(e){console.error('❌ '+(e.stack||e).toString().slice(0,4000));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

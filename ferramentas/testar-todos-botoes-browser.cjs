/* Varredura de todos os botões (28/10, pedido do João: "testar e conferir
   todos os botões e escritas, para não ter problema de contraste ou de
   funcionamento"). A leitura (contraste) fica com testar-contraste-*.
   Na Gestão e no app do aluno, toca em cada botão, link, aba e caixinha de
   cada tela; quando o toque abre uma janela, toca em tudo dentro dela também
   (até 3 janelas uma dentro da outra). Escolhe cada opção das listas e escreve
   nos campos. Antes de cada toque, os dados fictícios voltam ao começo, então
   nada se acumula. Falha se algum toque der erro na página.
   Perguntas de confirmação são respondidas "Cancelar"; link para fora e
   recarregar a página não acontecem (só ficam anotados). Nada vai para a
   nuvem. JV_APPS=gestao|aluno roda só um; JV_PAGINAS=alunos,agenda só essas telas;
   JV_VARREDURA_LISTA=1 mostra tudo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
const LISTA=!!process.env.JV_VARREDURA_LISTA;
const APPS=(process.env.JV_APPS||'gestao,aluno').split(',');

/* ---------- Gestão: a mesma academia fictícia da varredura de contraste ---------- */
function montarDadosGestao(){
 const al=(id,nome,x)=>Object.assign({id,nome,codigo:id.replace(/\D/g,'').padStart(4,'7'),tipo:'Particular',plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:1,locCred:0,
  mensalidade:640,valorAula:160,status:'pendente',diaVenc:10,ativo:true,tel:'41999990000'},x||{});
 const nota=v=>({mov:{espera:v,prep:v,desloc:v,percep:v,final:v,equil:v,recupera:v},tec:{forehand:v,backhand:v,voleio:v,smash:v,saque:v,devolucao:v},jogo:{troca:v,direcao:v,efeito:v,profund:v,leitura:v,pressao:v}});
 DB.alunos=[
  al('a1','Aluno Um Teste',{status:'pago',avaliacoes:[Object.assign({data:'2026-09-10',nivel:'Base',esc:5},nota(2)),Object.assign({data:'2026-10-08',nivel:'Impulso',esc:5,prioridade:'Preparação do forehand'},nota(3))],
   registros:[{data:'2026-10-14',camada:'Base',evoluiu:'sim',intens:'media',conteudo:'Forehand cruzado',destaque:'Boa base',casa:'Sombra',proximo:'Backhand'}]}),
  al('a2','Aluna Dois Teste',{creditos:-1,repos:3}),
  al('a3','Personal Três Teste',{tipo:'Personal'}),
  al('a4','Dupla Quatro Teste',{tipo:'Dupla',plano:0,planoGrupo:4,credGrupo:3}),
  al('a5','Misto Cinco Teste',{planoGrupo:4,credGrupo:2,status:'pago'}),
  al('a6','Responsável Seis Teste',{mensalidade:1200}),
  al('a7','Dependente Sete Teste',{responsavelId:'a6',parentesco:'Filho(a)',mensalidade:0}),
  al('a8','Inativo Oito Teste',{ativo:false,arquivado:true})];
 const fx=(id,dia,hora,alunoId,tipo,x)=>Object.assign({id,dia,hora,titulo:alunoId?DB.alunos.find(a=>a.id===alunoId).nome:'',tipo,alunoId,desde:'2026-09-01'},x||{});
 DB.agenda={fixos:[fx('f1',3,'07:00','a3','personal'),fx('f2',3,'09:00','a1','aula'),fx('f3',3,'16:00','a4','grupo',{pessoas:2}),fx('f4',3,'18:00','a5','aula'),
   fx('f5',1,'10:00','a2','aula'),fx('f6',5,'17:00','a6','aula'),fx('f7',2,'08:00',null,'aula',{titulo:'Nome Sem Cadastro'})],
  eventos:[{id:'e1',data:'2026-10-21',hora:'11:00',titulo:'Locação Fictícia',tipo:'locacao'},{id:'e2',data:'2026-10-21',hora:'12:00',titulo:'ALMOÇO',tipo:'bloqueio'},
   {id:'e3',data:'2026-10-22',hora:'14:00',titulo:'Aluna Dois Teste',tipo:'aula',alunoId:'a2'},{id:'e4',data:'2026-10-21',hora:'20:00',titulo:'Torneio',tipo:'torneio'}],excecoes:[]};
 DB.presencas=[{data:'2026-10-21',hora:'07:00',alunoId:'a3',status:'presente'},{data:'2026-10-21',hora:'09:00',alunoId:'a1',status:'falta'}];
 DB.compromissos=[{id:'c1',data:'2026-10-23',hora:'13:00',titulo:'Compromisso fictício',dur:60}];
 DB.lancamentos=[{id:'l1',tipo:'receita',categoria:'Mensalidade',descricao:'Mensalidade Aluno Um Teste',valor:640,data:'2026-10-05',alunoId:'a1',mes:'2026-10',metodo:'Pix'},
  {id:'l2',tipo:'despesa',categoria:'Material',descricao:'Bolas de teste',valor:180,data:'2026-10-07'},
  {id:'l3',tipo:'receita',categoria:'Locação',descricao:'Locação fictícia',valor:70,data:'2026-10-12'}];
 DB.movs=[{ts:new Date('2026-10-01T09:00:00-03:00').getTime(),alunoId:'a1',campo:'creditos',delta:4,de:0,para:4,motivo:'renovação',ref:''}];
 DB.torneios={atual:'t1',seeded:true,lista:{t1:{id:'t1',nome:'Barragem Teste',tipo:'barragem',etapa:2,encerrada:false,grupos:['A','B'],nomesGrupos:{A:'Grupo Ouro'},
  etapasFin:[{etapa:1,data:'2026-09-30',campeoes:[{grupo:'A',campeao:'Aluno Um Teste',vice:'Aluna Dois Teste'}]}],
  jogos:[{id:'j1',etapa:2,grupo:'A',p1:'Aluno Um Teste',p2:'Aluna Dois Teste',venc:'Aluno Um Teste',tipo:'normal',sets:[[6,4],[3,6],[10,8]],data:'2026-10-15',ts:1}],
  jogadores:[{group:'A',name:'Aluno Um Teste',v:3,d:1,wo:0,order:0,alunoId:'a1'},{group:'A',name:'Aluna Dois Teste',v:2,d:2,wo:1,order:1},
   {group:'B',name:'Jogador Três Teste',v:1,d:0,wo:0,order:0}]}}};
 DB.meta=8000;
}

/* ---------- App do aluno: o mesmo aluno fictício da varredura de contraste ---------- */
const nota=v=>({mov:{espera:v,prep:v,desloc:v+1,percep:v,final:v,equil:v,recupera:v},tec:{forehand:v+1,backhand:v,voleio:v,smash:v-1,saque:v,devolucao:v},jogo:{troca:v,direcao:v,efeito:v,profund:v,leitura:v,pressao:v}});
const EU0={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:8,planoGrupo:0,creditos:5,credGrupo:0,repos:2,reposValidas:2,reposVencendo:1,
 locCred:2,mensalidade:640,status:'pendente',diaVenc:30,ativo:true,
 avaliacoes:[Object.assign({data:'2026-08-10',nivel:'Impulso',esc:5},nota(2)),Object.assign({data:'2026-10-05',nivel:'Construção',esc:5,prioridade:'Forehand',objetivo:'Etapa de dezembro'},nota(3))],
 registros:[{data:'2026-10-02',camada:'Base',evoluiu:'sim',intens:'media',conteudo:'Forehand cruzado',destaque:'Boa preparação',casa:'Sombra 10 min',proximo:'Backhand'}]};
const HORAS=['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const PUB0={horas:HORAS,profs:[],horarioCfg:{},horarioData:{},termoVer:0,termo:'',aviso:'Quadra em manutenção na sexta de manhã.',
 precos:{avulsaPart:170,avulsaGrupo:95,locacao:70,personal:130},grupoPreco:{dupla:90,trio:85,quarteto:80},
 pix:'teste@example.invalid',pixNome:'Academia Teste',pixCidade:'Curitiba',pixTipo:'email',cardLink:'https://example.invalid/pagar',
 chuvas:[],reservasRespostas:[],
 grade:{fixos:[{id:'f1',cod:'6601',dia:5,hora:'16:00',tipo:'aula',desde:'2026-10-01'},{id:'f2',cod:'6601',dia:1,hora:'18:00',tipo:'aula',desde:'2026-10-01'}],
  eventos:[{id:'e1',cod:'6601',data:'2026-10-27',hora:'14:00',tipo:'aula'},{id:'t1',cod:'6601',data:'2026-10-29',hora:'17:00',tipo:'torneio'},
   {id:'l1',cod:'6601',data:'2026-10-30',hora:'09:00',tipo:'locacao'},{id:'x1',cod:'7702',data:'2026-10-27',hora:'17:00',tipo:'grupo',pessoas:2},
   {id:'alm',data:'2026-10-27',hora:'12:00',tipo:'bloqueio'}],excecoes:[]},
 historico:{'6601':[{data:'2026-10-23',hora:'16:00'},{data:'2026-10-16',hora:'16:00'},{data:'2026-10-09',hora:'18:00',t:'torneio'}]},
 torneio:{id:'tor1',nome:'Barragem Primavera',tipo:'grupos',etapa:2,encerrada:false,nomesGrupos:{A:'Grupo Ouro'},
  jogadores:[{name:'Aluno Fictício',cod:'6601',group:'A',v:3,d:1,wo:0},{name:'Jogador Dois',group:'A',v:2,d:2,wo:0},{name:'Jogadora Quatro',group:'B',v:4,d:0,wo:0}]}};
const MEU0={codigo:'6601',pedidos:[{id:'r9',data:'2026-11-03',hora:'08:00',rec:'pontual',tor:1,ts:1}],cancelados:[],confirmadas:[],espera:[{data:'2026-10-28',hora:'09:00',ts:1}],chuvaVista:[],feriadoOk:[]};

/* ---------- ajudantes dentro da página ---------- */
function ajudantes(ROOTSEL){
 window.__vis=e=>{if(!e||!e.isConnected)return false;const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return false;
  for(let x=e;x;x=x.parentElement){if(x.hidden)return false;const s=getComputedStyle(x);if(s.display==='none'||s.visibility==='hidden')return false;}
  const d=e.closest('details:not([open])');if(d&&!e.closest('summary'))return false;return true;};
 window.__cli=raiz=>[...raiz.querySelectorAll('button,[onclick],a[href],[role=button],summary,input[type=checkbox],input[type=radio]')]
  .filter(e=>!e.disabled&&__vis(e)&&(raiz!==document.body||!e.closest(ROOTSEL)));
 window.__campos=raiz=>[...raiz.querySelectorAll('select,input:not([type]),input[type=text],input[type=search],input[type=number],input[type=date],input[type=time],input[type=tel],input[type=email],textarea')]
  .filter(e=>!e.disabled&&!e.readOnly&&__vis(e)&&(raiz!==document.body||!e.closest(ROOTSEL)));
 // quem o botão é: pela ação (onclick/href/id), que não muda quando o texto muda; senão, pelo texto
 window.__ass=e=>{const a=e.getAttribute('onclick')||e.getAttribute('href')||(e.id?'#'+e.id:'')||(e.name?'@'+e.name:'');
  return e.tagName+'|'+(a||(e.innerText||e.value||e.getAttribute('aria-label')||e.title||'').replace(/\s+/g,' ').trim().slice(0,40));};
 window.__chave=e=>e.id||((typeof e.className==='string'?e.className:'')+'|'+(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,30));
 window.__raizes=()=>[...document.querySelectorAll(ROOTSEL)].filter(__vis);
 window.__raiz=ch=>ch==='@tela'?document.body:(__raizes().find(r=>__chave(r)===ch)||null);
 window.__achar=(ch,ass,k,campo)=>{const r=__raiz(ch);if(!r)return null;return (campo?__campos(r):__cli(r)).filter(e=>__ass(e)===ass)[k]||null;};
 window.__lista=(ch,campo)=>{const r=__raiz(ch);if(!r)return [];const n={};return (campo?__campos(r):__cli(r)).map(e=>{const a=__ass(e);n[a]=(n[a]||0)+1;
  return {ass:a,k:n[a]-1,tipo:e.tagName==='SELECT'?'select':(e.type||e.tagName).toLowerCase(),ops:e.tagName==='SELECT'?[...e.options].map(o=>o.value).slice(0,8):null};});};
 // link para fora: não sai da página, só anota
 document.addEventListener('click',ev=>{const a=ev.target&&ev.target.closest&&ev.target.closest('a[href]');if(!a)return;const h=a.getAttribute('href')||'';
  if(h&&!h.startsWith('#')&&!/^javascript:/i.test(h)){ev.preventDefault();(window.__links=window.__links||[]).push(h);}},true);
 window.open=u=>{(window.__links=window.__links||[]).push(String(u||''));return null;};
 window.print=()=>{};
 try{Object.defineProperty(navigator,'share',{value:async()=>{},configurable:true});Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true});}catch(e){}
 try{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{},readText:async()=>''},configurable:true});}catch(e){}
 window.__sentinela=1;
}

async function varrer(browser,base,cfg){
 const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
 let pronto=false;const saidas=[];
 const p=await c.newPage();
 await c.route('**/*',r=>{const req=r.request(),u=new URL(req.url());
  if(pronto&&req.isNavigationRequest()&&req.frame()===p.mainFrame()){saidas.push(req.url());return r.abort('aborted');}   // recarregar / sair da página
  if(u.origin!==base)return r.abort();
  if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
 await c.addInitScript(ajudantes,cfg.ROOTSEL);
 const erros=[];p.on('pageerror',e=>erros.push(e.message.split('\n')[0]));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await p.clock.setFixedTime(cfg.agora);await p.goto(base+cfg.url,{waitUntil:'load'});
 await cfg.preparar(p);pronto=true;
 const guardado=await p.evaluate(()=>JSON.stringify(Object.entries(localStorage)));
 const r={toques:0,janelas:0,campos:0,falhas:[],ignorados:[]};
 const feitosTela=new Set(),explorados=new Set();
 const ERRO_NUVEM=/firebase is not defined|fbDB|firebase\./;   // nuvem desligada no teste; no app real ela existe
 async function repor(pag){
  if(!(await p.evaluate(()=>window.__sentinela===1).catch(()=>false))){   // a página caiu: abre de novo
   pronto=false;await p.goto(base+cfg.url,{waitUntil:'load'});await cfg.preparar(p);pronto=true;}
  await p.evaluate(g=>{localStorage.clear();for(const [k,v] of JSON.parse(g))localStorage.setItem(k,v);},guardado);
  await cfg.repor(p,pag);
 }
 async function tocarPasso(st){
  return p.evaluate(({st})=>{const e=__achar(st.raiz,st.ass,st.k,st.campo);if(!e)return false;
   if(st.campo){if(e.tagName==='SELECT'){e.value=st.valor;}else{e.focus();e.value=st.valor;}
    e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
    if(e.tagName!=='SELECT'&&e.tagName!=='TEXTAREA')e.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'a'}));}
   else e.click();
   return true;},{st});
 }
 const valorDe=t=>t==='number'?'2':t==='date'?'2026-10-22':t==='time'?'09:00':t==='tel'?'41999990000':t==='email'?'teste@example.invalid':'Teste';
 async function tocar(pag,passos,nivel){
  await repor(pag);
  for(const st of passos.slice(0,-1)){if(!(await tocarPasso(st)))return;await p.waitForTimeout(160);}
  const antes=await p.evaluate(()=>__raizes().map(__chave));
  const n0=erros.length;
  const ok=await tocarPasso(passos[passos.length-1]);
  if(!ok){r.ignorados.push(pag+' · '+passos.map(s=>s.ass).join(' → ')+' (não achei de novo)');return;}
  await p.waitForTimeout(220);
  r.toques++;
  const novos=erros.slice(n0);
  const reais=novos.filter(e=>!ERRO_NUVEM.test(e));
  if(reais.length)r.falhas.push(cfg.nome+' · '+pag+' · '+passos.map(s=>s.ass+(s.campo?'='+s.valor:'')).join(' → ')+' :: '+[...new Set(reais)].join(' | '));
  if(novos.length>reais.length)r.ignorados.push(pag+' · '+passos.map(s=>s.ass).join(' → ')+' :: (nuvem) '+novos.find(e=>ERRO_NUVEM.test(e)));
  if(nivel>=3||passos[passos.length-1].campo)return;
  const depois=await p.evaluate(()=>__raizes().map(__chave));
  for(const ch of depois.filter(x=>!antes.includes(x)&&!explorados.has(x))){
   explorados.add(ch);r.janelas++;
   await explorar(pag,passos,ch,nivel+1);
   await repor(pag);for(const st of passos){if(!(await tocarPasso(st)))break;await p.waitForTimeout(160);}
  }
 }
 async function explorar(pag,passos,ch,nivel){
  const itens=await p.evaluate(ch=>__lista(ch,false),ch);
  const campos=await p.evaluate(ch=>__lista(ch,true),ch);
  for(const it of itens){
   if(ch==='@tela'){if(feitosTela.has(it.ass+'#'+it.k))continue;feitosTela.add(it.ass+'#'+it.k);}
   if(cfg.pula&&cfg.pula.test(it.ass)){r.ignorados.push(pag+' · '+it.ass+' (pulado de propósito)');continue;}
   await tocar(pag,[...passos,{raiz:ch,ass:it.ass,k:it.k}],nivel);
  }
  for(const cp of campos){
   if(ch==='@tela'){if(feitosTela.has('campo:'+cp.ass+'#'+cp.k))continue;feitosTela.add('campo:'+cp.ass+'#'+cp.k);}
   const vals=cp.tipo==='select'?cp.ops:[valorDe(cp.tipo)];
   for(const v of vals){r.campos++;await tocar(pag,[...passos,{raiz:ch,ass:cp.ass,k:cp.k,campo:true,valor:v}],nivel);}
  }
 }
 const so=(process.env.JV_PAGINAS||'').split(',').filter(Boolean);
 for(const pag of cfg.paginas){if(so.length&&!so.includes(pag))continue;await repor(pag);await explorar(pag,[],'@tela',1);}
 r.saidas=[...new Set(saidas)];r.explorados=[...explorados];r.links=[...new Set(await p.evaluate(()=>window.__links||[]).catch(()=>[]))];
 await c.close();
 return r;
}

(async()=>{
 await new Promise(rs=>server.listen(0,'127.0.0.1',rs));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 const todos=[];let falhas=[];
 try{
  if(APPS.includes('gestao')){
   const dados='('+montarDadosGestao.toString()+')';
   const r=await varrer(browser,base,{nome:'Gestão',url:'/app-gestao/',agora:new Date('2026-10-21T15:30:00-03:00'),
    ROOTSEL:'.overlay.on,#ficha-aluno.on,#mais-pop.on,#voz-painel:not([hidden])',
    paginas:['dash','agenda','alunos','lanc','aval','fin','seg','torneio','graf','fech','profs'],
    pula:/sairEApagar|exportBackup|avatar-gestao-file/,
    preparar:async p=>{
     await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,null,{timeout:40000});
     await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast{display:none!important}*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important}'});
     await p.evaluate(()=>{persist=()=>{};publish=()=>{};guardarVersoes=()=>{};logAct=()=>{};MODO='dono';});},
    repor:(p,pag)=>p.evaluate(({pag,dados})=>{
     document.querySelectorAll('.overlay.on').forEach(o=>o.classList.remove('on'));
     try{if(document.getElementById('ficha-aluno').classList.contains('on'))fecharFicha();}catch(e){}
     try{fecharMais();}catch(e){}
     const vp=document.getElementById('voz-painel');if(vp)vp.hidden=true;document.body.classList.remove('jv-voz-aberto');
     ['sem-export','tor-export','aval-export'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.cssText='';});
     (0,eval)(dados)();ensureFields();hideVals=false;curYear=2026;curMonth=9;
     // filtros e buscas das telas voltam ao começo (ficam fora dos dados)
     filtroPag='todos';filtroAval='todos';filtroAluno='todos';filtroProf='todos';filtroLancCat=null;focoRepos=false;agView='semana';agDate=new Date(2026,9,21);
     ['search','aval-search','cx-busca'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
     const tp=document.getElementById('alunos-tipo');if(tp)tp.value='todos';
     renderAll();go(pag,document.querySelector('.nav button[onclick*="\''+pag+'\'"]')||document.createElement('button'));window.scrollTo(0,0);
    },{pag,dados})});
   todos.push(['Gestão',r]);
  }
  if(APPS.includes('aluno')){
   const r=await varrer(browser,base,{nome:'Aluno',url:'/app-aluno/',agora:new Date('2026-10-27T10:00:00-03:00'),
    ROOTSEL:'.overlay.on,.tp-ov,#va-painel:not([hidden]),.evo-levelup',
    paginas:['inicio','agenda','aulas','evolucao','creditos','perfil','torneio'],
    pula:/sairConta|trocarAluno|apagarDados/,
    preparar:async p=>{
     await p.waitForFunction(()=>typeof aulasAgendadasAluno==='function');
     await p.addStyleTag({content:'#toast{display:none!important}*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important}'});},
    repor:(p,pag)=>p.evaluate(({pag,EU0,PUB0,MEU0})=>{
     init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-teste';atualizarGradeReserva=async()=>{};saveMeu=async()=>{};
     notificarJoao=()=>{};notificarLocal=()=>{};abrirWhatsApp=()=>{};_renovaAdiado=false;_lembreteFeito=true;
     EU=JSON.parse(JSON.stringify(EU0));PUB=JSON.parse(JSON.stringify(PUB0));PUB.alunos=[EU];MEU=JSON.parse(JSON.stringify(MEU0));
     window.fbDB={ref:()=>({push:async()=>{},update:async()=>{},set:async()=>{},once:async()=>({val:()=>null}),transaction:async()=>({committed:true})})};
     VINCULO_ESTADO='ativo';agView='dia';agDate=new Date();
     try{lsSet('jvt-evo-lvl-6601-2026-10-05','1');}catch(e){}
     document.querySelectorAll('.evo-levelup,.evo-confete,.tp-ov').forEach(x=>x.remove());
     const lg=document.getElementById('login');if(lg)lg.style.display='none';
     document.getElementById('app').style.display='block';
     document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
     if(window.JVVozAluno)JVVozAluno.fechar();
     document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
     render();goAluno(pag,document.getElementById('nav-al-'+pag)||null);window.scrollTo(0,0);
    },{pag,EU0,PUB0,MEU0})});
   todos.push(['App do aluno',r]);
  }
  for(const [nome,r] of todos){
   console.log(nome+': '+r.toques+' toques · '+r.janelas+' janelas abertas e varridas · '+r.campos+' escolhas/campos · '+r.falhas.length+' com erro');
   if(LISTA){r.explorados.forEach(x=>console.log('   ▢ janela: '+x));r.ignorados.forEach(x=>console.log('   · '+x));r.links.forEach(x=>console.log('   ↗ link (não aberto): '+x));r.saidas.forEach(x=>console.log('   ↻ ia sair/recarregar: '+x));}
   r.falhas.forEach(x=>console.log('   ❌ '+x));
   falhas=falhas.concat(r.falhas);
   assert.ok(r.toques>50,nome+': tocou em pouca coisa ('+r.toques+')');
  }
  assert.deepEqual(falhas,[],'toques com erro na página');
  console.log('\n✅ todos os botões tocados sem erro (Gestão e app do aluno)');
 }catch(e){console.error('❌ '+(e.stack||e).toString().slice(0,3000));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

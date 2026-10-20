/* Varredura de atalhos da Gestão (20/10): toca em cada botão do Início, do
   menu do Início, da barra de baixo, do "Mais" e nos cartões de categoria do
   Financeiro, e confere a tela aberta, a janela aberta e o botão aceso na
   barra. Atalho novo sem destino na tabela abaixo faz o teste falhar — assim
   ninguém cria um atalho que leva ao lugar errado sem perceber.
   Só dados fictícios, relógio fixo, nada gravado. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-20T08:00:00-03:00');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
/* onclick → onde tem de chegar: pag = tela; ov = janela aberta; nav = botão aceso; extra = conferência a mais */
const DESTINOS=[
 [/^abrirMenuInicio\(\)$/,{pag:'dash',ov:'ov-menu-inicio'}],
 [/save-state'\)\.click\(\)$/,{pag:'seg',nav:'Mais'}],
 [/^abrirNotifs\(\)$/,{pag:'dash',ov:'ov-notif'}],
 [/^abrirStatusQuadra\(\)$/,{pag:'dash',ov:'ov-quadra'}],
 [/^abrirClimaGestao\(\)$/,{pag:'dash',ov:'ov-clima'}],
 [/^adiarBackup\(\)$/,{pag:'dash'}],
 [/^verAgendaHoje\(\)$/,{pag:'agenda',nav:'Agenda',extra:'dia'}],
 [/^verTodasAtividadesInicio\(\)$/,{pag:'agenda',nav:'Agenda',extra:'dia'}],
 [/^verAgendaMes\(\)$/,{pag:'agenda',nav:'Agenda',extra:'mes'}],
 [/^navCmp\(-?1\)$|^trocarPeriodoCmp\('(semana|mes|ano)'\)$|^alternarAtividadesInicio\(\)$|^dobrar\('dob-[a-z]+'\)$/,{pag:'dash'}],
 [/^abrirDet(Alunos|Creditos|Ocupacao|Locacoes)\(\)$/,{pag:'dash',ov:'ov-jh-det'}],
 [/^marcarPago\('/,{pag:'dash',ov:'*'}],
 [/^verReposicoes\(\)$/,{pag:'alunos',nav:'Alunos'}],
 [/^verCaixaMes\(\)$/,{pag:'lanc',nav:'Caixa'}],
 [/^verPendentes\(\)$/,{pag:'dash',extra:'pend'}],
 [/^openLancModal\(\)$/,{pag:'dash',ov:'ov-lanc'}],
 [/^abrirNovoCompromisso\(\)$/,{pag:'dash',ov:'ov-comp'}],
 [/abrirPedidos\(\)$/,{pag:'dash',ov:'ov-ped'}],
 [/abrirHist\(\)$/,{pag:'dash',ov:'ov-hist'}],
 [/^closeModal\('ov-menu-inicio'\);abrirMais\(\)$|^abrirMais\(\)$/,{pag:'dash',extra:'mais'}],
 [/^closeModal\('ov-menu-inicio'\)$/,{pag:'dash'}],
 [/^verLancCategoria\('(mensalidade|avulsa|locacao|outro)'\)$/,{pag:'lanc',nav:'Caixa',extra:'filtro'}],
 [/^irDoMais\('(aval|fin|seg|torneio|graf|fech|profs)'\)$/,{pag:'$1',nav:'Mais'}],
 [/^irAcessosAluno\(\)$/,{pag:'seg',nav:'Mais'}],
 [/^fecharMais\(\);gerenciarPacotes\(\)$/,{pag:'dash',ov:'ov-pacotes-lista'}],
 [/^go\('(dash|agenda|alunos|lanc)',this\)$/,{pag:'$1',nav:{dash:'Início',agenda:'Agenda',alunos:'Alunos',lanc:'Caixa'}}],
];
const PULA=/exportBackup|avatar-gestao-file|toggleHide|shiftMonth|^if\(event/;
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
  const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
  await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}#toast{display:none!important}'});
  await g.evaluate(()=>{persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';
   const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:1,locCred:0,mensalidade:640,status:'pendente',arquivado:false,diaVenc:10},x||{});
   DB.alunos=[al('a1','Aluno Um'),al('a2','Aluno Dois',{status:'pago'})];ensureFields();CARREGADO=true;renderAll();});
  const antes=await g.evaluate(()=>JSON.stringify(DB.alunos));
  const SEL='#pg-dash [onclick], .nav [onclick], #mais-pop [onclick], #ov-menu-inicio [onclick], #pg-fin [onclick^="verLanc"]';
  const lista=await g.evaluate(SEL=>{go('dash',document.querySelector('.nav button'));renderAll();
   return [...document.querySelectorAll(SEL)].map(e=>e.getAttribute('onclick'));},SEL);
  const unicos=[...new Set(lista)].filter(oc=>!PULA.test(oc));
  await check('todo atalho tem destino conhecido ('+unicos.length+' atalhos)',async()=>{
   assert.deepEqual(unicos.filter(oc=>!DESTINOS.some(([re])=>re.test(oc))),[],'atalho novo: diga para onde ele leva em DESTINOS');
  });
  await check('cada atalho abre a tela certa, a janela certa e acende o botão certo da barra',async()=>{
   const falhas=[];
   for(const oc of unicos){
    const [re,d]=DESTINOS.find(([re])=>re.test(oc));const m=oc.match(re);
    const pag=d.pag.replace('$1',m[1]||''),nav=typeof d.nav==='object'?d.nav[m[1]]:d.nav;
    const ok=await g.evaluate(({oc,SEL})=>{
     document.querySelectorAll('.overlay.on').forEach(o=>o.classList.remove('on'));if(typeof fecharMais==='function')fecharMais();
     go('dash',document.querySelector('.nav button'));renderAll();window.scrollTo(0,0);filtroLancCat=null;
     let e=[...document.querySelectorAll(SEL)].find(x=>x.getAttribute('onclick')===oc);
     if(!e&&/verLanc/.test(oc)){go('fin',document.createElement('button'));e=[...document.querySelectorAll(SEL)].find(x=>x.getAttribute('onclick')===oc);}
     if(!e)return {erro:'não achei'};
     e.click();return {};},{oc,SEL});
    if(ok.erro){falhas.push(oc+': '+ok.erro);continue;}
    await g.waitForTimeout(150);
    const r=await g.evaluate(()=>({pag:document.body.dataset.pagina,ov:[...document.querySelectorAll('.overlay.on')].map(o=>o.id),
     nav:[...document.querySelectorAll('.nav button.on')].map(b=>b.innerText.replace(/\d+/g,'').trim()),
     ag:typeof agView!=='undefined'?agView:'',filtro:filtroLancCat,mais:!!document.querySelector('#mais-pop.on,#mais-pop.aberto,.mais-pop.on')}));
    const erro=[];
    if(r.pag!==pag)erro.push('tela '+r.pag+' ≠ '+pag);
    if(d.ov==='*'){}else if(d.ov&&!r.ov.includes(d.ov))erro.push('janela '+r.ov+' ≠ '+d.ov);else if(!d.ov&&r.ov.length)erro.push('abriu '+r.ov);
    if(nav&&(r.nav.length!==1||r.nav[0]!==nav))erro.push('barra '+r.nav+' ≠ '+nav);
    if(d.extra==='dia'&&r.ag!=='dia')erro.push('agenda em '+r.ag);
    if(d.extra==='mes'&&r.ag!=='mes')erro.push('agenda em '+r.ag);
    if(d.extra==='filtro'&&r.filtro!==m[1])erro.push('filtro '+r.filtro);
    if(d.extra==='mais'&&!r.mais)erro.push('Mais não abriu');
    if(erro.length)falhas.push(oc+' → '+erro.join('; '));
   }
   assert.deepEqual(falhas,[]);
  });
  await check('a varredura não muda nada nos alunos',async()=>{
   assert.equal(await g.evaluate(()=>JSON.stringify(DB.alunos)),antes);
  });
  assert.deepEqual(erros,[]);await c.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · atalhos da Gestão levam ao lugar certo');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

/* App do aluno: um pacote, um saldo (07/11, pedido do João: "corrija o texto e
   os números sem mexer no visual"). A dupla cadastrada do jeito novo guarda o
   pacote em planoGrupo/credGrupo, e o app mostrava "Dupla · sem pacote",
   "Créditos 0", avisava "seus créditos acabaram" a cada aula marcada e o
   assistente respondia "0 créditos". Agora o cartão "Créditos" mostra o saldo
   do pacote; o segundo cartão só aparece no misto ou com sobra no outro saldo.
   Os cartões continuam os mesmos (mesmas peças, mesma ordem). Dados fictícios. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-11-09T10:00:00-03:00');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
const base_={codigo:'6701',nome:'Aluna Fictícia',repos:0,locCred:0,mensalidade:360,status:'pago',ativo:true,grupoTipo:''};
const ALUNOS={
 duplaNova:{...base_,tipo:'Dupla',plano:0,planoGrupo:4,grupoTipo:'Dupla',creditos:0,credGrupo:3},
 duplaNovaZero:{...base_,tipo:'Dupla',plano:0,planoGrupo:4,grupoTipo:'Dupla',creditos:0,credGrupo:0},
 duplaNovaSobra:{...base_,tipo:'Dupla',plano:0,planoGrupo:4,grupoTipo:'Dupla',creditos:1,credGrupo:3},
 duplaAntiga:{...base_,tipo:'Dupla',plano:4,planoGrupo:0,creditos:4,credGrupo:-1},
 particular:{...base_,tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,mensalidade:640},
 misto:{...base_,tipo:'Particular',plano:2,planoGrupo:2,grupoTipo:'Dupla',creditos:2,credGrupo:1,mensalidade:500}};
const PUB={horas:['08:00','09:00'],profs:[],horarioCfg:{},horarioData:{},termoVer:0,historico:{},alunos:[],precos:{locacao:70},torneio:null,grade:{fixos:[],excecoes:[],eventos:[]}};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.clock.setSystemTime(AGORA);await p.goto(base+'/app-aluno/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof render==='function'&&typeof saldoPacoteAluno==='function');
  await p.addStyleTag({content:'#feriado-box,#login,#barra-app,#barra-versao,#toast,.va-bt,#va-bt{display:none!important}'});
  const abrir=k=>p.evaluate(({eu,P})=>{
   init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-test';
   EU=JSON.parse(JSON.stringify(eu));P.alunos=[EU];PUB=P;MEU={codigo:EU.codigo,pedidos:[],cancelados:[],confirmadas:[]};VINCULO_ESTADO='ativo';
   window.__toasts=[];if(!window.__t0)window.__t0=toast;toast=function(x){__toasts.push(x);return __t0(x);};
   document.getElementById('app').style.display='block';document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
   render();
   const sg=document.getElementById('scard-grupo');
   return {cred:document.getElementById('v-cred').textContent,plano:document.getElementById('v-plano').textContent,
    grupo:sg.style.display==='none'?null:(sg.querySelector('.l').textContent+' '+document.getElementById('v-grupo').textContent),
    cartoes:document.querySelectorAll('#bloco-saldo .scard').length,quadro:meuQuadro()};
  },{eu:ALUNOS[k],P:JSON.parse(JSON.stringify(PUB))});
  const voz=()=>p.evaluate(()=>{JVVozAluno.abrir();const t=document.getElementById('va-texto');t.value='quantos créditos eu tenho';JVVozAluno.enviar();
   const txt=document.getElementById('va-conversa').innerText;JVVozAluno.fechar();return txt;});

  await check('dupla nova: "Créditos" mostra o saldo do pacote, plano "Dupla · Flex 4", sem cartão extra',async()=>{
   const r=await abrir('duplaNova');
   assert.equal(r.cred,'3');assert.equal(r.plano,'Dupla · Flex 4');assert.equal(r.grupo,null);
   assert.equal(r.cartoes,4,'mesmos cartões de antes');
   assert.match(r.quadro,/3 crédito\(s\)/);assert.doesNotMatch(r.quadro,/0 crédito|de grupo/);
  });
  await check('dupla nova: o assistente responde o saldo do pacote',async()=>{
   await abrir('duplaNova');const t=await voz();
   assert.match(t,/Você tem 3 créditos\./,t);assert.doesNotMatch(t,/0 créditos/);
  });
  await check('dupla nova: resumo do mês mostra o saldo do pacote',async()=>{
   await abrir('duplaNova');const t=await p.evaluate(()=>{renderResumoMes();return document.getElementById('aulas-mes-resumo').innerText;});
   assert.match(t,/saldo: 3 créditos/,t);assert.doesNotMatch(t,/em grupo\b.*saldo|0 créditos/);
  });
  await check('marcar aula: "seus créditos acabaram" só quando o saldo do pacote é zero',async()=>{
   const avisos=async k=>{await abrir(k);return p.evaluate(()=>{agDate=new Date('2026-11-11T12:00:00');
    slotState=()=>({st:'livre'});bloqueadoParaAgendar=()=>false;__toasts=[];
    try{abrirBook('09:00',false,false);}catch(e){}return __toasts.join('|');});};
   assert.doesNotMatch(await avisos('duplaNova'),/créditos acabaram/,'dupla com 3 no pacote não leva aviso');
   assert.match(await avisos('duplaNovaZero'),/créditos acabaram/);
   assert.doesNotMatch(await avisos('particular'),/créditos acabaram/);
  });
  await check('sobra no outro saldo aparece no segundo cartão com o nome certo',async()=>{
   const r=await abrir('duplaNovaSobra');assert.equal(r.cred,'3');assert.equal(r.grupo,'Aulas particulares 1');
   assert.match(r.quadro,/3 crédito\(s\), 1 particular\(es\)/);
  });
  await check('dupla antiga e particular continuam como antes',async()=>{
   let r=await abrir('duplaAntiga');assert.equal(r.cred,'4');assert.equal(r.plano,'Dupla · Flex 4');assert.equal(r.grupo,'Aulas em grupo -1');
   r=await abrir('particular');assert.equal(r.cred,'3');assert.equal(r.plano,'Particular · Flex 4');assert.equal(r.grupo,null);
   assert.match(r.quadro,/3 crédito\(s\)/);
  });
  await check('misto: os dois saldos, como antes, e o plano com as duas partes',async()=>{
   const r=await abrir('misto');assert.equal(r.cred,'2');assert.equal(r.grupo,'Aulas em grupo 1');
   assert.equal(r.plano,'Particular · Flex 2 + 2 em dupla');
   assert.match(r.quadro,/2 crédito\(s\), 1 de grupo/);
  });
  assert.deepEqual(erros,[],'sem erro na página: '+erros.join(' | '));
  console.log('\n'+count+' verificações do saldo do pacote no app do aluno passaram.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error('❌',e.message||e);process.exit(1);});

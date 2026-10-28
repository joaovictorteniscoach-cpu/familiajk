/* Surpresa do campeão no app do aluno (28/10, pedido do João: "coloque uma
   surpresa quando o aluno ganhar o torneio, tipo confete").
   Quando o João encerra a etapa, quem ficou em 1º do grupo vê o cartão de
   CAMPEÃO com confete por cima (antes o confete caía atrás do fundo escuro);
   "Comemorar" solta mais confete. Aparece uma vez por etapa. O 1º é o mesmo da
   Gestão (pontos, vitórias e, no empate, a ordem do grupo). Com "reduzir
   movimento" ligado no celular, o cartão aparece sem a animação.
   Só dados fictícios, nuvem simulada, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-28T10:00:00-03:00');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
async function contexto(browser,base,opts){
 const c=await browser.newContext(Object.assign({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'},opts||{}));
 await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
 return c;
}
const eu={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true};
const torneio=(jog,encerrada)=>({id:'tor1',nome:'Barragem Primavera',tipo:'grupos',etapa:3,encerrada,nomesGrupos:{},jogadores:jog});
const CAMPEAO=[{name:'Aluno Fictício',cod:'6601',group:'A',v:4,d:0,wo:0,order:1},{name:'Jogador Dois',group:'A',v:2,d:2,wo:0,order:0},{name:'Jogador Três',group:'A',v:1,d:3,wo:0,order:2}];

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const movimento of ['normal','reduzido']){
   const ca=await contexto(browser,base,movimento==='reduzido'?{reducedMotion:'reduce'}:{});
   const p=await ca.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.accept());
   await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof aulasAgendadasAluno==='function');
   await p.addStyleTag({content:'#toast,#feriado-box,#login{display:none!important}'});
   const abrir=(jog,encerrada,limpar=true)=>p.evaluate(({eu,t,limpar})=>{
    init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-test';
    if(limpar)Object.keys(localStorage).filter(k=>k.startsWith('jvt-tor-fim-')).forEach(k=>localStorage.removeItem(k));
    document.querySelectorAll('.tp-ov,.evo-confete').forEach(x=>x.remove());
    EU=JSON.parse(JSON.stringify(eu));PUB={horas:['08:00'],profs:[],horarioCfg:{},horarioData:{},termoVer:0,grade:{fixos:[],eventos:[],excecoes:[]},historico:{},alunos:[EU],torneio:t};
    MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[]};window.fbDB={ref:()=>({push:async()=>{},update:async()=>{}})};
    atualizarGradeReserva=async()=>{};saveMeu=async()=>{};notificarLocal=()=>{};VINCULO_ESTADO='ativo';
    document.getElementById('app').style.display='block';document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
    render();goAluno('torneio',null);
   },{eu,t:torneio(jog,encerrada),limpar});
   const estado=()=>p.evaluate(()=>{
    const ov=document.querySelector('.tp-ov'),cvs=[...document.querySelectorAll('canvas.evo-confete')];
    const pintado=cv=>{const x=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<x.length;i+=16)if(x[i]>0)n++;return n;};
    return {card:ov?[...ov.querySelector('.tp-card').classList].filter(c=>c!=='tp-card').join(' '):'',titulo:ov?ov.querySelector('.tp-title').textContent:'',
     botao:ov?ov.querySelector('.tp-close').textContent:'',confetes:cvs.length,pintado:cvs.reduce((n,cv)=>n+pintado(cv),0),
     zConfete:cvs[0]?Number(getComputedStyle(cvs[0]).zIndex):0,zCartao:ov?Number(getComputedStyle(ov).zIndex):0,
     toque:cvs[0]?getComputedStyle(cvs[0]).pointerEvents:''};});

   await check(movimento+': etapa encerrada e eu em 1º → cartão CAMPEÃO'+(movimento==='normal'?' com confete por cima dele':' sem animação'),async()=>{
    await abrir(CAMPEAO,true);await p.waitForTimeout(1300);
    const r=await estado();
    assert.equal(r.card,'champ');assert.equal(r.titulo,'CAMPEÃO');assert.match(r.botao,/Comemorar/);
    if(movimento==='normal'){
     assert.ok(r.confetes>=1,'tem confete');assert.ok(r.pintado>50,'o confete aparece na tela ('+r.pintado+' pontos pintados)');
     assert.ok(r.zConfete>r.zCartao,'confete fica por cima do cartão ('+r.zConfete+' > '+r.zCartao+')');
     assert.equal(r.toque,'none','o confete não pega o toque');
    }else assert.equal(r.confetes,0,'com "reduzir movimento" não anima');
    if(process.env.JV_SHOTS&&movimento==='normal')await p.screenshot({path:path.join(process.env.JV_SHOTS,'campeao-confete.png')});
   });
   await check(movimento+': "Comemorar" '+(movimento==='normal'?'solta mais confete e ':'')+'fecha; a surpresa não volta na mesma etapa',async()=>{
    const antes=(await estado()).confetes;
    await p.locator('.tp-close').click();await p.waitForTimeout(500);
    const r=await estado();
    assert.equal(r.card,'','cartão fechou');
    if(movimento==='normal')assert.ok(r.confetes>antes||r.confetes>=1&&r.pintado>50,'mais confete ao comemorar');
    await abrir(CAMPEAO,true,false);await p.waitForTimeout(1000);
    assert.equal((await estado()).card,'','uma vez por etapa');
   });
   if(movimento==='normal'){
    await check('confete some sozinho depois de alguns segundos',async()=>{
     await abrir(CAMPEAO,true);await p.waitForTimeout(1300);const r0=await estado();assert.ok(r0.confetes>=1,JSON.stringify(r0));
     await p.locator('.tp-close').click();
     await p.waitForFunction(()=>!document.querySelector('canvas.evo-confete'),null,{timeout:15000});
    });
    await check('empate em pontos e vitórias: vale a ordem do grupo, igual à Gestão',async()=>{
     const emp=[{name:'Aluno Fictício',cod:'6601',group:'A',v:3,d:1,wo:0,order:1},{name:'Jogador Dois',group:'A',v:3,d:1,wo:0,order:0}];
     await abrir(emp,true);await p.waitForTimeout(900);
     assert.equal((await estado()).card,'vice','o outro está antes na ordem do grupo → eu sou vice');
     await abrir(emp.map(j=>Object.assign({},j,{order:1-j.order})),true);await p.waitForTimeout(900);
     assert.equal((await estado()).card,'champ');
    });
    await check('etapa ainda em andamento: nada de cartão nem confete',async()=>{
     await abrir(CAMPEAO,false);await p.waitForTimeout(900);
     const r=await estado();assert.equal(r.card,'');assert.equal(r.confetes,0);
    });
    await check('3º lugar: cartão "etapa concluída", sem confete',async()=>{
     await abrir(CAMPEAO.map(j=>j.cod?Object.assign({},j,{v:0,d:4}):j),true);await p.waitForTimeout(900);
     const r=await estado();assert.equal(r.card,'fim');assert.equal(r.confetes,0);
    });
   }
   assert.deepEqual(erros,[],'erros na página');
   await ca.close();
  }
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · confete do campeão no app do aluno');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

/* Botão de voz arrastável (21/10, pedido do João), na Gestão e no app do
   aluno: tocar abre o assistente; arrastar leva o botão para outro lugar sem
   abrir nada; a posição fica guardada no aparelho (volta igual ao abrir de
   novo) e o botão nunca sai da tela, nem ao girar o celular.
   Só dados fictícios. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-21T10:00:00-03:00');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
const APPS=[
 {nome:'Aluno',url:'/app-aluno/',bt:'#va-atalho',painel:'#va-painel',chave:'jv-va-posicao',
  pronto:()=>window.JVVozAluno&&typeof render==='function',
  entrar:()=>{init=async()=>{};EU={codigo:'6601',nome:'Aluna Teste',tipo:'Particular',plano:4,creditos:3,mensalidade:640,status:'pago'};
   PUB={horas:['07:00'],profs:[],horarioCfg:{},horarioData:{},reservasRespostas:[],historico:{},alunos:[EU],grade:{fixos:[],excecoes:[],eventos:[]}};
   MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[],espera:[]};
   document.getElementById('login').style.display='none';document.getElementById('app').style.display='block';try{render();}catch(e){}},
  fechar:()=>JVVozAluno.fechar()},
 {nome:'Gestão',url:'/app-gestao/',bt:'#voz-atalho',painel:'#voz-painel',chave:'jv-voz-posicao',
  pronto:()=>typeof CARREGADO!=='undefined'&&CARREGADO&&window.JVAcoesVoz,
  entrar:()=>{MODO='dono';window._espacoAberto=true;window.AUTH_USER={uid:UID_DONO};
   document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
   try{renderAll();}catch(e){}go('dash',document.querySelector('.nav button'));},
  fechar:()=>JVAcoesVoz.fechar(true)}
];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const A of APPS){
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');
    window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;
    window.SpeechSynthesisUtterance=function(t){this.text=t;};try{speechSynthesis.speak=()=>{};speechSynthesis.cancel=()=>{};}catch(e){}});
   const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
   await p.clock.setFixedTime(AGORA);
   const abrirApp=async()=>{
    await p.goto(base+A.url,{waitUntil:'load'});await p.waitForFunction(A.pronto,null,{timeout:20000});
    await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast,#barra-app{display:none!important}'});
    await p.evaluate(A.entrar);await p.waitForFunction(s=>!document.querySelector(s).hidden,A.bt,{timeout:8000});
   };
   await abrirApp();
   const caixa=()=>p.locator(A.bt).boundingBox();
   const painelAberto=()=>p.evaluate(s=>!document.querySelector(s).hidden,A.painel);
   await check(A.nome+': tocar no botão abre o assistente (como antes)',async()=>{
    await p.click(A.bt);assert.equal(await painelAberto(),true);await p.evaluate(A.fechar);
   });
   await check(A.nome+': arrastar leva o botão para outro lugar e não abre o assistente',async()=>{
    const b0=await caixa();
    await p.mouse.move(b0.x+b0.width/2,b0.y+b0.height/2);await p.mouse.down();
    for(let i=1;i<=10;i++)await p.mouse.move(b0.x+b0.width/2-25*i,b0.y+b0.height/2-30*i);
    await p.mouse.up();await p.waitForTimeout(100);
    const b1=await caixa();
    assert.ok(Math.abs(b1.x-(b0.x-250))<3&&Math.abs(b1.y-(b0.y-300))<3,'foi para onde o dedo levou: '+JSON.stringify([b0,b1]));
    assert.equal(await painelAberto(),false,'arrastar não abre');
    await p.waitForTimeout(400);await p.click(A.bt);assert.equal(await painelAberto(),true,'depois de arrastar, tocar abre');await p.evaluate(A.fechar);
   });
   await check(A.nome+': mexer poucos pixels conta como toque (abre, não arrasta)',async()=>{
    const b0=await caixa();
    await p.mouse.move(b0.x+20,b0.y+20);await p.mouse.down();await p.mouse.move(b0.x+23,b0.y+22);await p.mouse.up();
    assert.equal(await painelAberto(),true);await p.evaluate(A.fechar);
    const b1=await caixa();assert.deepEqual([Math.round(b1.x),Math.round(b1.y)],[Math.round(b0.x),Math.round(b0.y)]);
   });
   await check(A.nome+': nunca sai da tela, nem ao girar o celular; a posição fica guardada ao abrir de novo',async()=>{
    const b0=await caixa();
    await p.mouse.move(b0.x+20,b0.y+20);await p.mouse.down();
    for(let i=1;i<=10;i++)await p.mouse.move(b0.x+20-80*i,b0.y+20-120*i);
    await p.mouse.up();await p.waitForTimeout(100);
    let b=await caixa();assert.ok(b.x>=8&&b.y>=48,'preso dentro da tela: '+JSON.stringify(b));
    const salvo=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),A.chave);assert.ok(salvo&&salvo.x>=0&&salvo.y>0);
    await p.setViewportSize({width:844,height:390});await p.waitForTimeout(150);
    b=await caixa();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=844&&b.y+b.height<=390,'deitado: '+JSON.stringify(b));
    await p.setViewportSize({width:390,height:844});
    await abrirApp();
    const b2=await caixa();assert.ok(Math.abs(b2.x-8)<2&&Math.abs(b2.y-48)<2,'mesma posição ao abrir de novo: '+JSON.stringify(b2));
   });
   assert.deepEqual(erros,[]);await c.close();
  }
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · botão de voz arrastável (Gestão e aluno)');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

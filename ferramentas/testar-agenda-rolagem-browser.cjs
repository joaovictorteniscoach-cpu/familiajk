/* Agenda: ir até o horário de agora sem rolagem animada (29/10). No iPhone, a
   rolagem animada com o cabeçalho encolhendo no meio do caminho deixava a tela
   desencaixada: o topo atrás do relógio e a barra de baixo no meio da tela
   (print do João). Agora a Agenda abre já no horário de agora, com o cabeçalho
   encolhido, de uma vez só; trocar de tela volta ao topo sem animação.
   Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-29T11:42:00-03:00');   // quinta-feira
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block',hasTouch:true,isMobile:true});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
  await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,null,{timeout:40000});
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast{display:none!important}'});
  await g.evaluate(()=>{persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';
   const al=(id,nome)=>({id,nome,codigo:id,tipo:'Particular',plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true,diaVenc:10});
   DB.alunos=[al('a1','Aluno Um Teste'),al('a2','Aluno Dois Teste')];
   DB.agenda={fixos:[{id:'f1',dia:4,hora:'06:00',titulo:'Aluno Um Teste',tipo:'aula',alunoId:'a1',desde:'2026-10-01'},
    {id:'f2',dia:4,hora:'11:00',titulo:'Aluno Dois Teste',tipo:'aula',alunoId:'a2',desde:'2026-10-01'},
    {id:'f3',dia:4,hora:'12:00',titulo:'Almoço',tipo:'bloqueio',desde:'2026-10-01'}],eventos:[],excecoes:[]};
   ensureFields();CARREGADO=true;agView='dia';agDate=new Date();renderAll();
   // conta cada rolagem pedida e se veio animada
   window.__rolagens=[];const orig=window.scrollTo.bind(window);
   window.scrollTo=function(a,b){const anim=typeof a==='object'?a.behavior:getComputedStyle(document.documentElement).scrollBehavior;__rolagens.push(anim);return orig(a,b);};
  });

  await check('abrir a Agenda leva ao horário de agora de uma vez, com o cabeçalho já encolhido',async()=>{
   await g.evaluate(()=>{__rolagens=[];go('agenda',document.querySelector('.nav button[onclick*="agenda"]'));});
   await g.waitForTimeout(150);   // a ida ao horário de agora sai 80 ms depois de abrir
   const r=await g.evaluate(()=>{const ag=document.querySelector('#pg-agenda .agora');const b=ag.getBoundingClientRect();
    return {y:window.scrollY,max:document.documentElement.scrollHeight-innerHeight,topoAgora:Math.round(b.top),alt:innerHeight,compacto:document.querySelector('.top').classList.contains('compacto'),
     rolagens:__rolagens,estilo:document.documentElement.style.scrollBehavior,css:getComputedStyle(document.documentElement).scrollBehavior};});
   assert.ok(r.y>100,'rolou até o horário de agora (scrollY '+r.y+')');
   // a ~1/3 da tela, ou a página toda rolada quando não há mais para onde descer
   assert.ok(Math.abs(r.topoAgora-Math.round(r.alt*0.32))<=6||Math.abs(r.y-r.max)<=1,'o horário de agora fica a ~1/3 da tela ('+r.topoAgora+' de '+r.alt+'; rolou '+r.y+' de '+r.max+')');
   assert.ok(r.topoAgora>60&&r.topoAgora<r.alt-120,'o horário de agora fica à vista, fora do cabeçalho e da barra de baixo');
   assert.equal(r.compacto,true,'cabeçalho encolhido antes de rolar');
   assert.ok(r.rolagens.length>=2&&r.rolagens.every(x=>x==='auto'),'nenhuma rolagem animada: '+r.rolagens.join(','));
   assert.equal(r.estilo,'','o estilo da página volta ao normal depois');assert.equal(r.css,'smooth','rolagem suave continua para o resto');
  });
  await check('trocar de tela volta ao topo sem animação',async()=>{
   await g.evaluate(()=>{__rolagens=[];go('alunos',document.querySelector('.nav button[onclick*="alunos"]'));});
   await g.waitForTimeout(120);
   const r=await g.evaluate(()=>({y:window.scrollY,rolagens:__rolagens}));
   assert.equal(r.y,0);assert.deepEqual(r.rolagens,['auto']);
  });
  await check('a rede de proteção do iPhone não rola nada quando a tela está encaixada',async()=>{
   await g.evaluate(()=>{go('agenda',document.querySelector('.nav button[onclick*="agenda"]'));});
   await g.waitForTimeout(200);
   const y0=await g.evaluate(()=>{window.__rolouPor=0;const o=window.scrollBy.bind(window);window.scrollBy=(a,b)=>{__rolouPor++;return o(a,b);};return window.scrollY;});
   await g.evaluate(y0=>window.scrollTo(0,Math.max(0,y0-150)),y0);await g.waitForTimeout(500);   // rolagem comum, como a do dedo
   const r=await g.evaluate(()=>({por:__rolouPor,off:visualViewport.offsetTop,y:window.scrollY}));
   assert.equal(r.off,0);assert.equal(r.por,0,'nenhum empurrão quando não precisa');
   assert.equal(r.y,Math.max(0,y0-150),'a página fica onde a pessoa deixou');
  });
  assert.deepEqual(erros,[]);
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · Agenda vai ao horário de agora sem rolagem animada');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

/* Textos longos encolhidos (20/10). Explicação com mais de 3 linhas mostra só
   as 2 primeiras e uma setinha "▾ ver mais" que abre e fecha; texto curto fica
   como está; o texto inteiro continua na página. Medido nos dois temas.
   Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-20T08:00:00-03:00');
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
  for(const tema of ['saibro','classico']){
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');try{localStorage.setItem('jv-tema',t);}catch(e){}},tema);
   const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
   await g.clock.install({time:AGORA});await g.goto(base+'/app-gestao/',{waitUntil:'load'});
   await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
   await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}#toast{display:none!important}'});
   await g.evaluate(()=>{persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';
    DB.alunos=[{id:'a1',nome:'Aluno Um',codigo:'a1',tipo:'Particular',plano:4,creditos:2,repos:0,mensalidade:640,status:'pago',arquivado:false}];
    ensureFields();CARREGADO=true;renderAll();go('graf',document.createElement('button'));});
   await g.clock.runFor(400);
   const estado=()=>g.evaluate(()=>[...document.querySelectorAll('#pg-graf p.hint')].filter(p=>p.offsetParent).map(p=>{
    const cs=getComputedStyle(p),lh=parseFloat(cs.lineHeight),b=p.nextElementSibling;
    return {enc:p.classList.contains('enc-curto'),aberto:p.classList.contains('enc-aberto'),linhas:Math.round(p.getBoundingClientRect().height/lh),total:Math.round(p.scrollHeight/lh),
     btn:b&&b.classList.contains('enc-btn')?b.textContent:null,txt:p.textContent.length};}));
   await check(tema+': explicação longa mostra 2 linhas + "▾ ver mais"; curta fica inteira',async()=>{
    const e=await estado();
    const longos=e.filter(x=>x.enc),curtos=e.filter(x=>!x.enc);
    assert.ok(longos.length>=3,'achou '+longos.length+' longos');
    longos.forEach(x=>{assert.ok(x.linhas<=2,'mostra '+x.linhas+' linhas');assert.ok(x.total>=3);assert.equal(x.btn,'▾ ver mais');});
    curtos.forEach(x=>{assert.equal(x.btn,null);assert.ok(x.linhas<=3,'curto com '+x.linhas+' linhas');});
   });
   await check(tema+': a setinha abre e fecha, sem perder texto',async()=>{
    const antes=await estado(),i=antes.findIndex(x=>x.enc);
    await g.evaluate(i=>{[...document.querySelectorAll('#pg-graf p.hint')].filter(p=>p.offsetParent)[i].nextElementSibling.click();},i);
    let d=(await estado())[i];assert.ok(d.aberto);assert.equal(d.linhas,d.total,'aberto mostra tudo');assert.equal(d.btn,'▴ ver menos');assert.equal(d.txt,antes[i].txt);
    await g.evaluate(i=>{[...document.querySelectorAll('#pg-graf p.hint')].filter(p=>p.offsetParent)[i].nextElementSibling.click();},i);
    d=(await estado())[i];assert.ok(!d.aberto);assert.ok(d.linhas<=2);assert.equal(d.btn,'▾ ver mais');
   });
   await check(tema+': janela que abre depois também encolhe (Segurança e dados)',async()=>{
    await g.evaluate(()=>go('seg',document.createElement('button')));await g.clock.runFor(400);
    const n=await g.evaluate(()=>[...document.querySelectorAll('#pg-seg p.hint.enc-curto')].filter(p=>p.offsetParent).length);
    assert.ok(n>=1,'encolheu '+n);
   });
   await check(tema+': setinha legível (medida na imagem)',async()=>{
    await g.evaluate(()=>{go('graf',document.createElement('button'));document.querySelector('#pg-graf .enc-btn').scrollIntoView({block:'center'});});await g.clock.runFor(300);
    const itens=(await medir(g)).filter(it=>/ver mais|ver menos/.test(it.t||''));
    assert.ok(itens.length>=1,'mediu '+itens.length);
    assert.deepEqual(itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>it.t+' '+it.ratio+' '+it.fg+' sobre '+it.fundo),[]);
   });
   assert.deepEqual(erros,[]);await c.close();
  }
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · textos longos encolhidos com setinha');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

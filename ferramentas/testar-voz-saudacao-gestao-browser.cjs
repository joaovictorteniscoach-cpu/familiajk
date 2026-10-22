/* Gestão: tocar no microfone (22/10, pedido do João). O assistente fala
   "Olá, Coach João! Em que posso te ajudar?" com voz masculina e só depois de
   terminar a fala começa a ouvir (nunca os dois juntos). Sem leitura em voz
   alta, ouve direto. Se o celular não deixar a escuta ligar sozinha, pede um
   toque em "Falar" em vez de dizer "permissão negada". Só dados fictícios. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-22T10:00:00-03:00');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');
   window.__ev=[];const ev=t=>window.__ev.push([t,performance.now()]);
   window.__modoRec='ok';
   window.SpeechRecognition=class{start(){ev('escuta');if(window.__modoRec==='negado')setTimeout(()=>this.onerror&&this.onerror({error:'not-allowed'}),20);}stop(){}abort(){}};
   window.webkitSpeechRecognition=undefined;
   window.SpeechSynthesisUtterance=function(t){this.text=t;};
   const vozes=[{name:'Luciana',lang:'pt-BR'},{name:'Felipe',lang:'pt-BR'}];
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>vozes,cancel(){},
    speak(u){ev('fala:'+u.text+'|'+(u.voice&&u.voice.name));setTimeout(()=>{ev('fim-fala');u.onend&&u.onend();},400);}}});});
  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-gestao/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO&&window.JVAcoesVoz,null,{timeout:20000});
  await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast{display:none!important}'});
  const entrar=()=>p.evaluate(()=>{MODO='dono';window._espacoAberto=true;window.AUTH_USER={uid:UID_DONO};
   document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));try{renderAll();}catch(e){}go('dash',document.querySelector('.nav button'));});
  await entrar();await p.waitForFunction(()=>!document.getElementById('voz-atalho').hidden);
  const ultimaMsg=()=>p.evaluate(()=>{const m=[...document.querySelectorAll('#voz-conversa .jv-voz-msg.assistente')].pop();return m?m.innerText:'';});
  await check('tocar no microfone: fala "Olá, Coach João! Em que posso te ajudar?" com voz masculina e só depois ouve',async()=>{
   await p.evaluate(()=>{window.__ev=[];document.getElementById('voz-ouvir').checked=true;});
   await p.click('#voz-atalho');await p.waitForTimeout(1100);
   const ev=await p.evaluate(()=>window.__ev);
   assert.deepEqual(ev.map(e=>e[0]),['fala:Olá, Coach João! Em que posso te ajudar?|Felipe','fim-fala','escuta']);
   assert.ok(ev[2][1]-ev[1][1]>=300,'espera a fala terminar: '+(ev[2][1]-ev[1][1]));
   assert.equal(await ultimaMsg(),'Olá, Coach João! Em que posso te ajudar?');
   await p.evaluate(()=>JVAcoesVoz.fechar(true));
  });
  await check('sem leitura em voz alta: não fala, já começa a ouvir',async()=>{
   await p.waitForFunction(()=>!document.getElementById('voz-atalho').hidden);
   await p.evaluate(()=>{window.__ev=[];document.getElementById('voz-ouvir').checked=false;});
   await p.click('#voz-atalho');await p.waitForTimeout(200);
   assert.deepEqual(await p.evaluate(()=>window.__ev.map(e=>e[0])),['escuta']);
   await p.evaluate(()=>{JVAcoesVoz.fechar(true);document.getElementById('voz-ouvir').checked=true;});
  });
  await check('celular que não deixa ligar a escuta sozinha: pede um toque em Falar (não diz "permissão negada")',async()=>{
   await p.waitForFunction(()=>!document.getElementById('voz-atalho').hidden);
   await p.evaluate(()=>{window.__ev=[];window.__modoRec='negado';});
   await p.click('#voz-atalho');await p.waitForTimeout(1200);
   assert.equal(await p.textContent('#voz-status'),'Toque em Falar e diga o seu pedido.');
   await p.evaluate(()=>{JVAcoesVoz.fechar(true);window.__modoRec='ok';});
  });
  assert.deepEqual(erros,[]);await c.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · Gestão: microfone cumprimenta e depois ouve');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

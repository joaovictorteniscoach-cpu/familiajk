/* App do aluno: microfone do assistente (20/10). Uma aluna falou e o app
   travou. Este teste imita o jeito do iPhone: texto repetido, celular que
   não avisa que parou de ouvir, fala tocando quando o aluno toca no
   microfone e microfone negado. Confere que:
   - a fala para antes do microfone ligar (nunca os dois ao mesmo tempo);
   - a resposta só é falada depois que o microfone solta o som;
   - a escuta sempre termina (sozinha, ou o app solta o microfone);
   - o texto não sai repetido e a resposta aparece;
   - a página continua respondendo.
   Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-20T07:00:00-03:00');
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
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>{
   sessionStorage.setItem('jv-bk-adiar','1');
   // reconhecimento de fala falso, com os jeitos do iPhone
   window.__ev=[];const ev=t=>window.__ev.push([t,performance.now()]);
   const R=(t,f)=>Object.assign([{transcript:t}],{isFinal:f});
   class FakeRec{
    start(){ev('start');const m=window.__modo||'normal',me=this;
     if(m==='negado'){setTimeout(()=>{me.onerror&&me.onerror({error:'not-allowed'});me.onend&&me.onend();},50);return;}
     setTimeout(()=>me.onresult&&me.onresult({resultIndex:0,results:[R('tem horário',false)]}),80);
     setTimeout(()=>me.onresult&&me.onresult({resultIndex:0,results:[R('tem horário livre amanhã',true)]}),160);
     setTimeout(()=>me.onresult&&me.onresult({resultIndex:0,results:[R('tem horário livre amanhã',true)]}),220);   // iPhone repete
     if(m==='normal')setTimeout(()=>{ev('end');me.onend&&me.onend();},300);
    }
    stop(){ev('stop');if(window.__modo!=='mudo')setTimeout(()=>{ev('end');this.onend&&this.onend();},40);}
    abort(){ev('abort');}
   }
   window.webkitSpeechRecognition=FakeRec;try{delete window.SpeechRecognition;}catch(e){}window.SpeechRecognition=undefined;
   window.__falando=false;
   window.SpeechSynthesisUtterance=function(t){this.text=t;};
   const ss=window.speechSynthesis;
   Object.defineProperty(ss,'speaking',{configurable:true,get:()=>window.__falando});
   Object.defineProperty(ss,'pending',{configurable:true,get:()=>false});
   ss.speak=u=>{ev('fala:'+u.text.slice(0,24));if(window.__recAtivo&&window.__recAtivo())ev('ERRO:falou-com-microfone');};
   ss.cancel=()=>{ev('cancela');window.__falando=false;};
  });
  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.clock.setFixedTime(AGORA);
  await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>window.JVVozAluno&&typeof slotState==='function');
  await p.evaluate(()=>{
   init=async()=>{};saveMeu=async()=>{};
   EU={codigo:'6601',nome:'Aluna Teste',tipo:'Particular',plano:4,creditos:3,credGrupo:0,repos:0,reposValidas:0,locCred:0,mensalidade:640,status:'pago',ativo:true};
   PUB={horas:['07:00','08:00','09:00','10:00'],profs:[],horarioCfg:{},horarioData:{},reservasRespostas:[],historico:{},alunos:[EU],grade:{fixos:[],excecoes:[],eventos:[]}};
   MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[],espera:[]};
   document.getElementById('login').style.display='none';document.getElementById('app').style.display='block';
   try{render();}catch(e){}
   window.__recAtivo=()=>document.getElementById('va-falar').classList.contains('ouvindo');
  });
  const t=(nome,ev)=>{const x=ev.find(e=>e[0].startsWith(nome));return x?x[1]:null;};
  const respondeu=()=>p.waitForFunction(()=>document.querySelectorAll('#va-conversa .va-eu').length>0&&!document.getElementById('va-falar').classList.contains('ouvindo'),null,{timeout:8000});

  await check('fala da saudação tocando: o app cala a fala e só depois liga o microfone',async()=>{
   await p.evaluate(()=>{window.__modo='normal';const c=document.getElementById('va-ouvir');c.checked=true;c.dispatchEvent(new Event('change'));JVVozAluno.fechar();window.__ev=[];JVVozAluno.abrir();window.__falando=true;});
   await p.click('#va-falar');
   await respondeu();await p.waitForTimeout(900);
   const ev=await p.evaluate(()=>window.__ev);
   assert.ok(t('fala:Bom dia, Aluna!',ev)!==null,'saudação falada');
   const ca=t('cancela',ev),st=t('start',ev);
   assert.ok(ca!==null&&st!==null&&st-ca>=300,'microfone liga depois de a fala parar: '+(st-ca));
   assert.ok(!ev.some(e=>e[0].startsWith('ERRO')),'nunca fala com o microfone ligado');
  });
  await check('resposta só é falada depois que o microfone solta o som; texto sem repetição',async()=>{
   const ev=await p.evaluate(()=>window.__ev);
   const fim=t('end',ev),fala=ev.filter(e=>e[0].startsWith('fala:')).pop();
   assert.ok(fala&&fala[0].startsWith('fala:Horários livres'),'responde: '+(fala&&fala[0]));
   assert.ok(fala[1]-fim>=500,'espera o microfone: '+(fala[1]-fim));
   const r=await p.evaluate(()=>({eu:[...document.querySelectorAll('#va-conversa .va-eu')].pop().textContent,bt:document.querySelector('#va-falar span').textContent}));
   assert.equal(r.eu,'tem horário livre amanhã');assert.equal(r.bt,'Toque e fale');
  });
  await check('celular que não avisa que parou: o app solta o microfone sozinho e responde',async()=>{
   await p.evaluate(()=>{window.__modo='mudo';window.__ev=[];JVVozAluno.fechar();JVVozAluno.abrir();});
   await p.click('#va-falar');
   await respondeu();
   const ev=await p.evaluate(()=>window.__ev.map(e=>e[0]));
   assert.ok(ev.includes('stop')&&ev.includes('abort'),'para e solta: '+ev.join(','));
   assert.equal(await p.evaluate(()=>[...document.querySelectorAll('#va-conversa .va-eu')].pop().textContent),'tem horário livre amanhã');
   assert.equal(await p.textContent('#va-falar span'),'Toque e fale');
  });
  await check('tocar de novo para parar também solta o microfone, mesmo sem aviso do celular',async()=>{
   await p.evaluate(()=>{window.__modo='mudo';window.__ev=[];JVVozAluno.fechar();JVVozAluno.abrir();});
   await p.click('#va-falar');await p.waitForTimeout(250);await p.click('#va-falar');
   await respondeu();
   assert.equal(await p.textContent('#va-falar span'),'Toque e fale');
  });
  await check('microfone negado: avisa e volta ao normal; fechar no meio da escuta não deixa nada preso',async()=>{
   await p.evaluate(()=>{window.__modo='negado';JVVozAluno.fechar();JVVozAluno.abrir();});
   await p.click('#va-falar');await p.waitForTimeout(200);
   assert.match(await p.textContent('#va-status'),/Sem permissão para o microfone/);
   assert.equal(await p.textContent('#va-falar span'),'Toque e fale');
   await p.evaluate(()=>{window.__modo='mudo';JVVozAluno.fechar();JVVozAluno.abrir();});
   await p.click('#va-falar');await p.waitForTimeout(150);
   await p.evaluate(()=>JVVozAluno.fechar());await p.waitForTimeout(2000);
   const r=await p.evaluate(()=>({aberto:!document.getElementById('va-painel').hidden,ouvindo:document.getElementById('va-falar').classList.contains('ouvindo'),conv:document.querySelectorAll('#va-conversa .va-eu').length}));
   assert.deepEqual(r,{aberto:false,ouvindo:false,conv:0},'fechou sem enviar nada');
  });
  await check('a página continua respondendo (sem laço) e mexer em estilos da página não dispara o assistente',async()=>{
   const n=await p.evaluate(async()=>{let q=0;const orig=document.querySelector.bind(document);
    document.querySelector=(s)=>{if(s==='.overlay.on')q++;return orig(s);};
    for(let i=0;i<300;i++)document.querySelectorAll('#apg-inicio *').forEach((el,j)=>{if(j<20)el.style.outline=i%2?'0':'';});
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));document.querySelector=orig;return q;});
   assert.equal(n,0,'mudanças de estilo da página não acordam o assistente');
   const t0=Date.now();await p.evaluate(()=>1+1);assert.ok(Date.now()-t0<2000);
  });
  assert.deepEqual(erros,[]);await c.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · microfone do assistente do aluno');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

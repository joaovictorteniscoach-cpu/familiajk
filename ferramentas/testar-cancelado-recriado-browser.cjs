/* App do aluno: cancelamento guardado no aparelho (20/10). Caso real: o
   aluno tinha cancelado pelo app uma aula; o João marcou de novo uma aula no
   mesmo dia e hora, e o app seguia mostrando "Cancelamento aguardando" — na
   grade, "Reserva" — no lugar de "Sua aula". Apagar e criar de novo não
   adiantava, porque o aviso ficava preso no aparelho. Confere: a resposta
   "cancelado" da Gestão, a aula que saiu da agenda e a data passada tiram o
   aviso; o cancelamento ainda não processado continua aparecendo como
   pendente. Na Gestão, a conferência só lista quem está nessa situação.
   Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-20T07:00:00-03:00');   // terça
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
  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.accept());
  await p.clock.setFixedTime(AGORA);
  await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof slotState==='function'&&typeof limparCancelados==='function');
  const prepara=(cancelados,respostas,eventos)=>p.evaluate(({cancelados,respostas,eventos})=>{
   saveMeu=async()=>{window.__salvou=(window.__salvou||0)+1;};
   PUB={grade:{fixos:[],eventos,excecoes:[]},reservasRespostas:respostas,horas:['08:00','09:00','10:00'],alunos:[]};
   MEU={codigo:'6601',pedidos:[],cancelados:JSON.parse(JSON.stringify(cancelados)),confirmadas:[]};
   conferirRespostasReservas();
   const d=new Date('2026-10-20T12:00:00');
   return {s8:slotState(d,'08:00').st,s9:slotState(d,'09:00'),fica:MEU.cancelados.map(c=>c.data+' '+c.hora)};
  },{cancelados,respostas,eventos});
  const aula=(id,hora,data)=>({id,cod:'6601',data:data||'2026-10-20',hora,tipo:'aula'});
  await check('caso real: cancelou 09h, a Gestão aplicou ("cancelado") e o João marcou de novo → "Sua aula"',async()=>{
   const r=await prepara([{data:'2026-10-20',hora:'09:00',id:'c1',ts:1}],[{id:'c1',estado:'cancelado',data:'2026-10-20',hora:'09:00'}],[aula('e1','08:00'),aula('e2','09:00')]);
   assert.equal(r.s8,'meu');assert.equal(r.s9.st,'meu');assert.equal(r.s9.label,'Minha aula');assert.deepEqual(r.fica,[]);
  });
  await check('a aula cancelada saiu da agenda publicada → o aviso sai do aparelho (mesmo sem resposta)',async()=>{
   const r=await prepara([{data:'2026-10-20',hora:'09:00',id:'c2',ts:1}],[],[aula('e1','08:00')]);
   assert.deepEqual(r.fica,[]);
  });
  await check('cancelamento ainda não processado continua pendente (a aula ainda está na agenda, sem resposta)',async()=>{
   const r=await prepara([{data:'2026-10-20',hora:'09:00',id:'c3',ts:1}],[],[aula('e1','08:00'),aula('e2','09:00')]);
   assert.equal(r.s9.st,'ocup');assert.match(r.s9.label,/Cancelamento aguardando/);assert.deepEqual(r.fica,['2026-10-20 09:00']);
  });
  await check('data passada sai; recusado continua com o aviso de sempre',async()=>{
   const r=await prepara([{data:'2026-10-10',hora:'09:00',id:'c4',ts:1},{data:'2026-10-20',hora:'09:00',id:'c5',ts:1}],[{id:'c5',estado:'recusado',motivo:'Cancelamento fora do prazo.',data:'2026-10-20',hora:'09:00'}],[aula('e2','09:00')]);
   assert.deepEqual(r.fica,[]);assert.equal(r.s9.st,'meu');
  });
  await check('sem agenda carregada não apaga nada (não dá para saber)',async()=>{
   const r=await p.evaluate(()=>{PUB={reservasRespostas:[]};MEU={codigo:'6601',pedidos:[],cancelados:[{data:'2026-10-20',hora:'09:00',id:'c6',ts:1}],confirmadas:[]};limparCancelados();return MEU.cancelados.length;});
   assert.equal(r,1);
  });
  assert.deepEqual(erros,[]);await c.close();

  // Gestão: só lista quem cancelou e foi marcado de novo
  const c2=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c2.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c2.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
  const g=await c2.newPage(),erros2=[];g.on('pageerror',e=>erros2.push(e.message));g.on('dialog',d=>d.dismiss());
  await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await check('Gestão: Conferir números lista quem cancelou pelo app e teve a aula marcada de novo, sem mudar nada',async()=>{
   const r=await g.evaluate(()=>{persist=()=>{};publish=()=>{};MODO='dono';
    DB.alunos=[{id:'a1',nome:'Aluno Um',codigo:'6601',tipo:'Particular',plano:4,creditos:4,mensalidade:640,status:'pago',arquivado:false},
               {id:'a2',nome:'Aluno Dois',codigo:'6602',tipo:'Particular',plano:4,creditos:4,mensalidade:640,status:'pago',arquivado:false}];
    DB.agenda={fixos:[],excecoes:[],eventos:[{id:'e2',data:'2026-10-20',hora:'09:00',titulo:'Aluno Um',tipo:'aula',alunoId:'a1'}]};
    DB.respostasReservas=[{id:'c1',codigo:'6601',estado:'cancelado',data:'2026-10-20',hora:'09:00'},{id:'c9',codigo:'6602',estado:'cancelado',data:'2026-10-20',hora:'10:00'}];
    ensureFields();CARREGADO=true;const antes=JSON.stringify(DB);
    const t1=achadosDoAluno(DB.alunos[0]).map(x=>x.txt).join(' || '),t2=achadosDoAluno(DB.alunos[1]).map(x=>x.txt).join(' || ');
    return {t1,t2,igual:JSON.stringify(DB)===antes};});
   assert.match(r.t1,/Aluno Um cancelou pelo app 20\/10 09:00 e a aula foi marcada de novo nesse horário/);
   assert.doesNotMatch(r.t2,/cancelou pelo app/,'sem aula marcada de novo, não entra');
   assert.ok(r.igual,'só lista');
  });
  assert.deepEqual(erros2,[]);await c2.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · cancelamento guardado no aparelho');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

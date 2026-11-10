/* Agenda do aluno: o Livre vale para qualquer atividade permitida.
   O toque revela as opções; fechado aparece Ocupado. Dados fictícios. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-20T07:00:00-03:00');   // terça, 7h
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
const HORAS=['07:00','10:00','13:00','17:00','20:00','21:00'];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.clock.setFixedTime(AGORA);
  await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof renderAgenda==='function');
  await p.evaluate(({HORAS})=>{
   init=async()=>{};saveMeu=async()=>{};
   EU={codigo:'6601',nome:'Aluno Teste',tipo:'Particular',plano:4,creditos:3,credGrupo:0,repos:0,reposValidas:0,locCred:0,mensalidade:640,status:'pago',ativo:true};
   PUB={horas:HORAS,profs:[],horarioCfg:{},horarioData:{'2026-10-21':{'21:00':'fechado'}},reservasRespostas:[],historico:{},alunos:[EU],
    precos:{avulsaPart:170,avulsaGrupo:95,locacao:70,personal:130},grupoPreco:{dupla:90,trio:85,quarteto:80},
    grade:{fixos:[],excecoes:[],eventos:[{id:'l1',cod:'7701',data:'2026-10-22',hora:'13:00',tipo:'locacao'}]}};
   MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[],espera:[]};
   document.getElementById('login').style.display='none';document.getElementById('app').style.display='block';
   try{render();}catch(e){}
   goAluno('agenda',document.getElementById('nav-al-agenda'));
   agDate=new Date(2026,9,21,12);setView('semana',document.querySelector('#apg-agenda .seg button[onclick*=semana]'));
  },{HORAS});
  const celula=(dia,hora)=>p.evaluate(({dia,hora})=>{   // dia = coluna (1 = segunda)
   const tr=[...document.querySelectorAll('#ag-view table.wk tr')].find(r=>r.querySelector('td.hr')&&r.querySelector('td.hr').textContent===hora);
   const b=tr.querySelectorAll('td')[dia].querySelector('button');return {txt:b.textContent,cls:b.className};
  },{dia,hora});
  const semana=()=>p.evaluate(()=>{agDate=new Date(2026,9,21,12);setView('semana',document.querySelector('#apg-agenda .jv-ref-ag-tabs button[onclick*=semana]'));});
  const tocar=hora=>p.evaluate(hora=>{document.getElementById('ov-pick').classList.remove('on');
   const tr=[...document.querySelectorAll('#ag-view table.wk tr')].find(r=>r.querySelector('td.hr')&&r.querySelector('td.hr').textContent===hora);
   tr.querySelectorAll('td')[3].querySelector('button').click();
   return {on:document.getElementById('ov-pick').classList.contains('on'),sub:document.getElementById('pick-sub').textContent,op:document.getElementById('pick-opts').innerText};},hora);
  await check('semana: Livre para aula, locação e participação; Ocupado quando fechado',async()=>{
   await semana();
   assert.deepEqual(await celula(3,'13:00'),{txt:'Livre',cls:'wc livre'});
   assert.deepEqual(await celula(3,'10:00'),{txt:'Livre',cls:'wc livre'});
   assert.deepEqual(await celula(4,'13:00'),{txt:'Livre',cls:'wc livre'});
   assert.deepEqual(await celula(3,'21:00'),{txt:'Ocupado',cls:'wc ocup'});
   assert.deepEqual(await celula(1,'13:00'),{txt:'Passou',cls:'wc passou'});
  });
  await check('toque no Livre só de locação abre locação e torneio, sem aula nem reposição',async()=>{
   const r=await tocar('13:00');
   assert.ok(r.on);assert.match(r.sub,/21 de outubro · 13:00/);
   assert.match(r.op,/Alugar a quadra/);assert.match(r.op,/torneio/);
   assert.doesNotMatch(r.op,/Agendar aula|Pedir reposição aqui/);
  });
  await check('toque no Livre de aula mostra aula, locação e torneio juntos',async()=>{
   await semana();const r=await tocar('17:00');
   assert.ok(r.on);assert.match(r.op,/Agendar aula/);assert.match(r.op,/Alugar a quadra/);assert.match(r.op,/torneio/);
  });
  await check('dia e mês usam qualquer atividade; consulta explícita de aula continua funcionando',async()=>{
   const r=await p.evaluate(()=>{
    document.getElementById('ov-pick').classList.remove('on');agDate=new Date(2026,9,21,12);agView='dia';renderAgenda();
    const dia=document.getElementById('ag-view').innerText;
    agView='mes';renderAgenda();const cel=[...document.querySelectorAll('#ag-view .cal-day')].find(b=>b.querySelector('span')&&b.querySelector('span').textContent==='21');
    return {dia,livres:cel.querySelector('.liv').textContent,hojeAula:livresNoDia(new Date(2026,9,20,12),'aula'),hojeLoc:livresNoDia(new Date(2026,9,20,12),'loc')};
   });
   assert.match(r.dia,/13:00\s*Livre/);assert.match(r.dia,/10:00\s*Livre/);assert.match(r.dia,/21:00\s*Ocupado/);
   assert.equal(r.livres,'5 liv.');assert.equal(r.hojeAula,2);assert.equal(r.hojeLoc,5);
  });
  assert.deepEqual(erros,[]);await c.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · semana: Livre/Ocupado e atividades após o toque');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

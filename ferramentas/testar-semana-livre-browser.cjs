/* App do aluno: tabela da semana (20/10, pedido do João). O horário só de
   locação aparecia como "Loc.", que parecia o cadeado de "Fechado". Agora
   aparece como "Livre" (verde) e o toque abre só as opções que existem
   naquele horário: aula, locação, torneio. Fechado continua "Fechado".
   Só dados fictícios, relógio fixo. */
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
  await check('semana: horário só de locação aparece "Livre" e verde, sem "Loc."',async()=>{
   const t=await p.locator('#ag-view').innerText();
   assert.doesNotMatch(t,/Loc\./);
   assert.deepEqual(await celula(3,'13:00'),{txt:'Livre',cls:'wc livre'},'quarta 13h (só locação)');
   assert.deepEqual(await celula(3,'10:00'),{txt:'Livre',cls:'wc livre'},'quarta 10h (aula)');
   assert.deepEqual(await celula(4,'13:00'),{txt:'Locação',cls:'wc livre'},'quinta 13h: locação de outro, dá para participar');
   assert.deepEqual(await celula(3,'21:00'),{txt:'Fechado',cls:'wc fechado'},'fechado continua fechado');
   assert.deepEqual(await celula(1,'13:00'),{txt:'Passou',cls:'wc passou'},'segunda já passou');
  });
  await check('tocar no "Livre" de locação abre só as opções daquele horário (locação, torneio; sem aula)',async()=>{
   await p.evaluate(()=>{const tr=[...document.querySelectorAll('#ag-view table.wk tr')].find(r=>r.querySelector('td.hr')&&r.querySelector('td.hr').textContent==='13:00');tr.querySelectorAll('td')[3].querySelector('button').click();});
   const r=await p.evaluate(()=>({on:document.getElementById('ov-pick').classList.contains('on'),sub:document.getElementById('pick-sub').textContent,op:document.getElementById('pick-opts').innerText}));
   assert.ok(r.on);assert.match(r.sub,/21 de outubro · 13:00/);
   assert.match(r.op,/Alugar a quadra/);assert.doesNotMatch(r.op,/Agendar aula/);
  });
  await check('tocar no "Livre" de aula abre aula, locação e torneio',async()=>{
   await p.evaluate(()=>{document.getElementById('ov-pick').classList.remove('on');const tr=[...document.querySelectorAll('#ag-view table.wk tr')].find(r=>r.querySelector('td.hr')&&r.querySelector('td.hr').textContent==='17:00');tr.querySelectorAll('td')[3].querySelector('button').click();});
   const op=await p.evaluate(()=>document.getElementById('pick-opts').innerText);
   assert.match(op,/Agendar aula/);assert.match(op,/Alugar a quadra/);
  });
  await check('dia: só locação aparece "Disponível · ver opções"; mês conta esses horários como livres',async()=>{
   const r=await p.evaluate(()=>{document.getElementById('ov-pick').classList.remove('on');agDate=new Date(2026,9,21,12);agView='dia';renderAgenda();const dia=document.getElementById('ag-view').innerText;
    agView='mes';renderAgenda();const cel=[...document.querySelectorAll('#ag-view .cal-day')].find(b=>b.querySelector('span')&&b.querySelector('span').textContent==='21');
    return {dia,liv:cel.querySelector('.liv').textContent,hoje:livresNoDia(new Date(2026,9,20,12))};});
   assert.doesNotMatch(r.dia,/Sem aula|Só locação/);assert.match(r.dia,/13:00\s*Disponível/);
   assert.equal(r.liv,'5 liv.','quarta: 07, 10, 13, 17, 20 (21h fechado)');
   assert.equal(r.hoje,5,'hoje: 07h já passou, não conta');
  });
  assert.deepEqual(erros,[]);await c.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · semana: locação aparece como livre');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

/* App do aluno: "O que você quer marcar?" (05/11, pedido do João). A agenda
   mostrava "Disponível · ver opções" também no horário que é só de locação ou
   torneio, e o aluno tocava achando que tinha aula. Agora ele escolhe antes
   (🎾 Aula · 🔑 Locação · 🏆 Torneio): só fica verde o que serve para isso, o
   resto aparece apagado com o nome do que é, o toque no verde abre só as
   opções daquela atividade e, sem nenhum horário, um aviso leva ao que há.
   Só dados fictícios, relógio fixo, nuvem simulada. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-11-09T07:00:00-03:00');   // segunda
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
const QUA='2026-11-11',QUI='2026-11-12';
const eu={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:1,locCred:0,mensalidade:640,status:'pago',ativo:true};
const cfgDia={'08:00':'aula','12:00':'loc','14:00':'aula','16:00':'aula','18:00':'aula','19:00':'aula'};
const pub=torneio=>({horas:['08:00','12:00','14:00','16:00','18:00','19:00'],profs:[],
 horarioCfg:{3:cfgDia,4:{'08:00':'loc','12:00':'loc','14:00':'loc','16:00':'loc','18:00':'loc','19:00':'loc'}},horarioData:{},termoVer:0,historico:{},alunos:[eu],precos:{locacao:70},
 torneio:torneio?{id:'t1',nome:'Barragem',tipo:'grupos',etapa:1,encerrada:false,jogadores:[{name:'Aluno Fictício',cod:'6601',group:'A'},{name:'Outro',group:'A'}]}:null,
 grade:{fixos:[],excecoes:[],eventos:[
  {id:'e14',data:QUA,hora:'14:00',tipo:'aula',cod:'9001',fora:1},                 // aula do João fora da quadra: livre para locação/torneio
  {id:'e16',data:QUA,hora:'16:00',tipo:'locacao',cod:'9002'},                      // locação de outro aluno: participar
  {id:'e18',data:QUA,hora:'18:00',tipo:'grupo',cod:'9003',pessoas:2},              // aula em dupla com vaga
  {id:'e19',data:QUA,hora:'19:00',tipo:'aula',cod:'9004'}]}});                     // ocupado
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.clock.setSystemTime(AGORA);await p.goto(base+'/app-aluno/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof slotState==='function');
  await p.addStyleTag({content:'#feriado-box,#login,#barra-app,#barra-versao,#toast,.va-bt,#va-bt{display:none!important}'});
  const abrir=(torneio,quer)=>p.evaluate(({eu,P,quer})=>{
   init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-test';
   try{if(quer)localStorage.setItem('jv-ag-quer',quer);else localStorage.removeItem('jv-ag-quer');}catch(e){}
   agQuer=null;EU=JSON.parse(JSON.stringify(eu));PUB=P;MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[]};VINCULO_ESTADO='ativo';
   window.__toasts=[];const t0=toast;toast=function(x){__toasts.push(x);return t0(x);};
   document.getElementById('app').style.display='block';document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
   render();goAluno('agenda',null);
  },{eu,P:pub(torneio),quer});
  const dia=dk=>p.evaluate(dk=>{agView='dia';agDate=new Date(dk+'T12:00:00');renderAgenda();
   return [...document.querySelectorAll('#ag-view .slot')].map(s=>{const b=s.querySelector('.sl');return s.querySelector('.slot-h').textContent+' '+b.className.replace('sl ','')+' '+b.textContent.replace(/\s+/g,' ').trim();});},dk);
  const opcoes=(dk,h)=>p.evaluate(({dk,h})=>{agDate=new Date(dk+'T12:00:00');escolherSlot(h);const o=[...document.querySelectorAll('#pick-opts .pick-opt')].map(b=>b.className.replace('pick-opt ',''));
   document.getElementById('ov-pick').classList.remove('on');return o;},{dk,h});

  await abrir(false);
  await check('Aula (padrão de quem tem plano): só o que tem aula fica verde; locação e "locação ou torneio" ficam apagados com o nome',async()=>{
   const l=await dia(QUA);
   assert.deepEqual(l,['08:00 livre Disponível agendar aula','12:00 outra Livre para locação','14:00 outra Livre para locação',
    '16:00 outra Livre para locação','18:00 livre Aula em dupla participar','19:00 ocup Reservado toque para entrar na lista de espera']);
   assert.doesNotMatch(l.join(' '),/sem aula|ausente/i,'nunca "sem aula" (decisão de 27/10)');
   assert.equal(await p.evaluate(()=>document.querySelector('#ag-quer button.on').dataset.quer),'aula');
   assert.equal(await p.evaluate(()=>document.querySelector('#ag-quer button[data-quer="tor"]').hidden),true,'sem torneio, a aba some');
   assert.equal(await p.evaluate(()=>document.querySelector('#apg-agenda .lg-livre').textContent),'Livre para aula');
  });
  await check('tocar no verde abre só as opções de aula; no apagado, avisa o que ele é',async()=>{
   assert.deepEqual(await opcoes(QUA,'08:00'),['aula','repo']);
   await p.evaluate(()=>{__toasts=[];avisoOutra('2026-11-11','12:00');});
   assert.match(await p.evaluate(()=>__toasts[0]),/Às 12:00: livre para locação\. Para marcar, escolha 🔑 Locação lá em cima\./);
  });
  await check('Locação: fica verde onde dá para alugar; a aula em grupo fica apagada; o toque abre só a locação',async()=>{
   await p.evaluate(()=>setQuer('loc'));
   const l=await dia(QUA);
   assert.deepEqual(l.map(x=>x.split(' ').slice(0,2).join(' ')),['08:00 livre','12:00 livre','14:00 livre','16:00 livre','18:00 outra','19:00 ocup']);
   assert.match(l[3],/Locação participar/);assert.match(l[4],/outra Aula em grupo$/);
   assert.deepEqual(await opcoes(QUA,'12:00'),['loc']);assert.deepEqual(await opcoes(QUA,'08:00'),['loc']);
   assert.equal(await p.evaluate(()=>localStorage.getItem('jv-ag-quer')),'loc','lembrado neste aparelho');
  });
  await check('dia sem nenhum horário de aula: aviso e botão que mostra os de locação',async()=>{
   await p.evaluate(()=>setQuer('aula'));
   await dia(QUI);
   const t=await p.evaluate(()=>document.querySelector('#ag-view .ag-sem').textContent);
   assert.match(t,/Nenhum horário livre para aula neste dia\./);assert.match(t,/Ver 6 horários livres para locação/);
   await p.locator('#ag-view .ag-sem-bt').click();
   assert.equal(await p.evaluate(()=>querAtual()),'loc');
   assert.equal(await p.evaluate(()=>document.querySelectorAll('#ag-view .ag-sem').length),0);
  });
  await check('semana: verde só o que serve; o resto apagado com o nome curto; o mês conta só o que serve',async()=>{
   await p.evaluate(()=>setQuer('aula'));
   const r=await p.evaluate(()=>{agView='semana';agDate=new Date('2026-11-11T12:00:00');renderAgenda();
    const col=[...document.querySelectorAll('.wk tr')].slice(1).map(tr=>tr.querySelectorAll('td')[3]).map(td=>{const b=td.querySelector('.wc');return b.className.replace('wc ','')+':'+b.textContent;});
    agView='mes';renderAgenda();const cel=[...document.querySelectorAll('.cal-day')].find(b=>b.querySelector('span')&&b.querySelector('span').textContent==='11');
    return {col,mes:cel.querySelector('.liv')?cel.querySelector('.liv').textContent:''};});
   assert.deepEqual(r.col,['livre:Livre','outra:Locação','outra:Locação','outra:Locação','livre:Dupla','ocup:Reserva']);
   assert.equal(r.mes,'2 liv.');
  });
  await check('voz pedindo aula com "Locação" escolhido abre as opções de aula',async()=>{
   await p.evaluate(()=>setQuer('loc'));
   const o=await p.evaluate(()=>{gotoBook(2026,10,11,'08:00','aula');const o=[...document.querySelectorAll('#pick-opts .pick-opt')].map(b=>b.className.replace('pick-opt ',''));document.getElementById('ov-pick').classList.remove('on');return o;});
   assert.deepEqual(o,['aula','repo']);
  });
  await check('com torneio: aba Torneio aparece e o toque abre só o torneio',async()=>{
   await abrir(true,'tor');
   assert.equal(await p.evaluate(()=>document.querySelector('#ag-quer button[data-quer="tor"]').hidden),false);
   const l=await dia(QUA);
   assert.deepEqual(l.map(x=>x.split(' ').slice(0,2).join(' ')),['08:00 livre','12:00 livre','14:00 livre','16:00 outra','18:00 outra','19:00 ocup']);
   assert.deepEqual(await opcoes(QUA,'14:00'),['tor']);
  });
  await check('quem só aluga a quadra (sem plano) começa em Locação',async()=>{
   eu.plano=0;await abrir(false);eu.plano=4;
   assert.equal(await p.evaluate(()=>querAtual()),'loc');
  });
  await check('leitura (contraste) da agenda com a escolha, na imagem da tela',async()=>{
   await abrir(false,'aula');await dia(QUI);
   const itens=(await medir(p)).filter(it=>/apg-agenda|ag-quer|ag-sem|ag-view/.test(it.onde||''));
   assert.ok(itens.length>=10,'mediu '+itens.length);
   assert.deepEqual(itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>it.t+' '+it.ratio+' '+it.fg+' sobre '+it.fundo+' · '+it.onde),[]);
   if(process.env.JV_SHOTS)await p.screenshot({path:path.join(process.env.JV_SHOTS,'agenda-quer.png')});
  });
  assert.deepEqual(erros,[]);
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · agenda do aluno mostra só o que serve para o que ele quer marcar');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

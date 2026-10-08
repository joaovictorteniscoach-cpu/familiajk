/* (1) Reposição no agendamento do aluno usa o mesmo saldo do cartão
   (reposValidas), não o número antigo; (2) horário fixo: o app confere as
   semanas como a Gestão (inclusive "só locação", compromisso e 90 dias) e
   oferece marcar só a data escolhida, em vez de "enviado" e depois "não
   confirmada". Dados fictícios, rede externa bloqueada, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let f=path.join(root,decodeURI(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
 catch{res.writeHead(404).end();}
});
const AGORA=new Date('2026-10-15T10:00:00-03:00');           // quinta-feira
const eu={codigo:'7701',nome:'Aluno Fictício',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:2,reposValidas:0,locCred:0,mensalidade:640,status:'pago',ativo:true};
const pubFixture={grade:{fixos:[],eventos:[],excecoes:[]},historico:{'7701':[]},horas:['09:00','10:00','17:00'],profs:[],horarioCfg:{},horarioData:{},termoVer:0,alunos:[eu]};
let count=0;
async function check(name,fn){await fn();count++;console.log('✅ '+name);}

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,b=await chromium.launch({headless:true});
 const rota=c=>c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
  if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 try{
  const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});await rota(c);
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  let aceitar=false;const dialogos=[];p.on('dialog',d=>{dialogos.push(d.message());aceitar?d.accept():d.dismiss();});
  await p.clock.setFixedTime(AGORA);
  await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof confirmarAgendamento==='function');
  await p.addStyleTag({content:'#toast,#feriado-box,#login{display:none!important}'});
  const preparar=(extra={})=>p.evaluate(({pub,eu,extra})=>{
   init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u1';
   EU=Object.assign(JSON.parse(JSON.stringify(eu)),extra.eu||{});PUB=JSON.parse(JSON.stringify(pub));PUB.alunos=[EU];
   if(extra.horarioData)PUB.horarioData=extra.horarioData;
   if(extra.eventos)PUB.grade.eventos=extra.eventos;
   MEU={codigo:'7701',pedidos:[],cancelados:[],confirmadas:[]};
   window.envios=[];window.toasts=[];toast=m=>window.toasts.push(m);
   window.fbDB={ref:cam=>({update:async u=>{window.envios.push({cam,u});},push:async i=>{window.envios.push({cam,i});},on:()=>{}})};
   atualizarGradeReserva=async()=>{};saveMeu=async()=>{};notificarJoao=()=>{};abrirWhatsApp=()=>{};pedirPermissaoNotif=()=>{};
   _reservaEnviando=false;VINCULO_ESTADO='ativo';
   document.getElementById('app').style.display='block';document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
   document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
   render();agDate=new Date(2026,9,16,12);                     // sexta 16/10
  },{pub:pubFixture,eu,extra});

  /* ---------- (1) reposição ---------- */
  await check('reposições vencidas (cartão 0, número antigo 2): o agendamento não oferece reposição',async()=>{
   await preparar();
   const r=await p.evaluate(()=>{escolherSlot('09:00');const menu=document.getElementById('pick-opts').innerText;
    document.getElementById('ov-pick').classList.remove('on');abrirBook('09:00',true);
    return {menu,book:document.getElementById('ov-book').classList.contains('on'),toast:toasts.join(' | '),cartao:document.getElementById('v-repos').textContent,quadro:meuQuadro()};});
   assert.doesNotMatch(r.menu,/reposição/i);assert.equal(r.book,false);assert.match(r.toast,/não tem reposições/);
   assert.equal(r.cartao,'0');assert.doesNotMatch(r.quadro,/2 reposi/);
  });
  await check('com 1 reposição válida (número antigo 3): oferece e mostra "você tem 1"',async()=>{
   await preparar({eu:{repos:3,reposValidas:1}});
   const r=await p.evaluate(()=>{escolherSlot('09:00');return {menu:document.getElementById('pick-opts').innerText,cartao:document.getElementById('v-repos').textContent};});
   assert.match(r.menu,/Marcar reposição/);assert.match(r.menu,/você tem 1/);assert.equal(r.cartao,'1');
  });

  /* ---------- (2) horário fixo ---------- */
  const conflitos={horarioData:{'2026-10-30':{'09:00':'loc'}},eventos:[{id:'k1',data:'2026-11-06',hora:'09:00',tipo:'ocupado'}]};
  const pedirFixo=()=>p.evaluate(async()=>{
   document.getElementById('ov-pick').classList.remove('on');abrirBook('09:00',false);
   document.getElementById('b-rec').value='fixo';await confirmarAgendamento();
   return {envios:JSON.parse(JSON.stringify(envios)),pedidos:JSON.parse(JSON.stringify(MEU.pedidos)),toasts:toasts.join(' | ')};
  });
  await check('fixo com semana "só locação" e compromisso: avisa as datas antes e, se recusar, nada é enviado',async()=>{
   await preparar(conflitos);aceitar=false;dialogos.length=0;
   const r=await pedirFixo();
   assert.equal(dialogos.length,1);assert.match(dialogos[0],/30\/10 \(só locação\)/);assert.match(dialogos[0],/06\/11 \(reservado\)/);
   assert.match(dialogos[0],/só a aula de 16\/10/);
   assert.equal(r.envios.length,0);assert.equal(r.pedidos.length,0);
  });
  await check('se aceitar, envia só a aula da data escolhida (sem travar as outras semanas)',async()=>{
   await preparar(conflitos);aceitar=true;dialogos.length=0;
   const r=await pedirFixo();
   assert.equal(r.envios.length,1);assert.deepEqual(Object.keys(r.envios[0].u),['reserva_2026-10-16_0900']);
   assert.equal(r.envios[0].u['reserva_2026-10-16_0900'].rec,'pontual');assert.equal(r.pedidos[0].rec,'pontual');
  });
  await check('fixo sem conflito segue como antes: 13 semanas, sem pergunta (caso negativo)',async()=>{
   await preparar();aceitar=false;dialogos.length=0;
   const r=await pedirFixo();
   assert.equal(dialogos.length,0);assert.equal(r.envios.length,1);
   const ks=Object.keys(r.envios[0].u);assert.equal(ks.length,13);assert.equal(ks[0],'reserva_2026-10-16_0900');
   assert.equal(r.pedidos[0].rec,'fixo');
  });
  await check('reposição em semana "só locação" continua permitida (a Gestão aceita)',async()=>{
   await preparar({eu:{reposValidas:1},horarioData:{'2026-10-16':{'09:00':'loc'}}});aceitar=false;dialogos.length=0;
   const r=await p.evaluate(async()=>{abrirBook('09:00',true);await confirmarAgendamento();return envios.length;});
   assert.equal(r,1);assert.equal(dialogos.length,0);
  });
  assert.deepEqual(errors,[]);await c.close();

  /* ---------- Gestão publica 90 dias e compromisso como "ocupado" ---------- */
  const c2=await b.newContext({timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});await rota(c2);
  await c2.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const g=await c2.newPage(),gerr=[];g.on('pageerror',e=>gerr.push(e.message));g.on('dialog',d=>d.dismiss());
  await g.clock.setFixedTime(AGORA);
  await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,{},{timeout:15000});
  await check('Gestão publica 90 dias e o compromisso só como "ocupado" (sem título); nada é gravado',async()=>{
   const r=await g.evaluate(async()=>{
    window.gravacoes=0;persist=()=>{window.gravacoes++;};guardarVersoes=()=>{};logAct=()=>{};
    DB.alunos=[{id:'a1',nome:'Aluno Fictício',codigo:'7701',tipo:'Particular',plano:4,creditos:3,repos:0,status:'pago',mensalidade:640,ativo:true}];
    DB.agenda={fixos:[],eventos:[{id:'e75',data:'2026-12-29',hora:'09:00',titulo:'Aluno Fictício',tipo:'aula',alunoId:'a1'},
     {id:'e95',data:'2027-01-18',hora:'09:00',titulo:'Aluno Fictício',tipo:'aula',alunoId:'a1'}],excecoes:[]};
    DB.compromissos=[{id:'cp1',data:'2026-11-06',hora:'09:00',titulo:'Consulta particular do dono'},{id:'cp2',data:'2026-11-07',titulo:'Sem hora'}];
    ensureFields();CARREGADO=true;
    let cap=null;_abriuSemConferir=false;_semDados=false;window._espacoAberto=true;cloudPending=false;try{_conflitoNuvem=null;}catch(e){}
    ehDono=()=>true;hasCloud=()=>true;pareceSemente=()=>false;cloudSet=async()=>{};publicarSeguro=async p=>{cap=p;};
    window.fbDB={ref:()=>({set:async()=>{},update:async()=>{},get:async()=>({exists:()=>false,val:()=>null})})};
    const antes=JSON.stringify(DB);window.gravacoes=0;
    await doPublish();
    const ev=cap.grade.eventos;
    return {e75:ev.some(e=>e.id==='e75'),e95:ev.some(e=>e.id==='e95'),
     comp:ev.filter(e=>e.data==='2026-11-06'&&e.hora==='09:00').map(e=>e.tipo),
     semHora:ev.some(e=>e.data==='2026-11-07'),vazou:/Consulta particular/.test(JSON.stringify(cap)),
     igual:JSON.stringify(DB)===antes,gravacoes:window.gravacoes};
   });
   assert.equal(r.e75,true,'aula a 75 dias aparece para o aluno');assert.equal(r.e95,false,'além de 90 dias não vai');
   assert.deepEqual(r.comp,['ocupado']);assert.equal(r.semHora,false);assert.equal(r.vazou,false,'título do compromisso não sai');
   assert.equal(r.igual,true);assert.equal(r.gravacoes,0);
  });
  assert.deepEqual(gerr,[]);
  console.log('\n✅ '+count+' verificações · reposição e horário fixo');
 }catch(e){console.error('❌ '+(e&&e.message||e));process.exitCode=1;}
 finally{await b.close();server.close();}
})();

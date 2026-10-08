/* Trava de 4h no cancelamento, à prova de relógio e fuso errados no celular.
   Caso real (08/10): aula às 08:00, cancelamento às 05:24 — tem de ser recusado
   no app do aluno e, se chegar mesmo assim (versão antiga, relógio adulterado),
   a Gestão não aplica e avisa o aluno. Dados fictícios, rede externa bloqueada. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
const server=http.createServer((req,res)=>{
 let f=path.join(root,decodeURI(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
 catch{res.writeHead(404).end();}
});
const REAL=Date.parse('2026-10-08T05:24:00-03:00');            // hora de verdade (Brasília)
const H=3600e3,ALFA='-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
const chavePush=t=>{let c='';for(let i=0;i<8;i++){c=ALFA[t%64]+c;t=Math.floor(t/64);}return c+'qwertyuiopas';};
const eu={codigo:'6601',nome:'Aluna Fictícia',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true};
const pubFixture={grade:{fixos:[],eventos:[
 {id:'e8',cod:'6601',data:'2026-10-08',hora:'08:00',tipo:'aula'},
 {id:'e10',cod:'6601',data:'2026-10-08',hora:'10:00',tipo:'aula'}],excecoes:[]},
 historico:{'6601':[]},horas:['08:00','10:00'],profs:[],horarioCfg:{},horarioData:{},termoVer:0,alunos:[eu]};
let count=0;
async function check(name,fn){await fn();count++;console.log('✅ '+name);}

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,b=await chromium.launch({headless:true});
 const rota=async c=>c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
  if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 /* App do aluno num celular com fuso e relógio dados; offset = o que o servidor informa. */
 async function aluno(fuso,relogio,offset){
  const c=await b.newContext({viewport:{width:390,height:844},timezoneId:fuso,serviceWorkers:'block'});await rota(c);
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  await p.clock.setFixedTime(relogio);
  await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof aulasAgendadasAluno==='function');
  await p.addStyleTag({content:'#toast,#feriado-box,#login{display:none!important}'});
  await p.evaluate(({pub,eu,offset})=>{
   init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u1';
   EU=JSON.parse(JSON.stringify(eu));PUB=JSON.parse(JSON.stringify(pub));PUB.alunos=[EU];
   MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[]};
   window.envios=[];window.toasts=[];toast=m=>window.toasts.push(m);
   window.fbDB={ref:cam=>cam==='.info/serverTimeOffset'
    ?{on:(ev,cb)=>cb({val:()=>offset})}
    :{push:async item=>{window.envios.push({cam,item});}}};
   OFFSET_SERVIDOR=0;_ouvindoRelogio=false;
   atualizarGradeReserva=async()=>{};saveMeu=async()=>{};notificarJoao=()=>{};abrirWhatsApp=()=>{};
   ACOES_AULA_EM_CURSO.clear();VINCULO_ESTADO='ativo';
   document.getElementById('app').style.display='block';document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
   document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
   render();goAluno('aulas',null);
  },{pub:pubFixture,eu,offset});
  return {p,c,errors};
 }
 try{
  await check('celular certo: 05:24 não cancela a aula das 08:00 (nada é enviado)',async()=>{
   const {p,c,errors}=await aluno('America/Sao_Paulo',REAL,0);
   assert.equal(await p.evaluate(()=>cancelarAula('2026-10-08','08:00','pontual')),false);
   assert.equal(await p.evaluate(()=>envios.length),0);
   assert.equal(await p.evaluate(()=>podeCancelarAula('2026-10-08','08:00')),false);
   assert.deepEqual(errors,[]);await c.close();
  });
  await check('celular em outro fuso (UTC-5): a conta antiga dava 4h36 e liberava; agora recusa',async()=>{
   const {p,c,errors}=await aluno('America/Rio_Branco',REAL,0);
   assert.ok(await p.evaluate(()=>horasAte('2026-10-08','08:00'))>=4,'reproduz o defeito na conta antiga');
   assert.equal(await p.evaluate(()=>cancelarAula('2026-10-08','08:00','pontual')),false);
   assert.equal(await p.evaluate(()=>envios.length),0);
   assert.deepEqual(errors,[]);await c.close();
  });
  await check('relógio do celular 3h atrasado: a hora do servidor manda e recusa',async()=>{
   const {p,c,errors}=await aluno('America/Sao_Paulo',REAL-3*H,3*H);
   assert.ok(await p.evaluate(()=>horasAte('2026-10-08','08:00'))>=4,'reproduz o defeito na conta antiga');
   assert.equal(await p.evaluate(()=>cancelarAula('2026-10-08','08:00','pontual')),false);
   assert.equal(await p.evaluate(()=>envios.length),0);
   assert.match(await p.locator('#mine-list').innerText(),/08:00/);
   assert.deepEqual(errors,[]);await c.close();
  });
  await check('dentro do prazo (aula das 10:00, faltam 4h36) cancela e manda id para a resposta da Gestão',async()=>{
   const {p,c,errors}=await aluno('America/Sao_Paulo',REAL,0);
   assert.equal(await p.evaluate(()=>cancelarAula('2026-10-08','10:00','pontual')),true);
   const r=await p.evaluate(()=>({envios,MEU}));
   assert.equal(r.envios.length,1);assert.equal(r.envios[0].item.acao,'cancelar');assert.match(r.envios[0].item.id,/^c\d+/);
   assert.equal(r.MEU.cancelados[0].id,r.envios[0].item.id);
   await check('Gestão recusou: a aula volta a aparecer marcada e a aluna é avisada',async()=>{
    const v=await p.evaluate(id=>{
     PUB.reservasRespostas=[{id,codigo:'6601',estado:'recusado',motivo:'Cancelamento fora do prazo. Fale com o João.',data:'2026-10-08',hora:'10:00'}];
     conferirRespostasReservas();
     return {cancelados:MEU.cancelados.length,volta:!!aulaAgendadaAluno('2026-10-08','10:00'),toast:toasts.join(' | ')};
    },r.envios[0].item.id);
    assert.equal(v.cancelados,0);assert.equal(v.volta,true);assert.match(v.toast,/fora do prazo/);assert.doesNotMatch(v.toast,/desconto/i);
   });
   assert.deepEqual(errors,[]);await c.close();
  });

  /* ---------------- Gestão ---------------- */
  const c=await b.newContext({timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});await rota(c);
  await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const g=await c.newPage(),gerr=[];g.on('pageerror',e=>gerr.push(e.message));g.on('dialog',d=>d.dismiss());
  await g.clock.setFixedTime(REAL+6*60e3);                       // João sincroniza às 05:30
  await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,{},{timeout:15000});
  await check('Gestão lê a hora embutida na chave do Firebase',async()=>{
   assert.equal(await g.evaluate(k=>tsDaChavePush(k),chavePush(REAL)),REAL);
   assert.equal(await g.evaluate(()=>tsDaChavePush('reserva_2026-10-08_0800')),0);
  });
  await check('Gestão: relógio do celular mentindo não engana (tsServ e chave valem mais que ts)',async()=>{
   const r=await g.evaluate(({REAL,H,k})=>{
    const p={data:'2026-10-08',hora:'08:00'};
    return {
     servidorTarde:cancelamentoTardio({...p,ts:REAL-10*H,tsServ:REAL}),
     chaveTarde:cancelamentoTardio({...p,ts:REAL-10*H},k),
     servidorNoPrazo:cancelamentoTardio({...p,ts:REAL,tsServ:REAL-2*H}),
     tsFuturo:cancelamentoTardio({...p,ts:REAL+99*H})};
   },{REAL,H,k:chavePush(REAL)});
   assert.deepEqual(r,{servidorTarde:true,chaveTarde:true,servidorNoPrazo:false,tsFuturo:true});
  });
  await check('Gestão: cancelamento fora do prazo não sai da agenda e a resposta volta para a aluna',async()=>{
   let queue={};
   await g.exposeFunction('filaGet',()=>copy(queue));
   await g.exposeFunction('filaUpdate',u=>{for(const [k,v] of Object.entries(u)){if(k.includes('/')){const [a,f]=k.split('/');if(queue[a])queue[a][f]=v;}else if(v===null)delete queue[k];else queue[k]=v;}});
   const tarde=chavePush(REAL),noPrazo=chavePush(REAL-3*H);
   queue={[tarde]:{id:'c-tarde',acao:'cancelar',codigo:'6601',uid:'u1',nome:'Aluna Fictícia',data:'2026-10-08',hora:'08:00',rec:'pontual',ts:REAL-10*H,tsServ:REAL},
          [noPrazo]:{id:'c-ok',acao:'cancelar',codigo:'6601',uid:'u1',nome:'Aluna Fictícia',data:'2026-10-08',hora:'10:00',rec:'pontual',ts:REAL-3*H,tsServ:REAL-3*H}};
   const r=await g.evaluate(async()=>{
    persist=()=>{};guardarVersoes=()=>{};logAct=()=>{};window.toasts=[];toast=m=>window.toasts.push(m);
    DB.alunos=[{id:'a1',nome:'Aluna Fictícia',codigo:'6601',tipo:'Particular',plano:4,creditos:3,repos:0,status:'pago',mensalidade:640,ativo:true}];
    DB.agenda={fixos:[],eventos:[{id:'e8',data:'2026-10-08',hora:'08:00',titulo:'Aluna Fictícia',tipo:'aula',alunoId:'a1'},
     {id:'e10',data:'2026-10-08',hora:'10:00',titulo:'Aluna Fictícia',tipo:'aula',alunoId:'a1'}],excecoes:[]};
    DB.respostasReservas=[];ensureFields();
    const saldos=JSON.stringify(DB.alunos);
    _abriuSemConferir=false;_semDados=false;window._espacoAberto=true;cloudPending=false;try{_conflitoNuvem=null;}catch(e){}
    carregarVinculos=async()=>{};VINCULOS={u1:{ativo:true,codigo:'6601'}};gravarAgora=async()=>true;doPublish=async()=>{};
    window.fbDB={ref:()=>({get:async()=>{const q=await window.filaGet();return {exists:()=>Object.keys(q).length>0,val:()=>q};},update:u=>window.filaUpdate(u)})};
    await syncRequests(true);
    return {horas:DB.agenda.eventos.map(e=>e.hora),resp:DB.respostasReservas.map(x=>x.id+':'+x.estado),toasts:window.toasts.join(' | '),saldos:JSON.stringify(DB.alunos)===saldos};
   });
   assert.deepEqual(r.horas,['08:00'],'a aula das 08:00 continua; a das 10:00 (no prazo) foi cancelada');
   assert.deepEqual(r.resp.sort(),['c-ok:cancelado','c-tarde:recusado']);
   assert.match(r.toasts,/fora do prazo/);assert.equal(r.saldos,true,'nenhum saldo ou cadastro muda');
   assert.deepEqual(Object.keys(queue),[],'os dois pedidos saem da fila');
  });
  assert.deepEqual(gerr,[]);
  console.log('\n✅ '+count+' verificações · trava de cancelamento');
 }catch(e){console.error('❌ '+(e&&e.message||e));process.exitCode=1;}
 finally{await b.close();server.close();}
})();

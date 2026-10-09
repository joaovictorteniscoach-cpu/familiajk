/* Pagamentos exatos e proteção entre aparelhos. Dados fictícios; rede externa bloqueada.
   O Firebase é simulado com transação atômica e repetição em caso de concorrência. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
const server=http.createServer((req,res)=>{
 let f=path.join(root,decodeURI(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
 catch{res.writeHead(404).end();}
});
const fixture={alunos:[
 {id:'solo',nome:'Aluno Exato Teste',codigo:'9901',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,repos:2,credGrupo:0,mensalidade:735,status:'pendente',valorAula:160,diaVenc:10,ativo:true,tel:'11999900001'},
 {id:'pai',nome:'Responsável Teste',codigo:'9902',tipo:'Particular',plano:4,creditos:2,repos:1,mensalidade:1200,status:'pendente',diaVenc:15,ativo:true},
 {id:'filho',nome:'Dependente Teste',codigo:'9903',tipo:'Particular',plano:3,creditos:1,repos:3,mensalidade:0,responsavelId:'pai',parentesco:'Filho(a)',status:'pendente',ativo:true}
],agenda:{fixos:[],eventos:[],excecoes:[]},movs:[],presencas:[],lancamentos:[],compromissos:[],meta:10000,savedAt:1,mesPagamentos:'2026-10',mesCreditos:'2026-10'};
let count=0,remote=null,race=null,deny=false,cloudWrites=0,auxWrites=0;
async function check(name,fn){await fn();count++;console.log('✅ '+name);}
async function setup(context,base,theme='saibro'){
 await context.route('**/*',r=>{
  const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
  if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});
  return r.continue();
 });
 await context.addInitScript(({fixture,theme})=>{
  localStorage.setItem('jvtenis-gestao-v1',JSON.stringify(fixture));
  if(theme==='classico')localStorage.setItem('jv-tema','classico');
  sessionStorage.setItem('jv-bk-adiar','1');
 },{fixture,theme});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 let accept=true;p.on('dialog',d=>accept?d.accept():d.dismiss());
 p.setAccept=v=>{accept=v;};
 await p.exposeFunction('testCloudRead',()=>{if(deny)throw Error('permission_denied');return copy(remote);});
 await p.exposeFunction('testCloudCommit',({expected,next})=>{
  if(deny)throw Error('permission_denied');
  if(race){remote=copy(race);race=null;}
  if(JSON.stringify(remote)!==JSON.stringify(expected))return {committed:false,current:copy(remote)};
  remote=copy(next);cloudWrites++;return {committed:true,current:copy(remote)};
 });
 await p.exposeFunction('testAuxWrite',()=>{auxWrites++;});
 await p.goto(base+'/app-gestao/',{waitUntil:'load'});
 await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,{},{timeout:15000});
 await p.evaluate(f=>{
  window.testPersist=persist;window.testBackupNuvem=backupNuvem;window.testBackupDia=backupDoDia;
  persist=()=>{};guardarVersoes=raw=>{window.testSavedCopy=JSON.parse(raw);};logAct=()=>{};
  DB=JSON.parse(JSON.stringify(f));ensureFields();CARREGADO=true;window._espacoAberto=true;hideVals=false;
  _abriuSemConferir=false;_semDados=false;cloudPending=false;
  document.querySelectorAll('.overlay.on').forEach(e=>e.classList.remove('on'));
  document.getElementById('splash-gestao').style.display='none';
  document.getElementById('barra-versao').style.display='none';
  const barra=document.getElementById('barra-endereco');if(barra)barra.style.display='none';
  renderAll();
 },fixture);
 p.errors=errors;
 return p;
}

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,b=await chromium.launch({headless:true});
 const today=new Date();let dt=new Date(today.getFullYear(),today.getMonth(),today.getDate()+2,12);
 while(dt.getDay()!==1)dt.setDate(dt.getDate()+1);
 const date=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const dk=date(dt),next=date(new Date(dt.getFullYear(),dt.getMonth(),dt.getDate()+7,12));
 try{
  const ctx=await b.newContext(),p=await setup(ctx,base),empty={fixos:[],eventos:[],excecoes:[]};
  let queue={},saved=true,acks=0;
  await p.exposeFunction('reserveQueueGet',()=>copy(queue));
  await p.exposeFunction('reserveQueueAck',updates=>{
   acks++;for(const [k,v]of Object.entries(updates)){
    if(k.endsWith('/processado'))queue[k.slice(0,-11)].processado=v;
    else if(v===null)delete queue[k];else queue[k]=v;
   }
  });
  await p.exposeFunction('reserveSave',()=>saved);
  await p.evaluate(()=>{
   carregarVinculos=async()=>{};VINCULOS={'u1':{ativo:true,codigo:'9901'},'u2':{ativo:true,codigo:'9902'}};
   gravarAgora=()=>window.reserveSave();doPublish=async()=>{};
   window.fbDB={ref:()=>({get:async()=>{const q=await window.reserveQueueGet();return {exists:()=>Object.keys(q).length>0,val:()=>q};},update:u=>window.reserveQueueAck(u)})};
  });
  const reset=async()=>{
   queue={};saved=true;acks=0;
   await p.evaluate(({f,empty})=>{DB=copyFixture(f);ensureFields();DB.agenda=empty;DB.compromissos=[];MAPA_OUTROS={};_conflitoNuvem=null;_abriuSemConferir=false;syncing=false;}, {f:fixture,empty});
  };
  await p.evaluate(()=>{window.copyFixture=x=>JSON.parse(JSON.stringify(x));});
  const req=(id,codigo='9901',uid='u1',extra={})=>({id,codigo,uid,nome:'Reserva Teste',data:dk,hora:'09:00',rec:'pontual',ts:Date.now(),...extra});
  await reset();
  await check('Gestão: duas solicitações antigas particulares geram uma aula e uma recusa',async()=>{
   queue={old1:req('r1'),old2:req('r2','9902','u2')};await p.evaluate(()=>syncRequests(true));
   const result=await p.evaluate(()=>({aulas:DB.agenda.eventos,respostas:DB.respostasReservas}));
   assert.equal(result.aulas.length,1);assert.equal(result.respostas.filter(x=>x.estado==='recusado').length,1);assert.equal(Object.keys(queue).length,0);
  });
  await reset();
  await check('Gestão: horário grupo aceita segunda pessoa e impede torneio sobre o grupo',async()=>{
   await p.evaluate(d=>{DB.agenda.eventos=[{id:'grupo',data:d,hora:'09:00',tipo:'grupo',alunoId:'pai'}];},dk);
   queue={join:req('j1','9901','u1',{grupo:1}),tor:req('t1','9902','u2',{tor:1})};await p.evaluate(()=>syncRequests(true));
   assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),2);
   assert.equal(await p.evaluate(()=>DB.agenda.eventos[1].tipo),'grupo');
   assert.equal(await p.evaluate(()=>DB.respostasReservas.find(r=>r.id==='t1').estado),'recusado');
   assert.equal(await p.evaluate(p=>pedidoAgendaValido(p,DB.alunos[0]),req('grupo-inventado','9901','u1',{hora:'10:00',grupo:1})),false);
   assert.equal(await p.evaluate(p=>pedidoAgendaValido(p,DB.alunos[0]),req('grupo-fixo-sem-turma','9901','u1',{rec:'fixo',grupo:1})),false);
  });
  await reset();
  await check('Gestão: fixo novo não passa por cima de reserva particular na semana seguinte',async()=>{
   await p.evaluate(d=>{DB.agenda.eventos=[{id:'futuro',data:d,hora:'09:00',tipo:'aula',alunoId:'pai'}];},next);
   queue={};queue.fixed=req('fixo','9901','u1',{rec:'fixo'});await p.evaluate(()=>syncRequests(true));
   assert.equal(await p.evaluate(()=>DB.agenda.fixos.length),0);assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),1);
  });
  await reset();
  await check('Gestão: falha de gravação não consome o pedido nem libera a trava',async()=>{
   saved=false;const key='reserva_'+dk+'_0900';queue={[key]:req('unico')};await p.evaluate(()=>syncRequests(true));
   assert.equal(acks,0);assert.equal(queue[key].processado,undefined);
   saved=true;await p.evaluate(()=>syncRequests(true));assert.equal(queue[key].processado,true);
   assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),1);
  });
  await check('Gestão: cancelar remove aula e libera a chave somente após salvar',async()=>{
   queue.cancel=req('cancelar','9901','u1',{acao:'cancelar'});await p.evaluate(()=>syncRequests(true));
   assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),0);assert.equal(Object.keys(queue).length,0);
  });
  await reset();
  await check('Gestão: agenda pública revela grupo e oculta nomes e códigos',async()=>{
   const result=await p.evaluate(()=>gradePublicaSegura({fixos:[],eventos:[{id:'g',data:'2099-01-01',hora:'09:00',tipo:'grupo',titulo:'Aluno Teste',cod:'9901'}],excecoes:[]}));
   assert.equal(result.eventos[0].tipo,'grupo');assert.equal(result.eventos[0].cod,undefined);assert.equal(result.eventos[0].titulo,undefined);
   const tipos=await p.evaluate(()=>gradePublicaSegura({fixos:[],eventos:['locacao','torneio','personal'].map(tipo=>({id:tipo,data:'2099-01-01',hora:'09:00',tipo,titulo:'Nome Privado Teste',cod:'9901'})),excecoes:[]}).eventos);
   assert.deepEqual(tipos.map(e=>e.tipo),['locacao','torneio','ocupado']);assert.ok(tipos.every(e=>!e.cod&&!e.titulo));
  });
  await reset();
  await check('Gestão: mesma locação e mesmo torneio compartilham; particular e mistura ficam bloqueados',async()=>{
   for(const tipo of ['aula','personal','grupo','locacao','torneio','bloqueio']){
    const respostas=await p.evaluate(({tipo,dk})=>{
     DB.agenda.eventos=[{id:'existente',data:dk,hora:'09:00',tipo,alunoId:'pai',pessoas:2}];
     const evs=entriesFor(new Date(dk+'T12:00:00'),'09:00');
     return ['aula','grupo','locacao','torneio'].map(t=>podeAdicionarAoHorario(evs,t,2));
    },{tipo,dk});
    // almoço/bloqueio do João (sem chuva) tira só a aula: locação e torneio entram (regra de 09/10)
    assert.deepEqual(respostas,['aula','grupo','locacao','torneio'].map(t=>['grupo','locacao','torneio'].includes(tipo)&&t===tipo||tipo==='bloqueio'&&['locacao','torneio'].includes(t)),tipo);
   }
   const chuva=await p.evaluate(dk=>{
    DB.agenda.eventos=[{id:'chuva',data:dk,hora:'09:00',titulo:'☔ Chuva',tipo:'bloqueio',motivo:'chuva',alunoId:null}];
    const evs=entriesFor(new Date(dk+'T12:00:00'),'09:00');
    return ['aula','grupo','locacao','torneio'].map(t=>podeAdicionarAoHorario(evs,t,2));
   },dk);
   assert.deepEqual(chuva,[false,false,false,false],'chuva bloqueia tudo');
   await p.evaluate(d=>{DB.agenda.eventos=[{id:'jogo',data:d,hora:'09:00',tipo:'torneio',alunoId:'pai'}];},dk);
   queue={jogo:req('jogo-2','9901','u1',{tor:1})};await p.evaluate(()=>syncRequests(true));
   assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),2);
   assert.equal(await p.evaluate(()=>DB.agenda.eventos[1].tipo),'torneio');
   assert.equal(await p.evaluate(p=>pedidoAgendaValido(p,DB.alunos[0]),req('aula-sobre-jogo')),false);
  });
  await reset();
  await check('Gestão: dupla completa e tamanhos diferentes bloqueiam; cadastro permite participantes na mesma locação',async()=>{
   assert.equal(await p.evaluate(()=>podeAdicionarAoHorario([{tipo:'grupo',pessoas:2},{tipo:'grupo',pessoas:2}],'grupo',2)),false);
   assert.equal(await p.evaluate(()=>podeAdicionarAoHorario([{tipo:'grupo',pessoas:3}],'grupo',2)),false);
   for(const tipo of ['locacao','torneio']){
    await p.evaluate(({tipo,dk})=>{
     DB.agenda.eventos=[{id:'jogo-'+tipo,data:dk,hora:'09:00',tipo,alunoId:'pai'}];
     agDate=new Date(dk+'T12:00:00');openSlot('09:00');
     document.getElementById('s-titulo').value='Participante Teste';document.getElementById('s-aluno').value='solo';
     document.getElementById('s-tipo').value=tipo;document.getElementById('s-rec').value='pontual';saveSlot();
    },{tipo,dk});
    assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),2);
    await p.evaluate(()=>{document.getElementById('s-titulo').value='Aula Particular Teste';document.getElementById('s-tipo').value='aula';saveSlot();});
    assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),2);
    await p.evaluate(()=>{slotCtx.editing={id:DB.agenda.eventos[0].id,origem:'pontual'};saveSlot();});
    assert.equal(await p.evaluate(()=>DB.agenda.eventos[0].tipo),tipo);
   }
  });
  await reset();
  await check('Gestão: limites 2/3/4 valem na grade e no processamento dos pedidos',async()=>{
   assert.equal(await p.evaluate(()=>pessoasGrupoAluno({tipo:'Trio',grupoTipo:'Dupla'})),3);
   assert.equal(await p.evaluate(()=>pessoasGrupoAluno({tipo:'Quarteto',grupoTipo:'Dupla'})),4);
   for(const limite of [2,3,4]){
    for(let n=1;n<=limite;n++){
     const ok=await p.evaluate(({n,limite})=>podeAdicionarAoHorario(Array.from({length:n},()=>({tipo:'grupo',pessoas:limite})),'grupo',limite),{n,limite});
     assert.equal(ok,n<limite);
    }
   }
   await p.evaluate(({dk,next})=>{DB.agenda.eventos=[{id:'trio-hoje',tipo:'grupo',pessoas:3,data:dk,hora:'09:00'},{id:'dupla-futura',tipo:'grupo',pessoas:2,data:next,hora:'09:00'}];},{dk,next});
   assert.equal(await p.evaluate(p=>pedidoAgendaValido(p,DB.alunos[0]),req('fixo-tamanho-diferente','9901','u1',{rec:'fixo',grupo:1})),false);
   await p.evaluate(()=>{DB.agenda.eventos=[];DB.alunos[0].tipo='Trio';VINCULOS.u3={ativo:true,codigo:'9903'};});
   queue={primeiro:req('trio-1')};await p.evaluate(()=>syncRequests(true));
   assert.equal(await p.evaluate(()=>DB.agenda.eventos[0].pessoas),3);
   queue={segundo:req('trio-2','9902','u2',{grupo:1,ts:Date.now()}),terceiro:req('trio-3','9903','u3',{grupo:1,ts:Date.now()+1}),quarto:req('trio-4','9901','u1',{grupo:1,ts:Date.now()+2})};
   await p.evaluate(()=>syncRequests(true));
   assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),3);
   assert.equal(await p.evaluate(()=>DB.respostasReservas.find(r=>r.id==='trio-4').estado),'recusado');
   await p.evaluate(d=>{slotCtx={date:new Date(d+'T12:00:00'),hora:'09:00'};setPessoas(DB.agenda.eventos[0].id,'pontual',2);},dk);
   assert.equal(await p.evaluate(()=>DB.agenda.eventos[0].pessoas),3);
  });
  assert.deepEqual(p.errors,[]);await ctx.close();
  for(const theme of ['saibro','classico']){
   const c=await b.newContext({viewport:{width:390,height:852},serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(theme=>{localStorage.setItem('jv-tema',theme);},theme);
   const al=await c.newPage(),errors=[];al.on('pageerror',e=>errors.push(e.message));
   let grade=copy(empty),unique={},writes=0;
   await al.exposeFunction('bookingGrade',()=>copy(grade));
   await al.exposeFunction('bookingCreate',updates=>{
    if(Object.keys(updates).some(k=>unique[k]))throw Error('PERMISSION_DENIED');
    Object.assign(unique,copy(updates));writes++;
   });
   await al.exposeFunction('bookingPush',item=>{unique['group'+writes]=copy(item);writes++;});
   await al.goto(base+'/app-aluno/',{waitUntil:'load'});await al.waitForFunction(()=>typeof slotState==='function');
   await al.evaluate(({dk,fixture})=>{
    MEU={codigo:'9901',pedidos:[],cancelados:[]};EU={...fixture.alunos[0],status:'pago',termoAceitoVer:0};
    PUB={grade:{fixos:[],eventos:[],excecoes:[]},alunos:[EU],horas:['09:00','10:00'],horarioCfg:{1:{'09:00':'aula','10:00':'aula'}},horarioData:{},profs:[],termoVer:0};
    agDate=new Date(dk+'T12:00:00');agView='dia';
    document.getElementById('login').style.display='none';document.getElementById('app').style.display='block';
    window.fbDB={ref(cam){return {get:async()=>({exists:()=>true,val:()=>true}),once:async()=>({exists:()=>true,val:()=>true}),update:u=>window.bookingCreate(u),push:i=>window.bookingPush(i),set:async()=>{}};}};
    esperarAuth=async()=>{};authUid=()=> 'u1';init=async()=>{};refresh=async()=>true;bloqueadoParaAgendar=()=>false;motivoBloqueio=()=> '';
    cloudGet=async key=>{
     const grade=await window.bookingGrade();
     if(key===SECUREPUBKEY)return JSON.stringify({grade,horarioCfg:PUB.horarioCfg,horarioData:{}});
     if(key.includes(PRIV_KEY))return JSON.stringify({aluno:EU,gradeMeu:{fixos:[],eventos:[],excecoes:[]}});
     return null;
    };
    notificarJoao=()=>{};abrirWhatsApp=()=>{};pedirPermissaoNotif=()=>{};
    renderAgenda();
   },{dk,fixture});
   const resetAluno=async()=>{
    grade=copy(empty);unique={};writes=0;
    await al.evaluate(()=>{MEU.pedidos=[];MEU.cancelados=[];PUB.grade={fixos:[],eventos:[],excecoes:[]};bookCtx=null;_reservaEnviando=false;document.querySelectorAll('.overlay.on').forEach(e=>e.classList.remove('on'));renderAgenda();});
   };
   await check(theme+': cancelar aula não libera reserva particular de outra pessoa',async()=>{
    const state=await al.evaluate(d=>{
     PUB.grade.eventos=[{id:'minha',data:d,hora:'09:00',tipo:'aula',cod:'9901'},{id:'outra',data:d,hora:'09:00',tipo:'ocupado'}];
     MEU.cancelados=[{data:d,hora:'09:00'}];return slotState(agDate,'09:00');
    },dk);assert.equal(state.st,'ocup');
   });
   await resetAluno();
   await check(theme+': confirmar relê a nuvem e bloqueia grade que ficou ocupada',async()=>{
    await al.evaluate(()=>abrirBook('09:00',false));grade.eventos=[{id:'nova',data:dk,hora:'09:00',tipo:'ocupado'}];
    await al.evaluate(()=>confirmarAgendamento());assert.equal(writes,0);assert.equal(await al.evaluate(()=>MEU.pedidos.length),0);
   });
   await resetAluno();
   await check(theme+': particular ocupado fica sem ação, dupla com vaga permite participar',async()=>{
    const states=await al.evaluate(d=>{
     PUB.grade.eventos=[{id:'p',data:d,hora:'09:00',tipo:'ocupado'},{id:'g',data:d,hora:'10:00',tipo:'grupo'}];
     renderAgenda();return [slotState(agDate,'09:00'),slotState(agDate,'10:00')];
    },dk);assert.equal(states[0].st,'ocup');assert.equal(states[1].grupo,true);
    assert.equal(await al.locator('#ag-view button.sl.ocup').count(),1);assert.equal(await al.locator('#ag-view button.sl.livre').count(),1);
    assert.match(await al.locator('#ag-view').textContent(),/Aula em dupla/);
   });
   await resetAluno();
   await check(theme+': clique duplo envia um pedido e não confirma antes da Gestão',async()=>{
    await al.evaluate(()=>abrirBook('09:00',false));
    await al.evaluate(()=>Promise.all([confirmarAgendamento(),confirmarAgendamento()]));
    assert.equal(writes,1);assert.equal(await al.evaluate(()=>MEU.pedidos.length),1);
    assert.equal(await al.evaluate(()=>slotState(agDate,'09:00').st),'pend');
   });
   await resetAluno();
   await check(theme+': chave já criada impede outro particular e não gera pedido local falso',async()=>{
    unique['reserva_'+dk+'_0900']={id:'outro'};await al.evaluate(()=>abrirBook('09:00',false));await al.evaluate(()=>confirmarAgendamento());
    assert.equal(writes,0);assert.equal(await al.evaluate(()=>MEU.pedidos.length),0);
   });
   await resetAluno();
   await check(theme+': entrar no grupo envia tipo explícito e usa a fila compartilhada',async()=>{
    grade.eventos=[{id:'grupo',data:dk,hora:'09:00',tipo:'grupo'}];
    await al.evaluate(d=>{PUB.grade.eventos=[{id:'grupo',data:d,hora:'09:00',tipo:'grupo'}];abrirBook('09:00',false);},dk);
    await al.evaluate(()=>confirmarAgendamento());
    assert.equal(writes,1,JSON.stringify(await al.evaluate(()=>({bookCtx,toast:document.getElementById('toast').textContent,estado:slotState(agDate,'09:00'),pedidos:MEU.pedidos}))));
    assert.equal(Object.values(unique)[0].grupo,1);assert.ok(Object.keys(unique)[0].startsWith('group'));
   });
   await resetAluno();
   await check(theme+': fixo conflitante em próxima ocorrência é recusado antes do envio',async()=>{
    grade.eventos=[{id:'futuro',data:next,hora:'09:00',tipo:'ocupado'}];
    await al.evaluate(()=>{abrirBook('09:00',false);document.getElementById('b-rec').value='fixo';});
    await al.evaluate(()=>confirmarAgendamento());assert.equal(writes,0);
   });
   await resetAluno();
   await check(theme+': torneio permite participar do mesmo jogo e recusa aula sobre locação',async()=>{
    grade.eventos=[{id:'jogo',data:dk,hora:'09:00',tipo:'torneio'}];
    await al.evaluate(d=>{PUB.grade.eventos=[{id:'jogo',data:d,hora:'09:00',tipo:'torneio'}];abrirBook('09:00',false,true);},dk);
    await al.evaluate(()=>Promise.all([confirmarAgendamento(),confirmarAgendamento()]));
    assert.equal(writes,1);assert.equal(Object.values(unique)[0].tor,1);assert.ok(Object.keys(unique)[0].startsWith('group'));
    await resetAluno();
    const estado=await al.evaluate(d=>{
     PUB.grade.eventos=[{id:'aluguel',data:d,hora:'09:00',tipo:'locacao'}];
     const e=slotState(agDate,'09:00');escolherSlot('09:00');abrirBook('09:00',false);return {e,book:bookCtx,opcoes:document.getElementById('pick-opts').textContent};
    },dk);
    assert.equal(estado.e.compartilhado,'locacao');assert.equal(estado.book,null);
    assert.match(estado.opcoes,/Participar da locação/);assert.doesNotMatch(estado.opcoes,/Agendar aula|torneio/);
   });
   await resetAluno();
   await check(theme+': dupla completa bloqueia terceira pessoa e locação relê grade antes do pedido',async()=>{
    const st=await al.evaluate(d=>{PUB.grade.eventos=[{id:'d1',data:d,hora:'09:00',tipo:'grupo'},{id:'d2',data:d,hora:'09:00',tipo:'grupo'}];return slotState(agDate,'09:00');},dk);
    assert.equal(st.st,'ocup');assert.equal(st.label,'Grupo completo');
    for(const limite of [2,3,4]){
     for(let n=1;n<=limite;n++){
      const s=await al.evaluate(({d,n,limite})=>{MEU.pedidos=[];PUB.grade.eventos=Array.from({length:n},(_,i)=>({id:'grupo-'+i,data:d,hora:'09:00',tipo:'grupo',pessoas:limite}));return slotState(agDate,'09:00');},{d:dk,n,limite});
      assert.equal(s.st,n<limite?'livre':'ocup');
      if(n<limite)assert.equal(s.limiteGrupo,limite);
     }
    }

    await resetAluno();
    await al.evaluate(()=>{window.locTestPedidos=0;notificarJoao=()=>{window.locTestPedidos++;};pedirLocacaoHora('09:00');});
    grade.eventos=[{id:'privada',data:dk,hora:'09:00',tipo:'ocupado'}];
    await al.evaluate(()=>confirmarLocacao());assert.equal(await al.evaluate(()=>window.locTestPedidos),0);
    grade.eventos=[{id:'loc',data:dk,hora:'09:00',tipo:'locacao'}];
    await al.evaluate(d=>{PUB.grade.eventos=[{id:'loc',data:d,hora:'09:00',tipo:'locacao'}];pedirLocacaoHora('09:00');},dk);
    await al.evaluate(()=>confirmarLocacao());assert.equal(await al.evaluate(()=>window.locTestPedidos),1);
   });
   await al.evaluate(d=>{
    MEU.pedidos=[];MEU.cancelados=[];
    PUB.horas=['09:00','10:00','11:00','12:00'];PUB.horarioCfg[1]['11:00']='aula';PUB.horarioCfg[1]['12:00']='aula';
    PUB.grade.eventos=[{id:'p',data:d,hora:'09:00',tipo:'ocupado'},{id:'g',data:d,hora:'10:00',tipo:'grupo'},{id:'l',data:d,hora:'11:00',tipo:'locacao'},{id:'t',data:d,hora:'12:00',tipo:'torneio'}];
    closeModal('ov-book');goAluno('agenda',document.getElementById('nav-al-agenda'));renderAgenda();
   },dk);
   assert.ok(await al.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await al.waitForTimeout(350);
   console.log('VISUAL_RESERVAS '+theme+' '+(await al.screenshot({fullPage:true})).toString('base64'));
   assert.deepEqual(errors,[]);await c.close();
  }
  console.log('✅ '+count+' verificações de exclusividade e aula em grupo');
 }finally{await b.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

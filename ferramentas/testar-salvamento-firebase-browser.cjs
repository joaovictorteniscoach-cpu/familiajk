/* Integração com o SDK Firebase real e emulador local. Nunca usa o banco da academia.
   firebase emulators:exec --only database --project demo-jv-tenis --config ferramentas/firebase-emulator-teste.json "node ferramentas/testar-salvamento-firebase-browser.cjs" */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const project='demo-jv-tenis',endpoint='http://127.0.0.1:9000',copy=v=>JSON.parse(JSON.stringify(v));
const rules=JSON.parse(fs.readFileSync(path.join(__dirname,'firebase-regras-etapa3-transicao.json'),'utf8'));
const owner=rules.rules.jvtenis.v2['.write'].match(/=== '([^']+)'/)[1];
const fixture={alunos:[{id:'teste',nome:'Aluno SDK Teste',codigo:'9901',tipo:'Particular',plano:4,creditos:3,repos:2,mensalidade:735,status:'pendente',diaVenc:10,ativo:true}],
 agenda:{fixos:[],eventos:[],excecoes:[]},presencas:[],movs:[],lancamentos:[],compromissos:[],savedAt:1,mesPagamentos:'2026-10',mesCreditos:'2026-10'};
const server=http.createServer((req,res)=>{
 let f=path.join(root,decodeURI(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
 catch{res.writeHead(404).end();}
});
async function admin(cam,data){
 const r=await fetch(endpoint+'/'+cam+'.json?ns='+project,{method:data===undefined?'GET':'PUT',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 assert.ok(r.ok,'emulador '+r.status);return r.json();
}
let count=0;async function check(name,fn){await fn();count++;console.log('✅ SDK Firebase: '+name);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.JV_BROWSER||undefined,args:['--no-sandbox']});
 const contexts=[];
 async function page(uid){
  const c=await browser.newContext({viewport:{width:390,height:852},timezoneId:'America/Sao_Paulo',locale:'pt-BR',serviceWorkers:'block'});contexts.push(c);
  await c.route('**/*',r=>{
   const u=new URL(r.request().url());
   if(u.origin!==base&&u.origin!==endpoint)return r.abort();
   if(u.origin===base&&u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});
   return r.continue();
  });
  await c.addInitScript(f=>{localStorage.setItem('jvtenis-gestao-v1',JSON.stringify(f));sessionStorage.setItem('jv-bk-adiar','1');},fixture);
  const p=await c.newPage();p.on('dialog',d=>d.accept());p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));
  await p.goto(base+'/app-gestao/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,{},{timeout:15000});
  await p.evaluate(f=>{
   window.sdkBackupHoraOriginal=backupNuvem;window.sdkBackupDiaOriginal=backupDoDia;
   window.sdkGuardarVersoesOriginal=guardarVersoes;
   window.sdkPersist=persist;persist=()=>{};DB=JSON.parse(JSON.stringify(f));ensureFields();
   CARREGADO=true;window._espacoAberto=true;_abriuSemConferir=false;_conflitoNuvem=null;cloudPending=false;
   document.querySelectorAll('.overlay.on').forEach(e=>e.classList.remove('on'));
   publish=()=>{};publicarMapaQuadra=()=>{};publicarAgendaProf=()=>{};finalizarAvisosPagos=async()=>{};
   subirBlobDeReserva=async()=>{};backupNuvem=async()=>{};backupDoDia=async()=>{};
   guardarVersoes=raw=>{window.sdkBackup=JSON.parse(raw);};
  },fixture);
  await p.addScriptTag({path:path.join(root,'app-gestao/lib/firebase-app-compat.js')});
  await p.addScriptTag({path:path.join(root,'app-gestao/lib/firebase-database-compat.js')});
  await p.evaluate(({uid,project})=>{
   const app=firebase.initializeApp({projectId:project,databaseURL:'https://'+project+'.firebaseio.com'},'teste-'+Math.random());
   const db=firebase.database(app);db.useEmulator('127.0.0.1',9000,{mockUserToken:{sub:uid,user_id:uid}});
   window.fbDB=db;window.sdkDatabase=db;window.sdkApp=app;
  },{uid,project});
  return p;
 }
 async function baseline(p,cam='jvtenis/v2'){
  return p.evaluate(async cam=>{
   RAIZ=cam.slice(0,-3);const s=await sdkDatabase.ref(cam).get(),no=s.exists()?s.val():null;
   await confirmarBasePartes(no);_enviado=marcasDasPartes(no);_conflitoNuvem=null;cloudPending=false;
   guardarMetaProtecao({base:_basePartesAssinatura});_abriuSemConferir=false;return no;
  },cam);
 }
 try{
  // A CLI pode configurar outro namespace padrão. Aplicar e conferir as
  // regras neste namespace evita testar permissões num banco aberto.
  await admin('.settings/rules',rules);
  assert.deepEqual(await admin('.settings/rules'),rules);
  const a=await page(owner),b=await page(owner);
  const seed=await a.evaluate(()=>{
   const conf=configDe(DB),alunos={};for(const a of DB.alunos)alunos[chaveFb(a.id)]=JSON.stringify(a);
   return {alunos,agenda:JSON.stringify(DB.agenda),config:JSON.stringify(conf),carimbos:{savedAt:1}};
  });
  await admin('jvtenis/v2',seed);await baseline(a);await baseline(b);
  await check('regra permite transação do dono; mensalidade e extrato permanecem coerentes',async()=>{
   await a.evaluate(()=>{persist=window.sdkPersist;DB.alunos[0].mensalidade=800;persist();});
   const salvo=await a.evaluate(()=>gravarAgora());
   if(!salvo)console.log('Estado SDK isolado',await a.evaluate(()=>({erro:lastCloudError,pendente:cloudPending,conflito:!!_conflitoNuvem,base:_basePartes,local:DB})));
   assert.equal(salvo,true);
   const no=await admin('jvtenis/v2');assert.equal(JSON.parse(no.alunos.teste).mensalidade,800);
   assert.equal(JSON.parse(no.alunos.teste).creditos,3);assert.equal(JSON.parse(no.alunos.teste).repos,2);
  });
  await check('segunda sessão preserva alteração local e não substitui a primeira',async()=>{
   await b.evaluate(()=>{persist=window.sdkPersist;DB.alunos[0].mensalidade=700;persist();});
   assert.equal(await b.evaluate(()=>gravarAgora()),false);
   assert.equal(JSON.parse((await admin('jvtenis/v2')).alunos.teste).mensalidade,800);
   assert.equal(await b.evaluate(()=>DB.alunos[0].mensalidade),700);
   assert.equal(await b.evaluate(()=>JSON.parse(lsGet(KEY)).alunos[0].mensalidade),700);
  });
  await check('carregar versão conferida guarda a cópia anterior e não escreve na nuvem',async()=>{
   const no=await admin('jvtenis/v2');await b.evaluate(()=>carregarNuvemConferida());
   assert.deepEqual(await admin('jvtenis/v2'),no);
   assert.equal(await b.evaluate(()=>DB.alunos[0].mensalidade),800);
   assert.equal(await b.evaluate(()=>window.sdkBackup.alunos[0].mensalidade),700);
  });
  await check('SDK bloqueia alteração feita entre a leitura e a confirmação',async()=>{
   await admin('jvtenis/v2',seed);await baseline(a);
   const changed=copy(seed);changed.alunos.teste=JSON.stringify({...fixture.alunos[0],mensalidade:900});changed.carimbos.savedAt=900;
   await a.exposeFunction('sdkRace',()=>admin('jvtenis/v2',changed));
   await a.evaluate(()=>{
    const db=window.sdkDatabase;let once=true;
    window.fbDB={ref(cam){
     const r=db.ref(cam);
     if(cam===RAIZ+'/v2')return {get:async()=>{const s=await r.get();if(once){once=false;await window.sdkRace();}return s;},transaction:(...args)=>r.transaction(...args)};
     return r;
    }};
    DB.alunos[0].mensalidade=810;persist();
   });
   assert.equal(await a.evaluate(()=>gravarAgora()),false);
   assert.equal(JSON.parse((await admin('jvtenis/v2')).alunos.teste).mensalidade,900);
  });
  const unauthorized=await page('aluno-emulador-teste');
  await check('regra recusa leitura e gravação de aluno no banco de Gestão',async()=>{
   const acesso=await unauthorized.evaluate(async()=>{
    let leitura=false,gravacao=false;const ref=sdkDatabase.ref('jvtenis/v2');
    try{await ref.once('value');}catch(e){leitura=/permission|denied/i.test(String(e));}
    try{await ref.child('teste-acesso-aluno').set({teste:true});}catch(e){gravacao=/permission|denied/i.test(String(e));}
    return {leitura,gravacao};
   });
   assert.deepEqual(acesso,{leitura:true,gravacao:true});
   await unauthorized.evaluate(()=>{persist=window.sdkPersist;DB.alunos[0].mensalidade=100;persist();});
   assert.equal(await unauthorized.evaluate(()=>gravarAgora()),false);
   assert.equal(await unauthorized.evaluate(()=>cloudPending),true);
   assert.equal(JSON.parse((await admin('jvtenis/v2')).alunos.teste).mensalidade,900);
  });
  const prof=await page('prof-emulador-teste');
  await prof.evaluate(()=>abrirEspaco('prof','prof-emulador-teste'));
  await admin('jvtenis/prof/prof-emulador-teste/v2',seed);
  await baseline(prof,'jvtenis/prof/prof-emulador-teste/v2');
  await check('professor grava somente no próprio espaço, com a mesma proteção',async()=>{
   await prof.evaluate(()=>{persist=window.sdkPersist;DB.alunos[0].mensalidade=820;persist();});
   assert.equal(await prof.evaluate(()=>gravarAgora()),true);
   assert.equal(JSON.parse((await admin('jvtenis/prof/prof-emulador-teste/v2')).alunos.teste).mensalidade,820);
   const acesso=await prof.evaluate(async()=>{
    const ref=sdkDatabase.ref('jvtenis/v2');
    let leitura=false,gravacao=false;
    try{await ref.once('value');}catch(e){leitura=/permission|denied/i.test(String(e));}
    try{await ref.child('teste-acesso-prof').set({teste:true});}catch(e){gravacao=/permission|denied/i.test(String(e));}
    return {leitura,gravacao};
   });
   assert.deepEqual(acesso,{leitura:true,gravacao:true});
   assert.equal(JSON.parse((await admin('jvtenis/v2')).alunos.teste).mensalidade,900);
  });
  const rec=await page(owner);await baseline(rec);
  let copiada=null,anterior=null;
  await check('cópias horária e diária preservam cadastro, família, agenda e extratos completos',async()=>{
   const salvo=await rec.evaluate(async()=>{
    const mk=mesReal(),data=dKey(new Date()),a=DB.alunos[0];
    a.creditos=3;a.repos=2;a.status='parcial';a.pagamentosExatos={[mk]:{ajusteAnterior:200}};
    const dependente={...JSON.parse(JSON.stringify(a)),id:'dep-recup',codigo:'9902',nome:'Dependente Recuperação Teste',
     responsavelId:a.id,parentesco:'Filho(a)',mensalidade:0,creditos:1,repos:4,pagamentosExatos:{}};
    DB.alunos.push(dependente);
    DB.agenda={fixos:[{id:'f-recup',dia:new Date().getDay(),hora:'09:00',titulo:a.nome,tipo:'part',alunoId:a.id}],
     eventos:[{id:'e-recup',data,hora:'10:00',titulo:dependente.nome,tipo:'part',alunoId:dependente.id,repo:1}],
     excecoes:[{fixoId:'f-recup',data:'2026-01-01'}]};
    DB.lancamentos=[{id:'l-recup',data,mes:mk,competenciaMensalidade:mk,cat:'mensalidade',alunoId:a.id,
     desc:'Mensalidade · '+a.nome,valor:100,formaPagamento:'Pix',pagamentoExato:true}];
    DB.movs=[{ts:1700000000000,alunoId:a.id,campo:'creditos',delta:-1,de:4,para:3,motivo:'Aula do ensaio',ref:'p-recup'}];
    DB.presencas=[{k:'p-recup',alunoId:a.id,data,hora:'08:00',tipo:'part'}];
    ensureFields();persist=window.sdkPersist;persist();
    const ok=await gravarAgora();window.recGolden=JSON.stringify(DB);
    await window.sdkBackupHoraOriginal(JSON.parse(window.recGolden));
    await window.sdkBackupDiaOriginal(JSON.parse(window.recGolden));
    return {ok,dia:dKey(new Date()),golden:JSON.parse(window.recGolden)};
   });
   assert.equal(salvo.ok,true);
   const horas=await admin('jvtenis/backups'),dias=await admin('jvtenis/backups_dia');
   assert.ok(horas&&Object.keys(horas).length);
   const hora=JSON.parse(horas[Object.keys(horas).sort().at(-1)]);
   const dia=JSON.parse(dias[salvo.dia]);
   assert.deepEqual(hora,salvo.golden);assert.deepEqual(dia,salvo.golden);
   copiada=copy(dia);
   assert.ok((await admin('jvtenis/backups_dia_idx'))[salvo.dia].ts>0);
  });
  await check('cancelar restauração preserva o aparelho e o banco do emulador',async()=>{
   const ok=await rec.evaluate(async raw=>{
    DB.alunos[0].mensalidade=999;DB.alunos[0].creditos=99;
    DB.lancamentos=[];DB.movs=[];DB.presencas=[];DB.agenda={fixos:[],eventos:[],excecoes:[]};
    persist();const ok=await gravarAgora();
    window.recAnterior=JSON.stringify(DB);window.recGuardadas=[];
    guardarVersoes=raw=>window.recGuardadas.push(JSON.parse(raw));
    window._versoes=[{rot:'ensaio isolado',origem:'nuvem',raw:JSON.stringify(raw),r:resumoBanco(raw)}];
    return ok;
   },copiada);
   assert.equal(ok,true);anterior=await rec.evaluate(()=>JSON.parse(window.recAnterior));
   const bancoAntes=await admin('jvtenis/v2');
   rec.removeAllListeners('dialog');rec.on('dialog',d=>d.dismiss());
   await rec.evaluate(()=>restaurarVersao(0));
   assert.deepEqual(await rec.evaluate(()=>DB),anterior);
   assert.deepEqual(await admin('jvtenis/v2'),bancoAntes);
   assert.equal(await rec.evaluate(()=>window.recGuardadas.length),0);
   rec.removeAllListeners('dialog');rec.on('dialog',d=>d.accept());
  });
  await check('restaurar e desfazer recupera integralmente aulas, pagamentos e saldos no emulador',async()=>{
   assert.equal(await rec.evaluate(async()=>{await restaurarVersao(0);return gravarAgora();}),true);
   assert.deepEqual(await rec.evaluate(()=>window.recGuardadas[0]),anterior);
   const normaliza=d=>({...d,alunos:d.alunos.slice().sort((a,b)=>a.id.localeCompare(b.id))});
   const recuperado=await rec.evaluate(no=>bancoDasPartes(no),await admin('jvtenis/v2'));
   for(const campo of ['alunos','agenda','lancamentos','movs','presencas'])
    assert.deepEqual(normaliza(recuperado)[campo],normaliza(copiada)[campo]);
   const q=await rec.evaluate(()=>situacaoMensalidade(DB.alunos.find(a=>a.id==='teste')));
   assert.equal(q.recebido,300);assert.equal(q.falta,435);
   assert.equal(await rec.evaluate(()=>saldoMensalidade(DB.alunos.find(a=>a.id==='dep-recup'))),0);
   const novoAparelho=await page(owner);
   const visto=await novoAparelho.evaluate(async()=>{
    const s=await sdkDatabase.ref('jvtenis/v2').get();
    DB=bancoDasPartes(s.val());ensureFields();
    return {alunos:DB.alunos,agenda:DB.agenda,lancamentos:DB.lancamentos,movs:DB.movs,presencas:DB.presencas};
   });
   assert.deepEqual(normaliza(visto).alunos,normaliza(copiada).alunos);
   for(const campo of ['agenda','lancamentos','movs','presencas'])assert.deepEqual(visto[campo],copiada[campo]);
   assert.equal(await rec.evaluate(async raw=>{
    window._versoes=[{rot:'antes da restauração',origem:'aparelho',raw:JSON.stringify(raw),r:resumoBanco(raw)}];
    await restaurarVersao(0);return gravarAgora();
   },anterior),true);
   const desfeito=await rec.evaluate(no=>bancoDasPartes(no),await admin('jvtenis/v2'));
   for(const campo of ['alunos','agenda','lancamentos','movs','presencas'])
    assert.deepEqual(normaliza(desfeito)[campo],normaliza(anterior)[campo]);
   assert.deepEqual(novoAparelho.errors,[]);
  });
  await check('importação de arquivo rejeita inválido, permite cancelar e recupera após confirmação',async()=>{
   const antes=await rec.evaluate(()=>JSON.stringify(DB)),remoteAntes=await admin('jvtenis/v2');
   await rec.evaluate(()=>{
    window._versoes=[{rot:'inválida',origem:'ensaio',raw:'{"alunos":{},"lancamentos":[]}',r:{}}];
    restaurarVersao(0);
   });
   assert.equal(await rec.evaluate(()=>JSON.stringify(DB)),antes);
   await rec.evaluate(()=>{
    const input=document.createElement('input');input.type='file';const dt=new DataTransfer();
    dt.items.add(new File(['{"alunos":[],"lancamentos":null}'],'invalido.json',{type:'application/json'}));
    input.files=dt.files;importBackup(input);
   });
   await rec.waitForFunction(()=>document.getElementById('toast').textContent.includes('Arquivo inválido'));
   assert.equal(await rec.evaluate(()=>JSON.stringify(DB)),antes);
   assert.deepEqual(await admin('jvtenis/v2'),remoteAntes);
   const cancelado=await rec.evaluate(raw=>new Promise(resolve=>{
    const input=document.createElement('input');input.type='file';const dt=new DataTransfer();
    dt.items.add(new File([JSON.stringify(raw)],'recuperacao.json',{type:'application/json'}));input.files=dt.files;
    const anteriorConfirm=window.confirm;
    window.confirm=texto=>{window.confirm=anteriorConfirm;resolve(texto);return false;};importBackup(input);
   }),copiada);
   assert.match(cancelado,/SUBSTITUINDO/);assert.equal(await rec.evaluate(()=>JSON.stringify(DB)),antes);
   await rec.evaluate(raw=>{
    const input=document.createElement('input');input.type='file';const dt=new DataTransfer();
    dt.items.add(new File([JSON.stringify(raw)],'recuperacao.json',{type:'application/json'}));
    input.files=dt.files;importBackup(input);
   },copiada);
   await rec.waitForFunction(()=>DB.alunos.find(a=>a.id==='teste').creditos===3);
   assert.equal(await rec.evaluate(()=>gravarAgora()),true);
   const remoto=await rec.evaluate(no=>bancoDasPartes(no),await admin('jvtenis/v2'));
   const ordena=arr=>arr.slice().sort((a,b)=>a.id.localeCompare(b.id));
   assert.deepEqual(ordena(remoto.alunos),ordena(copiada.alunos));
   for(const campo of ['agenda','lancamentos','movs','presencas'])assert.deepEqual(remoto[campo],copiada[campo]);
  });
  await check('restauração conserva o histórico arquivado que só existe na nuvem',async()=>{
   const arquivo={ts:1600000000000,alunoId:'teste',campo:'repos',delta:1,de:0,para:1,motivo:'Linha histórica do ensaio',ref:'arquivo-recup'};
   const k=await rec.evaluate(m=>chaveFb(CHAVE_LINHA.movs(m)),arquivo);
   await admin('jvtenis/v2/movs/'+k,JSON.stringify(arquivo));await baseline(rec);
   assert.equal(await rec.evaluate(async raw=>{
    window._versoes=[{rot:'antes da restauração',origem:'ensaio',raw:JSON.stringify(raw),r:resumoBanco(raw)}];
    await restaurarVersao(0);return gravarAgora();
   },anterior),true);
   let remoto=await admin('jvtenis/v2');
   assert.deepEqual(JSON.parse(remoto.movs[k]),arquivo);
   assert.equal(Object.keys(remoto.movs).length,1);
   assert.equal(await rec.evaluate(async raw=>{
    window._versoes=[{rot:'cópia confirmada',origem:'ensaio',raw:JSON.stringify(raw),r:resumoBanco(raw)}];
    await restaurarVersao(0);return gravarAgora();
   },copiada),true);
   remoto=await admin('jvtenis/v2');assert.deepEqual(JSON.parse(remoto.movs[k]),arquivo);
   assert.equal(Object.keys(remoto.movs).length,2);
  });
  await check('restauração confirma cópia anterior no IndexedDB e bloqueia falha de backup',async()=>{
   const resultado=await rec.evaluate(async raw=>{
    guardarVersoes=window.sdkGuardarVersoesOriginal;
    const antes=JSON.stringify(DB);
    window._versoes=[{rot:'ensaio de cópia durável',origem:'ensaio',raw:JSON.stringify(raw),r:resumoBanco(raw)}];
    const ok=await restaurarVersao(0);await _filaVersoes;
    return {ok,antes,copia:await idbGet(snapKey(1))};
   },anterior);
   assert.equal(resultado.ok,true);assert.equal(resultado.copia,resultado.antes);
   assert.equal(await rec.evaluate(()=>gravarAgora()),true);
   const banco=await admin('jvtenis/v2');
   const bloqueado=await rec.evaluate(async raw=>{
    const antes=JSON.stringify(DB),removidos=JSON.stringify(_removidos);
    guardarVersoes=async()=>false;
    window._versoes=[{rot:'ensaio sem espaço',origem:'ensaio',raw:JSON.stringify(raw),r:resumoBanco(raw)}];
    const ok=await restaurarVersao(0);
    return {ok,antes,depois:JSON.stringify(DB),removidos,depoisRemovidos:JSON.stringify(_removidos)};
   },copiada);
   assert.equal(bloqueado.ok,false);assert.equal(bloqueado.antes,bloqueado.depois);
   assert.equal(bloqueado.removidos,bloqueado.depoisRemovidos);assert.deepEqual(await admin('jvtenis/v2'),banco);
  });

  const aluno2=await page('aluno-reserva-dois'),helper="function datasReserva(data,rec){\n  const inicio=new Date(String(data)+'T12:00:00'),hoje=new Date(),lim=new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()+90,12);\n  if(isNaN(inicio.getTime())||inicio>lim)return [];\n  const lista=[];for(let d=new Date(inicio);d<=lim;d.setDate(d.getDate()+7)){\n    lista.push(dKey(d));if(rec!=='fixo')break;\n  }\n  return lista;\n}\nfunction chaveReserva(data,hora){return 'reserva_'+data+'_'+String(hora).replace(':','');}\n/* Criação única no banco: duas reservas particulares não podem ganhar a mesma\n   chave. A regra existente permite criar, mas não sobrescrever pedido alheio. */\nasync function enviarReservaUnica(pedido,grupo){\n  await esperarAuth();\n  const uid=authUid();if(!uid)throw new Error('sem identificação');\n  const ref=window.fbDB.ref('jvtenis/fila_agendamentos');\n  const item=Object.assign({},pedido,{uid,codigo:String(MEU.codigo||'')});\n  if(grupo){await ref.push(item);return;}\n  const datas=datasReserva(pedido.data,pedido.rec);\n  if(!datas.length)throw new Error('data inválida');\n  const chave=chaveReserva(pedido.data,pedido.hora),updates={};\n  pedido.reservaChaves=datas.map(d=>chaveReserva(d,pedido.hora));\n  for(const data of datas)updates[chaveReserva(data,pedido.hora)]=Object.assign({},item,{\n    data,principal:chave,travaSomente:data!==pedido.data?1:0,reservaChaves:pedido.reservaChaves\n  });\n  // update multi-local é atômico: uma ocorrência ocupada recusa o conjunto inteiro.\n  await ref.update(updates);\n}";
  for(const [p,uid,codigo]of [[unauthorized,'aluno-emulador-teste','9901'],[aluno2,'aluno-reserva-dois','9902']]){
   await p.addScriptTag({content:helper});
   await p.evaluate(({uid,codigo})=>{window.MEU={codigo};authUid=()=>uid;esperarAuth=async()=>{};},{uid,codigo});
  }
  const data=await rec.evaluate(()=>{
   const h=new Date();let d=new Date(h.getFullYear(),h.getMonth(),h.getDate()+2,12);
   while(d.getDay()!==1)d.setDate(d.getDate()+1);return dKey(d);
  });
  const proxima=await rec.evaluate(data=>{const d=new Date(data+'T12:00:00');d.setDate(d.getDate()+7);return dKey(d);},data);
  const pedido=(id,codigo='9901',extra={})=>({id,codigo,nome:'Reserva SDK Teste',data,hora:'09:00',rec:'pontual',ts:Date.now(),...extra});
  await admin('jvtenis/fila_agendamentos',null);
  await check('criação única existente recusa dois particulares simultâneos sem expor a fila',async()=>{
   const result=await Promise.allSettled([
    unauthorized.evaluate(p=>enviarReservaUnica(p,false),pedido('exclusiva-1')),
    aluno2.evaluate(p=>enviarReservaUnica(p,false),pedido('exclusiva-2','9902'))
   ]);
   assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
   assert.equal(result.filter(r=>r.status==='rejected').length,1);
   const q=await admin('jvtenis/fila_agendamentos');assert.equal(Object.keys(q).length,1);
   assert.equal(await aluno2.evaluate(async()=>{try{await fbDB.ref('jvtenis/fila_agendamentos').get();return false;}catch{return true;}}),true);
  });
  await admin('jvtenis/fila_agendamentos',null);
  await check('fixo usa criação atômica: conflito futuro não deixa reserva parcial',async()=>{
   await aluno2.evaluate(p=>enviarReservaUnica(p,false),pedido('futura','9902',{data:proxima}));
   await assert.rejects(unauthorized.evaluate(p=>enviarReservaUnica(p,false),pedido('fixa','9901',{rec:'fixo'})));
   const q=await admin('jvtenis/fila_agendamentos');assert.equal(Object.keys(q).length,1);
   assert.equal(q['reserva_'+data+'_0900'],undefined);
  });
  await admin('jvtenis/fila_agendamentos',null);
  await check('aula em grupo permite dois pedidos mantendo a identidade de cada aluno',async()=>{
   await Promise.all([
    unauthorized.evaluate(p=>enviarReservaUnica(p,true),pedido('grupo-1','9901',{grupo:1})),
    aluno2.evaluate(p=>enviarReservaUnica(p,true),pedido('grupo-2','9902',{grupo:1}))
   ]);
   const q=await admin('jvtenis/fila_agendamentos');assert.equal(Object.keys(q).length,2);
   assert.equal(new Set(Object.values(q).map(p=>p.uid)).size,2);
  });
  await admin('jvtenis/fila_agendamentos',null);
  await check('Gestão confirma agenda antes de manter trava; cancelamento durável libera a vaga',async()=>{
   const gest=await page(owner);
   await gest.evaluate(uid=>abrirEspaco('dono',uid),owner);
   await gest.evaluate(f=>{
    DB=JSON.parse(JSON.stringify(f));DB.alunos.push({...DB.alunos[0],id:'outro-reserva',codigo:'9902',nome:'Outro SDK Teste'});
    DB.agenda={fixos:[],eventos:[],excecoes:[]};ensureFields();persist=window.sdkPersist;doPublish=async()=>{};
   },fixture);
   const seed=await gest.evaluate(()=>{const alunos={};for(const a of DB.alunos)alunos[chaveFb(a.id)]=JSON.stringify(a);
    return {alunos,agenda:JSON.stringify(DB.agenda),config:JSON.stringify(configDe(DB)),carimbos:{savedAt:1}};});
   await admin('jvtenis/v2',seed);await baseline(gest);
   await admin('jvtenis/aluno_vinculos',{'aluno-emulador-teste':{ativo:true,codigo:'9901',alunoId:'teste'},'aluno-reserva-dois':{ativo:true,codigo:'9902',alunoId:'outro-reserva'}});
   await unauthorized.evaluate(p=>enviarReservaUnica(p,false),pedido('duravel'));
   await gest.evaluate(()=>syncRequests(true));
   const q=await admin('jvtenis/fila_agendamentos'),no=await admin('jvtenis/v2');
   const estadoSync=await gest.evaluate(()=>({dono:ehDono(),vinculos:VINCULOS,erro:lastCloudError,conflito:!!_conflitoNuvem,agenda:DB.agenda,respostas:DB.respostasReservas,syncing}));
   assert.equal(q['reserva_'+data+'_0900'].processado,true,JSON.stringify(estadoSync));
   assert.equal(JSON.parse(no.agenda).eventos.length,1);
   await assert.rejects(aluno2.evaluate(p=>enviarReservaUnica(p,false),pedido('recusada','9902')));
   await unauthorized.evaluate(async p=>{await fbDB.ref('jvtenis/fila_agendamentos').push({...p,acao:'cancelar',uid:authUid()});},pedido('cancelar-duravel'));
   await gest.evaluate(()=>syncRequests(true));
   assert.equal(JSON.parse((await admin('jvtenis/v2')).agenda).eventos.length,0);
   assert.equal(await admin('jvtenis/fila_agendamentos'),null);
   await aluno2.evaluate(p=>enviarReservaUnica(p,false),pedido('nova-vaga','9902'));
   assert.equal(Object.keys(await admin('jvtenis/fila_agendamentos')).length,1);
   assert.deepEqual(gest.errors,[]);
  });

  await check('Aluno relê grade com SDK conectado e identifica particular reservado sem nomes de terceiros',async()=>{
   const grade={fixos:[],eventos:[{id:'ocupada',data,hora:'09:00',tipo:'ocupado'}],excecoes:[]};
   await admin('jvtenis/jvtenis-app-publico',JSON.stringify({grade,horarioCfg:{1:{'09:00':'aula'}},horarioData:{}}));
   await admin('jvtenis/alunos_privados/aluno-emulador-teste',JSON.stringify({aluno:{codigo:'9901',nome:'Aluno SDK Teste',status:'pago'},gradeMeu:{fixos:[],eventos:[],excecoes:[]}}));
   await unauthorized.addScriptTag({content:"async function atualizarGradeReserva(){\n  await esperarAuth();\n  const ligado=await comPrazo(window.fbDB.ref('.info/connected').once('value'),4000,null);\n  if(!ligado||ligado.val()!==true)throw new Error('sem conexão confirmada');\n  const raw=await cloudGet(SECUREPUBKEY);\n  if(raw){\n    const shared=JSON.parse(raw),privRaw=await cloudGet('jvtenis/'+PRIV_KEY+'/'+authUid());\n    if(!privRaw)throw new Error('acesso pendente');\n    const priv=JSON.parse(privRaw);\n    if(!priv.aluno||String(priv.aluno.codigo)!==String(MEU.codigo))throw new Error('acesso pendente');\n    PUB.grade=juntarGradeSegura(shared.grade,priv.gradeMeu,MEU.codigo);EU=priv.aluno;\n    PUB.reservasRespostas=priv.reservasRespostas||[];\n    conferirRespostasReservas();\n    PUB.horarioCfg=shared.horarioCfg||{};PUB.horarioData=shared.horarioData||{};\n  }else{\n    const legado=await cloudGet(PUBKEY);if(!legado)throw new Error('agenda indisponível');\n    const pub=JSON.parse(legado);PUB.grade=pub.grade;EU=(pub.alunos||[]).find(x=>String(x.codigo)===String(MEU.codigo))||null;\n    PUB.horarioCfg=pub.horarioCfg||{};PUB.horarioData=pub.horarioData||{};\n  }\n  if(!EU||!PUB.grade)throw new Error('agenda indisponível');\n}\nfunction juntarGradeSegura(publica,minha,codigo){\n  publica=publica||{fixos:[],eventos:[],excecoes:[]};minha=minha||{fixos:[],eventos:[],excecoes:[]};\n  const mf=(minha.fixos||[]).map(x=>Object.assign({},x,{cod:codigo}));\n  const me=(minha.eventos||[]).map(x=>Object.assign({},x,{cod:codigo}));\n  const idsF=new Set(mf.map(x=>x.id)),idsE=new Set(me.map(x=>x.id));\n  const fix=(publica.fixos||[]).filter(x=>!idsF.has(x.id)).concat(mf);\n  const ev=(publica.eventos||[]).filter(x=>!idsE.has(x.id)).concat(me);\n  const ex=[...(publica.excecoes||[])];\n  (minha.excecoes||[]).forEach(x=>{if(!ex.some(y=>y.fixoId===x.fixoId&&y.data===x.data))ex.push(x);});\n  return {fixos:fix,eventos:ev,excecoes:ex};\n}\nfunction conferirRespostasReservas(){\n  const recusados=(PUB.reservasRespostas||[]).filter(r=>r.estado==='recusado');\n  for(const r of recusados)if((MEU.pedidos||[]).some(p=>p.id===r.id)){\n    MEU.pedidos=MEU.pedidos.filter(p=>p.id!==r.id);\n    toast('Reserva não confirmada: '+r.motivo);\n  }\n}\nfunction slotState(date,hora){\n  const dia=date.getDay(),dk=dKey(date),G=PUB.grade||{fixos:[],eventos:[],excecoes:[]};\n  const fixos=(G.fixos||[]).filter(f=>f.dia===dia&&f.hora===hora&&fixoValeEm(f,dk)&&!(G.excecoes||[]).some(x=>x.fixoId===f.id&&x.data===dk));\n  const evs=(G.eventos||[]).filter(e=>e.data===dk&&e.hora===hora),all=fixos.concat(evs);\n  const bloq=all.filter(e=>e.tipo==='bloqueio');\n  if(bloq.length)return bloq.some(e=>e.motivo==='chuva')?{st:'chuva',label:'Cancelado por chuva'}:{st:'bloq',label:'Indisponível'};\n  const meu=all.some(e=>e.cod===MEU.codigo);\n  if(meu&&foiCancelado(dk,hora))return {st:'ocup',label:'Cancelamento aguardando confirmação'};\n  if(meu)return {st:'meu',label:'Minha aula'};\n  const compartilhado=all.length&&all.every(e=>e.tipo===all[0].tipo)&&['grupo','locacao','torneio'].includes(all[0].tipo)?all[0].tipo:'';\n  const limiteGrupo=compartilhado==='grupo'?Math.min(...all.map(e=>[2,3,4].includes(Number(e.pessoas))?Number(e.pessoas):2)):0;\n  const grupo=compartilhado==='grupo'&&all.length<limiteGrupo;\n  if(all.length&&(!compartilhado||compartilhado==='grupo'&&!grupo))return {st:'ocup',label:compartilhado==='grupo'?'Grupo completo':'Reservado'};\n  if((MEU.pedidos||[]).some(p=>{\n    if(p.hora!==hora)return false;\n    if(p.rec==='fixo')return new Date(p.data+'T12:00:00').getDay()===dia&&dk>=p.data;\n    return p.data===dk;\n  }))return {st:'pend',label:'Aguardando ⏳'};\n  const modo=slotModo(date,hora);\n  if(modo==='fechado')return {st:'fechado',label:'Fechado'};\n  if(grupo&&modo==='aula')return {st:'livre',label:limiteGrupo===4?'Aula quádrupla':limiteGrupo===3?'Aula em trio':'Aula em dupla',grupo:true,compartilhado:'grupo',limiteGrupo};\n  if(compartilhado==='locacao')return {st:'loc',label:'Locação · participar',compartilhado};\n  if(compartilhado==='torneio')return {st:'livre',label:'Torneio · participar',compartilhado};\n  if(all.length)return {st:'ocup',label:'Reservado'};\n  if(modo==='loc')return {st:'loc',label:'Só locação'};\n  return {st:'livre',label:'Disponível'};\n}\nfunction foiCancelado(dk,hora){return (MEU.cancelados||[]).some(c=>c.data===dk&&c.hora===hora);}"});
   const estado=await unauthorized.evaluate(async data=>{
    window.PUB={grade:{fixos:[],eventos:[],excecoes:[]}};MEU.pedidos=[];MEU.cancelados=[];
    cloudGet=async key=>{const snap=await fbDB.ref(key.startsWith('jvtenis/')?key:'jvtenis/'+key).get();return snap.exists()?snap.val():null;};
    await atualizarGradeReserva();return slotState(new Date(data+'T12:00:00'),'09:00');
   },data);
   assert.equal(estado.st,'ocup');assert.equal(estado.label,'Reservado');
  });
  for(const p of [a,b,unauthorized,prof,rec,aluno2])assert.deepEqual(p.errors,[]);
  console.log('✅ '+count+' verificações com SDK Firebase real e emulador local');
 }finally{for(const c of contexts)await c.close();await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

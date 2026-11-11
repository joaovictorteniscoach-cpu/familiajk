/* Abertura: reserva e v2 leem em paralelo; a escolha/base esperam as duas.
   Apenas dados fictícios e Firebase simulado, sem rede externa. */
const motores=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-11-09T07:00:00-03:00');
const server=http.createServer((req,res)=>{
 const u=decodeURI(req.url.split('?')[0]),f=path.join(root,u,u.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
 for(const motor of ['chromium','webkit']){
  const browser=await motores[motor].launch({headless:true});
  try{
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
   await c.clock.setFixedTime(AGORA);
   const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
   await p.goto(base+'/app-gestao/',{waitUntil:'load'});await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,null,{timeout:40000});
   await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#splash-gestao,#barra-versao,#barra-endereco,#toast{display:none!important}'});
   const reset=(options={})=>p.evaluate(options=>{
    clearTimeout(saveTimer);esperarAuth=async()=>{};migrarVersoesParaIdb=async()=>0;
    MODO='dono';KEY=KEY_DONO;RAIZ='jvtenis';window._espacoAberto=true;
    _conflitoNuvem=null;_nuvemMuda=false;_abriuSemConferir=false;_semDados=false;lastCloudError='';cloudPending=false;
    _basePartes=null;_basePartesLida=false;_basePartesAssinatura='';_enviado={};
    window.fbDB=null;
    DB={alunos:[{id:'f1',nome:'Aluno Antes',codigo:'8801',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:2,locCred:0,mensalidade:640,status:'pago',ativo:true}],
     agenda:{fixos:[],eventos:[{id:'evento-ficticio',alunoId:'f1',titulo:'Aluno Antes',tipo:'aula',data:'2026-11-11',hora:'16:00'}],excecoes:[]},movs:[],presencas:[],lancamentos:[],mesCreditos:'2026-11',mesPagamentos:'2026-11',ultimoBackup:Date.now(),savedAt:50};
    ensureFields();
    const copy=v=>JSON.parse(JSON.stringify(v)),mk=(nome,ts)=>{const d=copy(DB);d.alunos[0].nome=nome;d.savedAt=ts;return d;};
    const blob=mk('Aluno Reserva',options.blobTs||100),parts=mk('Aluno Atual',options.partsTs||200);
    if(options.blobLarger)blob.alunos.push({...blob.alunos[0],id:'f2',codigo:'8802',nome:'Outra Pessoa Fictícia'});
    const node=planoDeEnvio(parts).no;
    window.__read={requests:[],pending:{},writes:0,persist:0,publish:0,done:false,blob:JSON.stringify(blob),node};
    const snap=v=>({exists:()=>v!=null,val:()=>copy(v)});
    const blobPath=fbPath(KEY),partsPath=RAIZ+'/v2';
    window.fbDB={ref:cam=>({
     get:()=>{
      const kind=cam===blobPath?'blob':cam===partsPath?'v2':'other';
      if(kind==='other')return Promise.resolve(snap(null));
      __read.requests.push(kind);
      if(options.failBlob&&kind==='blob')return Promise.reject(Error('permission_denied'));
      if(options.failParts&&kind==='v2')return Promise.reject(Error('permission_denied'));
      return new Promise((resolve,reject)=>{__read.pending[kind]={resolve:v=>resolve(snap(v)),reject};});
     },
     once:async()=>snap(false),on:()=>{},off:()=>{},
     set:async()=>{__read.writes++;},update:async()=>{__read.writes++;},
     transaction:async()=>{__read.writes++;return {committed:false,snapshot:snap(null)};}
    })};
    window.__read.resolve=kind=>__read.pending[kind].resolve(kind==='blob'?__read.blob:__read.node);
    persist=()=>{__read.persist++;};publish=()=>{__read.publish++;};
    guardarVersoes=()=>{};logAct=()=>{};
    for(const name of ['syncRequests','lerMapaQuadra','publicarMapaQuadra','publicarAgendaProf','lerAgendaProf','iniciarAvisosNuvem','checarPortaEntrada','conferirVersao','conferirEndereco','conferirSemente'])window[name]=()=>{};
    _basePartes=null;_basePartesLida=false;_basePartesAssinatura='';_enviado={};
    guardarMetaProtecao({base:'',nuvem:0});marcarSemNuvem(false);localStorage.removeItem(KEY);
    if(options.local){const local=mk('Aluno Local',50);localStorage.setItem(KEY,JSON.stringify(local));}
    CARREGADO=false;
   },options);
   const start=async()=>p.evaluate(()=>{window.__loadJob=load().then(()=>{__read.done=true;});});
   const waiting=async()=>p.waitForFunction(()=>__read.requests.includes('blob')&&__read.requests.includes('v2'));
   const complete=async()=>p.evaluate(()=>__loadJob);
   const student=()=>p.evaluate(()=>DB.alunos.map(a=>({nome:a.nome,creditos:a.creditos,repos:a.repos,mensalidade:a.mensalidade})));

   await check(motor+': ambas as leituras iniciam sem esperar a primeira; base só é adotada após ambas',async()=>{
    await reset();await start();await waiting();
    assert.equal(await p.evaluate(()=>_basePartesLida),false);
    await p.evaluate(()=>__read.resolve('v2'));await p.waitForTimeout(30);
    assert.deepEqual(await p.evaluate(()=>({done:__read.done,base:_basePartesLida,writes:__read.writes,persist:__read.persist,nome:DB.alunos[0].nome})),{done:false,base:false,writes:0,persist:0,nome:'Aluno Antes'});
    await p.evaluate(()=>__read.resolve('blob'));await complete();
    assert.deepEqual(await student(),[{nome:'Aluno Atual',creditos:3,repos:2,mensalidade:640}]);
    assert.equal(await p.evaluate(()=>_basePartesLida),true);
    assert.deepEqual(await p.evaluate(()=>__read.requests.sort()),['blob','v2']);
   });
   await check(motor+': reserva chega primeiro; aguarda v2 e preserva os saldos',async()=>{
    await reset();await start();await waiting();await p.evaluate(()=>__read.resolve('blob'));await p.waitForTimeout(30);
    assert.equal(await p.evaluate(()=>__read.done),false);assert.equal(await p.evaluate(()=>DB.alunos[0].nome),'Aluno Antes');
    await p.evaluate(()=>__read.resolve('v2'));await complete();
    assert.deepEqual(await student(),[{nome:'Aluno Atual',creditos:3,repos:2,mensalidade:640}]);
   });
   await check(motor+': recusa na v2 preserva a reserva; não confunde com banco vazio',async()=>{
    await reset({failParts:true});await start();await waiting();await p.evaluate(()=>__read.resolve('blob'));await complete();
    assert.deepEqual(await student(),[{nome:'Aluno Reserva',creditos:3,repos:2,mensalidade:640}]);
    assert.equal(await p.evaluate(()=>_basePartesLida),false);assert.match(await p.evaluate(()=>lastCloudError),/permission_denied/);
   });
   await check(motor+': recusa da reserva ainda permite adotar v2 válida',async()=>{
    await reset({failBlob:true});await start();await waiting();await p.evaluate(()=>__read.resolve('v2'));await complete();
    assert.deepEqual(await student(),[{nome:'Aluno Atual',creditos:3,repos:2,mensalidade:640}]);
    assert.equal(await p.evaluate(()=>_basePartesLida),true);
   });
   await check(motor+': falha nas duas leituras mantém cópia local e impede envio automático',async()=>{
    await reset({failBlob:true,failParts:true,local:true});await start();await complete();
    assert.deepEqual(await student(),[{nome:'Aluno Local',creditos:3,repos:2,mensalidade:640}]);
    assert.deepEqual(await p.evaluate(()=>({base:_basePartesLida,unverified:_abriuSemConferir,writes:__read.writes,persist:__read.persist,publish:__read.publish})),{base:false,unverified:true,writes:0,persist:0,publish:0});
   });
   await check(motor+': prazo esgotado em ambas mantém local sem semear ou gravar',async()=>{
    await reset({local:true});await start();await waiting();await p.waitForFunction(()=>__read.done,null,{timeout:15000});
    assert.deepEqual(await student(),[{nome:'Aluno Local',creditos:3,repos:2,mensalidade:640}]);
    assert.deepEqual(await p.evaluate(()=>({unverified:_abriuSemConferir,writes:__read.writes,persist:__read.persist,publish:__read.publish})),{unverified:true,writes:0,persist:0,publish:0});
   });
   await check(motor+': v2 antiga e menor não substitui reserva maior e recente',async()=>{
    await reset({blobLarger:true,blobTs:300,partsTs:100});await start();await waiting();
    await p.evaluate(()=>{__read.resolve('v2');__read.resolve('blob');});await complete();
    assert.deepEqual((await student()).map(x=>x.nome),['Aluno Reserva','Outra Pessoa Fictícia']);
   });
   assert.deepEqual(errors,[]);await c.close();
  }finally{await browser.close();}
 }
 }finally{server.close();}
 console.log('✅ '+count+' cenários de abertura paralela e proteção das cópias');
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

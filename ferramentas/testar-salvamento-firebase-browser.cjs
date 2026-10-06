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
  const a=await page(owner),b=await page(owner);
  const seed=await a.evaluate(()=>{
   const conf=configDe(DB),alunos={};for(const a of DB.alunos)alunos[chaveFb(a.id)]=JSON.stringify(a);
   return {alunos,agenda:JSON.stringify(DB.agenda),config:JSON.stringify(conf),carimbos:{savedAt:1}};
  });
  await admin('jvtenis/v2',seed);await baseline(a);await baseline(b);
  await check('regra permite transação do dono; mensalidade e extrato permanecem coerentes',async()=>{
   await a.evaluate(()=>{persist=window.sdkPersist;DB.alunos[0].mensalidade=800;persist();});
   assert.equal(await a.evaluate(()=>gravarAgora()),true);
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
   await unauthorized.evaluate(()=>{persist=window.sdkPersist;DB.alunos[0].mensalidade=100;persist();});
   assert.equal(await unauthorized.evaluate(()=>gravarAgora()),false);
   assert.equal(await unauthorized.evaluate(()=>cloudPending),true);
   assert.equal(JSON.parse((await admin('jvtenis/v2')).alunos.teste).mensalidade,900);
  });
  const prof=await page('prof-emulador-teste');
  await admin('jvtenis/prof/prof-emulador-teste/v2',seed);
  await baseline(prof,'jvtenis/prof/prof-emulador-teste/v2');
  await check('professor grava somente no próprio espaço, com a mesma proteção',async()=>{
   await prof.evaluate(()=>{persist=window.sdkPersist;DB.alunos[0].mensalidade=820;persist();});
   assert.equal(await prof.evaluate(()=>gravarAgora()),true);
   assert.equal(JSON.parse((await admin('jvtenis/prof/prof-emulador-teste/v2')).alunos.teste).mensalidade,820);
   assert.equal(await prof.evaluate(async()=>{try{await sdkDatabase.ref('jvtenis/v2').get();return false;}catch(e){return true;}}),true);
   assert.equal(JSON.parse((await admin('jvtenis/v2')).alunos.teste).mensalidade,900);
  });
  for(const p of [a,b,unauthorized,prof])assert.deepEqual(p.errors,[]);
  console.log('✅ '+count+' verificações com SDK Firebase real e emulador local');
 }finally{for(const c of contexts)await c.close();await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

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
  if(theme==='classico')localStorage.setItem('jvt-tema','classico');
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
async function configureCloud(p,no){
 await p.evaluate(async no=>{
  const snap=v=>({exists:()=>v!==null&&v!==undefined,val:()=>v});
  window.fbDB={ref(cam){
   if(cam===RAIZ+'/v2')return {
    get:async()=>snap(await window.testCloudRead()),
    transaction:async fn=>{
     let current=await window.testCloudRead();
     for(let i=0;i<4;i++){
      const next=fn(current);
      if(next===undefined)return {committed:false,snapshot:snap(current)};
      const r=await window.testCloudCommit({expected:current,next});
      if(r.committed)return {committed:true,snapshot:snap(r.current)};
      current=r.current;
     }
     throw Error('too many retries');
    }
   };
   return {get:async()=>snap(null),set:async()=>window.testAuxWrite(),update:async()=>window.testAuxWrite(),remove:async()=>window.testAuxWrite(),
    transaction:async fn=>({committed:true,snapshot:snap(fn(null))})};
  }};
  await confirmarBasePartes(no);_enviado=marcasDasPartes(no);_conflitoNuvem=null;cloudPending=false;
  guardarMetaProtecao({base:_basePartesAssinatura});_abriuSemConferir=false;
  publish=()=>{window.testPublications=(window.testPublications||0)+1;};
  publicarMapaQuadra=()=>{};publicarAgendaProf=()=>{};finalizarAvisosPagos=async()=>{};
  subirBlobDeReserva=async()=>{};backupNuvem=async()=>{};backupDoDia=async()=>{};
 },no);
}
async function nodeOf(p,data){
 return p.evaluate(d=>{
  const conf={};for(const k of Object.keys(d))if(!['alunos','movs','presencas','lancamentos','agenda'].includes(k))conf[k]=d[k];
  const no={alunos:{},config:JSON.stringify(conf),agenda:JSON.stringify(d.agenda),carimbos:{savedAt:d.savedAt}};
  for(const a of d.alunos)no.alunos[chaveFb(a.id)]=JSON.stringify(a);
  for(const name of ['movs','presencas','lancamentos'])if(d[name].length){no[name]={};for(const x of d[name])no[name][chaveFb(CHAVE_LINHA[name](x))]=JSON.stringify(x);}
  return no;
 },data);
}
async function fit(p,w){await p.setViewportSize({width:w,height:852});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+w);}
async function contrast(p,selector){
 const issues=await p.evaluate(sel=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>(x/=255)<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
  const issues=[];
  for(const e of document.querySelectorAll(sel)){
   if(!e.getClientRects().length||!Array.from(e.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))continue;
   const st=getComputedStyle(e);if(st.visibility==='hidden'||st.opacity!=='1')continue;
   let part=e,bg=null;
   while(part){const s=getComputedStyle(part),v=rgb(s.backgroundColor);if(s.backgroundImage!=='none'||s.opacity!=='1')break;if(v.length===3||v[3]===1){bg=v;break;}if(v[3]>0)break;part=part.parentElement;}
   if(!bg)continue;
   let fg=rgb(st.webkitTextFillColor||st.color);if(fg.length===4)fg=fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));
   const a=lum(bg),b=lum(fg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   const large=parseFloat(st.fontSize)>=24||(parseFloat(st.fontSize)>=18.66&&parseInt(st.fontWeight)>=700);
   if(ratio<(large?3:4.5))issues.push({text:e.textContent.trim().slice(0,70),ratio});
  }return issues;
 },selector);
 assert.deepEqual(issues,[]);
}
async function shot(p,theme,key,locator){
 if(process.env.JV_VISUAL_LOG==='1'){
  const buf=await (locator?p.locator(locator):p).screenshot({type:'jpeg',quality:65});
  console.log('VISUAL_SEG '+theme+' '+key+' '+buf.toString('base64'));
 }
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const b=await chromium.launch({executablePath:process.env.JV_BROWSER||undefined,args:['--no-sandbox']});
 try{
  for(const theme of ['saibro','classico']){
   const c=await b.newContext({viewport:{width:390,height:852},timezoneId:'America/Sao_Paulo',locale:'pt-BR',serviceWorkers:'block'});
   const p=await setup(c,base,theme);
   await check(theme+': R$300 recebidos de R$735 deixam R$435, sem mexer em aulas',async()=>{
    const before=await p.evaluate(()=>DB.alunos.map(a=>[a.id,a.creditos,a.repos]));
    await p.evaluate(()=>{registrarPagamento('solo');document.getElementById('pm-valor').value='300';resumoPagamentoExato();});
    assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('.pm-modal')).backgroundColor),'rgb(248, 248, 245)');
    await contrast(p,'#ov-pagamento-exato *');
    for(const w of [320,390,1280])await fit(p,w);await fit(p,390);
    await shot(p,theme,'pagamento','#ov-pagamento-exato .modal');
    await p.locator('#pm-confirmar').click();
    const result=await p.evaluate(()=>({q:situacaoMensalidade(DB.alunos[0]),db:DB.lancamentos,balances:DB.alunos.map(a=>[a.id,a.creditos,a.repos]),backup:window.testSavedCopy}));
    assert.equal(result.q.falta,435);assert.equal(result.q.recebido,300);assert.equal(result.q.status,'parcial');
    assert.equal(result.db.length,1);assert.equal(result.db[0].valor,300);assert.equal(result.db[0].formaPagamento,'Pix');
    assert.deepEqual(result.balances,before);assert.equal(result.backup.lancamentos.length,0);
    assert.equal(await p.locator('#k-pendente').textContent(),await p.evaluate(()=>fmtRs(1635)));
   });
   await check(theme+': inválido, excesso e cancelamento não mudam dados',async()=>{
    const before=await p.evaluate(()=>JSON.stringify(DB));await p.evaluate(()=>registrarPagamento('solo'));
    for(const value of ['0','-1','435.01','1.001']){
     await p.evaluate(v=>{document.getElementById('pm-valor').value=v;salvarPagamentoExato();},value);
     assert.equal(await p.evaluate(()=>JSON.stringify(DB)),before);
    }
    await p.evaluate(()=>{document.getElementById('pm-valor').value='10';document.getElementById('pm-data').value='2026-02-31';salvarPagamentoExato();});
    assert.equal(await p.evaluate(()=>JSON.stringify(DB)),before);
    p.setAccept(false);
    await p.evaluate(()=>{document.getElementById('pm-data').value=dKey(new Date());salvarPagamentoExato();});
    p.setAccept(true);assert.equal(await p.evaluate(()=>JSON.stringify(DB)),before);await p.evaluate(()=>closeModal('ov-pagamento-exato'));
   });
   await check(theme+': complemento quita; edição e remoção atualizam saldo',async()=>{
    await p.evaluate(()=>{registrarPagamento('solo');document.getElementById('pm-metodo').value='Dinheiro';salvarPagamentoExato();salvarPagamentoExato();});
    assert.equal(await p.evaluate(()=>DB.lancamentos.length),2);assert.equal(await p.evaluate(()=>situacaoMensalidade(DB.alunos[0]).falta),0);
    assert.equal(await p.evaluate(()=>DB.alunos[0].ultimoPago),await p.evaluate(()=>mesReal()));
    await p.evaluate(()=>{
     abrirLancEdit(DB.lancamentos[1].id);document.getElementById('le-valor').value='400';salvarLancEdit();
    });
    assert.equal(await p.evaluate(()=>situacaoMensalidade(DB.alunos[0]).falta),35);
    await p.evaluate(()=>delLanc(DB.lancamentos[1].id));
    assert.equal(await p.evaluate(()=>situacaoMensalidade(DB.alunos[0]).falta),435);
    assert.notEqual(await p.evaluate(()=>DB.alunos[0].ultimoPago),await p.evaluate(()=>mesReal()));
   });
   await check(theme+': cadastro preserva valor exato; avisos e relatório usam saldo',async()=>{
    await p.evaluate(()=>{openAlunoModal('solo');document.getElementById('a-mensalidade').value='800';saveAluno();});
    assert.equal(await p.evaluate(()=>situacaoMensalidade(DB.alunos[0]).falta),500);
    let text=await p.evaluate(()=>{let msg='';window.open=url=>{msg=url;return null;};cobrar('solo');return decodeURIComponent(msg);});
    assert.match(text,/500/);
    await p.evaluate(()=>{abrirFicha('solo');});
    assert.match(await p.locator('#ficha-aluno').textContent(),/Recebido/);
    assert.match(await p.locator('#ficha-aluno').textContent(),/500/);
    await p.evaluate(()=>{fecharFicha();go('fech',document.createElement('button'));document.getElementById('fc-aluno').value='solo';renderFechamento();});
    assert.match(await p.locator('#fech-export').textContent(),/Saldo a pagar/);
    assert.match(await p.locator('#fech-export').textContent(),/500/);
    assert.equal(await p.evaluate(()=>publicacaoLegadaEnxuta({alunos:[alunoPublicado(DB.alunos[0])]}).alunos[0].pagamentoMensal),null);
    await p.evaluate(()=>go('dash',document.createElement('button')));
   });
   await check(theme+': família cobra só o responsável e preserva reposições individuais',async()=>{
    const before=await p.evaluate(()=>JSON.stringify(DB));await p.evaluate(()=>registrarPagamento('filho'));assert.equal(await p.evaluate(()=>JSON.stringify(DB)),before);
    await p.evaluate(()=>{registrarPagamento('pai');document.getElementById('pm-valor').value='500';salvarPagamentoExato();});
    assert.equal(await p.evaluate(()=>saldoMensalidade(DB.alunos[2])),0);
    assert.equal(await p.evaluate(()=>situacaoMensalidade(DB.alunos[1]).falta),700);
    assert.equal(await p.evaluate(()=>statusFinanceiro(DB.alunos[2])),'parcial');
    assert.equal(await p.evaluate(()=>DB.alunos[2].repos),3);
   });
   await check(theme+': data da Caixa e competência da mensalidade são independentes',async()=>{
    await p.evaluate(()=>{
     registrarPagamento('solo');document.getElementById('pm-mes').value='2026-09';prepararPagamentoMes();
     document.getElementById('pm-valor').value='100';salvarPagamentoExato();
    });
    const l=await p.evaluate(()=>DB.lancamentos.at(-1));
    assert.equal(l.competenciaMensalidade,'2026-09');assert.equal(l.mes,'2026-10');
    assert.equal(await p.evaluate(()=>situacaoMensalidade(DB.alunos[0],'2026-10').recebido),300);
    assert.equal(await p.evaluate(()=>situacaoMensalidade(DB.alunos[0],'2026-09').recebido),100);
   });
   await check(theme+': legado 50% pede confirmação, sem inventar receita anterior',async()=>{
    await p.evaluate(()=>{delete DB.alunos[0].pagamentosExatos;DB.lancamentos=[];DB.alunos[0].status='parcial';registrarPagamento('solo');});
    assert.equal(await p.locator('#pm-anterior').inputValue(),'400.00');
    await p.evaluate(()=>{document.getElementById('pm-anterior').value='300';document.getElementById('pm-valor').value='100';salvarPagamentoExato();});
    assert.equal(await p.evaluate(()=>situacaoMensalidade(DB.alunos[0]).recebido),400);
    assert.equal(await p.evaluate(()=>DB.lancamentos.length),1);assert.equal(await p.evaluate(()=>DB.lancamentos[0].valor),100);
   });
   await check(theme+': indicador avisa pendências e mostra só confirmações reais',async()=>{
    await p.evaluate(()=>{
     guardarMetaProtecao({nuvem:Date.now()-60000,backup:Date.now()-3600000});cloudPending=true;setSave('⚠ salvo só no aparelho ⓘ','err');
    });
    assert.equal(await p.locator('#save-state').textContent(),'⚠ Só aparelho');
    assert.match(await p.locator('#pd-status').textContent(),/salvas só neste aparelho/);
    await contrast(p,'#pd-status *');for(const w of [320,390,1280])await fit(p,w);await fit(p,390);
    await shot(p,theme,'status','#pd-status');
    await p.evaluate(()=>{cloudPending=false;renderProtecaoDados();});
   });
   await check(theme+': aluno vê recebido e saldo; Pix usa R$435 e legado continua compatível',async()=>{
    const s=await c.newPage();s.on('pageerror',e=>p.errors.push(e.message));s.on('dialog',d=>d.dismiss());
    await s.goto(base+'/app-aluno/',{waitUntil:'load'});await s.waitForTimeout(250);
    await s.evaluate(()=>{
     PUB={alunos:[],horas:['08:00','09:00','16:00','17:00'],pix:'teste@example.invalid',pixNome:'Teste',pixCidade:'CURITIBA',grade:{fixos:[],eventos:[],excecoes:[]},precos:{},historico:{},aviso:''};
     EU={id:'solo',nome:'Aluno Exato Teste',codigo:'9901',tipo:'Particular',plano:4,creditos:3,repos:2,mensalidade:735,status:'parcial',
      pagamentoMensal:{mes:dKey(new Date()).slice(0,7),exato:true,recebido:300,falta:435,total:735}};
     PUB.alunos=[EU];MEU={codigo:EU.codigo,pedidos:[],cancelados:[]};VINCULO_ESTADO='ativo';_renovaAdiado=true;show();goAluno('inicio',document.getElementById('nav-al-inicio'));renderPremiumAluno();
     window.studentPixArgs=null;abrirPix=(...args)=>{window.studentPixArgs=args;};pagarPix();
    });
    assert.match(await s.locator('#home-saldo-pagamento').textContent(),/435/);
    assert.equal(await s.evaluate(()=>window.studentPixArgs[0]),435);
    assert.equal(await s.evaluate(()=>window.studentPixArgs[2].valor),435);
    await shot(s,theme,'aluno','#jv-home-pay');
    await s.evaluate(()=>{EU.pagamentoMensal=null;renderPremiumAluno();});
    assert.equal(await s.locator('#home-saldo-pagamento').isVisible(),false);
    assert.equal(await s.locator('#cred-page-restante-row').isVisible(),false);await s.close();
   });
   await check(theme+': nuvem aceita somente versão conferida; outro aparelho não sobrescreve',async()=>{
    const baseData=copy(fixture);remote=await nodeOf(p,baseData);const baseNo=copy(remote);
    await configureCloud(p,baseNo);await p.evaluate(f=>{DB=JSON.parse(JSON.stringify(f));ensureFields();persist=window.testPersist;DB.alunos[0].mensalidade=800;persist();},fixture);
    assert.equal(await p.evaluate(()=>gravarAgora()),true);assert.equal(JSON.parse(remote.alunos.solo).mensalidade,800);
    const c2=await b.newContext({viewport:{width:390,height:852},timezoneId:'America/Sao_Paulo',locale:'pt-BR',serviceWorkers:'block'});
    const p2=await setup(c2,base,theme);await configureCloud(p2,baseNo);
    await p2.evaluate(()=>{persist=window.testPersist;DB.alunos[0].mensalidade=700;persist();});
    const writes=cloudWrites;assert.equal(await p2.evaluate(()=>gravarAgora()),false);assert.equal(cloudWrites,writes);
    assert.equal(JSON.parse(remote.alunos.solo).mensalidade,800);
    assert.equal(await p2.evaluate(()=>DB.alunos[0].mensalidade),700);
    assert.equal(await p2.evaluate(()=>JSON.parse(lsGet(KEY)).alunos[0].mensalidade),700);
    assert.equal(await p2.evaluate(()=>window.testPublications||0),0);
    assert.match(await p2.locator('#pd-diferencas').textContent(),/700.*800/);
    await contrast(p2,'#ov-conflito-nuvem *');for(const w of [320,390,1280])await fit(p2,w);await fit(p2,390);
    await shot(p2,theme,'conflito','#ov-conflito-nuvem .modal');
    const savedBefore=await p2.evaluate(()=>JSON.stringify(DB));p2.setAccept(false);await p2.evaluate(()=>carregarNuvemConferida());p2.setAccept(true);
    assert.equal(await p2.evaluate(()=>JSON.stringify(DB)),savedBefore);
    await p2.evaluate(()=>carregarNuvemConferida());
    assert.equal(await p2.evaluate(()=>DB.alunos[0].mensalidade),800);
    assert.equal(await p2.evaluate(()=>window.testSavedCopy.alunos[0].mensalidade),700);
    assert.equal(cloudWrites,writes);assert.deepEqual(p2.errors,[]);await c2.close();
   });
   await check(theme+': mudança ocorrida durante transação também é bloqueada',async()=>{
    remote=await nodeOf(p,fixture);const initial=copy(remote);await configureCloud(p,initial);
    race=copy(remote);race.alunos.solo=JSON.stringify({...fixture.alunos[0],mensalidade:900});race.carimbos.savedAt=900;
    await p.evaluate(f=>{DB=JSON.parse(JSON.stringify(f));ensureFields();DB.alunos[0].mensalidade=810;persist();},fixture);
    const writes=cloudWrites;assert.equal(await p.evaluate(()=>gravarAgora()),false);
    assert.equal(cloudWrites,writes);assert.equal(JSON.parse(remote.alunos.solo).mensalidade,900);
    await p.evaluate(()=>closeModal('ov-conflito-nuvem'));
   });
   await check(theme+': reenvio offline usa a base anterior e bloqueia outra versão',async()=>{
    await p.evaluate(()=>{
     const atual=KEY;marcarSemNuvem(false);KEY='jvtenis-prof-marca-teste';marcarSemNuvem(true);
     if(!salvouSemNuvem())throw Error('Marca ausente no espaço do professor');
     KEY=atual;if(salvouSemNuvem())throw Error('Marca vazou para o espaço do dono');
     localStorage.removeItem('jvtenis-prof-marca-teste__semnuvem');
    });
    const remembered=await p.evaluate(()=>metaProtecao().base);
    await p.evaluate(()=>{_basePartesLida=false;_conflitoNuvem=null;cloudPending=true;});
    const writes=cloudWrites;assert.equal(await p.evaluate(()=>gravarAgora()),false);
    assert.equal(cloudWrites,writes);assert.equal(await p.evaluate(()=>metaProtecao().base),remembered);
    await p.evaluate(()=>closeModal('ov-conflito-nuvem'));
   });
   await check(theme+': reabrir preserva edição offline mesmo com relógio atrasado',async()=>{
    remote=await nodeOf(p,fixture);const baseNo=copy(remote);await configureCloud(p,baseNo);
    remote.alunos.solo=JSON.stringify({...fixture.alunos[0],mensalidade:950});remote.carimbos.savedAt=Date.now()+3600000;
    await p.evaluate(f=>{DB=JSON.parse(JSON.stringify(f));ensureFields();DB.alunos[0].mensalidade=720;DB.savedAt=2;lsSet(KEY,JSON.stringify(DB));marcarSemNuvem(true);},fixture);
    const checkpoint=await p.evaluate(()=>metaProtecao().base);
    const writes=cloudWrites;await p.evaluate(()=>load());
    assert.equal(await p.evaluate(()=>metaProtecao().base),checkpoint);
    assert.ok(await p.evaluate(()=>salvouSemNuvem()));
    assert.equal(await p.evaluate(()=>DB.alunos[0].mensalidade),720);assert.equal(await p.evaluate(()=>!!_conflitoNuvem),true);
    assert.equal(cloudWrites,writes);assert.equal(JSON.parse(remote.alunos.solo).mensalidade,950);
    await p.evaluate(()=>closeModal('ov-conflito-nuvem'));
    await configureCloud(p,copy(remote));
    await p.evaluate(f=>{DB=JSON.parse(JSON.stringify(f));ensureFields();DB.alunos[0].mensalidade=730;DB.savedAt=Date.now()+7200000;lsSet(KEY,JSON.stringify(DB));marcarSemNuvem(false);},fixture);
    await p.evaluate(()=>load());
    assert.equal(await p.evaluate(()=>DB.alunos[0].mensalidade),730);assert.equal(await p.evaluate(()=>!!_conflitoNuvem),true);assert.equal(cloudWrites,writes);
    await p.evaluate(()=>closeModal('ov-conflito-nuvem'));
   });
   await check(theme+': recusa do servidor mantém cópia local e data de confirmação',async()=>{
    remote=await nodeOf(p,fixture);await configureCloud(p,copy(remote));
    const stamp=await p.evaluate(()=>metaProtecao().nuvem);deny=true;
    assert.equal(await p.evaluate(()=>gravarAgora()),false);deny=false;
    assert.equal(await p.evaluate(()=>metaProtecao().nuvem),stamp);
    assert.equal(await p.evaluate(()=>cloudPending),true);
   });
   await check(theme+': backup falho não anuncia sucesso; primeira cópia diária é preservada',async()=>{
    await p.evaluate(async f=>{
     clearTimeout(saveTimer);cloudPending=false;_conflitoNuvem=null;
     const values={},snap=v=>({exists:()=>v!=null,val:()=>v});
     let fail=true;window.fbDB={ref(path){return {
      set:async v=>{if(fail)throw Error('permission_denied');values[path]=v;},get:async()=>snap(values[path]||null),
      transaction:async fn=>{const v=fn(values[path]||null);values[path]=v;return {committed:true,snapshot:snap(v)};},
      remove:async()=>{}
     };}};
     guardarMetaProtecao({backup:0});_ultBkpNuvem=0;
     await window.testBackupNuvem(f);window.testFailBackupStamp=metaProtecao().backup;
     fail=false;await window.testBackupNuvem(f);window.testGoodBackupStamp=metaProtecao().backup;
     _ultBkpDia='';_bkpDiaTentou=0;await window.testBackupDia(f);
     const day=dKey(new Date()),first=values[RAIZ+'/backups_dia/'+day];
     delete values[RAIZ+'/backups_dia_idx'];_ultBkpDia='';_bkpDiaTentou=0;
     const changed=JSON.parse(JSON.stringify(f));changed.alunos[0].mensalidade=999;
     await window.testBackupDia(changed);
     window.testDayPreserved=first===values[RAIZ+'/backups_dia/'+day];
     window.fbDB=null;persist=()=>{};
    },fixture);
    assert.equal(await p.evaluate(()=>window.testFailBackupStamp),0);
    assert.ok(await p.evaluate(()=>window.testGoodBackupStamp)>0);
    assert.equal(await p.evaluate(()=>window.testDayPreserved),true);
   });
   await check(theme+': seletor e fila do fechamento só mostram ativos pendentes ou parciais',async()=>{
    await p.evaluate(()=>{
     window.fechoDBAntes=JSON.stringify(DB);
     const mk=monthKey(),[ano,mes]=mk.split('-').map(Number),prev=dKey(new Date(ano,mes-2,1)).slice(0,7);
     const aluno=(id,nome,extra)=>({id,nome,tipo:'Particular',plano:4,mensalidade:600,creditos:2,repos:1,status:'pendente',ultimoPago:prev,...extra});
     DB.alunos=[
      aluno('z-pendente','Zilda Teste',{}),aluno('a-parcial','Ana Teste',{status:'parcial'}),
      aluno('pago','Carlos Teste',{status:'pago'}),aluno('arquivado','Dora Teste',{arquivado:true}),
      aluno('inativo-status','Edu Teste',{status:'inativo',arquivado:false}),
      aluno('torneio','Fábio Teste',{perfil:'torneio'}),
      aluno('dependente','Gabi Teste',{responsavelId:'z-pendente',mensalidade:0}),
      aluno('exato-quitado','Heitor Teste',{status:'parcial',pagamentosExatos:{[mk]:{ajusteAnterior:600}}}),
      aluno('exato-parcial','Beatriz Teste',{status:'parcial',pagamentosExatos:{[mk]:{ajusteAnterior:200},[prev]:{ajusteAnterior:600}}})
     ];
     DB.lancamentos=[];window.fechoTesteAntes=JSON.stringify(DB);go('fech',document.createElement('button'));
     document.getElementById('fc-mes').value=mk;abrirFechamento();window.fechoTesteAnterior=prev;
    });
    const ids=()=>p.locator('#fc-aluno option').evaluateAll(es=>es.map(e=>e.value).filter(Boolean));
    assert.deepEqual(await ids(),['a-parcial','exato-parcial','z-pendente']);
    assert.deepEqual(await p.locator('#fc-fila .fq-nome').allTextContents(),['Ana Teste','Beatriz Teste','Zilda Teste']);
    assert.equal(await p.evaluate(()=>JSON.stringify(DB)),await p.evaluate(()=>window.fechoTesteAntes));
    await contrast(p,'#fc-fila *');await shot(p,theme,'fechamento-filtrado','#pg-fech');
    await p.evaluate(()=>{
     document.getElementById('fc-aluno').value='a-parcial';renderFechamento();
     DB.alunos.find(a=>a.id==='a-parcial').status='pago';renderAll();
    });
    assert.equal(await p.locator('#fc-aluno').inputValue(),'');assert.deepEqual(await ids(),['exato-parcial','z-pendente']);
    assert.doesNotMatch(await p.locator('#fc-envio-hint').textContent(),/Ana Teste/);
    await p.evaluate(()=>{
     document.getElementById('fc-mes').value=window.fechoTesteAnterior;
     document.getElementById('fc-mes').dispatchEvent(new Event('change'));
    });
    assert.deepEqual(await ids(),[]);assert.equal(await p.locator('#fc-fila .fq-nome').count(),0);
    await p.evaluate(()=>{DB=JSON.parse(window.fechoDBAntes);document.getElementById('fc-mes').value=monthKey();abrirFechamento();});
   });
   await check(theme+': nuvem confirmada fica discreta; detalhes permanecem em Segurança e dados',async()=>{
    await p.evaluate(()=>{
     _conflitoNuvem=null;_abriuSemConferir=false;_nuvemMuda=false;cloudPending=false;lastCloudError='';
     guardarMetaProtecao({nuvem:Date.now(),backup:Date.now()});setSave('✓ salvo na nuvem','ok');go('dash',document.createElement('button'));
    });
    assert.equal(await p.locator('#pd-status').isVisible(),false);
    assert.equal(await p.locator('#save-state').textContent(),'✓ Nuvem');
    // O Início usa o herói e oculta o cabeçalho; o indicador aparece nas outras abas.
    await p.evaluate(()=>go('fech',document.createElement('button')));
    assert.equal(await p.locator('#save-state').isVisible(),true);
    await p.locator('#save-state').click();
    assert.equal(await p.locator('#pg-seg').evaluate(e=>e.classList.contains('on')),true);
    assert.equal(await p.locator('#pd-detalhes').isVisible(),true);await contrast(p,'#pd-detalhes *');
    await shot(p,theme,'detalhes-seguranca','#pd-detalhes');
   });
   await check(theme+': envio rápido não alerta; pendência prolongada e conflito continuam visíveis',async()=>{
    await p.evaluate(()=>{
     go('dash',document.createElement('button'));window.hasCloudAnterior=hasCloud;hasCloud=()=>true;
     cloudPending=true;_tentativaLocal=performance.now();setSave('enviando à nuvem…');
    });
    assert.equal(await p.locator('#pd-status').isVisible(),false);
    await p.evaluate(()=>{_tentativaLocal=performance.now()-PRAZO_NUVEM-100;setSave('⚠ salvo só no aparelho ⓘ','err');});
    assert.equal(await p.locator('#pd-status').isVisible(),true);
    assert.match(await p.locator('#pd-status').textContent(),/salvas só neste aparelho/);
    await shot(p,theme,'pendencia-real','#pd-status');
    await p.evaluate(()=>{_conflitoNuvem={banco:null};_tentativaLocal=performance.now();renderProtecaoDados();});
    assert.match(await p.locator('#pd-status').textContent(),/Outra sessão/);assert.equal(await p.locator('#pd-status').isVisible(),true);
    await p.evaluate(()=>{_conflitoNuvem=null;cloudPending=false;hasCloud=window.hasCloudAnterior;renderProtecaoDados();});
   });
   await check(theme+': backup automático confirmado dispensa lembrete; adiar vale nas próximas sessões',async()=>{
    await p.evaluate(()=>{
     window.ultimoBackupTeste=DB.ultimoBackup;DB.ultimoBackup=0;
     sessionStorage.removeItem('jv-bk-adiar');localStorage.removeItem(KEY+'__lembreteBackup');
     guardarMetaProtecao({backup:Date.now()});
    });
    assert.equal(await p.locator('#bk-banner').isVisible(),false);
    await p.evaluate(()=>{guardarMetaProtecao({backup:0,nuvem:Date.now()});checarBackup();});
    assert.equal(await p.locator('#bk-banner').isVisible(),true);
    assert.match(await p.locator('#bk-banner .bk-msg').textContent(),/não há uma cópia de segurança confirmada/);
    await p.evaluate(()=>{adiarBackup();sessionStorage.removeItem('jv-bk-adiar');checarBackup();});
    assert.equal(await p.locator('#bk-banner').isVisible(),false);
    assert.ok(await p.evaluate(()=>Number(lsGet(KEY+'__lembreteBackup'))>Date.now()));
    await p.evaluate(()=>{
     localStorage.removeItem(KEY+'__lembreteBackup');checarBackup();
    });
    assert.equal(await p.locator('#bk-banner').isVisible(),true);
    await p.evaluate(()=>{
     DB.ultimoBackup=window.ultimoBackupTeste;guardarMetaProtecao({backup:Date.now()});sessionStorage.setItem('jv-bk-adiar','1');
    });
   });
   assert.deepEqual(p.errors,[]);await c.close();
  }
  console.log('✅ '+count+' verificações de pagamentos e proteção entre aparelhos');
 }finally{await b.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

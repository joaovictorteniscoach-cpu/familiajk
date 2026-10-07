/* Renovação manual e em lote. Somente dados fictícios; toda rede externa bloqueada. */
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
 try{
  for(const theme of ['saibro','classico']){
   const c=await b.newContext({viewport:{width:390,height:852}}),p=await setup(c,base,theme);
   const reset=async()=>p.evaluate(f=>{
    DB=JSON.parse(JSON.stringify(f));ensureFields();rmSel={};rmEscolha={};rmFeitos=null;rmAgCache={};
    Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);renderAll();
   },fixture);
   const edit=async(id,field,value)=>p.evaluate(({id,field,value})=>{
    openAlunoModal(id);document.getElementById(field).value=value;saveAluno();
   },{id,field,value});
   await check(theme+': ajuste real no cadastro exige conferência e não entra no lote',async()=>{
    await edit('solo','a-creditos','4');
    await p.evaluate(()=>abrirRenovaMes());
    assert.equal(await p.evaluate(()=>!!rmLinha(DB.alunos[0]).ajusteManual),true);
    assert.match(await p.locator('#rm-corpo').textContent(),/ajuste manual neste mês/);
    const row=p.locator('#rm-corpo .rm-row').filter({hasText:'Aluno Exato Teste'});
    assert.equal(await row.locator('input[type=checkbox]').count(),0);
    assert.equal(await row.getByText('Já renovei manualmente',{exact:false}).count(),1);
    assert.ok(await p.evaluate(()=>rmSel.solo===false));
   });
   await check(theme+': cancelar confirmação preserva saldos e bloqueio',async()=>{
    const before=await p.evaluate(()=>JSON.stringify(DB));
    p.setAccept(false);await p.locator('#rm-corpo .rm-row').filter({hasText:'Aluno Exato Teste'}).getByText('Já renovei manualmente',{exact:false}).click();p.setAccept(true);
    assert.equal(await p.evaluate(()=>JSON.stringify(DB)),before);
   });
   await check(theme+': confirmar renovação manual preserva os dados e exclui por todo o mês',async()=>{
    const before=await p.evaluate(()=>({a:{...DB.alunos[0]},movs:JSON.stringify(DB.movs)}));
    await p.locator('#rm-corpo .rm-row').filter({hasText:'Aluno Exato Teste'}).getByText('Já renovei manualmente',{exact:false}).click();
    const after=await p.evaluate(()=>({a:{...DB.alunos[0]},movs:JSON.stringify(DB.movs)}));
    delete after.a.ultimaRenovacao;assert.deepEqual(after,before);
    await p.evaluate(()=>{fecharRenovaMes();abrirRenovaMes();rmMarcar('solo',true);});
    assert.match(await p.evaluate(()=>rmLinha(DB.alunos[0]).bloqueio),/já renovado/);
    await p.evaluate(()=>{rmSel.pai=false;rmSel.filho=true;rmAplicar();});
    assert.equal(await p.evaluate(()=>DB.alunos[0].creditos),4);
    assert.equal(await p.evaluate(()=>DB.alunos[0].repos),2);
    assert.equal(await p.evaluate(()=>DB.alunos[1].creditos),2);
    assert.equal(await p.evaluate(()=>DB.alunos[2].creditos),3);
    assert.equal(await p.evaluate(()=>DB.alunos[2].repos),4);
    assert.equal(await p.evaluate(()=>DB.alunos[1].mensalidade),1200);
   });
   await reset();
   await check(theme+': correção de reposição pode ser liberada, exige selecionar e nova correção bloqueia',async()=>{
    await edit('solo','a-repos','5');await p.evaluate(()=>abrirRenovaMes());
    assert.ok(await p.evaluate(()=>rmLinha(DB.alunos[0]).ajusteManual));
    await p.locator('#rm-corpo .rm-row').filter({hasText:'Aluno Exato Teste'}).getByText('Foi só correção',{exact:false}).click();
    assert.equal(await p.evaluate(()=>rmLinha(DB.alunos[0]).bloqueio),null);
    assert.equal(await p.evaluate(()=>rmSel.solo),false);
    await p.waitForTimeout(5);await edit('solo','a-creditos','2');
    assert.ok(await p.evaluate(()=>rmLinha(DB.alunos[0]).ajusteManual));
   });
   await reset();
   await check(theme+': renovação individual com créditos iguais ao pacote é reconhecida sem movimento novo de crédito',async()=>{
    await p.evaluate(()=>{DB.alunos[0].creditos=4;renovarMes('solo');});
    assert.equal(await p.evaluate(()=>DB.alunos[0].repos),6);
    assert.ok(await p.evaluate(()=>renovacoesDoMes(DB.alunos[0]).length));
    const before=await p.evaluate(()=>JSON.stringify(DB));
    await p.evaluate(()=>{delete _ultAcao['renov-solo'];renovarMes('solo');abrirRenovaMes();rmSel.solo=true;rmSel.pai=false;rmSel.filho=false;rmAplicar();});
    assert.equal(await p.evaluate(()=>JSON.stringify(DB)),before);
   });
   await reset();
   await check(theme+': repetir lote após consumo não devolve crédito nem gera reposição',async()=>{
    await p.evaluate(()=>{abrirRenovaMes();rmSel.pai=false;rmSel.filho=false;rmAplicar();DB.alunos[0].creditos=3;DB.alunos[0].status='pago';});
    const before=await p.evaluate(()=>JSON.stringify(DB));
    await p.evaluate(()=>{abrirRenovaMes();rmSel.solo=true;rmSel.pai=false;rmSel.filho=false;rmAplicar();delete _ultAcao['renov-solo'];renovarMes('solo');});
    assert.equal(await p.evaluate(()=>JSON.stringify(DB)),before);
   });
   await reset();
   await check(theme+': prévia antiga não permite renovar aluno marcado manualmente depois',async()=>{
    assert.equal(await p.evaluate(()=>{
     const x=rmLinha(DB.alunos[0]);rmConfirmarManual('solo');
     const before=JSON.stringify(DB),result=rmAplicarUm(x);
     return !result.ok&&JSON.stringify(DB)===before;
    }),true);
   });
   await reset();
   await check(theme+': virada preserva aluno com ajuste manual ainda não conferido',async()=>{
    await edit('solo','a-creditos','4');
    const before=await p.evaluate(()=>JSON.stringify(DB.alunos[0]));
    await p.evaluate(()=>{DB.mesCreditos='2026-09';aplicarViradaMes();});
    assert.equal(await p.evaluate(()=>JSON.stringify(DB.alunos[0])),before);
   });
   await reset();
   await check(theme+': mês seguinte libera a renovação, ajustes antigos e locação não bloqueiam',async()=>{
    assert.equal(await p.evaluate(()=>{
     const a=DB.alunos[0],m=mesReal();
     a.ultimaRenovacao={mes:m,ts:Date.now(),origem:'manual'};
     DB.movs.push({alunoId:a.id,campo:'repos',motivo:'Correção manual no cadastro',ts:Date.now()});
     const original=mesReal,[ano,mes]=m.split('-').map(Number);mesReal=()=>dKey(new Date(ano,mes,1)).slice(0,7);
     const liberado=!rmLinha(a).bloqueio;mesReal=original;
     delete a.ultimaRenovacao;DB.movs=[];
     DB.movs.push({alunoId:a.id,campo:'locCred',motivo:'Correção manual no cadastro',ts:Date.now()});
     return liberado&&!rmLinha(a).bloqueio;
    }),true);
   });
   await reset();
   await check(theme+': marcação manual também funciona sem movimento; inativos e torneio ficam fora',async()=>{
    assert.equal(await p.evaluate(()=>{
     DB.alunos[1].arquivado=true;DB.alunos[2].perfil='torneio';
     rmConfirmarManual('solo');
     return rmLinhas().length===1&&!!rmLinha(DB.alunos[0]).bloqueio;
    }),true);
   });
   await reset();await edit('solo','a-creditos','4');await p.evaluate(()=>abrirRenovaMes());
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   console.log('VISUAL_RENOVACAO '+theme+' '+(await p.screenshot({fullPage:true})).toString('base64'));
   assert.deepEqual(p.errors,[]);await c.close();
  }
  console.log('✅ '+count+' verificações de renovação sem duplicar saldos');
 }finally{await b.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

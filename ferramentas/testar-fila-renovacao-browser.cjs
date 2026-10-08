/* Correções de 08/10: (1) fila de reservas com pedido e cancelamento no mesmo
   sync; (2) "CRÉDITOS DUPLICADOS" falso em Conferir números. Dados fictícios,
   rede externa bloqueada. O update simulado recusa caminho dentro de outro
   apagado no mesmo envio, como o SDK do Firebase faz de verdade.
   Também prova que abrir as telas e conferir números não muda nenhum dado. */
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
const agora=Date.now(),mes=(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');})();
const fixture={alunos:[
 {id:'a1',nome:'Aluno Fila Teste',codigo:'9911',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,repos:1,credGrupo:0,mensalidade:640,status:'pendente',diaVenc:10,ativo:true,
  ultimaRenovacao:{mes,origem:'lote',ts:agora-3600e3,creditos:4,credGrupo:0,repos:1}},
 {id:'a2',nome:'Aluno Duas Vezes Teste',codigo:'9912',tipo:'Particular',plano:4,planoGrupo:0,creditos:8,repos:0,credGrupo:0,mensalidade:640,status:'pago',diaVenc:10,ativo:true,
  ultimaRenovacao:{mes,origem:'individual',ts:agora-1800e3,creditos:8,credGrupo:0,repos:0}},
 {id:'a3',nome:'Aluno Misto Teste',codigo:'9913',tipo:'Particular',plano:2,planoGrupo:4,creditos:2,repos:0,credGrupo:4,mensalidade:900,status:'pendente',diaVenc:10,ativo:true,
  ultimaRenovacao:{mes,origem:'lote',ts:agora-3600e3,creditos:2,credGrupo:4,repos:0}}
],movs:[
 // a1: uma renovação normal (marca no cadastro + um lançamento)
 {ts:agora-3600e3,alunoId:'a1',campo:'creditos',delta:4,de:0,para:4,motivo:'Renovação do mês',ref:''},
 // a2: renovado DUAS vezes de verdade (tem de continuar acusando)
 {ts:agora-3600e3,alunoId:'a2',campo:'creditos',delta:4,de:0,para:4,motivo:'Renovação do mês',ref:''},
 {ts:agora-1800e3,alunoId:'a2',campo:'creditos',delta:4,de:4,para:8,motivo:'Renovação do mês',ref:''},
 // a3: misto, uma renovação = um lançamento particular + um de grupo
 {ts:agora-3600e3,alunoId:'a3',campo:'creditos',delta:2,de:0,para:2,motivo:'Renovação do mês',ref:''},
 {ts:agora-3600e3,alunoId:'a3',campo:'credGrupo',delta:4,de:0,para:4,motivo:'Renovação do mês (grupo)',ref:''}
],agenda:{fixos:[],eventos:[],excecoes:[]},presencas:[],lancamentos:[],compromissos:[],meta:10000,savedAt:1,mesPagamentos:mes,mesCreditos:mes};
let count=0;
async function check(name,fn){await fn();count++;console.log('✅ '+name);}
/* Igual ao SDK: nenhuma chave pode ser ancestral de outra no mesmo update. */
function validarComoSDK(u){
 const ks=Object.keys(u);
 for(const a of ks)for(const b of ks)if(a!==b&&b.startsWith(a+'/'))throw Error('Reference.update failed: path '+a+' is an ancestor of '+b);
}

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,b=await chromium.launch({headless:true});
 try{
  const ctx=await b.newContext();
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
   if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await ctx.addInitScript(f=>{localStorage.setItem('jvtenis-gestao-v1',JSON.stringify(f));sessionStorage.setItem('jv-bk-adiar','1');},fixture);
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.goto(base+'/app-gestao/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,{},{timeout:15000});
  await p.evaluate(f=>{
   window.gravacoes=0;persist=()=>{window.gravacoes++;};guardarVersoes=()=>{};logAct=()=>{};
   DB=JSON.parse(JSON.stringify(f));ensureFields();CARREGADO=true;window._espacoAberto=true;hideVals=false;
   _abriuSemConferir=false;_semDados=false;cloudPending=false;
   document.querySelectorAll('.overlay.on').forEach(e=>e.classList.remove('on'));
   document.getElementById('splash-gestao').style.display='none';
   renderAll();
  },fixture);

  await check('renovação normal (marca + 1 lançamento) não aparece como CRÉDITOS DUPLICADOS',async()=>{
   const r=await p.evaluate(()=>achadosDoAluno(DB.alunos.find(a=>a.id==='a1')).filter(x=>/DUPLICADOS/.test(x.txt)).length);
   assert.equal(r,0);
  });
  await check('aluno misto renovado uma vez (particular + grupo) não é acusado',async()=>{
   assert.equal(await p.evaluate(()=>achadosDoAluno(DB.alunos.find(a=>a.id==='a3')).filter(x=>/DUPLICADOS/.test(x.txt)).length),0);
  });
  await check('renovação repetida de verdade continua sendo acusada (2x, 8 créditos)',async()=>{
   const t=await p.evaluate(()=>achadosDoAluno(DB.alunos.find(a=>a.id==='a2')).filter(x=>/DUPLICADOS/.test(x.txt)).map(x=>x.txt));
   assert.equal(t.length,1);assert.match(t[0],/renovado 2x/);assert.match(t[0],/somando 8/);
  });
  await check('o bloqueio de segunda renovação (marca do cadastro) continua valendo',async()=>{
   assert.equal(await p.evaluate(()=>renovacoesDoMes(DB.alunos.find(a=>a.id==='a1')).length>0),true);
  });

  /* ---- fila de reservas ---- */
  const hoje=new Date();let dt=new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()+3,12);while(dt.getDay()!==2)dt.setDate(dt.getDate()+1);
  const dk=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
  const chave='reserva_'+dk+'_1000';
  let queue={},envios=[],recusas=0;
  await p.exposeFunction('filaGet',()=>copy(queue));
  await p.exposeFunction('filaUpdate',u=>{
   try{validarComoSDK(u);}catch(e){recusas++;throw e;}
   envios.push(copy(u));
   for(const [k,v]of Object.entries(u)){
    if(k.includes('/')){const [pai,filho]=k.split('/');if(queue[pai])queue[pai][filho]=v;}
    else if(v===null)delete queue[k];else queue[k]=v;
   }
  });
  await p.evaluate(()=>{
   carregarVinculos=async()=>{};VINCULOS={'u1':{ativo:true,codigo:'9911'}};
   gravarAgora=async()=>true;doPublish=async()=>{};
   window.fbDB={ref:()=>({get:async()=>{const q=await window.filaGet();return {exists:()=>Object.keys(q).length>0,val:()=>q};},update:u=>window.filaUpdate(u)})};
  });
  const req=(id,extra={})=>({id,codigo:'9911',uid:'u1',nome:'Reserva Teste',data:dk,hora:'10:00',rec:'pontual',ts:Date.now(),...extra});

  await check('o que o app mandava antes é recusado pelo Firebase (reproduz o defeito)',async()=>{
   assert.throws(()=>validarComoSDK({[chave+'/processado']:true,[chave]:null}),/ancestor/);
  });
  await check('pedido + cancelamento no mesmo sync: fila limpa, vaga liberada, sem aula na agenda',async()=>{
   const antes=await p.evaluate(()=>JSON.stringify(DB.alunos));
   queue={[chave]:req('pedido-1'),cancela:req('cancela-1',{acao:'cancelar',ts:Date.now()+1})};
   await p.evaluate(()=>syncRequests(true));
   assert.equal(recusas,0,'o Firebase não pode recusar o envio');
   assert.deepEqual(Object.keys(queue),[],'a fila tem de ficar vazia');
   assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),0);
   assert.equal(await p.evaluate(()=>JSON.stringify(DB.alunos)),antes,'nenhum saldo ou cadastro de aluno pode mudar');
  });
  await check('próximo sync não refaz nada (sem laço de criar e apagar)',async()=>{
   envios=[];await p.evaluate(()=>syncRequests(true));
   assert.equal(envios.length,0);assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),0);
  });
  await check('pedido sozinho segue igual: aula criada e trava marcada como processada',async()=>{
   queue={[chave]:req('pedido-2')};await p.evaluate(()=>syncRequests(true));
   assert.equal(recusas,0);assert.equal(queue[chave].processado,true);
   assert.equal(await p.evaluate(()=>DB.agenda.eventos.length),1);
  });
  await check('updatesFilaSemConflito não mexe em envio sem conflito',async()=>{
   const u={a:null,'b/processado':true,c:null};
   assert.deepEqual(await p.evaluate(u=>updatesFilaSemConflito(u),u),u);
  });

  /* ---- nenhum dado muda só por abrir telas e conferir ---- */
  await check('abrir todas as abas, a ficha e Conferir números não altera nenhum dado',async()=>{
   const r=await p.evaluate(async f=>{
    DB=JSON.parse(JSON.stringify(f));ensureFields();renderAll();
    const antes=JSON.stringify(DB);window.gravacoes=0;
    for(const id of [...document.querySelectorAll('.page[id^="pg-"]')].map(x=>x.id.slice(3))){try{go(id,document.createElement('button'));}catch(e){}}
    try{abrirFicha('a1');fecharFicha();}catch(e){}
    DB.alunos.forEach(a=>achadosDoAluno(a));try{conferirNumeros();}catch(e){}
    return {igual:JSON.stringify(DB)===antes,gravacoes:window.gravacoes};
   },fixture);
   assert.equal(r.igual,true,'o banco mudou');assert.equal(r.gravacoes,0,'houve tentativa de gravar');
  });
  assert.deepEqual(errors,[]);
  console.log('\n✅ '+count+' verificações · fila e renovação');
 }catch(e){console.error('❌ '+(e&&e.message||e));process.exitCode=1;}
 finally{await b.close();server.close();}
})();

/* "Alterações pendentes" presa na Gestão (10/11, foto do João no iPhone).
   No iPhone, o app parado perde a conexão do Firebase sem aviso. A gravação
   final (transaction) não tinha prazo: com a conexão morta no meio do envio,
   ela ficava esperando e nenhuma outra tentativa começava — o aviso ficava lá
   até fechar o app. Agora a Gestão força a reconexão (goOffline → goOnline):
   - sozinha, quando um envio passa de 20 s sem resposta;
   - na hora, ao tocar "Tentar salvar agora";
   - ao voltar ao app depois de parado e quando a internet volta.
   O quadro também diz o motivo. Nuvem simulada (nenhum dado real), sem
   duplicar gravação. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.goto(base+'/app-gestao/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,null,{timeout:40000});
  await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
  /* Nuvem simulada: guarda por caminho. "travado" = conexão morta sem aviso:
     a transaction da v2 fica na fila até goOffline/goOnline. */
  const montar=()=>p.evaluate(()=>{
   const store={},fila=[];window.__nuvem={store,fila,travado:false,offline:0,online:0,gravacoesV2:0};
   const snap=(v)=>({exists:()=>v!=null,val:()=>v==null?null:JSON.parse(JSON.stringify(v))});
   const aplicar=(cam,fn,resolve)=>{const r=fn(store[cam]==null?null:JSON.parse(JSON.stringify(store[cam])));
     if(r===undefined){resolve({committed:false,snapshot:snap(store[cam])});return;}
     store[cam]=r;if(/\/v2$/.test(cam))__nuvem.gravacoesV2++;resolve({committed:true,snapshot:snap(r)});};
   __nuvem.conexao=[];__nuvem.ligar=v=>__nuvem.conexao.forEach(cb=>cb(snap(v)));
   const ref=cam=>({
    get:()=>Promise.resolve(snap(store[cam])),once:()=>Promise.resolve(snap(store[cam])),
    on:(ev,cb)=>{if(cam==='.info/connected'){__nuvem.conexao.push(cb);return cb;}setTimeout(()=>cb(snap(store[cam])),0);return cb;},off:()=>{},
    set:v=>{store[cam]=v;return Promise.resolve();},update:o=>{store[cam]=Object.assign({},store[cam],o);return Promise.resolve();},
    remove:()=>{delete store[cam];return Promise.resolve();},
    transaction:fn=>new Promise(resolve=>{if(__nuvem.travado&&/\/v2$/.test(cam))fila.push(()=>aplicar(cam,fn,resolve));else aplicar(cam,fn,resolve);})
   });
   window.fbDB={ref,goOffline(){__nuvem.offline++;},goOnline(){__nuvem.online++;__nuvem.travado=false;fila.splice(0).forEach(f=>f());}};
   window._espacoAberto=true;_conflitoNuvem=null;lastCloudError='';_nuvemMuda=false;
   _basePartes=null;_basePartesLida=true;_basePartesAssinatura='';_ultReacordar=0;
   _vigiaLigada=false;_nuvemLigada=null;_nuvemCaiuEm=0;window.__buscas=[];
   syncPedidos=async()=>__buscas.push('pedidos');carregarVinculos=async()=>__buscas.push('vinculos');syncRequests=async()=>__buscas.push('pedidosAntigos');
   carregarNotifs=async()=>__buscas.push('notifs');carregarConfirmacoes=async()=>__buscas.push('confirmacoes');carregarCadastros=async()=>__buscas.push('cadastros');
   carregarAutoAval=async()=>__buscas.push('autoaval');lerMapaQuadra=async()=>__buscas.push('mapa');lerAgendaProf=async()=>__buscas.push('agendaProf');
   publish=()=>{};publicarMapaQuadra=()=>{};publicarAgendaProf=()=>{};finalizarAvisosPagos=()=>{};
   backupNuvem=async()=>{};backupDoDia=async()=>{};subirBlobDeReserva=async()=>{};
   DB.alunos=[{id:'n1',nome:'Aluno Fictício',codigo:'8801',tipo:'Particular',plano:4,creditos:4,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true}];
   DB.savedAt=Date.now();cloudPending=true;go('seg',document.createElement('button'));renderProtecaoDados();
  });
  const estado=()=>p.evaluate(()=>({pend:cloudPending,curso:!!_salvamentoEmCurso,off:__nuvem.offline,on:__nuvem.online,
   v2:__nuvem.gravacoesV2,fila:__nuvem.fila.length,texto:(document.getElementById('pd-detalhes')||{}).textContent||''}));

  await check('envio preso (conexão morta no meio): o quadro diz o motivo e a Gestão reconecta sozinha em 20 s, sem duplicar',async()=>{
   await montar();
   await p.evaluate(()=>{__nuvem.travado=true;window.__envio=gravarAgora();});
   await p.waitForTimeout(7500);
   let e=await estado();
   assert.equal(e.pend,true);assert.equal(e.curso,true);assert.equal(e.fila,1,'a gravação ficou esperando');
   assert.match(e.texto,/salvas só neste aparelho/);assert.match(e.texto,/a conexão caiu no meio/);assert.match(e.texto,/Última tentativa/);
   await p.waitForFunction(()=>!_salvamentoEmCurso,null,{timeout:20000});
   e=await estado();
   assert.ok(e.off>=1&&e.on>=1,'forçou a reconexão');assert.equal(e.pend,false,'salvou na nuvem');assert.equal(e.v2,1,'uma gravação só');
   assert.equal(await p.evaluate(()=>__envio),true);
   assert.doesNotMatch(e.texto,/salvas só neste aparelho/);
  });
  await check('"Tentar salvar agora" com envio preso reconecta na hora',async()=>{
   await montar();
   await p.evaluate(()=>{__nuvem.travado=true;window.__envio=gravarAgora();});
   await p.waitForTimeout(500);
   assert.equal((await estado()).fila,1);
   const t0=Date.now();await p.evaluate(()=>tentarSalvarProtegido());
   await p.waitForFunction(()=>!_salvamentoEmCurso&&!cloudPending,null,{timeout:5000});
   assert.ok(Date.now()-t0<5000,'não esperou os 20 s');assert.equal((await estado()).v2,1);
  });
  await check('voltar ao app depois de parado reconecta e tenta de novo; volta rápida sem pendência não mexe',async()=>{
   await montar();
   await p.evaluate(()=>{__nuvem.travado=true;window.__envio=gravarAgora();});
   await p.waitForTimeout(300);
   await p.evaluate(()=>{_escondidoDesde=Date.now()-60000;Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
   await p.waitForFunction(()=>!_salvamentoEmCurso&&!cloudPending,null,{timeout:6000});
   assert.equal((await estado()).v2,1);
   await montar();await p.evaluate(()=>{cloudPending=false;_escondidoDesde=Date.now()-5000;document.dispatchEvent(new Event('visibilitychange'));});
   assert.equal((await estado()).off,0,'5 s fora e nada pendente: não reconecta à toa');
  });
  await check('internet que volta (online) reconecta e envia',async()=>{
   await montar();
   await p.evaluate(()=>{__nuvem.travado=true;window.__envio=gravarAgora();});
   await p.waitForTimeout(300);
   await p.evaluate(()=>window.dispatchEvent(new Event('online')));
   await p.waitForFunction(()=>!_salvamentoEmCurso&&!cloudPending,null,{timeout:6000});
   assert.equal((await estado()).v2,1);
  });
  await check('o app todo: conexão cai com o app aberto → em até ~30 s reconecta e o selo mostra "↻ Nuvem"',async()=>{
   await montar();
   await p.evaluate(()=>{cloudPending=false;setSave('✓ salvo na nuvem','ok');vigiarConexaoNuvem();__nuvem.ligar(true);__nuvem.ligar(false);_nuvemCaiuEm=Date.now()-25000;});
   await p.waitForFunction(()=>__nuvem.offline>=1,null,{timeout:12000});
   assert.equal(await p.locator('#save-state').textContent(),'↻ Nuvem');
  });
  await check('o app todo: a conexão volta depois de 15 s fora → busca pedidos, vínculos, agenda… na hora e o selo volta a "✓ Nuvem"',async()=>{
   await montar();
   await p.evaluate(()=>{cloudPending=false;vigiarConexaoNuvem();__nuvem.ligar(true);__nuvem.ligar(false);_nuvemCaiuEm=Date.now()-20000;__buscas=[];__nuvem.ligar(true);});
   const b=await p.evaluate(()=>__buscas.slice().sort());
   assert.deepEqual(b,['agendaProf','autoaval','cadastros','confirmacoes','mapa','notifs','pedidos','pedidosAntigos','vinculos']);
   assert.equal(await p.locator('#save-state').textContent(),'✓ Nuvem');
   await p.evaluate(()=>{__buscas=[];__nuvem.ligar(false);__nuvem.ligar(true);});   // piscada curta: não busca tudo de novo
   assert.deepEqual(await p.evaluate(()=>__buscas),[]);
  });
  await check('o app todo: voltar ao app depois de parado busca o que chegou enquanto isso',async()=>{
   await montar();
   await p.evaluate(()=>{cloudPending=false;__buscas=[];_escondidoDesde=Date.now()-120000;document.dispatchEvent(new Event('visibilitychange'));});
   await p.waitForFunction(()=>__buscas.includes('pedidos'),null,{timeout:5000});
   assert.ok((await estado()).off>=1,'reconectou');
  });
  await check('motivo em palavras simples: sem resposta, recusa (login) e sem Firebase',async()=>{
   await montar();
   const m=await p.evaluate(()=>{const out={};
    lastCloudError='sem resposta da nuvem';out.sem=motivoPendente();
    lastCloudError='PERMISSION_DENIED: permission_denied';out.recusa=motivoPendente();
    lastCloudError='';const f=window.fbDB;window.fbDB=null;out.semFb=motivoPendente();window.fbDB=f;
    out.nada=motivoPendente();return out;});
   assert.match(m.sem,/não respondeu.*30 s/);assert.match(m.recusa,/login precisa ser renovado/);assert.match(m.recusa,/continuam guardadas/);
   assert.match(m.semFb,/feche e abra o app/);assert.match(m.nada,/Aguarde/);
  });
  assert.deepEqual(erros,[],'sem erro na página: '+erros.join(' | '));
  console.log('\n'+count+' verificações da reconexão com a nuvem passaram.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error('❌',e.message||e);process.exit(1);});

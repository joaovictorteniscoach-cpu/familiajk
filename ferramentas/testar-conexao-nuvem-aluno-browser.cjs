/* App do aluno: "Não consegui conferir sua agenda na nuvem" (print do João,
   04/11). Antes de confirmar presença, cancelar ou agendar, o app confere a
   agenda na nuvem e exigia ".info/connected" = true numa leitura só. Essa
   leitura é local: enquanto o Firebase ainda está conectando (app recém-aberto
   ou voltando do segundo plano no iPhone) ela diz "false" na hora, mesmo com
   internet, e o aluno recebia o aviso. Agora o app espera a conexão (até 10 s).
   Aparelho ainda não liberado pelo João recebe um aviso próprio, e o aviso do
   rodapé quebra a linha em vez de cortar o fim.
   Usa o SDK Firebase de verdade (app-aluno/lib) com um servidor falso no lugar
   do banco: nada sai daqui, nenhum dado real. Só dados fictícios, relógio real. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
const UID='u-teste-conexao',COD='6601';
const hoje=new Date(),amanha=new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()+1,12);
const dKey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const DK=dKey(amanha),HORA='18:00';
const aluno={codigo:COD,nome:'Aluno Fictício',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true};
const publico={grade:{fixos:[],eventos:[],excecoes:[]},horarioCfg:{},horarioData:{},horas:[HORA]};
const privado={aluno,gradeMeu:{fixos:[],eventos:[{id:'e1',data:DK,hora:HORA,tipo:'aula'}],excecoes:[]}};

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  // Nada sai daqui: só os arquivos do app; o login anônimo fica de fora (o uid é fictício).
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
   if(u.pathname.endsWith('/lib/firebase-auth-compat.js')||u.pathname.endsWith('/lib/firebase-app-check-compat.js'))return r.fulfill({body:'',contentType:'text/javascript'});
   return r.continue();});
  await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));

  /* Servidor falso do Realtime Database (protocolo v5 do SDK). `atrasoOla` é
     quanto ele demora para aceitar a conexão; `null` = nunca (sem internet). */
  const banco={};const srv={atrasoOla:300,gravados:[],socket:null,conexoes:0};
  const valor=p=>{const v=banco[p.replace(/^\/+/,'')];return v===undefined?null:v;};
  await c.routeWebSocket(/firebaseio\.com/,ws=>{
   srv.socket=ws;srv.conexoes++;
   ws.onMessage(m=>{let o;try{o=JSON.parse(String(m));}catch(e){return;}
    if(o.t!=='d'||!o.d||!o.d.r)return;const {r,a,b}=o.d;
    if(a==='g')return ws.send(JSON.stringify({t:'d',d:{r,b:{s:'ok',d:valor(b.p)}}}));
    if(a==='q'){ws.send(JSON.stringify({t:'d',d:{a:'d',b:{p:b.p,d:valor(b.p)}}}));return ws.send(JSON.stringify({t:'d',d:{r,b:{s:'ok',d:{}}}}));}
    if(a==='p'||a==='m')srv.gravados.push({cam:b.p,dado:b.d});
    ws.send(JSON.stringify({t:'d',d:{r,b:{s:'ok',d:''}}}));
   });
   if(srv.atrasoOla!==null)setTimeout(()=>{try{ws.send(JSON.stringify({t:'c',d:{t:'h',d:{ts:Date.now(),v:'5',h:'academia-jv-tenis-default-rtdb.firebaseio.com',s:'sessao-teste'}}}));}catch(e){}},srv.atrasoOla);
  });

  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.accept());
  await p.goto(base+'/app-aluno/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof atualizarGradeReserva==='function'&&window.fbDB,null,{timeout:20000});
  await p.addStyleTag({content:'#feriado-box,#login,#barra-app,#barra-versao{display:none!important}'});
  // Banco falso com dados fictícios; aparelho já aprovado.
  Object.assign(banco,{'jvtenis/jvtenis-app-publico':JSON.stringify(publico),['jvtenis/alunos_privados/'+UID]:JSON.stringify(privado),
   ['jvtenis/aluno_vinculos/'+UID]:{ativo:true,codigo:COD}});
  await p.evaluate(({aluno,publico,privado,COD,UID})=>{
   window.AUTH_USER={uid:UID};init=async()=>{};notificarJoao=()=>{};notificarLocal=()=>{};abrirWhatsApp=()=>{};
   EU=JSON.parse(JSON.stringify(aluno));MEU={codigo:COD,pedidos:[],cancelados:[],confirmadas:[]};VINCULO_ESTADO='ativo';
   PUB=Object.assign({},publico,{alunos:[EU],historico:{},grade:juntarGradeSegura(publico.grade,privado.gradeMeu,COD)});
   window.__toasts=[];const t0=toast;toast=function(x){__toasts.push(x);return t0(x);};
   document.getElementById('app').style.display='block';document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
   render();
  },{aluno,publico,privado,COD,UID});
  /* Derruba a conexão como o iPhone faz no segundo plano. O SDK só volta pela
     conexão direta (websocket) se a anterior durou uns 30 s; senão volta por
     HTTP comum, que este servidor falso não atende. Aqui a anterior conta como
     duradoura, igual a de quem está com o app aberto. */
  const derrubar=async atraso=>{srv.atrasoOla=atraso;await p.evaluate(()=>localStorage.removeItem('firebase:previous_websocket_failure'));const w=srv.socket;if(w)await w.close();};
  const esperarConectado=async()=>{for(let i=0;i<150;i++){if(await p.evaluate(()=>new Promise(r=>fbDB.ref('.info/connected').once('value',s=>r(s.val()===true)))))return;await p.waitForTimeout(100);}throw new Error('o app não reconectou ao servidor falso');};
  await esperarConectado();
  const ultimoAviso=()=>p.evaluate(()=>__toasts[__toasts.length-1]||'');
  const confirmar=()=>p.evaluate(({DK,HORA})=>{__toasts=[];return confirmarPresencaAluno(DK,HORA);},{DK,HORA});

  await check('o Firebase diz "desconectado" na hora enquanto ainda conecta (a causa do aviso)',async()=>{
   await derrubar(1500);
   const v=await p.evaluate(()=>new Promise(r=>fbDB.ref('.info/connected').once('value',s=>r(s.val()))));
   assert.equal(v,false,'logo depois de cair, a leitura local é "false" mesmo com o servidor no ar');
  });
  await check('voltando do segundo plano (conexão leva 1,5 s): confirmar presença espera e funciona',async()=>{
   await esperarConectado();
   await derrubar(1500);srv.gravados=[];
   const t=Date.now(),ok=await confirmar(),ms=Date.now()-t;
   assert.equal(ok,true,'confirmou (aviso: '+(await ultimoAviso())+')');
   assert.match(await ultimoAviso(),/Presença confirmada/);
   assert.ok(srv.gravados.some(g=>/\/fila_confirmacoes\//.test(g.cam)&&g.dado&&g.dado.codigo===COD&&g.dado.data===DK&&g.dado.hora===HORA),'pedido chegou na fila de confirmações');
   assert.ok(ms>=1000&&ms<9000,'esperou a conexão em vez de desistir ('+ms+' ms)');
  });
  await check('cancelar logo depois da conexão cair também espera e envia',async()=>{
   await p.evaluate(()=>{window.__dk=null;confirm=()=>true;});
   const dk2=dKey(new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()+3,12));
   privado.gradeMeu.eventos.push({id:'e2',data:dk2,hora:HORA,tipo:'aula'});banco['jvtenis/alunos_privados/'+UID]=JSON.stringify(privado);
   await p.evaluate(({privado,publico,COD})=>{PUB.grade=juntarGradeSegura(publico.grade,privado.gradeMeu,COD);},{privado,publico,COD});
   await esperarConectado();
   await derrubar(1200);srv.gravados=[];
   const ok=await p.evaluate(({dk2,HORA})=>{__toasts=[];return cancelarAula(dk2,HORA,'pontual');},{dk2,HORA});
   assert.equal(ok,true,'cancelou (aviso: '+(await ultimoAviso())+')');
   assert.ok(srv.gravados.some(g=>/\/fila_agendamentos\//.test(g.cam)&&g.dado&&g.dado.acao==='cancelar'&&g.dado.data===dk2),'pedido de cancelamento chegou na fila');
  });
  await check('aparelho ainda não liberado: aviso diz isso (não "sem internet") e nada é enviado',async()=>{
   await esperarConectado();
   const guardado=banco['jvtenis/alunos_privados/'+UID];delete banco['jvtenis/alunos_privados/'+UID];
   await p.evaluate(()=>{VINCULO_ESTADO='pendente';MEU.confirmadas=[];});srv.gravados=[];
   const ok=await confirmar();
   assert.equal(ok,false);assert.match(await ultimoAviso(),/não foi liberado pelo João/);
   assert.ok(!srv.gravados.some(g=>/fila_confirmacoes/.test(g.cam)),'nada foi para a fila');
   banco['jvtenis/alunos_privados/'+UID]=guardado;await p.evaluate(()=>{VINCULO_ESTADO='ativo';});
  });
  await check('sem internet de verdade: desiste depois de esperar e avisa para tentar com internet',async()=>{
   await derrubar(null);srv.gravados=[];
   const t=Date.now(),ok=await confirmar(),ms=Date.now()-t;
   assert.equal(ok,false);assert.match(await ultimoAviso(),/Tente novamente com internet/);
   assert.ok(ms>=9000&&ms<16000,'esperou ~10 s antes de desistir ('+ms+' ms)');
   assert.ok(!srv.gravados.some(g=>/fila_confirmacoes/.test(g.cam)),'nada foi para a fila');
  });
  await check('o aviso do rodapé mostra o texto inteiro (quebra a linha) e fica mais tempo se for longo',async()=>{
   const r=await p.evaluate(()=>{const e=document.getElementById('toast');
    toast('Não consegui conferir sua agenda na nuvem. Tente novamente com internet.');
    const b=e.getBoundingClientRect(),cs=getComputedStyle(e);
    return {cortado:e.scrollWidth>e.clientWidth+1||cs.textOverflow==='ellipsis'&&cs.whiteSpace==='nowrap',alt:b.height,larg:b.width,esq:b.left,dir:innerWidth-b.right};});
   assert.equal(r.cortado,false,'texto não é cortado');assert.ok(r.alt>45,'quebrou em mais de uma linha ('+r.alt+' px)');
   assert.ok(r.esq>=8&&r.dir>=8,'cabe na tela com margem');
   if(process.env.JV_SHOTS)await p.screenshot({path:path.join(process.env.JV_SHOTS,'aviso-rodape.png')});
   // texto bem longo: ~5,8 s na tela (o curto some em 2,6 s); folga para computador lento
   await p.evaluate(()=>toast('🔐 Este aparelho ainda não foi liberado pelo João. Peça a ele para aprovar este aparelho e depois tente de novo, por favor.'));
   await p.waitForTimeout(3200);
   assert.equal(await p.evaluate(()=>document.getElementById('toast').classList.contains('show')),true,'texto longo continua na tela depois de 3 s');
   await p.waitForTimeout(3500);
   assert.equal(await p.evaluate(()=>document.getElementById('toast').classList.contains('show')),false,'e some sozinho depois');
   await p.evaluate(()=>toast('Atualizado ✓'));await p.waitForTimeout(2900);
   assert.equal(await p.evaluate(()=>document.getElementById('toast').classList.contains('show')),false,'aviso curto some no tempo de sempre');
  });
  assert.deepEqual(erros,[],'erros na página');
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · app do aluno espera a conexão com a nuvem antes de desistir');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

/* Avisos com o app fechado (servidor grátis na Cloudflare). Só dados fictícios,
   nuvem e push simulados, relógio fixo (quinta 15/10/2026, 10h).
   Gestão: prepara os avisos dos próximos 3 dias (aula 19h da véspera, sem aula
   em chuva/bloqueio, locação e torneio passam pelo bloqueio, responsável da
   família recebe a do dependente), vencimento de quem está pendente, vaga
   liberada da lista de espera; só grava com o servidor vivo e o banco
   confirmado, e só quando muda. Nada de valor ou desconto nos textos.
   Aluno e Gestão: "Ativar avisos" inscreve o aparelho com a chave pública do
   servidor e guarda o endereço só no próprio uid; sem servidor nada muda. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-15T10:00:00-03:00');
const CHAVE='B'+'A'.repeat(86);   // formato de chave pública P-256 (87 caracteres base64url)
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
async function contexto(browser,base){
 const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
 await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
 return c;
}
/* Push do navegador simulado: guarda a chave usada e devolve um endereço. */
const PUSH_FALSO=`(()=>{
 window.__subs=[];window.__desinscritos=0;window.__mostradas=[];
 const reg={showNotification:async(t,o)=>{__mostradas.push(t);},pushManager:{
  getSubscription:async()=>window.__subAtual||null,
  subscribe:async op=>{const k=new Uint8Array(op.applicationServerKey);window.__subs.push({visivel:op.userVisibleOnly,chave:Array.from(k)});
   const sub={options:{applicationServerKey:k.buffer},unsubscribe:async()=>{window.__desinscritos++;window.__subAtual=null;return true;},
    toJSON:()=>({endpoint:'https://fcm.googleapis.com/fcm/send/aparelho-teste',keys:{p256dh:'BPchave-do-aparelho',auth:'segredo16'}})};
   window.__subAtual=sub;return sub;}}};
 Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{ready:Promise.resolve(reg),register:async()=>reg}});
 Object.defineProperty(Notification,'permission',{configurable:true,get:()=>window.__perm||'granted'});
 Notification.requestPermission=async()=>window.__perm||'granted';
})()`;

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  /* ================= Gestão ================= */
  const cg=await contexto(browser,base),g=await cg.newPage(),errosG=[];g.on('pageerror',e=>errosG.push(e.message));g.on('dialog',d=>d.accept());
  await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
  await g.evaluate(PUSH_FALSO);
  await g.evaluate(()=>{
   const al=(id,nome,codigo,x)=>Object.assign({id,nome,codigo,tipo:'Particular',ativo:true,plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:0,mensalidade:640,status:'pago',diaVenc:10},x||{});
   DB.alunos=[al('ana','Ana Teste','6601'),al('bia','Bia Teste','6602'),al('caio','Caio Teste','6603',{plano:0,mensalidade:0}),
    al('dani','Dani Teste','6604'),al('eva','Eva Teste','6605'),al('gabi','Gabi Teste','6607'),
    al('filho','Filho Teste','6608',{responsavelId:'ana',status:'pendente',diaVenc:18}),
    al('mia','Mia Teste','6609',{status:'pendente',diaVenc:18}),al('nil','Nil Teste','6610',{status:'pendente',diaVenc:10}),
    al('zero','Zero Teste','6611',{status:'pendente',diaVenc:18,mensalidade:0,plano:4}),al('arq','Arq Teste','6612',{status:'pendente',diaVenc:18,arquivado:true}),
    al('rui','Rui Teste','6613')];
   const ev=(id,data,hora,tipo,alunoId,x)=>Object.assign({id,data,hora,tipo,alunoId,titulo:alunoId||id},x||{});
   DB.agenda={fixos:[{id:'fx1',dia:5,hora:'17:00',tipo:'aula',alunoId:'gabi',titulo:'Gabi Teste'},{id:'fx2',dia:6,hora:'10:00',tipo:'aula',alunoId:'gabi',titulo:'Gabi Teste'}],
    eventos:[ev('h1','2026-10-15','15:00','aula','ana'),ev('a1','2026-10-16','18:00','aula','ana'),ev('b1','2026-10-16','07:00','grupo','bia'),
     ev('blq','2026-10-16','12:00','bloqueio',null,{titulo:'Almoço'}),ev('c1','2026-10-16','12:00','locacao','caio'),ev('d1','2026-10-16','12:00','aula','dani'),
     ev('chv','2026-10-17','09:00','bloqueio',null,{titulo:'Chuva',motivo:'chuva'}),ev('e1','2026-10-17','09:00','aula','eva'),
     ev('f1','2026-10-17','11:00','aula','filho'),ev('r1','2026-10-19','09:00','aula','rui'),ev('t1','2026-10-18','08:00','torneio','rui')],
    excecoes:[{fixoId:'fx1',data:'2026-10-16'}]};
   DB.espera=[{id:'w1',alunoId:'rui',data:'2026-10-16',hora:'16:00',ts:1}];
   DB.presencas=[];DB.movs=[];DB.lancamentos=[];ensureFields();MODO='dono';window._espacoAberto=true;
   persist=()=>{};publicarMapaQuadra=()=>{};doPublish=async()=>{};window.__t=[];toast=m=>__t.push(m);
   window.__grav=[];window.__estado=null;
   window.fbDB={ref:cam=>({get:async()=>({exists:()=>cam==='jvtenis/avisos_estado'&&!!window.__estado,val:()=>window.__estado}),
    set:async v=>{__grav.push({cam,v:JSON.parse(JSON.stringify(v))});}})};
   window.firebase={auth:()=>({currentUser:{uid:'uid-do-joao'}})};
   _abriuSemConferir=false;_conflitoNuvem=null;cloudPending=false;
   document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));renderAll();
  });
  const avisos=()=>g.evaluate(()=>montarAvisos(Date.now()));
  await check('Gestão: aula amanhã às 19h da véspera; chuva tira tudo, bloqueio tira só aula; locação passa; exceção do fixo respeitada',async()=>{
   const it=await avisos(),ids=Object.keys(it).filter(k=>k.startsWith('a_')).sort();
   assert.deepEqual(ids,['a_6601_2026-10-16_1800','a_6601_6608_2026-10-17_1100','a_6602_2026-10-16_0700','a_6603_2026-10-16_1200','a_6607_2026-10-17_1000','a_6608_2026-10-17_1100','a_6613_2026-10-18_0800'].sort());
   const a=it['a_6601_2026-10-16_1800'];
   assert.equal(a.t,'🎾 Aula amanhã às 18:00');assert.match(a.c,/cancele pelo app até 4 horas antes/);
   assert.equal(a.quando,new Date('2026-10-15T19:00:00-03:00').getTime());
   assert.equal(a.ate,new Date('2026-10-16T00:00:00-03:00').getTime(),'"amanhã" só vale até a meia-noite');
   assert.deepEqual([a.cod,a.alvo,a.data,a.hora,a.tipo],['6601','6601','2026-10-16','18:00','aula']);
   assert.equal(it['a_6602_2026-10-16_0700'].t,'🎾 Aula em grupo amanhã às 07:00');
   assert.equal(it['a_6603_2026-10-16_1200'].t,'🔑 Locação da quadra amanhã às 12:00','almoço não impede locação');
   assert.equal(it['a_6613_2026-10-18_0800'].t,'🏆 Jogo do torneio amanhã às 08:00');
   assert.equal(it['a_6613_2026-10-18_0800'].quando,new Date('2026-10-17T19:00:00-03:00').getTime());
  });
  await check('Gestão: o responsável da família recebe a aula do dependente, com o nome dele',async()=>{
   const it=await avisos(),r=it['a_6601_6608_2026-10-17_1100'];
   assert.equal(r.cod,'6601');assert.equal(r.alvo,'6608','cancelamento do dependente também cancela este aviso');
   assert.equal(r.t,'🎾 Aula de Filho amanhã às 11:00');
  });
  await check('Gestão: vencimento só de quem está pendente, 3 dias antes e no dia (9h), sem valor e sem desconto',async()=>{
   const it=await avisos(),ids=Object.keys(it).filter(k=>k.startsWith('v_')).sort();
   assert.deepEqual(ids,['v_6609_2026-10_0','v_6609_2026-10_3'],'pago, vencido, dependente, mensalidade zero e arquivado ficam fora');
   assert.equal(it['v_6609_2026-10_3'].t,'Sua mensalidade do tênis vence em 3 dias (dia 18)');
   assert.equal(it['v_6609_2026-10_3'].quando,new Date('2026-10-15T09:00:00-03:00').getTime());
   assert.equal(it['v_6609_2026-10_0'].quando,new Date('2026-10-18T09:00:00-03:00').getTime());
   assert.equal(it['v_6609_2026-10_0'].ate,new Date('2026-10-18T23:59:00-03:00').getTime());
   const tudo=JSON.stringify(it);
   assert.doesNotMatch(tudo,/R\$|640|desconto/i);
  });
  await check('Gestão: vaga liberada da lista de espera vira aviso imediato; vaga ocupada não',async()=>{
   let it=await avisos();
   const e=it['e_6613_2026-10-16_1600'];
   assert.ok(e,'aviso da vaga');assert.equal(e.quando,0);assert.equal(e.t,'🔔 Vaga liberada: 16/10 às 16:00');
   await g.evaluate(()=>{DB.agenda.eventos.push({id:'oc',data:'2026-10-16',hora:'16:00',tipo:'aula',alunoId:'ana',titulo:'Ana Teste'});});
   it=await avisos();assert.equal(it['e_6613_2026-10-16_1600'],undefined);
   await g.evaluate(()=>{DB.agenda.eventos=DB.agenda.eventos.filter(x=>x.id!=='oc');});
  });
  await check('Gestão: de noite a vaga liberada espera as 7h',async()=>{
   const q=await g.evaluate(()=>{const x=montarAvisos(new Date('2026-10-15T23:00:00-03:00').getTime());return x['e_6613_2026-10-16_1600'].quando;});
   assert.equal(q,new Date('2026-10-16T07:00:00-03:00').getTime());
  });
  await check('Gestão: sem servidor vivo, nada é gravado; com servidor, grava uma vez e de novo só quando muda',async()=>{
   assert.equal(await g.evaluate(()=>gravarAvisos()),false);
   await g.evaluate(()=>{window.__estado={ts:Date.now()-2*86400000,chave:'x'};});await g.evaluate(()=>lerEstadoAvisos());
   assert.equal(await g.evaluate(()=>gravarAvisos()),false,'servidor parado há 2 dias');
   assert.equal(await g.evaluate(()=>__grav.length),0);
   await g.evaluate(c=>{window.__estado={ts:Date.now()-120000,chave:c};},CHAVE);await g.evaluate(()=>lerEstadoAvisos());
   await g.evaluate(()=>{_abriuSemConferir=true;});
   assert.equal(await g.evaluate(()=>gravarAvisos()),false,'banco não confirmado: não grava');
   await g.evaluate(()=>{_abriuSemConferir=false;});
   assert.equal(await g.evaluate(()=>gravarAvisos()),true);
   assert.equal(await g.evaluate(()=>gravarAvisos()),true);
   let gr=await g.evaluate(()=>__grav);
   assert.equal(gr.length,1,'sem mudança, não grava de novo');assert.equal(gr[0].cam,'jvtenis/avisos_saida');
   assert.ok(gr[0].v['a_6601_2026-10-16_1800']);
   assert.ok(Object.values(gr[0].v).every(x=>typeof x.quando==='number'&&typeof x.t==='string'),'todo aviso tem hora (o servidor consulta por ela)');
   await g.evaluate(()=>{DB.agenda.eventos=DB.agenda.eventos.filter(x=>x.id!=='a1');});
   await g.evaluate(()=>gravarAvisos());gr=await g.evaluate(()=>__grav);
   assert.equal(gr.length,2);assert.equal(gr[1].v['a_6601_2026-10-16_1800'],undefined,'aula removida: aviso some');
  });
  await check('Gestão: "Ativar avisos" inscreve o aparelho com a chave do servidor e guarda só em avisos_tokens/<uid>/gestao',async()=>{
   await g.evaluate(()=>{__grav.length=0;localStorage.removeItem('jv-avisos-nuvem-gestao');});
   await g.evaluate(()=>ativarAvisos('jv-icone-gestao.png'));
   const r=await g.evaluate(()=>({grav:__grav,subs:__subs,t:__t.slice(-1)[0],btn:document.getElementById('btn-avisos').textContent,st:document.getElementById('avisos-nuvem-st').textContent,teste:document.getElementById('btn-aviso-teste').style.display}));
   assert.equal(r.grav.length,1);assert.equal(r.grav[0].cam,'jvtenis/avisos_tokens/uid-do-joao/gestao');
   assert.deepEqual(Object.keys(r.grav[0].v).sort(),['a','e','p','ts']);
   assert.equal(r.grav[0].v.e,'https://fcm.googleapis.com/fcm/send/aparelho-teste');
   assert.equal(r.subs.length,1);assert.equal(r.subs[0].visivel,true);
   assert.equal(Buffer.from(r.subs[0].chave).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),CHAVE,'inscrito com a chave pública do servidor');
   assert.match(r.t,/também com o app fechado/);assert.match(r.btn,/também com o app fechado/);
   assert.match(r.st,/servidor ligado \(última rodada há 2 min\)/);assert.equal(r.teste,'','botão de teste aparece');
  });
  await check('Gestão: chave do servidor trocada → desinscreve e inscreve de novo; teste vai só para o João',async()=>{
   await g.evaluate(()=>{window.__estado.chave='C'+'Q'.repeat(86);__grav.length=0;});await g.evaluate(()=>lerEstadoAvisos());
   assert.equal(await g.evaluate(()=>registrarAvisosNuvem()),'ok');
   assert.equal(await g.evaluate(()=>__desinscritos),1);
   await g.evaluate(()=>{__grav.length=0;});
   await g.evaluate(()=>testarAvisoCelular());
   const gr=await g.evaluate(()=>__grav);
   const teste=Object.entries(gr[0].v).find(([k])=>k.startsWith('t_'));
   assert.ok(teste,'aviso de teste na fila');assert.equal(teste[1].para,'joao');assert.equal(teste[1].quando,0);
   assert.match(await g.evaluate(()=>__t.slice(-1)[0]),/chega em até 2 minutos/);
  });
  await check('Gestão: sem servidor, "Ativar avisos" segue como antes (só com o app aberto)',async()=>{
   await g.evaluate(()=>{window.__estado=null;AVISOS_NUVEM=null;__grav.length=0;localStorage.removeItem('jv-avisos-nuvem-gestao');});
   assert.equal(await g.evaluate(()=>registrarAvisosNuvem()),'sem-servidor');
   assert.equal(await g.evaluate(()=>__grav.length),0);
   await g.evaluate(()=>pintarAvisos());
   assert.match(await g.locator('#avisos-nuvem-st').textContent(),/ainda não ligado/);
   assert.equal(await g.evaluate(()=>document.getElementById('btn-aviso-teste').style.display),'none');
  });
  assert.deepEqual(errosG,[]);await cg.close();

  /* ================= Aluno ================= */
  const ca=await contexto(browser,base),p=await ca.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.accept());
  await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof registrarAvisosNuvem==='function');
  await p.addStyleTag({content:'#toast,#feriado-box,#login{display:none!important}'});
  await p.evaluate(PUSH_FALSO);
  await p.evaluate(()=>{
   init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-aluno';
   EU={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:4,creditos:3,mensalidade:640,status:'pago',ativo:true};
   PUB={grade:{fixos:[],eventos:[],excecoes:[]},historico:{},horas:['09:00'],alunos:[EU]};MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[]};
   window.__grav=[];window.__estado=null;window.__t=[];toast=m=>__t.push(m);
   window.fbDB={ref:cam=>({get:async()=>({exists:()=>cam==='jvtenis/avisos_estado'&&!!window.__estado,val:()=>window.__estado}),
    set:async v=>{__grav.push({cam,v:JSON.parse(JSON.stringify(v))});},push:async()=>{}})};
   hasCloud=()=>true;VINCULO_ESTADO='ativo';localStorage.removeItem('jv-avisos-nuvem-aluno');
  });
  await check('Aluno: sem servidor, "Ativar avisos" funciona como antes e nada é gravado',async()=>{
   await p.evaluate(()=>ativarAvisos('jv-icone-aluno.png'));
   assert.equal(await p.evaluate(()=>__grav.length),0);
   assert.match(await p.evaluate(()=>__t.slice(-1)[0]),/Aviso de teste enviado/);
   assert.equal(await p.locator('#btn-avisos').textContent(),'🔔 Avisos ligados · testar');
  });
  await check('Aluno: servidor parado, chave estranha ou aparelho não aprovado → não inscreve',async()=>{
   await p.evaluate(c=>{window.__estado={ts:Date.now()-3*86400000,chave:c};},CHAVE);
   assert.equal(await p.evaluate(()=>registrarAvisosNuvem()),'sem-servidor');
   await p.evaluate(()=>{window.__estado={ts:Date.now(),chave:'<img src=x>'};});
   assert.equal(await p.evaluate(()=>registrarAvisosNuvem()),'sem-servidor');
   await p.evaluate(c=>{window.__estado={ts:Date.now(),chave:c};VINCULO_ESTADO='pendente';},CHAVE);
   assert.equal(await p.evaluate(()=>registrarAvisosNuvem()),'sem-acesso');
   assert.equal(await p.evaluate(()=>__grav.length+__subs.length),0);
   await p.evaluate(()=>{VINCULO_ESTADO='ativo';});
  });
  await check('Aluno: com servidor, inscreve com a chave pública e guarda só em avisos_tokens/<uid>/aluno',async()=>{
   await p.evaluate(()=>ativarAvisos('jv-icone-aluno.png'));
   const r=await p.evaluate(()=>({grav:__grav,subs:__subs,t:__t.slice(-1)[0]}));
   assert.equal(r.grav.length,1);assert.equal(r.grav[0].cam,'jvtenis/avisos_tokens/u-aluno/aluno');
   assert.deepEqual(r.grav[0].v,{e:'https://fcm.googleapis.com/fcm/send/aparelho-teste',p:'BPchave-do-aparelho',a:'segredo16',ts:AGORA.getTime()});
   assert.equal(Buffer.from(r.subs[0].chave).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),CHAVE);
   assert.match(r.t,/também com o app fechado/);
   assert.equal(await p.locator('#btn-avisos').textContent(),'🔔 Avisos ligados, também com o app fechado');
  });
  await check('Aluno: renova o endereço uma vez por abertura, sem pedir nada ao aluno',async()=>{
   await p.evaluate(()=>{__grav.length=0;_avisosNuvemSessao=false;renovarAvisosNuvem();renovarAvisosNuvem();});
   await p.clock.runFor(2000);await p.waitForFunction(()=>__grav.length>0);await p.waitForTimeout(100);
   assert.equal(await p.evaluate(()=>__grav.length),1);
  });
  assert.deepEqual(erros,[]);await ca.close();
  console.log('\n✅ '+count+' verificações · avisos no celular');
 }catch(e){console.error('❌ '+(e.stack||e));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

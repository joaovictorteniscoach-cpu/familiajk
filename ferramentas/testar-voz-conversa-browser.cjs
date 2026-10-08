/* Assistente por voz como conversa: entende faixa de horário ("das 16 até o
   fim da noite"), semana/mês/ano, horários livres, aluno (créditos, próxima
   aula, horário fixo, mensalidade), financeiro, ocupação, locações e preços;
   abre/fecha horários (data ou toda semana) e marca chuva com prévia e
   confirmação. O formulário de aluno só aparece quando é preciso.
   Somente dados fictícios, nuvem simulada, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-15T13:04:00-03:00');   // quinta-feira
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block',hasTouch:true,isMobile:true});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');window.__faladas=[];
   window.SpeechRecognition=class{start(){}abort(){}};
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){window.__faladas.push(u.text);}}});});
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-gestao/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO&&window.JVAcoesVoz);
  await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast{display:none!important}'});
  async function reset(extra){
   await p.evaluate(extra=>{
    JVAcoesVoz.fechar(true);history.replaceState({},'');
    const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',ativo:true,plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:0,mensalidade:640,status:'pago'},x||{});
    DB={alunos:[al('ana','Ana Teste',{creditos:3,status:'pendente'}),al('bia','Bia Teste',{status:'parcial'}),al('caio','Caio Teste',{tipo:'Personal'}),
      al('duda','Duda Teste',{tipo:'Dupla',plano:0,planoGrupo:4}),al('edu','Edu Teste',{tipo:'Dupla',plano:0,planoGrupo:4})],
     agenda:{fixos:[
      {id:'f1',alunoId:'caio',titulo:'Caio Teste',dia:4,hora:'07:00',tipo:'personal',desde:'2026-09-01'},
      {id:'f2',alunoId:'ana',titulo:'Ana Teste',dia:4,hora:'09:00',tipo:'aula',desde:'2026-09-01'},
      {id:'f3',alunoId:'bia',titulo:'Bia Teste',dia:4,hora:'16:00',tipo:'aula',desde:'2026-09-01'},
      {id:'f4',alunoId:'duda',titulo:'Duda Teste',dia:4,hora:'17:00',tipo:'grupo',pessoas:2,desde:'2026-09-01'},
      {id:'f5',alunoId:'edu',titulo:'Edu Teste',dia:4,hora:'17:00',tipo:'grupo',pessoas:2,desde:'2026-09-01'},
      {id:'f6',alunoId:'ana',titulo:'Ana Teste',dia:4,hora:'19:00',tipo:'aula',desde:'2026-09-01'},
      {id:'f7',alunoId:'ana',titulo:'Ana Teste',dia:2,hora:'18:00',tipo:'aula',desde:'2026-09-01'}],
      eventos:[{id:'e1',alunoId:'caio',titulo:'Caio Teste',data:'2026-10-15',hora:'20:00',tipo:'personal'},
       {id:'e2',alunoId:null,titulo:'Locação Fictícia',data:'2026-10-15',hora:'14:00',tipo:'locacao'}],excecoes:[]},
     presencas:[],movs:[],lancamentos:[{id:'l1',mes:'2026-10',valor:640,cat:'mensalidade',desc:'Mensalidade · Caio Teste'},{id:'l2',mes:'2026-10',valor:-50,cat:'despesa',desc:'Bolinhas'}],
     compromissos:[],meta:10000,mesCreditos:'2026-10',mesPagamentos:'2026-10',ultimoBackup:Date.now(),savedAt:Date.now(),
     precos:{avulsaPart:170,avulsaGrupo:95,locacao:70,personal:130},grupoPreco:{dupla:90,trio:85,quarteto:80}};
    Object.assign(DB,extra||{});
    ensureFields();Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);CARREGADO=true;MODO='dono';window._espacoAberto=true;window.AUTH_USER={uid:UID_DONO};
    _semDados=false;_abriuSemConferir=false;_nuvemMuda=false;_conflitoNuvem=null;_salvamentoEmCurso=null;syncing=false;cloudPending=false;
    window.__baseNo=()=>({agenda:JSON.stringify(DB.agenda),alunos:Object.fromEntries(DB.alunos.map(a=>[a.id,JSON.stringify(a)])),config:JSON.stringify({mesCreditos:DB.mesCreditos,horarioCfg:DB.horarioCfg,horarioData:DB.horarioData}),carimbos:{savedAt:DB.savedAt}});
    window.__no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));_basePartesLida=true;
    window.__snapshots=[];window.__persist=0;window.__saves=0;
    window.fbDB={ref:cam=>({get:async()=>{
     if(cam==='jvtenis/mapa_quadra')return {exists:()=>false,val:()=>null};
     if(cam!==RAIZ+'/'+V2)return {exists:()=>false,val:()=>null};
     return {exists:()=>true,val:()=>__no};}})};
    guardarVersoes=async json=>{__snapshots.push(json);return true;};
    persist=()=>{__persist++;cloudPending=true;};
    gravarAgora=async()=>{__saves++;__no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));cloudPending=false;return true;};
    syncRequests=async()=>{};publicarMapaQuadra=()=>{};publish=()=>{};guardarMetaProtecao=()=>{};
    window.__toasts=[];toast=m=>__toasts.push(m);window.__faladas=[];
    document.querySelectorAll('.overlay.on,.ficha.on,#renova-mes.on').forEach(x=>x.classList.remove('on'));
    MAPA_OUTROS={};_mapaLido='';fichaId=null;rmAberta=false;hideVals=false;
    lsSet(KEY+'__protecao',JSON.stringify({nuvem:Date.now(),backup:Date.now()}));setSave('✓ nuvem conferida','ok');
    renderAll();go('dash',document.querySelector('.nav button'));
   },extra||null);
   await p.waitForFunction(()=>!document.getElementById('voz-atalho').hidden);
  }
  const antes=()=>p.evaluate(()=>JSON.stringify(DB));
  async function abrir(){await p.evaluate(()=>JVAcoesVoz.abrir());assert.equal(await p.locator('#voz-painel').isVisible(),true);}
  async function falar(texto){await p.locator('#voz-texto').fill(texto);await p.evaluate(()=>JVAcoesVoz.analisar());}
  const resposta=()=>p.locator('#voz-consulta-resumo').innerText();
  const ultimaMsg=()=>p.evaluate(()=>{const m=[...document.querySelectorAll('#voz-conversa .jv-voz-msg.assistente')].pop();return m?m.innerText:'';});

  await check('abre como conversa: saudação, sugestões, sem formulário de aluno nem botão Confirmar',async()=>{
   await reset();await abrir();
   const r=await p.evaluate(()=>({msgs:document.querySelectorAll('#voz-conversa .jv-voz-msg').length,sug:document.querySelectorAll('#voz-conversa .jv-voz-sugestoes button').length,
    campos:!document.getElementById('voz-campos').hidden,confirmar:!document.getElementById('voz-confirmar').hidden,manual:!document.getElementById('voz-manual').hidden}));
   assert.equal(r.msgs,1);assert.equal(r.sug,4);assert.equal(r.campos,false);assert.equal(r.confirmar,false);assert.equal(r.manual,true);
   assert.match(await ultimaMsg(),/Oi, João!/);
  });
  await check('print 1: "Quantas aulas eu tenho agora de tarde das 16 até o final da noite" responde direto',async()=>{
   await reset();await abrir();const a=await antes();
   await falar('Quantas aulas eu tenho agora de tarde das 16 até o final da noite');
   const r=await resposta();
   // 16:00 Bia, 17:00 dupla (1 aula), 19:00 Ana, 20:00 Caio (personal) = 4
   assert.match(r,/Você tem 4 aulas agendadas/);assert.match(r,/das 16:00 até o fim do dia/);
   if(process.env.JV_SHOTS)await p.screenshot({path:path.join(process.env.JV_SHOTS,'voz-faixa.png')});
   assert.equal(await p.locator('#voz-consulta-lista li').count(),4);
   assert.match(await p.evaluate(()=>[...document.querySelectorAll('#voz-conversa .jv-voz-msg.voce')].pop().innerText),/das 16 até o final da noite/);
   assert.equal(await antes(),a);assert.equal(await p.evaluate(()=>__persist),0);
  });
  await check('print 2: "Abra os horários das 7h00 da manhã até as 18h00 de domingo para locações" prepara e aplica com confirmação',async()=>{
   await reset({horarioCfg:{0:{}}});await p.evaluate(()=>{for(let d=0;d<7;d++){DB.horarioCfg[d]=DB.horarioCfg[d]||{};}HORAS.forEach(h=>{DB.horarioCfg[0][h]='fechado';});__no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));});
   await abrir();const a=await antes();
   await falar('Abra os horários das 7h00 da manhã até as 18h00 de domingo para locações');
   await p.waitForFunction(()=>!document.getElementById('voz-confirmar').disabled);
   const prev=await p.locator('#voz-previa').innerText();
   assert.match(prev,/Mudar o funcionamento/);assert.match(prev,/domingo, 18\/10 \(só esta data\)/);assert.match(prev,/Das 07:00 às 18:00 → só para locação \(11 horários: 07:00 a 17:00\)/);
   assert.equal(await p.locator('#voz-campos').isVisible(),false,'sem formulário de aluno');
   assert.match(await ultimaMsg(),/Preparei: Mudar o funcionamento/);assert.equal(await antes(),a,'nada muda antes de confirmar');
   if(process.env.JV_SHOTS)await p.screenshot({path:path.join(process.env.JV_SHOTS,'voz-previa-horarios.png')});
   await p.evaluate(()=>JVAcoesVoz.executar());
   const r=await p.evaluate(()=>({d:DB.horarioData['2026-10-18'],cfg0:DB.horarioCfg[0]['10:00'],saves:__saves,snaps:__snapshots.length,res:document.getElementById('voz-resultado').innerText}));
   assert.equal(r.d['07:00'],'loc');assert.equal(r.d['17:00'],'loc');assert.equal(r.d['18:00'],'fechado');assert.equal(r.d['06:00'],'fechado');
   assert.equal(r.cfg0,'fechado','só a data; a semana continua igual');assert.equal(r.saves,1);assert.equal(r.snaps,1);
   assert.match(r.res,/Funcionamento mudado: domingo, 18\/10, das 07:00 às 18:00 só para locação/);assert.match(r.res,/salvo na nuvem/);
  });
  await check('"todo domingo" muda a semana; trocar na prévia para "Só em" muda só a data',async()=>{
   await reset();await abrir();
   await falar('Feche a quadra todo domingo à tarde');
   await p.waitForFunction(()=>!document.getElementById('voz-confirmar').disabled);
   assert.match(await p.locator('#voz-previa').innerText(),/Toda semana: domingo/);
   await p.locator('#voz-previa select').nth(1).selectOption('data');
   await p.waitForFunction(()=>!document.getElementById('voz-confirmar').disabled&&/só esta data/.test(document.getElementById('voz-previa').innerText));
   await p.evaluate(()=>JVAcoesVoz.executar());
   const r=await p.evaluate(()=>({d:(DB.horarioData['2026-10-18']||{})['14:00'],cfg:DB.horarioCfg[0]['14:00']}));
   assert.equal(r.d,'fechado');assert.notEqual(r.cfg,'fechado');
   await falar('Feche a quadra todo domingo à tarde');await p.waitForFunction(()=>!document.getElementById('voz-confirmar').disabled);
   await p.evaluate(()=>JVAcoesVoz.executar());
   assert.equal(await p.evaluate(()=>DB.horarioCfg[0]['15:00']),'fechado');
  });
  await check('marcar chuva hoje à tarde: prévia lista quem é afetado e só aplica ao confirmar',async()=>{
   await reset();await abrir();const a=await antes();
   await falar('Marcar chuva hoje à tarde');
   await p.waitForFunction(()=>!document.getElementById('voz-confirmar').disabled);
   const prev=await p.locator('#voz-previa').innerText();
   assert.match(prev,/Marcar chuva/);assert.match(prev,/14:00 Locação Fictícia/);assert.match(prev,/16:00 Bia Teste/);assert.match(prev,/17:00 Duda Teste, Edu Teste/);assert.doesNotMatch(prev,/19:00/);
   assert.equal(await antes(),a);
   await p.evaluate(()=>JVAcoesVoz.executar());
   const r=await p.evaluate(()=>({h16:entriesFor(new Date('2026-10-15T12:00:00'),'16:00').map(e=>e.tipo),h19:entriesFor(new Date('2026-10-15T12:00:00'),'19:00').length,proxSemana:entriesFor(new Date('2026-10-22T12:00:00'),'16:00').length}));
   assert.deepEqual(r.h16,['bloqueio']);assert.equal(r.h19,1,'noite não foi afetada');assert.equal(r.proxSemana,1,'grade fixa continua');
  });
  await check('semana, mês e ano respondem com a mesma conta do Início',async()=>{
   await reset();await abrir();
   await falar('Quantas aulas tenho esta semana?');
   assert.match(await resposta(),/Você tem 7 aulas nesta semana \(12\/10 a 18\/10\): 2 de personal e 5 de tênis/);
   assert.equal(await p.evaluate(()=>contarAulas(new Date(2026,9,12),new Date(2026,9,18)).total),7);
   await falar('Quantas aulas dei este mês?');
   const mes=await p.evaluate(()=>contarAulas(new Date(2026,9,1),new Date(2026,9,31)).total);
   assert.match(await resposta(),new RegExp('Você tem '+mes+' aulas neste mês'));
   await falar('Quantas aulas no ano?');assert.match(await resposta(),/aulas em 2026/);
   assert.ok(await p.evaluate(()=>document.querySelectorAll('#voz-conversa .jv-voz-msg.assistente').length)>=3,'respostas anteriores ficam na conversa');
  });
  await check('horários livres: só hora aberta para aula, sem nada marcado e ainda por vir',async()=>{
   await reset();await abrir();
   await falar('Quais horários livres amanhã de manhã?');
   assert.match(await resposta(),/Horários livres para aula amanhã \(manhã\): 07:00, 08:00, 09:00, 10:00, 11:00\./);
   await falar('Tem horário livre hoje?');
   const r=await resposta();assert.match(r,/18:00/);assert.doesNotMatch(r,/16:00|17:00|19:00|07:00/);
  });
  await check('aluno: créditos, próxima aula, horário fixo e mensalidade (com valores ocultos respeitados)',async()=>{
   await reset();await abrir();
   await falar('Quantos créditos a Ana tem?');assert.match(await resposta(),/Ana Teste tem 3 créditos, 0 reposições válidas/);
   await falar('Quando é a próxima aula da Ana?');assert.match(await resposta(),/A próxima aula de Ana Teste é hoje às 19:00/);
   await falar('Qual o horário fixo da Ana?');assert.match(await resposta(),/terça às 18:00, quinta às 09:00, quinta às 19:00/);
   await falar('A Ana pagou a mensalidade?');assert.match(await resposta(),/pendente: falta R\$ 640/);
   await p.evaluate(()=>{hideVals=true;});await falar('A Ana pagou a mensalidade?');
   assert.match(await resposta(),/pendente\./);assert.doesNotMatch(await resposta(),/R\$/);
  });
  await check('financeiro: quem está devendo, quanto recebi e quanto falta receber',async()=>{
   await reset();await abrir();
   await falar('Quem está devendo este mês?');
   assert.match(await resposta(),/2 alunos com mensalidade pendente em outubro/);
   const lista=await p.locator('#voz-consulta-lista').innerText();assert.match(lista,/Ana Teste/);assert.match(lista,/Bia Teste/);
   await falar('Quanto recebi este mês?');assert.match(await resposta(),/Em outubro você recebeu R\$ 640/);
   await falar('Quanto falta receber?');assert.match(await resposta(),/Falta receber R\$/);
  });
  await check('ocupação, locações, preços e ajuda',async()=>{
   await reset();await abrir();
   await falar('Qual a ocupação hoje?');assert.match(await resposta(),/Ocupação hoje: \d+%/);
   await falar('Quantas locações hoje?');assert.match(await resposta(),/1 locação hoje/);
   await falar('Qual o valor da aula avulsa?');assert.match(await resposta(),/aula avulsa particular R\$ 170/);
   await falar('O que você faz?');assert.match(await resposta(),/Posso responder/);
  });
  await check('frases do dia a dia viram o pedido certo (e as ambíguas continuam pedindo esclarecimento)',async()=>{
   const r=await p.evaluate(()=>{const al=DB.alunos,b='2026-10-15',i=t=>JVAcoesVoz.interpretar(t,al,b);return {
    meio:i('Quantas aulas tenho até o meio dia?').faixa,noite:i('Tenho aula às 7 da noite?').hora,livres:i('Horários livres essa semana').consulta,
    bloq:i('Bloqueia amanhã das 14 às 16'),sab:i('Feche os horários de sábado à tarde').horas,faltam:i('Quantas aulas faltam hoje?'),
    prox:i('Qual a próxima aula?').consulta,quintas:i('Libere as quintas das 12 às 16 para locação'),dois:i('Abra os horários de sábado e domingo das 7 às 18 para locação').dias,
    chuva:i('Choveu, marca chuva das 16 às 18').horas,nav:i('Abre a agenda de amanhã'),amb:i('Quem tem aula das quatro?').erro,neg:i('Quem não tem aula hoje?').erro,
    mist:i('Quantas aulas tenho hoje e cancela a Ana').erro,fechamento:i('Fecha o mês').erro};});
   assert.deepEqual(r.meio,[0,720]);assert.equal(r.noite,'19:00');assert.equal(r.livres,'livres');
   assert.equal(r.bloq.modo,'fechado');assert.equal(r.bloq.data,'2026-10-16');assert.deepEqual(r.bloq.horas,['14:00','15:00']);
   assert.deepEqual(r.sab,['12:00','13:00','14:00','15:00','16:00','17:00']);assert.equal(r.faltam.agora,true);assert.equal(r.prox,'proxima');
   assert.equal(r.quintas.escopo,'semana');assert.deepEqual(r.quintas.dias,[4]);assert.equal(r.quintas.modo,'loc');assert.deepEqual(r.dois,[0,6]);
   assert.deepEqual(r.chuva,['16:00','17:00']);assert.equal(r.nav.acao,'navegar');assert.equal(r.nav.data,'2026-10-16');
   assert.ok(r.amb);assert.ok(r.neg);assert.ok(r.mist);assert.ok(r.fechamento,'fechar o mês não mexe em horários');
   await reset();await abrir();await falar('Quantas aulas faltam hoje?');
   assert.match(await resposta(),/Você tem 4 aulas agendadas.*a partir de agora/);
   await falar('Qual a próxima aula?');assert.match(await resposta(),/Sua próxima aula é hoje às 16:00: Bia Teste/);
  });
  await check('pedido que não entende responde na conversa com o que sabe fazer (sem formulário)',async()=>{
   await reset();await abrir();await falar('Bom dia, tudo certo?');
   assert.match(await ultimaMsg(),/Não entendi esse pedido\. Posso responder/);
   assert.equal(await p.locator('#voz-campos').isVisible(),false);
  });
  await check('agendar ainda usa o formulário e a confirmação; depois do salvo dá para seguir conversando',async()=>{
   await reset();await abrir();await falar('Agendar Bia amanhã às 18h');
   await p.waitForFunction(()=>!document.getElementById('voz-confirmar').disabled);
   assert.equal(await p.locator('#voz-campos').isVisible(),true);
   await p.evaluate(()=>JVAcoesVoz.executar());
   assert.match(await p.locator('#voz-resultado').innerText(),/Horário agendado para Bia Teste/);
   await falar('Quantas aulas tenho amanhã?');
   assert.match(await resposta(),/aulas? agendadas?/);
   assert.match(await p.evaluate(()=>[...document.querySelectorAll('#voz-conversa .jv-voz-msg.assistente')].map(m=>m.innerText).join('|')),/Horário agendado para Bia Teste/);
  });
  await check('frases de ação com "não", dia passado ou nada para mudar não alteram nada',async()=>{
   await reset();await abrir();const a=await antes();
   for(const t of ['Não abra os horários de domingo para locação','Marcar chuva ontem','Abra os horários das 9 às 11 de amanhã para aula']){
    await falar(t);assert.ok(await p.locator('#voz-confirmar').isDisabled(),t);
   }
   assert.match(await ultimaMsg(),/já estão aberto para aula/);assert.equal(await antes(),a);
  });
  await check('fechar apaga a conversa; nada fica guardado no aparelho',async()=>{
   await reset();await abrir();await falar('Quantas aulas tenho hoje?');
   assert.equal(await p.evaluate(()=>Object.keys(localStorage).some(k=>String(localStorage.getItem(k)).includes('Quantas aulas tenho hoje'))),false);
   await p.evaluate(()=>JVAcoesVoz.fechar(true));
   assert.equal(await p.evaluate(()=>document.querySelectorAll('#voz-conversa .jv-voz-msg').length),0);
  });
  await check('celular e computador: conversa rola sozinha, sem rolagem lateral, toques de 44 px',async()=>{
   await reset();await abrir();
   for(const t of ['Quantas aulas tenho hoje?','Quem tem aula amanhã?','Quantas aulas tenho esta semana?'])await falar(t);
   for(const width of [320,390,1280]){await p.setViewportSize({width,height:844});
    await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await p.waitForTimeout(120);
    const r=await p.evaluate(()=>{const b=document.getElementById('voz-conversa');return {lateral:document.documentElement.scrollWidth>innerWidth+1,rola:b.scrollHeight>b.clientHeight,fim:Math.abs(b.scrollTop+b.clientHeight-b.scrollHeight)<4,
     toques:[...document.querySelectorAll('#voz-painel button')].filter(x=>x.getClientRects().length).every(x=>x.getBoundingClientRect().height>=44)};});
    assert.equal(r.lateral,false,'lateral '+width);assert.equal(r.toques,true,'toque '+width);
    if(r.rola)assert.equal(r.fim,true,'mostra a última resposta '+width);
   }
   await p.setViewportSize({width:390,height:844});
   if(process.env.JV_SHOTS)await p.screenshot({path:path.join(process.env.JV_SHOTS,'voz-conversa.png')});
  });
  assert.deepEqual(errors,[]);
  console.log('\n✅ '+count+' verificações · assistente por voz em conversa');
 }catch(e){console.error('❌ '+(e.stack||e));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

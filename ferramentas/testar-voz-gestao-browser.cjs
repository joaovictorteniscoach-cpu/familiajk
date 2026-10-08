/* Voz funcional: Chromium e WebKit, reconhecimento simulado, somente dados fictícios.
   Microfone real no iPhone requer ensaio no aparelho; estes testes não o simulam como validado. */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-15T10:00:00-03:00');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
async function visual(p,n){if(!process.env.JV_VISUAL_DIR)return;const png=await p.screenshot();fs.mkdirSync(process.env.JV_VISUAL_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.JV_VISUAL_DIR,n+'.png'),png);console.log('VISUAL_NAME '+n+' '+png.toString('base64'));}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
 for(const [motor,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
  for(const theme of ['saibro','classico']){
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Rio_Branco',serviceWorkers:'block',hasTouch:true,isMobile:true});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(theme=>{
    localStorage.setItem('jv-tema',theme);sessionStorage.setItem('jv-bk-adiar','1');
    window.__recs=[];window.__faladas=[];window.__abort=0;
    window.SpeechRecognition=class{
     constructor(){window.__recs.push(this);}start(){this.active=true;}abort(){this.active=false;window.__abort++;}
     emit(t,final){const r=[{transcript:t}];r.isFinal=final;this.onresult({resultIndex:0,results:[r]});}
    };
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){window.__faladas.push(u.text);}}});
   },theme);
   const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
   await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-gestao/',{waitUntil:'load'});
   await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO&&window.JVAcoesVoz);
   await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast{display:none!important}'});
   async function reset(){
    await p.evaluate(()=>{
     JVAcoesVoz.fechar(true);history.replaceState({},'');
     DB={alunos:[
      {id:'a1',nome:'Ana Silva',codigo:'9901',tipo:'Particular',ativo:true,plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:1,mensalidade:640,status:'pago'},
      {id:'a2',nome:'Ana Souza',codigo:'9902',tipo:'Dupla',ativo:true,plano:0,planoGrupo:4,creditos:0,credGrupo:2,repos:0,mensalidade:320,status:'pago'},
      {id:'b1',nome:'Bruno Teste',codigo:'9903',tipo:'Particular',ativo:true,plano:4,planoGrupo:0,creditos:1,credGrupo:0,repos:0,mensalidade:640,status:'pago'},
      {id:'inativo',nome:'Inativo Teste',codigo:'9904',tipo:'Particular',ativo:false,plano:4,creditos:2,mensalidade:640,status:'inativo'}
     ],agenda:{fixos:[{id:'f1',alunoId:'a1',titulo:'Ana Silva',dia:5,hora:'16:00',tipo:'aula',desde:'2026-10-01'}],eventos:[],excecoes:[]},
     presencas:[],movs:[],lancamentos:[],compromissos:[],meta:10000,mesCreditos:'2026-10',mesPagamentos:'2026-10',ultimoBackup:Date.now(),savedAt:Date.now()};
     ensureFields();Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);CARREGADO=true;MODO='dono';window._espacoAberto=true;window.AUTH_USER={uid:UID_DONO};
     _semDados=false;_abriuSemConferir=false;_nuvemMuda=false;_conflitoNuvem=null;_salvamentoEmCurso=null;syncing=false;cloudPending=false;
     window.__baseNo=()=>({agenda:JSON.stringify(DB.agenda),alunos:Object.fromEntries(DB.alunos.map(a=>[a.id,JSON.stringify(a)])),config:JSON.stringify({mesCreditos:DB.mesCreditos}),carimbos:{savedAt:DB.savedAt}});
     window.__no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));_basePartesLida=true;
     window.__failRead=false;window.__failMap=false;window.__map={};window.__holdRead=false;window.__releaseRead=null;
     window.__snapshotOk=true;window.__snapshots=[];window.__persist=0;window.__saves=0;window.__saveOk=true;window.__holdSave=false;window.__releaseSave=null;
     window.fbDB={ref:cam=>({get:async()=>{
      if(cam==='jvtenis/mapa_quadra'){if(__failMap)throw Error('mapa indisponível');return {exists:()=>Object.keys(__map).length>0,val:()=>__map};}
      if(cam!==RAIZ+'/'+V2)return {exists:()=>false,val:()=>null};
      if(__failRead)throw Error('nuvem indisponível');
      if(__holdRead){await new Promise(r=>window.__releaseRead=r);}
      return {exists:()=>true,val:()=>__no};
     }})};
     guardarVersoes=async json=>{__snapshots.push(json);return __snapshotOk;};
     persist=()=>{__persist++;cloudPending=true;};
     gravarAgora=async()=>{__saves++;if(__holdSave)await new Promise(r=>window.__releaseSave=r);if(!__saveOk)return false;__no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));cloudPending=false;return true;};
     syncRequests=async()=>{};publicarMapaQuadra=()=>{};publish=()=>{};guardarMetaProtecao=()=>{};
     window.__toasts=[];toast=m=>__toasts.push(m);window.__recs=[];window.__faladas=[];window.__abort=0;
     document.querySelectorAll('.overlay.on,.ficha.on,#renova-mes.on').forEach(x=>x.classList.remove('on'));
     MAPA_OUTROS={};_mapaLido='';fichaId=null;rmAberta=false;hideVals=false;
     lsSet(KEY+'__protecao',JSON.stringify({nuvem:Date.now(),backup:Date.now()}));setSave('✓ nuvem conferida','ok');
     renderAll();go('dash',document.querySelector('.nav button'));
    });await p.waitForFunction(()=>!document.getElementById('voz-atalho').hidden);
   }
   async function abrir(){await p.locator('#voz-atalho').click();assert.equal(await p.locator('#voz-painel').isVisible(),true);}
   async function pedido(texto){await abrir();await p.locator('#voz-texto').fill(texto);await p.evaluate(()=>JVAcoesVoz.analisar());}
   const antes=()=>p.evaluate(()=>JSON.stringify(DB));
   const dados=()=>p.evaluate(()=>({eventos:DB.agenda.eventos,excecoes:DB.agenda.excecoes,fixos:DB.agenda.fixos,persist:__persist,saves:__saves,alunos:DB.alunos,status:document.getElementById('voz-status').textContent}));
   const label=motor+'/'+theme+': ';
   await reset();
   await check(label+'botão funcional acima da navegação, acesso no menu e sem alteração ao abrir',async()=>{
    const a=await antes();const r=await p.evaluate(()=>{const b=document.getElementById('voz-atalho').getBoundingClientRect(),n=document.querySelector('.nav').getBoundingClientRect();return {acima:b.bottom<n.top,dentro:b.right<=innerWidth,tamanho:b.width};});
    assert.equal(r.acima,true);assert.equal(r.dentro,true);assert.ok(r.tamanho>=48);
    await visual(p,'voz-real-botao-'+motor+'-'+theme);await abrir();assert.equal(await antes(),a);await visual(p,'voz-real-painel-'+motor+'-'+theme);
    await p.evaluate(()=>JVAcoesVoz.fechar(true));await p.evaluate(()=>abrirMais());await p.waitForFunction(()=>document.getElementById('voz-atalho').hidden);assert.ok(await p.locator('#voz-atalho').isHidden());await p.locator('#voz-menu').click();assert.ok(await p.locator('#voz-painel').isVisible());
   });
   await check(label+'professor ou sessão sem dono não recebe o atalho nem consegue executar',async()=>{
    await reset();const a=await antes();await p.evaluate(()=>{MODO='prof';AUTH_USER={uid:'prof-ficticio'};document.body.dataset.pagina='agenda';});
    await p.waitForFunction(()=>document.getElementById('voz-atalho').hidden);await p.evaluate(()=>JVAcoesVoz.abrir());
    assert.ok(await p.locator('#voz-painel').isHidden());assert.equal(await antes(),a);
   });
   await check(label+'reconhecimento parcial e repetido apenas preenche texto, sem ação automática',async()=>{
    await reset();await abrir();const a=await antes();await p.locator('#voz-falar').click();
    assert.equal(await p.evaluate(()=>__recs[0].lang),'pt-BR');
    await p.evaluate(()=>__recs[0].emit('Cancelar Ana Silva amanhã às quatro da tarde',false));
    assert.equal(await antes(),a);assert.ok(await p.locator('#voz-confirmar').isDisabled());
    await p.evaluate(()=>{__recs[0].emit('Cancelar Ana Silva amanhã às quatro da tarde',true);__recs[0].emit('Cancelar Ana Silva amanhã às quatro da tarde',true);});
    assert.equal(await p.locator('#voz-texto').inputValue(),'Cancelar Ana Silva amanhã às quatro da tarde');assert.equal(await antes(),a);
   });
   await check(label+'permissão negada e API ausente mantêm digitação e ditado do teclado',async()=>{
    await reset();await abrir();await p.locator('#voz-falar').click();await p.evaluate(()=>__recs[0].onerror({error:'not-allowed'}));
    assert.match(await p.locator('#voz-status').innerText(),/negada/);assert.ok(await p.locator('#voz-texto').isEditable());
    await p.evaluate(()=>{window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;JVAcoesVoz.fechar(true);JVAcoesVoz.abrir();});
    assert.ok(await p.locator('#voz-falar').isDisabled());assert.match(await p.locator('#voz-status').innerText(),/teclado/);
    await p.locator('#voz-texto').fill('Agendar Bruno Teste amanhã às 18h');await p.evaluate(()=>JVAcoesVoz.analisar());assert.ok(await p.locator('#voz-confirmar').isEnabled(),await p.locator('#voz-status').innerText());
    await p.evaluate(()=>{window.SpeechRecognition=class{start(){}abort(){}};});
   });
   await check(label+'horário ocupado recusa, nomes iguais e hora ambígua exigem escolha',async()=>{
    await reset();const a=await antes();await pedido('Agendar Bruno Teste amanhã às 16h');assert.match(await p.locator('#voz-status').innerText(),/ocupado/);assert.ok(await p.locator('#voz-confirmar').isDisabled());assert.equal(await antes(),a);
    await p.locator('#voz-texto').fill('Cancelar Ana amanhã às três');await p.evaluate(()=>JVAcoesVoz.analisar());
    assert.equal(await p.locator('#voz-aluno').inputValue(),'');assert.equal(await p.locator('#voz-hora').inputValue(),'');assert.equal(await antes(),a);
   });
   await check(label+'negação, duas ações, data inválida e dia incompatível nunca executam',async()=>{
    await reset();await abrir();const a=await antes();
    for(const txt of ['Não cancelar Ana Silva amanhã às 16h','Cancelar Ana Silva e agendar Bruno amanhã às 16h','Agendar Bruno 31/02/2026 às 18h','Agendar Bruno quinta 16/10/2026 às 18h']){
     await p.locator('#voz-texto').fill(txt);await p.evaluate(()=>JVAcoesVoz.analisar());assert.ok(await p.locator('#voz-confirmar').isDisabled());assert.equal(await antes(),a);
    }
   });
   await check(label+'cancelamento fixo afeta apenas a data escolhida e não saldos nem semanas seguintes',async()=>{
    await reset();const saldos=await p.evaluate(()=>JSON.stringify(DB.alunos));await pedido('Cancelar Ana Silva amanhã às quatro da tarde');
    assert.equal(await p.locator('#voz-data').inputValue(),'2026-10-16','dia de Brasília, mesmo com aparelho em UTC-5');
    assert.ok(await p.locator('#voz-confirmar').isEnabled());await visual(p,'voz-real-previa-'+motor+'-'+theme);
    await p.evaluate(()=>Promise.all([JVAcoesVoz.executar(),JVAcoesVoz.executar()]));
    const r=await dados();assert.deepEqual(r.excecoes,[{fixoId:'f1',data:'2026-10-16'}]);assert.equal(r.fixos.length,1);assert.equal(r.persist,1);assert.equal(r.saves,1);assert.match(r.status,/salvo na nuvem/);
    assert.equal(JSON.stringify(r.alunos),saldos);assert.equal(await p.evaluate(()=>entriesFor(new Date('2026-10-23T12:00:00'),'16:00').length),1);
   });
   await check(label+'agendar cria uma ocorrência, confirma a nuvem e recusa repetição',async()=>{
    await reset();const saldos=await p.evaluate(()=>JSON.stringify(DB.alunos));await pedido('Agendar Bruno Teste amanhã às 18h');
    await p.evaluate(()=>JVAcoesVoz.executar());let r=await dados();assert.equal(r.eventos.length,1);assert.equal(r.eventos[0].alunoId,'b1');assert.equal(r.eventos[0].data,'2026-10-16');assert.equal(r.eventos[0].hora,'18:00');assert.equal(r.fixos.length,1);assert.equal(JSON.stringify(r.alunos),saldos);
    await p.evaluate(()=>JVAcoesVoz.executar());r=await dados();assert.equal(r.eventos.length,1);assert.equal(r.saves,1);
   });
   await check(label+'dupla aceita segunda pessoa e bloqueia a terceira, particular e mistura',async()=>{
    await reset();await p.evaluate(()=>{DB.alunos[2].tipo='Dupla';DB.agenda.eventos=[{id:'g1',data:'2026-10-16',hora:'18:00',tipo:'grupo',pessoas:2,alunoId:'a2',titulo:'Ana Souza'}];__no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));});
    await pedido('Agendar Bruno Teste amanhã às 18h em dupla');await p.evaluate(()=>JVAcoesVoz.executar());assert.equal((await dados()).eventos.length,2);
    await p.evaluate(()=>{JVAcoesVoz.fechar(true);DB.alunos[0].tipo='Dupla';__no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));});
    await pedido('Agendar Ana Silva amanhã às 18h em dupla');assert.ok(await p.locator('#voz-confirmar').isDisabled());assert.match(await p.locator('#voz-status').innerText(),/completa/);
   });
   await check(label+'cancelamento de evento de grupo preserva o outro participante',async()=>{
    await reset();await p.evaluate(()=>{DB.agenda.eventos=[{id:'g1',data:'2026-10-16',hora:'18:00',tipo:'grupo',pessoas:2,alunoId:'a2',titulo:'Ana Souza'},{id:'g2',data:'2026-10-16',hora:'18:00',tipo:'grupo',pessoas:2,alunoId:'b1',titulo:'Bruno Teste'}];__no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));});
    await pedido('Cancelar Bruno Teste amanhã às 18h');await p.evaluate(()=>JVAcoesVoz.executar());
    assert.deepEqual((await dados()).eventos.map(e=>e.id),['g1']);assert.equal(await p.evaluate(()=>entriesFor(new Date('2026-10-16T12:00:00'),'18:00').length),1);
   });
   await check(label+'alteração em outra sessão após prévia bloqueia antes de mudar a agenda',async()=>{
    await reset();await pedido('Agendar Bruno Teste amanhã às 18h');const a=await antes();await p.evaluate(()=>{__no.carimbos.savedAt+=1;});
    await p.evaluate(()=>JVAcoesVoz.executar());assert.equal(await antes(),a);assert.equal((await dados()).persist,0);assert.match(await p.locator('#voz-status').innerText(),/Outra sessão/);
   });
   await check(label+'mudar os campos invalida a prévia e não aplica o pedido anterior',async()=>{
    await reset();await pedido('Agendar Bruno Teste amanhã às 18h');const a=await antes();await p.locator('#voz-hora').selectOption('19:00');assert.ok(await p.locator('#voz-confirmar').isDisabled());
    await p.evaluate(()=>JVAcoesVoz.executar());assert.equal(await antes(),a);
   });
   await check(label+'falha de cópia anterior, leitura da nuvem ou mapa impede alteração',async()=>{
    for(const flag of ['__snapshotOk','__failRead','__failMap']){
     await reset();await pedido('Agendar Bruno Teste amanhã às 18h');const a=await antes();
     await p.evaluate(flag=>{window[flag]=flag==='__snapshotOk'?false:true;},flag);
     await p.evaluate(()=>JVAcoesVoz.executar());assert.equal(await antes(),a);assert.equal((await dados()).persist,0);assert.ok(await p.locator('#voz-confirmar').isDisabled());
    }
   });
   await check(label+'pendência na nuvem não vira sucesso nem repete ação; tentar salvar só reenvia',async()=>{
    await reset();await pedido('Agendar Bruno Teste amanhã às 18h');await p.evaluate(()=>{__saveOk=false;});await p.evaluate(()=>JVAcoesVoz.executar());
    let r=await dados();assert.equal(r.eventos.length,1);assert.match(r.status,/pendente/);assert.doesNotMatch(r.status,/salvo na nuvem/);
    await p.evaluate(()=>JVAcoesVoz.executar());assert.equal((await dados()).persist,1);
    await p.evaluate(()=>{__saveOk=true;});await p.locator('#voz-salvar').click();r=await dados();assert.equal(r.persist,1);assert.equal(r.saves,2);assert.match(r.status,/salvo na nuvem/);
   });
   await check(label+'resposta atrasada e duplo toque deixam uma única marcação',async()=>{
    await reset();await pedido('Agendar Bruno Teste amanhã às 18h');await p.evaluate(()=>{__holdSave=true;window.__exec=JVAcoesVoz.executar();});
    await p.waitForFunction(()=>window.__releaseSave);await p.evaluate(()=>JVAcoesVoz.executar());
    assert.equal((await dados()).eventos.length,1);assert.match(await p.locator('#voz-status').innerText(),/Aguardando/);
    await p.evaluate(async()=>{__releaseSave();await __exec;});assert.equal((await dados()).saves,1);
   });
   await check(label+'renovar usa a confirmação e regras existentes, sem registrar pagamento',async()=>{
    await reset();p.removeAllListeners('dialog');p.on('dialog',d=>/Renovar o mês de/.test(d.message())?d.accept():d.dismiss());
    const lanc=await p.evaluate(()=>JSON.stringify(DB.lancamentos));await pedido('Renovar o pacote da Ana Silva');await p.evaluate(()=>JVAcoesVoz.executar());
    const r=await dados(),a=r.alunos.find(x=>x.id==='a1');assert.equal(a.creditos,4);assert.equal(a.repos,3);assert.equal(a.ultimaRenovacao.mes,'2026-10');assert.equal(await p.evaluate(()=>JSON.stringify(DB.lancamentos)),lanc);assert.equal(r.persist,1);
    await p.evaluate(()=>JVAcoesVoz.fechar(true));await pedido('Renovar o pacote da Ana Silva');assert.ok(await p.locator('#voz-confirmar').isDisabled());assert.match(await p.locator('#voz-status').innerText(),/já foi renovado/);
    p.removeAllListeners('dialog');p.on('dialog',d=>d.dismiss());
   });
   await check(label+'recusar renovação ou ajuste manual mantém os saldos',async()=>{
    await reset();let recusas=0;p.removeAllListeners('dialog');p.on('dialog',d=>{if(/Renovar o mês de/.test(d.message()))recusas++;d.dismiss();});const a=await antes();await pedido('Renovar o pacote da Ana Silva');await p.evaluate(()=>JVAcoesVoz.executar());assert.equal(recusas,1,'confirmação de renovação efetivamente recusada');assert.equal(await antes(),a);assert.equal((await dados()).persist,0);
    await reset();await p.evaluate(()=>{DB.movs.push({alunoId:'a1',campo:'creditos',delta:2,de:0,para:2,ts:Date.now(),motivo:'Correção manual no cadastro — teste'});__no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));});
    const b=await antes();await pedido('Renovar o pacote da Ana Silva');assert.ok(await p.locator('#voz-confirmar').isDisabled());assert.match(await p.locator('#voz-status').innerText(),/ajuste manual/);await p.evaluate(()=>JVAcoesVoz.executar());assert.equal(await antes(),b);assert.equal((await dados()).persist,0);
   });
   await check(label+'fechar durante leitura e receber resultado antigo não executa',async()=>{
    await reset();await abrir();await p.locator('#voz-texto').fill('Agendar Bruno Teste amanhã às 18h');await p.evaluate(()=>{__holdRead=true;window.__analise=JVAcoesVoz.analisar();});
    await p.waitForFunction(()=>window.__releaseRead);await p.evaluate(()=>JVAcoesVoz.fechar(true));await p.evaluate(async()=>{__holdRead=false;__releaseRead();await __analise;});
    assert.equal((await dados()).persist,0);assert.ok(await p.locator('#voz-painel').isHidden());
   });
   await check(label+'Escape, Voltar, mudança de tela e sair da conta interrompem a captura',async()=>{
    for(const modo of ['escape','voltar','pagina','sair']){
     await reset();await abrir();await p.evaluate(()=>{window.SpeechRecognition=class{constructor(){window.__ultimo=this;}start(){}abort(){window.__abort++;}};});await p.locator('#voz-falar').click();
     if(modo==='escape')await p.keyboard.press('Escape');if(modo==='voltar')await p.evaluate(()=>history.back());if(modo==='pagina')await p.evaluate(()=>document.body.dataset.pagina='fin');if(modo==='sair')await p.evaluate(()=>{AUTH_USER=null;document.body.dataset.pagina='alunos';});
     await p.waitForFunction(()=>document.getElementById('voz-painel').hidden);assert.ok(await p.evaluate(()=>__abort)>0);
    }
   });
   await check(label+'painel legível, sem rolagem lateral e áreas de toque em celular e computador',async()=>{
    await reset();await abrir();
    for(const width of [320,390,520,1280]){await p.setViewportSize({width,height:844});
     assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
     const r=await p.locator('#voz-painel button').evaluateAll(bs=>bs.filter(b=>b.getClientRects().length).map(b=>b.getBoundingClientRect().height));assert.ok(r.every(h=>h>=44),'toque '+width);
    }
    await p.setViewportSize({width:390,height:844});
   });
   await check(label+'transcrição é apagada ao fechar e não fica no armazenamento',async()=>{
    await reset();await abrir();const texto='Pedido falado fictício para teste de privacidade 8675';await p.locator('#voz-texto').fill(texto);
    assert.equal(await p.evaluate(t=>Object.keys(localStorage).some(k=>String(localStorage.getItem(k)).includes(t)),texto),false);
    await p.evaluate(()=>JVAcoesVoz.fechar(true));assert.equal(await p.locator('#voz-texto').inputValue(),'');
   });
   assert.deepEqual(errors,[],label+'erros de página');await c.close();
  }
  }finally{await browser.close();}
 }
 console.log('✅ '+count+' verificações de voz funcional nos dois navegadores e temas');
 }catch(e){console.error('❌ '+(e.stack||e));process.exitCode=1;}
 finally{server.close();}
})();

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
    window.__recs=[];window.__faladas=[];window.__utterances=[];window.__abort=0;
    window.SpeechRecognition=class{
     constructor(){window.__recs.push(this);}start(){this.active=true;}abort(){this.active=false;window.__abort++;}
     emit(t,final){const r=[{transcript:t}];r.isFinal=final;this.onresult({resultIndex:0,results:[r]});}
    };
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){window.__faladas.push(u.text);window.__utterances.push(u);}}});
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
   async function abrir(){await p.evaluate(()=>JVAcoesVoz.abrir());assert.equal(await p.locator('#voz-painel').isVisible(),true);}
   async function pedido(texto){await abrir();await p.locator('#voz-texto').fill(texto);await p.evaluate(()=>JVAcoesVoz.analisar());}
   const antes=()=>p.evaluate(()=>JSON.stringify(DB));
   const dados=()=>p.evaluate(()=>({eventos:DB.agenda.eventos,excecoes:DB.agenda.excecoes,fixos:DB.agenda.fixos,persist:__persist,saves:__saves,alunos:DB.alunos,status:document.getElementById('voz-status').textContent}));
   const label=motor+'/'+theme+': ';
   await reset();
   await check(label+'círculo flutuante translúcido com brilho, acima da navegação, inicia escuta por toque e acesso no menu',async()=>{
    const antesAbrir=await antes();
    for(const width of [320,390,520,1280]){
     await p.setViewportSize({width,height:844});
     for(const pagina of ['dash','agenda','alunos']){
      await p.evaluate(pg=>go(pg,document.createElement('button')),pagina);
      await p.waitForFunction(()=>!document.getElementById('voz-atalho').hidden);
      const r=await p.evaluate(()=>{
       const el=document.getElementById('voz-atalho'),b=el.getBoundingClientRect(),n=document.querySelector('.nav').getBoundingClientRect(),s=getComputedStyle(el);
       return {position:s.position,round:s.borderRadius,width:b.width,height:b.height,left:b.left,right:b.right,bottom:b.bottom,navTop:n.top,opacity:Number(s.opacity),brilho:s.filter,sombra:s.boxShadow,click:document.elementFromPoint(b.left+b.width/2,b.top+b.height/2).closest('#voz-atalho')===el,overflow:document.documentElement.scrollWidth>innerWidth+1};
      });
      assert.equal(r.position,'fixed');assert.equal(r.round,'50%');assert.ok(r.width>=48&&r.height>=48);
      assert.ok(r.left>=0&&r.right<=width+1&&r.bottom<r.navTop,pagina+' '+width);
      assert.ok(r.opacity>0&&r.opacity<1);assert.notEqual(r.sombra,'none');assert.notEqual(r.brilho,'none');
      assert.equal(r.click,true);assert.equal(r.overflow,false,pagina+' '+width);
     }
    }
    await p.setViewportSize({width:390,height:844});await p.evaluate(()=>go('dash',document.createElement('button')));
    await visual(p,'voz-real-botao-'+motor+'-'+theme);await p.locator('#voz-atalho').click();
    assert.equal(await p.locator('#voz-painel').getAttribute('data-ouvindo'),'true');assert.equal(await antes(),antesAbrir);
    await p.locator('#voz-circulo').click();assert.equal(await p.locator('#voz-painel').getAttribute('data-ouvindo'),'false');
    await visual(p,'voz-real-painel-'+motor+'-'+theme);
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
   await check(label+'fala completa confere automaticamente, ondas só ao ouvir/falar, confirmação sempre explícita',async()=>{
    await reset();const a=await antes();await p.locator('#voz-atalho').click();
    assert.equal(await p.locator('#voz-painel').getAttribute('data-ouvindo'),'true');
    assert.notEqual(await p.locator('#voz-circulo .jv-voz-ondas i').first().evaluate(e=>getComputedStyle(e).animationName),'none');
    await p.evaluate(()=>{__recs[0].emit('Agendar Bruno Teste amanhã às 18h',true);__recs[0].onend();});
    await p.waitForFunction(()=>!document.getElementById('voz-confirmar').disabled);
    assert.equal(await antes(),a);assert.match(await p.locator('#voz-previa').innerText(),/Bruno Teste/);
    assert.match(await p.evaluate(()=>__faladas.at(-1)),/Bruno Teste/);
    await p.evaluate(()=>__utterances.at(-1).onstart());
    assert.equal(await p.locator('#voz-painel').getAttribute('data-falando'),'true');
    await visual(p,'voz-real-respondendo-'+motor+'-'+theme);await p.evaluate(()=>{window.__velha=__utterances.at(-1);});
    await p.evaluate(()=>__utterances.at(-1).onend());
    assert.equal(await p.locator('#voz-painel').getAttribute('data-falando'),'false');
    await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('#voz-circulo .jv-voz-ondas i').first().evaluate(e=>getComputedStyle(e).animationName),'none');await p.emulateMedia({reducedMotion:'no-preference'});
    await p.evaluate(()=>JVAcoesVoz.executar());const r=await dados();assert.equal(r.eventos.length,1);assert.equal(r.saves,1);
    assert.ok(await p.locator('#voz-repetir').isVisible());assert.match(await p.locator('#voz-resultado').innerText(),/Horário agendado para Bruno Teste/);assert.match(await p.evaluate(()=>__faladas.at(-1)),/Horário agendado para Bruno Teste/);await visual(p,'voz-real-confirmacao-'+motor+'-'+theme);
    await p.locator('#voz-ouvir').uncheck();const falas=await p.evaluate(()=>__faladas.length);
    await p.locator('#voz-repetir').click();assert.equal(await p.evaluate(()=>__faladas.length),falas+1);assert.equal((await dados()).persist,1);
    await p.evaluate(()=>__utterances.at(-1).onstart());assert.equal(await p.locator('#voz-painel').getAttribute('data-falando'),'true');
    await p.evaluate(()=>JVAcoesVoz.fechar(true));
    await p.evaluate(()=>{__utterances.at(-1).onstart();__velha.onend();});
    assert.equal(await p.locator('#voz-painel').getAttribute('data-falando'),'false');assert.equal(await p.locator('#voz-atalho').getAttribute('data-ouvindo'),'false');
    await pedido('Agendar Bruno Teste amanhã às 19h');assert.equal(await p.locator('#voz-repetir').isHidden(),true);
    const n=await p.evaluate(()=>__faladas.length);await p.evaluate(()=>JVAcoesVoz.executar());assert.equal(await p.evaluate(()=>__faladas.length),n,'opção silenciosa respeitada');
    await p.locator('#voz-ouvir').check();
   });
   async function consultaBase(){
    await reset();await p.evaluate(()=>{
     DB.agenda={fixos:[
      {id:'q9',alunoId:'a1',titulo:'Título antigo',dia:4,hora:'09:00',tipo:'aula',desde:'2026-10-01'},
      {id:'qc',alunoId:'a1',titulo:'Ana Silva',dia:4,hora:'11:00',tipo:'aula',desde:'2026-10-01'},
      {id:'qexp',alunoId:'b1',titulo:'Bruno Teste',dia:4,hora:'08:00',tipo:'aula',desde:'2026-10-01',ate:'2026-10-14'},
      {id:'q14a',alunoId:'a1',titulo:'Ana Silva',dia:4,hora:'14:00',tipo:'grupo',pessoas:2,desde:'2026-10-01'},
      {id:'q14b',alunoId:'a2',titulo:'Ana Souza',dia:4,hora:'14:00',tipo:'grupo',pessoas:2,desde:'2026-10-01'},
      {id:'q16',alunoId:'b1',titulo:'Bruno Teste',dia:4,hora:'16:00',tipo:'aula',desde:'2026-10-01'},
      {id:'q18',alunoId:'b1',titulo:'Bruno Teste',dia:4,hora:'18:00',tipo:'personal',desde:'2026-10-01'},
      {id:'q19',alunoId:'a1',titulo:'Ana Silva',dia:4,hora:'19:00',tipo:'aula',desde:'2026-10-01'}
     ],eventos:[
      {id:'qdup',alunoId:'a1',titulo:'Título antigo',data:'2026-10-15',hora:'09:00',tipo:'aula'},
      {id:'qvisit',alunoId:null,titulo:'Visitante <img src=x onerror=window.__inj=1>',data:'2026-10-15',hora:'10:00',tipo:'aula'},
      {id:'qblocked',alunoId:'a1',titulo:'Ana Silva',data:'2026-10-15',hora:'13:00',tipo:'aula'},
      {id:'qblock',titulo:'Chuva',data:'2026-10-15',hora:'13:00',tipo:'bloqueio'},
      {id:'qloc',alunoId:'b1',titulo:'Bruno Teste',data:'2026-10-15',hora:'12:00',tipo:'locacao'},
      {id:'qtor',alunoId:'a1',titulo:'Ana Silva',data:'2026-10-15',hora:'15:00',tipo:'torneio'},
      {id:'qold',alunoId:'a1',titulo:'Ana Silva',data:'2026-10-15',hora:'19:30',tipo:'aula'}
     ],excecoes:[{fixoId:'qc',data:'2026-10-15'}]};
     DB.compromissos=[{id:'qcomp',titulo:'Treinamento particular fictício',data:'2026-10-15',hora:'17:00'}];
     __no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));renderAll();
    });
   }
   async function pergunta(texto){
    await p.locator('#voz-texto').fill(texto);await p.evaluate(()=>JVAcoesVoz.analisar());
   }
   await check(label+'interpreta os três exemplos de consulta, horário falado, amanhã e ambiguidade sem confundir com ações',async()=>{
    const rs=await p.evaluate(()=>[
     'Quantas aulas eu tenho hoje?','Quem são os alunos que vão ter aula no período da tarde?',
     'Qual é o aluno das 16 horas?','Quem tem aula às quatro da tarde?','Como está minha agenda amanhã?',
     'Quem tem aula das quatro?','Quantas aulas tenho hoje e cancela a Ana','Quem não tem aula hoje?',
     'Quem tem aula 16/10 e 17/10?','Quantas aulas tenho 31/02/2026?','Qual valor da aula?'
    ].map(t=>JVAcoesVoz.interpretar(t,DB.alunos,'2026-10-15')));
    assert.equal(rs[0].consulta,'quantidade');assert.equal(rs[0].data,'2026-10-15');assert.equal(rs[1].periodo,'tarde');
    assert.equal(rs[2].hora,'16:00');assert.equal(rs[3].hora,'16:00');assert.equal(rs[4].data,'2026-10-16');
    rs.slice(5,10).forEach(r=>assert.ok(r.erro,JSON.stringify(r)));
    assert.equal(rs[10].consulta,'precos','preço da aula agora é respondido (Claude, assistente em conversa)');
   });
   await check(label+'consulta do total bate com o Início: grupo é uma aula, duplicatas, canceladas, vencidas e bloqueios respeitados',async()=>{
    await consultaBase();await abrir();const a=await antes();await pergunta('Quantas aulas eu tenho hoje?');
    assert.match(await p.locator('#voz-consulta-resumo').innerText(),/6 aulas agendadas/);
    assert.equal(await p.locator('#voz-consulta-lista li').count(),6);
    assert.equal(await p.evaluate(()=>aulasDoDia(new Date('2026-10-15T12:00:00')).aulas.length),6);
    assert.match(await p.evaluate(()=>__faladas.at(-1)),/6 aulas agendadas/);
    assert.ok(await p.locator('#voz-confirmar').isHidden());assert.ok(await p.locator('#voz-campos').isHidden());
    assert.equal(await antes(),a);assert.equal((await dados()).persist,0);assert.equal((await dados()).saves,0);assert.equal(await p.evaluate(()=>__snapshots.length),0);
   });
   await check(label+'lista da tarde responde nomes e horários em voz, mostra duas pessoas na mesma turma e respeita limites de período',async()=>{
    await consultaBase();await abrir();await pergunta('Quem são os alunos que vão ter aula no período da tarde?');
    assert.equal(await p.locator('#voz-consulta-lista li').count(),2);
    const r=await p.locator('#voz-consulta-lista').innerText();assert.match(r,/14:00/);assert.match(r,/Ana Silva, Ana Souza/);assert.match(r,/16:00/);assert.match(r,/Bruno Teste/);assert.doesNotMatch(r,/18:00|09:00/);
    const fala=await p.evaluate(()=>__faladas.at(-1));assert.match(fala,/14:00/);assert.match(fala,/Ana Silva, Ana Souza/);
    await visual(p,'voz-consulta-tarde-'+motor+'-'+theme);
    await pergunta('Quem tem aula hoje de manhã?');assert.equal(await p.locator('#voz-consulta-lista li').count(),2);
    await pergunta('Quem tem aula hoje à noite?');assert.equal(await p.locator('#voz-consulta-lista li').count(),2);assert.match(await p.locator('#voz-consulta-lista').innerText(),/18:00/);
   });
   await check(label+'pergunta pelo aluno das 16h e turma das 14h responde cadastro atual e aula sobreposta sem repetir',async()=>{
    await consultaBase();await abrir();await pergunta('Qual é o aluno das 16 horas?');
    assert.match(await p.locator('#voz-consulta-resumo').innerText(),/aula particular com Bruno Teste/);assert.match(await p.evaluate(()=>__faladas.at(-1)),/Bruno Teste/);
    await visual(p,'voz-consulta-horario-'+motor+'-'+theme);
    await pergunta('Quem tem aula às 14 horas?');assert.match(await p.locator('#voz-consulta-resumo').innerText(),/aula em grupo com Ana Silva, Ana Souza/);
    await pergunta('Quem tem aula às nove da manhã?');assert.match(await p.locator('#voz-consulta-resumo').innerText(),/Ana Silva/);assert.doesNotMatch(await p.locator('#voz-consulta-resumo').innerText(),/Título antigo/);
    await pergunta('Quem tem aula às 19:30?');assert.equal(await p.locator('#voz-consulta-lista li').count(),1);assert.match(await p.locator('#voz-consulta-resumo').innerText(),/início às 19:00/);
   });
   await check(label+'horário vazio não é declarado livre; locação, torneio e bloqueio não viram aula, títulos não viram HTML',async()=>{
    await consultaBase();await abrir();
    for(const [hora,esperado] of [['07:00',/Não encontrei aula nem outra marcação/],['12:00',/locação: Bruno Teste/],['15:00',/torneio: Ana Silva/],['13:00',/horário está bloqueado/],['17:00',/compromisso pessoal/]]){
     await pergunta('Qual aluno às '+hora+'?');assert.match(await p.locator('#voz-consulta-resumo').innerText(),esperado);
    }
    await pergunta('Quem tem aula hoje de manhã?');assert.match(await p.locator('#voz-consulta-lista').innerText(),/<img src=x/);
    assert.equal(await p.locator('#voz-consulta img').count(),0);assert.equal(await p.evaluate(()=>window.__inj||0),0);
   });
   await check(label+'uma fala completa responde consulta com um toque; replay, silêncio e próxima ação preservam dados e confirmação',async()=>{
    await consultaBase();const a=await antes();await p.locator('#voz-atalho').click();
    await p.evaluate(()=>{__recs[0].emit('Qual é o aluno das 16 horas?',true);__recs[0].onend();});
    await p.waitForFunction(()=>!document.getElementById('voz-consulta').hidden);
    assert.match(await p.locator('#voz-repetir').innerText(),/Ouvir resposta/);
    await p.evaluate(()=>__utterances.at(-1).onstart());assert.equal(await p.locator('#voz-painel').getAttribute('data-falando'),'true');
    await p.locator('#voz-circulo').click();assert.equal(await p.locator('#voz-painel').getAttribute('data-falando'),'false');
    await p.locator('#voz-ouvir').uncheck();const n=await p.evaluate(()=>__faladas.length);
    await pergunta('Quantas aulas tenho hoje?');assert.equal(await p.evaluate(()=>__faladas.length),n);
    await p.locator('#voz-repetir').click();assert.equal(await p.evaluate(()=>__faladas.length),n+1);
    await p.evaluate(()=>JVAcoesVoz.executar());assert.equal(await antes(),a);assert.equal((await dados()).saves,0);assert.equal(await p.evaluate(()=>__snapshots.length),0);
    await p.locator('#voz-ouvir').check();await pergunta('Agendar Bruno Teste amanhã às 18h');
    assert.ok(await p.locator('#voz-consulta').isHidden());assert.ok(await p.locator('#voz-campos').isVisible());assert.ok(await p.locator('#voz-confirmar').isEnabled());
    assert.equal(await antes(),a);assert.equal((await dados()).persist,0);
   });
   await check(label+'consulta não responde agenda velha se leitura falha, há pendência ou conflito; limpa resposta anterior',async()=>{
    for(const modo of ['falha','pendente','conflito']){
     await consultaBase();await abrir();await pergunta('Quem tem aula hoje à tarde?');const n=await p.evaluate(()=>__faladas.length);
     await p.evaluate(m=>{if(m==='falha')__failRead=true;if(m==='pendente')cloudPending=true;if(m==='conflito')__no.config='{"mesCreditos":"2026-09"}';},modo);
     const a=await antes();await pergunta('Qual aluno das 16 horas?');
     assert.ok(await p.locator('#voz-consulta').isHidden());assert.ok(await p.locator('#voz-repetir').isHidden());assert.equal(await p.evaluate(()=>__faladas.length),n);
     assert.equal(await antes(),a);assert.equal((await dados()).persist,0);assert.equal(await p.evaluate(()=>__snapshots.length),0);assert.ok(await p.locator('#voz-confirmar').isDisabled());
    }
   });
   await check(label+'fechar durante consulta não recebe resposta tardia nem grava; consultas usam o dia de São Paulo',async()=>{
    await consultaBase();await abrir();await p.locator('#voz-texto').fill('Qual aluno das 16 horas?');
    await p.evaluate(()=>{__holdRead=true;window.__consulta=JVAcoesVoz.analisar();});await p.waitForFunction(()=>window.__releaseRead);
    await p.evaluate(()=>JVAcoesVoz.fechar(true));const n=await p.evaluate(()=>__faladas.length);
    await p.evaluate(async()=>{__holdRead=false;__releaseRead();await __consulta;});
    assert.equal(await p.evaluate(()=>__faladas.length),n);assert.ok(await p.locator('#voz-painel').isHidden());assert.equal((await dados()).persist,0);
    // Dia 16 em São Paulo, ainda dia 15 no aparelho simulado de Rio Branco.
    await p.clock.setFixedTime(new Date('2026-10-16T03:30:00Z'));await reset();await abrir();await pergunta('Quem tem aula hoje às 16 horas?');
    assert.match(await p.locator('#voz-consulta-resumo').innerText(),/16 de outubro/);assert.match(await p.locator('#voz-consulta-resumo').innerText(),/Ana Silva/);
    await p.clock.setFixedTime(AGORA);
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
   await check(label+'grade nova recusa agendar meia hora, mas voz cancela marcação antiga sem perder saldos',async()=>{
    await reset();await p.evaluate(()=>{
     DB.horarioData={'2026-10-16':{'14:00':'aula','14:30':'aula','19:30':'aula'}};
     __no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));
    });
    const a=await antes();await pedido('Agendar Bruno Teste amanhã às 14:30');
    assert.ok(await p.locator('#voz-confirmar').isDisabled());assert.match(await p.locator('#voz-status').innerText(),/aberto/);
    await p.locator('#voz-texto').fill('Agendar Bruno Teste amanhã às 19:30');await p.evaluate(()=>JVAcoesVoz.analisar());
    assert.ok(await p.locator('#voz-confirmar').isDisabled());assert.equal(await antes(),a);
    await p.locator('#voz-texto').fill('Agendar Bruno Teste amanhã às 14h');await p.evaluate(()=>JVAcoesVoz.analisar());
    assert.ok(await p.locator('#voz-confirmar').isEnabled());await p.evaluate(()=>JVAcoesVoz.executar());
    assert.equal((await dados()).eventos.length,1);assert.equal(await p.evaluate(()=>creditoSlot('14:00')),1);
    await reset();await p.evaluate(()=>{
     DB.agenda.eventos.push({id:'antiga-meia',alunoId:'a1',titulo:'Ana Silva',data:'2026-10-16',hora:'14:30',tipo:'aula'});
     __no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));
    });
    const saldos=await p.evaluate(()=>JSON.stringify(DB.alunos));await pedido('Cancelar Ana Silva amanhã às 14:30');
    assert.ok(await p.locator('#voz-confirmar').isEnabled());await p.evaluate(()=>JVAcoesVoz.executar());
    assert.equal((await dados()).eventos.length,0);assert.equal(await p.evaluate(()=>JSON.stringify(DB.alunos)),saldos);
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
    let r=await dados();assert.equal(r.eventos.length,1);assert.match(r.status,/pendente/);assert.doesNotMatch(r.status,/salvo na nuvem/);assert.ok(await p.locator('#voz-repetir').isHidden());assert.equal(await p.evaluate(()=>__faladas.some(x=>x.includes('Confirmado e salvo'))),false);
    await p.evaluate(()=>JVAcoesVoz.executar());assert.equal((await dados()).persist,1);
    await p.evaluate(()=>{__saveOk=true;});await p.locator('#voz-salvar').click();r=await dados();assert.equal(r.persist,1);assert.equal(r.saves,2);assert.match(r.status,/salvo na nuvem/);assert.ok(await p.locator('#voz-repetir').isVisible());assert.match(await p.evaluate(()=>__faladas.at(-1)),/salvo na nuvem/);
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

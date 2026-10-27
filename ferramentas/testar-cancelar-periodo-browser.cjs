/* Cancelar um período (viagem, folga) pelo assistente da Gestão — pedido do
   João em 27/10: "cancelar todas as aulas daquele dia ou semana, e não aluno
   por aluno". Entende o período falado, mostra a prévia com datas ajustáveis,
   cancela aula/grupo/personal (fixo vira exceção, avulsa sai), bloqueia os
   horários (locação e torneio continuam, ou fecha a quadra), não mexe em
   crédito, não conta como chuva, oferece avisar cada aluno pelo WhatsApp e
   desfaz tudo. Somente dados fictícios, nuvem simulada, relógio fixo. */
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
  const EVS=[{id:'e1',alunoId:'caio',titulo:'Caio Teste',data:'2026-10-15',hora:'20:00',tipo:'personal'},
    {id:'e2',alunoId:null,titulo:'Locação Fictícia',data:'2026-10-15',hora:'14:00',tipo:'locacao'},
    {id:'e3',alunoId:'bia',titulo:'Bia Teste',data:'2026-10-21',hora:'10:00',tipo:'aula'},
    {id:'e4',alunoId:null,titulo:'Locação Fictícia',data:'2026-10-22',hora:'14:00',tipo:'locacao'}];
  const resetP=async()=>{await reset();await p.evaluate(ev=>{DB.agenda.eventos=ev;DB.alunos.find(a=>a.id==='ana').tel='41999990001';
   __no=__baseNo();_basePartes=JSON.parse(JSON.stringify(__no));},EVS);};
  const interp=t=>p.evaluate(t=>{const i=JVAcoesVoz.interpretar(t,DB.alunos,'2026-10-15');return {acao:i.acao,ini:i.ini,fim:i.fim,fechar:i.fechar,erro:i.erro||''};},t);
  const saldo=()=>p.evaluate(()=>JSON.stringify(DB.alunos.map(a=>[a.id,a.creditos,a.credGrupo,a.repos])));

  await check('entende o período falado: intervalo, mês seguinte, semana, um dia, virada de mês e "fechar a quadra"',async()=>{
   await resetP();
   const casos=[
    ['Cancelar todas as aulas de 14 a 20 de novembro',{acao:'cancelarPeriodo',ini:'2026-11-14',fim:'2026-11-20',fechar:false}],
    ['Vou viajar, cancela tudo do dia 14 ao dia 20 de novembro',{acao:'cancelarPeriodo',ini:'2026-11-14',fim:'2026-11-20',fechar:false}],
    ['cancelar as aulas da semana que vem',{acao:'cancelarPeriodo',ini:'2026-10-19',fim:'2026-10-25',fechar:false}],
    ['cancelar todas as aulas de amanhã',{acao:'cancelarPeriodo',ini:'2026-10-16',fim:'2026-10-16',fechar:false}],
    ['cancelar todas as aulas de 28 de novembro a 3 de dezembro inclusive as locações',{acao:'cancelarPeriodo',ini:'2026-11-28',fim:'2026-12-03',fechar:true}],
    ['cancelar todas as aulas do dia 10 ao dia 12',{acao:'cancelarPeriodo',ini:'2026-11-10',fim:'2026-11-12',fechar:false}],
    ['cancelar todas as aulas de 14/11 a 20/11 e fechar a quadra',{acao:'cancelarPeriodo',ini:'2026-11-14',fim:'2026-11-20',fechar:true}],
    ['desfazer o cancelamento de 14 a 20 de novembro',{acao:'desfazerPeriodo',ini:'2026-11-14',fim:'2026-11-20'}]];
   for(const [t,esp] of casos){const r=await interp(t);for(const k of Object.keys(esp))assert.equal(r[k],esp[k],t+' → '+k+': '+JSON.stringify(r));}
   assert.equal((await interp('cancelar a aula da Ana amanhã às 9')).acao,'cancelar','com nome de aluno continua o cancelamento de uma aula');
   assert.match((await interp('cancelar todas as aulas da Ana amanhã')).erro,/vale para todos os alunos/);
   assert.match((await interp('cancelar todas as aulas de 14 a 20')).erro,/Diga o dia ou o período/,'"de 14 a 20" sem mês é hora, não data');
   assert.notEqual((await interp('quantas aulas foram canceladas na semana?')).acao,'cancelarPeriodo','pergunta não vira ação');
   assert.notEqual((await interp('cancelar todas as aulas de amanhã por chuva')).acao,'cancelarPeriodo','chuva continua com o fluxo de chuva');
  });
  await check('voz: "vou viajar, cancelar todas as aulas de 20 a 23 de outubro" mostra a prévia com cada dia e não muda nada antes de confirmar',async()=>{
   await resetP();await abrir();const a=await antes();
   await falar('Vou viajar, cancelar todas as aulas de 20 a 23 de outubro');
   await p.waitForFunction(()=>!document.getElementById('voz-confirmar').disabled);
   const prev=await p.locator('#voz-previa').innerText();
   assert.match(prev,/Cancelar período/);assert.match(prev,/8 aulas canceladas \(5 alunos\)/);
   assert.match(prev,/ter 20\/10: 18:00 Ana Teste/);assert.match(prev,/qua 21\/10: 10:00 Bia Teste/);
   assert.match(prev,/qui 22\/10: 07:00 Caio Teste \(personal\), 09:00 Ana Teste, 16:00 Bia Teste, 17:00 Duda Teste \(grupo\), 17:00 Edu Teste \(grupo\), 19:00 Ana Teste/);
   assert.match(prev,/Locação e torneio continuam \(1 marcação mantida\)/);assert.match(prev,/créditos não mudam/);
   assert.equal(await p.locator('#voz-confirmar').innerText(),'Cancelar 8 marcações');
   assert.equal(await p.locator('#voz-previa input[type=date]').count(),2,'De e Até para ajustar os dias');
   if(process.env.JV_SHOTS)await p.screenshot({path:path.join(process.env.JV_SHOTS,'voz-cancelar-periodo.png'),fullPage:true});
   assert.equal(await antes(),a);assert.equal(await p.evaluate(()=>__persist),0);
  });
  await check('confirmar: fixo vira exceção, avulsa sai, locação fica, horários bloqueados, créditos iguais, não é chuva',async()=>{
   const s0=await saldo();
   await p.locator('#voz-confirmar').click();
   await p.waitForFunction(()=>/Confirmado e salvo/.test(document.getElementById('voz-resultado').textContent));
   const r=await p.evaluate(()=>{
    const d22=new Date('2026-10-22T12:00:00');
    return {exc:DB.agenda.excecoes.map(x=>x.fixoId+'@'+x.data).sort(),ev:DB.agenda.eventos.filter(e=>e.tipo!=='bloqueio').map(e=>e.id).sort(),
     blocos:DB.agenda.eventos.filter(e=>e.tipo==='bloqueio'&&e.motivo==='fora').length,blocos22:DB.agenda.eventos.filter(e=>e.data==='2026-10-22'&&e.motivo==='fora').map(e=>e.hora),
     foras:(DB.foras||[]).length,chuvas:(DB.chuvas||[]).length,ehChuva:DB.agenda.eventos.some(ehEventoChuva),
     aula:podeAdicionarAoHorario(entriesFor(d22,'09:00'),'aula',2),loc:podeAdicionarAoHorario(entriesFor(d22,'09:00'),'locacao',2),
     pub:gradePublicaSegura({fixos:[],eventos:DB.agenda.eventos.filter(e=>e.motivo==='fora').slice(0,1),excecoes:[]}).eventos[0].tipo,
     snaps:__snapshots.length,resultado:document.getElementById('voz-resultado').textContent};});
   assert.deepEqual(r.exc,['f1@2026-10-22','f2@2026-10-22','f3@2026-10-22','f4@2026-10-22','f5@2026-10-22','f6@2026-10-22','f7@2026-10-20']);
   assert.deepEqual(r.ev,['e1','e2','e4'],'avulsa e3 saiu; locações ficaram');
   assert.ok(r.blocos>=4&&r.blocos22.includes('09:00')&&r.blocos22.includes('14:00'),'horários do período bloqueados');
   assert.equal(r.foras,1);assert.equal(r.chuvas,0);assert.equal(r.ehChuva,false,'não conta como chuva');
   assert.equal(r.aula,false,'ninguém marca aula no período');assert.equal(r.loc,true,'locação continua');
   assert.equal(r.pub,'bloqueio','o app do aluno vê "sem aula", sem nome');
   assert.equal(r.snaps,1,'versão anterior guardada antes de mudar');
   assert.match(r.resultado,/Cancelado de 20\/10 a 23\/10: 8 aulas; horários bloqueados/);
   assert.equal(await saldo(),s0,'créditos, grupo e reposições não mudam');
  });
  await check('depois de confirmar: um botão por aluno abre o WhatsApp com a mensagem pronta, sem valor nem desconto',async()=>{
   const r=await p.evaluate(()=>{window.__wa=[];window.open=u=>{__wa.push(decodeURIComponent(String(u).split('text=')[1]||''));return {};};
    const linhas=[...document.querySelectorAll('#voz-conversa .jv-voz-cobrar')];
    const rows=linhas.map(x=>x.innerText.replace(/\s+/g,' ').trim());
    const ana=linhas.find(x=>/Ana Teste/.test(x.innerText));ana.querySelector('button').click();
    return {rows,wa:__wa,btn:ana.querySelector('button').textContent};});
   assert.equal(r.rows.length,5,r.rows.join(' | '));assert.ok(r.rows.some(x=>/Ana Teste · 3 aulas Avisar/.test(x)),r.rows.join(' | '));
   assert.ok(r.rows.some(x=>/Caio Teste · 1 aula Sem WhatsApp/.test(x)),'sem telefone: botão desligado');
   assert.equal(r.wa.length,1);assert.equal(r.btn,'Aberto ✓');
   assert.match(r.wa[0],/^Olá, Ana! Aqui é o João, da Academia JV Tênis\. De 20\/10 a 23\/10 vou estar fora, então as aulas de terça 20\/10 às 18:00, quinta 22\/10 às 09:00 e quinta 22\/10 às 19:00 estão canceladas\. Você não perde essas aulas: o crédito continua com você\./);
   assert.doesNotMatch(r.wa[0],/R\$|desconto|640/i);
  });
  await check('consulta "aulas desmarcadas" mostra o motivo "professor fora"',async()=>{
   await falar('Quais aulas foram desmarcadas na semana que vem?');
   assert.match(await p.locator('#voz-consulta-lista').innerText(),/professor fora/);
  });
  await check('voz: "desfazer o cancelamento de 20 a 23 de outubro" devolve aulas, tira os bloqueios e não mexe em crédito',async()=>{
   const s0=await saldo();
   await falar('desfazer o cancelamento de 20 a 23 de outubro');
   await p.waitForFunction(()=>!document.getElementById('voz-confirmar').disabled);
   assert.match(await p.locator('#voz-previa').innerText(),/8 aulas voltam e \d+ bloqueios saem/);
   await p.locator('#voz-confirmar').click();
   await p.waitForFunction(()=>/Confirmado e salvo/.test(document.getElementById('voz-resultado').textContent));
   const r=await p.evaluate(()=>({exc:DB.agenda.excecoes.length,ev:DB.agenda.eventos.map(e=>e.id).sort(),foras:(DB.foras||[]).length}));
   assert.equal(r.exc,0);assert.deepEqual(r.ev,['e1','e2','e3','e4']);assert.equal(r.foras,0);
   assert.equal(await saldo(),s0);
  });
  await check('"fechar a quadra": locação também sai e o dia fica Fechado; desfazer volta o funcionamento de antes',async()=>{
   await resetP();
   const r=await p.evaluate(()=>{
    const plano=planoCancelarPeriodo('2026-10-22','2026-10-22',true);aplicarCancelarPeriodo(plano);
    const d=new Date('2026-10-22T12:00:00'),fechado=HORAS_GRADE.every(h=>slotModo(d,h)==='fechado'),loc=DB.agenda.eventos.some(e=>e.id==='e4');
    const ida={nLocs:plano.nLocs,nAulas:plano.nAulas,fechado,loc,hd:!!(DB.horarioData||{})['2026-10-22']};
    aplicarDesfazerPeriodo(planoDesfazerPeriodo('2026-10-22','2026-10-22'));
    return {ida,volta:{hd:!!(DB.horarioData||{})['2026-10-22'],loc:DB.agenda.eventos.some(e=>e.id==='e4'),aberto:slotModo(d,'09:00')!=='fechado'}};
   });
   assert.deepEqual(r.ida,{nLocs:1,nAulas:6,fechado:true,loc:false,hd:true});
   assert.deepEqual(r.volta,{hd:false,loc:true,aberto:true});
  });
  await check('desfazer não põe aula em cima de locação marcada depois: ela fica cancelada e aparece na prévia',async()=>{
   await resetP();
   const r=await p.evaluate(()=>{
    aplicarCancelarPeriodo(planoCancelarPeriodo('2026-10-21','2026-10-22',false));
    DB.agenda.eventos.push({id:'e9',alunoId:null,titulo:'Locação Nova',data:'2026-10-22',hora:'09:00',tipo:'locacao'},
     {id:'e8',alunoId:null,titulo:'Locação Nova',data:'2026-10-21',hora:'10:00',tipo:'locacao'});
    const pl=planoDesfazerPeriodo('2026-10-21','2026-10-22');aplicarDesfazerPeriodo(pl);
    return {conf:pl.conflitos,exc:DB.agenda.excecoes.map(x=>x.fixoId+'@'+x.data),e3:DB.agenda.eventos.some(e=>e.id==='e3'),
     blocos:DB.agenda.eventos.filter(ehBloqueioFora).length,locs:DB.agenda.eventos.filter(e=>e.id==='e8'||e.id==='e9').length};});
   assert.deepEqual(r.conf.sort(),['2026-10-21 10:00 Bia Teste','2026-10-22 09:00 Ana Teste']);
   assert.deepEqual(r.exc,['f2@2026-10-22'],'a fixa das 09:00 continua cancelada nesse dia; as outras voltam');
   assert.equal(r.e3,false,'a avulsa não volta em cima da locação');
   assert.equal(r.blocos,0);assert.equal(r.locs,2,'as locações novas ficam');
  });
  await check('hoje vale só daqui para a frente; período passado e longo demais são recusados',async()=>{
   await resetP();
   const r=await p.evaluate(()=>{const pl=planoCancelarPeriodo('2026-10-15','2026-10-15',false);
    const err=f=>{try{f();return '';}catch(e){return e.message;}};
    return {horas:pl.dias[0].itens.map(x=>x.hora),manteve:pl.nMantidas,
     passado:err(()=>planoCancelarPeriodo('2026-10-01','2026-10-10',false)),longo:err(()=>planoCancelarPeriodo('2026-10-16','2027-01-31',false))};});
   assert.deepEqual(r.horas,['16:00','17:00','17:00','19:00','20:00'],'07:00 e 09:00 já passaram (são 13:04)');
   assert.equal(r.manteve,1,'a locação das 14:00 continua');
   assert.match(r.passado,/já passou/);assert.match(r.longo,/até 2 meses/);
  });
  assert.deepEqual(errors,[]);
  console.log('\n✅ '+count+' verificações · cancelar período pelo assistente');
 }catch(e){console.error('❌ '+(e.stack||e));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

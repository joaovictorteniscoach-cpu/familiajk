/* Locação na agenda e "Minhas aulas" no app do aluno. Só dados fictícios,
   nuvem simulada, relógio fixo.
   Gestão: escolher o cliente no horário não troca mais Locação por "aula"
   (antes o horário "só locação" recusava e, no horário de aula, a locação era
   gravada como aula e o ✓ descontava do pacote); o pedido de locação do app
   chega como "pediu locação" e abre o horário preenchido sem gravar nada; a
   conferência lista cliente de locação com aula descontada, sem alterar.
   Aluno: horas de locação no botão e na mensagem; aba "Minhas aulas" na barra
   de baixo e botão laranja no Início, com a página dividida em abas. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-15T10:00:00-03:00');   // quinta-feira
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
async function contexto(browser,base,opts){
 const c=await browser.newContext(Object.assign({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'},opts||{}));
 await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
 return c;
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  /* ================= Gestão ================= */
  const cg=await contexto(browser,base);
  const g=await cg.newPage(),errosG=[];g.on('pageerror',e=>errosG.push(e.message));g.on('dialog',d=>d.accept());
  await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
  const resetG=()=>g.evaluate(()=>{
   const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',ativo:true,plano:4,planoGrupo:0,creditos:4,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago'},x||{});
   DB.alunos=[al('cli','Cliente Locação',{perfil:'locacao',plano:0,creditos:0,locCred:3,mensalidade:0}),al('ana','Ana Teste',{locCred:2}),
    al('caio','Caio Teste',{tipo:'Personal'}),al('duda','Duda Teste',{tipo:'Dupla',plano:0,planoGrupo:4,credGrupo:4})];
   DB.agenda={fixos:[],eventos:[],excecoes:[]};DB.presencas=[];DB.movs=[];DB.horarioData={};
   ensureFields();MODO='dono';window._espacoAberto=true;
   persist=()=>{};publish=()=>{};publicarMapaQuadra=()=>{};window.__t=[];toast=m=>__t.push(m);
   document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
   renderAll();
  });
  const QUI=new Date('2026-10-15T12:00:00');
  // escolhe (na ordem dada) tipo e aluno no formulário do horário e salva
  const lancar=(hora,passos)=>g.evaluate(({hora,passos})=>{
   agDate=new Date('2026-10-15T12:00:00');openSlot(hora);
   for(const [campo,v] of passos){if(campo==='tipo'){document.getElementById('s-tipo').value=v;toggleGrupoWrap();}else{document.getElementById('s-aluno').value=v;slotPickAluno();}}
   const tipo=document.getElementById('s-tipo').value;document.getElementById('s-rec').value='pontual';__t.length=0;saveSlot();closeSlot();
   const id=passos.find(x=>x[0]==='aluno')[1],ev=DB.agenda.eventos.find(e=>e.alunoId===id&&e.hora===hora);
   return {tipoNoForm:tipo,salvo:ev?ev.tipo:null,evId:ev?ev.id:null,toast:__t.slice()};
  },{hora,passos});

  await check('Gestão: Locação escolhida antes do cliente continua Locação (horário "só locação" aceita; ✓ desconta horas de locação)',async()=>{
   await resetG();
   const r=await lancar('14:00',[['tipo','locacao'],['aluno','cli']]);
   assert.equal(await g.evaluate(()=>slotModo(new Date('2026-10-15T12:00:00'),'14:00')),'loc');
   assert.equal(r.tipoNoForm,'locacao');assert.equal(r.salvo,'locacao',JSON.stringify(r.toast));
   const d=await g.evaluate(id=>{agDate=new Date('2026-10-15T12:00:00');togglePresenca(id);const a=DB.alunos.find(x=>x.id==='cli');return {loc:a.locCred,cred:a.creditos,pres:DB.presencas.map(p=>p.tipo)};},r.evId);
   assert.deepEqual(d,{loc:2,cred:0,pres:['locacao']},'desconta das horas de locação, não do pacote');
   const r2=await lancar('09:00',[['tipo','locacao'],['aluno','ana']]);
   assert.equal(r2.salvo,'locacao','aluno comum em horário de aula também mantém Locação');
  });
  await check('Gestão: o tipo vem certo ao escolher o cliente (perfil Locação, horário só locação, personal, dupla, aula)',async()=>{
   await resetG();
   const r=await g.evaluate(()=>{const tipo=(hora,id)=>{agDate=new Date('2026-10-15T12:00:00');openSlot(hora);document.getElementById('s-aluno').value=id;slotPickAluno();const t=document.getElementById('s-tipo').value;closeSlot();return t;};
    return {cliAula:tipo('09:00','cli'),anaLoc:tipo('14:00','ana'),anaAula:tipo('09:00','ana'),caio:tipo('09:00','caio'),duda:tipo('17:00','duda'),
     opcao:(()=>{agDate=new Date('2026-10-15T12:00:00');openSlot('09:00');const o=[...document.querySelectorAll('#s-aluno option')].map(x=>x.textContent);closeSlot();return o;})()};});
   assert.equal(r.cliAula,'locacao','cliente cadastrado como Locação');assert.equal(r.anaLoc,'locacao','horário só locação');
   assert.equal(r.anaAula,'aula');assert.equal(r.caio,'personal');assert.equal(r.duda,'grupo');
   assert.ok(r.opcao.some(t=>/Cliente Locação \(0 créd\. · 3h locação\)/.test(t)),r.opcao.join(' | '));
   assert.ok(r.opcao.some(t=>/^Caio Teste \(4 créd\.\)$/.test(t)),'sem horas de locação não muda o texto');
   const neg=await lancar('14:00',[['aluno','ana'],['tipo','aula']]);
   assert.equal(neg.salvo,null,'aula em horário só locação continua recusada');assert.match(neg.toast.join(' '),/só locação neste dia/);
  });
  await check('Gestão: pedido de locação do app aparece como "pediu locação" e abre o horário preenchido, sem gravar nada',async()=>{
   await resetG();
   const r=await g.evaluate(()=>{
    NOTIF=[{acao:'pediu locação 1h30',nome:'Ana Teste',codigo:'ana',data:'2026-10-16',hora:'14:00',tipo:'aula',ts:Date.now()},
     {acao:'cancelou',nome:'Caio Teste',codigo:'caio',data:'2026-10-16',hora:'09:00',tipo:'personal',ts:Date.now()-1}];
    const antes=JSON.stringify(DB);const txt=NOTIF.map(textoNotif);
    irDoAviso(0);
    return {txt,antes,depois:JSON.stringify(DB),aberto:document.getElementById('ov-slot').classList.contains('on'),
     aluno:document.getElementById('s-aluno').value,tipo:document.getElementById('s-tipo').value,rec:document.getElementById('s-rec').value,
     titulo:document.getElementById('slot-title').textContent,toast:__t.slice()};});
   assert.equal(r.txt[0],'🔑 Ana Teste pediu locação (1h30) — 16/10 14:00 · toque para lançar na agenda');
   assert.equal(r.txt[1],'Caio Teste cancelou ❌ — Personal · 16/10 09:00','os outros avisos não mudam');
   assert.equal(r.aberto,true);assert.equal(r.aluno,'ana');assert.equal(r.tipo,'locacao');assert.equal(r.rec,'pontual');assert.match(r.titulo,/16\/10 · 14:00/);
   assert.equal(r.depois,r.antes,'só abre o formulário: nada é gravado');assert.match(r.toast.join(' '),/Confira e toque em Adicionar/);
   await g.evaluate(()=>closeSlot());
  });
  await check('Gestão: Conferir números lista cliente de locação com aula descontada do pacote, sem alterar nada',async()=>{
   await resetG();
   const r=await g.evaluate(()=>{
    DB.agenda.eventos.push({id:'e9',data:'2026-10-20',hora:'09:00',titulo:'Cliente Locação',tipo:'aula',alunoId:'cli'});
    DB.presencas.push({k:'2026-10-08|09:00|cli',alunoId:'cli',data:'2026-10-08',hora:'09:00',tipo:'aula',custo:1});
    const antes=JSON.stringify(DB),cli=achadosDoAluno(DB.alunos.find(a=>a.id==='cli')).map(x=>x.txt),ana=achadosDoAluno(DB.alunos.find(a=>a.id==='ana')).map(x=>x.txt);
    return {cli,ana,igual:JSON.stringify(DB)===antes};});
   assert.ok(r.cli.some(t=>/Cliente Locação é cliente de locação, mas tem 1 aula\(s\) com ✓ descontada\(s\) do pacote \(08\/10 09:00\) e 1 marcação\(ões\) futura\(s\) como aula/.test(t)),r.cli.join(' | '));
   assert.ok(!r.ana.some(t=>/cliente de locação/.test(t)),'aluna com plano de aulas não entra');
   assert.equal(r.igual,true,'conferência só lista');
  });
  await check('Gestão: almoço e compromisso do João só tiram a aula — locação e torneio entram; chuva continua bloqueando tudo',async()=>{
   await resetG();
   const r=await g.evaluate(()=>{
    DB.agenda.eventos.push({id:'alm',data:'2026-10-15',hora:'10:00',titulo:'ALMOÇO',tipo:'bloqueio',alunoId:null},
     {id:'pes',data:'2026-10-15',hora:'11:00',titulo:'Compromisso',tipo:'pessoal',alunoId:null},
     {id:'chv',data:'2026-10-15',hora:'09:00',titulo:'☔ Chuva',tipo:'bloqueio',motivo:'chuva',alunoId:null});
    DB.compromissos=[{id:'c1',data:'2026-10-15',hora:'16:00',titulo:'Dentista'}];
    const lanc=(hora,id,tipo)=>{agDate=new Date('2026-10-15T12:00:00');openSlot(hora);document.getElementById('s-aluno').value=id;slotPickAluno();
     document.getElementById('s-tipo').value=tipo;toggleGrupoWrap();document.getElementById('s-rec').value='pontual';__t.length=0;saveSlot();closeSlot();
     return {ok:DB.agenda.eventos.some(e=>e.alunoId===id&&e.hora===hora&&e.tipo===tipo),t:__t.join(' ')};};
    const ana=DB.alunos.find(a=>a.id==='ana'),ped=(hora,x)=>pedidoAgendaValido(Object.assign({data:'2026-10-15',hora,rec:'pontual'},x||{}),ana);
    // pedidos do app conferidos antes de lançar qualquer coisa nos horários
    const peds={pedTor:ped('10:00',{tor:1}),pedAula:ped('10:00'),pedTorChuva:ped('09:00',{tor:1}),pedAulaCompromisso:ped('16:00')};
    return {...peds,locAlmoco:lanc('10:00','cli','locacao'),torPessoal:lanc('11:00','ana','torneio'),torCompromisso:lanc('16:00','duda','torneio'),
     aulaAlmoco:lanc('10:00','caio','personal'),locChuva:lanc('09:00','cli','locacao'),
     pub:gradePublicaSegura(DB.agenda).eventos.map(e=>e.id+':'+e.tipo+(e.motivo?'/'+e.motivo:'')),
     fora:aulasDoDia(new Date('2026-10-15T12:00:00')).fora.map(x=>x.hora+' '+x.e.tipo)};});
   assert.equal(r.locAlmoco.ok,true,'locação no horário do almoço: '+r.locAlmoco.t);
   assert.equal(r.torPessoal.ok,true,'torneio no compromisso pessoal: '+r.torPessoal.t);
   assert.equal(r.torCompromisso.ok,true,'torneio no compromisso da agenda: '+r.torCompromisso.t);
   assert.equal(r.aulaAlmoco.ok,false,'aula com o João no almoço continua recusada');assert.match(r.aulaAlmoco.t,/Horário reservado/);
   assert.equal(r.locChuva.ok,false,'chuva bloqueia a locação');
   assert.equal(r.pedTor,true,'pedido de torneio do app no almoço é aceito');assert.equal(r.pedAula,false,'pedido de aula no almoço, não');
   assert.equal(r.pedTorChuva,false);assert.equal(r.pedAulaCompromisso,false,'compromisso do João recusa aula');
   assert.ok(r.pub.includes('alm:bloqueio')&&r.pub.includes('pes:bloqueio')&&r.pub.includes('chv:bloqueio/chuva'),r.pub.join(' '));
   assert.ok(r.fora.includes('10:00 locacao'),'locação no almoço aparece na conferência do dia: '+r.fora.join(', '));
  });
  assert.deepEqual(errosG,[]);

  /* ================= App do aluno ================= */
  const eu={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:1,locCred:2,mensalidade:640,status:'pago',ativo:true};
  const fixture={grade:{fixos:[{id:'f1',cod:'6601',dia:5,hora:'16:00',tipo:'aula',desde:'2026-10-01'}],eventos:[
   {id:'e1',cod:'6601',data:'2026-10-15',hora:'14:00',tipo:'aula'},{id:'e3',cod:'6601',data:'2026-10-20',hora:'11:00',tipo:'aula'},
   {id:'nov',cod:'6601',data:'2026-11-05',hora:'17:00',tipo:'aula'}],excecoes:[{fixoId:'f1',data:'2026-10-23'}]},
   historico:{'6601':[{data:'2026-10-02',hora:'16:00'},{data:'2026-10-07',hora:'15:00'},{data:'2026-10-09',hora:'16:00'},{data:'2026-09-30',hora:'09:00'}]},
   horas:['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'],profs:[],horarioCfg:{},horarioData:{},termoVer:0,precos:{locacao:70},alunos:[eu]};
  for(const tema of ['saibro','classico']){
   const ca=await contexto(browser,base);await ca.addInitScript(t=>localStorage.setItem('jv-tema',t),tema);
   const p=await ca.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.accept());
   await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof aulasAgendadasAluno==='function');
   await p.addStyleTag({content:'#toast,#feriado-box,#login{display:none!important}'});
   const resetA=(extra)=>p.evaluate(({fixture,eu,extra})=>{
    init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-test';
    EU=Object.assign(JSON.parse(JSON.stringify(eu)),extra||{});PUB=JSON.parse(JSON.stringify(fixture));PUB.alunos=[EU];
    MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[]};window.__reservas=[];window.fbDB={ref:()=>({push:async()=>{},update:async u=>{__reservas.push(u);}})};
    atualizarGradeReserva=async()=>{};saveMeu=async()=>{};window.__avisos=[];window.__zap=[];
    notificarJoao=(acao,dk,hora)=>__avisos.push([acao,dk,hora]);abrirWhatsApp=(n,t)=>__zap.push(t);
    agDate=new Date();agView='dia';VINCULO_ESTADO='ativo';
    document.getElementById('app').style.display='block';document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');render();goAluno('inicio',document.getElementById('nav-al-inicio'));
   },{fixture,eu,extra});
   await check(tema+': Alugar a quadra mostra as horas de locação e a mensagem pede para usá-las',async()=>{
    await resetA();
    await p.evaluate(()=>{agDate=new Date('2026-10-15T12:00:00');escolherSlot('17:00');});
    assert.match(await p.locator('#pick-opts').innerText(),/Alugar a quadra\s*usa suas horas de locação · você tem 2h/);
    await p.evaluate(()=>pickLoc());assert.match(await p.locator('#locdur-sub').innerText(),/você tem 2h de locação/);
    assert.match(await p.locator('#locdur-preco').innerText(),/1h · das suas horas de locação/);
    await p.evaluate(()=>confirmarLocacao());await p.waitForTimeout(400);
    const r=await p.evaluate(()=>({avisos:__avisos,zap:__zap}));
    assert.deepEqual(r.avisos,[['pediu locação 1h','2026-10-15','17:00']]);
    assert.match(r.zap[0],/por \*1h\*, usando minhas horas de locação \(tenho 2h\)\. Pode confirmar/);
    await resetA({locCred:0});await p.evaluate(()=>{agDate=new Date('2026-10-15T12:00:00');escolherSlot('17:00');});
    assert.match(await p.locator('#pick-opts').innerText(),/Alugar a quadra\s*locação · R\$\s?70\/h/,'sem saldo: continua o preço por hora');
    await p.evaluate(()=>{document.getElementById('ov-pick').classList.remove('on');});
   });
   await check(tema+': "Minhas aulas" na barra de baixo e no botão laranja do Início, com feitas e marcadas do mês',async()=>{
    await resetA();
    const nav=await p.locator('.nav button').allInnerTexts();
    assert.deepEqual(nav.map(t=>t.replace(/\s+/g,' ').trim()),['Início','Agenda','Minhas aulas','Evolução','Créditos','Perfil']);
    const bt=p.locator('#home-minhas-aulas');assert.equal(await bt.isVisible(),true);
    assert.match(await bt.innerText(),/Minhas aulas\s*3 feitas · 4 marcadas em outubro/);
    const cor=await bt.evaluate(e=>getComputedStyle(e).backgroundColor);assert.equal(cor,'rgb(194, 88, 46)','botão laranja');
    assert.match(await p.locator('#apg-inicio .jv-home-card').nth(2).innerText(),/Próxima aula ›/);
    if(process.env.JV_SHOTS)await p.screenshot({path:path.join(process.env.JV_SHOTS,'aluno-inicio-'+tema+'.png')});
    await bt.click();
    const r=await p.evaluate(()=>({pag:document.querySelector('#app .page.on').id,nav:document.querySelector('.nav button.on').id,
     resumo:document.getElementById('aulas-mes-resumo').innerText,hero:document.querySelector('#apg-aulas .mau-hero').innerText}));
    assert.equal(r.pag,'apg-aulas');assert.equal(r.nav,'nav-al-aulas');assert.match(r.hero,/Minhas aulas\s*As aulas que você já fez e as que ainda vai fazer em outubro/);
    for(const d of ['02/10','07/10','09/10','15/10','16/10','20/10','30/10'])assert.match(r.resumo,new RegExp(d.replace('/','\\/')));
    assert.doesNotMatch(r.resumo,/30\/09|05\/11|23\/10/,'só o mês, sem a semana cancelada');
    assert.equal(await p.locator('#apg-aulas .amr-dias').first().evaluate(e=>e.scrollHeight<=e.clientHeight+1),true,'lista inteira, sem rolagem escondida');
    await p.evaluate(()=>goAluno('inicio',document.getElementById('nav-al-inicio')));await p.locator('#nav-al-aulas').click();
    assert.equal(await p.evaluate(()=>document.getElementById('apg-aulas').classList.contains('on')),true,'pela barra de baixo');
    await p.evaluate(()=>goAluno('perfil',document.getElementById('nav-al-perfil')));
    await p.locator('#apg-perfil .jv-quick button',{hasText:'Minhas aulas'}).click();
    assert.equal(await p.evaluate(()=>document.querySelector('.nav button.on').id),'nav-al-aulas','pelo Perfil também acende a aba certa');
    await p.evaluate(()=>goAluno('torneio',null));assert.equal(await p.evaluate(()=>document.querySelector('.nav button.on').id),'nav-al-perfil','Torneio continua no Perfil');
   });
   await check(tema+': Minhas aulas dividida em abas (Resumo do mês, Próximas, Feitas), uma de cada vez, sem rolagem longa',async()=>{
    await resetA();await p.locator('#home-minhas-aulas').click();
    const estado=()=>p.evaluate(()=>({sel:[...document.querySelectorAll('#apg-aulas .mau-tabs [role=tab]')].filter(t=>t.getAttribute('aria-selected')==='true').map(t=>t.id),
     vis:['mes','prox','feitas'].filter(k=>document.getElementById('mau-painel-'+k).getClientRects().length),altura:document.documentElement.scrollHeight}));
    const tabs=(await p.locator('#apg-aulas .mau-tabs [role=tab]').allInnerTexts()).map(t=>t.replace(/\s+/g,' ').trim());
    assert.deepEqual(tabs,['Resumo do mês','Próximas (7)','Feitas (3)']);
    let e=await estado();assert.deepEqual(e.sel,['mau-tab-mes']);assert.deepEqual(e.vis,['mes'],'abre no resumo do mês');
    const alturaMes=e.altura;
    await p.locator('#mau-tab-prox').click();e=await estado();assert.deepEqual(e.vis,['prox']);
    assert.equal(await p.locator('#mine-list .mine-item').count(),7);assert.equal(await p.locator('#mine-list .aul-confirm').first().isVisible(),true);
    assert.equal(await p.locator('#aul-cal-abrir').isVisible(),true);
    await p.locator('#mau-tab-feitas').click();e=await estado();assert.deepEqual(e.vis,['feitas']);
    assert.match(await p.locator('#hist-list').innerText(),/02\/10[\s\S]*07\/10[\s\S]*09\/10|09\/10[\s\S]*07\/10[\s\S]*02\/10/);
    await p.locator('#mau-tab-mes').click();await p.locator('#mau-painel-mes .mau-ir').click();
    assert.deepEqual((await estado()).vis,['prox'],'atalho do resumo leva às próximas');
    await p.evaluate(()=>goAluno('inicio',document.getElementById('nav-al-inicio')));
    await p.locator('#apg-inicio .jv-home-card',{hasText:'Próxima aula'}).click();
    assert.deepEqual((await estado()).vis,['prox'],'cartão "Próxima aula" abre direto as próximas');
    await p.locator('#nav-al-aulas').click();assert.deepEqual((await estado()).vis,['mes'],'barra de baixo volta ao resumo');
    const r=await p.evaluate(()=>{const al=[];for(const k of ['mes','prox','feitas']){abaMinhasAulas(k);al.push(document.documentElement.scrollHeight);}abaMinhasAulas('mes');return al;});
    assert.equal(r[0],alturaMes);assert.ok(r.every(h=>h<2600),'nenhuma aba vira rolagem longa: '+r.join(', '));
    if(process.env.JV_SHOTS)for(const k of ['mes','prox','feitas']){await p.evaluate(k=>abaMinhasAulas(k),k);await p.screenshot({path:path.join(process.env.JV_SHOTS,'aluno-aba-'+k+'-'+tema+'.png')});}
   });
   await check(tema+': almoço/compromisso do João: aluno não marca aula, mas aluga a quadra ou marca jogo do torneio; chuva bloqueia tudo',async()=>{
    await resetA();
    await p.evaluate(()=>{PUB.grade.eventos.push({id:'alm',data:'2026-10-15',hora:'12:00',tipo:'bloqueio'},{id:'k1',data:'2026-10-15',hora:'17:00',tipo:'bloqueio'},
     {id:'pes',data:'2026-10-15',hora:'18:00',tipo:'pessoal'},{id:'chv',data:'2026-10-15',hora:'19:00',tipo:'bloqueio',motivo:'chuva'});
     PUB.horarioData={'2026-10-15':{'17:00':'aula','18:00':'aula','19:00':'aula'}};agDate=new Date('2026-10-15T12:00:00');renderAgenda();});
    const st=await p.evaluate(()=>['12:00','17:00','18:00','19:00'].map(h=>{const s=slotState(new Date('2026-10-15T12:00:00'),h);return h+' '+s.st+(s.semAula?' semAula':'');}));
    assert.deepEqual(st,['12:00 loc semAula','17:00 loc semAula','18:00 loc semAula','19:00 chuva']);
    await p.evaluate(()=>{agDate=new Date('2026-10-15T12:00:00');escolherSlot('17:00');});
    const op=await p.locator('#pick-opts').innerText();
    assert.match(op,/o João não dá aula, mas a quadra está livre para locação ou jogo do torneio/);assert.match(op,/Alugar a quadra/);assert.match(op,/Reservar para o torneio/);
    assert.doesNotMatch(op,/Agendar aula|Marcar reposição/,'sem opção de aula');
    await p.evaluate(()=>{document.getElementById('ov-pick').classList.remove('on');abrirBook('17:00',false);});
    assert.equal(await p.evaluate(()=>document.getElementById('ov-book').classList.contains('on')),false,'aula recusada');
    await p.evaluate(()=>{agDate=new Date('2026-10-15T12:00:00');escolherSlot('17:00');pickTorneio();});
    assert.equal(await p.evaluate(()=>document.getElementById('ov-book').classList.contains('on')),true,'torneio abre a reserva');
    await p.evaluate(()=>confirmarAgendamento());await p.waitForTimeout(400);
    const env=await p.evaluate(()=>__reservas.map(u=>Object.values(u).map(x=>x.data+' '+x.hora+' tor='+x.tor)).flat());
    assert.deepEqual(env,['2026-10-15 17:00 tor=1']);
    await p.evaluate(()=>{agDate=new Date('2026-10-15T12:00:00');escolherSlot('18:00');pickLoc();confirmarLocacao();});await p.waitForTimeout(300);
    assert.deepEqual(await p.evaluate(()=>__avisos.map(a=>a.join(' '))),['marcou jogo do torneio 2026-10-15 17:00','pediu locação 1h 2026-10-15 18:00'],'torneio e locação chegam ao João');
    await p.evaluate(()=>{document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));agDate=new Date('2026-10-15T12:00:00');escolherSlot('19:00');});
    assert.equal(await p.evaluate(()=>document.getElementById('ov-pick').classList.contains('on')),false,'chuva: nada abre');
    await p.evaluate(()=>{agView='dia';agDate=new Date('2026-10-15T12:00:00');renderAgenda();});
    assert.match(await p.locator('#ag-view').innerText(),/Sem aula · locação ou torneio/);
   });
   await check(tema+': barra de baixo com 6 botões cabe no celular pequeno e no computador (toque ≥ 44 px, sem rolagem lateral)',async()=>{
    for(const width of [320,390,1280]){
     await p.setViewportSize({width,height:844});await resetA();await p.waitForTimeout(80);
     const r=await p.evaluate(()=>{const bs=[...document.querySelectorAll('.nav button')];return {lateral:document.documentElement.scrollWidth>innerWidth+1,
      altura:Math.min(...bs.map(b=>b.getBoundingClientRect().height)),largura:Math.min(...bs.map(b=>b.getBoundingClientRect().width)),
      cabe:bs.every(b=>b.scrollWidth<=b.clientWidth+1),home:document.getElementById('home-minhas-aulas').getBoundingClientRect().height};});
     assert.equal(r.lateral,false,'lateral '+width);assert.ok(r.altura>=44,'altura '+width+': '+r.altura);assert.ok(r.largura>=44,'largura '+width+': '+r.largura);
     assert.equal(r.cabe,true,'texto cabe no botão '+width);assert.ok(r.home>=48,'botão do Início '+width);
     if(process.env.JV_SHOTS&&width===320){await p.locator('#nav-al-aulas').click();await p.screenshot({path:path.join(process.env.JV_SHOTS,'aluno-aulas-320-'+tema+'.png')});}
    }
    await p.setViewportSize({width:390,height:844});
   });
   assert.deepEqual(erros,[]);
   await ca.close();
  }
  console.log('\n✅ '+count+' verificações · locação na agenda e Minhas aulas');
 }catch(e){console.error('❌ '+(e.stack||e));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

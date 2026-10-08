/* Aulas do aluno, prazo de quatro horas e exportação mensal. Só dados fictícios.
   Rede externa bloqueada; filas simuladas com erro e atraso. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-15T10:00:00-03:00');
const server=http.createServer((req,res)=>{
 const f=path.join(root,decodeURI(req.url.split('?')[0]),req.url.split('?')[0].endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let checks=0;
async function check(n,fn){await fn();checks++;console.log('✅ '+n);}
async function visual(p,nome){
 const png=await p.screenshot();
 if(process.env.JV_VISUAL_DIR){fs.mkdirSync(process.env.JV_VISUAL_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.JV_VISUAL_DIR,nome+'.png'),png);}
 console.log('VISUAL_NAME '+nome+' '+png.toString('base64'));
}
const eu={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:1,locCred:0,mensalidade:640,status:'pago',ativo:true};
const fixture={
 grade:{fixos:[{id:'f1',cod:'6601',dia:5,hora:'16:00',tipo:'aula',desde:'2026-10-09'}],eventos:[
 {id:'e1',cod:'6601',data:'2026-10-15',hora:'14:00',tipo:'aula'},
 {id:'e2',cod:'6601',data:'2026-10-15',hora:'13:59',tipo:'aula'},
 {id:'e3',cod:'6601',data:'2026-10-15',hora:'11:00',tipo:'aula'},
 {id:'dup',cod:6601,data:'2026-10-16',hora:'16:00',tipo:'aula'},
 {id:'cancelado',cod:'6601',data:'2026-10-17',hora:'09:00',tipo:'aula'},
 {id:'passado',cod:'6601',data:'2026-10-14',hora:'18:00',tipo:'aula'},
 {id:'proximo-mes',cod:'6601',data:'2026-11-05',hora:'17:00',tipo:'aula'},
 {id:'outro',cod:'6602',data:'2026-10-16',hora:'19:00',tipo:'aula'}
 ],excecoes:[{fixoId:'f1',data:'2026-10-23'}]},
 historico:{'6601':[{data:'2026-10-07',hora:'15:00'},{data:'2026-09-30',hora:'09:00'}],'6602':[{data:'2026-10-12',hora:'19:00'}]},
 horas:['09:00','11:00','13:59','14:00','16:00','17:00','18:00','19:00'],profs:[],horarioCfg:{},horarioData:{},termoVer:0,alunos:[eu]
};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,b=await chromium.launch({headless:true});
 try{
  for(const theme of ['saibro','classico']){
   const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(t=>localStorage.setItem('jv-tema',t),theme);
   const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
   await p.clock.setFixedTime(AGORA);
   await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof aulasAgendadasAluno==='function');
   await p.addStyleTag({content:'#toast,#feriado-box,#login{display:none!important}'});
   const reset=()=>p.evaluate(({fixture,eu})=>{
    init=async()=>{};esperarAuth=async()=>{};authUid=()=> 'u-test';
    EU=JSON.parse(JSON.stringify(eu));PUB=JSON.parse(JSON.stringify(fixture));PUB.alunos=[EU];
    MEU={codigo:'6601',pedidos:[{data:'2026-10-18',hora:'09:00',rec:'pontual',ts:Date.now()}],cancelados:[{data:'2026-10-17',hora:'09:00'}],confirmadas:[]};
    window.envios=[];window.falhar=false;window.pendurar=false;window.gravacoes=0;
    window.fbDB={ref:cam=>({push:async item=>{
     if(window.falhar)throw Error('permission_denied');window.envios.push({cam,item});
     if(window.pendurar)await new Promise(r=>window.liberarEnvio=r);
    }})};
    atualizarGradeReserva=async()=>{};saveMeu=async()=>{window.gravacoes++;};
    notificarJoao=()=>{};abrirWhatsApp=()=>{};
    ACOES_AULA_EM_CURSO.clear();AULAS_CAL_MES=null;AULAS_CAL_BAIXANDO=false;
    agDate=new Date();agView='dia';VINCULO_ESTADO='ativo';
    document.getElementById('app').style.display='block';document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
    render();goAluno('aulas',null);
   },{fixture,eu});
   await reset();
   await check(theme+': próximas aulas têm confirmar, cancelar e Google Agenda; sem passado, cancelada, exceção ou outro aluno',async()=>{
    const r=await p.evaluate(()=>({list:aulasAgendadasAluno(),txt:document.getElementById('mine-list').innerText,
     repeated:document.querySelectorAll('#mine-list .mine-item').length}));
    assert.ok(r.list.some(x=>x.data==='2026-11-05'),'próxima aula do outro mês continua acessível');
    assert.equal(r.list.filter(x=>x.data==='2026-10-16'&&x.hora==='16:00').length,1,'fixo/evento duplicados aparecem uma vez');
    assert.ok(!r.list.some(x=>x.data==='2026-10-14'||x.data==='2026-10-17'||x.data==='2026-10-23'||x.hora==='19:00'));
    assert.match(r.txt,/Confirmar presença/);assert.match(r.txt,/Cancelar aula/);assert.match(r.txt,/Adicionar ao Google Agenda/);
    assert.match(r.txt,/Faltam menos de 4h/);
    assert.equal(await p.locator('#mine-list .mini-cancel:disabled').count(),2);
   });
   await check(theme+': resumo mensal conta aulas uma vez e exclui pedidos, cancelamentos, exceções e outro mês',async()=>{
    const r=await p.evaluate(()=>{const x=resumoMesAluno();return {feitas:x.feitas.map(a=>a.data),prox:x.prox.map(a=>a.data+'|'+a.hora),atalhos:document.querySelectorAll('#cred-page-mes').length};});
    assert.deepEqual(r.feitas,['2026-10-07']);
    assert.deepEqual(r.prox,['2026-10-15|11:00','2026-10-15|13:59','2026-10-15|14:00','2026-10-16|16:00','2026-10-30|16:00']);
    assert.equal(r.atalhos,1);
   });
   await check(theme+': resumo do plano em grupo mostra o saldo de grupo e não altera nenhum dado',async()=>{
    const r=await p.evaluate(()=>{
     const original={plano:EU.plano,planoGrupo:EU.planoGrupo,creditos:EU.creditos,credGrupo:EU.credGrupo};
     Object.assign(EU,{plano:0,planoGrupo:4,creditos:0,credGrupo:3});
     const antes=JSON.stringify({PUB,MEU,EU});renderResumoMes();
     const saldo=document.querySelector('#aulas-mes-resumo .amr-nums div:last-child b').textContent;
     const plano=document.querySelector('#aulas-mes-resumo .amr-plano').textContent;
     const igual=antes===JSON.stringify({PUB,MEU,EU});
     Object.assign(EU,original);renderResumoMes();return {saldo,plano,igual,envios:envios.length};
    });
    assert.equal(r.saldo,'3');assert.match(r.plano,/Plano: 4 aulas/);assert.equal(r.igual,true);assert.equal(r.envios,0);
   });
   await check(theme+': histórico contém apenas realizadas do mês, sem os dados do outro aluno',async()=>{
    const t=await p.locator('#hist-list').innerText();assert.match(t,/07\/10/);assert.doesNotMatch(t,/30\/09|12\/10/);
    assert.match(await p.locator('#aul-hist-mes').innerText(),/outubro.*2026/);
   });
   await check(theme+': Início e Créditos abrem Minhas aulas para particular, grupo, personal e dependente',async()=>{
    for(const tipo of ['Particular','Trio','Personal','Família']){
     await p.evaluate(tipo=>{EU.tipo=tipo;EU.status='pendente';EU.familia=tipo==='Família'?{papel:'dependente',responsavelNome:'Responsável Fictício'}:null;
      goAluno('inicio',null);document.getElementById('home-prox-date').closest('button').click();},tipo);
     assert.equal(await p.locator('#apg-aulas').evaluate(x=>x.classList.contains('on')),true);
     await p.evaluate(()=>{goAluno('creditos',null);document.getElementById('cred-page-mes').click();});
     assert.equal(await p.locator('#apg-aulas').evaluate(x=>x.classList.contains('on')),true);
    }
   });
   await reset();
   await check(theme+': cancelar exatamente 4h antes envia uma vez e só aquela data',async()=>{
    assert.equal(await p.evaluate(()=>cancelarAula('2026-10-15','14:00','pontual')),true);
    const r=await p.evaluate(()=>({envios,MEU,fixos:PUB.grade.fixos}));assert.equal(r.envios.length,1);
    assert.equal(r.envios[0].cam,'jvtenis/fila_agendamentos');assert.equal(r.envios[0].item.data,'2026-10-15');
    assert.ok(r.MEU.cancelados.some(x=>x.hora==='14:00'));assert.equal(r.fixos.length,1);
    await p.evaluate(()=>cancelarAula('2026-10-15','14:00','pontual'));assert.equal(await p.evaluate(()=>envios.length),1);
   });
   await reset();
   await check(theme+': menos de 4h recusa inclusive chamada direta e preserva o estado',async()=>{
    const antes=await p.evaluate(()=>JSON.stringify(MEU));
    assert.equal(await p.evaluate(()=>cancelarAula('2026-10-15','13:59','pontual')),false);
    assert.equal(await p.evaluate(()=>JSON.stringify(MEU)),antes);assert.equal(await p.evaluate(()=>envios.length),0);
   });
   await reset();
   await check(theme+': prazo é conferido novamente depois de ler a nuvem',async()=>{
    await p.evaluate(()=>{window.ORIG_NOW=Date.now;atualizarGradeReserva=async()=>{Date.now=()=>Date.parse('2026-10-15T10:00:01-03:00');};});
    assert.equal(await p.evaluate(()=>cancelarAula('2026-10-15','14:00','pontual')),false);
    assert.equal(await p.evaluate(()=>envios.length),0);await p.evaluate(()=>Date.now=window.ORIG_NOW);
   });
   await reset();
   await check(theme+': fila com erro não mostra cancelamento como concluído nem altera estado',async()=>{
    const antes=await p.evaluate(()=>{window.falhar=true;return JSON.stringify(MEU);});
    assert.equal(await p.evaluate(()=>cancelarAula('2026-10-15','14:00','pontual')),false);
    assert.equal(await p.evaluate(()=>JSON.stringify(MEU)),antes);
   });
   await reset();
   await check(theme+': confirmação de uma aula futura é enviada e aparece no cartão, sem duplicar',async()=>{
    assert.equal(await p.evaluate(()=>confirmarPresencaAluno('2026-10-16','16:00')),true);
    assert.equal(await p.evaluate(()=>confirmarPresencaAluno('2026-10-16','16:00')),false);
    assert.equal(await p.evaluate(()=>envios.length),1);assert.equal(await p.evaluate(()=>envios[0].item.data),'2026-10-16');
    assert.match(await p.locator('#mine-list').innerText(),/Presença confirmada/);
   });
   await reset();
   await check(theme+': confirmar presença pode ocorrer antes do início, mas pedido pendente e aula alheia são recusados',async()=>{
    assert.equal(await p.evaluate(()=>confirmarPresencaAluno('2026-10-15','11:00')),true);
    assert.equal(await p.evaluate(()=>confirmarPresencaAluno('2026-10-18','09:00')),false);
    assert.equal(await p.evaluate(()=>confirmarPresencaAluno('2026-10-16','19:00')),false);
    assert.equal(await p.evaluate(()=>envios.length),1);
   });
   await reset();
   await check(theme+': erro de envio e ausência de internet não confirmam presença',async()=>{
    await p.evaluate(()=>window.falhar=true);
    assert.equal(await p.evaluate(()=>confirmarPresencaAluno('2026-10-16','16:00')),false);
    assert.equal(await p.evaluate(()=>MEU.confirmadas.length),0);
    await p.evaluate(()=>{window.falhar=false;Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});});
    assert.equal(await p.evaluate(()=>confirmarPresencaAluno('2026-10-16','16:00')),false);
    assert.equal(await p.evaluate(()=>envios.length),0);
    await p.evaluate(()=>delete navigator.onLine);
   });
   await reset();
   await check(theme+': duplo toque enquanto o envio demora produz uma só confirmação',async()=>{
    await p.evaluate(()=>{window.pendurar=true;window.A=confirmarPresencaAluno('2026-10-16','16:00');window.B=confirmarPresencaAluno('2026-10-16','16:00');});
    await p.waitForFunction(()=>envios.length===1&&typeof liberarEnvio==='function');
    await p.evaluate(async()=>{liberarEnvio();await Promise.all([window.A,window.B]);});
    assert.equal(await p.evaluate(()=>envios.length),1);assert.equal(await p.evaluate(()=>MEU.confirmadas.length),1);
   });
   await reset();
   await check(theme+': prévia mensal inclui todos os horários confirmados; exclui outro aluno, próximo mês, cancelamentos e pedidos',async()=>{
    const antes=await p.evaluate(()=>JSON.stringify({PUB,MEU,EU}));
    await p.locator('#aul-cal-abrir').click();
    const aulas=await p.evaluate(()=>AULAS_CAL_MES.aulas);
    assert.ok(aulas.some(x=>x.data==='2026-10-09'),'inclui o mês completo');
    assert.ok(aulas.some(x=>x.data==='2026-10-07'),'inclui aula realizada registrada');
    assert.ok(!aulas.some(x=>x.data==='2026-11-05'||x.data==='2026-10-17'||x.data==='2026-10-18'||x.data==='2026-10-23'||x.hora==='19:00'));
    assert.equal(aulas.filter(x=>x.data==='2026-10-16'&&x.hora==='16:00').length,1);
    assert.equal(await p.evaluate(()=>JSON.stringify({PUB,MEU,EU})),antes);
    assert.equal(await p.evaluate(()=>envios.length),0);
    const contraste=await p.evaluate(()=>{
     const modal=document.querySelector('#ov-aulas-cal .aul-cal-modal'),texto=modal.querySelector('p');
     const cor=v=>v.match(/[\d.]+/g).slice(0,3).map(Number);
     const lum=v=>cor(v).map(x=>{x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
     const fundo=lum(getComputedStyle(modal).backgroundColor),letras=lum(getComputedStyle(texto).webkitTextFillColor);
     return (Math.max(fundo,letras)+.05)/(Math.min(fundo,letras)+.05);
    });
    assert.ok(contraste>=4.5,'contraste real da janela mensal: '+contraste);
    if(process.env.JV_VISUAL_LOG==='1'){
     await visual(p,'calendario-'+theme);
    }
   });
   await check(theme+': arquivo ICS tem eventos individuais, horário de Curitiba, IDs estáveis e linhas UTF-8 válidas',async()=>{
    const r=await p.evaluate(()=>{
     const aulas=AULAS_CAL_MES.aulas,ics=gerarAgendaMesIcs(aulas);
     return {aulas,ics,bytes:ics.split('\r\n').map(l=>new TextEncoder().encode(l).length),
      hora:icsInstanteAula(instanteAulaCuritiba('2026-10-15','14:00'))};
    });
    assert.equal(r.hora,'20261015T170000Z');assert.match(r.ics,/BEGIN:VCALENDAR/);
    assert.equal((r.ics.match(/BEGIN:VEVENT/g)||[]).length,r.aulas.length);
    assert.ok(r.bytes.every(n=>n<=75));assert.doesNotMatch(r.ics,/RRULE|6602|20261105/);
    const again=await p.evaluate(()=>gerarAgendaMesIcs(AULAS_CAL_MES.aulas));
    assert.deepEqual(r.ics.match(/UID:.*/g),again.match(/UID:.*/g));
   });
   await check(theme+': salvar mês baixa um arquivo com todas as aulas e não grava em Firebase',async()=>{
    const [download,r]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>salvarAgendaMesAluno())]);
    assert.equal(r,true);assert.equal(download.suggestedFilename(),'aulas-2026-10.ics');
    const saved=await download.path(),ics=fs.readFileSync(saved,'utf8');
    assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,await p.evaluate(()=>AULAS_CAL_MES.aulas.length));
    assert.equal(await p.evaluate(()=>envios.length),0);assert.equal(await p.evaluate(()=>gravacoes),0);
   });
   await check(theme+': mudança de horário após prévia impede baixar uma versão antiga',async()=>{
    await p.evaluate(()=>PUB.grade.eventos.push({id:'novo',cod:'6601',data:'2026-10-20',hora:'18:00',tipo:'aula'}));
    assert.equal(await p.evaluate(()=>salvarAgendaMesAluno()),false);
    assert.ok(await p.evaluate(()=>AULAS_CAL_MES.aulas.some(x=>x.data==='2026-10-20')));
   });
   await reset();
   await check(theme+': Google Agenda abre somente a aula selecionada e não cria evento sozinho',async()=>{
    const r=await p.evaluate(()=>{
     window.LINK=null;const original=HTMLAnchorElement.prototype.click;
     HTMLAnchorElement.prototype.click=function(){window.LINK=this.href;};
     addToCalendar('2026-10-16','16:00');HTMLAnchorElement.prototype.click=original;
     return {url:window.LINK,escritas:envios.length};
    });
    const u=new URL(r.url);assert.equal(u.hostname,'calendar.google.com');assert.equal(u.searchParams.get('action'),'TEMPLATE');
    assert.equal(u.searchParams.get('dates'),'20261016T160000/20261016T170000');
    assert.equal(u.searchParams.get('ctz'),'America/Sao_Paulo');assert.equal(r.escritas,0);
   });
   await check(theme+': telas não têm rolagem lateral; ações têm área de toque de 44px',async()=>{
    for(const w of [320,390,520,1280]){
     await p.setViewportSize({width:w,height:844});await p.evaluate(()=>goAluno('aulas',null));
     assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'largura '+w);
     const sizes=await p.locator('#mine-list button').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().height));
     assert.ok(sizes.every(h=>h>=44),'toque '+w);
    }
    await p.setViewportSize({width:390,height:844});await p.evaluate(()=>goAluno('aulas',null));
    if(process.env.JV_VISUAL_LOG==='1'){
     await visual(p,'aulas-'+theme);
     await p.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';const card=document.querySelector('#mine-list .mine-item');window.scrollTo({top:Math.max(0,scrollY+card.getBoundingClientRect().top-96),behavior:'instant'});});
     await visual(p,'aulas-acoes-'+theme);
    }
   });
   assert.deepEqual(errors,[]);await c.close();
  }
  const c=await b.newContext({timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  const g=await c.newPage();g.on('dialog',d=>d.dismiss());await g.clock.setFixedTime(AGORA);
  await g.goto(base+'/app-gestao/',{waitUntil:'load'});await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#toast{display:none!important}'});
  await check('Gestão publica todas as realizadas do mês, inclusive mais de 30, preservando saldos e sem meses anteriores/faltas',async()=>{
   const r=await g.evaluate(async()=>{
    DB.alunos=[{id:'al-ficticio',nome:'Aluno Fictício',codigo:'6601',tipo:'Particular',plano:4,creditos:3,repos:1,status:'pago',mensalidade:640,ativo:true}];
    DB.agenda={fixos:[],eventos:[],excecoes:[]};DB.presencas=[];
    for(let i=0;i<34;i++)DB.presencas.push({k:'pres-'+i,alunoId:'al-ficticio',data:'2026-10-'+String(1+i%14).padStart(2,'0'),hora:String(12+Math.floor(i/14)).padStart(2,'0')+':00'});
    DB.presencas.push({k:'passado',alunoId:'al-ficticio',data:'2026-09-30',hora:'12:00'},{k:'futuro',alunoId:'al-ficticio',data:'2026-10-16',hora:'12:00'},
     {k:'falta',alunoId:'al-ficticio',data:'2026-10-10',hora:'17:00',tipo:'falta'});
    ensureFields();let cap=null;ehDono=()=>true;hasCloud=()=>true;pareceSemente=()=>false;
    _abriuSemConferir=false;_semDados=false;window._espacoAberto=true;cloudPending=false;_conflitoNuvem=null;
    cloudSet=async()=>{};publicarSeguro=async p=>{cap=p;};window.fbDB={ref:()=>({set:async()=>{},update:async()=>{},get:async()=>({exists:()=>false,val:()=>null})})};
    const antes=JSON.stringify({alunos:DB.alunos,presencas:DB.presencas,lancamentos:DB.lancamentos});
    await doPublish();return {h:cap&&cap.historico['6601'],igual:antes===JSON.stringify({alunos:DB.alunos,presencas:DB.presencas,lancamentos:DB.lancamentos})};
   });
   assert.ok(r.h);assert.equal(r.h.length,34);assert.ok(r.h.every(x=>x.data.startsWith('2026-10')&&x.data<='2026-10-15'));assert.equal(r.igual,true);
  });
  let fiscalFixture;
  await g.evaluate(()=>{
   const base={tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:1,locCred:0,status:'pendente',mensalidade:100};
   const a=(id,extra)=>Object.assign({id,nome:'Fictício '+id,codigo:'66'+id},base,extra);
   DB={alunos:[a('zero',{mensalidade:0,arquivado:false}),a('parcial',{status:'parcial'}),a('arquivado',{arquivado:true}),
    a('legado',{status:'inativo',arquivado:false}),a('sem-plano',{plano:0,mensalidade:0}),
    a('pago',{status:'pago'}),a('torneio',{perfil:'torneio',arquivado:false}),a('dep',{responsavelId:'parcial',mensalidade:0,arquivado:false})],
    agenda:{fixos:[],eventos:[],excecoes:[]},presencas:[],movs:[],lancamentos:[],compromissos:[],meta:10000,mesCreditos:'2026-10',mesPagamentos:'2026-10'};
   ensureFields();persist=()=>{};logAct=()=>{};fichaId=null;hideVals=false;
   window.copiasFiscais=[];guardarVersoes=s=>window.copiasFiscais.push(s);
   document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
   document.getElementById('splash-gestao').style.display='none';
   window.FISCAL_FIXTURE=JSON.stringify(DB);
   renderAll();
  });
  fiscalFixture=await g.evaluate(()=>window.FISCAL_FIXTURE);
  await check('Pendentes: inativos, status antigo inativo, pagos, torneio e dependentes não entram na lista, contador ou Caixa',async()=>{
   const r=await g.evaluate(()=>{
    renderDash();renderFin();abrirFechamento();
    return {ids:DB.alunos.filter(a=>pendenteDoFechamento(a,monthKey())).map(a=>a.id).sort(),
     pagIds:DB.alunos.filter(a=>passaFiltroPag(a,'pendentes')).map(a=>a.id).sort(),
     nomes:document.getElementById('pend-list').innerText,contador:document.getElementById('k-pendente-s').innerText,
     valor:document.getElementById('k-pendente').innerText,caixa:document.getElementById('f-inad').innerText,
     fechamento:Array.from(document.getElementById('fc-aluno').options).map(o=>o.value).filter(Boolean).sort(),
     igual:JSON.stringify(DB)===window.FISCAL_FIXTURE};
   });
   assert.deepEqual(r.ids,['parcial','zero']);assert.deepEqual(r.pagIds,r.ids);assert.deepEqual(r.fechamento,r.ids);
   assert.match(r.contador,/2 mensalidades/);assert.match(r.valor,/50/);assert.equal(r.caixa,r.valor);
   assert.doesNotMatch(r.nomes,/Fictício (arquivado|legado|sem-plano|pago|torneio|dep)/);assert.equal(r.igual,true);
  });
  await check('Mensalidade zero: ação visível, confirmação manual e saída dos pendentes sem receita, renovação ou mudança de saldos',async()=>{
   g.removeAllListeners('dialog');g.on('dialog',d=>d.accept());
   const saldos=await g.evaluate(()=>JSON.stringify({a:DB.alunos.map(x=>[x.id,x.creditos,x.credGrupo,x.repos,x.locCred]),movs:DB.movs,lancamentos:DB.lancamentos,presencas:DB.presencas}));
   await g.evaluate(()=>{go('dash',document.createElement('button'));dobrar('dob-pend',true);});
   await g.locator('#pend-list button').filter({hasText:'Marcar como pago'}).click();
   assert.ok(await g.locator('#pm-sem-valor').isVisible());assert.ok(!(await g.locator('#pm-confirmar').isVisible()));
   await g.locator('#pm-sem-valor button').click();
   const r=await g.evaluate(()=>({q:situacaoMensalidade(DB.alunos.find(x=>x.id==='zero'),monthKey()),status:DB.alunos.find(x=>x.id==='zero').status,
    saldos:JSON.stringify({a:DB.alunos.map(x=>[x.id,x.creditos,x.credGrupo,x.repos,x.locCred]),movs:DB.movs,lancamentos:DB.lancamentos,presencas:DB.presencas}),
    copias:window.copiasFiscais.length,pend:document.getElementById('pend-list').innerText}));
   assert.equal(r.q.status,'pago');assert.equal(r.status,'pago');assert.equal(r.q.recebido,0);
   assert.equal(r.saldos,saldos);assert.equal(r.copias,1);assert.doesNotMatch(r.pend,/Fictício zero/);
   assert.equal(await g.evaluate(()=>quitarMensalidadeSemValor()),false);
  });
  await check('Quitação zero: recusar confirmação ou tentar mensalidade com valor não altera dados; pagamento positivo continua disponível',async()=>{
   await g.evaluate(s=>{DB=JSON.parse(s);PM_CTX=null;renderAll();},fiscalFixture);
   g.removeAllListeners('dialog');g.on('dialog',d=>d.dismiss());
   await g.evaluate(()=>marcarPago('zero'));
   const antes=await g.evaluate(()=>JSON.stringify(DB));
   assert.equal(await g.evaluate(()=>quitarMensalidadeSemValor()),false);
   assert.equal(await g.evaluate(()=>JSON.stringify(DB)),antes);
   await g.evaluate(()=>{closeModal('ov-pagamento-exato');marcarPago('parcial');});
   assert.ok(await g.locator('#pm-confirmar').isVisible());assert.ok(!(await g.locator('#pm-sem-valor').isVisible()));
   assert.equal(await g.locator('#pm-valor').inputValue(),'50.00');
   assert.equal(await g.evaluate(()=>quitarMensalidadeSemValor()),false);
   assert.equal(await g.evaluate(()=>JSON.stringify(DB)),antes);
  });
  await check('Quitação zero de mês anterior preserva status corrente e não impede cobrar um valor cadastrado depois',async()=>{
   g.removeAllListeners('dialog');g.on('dialog',d=>d.accept());
   await g.evaluate(s=>{DB=JSON.parse(s);PM_CTX=null;marcarPago('zero');document.getElementById('pm-mes').value='2026-09';prepararPagamentoMes();},fiscalFixture);
   assert.equal(await g.evaluate(()=>quitarMensalidadeSemValor()),true);
   const r=await g.evaluate(()=>{const a=DB.alunos.find(x=>x.id==='zero');return {set:situacaoMensalidade(a,'2026-09').status,out:situacaoMensalidade(a,'2026-10').status,status:a.status};});
   assert.deepEqual(r,{set:'pago',out:'pendente',status:'pendente'});
   await g.evaluate(()=>{marcarPago('zero');quitarMensalidadeSemValor();DB.alunos.find(x=>x.id==='zero').mensalidade=100;});
   assert.equal(await g.evaluate(()=>situacaoMensalidade(DB.alunos.find(x=>x.id==='zero'),'2026-10').status),'pendente');
   assert.equal(await g.evaluate(()=>DB.lancamentos.length),0);
  });
  await g.evaluate(()=>{
   DB={alunos:[{id:'al-ficticio',nome:'Aluno Fictício',codigo:'6601',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:1,locCred:0,status:'pago',mensalidade:640,ativo:true}],
    agenda:{fixos:[],eventos:[{id:'aula-ficticia',data:dKey(new Date()),hora:'16:00',alunoId:'al-ficticio',titulo:'Aluno Fictício',tipo:'aula'}],excecoes:[]},
    presencas:[],movs:[],lancamentos:[],compromissos:[],meta:10000,mesCreditos:'2026-10',mesPagamentos:'2026-10',ultimoBackup:Date.now()};
   ensureFields();persist=()=>{};logAct=()=>{};hideVals=false;
   _abriuSemConferir=false;cloudPending=false;_conflitoNuvem=null;guardarMetaProtecao({backup:Date.now(),nuvem:Date.now()});
   document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
   document.getElementById('splash-gestao').style.display='none';
   renderAll();go('dash',document.querySelector('.nav button'));
   window.PREVIA_ANTES=JSON.stringify(DB);
  });
  await g.setViewportSize({width:390,height:844});
  await g.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:0,behavior:'instant'});});
  await g.waitForFunction(()=>window.scrollY===0);
  await g.addScriptTag({path:path.join(root,'ferramentas/prototipos/voz-gestao.js')});
  await check('Gestão: prévia isolada do botão de voz preserva dados e fica acima do menu',async()=>{
   const r=await g.evaluate(()=>{const b=document.getElementById('vzp-abrir').getBoundingClientRect(),n=document.querySelector('.nav').getBoundingClientRect();
    return {acima:b.bottom<n.top,dentro:b.right<=innerWidth,igual:JSON.stringify(DB)===window.PREVIA_ANTES};});
   assert.deepEqual(r,{acima:true,dentro:true,igual:true});
   if(process.env.JV_VISUAL_LOG==='1'){await visual(g,'voz-botao');}
   await g.locator('#vzp-abrir').click();assert.ok(await g.locator('#vzp-painel').isVisible());
   assert.equal(await g.evaluate(()=>JSON.stringify(DB)===window.PREVIA_ANTES),true);
   if(process.env.JV_VISUAL_LOG==='1'){await visual(g,'voz-painel');}
  });
  await c.close();console.log('\n✅ '+checks+' verificações de Aulas e agenda mensal');
 }catch(e){console.error('❌ '+(e.stack||e));process.exitCode=1;}
 finally{await b.close();server.close();}
})();

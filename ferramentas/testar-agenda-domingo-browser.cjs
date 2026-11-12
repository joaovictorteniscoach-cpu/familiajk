/* Dia ao abrir e semana de segunda a domingo. Somente dados fictícios. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const motores=require('playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let f=path.join(root,decodeURI(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}
});
const aluno={id:'teste',codigo:'6601',nome:'Aluno de Teste',tipo:'Particular',plano:4,creditos:4,credGrupo:0,repos:1,mensalidade:640,status:'pago',ativo:true};
const banco={alunos:[aluno],agenda:{fixos:[],eventos:[],excecoes:[]},presencas:[],movs:[],lancamentos:[],compromissos:[],savedAt:1,mesPagamentos:'2026-11',mesCreditos:'2026-11',horarioCfg:{0:{'08:00':'aula','09:00':'fechado'}}};
const pub={alunos:[aluno],horas:['08:00','09:00','10:00'],grade:{fixos:[],eventos:[],excecoes:[]},horarioCfg:banco.horarioCfg,horarioData:{},precos:{locacao:70},termoVer:0,historico:{},profs:[]};
let n=0;
async function check(label,fn){await fn();n++;console.log('PASS '+label);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
 for(const motor of ['chromium','webkit']){
 const browser=await motores[motor].launch({headless:true});
 try{for(const tema of ['saibro','classico']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  try{
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await ctx.addInitScript(({banco,tema})=>{localStorage.setItem('jvtenis-gestao-v1',JSON.stringify(banco));localStorage.setItem('jv-tema',tema);sessionStorage.setItem('jv-bk-adiar','1');},{banco,tema});
  for(const app of ['app-aluno','app-gestao']){
   const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
   await p.clock.setFixedTime(new Date('2026-11-12T10:00:00-03:00'));
   await p.goto(base+'/'+app+'/',{waitUntil:'load'});await p.waitForFunction(()=>typeof renderAgenda==='function');
   if(app==='app-gestao')await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
   const label=[motor,tema,app].join('/');
   await check(label+' abre em Dia com botão correspondente',async()=>{
    assert.equal(await p.evaluate(()=>agView),'dia');
    const botoes=p.locator('.jv-ref-ag-tabs button.on');assert.equal(await botoes.first().textContent(),'Dia');
   });
   await p.evaluate(({app,banco,pub,aluno})=>{
    window.__avisos=[];toast=t=>__avisos.push(t);
    if(app==='app-gestao'){
     DB=JSON.parse(JSON.stringify(banco));ensureFields();persist=()=>{};logAct=()=>{};hideVals=false;
     document.querySelectorAll('.overlay.on').forEach(e=>e.classList.remove('on'));document.getElementById('splash-gestao').style.display='none';
     irParaAba('agenda');
    }else{
     init=async()=>{};EU=aluno;PUB=pub;MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[],espera:[]};VINCULO_ESTADO='ativo';authUid=()=>'teste';
     document.getElementById('app').style.display='block';document.getElementById('login').style.display='none';render();goAluno('agenda',null);
    }
    document.querySelectorAll('[id*="splash"]').forEach(e=>e.style.display='none');
    agDate=new Date('2026-11-15T12:00:00');setView('semana',document.querySelector('.jv-ref-ag-tabs button[onclick*="semana"]'));
   },{app,banco,pub,aluno});
   await p.addStyleTag({content:'#barra-versao,#barra-endereco,#toast,#voz-atalho,#va-bt{display:none!important}'});
   await check(label+' tabela inclui domingo 15/11 e intervalo termina nele',async()=>{
    const hs=await p.locator('#ag-view .wk tr:first-child th').allTextContents();assert.equal(hs.length,8);assert.match(hs[7],/dom.*15\/11/i);
    assert.match(await p.locator('#ag-label').textContent(),/15\/11/);
   });
   await check(label+' domingo somente locação, sem aula/grupo/reposição/torneio',async()=>{
    if(app==='app-aluno'){
     const x=await p.evaluate(()=>{
      const d=new Date('2026-11-15T12:00:00');agDate=d;
      const c=cabeNoSlot(slotState(d,'08:00'),d,'08:00');escolherSlot('08:00');
      const opts=[...document.querySelectorAll('#pick-opts .pick-opt')].map(b=>b.className);
      return {c,opts};
     });
     assert.deepEqual(x.c,{aula:false,loc:true,tor:false});assert.equal(x.opts.length,1);assert.match(x.opts[0],/loc/);
     await p.evaluate(()=>document.getElementById('ov-pick').classList.remove('on'));
    }else{
     const x=await p.evaluate(()=>{
      const d=new Date('2026-11-15T12:00:00');agDate=d;openSlot('08:00');
      const tp=document.getElementById('s-tipo');const opts=[...tp.options].map(o=>({v:o.value,disabled:o.disabled}));
      document.getElementById('s-titulo').value='Teste';tp.value='torneio';saveSlot();
      const antes=DB.agenda.eventos.length+DB.agenda.fixos.length;
      return {tipoInicial:opts.find(o=>o.v==='locacao')?.disabled,opts,antes,valido:pedidoAgendaValido({data:'2026-11-15',hora:'08:00',rec:'pontual',tor:1},DB.alunos[0])};
     });
     assert.equal(x.tipoInicial,false);assert.equal(x.valido,false);assert.equal(x.antes,0);
     for(const tipo of ['aula','grupo','personal','torneio'])assert.ok(x.opts.find(o=>o.v===tipo)?.disabled);
     await p.evaluate(()=>closeSlot());
    }
   });
   await check(label+' reservas antigas continuam visíveis e segunda mantém atividades',async()=>{
    const x=await p.evaluate(app=>{
     const d=new Date('2026-11-15T12:00:00');
     if(app==='app-aluno'){
      PUB.grade.eventos=[{id:'antiga',data:'2026-11-15',hora:'08:00',tipo:'aula',cod:'6601'}];agDate=d;agView='dia';renderAgenda();
      const antiga=slotState(d,'08:00').st;PUB.grade.eventos=[];
      const seg=new Date('2026-11-16T12:00:00');return {antiga,c:cabeNoSlot(slotState(seg,'08:00'),seg,'08:00')};
     }
     DB.agenda.eventos=[{id:'antiga',data:'2026-11-15',hora:'08:00',tipo:'aula',titulo:'Teste',alunoId:'teste'}];agDate=d;agView='dia';renderAgenda();
     const antiga=entriesFor(d,'08:00').length;DB.agenda.eventos=[];return {antiga,seg:atividadePermitidaNoDia(new Date('2026-11-16T12:00:00'),'torneio')};
    },app);
    if(app==='app-aluno'){assert.equal(x.antiga,'meu');assert.ok(x.c.aula&&x.c.loc&&x.c.tor);}else{assert.equal(x.antiga,1);assert.equal(x.seg,true);}
   });
   await check(label+' sete colunas cabem e não ultrapassam tela de 320/390/1280',async()=>{
    for(const width of [320,390,1280]){
     await p.setViewportSize({width,height:844});await p.evaluate(()=>{agDate=new Date('2026-11-15T12:00:00');agView='semana';renderAgenda();});
     await p.waitForTimeout(100);
     const x=await p.evaluate(()=>({w:innerWidth,doc:document.documentElement.scrollWidth,cols:document.querySelectorAll('#ag-view .wk tr:first-child th').length}));
     assert.equal(x.cols,8);assert.ok(x.doc<=x.w+2,JSON.stringify(x));
    }
   });
   await p.setViewportSize({width:390,height:844});
   await p.evaluate(()=>{agDate=new Date('2026-11-15T12:00:00');agView='semana';renderAgenda();});
   await p.waitForTimeout(150);
   if(process.env.JV_VISUAL_DIR){fs.mkdirSync(process.env.JV_VISUAL_DIR,{recursive:true});await p.screenshot({path:path.join(process.env.JV_VISUAL_DIR,'domingo-'+app+'-'+motor+'-'+tema+'.png')});}
   assert.deepEqual(errors,[]);await p.close();
  }
  }finally{await ctx.close();}
 }}finally{await browser.close();}
 }
 console.log('Agenda Dia/domingo: '+n+' verificações aprovadas.');
 }finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

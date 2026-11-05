/* Créditos que saíam a mais ou não saíam (05/11, pedido do João: "às vezes
   tira crédito a mais, ou ele faz a aula e o crédito não é debitado").
   A presença é guardada pela chave dia|hora|aluno, então mexer na aula sem
   mexer na marca deixava o ✓ preso:
   - arrastar uma aula com ✓ para outro horário: o ✓ ficava no antigo, a aula
     aparecia sem ✓ e, marcada de novo, tirava outro crédito; arrastar a aula
     fixa ainda mudava as semanas que já passaram;
   - cancelar a aula "só hoje" ou apagá-la depois do ✓ não devolvia o crédito;
   - "Usar reposição" no cartão e o ✓ no horário de reposição tiravam duas;
   - dois toques rápidos no ○ marcavam e desmarcavam (aula sem débito).
   Também confere a conferência (só lista) e o acerto no Histórico de aulas.
   Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-11-05T15:00:00-03:00');   // quinta-feira
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
  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));
  let resposta=true;const perguntas=[];p.on('dialog',d=>{perguntas.push(d.message());resposta?d.accept():d.dismiss();});
  await p.clock.setSystemTime(AGORA);await p.goto(base+'/app-gestao/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,null,{timeout:40000});
  await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast{display:none!important}'});
  const preparar=()=>p.evaluate(()=>{persist=()=>{};publish=()=>{};MODO='dono';Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);
   const al=(id,nome,extra)=>Object.assign({id,nome,codigo:id.slice(-4),tipo:'Particular',plano:4,planoGrupo:0,creditos:4,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true,diaVenc:10},extra||{});
   DB.alunos=[al('a1001','Aluno Fixo'),al('a1002','Aluno Avulso'),al('a1003','Aluno Repo',{repos:2}),al('a1004','Aluno Troca')];DB.movs=[];DB.presencas=[];
   DB.agenda={fixos:[{id:'f1',dia:3,hora:'18:00',titulo:'Aluno Fixo',tipo:'aula',alunoId:'a1001',desde:'2026-10-01'}],
    eventos:[{id:'e1',data:'2026-11-03',hora:'10:00',titulo:'Aluno Avulso',tipo:'aula',alunoId:'a1002'},
             {id:'e2',data:'2026-11-05',hora:'09:00',titulo:'Aluno Repo',tipo:'aula',alunoId:'a1003',repo:1},
             {id:'e3',data:'2026-11-04',hora:'08:00',titulo:'Aluno Troca',tipo:'aula',alunoId:'a1004'}],excecoes:[]};
   ensureFields();renderAll();});
  const saldo=id=>p.evaluate(id=>{const a=DB.alunos.find(x=>x.id===id);return {creditos:a.creditos,repos:a.repos,
   pres:DB.presencas.filter(x=>x.alunoId===id).map(x=>x.k),extrato:saldoPeloExtrato(a,'creditos')};},id);
  const marcar=(dk,eid)=>p.evaluate(({dk,eid})=>{Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);agDate=new Date(dk+'T12:00:00');togglePresenca(eid);},{dk,eid});
  const naAgenda=(dk,id)=>p.evaluate(({dk,id})=>{const d=new Date(dk+'T12:00:00'),out=[];HORAS.forEach(h=>entriesFor(d,h).forEach(e=>{if(e.alunoId===id)out.push({h,id:e.id,ok:isPres(e,d)});}));return out;},{dk,id});
  const achados=id=>p.evaluate(id=>achadosDoAluno(DB.alunos.find(x=>x.id===id)).map(x=>x.tipo+'|'+x.txt),id);

  await preparar();
  await check('arrastar a aula fixa com ✓ leva o ✓ junto, sem descontar de novo, e não muda as semanas passadas',async()=>{
   await marcar('2026-11-04','f1');assert.equal((await saldo('a1001')).creditos,3);
   await p.evaluate(()=>moverEntrada('f1','2026-11-04','19:00','2026-11-04'));
   const hoje=await naAgenda('2026-11-04','a1001'),antes=await naAgenda('2026-10-28','a1001'),depois=await naAgenda('2026-11-11','a1001');
   assert.deepEqual(hoje.map(x=>x.h+(x.ok?'✓':'○')),['19:00✓'],'o ✓ foi junto para 19:00');
   assert.deepEqual(antes.map(x=>x.h),['18:00'],'semana passada continua às 18:00');
   assert.deepEqual(depois.map(x=>x.h),['19:00'],'semanas seguintes às 19:00');
   const s=await saldo('a1001');assert.equal(s.creditos,3,'continua 1 crédito descontado');assert.deepEqual(s.pres,['2026-11-04|19:00|a1001']);
   assert.equal(s.extrato,s.creditos,'extrato e saldo continuam batendo');
   // desmarcar no lugar novo devolve exatamente o que saiu
   await marcar('2026-11-04',hoje[0].id);assert.equal((await saldo('a1001')).creditos,4);
  });
  await check('arrastar a aula avulsa com ✓ leva o ✓ junto; tocar no lugar novo desfaz certo',async()=>{
   await marcar('2026-11-03','e1');assert.equal((await saldo('a1002')).creditos,3);
   await p.evaluate(()=>moverEntrada('e1','2026-11-03','11:00'));
   assert.deepEqual((await naAgenda('2026-11-03','a1002')).map(x=>x.h+(x.ok?'✓':'○')),['11:00✓']);
   assert.equal((await saldo('a1002')).creditos,3);
   await marcar('2026-11-03','e1');const s=await saldo('a1002');assert.equal(s.creditos,4);assert.deepEqual(s.pres,[]);
  });
  await check('trocar duas aulas de lugar leva o ✓ de cada uma junto',async()=>{
   await marcar('2026-11-03','e1');                 // e1 às 11:00 (✓), e3 dia 04 às 08:00 (○)
   await p.evaluate(()=>moverEntrada('e1','2026-11-04','08:00'));
   assert.deepEqual((await naAgenda('2026-11-04','a1002')).map(x=>x.h+(x.ok?'✓':'○')),['08:00✓']);
   assert.deepEqual((await naAgenda('2026-11-03','a1004')).map(x=>x.h+(x.ok?'✓':'○')),['11:00○']);
   assert.equal((await saldo('a1002')).creditos,3);assert.equal((await saldo('a1004')).creditos,4);
  });
  await check('mover o dia inteiro leva os ✓ junto',async()=>{
   await p.evaluate(()=>moverDia('2026-11-04','2026-11-06'));
   assert.deepEqual((await naAgenda('2026-11-06','a1002')).map(x=>x.h+(x.ok?'✓':'○')),['08:00✓']);
   assert.equal((await saldo('a1002')).creditos,3);
  });
  await preparar();
  await check('cancelar só hoje uma aula com ✓ pergunta e devolve o crédito; "Cancelar" deixa como está',async()=>{
   await marcar('2026-11-04','f1');assert.equal((await saldo('a1001')).creditos,3);
   resposta=false;perguntas.length=0;
   await p.evaluate(()=>{slotCtx={date:new Date('2026-11-04T12:00:00'),hora:'18:00'};cancelarDia('f1');});
   assert.match(perguntas.join(' '),/devolve/);assert.equal((await saldo('a1001')).creditos,3);
   assert.equal((await naAgenda('2026-11-04','a1001')).length,1,'aula continua');
   resposta=true;await p.evaluate(()=>{slotCtx={date:new Date('2026-11-04T12:00:00'),hora:'18:00'};cancelarDia('f1');});
   const s=await saldo('a1001');assert.equal(s.creditos,4);assert.deepEqual(s.pres,[]);
   assert.equal((await naAgenda('2026-11-04','a1001')).length,0,'aula cancelada nesta data');
  });
  await check('apagar uma aula avulsa com ✓ devolve o crédito',async()=>{
   await marcar('2026-11-03','e1');assert.equal((await saldo('a1002')).creditos,3);
   await p.evaluate(()=>{slotCtx={date:new Date('2026-11-03T12:00:00'),hora:'10:00'};removerEvento('e1');});
   const s=await saldo('a1002');assert.equal(s.creditos,4);assert.deepEqual(s.pres,[]);
  });
  await check('"Usar reposição" no cartão registra a aula; o ✓ no horário de reposição troca em vez de tirar outra',async()=>{
   await p.evaluate(()=>{Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);usarRepos('a1003');});
   let s=await saldo('a1003');assert.equal(s.repos,1);assert.equal(s.pres.length,1,'aula de hoje registrada');
   perguntas.length=0;await marcar('2026-11-05','e2');
   assert.match(perguntas.join(' '),/já tem esta aula lançada pelo cartão/);
   s=await saldo('a1003');assert.equal(s.repos,1,'continua 1 reposição usada');assert.deepEqual(s.pres,['2026-11-05|09:00|a1003']);
  });
  await check('com ✓ já marcado hoje, "Usar reposição" pergunta e não tira se for a mesma aula',async()=>{
   resposta=false;perguntas.length=0;await p.evaluate(()=>{Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);usarRepos('a1003');});
   assert.match(perguntas.join(' '),/já tem aula registrada hoje/);
   assert.equal((await saldo('a1003')).repos,1);resposta=true;
  });
  await check('dois toques rápidos no ○ não marcam e desmarcam: o crédito sai uma vez',async()=>{
   await preparar();
   await p.evaluate(()=>{agDate=new Date('2026-11-03T12:00:00');tocarPresenca('e1');tocarPresenca('e1');});
   let s=await saldo('a1002');assert.equal(s.creditos,3);assert.equal(s.pres.length,1);
   await p.waitForTimeout(950);await p.evaluate(()=>{agDate=new Date('2026-11-03T12:00:00');tocarPresenca('e1');});
   s=await saldo('a1002');assert.equal(s.creditos,4,'um toque depois desfaz normalmente');
   await p.evaluate(()=>{agView='dia';agDate=new Date('2026-11-03T12:00:00');go('agenda',document.querySelector('.nav button[onclick*="agenda"]'));renderAgenda();});
   await p.waitForTimeout(950);const bt=p.locator('#pg-agenda button.pres').first();await bt.dblclick();
   s=await saldo('a1002');assert.equal(s.creditos,3,'toque duplo no botão: marcou uma vez só');
  });
  await preparar();
  await check('conferência lista ✓ preso fora da agenda e desconto em dobro (só lista, não muda nada)',async()=>{
   // como ficava antes desta versão: ✓ às 18:00, aula arrastada para 19:00 só na grade, e ✓ de novo às 19:00
   await p.evaluate(()=>{const a=DB.alunos[0];
    DB.presencas.push({k:'2026-11-04|18:00|a1001',alunoId:'a1001',data:'2026-11-04',hora:'18:00',tipo:'aula',custo:1});mover(a,'creditos',-1,'Presença na agenda','2026-11-04|18:00|a1001');
    DB.agenda.fixos[0].hora='19:00';
    DB.presencas.push({k:'2026-11-04|19:00|a1001',alunoId:'a1001',data:'2026-11-04',hora:'19:00',tipo:'aula',custo:1});mover(a,'creditos',-1,'Presença na agenda','2026-11-04|19:00|a1001');});
   const antes=JSON.stringify(await p.evaluate(()=>DB));
   const l=await achados('a1001');
   assert.ok(l.some(x=>/^dup\|POSSÍVEL DESCONTO EM DOBRO/.test(x)&&/04\/11 18:00 — já tem ✓ às 19:00/.test(x)),l.join('\n'));
   assert.equal(JSON.stringify(await p.evaluate(()=>DB)),antes,'a conferência não mudou nada');
  });
  await check('Histórico de aulas: "apagar e devolver" acerta o dobro, com versão guardada e desfazer',async()=>{
   await p.evaluate(()=>{window.__versoes=0;const g=guardarVersoes;guardarVersoes=function(){__versoes++;return g.apply(this,arguments);};openHistAulas('a1001');});
   const txt=await p.locator('#ha-fora').textContent();
   assert.match(txt,/fora do horário da agenda/);assert.match(txt,/descontou duas vezes/);
   await p.locator('#ha-fora button',{hasText:'apagar e devolver'}).click();
   const s=await saldo('a1001');assert.equal(s.creditos,3,'ficou só um desconto');assert.deepEqual(s.pres,['2026-11-04|19:00|a1001']);
   assert.ok(await p.evaluate(()=>__versoes)>=1,'versão guardada antes');
   assert.equal(await p.locator('#ha-fora').textContent(),'','nada mais a acertar');
   assert.ok(!(await achados('a1001')).some(x=>/DOBRO/.test(x)));
   await p.evaluate(()=>closeModal('ov-histaulas'));
  });
  await check('Histórico de aulas: "levar para" põe o ✓ no horário da aula sem mexer no saldo',async()=>{
   await preparar();
   await p.evaluate(()=>{const a=DB.alunos[0];
    DB.presencas.push({k:'2026-11-04|18:00|a1001',alunoId:'a1001',data:'2026-11-04',hora:'18:00',tipo:'aula',custo:1});mover(a,'creditos',-1,'Presença na agenda','2026-11-04|18:00|a1001');
    DB.agenda.fixos[0].hora='19:00';openHistAulas('a1001');});
   await p.locator('#ha-fora button',{hasText:'levar para 19:00'}).click();
   const s=await saldo('a1001');assert.equal(s.creditos,3);assert.deepEqual(s.pres,['2026-11-04|19:00|a1001']);
   assert.deepEqual((await naAgenda('2026-11-04','a1001')).map(x=>x.h+(x.ok?'✓':'○')),['19:00✓']);
   await p.evaluate(()=>closeModal('ov-histaulas'));
  });
  await check('conferência lista aula que passou sem ✓ (crédito não descontado)',async()=>{
   await preparar();
   const l=await achados('a1002');
   assert.ok(l.some(x=>/aula\(s\) que já passaram sem ✓ nem falta/.test(x)&&/03\/11 10:00/.test(x)),l.join('\n'));
   await marcar('2026-11-03','e1');
   assert.ok(!(await achados('a1002')).some(x=>/03\/11 10:00/.test(x)),'com ✓ sai da lista');
  });
  assert.deepEqual(erros,[]);
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · crédito sai uma vez por aula e volta quando a aula sai da agenda');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

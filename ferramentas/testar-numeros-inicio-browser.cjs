/* Números do Início batendo com a agenda. O mesmo aluno marcado duas vezes
   onde só cabe uma aula (fixa + avulsa no mesmo horário, tênis e personal no
   mesmo horário, 19:00 e 19:30) contava duas aulas; "Créditos em aberto"
   descontava quem deve aula, somava inativo e reposição vencida. A conferência
   lista aula por aula e não grava nada. Grade só de horas cheias (14:30,
   15:30, 19:30 e 20:30 saíram; marcação antiga nelas não some) e aula de 19h
   vale 1 crédito. Comparativo com Ano. Dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let f=path.join(root,decodeURI(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
 catch{res.writeHead(404).end();}
});
let count=0;
async function check(name,fn){await fn();count++;console.log('✅ '+name);}

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,b=await chromium.launch({headless:true});
 try{
  const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
   if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const g=await c.newPage(),errors=[];g.on('pageerror',e=>errors.push(e.message));g.on('dialog',d=>d.dismiss());
  await g.clock.setFixedTime(new Date('2026-10-15T13:04:00-03:00'));            // quinta-feira, 13:04
  await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,{},{timeout:15000});
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#toast,#barra-versao,#barra-endereco{display:none!important}'});
  await g.evaluate(()=>{
   window.gravacoes=0;persist=()=>{window.gravacoes++;};guardarVersoes=()=>{};logAct=()=>{};hideVals=false;
   const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',plano:4,planoGrupo:0,creditos:0,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true},x||{});
   DB.alunos=[al('ana','Ana Teste',{creditos:4,repos:3}),al('bia','Bia Teste',{creditos:-2}),al('caio','Caio Teste',{tipo:'Personal'}),
    al('duda','Duda Teste',{tipo:'Dupla',plano:0,planoGrupo:4}),al('edu','Edu Teste',{tipo:'Dupla',plano:0,planoGrupo:4}),
    al('fe','Fê Teste',{planoGrupo:4,creditos:1,credGrupo:2}),al('gil','Gil Teste',{tipo:'Personal'}),al('hugo','Hugo Teste'),
    al('ze','Zé Inativo',{creditos:5,repos:2,arquivado:true})];
   const ts=s=>new Date(s).getTime();
   DB.movs=[{ts:ts('2026-05-10T12:00:00-03:00'),alunoId:'ana',campo:'repos',delta:2,de:0,para:2,motivo:'virada',ref:''},
    {ts:ts('2026-09-30T12:00:00-03:00'),alunoId:'ana',campo:'repos',delta:1,de:2,para:3,motivo:'virada',ref:''},
    {ts:ts('2026-09-30T12:00:00-03:00'),alunoId:'ze',campo:'repos',delta:2,de:0,para:2,motivo:'virada',ref:''}];
   const fx=(id,hora,alunoId,tipo,x)=>Object.assign({id,dia:4,hora,titulo:DB.alunos.find(a=>a.id===alunoId).nome,tipo,alunoId,desde:'2026-09-01'},x||{});
   const ev=(id,data,hora,alunoId,tipo,x)=>Object.assign({id,data,hora,titulo:alunoId?DB.alunos.find(a=>a.id===alunoId).nome:'Locação Fictícia',tipo,alunoId},x||{});
   DB.agenda={fixos:[fx('f1','07:00','caio','personal'),fx('f2','09:00','ana','aula'),fx('f3','10:00','bia','aula'),
     fx('f4','16:00','duda','grupo',{pessoas:2}),fx('f5','16:00','edu','grupo',{pessoas:2}),fx('f6','19:00','fe','aula'),
     fx('f7','11:00','gil','personal'),fx('f8','11:00','hugo','aula')],
    eventos:[ev('e1','2026-10-15','09:00','ana','personal'),ev('e2','2026-10-15','10:00','bia','aula'),
     ev('e3','2026-10-15','19:30','fe','aula'),ev('e4','2026-10-15','13:00',null,'locacao'),
     ev('e5','2026-10-16','19:00','hugo','aula'),
     ev('v1','2025-01-06','09:00','ana','aula'),ev('v2','2025-03-10','10:00','bia','aula'),
     ev('v3','2025-05-05','07:00','caio','personal'),ev('v4','2025-12-01','09:00','ana','aula')],excecoes:[]};
   DB.compromissos=[{id:'c1',data:'2026-10-15',hora:'18:00',titulo:'Compromisso fictício'}];
   DB.presencas=[];DB.horarioData={};DB.locacaoOnly=[];delete DB.horarioCfg;delete DB.horarioVer;DB.pacoteUnico={ativo:true};
   ensureFields();CARREGADO=true;
   document.querySelectorAll('.overlay.on').forEach(e=>e.classList.remove('on'));
   const s=document.getElementById('splash-gestao');if(s)s.style.display='none';
   window.ANTES=JSON.stringify(DB);window.gravacoes=0;
   curYear=2026;curMonth=9;go('dash',document.createElement('button'));renderAll();
  });

  await check('o mesmo aluno duas vezes onde só cabe uma aula conta 1 (tênis+personal, fixa+avulsa, 19:00 e 19:30)',async()=>{
   const r=await g.evaluate(()=>({dia:contarAulas(new Date(2026,9,15),new Date(2026,9,15)),
    tela:['total','personal','tenis'].map(k=>document.getElementById('k-aulas-dia-'+k).textContent)}));
   // personal: 07 Caio, 09 Ana (a avulsa vale sobre a fixa), 11 Gil · tênis: 10 Bia, 11 Hugo, 16 dupla, 19 Fê
   assert.deepEqual(r.dia,{tenis:4,personal:3,total:7});
   assert.deepEqual(r.tela,['7','3','4']);
  });
  await check('dupla continua 1 aula e alunos diferentes no mesmo horário continuam 2 (caso negativo)',async()=>{
   const r=await g.evaluate(()=>aulasDoDia(new Date(2026,9,15)).aulas.map(a=>a.hora+' '+a.cat+' '+a.entradas.length));
   assert.ok(r.includes('16:00 tenis 2'));assert.ok(r.includes('11:00 tenis 1')&&r.includes('11:00 personal 1'));
  });
  await check('"já dadas" usa a mesma conta e o aviso aponta as 3 repetições',async()=>{
   const t=await g.locator('#jh-ring-total-sub').innerText();
   assert.match(t,/^5 de 7 já dadas/);assert.match(t,/3 repetidas na agenda/);
  });
  await check('conferência lista cada aula, as repetições e o que não é aula, sem gravar nada',async()=>{
   await g.locator('#jh-ring-total-sub .ca-link').click();
   await g.waitForSelector('#ov-conf-aulas.on');
   const r=await g.evaluate(()=>({txt:document.getElementById('ca-corpo').innerText,linhas:document.querySelectorAll('#ca-corpo .ca-lista li').length,
    dadas:document.querySelectorAll('#ca-corpo .ca-lista li.dada').length,igual:JSON.stringify(DB)===window.ANTES,gravacoes:window.gravacoes}));
   assert.equal(r.linhas,7);assert.equal(r.dadas,5);
   assert.match(r.txt,/Fê Teste está às 19:00 e às 19:30/);
   assert.match(r.txt,/Ana Teste aparece duas vezes às 09:00 \(fixo e avulsa\)/);
   assert.match(r.txt,/Bia Teste aparece duas vezes às 10:00/);
   assert.match(r.txt,/2 alunos = 1 aula/);assert.match(r.txt,/13:00 Locação Fictícia \(locação\)/);
   assert.doesNotMatch(r.txt,/Compromisso fictício/);
   assert.equal(r.igual,true);assert.equal(r.gravacoes,0);
   await g.evaluate(()=>closeModal('ov-conf-aulas'));
  });
  await check('agenda do dia mostra o mesmo número de aulas do Início, ao lado dos atendimentos',async()=>{
   const t=await g.evaluate(()=>{agView='dia';agDate=new Date(2026,9,15);renderAgenda();return document.getElementById('ag-label').innerText;});
   assert.match(t,/7 aulas · 12 atendimentos/);
  });
  await check('ocupação: meia hora saiu da grade — dia útil tem 9 horários de aula, não 10',async()=>{
   const o=await g.evaluate(()=>ocupacao(new Date(2026,9,16),new Date(2026,9,16)));
   assert.equal(o.disp,9);assert.equal(o.ocup,1);assert.equal(o.pct,11);
  });
  await check('grade sem 14:30, 15:30, 19:30 e 20:30; marcação antiga às 19:30 continua aparecendo',async()=>{
   const r=await g.evaluate(()=>{
    const linhas=d=>{agView='dia';agDate=d;renderAgenda();return [...document.querySelectorAll('#ag-view .slot-h')].map(x=>x.textContent.slice(0,5));};
    const vazio=linhas(new Date(2026,9,16)),comAntiga=linhas(new Date(2026,9,15));
    agView='semana';agDate=new Date(2026,9,16);renderAgenda();
    const semana=[...document.querySelectorAll('#ag-view td.hr')].map(x=>x.textContent);
    return {vazio,comAntiga,semana,cfg:(()=>{abrirHorario();const t=[...document.querySelectorAll('#hhoras-list > div > span')].map(x=>x.textContent);closeModal('ov-horario');return t;})()};
   });
   const meias=['14:30','15:30','19:30','20:30'];
   meias.forEach(h=>{assert.ok(!r.vazio.includes(h),h);assert.ok(!r.cfg.includes(h),'config '+h);});
   assert.ok(r.vazio.includes('19:00')&&r.vazio.includes('20:00')&&r.vazio.includes('14:00'));
   assert.ok(r.comAntiga.includes('19:30'),'a aula antiga das 19:30 não pode sumir');assert.ok(!r.comAntiga.includes('14:30'));
   assert.ok(r.semana.includes('19:30')&&!r.semana.includes('20:30'));
  });
  await check('meia hora fechada para pedido novo; cancelar a aula antiga das 19:30 continua valendo',async()=>{
   const r=await g.evaluate(()=>{const a=DB.alunos.find(x=>x.id==='fe');
    return {modo:slotModo(new Date(2026,9,22),'19:30'),modo19:slotModo(new Date(2026,9,22),'19:00'),
     novo:pedidoAgendaValido({data:'2026-10-22',hora:'19:30',rec:'pontual',codigo:'fe'},a),
     cancela:pedidoAgendaValido({data:'2026-10-15',hora:'19:30',acao:'cancelar',codigo:'fe'},a),
     horas:horasPublicadas(),cfg:semMeiaHora(DB.horarioCfg)[4],
     cred:['14:00','15:00','19:00','20:00','19:30'].map(creditoSlot)};});
   assert.equal(r.modo,'fechado');assert.equal(r.modo19,'aula');
   assert.equal(r.novo,false);assert.equal(r.cancela,true);
   assert.ok(r.horas.includes('19:30'),'aluno com aula antiga às 19:30 ainda vê a aula');
   ['14:30','15:30','20:30'].forEach(h=>assert.ok(!r.horas.includes(h),h));
   assert.equal(r.cfg['19:30'],'fechado');assert.equal(r.cfg['14:30'],'fechado');
   assert.deepEqual(r.cred,[1,1,1,1,1]);
  });
  await check('comparativo Ano: 1º/jan até hoje contra o mesmo trecho do ano passado; sem histórico, sem %',async()=>{
   await g.evaluate(()=>trocarPeriodoCmp('ano'));
   const lerTela=()=>g.evaluate(()=>({n:['total','personal','tenis'].map(k=>document.getElementById('jh-cmp-'+k).textContent),
    d:document.getElementById('jh-cmp-total-d').textContent,sub:document.getElementById('jh-cmp-sub').textContent,
    lbl:document.getElementById('jh-mes-label').textContent,on:document.querySelector('.jh-seg button.on').id,
    nav:document.getElementById('jh-cmp-mesnav').hidden}));
   let r=await lerTela();
   // 7 quintas com fixo desde 03/09 (7 aulas cada) · 2025 até 15/10: 3 avulsas
   assert.deepEqual(r.n,['49','15','34']);assert.equal(r.on,'jh-cmp-ano');assert.equal(r.lbl,'2026');assert.equal(r.nav,false);
   assert.match(r.sub,/Desde 1º de janeiro até hoje \(15\/10\)/);assert.match(r.sub,/mesmo período de 2025/);
   assert.match(r.d,/1533%/);
   await g.evaluate(()=>navCmp(-1));r=await lerTela();
   assert.equal(r.lbl,'2025');assert.deepEqual(r.n,['4','1','3']);
   assert.match(r.sub,/sem 2024 inteiro no app para comparar/);assert.equal(r.d,'');
   await g.evaluate(()=>{navCmp(1);trocarPeriodoCmp('semana');});
   assert.equal(await g.evaluate(()=>curYear),2026);
  });
  await check('créditos em aberto: só ativos, quem deve não desconta, grupo do misto entra; reposição só a válida',async()=>{
   const r=await g.evaluate(()=>({cred:document.getElementById('k-creditos').textContent,repos:document.getElementById('k-repos-s').textContent}));
   // Ana 4 + Fê 1 + 2 de grupo = 7 (Bia −2 e Zé inativo fora) · Ana: 2 vencidas (maio), 1 válida
   assert.equal(r.cred,'7');assert.match(r.repos,/^1 reposições pendentes/);
  });
  await check('nada do banco mudou e nada foi gravado em todo o teste',async()=>{
   const r=await g.evaluate(()=>({igual:JSON.stringify(DB)===window.ANTES,gravacoes:window.gravacoes}));
   assert.equal(r.igual,true);assert.equal(r.gravacoes,0);
  });
  await check('✓ na aula das 19:00 desconta 1 aula, não ½',async()=>{
   const r=await g.evaluate(()=>{agView='dia';agDate=new Date(2026,9,16);renderAgenda();
    const a=DB.alunos.find(x=>x.id==='hugo'),antes=a.creditos;
    const ent=entriesFor(agDate,'19:00').find(e=>e.alunoId==='hugo');togglePresenca(ent.id);
    return {delta:a.creditos-antes,custo:DB.presencas[DB.presencas.length-1].custo};});
   assert.equal(r.delta,-1);assert.equal(r.custo,1);
  });
  await check('ano inteiro com 4 mil avulsas: o Início continua rápido',async()=>{
   const ms=await g.evaluate(()=>{
    const ex=[];for(let i=0;i<4000;i++){const d=new Date(2025,0,1+(i%640));ex.push({id:'x'+i,data:dKey(d),hora:HORAS_GRADE[1+(i%8)],titulo:'Hugo Teste',tipo:'aula',alunoId:'hugo'});}
    DB.agenda.eventos=DB.agenda.eventos.concat(ex);
    const medir=m=>{trocarPeriodoCmp(m);const t0=performance.now();renderDash();return performance.now()-t0;};
    const sem=medir('semana'),ano=medir('ano');trocarPeriodoCmp('semana');return {sem,ano};});
   console.log('   (Início: semana '+Math.round(ms.sem)+' ms · ano '+Math.round(ms.ano)+' ms)');
   assert.ok(ms.ano-ms.sem<1500,'o ano custou '+Math.round(ms.ano-ms.sem)+' ms a mais');
  });
  assert.deepEqual(errors,[]);
  console.log('\n✅ '+count+' verificações · números do Início');
 }catch(e){console.error('❌ '+(e&&e.message||e));process.exitCode=1;}
 finally{await b.close();server.close();}
})();

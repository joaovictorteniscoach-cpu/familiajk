/* Só créditos (dezembro de 2026, decisões do João em 13/11). A passagem é uma
   ferramenta que o João aciona uma vez: a sobra do pacote continua como crédito
   com o mês em que entrou, as aulas antigas guardadas viram crédito do tipo
   delas com a data de origem, o que passou de 6 meses sai, o João corrige com
   motivo e diz o tipo de quem faz particular + grupo. Versão salva antes,
   tudo no extrato com a mesma chave, desfazer. Depois dela a renovação soma o
   pacote ao que sobrou e a virada não converte nada. Só dados fictícios. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const DEZ=new Date('2026-12-01T09:00:00-03:00'),NOV=new Date('2026-11-30T09:00:00-03:00');
const DEPOIS=new Date('2026-12-01T10:00:00-03:00');   // o relógio anda depois da passagem
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
  const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));
  const dlg={resp:[],vistas:[]};g.on('dialog',d=>{dlg.vistas.push(d.message());const r=dlg.resp.length?dlg.resp.shift():false;r?d.accept():d.dismiss();});
  await g.clock.setFixedTime(DEZ);
  await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
  const dados=()=>g.evaluate(()=>{
   persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';for(const k in _ultAcao)delete _ultAcao[k];
   window.__copias=0;guardarVersoes=()=>{__copias++;return Promise.resolve(true);};
   window.__t=[];toast=m=>__t.push(m);_conflitoNuvem=null;
   const ts=s=>new Date(s+'T12:00:00-03:00').getTime();
   const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',plano:8,planoGrupo:0,creditos:0,credGrupo:0,repos:0,locCred:0,
     mensalidade:1280,valorAula:160,status:'pago',ultimoPago:'2026-11',ativo:true,extratoAberto:true,ultimaRenovacao:{mes:'2026-11',origem:'individual',ts:ts('2026-11-02')}},x||{});
   DB.alunos=[
    al('par','Aluna Pacote Oito',{creditos:3,repos:2}),
    al('mis','Aluno Misto',{plano:3,planoGrupo:2,grupoTipo:'Dupla',creditos:3,credGrupo:1,repos:3,mensalidade:660}),
    al('dup','Dupla Nova',{tipo:'Dupla',grupoTipo:'Dupla',plano:0,planoGrupo:4,credGrupo:2,repos:1,mensalidade:360}),
    al('neg','Personal Devendo',{tipo:'Personal',plano:4,creditos:-2,mensalidade:520,valorAula:130}),
    al('vel','Aula Muito Antiga',{plano:4,repos:1,mensalidade:640}),
    al('ina','Aluno Inativo',{ativo:false,arquivado:true,repos:3,mensalidade:640}),
    al('nad','Sem Nada',{plano:4,mensalidade:640})];
   const mv=(alunoId,campo,delta,data,motivo)=>({ts:ts(data),alunoId,campo,delta,de:0,para:0,motivo,ref:''});
   DB.movs=[mv('par','repos',1,'2026-08-01','Sobra do mês virou reposição'),mv('par','repos',1,'2026-10-01','Sobra do mês virou reposição'),
     mv('par','creditos',8,'2026-11-02','Renovação do mês'),mv('par','creditos',-5,'2026-11-20','Aula'),
     mv('mis','repos',3,'2026-10-01','Sobra do mês virou reposição'),
     mv('vel','repos',1,'2026-05-01','Sobra do mês virou reposição'),
     mv('ina','repos',3,'2026-09-01','Sobra do mês virou reposição')];
   DB.mesCreditos='2026-11';DB.mesPagamentos='2026-12';
   DB.agenda={fixos:[],eventos:[],excecoes:[]};DB.presencas=[];DB.pacoteUnico={ativo:false};delete DB.creditosUnicos;
   ensureFields();CARREGADO=true;renderAll();
  });
  const sal=id=>g.evaluate(id=>{const a=DB.alunos.find(x=>x.id===id);return {c:a.creditos,g:a.credGrupo,r:a.repos,l:a.locCred};},id);
  const linha=nome=>g.evaluate(nome=>{const l=[...document.querySelectorAll('#sc-corpo .rm-row')].find(x=>x.innerText.includes(nome));return l?l.innerText.replace(/\s+/g,' '):null;},nome);
  const passar=async()=>{dlg.resp=[true];await g.evaluate(()=>passarParaCreditos());await g.waitForFunction(()=>creditosUnicos());};

  await check('em novembro nada muda: sem aviso de passagem e a renovação antiga continua',async()=>{
   await g.clock.setFixedTime(NOV);await dados();
   assert.equal(await g.evaluate(()=>precisaPassagem()),false);
   assert.equal(await g.evaluate(()=>{renderViradaAviso();return /só créditos/.test(document.getElementById('virada-aviso').innerText);}),false);
   await g.clock.setFixedTime(DEZ);
  });
  await check('em dezembro, antes da passagem: Início avisa e renovar/virar o mês só abrem a passagem, sem mexer em saldo',async()=>{
   await dados();
   assert.equal(await g.evaluate(()=>precisaPassagem()),true);
   assert.match(await g.evaluate(()=>{renderViradaAviso();return document.getElementById('virada-aviso').innerText;}),/Dezembro: passar para só créditos/);
   const antes=await g.evaluate(()=>JSON.stringify(DB.alunos));
   for(const fn of ['renovarMes("par")','abrirRenovaMes()','aplicarViradaMes()','rmAplicar()']){
    dlg.vistas=[];dlg.resp=[true];await g.evaluate(fn);
    assert.match(dlg.vistas[0]||'',/Antes de virar o mês e renovar, passe para só créditos/,fn);
    assert.equal(await g.evaluate(()=>document.getElementById('so-creditos').classList.contains('on')),true,fn);
    await g.evaluate(()=>fecharPassagem());
   }
   assert.equal(await g.evaluate(()=>JSON.stringify(DB.alunos)),antes);
  });
  await check('prévia: sobra e aulas antigas viram crédito com a data de origem; o que passou de 6 meses sai; quem não tem nada não aparece',async()=>{
   await dados();await g.evaluate(()=>abrirPassagem());
   const par=await linha('Aluna Pacote Oito');
   assert.match(par,/Hoje: 3 particulares \+ 2 aulas antigas guardadas/);
   assert.match(par,/Fica: 5 particulares \(1 vence 31\/01 · 1 vence 31\/03 · 3 vencem 30\/04\)/);
   assert.match(par,/Pacote: 8 aulas · R\$ 1\.280/);
   const dup=await linha('Dupla Nova');
   assert.match(dup,/Fica: 3 em grupo/);assert.match(dup,/sem data contam a partir de dezembro/);assert.match(dup,/1 vence 31\/05/);
   const vel=await linha('Aula Muito Antiga');
   assert.match(vel,/1 aula\(s\) antiga\(s\) de maio\/26 passaram de 6 meses e saem/);assert.match(vel,/Fica: 0/);
   assert.match(await linha('Aluno Inativo'),/Inativo: os créditos ficam guardados/);
   assert.equal(await linha('Sem Nada'),null);
   assert.match(await linha('Personal Devendo'),/Deve 2 aula\(s\) particular/);
  });
  await check('particular + grupo: o botão espera o João dizer quantas aulas antigas são particulares',async()=>{
   await dados();await g.evaluate(()=>abrirPassagem());
   assert.match(await linha('Aluno Misto'),/Das 3 aulas antigas, quantas são particulares\?/);
   assert.match(await g.evaluate(()=>document.querySelector('#sc-pe button').innerText),/Falta o tipo das aulas antigas de 1 aluno/);
   assert.equal(await g.evaluate(()=>document.querySelector('#sc-pe button').disabled),true);
   await g.evaluate(()=>scTipo('mis','1'));
   assert.match(await linha('Aluno Misto'),/Fica: 4 particulares \+ 3 em grupo/);
   assert.match(await g.evaluate(()=>document.querySelector('#sc-pe button').innerText),/Passar 6 alunos para só créditos/);
  });
  await check('correção com motivo: o número final muda, e sem motivo não aceita',async()=>{
   await dados();await g.evaluate(()=>abrirPassagem());
   await g.evaluate(()=>{document.getElementById('sc-creditos-neg').value='2';scCorrigir('neg');});
   assert.match((await g.evaluate(()=>__t.pop()))||'',/Escreva o motivo/);
   await g.evaluate(()=>{document.getElementById('sc-creditos-neg').value='2';document.getElementById('sc-motivo-neg').value='pagou 4, fez 2';scCorrigir('neg');});
   const neg=await linha('Personal Devendo');
   assert.match(neg,/Fica: 2 particulares/);assert.match(neg,/Corrigido por você: pagou 4, fez 2/);
  });
  await check('passar: versão salva antes, saldos certos, reposição zerada, extrato com a mesma chave e as datas guardadas',async()=>{
   await dados();await g.evaluate(()=>{abrirPassagem();scTipo('mis','1');document.getElementById('sc-creditos-neg').value='2';document.getElementById('sc-motivo-neg').value='pagou 4, fez 2';scCorrigir('neg');});
   await g.evaluate(()=>{window.__dif=()=>DB.alunos.flatMap(a=>['creditos','credGrupo','repos'].map(cp=>a.id+'.'+cp+' '+credExato(saldoPeloExtrato(a,cp)-(Number(a[cp])||0))));});
   const difAntes=await g.evaluate(()=>__dif());
   dlg.vistas=[];await passar();
   assert.match(dlg.vistas[0],/Passar 6 aluno\(s\) para só créditos\?[\s\S]*9 aula\(s\) antiga\(s\) guardada\(s\) viram crédito[\s\S]*1 correção\(ões\) suas/);
   assert.equal(await g.evaluate(()=>__copias),1);
   assert.deepEqual(await sal('par'),{c:5,g:0,r:0,l:0});
   assert.deepEqual(await sal('mis'),{c:4,g:3,r:0,l:0});
   assert.deepEqual(await sal('dup'),{c:0,g:3,r:0,l:0});
   assert.deepEqual(await sal('neg'),{c:2,g:0,r:0,l:0});
   assert.deepEqual(await sal('vel'),{c:0,g:0,r:0,l:0});
   assert.deepEqual(await sal('ina'),{c:3,g:0,r:0,l:0});
   const r=await g.evaluate(()=>{const U=DB.creditosUnicos;return {U,par:DB.alunos.find(a=>a.id==='par').lotesCred,
     movs:DB.movs.filter(m=>m.ref===U.ref).map(m=>m.alunoId+' '+m.campo+' '+m.delta+' '+m.motivo),soma:__dif()};});
   assert.equal(r.U.desde,'2026-12');assert.equal(r.U.alunos.length,6);
   assert.deepEqual(r.par,{creditos:[{mes:'2026-08',qtd:1},{mes:'2026-10',qtd:1},{mes:'2026-11',qtd:3}],credGrupo:[],locCred:[]});
   assert.ok(r.movs.includes('par repos -2 Passagem para só créditos'));
   assert.ok(r.movs.includes('par creditos 2 Aulas antigas guardadas viraram crédito'));
   assert.ok(r.movs.includes('neg creditos 4 Correção na passagem: pagou 4, fez 2'));
   assert.ok(r.movs.includes('vel repos -1 Passagem para só créditos'));
   assert.deepEqual(r.soma,difAntes,'a passagem não cria diferença entre extrato e saldo');
   assert.match(await g.evaluate(()=>document.getElementById('sc-corpo').innerText),/Só créditos desde 01\/12\/2026/);
   await g.clock.setFixedTime(DEPOIS);
  });
  await check('depois: ficha sem reposição e com o próximo vencimento; o aluno recebe a marca e a data',async()=>{
   assert.equal(await g.evaluate(()=>vencimentoTxt(DB.alunos.find(a=>a.id==='par'))),'1 vence em 31/01');
   const f=await g.evaluate(()=>{fecharPassagem();abrirFicha('par');const t=document.getElementById('fic-corpo').innerText;fecharFicha();return t;});
   assert.match(f,/1 vence em 31\/01/);assert.doesNotMatch(f,/reposi/i);
   const p=await g.evaluate(()=>alunoPublicado(DB.alunos.find(a=>a.id==='par')));
   assert.equal(p.soCreditos,1);assert.deepEqual(p.credVence,{qtd:1,data:'2027-01-31'});
   assert.match(await g.evaluate(()=>{renderViradaAviso();return document.getElementById('virada-aviso').innerText;}),/O que sobrou de cada aluno continua como crédito/);
  });
  await check('renovar um aluno: o pacote soma ao que sobrou, sem linha de reposição',async()=>{
   dlg.vistas=[];dlg.resp=[true,false];await g.evaluate(()=>renovarMes('par'));
   assert.match(dlg.vistas[0],/Créditos: 5 → 13\s+\(\+8\)/);assert.match(dlg.vistas[0],/O que sobrou \(5\) continua como crédito, válido por 6 meses/);
   assert.doesNotMatch(dlg.vistas[0],/Reposi/);
   assert.deepEqual(await sal('par'),{c:13,g:0,r:0,l:0});
   const l=await g.evaluate(()=>lotesCred(DB.alunos.find(a=>a.id==='par'),'creditos'));
   assert.deepEqual(l,[{mes:'2026-08',qtd:1},{mes:'2026-10',qtd:1},{mes:'2026-11',qtd:3},{mes:'2026-12',qtd:8}]);
  });
  await check('quem deve: OK desconta do pacote novo; "já cobrei" zera a dívida e soma o pacote cheio',async()=>{
   await g.evaluate(()=>{const a=DB.alunos.find(x=>x.id==='nad');a.creditos=-1;});
   dlg.resp=[true,true];await g.evaluate(()=>renovarMes('nad'));
   assert.deepEqual(await sal('nad'),{c:3,g:0,r:0,l:0});
   await g.evaluate(()=>{const a=DB.alunos.find(x=>x.id==='vel');a.creditos=-1;for(const k in _ultAcao)delete _ultAcao[k];});
   dlg.resp=[false,true];await g.evaluate(()=>renovarMes('vel'));
   assert.deepEqual(await sal('vel'),{c:4,g:0,r:0,l:0});
  });
  await check('Renovar o mês (todos): mostra créditos antes → depois e não cria reposição',async()=>{
   const t=await g.evaluate(()=>{abrirRenovaMes();const l=[...document.querySelectorAll('#rm-corpo .rm-row')].find(x=>x.innerText.includes('Dupla Nova'));return l.innerText.replace(/\s+/g,' ');});
   assert.match(t,/Créditos 3 → 7 \(\+4 do pacote; o que sobrou continua\)/);assert.doesNotMatch(t,/Reposi/);
   dlg.resp=[true];await g.evaluate(()=>rmAplicar());
   assert.deepEqual(await sal('dup'),{c:0,g:7,r:0,l:0});
   assert.deepEqual(await sal('mis'),{c:7,g:5,r:0,l:0});
   assert.equal(await g.evaluate(()=>DB.movs.filter(m=>m.campo==='repos'&&m.ts>DB.creditosUnicos.ts).length),0);
   await g.evaluate(()=>fecharRenovaMes());
  });
  await check('a virada não converte nada; só tira o que passou de 6 meses, e o ✓ gasta o mais velho primeiro',async()=>{
   await g.clock.setFixedTime(new Date('2026-12-02T18:00:00-03:00'));
   await g.evaluate(()=>{const a=DB.alunos.find(x=>x.id==='par');mover(a,'creditos',-1,'Aula');});  // gasta o lote de agosto
   await g.clock.setFixedTime(new Date('2027-04-01T09:00:00-03:00'));
   const v=await g.evaluate(()=>({par:creditosVencidos(DB.alunos.find(a=>a.id==='par'),'creditos'),venc:viradaPendente()}));
   assert.equal(v.par,1,'outubro vence no fim de março; agosto já foi gasto');
   dlg.vistas=[];dlg.resp=[true];await g.evaluate(()=>aplicarViradaMes());
   assert.match(dlg.vistas[0],/Nada vira reposição[\s\S]*Aluna Pacote Oito: 1 crédito\(s\) com mais de 6 meses/);
   assert.deepEqual(await sal('par'),{c:11,g:0,r:0,l:0});
   assert.equal(await g.evaluate(()=>DB.movs.filter(m=>m.alunoId==='par').pop().motivo),'Crédito vencido (6 meses)');
   assert.equal(await g.evaluate(()=>DB.mesCreditos),'2027-04');
   await g.clock.setFixedTime(DEZ);
  });
  await check('desfazer a passagem: saldos voltam a créditos + aulas antigas separados, com versão salva antes',async()=>{
   await dados();await g.evaluate(()=>{abrirPassagem();scTipo('mis','1');});await passar();
   await g.evaluate(()=>{__copias=0;});
   dlg.resp=[true];await g.evaluate(()=>desfazerPassagem());await g.waitForFunction(()=>!creditosUnicos());
   assert.equal(await g.evaluate(()=>__copias),1);
   assert.deepEqual(await sal('par'),{c:3,g:0,r:2,l:0});assert.deepEqual(await sal('mis'),{c:3,g:1,r:3,l:0});
   assert.deepEqual(await sal('vel'),{c:0,g:0,r:1,l:0});
   assert.equal(await g.evaluate(()=>DB.alunos.some(a=>a.lotesCred)),false);
  });
  await check('cópia não confirmada ou outra sessão mexendo: nada muda',async()=>{
   await dados();await g.evaluate(()=>{abrirPassagem();scTipo('mis','1');guardarVersoes=()=>Promise.resolve(false);});
   dlg.resp=[true];await g.evaluate(()=>passarParaCreditos());
   assert.equal(await g.evaluate(()=>creditosUnicos()),false);assert.deepEqual(await sal('par'),{c:3,g:0,r:2,l:0});
   await g.evaluate(()=>{guardarVersoes=()=>Promise.resolve(true);_conflitoNuvem={};});
   dlg.resp=[true];await g.evaluate(()=>passarParaCreditos());
   assert.equal(await g.evaluate(()=>creditosUnicos()),false);
   await g.evaluate(()=>{_conflitoNuvem=null;});
  });
  await check('o extrato não resume os créditos depois da passagem (a data de cada um decide o vencimento)',async()=>{
   await dados();await g.evaluate(()=>{abrirPassagem();scTipo('mis','1');});await passar();
   const n=await g.evaluate(()=>{const a=DB.alunos.find(x=>x.id==='par');const t0=DB.creditosUnicos.ts;
     for(let i=0;i<650;i++)DB.movs.push({ts:t0+10+i,alunoId:'par',campo:'creditos',delta:i%2?-1:1,de:0,para:0,motivo:'Aula',ref:''});
     podarMovs('par');return DB.movs.filter(m=>m.alunoId==='par'&&m.campo==='creditos'&&m.ts>t0).length;});
   assert.equal(n,650);
  });
  assert.deepEqual(erros,[]);
  console.log('✅ '+count+' verificações · só créditos: passagem, renovação, virada e desfazer');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error('❌',e);process.exit(1);});

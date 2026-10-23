/* Usar o que o aluno já tem antes de cobrar extra (22–23/10, pedido do João).
   O ✓ tirava sempre do saldo do tipo da aula e deixava o aluno negativo, mesmo
   com reposição sobrando. Agora: particular → crédito do mês, depois reposição
   válida; grupo → crédito de grupo, depois reposição; horário de reposição →
   reposição, depois crédito do tipo. Só o que nenhum saldo cobre vira extra
   (negativo). Locação continua só nas horas de locação. Desmarcar devolve
   parte por parte. Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-19T20:00:00-03:00');   // segunda-feira à noite
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
  const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.accept());
  await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
  const dados=()=>g.evaluate(()=>{
   persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';window.__t=[];toast=m=>__t.push(m);toastDesfazer=(m,f)=>{__t.push(m);window.__desf=f;};
   const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',plano:4,planoGrupo:0,creditos:0,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true},x||{});
   DB.alunos=[al('m1','Mista Teste',{planoGrupo:4,credGrupo:2}),al('c1','Com Crédito',{creditos:2}),
    al('v1','Reposição Vencida'),al('g1','Grupo Sem Crédito',{tipo:'Dupla',plano:0,planoGrupo:4}),
    al('s1','Meio Crédito',{creditos:0.5}),al('z1','Sem Nada'),al('r1','Repõe Sem Banco',{creditos:2}),
    al('l1','Locação Teste',{tipo:'Locação',plano:0,locCred:0})];
   DB.presencas=[];DB.movs=[];DB.pacoteUnico={ativo:false};
   const A=id=>DB.alunos.find(a=>a.id===id);
   [['m1',6],['c1',3],['g1',3],['s1',2],['l1',4]].forEach(([id,n])=>mover(A(id),'repos',n,'Sobra do mês virou reposição'));
   A('v1').repos=2;DB.movs.push({ts:new Date('2026-05-10T12:00:00').getTime(),alunoId:'v1',campo:'repos',delta:2,de:0,para:2,motivo:'Sobra do mês virou reposição',ref:''});
   const fx=(id,hora,alunoId,tipo)=>({id,dia:1,hora,titulo:A(alunoId).nome,tipo,alunoId,pessoas:tipo==='grupo'?2:1,desde:'2026-10-01'});
   const ev=(id,hora,alunoId,tipo,repo)=>({id,data:'2026-10-19',hora,titulo:A(alunoId).nome,tipo,alunoId,pessoas:1,repo:repo?1:0});
   DB.agenda={fixos:[fx('f1','09:00','m1','aula'),fx('f2','10:00','c1','aula'),fx('f3','11:00','v1','aula'),fx('f4','17:00','g1','grupo'),
     fx('f5','18:00','m1','grupo'),fx('f6','06:00','s1','aula'),fx('f7','07:00','z1','aula')],
    eventos:[ev('e1','12:00','r1','aula',1),ev('e2','13:00','z1','aula',1),ev('e3','14:00','l1','locacao')],excecoes:[]};
   ensureFields();CARREGADO=true;agDate=new Date('2026-10-19T12:00:00');curYear=2026;curMonth=9;
   document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));renderAll();
  });
  const sal=id=>g.evaluate(id=>{const a=DB.alunos.find(x=>x.id===id);return {cred:a.creditos,grp:a.credGrupo,repos:a.repos};},id);
  const pres=id=>g.evaluate(id=>DB.presencas.filter(p=>p.alunoId===id).map(p=>p.hora+':'+p.tipo),id);
  const marcar=id=>g.evaluate(id=>{togglePresenca(id);return __t[__t.length-1];},id);

  await check('particular sem crédito e com reposição: o ✓ tira da reposição, não deixa negativo',async()=>{
   await dados();const t=await marcar('f1');
   assert.deepEqual(await sal('m1'),{cred:0,grp:2,repos:5});
   assert.deepEqual(await pres('m1'),['09:00:reposicao']);
   assert.match(t,/Mista Teste: 1 da reposição → 5 reposições/);
   const mv=await g.evaluate(()=>DB.movs.filter(m=>m.alunoId==='m1').pop());
   assert.equal(mv.campo,'repos');assert.equal(mv.motivo,'Reposição na agenda');
  });
  await check('desmarcar devolve para a reposição; marcar de novo conta uma reposição só no fechamento',async()=>{
   await marcar('f1');
   assert.deepEqual(await sal('m1'),{cred:0,grp:2,repos:6});assert.deepEqual(await pres('m1'),[]);
   await marcar('f1');
   const r=await g.evaluate(()=>({tipo:fcAulasDoMes(DB.alunos[0],'2026-10').find(x=>x.data==='2026-10-19'&&x.hora==='09:00').tipo,usadas:fcConciliacao(DB.alunos[0],'2026-10').reposUsadas}));
   assert.equal(r.tipo,'reposicao');assert.equal(r.usadas,1,'desmarcar e marcar de novo não conta duas');
  });
  await check('com crédito do mês: continua tirando do crédito (aviso de sempre)',async()=>{
   const t=await marcar('f2');
   assert.deepEqual(await sal('c1'),{cred:1,grp:0,repos:3});assert.deepEqual(await pres('c1'),['10:00:aula']);
   assert.match(t,/✓ Presença \(1 aula\) · Com Crédito → 1 créditos/);
  });
  await check('reposição vencida (mais de 4 meses) não é usada: vira aula extra',async()=>{
   await marcar('f3');
   assert.deepEqual(await sal('v1'),{cred:-1,grp:0,repos:2});assert.deepEqual(await pres('v1'),['11:00:aula']);
  });
  await check('grupo sem crédito de grupo e com reposição: sai da reposição; com crédito de grupo, do grupo',async()=>{
   const t=await marcar('f4');
   assert.deepEqual(await sal('g1'),{cred:0,grp:0,repos:2});assert.deepEqual(await pres('g1'),['17:00:reposicao']);
   assert.match(t,/Aula em grupo \(1 aula\) · Grupo Sem Crédito: 1 da reposição → 2 reposições/);
   await marcar('f5');
   assert.deepEqual(await sal('m1'),{cred:0,grp:1,repos:5},'aluno misto: grupo sai do grupo, nunca do particular');
  });
  await check('meio crédito: usa o ½ que tem e completa com ½ da reposição; desmarcar devolve cada parte',async()=>{
   const t=await marcar('f6');
   assert.deepEqual(await sal('s1'),{cred:0,grp:0,repos:1.5});
   assert.match(t,/½|0,5 do crédito do mês \+ 0,5 da reposição/);
   await marcar('f6');
   assert.deepEqual(await sal('s1'),{cred:0.5,grp:0,repos:2});
  });
  await check('sem saldo nenhum: aí sim vira aula extra (negativo), como antes',async()=>{
   const t=await marcar('f7');
   assert.deepEqual(await sal('z1'),{cred:-1,grp:0,repos:0});assert.match(t,/→ -1 créditos/);
  });
  await check('horário de reposição sem reposição: sai do crédito do mês (antes recusava)',async()=>{
   const t=await marcar('e1');
   assert.deepEqual(await sal('r1'),{cred:1,grp:0,repos:0});assert.deepEqual(await pres('r1'),['12:00:aula']);
   assert.match(t,/Reposição \(1 aula\) · Repõe Sem Banco: 1 do crédito do mês → 1 créditos/);
   const tipo=await g.evaluate(()=>fcAulasDoMes(DB.alunos.find(a=>a.id==='r1'),'2026-10').find(x=>x.hora==='12:00').tipo);
   assert.equal(tipo,'aula','fechamento: saiu do crédito, conta como aula');
   await marcar('e1');assert.deepEqual(await sal('r1'),{cred:2,grp:0,repos:0});
  });
  await check('horário de reposição sem saldo nenhum: aula extra no crédito',async()=>{
   const t=await marcar('e2');
   assert.deepEqual(await sal('z1'),{cred:-2,grp:0,repos:0});assert.match(t,/1 extra a cobrar → -2 créditos/);
  });
  await check('locação: só as horas de locação (reposição de aula não paga locação)',async()=>{
   await marcar('e3');
   const a=await g.evaluate(()=>{const a=DB.alunos.find(x=>x.id==='l1');return [a.locCred,a.repos];});
   assert.deepEqual(a,[-1,4]);
  });
  await check('botão "Aula realizada" do cartão: mesma regra e o desfazer devolve à reposição',async()=>{
   await dados();await g.evaluate(()=>aulaRealizada('m1','aula',1));
   assert.deepEqual(await sal('m1'),{cred:0,grp:2,repos:5});
   assert.match(await g.evaluate(()=>__t.pop()),/1 da reposição → 5 reposições/);
   await g.evaluate(()=>__desf());
   assert.deepEqual(await sal('m1'),{cred:0,grp:2,repos:6});assert.deepEqual(await pres('m1'),[]);
   assert.match(await g.evaluate(()=>__t.pop()),/6 reposições/);
   await g.evaluate(()=>aulaRealizada('g1','grupo',1));
   assert.deepEqual(await sal('g1'),{cred:0,grp:0,repos:2},'grupo pelo cartão: também usa a reposição');
  });
  await check('reposição de grupo não paga aula particular (e vice-versa); misto usa nos dois',async()=>{
   await dados();
   await g.evaluate(()=>{
    const A=id=>DB.alunos.find(a=>a.id===id);
    DB.alunos.push(Object.assign({},A('z1'),{id:'p2',nome:'Particular Sem Crédito',codigo:'p2'}));
    mover(A('p2'),'repos',3,'Sobra do mês virou reposição');
    const ev=(id,hora,alunoId,tipo,repo)=>({id,data:'2026-10-19',hora,titulo:A(alunoId).nome,tipo,alunoId,pessoas:tipo==='grupo'?2:1,repo:repo?1:0});
    DB.agenda.eventos.push(ev('e4','15:00','g1','aula',1),ev('e5','16:00','p2','grupo',0),ev('e6','08:00','g1','aula',0));
   });
   let t=await marcar('e4');   // aluno só de grupo numa reposição em horário particular
   assert.deepEqual(await sal('g1'),{cred:-1,grp:0,repos:3},'não usa a reposição de grupo; vira aula particular extra');
   assert.match(t,/1 extra a cobrar → -1 créditos \(a reposição de Grupo é de aula em grupo, não vale aqui\)/);
   await marcar('e6');            // aula particular normal de aluno de grupo: também não usa a reposição
   assert.deepEqual(await sal('g1'),{cred:-2,grp:0,repos:3});
   await marcar('e5');            // aluno só particular numa aula em grupo
   assert.deepEqual(await sal('p2'),{cred:0,grp:-1,repos:3},'não usa a reposição particular numa aula de grupo');
   await g.evaluate(()=>{DB.alunos.find(a=>a.id==='m1').credGrupo=0;});
   await marcar('f1');await marcar('f5');   // misto: particular e grupo podem usar a reposição
   assert.deepEqual(await sal('m1'),{cred:0,grp:0,repos:4},'misto: particular e grupo saíram da reposição');
   await g.evaluate(()=>aulaRealizada('g1','aula',1));
   assert.deepEqual(await sal('g1'),{cred:-3,grp:0,repos:3},'cartão: mesma regra');
  });
  assert.deepEqual(erros,[]);await c.close();

  /* App do aluno: só oferece reposição no tipo de aula do plano. */
  const ca=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await ca.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await ca.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const p=await ca.newPage(),errosA=[];p.on('pageerror',e=>errosA.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.clock.setFixedTime(new Date('2026-10-20T07:00:00-03:00'));
  await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof escolherSlot==='function');
  const aluno=x=>p.evaluate(x=>{
   init=async()=>{};saveMeu=async()=>{};window.__t=[];toast=m=>__t.push(m);
   EU=Object.assign({codigo:'6601',nome:'Aluno Teste',tipo:'Particular',plano:4,planoGrupo:0,creditos:0,credGrupo:0,repos:3,reposValidas:3,locCred:0,mensalidade:640,status:'pago',ativo:true},x);
   PUB={horas:['07:00','10:00','13:00','17:00','20:00'],profs:[],horarioCfg:{},horarioData:{},reservasRespostas:[],historico:{},alunos:[EU],
    precos:{avulsaPart:170,avulsaGrupo:95,locacao:70,personal:130},grupoPreco:{dupla:90,trio:85,quarteto:80},
    grade:{fixos:[],excecoes:[],eventos:[{id:'g1',cod:'7702',data:'2026-10-21',hora:'17:00',tipo:'grupo',pessoas:3}]}};
   MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[],espera:[]};
   document.getElementById('login').style.display='none';document.getElementById('app').style.display='block';
   try{render();}catch(e){}
   const op=h=>{document.getElementById('ov-pick').classList.remove('on');gotoBook(2026,9,21,h);return document.getElementById('pick-opts').innerText;};
   return {part:op('10:00'),grupo:op('17:00'),tipo:tipoReposAluno()};
  },x);
  await check('app do aluno: aluno particular só vê reposição em aula particular',async()=>{
   const r=await aluno({});
   assert.equal(r.tipo,'part');assert.match(r.part,/Marcar reposição/);assert.doesNotMatch(r.grupo,/Reposição na aula em grupo/);
  });
  await check('app do aluno: aluno de grupo só vê reposição em aula de grupo; misto vê nas duas',async()=>{
   let r=await aluno({tipo:'Dupla',plano:0,planoGrupo:4});
   assert.equal(r.tipo,'grupo');assert.doesNotMatch(r.part,/Marcar reposição/);assert.match(r.grupo,/Reposição na aula em grupo/);
   const t=await p.evaluate(()=>{irMarcarReposicao();return __t.pop();});
   assert.match(t,/horário de aula em grupo/);
   const v=await p.evaluate(()=>{JVVozAluno.abrir();document.getElementById('va-texto').value='quero repor uma aula';JVVozAluno.enviar();return document.getElementById('va-conversa').innerText;});
   assert.match(v,/Sua reposição é de aula em grupo/);
   r=await aluno({plano:4,planoGrupo:4});
   assert.equal(r.tipo,null);assert.match(r.part,/Marcar reposição/);assert.match(r.grupo,/Reposição na aula em grupo/);
  });
  assert.deepEqual(errosA,[]);await ca.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · usa o saldo que o aluno tem antes de cobrar extra');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

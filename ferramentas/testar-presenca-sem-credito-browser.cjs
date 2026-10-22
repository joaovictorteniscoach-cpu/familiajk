/* Aula particular marcada sem crédito do mês (22/10, pedido do João). O ✓ tirava
   sempre do crédito e deixava o aluno negativo, mesmo com reposição sobrando.
   Agora, sem crédito que cubra a aula e com reposição VÁLIDA, sai da reposição;
   desmarcar devolve à reposição. Grupo, locação e quem tem crédito: como antes.
   Só dados fictícios, relógio fixo. */
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
    al('v1','Reposição Vencida'),al('g1','Grupo Sem Crédito',{tipo:'Dupla',plano:0,planoGrupo:4})];
   DB.presencas=[];DB.movs=[];DB.pacoteUnico={ativo:false};
   const m1=DB.alunos[0],c1=DB.alunos[1],v1=DB.alunos[2],g1=DB.alunos[3];
   mover(m1,'repos',6,'Sobra do mês virou reposição');mover(c1,'repos',3,'Sobra do mês virou reposição');
   mover(g1,'repos',3,'Sobra do mês virou reposição');
   v1.repos=2;DB.movs.push({ts:new Date('2026-05-10T12:00:00').getTime(),alunoId:'v1',campo:'repos',delta:2,de:0,para:2,motivo:'Sobra do mês virou reposição',ref:''});
   const fx=(id,hora,alunoId,tipo)=>({id,dia:1,hora,titulo:DB.alunos.find(a=>a.id===alunoId).nome,tipo,alunoId,pessoas:tipo==='grupo'?2:1,desde:'2026-10-01'});
   DB.agenda={fixos:[fx('f1','09:00','m1','aula'),fx('f2','10:00','c1','aula'),fx('f3','11:00','v1','aula'),fx('f4','17:00','g1','grupo'),fx('f5','18:00','m1','grupo')],eventos:[],excecoes:[]};
   ensureFields();CARREGADO=true;agDate=new Date('2026-10-19T12:00:00');curYear=2026;curMonth=9;
   document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));renderAll();
  });
  const sal=id=>g.evaluate(id=>{const a=DB.alunos.find(x=>x.id===id);return {cred:a.creditos,grp:a.credGrupo,repos:a.repos};},id);
  const pres=id=>g.evaluate(id=>DB.presencas.filter(p=>p.alunoId===id).map(p=>p.hora+':'+p.tipo),id);

  await check('sem crédito particular e com reposição: o ✓ tira da reposição, não deixa negativo',async()=>{
   await dados();await g.evaluate(()=>togglePresenca('f1'));
   assert.deepEqual(await sal('m1'),{cred:0,grp:2,repos:5});
   assert.deepEqual(await pres('m1'),['09:00:reposicao']);
   const t=await g.evaluate(()=>__t.pop());assert.match(t,/sem crédito do mês: saiu da reposição → 5 reposições/);
   const mv=await g.evaluate(()=>DB.movs.filter(m=>m.alunoId==='m1').pop());
   assert.equal(mv.campo,'repos');assert.equal(mv.motivo,'Reposição na agenda');
  });
  await check('desmarcar o ✓ devolve para a reposição',async()=>{
   await g.evaluate(()=>togglePresenca('f1'));
   assert.deepEqual(await sal('m1'),{cred:0,grp:2,repos:6});assert.deepEqual(await pres('m1'),[]);
  });
  await check('fechamento do mês conta essa aula como reposição',async()=>{
   await dados();await g.evaluate(()=>togglePresenca('f1'));
   const r=await g.evaluate(()=>({tipo:fcAulasDoMes(DB.alunos[0],'2026-10').find(x=>x.data==='2026-10-19'&&x.hora==='09:00').tipo,usadas:fcConciliacao(DB.alunos[0],'2026-10').reposUsadas}));
   assert.equal(r.tipo,'reposicao');assert.equal(r.usadas,1);
  });
  await check('com crédito particular: continua tirando do crédito',async()=>{
   await g.evaluate(()=>togglePresenca('f2'));
   assert.deepEqual(await sal('c1'),{cred:1,grp:0,repos:3});assert.deepEqual(await pres('c1'),['10:00:aula']);
  });
  await check('reposição vencida (mais de 4 meses) não é usada: fica negativo como antes',async()=>{
   await g.evaluate(()=>togglePresenca('f3'));
   assert.deepEqual(await sal('v1'),{cred:-1,grp:0,repos:2});assert.deepEqual(await pres('v1'),['11:00:aula']);
  });
  await check('aula em grupo sem crédito de grupo: não usa reposição particular',async()=>{
   await g.evaluate(()=>togglePresenca('f4'));
   assert.deepEqual(await sal('g1'),{cred:0,grp:-1,repos:3});
   await g.evaluate(()=>togglePresenca('f5'));
   assert.deepEqual(await sal('m1'),{cred:0,grp:1,repos:5},'aluno misto: grupo sai do grupo');
  });
  await check('botão "Aula realizada" do cartão: mesma regra e o desfazer devolve à reposição',async()=>{
   await dados();await g.evaluate(()=>aulaRealizada('m1','aula',1));
   assert.deepEqual(await sal('m1'),{cred:0,grp:2,repos:5});
   assert.match(await g.evaluate(()=>__t.pop()),/saiu da reposição/);
   await g.evaluate(()=>__desf());
   assert.deepEqual(await sal('m1'),{cred:0,grp:2,repos:6});assert.deepEqual(await pres('m1'),[]);
   assert.match(await g.evaluate(()=>__t.pop()),/6 reposições/);
  });
  assert.deepEqual(erros,[]);await c.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · ✓ sem crédito usa a reposição');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

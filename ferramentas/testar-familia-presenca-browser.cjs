/* Aula em família no ✓ (19/10). Casal e família fazem aula em grupo juntos,
   mas cada um tem o seu cadastro: um levava ✓ e o outro não, e os créditos
   ficavam diferentes. Agora o ✓ de um pergunta pelo outro — só por quem está
   NESSE horário: com marcação própria nele ou com o nome escrito nele (ex.:
   "Responsável e Cônjuge"). Familiar que faz aula em outro horário não entra
   na pergunta (28/10, pedido do João). Só dados fictícios, relógio fixo. */
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
  const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));
  const dlg={resp:[],vistas:[]};g.on('dialog',d=>{dlg.vistas.push(d.message());const r=dlg.resp.length?dlg.resp.shift():false;r?d.accept():d.dismiss();});
  await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
  const dados=()=>g.evaluate(()=>{
   persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';window.__t=[];toast=m=>__t.push(m);
   const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Dupla',plano:0,planoGrupo:4,creditos:0,credGrupo:4,repos:0,locCred:0,mensalidade:500,status:'pago',ativo:true,extratoAberto:true},x||{});
   DB.alunos=[al('r1','Responsável Teste'),al('d1','Cônjuge Teste',{responsavelId:'r1',parentesco:'Cônjuge',mensalidade:0}),
    al('x1','Outro Aluno'),al('p1','Particular Teste',{tipo:'Particular',plano:4,planoGrupo:0,creditos:4,credGrupo:0}),
    al('d2','Filho Teste',{responsavelId:'p1',parentesco:'Filho(a)',tipo:'Particular',plano:4,planoGrupo:0,creditos:4,credGrupo:0,mensalidade:0})];
   const fx=(id,dia,hora,alunoId,tipo,pessoas)=>({id,dia,hora,titulo:DB.alunos.find(a=>a.id===alunoId).nome,tipo,alunoId,pessoas,desde:'2026-10-01'});
   DB.agenda={fixos:[fx('f1',1,'18:00','r1','grupo',2),fx('f2',1,'18:00','d1','grupo',2),
     fx('f3',1,'19:00','r1','grupo',3),fx('f4',1,'08:00','x1','grupo',2),fx('f8',1,'08:00','r1','grupo',2),fx('f5',1,'09:00','p1','aula'),fx('f6',1,'09:00','d2','aula')],eventos:[],excecoes:[]};
   DB.presencas=[];DB.movs=[];ensureFields();CARREGADO=true;
   agDate=new Date('2026-10-19T12:00:00');curYear=2026;curMonth=9;
   document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));renderAll();
  });
  const est=()=>g.evaluate(()=>({sal:Object.fromEntries(DB.alunos.map(a=>[a.id,[a.creditos,a.credGrupo]])),
   pres:DB.presencas.filter(p=>!ehMarca(p)).map(p=>p.alunoId+'@'+p.hora).sort(),ev:DB.agenda.eventos.map(e=>e.alunoId+'@'+e.hora+':'+e.tipo)}));

  await check('✓ no responsável pergunta pelo cônjuge; OK marca e desconta dos dois',async()=>{
   await dados();dlg.vistas=[];dlg.resp=[true];
   await g.evaluate(()=>togglePresenca('f1'));
   const r=await est();
   assert.equal(dlg.vistas.length,1);assert.match(dlg.vistas[0],/Aula em família · 19\/10 · Seg às 18:00/);
   assert.match(dlg.vistas[0],/Marcar também a presença de Cônjuge Teste\?\nDesconta a aula de Cônjuge também\./);
   assert.deepEqual(r.pres,['d1@18:00','r1@18:00']);assert.deepEqual(r.sal.r1,[0,3]);assert.deepEqual(r.sal.d1,[0,3]);
  });
  await check('desmarcar um pergunta pelo outro; OK devolve aos dois',async()=>{
   dlg.vistas=[];dlg.resp=[true];
   await g.evaluate(()=>togglePresenca('f2'));
   const r=await est();
   assert.match(dlg.vistas[0],/Desmarcar também a presença de Responsável Teste\?/);
   assert.deepEqual(r.pres,[]);assert.deepEqual(r.sal.r1,[0,4]);assert.deepEqual(r.sal.d1,[0,4]);
  });
  await check('Cancelar marca só quem foi tocado',async()=>{
   await dados();dlg.vistas=[];dlg.resp=[false];
   await g.evaluate(()=>togglePresenca('f2'));
   const r=await est();assert.equal(dlg.vistas.length,1);
   assert.deepEqual(r.pres,['d1@18:00']);assert.deepEqual(r.sal.r1,[0,4]);assert.deepEqual(r.sal.d1,[0,3]);
   // o outro já está igual: não pergunta de novo
   dlg.vistas=[];await g.evaluate(()=>togglePresenca('f1'));
   assert.equal(dlg.vistas.length,0,'os dois com ✓: nada a perguntar');
  });
  await check('aula com outra pessoa, familiar no próprio horário: o ✓ não pergunta pelo familiar (caso do João, 28/10)',async()=>{
   await dados();dlg.vistas=[];dlg.resp=[true];
   await g.evaluate(()=>togglePresenca('f8'));   // responsável às 08:00 com Outro Aluno; o cônjuge faz aula às 18:00
   let r=await est();
   assert.equal(dlg.vistas.length,0,'nada de perguntar pelo cônjuge');
   assert.deepEqual(r.pres,['r1@08:00']);assert.deepEqual(r.ev,[]);assert.deepEqual(r.sal.d1,[0,4],'o cônjuge não perde aula');
   await dados();dlg.vistas=[];dlg.resp=[true];
   await g.evaluate(()=>togglePresenca('f3'));   // às 19:00 só o responsável, sem o nome do cônjuge
   r=await est();assert.equal(dlg.vistas.length,0);assert.deepEqual(r.pres,['r1@19:00']);assert.deepEqual(r.ev,[]);
  });
  await check('nome do familiar escrito no horário ("Responsável Teste e Cônjuge"): OK coloca na aula (só nesta data) e marca; Cancelar deixa como está',async()=>{
   await dados();await g.evaluate(()=>{DB.agenda.fixos.find(f=>f.id==='f3').titulo='Responsável Teste e Cônjuge';});
   dlg.vistas=[];dlg.resp=[true];
   await g.evaluate(()=>togglePresenca('f3'));
   let r=await est();
   assert.match(dlg.vistas[0],/Cônjuge Teste está escrito\(a\) neste horário, mas sem marcação própria\.\nFez a aula junto com Responsável\?/);
   assert.deepEqual(r.ev,['d1@19:00:grupo']);assert.deepEqual(r.pres,['d1@19:00','r1@19:00']);assert.deepEqual(r.sal.d1,[0,3]);
   assert.equal(await g.evaluate(()=>entriesFor(new Date('2026-10-26T12:00:00'),'19:00').some(e=>e.alunoId==='d1')),false,'só nesta data');
   await dados();await g.evaluate(()=>{DB.agenda.fixos.find(f=>f.id==='f3').titulo='Responsável Teste e Cônjuge';});
   dlg.resp=[false];await g.evaluate(()=>togglePresenca('f3'));
   r=await est();assert.deepEqual(r.ev,[]);assert.deepEqual(r.pres,['r1@19:00']);
  });
  await check('grupo cheio: não coloca o cônjuge e avisa',async()=>{
   await dados();
   await g.evaluate(()=>{const f3=DB.agenda.fixos.find(f=>f.id==='f3');f3.pessoas=2;f3.titulo='Responsável Teste e Cônjuge';DB.agenda.fixos.push({id:'f7',dia:1,hora:'19:00',titulo:'Outro Aluno',tipo:'grupo',alunoId:'x1',pessoas:2,desde:'2026-10-01'});});
   dlg.vistas=[];dlg.resp=[true];await g.evaluate(()=>togglePresenca('f3'));
   const r=await est();assert.deepEqual(r.ev,[]);
   assert.match(await g.evaluate(()=>__t.join(' | ')),/grupo deste horário já está cheio/);
  });
  await check('casos negativos: aluno sem família e aula particular da família não perguntam',async()=>{
   await dados();dlg.vistas=[];
   await g.evaluate(()=>{togglePresenca('f4');togglePresenca('f5');});
   assert.equal(dlg.vistas.length,0);
   assert.deepEqual((await est()).pres,['p1@09:00','x1@08:00']);
  });
  await check('Conferir números lista a aula em família com ✓ de um só, sem mudar nada',async()=>{
   await dados();dlg.resp=[false];await g.evaluate(()=>togglePresenca('f1'));
   const r=await g.evaluate(()=>{const antes=JSON.stringify(DB);
    const t=achadosDoAluno(DB.alunos.find(a=>a.id==='r1')).map(x=>x.txt).join(' | '),dep=achadosDoAluno(DB.alunos.find(a=>a.id==='d1')).map(x=>x.txt).join(' | ');
    return {t,dep,igual:JSON.stringify(DB)===antes};});
   assert.match(r.t,/Família de Responsável Teste: 1 aula\(s\) em grupo neste mês com presença de um e não do outro: 19\/10 18:00 \(sem ✓: Cônjuge\)/);
   assert.doesNotMatch(r.dep,/Família de/,'aparece uma vez só, no responsável');assert.ok(r.igual,'só lista');
  });
  await check('Conferir números não lista a aula do responsável com outra pessoa (familiar em outro horário)',async()=>{
   await dados();await g.evaluate(()=>togglePresenca('f8'));
   const t=await g.evaluate(()=>achadosDoAluno(DB.alunos.find(a=>a.id==='r1')).map(x=>x.txt).join(' | '));
   assert.doesNotMatch(t,/Família de Responsável Teste/);
  });
  assert.deepEqual(erros,[]);
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · aula em família no ✓');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

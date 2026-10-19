/* Renovação com aula já feita e não paga (19/10). O João pediu: quem fez
   aula além do pacote tem essas aulas descontadas da renovação (antes a
   renovação zerava a dívida e mandava cobrar à parte). Quem já cobrou à
   parte escolhe "já cobrei". No extrato resumido, a renovação é uma linha
   só, com as reposições. Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-11-02T10:00:00-03:00');
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
   persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';guardarVersoes=()=>Promise.resolve(true);for(const k in _ultAcao)delete _ultAcao[k];window.__t=[];toast=m=>__t.push(m);
   const al=(id,nome,creditos,repos)=>({id,nome,codigo:id,tipo:'Particular',plano:8,planoGrupo:0,creditos,credGrupo:0,repos,locCred:0,mensalidade:800,valorAula:160,status:'pago',ativo:true,extratoAberto:true});
   DB.alunos=[al('dev','Aluno Devendo',-2,0),al('sob','Aluno Sobra',3,0),al('zer','Aluno Zerado',0,0)];
   DB.movs=[];DB.agenda={fixos:[],eventos:[],excecoes:[]};DB.presencas=[];DB.pacoteUnico={ativo:false};
   ensureFields();CARREGADO=true;renderAll();
  });
  const sal=id=>g.evaluate(id=>{const a=DB.alunos.find(x=>x.id===id);return [a.creditos,a.repos];},id);
  const ext=id=>g.evaluate(id=>{abrirExtrato(id);const l=[...document.querySelectorAll('#ext-corpo tr')].slice(1).map(tr=>tr.innerText.replace(/\s+/g,' ').trim());closeModal('ov-extrato');return l;},id);

  await check('renovar quem deve 2 aulas: OK desconta (8 − 2 = 6) e o extrato mostra uma linha',async()=>{
   await dados();dlg.vistas=[];dlg.resp=[true,true];
   await g.evaluate(()=>renovarMes('dev'));
   assert.match(dlg.vistas[0],/Aluno Devendo fez 2 aula\(s\) além do pacote que ainda não foram pagas\.[\s\S]*OK = descontar desta renovação \(recebe 6 em vez de 8\)[\s\S]*Cancelar = já cobrei à parte/);
   assert.match(dlg.vistas[1],/Créditos: -2 → 6/);assert.match(dlg.vistas[1],/2 aula\(s\) já feita\(s\) além do pacote saem desta renovação/);
   assert.deepEqual(await sal('dev'),[6,0]);
   assert.deepEqual(await ext('dev'),['02/11 Renovação do mês créditos · −2 aula(s) já feita(s) descontada(s) +8 6']);
  });
  await check('"já cobrei à parte" renova o pacote cheio (como antes) e o extrato explica',async()=>{
   await dados();dlg.vistas=[];dlg.resp=[false,true];
   await g.evaluate(()=>renovarMes('dev'));
   assert.match(dlg.vistas[1],/você disse que já cobrou à parte, então volta para o pacote cheio/);
   assert.deepEqual(await sal('dev'),[8,0]);
   assert.deepEqual(await ext('dev'),['02/11 Renovação do mês créditos · zerou 2 aula(s) além do pacote (cobradas à parte) +8 8']);
  });
  await check('com sobra: renovação + reposições numa linha só; sem sobra nem dívida, só a renovação',async()=>{
   await dados();dlg.vistas=[];dlg.resp=[true];
   await g.evaluate(()=>renovarMes('sob'));
   assert.equal(dlg.vistas.length,1,'sem dívida: só a prévia');
   assert.deepEqual(await sal('sob'),[8,3]);
   assert.deepEqual(await ext('sob'),['02/11 Renovação do mês créditos · +3 que sobrou(aram) virou(aram) reposição +8 8']);
   dlg.resp=[true];await g.evaluate(()=>renovarMes('zer'));
   assert.deepEqual(await ext('zer'),['02/11 Renovação do mês créditos +8 8']);
  });
  await check('Renovar o mês (lote): desconta por padrão, "já cobrei" troca por linha',async()=>{
   await dados();
   let r=await g.evaluate(()=>{abrirRenovaMes();const linha=[...document.querySelectorAll('#rm-corpo .rm-row')].find(x=>/Aluno Devendo/.test(x.innerText));return linha.innerText.replace(/\s+/g,' ');});
   assert.match(r,/Recebe 6 aula\(s\) \(8 aula\(s\) − 2 já feita\(s\)\)/);assert.match(r,/Fez 2 aula\(s\) além do pacote, ainda não paga\(s\)\. Saem desta renovação\./);
   r=await g.evaluate(()=>{rmDebitoUsar('dev','cobrado');const linha=[...document.querySelectorAll('#rm-corpo .rm-row')].find(x=>/Aluno Devendo/.test(x.innerText));return linha.innerText.replace(/\s+/g,' ');});
   assert.match(r,/Recebe 8 aula\(s\)/);assert.match(r,/já cobrou à parte: renova o pacote cheio/);
   await g.evaluate(()=>rmDebitoUsar('dev','descontar'));
   dlg.resp=[true];await g.evaluate(()=>rmAplicar());
   assert.deepEqual(await sal('dev'),[6,0]);assert.deepEqual(await sal('sob'),[8,3]);assert.deepEqual(await sal('zer'),[8,0]);
   assert.equal(await g.evaluate(()=>DB.alunos.find(a=>a.id==='dev').ultimaRenovacao.creditos),6);
   await g.evaluate(()=>fecharRenovaMes());
  });
  await check('dívida maior que o pacote não bloqueia a renovação (fica negativo o que faltar)',async()=>{
   await dados();await g.evaluate(()=>{DB.alunos.find(a=>a.id==='dev').creditos=-10;});
   dlg.resp=[true,true];await g.evaluate(()=>renovarMes('dev'));
   assert.deepEqual(await sal('dev'),[-2,0]);
  });
  assert.deepEqual(erros,[]);
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · renovação com aula já feita');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

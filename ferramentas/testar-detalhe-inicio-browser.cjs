/* Quadrinhos do Início (20/10). Tocar em Alunos, Créditos, Ocupação e
   Locações abre a lista que explica o número, com a mesma conta do
   quadrinho. Só leitura. Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-20T08:00:00-03:00');   // terça-feira
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
  for(const tema of ['saibro','classico']){
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');try{localStorage.setItem('jv-tema',t);}catch(e){}},tema);
   const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
   await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
   await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
   await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}#toast{display:none!important}'});
   await g.evaluate(()=>{
    persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';
    const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true,extratoAberto:true},x||{});
    DB.alunos=[al('a1','Aluno Um',{repos:3}),al('g1','Dupla Um',{tipo:'Dupla',plano:0,planoGrupo:4,creditos:0,credGrupo:1}),al('m1','Misto Um',{planoGrupo:4,credGrupo:0,creditos:0}),
     al('p1','Personal Um',{tipo:'Personal',creditos:0}),al('c1','Cliente Locação',{perfil:'locacao',plano:0,creditos:0,mensalidade:0,arquivado:false}),al('i1','Inativo Um',{arquivado:true,creditos:5})];
    const t=d=>new Date(d+'T12:00:00-03:00').getTime();
    DB.movs=[{ts:t('2026-07-01'),alunoId:'a1',campo:'repos',delta:2,de:0,para:2,motivo:'Sobra do mês virou reposição',ref:''},
             {ts:t('2026-10-01'),alunoId:'a1',campo:'repos',delta:1,de:2,para:3,motivo:'Sobra do mês virou reposição',ref:''}];
    const fx=(id,hora,alunoId,tipo,titulo)=>({id,dia:2,hora,titulo:titulo||DB.alunos.find(a=>a.id===alunoId).nome,tipo,alunoId,desde:'2026-09-01'});
    DB.agenda={fixos:[fx('f1','09:00','a1','aula'),fx('f2','10:00','g1','grupo'),fx('f3','11:00','p1','personal'),fx('f4','17:00','m1','grupo')],
     eventos:[{id:'e1',data:'2026-10-20',hora:'14:00',titulo:'Cliente Locação',tipo:'locacao',alunoId:'c1'},{id:'e2',data:'2026-10-20',hora:'15:00',titulo:'Locação Fulano',tipo:'aula',alunoId:null},
      {id:'e3',data:'2026-10-08',hora:'16:00',titulo:'Quadra avulsa',tipo:'locacao',alunoId:null}],excecoes:[]};
    DB.presencas=[];DB.compromissos=[];ensureFields();CARREGADO=true;curYear=2026;curMonth=9;
    go('dash',document.createElement('button'));renderAll();
   });
   const antes=await g.evaluate(()=>JSON.stringify(DB));
   const abre=async sel=>{await g.click(sel);return g.evaluate(()=>({on:document.getElementById('ov-jh-det').classList.contains('on'),tit:document.getElementById('jhd-tit').textContent,
     txt:document.getElementById('jhd-corpo').innerText.replace(/\s+/g,' ').trim()}));};
   const fecha=()=>g.evaluate(()=>closeModal('ov-jh-det'));
   await check(tema+': Locações abre a lista do mês (com e sem vínculo) e o total bate com o quadrinho',async()=>{
    const quad=await g.evaluate(()=>document.getElementById('loc-txt').textContent);
    const r=await abre('#kpi-loc');
    assert.ok(r.on);assert.equal(r.tit,'Locações');assert.equal(quad,'3h no mês');
    assert.match(r.txt,/^3h de locação em Outubro · 2 dia\(s\)/);
    assert.match(r.txt,/08\/10 · Qui 1h 16:00 Quadra avulsa \(sem vínculo\)/);
    assert.match(r.txt,/20\/10 · Ter · hoje 2h 14:00 Cliente Locação 15:00 Locação Fulano \(sem vínculo\)/);
    await fecha();
   });
   await check(tema+': Ocupação abre os horários livres e ocupados do dia, com a mesma % do quadrinho',async()=>{
    const quad=await g.evaluate(()=>document.getElementById('jh-ocup-hoje').textContent);
    const r=await abre('#kpi-ocup');
    assert.equal(r.tit,'Horários livres e ocupados');
    const pct=r.txt.match(/(\d+%) ocupado/);assert.ok(pct,'mostra a %');assert.equal(pct[1],quad);
    assert.match(r.txt,/09:00 Ocupado Aluno Um/);assert.match(r.txt,/14:00 Locação Cliente Locação/);assert.match(r.txt,/Livre/);
    const livres=await g.evaluate(()=>document.querySelectorAll('#jhd-corpo .jhd-slots li.livre').length);
    const oc=await g.evaluate(()=>{const d=new Date('2026-10-20T12:00:00');return ocupacao(d,d);});
    assert.equal(livres,oc.disp-oc.ocup,'livres = abertos − ocupados');
    await g.click('#jhd-corpo .jhd-nav button[aria-label="Próximo dia"]');
    assert.match(await g.evaluate(()=>document.querySelector('#jhd-corpo .jhd-nav b').textContent),/21\/10 · Qua/);
    await fecha();
   });
   await check(tema+': Créditos em aberto lista nome, créditos, reposições e validade; total bate com o quadrinho',async()=>{
    const q=await g.evaluate(()=>({c:document.getElementById('k-creditos').textContent,r:document.getElementById('k-repos-s').textContent}));
    const r=await abre('#kpi-cred');
    assert.equal(r.tit,'Créditos em aberto');
    assert.match(r.txt,new RegExp('^'+q.c+' créditos · 3 reposições'));assert.match(q.r,/^3 reposições/);
    assert.match(r.txt,/Aluno Um 2 créd\. · 3 repos\. 🔁 2 até o fim de out\/26 · 1 até o fim de jan\/27/);
    assert.doesNotMatch(r.txt,/Inativo Um/,'só ativos, como no quadrinho');
    assert.equal(await g.evaluate(()=>[...document.querySelectorAll('#jhd-corpo .jhd-val span.urg')].map(s=>s.textContent).join('|')),'2 até o fim de out/26','vence na próxima virada em destaque');
    await g.click('#jhd-corpo .jhd-lista li');
    assert.equal(await g.evaluate(()=>fichaId),'a1','toque no nome abre a ficha');
    await g.evaluate(()=>{fecharFicha();go('dash',document.createElement('button'));});
   });
   await check(tema+': Alunos abre o comparativo dos meses e o cadastro por tipo',async()=>{
    const quad=await g.evaluate(()=>document.getElementById('k-alunos').textContent);
    const r=await abre('#kpi-alunos');
    assert.equal(r.tit,'Alunos');assert.match(r.txt,new RegExp('^'+quad+' ativos hoje · 6 no cadastro'));
    assert.match(r.txt,/🎾 1 particular 👥 1 em grupo 🔀 1 misto 💪 1 personal 🔑 1 locação\/torneio/);
    assert.match(r.txt,/set\/26 4 ↑4 1 2 1/);assert.match(r.txt,/out\/26 4 1 2 1/);assert.match(r.txt,/mai\/26 0/);
    await fecha();
   });
   await check(tema+': janelas legíveis (medidas na imagem) e nada muda nos dados',async()=>{
    for(const sel of ['#kpi-loc','#kpi-ocup','#kpi-cred','#kpi-alunos']){
     await g.click(sel);
     const itens=(await medir(g)).filter(it=>/ov-jh-det|jhd/.test(it.onde||''));
     assert.ok(itens.length>=6,sel+' mediu: '+itens.length);
     assert.deepEqual(itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>sel+' '+it.t+' '+it.ratio+' '+it.fg+' sobre '+it.fundo),[]);
     await fecha();await g.setViewportSize({width:390,height:844});
    }
    assert.equal(await g.evaluate(()=>JSON.stringify(DB)),antes,'só lê');
   });
   assert.deepEqual(erros,[]);await c.close();
  }
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · detalhe dos quadrinhos do Início');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

/* Ferramentas da agenda da Gestão numa linha (pedido do João, 17/10): eram 5
   botões numa gaveta. Ficam "Horários" e "Divulgar livres" (texto ou imagem);
   "Vincular nomes" só aparece quando há nome da agenda sem aluno; o botão de
   buscar agendamentos saiu porque a busca já é automática. Só dados
   fictícios, nuvem simulada, relógio fixo. Abrir as ferramentas não grava nada. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-21T10:00:00-03:00');   // quarta-feira
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const tema of ['saibro','classico']){
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');try{localStorage.setItem('jv-tema-gestao',t);localStorage.setItem('jv-tema',t);}catch(e){}},tema);
   const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
   await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
   await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
   await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
   const reset=()=>g.evaluate(()=>{
    const al=(id,nome)=>({id,nome,codigo:id,tipo:'Particular',ativo:true,plano:4,planoGrupo:0,creditos:4,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago'});
    DB.alunos=[al('ana','Ana Teste'),al('caio','Caio Teste')];
    DB.agenda={fixos:[{id:'f1',dia:3,hora:'09:00',titulo:'Ana Teste',tipo:'aula',alunoId:'ana'}],eventos:[{id:'e1',data:'2026-10-22',hora:'10:00',titulo:'Caio Teste',tipo:'aula',alunoId:'caio'}],excecoes:[]};
    DB.presencas=[];DB.movs=[];ensureFields();MODO='dono';
    persist=()=>{};publish=()=>{};publicarMapaQuadra=()=>{};window.__t=[];toast=m=>__t.push(m);
    window.__chamou=[];enviarHorariosLivres=()=>__chamou.push('texto');enviarSemanaImg=()=>__chamou.push('imagem');
    document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
    agDate=new Date('2026-10-21T12:00:00');go('agenda',document.querySelector(".nav button[onclick*=\"go('agenda'\"]")||document.createElement('b'));renderAll();
   });
   await check(tema+': ferramentas numa linha — Horários e Divulgar livres, sem gaveta e sem o botão de buscar agendamentos',async()=>{
    await reset();
    const r=await g.evaluate(()=>{const box=document.querySelector('#pg-agenda .ag-ferr');
     const vis=[...box.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>b.innerText.replace(/\s+/g,' ').trim());
     const a=box.querySelectorAll('button')[0].getBoundingClientRect(),b=box.querySelectorAll('button')[1].getBoundingClientRect();
     return {vis,gaveta:!!box.querySelector('summary'),mesmaLinha:Math.abs(a.top-b.top)<2,alt:Math.min(a.height,b.height),
      busca:document.querySelector('#pg-agenda').innerText.includes('Agendamentos de alunos'),lateral:document.documentElement.scrollWidth>innerWidth+1};});
    assert.deepEqual(r.vis,['🗓️ Horários aula · locação · fechado','📤 Divulgar livres texto ou imagem']);
    assert.equal(r.gaveta,false,'sem gaveta: um toque abre');assert.equal(r.mesmaLinha,true,'lado a lado');
    assert.ok(r.alt>=44,'toque confortável: '+r.alt);assert.equal(r.busca,false,'busca de agendamentos é automática');assert.equal(r.lateral,false);
    if(process.env.JV_SHOTS)await g.screenshot({path:path.join(process.env.JV_SHOTS,'gestao-agenda-ferramentas-'+tema+'.png')});
   });
   await check(tema+': Divulgar livres pergunta o formato (texto no WhatsApp ou imagem) da semana aberta, sem gravar nada',async()=>{
    await reset();
    const antes=await g.evaluate(()=>JSON.stringify(DB));
    await g.locator('#pg-agenda .ag-ferr button',{hasText:'Divulgar livres'}).click();
    assert.equal(await g.evaluate(()=>document.getElementById('ov-divulgar').classList.contains('on')),true);
    assert.equal(await g.locator('#agf-semana').innerText(),'Semana de 19/10 a 24/10, a que está aberta na agenda.');
    if(process.env.JV_SHOTS)await g.screenshot({path:path.join(process.env.JV_SHOTS,'gestao-agenda-divulgar-'+tema+'.png')});
    await g.locator('#ov-divulgar button',{hasText:'Texto no WhatsApp'}).click();
    assert.equal(await g.evaluate(()=>document.getElementById('ov-divulgar').classList.contains('on')),false,'fecha ao escolher');
    await g.locator('#pg-agenda .ag-ferr button',{hasText:'Divulgar livres'}).click();
    await g.locator('#ov-divulgar button',{hasText:'Imagem da semana'}).click();
    assert.deepEqual(await g.evaluate(()=>__chamou),['texto','imagem']);
    assert.equal(await g.evaluate(()=>JSON.stringify(DB)),antes,'só divulga');
   });
   await check(tema+': Horários continua abrindo a configuração de aula, locação e fechado',async()=>{
    await reset();
    await g.locator('#pg-agenda .ag-ferr button',{hasText:'Horários'}).click();
    assert.equal(await g.evaluate(()=>!!document.querySelector('.overlay.on')),true);
    await g.evaluate(()=>document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on')));
   });
   await check(tema+': "Vincular nomes" só aparece com nome da agenda sem aluno, já com a quantidade, e abre a lista',async()=>{
    await reset();
    assert.equal(await g.locator('#agf-vincular').isVisible(),false,'tudo vinculado: sem botão');
    const antes=await g.evaluate(()=>{DB.agenda.eventos.push({id:'e2',data:'2026-10-23',hora:'11:00',titulo:'Fulano Sem Cadastro',tipo:'aula'},
      {id:'e3',data:'2026-10-24',hora:'11:00',titulo:'Fulano Sem Cadastro',tipo:'aula'},{id:'e4',data:'2026-10-24',hora:'12:00',titulo:'Outro Nome',tipo:'aula'});renderAgenda();return JSON.stringify(DB);});
    const bt=g.locator('#agf-vincular');assert.equal(await bt.isVisible(),true);
    assert.equal(await bt.innerText(),'🔗 2 nomes da agenda sem aluno cadastrado · vincular');
    if(process.env.JV_SHOTS)await g.screenshot({path:path.join(process.env.JV_SHOTS,'gestao-agenda-vincular-'+tema+'.png')});
    await bt.click();
    assert.equal(await g.evaluate(()=>document.getElementById('ov-link').classList.contains('on')),true);
    assert.equal(await g.evaluate(()=>JSON.stringify(DB)),antes,'abrir não vincula nada sozinho');
    await g.evaluate(()=>{closeModal('ov-link');DB.agenda.eventos=DB.agenda.eventos.filter(e=>e.alunoId);renderAgenda();});
    assert.equal(await bt.isVisible(),false,'depois de resolvido, some');
   });
   assert.deepEqual(erros,[]);
   await c.close();
  }
  console.log('\n✅ '+count+' verificações · ferramentas da agenda');
 }catch(e){console.error('❌ '+(e.stack||e));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

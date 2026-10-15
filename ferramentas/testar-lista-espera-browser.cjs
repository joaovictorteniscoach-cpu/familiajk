/* Lista de espera. Só dados fictícios, nuvem e fila simuladas, relógio fixo.
   Aluno: horário reservado oferece "Entrar na lista de espera"; quando a vaga
   libera, o próprio app avisa (uma vez) e mostra "Reservar agora"; quem marcou
   ou o que já passou sai da lista. Gestão: o pedido de espera só é guardado
   (DB.espera), não mexe na agenda; a vaga liberada aparece em "Atenção hoje" e
   no horário, com o botão de avisar no WhatsApp. Nada muda em créditos. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-15T10:00:00-03:00'),copy=v=>JSON.parse(JSON.stringify(v));
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
async function contexto(browser,base,tema){
 const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
 await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');if(t)localStorage.setItem('jv-tema',t);},tema||'');
 return c;
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  /* ================= Aluno ================= */
  const eu={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:1,locCred:0,mensalidade:640,status:'pago',ativo:true};
  const fixture={grade:{fixos:[],eventos:[
    {id:'outro',cod:'6602',data:'2026-10-16',hora:'16:00',tipo:'aula'},
    {id:'ontem',cod:'6602',data:'2026-10-14',hora:'16:00',tipo:'aula'}],excecoes:[]},
   historico:{},horas:['07:00','09:00','16:00','17:00','18:00'],profs:[],horarioCfg:{},horarioData:{},termoVer:0,alunos:[eu]};
  for(const tema of ['saibro','classico']){
   const ca=await contexto(browser,base,tema),p=await ca.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.accept());
   await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof conferirEspera==='function');
   await p.addStyleTag({content:'#toast,#feriado-box,#login{display:none!important}'});
   await p.evaluate(({fixture,eu})=>{
    init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-test';
    EU=copyEU=JSON.parse(JSON.stringify(eu));PUB=JSON.parse(JSON.stringify(fixture));PUB.alunos=[EU];
    MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[]};window.__envios=[];window.__saves=0;window.__avisos=[];window.__toasts=[];
    window.fbDB={ref:cam=>({push:async item=>{__envios.push({cam,item});},update:async()=>{}})};
    hasCloud=()=>true;atualizarGradeReserva=async()=>{};saveMeu=async()=>{__saves++;};abrirWhatsApp=()=>{};notificarJoao=()=>{};
    notificarLocal=(t,c)=>__avisos.push(t+' | '+c);toast=m=>__toasts.push(m);
    agDate=new Date('2026-10-16T12:00:00');agView='dia';VINCULO_ESTADO='ativo';
    document.getElementById('app').style.display='block';document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');render();goAluno('agenda',document.getElementById('nav-al-agenda'));
   },{fixture,eu});
   const antesEU=await p.evaluate(()=>JSON.stringify(EU));
   await check(tema+': horário reservado oferece a lista de espera e o pedido vai para a Gestão',async()=>{
    const sl=p.locator('.slot',{hasText:'16:00'}).locator('button');
    assert.match(await sl.innerText(),/Reservado\s*toque para entrar na lista de espera/);
    await sl.click();
    const op=await p.locator('#pick-opts').innerText();
    assert.match(op,/Este horário está reservado/);assert.match(op,/quem marcar primeiro fica com ela/i);assert.match(op,/Entrar na lista de espera/);
    assert.doesNotMatch(op,/Agendar aula/);
    await p.locator('#pick-opts button',{hasText:'Entrar na lista de espera'}).click();await p.waitForTimeout(80);
    const r=await p.evaluate(()=>({espera:MEU.espera,envios:__envios,saves:__saves}));
    assert.equal(r.envios.length,1);assert.equal(r.envios[0].cam,'jvtenis/fila_agendamentos');
    assert.equal(r.envios[0].item.acao,'espera');assert.equal(r.envios[0].item.data,'2026-10-16');assert.equal(r.envios[0].item.hora,'16:00');
    assert.equal(r.envios[0].item.uid,'u-test');assert.equal(r.envios[0].item.codigo,'6601');
    assert.deepEqual(r.espera.map(e=>e.data+' '+e.hora+' '+e.avisado),['2026-10-16 16:00 0']);assert.ok(r.saves>=1);
    assert.match(await sl.innerText(),/você está na lista de espera/);
    assert.equal(await p.locator('#espera-box').isVisible(),false,'ainda não liberou');
   });
   await check(tema+': vaga liberada: o app avisa uma vez, mostra "Reservar agora" e volta a esperar se alguém pegar',async()=>{
    await p.evaluate(()=>{PUB.grade.eventos=PUB.grade.eventos.filter(e=>e.id!=='outro');render();goAluno('inicio',document.getElementById('nav-al-inicio'));});
    const box=p.locator('#espera-box');assert.equal(await box.isVisible(),true);
    assert.match(await box.innerText(),/Vaga liberada da sua lista de espera[\s\S]*Sexta, 16\/10 às 16:00[\s\S]*Reservar agora[\s\S]*quem marcar primeiro fica com a vaga/);
    assert.equal(await p.evaluate(()=>__avisos.length),1);assert.match(await p.evaluate(()=>__avisos[0]),/Vaga liberada/);
    await p.evaluate(()=>{conferirEspera();conferirEspera();});assert.equal(await p.evaluate(()=>__avisos.length),1,'avisa uma vez só');
    if(process.env.JV_SHOTS)await p.screenshot({path:path.join(process.env.JV_SHOTS,'espera-liberada-'+tema+'.png')});
    await box.locator('button',{hasText:'Reservar agora'}).click();
    assert.equal(await p.evaluate(()=>document.getElementById('ov-pick').classList.contains('on')),true);
    assert.match(await p.locator('#pick-opts').innerText(),/Agendar aula/);
    await p.evaluate(()=>{document.getElementById('ov-pick').classList.remove('on');PUB.grade.eventos.push({id:'pegou',cod:'6603',data:'2026-10-16',hora:'16:00',tipo:'aula'});render();});
    assert.equal(await box.isVisible(),false,'outro aluno pegou: o aviso some');
    assert.equal(await p.evaluate(()=>MEU.espera[0].avisado),0,'continua na lista, pronto para novo aviso');
   });
   await check(tema+': quem consegue a vaga, o que já passou e "Sair da lista" tiram da lista; créditos não mudam',async()=>{
    await p.evaluate(()=>{MEU.espera.push({data:'2026-10-14',hora:'16:00',ts:1,avisado:0});PUB.grade.eventos=PUB.grade.eventos.filter(e=>e.id!=='pegou');
     PUB.grade.eventos.push({id:'minha',cod:'6601',data:'2026-10-16',hora:'16:00',tipo:'aula'});render();});
    assert.deepEqual(await p.evaluate(()=>MEU.espera),[],'virou aula dele e a de ontem passou');
    await p.evaluate(()=>{PUB.grade.eventos=PUB.grade.eventos.filter(e=>e.id!=='minha');PUB.grade.eventos.push({id:'outro2',cod:'6602',data:'2026-10-16',hora:'17:00',tipo:'aula'});
     agDate=new Date('2026-10-16T12:00:00');goAluno('agenda',document.getElementById('nav-al-agenda'));escolherSlot('17:00');});
    await p.locator('#pick-opts button',{hasText:'Entrar'}).click();await p.waitForTimeout(50);
    await p.evaluate(()=>{agDate=new Date('2026-10-16T12:00:00');escolherSlot('17:00');});
    assert.match(await p.locator('#pick-opts').innerText(),/Sair da lista de espera/);
    await p.locator('#pick-opts button',{hasText:'Sair da lista de espera'}).click();await p.waitForTimeout(50);
    const r=await p.evaluate(()=>({espera:MEU.espera,ult:__envios[__envios.length-1].item.acao,eu:JSON.stringify(EU)}));
    assert.deepEqual(r.espera,[]);assert.equal(r.ult,'sair_espera');assert.equal(r.eu,antesEU,'nada muda no saldo do aluno');
    await p.evaluate(()=>{hasCloud=()=>false;__envios.length=0;agDate=new Date('2026-10-16T12:00:00');escolherSlot('17:00');});
    await p.locator('#pick-opts button',{hasText:'Entrar'}).click();await p.waitForTimeout(50);
    assert.equal(await p.evaluate(()=>__envios.length+MEU.espera.length),0,'sem internet: nada é registrado');
    assert.match(await p.evaluate(()=>__toasts.pop()),/preciso estar online/);
   });
   assert.deepEqual(erros,[]);await ca.close();
  }

  /* ================= Gestão ================= */
  const cg=await contexto(browser,base),g=await cg.newPage(),errosG=[];g.on('pageerror',e=>errosG.push(e.message));g.on('dialog',d=>d.accept());
  await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
  let fila={};const acks=[];
  await g.exposeFunction('filaGet',()=>copy(fila));
  await g.exposeFunction('filaAck',u=>{acks.push(u);for(const [k,v] of Object.entries(u)){if(v===null)delete fila[k];else if(k.endsWith('/processado'))fila[k.slice(0,-11)].processado=v;}});
  await g.evaluate(()=>{
   const al=(id,nome,codigo,x)=>Object.assign({id,nome,codigo,tipo:'Particular',ativo:true,plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:0,mensalidade:640,status:'pago'},x||{});
   DB.alunos=[al('ana','Ana Teste','6601',{tel:'11988887777'}),al('bia','Bia Teste','6602'),al('caio','Caio Teste','6603',{tel:'11977776666'})];
   DB.agenda={fixos:[],eventos:[{id:'e1',data:'2026-10-16',hora:'16:00',titulo:'Bia Teste',tipo:'aula',alunoId:'bia'}],excecoes:[]};
   DB.presencas=[];DB.movs=[];ensureFields();MODO='dono';window._espacoAberto=true;
   persist=()=>{};publish=()=>{};publicarMapaQuadra=()=>{};doPublish=async()=>{};gravarAgora=async()=>true;window.__t=[];toast=m=>__t.push(m);
   carregarVinculos=async()=>{};VINCULOS={u1:{ativo:true,codigo:'6601',alunoId:'ana'},u3:{ativo:true,codigo:'6603',alunoId:'caio'}};
   window.fbDB={ref:()=>({get:async()=>{const q=await window.filaGet();return {exists:()=>Object.keys(q).length>0,val:()=>q};},update:u=>window.filaAck(u)})};
   _abriuSemConferir=false;_conflitoNuvem=null;
   document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));renderAll();
  });
  const pedido=(id,uid,codigo,acao,hora)=>({id,uid,codigo,nome:'X',acao,data:'2026-10-16',hora:hora||'16:00',ts:Date.now()});
  await check('Gestão: pedido de lista de espera só é guardado — agenda e saldos não mudam, e a fila é limpa',async()=>{
   fila={a:pedido('w1','u1','6601','espera'),b:pedido('w2','u3','6603','espera'),c:pedido('w3','u1','6601','espera','17:00')};
   const antes=await g.evaluate(()=>JSON.stringify({ag:DB.agenda,al:DB.alunos,pr:DB.presencas}));
   await g.evaluate(()=>syncRequests(true));
   const r=await g.evaluate(()=>({espera:DB.espera.map(e=>e.alunoId+' '+e.data+' '+e.hora),depois:JSON.stringify({ag:DB.agenda,al:DB.alunos,pr:DB.presencas}),respostas:(DB.respostasReservas||[]).length}));
   assert.deepEqual(r.espera.sort(),['ana 2026-10-16 16:00','ana 2026-10-16 17:00','caio 2026-10-16 16:00']);
   assert.equal(r.depois,antes,'nada muda na agenda nem nos saldos');assert.equal(r.respostas,0,'nenhuma recusa enviada ao aluno');
   assert.deepEqual(Object.keys(fila),[],'pedidos consumidos');
   fila={d:pedido('w4','u1','6601','sair_espera','17:00')};await g.evaluate(()=>syncRequests(true));
   assert.deepEqual(await g.evaluate(()=>DB.espera.map(e=>e.alunoId+' '+e.hora).sort()),['ana 16:00','caio 16:00']);
   assert.equal(await g.evaluate(()=>vagasLiberadasEspera().length),0,'horário ainda ocupado');
  });
  await check('Gestão: cancelamento libera a vaga — aviso na fila, em "Atenção hoje" e no horário com "Avisar no WhatsApp"',async()=>{
   fila={e:{id:'c1',uid:'u2',codigo:'6602',acao:'cancelar',data:'2026-10-16',hora:'16:00',rec:'pontual',ts:Date.now()}};
   await g.evaluate(()=>{VINCULOS.u2={ativo:true,codigo:'6602',alunoId:'bia'};__t.length=0;syncRequests(true);});
   await g.waitForFunction(()=>__t.length>0);
   assert.match(await g.evaluate(()=>__t.join(' ')),/1 cancelamento\(s\)[\s\S]*🔔 1 vaga\(s\) com lista de espera/);
   await g.evaluate(()=>{renderAll();go('dash',document.querySelector('.nav button'));});
   const at=await g.locator('#acao-list').innerText();
   assert.match(at,/Vaga liberada: 16\/10 às 16:00/);assert.match(at,/2 na lista de espera \(Ana, Caio\)/);
   await g.locator('#acao-list button',{hasText:'Vaga liberada'}).click();
   const slot=await g.locator('#slot-evs').innerText();
   assert.match(slot,/Lista de espera \(2\)[\s\S]*1\. Ana Teste[\s\S]*2\. Caio Teste/);assert.match(slot,/A vaga está livre/);
   if(process.env.JV_SHOTS)await g.screenshot({path:path.join(process.env.JV_SHOTS,'espera-gestao.png')});
   const abertos=await g.evaluate(()=>{const a=[];window.open=u=>{a.push(u);return null;};document.querySelector('#slot-evs .esp-linha button').click();return a;});
   assert.equal(abertos.length,1);assert.match(decodeURIComponent(abertos[0]),/wa\.me\/\d*11988887777\?text=Olá Ana! 🎾 A vaga de 16\/10 às 16:00 que você estava esperando abriu/);
   assert.doesNotMatch(decodeURIComponent(abertos[0]),/desconto/i);
  });
  await check('Gestão: quem reserva a vaga sai da lista; ninguém mais é avisado de vaga ocupada',async()=>{
   await g.evaluate(()=>closeSlot());
   fila={f:{id:'r1',uid:'u3',codigo:'6603',data:'2026-10-16',hora:'16:00',rec:'pontual',ts:Date.now()}};
   await g.evaluate(()=>syncRequests(true));
   const r=await g.evaluate(()=>({ag:DB.agenda.eventos.map(e=>e.alunoId+' '+e.hora),espera:DB.espera.map(e=>e.alunoId+' '+e.hora),vagas:vagasLiberadasEspera().length}));
   assert.ok(r.ag.includes('caio 16:00'),'reserva do Caio entrou');
   assert.deepEqual(r.espera,['ana 16:00'],'Caio saiu da lista; Ana segue esperando');
   assert.equal(r.vagas,0,'vaga ocupada: nada a avisar');
  });
  assert.deepEqual(errosG,[]);
  console.log('\n✅ '+count+' verificações · lista de espera');
 }catch(e){console.error('❌ '+(e.stack||e));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

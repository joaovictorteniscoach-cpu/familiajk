/* Jogo do torneio no app do aluno. Só dados fictícios, nuvem simulada,
   relógio fixo (quinta 15/10/2026, 10h).
   Antes: a Gestão gravava o torneio certo, mas o app do aluno escrevia
   "Minha aula" para qualquer horário dele. Agora agenda (dia e semana),
   cartão do Início, Minhas aulas, lembrete do dia, Google Agenda, resumo do
   mês e realizadas dizem "jogo do torneio" (e "locação" para locação). Os
   números de aula do resumo deixam torneio e locação de fora. A Gestão manda
   o tipo no histórico de cada aluno, sem mudar nada no banco. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-15T10:00:00-03:00');   // quinta-feira
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
async function contexto(browser,base,opts){
 const c=await browser.newContext(Object.assign({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'},opts||{}));
 await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
 return c;
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  /* ================= Gestão ================= */
  const cg=await contexto(browser,base);
  const g=await cg.newPage(),errosG=[];g.on('pageerror',e=>errosG.push(e.message));g.on('dialog',d=>d.accept());
  await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await check('Gestão: o histórico publicado de cada aluno diz quando foi jogo do torneio ou locação (sem mudar o banco)',async()=>{
   const r=await g.evaluate(async()=>{
    const al=(id,x)=>Object.assign({id,nome:'Aluno '+id,codigo:id,tipo:'Particular',ativo:true,plano:4,planoGrupo:0,creditos:4,credGrupo:0,repos:0,locCred:2,mensalidade:640,status:'pago'},x||{});
    DB.alunos=[al('6601')];DB.agenda={fixos:[],eventos:[],excecoes:[]};DB.movs=[];DB.compromissos=[];
    DB.presencas=[{k:'2026-10-02|16:00|6601',alunoId:'6601',data:'2026-10-02',hora:'16:00',tipo:'aula',custo:1},
     {k:'2026-10-09|18:00|6601',alunoId:'6601',data:'2026-10-09',hora:'18:00',tipo:'torneio',custo:0},
     {k:'2026-10-13|09:00|6601',alunoId:'6601',data:'2026-10-13',hora:'09:00',tipo:'locacao',custo:1},
     {k:'2026-10-14|09:00|6601',alunoId:'6601',data:'2026-10-14',hora:'09:00',tipo:'grupo',custo:1}];
    ensureFields();MODO='dono';
    const antes=JSON.stringify(DB);window.__pub=null;
    hasCloud=()=>true;ehDono=()=>true;cloudPending=false;_conflitoNuvem=false;_abriuSemConferir=false;
    cloudSet=async()=>{};publicarSeguro=async pub=>{window.__pub=pub;};window.fbDB={ref:()=>({set:async()=>{}})};
    await doPublish();
    return {hist:__pub&&__pub.historico['6601'],igual:JSON.stringify(DB)===antes,aviso:NOME_AVISO.torneio.join(' ')};
   });
   assert.deepEqual(r.hist,[{data:'2026-10-14',hora:'09:00'},{data:'2026-10-13',hora:'09:00',t:'locacao'},{data:'2026-10-09',hora:'18:00',t:'torneio'},{data:'2026-10-02',hora:'16:00'}]);
   assert.equal(r.igual,true,'publicar não muda o banco');
   assert.equal(r.aviso,'🏆 Jogo do torneio','aviso no celular: "🏆 Jogo do torneio amanhã às …"');
  });
  assert.deepEqual(errosG,[]);
  await cg.close();

  /* ================= App do aluno ================= */
  const eu={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:0,locCred:2,mensalidade:640,status:'pago',ativo:true};
  const horas=['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
  const fixture={grade:{fixos:[],eventos:[
   {id:'e1',cod:'6601',data:'2026-10-15',hora:'14:00',tipo:'aula'},
   {id:'t1',cod:'6601',data:'2026-10-16',hora:'17:00',tipo:'torneio'},{id:'t2',cod:'7702',data:'2026-10-16',hora:'17:00',tipo:'torneio'},
   {id:'l1',cod:'6601',data:'2026-10-20',hora:'09:00',tipo:'locacao'}],excecoes:[]},
   historico:{'6601':[{data:'2026-10-02',hora:'16:00'},{data:'2026-10-09',hora:'18:00',t:'torneio'}]},
   horas,profs:[],horarioCfg:{},horarioData:{},termoVer:0,precos:{locacao:70},alunos:[eu]};
  for(const tema of ['saibro','classico']){
   const ca=await contexto(browser,base);await ca.addInitScript(t=>localStorage.setItem('jv-tema',t),tema);
   const p=await ca.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.accept());
   await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof aulasAgendadasAluno==='function');
   await p.addStyleTag({content:'#toast,#feriado-box,#login{display:none!important}'});
   const resetA=(fx,pedidos)=>p.evaluate(({fx,eu,pedidos})=>{
    init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-test';
    EU=JSON.parse(JSON.stringify(eu));PUB=JSON.parse(JSON.stringify(fx));PUB.alunos=[EU];
    MEU={codigo:'6601',pedidos:pedidos||[],cancelados:[],confirmadas:[]};window.fbDB={ref:()=>({push:async()=>{},update:async()=>{}})};
    atualizarGradeReserva=async()=>{};saveMeu=async()=>{};notificarLocal=()=>{};_lembreteFeito=false;
    window.__links=[];HTMLAnchorElement.prototype.click=function(){__links.push(this.href);};
    agDate=new Date();agView='dia';VINCULO_ESTADO='ativo';
    document.getElementById('app').style.display='block';document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');render();goAluno('inicio',document.getElementById('nav-al-inicio'));
   },{fx,eu,pedidos});
   const PED_TOR=[{id:'r9',data:'2026-10-22',hora:'08:00',rec:'pontual',tor:1,ts:1}];

   await check(tema+': agenda do dia e da semana mostram "Meu jogo do torneio" (antes: "Minha aula")',async()=>{
    await resetA(fixture,PED_TOR);
    const st=await p.evaluate(()=>[['2026-10-16','17:00'],['2026-10-15','14:00'],['2026-10-20','09:00'],['2026-10-22','08:00']]
     .map(([d,h])=>{const s=slotState(new Date(d+'T12:00:00'),h);return s.st+'|'+s.label+'|'+(s.tipo||'');}));
    assert.deepEqual(st,['meu|Meu jogo do torneio|torneio','meu|Minha aula|aula','meu|Minha locação|locacao','pend|Jogo do torneio · aguardando ⏳|torneio']);
    const dia=async d=>{await p.evaluate(d=>{const [y,m,dd]=d.split('-').map(Number);goAluno('agenda',document.getElementById('nav-al-agenda'));gotoDay(y,m-1,dd);},d);return p.locator('#ag-view').innerText();};
    let t=await dia('2026-10-16');assert.match(t,/🏆 Meu jogo do torneio\s*confirmado/);assert.doesNotMatch(t,/Minha aula/);
    t=await dia('2026-10-15');assert.match(t,/🎾 Minha aula\s*confirmada/,'aula continua igual');
    t=await dia('2026-10-20');assert.match(t,/🔑 Minha locação\s*confirmada/);
    t=await dia('2026-10-22');assert.match(t,/Jogo do torneio · aguardando ⏳\s*enviado ao João/);
    assert.match(await p.locator('#apg-agenda .legend').innerText(),/Meus horários/,'legenda da cor: não é só aula');
    if(process.env.JV_SHOTS){await dia('2026-10-16');await p.locator('#ag-view .slot',{hasText:'18:00'}).scrollIntoViewIfNeeded();await p.screenshot({path:path.join(process.env.JV_SHOTS,'aluno-torneio-dia-'+tema+'.png')});}
    const sem=await p.evaluate(()=>{agView='semana';agDate=new Date('2026-10-15T12:00:00');renderAgenda();
     const linha=h=>[...document.querySelectorAll('#ag-view table.wk tr')].find(tr=>tr.querySelector('td.hr')&&tr.querySelector('td.hr').textContent===h);
     const cel=(h,i)=>linha(h).querySelectorAll('td')[i+1].innerText.trim();return {tor:cel('17:00',4),aula:cel('14:00',3)};});
    assert.deepEqual(sem,{tor:'Meu jogo',aula:'Sua aula'});
   });
   await check(tema+': Minhas aulas: cartão "🏆 Jogo do torneio" com "Cancelar jogo"; Google Agenda abre "Jogo do torneio"',async()=>{
    await resetA(fixture,PED_TOR);await p.locator('#home-minhas-aulas').click();await p.locator('#mau-tab-prox').click();
    const cards=await p.locator('#mine-list .mine-item').allInnerTexts();
    const de=d=>cards.find(c=>c.includes(d))||'';
    assert.match(de('16/10'),/Sexta · 🏆 Jogo do torneio/);assert.match(de('16/10'),/Cancelar jogo/);assert.doesNotMatch(de('16/10'),/Cancelar aula/);
    assert.match(de('15/10'),/Quinta · Aula particular/);assert.match(de('15/10'),/Cancelar aula/);
    assert.match(de('20/10'),/🔑 Locação da quadra/);assert.match(de('20/10'),/Cancelar locação/);
    assert.match(de('22/10'),/🏆 Jogo do torneio · pedido enviado/);
    await p.locator('#mine-list .mine-item',{hasText:'16/10'}).locator('.mini-cal').click();
    const url=decodeURIComponent((await p.evaluate(()=>__links.pop()))||'');
    assert.match(url,/text=Jogo do torneio 🏆 — Academia João Victor/);assert.match(url,/Seu jogo do torneio na Academia/);
    await p.locator('#mine-list .mine-item',{hasText:'15/10'}).locator('.mini-cal').click();
    assert.match(decodeURIComponent(await p.evaluate(()=>__links.pop())),/text=Aula de tênis 🎾/,'aula continua igual');
    if(process.env.JV_SHOTS)await p.screenshot({path:path.join(process.env.JV_SHOTS,'aluno-torneio-minhas-'+tema+'.png')});
   });
   await check(tema+': resumo do mês conta só aulas; torneio e locação em linha própria; realizadas com 🏆',async()=>{
    await resetA(fixture,PED_TOR);await p.locator('#home-minhas-aulas').click();
    const r=await p.evaluate(()=>({nums:[...document.querySelectorAll('#aulas-mes-resumo .amr-nums b')].map(b=>b.textContent),
     resumo:document.getElementById('aulas-mes-resumo').innerText,feitas:document.getElementById('mau-n-feitas').textContent,
     home:document.getElementById('home-minhas-sub').textContent}));
    assert.deepEqual(r.nums.slice(0,2),['1','1'],'1 aula feita (02/10) e 1 marcada (15/10): torneio e locação fora da conta');
    assert.match(r.resumo,/🏆 Torneio e locação em outubro \(não gastam aula do plano\)/);
    assert.match(r.resumo,/🏆 09\/10 · sex · 18:00/);assert.match(r.resumo,/🏆 16\/10 · sex · 17:00/);assert.match(r.resumo,/🔑 20\/10 · ter · 09:00/);
    assert.equal(r.feitas,'(2)','a aba Feitas conta as linhas da lista');assert.match(r.home,/^1 feita · 1 marcada em outubro$/);
    await p.locator('#mau-tab-feitas').click();
    const h=await p.locator('#hist-list').innerText();
    assert.match(h,/🏆\s*09\/10 · sex\s*18:00 · jogo do torneio/);assert.match(h,/✓\s*02\/10 · sex\s*16:00/);
    const ics=await p.evaluate(()=>gerarAgendaMesIcs(aulasParaAgendaMes()));
    assert.equal((ics.match(/SUMMARY:Torneio de tênis/g)||[]).length,2,'arquivo da agenda: jogo feito e jogo marcado');
    assert.match(ics,/SUMMARY:Locação de quadra/);assert.equal((ics.match(/SUMMARY:Aula de tênis\r\n/g)||[]).length,2);
   });
   await check(tema+': Início e lembrete do dia: "Próximo jogo do torneio" e "Seu jogo do torneio é hoje"; aula continua "aula"',async()=>{
    const so=ev=>Object.assign(JSON.parse(JSON.stringify(fixture)),{grade:{fixos:[],eventos:[ev],excecoes:[]},historico:{}});
    await resetA(so({id:'t1',cod:'6601',data:'2026-10-15',hora:'17:00',tipo:'torneio'}));
    await p.evaluate(()=>checarAulaHoje());
    let r=await p.evaluate(()=>({tit:document.getElementById('home-prox-tit').textContent,meta:document.getElementById('home-prox-meta').textContent,
     lt:document.getElementById('lembrete-tit').textContent,lx:document.getElementById('lembrete-txt').textContent,vis:getComputedStyle(document.getElementById('lembrete-box')).display}));
    assert.equal(r.tit,'Próximo jogo do torneio ›');assert.equal(r.meta,'🏆 Quinta • 17:00');
    assert.equal(r.vis,'block');assert.equal(r.lt,'🏆 Você tem jogo do torneio hoje!');assert.match(r.lx,/^Seu jogo do torneio é hoje às 17:00\./);
    await p.evaluate(()=>lembreteCalendario());assert.match(decodeURIComponent(await p.evaluate(()=>__links.pop())),/text=Jogo do torneio 🏆/);
    if(process.env.JV_SHOTS)await p.screenshot({path:path.join(process.env.JV_SHOTS,'aluno-torneio-inicio-'+tema+'.png')});
    await resetA(so({id:'e1',cod:'6601',data:'2026-10-15',hora:'17:00',tipo:'aula'}));
    await p.evaluate(()=>checarAulaHoje());
    r=await p.evaluate(()=>({tit:document.getElementById('home-prox-tit').textContent,lt:document.getElementById('lembrete-tit').textContent,lx:document.getElementById('lembrete-txt').textContent}));
    assert.equal(r.tit,'Próxima aula ›');assert.equal(r.lt,'🔔 Você tem aula hoje!');assert.match(r.lx,/^Sua aula é hoje às 17:00\./);
   });
   await check(tema+': Registrar resultado com os games de cada set — o placar decide quem venceu e vai junto para o João',async()=>{
    await resetA(fixture);
    const r=await p.evaluate(async()=>{
     PUB.torneio={id:'tor1',nome:'Barragem Teste',etapa:2,encerrada:false,nomesGrupos:{A:'Grupo Ouro'},
      jogadores:[{name:EU.nome,cod:'6601',group:'A',v:0,d:0,wo:0},{name:'Jogador Dois',group:'A',v:0,d:0,wo:0},{name:'Jogadora Três',group:'B',v:0,d:0,wo:0}]};
     window.__fila=[];filaPush=async(c,o)=>{__fila.push([c,JSON.parse(JSON.stringify(o))]);};abrirWhatsApp=()=>{};celebraResultadoTorneio=()=>{};
     window.__t=[];toast=m=>__t.push(m);
     abrirRegResultado();
     const cats=[...document.getElementById('atr-grupo').options].map(o=>o.text);
     document.getElementById('atr-grupo').value='A';atrPlayers();
     document.getElementById('atr-p1').value='Jogador Dois';document.getElementById('atr-p2').value=EU.nome;atrAtualiza();
     const ids=['atr-s1a','atr-s1b','atr-s2a','atr-s2b','atr-s3a','atr-s3b'];
     // set empatado: não envia
     document.getElementById('atr-s1a').value=6;document.getElementById('atr-s1b').value=6;atrAtualiza();
     const infoErro=document.getElementById('atr-info').textContent;await enviarResultadoAluno();const filaErro=__fila.length;
     [4,6,7,6,8,10].forEach((v,i)=>{document.getElementById(ids[i]).value=v;});atrAtualiza();
     const info=document.getElementById('atr-info').textContent,vencOculto=document.getElementById('atr-venc').closest('.field').hidden;
     await enviarResultadoAluno();
     return {cats,infoErro,filaErro,info,vencOculto,fila:__fila,aberto:document.getElementById('ov-tor-result').classList.contains('on')};});
    assert.deepEqual(r.cats,['Escolher categoria…','Grupo Ouro','Grupo B'],'categoria com o nome que o João deu');
    assert.equal(r.infoErro,'O 1º set não pode terminar empatado (6/6).');assert.equal(r.filaErro,0,'placar errado não sai');
    assert.equal(r.info,'✓ Aluno Fictício venceu por 2 a 1 · 6/4 6/7 10/8');
    assert.equal(r.vencOculto,true);assert.equal(r.aberto,false);
    const [cam,item]=r.fila[0];
    assert.equal(cam,'jvtenis/fila_torneio');
    assert.deepEqual([item.torneioId,item.group,item.p1,item.vencedor,item.tipo,item.score],['tor1','A','Jogador Dois','Aluno Fictício','normal','6/4 6/7 10/8']);
    assert.deepEqual(item.sets,[[4,6],[7,6],[8,10]],'sets na ordem jogador 1 × jogador 2');
    assert.match(r.fila[1][1].texto,/venceu Jogador Dois 6\/4 6\/7 10\/8 · Grupo Ouro$/,'aviso ao João com o placar');
   });
   assert.deepEqual(erros,[]);
   await ca.close();
  }
  console.log('\n✅ '+count+' verificações · torneio no app do aluno');
 }catch(e){console.error('❌ '+(e.stack||e));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

/* Torneio da Gestão compacto (pedido do João, 18/10): a classificação cabe na
   tela do celular sem arrastar para o lado, os itens ficaram menores e o
   resultado aceita os games de cada set. O placar decide o vencedor, cada jogo
   fica guardado na etapa e pode ser desfeito. Só dados fictícios, nuvem
   simulada, relógio fixo. */
let chromium,webkit,devices;
try{({chromium,webkit,devices}=require('playwright'));}catch(e){({chromium,webkit,devices}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-21T10:00:00-03:00');
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
    DB.alunos=[];DB.movs=[];ensureFields();MODO='dono';
    persist=()=>{};publish=()=>{};window.__t=[];toast=m=>__t.push(m);
    window.__conf=true;window.__prompt=null;confirm=()=>__conf;prompt=()=>__prompt;
    window.__abriu=[];window.open=u=>{__abriu.push(u);return null;};
    const j=(group,name,v,d,wo,order,extra)=>Object.assign({group,name,v,d,wo,order},extra||{});
    DB.torneios={atual:'t1',seeded:true,lista:{
     t1:{id:'t1',nome:'Barragem Teste',tipo:'barragem',etapa:2,encerrada:false,grupos:['A','B'],nomesGrupos:{A:'Grupo Ouro'},etapasFin:[],jogos:[],jogadores:[
      j('A','Jogador Um Sobrenome',3,1,0,0,{cod:'1234'}),j('A','Jogadora Dois',2,2,1,1),j('A','Jogador Três Com Um Nome Bem Comprido Mesmo',1,3,0,2,{ptsAcum:4}),
      j('B','Jogadora Quatro',4,0,0,0),j('B','Jogador Cinco',0,4,0,1)]},
     t2:{id:'t2',nome:'Torneio Anual Teste',tipo:'anual',etapa:1,encerrada:false,grupos:['A'],nomesGrupos:{},etapasFin:[],jogos:[],jogadores:[j('A','Pessoa Seis',0,0,0,0),j('A','Pessoa Sete',0,0,0,1)]}}};
    torFila=[];torJogosAberto=true;torDragFim=0;   // relógio parado: o fim do arraste do teste anterior não pode travar a ficha
    document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
    go('torneio',document.createElement('b'));renderTorneio();
   });
   const jog=(gr,nome)=>g.evaluate(([gr,nome])=>{const p=torAtual().jogadores.find(x=>x.group===gr&&x.name===nome);return p&&{v:p.v||0,d:p.d||0,wo:p.wo||0};},[gr,nome]);
   const lancar=(o)=>g.evaluate(o=>{
    abrirResultadoTor();document.getElementById('tr-grupo').value=o.g;trPlayers();
    document.getElementById('tr-p1').value=o.p1;document.getElementById('tr-p2').value=o.p2;
    if(o.wo)document.querySelector('input[name="tr-tipo"][value="wo"]').checked=true;
    trAtualiza();
    (o.sets||[]).forEach((s,i)=>{document.getElementById('tr-s'+(i+1)+'a').value=s[0];document.getElementById('tr-s'+(i+1)+'b').value=s[1];});
    trAtualiza();
    if(o.venc){document.getElementById('tr-venc').value=o.venc;trVencAuto=false;trAtualiza();}
    const info=document.getElementById('tr-info').textContent,vencVisivel=!document.getElementById('tr-venc').closest('.field').hidden;
    __t=[];salvarResultadoTor();
    return {info,vencVisivel,toast:__t.slice(),aberto:document.getElementById('ov-tor-result').classList.contains('on'),jogos:JSON.parse(JSON.stringify(torAtual().jogos||[]))};
   },o);

   for(const largura of [320,390]){
    await check(tema+' '+largura+'px: classificação inteira na tela, sem rolar de lado, com V, D, WO e pontos à vista',async()=>{
     await g.setViewportSize({width:largura,height:844});await reset();
     const r=await g.evaluate(()=>{
      const cards=[...document.querySelectorAll('#pg-torneio .tg-card')];
      const fora=[];
      cards.forEach(card=>{const cb=card.getBoundingClientRect();
       card.querySelectorAll('.trn-row>*').forEach(el=>{const b=el.getBoundingClientRect();if(b.width>0&&(b.right>cb.right+1||b.left<cb.left-1))fora.push(el.className+' '+el.textContent.trim());});});
      const linhas=[...document.querySelectorAll('#pg-torneio .trn-row')];
      const ln=linhas.find(l=>l.dataset.name.startsWith('Jogador Um'));
      return {lateral:document.documentElement.scrollWidth>innerWidth+1,fora,velha:!!document.querySelector('.tg-table-scroll,.tg-tbl,.tg-stat'),
       linhas:linhas.length,alturas:linhas.map(l=>Math.round(l.getBoundingClientRect().height)),
       textoLinha:ln.innerText.replace(/\s+/g,' ').trim(),cab:document.querySelector('#pg-torneio .trn-cab').innerText.replace(/\s+/g,' ').trim()};});
     assert.equal(r.lateral,false,'nada de rolar a página para o lado');
     assert.deepEqual(r.fora,[],'toda coluna dentro do cartão');
     assert.equal(r.velha,false,'a tabela larga e os campos de digitar saíram');
     assert.equal(r.linhas,5);
     assert.ok(r.alturas.every(h=>h>=44&&h<=64),'linhas baixas, mas com toque confortável: '+r.alturas);
     assert.equal(r.textoLinha,'⠿ 1 Jogador Um Sobrenome 🔗 3 1 0 10','empate em 10 pts: desempata por vitórias');
     assert.equal(r.cab,'# JOGADOR V D WO PTS');
     if(process.env.JV_SHOTS)await g.screenshot({path:path.join(process.env.JV_SHOTS,'gestao-torneio-'+tema+'-'+largura+'.png'),fullPage:true});
    });
   }
   await g.setViewportSize({width:390,height:844});
   await check(tema+': ações enxutas — Lançar resultado em destaque, Compartilhar e Homenagens; etapa numa linha',async()=>{
    await reset();
    const r=await g.evaluate(()=>({acts:[...document.querySelectorAll('#pg-torneio .trn-acts button')].map(b=>b.innerText.replace(/\s+/g,' ').trim()),
     etapa:document.querySelector('#tor-etapa .te-bar').innerText.replace(/\s+/g,' ').trim(),
     alturaEtapa:Math.round(document.querySelector('#tor-etapa .te-bar').getBoundingClientRect().height),
     alturaAcoes:Math.round(document.querySelector('#pg-torneio .trn-acts').getBoundingClientRect().height),
     cabecalhos:[...document.querySelectorAll('#pg-torneio .trn-head .trn-hbtn')].map(b=>b.innerText.trim()),
     excluir:!!document.querySelector('#pg-torneio .trn-excluir'),novaCat:!!document.querySelector('#pg-torneio .trn-novacat')}));
    assert.deepEqual(r.acts,['🎾 Lançar resultado games de cada set ou W.O.','📤 Compartilhar','🏆 Homenagens']);
    assert.equal(r.etapa,'Etapa 2 ✎ em andamento 🏁 Encerrar etapa');
    assert.ok(r.alturaEtapa<=72,'etapa numa linha: '+r.alturaEtapa);
    assert.ok(r.alturaAcoes<=120,'ações em duas linhas: '+r.alturaAcoes);
    assert.deepEqual(r.cabecalhos,['＋ Jogador','＋ Jogador'],'cada categoria tem o seu ＋ Jogador');
    assert.equal(r.excluir,true);assert.equal(r.novaCat,true);
    const enc=await g.evaluate(()=>{torAtual().encerrada=true;renderTorneio();return document.querySelector('#tor-etapa .te-bar').innerText.replace(/\s+/g,' ').trim();});
    assert.equal(enc,'Etapa 2 ✎ encerrada ✓ ➕ Nova etapa','depois de encerrar, o botão vira Nova etapa');
   });
   await check(tema+': ＋ Jogador da categoria já abre com ela escolhida',async()=>{
    await reset();
    await g.locator('#pg-torneio .tg-card').nth(1).locator('.trn-hbtn',{hasText:'Jogador'}).click();
    assert.equal(await g.evaluate(()=>document.getElementById('ov-tor-jogador').classList.contains('on')&&document.getElementById('tj-grupo').value),'B');
   });
   await check(tema+': tocar no jogador abre a ficha; ＋/− corrigem V/D/WO sem passar de zero',async()=>{
    await reset();
    await g.locator('#pg-torneio .trn-row',{hasText:'Jogadora Dois'}).click();
    assert.equal(await g.evaluate(()=>document.getElementById('ov-tor-jog').classList.contains('on')),true);
    const txt=await g.locator('#trj-corpo').innerText();
    assert.match(txt,/Jogadora Dois/);assert.match(txt,/Grupo Ouro · 3º lugar · 9 pts/);
    if(process.env.JV_SHOTS)await g.screenshot({path:path.join(process.env.JV_SHOTS,'gestao-torneio-ficha-'+tema+'.png')});
    await g.locator('#trj-corpo button[aria-label="Somar 1 em Vitórias"]').click();
    assert.deepEqual(await jog('A','Jogadora Dois'),{v:3,d:2,wo:1});
    for(let i=0;i<3;i++)await g.locator('#trj-corpo button[aria-label="Tirar 1 de W.O."]').click();
    assert.deepEqual(await jog('A','Jogadora Dois'),{v:3,d:2,wo:0},'não fica negativo');
    assert.match(await g.locator('#trj-corpo').innerText(),/W\.O\.\s*−\s*0\s*＋/);
   });
   await check(tema+': na ficha, Renomear troca o nome também nos jogos já lançados',async()=>{
    await reset();
    await lancar({g:'A',p1:'Jogadora Dois',p2:'Jogador Um Sobrenome',sets:[[6,2],[6,3]]});
    await g.evaluate(()=>{__prompt='Jogadora Dois Renomeada';abrirJogTor('A','Jogadora Dois');trjAcao('renomear');});
    const r=await g.evaluate(()=>({nomes:torAtual().jogadores.map(p=>p.name),j:torAtual().jogos[0]}));
    assert.ok(r.nomes.includes('Jogadora Dois Renomeada'));
    assert.equal(r.j.p1,'Jogadora Dois Renomeada');assert.equal(r.j.venc,'Jogadora Dois Renomeada');
   });
   await check(tema+': lançar com os games de cada set — o placar decide o vencedor e fica guardado',async()=>{
    await reset();
    const r=await lancar({g:'A',p1:'Jogadora Dois',p2:'Jogador Um Sobrenome',sets:[[4,6],[7,6],[10,8]]});
    assert.equal(r.vencVisivel,false,'com placar, o campo de vencedor some');
    assert.equal(r.info,'✓ Jogadora Dois venceu por 2 a 1 · 4/6 7/6 10/8');
    assert.equal(r.aberto,false);assert.deepEqual(r.toast,['✓ Jogadora Dois venceu · 4/6 7/6 10/8']);
    assert.deepEqual(await jog('A','Jogadora Dois'),{v:3,d:2,wo:1});
    assert.deepEqual(await jog('A','Jogador Um Sobrenome'),{v:3,d:2,wo:0});
    const jj=r.jogos[0];
    assert.deepEqual([jj.etapa,jj.grupo,jj.p1,jj.p2,jj.venc,jj.tipo,jj.data,jj.origem],[2,'A','Jogadora Dois','Jogador Um Sobrenome','Jogadora Dois','normal','2026-10-21','gestao']);
    assert.deepEqual(jj.sets,[[4,6],[7,6],[10,8]]);
    // vencedor é o jogador 2: o placar escrito fica do ponto de vista de quem venceu
    const r2=await lancar({g:'B',p1:'Jogador Cinco',p2:'Jogadora Quatro',sets:[[2,6],[1,6]]});
    assert.deepEqual(r2.toast,['✓ Jogadora Quatro venceu · 6/2 6/1']);
    const lista=await g.locator('#tor-jogos').innerText();
    assert.match(lista,/Jogos da etapa 2 \(2\)/);assert.match(lista,/Jogadora Quatro venceu Jogador Cinco\s*6\/2 6\/1 · Grupo B · 21\/10/);
    assert.match(lista,/Jogadora Dois venceu Jogador Um Sobrenome\s*4\/6 7\/6 10\/8 · Grupo Ouro · 21\/10/);
    // na ficha de quem perdeu, o placar aparece do lado dele
    await g.evaluate(()=>abrirJogTor('A','Jogador Um Sobrenome'));
    assert.match(await g.locator('#trj-corpo').innerText(),/✗ Perdeu para Jogadora Dois · 6\/4 6\/7 8\/10/);
   });
   await check(tema+': placar que não fecha não grava nada (set empatado, set pulado, set a mais, empate em sets)',async()=>{
    await reset();
    const antes=await g.evaluate(()=>JSON.stringify(torAtual()));
    const casos=[
     [[[6,6]],'O 1º set não pode terminar empatado (6/6).'],
     [[[6,4],['',''],[6,3]],'Preencha o 2º set antes do 3º.'],
     [[[6,4],[6,3],[6,1]],'O jogo acabou em 2 sets: apague o 3º set.'],
     [[[6,4],[3,6]],'Empate em sets (1 a 1): falta o 3º set ou o super tie-break.'],
     [[[6,'']],'Falta o número de um dos jogadores no 1º set.'],
     [[['6a',4]],'Use só números no 1º set.']];
    for(const [sets,msg] of casos){
     const r=await lancar({g:'A',p1:'Jogadora Dois',p2:'Jogador Um Sobrenome',sets});
     assert.deepEqual(r.toast,[msg],JSON.stringify(sets));assert.equal(r.aberto,true,'a janela continua aberta para corrigir');
    }
    assert.equal(await g.evaluate(()=>JSON.stringify(torAtual())),antes,'nada mudou');
    if(process.env.JV_SHOTS)await g.screenshot({path:path.join(process.env.JV_SHOTS,'gestao-torneio-erro-'+tema+'.png')});
   });
   await check(tema+': sem placar, escolhe só o vencedor; W.O. não leva o vencedor que o placar tinha posto',async()=>{
    await reset();
    const r=await lancar({g:'B',p1:'Jogadora Quatro',p2:'Jogador Cinco',venc:'Jogador Cinco'});
    assert.equal(r.vencVisivel,true);assert.deepEqual(r.toast,['✓ Jogador Cinco venceu']);
    assert.equal(r.jogos[0].placar,undefined);assert.equal(r.jogos[0].sets,undefined);
    assert.deepEqual(await jog('B','Jogador Cinco'),{v:1,d:4,wo:0});
    // digitou o placar (vencedor automático) e trocou para W.O.: precisa escolher de novo
    const w=await g.evaluate(()=>{abrirResultadoTor();document.getElementById('tr-grupo').value='A';trPlayers();
     document.getElementById('tr-p1').value='Jogadora Dois';document.getElementById('tr-p2').value='Jogador Um Sobrenome';
     document.getElementById('tr-s1a').value=6;document.getElementById('tr-s1b').value=1;trAtualiza();
     const auto=document.getElementById('tr-venc').value;
     document.querySelector('input[name="tr-tipo"][value="wo"]').checked=true;trAtualiza();
     return {auto,depois:document.getElementById('tr-venc').value,placar:document.getElementById('tr-placar').hidden,rot:document.getElementById('tr-venc-lbl').textContent};});
    assert.deepEqual(w,{auto:'Jogadora Dois',depois:'',placar:true,rot:'Quem venceu por W.O.?'});
    if(process.env.JV_SHOTS)await g.screenshot({path:path.join(process.env.JV_SHOTS,'gestao-torneio-wo-'+tema+'.png')});
    const r2=await lancar({g:'A',p1:'Jogadora Dois',p2:'Jogador Um Sobrenome',wo:true,venc:'Jogador Um Sobrenome'});
    assert.deepEqual(r2.toast,['✓ Jogador Um Sobrenome venceu por W.O.']);
    assert.deepEqual(await jog('A','Jogador Um Sobrenome'),{v:3,d:1,wo:1},'W.O. soma só no WO de quem venceu, como antes');
    assert.deepEqual(await jog('A','Jogadora Dois'),{v:2,d:2,wo:1});
   });
   await check(tema+': com uma categoria só, ela já vem escolhida',async()=>{
    await reset();
    const v=await g.evaluate(()=>{selTorneio('t2');abrirResultadoTor();return [document.getElementById('tr-grupo').value,document.getElementById('tr-p1').options.length];});
    assert.deepEqual(v,['A',3]);
   });
   await check(tema+': mesmo par já lançado na etapa pergunta antes de contar de novo',async()=>{
    await reset();
    await lancar({g:'A',p1:'Jogadora Dois',p2:'Jogador Um Sobrenome',sets:[[6,1],[6,1]]});
    const antes=await g.evaluate(()=>JSON.stringify(torAtual()));
    await g.evaluate(()=>{__conf=false;});
    const r=await lancar({g:'A',p1:'Jogador Um Sobrenome',p2:'Jogadora Dois',sets:[[6,1],[6,1]]});
    assert.equal(r.aberto,true);assert.equal(await g.evaluate(()=>JSON.stringify(torAtual())),antes,'recusou: nada gravado');
   });
   await check(tema+': Desfazer tira a vitória e a derrota e apaga o jogo; etapa encerrada não desfaz',async()=>{
    await reset();
    const r=await lancar({g:'A',p1:'Jogadora Dois',p2:'Jogador Um Sobrenome',sets:[[6,3],[6,4]]});
    await g.locator('#tor-jogos .trn-desf').click();
    assert.deepEqual(await jog('A','Jogadora Dois'),{v:2,d:2,wo:1});
    assert.deepEqual(await jog('A','Jogador Um Sobrenome'),{v:3,d:1,wo:0});
    assert.equal(await g.evaluate(()=>torAtual().jogos.length),0);
    assert.equal(await g.locator('#tor-jogos').innerText(),'','sem jogos, a lista some');
    await lancar({g:'A',p1:'Jogadora Dois',p2:'Jogador Um Sobrenome',sets:[[6,3],[6,4]]});
    const enc=await g.evaluate(()=>{torAtual().encerrada=true;renderTorneio();return {botao:!!document.querySelector('#tor-jogos .trn-desf'),txt:document.querySelector('#tor-jogos').innerText};});
    assert.equal(enc.botao,false);assert.match(enc.txt,/Etapa encerrada: os jogos ficam só para consulta/);
   });
   await check(tema+': resultado do aluno entra no torneio dele e guarda o placar (sets conferidos ou o texto)',async()=>{
    await reset();
    const r=await g.evaluate(()=>{
     torFila=[{key:'k1',torneioId:'t1',group:'A',p1:'Jogador Um Sobrenome',p2:'Jogadora Dois',vencedor:'Jogadora Dois',tipo:'normal',score:'6/4 6/2',sets:[[4,6],[2,6]],nome:'Aluno Teste'},
      {key:'k2',torneioId:'t2',group:'A',p1:'Pessoa Seis',p2:'Pessoa Sete',vencedor:'Pessoa Seis',tipo:'normal',score:'6/3 6/4',nome:'Aluno Teste'},
      {key:'k3',torneioId:'t1',group:'A',p1:'Jogadora Dois',p2:'Jogadora Dois',vencedor:'Jogadora Dois',tipo:'normal',nome:'Aluno Teste'}];
     renderTorLog();const log=document.getElementById('tor-log-wrap').innerText;
     aplicarFilaTor('k1');aplicarFilaTor('k2');__t=[];aplicarFilaTor('k3');
     const t1=DB.torneios.lista.t1,t2=DB.torneios.lista.t2;
     return {log,j1:t1.jogos[0],j2:t2.jogos[0],t2p:t2.jogadores.map(p=>[p.name,p.v||0,p.d||0]),fila:torFila.map(x=>x.key),toast:__t.slice()};});
    assert.match(r.log,/Jogadora Dois venceu Jogador Um Sobrenome\s*Grupo Ouro · 6\/4 6\/2 · por Aluno Teste/);
    assert.match(r.log,/Pessoa Seis venceu Pessoa Sete\s*Grupo A · 6\/3 6\/4 · por Aluno Teste · Torneio Anual Teste/);
    assert.deepEqual(r.j1.sets,[[4,6],[2,6]]);assert.equal(r.j1.origem,'aluno');assert.equal(r.j1.por,'Aluno Teste');
    assert.equal(r.j2.placar,'6/3 6/4');assert.equal(r.j2.sets,undefined);
    assert.deepEqual(r.t2p,[['Pessoa Seis',1,0],['Pessoa Sete',0,1]],'foi para o torneio que o aluno escolheu, não o aberto');
    assert.deepEqual(r.fila,['k3'],'o incompleto fica na fila');assert.deepEqual(r.toast,['Resultado incompleto: descarte e lance pelo 🎾 Lançar resultado']);
    if(process.env.JV_SHOTS){await g.evaluate(()=>{torFila=[{key:'k9',torneioId:'t1',group:'A',p1:'Jogador Um Sobrenome',p2:'Jogadora Dois',vencedor:'Jogadora Dois',tipo:'normal',score:'6/4 6/2',nome:'Aluno Teste'}];renderTorneio();});
     await g.screenshot({path:path.join(process.env.JV_SHOTS,'gestao-torneio-alunos-'+tema+'.png'),fullPage:true});}
   });
   await check(tema+': Compartilhar pergunta o formato; Resultados da etapa leva o placar de cada jogo',async()=>{
    await reset();
    await g.locator('#pg-torneio .trn-acts button',{hasText:'Compartilhar'}).click();
    assert.equal(await g.evaluate(()=>document.getElementById('ov-tor-comp').classList.contains('on')),true);
    assert.equal(await g.locator('#trc-jogos').isVisible(),false,'sem jogos, não oferece os resultados');
    await g.evaluate(()=>closeModal('ov-tor-comp'));
    await lancar({g:'A',p1:'Jogadora Dois',p2:'Jogador Um Sobrenome',sets:[[6,4],[3,6],[10,8]]});
    await lancar({g:'B',p1:'Jogadora Quatro',p2:'Jogador Cinco',wo:true,venc:'Jogadora Quatro'});
    await g.locator('#pg-torneio .trn-acts button',{hasText:'Compartilhar'}).click();
    if(process.env.JV_SHOTS)await g.screenshot({path:path.join(process.env.JV_SHOTS,'gestao-torneio-compartilhar-'+tema+'.png')});
    await g.locator('#trc-jogos').click();
    const txt=await g.evaluate(()=>decodeURIComponent(__abriu[0].split('text=')[1]));
    assert.equal(txt,'🎾 *BARRAGEM TESTE · ETAPA 2*\n_Resultados_\n\n*── GRUPO OURO ──*\n✅ Jogadora Dois venceu Jogador Um Sobrenome · 6/4 3/6 10/8\n\n*── GRUPO B ──*\n✅ Jogadora Quatro venceu Jogador Cinco · W.O.\n\n_Acompanhe sua evolução em quadra!_ 🎾');
   });
   await check(tema+': arrastar pelo ⠿ continua mudando o jogador de categoria (e não abre a ficha)',async()=>{
    await g.setViewportSize({width:390,height:2200});await reset();
    const de=await g.locator('#pg-torneio .trn-row',{hasText:'Jogador Cinco'}).locator('.tg-drag').boundingBox();
    const para=await g.locator('#pg-torneio .trn-row',{hasText:'Jogadora Dois'}).boundingBox();
    await g.mouse.move(de.x+de.width/2,de.y+de.height/2);await g.mouse.down();
    await g.mouse.move(para.x+para.width/2,para.y+para.height*0.8,{steps:8});await g.mouse.up();
    const r=await g.evaluate(()=>({grupo:torAtual().jogadores.find(p=>p.name==='Jogador Cinco').group,ficha:document.getElementById('ov-tor-jog').classList.contains('on')}));
    assert.deepEqual(r,{grupo:'A',ficha:false});
    await g.setViewportSize({width:390,height:844});
   });
   await check(tema+': leitura (contraste pela imagem) na tela e nas janelas do torneio',async()=>{
    const prep={
     tela:()=>{torFila=[{key:'k9',torneioId:'t1',group:'A',p1:'Jogador Um Sobrenome',p2:'Jogadora Dois',vencedor:'Jogadora Dois',tipo:'normal',score:'6/4 6/2',nome:'Aluno Teste'}];
      DB.torneios.lista.t1.etapasFin=[{etapa:1,data:'2026-09-30',campeoes:[{grupo:'A',campeao:'Jogador Um Sobrenome',vice:'Jogadora Dois'}]}];renderTorneio();
      document.querySelectorAll('#pg-torneio details').forEach(d=>d.open=true);},
     placar:()=>{abrirResultadoTor();document.getElementById('tr-grupo').value='A';trPlayers();document.getElementById('tr-p1').value='Jogadora Dois';document.getElementById('tr-p2').value='Jogador Um Sobrenome';
      [['tr-s1a',6],['tr-s1b',4],['tr-s2a',3],['tr-s2b',6],['tr-s3a',10],['tr-s3b',8]].forEach(([i,v])=>document.getElementById(i).value=v);trAtualiza();},
     erro:()=>{abrirResultadoTor();document.getElementById('tr-grupo').value='A';trPlayers();document.getElementById('tr-p1').value='Jogadora Dois';document.getElementById('tr-p2').value='Jogador Um Sobrenome';
      document.getElementById('tr-s1a').value=6;document.getElementById('tr-s1b').value=6;trAtualiza();},
     wo:()=>{abrirResultadoTor();document.getElementById('tr-grupo').value='A';trPlayers();document.querySelector('input[name="tr-tipo"][value="wo"]').checked=true;trAtualiza();},
     ficha:()=>{abrirJogTor('A','Jogador Um Sobrenome');},
     compartilhar:()=>{abrirCompartilharTor();}};
    const falhas=[];
    for(const [nome,fn] of Object.entries(prep)){
     await reset();
     if(nome!=='tela')await lancar({g:'A',p1:'Jogador Um Sobrenome',p2:'Jogadora Dois',sets:[[6,4],[6,7],[10,3]]});
     await g.evaluate('('+fn.toString()+')()');
     // só o torneio: cabeçalho e barra de baixo têm teste próprio
     await g.addStyleTag({content:'html body:not(#a1):not(#a2):not(#a3) :is(.top,.nav,#nav-mais,.mais-pop){display:none!important}*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important}#toast{display:none!important}'});
     await g.evaluate(()=>window.scrollTo(0,0));
     const itens=await medir(g,process.env.JV_SHOTS&&path.join(process.env.JV_SHOTS,'gestao-torneio-leitura-'+tema+'-'+nome+'.png'));
     assert.ok(itens.length>5,nome+': mediu textos');
     itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).forEach(it=>falhas.push(nome+' · '+it.t+' · '+it.ratio+'/'+it.minimo+' · '+it.fg+' sobre '+it.fundo));
     await g.evaluate(()=>document.querySelectorAll('style').forEach(st=>{if(/\.top,\.nav,#nav-mais/.test(st.textContent))st.remove();}));
    }
    assert.deepEqual(falhas,[],'textos difíceis de ler');
   });
   assert.deepEqual(erros,[]);
   await c.close();
  }
  /* ===== iPhone (WebKit, o motor do Safari) =====
     O João mandou print do iPhone: na janela antiga, as bolinhas de "Jogo normal"
     e "W.O." herdavam a largura de campo e viravam círculos gigantes que cortavam
     o texto. No validar-pr o WebKit está instalado; aqui no contêiner pode não estar. */
  let wk=null;
  try{wk=await webkit.launch({headless:true});}catch(e){
   if(process.env.CI)throw e;
   console.log('⏭️  WebKit não instalado neste computador: a parte do iPhone roda no validar-pr');
  }
  if(wk){
   try{
    const medirJanela=(sel)=>({
     tipos:[...document.querySelectorAll(sel+' label')].map(l=>{const r=l.getBoundingClientRect(),i=l.querySelector('input').getBoundingClientRect(),cs=getComputedStyle(l);
      return {txt:l.innerText.trim(),w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top),cortado:l.scrollWidth>l.clientWidth+1,bolinha:Math.max(i.width,i.height),
       on:l.classList.contains('on'),fundo:cs.backgroundColor,dentro:r.left>=0&&r.right<=innerWidth};}),
     modalLateral:(()=>{const m=document.querySelector('.overlay.on .modal');return m.scrollWidth>m.clientWidth+1;})(),
     caixas:[...document.querySelectorAll('.overlay.on input[inputmode=numeric]')].filter(i=>i.getClientRects().length).map(i=>{const r=i.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.width>=44;})});
    const conferir=(r,onde)=>{
     assert.deepEqual(r.tipos.map(t=>t.txt),['Jogo','W.O.'],onde);
     assert.equal(r.tipos[0].top,r.tipos[1].top,onde+': lado a lado');
     for(const t of r.tipos){assert.equal(t.cortado,false,onde+': texto inteiro em '+t.txt);assert.ok(t.h>=44&&t.h<=60,onde+': altura '+t.h);
      assert.ok(t.bolinha<=2,onde+': a bolinha do rádio não aparece ('+t.bolinha+'px)');assert.equal(t.dentro,true);}
     assert.deepEqual(r.tipos.map(t=>t.on),[true,false],onde+': "Jogo" marcado');assert.notEqual(r.tipos[0].fundo,r.tipos[1].fundo,onde+': o marcado tem outra cor');
     assert.equal(r.modalLateral,false,onde+': janela sem rolar de lado');
     assert.equal(r.caixas.length,6,onde+': 6 caixas de games');assert.ok(r.caixas.every(Boolean),onde+': caixas inteiras na tela');
    };
    const ctx=await wk.newContext(Object.assign({},devices['iPhone 13'],{timezoneId:'America/Sao_Paulo',serviceWorkers:'block'}));
    await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
    await ctx.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
    const w=await ctx.newPage(),errW=[];w.on('pageerror',e=>errW.push(e.message));w.on('dialog',d=>d.dismiss());
    await w.clock.setFixedTime(AGORA);await w.goto(base+'/app-gestao/',{waitUntil:'load'});
    await w.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
    await w.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
    await check('iPhone (WebKit) · Gestão: classificação sem rolar de lado e "Jogo | W.O." inteiro, sem bolinha gigante',async()=>{
     const r=await w.evaluate(()=>{MODO='dono';persist=()=>{};publish=()=>{};
      DB.torneios={atual:'t1',seeded:true,lista:{t1:{id:'t1',nome:'Barragem Teste',tipo:'barragem',etapa:1,encerrada:false,grupos:['A'],nomesGrupos:{A:'Grupo Bronze Teste'},etapasFin:[],jogos:[],
       jogadores:[{group:'A',name:'Jogador Um Sobrenome Comprido',v:2,d:1,wo:0,order:0},{group:'A',name:'Jogadora Dois',v:1,d:2,wo:1,order:1}]}}};
      go('torneio',document.createElement('b'));renderTorneio();
      const fora=[];document.querySelectorAll('#pg-torneio .tg-card').forEach(c=>{const cb=c.getBoundingClientRect();c.querySelectorAll('.trn-row>*').forEach(e=>{const b=e.getBoundingClientRect();if(b.width&&(b.right>cb.right+1||b.left<cb.left-1))fora.push(e.textContent);});});
      abrirResultadoTor();document.getElementById('tr-p1').value='Jogador Um Sobrenome Comprido';document.getElementById('tr-p2').value='Jogadora Dois';trAtualiza();
      return {lateral:document.documentElement.scrollWidth>innerWidth+1,fora};});
     assert.deepEqual(r,{lateral:false,fora:[]});
     conferir(await w.evaluate(medirJanela,'#ov-tor-result .trs-tipo'),'Gestão');
     if(process.env.JV_SHOTS)await w.screenshot({path:path.join(process.env.JV_SHOTS,'iphone-gestao-resultado.png')});
     // tocar em W.O. marca W.O. e esconde a grade
     await w.locator('#ov-tor-result .trs-tipo label',{hasText:'W.O.'}).click();
     assert.deepEqual(await w.evaluate(()=>[[...document.querySelectorAll('#ov-tor-result .trs-tipo label')].map(l=>l.classList.contains('on')),document.getElementById('tr-placar').hidden]),[[false,true],true]);
    });
    const a=await ctx.newPage();a.on('pageerror',e=>errW.push(e.message));a.on('dialog',d=>d.dismiss());
    await a.clock.setFixedTime(AGORA);await a.goto(base+'/app-aluno/',{waitUntil:'load'});
    await a.waitForFunction(()=>typeof abrirRegResultado==='function');
    await check('iPhone (WebKit) · app do aluno: "Jogo | W.O." inteiro e as caixas de games na tela',async()=>{
     await a.evaluate(()=>{init=async()=>{};document.querySelectorAll('[id*="splash"],#login').forEach(x=>x.style.display='none');
      PUB={torneio:{id:'tor1',nome:'Barragem Teste',etapa:1,nomesGrupos:{A:'Grupo Bronze Teste'},jogadores:[{name:'Aluno Fictício',group:'A',v:0,d:0,wo:0},{name:'Jogador Dois',group:'A',v:0,d:0,wo:0}]}};
      abrirRegResultado();document.getElementById('atr-p1').value='Aluno Fictício';document.getElementById('atr-p2').value='Jogador Dois';atrAtualiza();});
     conferir(await a.evaluate(medirJanela,'#ov-tor-result .ats-tipo'),'Aluno');
     if(process.env.JV_SHOTS)await a.screenshot({path:path.join(process.env.JV_SHOTS,'iphone-aluno-resultado.png')});
    });
    assert.deepEqual(errW,[]);
    await ctx.close();
   }finally{await wk.close();}
  }
  console.log('\n✅ '+count+' verificações · torneio da Gestão');
 }catch(e){console.error('❌ '+(e.stack||e));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

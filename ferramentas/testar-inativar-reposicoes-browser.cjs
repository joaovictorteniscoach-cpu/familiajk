/* Inativar aluno e gráfico de reposições (19/10).
   O João pediu: ao marcar um aluno como inativo, o app PERGUNTA se encerra os
   horários dele (antes, os fixos seguiam valendo e as aulas contavam no Início).
   E um gráfico com o número de reposições: aula desmarcada com 4h ou mais de
   aviso vira reposição; com menos de 4h conta como aula dada.
   Só dados fictícios, rede externa bloqueada, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-19T10:30:00-03:00');   // segunda-feira
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
function lab(css){
 const m=String(css).match(/\d+(\.\d+)?/g).map(Number),f=v=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
 const [r,g,b]=m.slice(0,3).map(f),X=(r*0.4124+g*0.3576+b*0.1805)/0.95047,Y=r*0.2126+g*0.7152+b*0.0722,Z=(r*0.0193+g*0.1192+b*0.9505)/1.08883;
 const h=t=>t>0.008856?Math.cbrt(t):7.787*t+16/116;return [116*h(Y)-16,500*(h(X)-h(Y)),200*(h(Y)-h(Z))];
}
const deltaE=(a,b)=>{const x=lab(a),y=lab(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]);};

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const tema of ['saibro','classico']){
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
    if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');try{localStorage.setItem('jv-tema',t);}catch(e){}},tema);
   const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));
   // as janelas de confirmação: o teste responde uma a uma e guarda o texto
   const dlg={resp:[],vistas:[]};
   g.on('dialog',d=>{dlg.vistas.push(d.message());const r=dlg.resp.length?dlg.resp.shift():false;r?d.accept():d.dismiss();});
   await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
   await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
   await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important}'});
   const dados=()=>g.evaluate(()=>{
    persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';
    window._versoes=[];guardarVersoes=json=>{window._versoes.push(json);return Promise.resolve(true);};
    const al=(id,nome)=>({id,nome,codigo:id,tipo:'Particular',plano:4,planoGrupo:0,creditos:4,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true,extratoAberto:true});
    DB.alunos=[al('a1','Aluno Um'),al('a2','Aluno Dois'),al('a3','Aluno <Três>'),al('a4','Aluno Quatro')];
    DB.alunos[2].arquivado=true;                                // inativo desde antes
    const fx=(id,dia,hora,alunoId,desde,ate)=>Object.assign({id,dia,hora,titulo:DB.alunos.find(a=>a.id===alunoId).nome,tipo:'aula',alunoId,desde},ate?{ate}:{});
    DB.agenda={fixos:[fx('f1',1,'10:00','a2','2026-09-01'),fx('f2',3,'18:00','a2','2026-11-04'),fx('f3',1,'09:00','a1','2026-09-01'),fx('f4',2,'07:00','a2','2026-09-01','2026-10-10')],
     eventos:[{id:'e1',data:'2026-10-19',hora:'18:00',titulo:'Aluno Dois',tipo:'aula',alunoId:'a2'},{id:'e2',data:'2026-10-22',hora:'10:00',titulo:'Aluno Dois',tipo:'aula',alunoId:'a2'},
      {id:'e3',data:'2026-10-05',hora:'10:00',titulo:'Aluno Dois',tipo:'aula',alunoId:'a2'},{id:'e4',data:'2026-10-22',hora:'11:00',titulo:'Aluno Um',tipo:'aula',alunoId:'a1'}],
     excecoes:[{fixoId:'f2',data:'2026-11-11'},{fixoId:'f1',data:'2026-10-12'}]};
    DB.presencas=[{k:'p-a2-1005',alunoId:'a2',data:'2026-10-05',hora:'10:00',tipo:'aula',custo:1}];
    /* Extrato fictício de reposições (horário de Curitiba) */
    const t=s=>new Date(s+'T12:00:00-03:00').getTime(),mv=(alunoId,quando,delta,motivo,ref)=>({ts:t(quando),alunoId,campo:'repos',delta,de:0,para:0,motivo,ref:ref||''});
    DB.movs=[
     mv('a1','2026-09-01',2,'Sobra do mês virou reposição'),
     mv('a1','2026-09-10',-1,'Reposição na agenda','k1'),
     mv('a1','2026-10-01',1,'Sobra do mês virou reposição'),
     mv('a1','2026-10-06',-1,'Reposição na agenda','k2'),mv('a1','2026-10-06',1,'Chuva — devolvido','k2'),           // choveu: não foi usada
     mv('a1','2026-10-08',1,'Reposição anotada','anot-1'),mv('a1','2026-10-08',-1,'Reposição anotada desfeita','anot-1'), // desfeita
     mv('a1','2026-10-09',1,'Reposição anotada','anot-2'),
     mv('a1','2026-09-30',-1,'Reposição na agenda','k3'),mv('a1','2026-09-30',1,'Reposição desmarcada','k3'),mv('a1','2026-10-14',-1,'Reposição na agenda','k3'), // o ✓ que ficou é o de outubro
     mv('a2','2026-06-01',3,'Sobra do mês virou reposição'),
     mv('a2','2026-10-01',-1,'Reposição vencida (4 meses)'),
     mv('a2','2026-10-05',-1,'Reposições descontadas na mensalidade'),
     mv('a3','2026-10-01',2,'Sobra do mês virou reposição'),
     mv('a4','2026-10-02',3,'Saldo inicial','abertura'),         // abertura do extrato: não é acontecimento do mês
     mv('a4','2026-09-20',1,'Correção manual no cadastro'),
     mv('zz','2026-10-01',9,'Sobra do mês virou reposição')];   // aluno que nem existe mais: fora
    const soma=id=>DB.movs.filter(m=>m.alunoId===id).reduce((s,m)=>s+m.delta,0);
    DB.alunos.forEach(a=>{a.repos=soma(a.id);});
    ensureFields();CARREGADO=true;
    document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
    curYear=2026;curMonth=9;go('alunos',document.createElement('button'));renderAll();
   });
   await dados();
   const foto=()=>g.evaluate(()=>JSON.stringify({ag:DB.agenda,al:DB.alunos,pr:DB.presencas,mv:DB.movs}));
   const ordenado=j=>{const d=JSON.parse(j);['fixos','eventos'].forEach(k=>d.ag[k].sort((x,y)=>x.id.localeCompare(y.id)));
    d.ag.excecoes.sort((x,y)=>(x.fixoId+x.data).localeCompare(y.fixoId+y.data));return JSON.stringify(d);};

   await check(tema+': inativar com horários pergunta se encerra; OK encerra só de amanhã em diante',async()=>{
    const antes=await foto();dlg.vistas=[];dlg.resp=[true,true];
    await g.evaluate(()=>arquivarAluno('a2'));
    assert.equal(dlg.vistas.length,2,'duas perguntas: inativar e encerrar');
    const q=dlg.vistas[1];
    assert.match(q,/Aluno Dois ainda tem na agenda, de amanhã em diante:/);
    assert.match(q,/· toda seg às 10:00\n/);assert.match(q,/· toda qua às 18:00 \(começaria em 04\/11\)/);
    assert.match(q,/· 22\/10 · Qui às 10:00/);
    assert.doesNotMatch(q,/19\/10|05\/10|ter às 07:00/,'hoje, passado e fixo já encerrado não entram');
    assert.match(q,/OK = encerrar: os fixos param depois de hoje e as aulas marcadas de amanhã em diante saem da agenda/);
    assert.match(q,/Cancelar = deixar a agenda como está/);
    const r=await g.evaluate(()=>{const A=DB.agenda,f=id=>A.fixos.find(x=>x.id===id);
     return {arq:DB.alunos.find(a=>a.id==='a2').arquivado,f1:f('f1')&&f('f1').ate,f2:!!f('f2'),f3:JSON.stringify(f('f3')),f4:f('f4')&&f('f4').ate,
      ev:A.eventos.map(e=>e.id).sort(),exc:A.excecoes.map(x=>x.fixoId+'|'+x.data).sort(),
      hoje:entriesFor(new Date('2026-10-19T12:00:00'),'10:00').map(e=>e.alunoId),prox:entriesFor(new Date('2026-10-26T12:00:00'),'10:00').map(e=>e.alunoId),
      versoes:window._versoes.length,toast:document.getElementById('toast').textContent,
      achado:achadosDoAluno(DB.alunos.find(a=>a.id==='a2')).map(x=>x.txt).join(' | ')};});
    assert.equal(r.arq,true);
    assert.equal(r.f1,'2026-10-19','fixo para depois de hoje (hoje ainda vale)');
    assert.equal(r.f2,false,'fixo que nem tinha começado sai inteiro');
    assert.equal(r.f4,'2026-10-10','fixo já encerrado não muda');
    const a0=JSON.parse(antes);
    assert.equal(r.f3,JSON.stringify(a0.ag.fixos.find(x=>x.id==='f3')),'fixo de outro aluno não muda');
    assert.deepEqual(r.ev,['e1','e3','e4'],'sai só a avulsa de amanhã em diante; hoje, passado e outro aluno ficam');
    assert.deepEqual(r.exc,['f1|2026-10-12'],'exceção do fixo removido sai junto; as outras ficam');
    assert.deepEqual(r.hoje,['a2'],'a aula de hoje continua');assert.deepEqual(r.prox,[],'segunda que vem já sem ele');
    assert.equal(r.versoes,1,'versão salva antes');
    assert.equal(JSON.parse(await g.evaluate(()=>window._versoes[0])).alunos.find(a=>a.id==='a2').arquivado,undefined,'a versão salva é a de ANTES');
    assert.match(r.toast,/Aluno inativo · 3 horário\(s\) encerrado\(s\) na agenda/);assert.match(r.toast,/desfazer/);
    assert.doesNotMatch(r.achado,/inativo, mas ainda tem/,'conferência não acusa mais');
    const depois=JSON.parse(await foto());
    assert.deepEqual(depois.pr,a0.pr,'presenças intactas');assert.deepEqual(depois.mv,a0.mv,'extrato intacto: nenhum saldo mexido');
    assert.deepEqual(depois.al.map(a=>[a.creditos,a.repos]),a0.al.map(a=>[a.creditos,a.repos]),'créditos e reposições iguais');
    // desfazer volta tudo como estava
    await g.evaluate(()=>rodarDesfazer());
    assert.equal(ordenado(await foto()),ordenado(antes),'desfazer devolve aluno e agenda exatamente');
    assert.match(await g.evaluate(()=>document.getElementById('toast').textContent),/voltou para os ativos e os horários voltaram/);
   });

   await check(tema+': inativar e responder "deixar como está" não mexe na agenda',async()=>{
    await dados();const antes=JSON.parse(await foto());dlg.vistas=[];dlg.resp=[true,false];
    await g.evaluate(()=>arquivarAluno('a2'));
    const d=JSON.parse(await foto());
    assert.equal(dlg.vistas.length,2);assert.deepEqual(d.ag,antes.ag,'agenda igual');
    assert.equal(d.al.find(a=>a.id==='a2').arquivado,true,'fica inativo do mesmo jeito');
    const r=await g.evaluate(()=>({v:window._versoes.length,t:document.getElementById('toast').textContent,
     achado:achadosDoAluno(DB.alunos.find(a=>a.id==='a2')).map(x=>x.txt).join(' | ')}));
    assert.equal(r.v,0,'sem mudança, sem versão');assert.match(r.t,/agora conta como inativo · os horários continuam na agenda/);
    assert.match(r.achado,/Aluno Dois está inativo, mas ainda tem 2 horário\(s\) fixo\(s\) e 1 aula\(s\) marcada\(s\) na agenda depois de hoje \(seg 10:00, qua 18:00, 22\/10 10:00\)/);
   });

   await check(tema+': reativar não pergunta nada; aluno sem horário futuro só tem a primeira pergunta',async()=>{
    dlg.vistas=[];const antes=JSON.parse(await foto());
    await g.evaluate(()=>arquivarAluno('a2'));
    assert.equal(dlg.vistas.length,0,'reativar sem perguntas');
    const d=JSON.parse(await foto());assert.equal(d.al.find(a=>a.id==='a2').arquivado,false);assert.deepEqual(d.ag,antes.ag);
    dlg.vistas=[];dlg.resp=[true];
    await g.evaluate(()=>arquivarAluno('a4'));
    assert.equal(dlg.vistas.length,1,'sem horário, só confirma a inativação');
    assert.equal(await g.evaluate(()=>DB.alunos.find(a=>a.id==='a4').arquivado),true);
    // caso negativo: cancelar a primeira não faz nada
    await dados();dlg.vistas=[];dlg.resp=[false];const a0=await foto();
    await g.evaluate(()=>arquivarAluno('a2'));
    assert.equal(dlg.vistas.length,1);assert.equal(await foto(),a0,'cancelou: nada mudou');
   });

   await check(tema+': gráfico de reposições lê o extrato certo e não muda nada',async()=>{
    await dados();const antes=await foto();
    await g.evaluate(()=>{go('graf',document.createElement('button'));renderAll();});
    const r=await g.evaluate(()=>{
     const M=reposPorMes(['2026-06','2026-09','2026-10']);
     const linhas=[...document.querySelectorAll('#graf-repos .rpg-row')].map(l=>l.innerText.replace(/\s+/g,' ').trim());
     return {jun:M['2026-06'],set:M['2026-09'],out:M['2026-10'],linhas,
      pend:document.getElementById('g-rep-pend').textContent,venc:document.getElementById('g-rep-venc').textContent,
      us:document.getElementById('g-rep-usadas').textContent,mes:document.getElementById('g-rep-mes').textContent,
      inicio:(document.getElementById('k-repos-s').textContent.match(/^[\d,]+/)||[''])[0],
      hint:document.getElementById('g-rep-hint').textContent};});
    const so=o=>({entraram:o.entraram,sobra:o.sobra,anotada:o.anotada,repostas:o.repostas,venceram:o.venceram,desconto:o.desconto,ajuste:o.ajuste});
    assert.deepEqual(so(r.out),{entraram:4,sobra:3,anotada:1,repostas:1,venceram:1,desconto:1,ajuste:0},'outubro');
    assert.deepEqual(so(r.set),{entraram:2,sobra:2,anotada:0,repostas:1,venceram:0,desconto:0,ajuste:1},'setembro: o ✓ desmarcado no dia 30 não conta');
    assert.deepEqual(so(r.jun),{entraram:3,sobra:3,anotada:0,repostas:0,venceram:0,desconto:0,ajuste:0},'junho');
    assert.equal(r.linhas.length,6,'últimos 6 meses');
    assert.equal(r.linhas[5],'OUT/26 › 4 entraram 1 reposta 1 venceu · 1 trocada por desconto');
    assert.equal(r.linhas[4],'SET/26 › 2 entraram 1 reposta +1 em ajuste à mão');assert.equal(r.linhas[0],'MAI/26 › 0 entraram 0 repostas');
    assert.equal(r.pend,r.inicio,'pendentes = o mesmo número do Início');
    assert.equal(r.us,'1');assert.equal(r.mes,'out');
    assert.match(r.hint,/4h ou mais/);assert.match(r.hint,/menos de 4h não vira reposição: a aula fica na agenda e conta como dada/);
    assert.match(r.hint,/Fora da conta de pendentes: 2 reposição\(ões\) de aluno\(s\) inativo\(s\)/);
    // tocar no mês abre aluno por aluno (nome com < > aparece como texto)
    await g.click('#graf-repos .rpg-row:last-child');
    const s=await g.evaluate(()=>({on:document.getElementById('ov-repos-mes').classList.contains('on'),tit:document.getElementById('rpm-tit').textContent,
     res:document.querySelector('#rpm-corpo .rpm-res').textContent,itens:[...document.querySelectorAll('#rpm-corpo .rpm-lista li')].map(l=>l.innerText.replace(/\s+/g,' ').trim()),
     tags:document.querySelectorAll('#rpm-corpo b b, #rpm-corpo li > b > *').length}));
    assert.ok(s.on);assert.equal(s.tit,'Reposições · Outubro de 2026');
    assert.equal(s.res,'4 entraram · 1 reposta · 1 venceu · 1 trocada por desconto');
    assert.deepEqual(s.itens,['Aluno <Três> +2 da virada','Aluno Dois 1 venceu · 1 trocada por desconto','Aluno Um +1 da virada · +1 anotada à mão · 1 reposta']);
    assert.equal(s.tags,0,'nome do aluno não vira HTML');
    assert.equal(await foto(),antes,'gráfico e janela só leem');
   });

   await check(tema+': reposições legíveis (contraste medido na imagem), cores das barras distintas e 320px sem rolar de lado',async()=>{
    await g.evaluate(()=>closeModal('ov-repos-mes'));
    const tag=await g.addStyleTag({content:'#pg-graf>:not(.rpg-sec){display:none!important}html body:not(#a1):not(#a2) :is(.top,.nav,#nav-mais,.mais-pop){display:none!important}#toast{display:none!important}'});
    let itens=await medir(g,process.env.JV_SHOTS&&path.join(process.env.JV_SHOTS,'gestao-reposicoes-'+tema+'.png'));
    assert.ok(itens.length>=30,'mediu os textos: '+itens.length);
    let falhas=itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>it.t+' · '+it.ratio+'/'+it.minimo+' · '+it.fg+' sobre '+it.fundo);
    assert.deepEqual(falhas,[],'textos difíceis de ler no gráfico');
    // a barra é degradê: vale a média das cores do degradê (ou a cor lisa)
    const cores=await g.evaluate(()=>['rec','meta'].map(k=>{const s=getComputedStyle(document.querySelector('#graf-repos .chart-bar.'+k));
     const l=((s.backgroundImage||'')+' '+s.backgroundColor).match(/rgba?\([^)]*\)/g).map(c=>c.match(/[\d.]+/g).map(Number)).filter(c=>c.length<4||c[3]>0);
     return 'rgb('+[0,1,2].map(i=>Math.round(l.reduce((t,c)=>t+c[i],0)/l.length)).join(',')+')';}));
    assert.ok(deltaE(cores[0],cores[1])>=30,'entraram × repostas distinguíveis: '+cores.join(' × '));
    await g.evaluate(()=>abrirReposMes('2026-10'));
    itens=await medir(g);
    const daJanela=itens.filter(it=>/ov-repos-mes|rpm/.test(it.onde||''));
    assert.ok(daJanela.length>=6,'mediu a janela: '+daJanela.length);
    falhas=daJanela.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>it.t+' · '+it.ratio+'/'+it.minimo+' · '+it.fg+' sobre '+it.fundo);
    assert.deepEqual(falhas,[],'textos difíceis de ler na janela');
    await g.evaluate(()=>closeModal('ov-repos-mes'));
    await g.setViewportSize({width:320,height:844});
    const larg=await g.evaluate(()=>({doc:document.documentElement.scrollWidth,graf:document.getElementById('graf-repos').scrollWidth,cab:document.getElementById('graf-repos').clientWidth}));
    assert.ok(larg.doc<=320,'página cabe em 320px: '+larg.doc);assert.ok(larg.graf<=larg.cab,'gráfico cabe: '+larg.graf+'/'+larg.cab);
    await tag.evaluate(t=>t.remove());await g.setViewportSize({width:390,height:844});
   });

   assert.deepEqual(erros,[]);
   await c.close();
  }
 }finally{await browser.close();server.close();}
 console.log('\n'+count+' verificações de inativar aluno e reposições passaram.');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

/* Início da Gestão (19/10): o João mandou print do iPhone com o quadrinho do
   tempo em "Neblina" mostrando um quadrado cinza — era o emoji de neblina da
   Apple. Agora os ícones do céu são desenhados pelo app (iguais em qualquer
   celular), e tocar no quadrinho abre a previsão hora a hora. Na mesma
   varredura: o comparativo prometia "%" que não vinha (segunda passada sem
   aula), "Total" tinha o mesmo laranja do "Tênis" no tema Saibro e a seta
   "enviando à nuvem" virava um quadrado azul de emoji.
   Só dados fictícios, internet simulada, relógio fixo. */
let chromium,webkit,devices;
try{({chromium,webkit,devices}=require('playwright'));}catch(e){({chromium,webkit,devices}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-19T05:28:00-03:00');   // segunda-feira
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
const EMOJI=/\p{Extended_Pictographic}/u;
// Previsão fictícia: 05h a 16h. Nas 6 primeiras horas a chuva vai até 10%; depois sobe (até 90%).
const HORAS=[5,6,7,8,9,10,11,12,13,14,15,16],CODS=[45,45,45,3,2,1,0,0,2,61,95,80],CHUVA=[10,10,5,0,0,0,20,35,40,70,90,65];
const PREVISAO=JSON.stringify({current:{temperature_2m:9.2,weather_code:45,is_day:0},
 hourly:{time:HORAS.map(h=>'2026-10-19T'+String(h).padStart(2,'0')+':00'),temperature_2m:HORAS.map((h,i)=>9+i),weather_code:CODS,
  is_day:HORAS.map(h=>h>=6&&h<18?1:0),precipitation_probability:CHUVA}});
const rede={online:true,pedidos:0};
async function contexto(b,base,tema,extra){
 const c=await b.newContext(Object.assign({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'},extra||{}));
 await c.route('**/*',r=>{const u=new URL(r.request().url());
  if(u.host==='api.open-meteo.com'){rede.pedidos++;return rede.online?r.fulfill({contentType:'application/json',body:PREVISAO}):r.abort();}
  if(u.origin!==base)return r.abort();
  if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 // tempo já guardado no aparelho (como o app do aluno grava: sem a previsão por hora)
 await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');try{localStorage.setItem('jv-tema',t);
  localStorage.setItem('jvt-clima',JSON.stringify({ts:Date.now(),temp:9.2,code:45,dia:true,chuva:10}));}catch(e){}},tema);
 return c;
}
// distância de cor perceptual (CIE76 em Lab): abaixo de ~30 duas séries se confundem
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
   rede.online=true;
   const c=await contexto(browser,base,tema);
   const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
   await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
   await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
   await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important}'});
   const dados=desde=>g.evaluate(desde=>{
    persist=()=>{};publish=()=>{};guardarVersoes=()=>{};logAct=()=>{};MODO='dono';
    const al=(id,nome,tipo)=>({id,nome,codigo:id,tipo,plano:4,planoGrupo:0,creditos:4,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true});
    DB.alunos=[al('a1','Aluno Um','Particular'),al('a2','Aluno Dois','Particular'),al('p1','Personal Um','Personal'),al('p2','Personal Dois','Personal')];
    const fx=(id,hora,alunoId,tipo)=>({id,dia:1,hora,titulo:DB.alunos.find(a=>a.id===alunoId).nome,tipo,alunoId,desde});
    DB.agenda={fixos:[fx('f1','07:00','p1','personal'),fx('f2','08:00','p2','personal'),fx('f3','09:00','a1','aula'),fx('f4','10:00','a2','aula')],eventos:[],excecoes:[]};
    DB.presencas=[];ensureFields();CARREGADO=true;
    document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
    curYear=2026;curMonth=9;try{localStorage.setItem('jvt-cmp-periodo','semana');}catch(e){}
    go('dash',document.createElement('button'));renderAll();
   },desde);
   await dados('2026-10-13');
   await g.waitForFunction(()=>!document.getElementById('jh-clima').hidden);
   assert.equal(await g.evaluate(()=>document.documentElement.classList.contains('tema-saibro')),tema==='saibro');

   await check(tema+': Neblina com ícone desenhado pelo app, sem emoji (no iPhone o emoji era um quadrado cinza)',async()=>{
    const r=await g.evaluate(()=>{const ic=document.getElementById('jh-clima-ic'),s=ic.querySelector('svg'),k=s&&s.getBoundingClientRect();
     return {svg:!!s,txt:ic.textContent,w:k&&Math.round(k.width),h:k&&Math.round(k.height),
      rot:document.getElementById('jh-clima-txt').textContent,temp:document.getElementById('jh-clima-temp').textContent,
      aria:document.getElementById('jh-clima').getAttribute('aria-label')};});
    assert.ok(r.svg,'ícone em SVG');assert.equal(r.txt,'','sem texto/emoji no lugar do ícone');
    assert.ok(r.w>=20&&r.h>=20,'ícone com tamanho de verdade: '+r.w+'x'+r.h);
    assert.equal(r.rot,'Neblina');assert.equal(r.temp,'9°C');assert.match(r.aria,/neblina.*previsão/i);
   });

   await check(tema+': cada céu tem o seu desenho e nenhum usa emoji',async()=>{
    const r=await g.evaluate(()=>{const cods=[[0,true],[0,false],[1,true],[2,false],[3,true],[45,true],[48,false],[53,true],[63,true],[81,true],[73,true],[95,true],[999,true]];
     return cods.map(([c,d])=>{const [k,t]=climaDoCodigo(c,d),s=iconeClima(k);return {c,d,k,t,svg:s.startsWith('<svg'),limpo:s.replace(/<[^>]*>/g,'')};});});
    r.forEach(x=>{assert.ok(x.svg,x.c+' em SVG');assert.equal(x.limpo,'',x.c+' sem texto');assert.ok(!EMOJI.test(x.t),x.c+' rótulo sem emoji');});
    const k=Object.fromEntries(r.map(x=>[x.c+(x.d?'d':'n'),x.k]));
    assert.equal(k['0d'],'sol');assert.equal(k['0n'],'lua');assert.equal(k['45d'],'neblina');assert.equal(k['48n'],'neblina');
    assert.equal(k['63d'],'chuva');assert.equal(k['95d'],'temporal');
    const desenhos=await g.evaluate(()=>['sol','lua','solnuvem','luanuvem','nuvem','neblina','garoa','chuva','solchuva','neve','temporal'].map(iconeClima));
    assert.equal(new Set(desenhos).size,11,'onze desenhos diferentes');
   });

   await check(tema+': tocar no quadrinho abre a previsão hora a hora com chance de chuva',async()=>{
    rede.online=true;const antes=rede.pedidos;
    await g.click('#jh-clima');
    await g.waitForFunction(()=>document.querySelectorAll('#clm-corpo .clm-h').length===12);
    const r=await g.evaluate(()=>({on:document.getElementById('ov-clima').classList.contains('on'),
     horas:[...document.querySelectorAll('#clm-corpo .clm-h')].map(h=>h.innerText.replace(/\s+/g,' ').trim()),
     svgs:document.querySelectorAll('#clm-corpo .clm-h svg').length,chuva:document.querySelector('#clm-corpo .clm-chuva').textContent,
     nota:[...document.querySelectorAll('#clm-corpo .clm-nota')].map(p=>p.textContent).join(' '),
     altas:[...document.querySelectorAll('#clm-corpo .clm-h em.alta')].map(e=>e.textContent),
     emoji:/\p{Extended_Pictographic}/u.test(document.getElementById('clm-corpo').textContent),
     chip:document.getElementById('jh-clima-txt').textContent}));
    assert.ok(r.on);assert.ok(rede.pedidos>antes,'tocar busca de novo');
    assert.equal(r.horas[0],'05h 9° 10%');assert.equal(r.horas[11],'16h 20° 65%');assert.equal(r.svgs,12);
    // o aviso do quadrinho olha só as 6 primeiras horas: 70–90% depois disso não vira "chuva prevista" agora
    assert.match(r.chuva,/próximas 6 h: até 10%/);assert.equal(r.chip,'Neblina');
    assert.deepEqual(r.altas,['70%','90%','65%']);
    assert.match(r.nota,/Atualizado às 05:28/);assert.equal(r.emoji,false);
   });

   await check(tema+': sem internet, a previsão fica com o último dado e diz de quando é',async()=>{
    rede.online=false;
    await g.click('#ov-clima .clm-atualizar');
    await g.waitForFunction(()=>/Sem internet/.test(document.getElementById('clm-corpo').textContent));
    const r=await g.evaluate(()=>({horas:document.querySelectorAll('#clm-corpo .clm-h').length,txt:document.getElementById('clm-corpo').textContent,
     chip:!document.getElementById('jh-clima').hidden}));
    assert.equal(r.horas,12,'continua mostrando a última previsão');assert.match(r.txt,/Sem internet: dado de 05:28/);assert.ok(r.chip);
    rede.online=true;
   });

   await check(tema+': nada guardado e sem internet: avisa em vez de abrir em branco',async()=>{
    rede.online=false;
    await g.evaluate(()=>{CLIMA_ULT=null;localStorage.removeItem('jvt-clima');abrirClimaGestao();});
    await g.waitForFunction(()=>/Sem internet agora/.test(document.getElementById('clm-corpo').textContent));
    rede.online=true;
    await g.evaluate(()=>{closeModal('ov-clima');return carregarClimaGestao(true);});
   });

   await check(tema+': 320px: quadrinho e previsão cabem sem arrastar para o lado',async()=>{
    await g.setViewportSize({width:320,height:700});
    await g.evaluate(()=>abrirClimaGestao());
    await g.waitForFunction(()=>document.querySelectorAll('#clm-corpo .clm-h').length===12);
    const r=await g.evaluate(()=>{const m=document.querySelector('#ov-clima .modal').getBoundingClientRect(),hs=[...document.querySelectorAll('#clm-corpo .clm-h')];
     return {sw:document.documentElement.scrollWidth,dentro:hs.every(h=>{const k=h.getBoundingClientRect();return k.left>=m.left-0.5&&k.right<=m.right+0.5;}),
      corta:hs.some(h=>[...h.children].some(x=>x.scrollWidth>x.clientWidth+1)),chip:document.getElementById('jh-clima').getBoundingClientRect().right};});
    assert.ok(r.sw<=320,'sem rolagem de lado: '+r.sw);assert.ok(r.dentro,'as 12 horas dentro da janela');assert.equal(r.corta,false,'nada cortado');
    assert.ok(r.chip<=320);
    await g.evaluate(()=>closeModal('ov-clima'));await g.setViewportSize({width:390,height:844});
   });

   await check(tema+': comparativo na segunda sem aula na segunda passada não promete % que não vem',async()=>{
    await dados('2026-10-13');
    let r=await g.evaluate(()=>({sub:document.getElementById('jh-cmp-sub').textContent,d:['total','personal','tenis'].map(k=>document.getElementById('jh-cmp-'+k+'-d').textContent)}));
    assert.equal(r.sub,'Hoje (19/10) · a segunda passada (12/10) não teve aula registrada, então não há % para comparar');
    assert.deepEqual(r.d,['','','']);
    // mês: setembro também sem aula (o fixo começa em 13/10)
    await g.evaluate(()=>trocarPeriodoCmp('mes'));
    r=await g.evaluate(()=>document.getElementById('jh-cmp-sub').textContent);
    assert.equal(r,'Até hoje (19/10) · o mesmo período de setembro não teve aula registrada, então não há % para comparar');
    // caso com base: aí o % aparece e o texto diz contra o quê
    await g.evaluate(()=>trocarPeriodoCmp('semana'));await dados('2026-09-01');
    r=await g.evaluate(()=>({sub:document.getElementById('jh-cmp-sub').textContent,d:['total','personal','tenis'].map(k=>document.getElementById('jh-cmp-'+k+'-d').textContent)}));
    assert.equal(r.sub,'Hoje (19/10) · % contra a segunda passada (12/10)');assert.deepEqual(r.d,['= 0%','= 0%','= 0%']);
   });

   await check(tema+': "Total" com cor própria, longe do laranja do "Tênis" (barra, legenda, anel e linha)',async()=>{
    await g.clock.setFixedTime(new Date('2026-10-19T17:30:00-03:00'));await dados('2026-09-01');
    const r=await g.evaluate(()=>{const cs=(s,p)=>getComputedStyle(document.querySelector(s))[p];
     return {barra:[cs('.jh-cmp-i.total>i','backgroundColor'),cs('.jh-cmp-i.tenis>i','backgroundColor'),cs('.jh-cmp-i.personal>i','backgroundColor')],
      legenda:[cs('.jh-legend li:nth-child(1) i','backgroundColor'),cs('.jh-legend .tenis i','backgroundColor')],
      anel:[cs('#jh-ring-total','stroke'),cs('#jh-ring-tenis','stroke')],
      linha:[cs('#jh-graf .ln.total','stroke'),cs('#jh-graf .ln.tenis','stroke')],
      area:getComputedStyle(document.querySelector('#jhg-t stop')).stopColor};});
    for(const [nome,[t,e]] of Object.entries({barra:r.barra,legenda:r.legenda,anel:r.anel,linha:r.linha})){
     const d=deltaE(t,e);assert.ok(d>=30,nome+': Total '+t+' parecido demais com Tênis '+e+' (ΔE '+d.toFixed(1)+')');
    }
    assert.ok(deltaE(r.barra[0],r.barra[2])>=30,'Total longe do Personal também');
    assert.equal(r.area,r.linha[0],'o degradê do gráfico acompanha a linha do Total');
    await g.clock.setFixedTime(AGORA);
   });

   /* O João só via o gráfico subir num mês com menos aulas (19/10): ele é a
      soma do mês, então só sobe. Agora o mês passado vem tracejado e a
      comparação em números, a mesma conta do Comparativo. */
   await check(tema+': gráfico do mês com o mês passado tracejado e a comparação igual à do Comparativo',async()=>{
    await g.clock.setFixedTime(new Date('2026-10-19T17:30:00-03:00'));await dados('2026-09-01');
    const r=await g.evaluate(()=>{trocarPeriodoCmp('mes');
     const out={cmp:document.getElementById('jh-graf-cmp').textContent,ant:!!document.querySelector('#jh-graf path.ln.ant'),
      leg:!document.getElementById('jh-leg-ant').hidden,sub:document.getElementById('jh-cmp-sub').textContent,
      tot:document.getElementById('jh-cmp-total').textContent,d:document.getElementById('jh-cmp-total-d').textContent,
      nota:document.getElementById('jh-graf-nota').textContent};
     trocarPeriodoCmp('semana');return out;});
    // segundas de outubro até o dia 19: 5, 12 e 19 (3 × 4 aulas) · setembro até o dia 19: 7 e 14 (2 × 4)
    assert.equal(r.cmp,'Até hoje (dia 19): 12 aulas · setembro até o dia 19: 8 ↑ 50%');
    assert.ok(r.ant&&r.leg,'linha e legenda do mês passado');
    assert.equal(r.tot,'12');assert.equal(r.d,'↑ 50%');assert.match(r.sub,/mesmo período de setembro/);
    assert.match(r.nota,/só sobe/);assert.match(r.nota,/tracejada azul é o mês passado/);
   });
   await check(tema+': aula desmarcada sai do gráfico na hora; mês sem base não desenha o tracejado',async()=>{
    const r=await g.evaluate(()=>{
     const antes=serieAulasMes(2026,9)[18].total;
     DB.agenda.excecoes.push({fixoId:'f3',data:'2026-10-12'});renderAll();
     const depois=serieAulasMes(2026,9)[18].total,cmp=document.getElementById('jh-graf-cmp').textContent;
     return {antes,depois,cmp};});
    assert.equal(r.depois,r.antes-1);assert.match(r.cmp,/^Até hoje \(dia 19\): 11 aulas/);
    await dados('2026-10-13');
    const v=await g.evaluate(()=>({ant:!!document.querySelector('#jh-graf path.ln.ant'),leg:!document.getElementById('jh-leg-ant').hidden,cmp:document.getElementById('jh-graf-cmp').textContent}));
    assert.equal(v.ant,false);assert.equal(v.leg,false);assert.equal(v.cmp,'Até hoje (dia 19): 4 aulas · setembro sem aula registrada para comparar');
    await g.clock.setFixedTime(AGORA);await dados('2026-10-13');
   });
   await check(tema+': aluno inativo com horário na agenda aparece na conferência, sem mudar nada',async()=>{
    const r=await g.evaluate(()=>{
     DB.alunos.find(a=>a.id==='a2').arquivado=true;const antes=JSON.stringify(DB);
     const txt=achadosDoAluno(DB.alunos.find(a=>a.id==='a2')).map(x=>x.txt).join(' | '),
      ativo=achadosDoAluno(DB.alunos.find(a=>a.id==='a1')).map(x=>x.txt).join(' | ');
     const igual=JSON.stringify(DB)===antes;DB.alunos.find(a=>a.id==='a2').arquivado=false;return {txt,ativo,igual};});
    assert.match(r.txt,/Aluno Dois está inativo, mas ainda tem 1 horário\(s\) fixo\(s\) na agenda daqui para a frente \(seg 10:00\)/);
    assert.doesNotMatch(r.ativo,/inativo/,'aluno ativo não entra (caso negativo)');
    assert.ok(r.igual,'conferência só lista');
   });

   await check(tema+': "enviando à nuvem" com a seta de texto (sem o quadrado azul de emoji no iPhone)',async()=>{
    const r=await g.evaluate(()=>{setSave('enviando à nuvem…');espelharTopoInicio();
     return {s:document.getElementById('save-state').textContent,j:document.getElementById('jh-sync').textContent};});
    assert.equal(r.s,'↗︎ Nuvem');assert.match(r.j,/↗︎ Nuvem/);
   });

   await check(tema+': previsão aberta legível (contraste medido na imagem)',async()=>{
    rede.online=true;
    await g.evaluate(()=>abrirClimaGestao());
    await g.waitForFunction(()=>/Atualizado às/.test(document.getElementById('clm-corpo').textContent));
    await g.addStyleTag({content:'html body:not(#a1):not(#a2):not(#a3) :is(.top,.nav,#nav-mais,.mais-pop){display:none!important}#toast{display:none!important}'});
    const itens=await medir(g,process.env.JV_SHOTS&&path.join(process.env.JV_SHOTS,'gestao-tempo-'+tema+'.png'));
    const daJanela=itens.filter(it=>/ov-clima|clm-|jh-menu/.test(it.onde||''));
    assert.ok(daJanela.length>=30,'mediu os textos da previsão: '+daJanela.length);
    const falhas=daJanela.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>it.t+' · '+it.ratio+'/'+it.minimo+' · '+it.fg+' sobre '+it.fundo);
    assert.deepEqual(falhas,[],'textos difíceis de ler');
    await g.evaluate(()=>{closeModal('ov-clima');document.querySelectorAll('style').forEach(st=>{if(/\.top,\.nav,#nav-mais/.test(st.textContent))st.remove();});});
    await g.setViewportSize({width:390,height:844});
   });

   assert.deepEqual(erros,[]);
   await c.close();

   // app do aluno: o mesmo quadrinho, o mesmo ícone
   const ca=await contexto(browser,base,tema);
   const a=await ca.newPage(),errosA=[];a.on('pageerror',e=>errosA.push(e.message));a.on('dialog',d=>d.dismiss());
   await a.clock.setFixedTime(AGORA);await a.goto(base+'/app-aluno/',{waitUntil:'load'});
   await check(tema+': app do aluno com a Neblina desenhada, sem emoji',async()=>{
    await a.waitForFunction(()=>{const e=document.getElementById('aluno-clima');return e&&!e.hidden;},{},{timeout:15000});
    // sem aluno logado o app fica atrás da tela de entrada: abre como os outros testes do aluno
    const r=await a.evaluate(()=>{const lg=document.getElementById('login');if(lg)lg.style.display='none';document.getElementById('app').style.display='block';
     const ic=document.getElementById('aluno-clima-ic'),s=ic.querySelector('svg'),k=s&&s.getBoundingClientRect();
     return {svg:!!s,w:k&&Math.round(k.width),h:k&&Math.round(k.height),txt:ic.textContent,rot:document.getElementById('aluno-clima-txt').textContent,
      igual:(()=>{const t=document.createElement('i');t.innerHTML=iconeClima('neblina');return t.innerHTML===ic.innerHTML;})()};});
    assert.ok(r.svg);assert.equal(r.txt,'');assert.equal(r.rot,'Neblina');assert.ok(r.igual);
    assert.ok(r.w>=20&&r.h>=20,'ícone com tamanho de verdade: '+r.w+'x'+r.h);
   });
   assert.deepEqual(errosA,[]);
   await ca.close();
  }

  // os desenhos são os mesmos nos dois apps (um não pode ficar para trás)
  await check('Gestão e app do aluno com os mesmos onze desenhos',async()=>{
   const fonte=(arq)=>{const s=fs.readFileSync(path.join(root,arq),'utf8'),i=s.indexOf('function iconeClima(k){'),f=s.indexOf("return '<svg viewBox",i);
    assert.ok(i>0&&f>i,arq+': iconeClima');return s.slice(i,f);};
   assert.equal(fonte('app-gestao/lib/app-gestao.js'),fonte('app-aluno/index.html'));
  });
 }finally{await browser.close();}

 /* ===== iPhone (WebKit, o motor do Safari) =====
    O defeito era só no iPhone (o emoji de neblina da Apple). No validar-pr o
    WebKit está instalado; aqui no contêiner pode não estar. */
 let wk=null;
 try{wk=await webkit.launch({headless:true});}catch(e){
  if(process.env.CI)throw e;
  console.log('⏭️  WebKit não instalado neste computador: a parte do iPhone roda no validar-pr');
 }
 if(wk){
  try{
   rede.online=true;
   for(const [app,id] of [['app-gestao','jh-clima-ic'],['app-aluno','aluno-clima-ic']]){
    const c=await contexto(wk,base,'saibro',Object.assign({},devices['iPhone 13'],{serviceWorkers:'block',timezoneId:'America/Sao_Paulo'}));
    const p=await c.newPage();await p.clock.setFixedTime(AGORA);await p.goto(base+'/'+app+'/',{waitUntil:'load'});
    await check('iPhone · '+app+': Neblina aparece como desenho do app, com tamanho de ícone',async()=>{
     await p.waitForFunction(id=>{const e=document.getElementById(id);return e&&e.querySelector('svg')&&e.closest('[hidden]')===null;},id,{timeout:15000});
     const r=await p.evaluate(id=>{
      if(id==='aluno-clima-ic'){const lg=document.getElementById('login');if(lg)lg.style.display='none';document.getElementById('app').style.display='block';}
      const e=document.getElementById(id),k=e.querySelector('svg').getBoundingClientRect();return {w:k.width,h:k.height,txt:e.textContent};},id);
     assert.ok(r.w>=20&&r.h>=20,'tamanho '+r.w+'x'+r.h);assert.equal(r.txt,'');
    });
    await c.close();
   }
  }finally{await wk.close();}
 }
 server.close();
 console.log('\n'+count+' verificações do tempo e do Início passaram.');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

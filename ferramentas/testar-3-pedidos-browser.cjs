/* Pedidos do João de 03/10, aprovados por simulação em 07/10:
   (1) Renovar o mês: o nome do aluno abre a ficha e fechar volta para a lista;
   (2) Início: "Taxa de ocupação" e "Locações" abrem a agenda do mês;
   (3) App do aluno: resumo do mês na tela Aulas (feitas e marcadas com datas)
       e atalho em Créditos.
   Tudo é só navegação e exibição: o teste prova que nenhum dado muda e nada é
   gravado nos dois apps. Dados fictícios, rede externa bloqueada, relógio fixo
   em 15/10/2026 (segundas 05 e 12 já feitas; 19 e 26 ainda marcadas).
   Uso: node ferramentas/testar-3-pedidos-browser.cjs [pasta-prints] */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),OUT=process.argv[2]||'';
const server=http.createServer((req,res)=>{
 let f=path.join(root,decodeURI(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
 catch{res.writeHead(404).end();}
});
const AGORA=new Date(2026,9,15,10,0,0);
let count=0;
async function check(name,fn){await fn();count++;console.log('✅ '+name);}
const print=async(pg,nome)=>{if(OUT)await pg.screenshot({path:path.join(OUT,nome)});};

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,b=await chromium.launch({headless:true});
 try{
  const bloquear=async ctx=>{
   await ctx.clock.setFixedTime(AGORA);
   await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
    if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  };
  /* ---------------- Gestão ---------------- */
  const ctx=await b.newContext({viewport:{width:390,height:844}});await bloquear(ctx);
  await ctx.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const g=await ctx.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
  await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,{},{timeout:15000});
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#toast,#barra-versao,#barra-endereco{display:none!important}'});
  const pub=await g.evaluate(async()=>{
   window.gravacoes=0;persist=()=>{window.gravacoes++;};guardarVersoes=()=>{};logAct=()=>{};hideVals=false;
   const hoje=new Date(),Y=hoje.getFullYear(),M=hoje.getMonth();
   DB.alunos=['Ana Teste','Bruno Teste','Carla Teste','Davi Teste'].map((n,i)=>({id:'t'+i,nome:n,tipo:'Particular',plano:4,planoGrupo:0,credGrupo:0,
    mensalidade:640,creditos:[3,1,0,2][i],repos:[1,0,2,0][i],locCred:0,status:i%2?'pago':'pendente',codigo:'100'+i,tel:'1199990000'+i,diaVenc:10,ativo:true}));
   // fixos: Ana seg, Bruno ter, Carla qua, Davi qui, às 16h
   DB.agenda={fixos:DB.alunos.map((a,i)=>({id:'f'+i,dia:1+i,hora:'16:00',titulo:a.nome,tipo:'aula',alunoId:a.id})),eventos:[],excecoes:[]};
   DB.presencas=[];
   for(let d=1;d<hoje.getDate();d++){const dt=new Date(Y,M,d,12);if(dt.getDay()===1)DB.presencas.push({k:'p'+d,alunoId:'t0',data:dKey(dt),hora:'16:00'});}
   ensureFields();DB.mesPagamentos=DB.mesCreditos;CARREGADO=true;
   const s=document.getElementById('splash-gestao');if(s)s.style.display='none';
   renderAll();go('dash',document.createElement('button'));
   // o que a Gestão publica para o app do aluno (mesmo caminho do app de verdade)
   let cap=null;_abriuSemConferir=false;_semDados=false;window._espacoAberto=true;cloudPending=false;try{_conflitoNuvem=null;}catch(e){}
   ehDono=()=>true;hasCloud=()=>true;pareceSemente=()=>false;cloudSet=async()=>{};publicarSeguro=async p=>{cap=p;};
   window.fbDB={ref:()=>({set:async()=>{},update:async()=>{},get:async()=>({exists:()=>false,val:()=>null})})};
   try{await doPublish();}catch(e){}
   return cap;
  });
  assert.ok(pub&&pub.historico,'a Gestão tem de publicar o histórico para o aluno');
  await g.evaluate(()=>{window.ANTES=JSON.stringify(DB);window.gravacoes=0;});

  await check('Renovar o mês: tocar no nome abre a ficha daquele aluno',async()=>{
   await g.evaluate(()=>abrirRenovaMes());
   const r=await g.evaluate(()=>{
    window.SEL=JSON.stringify(rmSel);
    const l=document.querySelectorAll('#renova-mes .rm-link');const alvo=l[1]||l[0];
    const id=(alvo.getAttribute('onclick').match(/'(.+?)'/)||[])[1];alvo.click();
    return {links:l.length,id,ficha:fichaId,on:document.getElementById('ficha-aluno').classList.contains('on')};
   });
   await print(g,'1-renovar-ficha.png');
   assert.equal(r.links,4,'cada aluno da lista tem o nome clicável');
   assert.equal(r.on,true);assert.equal(r.ficha,r.id);
  });
  await check('fechar a ficha volta para Renovar o mês com as mesmas marcações',async()=>{
   await g.evaluate(()=>fecharFicha());await g.waitForTimeout(300);
   const r=await g.evaluate(()=>({renova:document.getElementById('renova-mes').classList.contains('on'),rmAberta,
    ficha:document.getElementById('ficha-aluno').classList.contains('on'),sel:JSON.stringify(rmSel)===window.SEL}));
   assert.deepEqual(r,{renova:true,rmAberta:true,ficha:false,sel:true});
  });
  await check('fechar Renovar o mês continua fechando de verdade (caso negativo)',async()=>{
   await g.evaluate(()=>fecharRenovaMes());await g.waitForTimeout(300);
   assert.equal(await g.evaluate(()=>rmAberta||document.getElementById('renova-mes').classList.contains('on')),false);
  });
  for(const rot of ['Taxa de ocupação','Locações'])await check('Início: "'+rot+'" abre a agenda no modo mês',async()=>{
   await g.evaluate(()=>{agView='dia';go('dash',document.createElement('button'));});
   await g.evaluate(r=>[...document.querySelectorAll('.jh-tile')].find(x=>x.textContent.includes(r)).click(),rot);
   assert.deepEqual(await g.evaluate(()=>({agenda:document.getElementById('pg-agenda').classList.contains('on'),view:agView,
    mes:curMonth,ano:curYear})),{agenda:true,view:'mes',mes:AGORA.getMonth(),ano:AGORA.getFullYear()});
  });
  await print(g,'2-agenda-mes.png');
  await check('Início: "Créditos em aberto" não foi para a agenda (caso negativo)',async()=>{
   await g.evaluate(()=>{go('dash',document.createElement('button'));[...document.querySelectorAll('.jh-tile')].find(x=>x.textContent.includes('Créditos em aberto')).click();});
   assert.equal(await g.evaluate(()=>document.getElementById('pg-agenda').classList.contains('on')),false);
  });
  await check('Gestão: nenhum dado mudou e nada foi gravado',async()=>{
   assert.deepEqual(await g.evaluate(()=>({igual:JSON.stringify(DB)===window.ANTES,gravacoes:window.gravacoes})),{igual:true,gravacoes:0});
  });
  assert.deepEqual(erros,[]);

  /* ---------------- App do aluno ---------------- */
  const ctx2=await b.newContext({viewport:{width:390,height:844}});await bloquear(ctx2);
  const p=await ctx2.newPage(),er2=[];p.on('pageerror',e=>er2.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForTimeout(1500);
  await p.addStyleTag({content:'#toast,#feriado-box{display:none!important}'});
  const entrar=(cod)=>p.evaluate(([pub,cod])=>{
   window.escritas=0;const w=()=>{window.escritas++;return Promise.resolve();};
   window.fbDB={ref:()=>({set:w,update:w,push:w,remove:w,transaction:w,get:async()=>({exists:()=>false,val:()=>null}),once:async()=>({exists:()=>false,val:()=>null}),on:()=>{},off:()=>{}})};
   saveMeu=async()=>{window.escritas++;};
   PUB=JSON.parse(JSON.stringify(pub));MEU.codigo=cod;EU=PUB.alunos.find(a=>a.codigo===cod);
   document.querySelectorAll('.splash,#splash,#splash-aluno').forEach(s=>s.style.display='none');show();
   window.ANTES_AL=JSON.stringify({PUB,EU,MEU});window.escritas=0;
  },[pub,cod]);
  await entrar('1000');
  await check('Aulas: resumo de outubro com as aulas feitas e as marcadas, com datas',async()=>{
   await p.evaluate(()=>goAluno('aulas',null));
   const r=await p.evaluate(()=>{const x=resumoMesAluno();return {mes:x.mes,feitas:x.feitas.map(a=>a.data),prox:x.prox.map(a=>a.data),
    txt:document.getElementById('aulas-mes-resumo').innerText};});
   await print(p,'3-aluno-aulas.png');
   assert.equal(r.mes,'outubro');
   assert.deepEqual(r.feitas,['2026-10-05','2026-10-12']);
   assert.deepEqual(r.prox,['2026-10-19','2026-10-26']);
   assert.match(r.txt,/Resumo de outubro/i);assert.match(r.txt,/05\/10/);assert.match(r.txt,/26\/10/);
   assert.doesNotMatch(r.txt,/desconto/i,'mensagem ao aluno nunca cita desconto');
  });
  await check('Créditos: atalho "Minhas aulas de outubro" leva para a tela Aulas',async()=>{
   await p.evaluate(()=>goAluno('creditos',document.getElementById('nav-al-creditos')));
   assert.match(await p.evaluate(()=>document.getElementById('cred-page-mes').innerText),/Minhas aulas de outubro[\s\S]*Feitas\s*2[\s\S]*Ainda marcadas\s*2/i);
   await p.evaluate(()=>document.getElementById('cred-page-mes').click());
   assert.equal(await p.evaluate(()=>document.getElementById('apg-aulas').classList.contains('on')),true);
  });
  await check('Aluno: nenhum dado mudou e nada foi enviado',async()=>{
   assert.deepEqual(await p.evaluate(()=>({igual:JSON.stringify({PUB,EU,MEU})===window.ANTES_AL,escritas:window.escritas})),{igual:true,escritas:0});
  });
  await check('outro aluno não vê as aulas da Ana; só as terças dele (caso negativo)',async()=>{
   await entrar('1001');
   const r=await p.evaluate(()=>{const x=resumoMesAluno();return {feitas:x.feitas.length,prox:x.prox.map(a=>a.data)};});
   assert.equal(r.feitas,0);assert.deepEqual(r.prox,['2026-10-20','2026-10-27']);
  });
  assert.deepEqual(er2,[]);
  console.log('\n✅ '+count+' verificações · 3 pedidos (só navegação e exibição)');
 }catch(e){console.error('❌ '+(e&&e.message||e));process.exitCode=1;}
 finally{await b.close();server.close();}
})();

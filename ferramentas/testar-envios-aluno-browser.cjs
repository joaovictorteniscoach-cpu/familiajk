/* Envios e simplificação: sucesso só após resposta, sem push repetido.
   Dados fictícios; rede externa bloqueada. Chromium/WebKit nos dois temas. */
const motores=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-11-09T07:00:00-03:00'),DK='2026-11-11';
const server=http.createServer((req,res)=>{
 const u=decodeURI(req.url.split('?')[0]),f=path.join(root,u,u.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
 for(const motor of ['chromium','webkit']){
  const browser=await motores[motor].launch({headless:true});
  try{
  for(const tema of ['saibro','classico']){
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');localStorage.setItem('jv-tema',t);},tema);
   await c.clock.setFixedTime(AGORA);
   const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
   await p.goto(base+'/app-aluno/',{waitUntil:'load'});
   await p.waitForFunction(()=>typeof enviarPedido==='function');
   await p.addStyleTag({content:'#login,#feriado-box,#barra-app,#barra-versao,.va-bt{display:none!important}'});
   const reset=async()=>p.evaluate(()=>{
    esperarAuth=async()=>{};authUid=()=>'u-teste';atualizarGradeReserva=async()=>{};pedirPermissaoNotif=()=>{};
    window.__writes=[];window.__reservas=[];window.__toasts=[];window.__whats=0;window.__save=0;
    window.fbDB={ref:cam=>({update:async item=>__reservas.push({cam,item}),push:async item=>__writes.push({cam,item})})};
    filaPush=async(cam,item)=>{__writes.push({cam,item});};
    saveMeu=async()=>{__save++;};abrirWhatsApp=()=>{__whats++;};
    if(!window.__toastOriginal)window.__toastOriginal=toast;
    toast=t=>{__toasts.push(t);__toastOriginal(t);};
    EU={id:'al-fake',codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:2,locCred:0,mensalidade:735,status:'parcial',ativo:true,
     pagamentoMensal:{mes:'2026-11',exato:true,recebido:300,falta:435,total:735}};
    PUB={alunos:[EU],horas:['08:00','11:00','16:00'],profs:[],horarioCfg:{},horarioData:{},precos:{locacao:70},historico:{},grade:{fixos:[],eventos:[],excecoes:[]},termoVer:0,pix:'teste@example.invalid',pixNome:'Teste',pixCidade:'CURITIBA'};
    MEU={codigo:EU.codigo,pedidos:[],cancelados:[],confirmadas:[],espera:[]};VINCULO_ESTADO='ativo';_renovaAdiado=true;
    document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
    document.getElementById('app').style.display='block';render();goAluno('inicio',null);agDate=new Date('2026-11-11T12:00:00');
    window.__originalNumeros=JSON.stringify(EU);
   });
   const defer=async()=>p.evaluate(()=>{
    filaPush=(cam,item)=>{__writes.push({cam,item});return new Promise((resolve,reject)=>{window.__resolve=resolve;window.__reject=reject;});};
   });
   const label=motor+'/'+tema+' · ';
   const screenshot=async nome=>{const dir=process.env.JV_VISUAL_DIR;if(dir){fs.mkdirSync(dir,{recursive:true});await p.screenshot({path:path.join(dir,'envios-'+nome+'-'+motor+'-'+tema+'.png')});}};
   await reset();
   await check(label+'Torneio abre direto na barra; sete abas legíveis em 320/360/375/390 px; Personal preservado',async()=>{
    await reset();
    const antes=await p.evaluate(()=>JSON.stringify(EU));
    for(const width of [320,360,375,390]){
     await p.setViewportSize({width,height:844});await p.evaluate(()=>document.fonts.ready);
     const measures=await p.evaluate(()=>{
      const nav=document.querySelector('.nav'),buttons=[...nav.querySelectorAll('button')].filter(b=>getComputedStyle(b).display!=='none');
      const failures=[];
      for(const b of buttons){
       const r=b.getBoundingClientRect();if(r.width<43.9||r.height<43.9)failures.push(b.id+': alvo pequeno');
       for(const n of b.childNodes){
        if(n.nodeType!==3||!n.textContent.trim())continue;
        const range=document.createRange();range.selectNode(n);const t=range.getBoundingClientRect();
        if(t.left<r.left-.75||t.right>r.right+.75)failures.push(b.id+': rótulo fora do botão '+(t.right-r.right).toFixed(2));
       }
       if(parseFloat(getComputedStyle(b).fontSize)<12)failures.push(b.id+': letra pequena');
      }
      const voice=document.getElementById('va-atalho');
      if(voice&&getComputedStyle(voice).display!=='none'&&voice.getBoundingClientRect().bottom>nav.getBoundingClientRect().top)failures.push('microfone sobre a barra');
      return {count:buttons.length,failures,viewport:document.documentElement.scrollWidth<=innerWidth+1};
     });
     assert.equal(measures.count,7);assert.deepEqual(measures.failures,[]);assert.equal(measures.viewport,true);
     await p.locator('#nav-al-torneio').click();
     assert.equal(await p.locator('#apg-torneio').isVisible(),true);
     assert.equal(await p.locator('#nav-al-torneio').evaluate(b=>b.classList.contains('on')),true);
     assert.equal(await p.locator('#nav-al-perfil').evaluate(b=>b.classList.contains('on')),false);
     await screenshot('torneio-'+width);
     await p.evaluate(()=>goAluno('creditos',document.getElementById('nav-al-creditos')));
     await screenshot('barra-'+width);
    }
    assert.equal(await p.evaluate(()=>JSON.stringify(EU)),antes,'navegar não muda saldo ou cadastro');
    await p.evaluate(()=>{goAluno('torneio',null);EU.tipo='Personal';applyTipoUI();});
    assert.equal(await p.locator('#nav-al-torneio').isVisible(),false);
    assert.equal(await p.locator('#apg-inicio').isVisible(),true);
    assert.equal(await p.locator('.nav button:visible').count(),6);
    await reset();
   });
   await check(label+'reposições têm um atalho junto ao saldo em cada tela',async()=>{
    await p.locator('#home-repos-card').waitFor({state:'visible'});
    assert.equal(await p.locator('#apg-inicio [onclick="irMarcarReposicao()"]').count(),1);
    await screenshot('inicio');
    await p.evaluate(()=>goAluno('creditos',null));
    assert.equal(await p.locator('#apg-creditos [onclick="irMarcarReposicao()"]').count(),1);
    assert.equal(await p.locator('#cred-page-repos-agendar').isVisible(),true);
    await screenshot('creditos');
    await p.evaluate(()=>{EU.repos=0;renderPremiumAluno();});
    assert.equal(await p.locator('#cred-page-repos-agendar').isVisible(),false);
    assert.equal(await p.locator('#home-repos-card').isVisible(),false,'Home está em outra aba');
    await p.evaluate(()=>goAluno('inicio',null));assert.equal(await p.locator('#home-repos-card').isVisible(),true,'saldo continua aparente mesmo zerado');
   });
   await check(label+'Pix espera a nuvem e bloqueia dois toques; preserva R$435 e não marca pago',async()=>{
    await reset();await defer();
    await p.evaluate(()=>{
     pixCtx={valor:435,pedido:{kind:'mensalidade',metodo:'Pix',valor:435}};document.getElementById('ov-pix').classList.add('on');
     window.__job=jaPagueiPix();jaPagueiPix();
    });
    assert.equal(await p.locator('[onclick="jaPagueiPix()"]').isDisabled(),true);
    assert.equal(await p.locator('#ov-pix').isVisible(),true);
    assert.deepEqual(await p.evaluate(()=>({writes:__writes.length,avisado:!!MEU.pagoAviso,toasts:__toasts.length})),{writes:1,avisado:false,toasts:0});
    await p.evaluate(async()=>{__resolve();await __job;});
    assert.equal(await p.locator('#ov-pix').isVisible(),false);
    assert.deepEqual(await p.evaluate(()=>({valor:__writes[0].item.valor,lembrete:MEU.pagoAviso.valor,status:EU.status,whats:__whats,numeros:JSON.stringify(EU)===__originalNumeros})),{valor:435,lembrete:435,status:'parcial',whats:0,numeros:true});
   });
   await check(label+'Pix recusado mantém janela, sem sucesso nem três gravações; nova tentativa funciona',async()=>{
    await reset();await defer();
    await p.evaluate(()=>{pixCtx={valor:435,pedido:{kind:'mensalidade',metodo:'Pix',valor:435}};document.getElementById('ov-pix').classList.add('on');window.__job=jaPagueiPix();});
    await p.evaluate(async()=>{__reject(Error('permission_denied'));await __job;});
    assert.equal(await p.locator('#ov-pix').isVisible(),true);assert.equal(await p.locator('[onclick="jaPagueiPix()"]').isDisabled(),false);
    assert.deepEqual(await p.evaluate(()=>({writes:__writes.length,avisado:!!MEU.pagoAviso,sucesso:__toasts.some(t=>/enviado|em análise/i.test(t))})),{writes:1,avisado:false,sucesso:false});
    await p.evaluate(async()=>{filaPush=async(cam,item)=>{__writes.push({cam,item});};await jaPagueiPix();});
    assert.equal(await p.locator('#ov-pix').isVisible(),false);
   });
   await check(label+'sem nuvem ou dependente não envia mensalidade',async()=>{
    await reset();await p.evaluate(()=>{window.fbDB=null;});assert.equal(await p.evaluate(()=>enviarPedido({kind:'mensalidade',valor:435})),false);
    assert.equal(await p.evaluate(()=>__writes.length),0);
    await reset();await p.evaluate(()=>{EU.responsavelId='pai-fake';EU.familia={papel:'dependente',responsavelNome:'Responsável Fictício',codigoResponsavel:'6602'};});
    assert.equal(await p.evaluate(()=>enviarPedido({kind:'mensalidade',valor:435})),false);assert.equal(await p.evaluate(()=>__writes.length),0);
   });
   await check(label+'pedidos idênticos simultâneos usam uma gravação; pedidos diferentes continuam possíveis',async()=>{
    await reset();await defer();
    await p.evaluate(()=>{window.__jobs=[enviarPedido({kind:'compra',item:'Aula avulsa',valor:170}),enviarPedido({kind:'compra',item:'Aula avulsa',valor:170})];});
    assert.equal(await p.evaluate(()=>__writes.length),1);
    assert.deepEqual(await p.evaluate(async()=>{__resolve();return Promise.all(__jobs);}),[true,true]);
    await p.evaluate(async()=>{filaPush=async(cam,item)=>{__writes.push({cam,item});};await enviarPedido({kind:'compra',item:'Locação',valor:70});});
    assert.equal(await p.evaluate(()=>__writes.length),2);
   });
   await check(label+'falha em compras, planos, renovação e termo não anuncia sucesso nem esconde os controles',async()=>{
    for(const kind of ['dinheiro','cartao','compra','plano','misto','renovacao','termo']){
     await reset();
     const r=await p.evaluate(async kind=>{
      filaPush=async()=>{throw Error('permission_denied');};
      document.getElementById('ov-comprar').classList.add('on');document.getElementById('ov-planos').classList.add('on');document.getElementById('ov-termo').classList.add('on');
      document.getElementById('renova-box').style.display='block';
      compraSel={nome:'Aula avulsa',valor:170};montar={part:2,grp:2};PUB.termoVer=1;
      const actions={dinheiro:()=>pagarDinheiro(),cartao:()=>pagarCartao(),compra:()=>pagarCompra('dinheiro'),plano:()=>pedirPlano('Particular',4,640),misto:()=>pedirPlanoMisto(),renovacao:()=>confirmarRenovacao(),termo:()=>aceitarTermo()};
      await actions[kind]();
      return {sucesso:__toasts.some(t=>/enviado|aceito/i.test(t)),renovou:!!MEU.renovouMes,termo:!!MEU.termoAceitoVer,numeros:JSON.stringify(EU)===__originalNumeros,
       planos:document.getElementById('ov-planos').classList.contains('on'),compra:document.getElementById('ov-comprar').classList.contains('on')};
     },kind);
     assert.deepEqual(r,{sucesso:false,renovou:false,termo:false,numeros:true,planos:true,compra:true},kind);
    }
   });
   await check(label+'locação espera confirmação de envio; falha não fecha, toque duplo não repete',async()=>{
    await reset();await defer();
    await p.evaluate(()=>{pedirLocacaoHora('16:00');window.__job=confirmarLocacao();confirmarLocacao();});
    await p.waitForFunction(()=>__writes.length===1);
    assert.equal(await p.locator('#ov-locdur').isVisible(),true);
    assert.equal(await p.evaluate(()=>__toasts.length),0);
    await p.evaluate(async()=>{__reject(Error('permission_denied'));await __job;});
    assert.equal(await p.locator('#ov-locdur').isVisible(),true);
    assert.equal(await p.evaluate(()=>__writes.length),1);
    await p.evaluate(async()=>{filaPush=async(cam,item)=>{__writes.push({cam,item});};await confirmarLocacao();await confirmarLocacao();});
    assert.equal(await p.locator('#ov-locdur').isVisible(),false);
    assert.deepEqual(await p.evaluate(()=>({writes:__writes.length,acao:__writes[1].item.acao,whats:__whats,numeros:JSON.stringify(EU)===__originalNumeros})),{writes:2,acao:'pediu locação 1h',whats:0,numeros:true});
   });
   await check(label+'vaga ocupada durante a leitura da nuvem impede locação e aula',async()=>{
    await reset();await p.evaluate(()=>{pedirLocacaoHora('16:00');atualizarGradeReserva=async()=>{PUB.grade.eventos=[{id:'ocup',data:'2026-11-11',hora:'16:00',tipo:'aula',cod:'outra-pessoa'}];};});
    assert.equal(await p.evaluate(()=>confirmarLocacao()),false);assert.equal(await p.evaluate(()=>__writes.length),0);
    await reset();await p.evaluate(()=>{abrirBook('16:00',false);atualizarGradeReserva=async()=>{PUB.grade.eventos=[{id:'ocup',data:'2026-11-11',hora:'16:00',tipo:'aula',cod:'outra-pessoa'}];};});
    await p.evaluate(()=>confirmarAgendamento());assert.equal(await p.evaluate(()=>__reservas.length),0);
   });
   await check(label+'reserva mantém gravação, pendência e saldos; não abre WhatsApp',async()=>{
    await reset();await p.evaluate(async()=>{abrirBook('16:00',false);await confirmarAgendamento();});
    assert.deepEqual(await p.evaluate(()=>({reservas:__reservas.length,pendentes:MEU.pedidos.length,whats:__whats,numeros:JSON.stringify(EU)===__originalNumeros})),{reservas:1,pendentes:1,whats:0,numeros:true});
   });
   await check(label+'cancelamento mantém confirmação e limite de quatro horas, sem WhatsApp',async()=>{
    await reset();
    await p.evaluate(()=>{PUB.grade.eventos=[{id:'minha',data:'2026-11-09',hora:'11:00',tipo:'aula',cod:'6601'}];conferirAulaParaAcao=async()=>({rec:'pontual'});});
    assert.equal(await p.evaluate(()=>podeCancelarAula('2026-11-09','11:00')),true);
    assert.equal(await p.evaluate(()=>podeCancelarAula('2026-11-09','10:59')),false);
    assert.equal(await p.evaluate(()=>cancelarAula('2026-11-09','10:59','pontual')),false);
    assert.equal(await p.evaluate(()=>__writes.length),0);
    assert.equal(await p.evaluate(()=>cancelarAula('2026-11-09','11:00','pontual')),true);
    assert.deepEqual(await p.evaluate(()=>({cancelados:MEU.cancelados.length,whats:__whats,numeros:JSON.stringify(EU)===__originalNumeros})),{cancelados:1,whats:0,numeros:true});
   });
   await check(label+'Gestão recolhe ações ocasionais e mantém os dados',async()=>{
    const g=await c.newPage();g.on('pageerror',e=>errors.push(e.message));g.on('dialog',d=>d.dismiss());
    await g.goto(base+'/app-gestao/',{waitUntil:'load'});await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
    await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#splash-gestao,#barra-versao,#barra-endereco,#toast{display:none!important}'});
    await g.evaluate(()=>{
     persist=()=>{};publish=()=>{};logAct=()=>{};hideVals=false;
     DB.alunos=[{id:'fake',codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:4,creditos:3,repos:0,mensalidade:640,status:'pago',ativo:true}];
     DB.agenda={fixos:[],eventos:[],excecoes:[]};DB.movs=[];ensureFields();renderAll();window.__antes=JSON.stringify(DB);abrirFicha('fake');
    });
    assert.equal(await g.locator('#fic-mais-acoes').getAttribute('open'),null);
    assert.equal(await g.locator('[onclick="addRepos(\'fake\')"]').isVisible(),false);
    assert.equal(await g.locator('[onclick="aulaRealizada(\'fake\')"]').isVisible(),true);
    await g.locator('#fic-mais-acoes summary').click();
    assert.equal(await g.locator('[onclick="addRepos(\'fake\')"]').isVisible(),true);
    assert.equal(await g.evaluate(()=>JSON.stringify(DB)===__antes),true);
    const dir=process.env.JV_VISUAL_DIR;if(dir){fs.mkdirSync(dir,{recursive:true});await g.locator('#fic-mais-acoes summary').click();await g.screenshot({path:path.join(dir,'envios-ficha-'+motor+'-'+tema+'.png')});await g.evaluate(()=>{esconderFicha();go('alunos',document.querySelector('.nav [data-ic="navball"]').closest('button'));});await g.locator('#ficha-aluno').waitFor({state:'hidden'});await g.screenshot({path:path.join(dir,'envios-gestao-alunos-'+motor+'-'+tema+'.png')});}
    await g.close();
   });
   assert.deepEqual(errors,[]);await c.close();
  }
  }finally{await browser.close();}
 }
 }finally{server.close();}
 console.log('✅ '+count+' cenários de envios e ações resumidas');
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

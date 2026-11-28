/* Aluno inativo (decisão do João, 28/11): só usa crédito quem está ativo e em dia.
   - A Gestão publica inativo=1 só para quem o João marcou como inativo
     (arquivado===true); quem só joga torneio ou só aluga, sem plano, fica 0.
   - No app do aluno, inativo não agenda aula, locação, torneio nem lista de
     espera, e não renova; os créditos ficam como estão.
   - A folga do pagamento até o vencimento continua igual para quem é ativo.
   Só dados fictícios. */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const NO_PRAZO=new Date('2026-11-09T10:00:00-03:00'),FORA_PRAZO=new Date('2026-11-12T10:00:00-03:00'),FIM_MES=new Date('2026-11-28T10:00:00-03:00');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;
async function check(n,fn){await fn();count++;console.log('✅ '+n);}
async function visual(p,n){
 if(!process.env.JV_VISUAL_DIR)return;
 const png=await p.screenshot();fs.mkdirSync(process.env.JV_VISUAL_DIR,{recursive:true});
 fs.writeFileSync(path.join(process.env.JV_VISUAL_DIR,n+'.png'),png);
}

/* Publicador REAL da Gestão, com o resto da conta substituído. */
const gestao=fs.readFileSync(path.join(root,'app-gestao/lib/app-gestao.js'),'utf8');
const publicador=gestao.slice(gestao.indexOf('function alunoPublicado('),gestao.indexOf('/* O app do aluno monta a grade'));
assert.ok(publicador.startsWith('function alunoPublicado('));
const publicar=new Function('a',
 'const titularSaldo=a=>a,unificado=()=>false,pacoteDoAluno=a=>a.plano,saldo=(a,c)=>Number(a[c])||0,bancoSaldo=()=>null,'+
 'profDoAluno=()=>"",profNome=()=>"",reposValidas=()=>0,reposVencendo=()=>0,vencimentoRepos=()=>"",creditosUnicos=()=>true,proximoVencimento=()=>null,'+
 'situacaoMensalidade=()=>({status:"pago",exato:false}),mesReal=()=>"2026-11",pagadorFamilia=a=>a,ehDependenteFamilia=()=>false,'+
 'dadosFamiliaAluno=()=>null,serieMensal=()=>[],valorCombinadoEm=()=>null;'+
 publicador+';return alunoPublicado(a);');

const base={codigo:'6702',nome:'Aluno Fictício',tipo:'Particular',plano:4,creditos:3,credGrupo:0,locCred:2,repos:0,reposValidas:0,
 mensalidade:640,status:'pago',ultimoPago:'2026-11',diaVenc:10,soCreditos:1,credVence:{qtd:3,data:'2027-04-30'},grupoTipo:''};
const PUBLICO={horas:['08:00','09:00'],profs:[],horarioCfg:{},horarioData:{},termoVer:0,historico:{},alunos:[],precos:{locacao:70},torneio:null,grade:{fixos:[],excecoes:[],eventos:[]}};

(async()=>{
 await check('Gestão publica inativo só para quem o João marcou como inativo',()=>{
  assert.equal(publicar({codigo:'1',nome:'A',plano:4,arquivado:true}).inativo,1);
  assert.equal(publicar({codigo:'2',nome:'B',plano:4,arquivado:false}).inativo,0);
  assert.equal(publicar({codigo:'3',nome:'C',plano:4}).inativo,0);
  // só torneio ou só locação: sem plano e sem mensalidade, mas não foi inativado
  assert.equal(publicar({codigo:'4',nome:'D',plano:0,planoGrupo:0,mensalidade:0}).inativo,0);
 });

 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 try{
  for(const [motor,engine] of [['chromium',chromium],['webkit',webkit]]){
   let browser;
   try{browser=await engine.launch({headless:true});}
   catch(e){if(process.env.CI)throw e;console.log('… '+motor+' não instalado aqui: pulado (o CI roda)');continue;}
   try{
    const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
    await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==url)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
    await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
    const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
    await p.clock.setFixedTime(NO_PRAZO);await p.goto(url+'/app-aluno/',{waitUntil:'load'});
    await p.waitForFunction(()=>typeof render==='function'&&typeof inativoAluno==='function');
    await p.addStyleTag({content:'#feriado-box,#login,#barra-app,#barra-versao,#toast,[id*="splash"]{display:none!important}'});
    /* Abre o app com o aluno dado e troca tudo o que iria para a nuvem por
       contadores: nenhum pedido pode sair de um aluno inativo. */
    const abrir=a=>p.evaluate(({a,P})=>{
     init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-test';
     EU=JSON.parse(JSON.stringify(a));P.alunos=[EU];PUB=P;MEU={codigo:EU.codigo,pedidos:[],cancelados:[],confirmadas:[],espera:[]};VINCULO_ESTADO='ativo';
     document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
     window.__toasts=[];toast=x=>__toasts.push(x);window.__envios=[];
     hasCloud=()=>true;filaPush=async(k,v)=>{__envios.push(k);};enviarPedido=async x=>{__envios.push('pedido:'+(x&&x.kind));return true;};
     enviarReservaUnica=async()=>{__envios.push('reserva');return true;};atualizarGradeReserva=async()=>{};saveMeu=async()=>{};
     slotState=()=>({st:'livre',grupo:false});cabeNoSlot=()=>({aula:true,loc:true,tor:true});
     agDate=new Date('2026-11-30T12:00:00');_renovaAdiado=false;
     document.getElementById('app').style.display='block';goAluno('inicio',document.getElementById('nav-al-inicio'));
     render();renderPayLock();
     return JSON.stringify(EU);
    },{a,P:PUBLICO});
    const estado=()=>p.evaluate(()=>({
     toasts:__toasts.slice(),envios:__envios.slice(),
     pick:document.getElementById('ov-pick').classList.contains('on'),
     book:document.getElementById('ov-book').classList.contains('on'),
     loc:document.getElementById('ov-locdur').classList.contains('on'),
     lock:getComputedStyle(document.getElementById('pay-lock')).display!=='none'?document.getElementById('pay-lock').innerText:''
    }));
    const limpar=()=>p.evaluate(()=>{__toasts.length=0;__envios.length=0;document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));});
    const MSG='Seu cadastro está inativo. Fale com o João para voltar.';

    await check(motor+': aluno ativo e em dia agenda normalmente (controle)',async()=>{
     await abrir({...base,inativo:0});
     assert.equal(await p.evaluate(()=>bloqueadoParaAgendar()),false);
     await p.evaluate(()=>escolherSlot('09:00'));
     const e=await estado();assert.equal(e.pick,true,'abre as opções do horário');assert.equal(e.lock,'');
    });

    await check(motor+': inativo vê o aviso no topo e os créditos continuam como estão',async()=>{
     const antes=await abrir({...base,inativo:1});
     const e=await estado();
     assert.match(e.lock,/Seu cadastro está inativo\./);assert.match(e.lock,/Fale com o João para voltar/);
     assert.match(e.lock,/créditos ficam guardados/);
     assert.doesNotMatch(e.lock,/Pagar|reposiç|desconto/i);
     assert.equal(await p.evaluate(()=>JSON.stringify(EU)),antes,'nada muda no saldo');
     assert.equal(await p.evaluate(()=>bloqueadoParaAgendar()),true);
     assert.equal(await p.evaluate(()=>soLembrete()),false,'não mostra o lembrete de vencimento no lugar');
     assert.deepEqual(await p.evaluate(()=>[document.getElementById('home-pay-status').textContent,document.getElementById('home-venc').textContent]),['Inativo','—'],'Início sem "Em dia" nem vencimento');
     await p.evaluate(()=>{goAluno('agenda',document.getElementById('nav-al-agenda'));renderPayLock();});
     await visual(p,'inativo-agenda-'+motor);
     await p.evaluate(()=>{goAluno('creditos',document.getElementById('nav-al-creditos'));render();});
     await visual(p,'inativo-creditos-'+motor);
     const cr=await p.evaluate(()=>({
      mais:getComputedStyle(document.getElementById('cred-page-mais')).display,
      st:document.getElementById('cred-page-status').textContent,
      saldo:document.getElementById('cred-page-saldo').textContent,
      pay:getComputedStyle(document.getElementById('pay-box')).display}));
     assert.equal(cr.mais,'none','sem "Agendar aula a mais"');
     assert.equal(cr.st,'Cadastro inativo');
     assert.match(cr.saldo,/3/,'o saldo continua aparecendo');
     assert.equal(cr.pay,'none','sem "Adiantar a próxima mensalidade"');
     await p.evaluate(()=>{__toasts.length=0;irPagar();});
     assert.ok((await estado()).toasts.some(t=>t.includes('Seu cadastro está inativo')));
    });

    await check(motor+': ativo continua vendo "Agendar aula a mais", a situação e o pagamento (controle)',async()=>{
     await abrir({...base,inativo:0});
     await p.evaluate(()=>{goAluno('creditos',document.getElementById('nav-al-creditos'));render();});
     const cr=await p.evaluate(()=>({
      mais:getComputedStyle(document.getElementById('cred-page-mais')).display,
      st:document.getElementById('cred-page-status').textContent,
      pay:getComputedStyle(document.getElementById('pay-box')).display}));
     assert.notEqual(cr.mais,'none');assert.equal(cr.st,'Em dia');assert.notEqual(cr.pay,'none');
    });

    await check(motor+': inativo não abre horário, aula, torneio, locação nem lista de espera',async()=>{
     await abrir({...base,inativo:1});
     await p.evaluate(()=>escolherSlot('09:00'));
     let e=await estado();assert.equal(e.pick,false);assert.ok(e.toasts.some(t=>t.includes('Seu cadastro está inativo')));
     await limpar();await p.evaluate(()=>abrirBook('09:00',false,false));
     e=await estado();assert.equal(e.book,false,'aula');assert.equal(e.toasts.length,1);
     await limpar();await p.evaluate(()=>abrirBook('09:00',false,true));
     e=await estado();assert.equal(e.book,false,'torneio');assert.equal(e.toasts.length,1);
     await limpar();await p.evaluate(()=>pedirLocacaoHora('09:00'));
     e=await estado();assert.equal(e.loc,false,'locação');assert.equal(e.toasts.length,1);
     await limpar();await p.evaluate(()=>{pickCtx={hora:'09:00',date:new Date('2026-11-30T12:00:00'),espera:true};return mudarEspera(true);});
     e=await estado();assert.deepEqual(e.envios,[],'lista de espera');
     assert.ok(e.toasts.every(t=>t==='🔒 '+'Seu cadastro está inativo. Fale com o João para voltar.'));
    });

    await check(motor+': confirmar o que já estava aberto também não envia nada',async()=>{
     await abrir({...base,inativo:0});
     await p.evaluate(()=>{escolherSlot('09:00');abrirBook('09:00',false,false);});
     assert.equal((await estado()).book,true);
     await p.evaluate(()=>{EU.inativo=1;__toasts.length=0;});      // o João inativou com a tela aberta
     await p.evaluate(()=>confirmarAgendamento());
     let e=await estado();assert.deepEqual(e.envios,[]);assert.equal(e.book,false);assert.ok(e.toasts.some(t=>t.includes(MSG)));
     await p.evaluate(()=>{EU.inativo=0;__toasts.length=0;pedirLocacaoHora('09:00');});
     assert.equal((await estado()).loc,true);
     await p.evaluate(()=>{EU.inativo=1;});
     assert.equal(await p.evaluate(()=>confirmarLocacao()),false);
     e=await estado();assert.deepEqual(e.envios,[]);assert.equal(e.loc,false);
    });

    await check(motor+': inativo pode sair da lista de espera em que já estava',async()=>{
     await abrir({...base,inativo:1});
     await p.evaluate(()=>{MEU.espera=[{data:'2026-11-30',hora:'09:00',ts:1,avisado:0}];pickCtx={hora:'09:00',date:new Date('2026-11-30T12:00:00'),espera:true};return mudarEspera(false);});
     const e=await estado();assert.deepEqual(e.envios,['jvtenis/fila_agendamentos']);
     assert.equal(await p.evaluate(()=>MEU.espera.length),0);
    });

    await check(motor+': no fim do mês, inativo não recebe "Continuar no mesmo pacote" nem renova',async()=>{
     await p.clock.setFixedTime(FIM_MES);
     await abrir({...base,inativo:0});
     await p.evaluate(()=>checarRenovacao());
     assert.notEqual(await p.evaluate(()=>getComputedStyle(document.getElementById('renova-box')).display),'none','ativo vê o aviso (controle)');
     await abrir({...base,inativo:1});
     await p.evaluate(()=>checarRenovacao());
     assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('renova-box')).display),'none');
     await p.evaluate(()=>confirmarRenovacao());
     const e=await estado();assert.deepEqual(e.envios,[]);assert.ok(e.toasts.some(t=>t.includes(MSG)));
     await p.clock.setFixedTime(NO_PRAZO);
    });

    await check(motor+': folga do pagamento até o vencimento continua igual para quem é ativo',async()=>{
     const pend={...base,inativo:0,status:'pendente',ultimoPago:'2026-10'};
     await p.clock.setFixedTime(NO_PRAZO);await abrir(pend);
     assert.equal(await p.evaluate(()=>bloqueadoParaAgendar()),false,'até o dia 10 agenda');
     assert.equal(await p.evaluate(()=>soLembrete()),true);
     await p.clock.setFixedTime(FORA_PRAZO);await abrir(pend);
     assert.equal(await p.evaluate(()=>bloqueadoParaAgendar()),true,'passou do dia sem pagar, trava');
     assert.match((await estado()).lock,/mensalidade do mês em aberto/);
     await p.clock.setFixedTime(NO_PRAZO);
    });

    await check(motor+': quando o João reativa, o app avisa "Cadastro reativado" (não "pagamento")',async()=>{
     await abrir({...base,inativo:1});
     await p.evaluate(()=>{refresh=async()=>{EU.inativo=0;return true;};mostrarAviso=()=>{};});
     await p.evaluate(()=>checarLiberacao());
     const e=await estado();
     assert.ok(e.toasts.some(t=>t.includes('Cadastro reativado')),e.toasts.join('|'));
     assert.ok(!e.toasts.some(t=>t.includes('Pagamento confirmado')));
     assert.equal(e.lock,'');
    });

    assert.deepEqual(erros,[],'erros na página: '+erros.join(' | '));
    await c.close();
   }finally{await browser.close();}
  }
 }finally{server.close();}
 console.log('\n'+count+' conferências do aluno inativo passaram.');
})().catch(e=>{console.error(e);process.exit(1);});

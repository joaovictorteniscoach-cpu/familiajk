/* App do aluno: assistente por voz (20/10, pedido do João). O aluno fala ou
   escreve e o assistente confere horário livre, abre o agendamento, cancela
   (pela mesma função do app, com o prazo de 4 horas) e lista as aulas.
   Confere que o assistente não agenda nem cancela sozinho: só abre as
   janelas que o app já tem. Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-20T07:00:00-03:00');   // terça, 7h
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
const HORAS=['07:00','08:00','09:00','10:00','11:00','12:00','17:00','18:00','19:00','20:00'];
const EU0={codigo:'6601',nome:'Aluno <b>Teste</b>',tipo:'Particular',plano:4,creditos:3,credGrupo:0,repos:1,reposValidas:1,locCred:0,mensalidade:640,status:'pago',ativo:true};
const PUB0={horas:HORAS,profs:[],horarioCfg:{},horarioData:{},reservasRespostas:[],historico:{},alunos:[],
 grade:{fixos:[],excecoes:[],eventos:[
  {id:'e1',cod:'6601',data:'2026-10-20',hora:'09:00',tipo:'aula'},     // daqui a 2h: fora do prazo de cancelar
  {id:'e2',cod:'6601',data:'2026-10-20',hora:'12:00',tipo:'aula'},     // daqui a 5h: pode cancelar
  {id:'x1',cod:'7702',data:'2026-10-21',hora:'08:00',tipo:'aula'},     // ocupado amanhã
  {id:'x2',cod:'7703',data:'2026-10-21',hora:'11:00',tipo:'torneio'},  // torneio: não é "livre para aula"
  {id:'x3',cod:'7704',data:'2026-10-22',hora:'19:00',tipo:'aula'}]}};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
  const p=await c.newPage(),erros=[],dialogos=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>{dialogos.push(d.message());d.dismiss();});
  await p.clock.setFixedTime(AGORA);
  await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>window.JVVozAluno&&typeof slotState==='function');
  await p.addStyleTag({content:'*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important}'});
  const entrar=()=>p.evaluate(({EU0,PUB0})=>{
   init=async()=>{};saveMeu=async()=>{};notificarJoao=()=>{};abrirWhatsApp=()=>{};
   EU=JSON.parse(JSON.stringify(EU0));PUB=JSON.parse(JSON.stringify(PUB0));PUB.alunos=[EU];
   MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[],espera:[]};
   document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
   document.getElementById('login').style.display='none';document.getElementById('app').style.display='block';
   try{render();}catch(e){}
   JVVozAluno.fechar();
  },{EU0,PUB0});
  const visivel=sel=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&!e.hidden&&getComputedStyle(e).display!=='none';},sel);
  const ultima=()=>p.evaluate(()=>{const m=[...document.querySelectorAll('#va-conversa .va-eu-nao')].pop();return m?{txt:m.querySelector('p').textContent,bts:[...m.querySelectorAll('.va-bt')].map(b=>b.textContent)}:null;});
  const pedir=async frase=>{await p.evaluate(f=>{document.getElementById('va-texto').value=f;document.getElementById('va-enviar').click();},frase);return ultima();};

  await check('entende as frases: dia, hora, manhã/tarde e o que o aluno quer',async()=>{
   await entrar();
   const r=await p.evaluate(()=>{const f=x=>{const i=JVVozAluno.interpretar(x);return [i.acao,i.data,i.horas.join('|'),i.erroData?'erro':''].join(' ');};
    return ['Tem horário livre amanhã?','Marcar quinta às 18','Cancelar minha aula de terça às 9','tem vaga às 8','dia 25 às seis e meia da tarde',
     'quais são minhas aulas','minhas aulas agendadas','quero agendar às 19h','quantos créditos eu tenho','31/02 às 10','dia 23/10 às 10 horas','sexta-feira que vem às 7'].map(f);});
   assert.deepEqual(r,['consultar 2026-10-21  ','agendar 2026-10-22 18:00 ','cancelar 2026-10-20 09:00 ','consultar  08:00|20:00 ','consultar 2026-10-25 18:30 ',
    'minhas   ','minhas   ','agendar  19:00 ','creditos   ','consultar  10:00 erro','consultar 2026-10-23 10:00 ','consultar 2026-10-23 07:00|19:00 ']);
  });
  await check('botão só aparece para quem entrou e some quando outra janela está aberta',async()=>{
   await p.evaluate(()=>{EU=null;MEU={codigo:null,pedidos:[],cancelados:[]};document.getElementById('app').style.display='none';document.getElementById('login').style.display='flex';});
   await p.waitForTimeout(60);assert.equal(await visivel('#va-atalho'),false,'sem login');
   await entrar();await p.waitForTimeout(60);assert.equal(await visivel('#va-atalho'),true,'com login');
   const caixa=await p.locator('#va-atalho').boundingBox(),nav=await p.locator('.nav').boundingBox();
   assert.ok(caixa.y+caixa.height<=nav.y,'acima da barra de baixo');
   await p.evaluate(()=>document.getElementById('ov-pick').classList.add('on'));await p.waitForTimeout(60);
   assert.equal(await visivel('#va-atalho'),false,'janela aberta');
   await p.evaluate(()=>document.getElementById('ov-pick').classList.remove('on'));await p.waitForTimeout(60);
   assert.equal(await visivel('#va-atalho'),true);
  });
  await check('abre com saudação sem montar HTML com o nome que vem da nuvem',async()=>{
   await p.click('#va-atalho');assert.equal(await visivel('#va-painel'),true);
   const r=await p.evaluate(()=>({txt:document.querySelector('#va-conversa p').textContent,b:document.querySelectorAll('#va-conversa b').length}));
   assert.match(r.txt,/^Oi, Aluno! /);assert.equal(r.b,0);
  });
  await check('"tem horário livre amanhã?" lista só os livres para aula (sem ocupado e sem torneio)',async()=>{
   const r=await pedir('Tem horário livre amanhã?');
   assert.match(r.txt,/Horários livres em amanhã, qua 21\/10: 07:00, 09:00, 10:00, 17:00, 18:00, 19:00\. /);
   assert.ok(!r.bts.some(b=>/08:00|11:00/.test(b)));assert.equal(r.bts[0],'Agendar 07:00');
  });
  await check('tocar em "Agendar 10:00" fecha o assistente e abre a janela de agendamento do app',async()=>{
   await p.evaluate(()=>[...document.querySelectorAll('#va-conversa .va-bt')].find(b=>b.textContent==='Agendar 10:00').click());
   assert.equal(await visivel('#va-painel'),false);
   const r=await p.evaluate(()=>({on:document.getElementById('ov-pick').classList.contains('on'),sub:document.getElementById('pick-sub').textContent,aba:document.body.dataset.aba}));
   assert.ok(r.on);assert.match(r.sub,/21 de outubro · 10:00/);assert.equal(r.aba,'agenda');
  });
  await check('"marcar quinta às 18" livre: abre o agendamento direto (o aluno ainda escolhe e confirma)',async()=>{
   await entrar();await p.click('#va-atalho');const r=await pedir('Marcar quinta às 18');
   assert.match(r.txt,/Está livre: qui 22\/10 às 18:00\. Abrindo o agendamento/);
   await p.waitForFunction(()=>document.getElementById('ov-pick').classList.contains('on'));
   assert.match(await p.textContent('#pick-sub'),/22 de outubro · 18:00/);
   assert.equal(await p.evaluate(()=>MEU.pedidos.length),0,'nada foi pedido sozinho');
  });
  await check('horário ocupado: diz que está ocupado, oferece lista de espera e outros livres',async()=>{
   await entrar();await p.click('#va-atalho');const r=await pedir('quinta às 19 está livre?');
   assert.match(r.txt,/Ocupado em qui 22\/10 às 19:00\. Livres nesse dia: 07:00/);assert.equal(r.bts[0],'Avisar se liberar');
   await p.evaluate(()=>document.querySelector('#va-conversa .va-eu-nao:last-child .va-bt').click());
   assert.match(await p.textContent('#pick-opts'),/lista de espera/);assert.match(await p.textContent('#pick-sub'),/22 de outubro · 19:00/);
  });
  await check('"às 8" sem dia: pergunta de manhã ou à noite? só quando tem dia; sem dia procura nos próximos dias',async()=>{
   await entrar();await p.click('#va-atalho');
   let r=await pedir('amanhã às 8');assert.equal(r.txt,'De manhã ou à noite?');assert.deepEqual(r.bts,['08:00','20:00']);
   r=await pedir('quero agendar às 19h');assert.match(r.txt,/^19:00 está livre em: hoje, ter 20\/10; amanhã, qua 21\/10; sex 23\/10/);
   assert.ok(r.bts.every(b=>b.startsWith('Agendar ')));
  });
  await check('cancelar: acha a aula e usa o cancelamento do app (com confirmação)',async()=>{
   await entrar();await p.evaluate(()=>{window.__canc=[];const orig=cancelarAula;cancelarAula=(...a)=>{window.__canc.push(a);return orig(...a);};});
   await p.click('#va-atalho');const r=await pedir('cancelar minha aula de hoje ao meio dia');
   assert.match(r.txt,/Encontrei sua aula de hoje, ter 20\/10 às 12:00/);assert.deepEqual(r.bts,['Cancelar esta aula']);
   dialogos.length=0;await p.evaluate(()=>document.querySelector('#va-conversa .va-eu-nao:last-child .va-bt').click());
   await p.waitForTimeout(80);
   assert.deepEqual(await p.evaluate(()=>window.__canc),[['2026-10-20','12:00','pontual']]);
   assert.equal(dialogos.length,1);assert.match(dialogos[0],/Cancelar sua aula de 20\/10 às 12:00/);
   assert.equal(await p.evaluate(()=>MEU.cancelados.length),0,'o aluno disse não na confirmação: nada muda');
  });
  await check('cancelar fora do prazo de 4 horas: o app recusa como sempre',async()=>{
   await entrar();await p.click('#va-atalho');const r=await pedir('cancelar terça às 9');
   assert.deepEqual(r.bts,['Cancelar esta aula']);dialogos.length=0;
   await p.evaluate(()=>document.querySelector('#va-conversa .va-eu-nao:last-child .va-bt').click());await p.waitForTimeout(80);
   assert.equal(dialogos.length,0,'nem pergunta');assert.match(await p.textContent('#toast'),/Cancelamento só até 4h antes/);
  });
  await check('minhas aulas e créditos',async()=>{
   await entrar();await p.click('#va-atalho');
   let r=await pedir('quais são minhas aulas');assert.equal(r.txt,'Suas próximas aulas: hoje, ter 20/10 às 09:00; hoje, ter 20/10 às 12:00.');
   r=await pedir('quantos créditos eu tenho');assert.equal(r.txt,'Você tem 3 créditos e 1 reposição.');
   r=await pedir('blablabla');assert.match(r.txt,/^Não entendi/);
  });
  await check('voz: lê a resposta só com a opção ligada; sem reconhecimento de fala, indica o ditado do teclado',async()=>{
   await entrar();
   await p.evaluate(()=>{window.__falas=[];speechSynthesis.speak=u=>window.__falas.push(u.text);speechSynthesis.cancel=()=>{};delete window.webkitSpeechRecognition;delete window.SpeechRecognition;});
   await p.click('#va-atalho');await p.evaluate(()=>{const c=document.getElementById('va-ouvir');c.checked=true;c.dispatchEvent(new Event('change'));});
   await pedir('créditos');
   assert.equal(await p.evaluate(()=>window.__falas.pop()),'Você tem 3 créditos e 1 reposição.');
   await p.evaluate(()=>{const c=document.getElementById('va-ouvir');c.checked=false;c.dispatchEvent(new Event('change'));window.__falas=[];});
   await pedir('créditos');assert.equal(await p.evaluate(()=>window.__falas.length),0);
   await p.click('#va-falar');assert.match(await p.textContent('#va-status'),/microfone do teclado/);
   await p.keyboard.press('Escape');assert.equal(await visivel('#va-painel'),false);
  });
  assert.deepEqual(erros,[]);await c.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · assistente por voz do aluno');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

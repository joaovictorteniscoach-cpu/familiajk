/* App do aluno: assistente responde perguntas com os dados do próprio app
   (20/10, pedido do João): preço da aula particular e em grupo, plano mensal
   (pergunta quantas aulas), "quero repor 2 aulas", mensalidade e vencimento,
   como pagar, horários da quadra, torneio, aviso, nível, lista de espera,
   regra de cancelar e de chuva. Nada é pedido nem pago: os botões só abrem
   as telas do app. Só dados fictícios, relógio fixo.
   JV_VOZ_LISTA=1 imprime pergunta → resposta. */
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
const EU0={codigo:'6601',nome:'Aluno Teste',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:3,reposValidas:3,reposVencendo:1,locCred:0,
 mensalidade:640,status:'pendente',diaVenc:25,ativo:true,
 avaliacoes:[{data:'2026-08-10',nivel:'Impulso'},{data:'2026-10-05',nivel:'Construção',prioridade:'Preparação antecipada no forehand'}]};
const PUB0={horas:HORAS,profs:[],horarioCfg:{},horarioData:{},reservasRespostas:[],historico:{},aviso:'Quadra 2 em manutenção na sexta de manhã.',
 precos:{avulsaPart:170,avulsaGrupo:95,locacao:70,personal:130,planilha:60,kids:0},grupoPreco:{dupla:90,trio:85,quarteto:80},
 planos:{Particular:{3:480,4:640,6:960,8:1260,10:1600},Grupo:{3:285,4:360,6:510,8:640,10:750},Personal:{3:390,4:520,6:780,8:1040,10:1300}},
 pix:'teste@example.invalid',pixNome:'Academia Teste',cardLink:'https://example.invalid/pagar',
 torneio:{id:'tor1',nome:'Barragem Primavera',etapa:2,nomesGrupos:{A:'Grupo Ouro'},jogadores:[
  {name:'Aluno Teste',cod:'6601',group:'A',v:3,d:1,wo:0},{name:'Jogador Dois',group:'A',v:4,d:0,wo:0},{name:'Jogador Três',group:'A',v:1,d:3,wo:0}]},
 grade:{fixos:[],excecoes:[],eventos:[{id:'x1',cod:'7702',data:'2026-10-21',hora:'08:00',tipo:'aula'}]}};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.clock.setFixedTime(AGORA);
  await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>window.JVVozAluno&&typeof slotState==='function');
  const entrar=(mexe)=>p.evaluate(({EU0,PUB0,mexe})=>{
   init=async()=>{};saveMeu=async()=>{};notificarJoao=()=>{};window.__wa=[];abrirWhatsApp=(n,t)=>window.__wa.push(t);
   EU=JSON.parse(JSON.stringify(EU0));PUB=JSON.parse(JSON.stringify(PUB0));PUB.alunos=[EU];
   MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[],espera:[{data:'2026-10-22',hora:'19:00',ts:1},{data:'2026-10-01',hora:'09:00',ts:1}]};
   if(mexe)new Function('EU','PUB','MEU',mexe)(EU,PUB,MEU);
   document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
   document.getElementById('login').style.display='none';document.getElementById('app').style.display='block';
   try{render();}catch(e){}
   JVVozAluno.fechar();JVVozAluno.abrir();
  },{EU0,PUB0,mexe:mexe||''});
  const ultima=()=>p.evaluate(()=>{const m=[...document.querySelectorAll('#va-conversa .va-eu-nao')].pop();return {txt:m.querySelector('p').textContent,bts:[...m.querySelectorAll('.va-bt')].map(b=>b.textContent)};});
  const pedir=async f=>{await p.evaluate(f=>{document.getElementById('va-texto').value=f;JVVozAluno.enviar();},f);const r=await ultima();if(process.env.JV_VOZ_LISTA)console.log('  «'+f+'» → '+r.txt+(r.bts.length?'  ['+r.bts.join(' | ')+']':''));return r;};
  const tocar=async rot=>{await p.evaluate(rot=>{const b=[...document.querySelectorAll('#va-conversa .va-eu-nao:last-child .va-bt')].find(x=>x.textContent===rot);if(!b)throw new Error('sem botão '+rot);b.click();},rot);return ultima();};

  await check('preço da aula particular: o valor do app, e oferece o plano mensal perguntando quantas aulas',async()=>{
   await entrar();
   let r=await pedir('Quanto custa a aula particular?');
   assert.equal(r.txt,'A aula particular avulsa custa R$ 170. Quer saber o plano mensal? Quantas aulas você deseja fazer no mês?');
   assert.deepEqual(r.bts,['Comprar aula avulsa','3 aulas/mês','4 aulas/mês','6 aulas/mês','8 aulas/mês','10 aulas/mês']);
   r=await pedir('8');assert.equal(r.txt,'Plano particular com 8 aulas por mês: R$ 1.260 por mês.');assert.deepEqual(r.bts,['Ver planos no app']);
   r=await pedir('qual o valor da aula?');assert.match(r.txt,/^A aula particular avulsa custa R\$ 170\. Em grupo, a avulsa custa R\$ 95 por pessoa\./);
  });
  await check('mensalidade em grupo: pergunta quantas aulas e responde dupla, trio e quarteto por pessoa',async()=>{
   await entrar();
   let r=await pedir('Quanto é a mensalidade em grupo?');
   assert.equal(r.txt,'Quantas aulas você deseja fazer no mês?');assert.deepEqual(r.bts,['3 aulas','4 aulas','6 aulas','8 aulas','10 aulas']);
   r=await pedir('quatro aulas');assert.equal(r.txt,'Em grupo, 4 aulas por mês: dupla R$ 360, trio R$ 340, quarteto R$ 320, por pessoa.');
   r=await pedir('plano em dupla duas vezes por semana');assert.equal(r.txt,'Em dupla, 8 aulas por mês ficam R$ 720 por pessoa (R$ 90 por aula).');
   r=await pedir('quais são os planos?');assert.equal(r.txt,'Você quer o plano particular ou em grupo?');
   r=await tocar('Particular');assert.equal(r.txt,'Quantas aulas você deseja fazer no mês?');
   r=await tocar('10 aulas');assert.match(r.txt,/10 aulas é a combinar com o João/);
   r=await pedir('plano particular de 5 aulas');assert.match(r.txt,/^Os planos particulares são de 3, 4, 6, 8 ou 10 aulas por mês/);
   r=await pedir('6');assert.equal(r.txt,'Plano particular com 6 aulas por mês: R$ 960 por mês.');
  });
  await check('locação, planilha e valor que não está no app (vai ao João, sem inventar)',async()=>{
   await entrar();
   let r=await pedir('quanto custa alugar a quadra?');assert.equal(r.txt,'A locação da quadra custa R$ 70 por hora.');
   r=await pedir('preço do treino de planilha');assert.equal(r.txt,'O treino de planilha avulso custa R$ 60.');
   r=await pedir('quanto custa o kids?');assert.match(r.txt,/não está no app/);assert.deepEqual(r.bts,['Falar com o João no WhatsApp']);
  });
  await check('"quero repor 2 aulas": saldo, o que vence e horários livres para marcar a reposição',async()=>{
   await entrar();
   let r=await pedir('Quero repor 2 aulas');
   assert.match(r.txt,/^Você tem 3 reposições, 1 vence no fim do mês\. Escolha um horário livre e toque em “Marcar reposição”; marque uma aula de cada vez\./);
   assert.equal(r.bts[0],'Repor hoje, ter 20/10 08:00');assert.equal(r.bts.length,6);
   r=await pedir('quero repor 5 aulas amanhã');assert.match(r.txt,/^Você pediu 5, mas tem 3 reposições\./);
   assert.ok(r.bts.every(b=>/amanhã, qua 21\/10/.test(b))&&!r.bts.some(b=>/08:00/.test(b)),'só amanhã, sem o ocupado');
   await tocar(r.bts[0]);
   assert.match(await p.textContent('#pick-opts'),/Marcar reposição/,'abre o agendamento com a opção de reposição');
   await entrar('EU.reposValidas=0;EU.repos=0;');r=await pedir('tenho reposição?');assert.match(r.txt,/^Você não tem reposições no momento/);
  });
  await check('minha mensalidade e vencimento; como pagar; família e valor oculto',async()=>{
   await entrar();
   let r=await pedir('qual é a minha mensalidade?');
   assert.match(r.txt,/^Seu plano: Particular · Flex 4\. Mensalidade: R\$ 640\. Situação: pendente\. Vencimento: /);assert.deepEqual(r.bts,['Pagar agora']);
   r=await pedir('estou em dia?');assert.match(r.txt,/Situação: pendente/);
   r=await pedir('como faço para pagar?');assert.match(r.txt,/^Você pode pagar por Pix \(chave teste@example\.invalid, em nome de Academia Teste\) ou cartão/);assert.deepEqual(r.bts,['Abrir pagamento']);
   await entrar("EU.status='pago';");r=await pedir('quando vence?');assert.match(r.txt,/Situação: em dia\. Próximo vencimento: /);assert.deepEqual(r.bts,[]);
   await entrar("EU.valoresOcultos=true;");r=await pedir('minha mensalidade');assert.match(r.txt,/aparece quando o João aprovar este aparelho/);assert.doesNotMatch(r.txt,/640/);
   await entrar("EU.familia={papel:'dependente',responsavelNome:'Responsável Teste'};");r=await pedir('minha mensalidade');assert.equal(r.txt,'Sua mensalidade está incluída no plano família. O pagamento é feito por Responsável Teste.');
  });
  await check('horários da quadra, torneio, aviso, nível, lista de espera, regras de cancelar e chuva',async()=>{
   await entrar();
   let r=await pedir('que horas a quadra abre?');assert.equal(r.txt,'Horários da quadra: seg a sex das 07:00 às 20:00; sáb a dom das 07:00 às 17:00.');
   r=await pedir('funciona domingo dia 25?');assert.equal(r.txt,'Em dom 25/10 os horários vão das 07:00 às 17:00.');
   r=await pedir('como estou no torneio?');assert.equal(r.txt,'Barragem Primavera · etapa 2: você está em 2º lugar no Grupo Ouro, com 10 pontos (3 vitórias, 1 derrota).');assert.deepEqual(r.bts,['Ver torneio']);
   r=await pedir('como funciona a pontuação do torneio?');assert.match(r.txt,/vitória vale 3 pontos, derrota vale 1/);
   r=await pedir('tem algum aviso?');assert.equal(r.txt,'Aviso do João: Quadra 2 em manutenção na sexta de manhã.');
   r=await pedir('qual é o meu nível?');assert.equal(r.txt,'Seu nível atual: Construção (avaliação de 05/10). Foco agora: Preparação antecipada no forehand.');
   r=await pedir('estou na lista de espera?');assert.equal(r.txt,'Você está na lista de espera de: qui 22/10 às 19:00. Se a vaga liberar, o app avisa.');
   r=await pedir('até quando posso cancelar?');assert.equal(r.txt,'Você pode cancelar pelo app até 4 horas antes da aula. Depois disso, fale com o João.');
   r=await pedir('e se chover?');assert.match(r.txt,/cancelada por chuva.*não gasta crédito/);
   r=await pedir('o que você sabe fazer?');assert.match(r.txt,/^Posso ver horários livres/);
  });
  await check('nada sai do app sem toque; respostas não falam de desconto; voz lê "reais"',async()=>{
   await entrar();
   await p.evaluate(()=>{window.__u=[];window.SpeechSynthesisUtterance=function(t){this.text=t;};speechSynthesis.speak=u=>window.__u.push(u.text);speechSynthesis.cancel=()=>{};const c=document.getElementById('va-ouvir');c.checked=true;c.dispatchEvent(new Event('change'));});
   const r=await pedir('plano particular 8 aulas');assert.equal(r.txt,'Plano particular com 8 aulas por mês: R$ 1.260 por mês.');
   assert.equal(await p.evaluate(()=>window.__u.pop()),'Plano particular com 8 aulas por mês: 1.260 reais por mês.');
   const tudo=await p.evaluate(()=>document.getElementById('va-conversa').textContent);
   assert.doesNotMatch(tudo,/desconto/i);
   assert.deepEqual(await p.evaluate(()=>({ped:MEU.pedidos.length,wa:window.__wa.length})),{ped:0,wa:0});
  });
  assert.deepEqual(erros,[]);await c.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · assistente responde com os dados do app');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

/* Saldos compartilhados, modalidade de reposição, prazo e minutos.
   Somente dados fictícios; rede externa e Firebase bloqueados. */
const {chromium,webkit}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}
});
let count=0;async function check(label,test){await test();count++;console.log('✅ '+label);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const motor=process.env.JV_MOTOR==='webkit'?webkit:chromium;
 const browser=await motor.launch({headless:true,...(motor===chromium?{executablePath:process.env.JV_BROWSER||undefined,args:['--no-sandbox']}: {})});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await ctx.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const p=await ctx.newPage(),errors=[],renders=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(/^Render .+ falhou:/.test(m.text()))renders.push(m.text());});
  let aceitar=true,promptResposta;p.on('dialog',d=>aceitar?d.accept(d.type()==='prompt'?promptResposta:undefined):d.dismiss());
  await p.clock.setSystemTime(new Date('2026-11-12T12:00:00-03:00'));
  await p.goto(base+'/app-gestao/',{waitUntil:'load'});await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast{display:none!important}'});
  async function preparar(){await p.evaluate(()=>{
   persist=()=>{};publish=()=>{};MODO='dono';guardarVersoes=async json=>{window.versaoAnterior=JSON.parse(json);return true;};Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);
   const aluno=(id,nome)=>({id,codigo:id,nome,tipo:'Particular',plano:4,planoGrupo:0,creditos:4,credGrupo:0,repos:0,locCred:0,mensalidade:600,status:'pago',diaVenc:10,valorAula:150,ativo:true});
   DB.alunos=[aluno('9991','Titular Fictício'),aluno('9992','Participante Fictício'),aluno('9993','Individual Fictício')];DB.movs=[];DB.presencas=[];DB.lancamentos=[];DB.duracoesAulas={};delete DB.pacoteUnico;DB.mesCreditos='2026-11';DB.mesPagamentos='2026-11';
   DB.agenda={fixos:[],excecoes:[],eventos:[{id:'e1',alunoId:'9991',data:'2026-11-12',hora:'18:00',tipo:'aula',titulo:'Titular Fictício'},{id:'e2',alunoId:'9992',data:'2026-11-12',hora:'19:00',tipo:'aula',titulo:'Participante Fictício'}]};
   ensureFields();agDate=new Date('2026-11-12T12:00:00');curYear=2026;curMonth=10;renderAll();
  });}
  const marcar=id=>p.evaluate(id=>togglePresencaUm(id),id);
  const valores=()=>p.evaluate(()=>DB.alunos.map(a=>({id:a.id,c:a.creditos,r:a.repos,l:a.locCred,ef:saldo(a,'creditos')})));
  await preparar();
  await check('sem configuração, saldos e presenças continuam individuais',async()=>{
   await marcar('e1');await marcar('e2');assert.deepEqual((await valores()).map(a=>a.c),[3,3,4]);
   await marcar('e1');await marcar('e2');assert.deepEqual((await valores()).map(a=>a.c),[4,4,4]);
  });
  await check('cancelar configuração não muda dados; falha no backup impede salvar',async()=>{
   const antes=await p.evaluate(()=>JSON.stringify(DB));await p.evaluate(()=>abrirBancoSaldo('9991'));
   await p.locator('input[name="bs-membro"][value="9992"]').check();aceitar=false;await p.evaluate(()=>salvarBancoSaldo(false));aceitar=true;
   assert.equal(await p.evaluate(()=>JSON.stringify(DB)),antes);
   await p.evaluate(()=>{guardarVersoes=async()=>false;});await p.evaluate(()=>salvarBancoSaldo(false));assert.equal(await p.evaluate(()=>JSON.stringify(DB)),antes);
   await p.evaluate(()=>{guardarVersoes=async json=>{window.versaoAnterior=JSON.parse(json);return true;};});
  });
  await check('saldo comum tem um único total e um único extrato; uso separado debita o titular',async()=>{
   await p.locator('#bs-creditos').fill('7');await p.locator('#bs-repos').fill('2');await p.evaluate(()=>salvarBancoSaldo(false));
   assert.equal(await p.evaluate(()=>window.versaoAnterior.alunos[1].creditos),4);
   assert.deepEqual((await valores()).map(a=>a.c),[7,0,4]);
   await marcar('e1');await marcar('e2');const vs=await valores();assert.equal(vs[0].c,5);assert.equal(vs[1].ef,5);assert.equal(vs[1].c,0);
   const kpi=await p.evaluate(()=>({ids:titularesUnicos(DB.alunos,'creditos').map(a=>a.id),saldo:document.getElementById('k-creditos')?.textContent,rep:reposResumoHoje().pend,ext:saldoPeloExtrato(DB.alunos[0],'creditos'),deb:DB.movs.filter(m=>m.participanteId==='9992').length}));
   assert.deepEqual(kpi.ids,['9991','9993']);assert.equal(kpi.rep,2);assert.equal(kpi.ext,5);assert.ok(kpi.deb>0);
   await marcar('e2');assert.equal((await valores())[0].c,6);await marcar('e1');assert.equal((await valores())[0].c,7);
   assert.equal(await p.evaluate(()=>alunoPublicado(DB.alunos[1]).creditos),7);
  });
  await check('fechamento mensal mostra o saldo compartilhado sem alterar valores negociados',async()=>{
   const r=await p.evaluate(()=>{const a=DB.alunos[0],antes=JSON.stringify(DB);document.getElementById('fc-aluno').innerHTML='<option value="9991">Titular Fictício</option>';document.getElementById('fc-mes').innerHTML='<option value="2026-11">Novembro</option>';renderFechamento();return {txt:document.getElementById('fech-export').textContent,igual:antes===JSON.stringify(DB)};});
   assert.equal(r.igual,true);assert.match(r.txt,/Créditos atuais do plano/);assert.match(r.txt,/Total de aulas a usar/);
  });
  await check('participante vê saldo efetivo sem editar ou renovar novamente o total',async()=>{
   await p.evaluate(()=>openAlunoModal('9992'));assert.equal(await p.locator('#a-creditos').inputValue(),'7');assert.equal(await p.locator('#a-creditos').evaluate(e=>e.readOnly),true);
   await p.evaluate(()=>saveAluno());assert.deepEqual((await valores()).map(a=>a.c),[7,0,4]);
   const antes=await p.evaluate(()=>JSON.stringify(DB));await p.evaluate(()=>renovarMes('9992'));assert.equal(await p.evaluate(()=>JSON.stringify(DB)),antes);
   assert.deepEqual((await p.evaluate(()=>rmLinhas().map(x=>x.a.id))).sort(),['9991','9993']);
  });
  await preparar();
  await p.evaluate(()=>{DB.alunos[0].bancosSaldos={aulas:{membros:['9991','9992'],modo:'horario'}};DB.alunos[1].creditos=0;DB.agenda.eventos[1].hora='18:00';});
  await check('aula conjunta desconta uma vez; estorno só quando sai a última presença',async()=>{
   await marcar('e1');await marcar('e2');assert.equal((await valores())[0].c,3);assert.equal(await p.evaluate(()=>DB.presencas.length),2);
   await marcar('e1');assert.equal((await valores())[0].c,3);await marcar('e2');assert.equal((await valores())[0].c,4);
   await marcar('e2');await marcar('e1');assert.equal((await valores())[0].c,3);await marcar('e2');await marcar('e1');assert.equal((await valores())[0].c,4);
   assert.equal(await p.evaluate(()=>saldoPeloExtrato(DB.alunos[0],'creditos')),4);
  });
  await preparar();
  await p.evaluate(()=>{DB.alunos[0].locCred=4;DB.alunos[0].bancosSaldos={locacao:{membros:['9991','9992'],modo:'horario'}};DB.agenda.eventos.forEach(e=>{e.tipo='locacao';e.hora='18:00';});});
  await check('locação compartilhada usa uma hora física e preserva créditos de aula',async()=>{
   await marcar('e1');await marcar('e2');assert.deepEqual((await valores()).map(a=>a.l),[3,0,0]);assert.deepEqual((await valores()).map(a=>a.c),[4,4,4]);
   await marcar('e2');await marcar('e1');assert.equal((await valores())[0].l,4);
  });
  await preparar();
  await check('modalidade da reposição independe do pacote particular atual',async()=>{
   const r=await p.evaluate(()=>{const a=DB.alunos[0];a.creditos=2;a.repos=1;a.reposModalidade='grupo';const part=calcularDebito(a,ordemDoDebito(a,false,true).ordem,'creditos',1),grp=calcularDebito(a,ordemDoDebito(a,true,true).ordem,'credGrupo',1);return {part,grp,pub:alunoPublicado(a)};});
   assert.deepEqual(r.part.partes,{creditos:1});assert.deepEqual(r.grp.partes,{repos:1});assert.equal(r.pub.reposModalidade,'grupo');
  });
  await check('4 meses exatos, mês curto e data desconhecida; correção não reinicia prazo',async()=>{
   const r=await p.evaluate(()=>{const a=DB.alunos[0];a.repos=3;a.reposValidade='ultima-falta';a.reposUltimaFalta='2026-07-12';const ate=reposPorIdade(a,'2026-11-12'),depois=reposPorIdade(a,'2026-11-13');corrigirSaldo(a,'repos',4,'Correção manual no cadastro');const data=ultimaFaltaRepos(a),venc=reposPorIdade(a,'2026-11-13');a.reposUltimaFalta='';return {ate,depois,data,venc,semData:reposPorIdade(a,'2027-10-01'),curto:somarMesesData('2026-10-31',4),invalida:dataReposValida('2026-02-31')};});
   assert.equal(r.ate.validas,3);assert.equal(r.depois.vencidas,3);assert.equal(r.data,'2026-07-12');assert.equal(r.venc.vencidas,4);assert.equal(r.semData.validas,4);assert.equal(r.curto,'2027-02-28');assert.equal(r.invalida,false);
  });
  await check('última falta renova todo o saldo; desfazer anotação restaura a data anterior',async()=>{
   const r=await p.evaluate(()=>{const a=DB.alunos[0];a.reposUltimaFalta='2026-07-12';mover(a,'repos',1,'Reposição anotada','anot-ficticia');DB.movs.at(-1).reposData='2026-10-01';const nova={data:ultimaFaltaRepos(a),q:reposValidas(a)};desfazerAnotacao(a.id,'repos','anot-ficticia');return {nova,anterior:ultimaFaltaRepos(a),r:reposValidas(a)};});
   assert.equal(r.nova.data,'2026-10-01');assert.equal(r.nova.q,5);assert.equal(r.anterior,'2026-07-12');assert.equal(r.r,4);
  });
  await preparar();
  await check('a duração é informada em minutos pela tela, com cópia anterior e bloqueio após o débito',async()=>{
   await p.evaluate(()=>{slotCtx={date:agDate,hora:'18:00'};});promptResposta='100';
   await p.evaluate(()=>editarDuracaoAula('e1'));promptResposta=undefined;
   assert.equal(await p.evaluate(()=>creditoDaEntrada(DB.agenda.eventos[0],agDate)*60),100);
   await marcar('e1');const antes=await p.evaluate(()=>JSON.stringify(DB));promptResposta='60';await p.evaluate(()=>editarDuracaoAula('e1'));promptResposta=undefined;assert.equal(await p.evaluate(()=>JSON.stringify(DB)),antes);await marcar('e1');
  });
  await preparar();
  await p.evaluate(()=>{const a=DB.alunos[0];corrigirSaldo(a,'creditos',0);corrigirSaldo(a,'repos',220/60);a.reposValidade='ultima-falta';DB.agenda.eventos[0].repo=1;DB.duracoesAulas[presId(DB.agenda.eventos[0],agDate)]=100;});
  await check('220 minutos menos uma aula de 100 minutos deixa exatamente 2 horas',async()=>{
   await marcar('e1');const r=await p.evaluate(()=>({saldo:DB.alunos[0].repos,custo:DB.presencas[0].custo,txt:fmtCred(DB.presencas[0].custo),ext:saldoPeloExtrato(DB.alunos[0],'repos'),fc:fcAulasDoMes(DB.alunos[0],'2026-11')[0]?.custo,pub:alunoPublicado(DB.alunos[0])}));
   assert.equal(r.saldo,2);assert.equal(r.ext,2);assert.equal(r.txt,'1h40');assert.ok(Math.abs(r.custo-100/60)<1e-8);assert.ok(Math.abs(r.fc-100/60)<1e-8);assert.equal(r.pub.reposValidas,2);
   await marcar('e1');assert.ok(Math.abs((await valores())[0].r-220/60)<1e-8);
   const antes=await p.evaluate(()=>DB.alunos[0].repos);await marcar('e1');await marcar('e1');assert.equal((await valores())[0].r,antes);
  });
  await check('exportação e leitura preservam campos novos sem migração automática',async()=>{
   const r=await p.evaluate(()=>{const json=JSON.stringify(DB);DB=JSON.parse(json);ensureFields();return {m:DB.duracoesAulas,r:DB.alunos[0].repos,policy:DB.alunos[0].reposValidade};});
   assert.equal(Object.values(r.m)[0],100);assert.equal(r.policy,'ultima-falta');assert.ok(Math.abs(r.r-220/60)<1e-8);
  });
  await check('telas novas cabem no celular e permitem conferir os totais',async()=>{
   await p.evaluate(()=>{abrirBancoSaldo('9991');document.getElementById('bs-creditos').value=7;document.getElementById('bs-repos').value=2;document.querySelector('input[name="bs-membro"][value="9992"]').checked=true;});
   for(const width of [320,390]){await p.setViewportSize({width,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
   if(process.env.JV_PREVIEWS){fs.mkdirSync(process.env.JV_PREVIEWS,{recursive:true});await p.setViewportSize({width:390,height:1100});const estiloPrevia=await p.addStyleTag({content:'.page,.top,.nav{visibility:hidden!important}'});await p.locator('#ov-banco-saldo .modal').screenshot({path:path.join(process.env.JV_PREVIEWS,'saldo-compartilhado'+(process.env.JV_MOTOR==='webkit'?'-webkit':'')+'.png'),animations:'disabled'});await estiloPrevia.evaluate(el=>el.remove());}
   await p.evaluate(()=>closeModal('ov-banco-saldo'));
  });
  await preparar();
  await check('chuva atualiza a última falta sem conceder outra aula e cancela uma aula conjunta uma vez',async()=>{
   await p.evaluate(()=>{const a=DB.alunos[0];a.reposValidade='ultima-falta';a.reposUltimaFalta='2026-07-12';a.repos=2;a.bancosSaldos={aulas:{membros:['9991','9992'],modo:'horario'}};DB.alunos[1].creditos=0;DB.agenda.eventos[1].hora='18:00';});
   await marcar('e1');await marcar('e2');
   const r=await p.evaluate(()=>{aplicarChuva(agDate,'18:00');return {c:DB.alunos[0].creditos,r:DB.alunos[0].repos,data:ultimaFaltaRepos(DB.alunos[0]),n:DB.presencas.length};});
   assert.deepEqual(r,{c:4,r:2,data:'2026-11-12',n:0});
  });
  await preparar();
  await check('ao mover uma aula de 100 minutos, duração e estorno acompanham a presença do participante',async()=>{
   await p.evaluate(()=>{const a=DB.alunos[0];a.bancosSaldos={aulas:{membros:['9991','9992'],modo:'pessoa'}};DB.alunos[1].creditos=0;DB.duracoesAulas[presId(DB.agenda.eventos[1],agDate)]=100;});
   await marcar('e2');await p.evaluate(()=>moverEntrada('e2','2026-11-12','17:00'));await marcar('e2');
   assert.equal((await valores())[0].c,4);
   assert.equal(await p.evaluate(()=>creditoDaEntrada(DB.agenda.eventos.find(e=>e.id==='e2'),agDate)*60),100);
   await marcar('e2');assert.ok(Math.abs((await valores())[0].c-(4-100/60))<1e-8);await marcar('e2');assert.equal((await valores())[0].c,4);
  });
  await preparar();
  await check('reposição sem data confirmada preserva saldo; anotação desfeita não cria outra validade',async()=>{
   const r=await p.evaluate(()=>{const a=DB.alunos[0];a.reposValidade='ultima-falta';a.reposUltimaFalta='2026-06-01';a.repos=2;mover(a,'repos',1,'Reposição anotada','anot-sem-data');DB.movs.at(-1).reposDataDesconhecida=true;const valida=reposValidas(a);desfazerAnotacao(a.id,'repos','anot-sem-data');return {valida,depois:reposValidas(a),data:ultimaFaltaRepos(a)};});
   assert.deepEqual(r,{valida:3,depois:0,data:'2026-06-01'});
  });
  await preparar();
  await check('desfazer configuração restaura os saldos de origem e impede conflitos entre bancos',async()=>{
   await p.evaluate(()=>{toastDesfazer=(t,fn)=>window.desfazerBancoTeste=fn;abrirBancoSaldo('9991');});
   await p.locator('input[name="bs-membro"][value="9992"]').check();await p.locator('#bs-creditos').fill('6');await p.evaluate(()=>salvarBancoSaldo(false));
   assert.equal((await valores())[0].c,6);assert.match(await p.evaluate(()=>validarBancoSaldo(DB.alunos[2],'aulas',['9993','9992'],'pessoa',{creditos:6,repos:0})),/já participa/);
   await p.evaluate(()=>window.desfazerBancoTeste());assert.deepEqual((await valores()).map(x=>x.c),[4,4,4]);assert.equal(await p.evaluate(()=>bancoSaldo(DB.alunos[1],'creditos')),null);
  });
  await preparar();
  await check('estorno de aula anterior ao compartilhamento volta ao saldo comum visível',async()=>{
   await marcar('e2');await p.evaluate(()=>abrirBancoSaldo('9991'));
   await p.locator('input[name="bs-membro"][value="9992"]').check();await p.locator('#bs-creditos').fill('7');await p.evaluate(()=>salvarBancoSaldo(false));
   await marcar('e2');const vs=await valores();assert.equal(vs[0].c,8);assert.equal(vs[1].c,0);assert.equal(vs[1].ef,8);
  });
  await preparar();
  await check('locação conjunta pelo cartão exige horário e não duplica a baixa do casal',async()=>{
   await p.evaluate(()=>{DB.alunos[0].locCred=4;DB.alunos[0].bancosSaldos={locacao:{membros:['9991','9992'],modo:'horario'}};});
   const antes=await p.evaluate(()=>JSON.stringify(DB));await p.evaluate(()=>{usarLocacao('9991');usarLocacao('9992');});assert.equal(await p.evaluate(()=>JSON.stringify(DB)),antes);
  });
  await preparar();
  await check('alterar o formulário enquanto a cópia é salva cancela a configuração antiga',async()=>{
   await p.evaluate(()=>abrirBancoSaldo('9991'));await p.locator('input[name="bs-membro"][value="9992"]').check();await p.locator('#bs-creditos').fill('7');
   const antes=await p.evaluate(()=>JSON.stringify(DB));
   await p.evaluate(()=>{guardarVersoes=()=>new Promise(resolve=>window.terminarCopiaTeste=resolve);window.salvamentoTeste=salvarBancoSaldo(false);});
   await p.locator('#bs-creditos').fill('8');await p.evaluate(async()=>{window.terminarCopiaTeste(true);await window.salvamentoTeste;});assert.equal(await p.evaluate(()=>JSON.stringify(DB)),antes);
  });
  await preparar();
  await check('falha na cópia anterior é tratada sem erro na página ou alteração do banco',async()=>{
   await p.evaluate(()=>abrirBancoSaldo('9991'));await p.locator('input[name="bs-membro"][value="9992"]').check();
   const antes=await p.evaluate(()=>JSON.stringify(DB));await p.evaluate(async()=>{guardarVersoes=async()=>{throw Error('Falha fictícia na cópia');};await salvarBancoSaldo(false);});assert.equal(await p.evaluate(()=>JSON.stringify(DB)),antes);
  });
  async function nuvemFicticiaVoz(){await p.evaluate(()=>{
   JVAcoesVoz.fechar(true);document.querySelectorAll('.overlay.on').forEach(el=>el.classList.remove('on'));if(fichaId)fecharFicha();hideVals=false;window.AUTH_USER={uid:UID_DONO};window._espacoAberto=true;hasCloud=()=>true;_abriuSemConferir=false;_semDados=false;_nuvemMuda=false;_conflitoNuvem=null;cloudPending=false;_salvamentoEmCurso=null;syncing=false;
   window.retratoTeste=()=>({agenda:JSON.stringify(DB.agenda),alunos:Object.fromEntries(DB.alunos.map(a=>[a.id,JSON.stringify(a)])),config:JSON.stringify({mesCreditos:DB.mesCreditos,horarioCfg:DB.horarioCfg,horarioData:DB.horarioData}),carimbos:{savedAt:Date.now()}});
   window.noVozTeste=window.retratoTeste();_basePartes=JSON.parse(JSON.stringify(window.noVozTeste));_basePartesLida=true;
   window.fbDB={ref:cam=>({get:async()=>cam===RAIZ+'/'+V2?{exists:()=>true,val:()=>window.noVozTeste}:{exists:()=>false,val:()=>null}})};
   gravarAgora=async()=>{window.noVozTeste=window.retratoTeste();_basePartes=JSON.parse(JSON.stringify(window.noVozTeste));cloudPending=false;return true;};
   syncRequests=async()=>{};publicarMapaQuadra=()=>{};guardarMetaProtecao=()=>{};MAPA_OUTROS={};_mapaLido='';JVAcoesVoz.abrir();
  });}
  async function pedirVoz(texto){await p.locator('#voz-texto').fill(texto);await p.evaluate(()=>JVAcoesVoz.analisar());}
  await preparar();
  await check('consulta por voz informa o mesmo saldo comum que o cartão e a publicação',async()=>{
   await p.evaluate(()=>{DB.alunos[0].creditos=7;DB.alunos[0].bancosSaldos={aulas:{membros:['9991','9992'],modo:'pessoa'}};DB.alunos[1].creditos=0;});
   await nuvemFicticiaVoz();await pedirVoz('Quantos créditos Participante Fictício tem?');assert.match(await p.locator('#voz-consulta-resumo').innerText(),/7 créditos/);await p.evaluate(()=>JVAcoesVoz.fechar(true));
  });
  await preparar();
  await check('prévia e execução de presenças por voz consomem o saldo comum uma vez por pessoa',async()=>{
   await p.evaluate(()=>{DB.alunos[0].creditos=7;DB.alunos[0].bancosSaldos={aulas:{membros:['9991','9992'],modo:'pessoa'}};DB.alunos[1].creditos=0;DB.agenda.eventos[0].hora='09:00';DB.agenda.eventos[1].hora='10:00';});
   await nuvemFicticiaVoz();await pedirVoz('Marcar presença de todos de hoje');const txt=await p.locator('#voz-previa').innerText();assert.doesNotMatch(txt,/extra a cobrar/);assert.match(txt,/7 → 6/);assert.match(txt,/6 → 5/);
   await p.evaluate(()=>JVAcoesVoz.executar());assert.equal((await valores())[0].c,5);assert.equal((await valores())[1].c,0);await p.evaluate(()=>JVAcoesVoz.fechar(true));
  });
  await preparar();
  await check('prévia por voz conserva os cem minutos da aula de reposição',async()=>{
   await p.evaluate(()=>{const a=DB.alunos[0];a.creditos=0;a.repos=220/60;a.reposValidade='ultima-falta';DB.agenda.eventos=DB.agenda.eventos.slice(0,1);DB.agenda.eventos[0].hora='09:00';DB.agenda.eventos[0].repo=1;DB.duracoesAulas[presId(DB.agenda.eventos[0],agDate)]=100;});
   await nuvemFicticiaVoz();await pedirVoz('Marcar presença do Titular Fictício hoje');assert.match(await p.locator('#voz-previa').innerText(),/Reposições 3h40 → 2(?:\s|$)/i);await p.evaluate(()=>JVAcoesVoz.fechar(true));
  });
  await preparar();
  await check('mesmo horário com professores diferentes representa duas aulas no saldo comum',async()=>{
   await p.evaluate(()=>{DB.alunos[0].bancosSaldos={aulas:{membros:['9991','9992'],modo:'horario'}};DB.alunos[1].creditos=0;DB.agenda.eventos.forEach(e=>e.hora='09:00');DB.agenda.eventos[0].profId='prof-ficticio-1';DB.agenda.eventos[1].profId='prof-ficticio-2';});
   await marcar('e1');await marcar('e2');assert.equal((await valores())[0].c,2);await marcar('e1');await marcar('e2');assert.equal((await valores())[0].c,4);
  });
  await preparar();
  await check('desvincular o banco não mistura uma nova aula individual com a antiga aula conjunta',async()=>{
   await p.evaluate(()=>{DB.alunos[0].bancosSaldos={aulas:{membros:['9991','9992'],modo:'horario'}};DB.alunos[1].creditos=0;DB.agenda.eventos[1].hora='18:00';});
   await marcar('e1');await marcar('e2');await p.evaluate(()=>delete DB.alunos[0].bancosSaldos.aulas);
   await marcar('e2');await marcar('e2');assert.deepEqual((await valores()).slice(0,2).map(a=>a.c),[3,-1]);
   await marcar('e1');assert.deepEqual((await valores()).slice(0,2).map(a=>a.c),[4,-1]);await marcar('e2');assert.deepEqual((await valores()).slice(0,2).map(a=>a.c),[4,0]);
  });
  await preparar();
  await check('plano misto do titular conserva cada modalidade mesmo com pacote único no participante',async()=>{
   const r=await p.evaluate(()=>{DB.pacoteUnico={ativo:true};const a=DB.alunos[0],b=DB.alunos[1];a.plano=2;a.planoGrupo=3;a.creditos=2;a.credGrupo=3;a.bancosSaldos={aulas:{membros:[a.id,b.id],modo:'pessoa'}};b.creditos=0;const pub=alunoPublicado(b),o=ordemDoDebito(b,true,false);debitarDoBanco(b,o.ordem,o.campoTipo,1,'fict-misto');return {pub,c:a.creditos,g:a.credGrupo};});
   assert.equal(r.pub.creditos,2);assert.equal(r.pub.credGrupo,3);assert.equal(r.pub.planoGrupo,3);assert.equal(r.c,2);assert.equal(r.g,2);
  });
  await preparar();
  await check('mover uma parte da aula conjunta confirmada é barrado antes de mudar a agenda',async()=>{
   await p.evaluate(()=>{DB.alunos[0].bancosSaldos={aulas:{membros:['9991','9992'],modo:'horario'}};DB.alunos[1].creditos=0;DB.agenda.eventos[1].hora='18:00';});await marcar('e1');await marcar('e2');
   const antes=await p.evaluate(()=>JSON.stringify(DB));await p.evaluate(()=>moverEntrada('e1','2026-11-12','17:00'));assert.equal(await p.evaluate(()=>JSON.stringify(DB)),antes);
  });
  await preparar();
  await check('mover o dia inteiro leva a aula conjunta e mantém uma única baixa e um único estorno',async()=>{
   await p.evaluate(()=>{DB.alunos[0].bancosSaldos={aulas:{membros:['9991','9992'],modo:'horario'}};DB.alunos[1].creditos=0;DB.agenda.eventos[1].hora='18:00';});await marcar('e1');await marcar('e2');
   await p.evaluate(()=>{moverDia('2026-11-12','2026-11-13');agDate=new Date('2026-11-13T12:00:00');});assert.equal((await valores())[0].c,3);
   assert.equal(await p.evaluate(()=>DB.presencas.every(p=>p.bancoRef.includes('|2026-11-13|'))),true);await marcar('e1');assert.equal((await valores())[0].c,3);await marcar('e2');assert.equal((await valores())[0].c,4);
  });
  await preparar();
  await check('nova presença após mover uma aula conjunta reconhece o débito que já foi feito',async()=>{
   await p.evaluate(()=>{DB.alunos[0].bancosSaldos={aulas:{membros:['9991','9992'],modo:'horario'}};DB.alunos[1].creditos=0;});await marcar('e1');
   await p.evaluate(()=>{moverEntrada('e1','2026-11-12','17:00');DB.agenda.eventos.find(e=>e.id==='e2').hora='17:00';});await marcar('e2');assert.equal((await valores())[0].c,3);await marcar('e1');await marcar('e2');assert.equal((await valores())[0].c,4);
  });
  await preparar();
  await check('mover um fixo só naquela data preserva reposição, grupo, professor e duração',async()=>{
   const eid=await p.evaluate(()=>{const a=DB.alunos[0];a.tipo='Dupla';a.plano=0;a.planoGrupo=4;a.reposValidade='ultima-falta';a.reposModalidade='grupo';corrigirSaldo(a,'creditos',0);corrigirSaldo(a,'repos',220/60);DB.agenda.eventos=[];DB.agenda.fixos=[{id:'fixo-minutos',alunoId:a.id,titulo:a.nome,dia:4,hora:'09:00',tipo:'grupo',repo:1,pessoas:2,duracaoMin:100,profId:'prof-ficticio',desde:'2026-11-01'}];moverDia('2026-11-12','2026-11-13');agDate=new Date('2026-11-13T12:00:00');return DB.agenda.eventos[0].id;});
   const meta=await p.evaluate(()=>{const e=DB.agenda.eventos[0];return {repo:e.repo,pessoas:e.pessoas,min:e.duracaoMin,prof:e.profId};});assert.deepEqual(meta,{repo:1,pessoas:2,min:100,prof:'prof-ficticio'});
   await marcar(eid);assert.equal((await valores())[0].r,2);assert.equal(await p.evaluate(()=>saldoPeloExtrato(DB.alunos[0],'repos')),2);
  });
  await preparar();
  await check('prévia por voz de aula conjunta mostra duas presenças e uma única baixa',async()=>{
   await p.evaluate(()=>{DB.alunos[0].creditos=7;DB.alunos[0].bancosSaldos={aulas:{membros:['9991','9992'],modo:'horario'}};DB.alunos[1].creditos=0;DB.agenda.eventos.forEach(e=>e.hora='09:00');});
   await nuvemFicticiaVoz();await pedirVoz('Marcar presença de todos de hoje');const txt=await p.locator('#voz-previa').innerText();assert.match(txt,/7 → 6/);assert.doesNotMatch(txt,/6 → 5/);assert.match(txt,/saldo compartilhado já incluído/);
   await p.evaluate(()=>JVAcoesVoz.executar());assert.equal((await valores())[0].c,6);assert.equal(await p.evaluate(()=>DB.presencas.length),2);await p.evaluate(()=>JVAcoesVoz.fechar(true));
  });
  await preparar();
  await check('uma falta posterior confirmada define validade sem inventar a data da falta antiga',async()=>{
   const r=await p.evaluate(()=>{const a=DB.alunos[0];a.reposValidade='ultima-falta';a.reposUltimaFalta='2026-06-01';corrigirSaldo(a,'repos',2);mover(a,'repos',1,'Reposição anotada','anot-origem-incerta');DB.movs.at(-1).reposDataDesconhecida=true;const antes=vencimentoRepos(a);mover(a,'repos',1,'Reposição anotada','anot-origem-confirmada');DB.movs.at(-1).reposData='2026-11-12';const apos=vencimentoRepos(a),vencidas=reposPorIdade(a,'2027-03-13').vencidas;desfazerAnotacao(a.id,'repos','anot-origem-confirmada');return {antes,apos,vencidas,aposDesfazer:vencimentoRepos(a),incerta:DB.movs.find(m=>m.ref==='anot-origem-incerta').reposData||''};});
   assert.deepEqual(r,{antes:'',apos:'2027-03-12',vencidas:4,aposDesfazer:'',incerta:''});
  });
  await preparar();
  await check('juntar saldos pelo cadastro preserva os 140 minutos e a mensalidade negociada',async()=>{
   await p.evaluate(()=>{const a=DB.alunos[0];corrigirSaldo(a,'creditos',100/60);corrigirSaldo(a,'credGrupo',40/60);openAlunoModal(a.id);juntarSaldoCad();});await p.evaluate(()=>saveAluno());
   const r=await p.evaluate(()=>({c:DB.alunos[0].creditos,g:DB.alunos[0].credGrupo,m:DB.alunos[0].mensalidade,txt:fmtCred(DB.alunos[0].creditos)}));assert.ok(Math.abs(r.c*60-140)<1e-6);assert.equal(r.g,0);assert.equal(r.m,600);assert.equal(r.txt,'2h20');
  });
  await preparar();
  await check('valor combinado por mês permanece no histórico após editar a mensalidade atual',async()=>{
   await p.evaluate(()=>{const a=DB.alunos[0];a.valoresMensais={'2026-10':480,'2026-11':600};a.pagamentosExatos={'2026-10':{ajusteAnterior:0},'2026-11':{ajusteAnterior:0}};DB.lancamentos=[{id:'mens-out-fict',alunoId:a.id,cat:'mensalidade',mes:'2026-10',data:'2026-10-10',valor:480},{id:'mens-nov-fict',alunoId:a.id,cat:'mensalidade',mes:'2026-11',data:'2026-11-10',valor:600}];openAlunoModal(a.id);});
   await p.locator('#a-mensalidade').fill('650');await p.evaluate(()=>saveAluno());
   const r=await p.evaluate(()=>({out:situacaoMensalidade(DB.alunos[0],'2026-10'),nov:situacaoMensalidade(DB.alunos[0],'2026-11'),fecho:fcDados(DB.alunos[0],'2026-10').total,pub:alunoPublicado(DB.alunos[0]).mensalidade,c:DB.alunos[0].creditos}));
   assert.equal(r.out.total,480);assert.equal(r.out.status,'pago');assert.equal(r.nov.total,650);assert.equal(r.nov.falta,50);assert.equal(r.fecho,480);assert.equal(r.pub,650);assert.equal(r.c,4);
  });
  await preparar();
  await check('pagamento confirmado sem dia reconhece a quitação sem criar movimento no caixa diário',async()=>{
   const r=await p.evaluate(()=>{const a=DB.alunos[0];a.mensalidade=520;a.valoresMensais={'2026-11':520};a.status='pendente';a.recebimentosSemData=[{id:'conf-sem-dia-fict',competencia:'2026-11',valor:520,confirmado:true}];const antes=JSON.stringify(DB),q=situacaoMensalidade(a,'2026-11'),pub=alunoPublicado(a);return {q,pub,igual:antes===JSON.stringify(DB),caixa:DB.lancamentos.length,c:a.creditos};});
   assert.equal(r.q.total,520);assert.equal(r.q.recebido,520);assert.equal(r.q.falta,0);assert.equal(r.q.status,'pago');assert.equal(r.pub.status,'pago');assert.equal(r.igual,true);assert.equal(r.caixa,0);assert.equal(r.c,4);
  });
  await preparar();
  await check('pagamento parcial datado soma ao confirmado sem dia sem contar o valor duas vezes',async()=>{
   await p.evaluate(()=>{const a=DB.alunos[0];a.mensalidade=540;a.valoresMensais={'2026-11':540};a.recebimentosSemData=[{id:'conf-sem-dia-fict',competencia:'2026-11',valor:520,confirmado:true}];registrarPagamento(a.id);});
   assert.equal(await p.locator('#pm-valor').inputValue(),'20.00');await p.evaluate(()=>salvarPagamentoExato());
   const r=await p.evaluate(()=>({q:situacaoMensalidade(DB.alunos[0],'2026-11'),anterior:DB.alunos[0].pagamentosExatos['2026-11'].ajusteAnterior,caixa:DB.lancamentos.map(l=>l.valor),c:DB.alunos[0].creditos}));
   assert.equal(r.q.recebido,540);assert.equal(r.q.status,'pago');assert.equal(r.anterior,0);assert.deepEqual(r.caixa,[20]);assert.equal(r.c,4);
  });
  await preparar();
  await check('localizar a data de um recebimento não duplica a receita já confirmada por competência',async()=>{
   const r=await p.evaluate(()=>{const a=DB.alunos[0];a.mensalidade=520;a.valoresMensais={'2026-11':520};a.recebimentosSemData=[{id:'conf-sem-dia-fict',competencia:'2026-11',valor:520,confirmado:true},{id:'conf-sem-dia-fict',competencia:'2026-11',valor:520,confirmado:true}];const antes=situacaoMensalidade(a,'2026-11');DB.lancamentos.push({id:'caixa-data-localizada-fict',recebimentoOrigemId:'conf-sem-dia-fict',cat:'mensalidade',alunoId:a.id,valor:520,mes:'2026-11',competenciaMensalidade:'2026-11',data:'2026-11-10'});return {antes,depois:situacaoMensalidade(a,'2026-11'),caixa:DB.lancamentos.length};});
   assert.equal(r.antes.recebido,520);assert.equal(r.depois.recebido,520);assert.equal(r.depois.status,'pago');assert.equal(r.caixa,1);
  });
  await preparar();
  await check('quitação sem recebimento de um mês antigo não vira dívida com o preço de hoje',async()=>{
   const r=await p.evaluate(()=>{const a=DB.alunos[0];a.mensalidade=700;a.pagamentosExatos={'2026-10':{ajusteAnterior:0,quitacaoSemRecebimentoEm:Date.now()}};const antes=JSON.stringify(DB),q=situacaoMensalidade(a,'2026-10');return {q,igual:antes===JSON.stringify(DB),c:a.creditos,caixa:DB.lancamentos.length};});
   assert.equal(r.q.total,0);assert.equal(r.q.recebido,0);assert.equal(r.q.status,'pago');assert.equal(r.igual,true);assert.equal(r.c,4);assert.equal(r.caixa,0);
  });
  const pub=await p.evaluate(()=>alunoPublicado(DB.alunos[0]));
  const aluno=await ctx.newPage();aluno.on('pageerror',e=>errors.push(e.message));await aluno.goto(base+'/app-aluno/',{waitUntil:'load'});await aluno.clock.setSystemTime(new Date('2026-11-12T12:00:00-03:00'));
  await check('App do Aluno respeita modalidade, minutos e vencimento diário sem nova publicação',async()=>{
   const r=await aluno.evaluate(pub=>{EU={...pub,reposValidade:'ultima-falta',reposModalidade:'grupo',reposVenceEm:'2026-11-12',repos:2,reposValidas:2};const hoje=saldoReposAluno();EU.reposVenceEm='2026-11-11';const vencido=saldoReposAluno();EU.reposVenceEm='';return {hoje,vencido,semData:saldoReposAluno(),grupo:reposServeAqui(true),part:reposServeAqui(false),txt:fmtCred(100/60)};},pub);
   assert.deepEqual(r,{hoje:2,vencido:0,semData:2,grupo:true,part:false,txt:'1h40'});
  });
  assert.deepEqual(errors,[]);assert.deepEqual(renders,[]);console.log('\n'+count+' verificações · 0 falhas');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());

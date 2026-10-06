/* Integração do plano família: dados fictícios, nenhum acesso externo. */
const { chromium } = require('playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = process.env.JV_PREVIEWS || require('node:os').tmpdir() + '/jv-premium-previews';
fs.mkdirSync(output, { recursive: true });
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server = http.createServer((req,res) => {
  let f = path.join(root, decodeURI(req.url.split('?')[0]));
  if (f.endsWith('/')) f += 'index.html';
  if (!f.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f)); }
  catch { res.writeHead(404).end('Missing'); }
});

const pessoas=[
 {id:'fam-p',codigo:'9901',nome:'Responsável de Teste',tipo:'Particular',plano:4,planoGrupo:0,creditos:2,repos:1,mensalidade:1200,status:'pendente',diaVenc:15,valorAula:160,ativo:true},
 {id:'fam-c',codigo:'9902',nome:'Filho de Teste',tipo:'Particular',plano:3,planoGrupo:0,creditos:1.5,repos:2,mensalidade:480,status:'pendente',diaVenc:10,valorAula:160,ativo:true},
 {id:'solo',codigo:'9904',nome:'Individual de Teste',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,repos:1,mensalidade:640,status:'pendente',diaVenc:10,valorAula:160,ativo:true}
];
const data={alunos:pessoas,lancamentos:[],meta:10000,agenda:{fixos:[],eventos:[],excecoes:[]},presencas:[],compromissos:[],aviso:'',savedAt:Date.now(),mesPagamentos:'2026-10',mesCreditos:'2026-10'};
let count=0;
async function check(label,test){await test();console.log('✅ '+label);count++;}
async function fit(p,width){
 const size=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(size.scroll<=width+1,JSON.stringify(size));
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.JV_BROWSER||undefined,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:852},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin!==base)return route.abort();
   if(url.pathname.includes('/lib/firebase-'))return route.fulfill({body:'',contentType:'text/javascript'});
   return route.continue();
  });
  await context.addInitScript(db=>{localStorage.setItem('jvtenis-gestao-v1',JSON.stringify(db));sessionStorage.setItem('jv-bk-adiar','1');},data);
  const p=await context.newPage(),errors=[],renderErrors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(/^Render .+ falhou:/.test(m.text()))renderErrors.push(m.text());});
  let acceptDialogs=true;
  p.on('dialog',d=>acceptDialogs?d.accept():d.dismiss());
  await p.goto(base+'/app-gestao/',{waitUntil:'load'});await p.waitForTimeout(6500);
  await p.evaluate(()=>{
   document.getElementById('splash-gestao').style.display='none';
   document.getElementById('barra-versao').style.display='none';
   document.querySelectorAll('.overlay.on').forEach(e=>e.classList.remove('on'));
   persist=()=>{};guardarVersoes=json=>{window.famBackup=JSON.parse(json);};logAct=()=>{};
   hideVals=false;renderAll();
  });
  await check('cancelar vínculo mantém mensalidade, créditos e cadastro intactos',async()=>{
   const before=await p.evaluate(()=>JSON.stringify(DB));
   await p.evaluate(()=>openAlunoModal('fam-c'));
   await p.locator('#a-responsavel').selectOption('fam-p');
   acceptDialogs=false;
   await p.evaluate(()=>saveAluno());
   acceptDialogs=true;
   assert.equal(await p.evaluate(()=>JSON.stringify(DB)),before);
   await p.evaluate(()=>closeModal('ov-aluno'));
  });
  await check('vincular filho mantém saldo e concentra cobrança após confirmação',async()=>{
   await p.evaluate(()=>openAlunoModal('fam-c'));
   await p.locator('#a-responsavel').selectOption('fam-p');
   await p.locator('#a-parentesco').selectOption('Filho(a)');
   assert.equal(await p.locator('#a-mensalidade').inputValue(),'0');
   assert.ok(await p.locator('#a-mensalidade').evaluate(e=>e.readOnly));
   assert.ok(await p.locator('#a-status').isDisabled());
   await p.evaluate(()=>saveAluno());
   const db=await p.evaluate(()=>({root:DB.alunos.find(a=>a.id==='fam-p'),child:DB.alunos.find(a=>a.id==='fam-c'),backup:window.famBackup,lanc:DB.lancamentos}));
   assert.equal(db.child.responsavelId,'fam-p');assert.equal(db.child.parentesco,'Filho(a)');
   assert.equal(db.child.mensalidade,0);assert.equal(db.child.familiaMensalidadeAnterior,480);
   assert.equal(db.root.mensalidade,1200);assert.equal(db.child.creditos,1.5);assert.equal(db.child.repos,2);
   assert.equal(db.backup.alunos.find(a=>a.id==='fam-c').mensalidade,480);assert.equal(db.lanc.length,0);
   assert.equal(await p.locator('#k-pendente').textContent(),await p.evaluate(()=>fmtRs(1840)));
   assert.match(await p.locator('#k-pendente-s').textContent(),/2 mensalidades/);
  });
  await check('cadastro do responsável mantém total familiar ao mudar aulas',async()=>{
   await p.evaluate(()=>openAlunoModal('fam-p'));
   assert.equal(await p.locator('#a-mensalidade').inputValue(),'1200');
   await p.locator('#a-plano').fill('6');await p.locator('#a-plano').dispatchEvent('change');
   assert.equal(await p.locator('#a-mensalidade').inputValue(),'1200');
   await p.evaluate(()=>closeModal('ov-aluno'));
  });
  await check('dependentes aparecem na ficha e têm acesso ao responsável',async()=>{
   await p.evaluate(()=>abrirFicha('fam-p'));
   assert.match(await p.locator('#fic-corpo').textContent(),/Filho de Teste/);
   assert.match(await p.locator('#fic-corpo').textContent(),/Mensalidade total/);
   for(const width of [320,390,1280]){await p.setViewportSize({width,height:852});await fit(p,width);}
   await p.evaluate(()=>abrirFicha('fam-c'));
   assert.match(await p.locator('#fic-corpo').textContent(),/pagamento por Responsável de Teste/);
   assert.equal(await p.locator('#fic-corpo button').filter({hasText:'Marcar pago'}).count(),0);
   await p.evaluate(()=>fecharFicha());
  });
  await check('Adicionar dependente já preenche o pagador e salva cônjuge sem dividir valor',async()=>{
   await p.evaluate(()=>novoDependenteFamilia('fam-p'));
   assert.equal(await p.locator('#a-responsavel').inputValue(),'fam-p');
   await p.locator('#a-nome').fill('Cônjuge de Teste');
   await p.locator('#a-parentesco').selectOption('Cônjuge');
   await p.evaluate(()=>saveAluno());
   const result=await p.evaluate(()=>({dep:DB.alunos.find(a=>a.nome==='Cônjuge de Teste'),root:DB.alunos.find(a=>a.id==='fam-p'),sum:DB.alunos.reduce((s,a)=>s+valorDoMes(a),0)}));
   assert.equal(result.dep.mensalidade,0);assert.equal(result.dep.responsavelId,'fam-p');assert.equal(result.dep.creditos,4);
   assert.equal(result.root.mensalidade,1200);assert.equal(result.sum,1840);
  });
  await check('vínculos inválidos não salvam nem alteram créditos',async()=>{
   const before=await p.evaluate(()=>JSON.stringify(DB));
   await p.evaluate(()=>{openAlunoModal('fam-p');document.getElementById('a-responsavel').innerHTML='<option value="fam-c">inválido</option>';document.getElementById('a-responsavel').value='fam-c';saveAluno();closeModal('ov-aluno');});
   assert.equal(await p.evaluate(()=>JSON.stringify(DB)),before);
   await p.evaluate(()=>{delAluno('fam-p');arquivarAluno('fam-p');});
   assert.equal(await p.evaluate(()=>JSON.stringify(DB)),before);
  });
  await check('pagamento único libera situação da família e não altera aulas',async()=>{
   const before=await p.evaluate(()=>DB.alunos.map(a=>[a.id,a.creditos,a.repos]));
   await p.evaluate(()=>{marcarPago('fam-p');salvarPagamentoExato();});
   const result=await p.evaluate(()=>({lanc:DB.lancamentos,child:statusFinanceiro(DB.alunos.find(a=>a.id==='fam-c')),all:DB.alunos.map(a=>[a.id,a.creditos,a.repos])}));
   assert.equal(result.lanc.length,1);assert.equal(result.lanc[0].valor,1200);assert.equal(result.lanc[0].alunoId,'fam-p');assert.equal(result.child,'pago');assert.deepEqual(result.all,before);
   await p.evaluate(()=>marcarPago('fam-c'));assert.equal(await p.evaluate(()=>DB.lancamentos.length),1);
   assert.equal(await p.locator('#k-pendente').textContent(),await p.evaluate(()=>fmtRs(640)));
  });
  let published;
  await check('publicação privada identifica família; legado oculta parentesco e nomes dos familiares',async()=>{
   published=await p.evaluate(()=>DB.alunos.map(alunoPublicado));
   const child=published.find(a=>a.codigo==='9902'),root=published.find(a=>a.codigo==='9901');
   assert.equal(child.status,'pago');assert.equal(child.ultimoPago,root.ultimoPago);assert.equal(child.diaVenc,15);assert.equal(child.creditos,1.5);
   assert.equal(root.familia.dependentes.length,2);
   const leg=await p.evaluate(pub=>publicacaoLegadaEnxuta({alunos:pub,historico:{}}),published);
   assert.deepEqual(leg.alunos.find(a=>a.codigo==='9902').familia,{papel:'dependente'});
  });
  await check('fechamento familiar reúne aulas e exibe saldos por pessoa',async()=>{
   await p.evaluate(()=>{
    const membros=[DB.alunos.find(a=>a.id==='fam-p'),...dependentesFamilia({id:'fam-p'})];
    DB.presencas=membros.map((a,i)=>({alunoId:a.id,k:'fc-test-'+i,data:monthKey()+'-01',hora:'08:00',tipo:'aula',manual:true,custo:i===1?.5:1}));
    irParaAba('fech');
    document.getElementById('fc-aluno').innerHTML='<option value="fam-p">Responsável</option>';document.getElementById('fc-aluno').value='fam-p';document.getElementById('fc-mes').value=monthKey();
    renderFechamento();
   });
   const report=await p.locator('#fech-export').textContent();
   assert.match(report,/Filho de Teste/);assert.match(report,/Cônjuge de Teste/);
   assert.equal(await p.evaluate(()=>fcDados(DB.alunos.find(a=>a.id==='fam-p'),monthKey()).aulas.length),3);
   assert.equal(await p.evaluate(()=>fcDados(DB.alunos.find(a=>a.id==='fam-p'),monthKey()).total),1200);
   for(const width of [320,390,1280]){await p.setViewportSize({width,height:852});await fit(p,width);}
  });
  await check('desvincular recupera valor individual e preserva histórico e saldos',async()=>{
   await p.evaluate(()=>openAlunoModal('fam-c'));
   await p.locator('#a-responsavel').selectOption('');
   assert.equal(await p.locator('#a-mensalidade').inputValue(),'480');
   assert.ok(!await p.locator('#a-mensalidade').evaluate(e=>e.readOnly));
   await p.evaluate(()=>saveAluno());
   const child=await p.evaluate(()=>DB.alunos.find(a=>a.id==='fam-c'));
   assert.equal(child.responsavelId,'');assert.equal(child.mensalidade,480);assert.equal(child.creditos,1.5);assert.equal(child.repos,2);
  });
  await check('Gestão sem exceções JavaScript',()=>{assert.deepEqual(errors,[]);assert.deepEqual(renderErrors,[]);});
  await p.close();
  const s=await context.newPage(),studentErrors=[];s.on('pageerror',e=>studentErrors.push(e.message));
  await s.goto(base+'/app-aluno/',{waitUntil:'load'});await s.waitForTimeout(6500);
  await s.evaluate(pub=>{
   EU=pub.find(a=>a.codigo==='9902');MEU={codigo:EU.codigo,pedidos:[],cancelados:[]};
   PUB={alunos:[EU],horas:['08:00','09:00','16:00','17:00','18:00'],grade:{fixos:[],eventos:[],excecoes:[]},pix:'teste@example.invalid',historico:{},aviso:''};
   VINCULO_ESTADO='ativo';_renovaAdiado=true;show();renderPayLock();
   window.famEnviados=[];filaPush=async(k,v)=>{window.famEnviados.push({k,v});};hasCloud=()=>true;
  },published);
  await check('aluno dependente vê pagador e saldos próprios, sem cobrança separada',async()=>{
   for(const width of [320,390,1280]){
    await s.setViewportSize({width,height:852});await fit(s,width);
    assert.equal(await s.locator('#home-cred').textContent(),'1,5');assert.equal(await s.locator('#home-repos').textContent(),'2');
    assert.match(await s.locator('#home-familia-info').textContent(),/Responsável de Teste/);
    assert.match(await s.locator('#home-mens').textContent(),/Incluída na família/);
    assert.ok(!await s.locator('#home-pix-btn').isVisible());
   }
   await s.evaluate(()=>goAluno('creditos',document.getElementById('nav-al-creditos')));
   assert.ok(await s.locator('#cred-page-familia').isVisible());assert.ok(!await s.locator('#pay-box').isVisible());assert.ok(!await s.locator('#cred-page-pix').isVisible());
   await s.evaluate(async()=>{pagarPix();pagarCartao();pagarDinheiro();confirmarRenovacao();await enviarPedido({kind:'mensalidade',valor:10});});
   assert.equal(await s.evaluate(()=>window.famEnviados.length),0);assert.ok(!await s.locator('#ov-pix').isVisible());
   assert.ok(await s.evaluate(()=>!bloqueadoPorPagamento()));
  });
  await check('pendência familiar orienta dependente sem pedir pagamento individual',async()=>{
   await s.evaluate(()=>{EU.status='pendente';EU.ultimoPago='2026-08';goAluno('agenda',document.getElementById('nav-al-agenda'));render();});
   assert.ok(await s.locator('#pay-lock').isVisible());
   assert.match(await s.locator('#pay-lock').textContent(),/responsável/);
   assert.equal(await s.locator('#pay-lock button.lock-pay').count(),0);
  });
  await check('pagador vê família e total único; aluno individual mantém Pix normal',async()=>{
   await s.evaluate(pub=>{EU=pub.find(a=>a.codigo==='9901');MEU.codigo=EU.codigo;PUB.alunos=[EU];show();goAluno('inicio',document.getElementById('nav-al-inicio'));},published);
   assert.equal(await s.evaluate(()=>valorMensalAtual()),1200);
   assert.match(await s.locator('#home-familia-info').textContent(),/Filho de Teste/);
   assert.ok(await s.locator('#home-pix-btn').isVisible());
   await s.evaluate(pub=>{EU=pub.find(a=>a.codigo==='9904');MEU.codigo=EU.codigo;PUB.alunos=[EU];show();goAluno('inicio',document.getElementById('nav-al-inicio'));},published);
   assert.ok(!await s.locator('#home-familia-info').isVisible());assert.ok(await s.locator('#home-pix-btn').isVisible());
  });
  await check('Aluno sem exceções JavaScript',()=>assert.deepEqual(studentErrors,[]));
  await context.close();console.log('\n'+count+' verificações de família no navegador · 0 falhas');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

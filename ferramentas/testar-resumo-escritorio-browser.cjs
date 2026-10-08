/* Resumo para o Escritório JV, no navegador, com dados FICTÍCIOS (nunca Firebase).
   Uso (da raiz): node ferramentas/testar-resumo-escritorio-browser.cjs [arquivo-json-de-saida]
   Prova que o resumo usa as contas do app (mês de hoje, responsável da família,
   inativo fora, aula além do pacote, reposição válida), que não muda nenhum dado
   e que valor oculto na tela não oculta o número do resumo. */
const {chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),saida=process.argv[2]||'';
const tipos={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURI(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
  if(!f.startsWith(root+path.sep)){r.writeHead(403).end();return;}
  try{r.setHeader('Content-Type',tipos[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));}catch{r.writeHead(404).end();}});
(async()=>{await new Promise(ok=>srv.listen(0,ok));const url='http://127.0.0.1:'+srv.address().port+'/app-gestao/index.html';
const b=await chromium.launch(process.env.JV_BROWSER?{executablePath:process.env.JV_BROWSER}:{});
const p=await b.newPage({viewport:{width:390,height:844}});let falhas=0;
const erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
await p.route(/firebaseio|googleapis|gstatic|open-meteo/,r=>r.abort());
const ok=(t,c,x)=>{console.log((c?'✅ ':'❌ ')+t+(c||x===undefined?'':' → '+JSON.stringify(x)));if(!c)falhas++;};
await p.goto(url,{waitUntil:'load'});await p.waitForTimeout(1500);
await p.evaluate(()=>{persist=()=>{};window.open=()=>null;hideVals=false;
  const base={tipo:'Particular',plano:4,planoGrupo:0,credGrupo:0,locCred:0,repos:0,diaVenc:10,mensalidade:640};
  DB.alunos=[
    {...base,id:'p1',nome:'Ana Maria Teste',creditos:3,status:'pendente',tel:'(41) 99999-0001'},
    {...base,id:'p2',nome:'Bruno Teste',creditos:2,status:'pago',tel:'41999990002'},
    {...base,id:'f1',nome:'Carla Responsavel Teste',creditos:4,status:'pendente',tel:'41999990003',mensalidade:900},
    {...base,id:'f2',nome:'Davi Dependente Teste',creditos:-1,status:'pendente',tel:'41999990004',responsavelId:'f1',mensalidade:0,valorAula:150},
    {...base,id:'n1',nome:'Gil Sem Preco Teste',plano:0,creditos:-2,status:'pendente',tel:'41999990006',mensalidade:0},
    {...base,id:'i1',nome:'Eva Inativa Teste',creditos:0,status:'pendente',tel:'41999990005',arquivado:true},
    {...base,id:'r1',nome:'Fabio Teste',creditos:1,repos:2,status:'parcial',tel:'',mensalidade:400}
  ];
  DB.lancamentos=[];DB.meta=5000;
  const s=document.getElementById('splash-gestao');if(s)s.style.display='none';renderAll();});
await p.addStyleTag({content:'#ov-entrar{display:none!important}'});
const antes=await p.evaluate(()=>JSON.stringify(DB));
const R=await p.evaluate(()=>resumoParaEscritorio());
const por=ref=>R.cobrancas.find(c=>c.ref===ref);
ok('formato e mês de hoje',R.formato==='jv-escritorio-resumo'&&R.versao===1&&R.mes===await p.evaluate(()=>mesReal())&&R.appVersao===await p.evaluate(()=>VERSAO),R);
ok('pendente entra com valor do app e telefone com país',por('p1')&&por('p1').valor===640&&por('p1').telefone==='5541999990001'&&por('p1').nome==='Ana T.',por('p1'));
ok('quem pagou não entra',!por('p2'));
ok('família: responsável entra marcado, dependente não',por('f1')&&por('f1').familia===true&&por('f1').valor===900&&!por('f2'),R.cobrancas);
ok('inativo não entra',!por('i1'));
ok('parcial: só o que falta, sem telefone quando não há',por('r1')&&por('r1').situacao==='parcial'&&por('r1').valor===200&&por('r1').telefone==='',por('r1'));
const ex=ref=>R.extras.find(x=>x.ref===ref);
ok('aula além do pacote do dependente, cobrada de quem paga',ex('f2')&&ex('f2').aulas===1&&ex('f2').valor===150&&ex('f2').pagador==='Carla T.'&&ex('f2').telefone==='5541999990003',R.extras);
ok('aula além do pacote sem preço cadastrado entra com valor 0 (não some)',ex('n1')&&ex('n1').aulas===2&&ex('n1').valor===0&&R.extras.length===2,R.extras);
ok('reposição válida',R.reposicoes.some(x=>x.ref==='r1'&&x.quantidade===2),R.reposicoes);
ok('totais batem com as listas',R.totais.mensalidadesPendentes===3&&R.totais.valorPendente===1740&&R.totais.alunosAtivos===5&&R.totais.meta===5000,R.totais);
ok('só primeiro nome e inicial: nenhum sobrenome completo',!JSON.stringify(R).includes('Maria')&&!JSON.stringify(R).includes('Responsavel'));
await p.evaluate(()=>{curMonth=(curMonth+11)%12;if(curMonth===11)curYear--;});
const R2=await p.evaluate(()=>resumoParaEscritorio());
ok('mês aberto na tela não muda o resumo (usa o mês de hoje)',R2.mes===R.mes&&R2.totais.valorPendente===R.totais.valorPendente,R2.totais);
await p.evaluate(()=>{hideVals=true;go('seg',document.createElement('button'));abrirFerr('esc-box',abrirResumoEscritorio);});await p.waitForTimeout(200);
const tela=await p.evaluate(()=>document.getElementById('esc-box').innerText);
ok('tela mascara valores e explica o caminho',tela.includes('R$ ••••')&&tela.includes('Dados da academia')&&tela.includes('Só leitura'),tela);
ok('resumo copiado não é mascarado',!JSON.stringify(await p.evaluate(()=>resumoParaEscritorio())).includes('••••'));
await p.evaluate(()=>{navigator.clipboard.writeText=t=>{window.__copiado=t;return Promise.resolve();};});
await p.evaluate(()=>copiarResumoEscritorio());await p.waitForTimeout(100);
ok('Copiar resumo põe o JSON na área de transferência',(await p.evaluate(()=>JSON.parse(window.__copiado||'{}').formato))==='jv-escritorio-resumo');
await p.evaluate(()=>{navigator.clipboard.writeText=()=>Promise.reject(new Error('negado'));});
await p.evaluate(()=>copiarResumoEscritorio());await p.waitForTimeout(100);
ok('sem permissão de copiar: mostra o texto para copiar à mão',await p.evaluate(()=>{const t=document.getElementById('esc-texto');return t&&t.style.display==='block'&&t.value.includes('jv-escritorio-resumo');}));
ok('nenhum dado mudou',await p.evaluate(()=>JSON.stringify(DB))===antes);
await p.evaluate(()=>{DB.mesCreditos='2000-01';});
ok('mês virado sem renovação gera aviso',(await p.evaluate(()=>resumoParaEscritorio())).avisos.some(a=>a.includes('renovação')));
ok('nenhum erro de página',erros.length===0,erros);
if(saida)fs.writeFileSync(saida,JSON.stringify(R));
await b.close();srv.close();console.log(falhas?'\n❌ '+falhas+' falha(s)':'\n✅ resumo do Escritório OK');process.exit(falhas?1:0);})().catch(e=>{console.log('❌ teste parou: '+String(e.message).split('\n')[0]);process.exit(1);});

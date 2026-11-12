/* Compatibilidade do pacote publicado: particular, grupo antigo/novo e misto.
   Testa os cartões visíveis, fala, resumo, agendamento e renovação. Só dados fictícios. */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-11-09T10:00:00-03:00');
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
 fs.writeFileSync(path.join(process.env.JV_VISUAL_DIR,n+'.png'),png);console.log('VISUAL_NAME '+n+' '+png.toString('base64'));
}
const b={codigo:'6701',nome:'Aluna Fictícia',repos:1,reposValidas:1,locCred:0,mensalidade:360,status:'pago',ativo:true,grupoTipo:''};
const ALUNOS={
 particular:{...b,tipo:'Particular',plano:4,creditos:3,mensalidade:640},
 particularZero:{...b,tipo:'Particular',plano:4,creditos:0},
 duplaAntiga:{...b,tipo:'Dupla',plano:'4',creditos:'4',credGrupo:'-1'},
 duplaAvulsaAntiga:{...b,tipo:'Dupla',creditos:3},
 duplaNova:{...b,tipo:'Dupla',plano:0,planoGrupo:4,grupoTipo:'Dupla',creditos:0,credGrupo:3},
 duplaNovaZero:{...b,tipo:'Dupla',plano:0,planoGrupo:4,grupoTipo:'Dupla',creditos:0,credGrupo:0},
 duplaNovaSobra:{...b,tipo:'Dupla',plano:0,planoGrupo:4,grupoTipo:'Dupla',creditos:1,credGrupo:3},
 misto:{...b,tipo:'Particular',plano:2,planoGrupo:2,grupoTipo:'Dupla',creditos:2,credGrupo:1,mensalidade:500},
 mistoZero:{...b,tipo:'Particular',plano:4,planoGrupo:4,grupoTipo:'Dupla',creditos:0,credGrupo:0,mensalidade:900},
 mistoNegativo:{...b,tipo:'Particular',plano:4,planoGrupo:4,grupoTipo:'Dupla',creditos:-1,credGrupo:3,mensalidade:900}
};
const PUBLICO={horas:['08:00','09:00'],profs:[],horarioCfg:{},horarioData:{},termoVer:0,historico:{},alunos:[],precos:{locacao:70},torneio:null,grade:{fixos:[],excecoes:[],eventos:[]}};
/* Publicador REAL da Gestão, com dependências de conta/dados substituídas.
   O contrato que o app recebe também precisa funcionar no pacote único antigo. */
const gestao=fs.readFileSync(path.join(root,'app-gestao/lib/app-gestao.js'),'utf8');
const publicador=gestao.slice(gestao.indexOf('function alunoPublicado('),gestao.indexOf('/* O app do aluno monta a grade'));
assert.ok(publicador.startsWith('function alunoPublicado('));
const unif=gestao.slice(gestao.indexOf('function ehMisto('),gestao.indexOf('/* Um pacote por aluno'));
const leituras=['grupoSaldo','bancoSaldo','titularSaldo','saldo','valorCombinadoEm'].map(nome=>{
 const ini=gestao.indexOf('function '+nome+'('),linha=gestao.indexOf('\n',ini);
 return gestao.slice(ini,linha).endsWith('}')?gestao.slice(ini,linha):gestao.slice(ini,gestao.indexOf('\n}',ini)+2);
}).join('\n');
const publicar=new Function('a','DB',unif+leituras+

 'const profDoAluno=()=>"",profNome=()=>"",reposValidas=a=>Number(a.reposValidas)||0,reposVencendo=()=>0;'+
 'const situacaoMensalidade=()=>({status:"pago",exato:false}),mesReal=()=>"2026-11",pagadorFamilia=a=>a,ehDependenteFamilia=()=>false,dadosFamiliaAluno=()=>null,serieMensal=()=>[];'+
 publicador+';return alunoPublicado(a);');
const html=fs.readFileSync(path.join(root,'app-aluno/index.html'),'utf8');
const cacheIni=html.indexOf("const sp=saldoPacoteAluno(),ck='jvt-prevcred-");
const cacheFim=html.indexOf('lsSet(ctx,tipo);',cacheIni);
assert.ok(cacheIni>=0&&cacheFim>cacheIni);
const cacheCodigo=html.slice(cacheIni,cacheFim+'lsSet(ctx,tipo);'.length);
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
 for(const [motor,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const tema of ['saibro','classico']){
    const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
    await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
    await c.addInitScript(tema=>{
     localStorage.setItem('jv-tema',tema);sessionStorage.setItem('jv-bk-adiar','1');
     window.__falas=[];window.SpeechSynthesisUtterance=class{constructor(t){this.text=t;}};
     Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},getVoices(){return [];},speak(u){__falas.push(u.text);}}});
    },tema);
    const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
    await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-aluno/',{waitUntil:'load'});
    await p.waitForFunction(()=>typeof render==='function'&&typeof saldoPacoteAluno==='function'&&window.JVVozAluno);
    await p.addStyleTag({content:'#feriado-box,#login,#barra-app,#barra-versao,#toast,[id*="splash"]{display:none!important}'});
    const abrir=async a=>{
     const r=await p.evaluate(({a,P})=>{
      init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-test';
      EU=a;P.alunos=[EU];PUB=P;MEU={codigo:EU.codigo,pedidos:[],cancelados:[],confirmadas:[]};VINCULO_ESTADO='ativo';
      JVVozAluno.fechar();document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
      if(!window.__slotOriginal)window.__slotOriginal=slotState;slotState=window.__slotOriginal;
      if(!window.__bloqOriginal)window.__bloqOriginal=bloqueadoParaAgendar;bloqueadoParaAgendar=window.__bloqOriginal;
      window.__toasts=[];toast=x=>__toasts.push(x);window.__falas=[];
      document.getElementById('app').style.display='block';goAluno('inicio',document.getElementById('nav-al-inicio'));
      const antes=JSON.stringify(EU);render();renderResumoMes();
      const sg=document.getElementById('scard-grupo'),cs=document.getElementById('cred-page-saldo');
      return {cred:document.getElementById('v-cred').textContent,plano:document.getElementById('v-plano').textContent,
       home:document.getElementById('home-cred').textContent,homeDetalhe:document.getElementById('home-cred-sub').textContent,
       pagina:cs.textContent,paginaDetalhe:cs.parentElement.querySelector('small').textContent,
       grupo:sg.style.display==='none'?null:sg.querySelector('.l').textContent+' '+document.getElementById('v-grupo').textContent,
       quadro:meuQuadro(),resumo:document.getElementById('aulas-mes-resumo').innerText,semMutacao:JSON.stringify(EU)===antes,
       repos:document.getElementById('home-repos').textContent,sp:saldoPacoteAluno()};
     },{a:JSON.parse(JSON.stringify(a)),P:JSON.parse(JSON.stringify(PUBLICO))});
     assert.equal(r.semMutacao,true,'renderização só lê');return r;
    };
    const voz=async()=>{
     await p.evaluate(()=>{JVVozAluno.abrir();document.getElementById('va-texto').value='quantos créditos eu tenho';JVVozAluno.enviar();});
     await p.waitForTimeout(700);
     const r=await p.evaluate(()=>({texto:document.getElementById('va-conversa').innerText,fala:__falas.at(-1)}));
     await p.evaluate(()=>JVVozAluno.fechar());return r;
    };
    const label=motor+'/'+tema+': ';
    await check(label+'particular antigo sem campos de grupo: todos os cartões e textos leem o mesmo saldo, zero não vira ausente',async()=>{
     let r=await abrir(ALUNOS.particular);assert.equal(r.home,'3');assert.equal(r.pagina,'3');assert.equal(r.cred,'3');assert.equal(r.grupo,null);assert.equal(r.plano,'Particular · Flex 4');
     assert.match(r.quadro,/3 crédito/);assert.match(r.resumo,/saldo: 3 créditos/);
     r=await abrir(ALUNOS.particularZero);assert.equal(r.home,'0');assert.equal(r.pagina,'0');
    });
    await check(label+'dupla antiga com números em texto: pacote continua em creditos e saldo negativo separado nunca é compensado',async()=>{
     const r=await abrir(ALUNOS.duplaAntiga);assert.equal(r.sp.campo,'creditos');assert.equal(r.home,'4');assert.equal(r.pagina,'4');assert.equal(r.grupo,'Aulas em grupo -1');
     assert.match(r.homeDetalhe,/outro saldo: -1 de grupo/);assert.match(r.paginaDetalhe,/-1 de grupo/);assert.equal(r.plano,'Dupla · Flex 4');
     await visual(p,'pacote-antigo-'+motor+'-'+tema);
    });
    await check(label+'legado sem planoGrupo nem plano preserva crédito avulso da dupla, sem inventar pacote',async()=>{
     const r=await abrir(ALUNOS.duplaAvulsaAntiga);assert.equal(r.home,'3');assert.equal(r.pagina,'3');assert.equal(r.plano,'Dupla · sem pacote');
    });
    await check(label+'dupla nova: pacote é grupo; sobra particular não infla o saldo do pacote nas telas visíveis',async()=>{
     let r=await abrir(ALUNOS.duplaNova);assert.equal(r.home,'3');assert.equal(r.pagina,'3');assert.equal(r.grupo,null);assert.equal(r.plano,'Dupla · Flex 4');
     r=await abrir(ALUNOS.duplaNovaSobra);assert.equal(r.home,'3');assert.equal(r.pagina,'3');assert.equal(r.grupo,'Aulas particulares 1');
     assert.match(r.homeDetalhe,/outro saldo: 1 particular/);assert.match(r.paginaDetalhe,/1 particular/);
    });
    await check(label+'misto: total e duas parcelas explícitas; negativo e zero de um tipo continuam visíveis e separados',async()=>{
     let r=await abrir(ALUNOS.misto);assert.equal(r.home,'3');assert.equal(r.pagina,'3');assert.match(r.homeDetalhe,/2 particulares \+ 1 de grupo/);assert.match(r.paginaDetalhe,/2 particulares \+ 1 de grupo/);
     assert.equal(r.cred,'2');assert.equal(r.grupo,'Aulas em grupo 1');assert.equal(r.plano,'Particular · Flex 2 + 2 em dupla');
     r=await abrir(ALUNOS.mistoNegativo);assert.equal(r.home,'2');assert.match(r.paginaDetalhe,/-1 particulares \+ 3 de grupo/);
     r=await abrir(ALUNOS.mistoZero);assert.equal(r.home,'0');assert.match(r.paginaDetalhe,/0 particulares \+ 0 de grupo/);
     await abrir(ALUNOS.misto);await p.evaluate(()=>goAluno('creditos',document.getElementById('nav-al-creditos')));await visual(p,'pacote-misto-'+motor+'-'+tema);
    });
    await check(label+'contrato real Gestão → publicação → aluno, com e sem pacote único, preserva particular, dupla antiga/nova e misto',async()=>{
     for(const ativo of [false,true])for(const nome of ['particular','duplaAntiga','duplaNova','misto','mistoNegativo']){
      const a=JSON.parse(JSON.stringify(ALUNOS[nome])),antes=JSON.stringify(a),publicado=publicar(a,{pacoteUnico:{ativo}});
      assert.equal(JSON.stringify(a),antes,'publicador não altera cadastro');
      const r=await abrir(publicado),misto=Number(a.plano)>0&&Number(a.planoGrupo)>0;
      const esperado=ativo&&!misto?(Number(a.creditos)||0)+(Number(a.credGrupo)||0):misto?(Number(a.creditos)||0)+(Number(a.credGrupo)||0):Number(a.planoGrupo)>0?Number(a.credGrupo):Number(a.creditos);
      assert.equal(r.home,String(esperado),nome+' unificado='+ativo);assert.equal(r.pagina,String(esperado));assert.equal(r.sp.misto,misto);
     }
    });
    await check(label+'resposta em texto e voz, resumo do mês e WhatsApp concordam com o pacote antigo, novo e misto',async()=>{
     for(const [nome,numero]of [['particular',3],['duplaAntiga',4],['duplaNova',3]]){
      const r=await abrir(ALUNOS[nome]),v=await voz();
      assert.match(v.texto,new RegExp('Você tem '+numero+' créditos'));assert.match(v.fala,new RegExp('Você tem '+numero+' créditos'));
      assert.match(r.quadro,new RegExp(numero+' crédito'));assert.match(r.resumo,new RegExp('saldo: '+numero+' créditos'));
     }
     const r=await abrir(ALUNOS.misto),v=await voz();assert.match(v.texto,/2 créditos, 1 de grupo/);assert.match(v.fala,/2 créditos, 1 de grupo/);assert.match(r.quadro,/2 crédito\(s\), 1 de grupo/);
    });
    await check(label+'aviso de crédito esgotado usa o tipo da aula: grupo disponível não paga particular, misto não mistura os dois',async()=>{
     const avisos=async(a,grupo)=>{
      await abrir(a);return p.evaluate(grupo=>{agDate=new Date('2026-11-11T12:00:00');slotState=()=>({st:'livre',grupo});bloqueadoParaAgendar=()=>false;__toasts=[];abrirBook('09:00',false,false);return __toasts.join('|');},grupo);
     };
     assert.doesNotMatch(await avisos(ALUNOS.duplaNova,true),/créditos acabaram/);
     assert.match(await avisos(ALUNOS.duplaNova,false),/créditos acabaram/);
     assert.match(await avisos(ALUNOS.duplaNovaZero,true),/créditos acabaram/);
     assert.doesNotMatch(await avisos(ALUNOS.duplaAntiga,true),/créditos acabaram/);
     assert.doesNotMatch(await avisos(ALUNOS.particular,false),/créditos acabaram/);
     assert.match(await avisos({...ALUNOS.misto,creditos:0},false),/créditos acabaram/);
     assert.doesNotMatch(await avisos({...ALUNOS.misto,creditos:0},true),/créditos acabaram/);
    });
    await check(label+'plano marcado na tabela respeita formato e quantidade, sem chamar uma parte do misto de plano completo',async()=>{
     await abrir(ALUNOS.duplaNova);let t=await p.evaluate(()=>{abrirPlanos();return document.querySelectorAll('#planos-list .sel').length;});assert.equal(t,1);
     await abrir({...ALUNOS.duplaNova,tipo:'Particular'});t=await p.evaluate(()=>{abrirPlanos();const el=document.querySelector('#planos-list .sel');return el&&el.getAttribute('onclick');});assert.match(t,/Dupla/);
     await abrir({...ALUNOS.misto,plano:4});t=await p.evaluate(()=>{abrirPlanos();return document.querySelectorAll('#planos-list .sel').length;});assert.equal(t,0);
    });
    await check(label+'renovação lê o valor combinado no cadastro, incluindo misto, zero e grupo novo; legado sem valor só usa tabela simples',async()=>{
     for(const [a,v]of [[{...ALUNOS.misto,plano:4},500],[{...ALUNOS.particular,mensalidade:590},590],[ALUNOS.duplaNova,360],[{...ALUNOS.particular,mensalidade:0},0],[{...ALUNOS.particular,valoresOcultos:true},0]]){
      await abrir(a);assert.equal(await p.evaluate(()=>valorMensalAtual()),v);
     }
     await abrir({...ALUNOS.duplaNova,mensalidade:null});assert.equal(await p.evaluate(()=>valorMensalAtual()),360);
     await abrir({...ALUNOS.misto,mensalidade:null});assert.equal(await p.evaluate(()=>valorMensalAtual()),0);
    });
    await check(label+'aviso de consumo não dispara na migração do leitor e passa a detectar débito de grupo no misto',async()=>{
     const r=await p.evaluate(codigo=>{
      const cache={'jvt-prevcred-ficticio':'4'},avisos=[],MEU={codigo:'ficticio'};let EU;
      const executar=new Function('MEU','saldoPacoteAluno','lsGet','lsSet','popupCreditos',codigo);
      const rodar=a=>{EU=a;executar(MEU,()=>saldoPacoteAluno(EU),k=>cache[k]??null,(k,v)=>{cache[k]=v;},(...a)=>avisos.push(a));};
      rodar({tipo:'Dupla',plano:0,planoGrupo:4,creditos:0,credGrupo:3});const migracao=avisos.length;
      rodar({tipo:'Dupla',plano:0,planoGrupo:4,creditos:0,credGrupo:2});
      rodar({tipo:'Particular',plano:2,planoGrupo:2,creditos:2,credGrupo:1});const troca=avisos.length;
      rodar({tipo:'Particular',plano:2,planoGrupo:2,creditos:2,credGrupo:0});
      return {migracao,troca,avisos};
     },cacheCodigo);assert.equal(r.migracao,0);assert.equal(r.troca,1);assert.deepEqual(r.avisos,[[1,2],[1,2]]);
    });
    await check(label+'leitura e toque em Créditos não alteram saldos; reposição válida e locação continuam separadas; sem rolagem lateral',async()=>{
     const a={...ALUNOS.mistoNegativo,repos:99,reposValidas:0,locCred:2};await abrir(a);
     const antes=await p.evaluate(()=>JSON.stringify(EU));
     await p.locator('#home-cred-card').click();assert.equal(await p.locator('#apg-creditos').isVisible(),true);
     assert.equal(await p.locator('#cred-page-repos').textContent(),'0');assert.equal(await p.locator('#cred-page-loc').textContent(),'2');
     for(const width of [320,390,520,1280]){await p.setViewportSize({width,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'rolagem lateral '+width);}
     assert.equal(await p.evaluate(()=>JSON.stringify(EU)),antes);await p.setViewportSize({width:390,height:844});
    });
    assert.deepEqual(erros,[],label+'erros de página');await c.close();
   }
  }finally{await browser.close();}
 }
 console.log('\n✅ '+count+' verificações de compatibilidade dos pacotes em Chromium/WebKit, nos dois temas.');
 }finally{server.close();}
})().catch(e=>{console.error('❌',e.stack||e);process.exitCode=1;server.close();});

/* Leitura (contraste) da Gestão em todas as abas e janelas, nos dois temas
   (Saibro e Verde clássico). O João achou o nome da agenda branco sobre o
   cartão branco em "Vincular nomes aos alunos" (19/10): esta varredura abre
   cada tela e janela com dados fictícios e mede cada texto pela imagem da
   tela (ferramentas/medir-contraste-pixels.cjs), não pelo CSS.
   Régua WCAG AA: 4,5:1 para texto normal e 3:1 para texto grande.
   JV_SHOTS=<pasta> salva a foto de cada tela; JV_CONTRASTE_LISTA=1 lista
   cada texto abaixo da régua; JV_CONTRASTE_JSON=<arquivo> grava tudo;
   JV_TELAS=a,b mede só essas telas. Nuvem simulada, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-21T15:30:00-03:00');   // quarta-feira
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
const SHOTS=process.env.JV_SHOTS||'';

/* ---------- academia fictícia com um pouco de tudo ---------- */
function montarDados(){
 const al=(id,nome,x)=>Object.assign({id,nome,codigo:id.replace(/\D/g,'').padStart(4,'7'),tipo:'Particular',plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:1,locCred:0,
  mensalidade:640,valorAula:160,status:'pendente',diaVenc:10,ativo:true,tel:'41999990000'},x||{});
 const nota=v=>({mov:{espera:v,prep:v,desloc:v,percep:v,final:v,equil:v,recupera:v},tec:{forehand:v,backhand:v,voleio:v,smash:v,saque:v,devolucao:v},jogo:{troca:v,direcao:v,efeito:v,profund:v,leitura:v,pressao:v}});
 DB.alunos=[
  al('a1','Aluno Um Teste',{status:'pago',avaliacoes:[Object.assign({data:'2026-09-10',nivel:'Base',esc:5},nota(2)),Object.assign({data:'2026-10-08',nivel:'Impulso',esc:5,prioridade:'Preparação do forehand'},nota(3))],
   registros:[{data:'2026-10-14',camada:'Base',evoluiu:'sim',intens:'media',conteudo:'Forehand cruzado',destaque:'Boa base',casa:'Sombra',proximo:'Backhand'}]}),
  al('a2','Aluna Dois Teste',{creditos:-1,repos:3}),
  al('a3','Personal Três Teste',{tipo:'Personal'}),
  al('a4','Dupla Quatro Teste',{tipo:'Dupla',plano:0,planoGrupo:4,credGrupo:3}),
  al('a5','Misto Cinco Teste',{planoGrupo:4,credGrupo:2,status:'pago'}),
  al('a6','Responsável Seis Teste',{mensalidade:1200}),
  al('a7','Dependente Sete Teste',{responsavelId:'a6',parentesco:'Filho(a)',mensalidade:0}),
  al('a8','Inativo Oito Teste',{ativo:false,arquivado:true})];
 const fx=(id,dia,hora,alunoId,tipo,x)=>Object.assign({id,dia,hora,titulo:alunoId?DB.alunos.find(a=>a.id===alunoId).nome:'',tipo,alunoId,desde:'2026-09-01'},x||{});
 DB.agenda={fixos:[fx('f1',3,'07:00','a3','personal'),fx('f2',3,'09:00','a1','aula'),fx('f3',3,'16:00','a4','grupo',{pessoas:2}),fx('f4',3,'18:00','a5','aula'),
   fx('f5',1,'10:00','a2','aula'),fx('f6',5,'17:00','a6','aula'),fx('f7',2,'08:00',null,'aula',{titulo:'Nome Sem Cadastro'}),fx('f8',4,'19:00',null,'aula',{titulo:'Outro Nome Solto'})],
  eventos:[{id:'e1',data:'2026-10-21',hora:'11:00',titulo:'Locação Fictícia',tipo:'locacao'},{id:'e2',data:'2026-10-21',hora:'12:00',titulo:'ALMOÇO',tipo:'bloqueio'},
   {id:'e3',data:'2026-10-22',hora:'14:00',titulo:'Aluna Dois Teste',tipo:'aula',alunoId:'a2'},{id:'e4',data:'2026-10-21',hora:'20:00',titulo:'Torneio',tipo:'torneio'}],excecoes:[]};
 DB.presencas=[{data:'2026-10-21',hora:'07:00',alunoId:'a3',status:'presente'},{data:'2026-10-21',hora:'09:00',alunoId:'a1',status:'falta'}];
 DB.compromissos=[{id:'c1',data:'2026-10-23',hora:'13:00',titulo:'Compromisso fictício',dur:60}];
 DB.lancamentos=[{id:'l1',tipo:'receita',categoria:'Mensalidade',descricao:'Mensalidade Aluno Um Teste',valor:640,data:'2026-10-05',alunoId:'a1',mes:'2026-10',metodo:'Pix'},
  {id:'l2',tipo:'despesa',categoria:'Material',descricao:'Bolas de teste',valor:180,data:'2026-10-07'},
  {id:'l3',tipo:'receita',categoria:'Locação',descricao:'Locação fictícia',valor:70,data:'2026-10-12'}];
 DB.movs=[{ts:new Date('2026-10-01T09:00:00-03:00').getTime(),alunoId:'a1',campo:'creditos',delta:4,de:0,para:4,motivo:'renovação',ref:''},
  {ts:new Date('2026-10-14T09:00:00-03:00').getTime(),alunoId:'a1',campo:'creditos',delta:-1,de:4,para:3,motivo:'aula dada',ref:''}];
 DB.torneios={atual:'t1',seeded:true,lista:{t1:{id:'t1',nome:'Barragem Teste',tipo:'barragem',etapa:2,encerrada:false,grupos:['A','B'],nomesGrupos:{A:'Grupo Ouro'},
  etapasFin:[{etapa:1,data:'2026-09-30',campeoes:[{grupo:'A',campeao:'Aluno Um Teste',vice:'Aluna Dois Teste'}]}],
  jogos:[{id:'j1',etapa:2,grupo:'A',p1:'Aluno Um Teste',p2:'Aluna Dois Teste',venc:'Aluno Um Teste',tipo:'normal',sets:[[6,4],[3,6],[10,8]],data:'2026-10-15',ts:1}],
  jogadores:[{group:'A',name:'Aluno Um Teste',v:3,d:1,wo:0,order:0,alunoId:'a1'},{group:'A',name:'Aluna Dois Teste',v:2,d:2,wo:1,order:1},
   {group:'B',name:'Jogador Três Teste',v:1,d:0,wo:0,order:0}]}}};
 DB.meta=8000;
}
/* ---------- telas: [nome, preparo dentro da página] ---------- */
const pg=id=>`go('${id}',document.querySelector('.nav button[onclick*="${id}"]')||document.createElement('button'));`;
const ESTADOS=[
 ['inicio',pg('dash')],
 ['inicio-menu',pg('dash')+'abrirMenuInicio();'],
 ['inicio-conferir-aulas',pg('dash')+'abrirConferenciaAulas();'],
 ['inicio-quadra',pg('dash')+'abrirStatusQuadra();'],
 ['inicio-tempo',pg('dash')+'CLIMA_ULT={ts:Date.now(),temp:18,code:3,dia:true,chuva:20,horas:[{h:"15",temp:18,code:3,dia:true,chuva:20},{h:"16",temp:17,code:61,dia:true,chuva:70}]};pintarClimaGestao();document.getElementById("ov-clima").classList.add("on");pintarPrevisaoClima("");'],
 ['inicio-aulas-hoje',pg('dash')+'abrirAulasDeHoje();'],
 ['agenda-dia',pg('agenda')],
 ['agenda-semana',pg('agenda')+'setView("semana",document.querySelector("#pg-agenda .seg button[onclick*=semana]"));'],
 ['agenda-mes',pg('agenda')+'setView("mes",document.querySelector("#pg-agenda .seg button[onclick*=mes]"));'],
 ['agenda-horario',pg('agenda')+'openSlot("10:00");'],
 ['agenda-vincular',pg('agenda')+'abrirVincular();'],
 ['agenda-divulgar',pg('agenda')+'abrirDivulgar();'],
 ['agenda-compromisso',pg('agenda')+'abrirNovoCompromisso();'],
 ['agenda-grade',pg('agenda')+'abrirHorario();'],
 ['alunos',pg('alunos')],
 ['aluno-ficha','abrirFicha("a1");'],
 ['aluno-ficha-devedor','abrirFicha("a2");'],
 ['aluno-cadastro','openAlunoModal("a1");'],
 ['aluno-novo','openAlunoModal();'],
 ['aluno-extrato','abrirExtrato("a1");'],
 ['aluno-historico','openHistAulas("a1");'],
 ['aluno-pagamento','registrarPagamento("a2");'],
 ['avaliacao',pg('aval')],
 ['avaliacao-nova','openAvalModal("a1");'],
 ['avaliacao-ver','openAvalVer("a1",1);'],
 ['avaliacao-exportar','openAvalExport("a1");'],
 ['registro-aula','openRegistroModal("a1");'],
 ['pacote-novo','novoPacote();'],
 ['pacotes','gerenciarPacotes();'],
 ['caixa',pg('lanc')],
 ['caixa-lancamento','openLancModal();'],
 ['caixa-despesa','openDespesaModal();'],
 ['caixa-editar','abrirLancEdit("l1");'],
 ['caixa-botao','openBotaoModal();'],
 ['caixa-mes','abrirHistMes("2026-10");'],
 ['financeiro',pg('fin')],
 ['fechamento',pg('fech')+'try{abrirFechamento();}catch(e){}'],
 ['graficos',pg('graf')],
 ['seguranca',pg('seg')],
 ['seg-conferir-numeros',pg('seg')+'abrirFerr("conf-box",conferirNumeros);'],
 ['seg-pacote-unico',pg('seg')+'abrirFerr("pu-box",renderPacoteUnico);'],
 ['seg-escritorio',pg('seg')+'abrirFerr("esc-box",abrirResumoEscritorio);'],
 ['professores',pg('profs')],
 ['torneio',pg('torneio')+'torJogosAberto=true;renderTorneio();'],
 ['torneio-resultado',pg('torneio')+'abrirResultadoTor();'],
 ['torneio-jogador',pg('torneio')+'abrirJogTor("A","Aluno Um Teste");'],
 ['torneio-compartilhar',pg('torneio')+'abrirCompartilharTor();'],
 ['torneio-novo',pg('torneio')+'abrirNovoTorneio();'],
 ['torneio-add-jogador',pg('torneio')+'abrirAddJogador("A");'],
 ['avisos',`NOTIF=[{acao:'reservou',nome:'Aluno Um Teste',data:'2026-10-22',hora:'09:00',ts:Date.now()},{acao:'cancelou',nome:'Aluna Dois Teste',data:'2026-10-23',hora:'10:00',ts:Date.now()-60000}];abrirNotifs();`],
 ['pedidos',`pedFila=[{key:'p1',kind:'plano',nome:'Aluno Um Teste',ts:Date.now()},{key:'p2',kind:'aviso_pagamento',nome:'Aluna Dois Teste',valor:640,ts:Date.now()}];abrirPedidos();`]
];

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 const relatorio=[],quebradas=[];let telas=0;
 const so=(process.env.JV_TELAS||'').split(',').filter(Boolean);
 try{
  for(const tema of ['saibro','classico']){
   const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');try{localStorage.setItem('jv-tema',t);}catch(e){}},tema);
   const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
   await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
   await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,{},{timeout:15000});
   await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast,#pd-status{display:none!important}*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important}'});
   await g.evaluate('('+montarDados.toString()+')()');
   await g.evaluate(()=>{persist=()=>{};publish=()=>{};guardarVersoes=()=>{};logAct=()=>{};MODO='dono';hideVals=false;ensureFields();CARREGADO=true;window.open=()=>null;
    curYear=2026;curMonth=9;renderAll();});
   for(const [nome,prep] of ESTADOS){
    if(so.length&&!so.includes(nome))continue;
    await g.setViewportSize({width:390,height:844});
    const falhou=await g.evaluate(prep=>{
     document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));
     try{if(document.getElementById('ficha-aluno').classList.contains('on'))fecharFicha();}catch(e){}
     try{(0,eval)(prep);return '';}catch(e){return String(e&&e.message||e);}
    },prep);
    if(falhou){quebradas.push(tema+' · '+nome+' · '+falhou);continue;}
    await g.waitForTimeout(150);
    await g.evaluate(()=>window.scrollTo(0,0));
    const itens=await medir(g,SHOTS&&path.join(SHOTS,'gestao-'+tema+'-'+nome+'.png'));
    relatorio.push({tema,tela:nome,itens});telas++;
   }
   if(erros.length)quebradas.push(...erros.map(e=>tema+' · erro na página · '+e));
   await c.close();
  }
  const falhas=[];
  for(const r of relatorio)for(const it of r.itens)if(it.ratio!==null&&it.ratio<it.minimo)falhas.push({tema:r.tema,tela:r.tela,texto:it.t,contraste:it.ratio,minimo:it.minimo,cor:it.fg,fundo:it.fundo,tam:it.fs,onde:it.onde,desativado:it.desativado});
  if(process.env.JV_CONTRASTE_JSON)fs.writeFileSync(process.env.JV_CONTRASTE_JSON,JSON.stringify({falhas,relatorio,quebradas},null,1));
  const total=relatorio.reduce((n,r)=>n+r.itens.length,0);
  console.log(telas+' telas · '+total+' textos medidos · '+falhas.length+' abaixo da régua');
  if(process.env.JV_CONTRASTE_LISTA){
   for(const f of falhas)console.log(['  ',f.tema,f.tela,f.contraste+'/'+f.minimo,JSON.stringify(f.texto),f.cor,'sobre',f.fundo,f.tam+'px',f.desativado?'(desativado)':'',f.onde].join(' '));
   for(const q of quebradas)console.log('  ⚠️ '+q);
  }
  assert.deepEqual(quebradas,[],'telas que não abriram');
  relatorio.forEach(r=>assert.ok(r.itens.length>=3,r.tema+' · '+r.tela+': mediu textos'));
  assert.deepEqual(falhas.map(f=>f.tema+' · '+f.tela+' · '+f.texto+' · '+f.contraste),[],'textos difíceis de ler');
  console.log('\n✅ leitura ok em '+telas+' telas e janelas da Gestão (Saibro e Verde clássico)');
 }catch(e){console.error('❌ '+(e.stack||e).toString().slice(0,4000));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

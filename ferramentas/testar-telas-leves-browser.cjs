/* Telas mais leves (12/11/2026, pedido do João): só muda o LUGAR das coisas.
   - App do aluno: cada aviso do topo aparece só na aba onde serve; o de
     segurança do aparelho aparece em todas. Créditos sem o Pix repetido.
   - Gestão: Gráficos em 3 abas (lembra a última);
     configurações do Financeiro num bloco fechado que "Valores" abre sozinho.
   - O Início da Gestão voltou ao de antes (13/11, pedido do João).
   Dados fictícios; nada vai para a nuvem. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
 catch(e){res.writeHead(404).end();}
});
let falhas=0,feitos=0;
async function check(nome,fn){try{await fn();feitos++;console.log('✅ '+nome);}catch(e){falhas++;console.log('❌ '+nome+'\n   '+String(e&&e.message||e).split('\n').slice(0,4).join('\n   '));}}
async function contexto(browser,base,url,agora){
 const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
 await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
  if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
 await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
 const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await p.clock.setFixedTime(agora);await p.goto(base+url,{waitUntil:'load'});
 return {c,p,erros};
}
const AVISOS=['vinculo-status-box','aviso-box','chuva-box','espera-box','lembrete-box','renova-box','feriado-box'];
// o que cada aba mostra (o resto fica escondido)
const ESPERADO={
 inicio:AVISOS,
 agenda:['vinculo-status-box','aviso-box','chuva-box','espera-box','lembrete-box','feriado-box'],
 aulas:['vinculo-status-box','aviso-box','chuva-box','espera-box','feriado-box'],   // "aula hoje" já tem confirmação própria em Minhas aulas
 creditos:['vinculo-status-box','renova-box'],
 evolucao:['vinculo-status-box'],perfil:['vinculo-status-box'],torneio:['vinculo-status-box']};

(async()=>{
 await new Promise(rs=>server.listen(0,'127.0.0.1',rs));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  /* ---------------- App do aluno ---------------- */
  {const {c,p,erros}=await contexto(browser,base,'/app-aluno/',new Date('2026-10-27T10:00:00-03:00'));
   await p.waitForFunction(()=>typeof goAluno==='function'&&typeof render==='function');
   await p.addStyleTag({content:'#toast{display:none!important}'});
   await p.evaluate(()=>{
    init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-teste';atualizarGradeReserva=async()=>{};saveMeu=async()=>{};
    notificarJoao=()=>{};notificarLocal=()=>{};abrirWhatsApp=()=>{};_renovaAdiado=false;_lembreteFeito=true;
    EU={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:8,planoGrupo:0,creditos:5,credGrupo:0,repos:2,reposValidas:2,locCred:0,mensalidade:640,status:'pendente',diaVenc:30,ativo:true};
    PUB={horas:['09:00','10:00'],profs:[],precos:{},grupoPreco:{},pix:'teste@example.invalid',pixNome:'Academia Teste',pixCidade:'Curitiba',pixTipo:'email',
     chuvas:[],reservasRespostas:[],grade:{fixos:[],eventos:[],excecoes:[]},historico:{},alunos:[]};PUB.alunos=[EU];
    MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[],espera:[],chuvaVista:[],feriadoOk:[]};
    window.fbDB={ref:()=>({push:async()=>{},update:async()=>{},set:async()=>{},once:async()=>({val:()=>null}),transaction:async()=>({committed:true})})};
    VINCULO_ESTADO='ativo';
    const lg=document.getElementById('login');if(lg)lg.style.display='none';document.getElementById('app').style.display='block';
    document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
    render();
   });
   const visiveis=aba=>p.evaluate(({aba,AVISOS})=>{
    goAluno(aba,null);
    // o que o app decide mostrar fica no style; a aba só pode esconder
    AVISOS.forEach(id=>{const e=document.getElementById(id);if(e){e.style.display='block';if(!e.textContent.trim())e.textContent='Aviso de teste';}});
    return AVISOS.filter(id=>{const e=document.getElementById(id);return e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0;});
   },{aba,AVISOS});
   for(const [aba,lista] of Object.entries(ESPERADO)){
    await check('aluno · '+aba+': mostra só '+lista.length+' aviso(s) do topo',async()=>{
     assert.deepEqual(await visiveis(aba),lista);
    });
   }
   await check('aluno · aviso que o app escondeu continua escondido em qualquer aba (caso negativo)',async()=>{
    const r=await p.evaluate(()=>{goAluno('inicio',null);const e=document.getElementById('renova-box');e.style.display='none';
     return getComputedStyle(e).display;});
    assert.equal(r,'none');
   });
   await check('aluno · Créditos: sem o Pix repetido; "Minhas aulas" em uma linha; "Falar com a academia" à vista',async()=>{
    const r=await p.evaluate(()=>{goAluno('creditos',null);render();
     const mes=document.getElementById('cred-page-mes'),fal=document.getElementById('cred-page-falar');
     let falou=false;const orig=window.falarComProfessor;window.falarComProfessor=()=>{falou=true;};fal.click();window.falarComProfessor=orig;
     return {pix:!!document.getElementById('cred-page-pix'),rapidas:!!document.querySelector('#apg-creditos .jv-quick'),
      mes:mes.innerText.trim(),linhas:Math.round(mes.getBoundingClientRect().height),falarVisivel:fal.getBoundingClientRect().height>0,falou};});
    assert.equal(r.pix,false);assert.equal(r.rapidas,false);
    assert.match(r.mes,/^Minhas aulas de \S+: \d+ feitas? · \d+ marcadas? ›$/);
    assert.ok(r.linhas<=56,'a linha do mês ficou alta demais: '+r.linhas+' px');
    assert.ok(r.falarVisivel);assert.ok(r.falou,'o botão chama falarComProfessor()');
   });
   await check('aluno · nenhum erro na página',async()=>{assert.deepEqual(erros,[]);});
   await c.close();}

  /* ---------------- Gestão ---------------- */
  {const {c,p,erros}=await contexto(browser,base,'/app-gestao/',new Date('2026-10-21T15:30:00-03:00'));
   await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,null,{timeout:40000});
   await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast{display:none!important}'});
   const preparar=()=>p.evaluate(()=>{persist=()=>{};publish=()=>{};guardarVersoes=()=>{};logAct=()=>{};MODO='dono';hideVals=false;
    const al=(id,nome,x)=>Object.assign({id,nome,codigo:id.replace(/\D/g,'').padStart(4,'7'),tipo:'Particular',plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:0,locCred:0,mensalidade:640,valorAula:160,status:'pendente',diaVenc:10,ativo:true},x||{});
    DB.alunos=[al('a1','Aluno Um Teste'),al('a3','Personal Três Teste',{tipo:'Personal'})];
    DB.agenda={fixos:[{id:'f1',dia:3,hora:'07:00',titulo:'Personal Três Teste',tipo:'personal',alunoId:'a3',desde:'2026-09-01'},
     {id:'f2',dia:3,hora:'09:00',titulo:'Aluno Um Teste',tipo:'aula',alunoId:'a1',desde:'2026-09-01'},
     {id:'f3',dia:3,hora:'18:00',titulo:'Aluno Um Teste',tipo:'aula',alunoId:'a1',desde:'2026-09-01'}],eventos:[],excecoes:[]};
    DB.presencas=[];DB.lancamentos=[];DB.movs=[];ensureFields();curYear=2026;curMonth=9;renderAll();go('dash',document.createElement('button'));});
   await preparar();
   await check('gestão · Início continua o de antes (voltou em 13/11, pedido do João): anéis, quadrinhos e financeiro à vista, sem bloco recolhido',async()=>{
    const r=await p.evaluate(()=>({numeros:!!document.getElementById('jh-numeros'),
     aneis:document.getElementById('jh-ring-total').checkVisibility(),tiles:document.getElementById('kpi-alunos').checkVisibility(),
     fin:document.getElementById('k-recebido').checkVisibility(),sub:document.querySelector('.jh-rings #jh-ring-total')!==null&&document.getElementById('jh-ring-total-sub').closest('.jh-card')===document.querySelector('.jh-rings').closest('.jh-card')}));
    assert.equal(r.numeros,false);assert.ok(r.aneis);assert.ok(r.tiles);assert.ok(r.fin);assert.ok(r.sub,'"já dadas · conferir" fica no cartão dos anéis, como antes');
   });
   await check('gestão · Gráficos: abre em Dinheiro; Quadra mostra só a quadra; o app lembra a aba',async()=>{
    await p.evaluate(()=>{try{localStorage.removeItem('jv-graf-aba');}catch(e){}go('graf',document.createElement('button'));});
    const vis=()=>p.evaluate(()=>[...document.querySelectorAll('#pg-graf .graf-grupo')].filter(g=>!g.hidden).map(g=>g.dataset.grupo));
    assert.deepEqual(await vis(),['dinheiro']);
    await p.click('#graf-abas button[data-grupo="quadra"]');
    assert.deepEqual(await vis(),['quadra']);
    assert.ok(await p.locator('#graf-ocup').isVisible());assert.ok(!await p.locator('#graf-fat').isVisible());
    await p.evaluate(()=>{go('dash',document.createElement('button'));go('graf',document.createElement('button'));});
    assert.deepEqual(await vis(),['quadra']);
    assert.equal(await p.evaluate(()=>document.querySelector('#graf-abas button.on').dataset.grupo),'quadra');
   });
   await check('gestão · títulos dentro das abas e do bloco fechado mantêm cor branca e ícone',async()=>{
    const r=await p.evaluate(()=>{const t=document.querySelector('#pg-graf .graf-grupo[data-grupo="quadra"]>.sec-title');
     return {cor:getComputedStyle(t).color,icone:getComputedStyle(t,'::before').backgroundImage};});
    assert.equal(r.cor,'rgb(255, 255, 255)');assert.match(r.icone,/icones3d/);
   });
   await check('gestão · Financeiro: configurações fechadas; "Valores" abre o bloco e mostra o preço',async()=>{
    await p.evaluate(()=>go('fin',document.createElement('button')));
    assert.equal(await p.evaluate(()=>document.getElementById('fin-config').open),false);
    assert.ok(!await p.locator('#pr-avpart').isVisible());assert.ok(await p.locator('#f-total').isVisible());
    await p.evaluate(()=>irParaValores());
    await p.waitForFunction(()=>{const r=document.getElementById('pr-avpart').getBoundingClientRect();return r.height>0&&r.top>=0&&r.bottom<=innerHeight;},null,{timeout:4000});
    assert.equal(await p.evaluate(()=>document.getElementById('fin-config').open),true);
   });
   await check('gestão · Pacote único (13/11): botão escondido quando desligado e de volta quando ligado',async()=>{
    const vis=()=>p.evaluate(()=>document.querySelector('[data-box="pu-box"]').checkVisibility());
    await p.evaluate(()=>{delete DB.pacoteUnico;go('seg',document.createElement('button'));});
    assert.equal(await vis(),false);
    await p.evaluate(()=>{DB.pacoteUnico={ativo:true};go('seg',document.createElement('button'));});
    assert.equal(await vis(),true,'ligado: o botão volta para dar para desligar');
    await p.evaluate(()=>{delete DB.pacoteUnico;});
   });
   await check('gestão · nenhum erro na página',async()=>{assert.deepEqual(erros,[]);});
   await c.close();}
 }catch(e){falhas++;console.error('❌ '+(e.stack||e));}
 finally{await browser.close();server.close();}
 console.log('\n'+feitos+' verificações · '+falhas+' falha(s)');
 if(falhas)process.exitCode=1;
})();

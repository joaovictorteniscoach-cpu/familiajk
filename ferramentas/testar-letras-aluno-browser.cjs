/* App do aluno: letras maiores (27/10, pedido do João: "aumentar as letras
   para ficar mais visível"). Antes, 167 de 299 textos estavam abaixo de 12 px.
   Confere em 320 px e 390 px, nos dois temas, que nenhum texto visível das
   seis abas e das janelas de horário fica abaixo do mínimo, e que nada passa
   da largura da tela. Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-20T10:30:00-03:00');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
/* Mínimo geral 12 px. A grade da semana (7 colunas) fica em 11,5 px: em 12 px
   "Reserva" quebrava no meio da palavra. */
const MIN=12,MIN_GRADE=11.5;
const ABAS=[["goAluno('inicio',document.getElementById('nav-al-inicio'))",'Início'],["goAluno('agenda',document.getElementById('nav-al-agenda'))",'Agenda'],
 ["irMinhasAulas()",'Minhas aulas'],["goAluno('creditos',document.getElementById('nav-al-creditos'))",'Créditos'],
 ["goAluno('evolucao',document.getElementById('nav-evolucao'))",'Evolução'],["goAluno('perfil',document.getElementById('nav-al-perfil'))",'Perfil']];
const pequenos=(p,escopo)=>p.evaluate(({escopo,MIN,MIN_GRADE})=>{
 const raiz=escopo==='janela'?document.querySelector('.overlay.on'):document.getElementById('app');if(!raiz)return ['sem '+escopo];
 const out=[];
 raiz.querySelectorAll('*').forEach(e=>{
  if(e.closest('script,style,svg'))return;
  if(escopo!=='janela'&&!e.closest('.page.on,nav,#app>.top'))return;
  const txt=[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');if(!txt)return;
  const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(r.width<1||r.height<1||s.visibility==='hidden'||Number(s.opacity)<0.05)return;
  const fs=parseFloat(s.fontSize),min=e.closest('#apg-agenda .wc')?MIN_GRADE:MIN;
  if(fs<min-0.01)out.push(fs+'px "'+txt.slice(0,30)+'"');
 });
 return out;
},{escopo,MIN,MIN_GRADE});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const tema of ['saibro','classico']){
   for(const largura of [320,390]){
    const c=await browser.newContext({viewport:{width:largura,height:780},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
    await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
    await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');if(t==='classico')localStorage.setItem('jv-tema','classico');},tema);
    const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
    await p.clock.setFixedTime(AGORA);
    await p.goto(base+'/app-aluno/',{waitUntil:'load'});await p.waitForFunction(()=>typeof render==='function');
    await p.evaluate(()=>{
     init=async()=>{};saveMeu=async()=>{};
     EU={codigo:'6601',nome:'Aluna Exemplo',tipo:'Particular',plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:1,reposValidas:1,locCred:0,mensalidade:640,status:'pago',ativo:true,nivel:'Intermediário'};
     PUB={horas:['07:00','08:00','09:00','10:00','16:00','17:00','18:00'],profs:[],horarioCfg:{},horarioData:{},reservasRespostas:[],historico:{},alunos:[EU],
      precos:{avulsaPart:170,avulsaGrupo:95,locacao:70,personal:130},grupoPreco:{dupla:90,trio:85,quarteto:80},
      grade:{fixos:[{id:'f1',cod:'6601',dia:3,hora:'18:00',tipo:'aula'}],excecoes:[],eventos:[{id:'e',cod:'7701',data:'2026-10-21',hora:'10:00',tipo:'aula'}]}};
     MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[],espera:[]};
     document.getElementById('login').style.display='none';document.getElementById('app').style.display='block';try{render();}catch(e){}
    });
    for(const [acao,nome] of ABAS){
     await check(tema+' · '+largura+' px · '+nome+': nenhum texto abaixo de '+MIN+' px e nada passa da tela',async()=>{
      await p.evaluate(a=>{document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));eval(a);window.scrollTo(0,0);},acao);
      await p.waitForTimeout(250);
      assert.deepEqual(await pequenos(p,'aba'),[]);
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'rolagem para o lado');
     });
    }
    await check(tema+' · '+largura+' px · janelas de horário (escolher e agendar) com letra de pelo menos '+MIN+' px',async()=>{
     await p.evaluate(()=>{goAluno('agenda',document.getElementById('nav-al-agenda'));agDate=new Date('2026-10-22T12:00:00');escolherSlot('16:00');});
     await p.waitForTimeout(250);assert.deepEqual(await pequenos(p,'janela'),[]);
     await p.evaluate(()=>{document.querySelectorAll('.overlay.on').forEach(x=>x.classList.remove('on'));abrirBook('16:00',false);});
     await p.waitForTimeout(250);assert.deepEqual(await pequenos(p,'janela'),[]);
    });
    assert.deepEqual(erros,[]);await c.close();
   }
  }
  console.log('\n✅ '+count+' verificações · letras maiores no app do aluno');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

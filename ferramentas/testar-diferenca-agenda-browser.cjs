/* Alunos: "conferir valor: agenda dá…" (20/10). Depois que o João toca em
   "Manter", o aviso some da lista até a VIRADA do mês — mesmo com os créditos
   zerados (reposição/aula extra) e mesmo olhando outro mês no cabeçalho ou
   renovando no mesmo mês. Na virada volta sozinho. Manter não muda valor
   nenhum. Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;async function check(n,fn){await fn();count++;console.log('✅ '+n);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
  const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.accept());
  await g.clock.install({time:new Date('2026-10-20T08:00:00-03:00')});await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}#toast{display:none!important}'});
  await g.evaluate(()=>{
   persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';hideVals=false;
   const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',plano:4,planoGrupo:0,creditos:0,credGrupo:0,repos:1,locCred:0,mensalidade:500,valorAula:160,status:'pago',ativo:true},x||{});
   DB.alunos=[al('a1','Aluno Um'),al('a2','Aluno Dois')];
   DB.agenda={fixos:[{id:'f1',dia:2,hora:'09:00',titulo:'Aluno Um',tipo:'aula',alunoId:'a1',desde:'2026-01-01'},{id:'f2',dia:4,hora:'10:00',titulo:'Aluno Dois',tipo:'aula',alunoId:'a2',desde:'2026-01-01'}],eventos:[],excecoes:[]};
   DB.presencas=[];ensureFields();CARREGADO=true;curYear=2026;curMonth=9;go('alunos',document.createElement('button'));renderAll();
  });
  const tags=()=>g.evaluate(()=>{renderAlunos();return [...document.querySelectorAll('#al-list .al-tag, .al-tag')].filter(t=>/conferir valor/.test(t.textContent)).map(t=>t.closest('[onclick]')?.getAttribute('onclick')||t.textContent);});
  const temA=async id=>(await tags()).some(t=>t.includes(id));
  await check('a diferença aparece para os dois alunos (agenda ≠ cadastro, créditos zerados)',async()=>{
   const v=await g.evaluate(()=>DB.alunos.map(a=>agendaDoMes(a).valor));
   assert.ok(v.every(x=>x>0&&x!==500),'agenda dá outro valor: '+v);
   assert.ok(await temA('a1'));assert.ok(await temA('a2'));
  });
  await check('"Manter" tira só aquele aluno da lista e não muda valor nenhum',async()=>{
   const antes=await g.evaluate(()=>JSON.stringify(DB.alunos.map(a=>[a.mensalidade,a.plano,a.creditos,a.credGrupo,a.repos])));
   await g.evaluate(()=>abrirFicha('a1'));
   await g.click('#fic-corpo button:has-text("Manter")');
   assert.equal(await temA('a1'),false);assert.ok(await temA('a2'));
   assert.equal(await g.evaluate(()=>JSON.stringify(DB.alunos.map(a=>[a.mensalidade,a.plano,a.creditos,a.credGrupo,a.repos]))),antes);
   const fic=await g.evaluate(()=>{renderFicha();return document.getElementById('fic-corpo').innerText.replace(/\s+/g,' ');});
   assert.match(fic,/Você manteve R\$ 500 este mês/);assert.doesNotMatch(fic,/cobrou pela agenda/);
   await g.evaluate(()=>fecharFicha());
  });
  await check('desfazer devolve o aviso; manter de novo tira',async()=>{
   await g.evaluate(()=>desfazerDecisaoDif('a1'));assert.ok(await temA('a1'));
   await g.evaluate(()=>manterValorAnotado('a1'));assert.equal(await temA('a1'),false);
  });
  await check('continua fora com créditos zerados, olhando outro mês e renovando no mesmo mês',async()=>{
   await g.evaluate(()=>{DB.alunos[0].creditos=0;DB.alunos[0].repos=0;});assert.equal(await temA('a1'),false);
   await g.evaluate(()=>{shiftMonth(1);});assert.equal(await temA('a1'),false,'mês do cabeçalho não importa');
   await g.evaluate(()=>{shiftMonth(-1);limparDifNaRenovacao(DB.alunos[0]);});
   assert.equal(await temA('a1'),false,'renovar no mesmo mês mantém a decisão');
   assert.equal(await g.evaluate(()=>'difUndo' in DB.alunos[0]),false,'depois de renovar não há o que desfazer');
  });
  await check('na virada do mês o aviso volta sozinho',async()=>{
   await g.clock.setSystemTime(new Date('2026-11-02T08:00:00-03:00'));
   await g.evaluate(()=>{curYear=2026;curMonth=10;renderAll();});
   const dif=await g.evaluate(()=>agendaDoMes(DB.alunos[0]).valor!==500);assert.ok(dif);
   assert.ok(await temA('a1'));
  });
  assert.deepEqual(erros,[]);await c.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · diferença da agenda conferida some até a virada');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

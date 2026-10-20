/* Contagem de locações (19/10): tudo que está marcado OU escrito como
   locação conta como locação, com aluno vinculado ou sem. Antes um
   "Locação Fulano" salvo como aula entrava como aula de tênis e sumia das
   locações. Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-19T21:00:00-03:00');
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
  await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
  await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
  await g.evaluate(()=>{
   persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';
   const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',plano:4,planoGrupo:0,creditos:4,credGrupo:0,repos:0,locCred:2,mensalidade:640,status:'pago',ativo:true,extratoAberto:true},x||{});
   DB.alunos=[al('a1','Aluno Um'),al('c1','Cliente Vinculado'),al('c2','Cliente Escrito'),al('l1','Aluno Locatelli'),al('p1','Personal Um',{tipo:'Personal'})];
   const ev=(id,hora,titulo,tipo,alunoId)=>({id,data:'2026-10-19',hora,titulo,tipo,alunoId:alunoId||null});
   DB.agenda={fixos:[{id:'f1',dia:1,hora:'14:00',titulo:'Cliente Vinculado',tipo:'locacao',alunoId:'c1',desde:'2026-10-19',ate:'2026-10-19'}],
    eventos:[ev('e1','15:00','Quadra avulsa','locacao'),ev('e2','16:00','Locação Fulano','aula'),ev('e3','17:00','Aluguel da quadra','aula','c2'),
     ev('e4','09:00','Aluno Um','aula','a1'),ev('e5','10:00','Aluno Locatelli','aula','l1'),ev('e6','11:00','Personal Um','personal','p1'),
     ev('e7','18:00','locacao sem acento','grupo')],excecoes:[]};
   DB.presencas=[];DB.movs=[];DB.compromissos=[];ensureFields();CARREGADO=true;curYear=2026;curMonth=9;
   go('dash',document.createElement('button'));renderAll();
  });
  await check('marcado ou escrito como locação conta como locação, com e sem vínculo; não vira aula de tênis',async()=>{
   const r=await g.evaluate(()=>{const d=new Date('2026-10-19T12:00:00');const oc=ocupacao(d,d),au=contarAulas(d,d);
    return {loc:oc.locUsados,au,fora:aulasDoDia(d).fora.map(x=>x.hora).sort(),
     txt:document.getElementById('loc-txt').textContent,hoje:document.getElementById('jh-loc-hoje').textContent};});
   assert.equal(r.loc,5,'14h vinculada, 15h sem vínculo, 16h escrita, 17h escrita com aluno, 18h sem acento');
   assert.deepEqual(r.au,{tenis:2,personal:1,total:3},'Aluno Um e Locatelli são aula; personal continua personal');
   assert.deepEqual(r.fora,['14:00','15:00','16:00','17:00','18:00']);
   assert.equal(r.txt,'5h no mês');assert.equal(r.hoje,'5');
  });
  await check('conferência das aulas de hoje mostra as escritas como locação em "não é aula"',async()=>{
   const t=await g.evaluate(()=>{abrirConferenciaAulas();const t=document.getElementById('ca-corpo').innerText;closeModal('ov-conf-aulas');return t;});
   assert.match(t,/3 aulas hoje/);assert.match(t,/16:00 Locação Fulano \(locação\)/);assert.match(t,/17:00 Aluguel da quadra \(locação\)/);
  });
  await check('Conferir números avisa (só lista) quem tem locação escrita mas salva como aula',async()=>{
   const r=await g.evaluate(()=>{const antes=JSON.stringify(DB);const t=id=>achadosDoAluno(DB.alunos.find(a=>a.id===id)).map(x=>x.txt).join(' | ');
    return {c2:t('c2'),c1:t('c1'),l1:t('l1'),igual:JSON.stringify(DB)===antes};});
   assert.match(r.c2,/Cliente Escrito tem 1 horário\(s\) neste mês escrito\(s\) como locação, mas salvo\(s\) como aula \(19\/10 17:00\)/);
   assert.doesNotMatch(r.c1,/escrito\(s\) como locação/,'tipo Locação certo: sem aviso');
   assert.doesNotMatch(r.l1,/escrito\(s\) como locação/,'nome parecido não é locação');
   assert.ok(r.igual,'só lista');
  });
  assert.deepEqual(erros,[]);
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · contagem de locações');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

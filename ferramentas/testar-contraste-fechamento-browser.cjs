/* Contraste e fechamento: dados fictícios; toda rede externa bloqueada. */
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), auditOnly=process.env.JV_AUDIT_ONLY==='1';
const server=http.createServer((q,r)=>{let f=path.join(root,decodeURI(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(root+path.sep)){r.writeHead(403).end();return;}try{const ext=path.extname(f);r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[ext]||'application/octet-stream');r.end(fs.readFileSync(f));}catch{r.writeHead(404).end();}});
const data={alunos:[
 {id:'solo',nome:'Aluno Individual Teste',tipo:'Particular',plano:4,creditos:2,repos:1,mensalidade:640,valorAula:160,status:'pendente',codigo:'9901',diaVenc:10,ativo:true},
 {id:'pai',nome:'Responsável Teste',tipo:'Particular',plano:4,creditos:1,repos:2,mensalidade:1200,valorAula:160,status:'pendente',codigo:'9902',diaVenc:15,ativo:true},
 {id:'filho',nome:'Dependente Teste',tipo:'Particular',plano:3,creditos:1.5,repos:2,mensalidade:0,valorAula:160,status:'pendente',codigo:'9903',responsavelId:'pai',parentesco:'Filho(a)',ativo:true}
],lancamentos:[{id:'rec',tipo:'receita',categoria:'Mensalidade',descricao:'Receita de teste',valor:640,data:'2026-10-01'}],agenda:{fixos:[],eventos:[],excecoes:[]},presencas:[],compromissos:[],meta:10000,savedAt:Date.now(),mesPagamentos:'2026-10',mesCreditos:'2026-10'};
function auditInBrowser(selector){
 const parse=s=>{const a=s.match(/[\d.]+/g);return a?a.map(Number):[0,0,0,0];};
 const blend=(a,b)=>{const k=a[3]===undefined?1:a[3];return a.slice(0,3).map((v,i)=>v*k+b[i]*(1-k));};
 const lum=c=>c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);
 const results=[];
 for(const el of document.querySelectorAll(selector)){
  if(!el.getClientRects().length||el.closest('[disabled]'))continue;
  const direct=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
  if(!direct)continue;
  const chain=[];let p=el, opacity=1,unknown=false;
  while(p){const c=getComputedStyle(p);opacity*=+c.opacity;chain.push(parse(c.backgroundColor));if(c.backgroundImage!=='none')unknown=true;p=p.parentElement;}
  let bg=[10,26,20];for(const c of chain.reverse())bg=blend(c,bg);
  const cs=getComputedStyle(el),fg=blend([...parse(cs.webkitTextFillColor||cs.color).slice(0,3),opacity],bg);
  const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  const size=parseFloat(cs.fontSize),large=size>=24||(size>=18.66&&+cs.fontWeight>=700);
  results.push({selector:el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.trim().replace(/\s+/g,'.'):''),text:direct.slice(0,70),ratio:+ratio.toFixed(2),size,unknown,fail:ratio<(large?3:4.5)});
 }
 return results;
}
let count=0;async function check(name,fn){await fn();count++;console.log('✅ '+name);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({args:['--no-sandbox']});
 try{
 for(const theme of ['saibro','classico']){
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  await context.addInitScript(({data,theme})=>{localStorage.setItem('jvtenis-gestao-v1',JSON.stringify(data));localStorage.setItem('jv-tema',theme);sessionStorage.setItem('jv-bk-adiar','1');},{data,theme});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.goto(base+'/app-gestao/',{waitUntil:'load'});await p.waitForTimeout(6500);
  await p.evaluate(()=>{persist=()=>{};publish=()=>{};hideVals=false;document.getElementById('splash-gestao').style.display='none';document.getElementById('ov-entrar').style.display='none';renderAll();});
  await p.addStyleTag({content:'#ov-entrar{display:none!important}'});
  for(const page of ['dash','alunos','fin','lanc','agenda','torneio','fech','seg']){
   await p.evaluate(page=>{go(page,document.createElement('button'));if(page==='fech'){document.getElementById('fc-aluno').value='solo';document.getElementById('fc-mes').value='2026-10';renderFechamento();}},page);
   const audit=await p.evaluate(auditInBrowser,'.page.on *');
   const failures=audit.filter(x=>x.fail&&!x.unknown);
   console.log('AUDIT '+theme+' '+page+' '+JSON.stringify(failures.slice(0,22)));
   if(!auditOnly)assert.deepEqual(failures,[],theme+' '+page+' contraste: '+JSON.stringify(failures));
  }
  if(auditOnly){await context.close();continue;}
  await check(theme+' mensalidade editada atualiza prévia aberta',async()=>{
   await p.evaluate(()=>{go('fech',document.createElement('button'));document.getElementById('fc-aluno').value='solo';document.getElementById('fc-mes').value='2026-10';renderFechamento();openAlunoModal('solo');document.getElementById('a-mensalidade').value='735';saveAluno();});
   assert.match(await p.locator('#fech-export .fx-total').innerText(),/735/);
   assert.equal(await p.evaluate(()=>DB.alunos.find(x=>x.id==='solo').creditos),2);
   await p.evaluate(()=>openAlunoModal('solo'));assert.equal(await p.locator('#a-mensalidade').inputValue(),'735');await p.evaluate(()=>{document.getElementById('a-tel').value='11999900000';saveAluno();});assert.match(await p.locator('#fech-export .fx-total').innerText(),/735/);
  });
  await check(theme+' mês selecionado e desconto manual entram no total',async()=>{
   const r=await p.evaluate(()=>{const a=DB.alunos.find(x=>x.id==='solo');a.descRepos={mes:'2026-10',valor:100,qtd:1};renderFechamento();return {total:fcDados(a,'2026-10').total,outro:fcDados(a,'2026-09').total,texto:fcTexto(a,'2026-10',fcDados(a,'2026-10'))};});
   assert.equal(r.total,635);assert.equal(r.outro,735);assert.match(r.texto,/635/);assert.doesNotMatch(r.texto,/desconto/i);
  });
  await check(theme+' saldo do cadastro e família sem cobrança duplicada',async()=>{
   await p.evaluate(()=>{document.getElementById('fc-aluno').value='pai';renderFechamento();openAlunoModal('pai');document.getElementById('a-mensalidade').value='1375';saveAluno();openAlunoModal('filho');document.getElementById('a-plano').value='5';document.getElementById('a-creditos').value='4';document.getElementById('a-repos').value='3';saveAluno();});
   const r=await p.evaluate(()=>({t:document.getElementById('fech-export').innerText,d:fcDados(DB.alunos.find(x=>x.id==='pai'),'2026-10'),filho:DB.alunos.find(x=>x.id==='filho')}));
   assert.equal(r.d.total,1375);assert.equal(r.filho.mensalidade,0);assert.equal(r.filho.creditos,4);assert.match(r.t,/1375|1\.375/);assert.match(r.t,/Dependente Teste/);
  });
  for(const width of [320,390,1280]){
   await p.setViewportSize({width,height:844});
   await p.evaluate(()=>{go('fech',document.createElement('button'));document.getElementById('fc-obs').value='Observação de teste com texto comprido para conferir leitura no celular.';renderFechamento();});
   await check(theme+' contraste do fechamento e conferência '+width,async()=>{
    const a=await p.evaluate(auditInBrowser,'#fech-export *,#fech-conf *');
    assert.deepEqual(a.filter(x=>x.fail),[],JSON.stringify(a.filter(x=>x.fail)));
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.ok(await p.evaluate(()=>[...document.querySelectorAll('#fech-export .fx-linha')].every(e=>e.scrollWidth<=e.clientWidth+1)));
   });
  }
  await check(theme+' imagem exportada usa os valores atuais',async()=>{
   const r=await p.evaluate(async()=>{DB.alunos.find(x=>x.id==='pai').mensalidade=1495;garantirExportLibs=async()=>{};let text='';window.html2canvas=async el=>{text=el.innerText;return {toBlob:cb=>cb(new Blob(['teste'],{type:'image/png'}))};};await _fechBlob();return text;});
   assert.match(r,/1\.495|1495/);
  });
  await p.setViewportSize({width:390,height:844});
  await p.evaluate(()=>go('fin',document.createElement('button')));
  await check(theme+' comparativo do Financeiro legível',async()=>{
   const a=await p.evaluate(auditInBrowser,'#pg-fin .chart *');
   assert.deepEqual(a.filter(x=>x.fail),[],JSON.stringify(a.filter(x=>x.fail)));
  });
  await p.evaluate(()=>{go('alunos',document.createElement('button'));openAlunoModal('solo');});
  await check(theme+' campos claros, rótulos e foco legíveis',async()=>{
   const r=await p.evaluate(()=>{const e=document.getElementById('a-nome'),s=getComputedStyle(e);return {fill:s.webkitTextFillColor,color:s.color};});
   assert.equal(r.fill,r.color);const a=await p.evaluate(auditInBrowser,'#ov-aluno label');assert.deepEqual(a.filter(x=>x.fail),[]);
  });
  await p.evaluate(()=>closeModal('ov-aluno'));
  if(process.env.JV_VISUAL_LOG==='1'){
   for(const page of ['fech','fin','alunos']){
    await p.evaluate(page=>go(page,document.createElement('button')),page);
    await p.waitForTimeout(200);
    console.log('VISUAL '+theme+' '+page+' '+(await p.screenshot({type:'jpeg',quality:45,fullPage:false})).toString('base64'));
   }
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 }finally{await browser.close();server.close();}
 console.log('✅ '+count+' verificações de contraste e fechamento');
})().catch(e=>{console.error(e);server.close();process.exit(1);});

/* Teste de fumaça da Gestão no navegador, com dados FICTÍCIOS (nunca Firebase).
   Uso (da raiz): node .claude/skills/publicar-versao/fumaca.cjs [pasta-para-prints]
   Abre cada aba, a ficha de um aluno, Renovar o mês e as ferramentas do Financeiro.
   Falha (exit 1) se houver erro de página ou elemento essencial faltando. */
const {chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..'),out=process.argv[2]||'';
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
  const nomes=['Ana Teste','Bruno Teste','Carla Teste','Davi Teste','Eva Teste'];
  DB.alunos=nomes.map((n,i)=>({id:'t'+i,nome:n,tipo:i==3?'Personal':(i==2?'Dupla':'Particular'),plano:i==2?0:4,planoGrupo:i==2?4:0,credGrupo:i==2?2:0,
    mensalidade:640,creditos:[3,-1,0,2,1][i],repos:[1,0,0,2,0][i],locCred:0,status:i%2?'pago':'pendente',codigo:'T00'+i,tel:'1199990000'+i,diaVenc:10}));
  DB.agenda={fixos:DB.alunos.map((a,i)=>({id:'f'+i,dia:(i%5)+1,hora:'1'+(6+i)+':00',titulo:a.nome,tipo:'aula',alunoId:a.id})),eventos:[],excecoes:[]};
  const s=document.getElementById('splash-gestao');if(s)s.style.display='none';renderAll();});
await p.addStyleTag({content:'#ov-entrar{display:none!important}'});
await p.evaluate(()=>{window.irAba=id=>go(id,document.querySelector("[onclick^=\"go('"+id+"'\"]")||document.createElement('button'));});
const abas=await p.evaluate(()=>[...document.querySelectorAll('.page[id^="pg-"]')].map(x=>x.id.slice(3)));
for(const id of abas){const e0=erros.length;await p.evaluate(id=>irAba(id),id);await p.waitForTimeout(200);
  ok('aba '+id,erros.length===e0,erros.slice(e0));if(out)await p.screenshot({path:out+'/aba-'+id+'.png'});}
await p.evaluate(()=>irAba('alunos'));
ok('lista de alunos com 5 linhas',await p.evaluate(()=>document.querySelectorAll('#alunos-list .al-row').length)===5);
await p.evaluate(()=>abrirFicha('t0'));await p.waitForTimeout(300);
const fi=await p.evaluate(()=>{const f=document.getElementById('ficha-aluno');const fns=[...f.querySelectorAll('[onclick]')].map(x=>(x.getAttribute('onclick').match(/^(?:event\.stopPropagation\(\);)?([A-Za-z_$][\w$]*)\(/)||[])[1]).filter(Boolean);
  return {on:f.classList.contains('on'),faltam:fns.filter(n=>typeof window[n]!=='function')};});
ok('ficha abre e todo botão tem função',fi.on&&!fi.faltam.length,fi);if(out)await p.screenshot({path:out+'/ficha.png'});
await p.evaluate(()=>fecharFicha());await p.waitForTimeout(300);await p.evaluate(()=>abrirRenovaMes());await p.waitForTimeout(300);
ok('Renovar o mês abre',await p.evaluate(()=>document.getElementById('renova-mes').classList.contains('on')));
await p.evaluate(()=>fecharRenovaMes());await p.waitForTimeout(300);await p.evaluate(()=>irAba('fin'));
for(const bx of (await p.evaluate(()=>[...document.querySelectorAll('[data-box]')].map(x=>x.dataset.box))).filter(x=>x!=='teste-box')){const e0=erros.length;
  await p.evaluate(bx=>document.querySelector('[data-box="'+bx+'"]').click(),bx);await p.waitForTimeout(150);ok('ferramenta '+bx,erros.length===e0,erros.slice(e0));}
ok('nenhum erro de página',erros.length===0,erros);
await b.close();srv.close();console.log(falhas?'\n❌ '+falhas+' falha(s)':'\n✅ fumaça OK');process.exit(falhas?1:0);})().catch(e=>{console.log("❌ teste parou: "+String(e.message).split("\n")[0]);process.exit(1);});

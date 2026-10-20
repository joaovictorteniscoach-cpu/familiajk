/* Caixa: locação com tempo (20/10). Escolher "Locação" no lançamento mostra o
   tempo locado (horas); as horas refazem o valor pela hora da tabela, o tempo
   fica gravado no lançamento e aparece na linha da Caixa. Não mexe em crédito
   de ninguém. Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-20T08:00:00-03:00');
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
  for(const tema of ['saibro','classico']){
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');try{localStorage.setItem('jv-tema',t);}catch(e){}},tema);
   const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
   await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
   await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
   await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}#toast{display:none!important}'});
   await g.evaluate(()=>{
    persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';hideVals=false;
    const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',ativo:true},x||{});
    DB.alunos=[al('a1','Aluno Um'),al('c1','Cliente Locação',{perfil:'locacao',plano:0,creditos:0,mensalidade:0,locCred:2})];
    DB.precos=Object.assign(DB.precos||{},{locacao:80});DB.lancamentos=[];DB.movs=[];
    ensureFields();CARREGADO=true;curYear=2026;curMonth=9;go('lanc',document.createElement('button'));renderAll();
   });
   const alunosAntes=await g.evaluate(()=>JSON.stringify({a:DB.alunos,m:DB.movs}));
   const ve=id=>g.evaluate(id=>{const e=document.getElementById(id);return e&&getComputedStyle(e).display!=='none'&&e.offsetParent!==null;},id);
   await check(tema+': escolher Locação mostra o tempo (1h) e o valor sai da hora da tabela',async()=>{
    await g.evaluate(()=>openLancModal());
    assert.equal(await ve('l-horas-wrap'),false,'só aparece em locação');
    await g.selectOption('#l-cat','locacao');
    assert.equal(await ve('l-horas-wrap'),true);
    assert.equal(await g.inputValue('#l-horas'),'1');assert.equal(await g.inputValue('#l-valor'),'80');
    await g.click('#l-horas-wrap button[aria-label="Meia hora a mais"]');
    assert.equal(await g.inputValue('#l-horas'),'1,5');assert.equal(await g.inputValue('#l-valor'),'120');
    assert.match(await g.textContent('#l-horas-dica'),/1,5h × R\$ 80\/h = R\$ 120/);
    await g.fill('#l-horas','2');assert.equal(await g.inputValue('#l-valor'),'160');
    await g.fill('#l-horas','0');assert.match(await g.textContent('#l-horas-dica'),/maiores que zero/);
    await g.fill('#l-horas','1,5');
   });
   await check(tema+': janela legível (medida na imagem)',async()=>{
    const itens=(await medir(g)).filter(it=>/ov-lanc/.test(it.onde||''));
    assert.ok(itens.length>=5,'mediu: '+itens.length);
    assert.deepEqual(itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>it.t+' '+it.ratio+' '+it.fg+' sobre '+it.fundo),[]);
   });
   await check(tema+': vincular o locatário e lançar grava valor, tempo e vínculo; a Caixa mostra o tempo',async()=>{
    await g.evaluate(()=>{openLancModal();});
    await g.selectOption('#l-aluno','c1');
    assert.equal(await g.inputValue('#l-cat'),'locacao','locatário puxa a categoria Locação');
    await g.fill('#l-horas','1,5');assert.equal(await g.inputValue('#l-valor'),'120');
    await g.click('#ov-lanc .btn-clay');
    const l=await g.evaluate(()=>DB.lancamentos[0]);
    assert.equal(l.cat,'locacao');assert.equal(l.horas,1.5);assert.equal(l.valor,120);assert.equal(l.alunoId,'c1');
    assert.equal(l.desc,'Locação 1,5h · Cliente Locação');
    const linha=await g.evaluate(()=>document.querySelector('#mov-list .cx-mv').innerText.replace(/\s+/g,' '));
    assert.match(linha,/Locação 1,5h · Cliente Locação Locação · ⏱ 1,5h · 🔗/);
    assert.equal(await g.evaluate(()=>JSON.stringify({a:DB.alunos,m:DB.movs})),alunosAntes,'não mexe em crédito');
   });
   await check(tema+': editar o lançamento mostra e corrige o tempo; trocar a categoria tira o tempo',async()=>{
    const id=await g.evaluate(()=>DB.lancamentos[0].id);
    await g.evaluate(id=>abrirLancEdit(id),id);
    assert.equal(await ve('le-horas-wrap'),true);assert.equal(await g.inputValue('#le-horas'),'1,5');assert.equal(await g.inputValue('#le-valor'),'120','abrir não refaz o valor');
    await g.click('#le-horas-wrap button[aria-label="Meia hora a mais"]');assert.equal(await g.inputValue('#le-valor'),'160');
    await g.evaluate(()=>salvarLancEdit());
    assert.deepEqual(await g.evaluate(()=>[DB.lancamentos[0].horas,DB.lancamentos[0].valor]),[2,160]);
    await g.evaluate(id=>abrirLancEdit(id),id);await g.selectOption('#le-cat','avulsa');
    assert.equal(await ve('le-horas-wrap'),false);
    await g.evaluate(()=>salvarLancEdit());
    assert.equal(await g.evaluate(()=>'horas' in DB.lancamentos[0]),false);
   });
   await check(tema+': atalho "Locação 1h" grava 1h; os outros atalhos não ganham tempo',async()=>{
    await g.evaluate(()=>{acaoRepetida=()=>false;DB.lancamentos=[];const f=atalhosFixos();quickLancFixo(f.findIndex(x=>x.rot==='Locação 1h'));quickLancFixo(0);});
    const ls=await g.evaluate(()=>DB.lancamentos.map(l=>[l.desc,l.cat,l.horas||0,l.valor]));
    assert.deepEqual(ls.find(x=>x[1]==='locacao'),['Locação de Quadra 1h','locacao',1,80]);
    assert.equal(ls.find(x=>x[1]==='avulsa')[2],0);
   });
   assert.deepEqual(erros,[]);await c.close();
  }
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · locação com tempo no lançamento');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

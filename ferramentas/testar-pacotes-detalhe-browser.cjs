/* Pacotes (20/10): a tela lista os pacotes do app e os personalizados; cada um
   abre e explica preço, créditos, virada e quantos alunos ativos usam, com os
   valores que o app usa de verdade. Só leitura (excluir continua pedindo
   confirmação). Só dados fictícios, relógio fixo. */
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
   const g=await c.newPage(),erros=[],dialogos=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>{dialogos.push(d.message());d.dismiss();});
   await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
   await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
   await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}#toast{display:none!important}'});
   await g.evaluate(()=>{
    persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';hideVals=false;
    const al=(id,nome,x)=>Object.assign({id,nome,codigo:id,tipo:'Particular',plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pago',arquivado:false},x||{});
    DB.alunos=[al('a1','Aluno Um'),al('a2','Aluno Dois'),al('d1','Dupla Um',{tipo:'Dupla',plano:4}),al('m1','Misto Um',{planoGrupo:4,grupoTipo:'Dupla'}),
     al('k1','Kid Um',{tipo:'Kids'}),al('k2','Kid Dois',{tipo:'Kids',arquivado:true}),al('c1','Cliente Locação',{perfil:'locacao',plano:0,mensalidade:0})];
    DB.tiposCustom=[{nome:'Kids',valorAula:100,cat:'tenis'},{nome:'Planilha Teste',valorAula:90,cat:'personal'}];
    DB.precos={avulsaPart:170,avulsaGrupo:95,locacao:80,personal:130};DB.grupoPreco={dupla:90,trio:85,quarteto:80};
    ensureFields();CARREGADO=true;go('dash',document.createElement('button'));renderAll();
   });
   const antes=await g.evaluate(()=>JSON.stringify(DB));
   const corpo=()=>g.evaluate(()=>document.getElementById('pacotes-lista').innerText.replace(/\s+/g,' ').trim());
   const abre=async nome=>{await g.click('#pacotes-lista .pk-cab:has-text("'+nome+'")');return corpo();};
   await check(tema+': Mais → Pacotes abre a lista com os pacotes do app e os personalizados',async()=>{
    await g.evaluate(()=>{fecharMais&&fecharMais();gerenciarPacotes();});
    const t=await corpo();
    for(const n of ['Particular','Dupla · Trio · Quarteto','Personal','Misto (particular + grupo)','Pacote único','Locação de quadra','Aulas avulsas','Kids','Planilha Teste'])assert.ok(t.includes(n),n);
    assert.match(t,/Particular .* 2 alunos/);assert.match(t,/Kids R\$ 100 \/ aula 1 aluno/,'conta só ativos');
    assert.equal(await g.evaluate(()=>document.querySelectorAll('#pacotes-lista .pk-corpo').length),0,'tudo fechado até tocar');
   });
   await check(tema+': cada pacote abre e explica com os valores reais do app',async()=>{
    let t=await abre('Particular');
    assert.match(t,/Ocupa a quadra inteira/);assert.match(t,/4 aulas × R\$ 160 = R\$ 640/);assert.match(t,/vira reposição, que vale 4 meses/);assert.match(t,/4 horas ou mais/);
    t=await abre('Dupla · Trio · Quarteto');assert.doesNotMatch(t,/Ocupa a quadra inteira/,'um aberto por vez');
    assert.match(t,/Dupla R\$ 90 · Trio R\$ 85 · Quarteto R\$ 80/);assert.match(t,/até 2, 3 ou 4 alunos/);assert.match(t,/Aula em família/);
    t=await abre('Locação de quadra');assert.match(t,/R\$ 80\/hora/);assert.match(t,/hora × R\$ 80/);
    t=await abre('Kids');assert.match(t,/4 aulas = R\$ 400 · 8 aulas = R\$ 800/);assert.match(t,/Usado por: Kid Um, Kid Dois \(inativo\)/);
    t=await abre('Kids');assert.equal(await g.evaluate(()=>document.querySelectorAll('#pacotes-lista .pk-corpo').length),0,'tocar de novo fecha');
   });
   await check(tema+': excluir pacote em uso é recusado; "Mudar valores" leva aos valores no Financeiro',async()=>{
    await abre('Kids');await g.click('#pacotes-lista .pk-del');
    assert.equal(await g.evaluate(()=>DB.tiposCustom.length),2);assert.equal(dialogos.length,0,'nem pergunta: está em uso');
    await abre('Aulas avulsas');await g.click('#pacotes-lista .pk-ir:has-text("Mudar valores")');await g.waitForTimeout(300);
    assert.equal(await g.evaluate(()=>document.body.dataset.pagina),'fin');
    assert.equal(await g.evaluate(()=>document.getElementById('ov-pacotes-lista').classList.contains('on')),false);
    await g.waitForFunction(()=>{const r=document.getElementById('pr-avpart').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;},null,{timeout:4000});   // campo de valores à vista
   });
   await check(tema+': legível (medido na imagem) e nada muda nos dados',async()=>{
    for(const n of ['Particular','Kids']){
     await g.evaluate(()=>{pkAberto='';gerenciarPacotes();});await abre(n);
     const itens=(await medir(g)).filter(it=>/ov-pacotes-lista|pk-/.test(it.onde||''));
     assert.ok(itens.length>=8,n+' mediu: '+itens.length);
     assert.deepEqual(itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>n+' '+it.t+' '+it.ratio+' '+it.fg+' sobre '+it.fundo),[]);
     await g.setViewportSize({width:390,height:844});
    }
    assert.equal(await g.evaluate(()=>JSON.stringify(DB)),antes,'só lê');
   });
   assert.deepEqual(erros,[]);await c.close();
  }
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · pacotes com detalhes');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

/* Extrato resumido (19/10). O João achou o extrato longo e confuso (marcar e
   desmarcar, chuva que devolvia, correções). O resumo junta o que é a mesma
   coisa; o detalhado continua a um toque. Só dados fictícios. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
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
  for(const tema of ['saibro','classico']){
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(t=>{sessionStorage.setItem('jv-bk-adiar','1');try{localStorage.setItem('jv-tema',t);}catch(e){}},tema);
   const g=await c.newPage(),erros=[];g.on('pageerror',e=>erros.push(e.message));g.on('dialog',d=>d.dismiss());
   await g.clock.setFixedTime(AGORA);await g.goto(base+'/app-gestao/',{waitUntil:'load'});
   await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
   await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
   await g.evaluate(()=>{
    persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';
    DB.alunos=[{id:'a1',nome:'Aluna Teste',codigo:'a1',tipo:'Particular',plano:8,planoGrupo:4,creditos:0,credGrupo:0,repos:0,locCred:0,mensalidade:800,status:'pago',ativo:true,extratoAberto:true}];
    const t=(d,h)=>new Date(d+'T'+(h||'12:00')+':00-03:00').getTime();
    const mv=(ts,campo,delta,motivo,ref)=>({ts,alunoId:'a1',campo,delta,de:0,para:0,motivo,ref:ref||''});
    const L=[
     mv(t('2026-10-05','08:00'),'creditos',8,'Renovação do mês'),
     mv(t('2026-10-06','09:00'),'creditos',-1,'Presença na agenda','2026-10-06|09:00|a1'),
     mv(t('2026-10-06','09:01'),'creditos',1,'Presença desmarcada','2026-10-06|09:00|a1'),          // desfeito: some
     mv(t('2026-10-07','09:00'),'creditos',-1,'Presença na agenda','2026-10-07|09:00|a1'),           // fica: Aula realizada
     mv(t('2026-10-08','18:00'),'credGrupo',4,'Correção manual no cadastro'),
     mv(t('2026-10-08','18:01'),'credGrupo',-1,'Correção manual no cadastro'),
     mv(t('2026-10-08','18:02'),'credGrupo',-1,'Correção manual no cadastro'),                         // 3 correções → +2
     mv(t('2026-10-09','18:00'),'credGrupo',-1,'Aula em grupo na agenda','2026-10-09|18:00|a1'),
     mv(t('2026-10-09','19:00'),'credGrupo',1,'Chuva — devolvido','2026-10-09|18:00|a1'),            // chuva
     mv(t('2026-10-10','10:00'),'locCred',2,'Locação paga (2h)'),
     mv(t('2026-10-12','14:00'),'locCred',-1,'Locação na agenda','2026-10-12|14:00|a1')];
    let saldo={};L.forEach(m=>{saldo[m.campo]=(saldo[m.campo]||0)+m.delta;m.para=saldo[m.campo];});
    DB.movs=L;Object.assign(DB.alunos[0],{creditos:saldo.creditos,credGrupo:saldo.credGrupo,locCred:saldo.locCred});
    DB.agenda={fixos:[{id:'f1',dia:2,hora:'09:00',titulo:'Aluna Teste',tipo:'aula',alunoId:'a1',desde:'2026-10-01'},{id:'f2',dia:4,hora:'07:00',titulo:'Aluna Teste',tipo:'aula',alunoId:'a1',desde:'2026-10-01'}],
     eventos:[{id:'ch',data:'2026-10-15',hora:'07:00',titulo:'☔ Chuva',tipo:'bloqueio',motivo:'chuva',alunoId:null,nq:1}],
     excecoes:[{fixoId:'f1',data:'2026-10-13'},{fixoId:'f2',data:'2026-10-15'},{fixoId:'f1',data:'2026-10-27'}]};
    DB.presencas=[];ensureFields();CARREGADO=true;renderAll();
   });
   const ler=()=>g.evaluate(()=>[...document.querySelectorAll('#ext-corpo tr')].slice(1).map(tr=>tr.innerText.replace(/\s+/g,' ').trim()));
   await check(tema+': resumido junta o que é a mesma coisa e fala a língua da academia',async()=>{
    const antes=await g.evaluate(()=>JSON.stringify(DB));
    await g.evaluate(()=>abrirExtrato('a1'));
    const l=await ler();
    assert.deepEqual(l,[
     '15/10 ☔ Chuva 07:00 · sem desconto 0 —',
     '13/10 Aula cancelada 09:00 · sem desconto 0 —',
     '12/10 Locação 14:00 · locação -1h 1',
     '10/10 Locação paga (2h) locação +2h 2',
     '09/10 ☔ Chuva 18:00 · grupo · sem desconto 0 —',
     '08/10 Ajuste manual grupo +2 2',
     '07/10 Aula realizada 09:00 · créditos -1 7',
     '05/10 Renovação do mês créditos +8 8']);
    assert.match(await g.evaluate(()=>document.getElementById('ext-dica').textContent),/Marcação desfeita não aparece/);
    assert.equal(await g.evaluate(()=>JSON.stringify(DB)),antes,'só mostra');
   });
   await check(tema+': "Ver detalhado" mostra cada lançamento como antes, e volta',async()=>{
    await g.click('#ext-modo');let l=await ler();
    assert.equal(l.length,11);assert.match(l[0],/Locação na agenda/);assert.ok(l.some(x=>/Presença desmarcada/.test(x)));
    assert.equal(await g.evaluate(()=>document.getElementById('ext-modo').textContent),'Ver resumido');
    await g.click('#ext-modo');l=await ler();assert.equal(l.length,8);
   });
   await check(tema+': extrato resumido legível (medido na imagem)',async()=>{
    const itens=(await medir(g)).filter(it=>/ov-extrato|ext-|tbl-ext/.test(it.onde||''));
    assert.ok(itens.length>=20,'mediu: '+itens.length);
    assert.deepEqual(itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>it.t+' '+it.ratio+' '+it.fg+' sobre '+it.fundo),[]);
    await g.setViewportSize({width:390,height:844});
   });
   assert.deepEqual(erros,[]);await c.close();
  }
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · extrato resumido');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

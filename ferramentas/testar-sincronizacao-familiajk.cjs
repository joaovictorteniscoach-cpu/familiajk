/* Dados fictícios e Firebase simulado: nenhuma escrita no banco da família. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  let f=path.join(root,new URL(req.url,'http://localhost').pathname);if(f.endsWith('/'))f+='index.html';
  if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
  try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.JV_BROWSER||'/usr/bin/chromium',args:['--no-sandbox']});
  let envelope,revision=1,puts=0;const pages=[],errors=[];
  try{
    for(let i=0;i<2;i++){
      const context=await browser.newContext({viewport:{width:393,height:852},serviceWorkers:'block'});
      await context.route('**/*',async route=>{
        const req=route.request(),url=new URL(req.url());
        if(url.origin===origin)return route.continue();
        if(url.hostname!=='familia-test.invalid')return route.abort();
        if(req.method()==='PUT'){
          if(req.headers()['if-match']!==String(revision))return route.fulfill({status:412,body:'null'});
          envelope=JSON.parse(req.postData());revision++;puts++;
        }
        return route.fulfill({status:200,contentType:'application/json',headers:{ETag:String(revision),'Access-Control-Allow-Origin':'*','Access-Control-Expose-Headers':'ETag'},body:JSON.stringify(envelope)});
      });
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
      await page.goto(origin+'/app-familia/');pages.push(page);
    }
    const [joao,esposa]=pages;
    const seed=await joao.evaluate(()=>{
      const seed=syncData();seed.invest.aportes=[];seed.invest.mensal=[];seed.invest.anual=[];seed.contas.transacoes=[];return seed;
    });
    envelope={data:JSON.stringify(seed),updatedAt:1,writerUid:''};
    for(const p of pages)await p.evaluate(seed=>{
      D=migrate(structuredClone(seed));D.cloud={url:'https://familia-test.invalid/jk.json',on:true};
      initFields();renderAll();clearTimeout(pushTimer);pushTimer=null;rememberCloud('1',syncFingerprint());
    },seed);
    const before=await joao.evaluate(()=>invTotal());
    await joao.evaluate(()=>{
      D.invest.aportes.push({id:'j1',data:'05/10/2026',mes:'out/26',pessoa:'João',conta:'Nacional XP',ativo:'Teste João',valor:700,naCarteira:false});
      D.contas.joao.push({id:'conta-j',nome:'Conta teste João',valor:50});renderAportes();clearTimeout(pushTimer);pushTimer=null;
    });
    await esposa.evaluate(()=>{
      D.invest.aportes.push({id:'e1',data:'05/10/2026',mes:'out/26',pessoa:'Esposa',conta:'Nacional XP',ativo:'Teste Kassiana',valor:300,naCarteira:false});
      D.contas.esposa.push({id:'conta-e',nome:'Conta teste Kassiana',valor:90});renderAportes();clearTimeout(pushTimer);pushTimer=null;
    });
    await joao.evaluate(()=>cloudPush());
    await esposa.evaluate(()=>cloudPush()); // ETag mudou: junta sem sobrescrever João.
    assert.equal(await esposa.evaluate(()=>!!cloudConflict),false);
    await esposa.evaluate(()=>{clearTimeout(pushTimer);pushTimer=null;return cloudPush();});
    await joao.evaluate(()=>{clearTimeout(pushTimer);pushTimer=null;return cloudPull(true);});
    for(const p of pages){
      const r=await p.evaluate(()=>({total:invTotal(),j:pessoaSum('João'),e:pessoaSum('Esposa'),month:D.invest.mensal.find(r=>r.mes==='out/26')?.aporte,
        jConta:D.contas.joao.some(r=>r.id==='conta-j'),eConta:D.contas.esposa.some(r=>r.id==='conta-e')}));
      assert.equal(r.total,before+1000);assert.equal(r.j,700);assert.equal(r.e,300);assert.equal(r.month,1000);assert.ok(r.jConta&&r.eConta);
    }
    console.log('✅ Dois aparelhos: aportes simultâneos e contas nos dois sentidos, total 1.000 e evolução sem duplicar');
    await esposa.evaluate(()=>{D.invest.aportes.find(a=>a.id==='e1').naCarteira=true;refreshAportes();});
    assert.equal(await esposa.evaluate(()=>invTotal()),before+700);
    console.log('✅ Marcar aporte já na carteira elimina dupla contagem');
    const ownership=await esposa.evaluate(()=>{
      D.contas.exPessoa='preto';lancaAportes([{date:'06/10/2026',mes:'out/26',desc:'Transferência teste esposa',amount:-200,pes:'preta',bankId:'b-test',bankScope:'wife'}]);
      return D.invest.aportes.find(a=>a.bankId==='b-test').pessoa;
    });assert.equal(ownership,'Esposa');console.log('✅ Extrato respeita a pessoa da transação');
    for(const p of pages)await p.evaluate(()=>{clearTimeout(pushTimer);pushTimer=null;});
    const initial=await joao.evaluate(()=>mergeFamilyData(undefined,{invest:{aportes:[{id:'a',pessoa:'João',valor:100}]}},{invest:{aportes:[{id:'b',pessoa:'Esposa',valor:200}]}}).invest.aportes.length);
    assert.equal(initial,2);console.log('✅ Primeira conexão junta os lançamentos diferentes sem escolher só um aparelho');
    const conflict=await joao.evaluate(()=>{
      const b={contas:{joao:[{id:'same',valor:10}]}};
      try{mergeFamilyData(b,{contas:{joao:[{id:'same',valor:20}]}},{contas:{joao:[{id:'same',valor:30}]}});return false;}catch{return true;}
    });assert.ok(conflict);console.log('✅ Edição incompatível do mesmo valor fica para conferência');
    await joao.evaluate(()=>{deleteItem('invest.aportes',0);});
    assert.equal(await joao.evaluate(()=>D.invest.mensal.find(r=>r.mes==='out/26').aporte),300);
    console.log('✅ Excluir aporte recalcula mês e total');
    for(const width of [320,360,393,430,768,1280]){
      await joao.setViewportSize({width,height:852});
      for(const mode of ['contas','invest']){
        await joao.evaluate(mode=>setMode(mode),mode);
        const dims=await joao.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,tabs:document.getElementById('tabs'),})).catch(()=>null);
        assert.ok(dims&&dims.scroll<=width+1,'overflow '+width+' '+mode);
        if(width<=768)assert.ok(await joao.evaluate(()=>Array.from(document.querySelectorAll('#tabs button')).every(e=>e.getBoundingClientRect().right<=innerWidth+1)));
      }
    }
    await joao.setViewportSize({width:393,height:852});await joao.evaluate(()=>irPara('i-aportes'));
    await joao.screenshot({path:'/tmp/familiajk-mobile.png',fullPage:true});
    console.log('✅ Layout e todas as abas visíveis de 320 a 1280 pixels');
    assert.equal(errors.length,0,errors.join('\n'));assert.ok(puts>=2);console.log('✅ Sem erros JavaScript; nenhuma conexão com banco real');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

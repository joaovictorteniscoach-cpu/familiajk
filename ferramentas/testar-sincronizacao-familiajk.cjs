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
  const browser=await chromium.launch({executablePath:process.env.JV_BROWSER||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox']});
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
        if(width<=768)assert.ok(await joao.evaluate(()=>Array.from(document.querySelectorAll('#mobile-nav button')).every(e=>e.getBoundingClientRect().right<=innerWidth+1)));
      }
    }
    await joao.setViewportSize({width:393,height:852});
    for(const mode of ['contas','invest']){
      await joao.evaluate(mode=>setMode(mode),mode);
      assert.equal(await joao.locator('#mobile-nav button:visible').count(),5);
      assert.equal(await joao.locator('#tabs button:visible').count(),0);
      const expected=await joao.evaluate(()=> (D.mode==='invest'?TABS_INVEST:TABS_CONTAS).concat(TABS_SHARED).map(t=>t[0]));
      const primary=await joao.locator('#mobile-nav [data-id]').evaluateAll(es=>es.map(e=>e.dataset.id));
      const secondary=await joao.locator('#more-links [data-id]').evaluateAll(es=>es.map(e=>e.dataset.id));
      assert.equal(primary.length,3);assert.equal(new Set([...primary,...secondary]).size,expected.length);
      assert.deepEqual([...primary,...secondary].sort(),expected.sort());
      for(const id of secondary){
        await joao.locator('#more-button').click();
        await joao.locator('#more-links [data-id="'+id+'"]').click();
        assert.ok(await joao.locator('section[data-tab="'+id+'"].on').isVisible());
        assert.equal(await joao.locator('#more-dialog').evaluate(e=>e.open),false);
        assert.ok(await joao.locator('#more-button').evaluate(e=>e.classList.contains('active')));
      }
      await joao.locator('#more-button').click();await joao.keyboard.press('Escape');
      assert.equal(await joao.locator('#more-dialog').evaluate(e=>e.open),false);
      await joao.locator('#mobile-nav [data-id="'+primary[0]+'"]').click();
      assert.equal(await joao.locator('#more-button').evaluate(e=>e.classList.contains('active')),false);
    }
    console.log('✅ Menu móvel: 5 botões, todas as telas acessíveis e nenhum destino duplicado em Mais');
    await joao.evaluate(()=>setMode('contas'));await joao.locator('#nav-novo').click();
    assert.ok(await joao.locator('#entry-dialog').evaluate(e=>e.open));
    const count=await joao.evaluate(()=>D.contas.recebidos.length);
    await joao.locator('#entry-options button').filter({hasText:/^Recebimento/}).click();
    assert.ok(await joao.locator('section[data-tab="c-recebidos"].on').isVisible());
    assert.equal(await joao.evaluate(()=>D.contas.recebidos.length),count+1);
    await joao.evaluate(()=>setMode('invest'));const ap=await joao.evaluate(()=>D.invest.aportes.length);
    await joao.locator('#nav-novo').click();assert.equal(await joao.evaluate(()=>D.invest.aportes.length),ap+1);
    assert.ok(await joao.locator('section[data-tab="i-aportes"].on').isVisible());
    await joao.evaluate(()=>irPara('c-anual'));assert.ok(await joao.locator('section[data-tab="c-anual"].on').isVisible());
    console.log('✅ Lançar contextual e atalhos para telas secundárias continuam funcionando');
    const refreshed=await joao.evaluate(()=>{
      clearTimeout(pushTimer);pushTimer=null;irPara('i-anual');
      const next=structuredClone(D);next.invest.anual=[{ano:2026,patr:12345,aporte:300}];
      applyCloudRemote({data:next,etag:'test-chart',fp:syncFingerprint(next)});
      return charts.anual.data.datasets[0].data.includes(12345);
    });assert.ok(refreshed);console.log('✅ Sincronização atualiza o gráfico da tela secundária aberta');
    await joao.setViewportSize({width:1280,height:852});
    assert.equal(await joao.locator('#tabs button:visible').count(),4);
    await joao.locator('#sidebar-more').click();assert.ok(await joao.locator('#more-dialog').evaluate(e=>e.open));await joao.keyboard.press('Escape');
    console.log('✅ Menu de computador também reduzido, com Mais e Lançar acessíveis');
    await joao.setViewportSize({width:393,height:852});await joao.evaluate(()=>{snoozeBanner();irPara('c-painel');document.getElementById('undo-toast').hidden=true;});
    assert.equal(await joao.locator('.summary-grid > .summary-card').count(),2);
    assert.ok(await joao.locator('#page-period').isVisible());
    assert.match(await joao.locator('.summary-grid > .summary-card').first().innerText(),/A pagar/);
    await joao.locator('.income-details > summary').click();assert.ok(await joao.locator('#ch-renda').isVisible());
    await joao.locator('.income-details > summary').click();
    const outstanding=await joao.evaluate(()=>allBills().filter(b=>!pagoGet(b.id)&&(+b.valor||0)>0).length);
    assert.equal(await joao.locator('#dueList > .due').count(),Math.min(5,outstanding));
    if(outstanding>5){await joao.locator('.due-more > summary').click();assert.equal(await joao.locator('#dueList .due:visible').count(),outstanding);}
    await joao.locator('#dueList > .due').first().click();
    assert.ok(await joao.locator('.focused-row').isVisible());
    const focused=await joao.locator('.focused-row').evaluate(row=>({name:row.querySelector('.name').getBoundingClientRect().top,value:row.querySelector('[data-label^="Valor"]').getBoundingClientRect().top}));
    assert.ok(focused.name<focused.value);
    const bars=await joao.locator('.card-actions').count();await joao.evaluate(()=>enhanceTables());assert.equal(await joao.locator('.card-actions').count(),bars);
    const activeTable=await joao.locator('section.on .scroll').first().evaluate(scroll=>scroll.previousElementSibling.classList.contains('card-actions'));assert.ok(activeTable);
    const month=await joao.evaluate(()=>selMonthKey());await joao.locator('#page-period .mn-arrow').first().click();
    assert.notEqual(await joao.evaluate(()=>selMonthKey()),month);
    assert.equal(await joao.locator('#ch-mes').innerText(),await joao.evaluate(()=>fmtMonth(selMonthDate())));
    await joao.evaluate(()=>goToday());
    await joao.evaluate(()=>irPara('i-painel'));
    assert.equal(await joao.locator('#page-period').isVisible(),false);
    assert.ok(await joao.locator('#h-aportes').evaluate(e=>e.getBoundingClientRect().top)<await joao.locator('#sparkChart').evaluate(e=>e.getBoundingClientRect().top));
    assert.equal(await joao.locator('#h-aportes .contributed-people > div').count(),3);
    await joao.screenshot({path:'/tmp/familiajk-invest-ergonomia.png',fullPage:true,animations:'disabled'});
    await joao.evaluate(()=>irPara('c-painel'));
    console.log('✅ Ergonomia: pendências primeiro, mês acessível, todos os vencimentos, linha correta e ações perto da tabela');
    await joao.screenshot({path:'/tmp/familiajk-mobile.png',fullPage:true,animations:'disabled'});
    console.log('✅ Layout sem rolagem lateral de 320 a 1280 pixels');
    for(const [width,tab,name] of [[393,'c-casa','contas-mobile'],[1280,'c-painel','resumo-desktop'],[1280,'i-painel','invest-desktop']]){
      await joao.setViewportSize({width,height:852});await joao.evaluate(tab=>irPara(tab),tab);
      await joao.screenshot({path:'/tmp/familiajk-'+name+'.png',fullPage:true,animations:'disabled'});
      assert.ok(await joao.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    // Regressão do histórico: dados fictícios, sem gravar no Firebase real.
    const history=await joao.evaluate(()=>{
      const saved=structuredClone(D);D.cloud.on=false;suppressPush=true;
      const results=[];
      try{
        D.contas.mesSel='2026-10';D.contas.pagos={};D.lixeira=[];
        for(const k of MONTHLY_BILLS){
          D.contas[k]=[{id:'hist-'+k,nome:'Dívida antiga',valor:100,venc:'10',preta:50,preto:50,limite:1000,melhorDia:'5'}];
          D.contas.pagos['2026-09']={...(D.contas.pagos['2026-09']||{}),['hist-'+k]:true};
          setBill(k,0,'valor',150);setBill(k,0,'nome','Dívida nova');setBill(k,0,'venc','20');
          results.push(monthlyValue(D.contas[k][0],'2026-09').valor===100&&monthlyValue(D.contas[k][0],'2026-09').nome==='Dívida antiga');
          results.push(monthlyValue(D.contas[k][0],'2026-10').valor===150&&monthlyValue(D.contas[k][0],'2026-11').venc==='20');
          D.contas.mesSel='2026-12';deleteItem('contas.'+k,0);
          results.push(billsForMonth(k,'2026-11').length===1&&billsForMonth(k,'2026-12').length===0&&billsForMonth(k,'2027-01').length===0);
          results.push(pagoGet('hist-'+k,'2026-09')&&monthlyValue(D.contas[k][0],'2026-09').valor===100);
          restoreTrash(D.lixeira.at(-1).id);results.push(billsForMonth(k,'2026-12')[0]?.valor===150);
          D.contas.mesSel='2026-10';deleteItem('contas.'+k,0);
          results.push(billsForMonth(k,'2026-09').length===1&&billsForMonth(k,'2026-10').length===0);
          restoreTrash(D.lixeira.at(-1).id);
        }
        D.contas.mesSel='2026-10';splitUm(0);
        results.push(monthlyValue(D.contas.casa[0],'2026-09').preta===50&&monthlyValue(D.contas.casa[0],'2026-10').preta===75);
        addCasa();results.push(billsForMonth('casa','2026-09').length===1&&billsForMonth('casa','2026-10').length===2);
        // A conta oculta não desloca os índices dos botões de edição/exclusão.
        deleteItem('contas.casa',0);renderCasa();
        const row=document.getElementById('tbl-casa').rows[1],input=row.querySelector('.name input');input.value='Conta criada em outubro';input.dispatchEvent(new Event('input'));
        results.push(monthlyValue(D.contas.casa[1],'2026-10').nome==='Conta criada em outubro');
        results.push(monthlyValue(D.contas.casa[0],'2026-09').nome==='Dívida antiga');
        D.contas.renda={joao:1000,esposa:500};document.getElementById('rd-joao').value='2000';document.getElementById('rd-esposa').value='800';onRenda();
        results.push(monthlyValue(D.contas.renda,'2026-09').joao===1000&&monthlyValue(D.contas.renda,'2026-10').joao===2000);
        const base=syncData(),local=structuredClone(base),remote=structuredClone(base);
        local.contas.joao[0]._mudancas['2026-11']={valor:180};remote.contas.joao[0]._mudancas['2026-12']={excluido:true};
        const merged=mergeFamilyData(base,local,remote);
        results.push(monthlyValue(merged.contas.joao[0],'2026-09').valor===100&&monthlyValue(merged.contas.joao[0],'2026-11').valor===180&&monthlyValue(merged.contas.joao[0],'2026-12')===null);
        const reload=migrate(JSON.parse(JSON.stringify(D)));results.push(monthlyValue(reload.contas.joao[0],'2026-09').valor===100);
        D.invest.aportes=[];lancaAportes([{date:'06/10/2026',mes:'out/26',desc:'PIX corretora desconhecida',amount:-200,pes:'preta',bankId:'destino-teste'}]);
        const a=D.invest.aportes[0];results.push(a.conta==='Não informado'&&a.ativo===''&&a.pessoa==='Esposa'&&aporteDestino(a)==='Destino não informado');
        results.push(contaAporteExtrato({desc:'PIX Binance'})==='Binance'&&contaAporteExtrato({desc:'Transferência XP Global'})==='Global XP');
        results.push(aporteDestino({_k:'antigo',conta:'Nacional XP',ativo:'PIX corretora',desc:'PIX corretora'}).includes('legado'));
        renderAportes();setAporteDestino(0,'conta','Banco da família');setAporteDestino(0,'ativo','CDB');
        results.push(aporteDestino(a)==='Destino: Banco da família · CDB'&&document.getElementById('aporte-destino-0').textContent.includes('CDB'));
        results.push(aportesPendentes()===200&&D.invest.mensal.find(m=>m.mes==='out/26')?.aporte===200);
        D.contas.transacoes=[{id:'tx-new',date:'06/10/2026',mes:'out/26',desc:'Nova',amount:-20}];
        D.contas.anual={'2026':Array.from({length:12},()=>({previsto:null,pago:null,recebido:null}))};D.contas.anual['2026'][8]={previsto:900,pago:700,recebido:1200};
        D.invest.mensal=[{mes:'set/26',patr:60000,aporte:200}];D.invest.aportes=[];
        const old={contas:{transacoes:[{id:'tx-old',date:'01/08/2026',mes:'ago/26',desc:'Antiga',amount:-15}],anual:{'2026':Array.from({length:12},(_,i)=>({previsto:i===8?600:null,pago:i===8?650:null,recebido:i===8?1000:null}))}},invest:{mensal:[{mes:'set/26',patr:40000,aporte:100},{mes:'ago/26',patr:35000,aporte:150}]}};
        const recovered=mergeHistory(D,old);
        results.push(recovered.next.contas.anual['2026'][8].previsto===900&&Array.isArray(recovered.next.contas.anual['2026']));
        results.push(recovered.next.invest.mensal.find(m=>m.mes==='set/26').patr===60000&&recovered.next.invest.mensal.find(m=>m.mes==='ago/26').patr===35000);
        results.push(recovered.next.contas.transacoes.length===2&&D.contas.transacoes.length===1&&mergeHistory(recovered.next,old).added===0);
        results.push(mergeHistory(D,{contas:{casa:[]},invest:{mensal:structuredClone(DEFAULT.invest.mensal)}}).added===0);
        const confirmBefore=window.confirm;window.confirm=()=>true;try{recoverHistory(old);}finally{window.confirm=confirmBefore;}results.push(D.contas.transacoes.length===2&&D.contas.anual['2026'][8].previsto===900);
        D.lixeira=[{id:'excluded-history',path:'contas.transacoes',items:[old.contas.transacoes[0]]}];D.contas.transacoes=D.contas.transacoes.filter(t=>t.id!=='tx-old');results.push(!mergeHistory(D,old).next.contas.transacoes.some(t=>t.id==='tx-old'));
        D.contas.anual['2026'][8].previsto=0;results.push(mergeHistory(D,old).next.contas.anual['2026'][8].previsto===0);
        irPara('i-aportes');D.invest.aportes=[{id:'person-select',data:'06/10/2026',mes:'out/26',conta:'Banco teste',pessoa:'Conjunto',valor:100,naCarteira:false}];renderAportes();
        const person=document.getElementById('tbl-aportes').rows[1].cells[3].querySelector('select');person.value='Esposa';person.dispatchEvent(new Event('change'));results.push(pessoaSum('Esposa')===100);
        return results;
      }finally{D=saved;suppressPush=false;clearTimeout(pushTimer);pushTimer=null;renderAll();}
    });
    assert.ok(history.every(Boolean),'Falha de preservação do histórico/destino: '+JSON.stringify(history));
    console.log('✅ Seis grupos de contas: edição/exclusão atual e futura preservam valores e pagos antigos; desfazer, inclusão, divisão e renda por vigência');
    console.log('✅ Alterações mensais independentes se juntam entre aparelhos; dados preservados após reabrir');
    console.log('✅ Aportes: destino desconhecido explícito, conta e ativo editáveis, descrição separada e total mantido');
    assert.equal(errors.length,0,errors.join('\n'));assert.ok(puts>=2);console.log('✅ Sem erros JavaScript; nenhuma conexão com banco real');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

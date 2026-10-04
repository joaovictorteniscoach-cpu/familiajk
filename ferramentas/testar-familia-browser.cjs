/* Testes locais isolados: nenhum acesso ao banco real da família.
   NODE_PATH=... JV_BROWSER=... node ferramentas/testar-familia-browser.cjs */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
let count=0;
function ok(label,value){assert.ok(value,label);console.log('✅ '+label);count++;}
const server=http.createServer((req,res)=>{
  let f=path.join(root,decodeURI(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
  if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const type={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png'}[path.extname(f)];
  try{if(type)res.setHeader('Content-Type',type);res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}
});
async function contrast(p){return p.evaluate(()=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
  const lum=c=>c.slice(0,3).map(v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  const issues=[];
  for(const e of document.querySelectorAll('body *')){
    if(!e.getClientRects().length||!Array.from(e.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))continue;
    const s=getComputedStyle(e);if(s.visibility==='hidden'||s.opacity!=='1')continue;
    let bg=null,part=e;
    while(part){const c=getComputedStyle(part);if(c.backgroundImage!=='none'||c.opacity!=='1')break;const b=rgb(c.backgroundColor);if(b.length===3||b[3]===1){bg=b;break;}if(b[3]>0)break;part=part.parentElement;}
    if(!bg)continue;
    let fg=rgb(s.webkitTextFillColor||s.color);if(fg.length===4)fg=fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));
    const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700);
    if(ratio<(large?3:4.5))issues.push({text:e.textContent.trim().slice(0,55),ratio:+ratio.toFixed(2)});
  }
  return issues;
});}
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.JV_BROWSER,args:['--no-sandbox']});
  try{
    const c=await browser.newContext({viewport:{width:393,height:852},serviceWorkers:'block'});
    let remote=null,denied=false,requests=[];
    await c.route('**/*',route=>{
      const req=route.request(),u=new URL(req.url());
      if(u.origin===base)return route.continue();
      if(u.hostname==='familia-teste.invalid'){
        requests.push(req.method());
        return route.fulfill({status:denied?403:200,contentType:'application/json',body:JSON.stringify(req.method()==='GET'?remote:{ok:true})});
      }
      return route.abort();
    });
    const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
    await p.goto(base+'/app-familia/',{waitUntil:'load'});
    ok('Inicialização sem CDN, sem erros JS e gráfico local',!errors.length&&await p.evaluate(()=>!!D&&typeof Chart==='function'));
    const allIssues=[];
    for(const mode of ['contas','invest']){
      await p.evaluate(m=>setMode(m),mode);
      const ids=await p.locator('#tabs button[data-id]').evaluateAll(es=>es.map(e=>e.dataset.id));
      ok(mode+': todas as abas numa faixa só, sem função duplicada',await p.locator('#tabs>button').count()===ids.length&&ids.length===new Set(ids).size&&ids.length===(mode==='contas'?15:12));
      for(const id of ids){
        const btn=p.locator('#tabs button[data-id="'+id+'"]');
        await btn.click();
        ok(mode+' / '+id,await p.locator('section[data-tab="'+id+'"].on').isVisible()&&await p.locator('section[data-tab].on').count()===1);
        allIssues.push(...(await contrast(p)).map(x=>({page:id,...x})));
      }
    }
    await p.evaluate(()=>setMode('contas'));
    for(const width of [320,360,393,430,768,1280]){
      await p.setViewportSize({width,height:852});
      const size=await p.evaluate(()=>({s:document.documentElement.scrollWidth,w:innerWidth}));
      ok('Navegação proporcional '+width+'px',size.s<=size.w+1);
    }
    await p.setViewportSize({width:393,height:852});
    await p.evaluate(()=>openFalar());await p.locator('#fl-texto').fill('gastei 40 reais de uber');await p.evaluate(()=>onFalarTexto(1));
    ok('Lançamento por frase: prévia antes de salvar',await p.evaluate(()=>fl.valor===40&&fl.tipo==='saida'&&getComputedStyle(document.getElementById('fl-previa')).display!=='none'));
    const before=await p.evaluate(()=>D.contas.transacoes.length);await p.evaluate(()=>falarLancar());
    ok('Lançamento local sem apagar os anteriores',await p.evaluate(()=>D.contas.transacoes.length)===before+1);
    await p.evaluate(()=>{openFalar();document.getElementById('fl-texto').value='gastei 40 reais de uber';onFalarTexto(1);falarLancar();});
    ok('Não duplica o mesmo lançamento',await p.evaluate(()=>D.contas.transacoes.length)===before+1);
    const shared=await p.evaluate(()=>JSON.parse(decodeURIComponent(escape(atob(shareURL().split('#d=')[1])))));
    ok('Link de compartilhamento preservado, sem campo de senha',shared.contas.transacoes.length===before+1&&await p.locator('input[type=password]').count()===0);
    const data=await p.evaluate(()=>JSON.parse(JSON.stringify(D)));data.nomes.preta='Teste de sincronização';remote={updatedAt:Date.now(),data:JSON.stringify(data)};
    await p.evaluate(()=>{document.getElementById('cl-url').value='https://familia-teste.invalid/jk.json';document.getElementById('cl-on').checked=true;cloudApply();});
    await p.waitForFunction(()=>cloudReadyUrl===D.cloud.url);
    ok('Conectar busca primeiro: nenhuma escrita automática',requests.every(x=>x==='GET')&&await p.evaluate(()=>D.nomes.preta==='Teste de sincronização'));
    await p.evaluate(()=>cloudPush());ok('Enviar explícito funciona após sincronizar',requests.at(-1)==='PUT');
    denied=true;requests=[];
    await p.evaluate(()=>{document.getElementById('cl-url').value='https://familia-teste.invalid/negado.json';cloudApply();});
    await p.waitForFunction(()=>document.getElementById('cl-status').textContent.includes('403'));
    await p.evaluate(()=>schedulePush());
    ok('Erro de acesso preserva dados e bloqueia envio automático',await p.evaluate(()=>cloudReadyUrl===''&&D.nomes.preta==='Teste de sincronização')&&requests.every(x=>x==='GET'));
    denied=false;remote=null;requests=[];
    await p.evaluate(()=>{document.getElementById('cl-url').value='https://familia-teste.invalid/vazio.json';cloudApply();});
    await p.waitForFunction(()=>document.getElementById('cl-status').textContent.includes('nuvem vazia'));
    ok('Nuvem vazia não substitui dados nem envia exemplos',requests.every(x=>x==='GET')&&await p.evaluate(()=>D.contas.transacoes.length)===before+1);
    await p.evaluate(()=>{document.getElementById('cl-on').checked=false;cloudApply();});
    ok('Sem exceções durante os fluxos',errors.length===0);
    assert.deepEqual(allIssues,[]);ok('Contraste das superfícies sólidas nas 27 abas',true);
    // Não grava dados reais nem altera regras. iOS: simula somente capacidade da interface.
    const ios=await browser.newContext({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',serviceWorkers:'block'});
    await ios.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
    await ios.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));const ip=await ios.newPage();await ip.goto(base+'/app-familia/');await ip.evaluate(()=>openFalar());
    ok('iPhone instalado: orienta ditado do teclado sem prometer gravação',await ip.locator('#fl-nota').textContent().then(x=>x.includes('teclado'))&&!await ip.locator('#fl-mic').isVisible());
    if(process.env.JK_PREVIEW){await p.evaluate(()=>{setMode('contas');window.scrollTo(0,0);});await p.screenshot({path:process.env.JK_PREVIEW});}
    await ios.close();await c.close();console.log('\n'+count+' verificações · 0 falhas');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});

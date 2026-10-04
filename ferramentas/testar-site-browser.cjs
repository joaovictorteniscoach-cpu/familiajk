/* Navegador: site servido localmente, sem Firebase nem rede externa. */
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURI(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const f=file.endsWith(path.sep)||!path.extname(file)?path.join(file,'index.html'):file;
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'};
  try{res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
  catch{res.writeHead(404).end('Ausente');}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch();
  try{
    for(const width of [320,390,768,1280]){
      const context=await browser.newContext({viewport:{width,height:852}});
      await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
      const p=await context.newPage(),errors=[],missing=[];
      p.on('pageerror',err=>errors.push(err.message));
      p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push(r.url());});
      await p.goto(base+'/site/',{waitUntil:'load'});
      const input=p.locator('#calc-aulas');
      assert.equal(await p.locator('#calc-pessoas-wrap').isVisible(),false);
      await input.fill('');assert.equal(await input.inputValue(),'');
      assert.equal(await p.locator('#calc-resultado').isVisible(),false);
      await input.pressSequentially('10');assert.equal(await input.inputValue(),'10');
      assert.match(await p.locator('#calc-total').textContent(),/1\.600/);
      await input.fill('2');await input.press('Tab');assert.equal(await input.inputValue(),'3');
      await input.fill('4');
      await p.locator('#calc-modalidade').selectOption('grupo');
      assert.equal(await p.locator('#calc-pessoas-wrap').isVisible(),true);
      await p.locator('#calc-pessoas').selectOption('4');
      assert.match(await p.locator('#calc-total').textContent(),/340.*por pessoa/);
      assert.match(decodeURIComponent(await p.locator('#calc-whatsapp').getAttribute('href')),/por pessoa/);
      await p.locator('#calc-modalidade').selectOption('familia');
      assert.match(await p.locator('#calc-total').textContent(),/800/);
      const dimensions=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:innerWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&e.getClientRects().length).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,right:Math.round(e.getBoundingClientRect().right)}))}));
      assert.ok(dimensions.scroll<=dimensions.view+1,JSON.stringify(dimensions));
      const link=await p.locator('a[data-app-aluno]').first().getAttribute('href');
      assert.equal(link,'/app-aluno/');
      if(width<=640){
        await p.locator('#mtgl').click();
        assert.equal(await p.locator('#nav').isVisible(),true);
        assert.equal(await p.locator('#nav a[data-app-aluno]').isVisible(),true);
        await p.locator('#mtgl').click();
      }
      assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
      console.log('✅ Site no navegador: '+width+'px, calculadora, links e arquivos');
      await context.close();
    }
  }finally{await browser.close();server.close();}
})().catch(err=>{console.error(err);server.close();process.exitCode=1;});

/* Leitura (contraste) do site e das páginas públicas (28/10). A varredura
   achou o botão do WhatsApp com letra branca no verde (1,98), o nome da
   academia sumido no topo da Privacidade (1,06) e letras pequenas claras
   demais. Mede cada texto pela imagem da tela (medir-contraste-pixels.cjs),
   no celular (390 px) e no computador (1280 px). Régua WCAG AA: 4,5:1 para
   texto normal e 3:1 para texto grande. JV_CONTRASTE_LISTA=1 lista tudo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
const PAGINAS=['site/','site/metodologia.html','site/privacidade.html','site-pro/','site-pro/curso.html','site-pro/sistema.html','app-exercicios/'];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 const falhas=[];let total=0,telas=0;
 try{
  for(const largura of [390,1280])for(const pg of PAGINAS){
   const c=await browser.newContext({viewport:{width:largura,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();return r.continue();});
   const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));
   await p.goto(base+'/'+pg,{waitUntil:'load'});await p.waitForTimeout(400);
   // as seções que aparecem ao rolar ficam visíveis de uma vez
   await p.addStyleTag({content:'*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important;animation-delay:0s!important}.rv,.reveal{opacity:1!important;transform:none!important}'});
   await p.evaluate(()=>document.querySelectorAll('.rv,.reveal').forEach(e=>e.classList.add('in','on','vis','visible','show')));
   await p.waitForTimeout(200);
   const itens=await medir(p);total+=itens.length;telas++;
   assert.ok(itens.length>=20,pg+' '+largura+': mediu textos');
   for(const it of itens)if(it.ratio!==null&&it.ratio<it.minimo)falhas.push(pg+' · '+largura+'px · '+JSON.stringify(it.t)+' · '+it.ratio+'/'+it.minimo+' · '+it.fg+' sobre '+it.fundo+' · '+it.onde);
   assert.deepEqual(erros,[],pg+': erro na página');
   await c.close();
  }
  console.log(telas+' páginas · '+total+' textos medidos · '+falhas.length+' abaixo da régua');
  if(process.env.JV_CONTRASTE_LISTA)falhas.forEach(f=>console.log('   '+f));
  assert.deepEqual(falhas,[],'textos difíceis de ler no site');
  console.log('\n✅ leitura ok no site e nas páginas públicas (celular e computador)');
 }catch(e){console.error('❌ '+(e.stack||e).toString().slice(0,4000));process.exitCode=1;}
 finally{await browser.close();server.close();}
})();

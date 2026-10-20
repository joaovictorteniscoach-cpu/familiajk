/* Vidro Aero (20/10): cartões, abas escolhidas, barra de baixo e janelas
   ganham o reflexo de vidro (sombra interna clara no alto) nos dois temas,
   sem trocar a cor de fundo; no Verde clássico a barra fica quase opaca (o
   Saibro já tinha a dele de vidro a 70%, com desfoque). A leitura de todas as telas é medida no teste de contraste.
   Só dados fictícios. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
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
   await g.goto(base+'/app-gestao/',{waitUntil:'load'});
   await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
   await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}'});
   await g.evaluate(()=>{persist=()=>{};publish=()=>{};MODO='dono';
    DB.alunos=[{id:'a1',nome:'Aluno Um',codigo:'a1',tipo:'Particular',plano:4,creditos:2,repos:0,mensalidade:640,status:'pago',arquivado:false}];
    ensureFields();CARREGADO=true;renderAll();});
   const brilho=s=>/inset/.test(s)&&/rgba\(255, 255, 255/.test(s);
   await check(tema+': cartões, aba escolhida, barra e janela com reflexo de vidro',async()=>{
    const r=await g.evaluate(()=>{const bs=sel=>{const e=document.querySelector(sel);return e?getComputedStyle(e).boxShadow:'';};
     go('fin',document.createElement('button'));const card=bs('#pg-fin .fin-card');
     go('alunos',document.createElement('button'));const aba=bs('.seg button.on, #pg-alunos button.on');
     const nav=getComputedStyle(document.querySelector('.nav'));
     openLancModal();const modal=bs('#ov-lanc .modal');closeModal('ov-lanc');
     return {card,aba,nav:nav.boxShadow,navBg:nav.backgroundColor,modal};});
    for(const k of ['card','aba','nav','modal'])assert.ok(brilho(r[k]),k+': '+r[k]);
    const a=Number((r.navBg.match(/[\d.]+/g)||[])[3]||1);assert.ok(a>=(tema==='saibro'?0.65:0.9),'barra encorpada: '+r.navBg);   // Saibro já tinha a barra de vidro a 70% com desfoque
   });
   await check(tema+': topo das outras páginas leve: mês numa pílula só e nuvem em etiqueta curta',async()=>{
    const r=await g.evaluate(()=>{go('alunos',document.createElement('button'));
     const out={};for(const [k,t] of [['abriu','⚠ abriu sem falar com a nuvem ⓘ'],['dados','⚠ confira os dados antes de salvar'],['sessao','⚠ outra sessão alterou os dados'],['ok','✓ salvo na nuvem 08:14']]){
      setSave(t,k==='ok'?'ok':'err');const e=document.getElementById('save-state');out[k]={txt:e.textContent,title:e.title};}
     const top=document.querySelector('.top').getBoundingClientRect(),ss=document.getElementById('save-state').getBoundingClientRect();
     const btn=getComputedStyle(document.querySelector('.top .month-btn'));
     return {out,larg:ss.width/top.width,altura:Math.round(ss.height),btnBorda:btn.borderTopWidth,btnFundo:btn.backgroundColor};});
    assert.equal(r.out.abriu.txt,'⚠ Conferir nuvem ⓘ');assert.equal(r.out.abriu.title,'⚠ abriu sem falar com a nuvem ⓘ','o texto inteiro fica no title');
    assert.equal(r.out.dados.txt,'⚠ Conferir dados ⓘ');assert.equal(r.out.sessao.txt,'⚠ Outra sessão ⓘ');assert.equal(r.out.ok.txt,'✓ Nuvem');
    assert.ok(r.larg<0.5,'etiqueta do tamanho do texto, não faixa esticada: '+r.larg);assert.ok(r.altura<=36,'uma linha: '+r.altura);
    assert.equal(r.btnBorda,'0px');assert.equal(r.btnFundo,'rgba(0, 0, 0, 0)','setas soltas, sem caixinha');
   });
   assert.deepEqual(erros,[]);await c.close();
  }
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · vidro Aero');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

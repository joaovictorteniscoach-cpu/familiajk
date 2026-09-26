/* Teste visual isolado. Requer Playwright e Chromium; não acessa Firebase.
   NODE_PATH=... JV_BROWSER=... JV_PREVIEWS=... node ferramentas/testar-premium-browser.cjs
   Fixtures apenas neste checker, nunca na publicação dos apps. */
const { chromium } = require('playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = process.env.JV_PREVIEWS || require('node:os').tmpdir() + '/jv-premium-previews';
fs.mkdirSync(output, { recursive: true });
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server = http.createServer((req,res) => {
  let f = path.join(root, decodeURI(req.url.split('?')[0]));
  if (f.endsWith('/')) f += 'index.html';
  if (!f.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f)); }
  catch { res.writeHead(404).end('Missing'); }
});
const aluno = {id:'teste-a',codigo:'9999',nome:'Aluno de Teste',tipo:'Tênis',plano:4,planoGrupo:0,creditos:3,repos:1,mensalidade:640,status:'pago',diaVenc:10,ativo:true,avaliacoes:[],registros:[]};
const db = {alunos:[aluno],lancamentos:[],meta:10000,agenda:{fixos:[],eventos:[],excecoes:[]},presencas:[],compromissos:[],aviso:'',locacaoOnly:null,horarioCfg:null,horarioData:null,savedAt:Date.now(),torneios:{atual:'t',lista:{t:{id:'t',nome:'Barragem de teste',grupos:['A'],jogadores:[{name:'Aluno de Teste Sobrenome Longo',group:'A',v:2,d:1,wo:0},{name:'Jogador de Teste',group:'A',v:1,d:2,wo:0}]}}}};
const widths = [320,360,390,393,430,768,1280];
let count = 0;
const contrastFindings=[];
async function auditContrast(p,label) {
  // Amostras mensuráveis de texto sobre cores sólidas. Gradientes/imagens
  // exigem revisão visual separada; não são declarados aprovados aqui.
  const findings=await p.evaluate(()=>{
    const rgb=s=>{const m=s.match(/[\d.]+/g);return m?m.map(Number):[0,0,0,0];};
    const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
    const out=[];
    for(const e of document.querySelectorAll('body *')) {
      if(!e.getClientRects().length||!Array.from(e.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))continue;
      const s=getComputedStyle(e);if(s.visibility==='hidden'||s.opacity!=='1')continue;
      let bg=null,part=e;
      while(part){const c=getComputedStyle(part);if(c.backgroundImage!=='none'||c.opacity!=='1')break;
        const b=rgb(c.backgroundColor);if(b.length===3||b[3]===1){bg=b;break;}if(b[3]>0)break;part=part.parentElement;}
      if(!bg)continue;
      let fg=rgb(s.webkitTextFillColor||s.color);if(fg.length===4)fg=fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));
      const l1=lum(fg),l2=lum(bg),ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
      const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700);
      if(ratio<(large?3:4.5))out.push({tag:e.tagName,id:e.id,cls:e.className,text:e.textContent.trim().slice(0,80),ratio:+ratio.toFixed(2),color:s.webkitTextFillColor||s.color,background:bg,font:s.fontSize});
    }
    return out;
  });
  contrastFindings.push({page:label,findings});
}
async function ok(label, fn) { await fn(); console.log('✅ ' + label); count++; }
async function fit(p, width, label) {
  const size = await p.evaluate(() => ({scroll:document.documentElement.scrollWidth,view:innerWidth}));
  assert.ok(size.scroll <= width+1, label + ': overflow ' + JSON.stringify(size));
}
async function capture(p,name) { await p.screenshot({path:path.join(output,name+'.png')}); }
(async () => {
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.JV_BROWSER || undefined,args:['--no-sandbox']});
  try {
    for (const app of ['aluno','gestao']) {
      const context=await browser.newContext({viewport:{width:393,height:852},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
      // Bloqueia TODA rede externa e remove os SDKs Firebase da cópia de teste.
      await context.route('**/*', route => {
        const u=new URL(route.request().url());
        if(u.origin!==base)return route.abort();
        if(u.pathname.includes('/lib/firebase-'))return route.fulfill({body:'',contentType:'text/javascript'});
        return route.continue();
      });
      await context.addInitScript(data=>{localStorage.setItem('jvtenis-gestao-v1',JSON.stringify(data));sessionStorage.setItem('jv-bk-adiar','1');},db);
      const p=await context.newPage(),errors=[],renderErrors=[];
      p.on('pageerror', e=>errors.push(e.message));
      p.on('console', m=>{if(/^Render .+ falhou:/.test(m.text()))renderErrors.push(m.text());});
      await p.goto(base+'/app-'+app+'/',{waitUntil:'load'});
      await p.waitForTimeout(6500); // boot offline documentado pelos apps
      if(app==='aluno')await p.evaluate(a=>{
        EU=a;MEU={codigo:a.codigo,pedidos:[],cancelados:[]};
        PUB={alunos:[a],horas:['08:00','09:00','16:00','17:00','18:00','19:00'],grade:{fixos:[{id:'test-fixed',cod:a.codigo,dia:1,hora:'17:00'}],eventos:[],excecoes:[]},pix:'',historico:{},aviso:''};
        VINCULO_ESTADO='ativo';_renovaAdiado=true;show();
      },aluno);
      else await p.evaluate(()=>{
        document.getElementById('splash-gestao').style.display='none';
        document.getElementById('barra-versao').style.display='none';
        hideVals=false;renderAll();setSave('Prévia local · dados de teste');
        DB.agenda.fixos=[{id:'test-fixed',alunoId:'teste-a',nome:'Aluno de Teste',dia:1,hora:'17:00',tipo:'aula'}];renderAgenda();
      });
      for(const width of widths) {
        await p.setViewportSize({width,height:852});
        await ok(app+' ícones proporcionais e alvos de toque '+width+'px',async()=>{
          const sizes=await p.locator('.nav button').evaluateAll(nodes=>nodes.map(e=>{
            const b=e.getBoundingClientRect(),s=e.querySelector('svg').getBoundingClientRect();
            return {width:b.width,height:b.height,icon:s.width};
          }));
          for(const s of sizes){assert.ok(s.width>=44&&s.height>=44,JSON.stringify(s));assert.ok(s.icon<=20,JSON.stringify(s));}
        });
        const pages=app==='aluno'?['inicio','agenda','evolucao','creditos','perfil']:['dash','agenda','alunos','fin'];
        for(const id of pages) {
          await p.locator(app==='aluno'?`.nav button[onclick="goAluno('${id}',this)"]`:`.nav button[onclick="go('${id}',this)"]`).click();
          await ok(app+' '+width+'px · '+id,async()=>{await fit(p,width,id);assert.equal(await p.locator(app==='aluno'?'#app .page.on':'.page.on').count(),1);});
          if(app==='aluno'&&['creditos','perfil'].includes(id))await ok('Sem espaço vazio antes de '+id+' '+width+'px',async()=>{
            const gap=await p.evaluate(id=>document.querySelector('#apg-'+id+' .jv-subhero').getBoundingClientRect().top-document.querySelector('#app>.top').getBoundingClientRect().bottom,id);
            assert.ok(gap<40,'Espaço vazio: '+gap);
          });
          if(width===393){await capture(p,app+'-'+id+'-393');await auditContrast(p,app+'-'+id);}
        }
        if(app==='gestao') {
          for(const id of ['aval','lanc','torneio','graf','fech','profs']) {
            await p.locator('#nav-mais').click();
            await p.locator(`#mais-pop button[onclick="irDoMais('${id}')"]`).click();
            await ok('Mais '+id+' '+width+'px',()=>fit(p,width,id));
            if(width===393)await auditContrast(p,app+'-'+id);
            if(id==='torneio') {
              await ok('Torneio: ações alcançáveis '+width+'px',async()=>{
                const scroll=p.locator('.tg-table-scroll').first();
                await scroll.evaluate(e=>e.scrollLeft=e.scrollWidth);
                const visible=await scroll.evaluate(e=>{const b=e.getBoundingClientRect(),a=e.querySelector('.tg-x').getBoundingClientRect();return a.right<=b.right+1&&a.left>=b.left;});
                assert.ok(visible);await scroll.evaluate(e=>e.scrollLeft=0);
              });
              if(width===393){await p.locator('.tg-table-scroll').first().scrollIntoViewIfNeeded();await capture(p,'gestao-torneio-393');}
            }
          }
          await p.locator('.nav button[onclick="go(\'agenda\',this)"]').click();
          for(const view of ['dia','semana','mes','tri']) {
            await p.locator(`#pg-agenda .seg button[onclick="setView('${view}',this)"]`).click();
            await ok('Agenda '+view+' '+width+'px',()=>fit(p,width,view));
          }
          await p.locator('#pg-agenda .seg button[onclick="setView(\'semana\',this)"]').click();
          await p.evaluate(()=>{wkZoom=1;aplicarWkVars();});
          const before=await p.locator('.wk').evaluate(e=>e.getBoundingClientRect().width);
          await p.locator('.wk-zoom [title="Aumentar"]').click();
          const after=await p.locator('.wk').evaluate(e=>e.getBoundingClientRect().width);
          await p.locator('.wk-zoom [title="Diminuir"]').click();
          const smaller=await p.locator('.wk').evaluate(e=>e.getBoundingClientRect().width);
          await ok('Zoom + e − '+width+'px',()=>{if(width<720){assert.ok(after>before);assert.ok(smaller<after);}assert.equal(smaller,before);});
          await p.locator('.wk-zoom .wz-fit').click();
          await ok('Zoom Semana toda '+width+'px',async()=>{
            const dims=await p.locator('.wk-scroll').evaluate(e=>({w:e.clientWidth,s:e.scrollWidth}));
            assert.ok(dims.s<=dims.w+3,JSON.stringify(dims));
            assert.ok(await p.locator('.wk-cell').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=11.5));
          });
          if(width===393)await capture(p,'gestao-agenda-zoom-393');
          if(width===1280)await capture(p,'gestao-agenda-desktop');
        }
      }
      if(app==='aluno') {
        await ok('P0: aviso pendente aparece e some após aprovação',async()=>{
          await p.evaluate(()=>{VINCULO_ESTADO='pendente';renderVinculoStatus();});assert.ok(await p.locator('#vinculo-status-box').isVisible());
          await p.evaluate(()=>{VINCULO_ESTADO='ativo';renderVinculoStatus();});assert.ok(!await p.locator('#vinculo-status-box').isVisible());
        });
        await ok('PIX: botão depende da chave real publicada',async()=>{
          await p.evaluate(()=>{goAluno('inicio',document.getElementById('nav-al-inicio'));PUB.pix='';renderPremiumAluno();});assert.ok(!await p.locator('#home-pix-btn').isVisible());
          await p.evaluate(()=>{PUB.pix='teste@example.invalid';renderPremiumAluno();});assert.ok(await p.locator('#home-pix-btn').isVisible());
          assert.equal(await p.locator('#home-pix-btn').getAttribute('onclick'),'pagarPix()');
        });
        await ok('Avatar: upload, compressão e isolamento por aluno',async()=>{
          await p.locator('#avatar-aluno-file').setInputFiles(path.join(root,'app-aluno/jv-icone-aluno-512.png'));
          await p.waitForFunction(()=>document.getElementById('avatar-aluno-img').style.display==='block');
          const data=await p.evaluate(()=>localStorage.getItem(chaveAvatarAluno()));assert.match(data,/^data:image\/(webp|jpeg);base64,/);
          assert.equal(await p.locator('#avatar-aluno-img').evaluate(e=>e.naturalWidth),320);
          await p.evaluate(()=>{MEU.codigo='0000';carregarAvatarAluno();});assert.ok(!await p.locator('#avatar-aluno-img').isVisible());
          await p.evaluate(()=>{MEU.codigo='9999';carregarAvatarAluno();});assert.ok(await p.locator('#avatar-aluno-img').isVisible());
        });
      }
      await ok(app+': sem exceções JS nem renderizadores quebrados',()=>{assert.deepEqual(errors,[]);assert.deepEqual(renderErrors,[]);});
      await context.close();
    }
    fs.writeFileSync(path.join(output,'contrast-findings.json'),JSON.stringify(contrastFindings,null,2));
    await ok('Contraste de texto nas superfícies sólidas amostradas (gradientes: revisão visual)',()=>{
      assert.deepEqual(contrastFindings.filter(x=>x.findings.length),[]);
    });
    console.log('\n'+count+' verificações no navegador · 0 falhas');
  } finally { await browser.close();server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

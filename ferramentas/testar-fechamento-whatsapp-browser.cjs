/* Fechamento: escolher o aluno (lista "Quem falta" ou seletor) abre a conversa
   dele no WhatsApp do cadastro, dentro do toque — antes o app esperava a imagem
   e o celular bloqueava a janela, mas marcava "enviado" mesmo assim. Bloqueada
   a janela, aparece um botão e só ele marca o envio. Dados fictícios. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let f=path.join(root,decodeURI(req.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
 catch{res.writeHead(404).end();}
});
let count=0;
async function check(name,fn){await fn();count++;console.log('✅ '+name);}

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,b=await chromium.launch({headless:true});
 try{
  const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();
   if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const g=await c.newPage(),errors=[];g.on('pageerror',e=>errors.push(e.message));g.on('dialog',d=>d.dismiss());
  await g.clock.setFixedTime(new Date('2026-10-15T10:00:00-03:00'));
  await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,{},{timeout:15000});
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#toast,#barra-versao,#barra-endereco{display:none!important}'});
  const preparar=bloquear=>g.evaluate(bloquear=>{
   persist=()=>{};guardarVersoes=()=>{};logAct=()=>{};hideVals=false;
   const base={tipo:'Particular',plano:4,planoGrupo:0,creditos:2,credGrupo:0,repos:0,locCred:0,mensalidade:640,status:'pendente',diaVenc:10,ativo:true};
   DB.alunos=[Object.assign({id:'ana',nome:'Ana Teste',codigo:'8801',tel:'(41) 99999-0000'},base),
              Object.assign({id:'bru',nome:'Bruno Teste',codigo:'8802',tel:'5541988887777'},base),
              Object.assign({id:'car',nome:'Carla Teste',codigo:'8803',tel:''},base)];
   DB.agenda={fixos:[],eventos:[],excecoes:[]};DB.presencas=[];DB.fechEnviado={};
   ensureFields();CARREGADO=true;
   document.querySelectorAll('.overlay.on').forEach(e=>e.classList.remove('on'));
   const s=document.getElementById('splash-gestao');if(s)s.style.display='none';
   window.ordem=[];window.abertos=[];window.toasts=[];toast=m=>window.toasts.push(m);
   window.open=(u)=>{window.ordem.push('abriu');window.abertos.push(u);return bloquear?null:{};};
   _fechBlob=()=>new Promise(r=>setTimeout(()=>{window.ordem.push('imagem');r(null);},300));
   window.ALUNOS=JSON.stringify(DB.alunos);
   go('fech',document.createElement('button'));abrirFechamento();
  },bloquear);
  const mk=await g.evaluate(()=>(document.getElementById('fc-mes')||{}).value||monthKey());

  await check('tocar no nome na fila abre na hora a conversa daquele aluno, no número do cadastro',async()=>{
   await preparar(false);
   await g.locator('#fc-fila .fq-nome',{hasText:'Ana Teste'}).click();
   const r=await g.evaluate(mk=>({ordem:ordem.slice(),abertos:abertos.slice(),sel:document.getElementById('fc-aluno').value,
    marcado:!!(DB.fechEnviado[mk]&&DB.fechEnviado[mk].ana)}),mk);
   assert.equal(r.abertos.length,1);assert.match(r.abertos[0],/^https:\/\/wa\.me\/5541999990000\?text=/);
   const txt=decodeURIComponent(r.abertos[0].split('?text=')[1]);
   assert.match(txt,/Olá Ana!/);assert.match(txt,/fechamento/);assert.doesNotMatch(txt,/desconto/i);
   assert.deepEqual(r.ordem,['abriu'],'a conversa abre antes da imagem ficar pronta');
   assert.equal(r.sel,'ana');assert.equal(r.marcado,true);
   await g.waitForTimeout(400);
   assert.deepEqual(await g.evaluate(()=>ordem.slice()),['abriu','imagem'],'a imagem é salva logo depois');
  });
  await check('escolher no seletor também envia; número com 55 não vira 5555',async()=>{
   await preparar(false);
   await g.selectOption('#fc-aluno','bru');
   const r=await g.evaluate(()=>abertos.slice());
   assert.equal(r.length,1);assert.match(r[0],/^https:\/\/wa\.me\/5541988887777\?text=/);
  });
  await check('aluno sem WhatsApp: não abre nada, mostra o fechamento e avisa (caso negativo)',async()=>{
   await preparar(false);
   await g.locator('#fc-fila .fq-nome',{hasText:'Carla Teste'}).click();
   const r=await g.evaluate(mk=>({abertos:abertos.length,toast:toasts.join(' | '),marcado:!!(DB.fechEnviado[mk]&&DB.fechEnviado[mk].car),
    sel:document.getElementById('fc-aluno').value}),mk);
   assert.equal(r.abertos,0);assert.match(r.toast,/Sem WhatsApp no cadastro/);assert.equal(r.marcado,false);assert.equal(r.sel,'car');
  });
  await check('celular bloqueou a janela: aparece o botão, e só ele marca como enviado',async()=>{
   await preparar(true);
   await g.locator('#fc-fila .fq-nome',{hasText:'Ana Teste'}).click();
   let r=await g.evaluate(mk=>({marcado:!!(DB.fechEnviado[mk]&&DB.fechEnviado[mk].ana),
    href:(document.querySelector('#fc-envio-hint a.fc-abrir')||{}).href||''}),mk);
   assert.equal(r.marcado,false);assert.match(r.href,/^https:\/\/wa\.me\/5541999990000\?text=/);
   r=await g.evaluate(mk=>{const a=document.querySelector('#fc-envio-hint a.fc-abrir');a.addEventListener('click',e=>e.preventDefault());a.click();
    return {marcado:!!(DB.fechEnviado[mk]&&DB.fechEnviado[mk].ana)};},mk);
   assert.equal(r.marcado,true);
  });
  await check('nomes da fila com 📲 só para quem tem WhatsApp; nenhum cadastro muda',async()=>{
   await preparar(false);
   const r=await g.evaluate(()=>({wa:[...document.querySelectorAll('#fc-fila .fq-nome')].map(x=>x.textContent+':'+(x.dataset.wa||'-')),
    igual:JSON.stringify(DB.alunos)===window.ALUNOS}));
   assert.deepEqual(r.wa,['Ana Teste:1','Bruno Teste:1','Carla Teste:-']);assert.equal(r.igual,true);
  });
  assert.deepEqual(errors,[]);
  console.log('\n✅ '+count+' verificações · fechamento direto no WhatsApp');
 }catch(e){console.error('❌ '+(e&&e.message||e));process.exitCode=1;}
 finally{await b.close();server.close();}
})();

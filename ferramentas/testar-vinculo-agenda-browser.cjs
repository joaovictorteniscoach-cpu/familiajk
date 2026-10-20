/* Horário que o app do aluno não vê (20/10). Caso real: duas horas seguidas
   do mesmo aluno na Gestão, e no app dele só uma aparecia como "Sua aula" —
   a outra estava sem vínculo (nome digitado diferente do cadastro) ou ligada
   a um cadastro antigo, inativo, de mesmo nome. Confere: a publicação usa o
   cadastro ativo; a conferência só lista; o botão "Ligar a…" pergunta, liga
   e desfaz; marcar digitando o nome pergunta se liga; inativo vai para o fim
   da lista, marcado. Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-10-20T07:00:00-03:00');   // terça
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
  const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
  await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
  await c.addInitScript(()=>{sessionStorage.setItem('jv-bk-adiar','1');});
  const g=await c.newPage(),erros=[],dialogos=[];g.on('pageerror',e=>erros.push(e.message));
  let resposta=true;g.on('dialog',d=>{dialogos.push(d.message());resposta?d.accept():d.dismiss();});
  await g.clock.install({time:AGORA});await g.goto(base+'/app-gestao/',{waitUntil:'load'});
  await g.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO);
  await g.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao{display:none!important}#toast{display:none!important}'});
  await g.evaluate(()=>{persist=()=>{};publish=()=>{};logAct=()=>{};MODO='dono';
   const al=(id,nome,cod,x)=>Object.assign({id,nome,codigo:cod,tipo:'Particular',plano:4,creditos:4,repos:0,mensalidade:640,status:'pago',arquivado:false},x||{});
   DB.alunos=[al('a9','Aluno Exemplo','1009',{arquivado:true}),al('a1','Aluno Exemplo','1001'),al('b1','Bruno Teste Silva','2001'),al('b2','Bruna Outra','2002')];
   DB.agenda={fixos:[],excecoes:[],eventos:[
    {id:'e1',data:'2026-10-20',hora:'08:00',titulo:'Aluno Exemplo',tipo:'aula',alunoId:'a1'},
    {id:'e2',data:'2026-10-20',hora:'09:00',titulo:'Aluno Exemplo',tipo:'aula',alunoId:'a9'},     // ligado ao cadastro velho
    {id:'e3',data:'2026-10-23',hora:'10:00',titulo:'Bruno Teste',tipo:'aula',alunoId:null},       // nome digitado, não bate igual
    {id:'e4',data:'2026-10-23',hora:'11:00',titulo:'Bruno Teste Silva',tipo:'aula',alunoId:'b1'}]};
   ensureFields();CARREGADO=true;renderAll();});
  await check('a publicação liga ao cadastro ATIVO quando o nome é igual (antes valia o primeiro da lista)',async()=>{
   const r=await g.evaluate(()=>[codigoDaEntrada({titulo:'Aluno Exemplo'}),acharAlunoPorTitulo('aluno exemplo').id,codigoDaEntrada(DB.agenda.eventos[0])]);
   assert.deepEqual(r,['1001','a1','1001']);
  });
  await check('a conferência lista as horas que o aluno não vê, com o motivo, sem mudar nada',async()=>{
   const antes=await g.evaluate(()=>JSON.stringify(DB));
   const r=await g.evaluate(()=>({a1:horariosQueOAlunoNaoVe(DB.alunos[1]).map(h=>h.quando+' | '+h.motivo),b1:horariosQueOAlunoNaoVe(DB.alunos[2]).map(h=>h.quando+' | '+h.motivo),
     b2:horariosQueOAlunoNaoVe(DB.alunos[3]).length,inativo:horariosQueOAlunoNaoVe(DB.alunos[0]).length,
     achado:achadosDoAluno(DB.alunos[1]).map(x=>x.txt).join(' || ')}));
   assert.deepEqual(r.a1,['20/10 09:00 | ligado ao cadastro de Aluno Exemplo (cód. 1009, inativo)']);
   assert.deepEqual(r.b1,['23/10 10:00 | sem vínculo e o nome não bate igual ao cadastro']);
   assert.equal(r.b2,0,'Bruna não é Bruno');assert.equal(r.inativo,0,'inativo não entra');
   assert.match(r.achado,/1 horário\(s\) com o nome de Aluno Exemplo não aparecem como aula dele no app/);
   assert.equal(await g.evaluate(()=>JSON.stringify(DB)),antes,'só lista');
  });
  await check('o botão da agenda mostra a conta e a janela de vincular lista os horários',async()=>{
   await g.evaluate(()=>{go('agenda',document.createElement('button'));pintarAgFerr();abrirVincular&&abrirVincular();});
   assert.match(await g.evaluate(()=>document.getElementById('agf-vincular').textContent),/2 horários que o aluno não vê/);
   await g.evaluate(()=>renderVincularList());
   const t=await g.evaluate(()=>document.getElementById('link-list').innerText.replace(/\s+/g,' '));
   assert.match(t,/Aluno Exemplo · 20\/10 09:00 \(ligado ao cadastro de Aluno Exemplo \(cód\. 1009, inativo\)\) Ligar a Aluno/);
   assert.match(t,/Bruno Teste Silva · 23\/10 10:00 .* Ligar a Bruno/);
  });
  await check('janela de vincular legível (medida na imagem)',async()=>{
   await g.evaluate(()=>abrirVincular());
   const itens=(await medir(g)).filter(it=>/ov-link|link-|vh-/.test(it.onde||''));
   assert.ok(itens.length>=4,'mediu '+itens.length);
   assert.deepEqual(itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>it.t+' '+it.ratio+' '+it.fg+' sobre '+it.fundo),[]);
   await g.evaluate(()=>closeModal('ov-link'));await g.setViewportSize({width:390,height:844});
  });
  await check('"Ligar a…" pergunta, liga ao cadastro certo (o app passa a ver) e desfaz',async()=>{
   resposta=false;await g.evaluate(()=>ligarHorarioAoAluno('pontual','e2','a1'));
   assert.equal(await g.evaluate(()=>DB.agenda.eventos[1].alunoId),'a9','cancelar não muda');
   resposta=true;await g.evaluate(()=>{toastDesfazer=(m,fn)=>{window.__desf=fn;};ligarHorarioAoAluno('pontual','e2','a1');});
   assert.match(dialogos.at(-1),/Ligar o horário "Aluno Exemplo" \(20\/10 09:00\) ao cadastro de Aluno Exemplo/);
   assert.equal(await g.evaluate(()=>codigoDaEntrada(DB.agenda.eventos[1])),'1001');
   assert.equal(await g.evaluate(()=>horariosQueOAlunoNaoVe(DB.alunos[1]).length),0);
   await g.evaluate(()=>window.__desf());
   assert.deepEqual(await g.evaluate(()=>[DB.agenda.eventos[1].alunoId,DB.agenda.eventos[1].titulo]),['a9','Aluno Exemplo'],'desfazer volta exatamente como estava');
  });
  await check('marcar digitando o nome pergunta se liga ao aluno (OK liga, Cancelar deixa sem vínculo)',async()=>{
   await g.evaluate(()=>{agDate=new Date('2026-10-22T12:00:00');openSlot('14:00');document.getElementById('s-rec').value='pontual';
    document.getElementById('s-titulo').value='Bruno Teste';document.getElementById('s-tipo').value='aula';});
   resposta=true;await g.evaluate(()=>{slotModo=()=> 'aula';saveSlot();});
   assert.match(dialogos.at(-1),/"Bruno Teste" parece ser Bruno Teste Silva/);
   assert.equal(await g.evaluate(()=>DB.agenda.eventos.at(-1).alunoId),'b1');
   await g.evaluate(()=>{document.getElementById('s-titulo').value='Bruno Teste';document.getElementById('s-tipo').value='aula';document.getElementById('s-rec').value='pontual';slotCtx.hora='15:00';});
   resposta=false;await g.evaluate(()=>saveSlot());
   assert.equal(await g.evaluate(()=>DB.agenda.eventos.at(-1).alunoId),null,'cancelar deixa sem vínculo');
  });
  await check('escolher o cadastro inativo com um ativo de mesmo nome pergunta; lista põe inativo no fim, marcado',async()=>{
   const ops=await g.evaluate(()=>{openSlot('16:00');return [...document.querySelectorAll('#s-aluno option')].map(o=>o.textContent);});
   assert.match(ops.at(-1),/^Aluno Exemplo · inativo · cód\. 1009/);assert.match(ops[1],/^Aluno Exemplo · cód\. 1001/);
   await g.evaluate(()=>{document.getElementById('s-rec').value='pontual';document.getElementById('s-aluno').value='a9';document.getElementById('s-titulo').value='Aluno Exemplo';document.getElementById('s-tipo').value='aula';});
   resposta=true;await g.evaluate(()=>saveSlot());
   assert.match(dialogos.at(-1),/cadastro INATIVO/);assert.equal(await g.evaluate(()=>DB.agenda.eventos.at(-1).alunoId),'a1');
  });
  await check('dois cadastros ATIVOS com o mesmo nome: o horário mostra para quem vai no app, e a conferência aponta qual tem o app',async()=>{
   const r=await g.evaluate(()=>{
    DB.alunos.push({id:'r1',nome:'Rafa Duplo',codigo:'3001',tipo:'Particular',plano:4,creditos:4,mensalidade:640,status:'pago',arquivado:false},
                   {id:'r2',nome:'Rafa Duplo',codigo:'3002',tipo:'Particular',plano:4,creditos:0,mensalidade:640,status:'pago',arquivado:false});
    VINCULOS={u1:{ativo:true,alunoId:'r1',codigo:'3001'}};VINC_LIDO=true;   // o aparelho do aluno usa o 3001
    DB.agenda.eventos.push({id:'r8',data:'2026-10-20',hora:'18:00',titulo:'Rafa Duplo',tipo:'aula',alunoId:'r1'},
                           {id:'r9',data:'2026-10-20',hora:'19:00',titulo:'Rafa Duplo',tipo:'aula',alunoId:'r2'});
    agDate=new Date('2026-10-20T12:00:00');openSlot('19:00');
    const linha=document.getElementById('slot-evs').innerText.replace(/\s+/g,' ');
    openSlot('18:00');const linha8=document.getElementById('slot-evs').innerText.replace(/\s+/g,' ');
    const ops=[...document.querySelectorAll('#s-aluno option')].map(o=>o.textContent).filter(t=>/Rafa/.test(t));
    const r1=DB.alunos.find(a=>a.id==='r1'),r2=DB.alunos.find(a=>a.id==='r2');
    return {linha,linha8,ops,n1:horariosQueOAlunoNaoVe(r1).map(h=>h.quando+' | '+h.motivo),n2:horariosQueOAlunoNaoVe(r2).length,
      achado:achadosDoAluno(r1).map(x=>x.txt).join(' || ')};});
   assert.match(r.linha,/📱 No app: aula de Rafa Duplo \(cód\. 3002\) · este cadastro não tem o app aprovado/);
   assert.match(r.linha8,/📱 No app: aula de Rafa Duplo \(cód\. 3001\) · tem o app/);
   assert.ok(r.ops.some(t=>/cód\. 3001 · 📱 app/.test(t))&&r.ops.some(t=>/cód\. 3002 \(/.test(t)),r.ops.join(' | '));
   assert.deepEqual(r.n1,['20/10 19:00 | ligado ao cadastro de Rafa Duplo (cód. 3002); o app dele usa o cód. 3001']);
   assert.equal(r.n2,0,'do lado de quem não tem o app, não acusa ao contrário');
   const itens=(await medir(g)).filter(it=>/na-app/.test(it.onde||''));
   assert.ok(itens.length>=1,'mediu '+itens.length);
   assert.deepEqual(itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>it.t+' '+it.ratio+' '+it.fg+' sobre '+it.fundo),[]);
   await g.setViewportSize({width:390,height:844});
   assert.match(r.achado,/Há 2 cadastros ativos com o nome Rafa Duplo \(cód\. 3001, 3002\)\. O app do aluno usa o cód\. 3001/);
  });
  assert.deepEqual(erros,[]);await c.close();
 }finally{await browser.close();server.close();}
 console.log('\n✅ '+count+' verificações · horário que o app do aluno não vê');
})().catch(e=>{console.error('❌',e);server.close();process.exit(1);});

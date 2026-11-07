/* Cadastro e cartão do aluno simples (07/11, pedido do João: "quando eu escolho
   o tipo de pacote, a aula vai direto para aquele pacote"; "só quando tem as
   duas aparece créditos em grupo e créditos particular").
   - Um pacote por aluno: quem não é misto vê UM saldo, o do pacote, e um botão
     de aula. A dupla antiga guarda o pacote em "plano"/"créditos": o ✓ num
     horário de grupo saía do saldo de grupo (0 → −1, "extra a cobrar") e os
     créditos ficavam parados. Agora sai do pacote.
   - Aula de OUTRO tipo continua sendo outro produto (João, 22–23/10).
   - Trocar o pacote leva o saldo junto, mas só depois de perguntar.
   - "Juntar ao pacote" (dupla com −1 de grupo solto) só ao tocar, grava no
     extrato e salva uma versão antes. A conferência só lista.
   Só dados fictícios, relógio fixo. */
let chromium;
try{({chromium}=require('playwright'));}catch(e){({chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright'));}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-11-05T15:00:00-03:00');   // quinta-feira
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
  await c.addInitScript(()=>sessionStorage.setItem('jv-bk-adiar','1'));
  const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));
  let respostas=[];const perguntas=[];
  p.on('dialog',d=>{perguntas.push(d.message());const r=respostas.length?respostas.shift():true;r?d.accept():d.dismiss();});
  await p.clock.setSystemTime(AGORA);await p.goto(base+'/app-gestao/',{waitUntil:'load'});
  await p.waitForFunction(()=>typeof CARREGADO!=='undefined'&&CARREGADO,null,{timeout:40000});
  await p.addStyleTag({content:'#ov-entrar,#ov-semnuvem,#barra-versao,#barra-endereco,#splash-gestao,#toast{display:none!important}'});
  const preparar=()=>p.evaluate(()=>{persist=()=>{};publish=()=>{};MODO='dono';Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);
   window._versoes=0;guardarVersoes=()=>{window._versoes++;};
   if(DB.pacoteUnico)DB.pacoteUnico.ativo=false;
   const al=(id,nome,extra)=>Object.assign({id,nome,codigo:id.slice(-4),tipo:'Particular',plano:4,planoGrupo:0,creditos:4,credGrupo:0,repos:0,locCred:0,mensalidade:640,valorAula:160,status:'pago',ativo:true,diaVenc:10},extra||{});
   DB.alunos=[
    al('a2001','Aluno Particular'),
    al('a2002','Aluna Dupla Antiga',{tipo:'Dupla',mensalidade:360,valorAula:0}),                                   // pacote em plano/créditos
    al('a2003','Aluna Dupla Nova',{tipo:'Dupla',plano:0,planoGrupo:4,grupoTipo:'Dupla',creditos:0,credGrupo:4,mensalidade:360,valorAula:0}),
    al('a2004','Aluno Misto',{plano:2,planoGrupo:2,grupoTipo:'Dupla',creditos:2,credGrupo:2,mensalidade:500}),
    al('a2005','Aluna Dupla Torta',{tipo:'Dupla',mensalidade:360,valorAula:0,credGrupo:-1})];                     // o defeito de antes
   DB.movs=[];DB.presencas=[];
   const ev=(id,hora,alunoId,tipo)=>({id,data:'2026-11-05',hora,titulo:'x',tipo,alunoId,repo:0});
   DB.agenda={fixos:[],excecoes:[],eventos:[ev('g1','08:00','a2002','grupo'),ev('g2','09:00','a2003','grupo'),ev('g3','10:00','a2001','grupo'),
    ev('g4','11:00','a2004','grupo'),ev('p4','12:00','a2004','aula'),ev('p1','13:00','a2001','aula')]};
   ensureFields();renderAll();});
  const al=id=>p.evaluate(id=>{const a=DB.alunos.find(x=>x.id===id);return {tipo:a.tipo,plano:a.plano,planoGrupo:a.planoGrupo,creditos:a.creditos,credGrupo:a.credGrupo,
   movs:DB.movs.filter(m=>m.alunoId===id&&m.motivo!=='Saldo inicial').map(m=>m.campo+':'+m.delta+':'+m.motivo),extC:saldoPeloExtrato(a,'creditos'),extG:saldoPeloExtrato(a,'credGrupo')};},id);
  const marcar=eid=>p.evaluate(eid=>{Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);agDate=new Date('2026-11-05T12:00:00');togglePresenca(eid);},eid);
  const abrir=id=>p.evaluate(id=>{closeModal('ov-aluno');openAlunoModal(id);},id);
  const form=()=>p.evaluate(()=>{const vis=id=>{const e=document.getElementById(id);return !!e&&e.offsetParent!==null;};
   return {tipos:[...document.querySelectorAll('#a-tipos button')].map(b=>(b.classList.contains('on')?'*':'')+b.textContent.trim()),
    part:vis('a-linha-part'),grupo:vis('a-grupo-wrap'),misto:document.getElementById('a-misto-bt').textContent,
    saldos:[...document.querySelectorAll('#a-saldos .chip')].map(x=>x.textContent),juntar:(document.querySelector('#a-juntar')||{}).textContent||'',
    mais:document.getElementById('a-mais').open,corrigir:document.getElementById('a-corrigir').open};});
  const salvar=r=>{perguntas.length=0;respostas=r||[];return p.evaluate(()=>saveAluno());};
  const ficha=id=>p.evaluate(id=>{abrirFicha(id);const corpo=document.getElementById('fic-corpo');
   return {sub:(corpo.querySelector('.fic-sub')||{}).textContent||'',tiles:[...corpo.querySelectorAll('.fic-tile')].map(t=>[...t.children].map(x=>x.textContent).join(' ').replace(/\s+/g,' ').trim()),
    botoes:[...corpo.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>/^Aula |juntar/i.test(t)),
    pend:(corpo.querySelector('.fic-sec-pend')||{}).textContent||''};},id);

  await preparar();
  await check('dupla antiga: o ✓ no horário de grupo sai do pacote (créditos), não deixa o grupo negativo',async()=>{
   await marcar('g1');let a=await al('a2002');
   assert.equal(a.creditos,3,'saiu do pacote');assert.equal(a.credGrupo,0,'grupo não ficou −1');
   assert.equal(a.extC,a.creditos,'extrato bate');
   await marcar('g1');a=await al('a2002');assert.equal(a.creditos,4,'desmarcar devolve ao mesmo saldo');assert.equal(a.credGrupo,0);
  });
  await check('dupla nova: o ✓ de grupo sai do saldo de grupo (onde o pacote mora)',async()=>{
   await marcar('g2');const a=await al('a2003');assert.equal(a.credGrupo,3);assert.equal(a.creditos,0);
  });
  await check('aula de OUTRO tipo continua outro produto: particular numa aula de grupo vira extra de grupo',async()=>{
   await marcar('g3');let a=await al('a2001');assert.equal(a.creditos,4,'crédito particular não paga grupo');assert.equal(a.credGrupo,-1);
   await marcar('g3');a=await al('a2001');assert.equal(a.credGrupo,0,'desmarcar devolve');
   await marcar('p1');a=await al('a2001');assert.equal(a.creditos,3,'aula particular sai do particular');
  });
  await check('misto: cada aula sai do seu saldo',async()=>{
   await marcar('g4');await marcar('p4');const a=await al('a2004');assert.equal(a.credGrupo,1);assert.equal(a.creditos,1);
  });

  await preparar();
  await check('cadastro da dupla antiga: botões de tipo, uma linha de aulas, UM saldo; sem "Mais opções" aberto',async()=>{
   await abrir('a2002');const f=await form();
   assert.ok(f.tipos.includes('*👥 Dupla'),'Dupla escolhida: '+f.tipos.join(','));
   assert.ok(f.tipos.some(t=>/Só locação/.test(t)),'tem "Só locação"');
   assert.equal(f.part,true);assert.equal(f.grupo,false,'sem a segunda linha');
   assert.match(f.misto,/Também faz aula particular/);
   assert.deepEqual(f.saldos,['4 créditos de dupla']);assert.equal(f.juntar,'');
   assert.equal(f.mais,false);assert.equal(f.corrigir,false);
  });
  await check('cadastro do misto: duas linhas e os dois saldos (só aqui aparecem as duas barrinhas)',async()=>{
   await abrir('a2004');const f=await form();
   assert.equal(f.part,true);assert.equal(f.grupo,true);assert.match(f.misto,/Tirar a aula em grupo/);
   assert.deepEqual(f.saldos,['2 créditos particulares','2 créditos de grupo']);
  });
  await check('abrir e salvar sem mudar nada não mexe em saldo nem pergunta',async()=>{
   await abrir('a2002');await salvar();const a=await al('a2002');
   assert.deepEqual(a.movs,[]);assert.equal(perguntas.length,0,perguntas.join('|'));
  });
  await check('particular → dupla: o saldo fica onde está (sem pergunta) e a aula de grupo sai dele',async()=>{
   await abrir('a2001');await p.evaluate(()=>escolherTipoCad('Dupla'));
   assert.deepEqual((await form()).saldos,['4 créditos de dupla']);
   await salvar();let a=await al('a2001');
   assert.equal(a.tipo,'Dupla');assert.equal(a.plano,4);assert.equal(a.creditos,4);assert.deepEqual(a.movs,[]);assert.equal(perguntas.length,0);
   await marcar('g3');a=await al('a2001');assert.equal(a.creditos,3,'agora é o pacote dele');assert.equal(a.credGrupo,0);
  });
  await check('dupla nova → particular: pergunta antes; Cancelar não muda nada',async()=>{
   await abrir('a2003');await p.evaluate(()=>escolherTipoCad('Particular'));
   await salvar([false]);let a=await al('a2003');
   assert.equal(perguntas.length,1);assert.match(perguntas[0],/saldo vai junto/);
   assert.equal(a.tipo,'Dupla');assert.equal(a.credGrupo,4);assert.equal(a.creditos,0);assert.deepEqual(a.movs,[]);
   assert.equal(await p.evaluate(()=>document.getElementById('ov-aluno').classList.contains('on')),true,'cadastro continua aberto');
  });
  await check('dupla nova → particular: OK leva o saldo junto, com extrato e versão salva',async()=>{
   await abrir('a2003');await p.evaluate(()=>{window._versoes=0;escolherTipoCad('Particular');});
   await salvar([true]);const a=await al('a2003');
   assert.equal(a.tipo,'Particular');assert.equal(a.plano,4);assert.equal(a.planoGrupo,0);
   assert.equal(a.creditos,4);assert.equal(a.credGrupo,0);
   assert.deepEqual(a.movs,['credGrupo:-4:Pacote trocado: saldo levado junto','creditos:4:Pacote trocado: saldo levado junto']);
   assert.ok(await p.evaluate(()=>window._versoes)>=1,'versão salva antes');
   assert.equal(await p.evaluate(()=>rotuloExtrato({motivo:'Pacote trocado: saldo levado junto'})),'Saldo mudou junto com o pacote');
  });
  await check('dupla antiga passa a fazer particular também (misto): o saldo da dupla vai para o grupo, depois de perguntar',async()=>{
   await abrir('a2002');await p.evaluate(()=>{alternarMistoCad();cadSet('a-plano',2);pintarFormCad();});
   const f=await form();assert.equal(f.part,true);assert.equal(f.grupo,true);
   await salvar([true]);const a=await al('a2002');
   assert.equal(a.plano,2);assert.equal(a.planoGrupo,4);assert.equal(a.creditos,0);assert.equal(a.credGrupo,4);
   assert.match(perguntas[0],/4 créditos particulares → créditos de grupo/);
  });
  await check('misto que deixa o grupo: a sobra pode ficar separada (Cancelar) — nada é juntado sozinho',async()=>{
   await abrir('a2004');await p.evaluate(()=>alternarMistoCad());
   await salvar([false]);const a=await al('a2004');
   assert.equal(a.planoGrupo,0);assert.equal(a.credGrupo,2,'sobra continua separada');assert.equal(a.creditos,2);
   assert.match(perguntas[0],/ainda tem 2 créditos de grupo/);
   const fi=await ficha('a2004');assert.ok(fi.tiles.some(t=>/grupo · fora do pacote/.test(t)),fi.tiles.join('|'));
   assert.ok(!/Conferir e juntar/.test(fi.pend),'sobra positiva de outro tipo não vira pendência');
  });

  await preparar();
  await check('dupla com −1 de grupo solto: a ficha e a conferência só avisam; nada muda sozinho',async()=>{
   const fi=await ficha('a2005');
   assert.ok(fi.tiles.some(t=>/^4 créditos de dupla · de 4/.test(t)),fi.tiles.join('|'));
   assert.ok(fi.tiles.some(t=>/-1 grupo · fora do pacote conferir no cadastro/.test(t)),fi.tiles.join('|'));
   assert.match(fi.pend,/fora do pacote/);assert.ok(fi.botoes.includes('Conferir e juntar'));
   const ach=await p.evaluate(()=>achadosDoAluno(DB.alunos.find(x=>x.id==='a2005')).map(x=>x.txt).join('|'));
   assert.match(ach,/fora do pacote/);
   const a=await al('a2005');assert.equal(a.creditos,4);assert.equal(a.credGrupo,-1);assert.deepEqual(a.movs,[]);
  });
  await check('"Juntar ao pacote": só ao tocar, grava ao salvar, no extrato, com versão salva',async()=>{
   await p.evaluate(()=>abrirJuntarSaldo('a2005'));let f=await form();
   assert.match(f.juntar,/Juntar ao pacote: 4 − 1 = 3/);assert.equal(f.corrigir,true);
   await p.evaluate(()=>{window._versoes=0;juntarSaldoCad();});f=await form();
   assert.deepEqual(f.saldos,['3 créditos de dupla']);
   let a=await al('a2005');assert.equal(a.creditos,4,'ainda não gravou');
   await salvar();a=await al('a2005');
   assert.equal(a.creditos,3);assert.equal(a.credGrupo,0);
   assert.deepEqual(a.movs.sort(),['credGrupo:1:Saldo de fora juntado ao pacote','creditos:-1:Saldo de fora juntado ao pacote']);
   assert.equal(await p.evaluate(()=>window._versoes),1,'versão salva antes');
   const ach=await p.evaluate(()=>achadosDoAluno(DB.alunos.find(x=>x.id==='a2005')).map(x=>x.txt).join('|'));
   assert.doesNotMatch(ach,/fora do pacote/);
  });
  await check('ficha: dupla tem um saldo e um botão de aula; misto tem dois',async()=>{
   let fi=await ficha('a2003');
   assert.match(fi.sub,/Pacote Dupla · 4 aulas\/mês/);
   assert.deepEqual(fi.tiles,['4 créditos de dupla · de 4']);
   assert.deepEqual(fi.botoes,['Aula realizada (−1)']);
   await p.evaluate(()=>{Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);aulaRealizada('a2003','grupo');});
   assert.equal((await al('a2003')).credGrupo,3,'botão desconta do pacote');
   await p.evaluate(()=>{Object.keys(_ultAcao).forEach(k=>delete _ultAcao[k]);const a=DB.alunos.find(x=>x.id==='a2002');DB.presencas=DB.presencas.filter(x=>x.alunoId!=='a2002');aulaRealizada('a2002','grupo');});
   const d=await al('a2002');assert.equal(d.creditos,3,'dupla antiga: o botão também sai do pacote');assert.equal(d.credGrupo,0);
   fi=await ficha('a2004');
   assert.match(fi.sub,/2 particulares \+ 2 em dupla por mês/);
   assert.equal(fi.tiles.length,2);assert.deepEqual(fi.botoes,['Aula particular (−1)','Aula em grupo (−1)']);
  });
  await check('aluno novo: começa em Particular, sem saldo e com "Mais opções" fechado',async()=>{
   await abrir();const f=await form();
   assert.ok(f.tipos.includes('*🎾 Particular'),f.tipos.join(','));assert.equal(f.mais,false);
   await p.evaluate(()=>escolherTipoCad(''));const g=await form();
   assert.ok(g.tipos.some(t=>t==='*🔑 Só locação'));assert.equal(g.part,false);assert.equal(g.grupo,false);
   assert.equal(await p.evaluate(()=>document.getElementById('a-perfil').value),'locacao');
  });
  await check('pacote único ligado: trocar o pacote não move saldo nenhum',async()=>{
   const r=await p.evaluate(()=>{DB.pacoteUnico={ativo:true};const a=DB.alunos.find(x=>x.id==='a2001');
    const out=mudancasSaldoPacote(a,{tipo:'Dupla',plano:0,planoGrupo:4});DB.pacoteUnico.ativo=false;return out;});
   assert.deepEqual(r,[]);
  });
  assert.deepEqual(erros,[],'sem erro na página: '+erros.join(' | '));
  console.log('\n'+count+' verificações do cadastro simples passaram.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error('❌',e.message||e);process.exit(1);});

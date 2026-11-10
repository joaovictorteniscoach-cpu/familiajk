/* Agenda simples: Livre/Ocupado primeiro, atividades somente após o toque.
   Dados fictícios, relógio fixo, Chromium/WebKit e os dois temas.
   Mantém o nome do teste para preservar a chamada existente no CI. */
let motores;
try{motores=require('playwright');}catch(e){motores=require(process.env.PW||'/opt/node22/lib/node_modules/playwright');}
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {medir}=require('./medir-contraste-pixels.cjs');
const root=path.resolve(__dirname,'..'),AGORA=new Date('2026-11-09T07:00:00-03:00');
const server=http.createServer((req,res)=>{
 const url=decodeURI(req.url.split('?')[0]),f=path.join(root,url,url.endsWith('/')?'index.html':'');
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch(e){res.writeHead(404).end();}
});
let count=0;
async function check(label,fn){await fn();count++;console.log('✅ '+label);}
const QUA='2026-11-11',QUI='2026-11-12',HORAS=['08:00','12:00','14:00','16:00','18:00','19:00'];
const eu={codigo:'6601',nome:'Aluno Fictício',tipo:'Particular',plano:4,planoGrupo:0,creditos:3,credGrupo:0,repos:1,locCred:0,mensalidade:640,status:'pago',ativo:true};
function fixture(torneio){
 return {horas:HORAS,profs:[],horarioCfg:{3:{'08:00':'aula','12:00':'loc','14:00':'aula','16:00':'aula','18:00':'aula','19:00':'aula'},
  4:Object.fromEntries(HORAS.map(h=>[h,'loc']))},horarioData:{},termoVer:0,historico:{},alunos:[eu],precos:{locacao:70},
  torneio:torneio?{id:'t1',nome:'Barragem',tipo:'grupos',etapa:1,encerrada:false,jogadores:[{name:'Aluno Fictício',cod:'6601',group:'A'},{name:'Outro',group:'A'}]}:null,
  grade:{fixos:[],excecoes:[],eventos:[
   {id:'e14',data:QUA,hora:'14:00',tipo:'aula',cod:'9001',fora:1},
   {id:'e16',data:QUA,hora:'16:00',tipo:'locacao',cod:'9002'},
   {id:'e18',data:QUA,hora:'18:00',tipo:'grupo',cod:'9003',pessoas:2},
   {id:'e19',data:QUA,hora:'19:00',tipo:'aula',cod:'9004'}]}};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
 for(const motor of ['chromium','webkit']){
  const browser=await motores[motor].launch({headless:true});
  try{
  for(const tema of ['saibro','classico']){
   const label=motor+'/'+tema+' · ';
   const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
   await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.abort();if(u.pathname.includes('/lib/firebase-'))return r.fulfill({body:'',contentType:'text/javascript'});return r.continue();});
   await c.addInitScript(tema=>{sessionStorage.setItem('jv-bk-adiar','1');localStorage.setItem('jv-tema',tema);},tema);
   const p=await c.newPage(),erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.dismiss());
   await p.clock.setFixedTime(AGORA);await p.goto(base+'/app-aluno/',{waitUntil:'load'});
   await p.waitForFunction(()=>typeof slotState==='function');
   await p.addStyleTag({content:'#feriado-box,#login,#barra-app,#barra-versao,#toast,.va-bt,#va-bt{display:none!important}'});
   const abrir=(torneio=false,preferencia='aula')=>p.evaluate(({eu,P,preferencia})=>{
    init=async()=>{};esperarAuth=async()=>{};authUid=()=>'u-test';
    localStorage.setItem('jv-ag-quer',preferencia);
    EU=JSON.parse(JSON.stringify(eu));PUB=P;MEU={codigo:'6601',pedidos:[],cancelados:[],confirmadas:[],espera:[]};
    VINCULO_ESTADO='ativo';bookCtx=null;pickCtx={};window.__toasts=[];toast=x=>__toasts.push(x);
    document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('on'));
    document.getElementById('app').style.display='block';
    document.querySelectorAll('[id*="splash"]').forEach(x=>x.style.display='none');
    render();goAluno('agenda',null);
   },{eu,P:fixture(torneio),preferencia});
   const dia=dk=>p.evaluate(dk=>{
    agView='dia';agDate=new Date(dk+'T12:00:00');renderAgenda();
    return [...document.querySelectorAll('#ag-view .slot')].map(row=>{
     const b=row.querySelector('.sl');
     return {hora:row.querySelector('.slot-h').textContent,txt:b.firstChild.textContent.trim(),cls:b.className,inteiro:b.textContent};
    });
   },dk);
   const opcoes=(dk,h,quer)=>p.evaluate(({dk,h,quer})=>{
    agDate=new Date(dk+'T12:00:00');document.getElementById('pick-opts').innerHTML='';escolherSlot(h,quer);
    const o=[...document.querySelectorAll('#pick-opts .pick-opt')].map(b=>b.className.replace('pick-opt ',''));
    document.getElementById('ov-pick').classList.remove('on');return o;
   },{dk,h,quer});
   const shot=async nome=>{
    const dir=process.env.JV_VISUAL_DIR||process.env.JV_SHOTS;if(!dir)return;
    fs.mkdirSync(dir,{recursive:true});await p.screenshot({path:path.join(dir,'agenda-livre-'+nome+'-'+motor+'-'+tema+'.png')});
   };

   await check(label+'Dia: Livre sem atividade escrita, Ocupado para particular reservada e sem seletor prévio',async()=>{
    await abrir();const rows=await dia(QUA);
    assert.deepEqual(rows.map(r=>r.txt),['Livre','Livre','Livre','Livre','Livre','Ocupado']);
    assert.ok(rows.slice(0,5).every(r=>r.inteiro==='Livre'));
    assert.equal(await p.locator('#ag-quer').count(),0);
    assert.equal(await p.locator('#apg-agenda .lg-livre').textContent(),'Livre');
    assert.equal(await p.locator('#apg-agenda .lg-ocup').textContent(),'Ocupado');
    await shot('dia');
   });
   await check(label+'toque normal mostra aula, reposição elegível, locação e torneio',async()=>{
    assert.deepEqual(await opcoes(QUA,'08:00'),['aula','repo','loc','tor']);
   });
   await check(label+'só locação/torneio e aula fora da quadra: não oferece aula nem reposição',async()=>{
    for(const h of ['12:00','14:00'])assert.deepEqual(await opcoes(QUA,h),['loc','tor']);
    await p.evaluate(()=>{bookCtx=null;agDate=new Date('2026-11-11T12:00:00');abrirBook('12:00',true);});
    assert.equal(await p.evaluate(()=>bookCtx),null);
    assert.equal(await p.locator('#ov-book').isVisible(),false);
    await p.evaluate(()=>escolherSlot('12:00'));await shot('opcoes-locacao');await p.evaluate(()=>document.getElementById('ov-pick').classList.remove('on'));
   });
   await check(label+'compartilhamento oferece somente a atividade já existente',async()=>{
    assert.deepEqual(await opcoes(QUA,'16:00'),['loc']);
    assert.deepEqual(await opcoes(QUA,'18:00'),['aula'],'reposição particular não cobre grupo');
    await p.evaluate(()=>{EU.tipo='Dupla';});
    assert.deepEqual(await opcoes(QUA,'18:00'),['aula','repo'],'reposição compatível aparece no grupo');
    await p.evaluate(()=>{EU.tipo='Particular';});
    await p.evaluate(()=>{PUB.grade.eventos.find(e=>e.id==='e16').tipo='torneio';});
    assert.deepEqual(await opcoes(QUA,'16:00'),['tor']);
    await abrir();
   });
   await check(label+'dupla/trio/quádrupla: Livre até o limite, Ocupado ao completar',async()=>{
    for(const capacidade of [2,3,4]){
     for(const quantidade of [capacidade-1,capacidade]){
      const txt=await p.evaluate(({capacidade,quantidade})=>{
       PUB.grade.eventos=PUB.grade.eventos.filter(e=>e.hora!=='18:00');
       for(let i=0;i<quantidade;i++)PUB.grade.eventos.push({id:'g'+i,data:'2026-11-11',hora:'18:00',tipo:'grupo',cod:'9'+i,pessoas:capacidade});
       agDate=new Date('2026-11-11T12:00:00');agView='dia';renderAgenda();
       const row=[...document.querySelectorAll('.slot')].find(r=>r.querySelector('.slot-h').textContent==='18:00');
       return row.querySelector('.sl').firstChild.textContent.trim();
      },{capacidade,quantidade});
      assert.equal(txt,quantidade<capacidade?'Livre':'Ocupado');
     }
    }
    await abrir();
   });
   await check(label+'Ocupado preserva a lista de espera e não oferece reserva direta',async()=>{
    await dia(QUA);await p.locator('#ag-view .slot',{hasText:'19:00'}).locator('button').click();
    assert.match(await p.locator('#pick-opts').textContent(),/Entrar na lista de espera/);
    assert.equal(await p.locator('#pick-opts .pick-opt.aula').count(),0);
    await p.evaluate(()=>document.getElementById('ov-pick').classList.remove('on'));
   });
   await check(label+'própria aula e pedido pendente mantêm identificação e acesso ao cancelamento',async()=>{
    await p.evaluate(()=>{
     PUB.grade.eventos.push({id:'meu',data:'2026-11-11',hora:'08:00',tipo:'aula',cod:'6601'});
     MEU.pedidos.push({id:'p1',data:'2026-11-11',hora:'12:00',rec:'pontual'});
    });
    const rows=await dia(QUA);assert.equal(rows[0].cls,'sl meu');assert.match(rows[0].inteiro,/Minha aula.*confirmada/);
    assert.equal(rows[1].cls,'sl pend');assert.match(rows[1].inteiro,/Aguardando/);
    assert.match(await p.locator('#ag-view .slot',{hasText:'08:00'}).locator('button').getAttribute('onclick'),/cancelarAula/);
    assert.equal(await p.evaluate(()=>podeCancelarAula('2026-11-11','08:00')),true);
    const mine=await p.evaluate(()=>{agView='mes';renderAgenda();const b=[...document.querySelectorAll('.cal-day')].find(b=>b.querySelector('span')?.textContent==='11');return !!b.querySelector('.dot');});
    assert.equal(mine,true);await abrir();
   });
   await check(label+'Semana: todos os disponíveis dizem Livre, sem nomes de atividades',async()=>{
    const col=await p.evaluate(()=>{
     agDate=new Date('2026-11-11T12:00:00');agView='semana';renderAgenda();
     return [...document.querySelectorAll('.wk tr')].slice(1).map(tr=>tr.querySelectorAll('td')[3].querySelector('.wc').textContent);
    });
    assert.deepEqual(col,['Livre','Livre','Livre','Livre','Livre','Ocupado']);await shot('semana');
   });
   await check(label+'Mês: conta cada horário uma vez, incluindo vaga compartilhada',async()=>{
    const contagens=await p.evaluate(()=>{
     agDate=new Date('2026-11-11T12:00:00');agView='mes';renderAgenda();
     return ['11','12'].map(n=>[...document.querySelectorAll('.cal-day')].find(b=>b.querySelector('span')?.textContent===n).querySelector('.liv').textContent);
    });
    assert.deepEqual(contagens,['5 liv.','6 liv.']);
   });
   await check(label+'preferências antigas não filtram a grade nem as opções',async()=>{
    for(const antiga of ['aula','loc','tor']){
     await abrir(false,antiga);assert.deepEqual((await dia(QUA)).map(r=>r.txt),['Livre','Livre','Livre','Livre','Livre','Ocupado']);
     assert.deepEqual(await opcoes(QUA,'08:00'),['aula','repo','loc','tor']);
    }
   });
   await check(label+'chuva e fechamento ficam Ocupado; dia sem vaga informa e mês não inventa disponibilidade',async()=>{
    await p.evaluate(()=>{
     PUB.horarioData['2026-11-12']=Object.fromEntries(PUB.horas.map(h=>[h,'fechado']));
     PUB.grade.eventos.push({id:'chuva',data:'2026-11-12',hora:'08:00',tipo:'bloqueio',motivo:'chuva'});
    });
    assert.ok((await dia(QUI)).every(r=>r.txt==='Ocupado'));
    assert.match(await p.locator('#ag-view .ag-sem').textContent(),/Nenhum horário livre neste dia/);
    assert.deepEqual(await opcoes(QUI,'08:00'),[],'horário indisponível não abre opções');
    const txt=await p.evaluate(()=>{agView='mes';renderAgenda();return [...document.querySelectorAll('.cal-day')].find(b=>b.querySelector('span')?.textContent==='12').querySelector('.liv').textContent;});
    assert.equal(txt,'Ocupado');await abrir();
   });
   await check(label+'horários passados continuam encerrados e não abrem reserva',async()=>{
    await p.evaluate(()=>{PUB.horarioData['2026-11-08']=Object.fromEntries(PUB.horas.map(h=>[h,'aula']));});
    assert.ok((await dia('2026-11-08')).every(r=>r.txt==='Encerrado'));
    await p.evaluate(()=>{gotoBook(2026,10,8,'08:00');});
    assert.equal(await p.locator('#ov-pick').isVisible(),false);
    assert.match(await p.evaluate(()=>__toasts.at(-1)),/passou/);await abrir();
   });
   await check(label+'voz e atalhos com atividade explícita continuam respeitados',async()=>{
    const o=await p.evaluate(()=>{
     gotoBook(2026,10,11,'08:00','aula');
     const o=[...document.querySelectorAll('#pick-opts .pick-opt')].map(b=>b.className.replace('pick-opt ',''));
     document.getElementById('ov-pick').classList.remove('on');return o;
    });
    assert.deepEqual(o,['aula','repo']);assert.deepEqual(await opcoes(QUA,'08:00','loc'),['loc']);
    assert.deepEqual(await opcoes(QUA,'08:00','tor'),['tor']);
   });
   await check(label+'nuvem muda para locação ou ocupado durante confirmação: nenhum pedido é enviado',async()=>{
    for(const mudanca of ['loc','ocupado']){
     await abrir();
     const result=await p.evaluate(async mudanca=>{
      const orig={hasCloud,atualizarGradeReserva,enviarReservaUnica,saveMeu};
      let enviados=0;
      try{
       hasCloud=()=>true;enviarReservaUnica=async()=>{enviados++;};saveMeu=async()=>{};
       atualizarGradeReserva=async()=>{
        if(mudanca==='loc')PUB.horarioData['2026-11-11']={'08:00':'loc'};
        else PUB.grade.eventos.push({id:'concorrente',data:'2026-11-11',hora:'08:00',tipo:'aula',cod:'9999'});
       };
       agDate=new Date('2026-11-11T12:00:00');abrirBook('08:00',false);await confirmarAgendamento();
       return {enviados,pedidos:MEU.pedidos.length};
      }finally{hasCloud=orig.hasCloud;atualizarGradeReserva=orig.atualizarGradeReserva;enviarReservaUnica=orig.enviarReservaUnica;saveMeu=orig.saveMeu;}
     },mudanca);
     assert.deepEqual(result,{enviados:0,pedidos:0});
    }
    await abrir();
   });
   await check(label+'consulta da agenda não altera aluno, créditos, grade nem pedidos',async()=>{
    const antes=await p.evaluate(()=>JSON.stringify({EU,PUB,MEU}));
    for(const view of ['dia','semana','mes'])await p.evaluate(view=>{agDate=new Date('2026-11-11T12:00:00');agView=view;renderAgenda();},view);
    await opcoes(QUA,'08:00');assert.equal(await p.evaluate(()=>JSON.stringify({EU,PUB,MEU})),antes);
   });
   await check(label+'leitura e largura em 320/390 px, com captura das opções completas',async()=>{
    for(const width of [320,390]){
     await p.setViewportSize({width,height:844});await dia(QUA);
     assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'sem rolagem lateral em '+width);
     const itens=(await medir(p)).filter(it=>/apg-agenda|ag-view/.test(it.onde||''));
     assert.ok(itens.length>=10,'mediu '+itens.length+' textos');
     assert.deepEqual(itens.filter(it=>it.ratio!==null&&it.ratio<it.minimo).map(it=>it.t+' '+it.ratio+' '+it.onde),[]);
     await p.evaluate(()=>{agView='mes';renderAgenda();});
     assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mês sem rolagem lateral em '+width);
    }
    await p.setViewportSize({width:390,height:844});await dia(QUA);
    await p.locator('#ag-view .slot',{hasText:'08:00'}).locator('button').click();await shot('opcoes-completas');
    await p.evaluate(()=>document.getElementById('ov-pick').classList.remove('on'));
   });
   assert.deepEqual(erros,[],label+'erros de página');await c.close();
  }
  }finally{await browser.close();}
 }
 }finally{server.close();}
 console.log('\n✅ '+count+' verificações · agenda Livre/Ocupado em Chromium/WebKit e dois temas');
})().catch(e=>{console.error('❌',e.stack||e);server.close();process.exitCode=1;});

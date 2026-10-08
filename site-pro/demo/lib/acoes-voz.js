/* Ações por voz da Gestão. Usa os mesmos fluxos e a confirmação de nuvem.
   Áudio e transcrição não são persistidos. Reconhecimento só após toque. */
(function(){
'use strict';
const w=window,$=id=>document.getElementById(id);
const st={aberto:false,ocupado:false,rec:null,epoca:0,intencao:null,aplicado:false,consumidas:new Set(),ultimoFoco:null};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/-feira\b/g,'').replace(/\s+/g,' ').trim();
const pad=n=>String(n).padStart(2,'0');
function dataBase(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=t=>p.find(x=>x.type===t).value;return v('year')+'-'+v('month')+'-'+v('day');}
function diaValido(y,m,d){const x=new Date(y,m-1,d,12);return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d?y+'-'+pad(m)+'-'+pad(d):'';}
function somarDia(base,n){const d=new Date(base+'T12:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function lerData(t,base){
 const y=Number(base.slice(0,4)),m=Number(base.slice(5,7));let data='',exp=false;
 let x=t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
 if(x){data=diaValido(+x[1],+x[2],+x[3]);exp=true;}
 if(!x){x=t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);if(x){data=diaValido(x[3]?+x[3]:y,+x[2],+x[1]);exp=true;}}
 const meses=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
 if(!x){x=t.match(/\b(?:dia )?(\d{1,2}) de ([a-z]+)(?: de (\d{4}))?\b/);if(x&&meses.includes(x[2])){data=diaValido(x[3]?+x[3]:y,meses.indexOf(x[2])+1,+x[1]);exp=true;}}
 if(exp&&!data)return {data:'',erro:'Confira a data: esse dia não existe.'};
 if(!exp){if(/\bdepois de amanha\b/.test(t))data=somarDia(base,2);else if(/\bamanha\b/.test(t))data=somarDia(base,1);else if(/\bhoje\b/.test(t))data=base;
  else{const n=t.match(/\bdia (\d{1,2})\b/);if(n)data=diaValido(y,m,+n[1]);}
 }
 const dias=['domingo','segunda','terca','quarta','quinta','sexta','sabado'],dia=dias.findIndex(d=>new RegExp('\\b'+d+'\\b').test(t));
 if(dia>=0){if(data&&new Date(data+'T12:00:00').getDay()!==dia)return {data:'',erro:'O dia da semana e a data não combinam. Escolha a data abaixo.'};
  if(!data){let n=(dia-new Date(base+'T12:00:00').getDay()+7)%7;if(n===0&&/\bproxim[ao]\b|\bque vem\b/.test(t))n=7;data=somarDia(base,n);}}
 return {data,erro:''};
}
function lerHora(t){
 let r=t.match(/\b(?:as|pelas)\s+(.+)$/),s=r?r[1]:'';
 if(!s){const x=t.match(/\b(\d{1,2})(?::(\d{2})|h(\d{2})?)\b/);if(!x)return {hora:'',erro:''};s=x[0];}
 s=s.replace(/\bmeio dia\b/g,'12 horas').replace(/\bmeia noite\b/g,'0 horas');
 const nums={'vinte e tres':23,'vinte e dois':22,'vinte e um':21,'vinte':20,'dezenove':19,'dezoito':18,'dezessete':17,'dezesseis':16,'quinze':15,'quatorze':14,'catorze':14,'treze':13,'doze':12,'onze':11,'dez':10,'nove':9,'oito':8,'sete':7,'seis':6,'cinco':5,'quatro':4,'tres':3,'duas':2,'dois':2,'uma':1,'um':1,'zero':0,'trinta':30,'quarenta e cinco':45};
 Object.keys(nums).sort((a,b)=>b.length-a.length).forEach(k=>{s=s.replace(new RegExp('\\b'+k+'\\b','g'),String(nums[k]));});
 const x=s.match(/^(\d{1,2})(?:(?::|h)(\d{2}))?/);if(!x)return {hora:'',erro:'Escolha o horário abaixo.'};
 let h=+x[1],min=x[2]?+x[2]:0;
 if(!x[2]){if(/\be meia\b/.test(s))min=30;else if(/\be (?:1 quarto|15)\b/.test(s))min=15;else{const z=s.match(/^\d{1,2}(?:\s*(?:horas?|h))?\s+e\s+(\d{1,2})\b/);if(z)min=+z[1];}}
 const tarde=/\b(?:tarde|noite)\b/.test(s),manha=/\b(?:manha|madrugada)\b/.test(s);
 if(h>0&&h<12){if(tarde)h+=12;else if(!manha&&!x[2]&&!/^\d+h\b/.test(s))return {hora:'',erro:'Diga manhã/tarde/noite ou escolha o horário; “às três” pode ter dois sentidos.'};}
 if(h>23||min>59)return {hora:'',erro:'Confira o horário.'};
 return {hora:pad(h)+':'+pad(min),erro:''};
}
function interpretar(texto,alunos,base){
 const t=norm(String(texto).slice(0,500)),acoes=[];
 if(/\b(?:nao|corrigindo|melhor|desculpa)\b|\bquer dizer\b/.test(t))return {erro:'Reformule um pedido afirmativo por vez. Nada foi alterado.'};
 if(/\b(?:cancelar|cancelou|cancela|cancele|desmarcar|desmarcou|desmarca)\b/.test(t))acoes.push('cancelar');
 if(/\b(?:agendar|agendou|agenda|agende|marcar|marcou|marca|marque|reservar|reserva|reserve)\b/.test(t))acoes.push('agendar');
 if(/\b(?:renovar|renovou|renova|renove|renovacao)\b/.test(t))acoes.push('renovar');
 if(acoes.length!==1)return {erro:acoes.length?'Peça uma ação por vez. Nada foi alterado.':'Diga cancelar aula, agendar aula ou renovar pacote.'};
 const contem=n=>{const x=norm(n);return x&&(' '+t+' ').includes(' '+x+' ');};
 let candidatos=(alunos||[]).filter(a=>contem(a.nome));
 if(!candidatos.length)candidatos=(alunos||[]).filter(a=>contem(norm(a.nome).split(' ')[0]));
 const d=lerData(t,base),h=lerHora(t);let tipo='';
 if(/\b(?:quadrupla|quarteto)\b/.test(t))tipo='grupo4';else if(/\btrio\b/.test(t))tipo='grupo3';else if(/\bdupla\b/.test(t))tipo='grupo2';
 else if(/\bparticular\b/.test(t))tipo='aula';else if(/\bpersonal\b/.test(t))tipo='personal';else if(/\blocacao\b/.test(t))tipo='locacao';else if(/\btorneio\b/.test(t))tipo='torneio';
 return {acao:acoes[0],candidatos:candidatos.map(a=>a.id),data:d.data,hora:h.hora,tipo,repo:/\breposicao\b/.test(t),aviso:d.erro||h.erro};
}
function dono(){try{return !w.JV_DEMO&&CARREGADO&&w._espacoAberto&&ehDono()&&!!w.AUTH_USER&&w.AUTH_USER.uid===UID_DONO;}catch(e){return false;}}
function pronto(){if(!dono())throw Error('Entre na conta do João para usar as ações rápidas.');
 if(navigator.onLine===false||!hasCloud())throw Error('Conecte à internet antes de confirmar uma ação.');
 if(_abriuSemConferir||_semDados||_nuvemMuda||_conflitoNuvem||cloudPending||_salvamentoEmCurso||syncing)throw Error('Confira o salvamento e a nuvem em Segurança e dados antes de continuar.');}
async function conferirNuvem(){
 pronto();const marco={},s=await comPrazo(v2ref('').get(),PRAZO_NUVEM,marco);
 if(s===marco||!s||!s.exists())throw Error('Não consegui conferir a nuvem. Nada foi alterado.');
 const no=s.val();bancoDasPartes(no);
 if(!_basePartesLida||canonDados(no)!==canonDados(_basePartes)){registrarConflitoNuvem(no);throw Error('Outra sessão alterou os dados. Confira as duas versões antes de continuar.');}
 const mapa=await comPrazo(lerMapaQuadra(true),PRAZO_NUVEM,marco);if(mapa===marco)throw Error('Não consegui conferir a agenda da quadra. Nada foi alterado.');pronto();
}
const campo=id=>$(id).value;
function tipoAluno(a){return ({Dupla:'grupo2',Trio:'grupo3',Quarteto:'grupo4',Grupo:'grupo2',Personal:'personal',Torneio:'torneio'})[a.tipo]||'aula';}
function chaveForm(){return JSON.stringify(['voz-acao','voz-aluno','voz-data','voz-hora','voz-tipo','voz-marcacao'].map(campo).concat($('voz-repo').checked,$('voz-texto').value));}
function assinatura(){return JSON.stringify(DB);}
function contexto(){
 const acao=campo('voz-acao'),a=DB.alunos.find(x=>x.id===campo('voz-aluno'));
 if(!a)throw Error('Escolha o aluno pelo cadastro.');
 if(!ehAtivoAluno(a))throw Error('O aluno está inativo. Confira o cadastro antes de continuar.');
 if(acao==='renovar'){
  if(renovacoesDoMes(a).length)throw Error('Este aluno já foi renovado no mês. Saldos preservados.');
  if(ajusteManualRenovacao(a))throw Error('Há ajuste manual a conferir. Use Renovar o mês antes de continuar.');
  if(pacoteDoAluno(a)<=0)throw Error('O cadastro não tem pacote para renovar.');
  return {acao,alunoId:a.id,nome:a.nome,data:'',hora:'',tipo:'',pessoas:null};
 }
 const data=campo('voz-data'),hora=campo('voz-hora'),d=new Date(data+'T12:00:00');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(data)||isNaN(d.getTime())||dKey(d)!==data)throw Error('Escolha uma data válida.');
 if(!HORAS.includes(hora))throw Error('Escolha um horário da grade.');
 if(Date.parse(data+'T'+hora+':00-03:00')<=Date.now())throw Error('O horário já passou. Use a agenda para revisar datas anteriores.');
 const hoje=dataBase(),lim=somarDia(hoje,90);if(data>lim)throw Error('Escolha uma data dentro dos próximos 90 dias.');
 const evs=entriesFor(d,hora);
 if(acao==='cancelar'){
  const meus=evs.filter(e=>e.alunoId===a.id&&['fixo','pontual'].includes(e.origem)&&!e.doDono);
  if(!meus.length)throw Error('Não encontrei marcação vinculada a esse aluno na data e horário.');
  const alvo=meus.length===1?meus[0]:meus.find(e=>e.origem+'|'+e.id===campo('voz-marcacao'));
  if(!alvo)throw Error('Há mais de uma marcação. Escolha qual cancelar abaixo.');
  return {acao,alunoId:a.id,nome:a.nome,data,hora,alvoId:alvo.id,origem:alvo.origem};
 }
 const escolhido=campo('voz-tipo'),tipo=escolhido.startsWith('grupo')?'grupo':escolhido,pessoas=tipo==='grupo'?Number(escolhido.slice(-1)):null;
 if(!['aula','grupo','personal','locacao','torneio'].includes(tipo))throw Error('Escolha o tipo da marcação.');
 if(evs.some(e=>e.alunoId===a.id))throw Error('Esse aluno já tem uma marcação nesse horário.');
 if(slotModo(d,hora)==='fechado'||['aula','grupo','personal'].includes(tipo)&&slotModo(d,hora)!=='aula')throw Error('Esse horário não está aberto para essa atividade.');
 if(ocupadoPorOutro(d,hora)||!podeAdicionarAoHorario(evs,tipo,pessoas))throw Error('Horário ocupado ou turma completa. Escolha outra vaga.');
 return {acao,alunoId:a.id,nome:a.nome,data,hora,tipo,pessoas,repo:$('voz-repo').checked};
}
function status(texto){$('voz-status').textContent=texto;}
function ouvirResposta(texto){if(!$('voz-ouvir').checked||!w.speechSynthesis)return;parar();try{w.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(texto);u.lang='pt-BR';w.speechSynthesis.speak(u);}catch(e){}}
function ocupado(sim){st.ocupado=sim;document.querySelectorAll('#voz-painel input,#voz-painel select,#voz-painel textarea,#voz-analisar,#voz-conferir,#voz-falar,#voz-confirmar').forEach(e=>{e.disabled=sim||st.aplicado;});$('voz-confirmar').disabled=sim||!st.intencao||st.aplicado;$('voz-salvar').disabled=sim;atualizarMic();}
function invalidar(){if(st.ocupado||st.aplicado)return;st.intencao=null;$('voz-confirmar').disabled=true;$('voz-previa').hidden=true;}
function preencherAlunos(candidatos){
 const sel=$('voz-aluno');sel.replaceChildren();const p=document.createElement('option');p.value='';p.textContent='Escolha o aluno';sel.append(p);
 const ativos=DB.alunos.filter(a=>ehAtivoAluno(a)).sort((a,b)=>a.nome.localeCompare(b.nome));
 const ids=candidatos&&candidatos.length?new Set(candidatos):null;
 ativos.filter(a=>!ids||ids.has(a.id)).forEach(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=a.nome+(a.codigo?' · código '+a.codigo:'');sel.append(o);});
 if(ids&&ids.size===1&&sel.options.length===2)sel.selectedIndex=1;
}
function atualizarCampos(){
 const acao=campo('voz-acao');$('voz-quando').hidden=acao==='renovar';$('voz-atividade').hidden=acao!=='agendar';$('voz-marcacao-wrap').hidden=true;
 const a=DB.alunos.find(x=>x.id===campo('voz-aluno'));if(a&&acao==='agendar'&&!campo('voz-tipo'))$('voz-tipo').value=tipoAluno(a);
 if(a&&acao==='cancelar'&&campo('voz-data')&&campo('voz-hora')){
  const meus=entriesFor(new Date(campo('voz-data')+'T12:00:00'),campo('voz-hora')).filter(e=>e.alunoId===a.id&&['fixo','pontual'].includes(e.origem)&&!e.doDono),sel=$('voz-marcacao');
  const antes=sel.value;sel.replaceChildren();const p=document.createElement('option');p.value='';p.textContent='Escolha a marcação';sel.append(p);
  meus.forEach(e=>{const o=document.createElement('option');o.value=e.origem+'|'+e.id;o.textContent=e.titulo+' · '+(e.origem==='fixo'?'semanal':'só nesta data');sel.append(o);});sel.value=antes;
  $('voz-marcacao-wrap').hidden=meus.length<2;
 }
}
async function analisar(){
 if(st.ocupado||st.aplicado)return;parar();invalidar();
 const texto=$('voz-texto').value.trim();if(texto){
  const r=interpretar(texto,DB.alunos,dataBase());if(r.erro){status(r.erro);return;}
  $('voz-acao').value=r.acao;preencherAlunos(r.candidatos);$('voz-data').value=r.data||'';$('voz-hora').value=r.hora||'';
  const a=DB.alunos.find(x=>x.id===campo('voz-aluno'));$('voz-tipo').value=r.tipo||(a?tipoAluno(a):'');$('voz-repo').checked=r.repo;
  atualizarCampos();if(r.aviso)status(r.aviso);
 }
 await preparar();
}
async function preparar(){
 if(st.ocupado||st.aplicado)return;invalidar();atualizarCampos();const ep=st.epoca;
 ocupado(true);status('Conferindo aluno, horário e nuvem…');
 try{
  await conferirNuvem();if(ep!==st.epoca||!st.aberto)return;
  const i=contexto();i.form=chaveForm();i.banco=assinatura();i.token=String(ep)+'-'+String(performance.now());
  st.intencao=i;
  const box=$('voz-previa');box.replaceChildren();const titulo=document.createElement('b');titulo.textContent=({cancelar:'Cancelar uma aula',agendar:'Agendar uma marcação',renovar:'Renovar o pacote'})[i.acao];box.append(titulo);
  const nome=document.createElement('p');nome.textContent=i.nome;box.append(nome);
  const det=document.createElement('p');det.textContent=i.acao==='renovar'?'A confirmação da renovação mostrará os saldos antes/depois. As barreiras de renovação manual e repetida continuam valendo.':new Date(i.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})+' · '+i.hora;box.append(det);
  const nota=document.createElement('p');nota.textContent=i.acao==='cancelar'?'Somente esta marcação nesta data. Não cria reposição nem altera saldos.':i.acao==='renovar'?'A renovação usa a regra atual de créditos e sobras. Não registra pagamento.':'Só nesta data · '+(i.tipo==='grupo'?'aula para '+i.pessoas+' pessoas':i.tipo)+(i.repo?' · reposição':'')+'. Créditos serão usados pelas regras normais da aula.';box.append(nota);
  box.hidden=false;$('voz-confirmar').textContent=i.acao==='renovar'?'Revisar e renovar':i.acao==='cancelar'?'Confirmar cancelamento':'Confirmar agendamento';status('Confira os detalhes antes de confirmar.');box.scrollIntoView({block:'nearest',behavior:'auto'});$('voz-confirmar').scrollIntoView({block:'nearest',behavior:'auto'});ouvirResposta('Pedido conferido. Confira os detalhes antes de confirmar.');
 }catch(e){if(ep===st.epoca)status(e.message||'Não consegui conferir o pedido.');}
 finally{if(ep===st.epoca)ocupado(false);}
}
async function executar(){
 const i=st.intencao;if(st.ocupado||st.aplicado||!i||st.consumidas.has(i.token))return;
 parar();const ep=st.epoca;ocupado(true);status('Conferindo novamente antes de aplicar…');
 try{
  await conferirNuvem();if(ep!==st.epoca||!st.aberto)return;
  if(i.form!==chaveForm()||i.banco!==assinatura())throw Error('Os dados ou o pedido mudaram. Faça uma nova conferência.');
  const atual=contexto();if(JSON.stringify(atual)!==JSON.stringify(Object.fromEntries(Object.entries(i).filter(([k])=>!['form','banco','token'].includes(k)))))throw Error('A marcação mudou. Confira novamente.');
  const antes=assinatura();if(!await guardarVersoes(antes))throw Error('Não consegui guardar a cópia anterior. Nada foi alterado.');
  await conferirNuvem();if(ep!==st.epoca||!st.aberto)return;
  if(i.form!==chaveForm()||i.banco!==assinatura())throw Error('Os dados mudaram durante a conferência. Nada foi alterado.');
  contexto();
  if(i.acao==='renovar')renovarMes(i.alunoId);
  else{
   agDate=new Date(i.data+'T12:00:00');openSlot(i.hora);
   if(i.acao==='cancelar'){if(i.origem==='fixo')cancelarDia(i.alvoId);else removerEvento(i.alvoId);}
   else{
    $('s-aluno').value=i.alunoId;slotPickAluno();$('s-tipo').value=i.tipo;
    if(i.pessoas)$('s-grupo-n').value=String(i.pessoas);$('s-rec').value='pontual';$('s-repo').checked=i.repo;
    toggleGrupoWrap();saveSlot();
   }
   closeSlot();
  }
  if(assinatura()===antes){status('Nenhuma alteração aplicada. Confira os avisos da ação.');st.intencao=null;return;}
  st.aplicado=true;st.consumidas.add(i.token);st.intencao=null;
  status('Aplicado no aparelho. Aguardando confirmação da nuvem…');
  const ok=await gravarAgora();
  if(ep===st.epoca){$('voz-salvar').hidden=ok;status(ok?'Confirmado e salvo na nuvem.':'Aplicado no aparelho; confirmação na nuvem pendente. Não repita a ação. Use Conferir salvamento.');if(ok)ouvirResposta('Confirmado e salvo na nuvem.');}
 }catch(e){if(ep===st.epoca){st.intencao=null;if(st.aplicado){$('voz-salvar').hidden=false;status('Aplicado no aparelho; confirmação na nuvem pendente. Não repita a ação. Tente salvar ou confira Segurança e dados.');}else status((e&&e.message)||'Não consegui concluir. Confira o salvamento antes de repetir.');}}
 finally{if(ep===st.epoca)ocupado(false);}
}
async function salvar(){
 if(st.ocupado||!st.aplicado)return;ocupado(true);
 try{const ok=await gravarAgora();$('voz-salvar').hidden=ok;status(ok?'Confirmado e salvo na nuvem.':'A confirmação ainda está pendente. Confira Segurança e dados antes de outra ação.');}catch(e){status('Não consegui confirmar a nuvem. A ação não foi repetida.');}finally{ocupado(false);}
}
function atualizarMic(){if($('voz-painel'))$('voz-painel').dataset.ouvindo=String(!!st.rec);const existe=!!(w.SpeechRecognition||w.webkitSpeechRecognition);$('voz-falar').disabled=st.ocupado||st.aplicado||!existe;$('voz-falar').textContent=st.rec?'Ouvindo…':'Falar';$('voz-parar').hidden=!st.rec;$('voz-falar').setAttribute('aria-pressed',String(!!st.rec));}
function parar(){const r=st.rec;st.rec=null;if(r){try{r.abort();}catch(e){}}if($('voz-falar'))atualizarMic();}
function falar(){
 if(st.ocupado||st.aplicado||st.rec||!st.aberto)return;
 const C=w.SpeechRecognition||w.webkitSpeechRecognition;if(!C){status('Use o microfone do teclado do iPhone para ditar ou digite o pedido.');return;}
 invalidar();if(w.speechSynthesis)w.speechSynthesis.cancel();const r=new C();st.rec=r;r.lang='pt-BR';r.continuous=false;r.interimResults=true;
 let final='',ultimo=-1;r.onresult=e=>{if(st.rec!==r||!st.aberto)return;
  let parcial='';for(let n=e.resultIndex;n<e.results.length;n++){if(e.results[n].isFinal){if(n>ultimo){final+=(final?' ':'')+e.results[n][0].transcript;ultimo=n;}}else parcial+=e.results[n][0].transcript;}
  $('voz-texto').value=(final+' '+parcial).trim().slice(0,500);invalidar();status(final?'Confira o texto e toque em Conferir pedido.':'Ouvindo…');
 };
 r.onerror=e=>{if(st.rec!==r)return;st.rec=null;atualizarMic();status(e.error==='not-allowed'||e.error==='service-not-allowed'?'Permissão de voz negada. Você pode digitar ou usar o ditado do teclado.':'A fala não ficou disponível. Digite ou use o ditado do teclado.');};
 r.onend=()=>{if(st.rec!==r)return;st.rec=null;atualizarMic();if(st.aberto)status('Confira o texto e toque em Conferir pedido.');};
 try{r.start();status('Ouvindo em português…');atualizarMic();}catch(e){st.rec=null;atualizarMic();status('Não consegui iniciar a fala. Digite ou use o ditado do teclado.');}
}
function abrir(){
 if(!dono()){toast('Entre na conta do João para usar ações rápidas.');return;}
 fecharMais();if(st.aberto)return;st.epoca++;st.aberto=true;st.aplicado=false;st.intencao=null;st.ultimoFoco=document.activeElement;st.pagina=document.body.dataset.pagina||'dash';
 $('voz-painel').hidden=false;document.body.classList.add('jv-voz-aberto');$('voz-texto').value='';$('voz-previa').hidden=true;$('voz-salvar').hidden=true;
 $('voz-acao').value='agendar';preencherAlunos();$('voz-data').value='';$('voz-hora').value='';$('voz-tipo').value='';$('voz-repo').checked=false;atualizarCampos();ocupado(false);
 status(w.SpeechRecognition||w.webkitSpeechRecognition?'Toque em Falar ou escreva um pedido.':'Digite ou use o microfone do teclado do iPhone para ditar.');
 try{history.pushState(Object.assign({},history.state,{jvVoz:st.epoca}),'');}catch(e){}
 atualizarVisibilidade();$('voz-texto').focus();
}
function fechar(voltar){
 if(!st.aberto)return;const ep=st.epoca;st.epoca++;st.aberto=false;parar();if(w.speechSynthesis)w.speechSynthesis.cancel();
 $('voz-painel').hidden=true;$('voz-texto').value='';$('voz-previa').replaceChildren();st.intencao=null;document.body.classList.remove('jv-voz-aberto');
 if(!voltar&&history.state&&history.state.jvVoz===ep){try{history.back();}catch(e){}}
 atualizarVisibilidade();if(st.ultimoFoco&&st.ultimoFoco.isConnected)st.ultimoFoco.focus();
}
function atualizarVisibilidade(){
 if(!$('voz-atalho'))return;const permitido=dono(),pagina=document.body.dataset.pagina||'dash';
 const outras=document.querySelector('.overlay.on,.ficha.on,#renova-mes.on,#mais-pop.on');
 if(st.aberto&&(!permitido||document.hidden||pagina!==st.pagina||outras&&!st.ocupado))fechar(true);
 $('voz-atalho').hidden=!permitido||st.aberto||!['dash','agenda','alunos'].includes(pagina)||!!outras;
 $('voz-menu').hidden=!permitido;
}
function init(){
 if(!$('voz-painel'))return;
 $('voz-hora').replaceChildren();const op=document.createElement('option');op.value='';op.textContent='Escolha o horário';$('voz-hora').append(op);
 HORAS.forEach(h=>{const o=document.createElement('option');o.value=h;o.textContent=h;$('voz-hora').append(o);});
 $('voz-atalho').onclick=abrir;$('voz-menu').onclick=abrir;$('voz-fechar').onclick=()=>fechar(false);$('voz-falar').onclick=falar;$('voz-parar').onclick=parar;
 $('voz-analisar').onclick=analisar;$('voz-conferir').onclick=preparar;$('voz-confirmar').onclick=executar;$('voz-salvar').onclick=salvar;
 $('voz-seguranca').onclick=()=>{fechar(false);go('seg',document.createElement('button'));};
 $('voz-texto').addEventListener('input',invalidar);
 ['voz-acao','voz-aluno','voz-data','voz-hora','voz-tipo','voz-repo','voz-marcacao'].forEach(id=>$(id).addEventListener('change',()=>{invalidar();if(id==='voz-aluno')$('voz-tipo').value='';atualizarCampos();}));
 $('voz-painel').addEventListener('click',e=>{if(e.target===$('voz-painel'))fechar(false);});
 $('voz-painel').addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();fechar(false);}
  if(e.key==='Tab'){const a=[...$('voz-painel').querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled])')].filter(x=>x.getClientRects().length);if(!a.length)return;
   if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a[a.length-1].focus();}else if(!e.shiftKey&&document.activeElement===a[a.length-1]){e.preventDefault();a[0].focus();}}
 });
 w.addEventListener('popstate',()=>{if(st.aberto&&(!history.state||history.state.jvVoz!==st.epoca))fechar(true);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)fechar(false);});
 w.addEventListener('pagehide',()=>fechar(true));
 w.addEventListener('offline',()=>{parar();invalidar();if(st.aberto)status('Sem internet. Nenhuma nova ação será aplicada.');});
 let agendado=false;new MutationObserver(()=>{if(agendado)return;agendado=true;requestAnimationFrame(()=>{agendado=false;atualizarVisibilidade();});}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style','data-pagina']});
 atualizarVisibilidade();
}
w.JVAcoesVoz={abrir,fechar,interpretar,analisar,preparar,executar,parar,falar,conferirNuvem};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
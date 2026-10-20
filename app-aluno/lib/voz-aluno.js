/* Assistente por voz do aluno (20/10, pedido do João).
   O aluno fala ou escreve ("tem horário livre amanhã?", "marcar quinta às
   18", "cancelar minha aula de terça às 9", "quais são minhas aulas") e o
   assistente responde na tela (e em voz, se quiser).
   Não decide nada sozinho: agendar abre a mesma janela de agendamento do app
   (mensalidade em dia, vaga, tipo de aula, conferência na nuvem) e cancelar
   usa o mesmo cancelamento (prazo de 4 horas, confirmação). Nada sai do
   aparelho além do que esses fluxos já mandam: o reconhecimento de fala é o
   do próprio celular e o texto não é guardado. */
(function(){
'use strict';
const w=window;
function porId(id){return document.getElementById(id);}
const st={aberto:false,rec:null,ouvir:true};
/* PUB, EU e MEU são "let" no script principal: outro <script> enxerga pelo
   nome, mas não como window.PUB. */
const pub=()=>{try{return typeof PUB!=='undefined'?PUB:null;}catch(e){return null;}};
const eu=()=>{try{return typeof EU!=='undefined'?EU:null;}catch(e){return null;}};
const meu=()=>{try{return typeof MEU!=='undefined'?MEU:null;}catch(e){return null;}};
const gradeHoras=()=>{const p=pub();return p&&Array.isArray(p.horas)?p.horas:[];};
const logadoNoApp=()=>{const m=meu();return !!(eu()&&m&&m.codigo);};
try{st.ouvir=localStorage.getItem('jv-va-ouvir')!=='0';}catch(e){}
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/-feira\b/g,'').replace(/[?!.,;]+/g,' ').replace(/\s+/g,' ').trim();
const pad=n=>String(n).padStart(2,'0');
const DIAS_N=['domingo','segunda','terca','quarta','quinta','sexta','sabado'],DIAS_C=['dom','seg','ter','qua','qui','sex','sáb'];
const MESES_N=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const NUMS={'vinte e tres':23,'vinte e dois':22,'vinte e um':21,'vinte':20,'dezenove':19,'dezoito':18,'dezessete':17,'dezesseis':16,'quinze':15,'quatorze':14,'catorze':14,'treze':13,'doze':12,'onze':11,'dez':10,'nove':9,'oito':8,'sete':7,'seis':6,'cinco':5,'quatro':4,'tres':3,'duas':2,'dois':2,'uma':1,'um':1};
function hojeK(){const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function somarDia(base,n){const d=new Date(base+'T12:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function diaValido(y,m,d){const x=new Date(y,m-1,d,12);return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d?y+'-'+pad(m)+'-'+pad(d):'';}
const rotDia=dk=>{const d=new Date(dk+'T12:00:00');return (dk===hojeK()?'hoje, ':dk===somarDia(hojeK(),1)?'amanhã, ':'')+DIAS_C[d.getDay()]+' '+dk.slice(8,10)+'/'+dk.slice(5,7);};

/* ---- entender a frase ---- */
function lerData(t){
 const base=hojeK(),y=+base.slice(0,4),m=+base.slice(5,7);let data='',exp=false,x;
 x=t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);if(x){data=diaValido(x[3]?+x[3]:y,+x[2],+x[1]);exp=true;}
 if(!exp){x=t.match(/\b(?:dia )?(\d{1,2}) de ([a-z]+)\b/);if(x&&MESES_N.includes(x[2])){data=diaValido(y,MESES_N.indexOf(x[2])+1,+x[1]);exp=true;}}
 if(exp&&!data)return {data:'',erro:'Essa data não existe. Confira o dia.'};
 if(!exp){
  if(/\bdepois de amanha\b/.test(t))data=somarDia(base,2);else if(/\bamanha\b/.test(t))data=somarDia(base,1);else if(/\bhoje\b/.test(t))data=base;
  else{const n=t.match(/\bdia (\d{1,2})\b/);if(n){data=diaValido(y,m,+n[1]);if(data&&data<base)data=diaValido(m===12?y+1:y,m===12?1:m+1,+n[1]);}}
 }
 const dia=DIAS_N.findIndex(d=>new RegExp('\\b'+d+'\\b').test(t));
 if(dia>=0){
  if(data&&new Date(data+'T12:00:00').getDay()!==dia)return {data:'',erro:'O dia da semana e a data não combinam.'};
  if(!data){let n=(dia-new Date(base+'T12:00:00').getDay()+7)%7;if(n===0&&/\bproxim[ao]\b|\bque vem\b/.test(t))n=7;data=somarDia(base,n);}
 }
 if(data&&data<base)return {data:'',erro:'Essa data já passou.'};
 return {data,erro:''};
}
/* Hora: "às 18", "18h", "18:30", "às seis da tarde", "às 9". Sem manhã/tarde,
   "às 8" pode ser 08:00 ou 20:00: fica com as que existem na grade. */
function lerHoras(t){
 let s=' '+t+' ';
 s=s.replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{4})?\b/g,' ').replace(new RegExp('\\b(?:dia )?\\d{1,2} de (?:'+MESES_N.join('|')+')\\b','g'),' ').replace(/\bdia \d{1,2}\b/g,' ');
 s=s.replace(/\bmeio dia\b/g,'as 12h');
 Object.keys(NUMS).sort((a,b)=>b.length-a.length).forEach(k=>{s=s.replace(new RegExp('\\b(as|das|pelas|para as|de)\\s+'+k+'\\b','g'),'$1 '+NUMS[k]);});
 // "às 18", "às 18h", "às 18:30", "às 6 e meia da tarde"
 let x=s.match(/\b(?:as|das|pelas|para as)\s+(\d{1,2})(?:(?::|h)(\d{2})|\s*(h)(?:oras?)?\b)?(\s+e meia)?(?:\s+(?:da|de|do)\s+(manha|tarde|noite))?/);
 // "18h", "18h30", "18:30" sem "às"
 if(!x){const y=s.match(/\b(\d{1,2})(?::(\d{2})|h(\d{2})?)(?:oras?)?\b(\s+e meia)?(?:\s+(?:da|de|do)\s+(manha|tarde|noite))?/);if(y)x=[y[0],y[1],y[2]||y[3],'h',y[4],y[5]];}
 if(!x)return [];
 const h=+x[1],min=x[2]?+x[2]:x[4]?30:0,per=x[5]||'',marcado=!!(x[2]||x[3]);
 if(h>23||min>59)return [];
 const cands=[];
 if((per==='tarde'||per==='noite')&&h<12)cands.push(h+12);
 else if(per==='manha'||(marcado&&h>=12)||h===0||h>=12)cands.push(h);
 else{cands.push(h);cands.push(h+12);}   // "às 8": 08:00 ou 20:00
 const grade=gradeHoras();
 const hs=[...new Set(cands.map(v=>pad(v)+':'+pad(min)))];
 const naGrade=hs.filter(v=>grade.includes(v));
 return naGrade.length?naGrade:hs.slice(0,1);
}
function intencao(t){
 if(/\b(cancel\w*|desmarc\w*)\b/.test(t))return 'cancelar';
 // "agendadas"/"marcadas" é pergunta sobre as aulas, não pedido de agendar
 if(/\b(agend(?!ad)\w*|marc(?!ad)\w*|reserv(?!ad)\w*|quero (?:uma )?aula|quero jogar|quero treinar)\b/.test(t))return 'agendar';
 if(/\b(minhas aulas|minha aula|minha proxima|proxima aula|proximas aulas|quando (?:e|tenho|sera)|quais (?:sao )?(?:as )?minhas|aulas (?:marcadas|agendadas)|tenho aula)\b/.test(t))return 'minhas';
 if(/\b(credito|creditos|reposic\w*|saldo)\b/.test(t))return 'creditos';
 if(/\b(livre|livres|vago|vaga|vagas|disponive\w*|tem horario|horarios|horario)\b/.test(t))return 'consultar';
 return '';
}
function interpretar(frase){
 const t=norm(frase);
 const it=intencao(t),d=lerData(t),horas=lerHoras(t);
 return {t,acao:it||(d.data||horas.length?'consultar':''),data:d.data,erroData:d.erro,horas};
}

/* ---- respostas ---- */
function estado(dk,hora){
 try{return w.slotState(new Date(dk+'T12:00:00'),hora);}catch(e){return {st:'?',label:''};}
}
/* Livre para aula: "livre" do app, sem os horários que são só de torneio. */
function livreParaAula(dk,h){
 if(!(w.horasAte(dk,h)>0))return false;
 const e=estado(dk,h);return e.st==='livre'&&e.compartilhado!=='torneio'&&!e.semAula;
}
function livresDoDia(dk){return gradeHoras().filter(h=>livreParaAula(dk,h));}
function responder(texto,botoes){
 const box=porId('va-conversa');if(!box)return;
 const b=document.createElement('div');b.className='va-msg va-eu-nao';
 const p=document.createElement('p');p.textContent=texto;b.append(p);
 if(botoes&&botoes.length){const r=document.createElement('div');r.className='va-acoes';
  botoes.forEach(([rot,fn])=>{const x=document.createElement('button');x.type='button';x.className='va-bt';x.textContent=rot;x.onclick=fn;r.append(x);});b.append(r);}
 box.append(b);box.scrollTop=box.scrollHeight;
 falarResposta(texto);
}
function mostrarPergunta(frase){
 const box=porId('va-conversa');if(!box)return;
 const b=document.createElement('div');b.className='va-msg va-eu';b.textContent=frase;box.append(b);box.scrollTop=box.scrollHeight;
}
function agendarEm(dk,hora){
 fechar();
 try{const nav=porId('nav-al-agenda');if(typeof w.goAluno==='function')w.goAluno('agenda',nav);}catch(e){}
 const [y,m,d]=dk.split('-').map(Number);
 w.gotoBook(y,m-1,d,hora);   // a mesma janela de agendamento, com todas as regras
}
function cancelarEm(a){fechar();w.cancelarAula(a.data,a.hora,a.rec);}
function pedirEspera(dk,hora){fechar();try{const [y,m,d]=dk.split('-').map(Number);agDate=new Date(y,m-1,d,12);w.abrirEspera(hora);}catch(e){}}
function botoesHoras(dk,hs,acao){return hs.slice(0,12).map(h=>[(acao==='agendar'?'Agendar ':'')+h,()=>agendarEm(dk,h)]);}
function executar(frase){
 if(!logadoNoApp()){responder('Entre no app com seu código para usar o assistente.');return;}
 const r=interpretar(frase);
 if(!r.acao){responder('Não entendi. Você pode perguntar, por exemplo: "tem horário livre amanhã?", "marcar quinta às 18" ou "cancelar minha aula de terça às 9".');return;}
 if(r.erroData){responder(r.erroData);return;}
 if(r.acao==='creditos'){
  const E=eu(),c=Number(E.creditos)||0,g=Number(E.credGrupo)||0,rp=Number(E.reposValidas!=null?E.reposValidas:E.repos)||0,l=Number(E.locCred)||0;
  responder('Você tem '+c+' crédito'+(c===1?'':'s')+(g?', '+g+' de grupo':'')+(rp?' e '+rp+' reposiç'+(rp===1?'ão':'ões'):'')+(l?' · '+l+'h de locação':'')+'.');return;
 }
 if(r.acao==='minhas'){
  const lista=(w.aulasAgendadasAluno()||[]).filter(a=>!r.data||a.data===r.data);
  if(!lista.length){responder(r.data?'Você não tem aula marcada em '+rotDia(r.data)+'.':'Você não tem aulas marcadas nos próximos dias.',[['Ver horários livres',()=>{fechar();try{w.goAluno('agenda',porId('nav-al-agenda'));}catch(e){}}]]);return;}
  const top=lista.slice(0,5);
  responder((r.data?'Em '+rotDia(r.data)+': ':'Suas próximas aulas: ')+top.map(a=>rotDia(a.data)+' às '+a.hora+(a.tipo==='torneio'?' (torneio)':a.tipo==='locacao'?' (locação)':'')+(a.pendente?' (aguardando)':'')).join('; ')+'.');return;
 }
 if(r.acao==='cancelar'){
  const minhas=(w.aulasAgendadasAluno()||[]).filter(a=>!a.pendente&&(!r.data||a.data===r.data)&&(!r.horas.length||r.horas.includes(a.hora)));
  if(!r.data&&!r.horas.length){responder('Qual aula você quer cancelar? Diga o dia e a hora, por exemplo "cancelar terça às 9".',minhas.slice(0,4).map(a=>['Cancelar '+rotDia(a.data)+' '+a.hora,()=>cancelarEm(a)]));return;}
  if(!minhas.length){responder('Não achei aula sua '+(r.data?'em '+rotDia(r.data):'')+(r.horas.length?' às '+r.horas.join(' ou '):'')+'.');return;}
  if(minhas.length===1){responder('Encontrei sua aula de '+rotDia(minhas[0].data)+' às '+minhas[0].hora+'. O app vai pedir a confirmação.',[['Cancelar esta aula',()=>cancelarEm(minhas[0])]]);return;}
  responder('Você tem '+minhas.length+' aulas nesse dia. Qual delas?',minhas.slice(0,6).map(a=>['Cancelar '+a.hora,()=>cancelarEm(a)]));return;
 }
 // consultar ou agendar
 if(!r.data){
  if(r.horas.length===1){
   const prox=[];for(let i=0;i<7&&prox.length<4;i++){const dk=somarDia(hojeK(),i);if(livreParaAula(dk,r.horas[0]))prox.push(dk);}
   if(!prox.length){responder('Não achei '+r.horas[0]+' livre nos próximos 7 dias.');return;}
   responder(r.horas[0]+' está livre em: '+prox.map(rotDia).join('; ')+'.',prox.map(dk=>[(r.acao==='agendar'?'Agendar ':'')+rotDia(dk),()=>agendarEm(dk,r.horas[0])]));return;
  }
  responder('Para qual dia? Diga, por exemplo, "amanhã", "quinta" ou "dia 25".');return;
 }
 const hs=gradeHoras();
 if(!r.horas.length){
  const livres=livresDoDia(r.data);
  if(!livres.length){responder('Não há horário livre para aula em '+rotDia(r.data)+'.');return;}
  responder('Horários livres em '+rotDia(r.data)+': '+livres.join(', ')+'. Toque em um para agendar.',botoesHoras(r.data,livres,'agendar'));return;
 }
 if(r.horas.length>1){responder('De manhã ou à noite?',r.horas.map(h=>[(r.acao==='agendar'?'Agendar ':'')+h,()=>r.acao==='agendar'?agendarEm(r.data,h):executar(rotDia(r.data)+' as '+h+' livre')]));return;}
 const h=r.horas[0];
 if(!hs.includes(h)){responder('Não há aula às '+h+'. Os horários vão das '+(hs[0]||'')+' às '+(hs[hs.length-1]||'')+'.');return;}
 if(w.horasAte(r.data,h)<=0){responder('Esse horário já passou.');return;}
 const s=estado(r.data,h);
 if(s.st==='meu'){responder('Você já tem '+String(s.label||'aula').toLowerCase()+' em '+rotDia(r.data)+' às '+h+'.');return;}
 if(s.st==='pend'){responder('Seu pedido para '+rotDia(r.data)+' às '+h+' está aguardando o João.');return;}
 if(s.st==='livre'||s.st==='loc'){
  const txt=(s.st==='loc'?'Esse horário é só para locação ou torneio: ':'Está livre: ')+rotDia(r.data)+' às '+h+'.';
  if(r.acao==='agendar'){responder(txt+' Abrindo o agendamento…');setTimeout(()=>agendarEm(r.data,h),350);return;}
  responder(txt,[['Agendar '+h,()=>agendarEm(r.data,h)]]);return;
 }
 const livres=livresDoDia(r.data).slice(0,6);
 const b=livres.map(x=>['Agendar '+x,()=>agendarEm(r.data,x)]);
 if(s.esperavel)b.unshift(['Avisar se liberar',()=>pedirEspera(r.data,h)]);
 responder((s.st==='fechado'?'A quadra está fechada':s.st==='chuva'?'Cancelado por chuva':'Ocupado')+' em '+rotDia(r.data)+' às '+h+'.'+(livres.length?' Livres nesse dia: '+livres.join(', ')+'.':' Não há outro horário livre nesse dia.'),b);
}

/* ---- fala ---- */
/* Voz masculina em português, para soar parecida com a do João. O app usa as
   vozes que o próprio celular tem (não grava nem copia a voz de ninguém):
   procura uma masculina pelo nome; sem nenhuma, deixa a voz padrão mais grave. */
const VOZES_MASC=['antonio','felipe','daniel','fabio','humberto','donato','julio','valerio','nicolau','thiago','reed','eddy'];
const VOZES_FEM=/luciana|francisca|fernanda|maria|heloisa|leticia|yara|camila|vitoria|thalita|brenda|elza|manuela|giovanna|leila|joana|catarina|female|feminin/;
function escolherVoz(){
 let vs=[];try{vs=w.speechSynthesis.getVoices()||[];}catch(e){}
 const pt=vs.filter(v=>/^pt/i.test(v.lang||'')),br=pt.filter(v=>/br/i.test(v.lang||''));
 const nome=v=>norm(v.name);
 for(const lista of [br,pt])for(const m of VOZES_MASC){const v=lista.find(x=>nome(x).includes(m));if(v)return {voz:v,grave:false};}
 const neutra=br.find(v=>!VOZES_FEM.test(nome(v))&&!/google/.test(nome(v)))||null;
 return {voz:neutra||br[0]||pt[0]||null,grave:!neutra};
}
function falarResposta(texto){
 if(!st.ouvir||!st.aberto||!w.speechSynthesis||!w.SpeechSynthesisUtterance)return;
 try{
  w.speechSynthesis.cancel();
  const u=new w.SpeechSynthesisUtterance(texto.replace(/(\d{2}):00/g,'$1 horas'));
  const e=escolherVoz();u.lang='pt-BR';try{if(e.voz)u.voice=e.voz;}catch(x){}
  u.pitch=e.grave?0.75:0.95;u.rate=1;
  w.speechSynthesis.speak(u);
 }catch(e){}
}
function status(t){const s=porId('va-status');if(s)s.textContent=t;}
function ouvir(){
 const C=w.SpeechRecognition||w.webkitSpeechRecognition;
 if(!C){status('Use o microfone do teclado para ditar, ou escreva.');porId('va-texto').focus();return;}
 if(st.rec){try{st.rec.stop();}catch(e){}return;}
 try{w.speechSynthesis&&w.speechSynthesis.cancel();}catch(e){}
 const r=new C();st.rec=r;r.lang='pt-BR';r.interimResults=true;r.continuous=false;let final='';
 r.onresult=e=>{let parcial='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)final+=e.results[i][0].transcript;else parcial+=e.results[i][0].transcript;}porId('va-texto').value=(final+parcial).trim();};
 r.onerror=e=>{st.rec=null;marcarOuvindo();status(e.error==='not-allowed'||e.error==='service-not-allowed'?'Sem permissão para o microfone. Escreva ou use o ditado do teclado.':'Não consegui ouvir. Tente de novo ou escreva.');};
 r.onend=()=>{if(st.rec!==r)return;st.rec=null;marcarOuvindo();if(final.trim())enviar();else status('Não ouvi. Toque no microfone e fale de novo.');};
 try{r.start();status('Ouvindo…');}catch(e){st.rec=null;status('Não consegui ligar o microfone. Escreva.');}
 marcarOuvindo();
}
function marcarOuvindo(){const b=porId('va-falar');if(b){b.classList.toggle('ouvindo',!!st.rec);b.setAttribute('aria-pressed',String(!!st.rec));b.querySelector('span').textContent=st.rec?'Ouvindo… toque para parar':'Toque e fale';}}
function enviar(){
 const t=(porId('va-texto').value||'').trim();if(!t)return;
 porId('va-texto').value='';mostrarPergunta(t);status('');
 try{executar(t);}catch(e){responder('Algo deu errado aqui. Tente pelo calendário da Agenda.');}
}

/* ---- tela ---- */
function abrir(){
 if(st.aberto)return;st.aberto=true;
 const p=porId('va-painel');p.hidden=false;document.body.classList.add('va-aberto');
 porId('va-conversa').replaceChildren();
 const nome=String((eu()&&eu().nome)||'').split(' ')[0];
 const h=new Date().getHours(),saud=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
 responder(saud+(nome?', '+nome:'')+'! Como posso te ajudar?');
 porId('va-ouvir').checked=st.ouvir;atualizar();
 setTimeout(()=>{try{porId('va-texto').focus({preventScroll:true});}catch(e){}},50);
}
function fechar(){
 if(!st.aberto)return;st.aberto=false;
 if(st.rec){try{st.rec.abort();}catch(e){}st.rec=null;}
 try{w.speechSynthesis&&w.speechSynthesis.cancel();}catch(e){}
 porId('va-painel').hidden=true;document.body.classList.remove('va-aberto');marcarOuvindo();atualizar();
}
function atualizar(){
 const bt=porId('va-atalho');if(!bt)return;
 const app=porId('app'),logado=!!(app&&getComputedStyle(app).display!=='none'&&logadoNoApp());
 const outra=document.querySelector('.overlay.on');
 bt.hidden=!logado||st.aberto||!!outra;
 if(st.aberto&&!logado)fechar();
}
function iniciarVoz(){
 try{if(w.speechSynthesis){w.speechSynthesis.getVoices();w.speechSynthesis.addEventListener&&w.speechSynthesis.addEventListener('voiceschanged',()=>{});}}catch(e){}
 if(!porId('va-painel'))return;
 porId('va-atalho').onclick=abrir;porId('va-fechar').onclick=fechar;porId('va-falar').onclick=ouvir;porId('va-enviar').onclick=enviar;
 porId('va-texto').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();enviar();}});
 porId('va-ouvir').addEventListener('change',()=>{st.ouvir=porId('va-ouvir').checked;try{localStorage.setItem('jv-va-ouvir',st.ouvir?'1':'0');}catch(e){}if(!st.ouvir)try{w.speechSynthesis.cancel();}catch(e){}});
 porId('va-painel').addEventListener('click',e=>{if(e.target===porId('va-painel'))fechar();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&st.aberto)fechar();});
 document.querySelectorAll('.va-ex').forEach(b=>b.addEventListener('click',()=>{porId('va-texto').value=b.textContent.replace(/[“”"]/g,'');enviar();}));
 let ag=false;new MutationObserver(()=>{if(ag)return;ag=true;requestAnimationFrame(()=>{ag=false;atualizar();});}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style']});
 atualizar();
}
w.JVVozAluno={abrir,fechar,interpretar,executar,enviar,escolherVoz};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarVoz,{once:true});else iniciarVoz();
})();

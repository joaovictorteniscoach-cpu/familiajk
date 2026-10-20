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
const st={aberto:false,rec:null,ouvir:true,pend:null,ligando:false,fimRec:0};
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
 const cancel=/\b(cancel\w*|desmarc\w*)\b/.test(t);
 if(cancel&&/\b(ate quando|prazo|regra|antecedencia|quantas horas|com quanto tempo)\b/.test(t))return 'regraCancel';
 if(cancel)return 'cancelar';
 if(/\b(chuva|chover|chovendo)\b/.test(t))return 'chuva';
 if(/\b(repor|repoe|reposic\w*)\b/.test(t)&&!/\b(quanto|preco|valor|custa)\b/.test(t))return 'repor';
 if(/\b(minha mensalidade|meu plano|eu pago|estou devendo|to devendo|devo|em dia|vencimento|vence|meu pagamento|paguei|quanto falta)\b/.test(t))return 'minhaMens';
 if(/\b(pix|pagar|pagamento|cartao|chave)\b/.test(t))return 'pagar';
 if(/\b(quanto|preco|precos|valor|valores|custa|custam|custo|cobra|mensalidade|mensalidades|planos?|pacotes?)\b/.test(t))return 'precos';
 // "agendadas"/"marcadas" é pergunta sobre as aulas, não pedido de agendar
 if(/\b(agend(?!ad)\w*|marc(?!ad)\w*|reserv(?!ad)\w*|quero (?:uma )?aula|quero jogar|quero treinar)\b/.test(t))return 'agendar';
 if(/\b(minhas aulas|minha aula|minha proxima|proxima aula|proximas aulas|quando (?:e|tenho|sera)|quais (?:sao )?(?:as )?minhas|aulas (?:marcadas|agendadas)|tenho aula)\b/.test(t))return 'minhas';
 if(/\b(credito|creditos|saldo)\b/.test(t))return 'creditos';
 if(/\b(lista de espera|na espera)\b/.test(t))return 'espera';
 if(/\b(torneio|barragem|ranking|classificacao|pontuacao)\b/.test(t))return 'torneio';
 if(/\b(abre|fecha|aberto|aberta|expediente|funcionamento)\b/.test(t)||(/\bfunciona\b/.test(t)&&!/\bcomo funciona\b/.test(t)))return 'funcionamento';
 if(/\b(aviso|avisos|recado|novidade|novidades)\b/.test(t))return 'aviso';
 if(/\b(nivel|evolucao|avaliacao|foco|prioridade)\b/.test(t))return 'nivel';
 if(/\b(whats\w*|zap|telefone|contato|falar com o joao|falar com o professor)\b/.test(t))return 'contato';
 if(/\b(ajuda|o que voce faz|o que voce sabe|o que posso perguntar)\b/.test(t))return 'ajuda';
 if(/\b(livre|livres|vago|vaga|vagas|disponive\w*|tem horario|horarios|horario)\b/.test(t))return 'consultar';
 return '';
}
/* Quantidade de aulas: "4 aulas", "oito aulas", "duas vezes por semana" (x4). */
function lerQtd(t){
 const un='(?:aulas?|treinos?|vezes|reposic\\w*)';
 let x=t.match(new RegExp('\\b(\\d{1,2})\\s*'+un+'\\b'));let n=x?+x[1]:0;
 if(!n)for(const k of Object.keys(NUMS).sort((a,b)=>b.length-a.length)){const y=t.match(new RegExp('\\b'+k+'\\s+'+un+'\\b'));if(y){n=NUMS[k];x=y;break;}}
 if(n&&/\b(por semana|na semana|semanais?)\b/.test(t))n*=4;
 return n;
}
/* Resposta curta a uma pergunta do assistente: "4", "quatro", "dupla". */
function lerQtdSolta(t){const x=t.match(/^(\d{1,2})$/);if(x)return +x[1];return NUMS[t]||lerQtd(t);}
function catDe(t){
 if(/\bdupla\b/.test(t))return 'Dupla';if(/\btrio\b/.test(t))return 'Trio';if(/\bquarteto\b/.test(t))return 'Quarteto';
 if(/\bgrupo\b/.test(t))return 'Grupo';if(/\b(particular|individual)\b/.test(t))return 'Particular';if(/\bpersonal\b/.test(t))return 'Personal';
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
/* ---- perguntas sobre o app (20/10, pedido do João) ----
   Responde só com o que o próprio app já mostra: tabela de planos e preços
   publicados pelo João, a mensalidade e o saldo do aluno, horários da quadra,
   torneio, aviso, avaliação. Quando falta um dado, pergunta (quantas aulas?
   particular ou em grupo?). Nada é pedido nem pago por aqui: os botões abrem
   as telas do app. Mensagem ao aluno nunca fala de desconto. */
const fn=(nome,...a)=>{try{return typeof w[nome]==='function'?w[nome](...a):undefined;}catch(e){return undefined;}};
const R$=v=>fn('fmt',v)||('R$ '+Number(v||0).toLocaleString('pt-BR'));
const QTDS=[3,4,6,8,10];
function abrirTela(f){return ()=>{fechar();try{f();}catch(e){}};}
function irAgenda(){fn('goAluno','agenda',porId('nav-al-agenda'));}
function whatsJoao(texto){return ['Falar com o João no WhatsApp',abrirTela(()=>{const nome=String((eu()&&eu().nome)||'').split(' ')[0];w.abrirWhatsApp('5541995415712','Olá João! '+(nome?'Aqui é '+nome+'. ':'')+(texto||''));})];}
function planoResposta(cat,n){
 const personal=!!fn('isPersonal');
 if(personal)cat='Personal';
 const fam=fn('familiaAluno')?' Seu plano é família: para mudar, combine com o João.':'';
 if(!cat){
  st.pend={tipo:'plano',n};
  responder('Você quer o plano particular ou em grupo?',[['Particular',()=>planoResposta('Particular',n)],['Em grupo',()=>planoResposta('Grupo',n)]]);return;
 }
 if(!n){
  st.pend={tipo:'plano',cat};
  responder('Quantas '+(cat==='Personal'?'treinos':'aulas')+' você deseja fazer no mês?',QTDS.map(q=>[q+(cat==='Personal'?' treinos':' aulas'),()=>planoResposta(cat,q)]));return;
 }
 st.pend=null;
 const ver=[['Ver planos no app',abrirTela(()=>w.abrirPlanos())]];
 if(cat==='Personal'){const vt=fn('precoPersonal')||0;responder(n+' treinos por mês ficam '+R$(n*vt)+' ('+R$(vt)+' por treino).'+fam,ver);return;}
 if(cat==='Grupo'){
  const g=['Dupla','Trio','Quarteto'].map(c=>c.toLowerCase()+' '+R$(fn('planoValor',c,n))).join(', ');
  responder('Em grupo, '+n+' aulas por mês: '+g+', por pessoa.'+fam,ver);return;
 }
 if(cat!=='Particular'){const v=fn('planoValor',cat,n)||0;responder('Em '+cat.toLowerCase()+', '+n+' aulas por mês ficam '+R$(v)+' por pessoa ('+R$(v/n)+' por aula).'+fam,ver);return;}
 if(n===10){responder('O plano particular de 10 aulas é a combinar com o João.'+fam,[whatsJoao('Tenho interesse no plano particular de 10 aulas por mês.')]);return;}
 const v=(fn('planosTabela')||{}).Particular||{};
 if(!v[n]){st.pend={tipo:'plano',cat};responder('Os planos particulares são de 3, 4, 6, 8 ou 10 aulas por mês. Qual deles?',QTDS.map(q=>[q+' aulas',()=>planoResposta(cat,q)]));return;}
 responder('Plano particular com '+n+' aulas por mês: '+R$(v[n])+' por mês.'+fam,ver);
}
function precosResposta(r){
 const t=r.t,cat=catDe(t),n=lerQtd(t),P=(pub()&&pub().precos)||{};
 if(/\bloca\w*|\balug\w*/.test(t)){
  const h=fn('horasLocAluno')||0;
  responder('A locação da quadra custa '+R$(fn('precoLocacao'))+' por hora.'+(h>0?' Você já tem '+h+'h de locação pagas.':''),[['Ver horários',abrirTela(irAgenda)]]);return;
 }
 if(/\bplanilha\b/.test(t)||/\b(kids?|crianca\w*)\b/.test(t)){
  const k=/\bplanilha\b/.test(t)?'planilha':'kids',v=Number(P[k])||0,nome=k==='planilha'?'O treino de planilha avulso':'O treino kids avulso';
  if(v>0)responder(nome+' custa '+R$(v)+'.',[['Comprar',abrirTela(()=>w.openComprar())]]);
  else responder('Esse valor não está no app. Pergunte ao João.',[whatsJoao('Qual o valor do treino '+(k==='planilha'?'de planilha':'kids')+'?')]);
  return;
 }
 const mensal=n>0||/\b(mensal\w*|planos?|por mes|no mes|pacotes?|flex)\b/.test(t);
 if(mensal){planoResposta(cat,n);return;}
 if(cat==='Personal'||fn('isPersonal')){
  st.pend={tipo:'plano',cat:'Personal'};
  responder('O treino avulso custa '+R$(fn('precoPersonal'))+'. Quer saber o valor por mês? Quantos treinos você deseja fazer no mês?',QTDS.map(q=>[q+' treinos',()=>planoResposta('Personal',q)]));return;
 }
 const grupo=['Grupo','Dupla','Trio','Quarteto'].includes(cat)||(!cat&&fn('isGrupo'));
 const txt=grupo?'A aula avulsa em grupo custa '+R$(fn('precoAvulsaGrupo'))+' por pessoa.':'A aula particular avulsa custa '+R$(fn('precoAvulsaPart'))+'.'+(!cat?' Em grupo, a avulsa custa '+R$(fn('precoAvulsaGrupo'))+' por pessoa.':'');
 const pc=grupo?(cat&&cat!=='Particular'?cat:'Grupo'):'Particular';
 st.pend={tipo:'plano',cat:pc};
 responder(txt+' Quer saber o plano mensal? Quantas aulas você deseja fazer no mês?',[['Comprar aula avulsa',abrirTela(()=>w.openComprar())]].concat(QTDS.map(q=>[q+' aulas/mês',()=>planoResposta(pc,q)])));
}
function minhaMensResposta(){
 const E=eu();
 if(fn('dependenteAluno')){responder('Sua mensalidade está incluída no plano família. O pagamento é feito por '+((E.familia&&E.familia.responsavelNome)||'seu responsável')+'.');return;}
 if(fn('mensOculta')){responder('O valor da sua mensalidade aparece quando o João aprovar este aparelho. Seu plano: '+(fn('planoPremium')||'—')+'.');return;}
 const pago=E.status==='pago',situ=pago?'em dia':E.status==='parcial'?String(fn('rotuloParcialAluno')||'parcial').toLowerCase():'pendente';
 let txt='Seu plano: '+(fn('planoPremium')||'—')+'. Mensalidade: '+R$(E.mensalidade)+'. Situação: '+situ+'. '+(pago?'Próximo vencimento: ':'Vencimento: ')+(fn('vencimentoPremium')||'a confirmar')+'.';
 const b=[];
 if(!pago){
  const f=fn('valorAPagarMensalidade');if(E.status==='parcial'&&f>0)txt+=' Falta pagar '+R$(f)+'.';
  const an=fn('pagamentoEmAnalise');if(an)txt+=' Seu aviso de pagamento de '+an+' está com o João.';
  else b.push(['Pagar agora',abrirTela(()=>w.irPagar())]);
 }
 responder(txt,b);
}
function pagarResposta(){
 const E=eu(),p=pub()||{};
 if(fn('dependenteAluno')){responder('O pagamento do plano família é feito por '+((E.familia&&E.familia.responsavelNome)||'seu responsável')+'.');return;}
 responder('Você pode pagar por Pix'+(p.pix?' (chave '+p.pix+(p.pixNome?', em nome de '+p.pixNome:'')+')':'')+(p.cardLink?' ou cartão':'')+', pela tela de pagamento do app. Depois de pagar, avise pelo próprio app para o João confirmar.',[['Abrir pagamento',abrirTela(()=>w.irPagar())]]);
}
function proximosLivres(max,data){
 const out=[];const dias=data?[data]:[...Array(7)].map((_,i)=>somarDia(hojeK(),i));
 for(const dk of dias){for(const h of livresDoDia(dk)){out.push([dk,h]);if(out.length>=max)return out;}}
 return out;
}
function reporResposta(r){
 const E=eu(),saldo=Number(fn('saldoReposAluno'))||0,venc=Number(E.reposVencendo)||0,n=lerQtd(r.t);
 if(!saldo){responder('Você não tem reposições no momento. Quando sobra aula do plano na virada do mês, ela vira reposição e vale por 4 meses.');return;}
 let txt='Você tem '+saldo+' reposiç'+(saldo===1?'ão':'ões')+(venc?', '+venc+' vence'+(venc===1?'':'m')+' no fim do mês':'')+'.';
 if(n>saldo)txt='Você pediu '+n+', mas tem '+saldo+' reposiç'+(saldo===1?'ão':'ões')+'.'+(venc?' '+venc+' vence'+(venc===1?'':'m')+' no fim do mês.':'');
 const livres=proximosLivres(6,r.data);
 if(!livres.length){responder(txt+' Não achei horário livre '+(r.data?'em '+rotDia(r.data):'nos próximos 7 dias')+'. Fale com o João.',[whatsJoao('Quero marcar reposição e não achei horário livre.')]);return;}
 responder(txt+' Escolha um horário livre e toque em “Marcar reposição”'+(Math.min(n||1,saldo)>1?'; marque uma aula de cada vez':'')+'.',livres.map(([dk,h])=>['Repor '+rotDia(dk)+' '+h,()=>agendarEm(dk,h)]));
}
function funcionamentoResposta(r){
 const abertos=dk=>gradeHoras().filter(h=>{try{return w.slotModo(new Date(dk+'T12:00:00'),h)!=='fechado';}catch(e){return true;}});
 const faixa=hs=>hs.length?'das '+hs[0]+' às '+hs[hs.length-1]:'fechada';
 if(r.data){const hs=abertos(r.data);responder(hs.length?'Em '+rotDia(r.data)+' os horários vão '+faixa(hs)+'.':'Em '+rotDia(r.data)+' a quadra está fechada.');return;}
 const seg=somarDia(hojeK(),(8-new Date(hojeK()+'T12:00:00').getDay())%7||7);   // próxima segunda: semana padrão
 const ds=[...Array(7)].map((_,i)=>{const dk=somarDia(seg,i);return [DIAS_C[new Date(dk+'T12:00:00').getDay()],faixa(abertos(dk))];});
 const grupos=[];ds.forEach(([d,f])=>{const g=grupos[grupos.length-1];if(g&&g.f===f)g.ate=d;else grupos.push({de:d,ate:'',f});});
 responder('Horários da quadra: '+grupos.map(g=>g.de+(g.ate?' a '+g.ate:'')+' '+g.f).join('; ')+'.');
}
function torneioResposta(r){
 const T=pub()&&pub().torneio,E=eu();
 if(/\b(pontuacao|quantos pontos|como funciona|regra)\b/.test(r.t)){responder('No torneio, vitória vale 3 pontos, derrota vale 1 e W.O. vale 3 para quem compareceu (0 para quem faltou).');return;}
 if(!T||!Array.isArray(T.jogadores)||!T.jogadores.length){responder('Não há torneio em andamento no app.');return;}
 const nome=(T.nome||'Torneio')+(T.etapa?' · etapa '+T.etapa:'');
 const eu_=T.jogadores.find(p=>p.cod&&p.cod===E.codigo)||T.jogadores.find(p=>String(p.name||'').toLowerCase()===String(E.nome||'').toLowerCase());
 const ver=[['Ver torneio',abrirTela(()=>w.goAluno('torneio',null))]];
 if(!eu_){responder(nome+': você não está na tabela. Para participar, fale com o João.',ver.concat([whatsJoao('Quero participar do torneio.')]));return;}
 const gr=T.jogadores.filter(p=>p.group===eu_.group),rk=(fn('rankTorAl',gr)||gr),pos=rk.indexOf(eu_)+1,pts=fn('calcPtsTorAl',eu_);
 const gNome=(T.nomesGrupos&&T.nomesGrupos[eu_.group])||('grupo '+eu_.group);
 responder(nome+': você está em '+pos+'º lugar no '+gNome+', com '+pts+' pontos ('+(eu_.v||0)+' vitória'+((eu_.v||0)===1?'':'s')+', '+(eu_.d||0)+' derrota'+((eu_.d||0)===1?'':'s')+').',ver);
}
function nivelResposta(){
 const E=eu(),av=Array.isArray(E.avaliacoes)?E.avaliacoes:[];
 if(!av.length){responder('Você ainda não tem avaliação no app. O João registra depois de avaliar você em aula.');return;}
 const u=av[av.length-1],foco=fn('focoPremium');
 responder('Seu nível atual: '+(u.nivel||'—')+(u.data?' (avaliação de '+u.data.slice(8,10)+'/'+u.data.slice(5,7)+')':'')+'.'+(foco&&foco!=='A definir'?' Foco agora: '+foco+'.':''),[['Ver evolução',abrirTela(()=>w.irEvolucao())]]);
}
function esperaResposta(){
 const hoje=hojeK(),l=((meu()&&meu().espera)||[]).filter(e=>e.data>=hoje);
 if(!l.length){responder('Você não está em nenhuma lista de espera. Quando um horário está reservado, peça “avisar se liberar”.');return;}
 responder('Você está na lista de espera de: '+l.map(e=>rotDia(e.data)+' às '+e.hora).join('; ')+'. Se a vaga liberar, o app avisa.');
}
function infoResposta(r){
 switch(r.acao){
  case 'precos':precosResposta(r);return true;
  case 'minhaMens':minhaMensResposta();return true;
  case 'pagar':pagarResposta();return true;
  case 'repor':reporResposta(r);return true;
  case 'funcionamento':funcionamentoResposta(r);return true;
  case 'torneio':torneioResposta(r);return true;
  case 'nivel':nivelResposta();return true;
  case 'espera':esperaResposta();return true;
  case 'aviso':{const a=pub()&&pub().aviso;responder(a?'Aviso do João: '+a:'Nenhum aviso no momento.');return true;}
  case 'regraCancel':{let L=4;try{L=LIMITE_CANCEL_H;}catch(e){}responder('Você pode cancelar pelo app até '+L+' horas antes da aula. Depois disso, fale com o João.');return true;}
  case 'chuva':responder('Se a aula for cancelada por chuva, o app avisa e você não gasta crédito.');return true;
  case 'contato':responder('Fale com o João pelo WhatsApp.',[whatsJoao('')]);return true;
  case 'ajuda':responder('Posso ver horários livres, agendar, cancelar, mostrar suas aulas e créditos, reposições, preços e planos, sua mensalidade e vencimento, como pagar, horários da quadra, torneio, avisos e seu nível.');return true;
 }
 return false;
}
/* Pergunta que o assistente fez ("quantas aulas?"): a resposta curta completa. */
function continuarPendente(r){
 const P=st.pend;if(!P)return false;
 if(r.acao&&r.acao!=='consultar'&&!(r.acao==='precos'&&lerQtd(r.t)))return false;
 const n=lerQtdSolta(r.t),cat=catDe(r.t);
 if(P.tipo==='plano'&&(n||cat)){planoResposta(cat||P.cat,n||P.n);return true;}
 return false;
}
function executar(frase){
 if(!logadoNoApp()){responder('Entre no app com seu código para usar o assistente.');return;}
 const r=interpretar(frase);
 if(continuarPendente(r))return;
 st.pend=null;
 if(r.erroData&&!['consultar','agendar','minhas','cancelar'].includes(r.acao))r.erroData='';
 if(infoResposta(r))return;
 if(!r.acao){
  // Dúvida que o assistente não resolve vai para o João, com a pergunta já escrita
  const nome=String((eu()&&eu().nome)||'').split(' ')[0];
  responder('Essa eu não sei responder. Posso ajudar com horários, agendar, cancelar, aulas, créditos, reposições, preços e planos, mensalidade, pagamento e torneio. Se for outra dúvida, mande para o João.',
   [['Perguntar ao João no WhatsApp',()=>{fechar();try{w.abrirWhatsApp('5541995415712','Olá João! '+(nome?'Aqui é '+nome+'. ':'')+frase);}catch(e){}}]]);
  return;
 }
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
   procura uma masculina pelo nome (iPhone: Eddy, Reed, Rocko; Windows/Edge:
   Antonio, Daniel; Android: as variantes "ptd"); sem nenhuma, a padrão mais grave.
   A lista de vozes chega depois no iPhone e no Chrome: fica guardada quando chega. */
const VOZES_MASC=['antonio','daniel','felipe','fabio','humberto','donato','julio','valerio','nicolau','thiago','eddy','reed','rocko','grandpa','ptd','male','masculin'];
const VOZES_FEM=/luciana|francisca|fernanda|maria|heloisa|leticia|yara|camila|vitoria|thalita|brenda|elza|manuela|giovanna|leila|joana|catarina|flo\b|grandma|sandy|shelley|female|feminin|afs/;
let vozGuardada=null;
function escolherVoz(){
 let vs=[];try{vs=w.speechSynthesis.getVoices()||[];}catch(e){}
 const pt=vs.filter(v=>/^pt/i.test(v.lang||'')),br=pt.filter(v=>/br/i.test(v.lang||''));
 const nome=v=>norm(v.name)+' '+norm(v.voiceURI||'');
 for(const lista of [br,pt])for(const m of VOZES_MASC){const v=lista.find(x=>nome(x).includes(m)&&!VOZES_FEM.test(nome(x)));if(v)return {voz:v,grave:false};}
 const neutra=br.find(v=>!VOZES_FEM.test(nome(v))&&!/google/.test(nome(v)))||null;
 return {voz:neutra||br[0]||pt[0]||null,grave:!neutra};
}
function vozDaResposta(){if(!vozGuardada||!vozGuardada.voz)vozGuardada=escolherVoz();return vozGuardada;}
/* O iPhone trava se a fala e o microfone disputam o som ao mesmo tempo:
   não fala enquanto o microfone está ligado, espera o microfone soltar antes
   de responder e espera a fala parar antes de ligar o microfone. */
let filaFala=null;
function falando(){try{return !!(w.speechSynthesis&&(w.speechSynthesis.speaking||w.speechSynthesis.pending));}catch(e){return false;}}
function calarFala(){clearTimeout(filaFala);filaFala=null;try{if(w.speechSynthesis&&falando())w.speechSynthesis.cancel();}catch(e){}}
function falarResposta(texto){
 if(!st.ouvir||!st.aberto||!w.speechSynthesis||!w.SpeechSynthesisUtterance)return;
 const fala=texto.replace(/R\$\s?([\d.]+)(?:,(\d{2}))?/g,(m,a,b)=>a+' reais'+(b&&b!=='00'?' e '+b+' centavos':'')).replace(/(\d{2}):00/g,'$1 horas').replace(/\b(\d{2})\/(\d{2})\b/g,'$1 do $2');
 const dizer=()=>{
  filaFala=null;if(!st.aberto||!st.ouvir||st.rec)return;
  try{
   const u=new w.SpeechSynthesisUtterance(fala);
   const e=vozDaResposta();u.lang='pt-BR';try{if(e.voz)u.voice=e.voz;}catch(x){}
   u.pitch=e.grave?0.7:0.95;u.rate=1;
   w.speechSynthesis.speak(u);
  }catch(e){}
 };
 const jaFalava=falando();calarFala();
 const espera=Math.max(jaFalava?250:0,(st.fimRec||0)+600-Date.now());   // microfone acabou de soltar o som
 if(espera>0)filaFala=setTimeout(dizer,espera);else dizer();
}
function status(t){const s=porId('va-status');if(s)s.textContent=t;}
/* Escuta com saída garantida: para sozinha 2,5 s depois da última palavra,
   no máximo em 12 s, e se o celular não avisar que parou, o app solta o
   microfone por conta própria (antes o botão podia ficar preso em "Ouvindo"). */
/* iPhone fora do modo app (aberto no navegador, ou pelo ícone antigo do
   Netlify, que agora leva ao endereço oficial): o reconhecimento de fala do
   próprio app trava ali. Nesses casos, e se ele já falhou neste aparelho, o
   botão usa o microfone do teclado, que funciona sempre. */
function ehIOS(){const u=navigator.userAgent||'';return /iPad|iPhone|iPod/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1);}
function comoApp(){try{return navigator.standalone===true||w.matchMedia('(display-mode: standalone)').matches;}catch(e){return false;}}
const CHAVE_FALHOU='jv-va-rec-falhou';
function reconhecimento(){
 const C=w.SpeechRecognition||w.webkitSpeechRecognition;if(!C)return null;
 if(ehIOS()&&!comoApp())return null;
 try{if(localStorage.getItem(CHAVE_FALHOU)==='1')return null;}catch(e){}
 return C;
}
function ditarPeloTeclado(msg){
 status(msg||'Toque no microfone do teclado 🎤, fale e depois toque em Enviar.');
 const t=porId('va-texto');try{t.focus();}catch(e){}
}
function ouvir(){
 const C=reconhecimento();
 if(!C){ditarPeloTeclado();return;}
 if(st.rec){pararEscuta(st.rec);return;}
 if(st.ligando)return;
 try{const t=porId('va-texto');if(document.activeElement===t)t.blur();}catch(e){}   // teclado fechado: sem disputa com o ditado
 const jaFalava=falando();calarFala();
 st.ligando=true;status('Preparando o microfone…');
 setTimeout(()=>{st.ligando=false;if(st.aberto)ligarEscuta(C);},jaFalava?350:0);
}
function ligarEscuta(C){
 let r;try{r=new C();}catch(e){status('Não consegui ligar o microfone. Escreva sua pergunta.');return;}
 st.rec=r;r.lang='pt-BR';r.interimResults=true;r.continuous=false;
 let final='',ultimo=-1,acabou=false,silencio=null,limite=null,socorro=null;
 const terminar=(motivo)=>{
  if(acabou)return;acabou=true;clearTimeout(silencio);clearTimeout(limite);clearTimeout(socorro);
  if(st.rec===r)st.rec=null;st.fimRec=Date.now();marcarOuvindo();
  if(!st.aberto)return;
  if(motivo)status(motivo);
  else if(final.trim()||(porId('va-texto').value||'').trim())enviar();
  else status('Não ouvi. Toque no microfone e fale de novo, ou escreva.');
 };
 r._terminar=terminar;
 const esperarSilencio=()=>{clearTimeout(silencio);silencio=setTimeout(()=>pararEscuta(r),2500);};
 r.onresult=e=>{
  if(acabou||st.rec!==r)return;
  comecou=true;
  let parcial='';
  for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal){if(i>ultimo){final+=(final?' ':'')+t.trim();ultimo=i;}}else parcial+=t;}
  porId('va-texto').value=(final+' '+parcial).trim().slice(0,300);
  status('Ouvindo… toque no botão para parar.');esperarSilencio();
 };
 r.onerror=e=>{if(acabou)return;const nega=e&&(e.error==='not-allowed'||e.error==='service-not-allowed');
  terminar(nega?'Sem permissão para o microfone. Escreva ou use o ditado do teclado.':(e&&e.error==='no-speech'?'Não ouvi. Toque no microfone e fale de novo, ou escreva.':'Não consegui ouvir. Tente de novo ou escreva.'));};
 r.onend=()=>terminar('');
 limite=setTimeout(()=>pararEscuta(r),12000);
 // o microfone tem 3 s para dar sinal de vida; se não der, o app desiste e passa ao teclado
 let comecou=false;r.onstart=r.onaudiostart=()=>{if(!comecou){comecou=true;esperarSilencio();}};
 const vida=setTimeout(()=>{if(comecou||acabou)return;
  try{localStorage.setItem(CHAVE_FALHOU,'1');}catch(e){}
  try{r.abort();}catch(e){}
  terminar('O microfone do app não respondeu neste celular. Use o microfone do teclado 🎤 e toque em Enviar.');
  try{porId('va-texto').focus();}catch(e){}
 },3000);
 const terminar0=terminar;r._terminar=m=>{clearTimeout(vida);terminar0(m);};
 try{r.start();status('Ouvindo… pode falar.');}
 catch(e){terminar('Não consegui ligar o microfone. Escreva sua pergunta.');return;}
 marcarOuvindo();
}
function pararEscuta(r){
 if(!r)return;
 try{r.stop();}catch(e){}
 // se o celular não confirmar que parou, solta o microfone mesmo assim
 setTimeout(()=>{if(r._terminar&&st.rec===r){try{r.abort();}catch(e){}r._terminar('');}},1500);
}
function marcarOuvindo(){const b=porId('va-falar');if(b){b.classList.toggle('ouvindo',!!st.rec);b.setAttribute('aria-pressed',String(!!st.rec));b.querySelector('span').textContent=st.rec?'Ouvindo… toque para parar':(reconhecimento()?'Toque e fale':'Falar pelo teclado');}}
function enviar(){
 const t=(porId('va-texto').value||'').trim();if(!t)return;
 porId('va-texto').value='';mostrarPergunta(t);status('');
 try{executar(t);}catch(e){responder('Algo deu errado aqui. Tente pelo calendário da Agenda.');}
}

/* ---- tela ---- */
function abrir(){
 if(st.aberto)return;st.aberto=true;st.pend=null;vozGuardada=null;
 const p=porId('va-painel');p.hidden=false;document.body.classList.add('va-aberto');
 porId('va-conversa').replaceChildren();porId('va-texto').value='';
 const nome=String((eu()&&eu().nome)||'').split(' ')[0];
 const h=new Date().getHours(),saud=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
 responder(saud+(nome?', '+nome:'')+'! Como posso te ajudar? Caso tenha alguma dúvida, é só me perguntar.');
 porId('va-ouvir').checked=st.ouvir;atualizar();
 marcarOuvindo();
 status(reconhecimento()?'Toque em “Toque e fale” ou escreva.':'Escreva, ou toque no campo e use o microfone do teclado 🎤.');
}
function fechar(){
 if(!st.aberto)return;st.aberto=false;
 const r=st.rec;st.rec=null;st.ligando=false;if(r){try{r.abort();}catch(e){}if(r._terminar)r._terminar('');}
 calarFala();
 porId('va-painel').hidden=true;document.body.classList.remove('va-aberto');marcarOuvindo();atualizar();
}
function atualizar(){
 const bt=porId('va-atalho');if(!bt)return;
 const app=porId('app'),logado=!!(app&&app.style.display!=='none'&&getComputedStyle(app).display!=='none'&&logadoNoApp());
 const outra=document.querySelector('.overlay.on');
 const esconder=!logado||st.aberto||!!outra;
 if(bt.hidden!==esconder)bt.hidden=esconder;
 if(st.aberto&&!logado)fechar();
}
function iniciarVoz(){
 try{if(w.speechSynthesis){w.speechSynthesis.getVoices();w.speechSynthesis.addEventListener&&w.speechSynthesis.addEventListener('voiceschanged',()=>{vozGuardada=null;});}}catch(e){}
 if(!porId('va-painel'))return;
 porId('va-atalho').onclick=abrir;porId('va-fechar').onclick=fechar;porId('va-falar').onclick=ouvir;porId('va-enviar').onclick=enviar;
 porId('va-texto').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();enviar();}});
 porId('va-ouvir').addEventListener('change',()=>{st.ouvir=porId('va-ouvir').checked;try{localStorage.setItem('jv-va-ouvir',st.ouvir?'1':'0');}catch(e){}if(!st.ouvir)try{w.speechSynthesis.cancel();}catch(e){}});
 porId('va-painel').addEventListener('click',e=>{if(e.target===porId('va-painel'))fechar();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&st.aberto)fechar();});
 document.querySelectorAll('.va-ex').forEach(b=>b.addEventListener('click',()=>{porId('va-texto').value=b.textContent.replace(/[“”"]/g,'');enviar();}));
 /* Só olha o que decide o botão: entrar/sair (#app, #login) e as janelas
   (.overlay). Antes olhava a página inteira a cada mudança de estilo. */
 let ag=false;const ver=()=>{if(ag)return;ag=true;requestAnimationFrame(()=>{ag=false;atualizar();});};
 const mo=new MutationObserver(ver);
 ['app','login'].forEach(id=>{const el=porId(id);if(el)mo.observe(el,{attributes:true,attributeFilter:['style','class']});});
 document.querySelectorAll('.overlay').forEach(el=>mo.observe(el,{attributes:true,attributeFilter:['class']}));
 new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&n.classList&&n.classList.contains('overlay'))))document.querySelectorAll('.overlay').forEach(el=>mo.observe(el,{attributes:true,attributeFilter:['class']}));ver();}).observe(document.body,{childList:true});
 document.addEventListener('click',ver,true);
 atualizar();
}
w.JVVozAluno={abrir,fechar,interpretar,executar,enviar,escolherVoz};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarVoz,{once:true});else iniciarVoz();
})();

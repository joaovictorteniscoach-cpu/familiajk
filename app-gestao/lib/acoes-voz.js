/* Ações por voz da Gestão. Usa os mesmos fluxos e a confirmação de nuvem.
   Áudio e transcrição não são persistidos. Reconhecimento só após toque. */
(function(){
'use strict';
const w=window,$=id=>document.getElementById(id);
const st={aberto:false,ocupado:false,rec:null,epoca:0,intencao:null,aplicado:false,consumidas:new Set(),ultimoFoco:null,resposta:null,falando:false,confirmacao:'',resultadoBase:''};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/-feira\b/g,'').replace(/\s+/g,' ').trim();
const pad=n=>String(n).padStart(2,'0');
function dataBase(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=t=>p.find(x=>x.type===t).value;return v('year')+'-'+v('month')+'-'+v('day');}
function diaValido(y,m,d){const x=new Date(y,m-1,d,12);return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d?y+'-'+pad(m)+'-'+pad(d):'';}
function somarDia(base,n){const d=new Date(base+'T12:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
const NUMS={'vinte e tres':23,'vinte e dois':22,'vinte e um':21,'vinte':20,'dezenove':19,'dezoito':18,'dezessete':17,'dezesseis':16,'quinze':15,'quatorze':14,'catorze':14,'treze':13,'doze':12,'onze':11,'dez':10,'nove':9,'oito':8,'sete':7,'seis':6,'cinco':5,'quatro':4,'tres':3,'duas':2,'dois':2,'uma':1,'um':1,'zero':0,'trinta':30,'quarenta e cinco':45};
const MESES_N=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const DIAS_N=['domingo','segunda','terca','quarta','quinta','sexta','sabado'],DIAS_C=['dom','seg','ter','qua','qui','sex','sáb'];
const brData=dk=>dk.slice(8,10)+'/'+dk.slice(5,7);
const rotDia=dk=>DIAS_C[new Date(dk+'T12:00:00').getDay()]+' '+brData(dk);
const hm=m=>m>=1440?'o fim do dia':pad(Math.floor(m/60))+':'+pad(m%60);
const minH=h=>Number(h.slice(0,2))*60+Number(h.slice(3,5));
const plural=(n,um,varios)=>n+' '+(n===1?um:(varios||um+'s'));
const dkDe=x=>x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate());
const AGIR_IMP=/\b(?:cancelar|cancela|cancele|desmarcar|desmarca|desmarque|agendar|agende|marcar|marca|marque|reservar|reserve|renovar|renova|renove)\b/;
const AGIR=/\b(?:cancelar|cancelou|cancela|cancele|desmarcar|desmarcou|desmarca|agendar|agendou|agende|marcar|marcou|marca|marque|reservar|reserve|renovar|renovou|renova|renove|renovacao)\b/;
function lerData(t,base){
 const y=Number(base.slice(0,4)),m=Number(base.slice(5,7));let data='',exp=false;
 let x=t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
 if(x){data=diaValido(+x[1],+x[2],+x[3]);exp=true;}
 if(!x){x=t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);if(x){data=diaValido(x[3]?+x[3]:y,+x[2],+x[1]);exp=true;}}
 const meses=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
 if(!x){x=t.match(/\b(?:dia )?(\d{1,2}) de ([a-z]+)(?: de (\d{4}))?\b/);if(x&&meses.includes(x[2])){data=diaValido(x[3]?+x[3]:y,meses.indexOf(x[2])+1,+x[1]);exp=true;}}
 if(exp&&!data)return {data:'',erro:'Confira a data: esse dia não existe.'};
 if(!exp){if(/\bdepois de amanha\b/.test(t))data=somarDia(base,2);else if(/\bamanha\b/.test(t))data=somarDia(base,1);else if(/\bhoje\b/.test(t))data=base;
  else if(/\bontem\b/.test(t))data=somarDia(base,-1);else if(/\bagora\b/.test(t))data=base;
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
 const nums=NUMS;
 Object.keys(nums).sort((a,b)=>b.length-a.length).forEach(k=>{s=s.replace(new RegExp('\\b'+k+'\\b','g'),String(nums[k]));});
 const x=s.match(/^(\d{1,2})(?:(?::|h)(\d{2}))?/);if(!x)return {hora:'',erro:'Escolha o horário abaixo.'};
 let h=+x[1],min=x[2]?+x[2]:0;
 if(!x[2]){if(/\be meia\b/.test(s))min=30;else if(/\be (?:1 quarto|15)\b/.test(s))min=15;else{const z=s.match(/^\d{1,2}(?:\s*(?:horas?|h))?\s+e\s+(\d{1,2})\b/);if(z)min=+z[1];}}
 const tarde=/\b(?:tarde|noite)\b/.test(s),manha=/\b(?:manha|madrugada)\b/.test(s);
 if(h>0&&h<12){if(tarde)h+=12;else if(!manha&&!x[2]&&!/^\d+h\b/.test(s))return {hora:'',erro:'Diga manhã/tarde/noite ou escolha o horário; “às três” pode ter dois sentidos.'};}
 if(h>23||min>59)return {hora:'',erro:'Confira o horário.'};
 return {hora:pad(h)+':'+pad(min),erro:''};
}
/* Faixa de horário: "das 16 até o fim da noite", "das 7h às 18h", "a partir
   das 18", "até as 12". Fim exclusivo (das 7 às 18 = 07:00 … 17:00). Datas
   saem antes, para "16/10" não virar hora. Número por extenso só vira hora
   depois de uma preposição de hora ("às quatro"), nunca em "uma aula". */
const H_RE='(\\d{1,2})(?:(?::|h)(\\d{2}))?(\\s*(?:h|horas?)\\b)?(?:\\s+(?:da|de|do)\\s+(manha|tarde|noite|madrugada))?';
function textoHoras(t){
 let s=' '+t+' ';
 s=s.replace(/\b\d{4}-\d{2}-\d{2}\b/g,' ').replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{4})?\b/g,' ')
  .replace(new RegExp('\\b(?:dia )?\\d{1,2} de (?:'+MESES_N.join('|')+')(?: de \\d{4})?\\b','g'),' ').replace(/\bdia \d{1,2}\b/g,' ');
 s=s.replace(/\b(?:o |a )?(?:final|fim) (?:da noite|do dia|do expediente)\b|\b(?:o )?ultimo horario\b/g,'24h').replace(/\b(?:a )?meia noite\b/g,'24h').replace(/\b(?:o )?meio dia\b/g,'12h');
 const pre='(?:as|das|ate as|ate|pelas|a partir das|a partir de|depois das|antes das|desde as|apos as|entre as|entre|e as)';
 Object.keys(NUMS).sort((a,b)=>b.length-a.length).forEach(k=>{s=s.replace(new RegExp('\\b('+pre+')\\s+'+k+'\\b','g'),'$1 '+NUMS[k]);});
 return s.replace(/\s+/g,' ');
}
function horaDe(g){
 let h=+g[0],min=g[1]?+g[1]:0;const per=g[3]||'',h24=!!g[1]||/h/.test(g[2]||'');
 if(h===24&&!min)return {min:1440,per:'',ambigua:false};
 if(h>23||min>59)return null;
 if((per==='tarde'||per==='noite')&&h<12)h+=12;
 return {min:h*60+min,per,ambigua:!per&&!h24&&h>=1&&h<=11};
}
function lerFaixa(t){
 const s=textoHoras(t);
 let m=s.match(new RegExp('\\b(?:das|de|desde as|entre as|entre)\\s+'+H_RE+'\\s+(?:ate as|ate|as|a|e as|e)\\s+'+H_RE));
 if(m){
  const a=horaDe(m.slice(1,5)),b=horaDe(m.slice(5,9));if(!a||!b)return {erro:'Confira o horário.'};
  // o período dito só no fim vale para o começo ("das 4 às 8 da noite")
  if(a.ambigua&&b.per&&b.per!=='manha'&&a.min+720<b.min){a.min+=720;a.ambigua=false;}
  if(a.ambigua&&a.min<=300){a.min+=720;a.ambigua=false;}
  if(b.ambigua&&b.min<=a.min)b.min+=720;
  if(b.min<=a.min)return {erro:'O fim do horário precisa ser depois do começo.'};
  return {ini:a.min,fim:b.min};
 }
 m=s.match(new RegExp('\\b(?:a partir das|a partir de|depois das|desde as|apos as)\\s+'+H_RE));
 if(m){const a=horaDe(m.slice(1,5));if(!a)return {erro:'Confira o horário.'};if(a.ambigua&&a.min<=300)a.min+=720;return {ini:a.min,fim:1440};}
 m=s.match(new RegExp('\\b(?:ate as|antes das|ate)\\s+'+H_RE));
 if(m){const b=horaDe(m.slice(1,5));if(!b)return {erro:'Confira o horário.'};if(b.ambigua&&b.min<=300)b.min+=720;return {ini:0,fim:b.min};}
 return null;
}
/* Um horário só ("às 17", "das 4 da tarde") em qualquer lugar da frase. */
function horaUnica(t){
 const m=textoHoras(t).match(new RegExp('\\b(?:as|das|pelas)\\s+'+H_RE));if(!m)return {hora:'',erro:''};
 const a=horaDe(m.slice(1,5));if(!a||a.min>=1440)return {hora:'',erro:'Confira o horário.'};
 if(a.ambigua&&a.min<=300)a.min+=720;else if(a.ambigua)return {hora:'',erro:'Diga manhã, tarde ou noite: “às '+Math.floor(a.min/60)+'” pode ter dois sentidos.'};
 return {hora:hm(a.min),erro:''};
}
/* Semana, mês ou ano citados na pergunta. */
function periodoLongo(t,base){
 const d=new Date(base+'T12:00:00'),seg=x=>{const y=new Date(x);y.setDate(y.getDate()-((y.getDay()+6)%7));return y;};
 const semana=(n,rot)=>{const s=seg(d);s.setDate(s.getDate()+7*n);const f=new Date(s);f.setDate(f.getDate()+6);return {ini:dkDe(s),fim:dkDe(f),rotulo:rot,tipo:'semana'};};
 const mes=(y,m,rot)=>({ini:dkDe(new Date(y,m,1)),fim:dkDe(new Date(y,m+1,0)),rotulo:rot||'em '+MESES_N[m].replace('marco','março'),tipo:'mes'});
 if(/\b(?:semana que vem|proxima semana)\b/.test(t))return semana(1,'na semana que vem');
 if(/\bsemana passada\b/.test(t))return semana(-1,'na semana passada');
 if(/\bsemana\b/.test(t))return semana(0,'nesta semana');
 if(/\bmes passado\b/.test(t))return mes(d.getFullYear(),d.getMonth()-1);
 if(/\b(?:mes que vem|proximo mes)\b/.test(t))return mes(d.getFullYear(),d.getMonth()+1);
 const mn=MESES_N.findIndex(m=>new RegExp('\\b(?:em|de|no mes de|do mes de|durante) '+m+'\\b').test(t));
 if(mn>=0&&!new RegExp('\\b\\d{1,2} de '+MESES_N[mn]).test(t)){const ya=t.match(/\b(20\d{2})\b/);return mes(ya?+ya[1]:d.getFullYear(),mn);}
 if(/\bmes\b/.test(t))return mes(d.getFullYear(),d.getMonth(),'neste mês');
 if(/\bano passado\b/.test(t)){const y=d.getFullYear()-1;return {ini:y+'-01-01',fim:y+'-12-31',rotulo:'em '+y,tipo:'ano'};}
 if(/\bano\b/.test(t)){const y=d.getFullYear();return {ini:y+'-01-01',fim:y+'-12-31',rotulo:'em '+y,tipo:'ano'};}
 return null;
}
function alunosCitados(t,alunos){
 const tt=' '+t.replace(/[?!.,;:()"“”]/g,' ').replace(/\s+/g,' ').trim()+' ';   // "Ana?" também é Ana
 const contem=n=>{const x=norm(n);return x&&tt.includes(' '+x+' ');};
 const ativos=(alunos||[]).filter(a=>a&&a.nome);
 let c=ativos.filter(a=>contem(a.nome));
 if(!c.length)c=ativos.filter(a=>norm(a.nome).split(' ')[0].length>2&&contem(norm(a.nome).split(' ')[0]));
 return c;
}
/* Perguntas além do dia/período/horário: semana, mês e ano; horários livres;
   aluno (saldo, próxima aula, horário fixo, mensalidade); financeiro;
   ocupação, locações e preços. Só leitura. */
function interpretarPergunta(t,alunos,base){
 if(/\b(?:ajuda|comandos)\b|\bo que (?:voce|vc) (?:faz|sabe|pode)\b|\bcomo (?:te )?us(?:o|ar)\b/.test(t))return {acao:'consultar',consulta:'ajuda'};
 if(AGIR_IMP.test(t))return null;
 if(/\b(?:valor|preco|precos|quanto custa|quanto e|quanto (?:esta|ta) (?:a|o))\b/.test(t)&&/\b(?:aula|avulsa|locacao|personal|dupla|trio|quarteto|grupo|hora|plano)\b/.test(t)&&!alunosCitados(t,alunos).length)return {acao:'consultar',consulta:'precos'};
 const d=new Date(base+'T12:00:00'),mkAtual=base.slice(0,7),mkAnt=dkDe(new Date(d.getFullYear(),d.getMonth()-1,1)).slice(0,7);
 const mk=/\bmes passado\b/.test(t)?mkAnt:mkAtual;
 const cit=alunosCitados(t,alunos);
 const fin=/\b(?:pag(?:ou|aram|ar|o|ou a|amento|amentos)|mensalidades?|devendo|deve|devem|pendentes?|em atraso|atrasad[ao]s?|inadimpl\w*|receb\w*|entrou|entrada|faturamento|fature\w*|caixa|a receber|falta receber)\b/;
 const EXTRATO=/\b(?:aulas?|extrato|historico|frequencia|presenc\w*|faltas?|faltou|feitas?|fez|realizad\w*|dadas?|deu|tev[ae]|agendad\w*|desmarc\w*|cancel\w*|chuva|choveu)\b/;
 if(cit.length&&(fin.test(t)||EXTRATO.test(t)||/\b(?:creditos?|saldo|reposic\w*|repor|proximas?|quando|horario|horarios|que horas|que dia|plano|pacote)\b/.test(t))){
  if(cit.length>1)return {erro:'Encontrei '+cit.length+' alunos com esse nome ('+cit.slice(0,4).map(a=>a.nome).join(', ')+'). Diga o nome e o sobrenome.'};
  const dt=lerData(t,base);if(dt.erro)return {erro:dt.erro};
  const longo=periodoLongo(t,base),r={acao:'consultar',consulta:'aluno',alunoId:cit[0].id,data:dt.data||base,mk};
  if(/\b(?:creditos?|saldo|reposic\w*|repor|restam|sobram)\b/.test(t))r.qual='saldo';
  else if(fin.test(t)&&!/\bfalt(?:a|as|ou|aram)\b/.test(t))r.qual='pagamento';
  else if(/\b(?:horario fixo|horarios fixos|grade|qual horario|qual o horario|dia e horario|que horas (?:e|sao) (?:a|as) aulas?)\b/.test(t))r.qual='horarios';
  else if(/\bproximas\b|\bproximas aulas\b/.test(t))r.qual='proximas';
  else if(/\bproxima\b|\bquando\b|\bque dia\b/.test(t)&&!longo&&!dt.data)r.qual='proxima';
  else if(EXTRATO.test(t)||longo||dt.data){
   r.qual='extrato';
   const p=longo||(dt.data?{ini:dt.data,fim:dt.data,rotulo:quandoTxt(dt.data),tipo:'dia'}:periodoLongo('mes',base));
   Object.assign(r,{ini:p.ini,fim:p.fim,rotulo:p.rotulo,desdeInicio:/\b(?:ja|total|ate hoje|desde|no total)\b/.test(t)&&!longo&&!dt.data});
  }else r.qual='resumo';
  return r;
 }
 if(fin.test(t)&&!/\baulas?\b/.test(t)){
  if(/\b(?:a receber|falta receber|quanto falta)\b/.test(t))return {acao:'consultar',consulta:'financeiro',qual:'areceber',mk};
  if(/\b(?:receb\w*|entrou|entrada|faturamento|fature\w*|caixa)\b/.test(t))return {acao:'consultar',consulta:'financeiro',qual:'recebido',mk};
  return {acao:'consultar',consulta:'financeiro',qual:'pendentes',mk};
 }
 const longoG=periodoLongo(t,base),dtG=lerData(t,base);
 if(dtG.erro&&/\b(?:choveu|chuva|desmarc|cancel|falt|presenc)/.test(t))return {erro:dtG.erro};
 const faixaDias=longoG||{ini:dtG.data||base,fim:dtG.data||base,rotulo:quandoTxt(dtG.data||base),tipo:'dia'};
 if(/\b(?:choveu|chuva|chuvas|choveram|chovendo)\b/.test(t))return Object.assign({acao:'consultar',consulta:'chuvas'},faixaDias);
 if(/\b(?:presenc\w* (?:pendentes?|sem confirmar|a confirmar|para confirmar|por confirmar)|confirmar (?:as )?presenc\w*|sem presenca|nao confirmad\w*|falta(?:m)? confirmar)\b/.test(t))return Object.assign({acao:'consultar',consulta:'presencas'},faixaDias);
 if(/\b(?:desmarc\w*|cancelad[ao]s?|cancelaram|cancelou|cancelamentos?)\b/.test(t))return Object.assign({acao:'consultar',consulta:'desmarcadas'},faixaDias);
 if(/\b(?:faltou|faltaram|faltas)\b/.test(t))return Object.assign({acao:'consultar',consulta:'faltas'},faixaDias);
 if(/\b(?:quem tem reposic\w*|reposic\w* pendentes?|alunos? com reposic\w*|quantas reposic\w*)\b/.test(t))return {acao:'consultar',consulta:'reposicoes'};
 if(/\bquant[oa]s alunos\b|\balunos ativos\b/.test(t))return {acao:'consultar',consulta:'alunos'};
 if(/\bnao\b/.test(t))return null;   // "quem não tem aula": a regra antiga responde que é ambíguo
 if(/\bproxima aula\b|\bproximo aluno\b/.test(t))return {acao:'consultar',consulta:'proxima'};
 if(/\b(?:faltam|restam|ainda tenho|ainda vou ter|falta dar)\b/.test(t)&&/\baulas?\b/.test(t)&&!periodoLongo(t,base)){
  const dt=lerData(t,base);if(dt.erro)return {erro:dt.erro};const data=dt.data||base;
  return {acao:'consultar',consulta:/^quantas?\b/.test(t)?'quantidade':'lista',data,hora:'',periodo:'',faixa:data===base?[agoraMinSP()+1,1440]:[0,1440],agora:data===base};
 }
 const longo=periodoLongo(t,base),fx=lerFaixa(t);
 if(fx&&fx.erro)return {erro:fx.erro};
 const periodo=['manha','tarde','noite'].find(p=>new RegExp('\\b'+p+'\\b').test(t))||'';
 if(/\b(?:livres?|vagas?|disponive(?:l|is)|desocupad[ao]s?|vazios?|encaix\w*)\b/.test(t)){
  if(longo&&longo.tipo!=='semana')return {erro:'Consulte horários livres de um dia ou de uma semana por vez.'};
  const dt=lerData(t,base);if(dt.erro)return {erro:dt.erro};
  return {acao:'consultar',consulta:'livres',data:dt.data||base,semana:longo,faixa:fx?[fx.ini,fx.fim]:null,periodo};
 }
 if(/\bocupacao\b|\btaxa de ocupa/.test(t)){const dt=lerData(t,base);return {acao:'consultar',consulta:'ocupacao',data:dt.data||base,longo:longo||null};}
 if(/\blocac(?:ao|oes)\b|\balugu(?:el|eis)\b/.test(t)&&!/\baulas?\b/.test(t)){const dt=lerData(t,base);if(dt.erro)return {erro:dt.erro};return {acao:'consultar',consulta:'locacoes',data:dt.data||base,longo};}
 if(longo&&/\b(?:aulas?|agenda|alunos?|dei|tive|tenho|teremos|vou ter|foram)\b/.test(t))return {acao:'consultar',consulta:'periodo',ini:longo.ini,fim:longo.fim,rotulo:longo.rotulo,tipo:longo.tipo,lista:/^(?:quem|quais|qual)\b/.test(t)};
 return null;
}
/* Ações que não dependem de aluno: mudar o funcionamento (aula, só locação,
   fechado) numa data ou toda semana, e marcar chuva. Sempre com prévia. */
function interpretarAcaoEspecial(t,base){
 if(/^(?:abr[aei]r?|abre|mostr[ae]r?|ve[jr]a?|ir para|vai para|leve para)\s+(?:a\s+|minha\s+)?agenda\b/.test(t)&&!/\b(?:locac\w*|para aula|fech\w*|liber\w*|bloque\w*)\b/.test(t)){
  const dt=lerData(t,base);return {acao:'navegar',data:dt.data||base};
 }
 const fechar=/\b(?:fech(?:e|ar|a)|bloque(?:ie|ar|ia)|tranc(?:ar|a|ue))\b/.test(t)&&!/\bfechamento\b|\bfechar o mes\b/.test(t);
 const abrir=/\b(?:abr(?:a|ir|e)|liber(?:e|ar|a)|deix(?:e|ar|a)|coloque|colocar|mud(?:e|ar|a)|transform(?:e|ar|a))\b/.test(t);
 const alvo=/\b(?:horarios?|quadra|grade|funcionamento|expediente)\b/.test(t)||/\bpara (?:aulas?|locac)/.test(t)||/\bso (?:para )?locac/.test(t);
 const temQuando=!!lerFaixa(t)||!!lerData(t,base).data||/\b(?:manha|tarde|noite)\b/.test(t);
 if(abrir&&alvo||fechar&&(alvo||temQuando)&&!/\b(?:aluno|aula de|aula do|aula da)\b/.test(t)){
  if(/\b(?:nao|corrigindo|desculpa)\b/.test(t))return {erro:'Reformule um pedido afirmativo por vez. Nada foi alterado.'};
  if(AGIR.test(t))return {erro:'Peça uma ação por vez. Nada foi alterado.'};
  const modo=fechar?'fechado':/\b(?:locac\w*|alug\w*)\b/.test(t)?'loc':'aula';
  const plurais=['domingos','segundas','tercas','quartas','quintas','sextas','sabados'];
  let dias=DIAS_N.map((n,i)=>new RegExp('\\b'+n+'s?\\b').test(t)?i:-1).filter(i=>i>=0);
  if(/\b(?:dias de semana|dias uteis|segunda a sexta)\b/.test(t))dias=[1,2,3,4,5];
  if(/\bfi(?:m|ns) de semana\b/.test(t))dias=[6,0];
  const semanal=/\b(?:tod[oa]s?|aos|nos|nas|sempre|toda semana|semanal\w*|padrao)\b/.test(t)&&dias.length>0||plurais.some(p=>new RegExp('\\b'+p+'\\b').test(t))||dias.length>1;
  const fx=lerFaixa(t);if(fx&&fx.erro)return {erro:fx.erro};
  let ini=0,fim=1440;const periodo=['manha','tarde','noite'].find(p=>new RegExp('\\b'+p+'\\b').test(t));
  if(fx){ini=fx.ini;fim=fx.fim;}
  else if(periodo&&!/\b\d{1,2}(?::\d{2}|h|\s+horas?)/.test(t)){ini={manha:0,tarde:720,noite:1080}[periodo];fim={manha:720,tarde:1080,noite:1440}[periodo];}
  else{const h=horaUnica(t);if(h.erro)return {erro:h.erro};if(h.hora){ini=minH(h.hora);fim=ini+60;}}
  const horas=HORAS_GRADE.filter(h=>minH(h)>=ini&&minH(h)<fim);
  if(!horas.length)return {erro:'Não encontrei horários da grade nesse intervalo.'};
  if(semanal)return {acao:'horarios',especial:true,modo,escopo:'semana',dias,data:'',horas,ini,fim};
  const dt=lerData(t,base);if(dt.erro)return {erro:dt.erro};
  if(!dt.data)return {erro:'Diga o dia: por exemplo “domingo”, “dia 12” ou “todo domingo”.'};
  return {acao:'horarios',especial:true,modo,escopo:'data',dias:[new Date(dt.data+'T12:00:00').getDay()],data:dt.data,horas,ini,fim};
 }
 // marcar chuva precisa de pedido claro; "choveu ontem" (falado, sem "?") é pergunta
 const pedeChuva=/\b(?:marc\w*|lanc\w*|registr\w*|cancel\w*|derrub\w*|coloc\w*|bot\w*)\b/.test(t)||/^(?:chuva|esta chovendo|ta chovendo)\b/.test(t);
 if(/\b(?:chuva|choveu|chovendo|chove)\b/.test(t)&&pedeChuva&&!/\?/.test(t)&&!/^(?:vai|sera|tem previsao|previsao|quando|teve|houve)\b/.test(t)){
  if(/\b(?:nao|corrigindo|desculpa)\b/.test(t))return {erro:'Reformule um pedido afirmativo por vez. Nada foi alterado.'};
  const dt=lerData(t,base);if(dt.erro)return {erro:dt.erro};const data=dt.data||base;
  const fx=lerFaixa(t);if(fx&&fx.erro)return {erro:fx.erro};
  let ini=0,fim=1440;
  if(fx){ini=fx.ini;fim=fx.fim;}
  else{const periodo=['manha','tarde','noite'].find(p=>new RegExp('\\b'+p+'\\b').test(t));
   if(periodo){ini={manha:0,tarde:720,noite:1080}[periodo];fim={manha:720,tarde:1080,noite:1440}[periodo];}
   else{const h=horaUnica(t);if(h.erro)return {erro:h.erro};if(h.hora){ini=minH(h.hora);fim=ini+60;}}}
  return {acao:'chuva',especial:true,data,ini,fim,horas:HORAS.filter(h=>minH(h)>=ini&&minH(h)<fim)};
 }
 return null;
}
/* Consultas delimitadas: só leem a agenda; nunca viram intenção de alteração. */
function interpretarConsulta(t,base){
 if(!/^(?:quantas?|quem|quais?|qual|consultar|mostr[ae]|me mostr[ae]|como esta|tenho|tem|terei|vou ter|ha|existe|minha agenda|agenda|aulas?)\b/.test(t)||!/\b(?:aulas?|alunos?|agenda|horarios?)\b/.test(t))return null;
 if(/\b(?:cancelar|cancelou|cancela|cancele|desmarcar|desmarca|agendar|agende|marcar|marca|marque|reservar|reserva|renovar|renova|renove|renovacao)\b/.test(t))return {erro:'Faça uma consulta ou uma alteração por vez. Nada foi alterado.'};
 if(/\b(?:semana|mes|ano|passad[ao]|faltam|restam|proxim[ao] aula)\b/.test(t))return {erro:'Consulte um dia por vez: por exemplo, “Quantas aulas tenho hoje?” ou “Quem tem aula amanhã à tarde?”.'};
 const fx=lerFaixa(t);if(fx&&fx.erro)return {erro:fx.erro};
 const periodos=fx?[]:['manha','tarde','noite'].filter(p=>new RegExp('\\b'+p+'\\b').test(t));
 if(periodos.length>1||/\bou\b/.test(t))return {erro:'Consulte um dia, período ou horário por vez.'};
 if(/\b(?:valor|preco|mensalidade|pag[ao]|pagou|cancelad[ao]s?|confirmad[ao]s?|realizad[ao]s?)\b/.test(t))return {erro:'Posso consultar as aulas agendadas por dia, período ou horário. Por exemplo: “Quem tem aula hoje à tarde?”.'};
 const datas=t.match(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{4})?\b|\b\d{1,2} de [a-z]+(?: de \d{4})?\b/g)||[];
 if(datas.length>1)return {erro:'Diga apenas uma data para consultar.'};
 const dias=t.match(/\b(?:depois de amanha|amanha|hoje|domingo|segunda|terca|quarta|quinta|sexta|sabado)\b/g)||[];
 if(dias.length>1)return {erro:'Diga apenas um dia para consultar.'};
 const d=lerData(t,base);
 if(d.erro)return {erro:d.erro};
 if(!d.data&&/\bdia \d|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}/.test(t))return {erro:'Confira a data da consulta.'};
 if(fx)return {acao:'consultar',consulta:/^quantas?\b/.test(t)?'quantidade':'lista',data:d.data||base,hora:'',periodo:'',faixa:[fx.ini,fx.fim]};
 const horaTexto=t.replace(/\b(?:das|dos|no horario de|do horario de|no horario das|do horario das)\s+/g,'as ');
 let h=lerHora(horaTexto);
 if(!h.hora&&!h.erro){const x=t.match(/\b(\d{1,2})\s+horas?\b/);if(x)h=lerHora('as '+x[0]+(periodos[0]?' da '+periodos[0]:''));}
 if(h.erro)return {erro:h.erro};
 const temHora=/\b(?:as|das|pelas|horario de|horario das)\b/.test(t)||/\b\d{1,2}(?::\d{2}|h|\s+horas?)\b/.test(t);
 if(temHora&&!h.hora)return {erro:'Diga o horário completo, por exemplo “às 16 horas” ou “às quatro da tarde”.'};
 return {acao:'consultar',consulta:h.hora?'horario':/^quantas?\b/.test(t)?'quantidade':'lista',data:d.data||base,hora:h.hora,periodo:h.hora?'':periodos[0]||''};
}
function interpretar(texto,alunos,base){
 const t=norm(String(texto).slice(0,500)),acoes=[];
 const especial=interpretarAcaoEspecial(t,base);if(especial)return especial;
 const pergunta=interpretarPergunta(t,alunos,base);if(pergunta)return pergunta;
 if(/\b(?:nao|corrigindo|melhor|desculpa)\b|\bquer dizer\b/.test(t))return {erro:'Reformule um pedido afirmativo por vez. Nada foi alterado.'};
 const consulta=interpretarConsulta(t,base);if(consulta)return consulta;
 if(/\b(?:cancelar|cancelou|cancela|cancele|desmarcar|desmarcou|desmarca)\b/.test(t))acoes.push('cancelar');
 if(/\b(?:agendar|agendou|agenda|agende|marcar|marcou|marca|marque|reservar|reserva|reserve)\b/.test(t))acoes.push('agendar');
 if(/\b(?:renovar|renovou|renova|renove|renovacao)\b/.test(t))acoes.push('renovar');
 if(acoes.length!==1)return {erro:acoes.length?'Peça uma ação por vez. Nada foi alterado.':'Não entendi esse pedido. '+AJUDA_CURTA};
 const contem=n=>{const x=norm(n);return x&&(' '+t+' ').includes(' '+x+' ');};
 let candidatos=(alunos||[]).filter(a=>contem(a.nome));
 if(!candidatos.length)candidatos=(alunos||[]).filter(a=>contem(norm(a.nome).split(' ')[0]));
 const d=lerData(t,base),h=lerHora(t);let tipo='';
 if(/\b(?:quadrupla|quarteto)\b/.test(t))tipo='grupo4';else if(/\btrio\b/.test(t))tipo='grupo3';else if(/\bdupla\b/.test(t))tipo='grupo2';
 else if(/\bparticular\b/.test(t))tipo='aula';else if(/\bpersonal\b/.test(t))tipo='personal';else if(/\blocacao\b/.test(t))tipo='locacao';else if(/\btorneio\b/.test(t))tipo='torneio';
 return {acao:acoes[0],candidatos:candidatos.map(a=>a.id),data:d.data,hora:h.hora,tipo,repo:/\breposicao\b/.test(t),aviso:d.erro||h.erro};
}
const AJUDA_CURTA='Posso responder sobre aulas (dia, horário, semana, mês ou ano), horários livres, extrato e próximas aulas de cada aluno, créditos, reposições, mensalidade, faltas, aulas desmarcadas, dias de chuva, presenças por confirmar, quem está devendo, quanto você recebeu, ocupação e locações. E, com sua confirmação, agendar, cancelar, renovar pacote, abrir ou fechar horários e marcar chuva.';
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
/* Conversa: o que você pediu e o que o assistente respondeu ou fez. Fica só
   na tela (nada é guardado) e some ao fechar. A resposta atual (consulta ou
   resultado) é um bloco "vivo" no fim; ao pedir outra coisa ela vira histórico. */
function msg(quem,texto,linhas){
 const box=$('voz-conversa');if(!box||!texto)return null;
 const d=document.createElement('div');d.className='jv-voz-msg '+quem;
 const p=document.createElement('p');p.textContent=texto;d.append(p);
 if(linhas&&linhas.length){const ul=document.createElement('ul');linhas.forEach(l=>{const li=document.createElement('li');li.textContent=l;ul.append(li);});d.append(ul);}
 box.insertBefore(d,box.querySelector('.jv-voz-vivo'));
 const todas=box.querySelectorAll('.jv-voz-msg');if(todas.length>40)todas[0].remove();
 rolarConversa();return d;
}
/* Resposta curta: mostra o fim. Resposta longa (extrato): mostra a pergunta e
   o começo da resposta, para o resumo não ficar escondido em cima. */
function rolarConversa(){
 const box=$('voz-conversa');if(!box)return;
 const voces=box.querySelectorAll('.jv-voz-msg.voce'),ult=voces[voces.length-1];
 if(ult&&box.scrollHeight-ult.offsetTop>box.clientHeight)box.scrollTop=Math.max(0,ult.offsetTop-6);
 else box.scrollTop=box.scrollHeight;
}
function arquivarVivos(){
 const c=$('voz-consulta'),r=$('voz-resultado');
 if(r&&!r.hidden&&r.textContent)msg('assistente',r.textContent);
 if(c&&!c.hidden&&$('voz-consulta-resumo').textContent){
  const linhas=[...$('voz-consulta-lista').children].map(li=>[...li.children].map(x=>x.textContent).filter(Boolean).join(' · '));
  msg('assistente',$('voz-consulta-resumo').textContent,linhas);
 }
 if(r){r.hidden=true;r.textContent='';}
}
function limparConversa(){const box=$('voz-conversa');if(box)box.querySelectorAll('.jv-voz-msg,.jv-voz-sugestoes').forEach(x=>x.remove());}
function saudacao(){
 const box=$('voz-conversa');if(!box)return;
 msg('assistente','Oi, João! Pergunte sobre aulas, horários livres, alunos ou financeiro, ou peça para agendar, cancelar, renovar, abrir ou fechar horários e marcar chuva. Toda alteração espera sua confirmação.');
 const sug=document.createElement('div');sug.className='jv-voz-sugestoes';
 [['Aulas de hoje','Quantas aulas tenho hoje?'],['Livres amanhã','Quais horários livres amanhã?'],['Quem está devendo','Quem está devendo este mês?'],['O que você faz?','Ajuda']].forEach(([rot,texto])=>{
  const b=document.createElement('button');b.type='button';b.textContent=rot;
  b.onclick=()=>{if(st.ocupado||st.aplicado)return;$('voz-texto').value=texto;analisar();};sug.append(b);});
 box.insertBefore(sug,box.querySelector('.jv-voz-vivo'));
}
function avisar(m){status(m);msg('assistente',m);}
function mostrarCampos(sim){$('voz-campos').hidden=!sim;const m=$('voz-manual');if(m)m.hidden=sim;}
function pararResposta(){st.resposta=null;st.falando=false;try{if(w.speechSynthesis)w.speechSynthesis.cancel();}catch(e){}if($('voz-falar'))atualizarMic();}
function ouvirResposta(texto,manual){
 if(!st.aberto||!texto||(!manual&&!$('voz-ouvir').checked)||!w.speechSynthesis||!w.SpeechSynthesisUtterance)return;
 parar();pararResposta();
 try{
  const u=new w.SpeechSynthesisUtterance(texto);u.lang='pt-BR';st.resposta=u;
  u.onstart=()=>{if(st.resposta===u&&st.aberto){st.falando=true;atualizarMic();}};
  const fim=()=>{if(st.resposta===u){st.resposta=null;st.falando=false;atualizarMic();}};
  u.onend=fim;u.onerror=fim;w.speechSynthesis.speak(u);
 }catch(e){st.resposta=null;st.falando=false;atualizarMic();}
}
function resultadoSalvo(){
 $('voz-repetir').textContent='Ouvir confirmação';
 st.confirmacao=(st.resultadoBase?st.resultadoBase+'. ':'')+'Confirmado e salvo na nuvem.';
 status(st.confirmacao);$('voz-resultado').textContent=st.confirmacao;$('voz-resultado').hidden=false;$('voz-repetir').hidden=false;$('voz-repetir').disabled=!w.speechSynthesis||!w.SpeechSynthesisUtterance;
 st.aplicado=false;rolarConversa();ouvirResposta(st.confirmacao);
}
function repetir(){if(st.confirmacao)ouvirResposta(st.confirmacao,true);}
function ocupado(sim){st.ocupado=sim;document.querySelectorAll('#voz-painel input:not(#voz-ouvir),#voz-painel select,#voz-painel textarea,#voz-analisar,#voz-conferir,#voz-falar,#voz-confirmar').forEach(e=>{e.disabled=sim||st.aplicado;});$('voz-confirmar').disabled=sim||!st.intencao||st.aplicado;$('voz-salvar').disabled=sim;atualizarMic();}
function invalidar(){if(st.ocupado||st.aplicado)return;arquivarVivos();st.intencao=null;st.consulta=false;st.confirmacao='';$('voz-confirmar').disabled=true;$('voz-confirmar').hidden=true;$('voz-previa').hidden=true;$('voz-consulta').hidden=true;$('voz-consulta-lista').replaceChildren();$('voz-consulta-resumo').textContent='';$('voz-consulta-nota').textContent='';$('voz-repetir').hidden=true;}
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
async function conferirDadosConsulta(){
 pronto();const marco={},s=await comPrazo(v2ref('').get(),PRAZO_NUVEM,marco);
 if(s===marco||!s||!s.exists())throw Error('Não consegui conferir a agenda atualizada. Tente de novo quando a conexão voltar.');
 const no=s.val();bancoDasPartes(no);
 if(!_basePartesLida||canonDados(no)!==canonDados(_basePartes))throw Error('A agenda mudou em outra sessão. Confira a nuvem em Segurança e dados antes de consultar.');
 pronto();
}
function nomeEntrada(e){const a=e.alunoId&&DB.alunos.find(x=>x.id===e.alunoId);return String(a&&a.nome||e.titulo||'Aluno sem nome');}
function resumoConsulta(q){
 const d=new Date(q.data+'T12:00:00'),dia=d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
 const periodo=q.periodo,faixa=q.faixa||(periodo==='manha'?[0,720]:periodo==='tarde'?[720,1080]:periodo==='noite'?[1080,1440]:[0,1440]);
 const r=comIndiceAgenda(()=>aulasDoDia(d));
 const min=q.hora?Number(q.hora.slice(0,2))*60+Number(q.hora.slice(3)):null;
 const aulas=r.aulas.filter(a=>q.hora?min>=a.min&&min<a.min+60:a.min>=faixa[0]&&a.min<faixa[1]).sort((a,b)=>a.min-b.min);
 const onde='na sua agenda de '+dia+(q.agora?' · a partir de agora':q.faixa?' · das '+hm(q.faixa[0])+(q.faixa[1]>=1440?' até o fim do dia':' às '+hm(q.faixa[1])):periodo?' · '+({manha:'manhã (antes das 12h)',tarde:'tarde (12h às 18h)',noite:'noite (a partir das 18h)'})[periodo]:'');
 const linhas=aulas.map(a=>({hora:a.hora,nomes:a.entradas.map(nomeEntrada).join(', '),tipo:a.cat==='personal'?'Personal':a.entradas.some(e=>e.tipo==='grupo')?'Aula em grupo':'Aula particular'}));
 let resumo,nota='Consulta da sua agenda'+(q.faixa||periodo?' nesse trecho do dia':'')+'. Dupla, trio ou quarteto contam como uma aula.';
 if(q.hora){
  const evs=entriesFor(d,q.hora);
  if(evs.some(e=>e.tipo==='bloqueio'))return {resumo:'Às '+q.hora+', o horário está bloqueado '+onde+'.',linhas:[],nota:'Consulta da sua agenda.'};
  if(linhas.length)resumo='Às '+q.hora+', '+linhas.map(a=>a.tipo.toLowerCase()+' com '+a.nomes+(a.hora!==q.hora?' (início às '+a.hora+')':'')).join('; ')+' '+onde+'.';
  else{
   const outros=evs.filter(e=>['locacao','torneio','pessoal'].includes(e.tipo));
   resumo=outros.length?'Às '+q.hora+', consta '+outros.map(e=>({locacao:'locação',torneio:'torneio',pessoal:'compromisso pessoal'})[e.tipo]+': '+nomeEntrada(e)).join('; ')+' '+onde+'.':'Não encontrei aula nem outra marcação às '+q.hora+' '+onde+'.';
   nota='Consulta da sua agenda. A ausência de marcação aqui não confirma disponibilidade da quadra.';
  }
 }else{
  resumo=aulas.length?'Você tem '+aulas.length+' aula'+(aulas.length===1?'':'s')+' agendada'+(aulas.length===1?'':'s')+' '+onde+'.':'Não encontrei aulas agendadas '+onde+'.';
  if(aulas.length&&q.data===dataBase()){const agora=agoraMinSP(),ja=aulas.filter(a=>a.min+60<=agora).length;if(ja)resumo+=' '+plural(ja,'já foi dada','já foram dadas')+(aulas.length-ja?' e '+plural(aulas.length-ja,'ainda vai acontecer','ainda vão acontecer'):'')+'.';}
 }
 const fala=resumo+(q.consulta==='lista'&&linhas.length?' '+linhas.map(a=>'Às '+a.hora+', '+a.tipo.toLowerCase()+' com '+a.nomes+'.').join(' '):'');
 return {titulo:'Sua agenda',resumo,linhas,nota,fala};
}
/* ===== Respostas além do dia: todas só leem ===== */
function agoraMinSP(){const p=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const v=t=>Number(p.find(x=>x.type===t).value);return v('hour')*60+v('minute');}
const valorRs=v=>hideVals?'(valor oculto)':fmtRs(v);
const tipoAula=a=>a.cat==='personal'?'Personal':a.entradas.some(e=>e.tipo==='grupo')?'Aula em grupo':'Aula particular';
const DIAS_L=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
function quandoTxt(dk){const hoje=dataBase();if(dk===hoje)return 'hoje';if(dk===somarDia(hoje,1))return 'amanhã';if(dk===somarDia(hoje,-1))return 'ontem';return new Date(dk+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long'})+', '+brData(dk);}
function segundaDe(dk){const d=new Date(dk+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return dkDe(d);}
/* Percorre os dias com o índice da agenda (rápido no ano inteiro) e sem
   inventar aula antes do primeiro registro do app, igual ao Início. */
function percorrerDias(ini,fim,fn){comIndiceAgenda(()=>{const d=new Date(ini+'T12:00:00'),f=new Date(fim+'T12:00:00'),lim=_IDX_AG&&_IDX_AG.ini;while(d<=f){const dk=dkDe(d);if(!lim||dk>=lim)fn(new Date(d),dk);d.setDate(d.getDate()+1);}});}
function resumoPeriodo(q){
 const hoje=dataBase(),agora=agoraMinSP();let tenis=0,pers=0,dadas=0,futuras=0;const grupos=new Map();
 const chave=dk=>q.tipo==='semana'?rotDia(dk):q.tipo==='ano'?MESES[Number(dk.slice(5,7))-1]:'semana de '+brData(segundaDe(dk));
 percorrerDias(q.ini,q.fim,(d,dk)=>aulasDoDia(d).aulas.forEach(a=>{
  if(a.cat==='personal')pers++;else tenis++;
  if(dk<hoje||dk===hoje&&a.min+60<=agora)dadas++;else futuras++;
  const k=chave(dk);grupos.set(k,(grupos.get(k)||0)+1);
 }));
 const tot=tenis+pers,intervalo=brData(q.ini)+' a '+brData(q.fim)+(q.tipo==='ano'?'/'+q.ini.slice(0,4):'');
 let resumo=tot?(futuras?'Você tem ':'Você deu ')+plural(tot,'aula')+' '+q.rotulo+' ('+intervalo+'): '+pers+' de personal e '+tenis+' de tênis.':'Não encontrei aulas '+q.rotulo+' ('+intervalo+').';
 if(dadas&&futuras)resumo+=' '+plural(dadas,'já foi dada','já foram dadas')+' e '+plural(futuras,'ainda vai acontecer','ainda vão acontecer')+'.';
 const linhas=[...grupos].map(([k,n])=>({hora:k,nomes:plural(n,'aula'),tipo:''}));
 return {titulo:'Aulas '+q.rotulo,resumo,linhas,nota:'Mesma conta do Início: dupla, trio ou quarteto é uma aula, e marcação repetida conta uma vez.',fala:resumo};
}
function livresDoDia(d,dk,faixa,hoje,agora){
 const inicios=aulasDoDia(d).aulas.map(a=>a.min),aula=[],loc=[];
 HORAS_GRADE.forEach(h=>{
  const m=minH(h);if(m<faixa[0]||m>=faixa[1]||dk===hoje&&m<=agora)return;
  const modo=slotModo(d,h);if(modo==='fechado')return;
  if(entriesFor(d,h).length||outroNaTela(d,h)||inicios.some(x=>Math.abs(x-m)<60))return;
  (modo==='aula'?aula:loc).push(h);
 });
 return {aula,loc};
}
function resumoLivres(q){
 const hoje=dataBase(),agora=agoraMinSP(),faixa=q.faixa||(q.periodo?{manha:[0,720],tarde:[720,1080],noite:[1080,1440]}[q.periodo]:[0,1440]);
 const trecho=q.faixa?' das '+hm(faixa[0])+(faixa[1]>=1440?' até o fim do dia':' às '+hm(faixa[1])):q.periodo?' ('+({manha:'manhã',tarde:'tarde',noite:'noite'})[q.periodo]+')':'';
 const nota='Livre = horário aberto na sua grade, sem nada marcado na sua agenda nem na de outro professor.';
 if(q.semana){
  const linhas=[];let n=0;
  comIndiceAgenda(()=>{const d=new Date(q.semana.ini+'T12:00:00'),f=new Date(q.semana.fim+'T12:00:00');
   while(d<=f){const dk=dkDe(d);if(dk>=hoje){const r=livresDoDia(new Date(d),dk,faixa,hoje,agora);if(r.aula.length){linhas.push({hora:rotDia(dk),nomes:r.aula.join(', '),tipo:''});n+=r.aula.length;}}d.setDate(d.getDate()+1);}});
  const resumo=n?plural(n,'horário livre','horários livres')+' para aula '+q.semana.rotulo+trecho+'.':'Não há horário livre para aula '+q.semana.rotulo+trecho+'.';
  return {titulo:'Horários livres',resumo,linhas,nota,fala:resumo+(linhas.length?' '+linhas.map(l=>l.hora+': '+l.nomes).join('. ')+'.':'')};
 }
 const d=new Date(q.data+'T12:00:00'),r=comIndiceAgenda(()=>livresDoDia(d,q.data,faixa,hoje,agora));
 const resumo=(r.aula.length?'Horários livres para aula '+quandoTxt(q.data)+trecho+': '+r.aula.join(', ')+'.':'Não há horário livre para aula '+quandoTxt(q.data)+trecho+'.')+(r.loc.length?' Livres só para locação: '+r.loc.join(', ')+'.':'');
 return {titulo:'Horários livres',resumo,linhas:[],nota,fala:resumo};
}
function resumoAluno(q){
 const a=DB.alunos.find(x=>x.id===q.alunoId);if(!a)throw Error('Não encontrei esse aluno no cadastro.');
 const nome=String(a.nome||'Aluno'),hoje=dataBase(),agora=agoraMinSP();
 const qtd=(n,um,varios)=>fmtCred(n)+' '+(Number(n)===1?um:varios);
 const saldo=()=>{const c=Number(a.creditos)||0,g=Number(a.credGrupo)||0,r=reposValidas(a),partes=[];
  if(ehMisto(a)&&!unificado(a)){partes.push(qtd(c,'crédito','créditos')+' de aula particular');partes.push(qtd(g,'crédito','créditos')+' de grupo');}
  else partes.push(qtd(c,'crédito','créditos'));
  partes.push(qtd(r,'reposição válida','reposições válidas'));
  return nome+' tem '+partes.join(', ')+'.'+(c<0||g<0?' Saldo negativo: aula feita além do pacote.':'');};
 const proxima=()=>{let achou=null;comIndiceAgenda(()=>{for(let i=0;i<=60&&!achou;i++){const dk=somarDia(hoje,i);
   for(const au of aulasDoDia(new Date(dk+'T12:00:00')).aulas){if(dk===hoje&&au.min<=agora)continue;if(au.entradas.some(e=>e.alunoId===a.id)){achou={dk,hora:au.hora,tipo:tipoAula(au)};break;}}}});
  return achou?'A próxima aula de '+nome+' é '+quandoTxt(achou.dk)+' às '+achou.hora+' ('+achou.tipo.toLowerCase()+').':'Não encontrei aula de '+nome+' nos próximos 60 dias.';};
 const horarios=()=>{const fx=((DB.agenda||{}).fixos||[]).filter(f=>f.alunoId===a.id&&(!f.ate||f.ate>=hoje)).sort((x,y)=>((x.dia+6)%7)-((y.dia+6)%7)||String(x.hora).localeCompare(String(y.hora)));
  return fx.length?nome+' tem horário fixo: '+fx.map(f=>DIAS_L[f.dia]+' às '+f.hora+(f.desde&&f.desde>hoje?' (a partir de '+brData(f.desde)+')':'')).join(', ')+'.':nome+' não tem horário fixo na agenda.';};
 const pagamento=()=>{const sm=situacaoMensalidade(a,q.mk),mes=MESES[Number(q.mk.slice(5,7))-1].toLowerCase();
  if(sm.status==='pago')return 'A mensalidade de '+mes+' de '+nome+' está paga.';
  return 'A mensalidade de '+mes+' de '+nome+' está '+(sm.status==='parcial'?'paga em parte':'pendente')+(hideVals?'':': falta '+fmtRs(sm.falta))+'.';};
 const dia=()=>{const au=comIndiceAgenda(()=>aulasDoDia(new Date(q.data+'T12:00:00'))).aulas.filter(x=>x.entradas.some(e=>e.alunoId===a.id));
  return au.length?nome+' tem '+plural(au.length,'aula')+' '+quandoTxt(q.data)+': '+au.map(x=>x.hora+' ('+tipoAula(x).toLowerCase()+')').join(', ')+'.':nome+' não tem aula '+quandoTxt(q.data)+'.';};
 if(q.qual==='extrato')return resumoExtrato(a,q);
 if(q.qual==='proximas'){const l=proximasAluno(a,10);const resumo=l.length?'Próximas aulas de '+nome+': '+plural(l.length,'aula')+' nos próximos 60 dias; a primeira é '+quandoTxt(l[0].dk)+' às '+l[0].hora+'.':'Não encontrei aula de '+nome+' nos próximos 60 dias.';
  return {titulo:'Próximas aulas de '+nome,resumo,linhas:l.map(x=>({hora:rotDia(x.dk)+' '+x.hora,nomes:x.tipo,tipo:''})),nota:'Pela agenda (fixos, avulsas e reposições).',fala:resumo};}
 const resumo=({saldo,proxima,horarios,pagamento,dia})[q.qual]?({saldo,proxima,horarios,pagamento,dia})[q.qual]():saldo()+' '+proxima();
 return {titulo:nome,resumo,linhas:[],nota:hideVals&&q.qual==='pagamento'?'Valor oculto: toque no olho do Início para mostrar os valores.':'Consulta do cadastro e da agenda; nada foi alterado.',fala:resumo};
}
function resumoFinanceiro(q){
 const mk=q.mk,mes=MESES[Number(mk.slice(5,7))-1].toLowerCase();
 const pend=(DB.alunos||[]).filter(a=>{try{return pendenteDoFechamento(a,mk);}catch(e){return false;}}).sort((x,y)=>String(x.nome).localeCompare(String(y.nome)));
 const falta=pend.reduce((s,a)=>s+(Number(saldoMensalidade(a,mk))||0),0);
 const lanc=(DB.lancamentos||[]).filter(l=>l.mes===mk&&Number(l.valor)>0),rec=lanc.reduce((s,l)=>s+Number(l.valor||0),0);
 let resumo,linhas=[];
 if(q.qual==='recebido')resumo='Em '+mes+' você recebeu '+valorRs(rec)+' ('+plural(lanc.length,'lançamento')+').'+(pend.length?' Ainda '+(pend.length===1?'falta 1 mensalidade':'faltam '+pend.length+' mensalidades')+(hideVals?'.':', '+fmtRs(falta)+'.'):' Todas as mensalidades estão em dia.');
 else if(q.qual==='areceber')resumo=pend.length?'Falta receber '+valorRs(falta)+' de '+plural(pend.length,'aluno')+' em '+mes+'.':'Não há mensalidade pendente em '+mes+'.';
 else{resumo=pend.length?plural(pend.length,'aluno','alunos')+' com mensalidade pendente em '+mes+(hideVals?'':' (total '+fmtRs(falta)+')')+'.':'Todos os alunos estão com a mensalidade de '+mes+' em dia.';
  linhas=pend.map(a=>({hora:'•',nomes:String(a.nome),tipo:hideVals?'':fmtRs(saldoMensalidade(a,mk))}));}
 return {titulo:'Financeiro de '+mes,resumo,linhas,nota:hideVals?'Valores ocultos: toque no olho do Início para mostrar e ouvir os valores.':'Pelas mensalidades e lançamentos do mês; nada foi alterado.',fala:resumo+(linhas.length&&linhas.length<=8?' '+linhas.map(l=>l.nomes).join(', ')+'.':'')};
}
function resumoProxima(){
 const hoje=dataBase(),agora=agoraMinSP();let achou=null;
 comIndiceAgenda(()=>{for(let i=0;i<=30&&!achou;i++){const dk=somarDia(hoje,i);for(const au of aulasDoDia(new Date(dk+'T12:00:00')).aulas){if(dk===hoje&&au.min<=agora)continue;achou={dk,au};break;}}});
 const resumo=achou?'Sua próxima aula é '+quandoTxt(achou.dk)+' às '+achou.au.hora+': '+achou.au.entradas.map(nomeEntrada).join(', ')+' ('+tipoAula(achou.au).toLowerCase()+').':'Não encontrei aula nos próximos 30 dias.';
 return {titulo:'Próxima aula',resumo,linhas:[],nota:'Consulta da sua agenda.',fala:resumo};
}
function chuvaEm(dk,hora){return ((DB.agenda||{}).eventos||[]).some(e=>e.data===dk&&e.hora===hora&&e.tipo==='bloqueio'&&(e.motivo==='chuva'||/chuva/i.test(String(e.titulo||''))));}
const ST_TXT={confirmada:'✓ presença confirmada',sem:'dada · presença não confirmada',falta:'✗ faltou',avisou:'🔁 avisou que não vinha',agendada:'agendada',desmarcada:'❌ desmarcada',chuva:'☔ cancelada por chuva'};
/* Extrato de aulas do aluno: a mesma lista do Início/fechamento (aulasDoDia),
   com a situação de cada aula pela presença; mais as desmarcadas (exceção do
   fixo ou aviso do app) e as derrubadas por chuva. */
function extratoAluno(a,ini,fim){
 const hoje=dataBase(),agora=agoraMinSP(),pres={},itens=[],dias=new Set(),chave=new Set();
 (DB.presencas||[]).forEach(p=>{if(p.alunoId===a.id&&p.k)pres[p.k]=p;});
 percorrerDias(ini,fim,(d,dk)=>aulasDoDia(d).aulas.forEach(au=>{
  const e=au.entradas.find(x=>x.alunoId===a.id);if(!e)return;
  const reg=pres[presId(e,d)],passou=dk<hoje||dk===hoje&&au.min+60<=agora;
  const st=ehFalta(reg)?'falta':ehAvisou(reg)?'avisou':reg?'confirmada':passou?'sem':'agendada';
  dias.add(dk);chave.add(dk+'|'+au.hora);
  itens.push({dk,hora:au.hora,min:au.min,st,tipo:e.repo?'reposição':tipoAula(au).toLowerCase()});
 }));
 (DB.presencas||[]).forEach(p=>{
  if(p.alunoId!==a.id||!p.manual||ehMarca(p)||!p.data||p.data<ini||p.data>fim||dias.has(p.data))return;
  try{if(ehDupManual(p,DB.presencas))return;}catch(e){}
  itens.push({dk:p.data,hora:p.hora||'—',min:p.hora?minH(p.hora):0,st:'confirmada',tipo:'lançada pelo cartão'});
 });
 const fixos=((DB.agenda||{}).fixos||[]).filter(f=>f.alunoId===a.id);
 ((DB.agenda||{}).excecoes||[]).forEach(x=>{
  if(!x.data||x.data<ini||x.data>fim)return;const f=fixos.find(y=>y.id===x.fixoId);if(!f||chave.has(x.data+'|'+f.hora))return;
  chave.add(x.data+'|'+f.hora);itens.push({dk:x.data,hora:f.hora,min:minH(f.hora),st:chuvaEm(x.data,f.hora)?'chuva':'desmarcada',tipo:''});
 });
 (DB.chuvas||[]).forEach(c=>{if(!c.data||c.data<ini||c.data>fim||!(c.cods||[]).includes(a.codigo)||chave.has(c.data+'|'+c.hora))return;
  chave.add(c.data+'|'+c.hora);itens.push({dk:c.data,hora:c.hora,min:minH(c.hora),st:'chuva',tipo:''});});
 (typeof NOTIF!=='undefined'?NOTIF:[]).forEach(n=>{if(n.acao!=='cancelou'||String(n.codigo)!==String(a.codigo)||!n.data||n.data<ini||n.data>fim||chave.has(n.data+'|'+n.hora))return;
  chave.add(n.data+'|'+n.hora);itens.push({dk:n.data,hora:n.hora||'—',min:n.hora?minH(n.hora):0,st:'desmarcada',tipo:'pelo app'});});
 return itens.sort((x,y)=>x.dk.localeCompare(y.dk)||x.min-y.min);
}
function resumoExtrato(a,q){
 const itens=extratoAluno(a,q.ini,q.fim),n=s=>itens.filter(i=>i.st===s).length,nome=String(a.nome);
 const feitas=n('confirmada')+n('sem'),futuras=n('agendada'),partes=[];
 if(feitas)partes.push(plural(feitas,'já feita','já feitas')+(n('sem')?' ('+n('sem')+' sem presença confirmada)':''));
 if(futuras)partes.push(plural(futuras,'ainda por vir','ainda por vir'));
 if(n('falta'))partes.push(plural(n('falta'),'falta','faltas'));
 if(n('avisou'))partes.push(n('avisou')+' com aviso de que não vinha');
 if(n('desmarcada'))partes.push(plural(n('desmarcada'),'desmarcada','desmarcadas'));
 if(n('chuva'))partes.push(n('chuva')+' cancelada'+(n('chuva')===1?'':'s')+' por chuva');
 const total=feitas+futuras+n('falta')+n('avisou');
 let resumo=total||itens.length?nome+' '+q.rotulo+': '+plural(total,'aula')+(partes.length?' — '+partes.join(', '):'')+'.':nome+' não tem aula '+q.rotulo+'.';
 if(q.desdeInicio){const hoje=dataBase(),ini=inicioRegistros()||hoje,tot=extratoAluno(a,ini,hoje).filter(i=>i.st==='confirmada'||i.st==='sem').length;
  resumo+=' Desde '+brData(ini)+'/'+ini.slice(0,4)+' (início dos registros): '+plural(tot,'aula feita','aulas feitas')+'.';}
 const linhas=itens.map(i=>({hora:rotDia(i.dk)+' '+i.hora,nomes:ST_TXT[i.st],tipo:i.tipo}));
 return {titulo:'Extrato de '+nome,resumo,linhas,nota:'Mesma conta do Início e do fechamento. Desmarcadas e chuva aparecem para conferência; não contam como aula.',fala:resumo};
}
function proximasAluno(a,max){
 const hoje=dataBase(),agora=agoraMinSP(),out=[];
 comIndiceAgenda(()=>{for(let i=0;i<=60&&out.length<max;i++){const dk=somarDia(hoje,i);
  for(const au of aulasDoDia(new Date(dk+'T12:00:00')).aulas){if(dk===hoje&&au.min<=agora)continue;if(au.entradas.some(e=>e.alunoId===a.id)){out.push({dk,hora:au.hora,tipo:tipoAula(au).toLowerCase()});if(out.length>=max)break;}}}});
 return out;
}
function resumoChuvas(q){
 const dias=new Map();
 ((DB.agenda||{}).eventos||[]).forEach(e=>{if(e.tipo!=='bloqueio'||!(e.motivo==='chuva'||/chuva/i.test(String(e.titulo||'')))||e.data<q.ini||e.data>q.fim)return;
  const x=dias.get(e.data)||{horas:[],nq:0};x.horas.push(e.hora);x.nq+=Number(e.nq)||0;dias.set(e.data,x);});
 const lista=[...dias].sort((x,y)=>x[0].localeCompare(y[0]));
 const linhas=lista.map(([dk,x])=>({hora:rotDia(dk),nomes:x.horas.sort().join(', '),tipo:x.nq?plural(x.nq,'marcação cancelada','marcações canceladas'):''}));
 const resumo=q.tipo==='dia'?(lista.length?'Sim: '+q.rotulo+' teve chuva marcada às '+lista[0][1].horas.sort().join(', ')+(lista[0][1].nq?' ('+plural(lista[0][1].nq,'marcação cancelada','marcações canceladas')+')':'')+'.':'Não há chuva marcada '+q.rotulo+'.')
  :(lista.length?plural(lista.length,'dia','dias')+' com chuva marcada '+q.rotulo+'.':'Nenhuma chuva marcada '+q.rotulo+'.');
 return {titulo:'Chuva',resumo,linhas:q.tipo==='dia'?[]:linhas,nota:'Pela marcação de chuva na agenda.',fala:resumo};
}
function canceladas(ini,fim){
 const out=[],fixos=(DB.agenda||{}).fixos||[],chave=new Set();
 ((DB.agenda||{}).excecoes||[]).forEach(x=>{if(!x.data||x.data<ini||x.data>fim)return;const f=fixos.find(y=>y.id===x.fixoId);if(!f||!['aula','grupo','personal'].includes(f.tipo))return;
  chave.add(x.data+'|'+f.hora+'|'+(f.alunoId||f.titulo));out.push({dk:x.data,hora:f.hora,nome:nomeEntrada(f),chuva:chuvaEm(x.data,f.hora),motivo:'cancelada só nesta data'});});
 (typeof NOTIF!=='undefined'?NOTIF:[]).forEach(n=>{if(n.acao!=='cancelou'||!n.data||n.data<ini||n.data>fim)return;
  const a=DB.alunos.find(x=>String(x.codigo)===String(n.codigo)),k=n.data+'|'+n.hora+'|'+(a?a.id:n.nome);if(chave.has(k))return;chave.add(k);
  out.push({dk:n.data,hora:n.hora||'',nome:a?a.nome:String(n.nome||'Aluno'),chuva:false,motivo:'desmarcou pelo app'});});
 (DB.presencas||[]).forEach(p=>{if(!ehAvisou(p)||!p.data||p.data<ini||p.data>fim)return;const a=DB.alunos.find(x=>x.id===p.alunoId);
  out.push({dk:p.data,hora:p.hora||'',nome:a?a.nome:'Aluno',chuva:false,motivo:'avisou que não vinha'});});
 return out.sort((x,y)=>x.dk.localeCompare(y.dk)||String(x.hora).localeCompare(String(y.hora)));
}
function resumoDesmarcadas(q){
 const todas=canceladas(q.ini,q.fim),sem=todas.filter(x=>!x.chuva),chuva=todas.length-sem.length;
 const resumo=(sem.length?plural(sem.length,'aula desmarcada','aulas desmarcadas')+' '+q.rotulo+'.':'Nenhuma aula desmarcada '+q.rotulo+'.')+(chuva?' Além disso, '+plural(chuva,'saiu','saíram')+' por chuva.':'');
 const linhas=sem.map(x=>({hora:(q.tipo==='dia'?'':rotDia(x.dk)+' ')+x.hora,nomes:x.nome,tipo:x.motivo}));
 return {titulo:'Aulas desmarcadas',resumo,linhas,nota:'Pelas exceções da agenda, avisos do app dos alunos e avisos marcados na presença.',fala:resumo+(linhas.length&&linhas.length<=6?' '+linhas.map(l=>l.hora+' '+l.nomes).join(', ')+'.':'')};
}
function resumoFaltas(q){
 const f=(DB.presencas||[]).filter(p=>ehFalta(p)&&p.data&&p.data>=q.ini&&p.data<=q.fim).sort((x,y)=>String(x.data).localeCompare(String(y.data))||String(x.hora).localeCompare(String(y.hora)));
 const linhas=f.map(p=>{const a=DB.alunos.find(x=>x.id===p.alunoId);return {hora:(q.tipo==='dia'?'':rotDia(p.data)+' ')+(p.hora||''),nomes:a?a.nome:'Aluno',tipo:'faltou'};});
 const resumo=f.length?plural(f.length,'falta','faltas')+' '+q.rotulo+'.':'Ninguém faltou '+q.rotulo+'.';
 return {titulo:'Faltas',resumo,linhas,nota:'Falta marcada na presença (consome a aula).',fala:resumo+(linhas.length&&linhas.length<=6?' '+linhas.map(l=>l.nomes).join(', ')+'.':'')};
}
function resumoPresencas(q){
 const hoje=dataBase(),agora=agoraMinSP(),pres=new Set((DB.presencas||[]).map(p=>p.k)),linhas=[];
 percorrerDias(q.ini,q.fim<hoje?q.fim:hoje,(d,dk)=>aulasDoDia(d).aulas.forEach(au=>{
  if(dk===hoje&&au.min+60>agora)return;
  au.entradas.filter(e=>e.alunoId&&!pres.has(presId(e,d))).forEach(e=>linhas.push({hora:(q.tipo==='dia'?'':rotDia(dk)+' ')+au.hora,nomes:nomeEntrada(e),tipo:'presença não confirmada'}));
 }));
 const resumo=linhas.length?plural(linhas.length,'presença por confirmar','presenças por confirmar')+' '+q.rotulo+'.':'Todas as presenças '+q.rotulo+' estão confirmadas.';
 return {titulo:'Presenças',resumo,linhas,nota:'Aulas que já passaram sem ✓ na agenda. Confirme pela agenda; aqui é só a lista.',fala:resumo};
}
function resumoReposicoes(){
 const l=(DB.alunos||[]).filter(a=>ehAtivoAluno(a)&&reposValidas(a)>0).sort((x,y)=>reposValidas(y)-reposValidas(x));
 const tot=l.reduce((s,a)=>s+reposValidas(a),0);
 const resumo=l.length?plural(l.length,'aluno','alunos')+' com reposição válida, '+fmtCred(tot)+' no total.':'Nenhum aluno ativo com reposição válida.';
 return {titulo:'Reposições',resumo,linhas:l.map(a=>({hora:'•',nomes:a.nome,tipo:fmtCred(reposValidas(a))+(reposValidas(a)===1?' reposição':' reposições')+(reposVencendo(a)?' · '+fmtCred(reposVencendo(a))+' vence este mês':'')})),nota:'Só reposições dentro dos 4 meses de validade.',fala:resumo};
}
function resumoAlunos(){const c=contagemAlunos();const resumo='Você tem '+plural(c.ativos,'aluno ativo','alunos ativos')+(c.inativos?' ('+c.inativos+' inativo'+(c.inativos===1?'':'s')+' no cadastro)':'')+'.';return {titulo:'Alunos',resumo,linhas:[],nota:'Mesma conta do Início.',fala:resumo};}
function resumoOcupacao(q){
 let resumo;
 if(q.longo){const o=ocupacao(new Date(q.longo.ini+'T12:00:00'),new Date(q.longo.fim+'T12:00:00'));resumo='Ocupação '+q.longo.rotulo+': '+(o.disp?o.pct+'% ('+o.ocup+' de '+o.disp+' horários de aula)':'sem horários abertos para aula')+'. Locação: '+o.locUsados+' h.';}
 else{const d=new Date(q.data+'T12:00:00'),o=ocupacao(d,d);resumo='Ocupação '+quandoTxt(q.data)+': '+(o.disp?o.pct+'% ('+o.ocup+' de '+o.disp+' horários de aula)':'sem horários abertos para aula')+'. Locação: '+o.locUsados+' h.';}
 return {titulo:'Ocupação',resumo,linhas:[],nota:'Mesma conta do Início: horários abertos para aula que têm aula marcada.',fala:resumo};
}
function resumoLocacoes(q){
 if(q.longo){let n=0;percorrerDias(q.longo.ini,q.longo.fim,d=>HORAS.forEach(h=>{if(entriesFor(d,h).some(e=>e.tipo==='locacao'))n++;}));
  const resumo=n?plural(n,'hora','horas')+' de locação '+q.longo.rotulo+'.':'Nenhuma locação '+q.longo.rotulo+'.';return {titulo:'Locações',resumo,linhas:[],nota:'Conta cada horário com locação marcada.',fala:resumo};}
 const d=new Date(q.data+'T12:00:00'),linhas=[];
 HORAS.forEach(h=>{const ls=entriesFor(d,h).filter(e=>e.tipo==='locacao');if(ls.length)linhas.push({hora:h,nomes:ls.map(nomeEntrada).join(', '),tipo:'Locação'});});
 const resumo=linhas.length?plural(linhas.length,'locação','locações')+' '+quandoTxt(q.data)+'.':'Nenhuma locação '+quandoTxt(q.data)+'.';
 return {titulo:'Locações',resumo,linhas,nota:'Consulta da sua agenda.',fala:resumo+(linhas.length?' '+linhas.map(l=>'Às '+l.hora+', '+l.nomes+'.').join(' '):'')};
}
function resumoPrecos(){
 const p=DB.precos||{},g=DB.grupoPreco||{};
 const itens=[['Aula avulsa particular',p.avulsaPart],['Aula avulsa em grupo (por pessoa)',p.avulsaGrupo],['Personal avulso',p.personal],['Locação (por hora)',p.locacao],['Plano em dupla (por aula)',g.dupla],['Plano em trio (por aula)',g.trio],['Plano em quarteto (por aula)',g.quarteto]].filter(x=>Number(x[1])>0);
 const linhas=itens.map(x=>({hora:'•',nomes:x[0],tipo:valorRs(x[1])}));
 const resumo=hideVals?'Os valores estão ocultos. Toque no olho do Início para mostrar e eu leio os preços.':'Preços atuais: '+itens.map(x=>x[0].toLowerCase()+' '+fmtRs(x[1])).join('; ')+'.';
 return {titulo:'Preços',resumo,linhas:hideVals?[]:linhas,nota:'Os preços de plano mensal por aluno estão no cadastro de cada um.',fala:resumo};
}
function resumoAjuda(){
 const ex=['“Quantas aulas tenho das 16 até o fim da noite?”','“Quais horários livres amanhã de manhã?”','“Quantas aulas dei este mês?”','“Quantas aulas a Ana fez este mês?” · “Próximas aulas do Bruno”','“Quantos créditos a Ana tem?” · “Choveu ontem?” · “Tem aula desmarcada hoje?”','“Quem está devendo este mês?” · “Quanto recebi este mês?”','“Abra os horários das 7 às 18 de domingo para locação”','“Feche a quadra sábado à tarde” · “Marcar chuva hoje à tarde”','“Agendar Ana amanhã às 16h” · “Cancelar Bruno sexta às 18h”'];
 return {titulo:'O que eu sei fazer',resumo:AJUDA_CURTA,linhas:ex.map(x=>({hora:'•',nomes:x,tipo:''})),nota:'Pode falar do seu jeito; se faltar algo, eu pergunto.',fala:AJUDA_CURTA};
}
function calcularResposta(q){
 const f=({periodo:resumoPeriodo,proxima:resumoProxima,chuvas:resumoChuvas,desmarcadas:resumoDesmarcadas,faltas:resumoFaltas,presencas:resumoPresencas,reposicoes:resumoReposicoes,alunos:resumoAlunos,livres:resumoLivres,aluno:resumoAluno,financeiro:resumoFinanceiro,ocupacao:resumoOcupacao,locacoes:resumoLocacoes,precos:resumoPrecos,ajuda:resumoAjuda})[q.consulta];
 return f?f(q):resumoConsulta(q);
}
async function responderConsulta(q){
 if(st.ocupado||st.aplicado||!st.aberto)return;const ep=st.epoca,banco=assinatura();
 st.consulta=true;mostrarCampos(false);$('voz-confirmar').hidden=true;
 ocupado(true);status(q.consulta==='ajuda'?'':'Conferindo seus dados…');
 try{
  if(q.consulta!=='ajuda'){
   await conferirDadosConsulta();if(ep!==st.epoca||!st.aberto)return;
   pronto();if(banco!==assinatura())throw Error('A agenda mudou durante a consulta. Pergunte novamente.');
  }
  const r=calcularResposta(q),lista=$('voz-consulta-lista');lista.replaceChildren();
  $('voz-consulta-titulo').textContent=r.titulo||'Sua agenda';$('voz-consulta-resumo').textContent=r.resumo;
  r.linhas.forEach(a=>{const li=document.createElement('li'),h=document.createElement('b'),nome=document.createElement('span');
   h.textContent=a.hora;nome.textContent=a.nomes+(a.tipo?' · '+a.tipo:'');li.append(h,nome);lista.append(li);});
  $('voz-consulta-nota').textContent=r.nota;$('voz-consulta').hidden=false;
  st.confirmacao=r.fala||r.resumo;$('voz-repetir').textContent='Ouvir resposta';$('voz-repetir').hidden=false;$('voz-repetir').disabled=!w.speechSynthesis||!w.SpeechSynthesisUtterance;
  status('Pode perguntar outra coisa ou pedir uma ação.');
  rolarConversa();ouvirResposta(st.confirmacao);
 }catch(e){if(ep===st.epoca&&st.aberto){const m=e.message||'Não consegui consultar a agenda.';status(m);msg('assistente',m);}}
 finally{if(ep===st.epoca)ocupado(false);}
}
async function analisar(){
 if(st.ocupado||st.aplicado)return;parar();pararResposta();invalidar();
 const texto=$('voz-texto').value.trim();if(texto){
  msg('voce',texto);
  const r=interpretar(texto,DB.alunos,dataBase());if(r.erro){status(r.erro);msg('assistente',r.erro);ouvirResposta(r.erro);return;}
  if(r.acao==='consultar'){await responderConsulta(r);return;}
  if(r.acao==='navegar'){msg('assistente','Abrindo a agenda de '+quandoTxt(r.data)+'.');const dia=new Date(r.data+'T12:00:00');fechar(false);setTimeout(()=>irParaAgenda('dia',dia),60);return;}
  if(r.especial){mostrarCampos(false);await prepararEspecial(r);return;}
  mostrarCampos(true);$('voz-acao').value=r.acao;preencherAlunos(r.candidatos);$('voz-data').value=r.data||'';$('voz-hora').value=r.hora||'';
  const a=DB.alunos.find(x=>x.id===campo('voz-aluno'));$('voz-tipo').value=r.tipo||(a?tipoAluno(a):'');$('voz-repo').checked=r.repo;
  atualizarCampos();if(r.aviso)status(r.aviso);
 }else if($('voz-campos').hidden){status('Fale ou escreva o que precisa.');return;}
 await preparar();
}
async function preparar(){
 if(st.ocupado||st.aplicado)return;pararResposta();invalidar();atualizarCampos();const ep=st.epoca;
 ocupado(true);status('Conferindo aluno, horário e nuvem…');
 try{
  await conferirNuvem();if(ep!==st.epoca||!st.aberto)return;
  const i=contexto();i.form=chaveForm();i.banco=assinatura();i.token=String(ep)+'-'+String(performance.now());
  st.intencao=i;
  const box=$('voz-previa');box.replaceChildren();const titulo=document.createElement('b');titulo.textContent=({cancelar:'Cancelar uma aula',agendar:'Agendar uma marcação',renovar:'Renovar o pacote'})[i.acao];box.append(titulo);
  const nome=document.createElement('p');nome.textContent=i.nome;box.append(nome);
  const det=document.createElement('p');det.textContent=i.acao==='renovar'?'A confirmação da renovação mostrará os saldos antes/depois. As barreiras de renovação manual e repetida continuam valendo.':new Date(i.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})+' · '+i.hora;box.append(det);
  const nota=document.createElement('p');nota.textContent=i.acao==='cancelar'?'Somente esta marcação nesta data. Não cria reposição nem altera saldos.':i.acao==='renovar'?'A renovação usa a regra atual de créditos e sobras. Não registra pagamento.':'Só nesta data · '+(i.tipo==='grupo'?'aula para '+i.pessoas+' pessoas':i.tipo)+(i.repo?' · reposição':'')+'. Créditos serão usados pelas regras normais da aula.';box.append(nota);
  box.hidden=false;$('voz-confirmar').hidden=false;$('voz-confirmar').textContent=i.acao==='renovar'?'Revisar e renovar':i.acao==='cancelar'?'Confirmar cancelamento':'Confirmar agendamento';status('Confira os detalhes antes de confirmar.');
  const fala=titulo.textContent+' para '+i.nome+'. '+(i.data?det.textContent+'. ':'')+'Confira os detalhes e toque em '+$('voz-confirmar').textContent+'.';
  msg('assistente','Preparei: '+fala);box.scrollIntoView({block:'nearest',behavior:'auto'});$('voz-confirmar').scrollIntoView({block:'nearest',behavior:'auto'});ouvirResposta(fala);
 }catch(e){if(ep===st.epoca){const m=e.message||'Não consegui conferir o pedido.';status(m);msg('assistente',m);}}
 finally{if(ep===st.epoca)ocupado(false);}
}
async function executar(){
 const i=st.intencao;if(st.ocupado||st.aplicado||!i||st.consumidas.has(i.token))return;
 if(i.especial)return executarEspecial(i);
 parar();pararResposta();const ep=st.epoca;ocupado(true);status('Conferindo novamente antes de aplicar…');
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
  st.resultadoBase=({cancelar:'Aula cancelada',agendar:'Horário agendado',renovar:'Pacote renovado'})[i.acao]+' para '+i.nome+(i.data?' em '+i.data.split('-').reverse().join('/')+' às '+i.hora:'');
  st.aplicado=true;st.consumidas.add(i.token);st.intencao=null;
  status('Aplicado no aparelho. Aguardando confirmação da nuvem…');
  const ok=await gravarAgora();
  if(ep===st.epoca){$('voz-salvar').hidden=ok;if(ok)resultadoSalvo();else avisar('Aplicado no aparelho; confirmação na nuvem pendente. Não repita a ação. Use Conferir salvamento.');}
 }catch(e){if(ep===st.epoca){st.intencao=null;if(st.aplicado){$('voz-salvar').hidden=false;avisar('Aplicado no aparelho; confirmação na nuvem pendente. Não repita a ação. Tente salvar ou confira Segurança e dados.');}else avisar((e&&e.message)||'Não consegui concluir. Confira o salvamento antes de repetir.');}}
 finally{if(ep===st.epoca)ocupado(false);}
}
/* ===== Funcionamento e chuva pela voz =====
   Mesma barreira das outras ações: nuvem conferida, cópia anterior guardada,
   prévia e confirmação explícita. O plano é recalculado na hora de aplicar e
   precisa ser idêntico ao que foi mostrado. */
const MODO_TXT={aula:'aberto para aula',loc:'só para locação',fechado:'fechado'};
function horasDoPedido(i){
 if(i.acao!=='chuva'||i.data!==dataBase()||i.ini!==0||i.fim!==1440)return i.horas;
 const agora=agoraMinSP();return i.horas.filter(h=>minH(h)+60>agora);   // "chuva hoje": daqui para a frente
}
function planoEspecial(i){
 if(i.acao==='horarios'){
  if(!['aula','loc','fechado'].includes(i.modo))throw Error('Escolha aula, só locação ou fechado.');
  if(!i.horas.length)throw Error('Não encontrei horários da grade nesse intervalo.');
  const mud=[],conflitos=[],hoje=dataBase(),choca=(e,modo)=>e.origem!=='compromisso'&&e.tipo!=='bloqueio'&&(modo==='fechado'||modo==='loc'&&['aula','grupo','personal'].includes(e.tipo)||modo==='aula'&&e.tipo==='locacao');
  if(i.escopo==='semana'){
   if(!i.dias.length)throw Error('Diga o dia da semana.');
   i.dias.forEach(d=>i.horas.forEach(h=>{const atual=(DB.horarioCfg&&DB.horarioCfg[d]&&DB.horarioCfg[d][h])||modoPadrao({getDay:()=>d},h);if(atual!==i.modo)mud.push(DIAS_C[d]+' '+h);
    ((DB.agenda||{}).fixos||[]).filter(f=>f.dia===d&&f.hora===h&&(!f.ate||f.ate>=hoje)&&choca(f,i.modo)).forEach(f=>conflitos.push(DIAS_C[d]+' '+h+' '+nomeEntrada(f)));}));
  }else{
   if(!i.data||i.data<dataBase())throw Error('Escolha uma data de hoje em diante.');
   const d=new Date(i.data+'T12:00:00');
   i.horas.forEach(h=>{if(slotModo(d,h)!==i.modo)mud.push(h);entriesFor(d,h).filter(e=>choca(e,i.modo)).forEach(e=>conflitos.push(h+' '+nomeEntrada(e)));});
  }
  if(!mud.length)throw Error('Esses horários já estão '+MODO_TXT[i.modo]+'. Nada para mudar.');
  return {mud,conflitos};
 }
 if(i.acao==='chuva'){
  if(!i.data||i.data<dataBase())throw Error('Marque chuva de hoje em diante; dias anteriores ficam pela agenda.');
  const d=new Date(i.data+'T12:00:00'),afet=[];
  horasDoPedido(i).forEach(h=>{const evs=entriesFor(d,h).filter(e=>e.tipo!=='bloqueio'&&e.origem!=='compromisso');if(evs.length)afet.push({hora:h,nomes:evs.map(nomeEntrada).join(', ')});});
  if(!afet.length)throw Error('Não há aula nem locação marcada '+quandoTxt(i.data)+' nesses horários.');
  return {afet};
 }
 throw Error('Pedido não reconhecido.');
}
function textoEspecial(i,plano){
 if(i.acao==='chuva')return {titulo:'Marcar chuva',linhas:[quandoTxt(i.data)+' · '+plural(plano.afet.length,'horário')+': '+plano.afet.map(a=>a.hora+' '+a.nomes).join('; ')],
  nota:'As aulas desses horários saem só desta data (a grade fixa continua). Presença já marcada devolve o crédito. Os alunos veem “cancelado por chuva”.',botao:'Confirmar chuva'};
 const quando=i.escopo==='semana'?'Toda semana: '+i.dias.map(d=>DIAS_L[d]).join(', '):quandoTxt(i.data)+' (só esta data)';
 const faixa='Das '+hm(i.ini)+(i.fim>=1440?' até o fim do dia':' às '+hm(i.fim))+' → '+MODO_TXT[i.modo]+' ('+plural(i.horas.length,'horário')+': '+i.horas[0]+(i.horas.length>1?' a '+i.horas[i.horas.length-1]:'')+').';
 const conf=plano.conflitos.length?'Atenção: '+plural(plano.conflitos.length,'marcação','marcações')+' nesses horários continua'+(plano.conflitos.length===1?'':'m')+' na agenda: '+plano.conflitos.slice(0,6).join('; ')+(plano.conflitos.length>6?'…':'')+'.':'';
 return {titulo:'Mudar o funcionamento',linhas:[quando,faixa,plural(plano.mud.length,'horário muda','horários mudam')+'.'].concat(conf?[conf]:[]),
  nota:'Vale para a sua agenda e para o app dos alunos. A tela Funcionamento continua mostrando tudo para conferir ou desfazer.',botao:'Confirmar mudança'};
}
function escolha(rotulo,opcoes,valor,mudar){
 const l=document.createElement('label');l.textContent=rotulo;const sel=document.createElement('select');
 opcoes.forEach(([v,t,off])=>{const o=document.createElement('option');o.value=v;o.textContent=t;o.disabled=!!off;sel.append(o);});
 sel.value=valor;sel.addEventListener('change',()=>mudar(sel.value));l.append(sel);return l;
}
async function prepararEspecial(i){
 if(st.ocupado||st.aplicado)return;const ep=st.epoca;ocupado(true);status('Conferindo agenda e nuvem…');
 try{
  await conferirNuvem();if(ep!==st.epoca||!st.aberto)return;
  const plano=planoEspecial(i),txt=textoEspecial(i,plano);
  st.intencao=Object.assign({},i,{especial:true,plano:JSON.stringify(plano),banco:assinatura(),token:String(ep)+'-'+String(performance.now())});
  const box=$('voz-previa');box.replaceChildren();const t=document.createElement('b');t.textContent=txt.titulo;box.append(t);
  txt.linhas.forEach(x=>{const p=document.createElement('p');p.textContent=x;box.append(p);});
  if(i.acao==='horarios'){
   const refData=i.data||somarDia(dataBase(),(i.dias[0]-new Date(dataBase()+'T12:00:00').getDay()+7)%7);
   box.append(escolha('Funcionamento',[['aula','Aberto para aula'],['loc','Só locação'],['fechado','Fechado']],i.modo,v=>{invalidar();prepararEspecial(Object.assign({},i,{modo:v}));}));
   box.append(escolha('Vale para',[['data','Só em '+brData(refData),i.dias.length>1],['semana','Toda '+i.dias.map(d=>DIAS_L[d]).join(', ')]],i.escopo,v=>{invalidar();prepararEspecial(Object.assign({},i,{escopo:v,data:v==='data'?refData:i.data}));}));
  }
  const nota=document.createElement('p');nota.textContent=txt.nota;box.append(nota);
  box.hidden=false;$('voz-confirmar').hidden=false;$('voz-confirmar').textContent=txt.botao;
  const fala=txt.titulo+'. '+txt.linhas.join(' ')+' Confira e toque em '+txt.botao+'.';
  status('Confira os detalhes antes de confirmar.');msg('assistente','Preparei: '+fala);
  box.scrollIntoView({block:'nearest',behavior:'auto'});$('voz-confirmar').scrollIntoView({block:'nearest',behavior:'auto'});ouvirResposta(fala);
 }catch(e){if(ep===st.epoca)avisar(e.message||'Não consegui conferir o pedido.');}
 finally{if(ep===st.epoca)ocupado(false);}
}
function aplicarEspecial(i){
 if(i.acao==='horarios'){
  if(i.escopo==='semana'){
   DB.horarioCfg=DB.horarioCfg||{};
   i.dias.forEach(d=>{const m=Object.assign({},DB.horarioCfg[d]||{});i.horas.forEach(h=>{m[h]=i.modo;});DB.horarioCfg[d]=m;});
   logAct('Funcionamento pela voz ('+i.dias.map(d=>DIAS_C[d]).join(', ')+')');
  }else{
   const d=new Date(i.data+'T12:00:00'),dow=d.getDay(),m=Object.assign({},(DB.horarioData||{})[i.data]||{});
   HORAS.forEach(h=>{if(!m[h])m[h]=(DB.horarioCfg&&DB.horarioCfg[dow]&&DB.horarioCfg[dow][h])||modoPadrao(d,h);});
   i.horas.forEach(h=>{m[h]=i.modo;});DB.horarioData=DB.horarioData||{};DB.horarioData[i.data]=m;
   logAct('Funcionamento pela voz ('+i.data+')');
  }
  persist();try{renderAgenda();}catch(e){}try{publicarMapaQuadra();}catch(e){}
 }else if(i.acao==='chuva'){
  const d=new Date(i.data+'T12:00:00');
  horasDoPedido(i).forEach(h=>{if(entriesFor(d,h).some(e=>e.tipo!=='bloqueio'&&e.origem!=='compromisso'))aplicarChuva(d,h);});
  logAct('Chuva pela voz ('+i.data+')');persist();try{renderAgenda();}catch(e){}
 }
}
async function executarEspecial(i){
 parar();pararResposta();const ep=st.epoca;ocupado(true);status('Conferindo novamente antes de aplicar…');
 try{
  await conferirNuvem();if(ep!==st.epoca||!st.aberto)return;
  if(i.banco!==assinatura())throw Error('Os dados mudaram. Faça uma nova conferência.');
  if(JSON.stringify(planoEspecial(i))!==i.plano)throw Error('A agenda mudou. Confira novamente.');
  const antes=assinatura();if(!await guardarVersoes(antes))throw Error('Não consegui guardar a cópia anterior. Nada foi alterado.');
  await conferirNuvem();if(ep!==st.epoca||!st.aberto)return;
  if(i.banco!==assinatura())throw Error('Os dados mudaram durante a conferência. Nada foi alterado.');
  aplicarEspecial(i);
  if(assinatura()===antes){avisar('Nenhuma alteração aplicada.');st.intencao=null;return;}
  st.resultadoBase=i.acao==='chuva'?'Chuva marcada '+quandoTxt(i.data):'Funcionamento mudado: '+(i.escopo==='semana'?'toda '+i.dias.map(d=>DIAS_L[d]).join(', '):quandoTxt(i.data))+', das '+hm(i.ini)+(i.fim>=1440?' até o fim do dia':' às '+hm(i.fim))+' '+MODO_TXT[i.modo];
  st.aplicado=true;st.consumidas.add(i.token);st.intencao=null;
  status('Aplicado no aparelho. Aguardando confirmação da nuvem…');
  const ok=await gravarAgora();
  if(ep===st.epoca){$('voz-salvar').hidden=ok;if(ok)resultadoSalvo();else avisar('Aplicado no aparelho; confirmação na nuvem pendente. Não repita a ação. Use Conferir salvamento.');}
 }catch(e){if(ep===st.epoca){st.intencao=null;if(st.aplicado){$('voz-salvar').hidden=false;avisar('Aplicado no aparelho; confirmação na nuvem pendente. Não repita a ação. Tente salvar ou confira Segurança e dados.');}else avisar((e&&e.message)||'Não consegui concluir. Confira o salvamento antes de repetir.');}}
 finally{if(ep===st.epoca)ocupado(false);}
}
async function salvar(){
 if(st.ocupado||!st.aplicado||!st.aberto)return;const ep=st.epoca;ocupado(true);
 try{const ok=await gravarAgora();if(ep!==st.epoca||!st.aberto)return;$('voz-salvar').hidden=ok;if(ok)resultadoSalvo();else avisar('A confirmação ainda está pendente. Confira Segurança e dados antes de outra ação.');}catch(e){if(ep===st.epoca)avisar('Não consegui confirmar a nuvem. A ação não foi repetida.');}finally{if(ep===st.epoca)ocupado(false);}
}
function atualizarMic(){
 for(const el of [$('voz-painel'),$('voz-atalho')])if(el){el.dataset.ouvindo=String(!!st.rec);el.dataset.falando=String(st.falando);}
 const existe=!!(w.SpeechRecognition||w.webkitSpeechRecognition);
 $('voz-falar').disabled=st.ocupado||st.aplicado||!existe;$('voz-falar').textContent=st.rec?'Ouvindo…':'Falar';
 $('voz-parar').hidden=!st.rec;$('voz-falar').setAttribute('aria-pressed',String(!!st.rec));
 $('voz-circulo').disabled=st.ocupado||(!st.rec&&!st.resposta&&(st.aplicado||!existe));
 $('voz-circulo').setAttribute('aria-label',st.rec?'Parar de ouvir':st.resposta?'Parar resposta por voz':'Falar pedido');
 $('voz-circulo').setAttribute('aria-pressed',String(!!st.rec||st.falando));
}
function parar(){const r=st.rec;st.rec=null;if(r){try{r.abort();}catch(e){}if(st.aberto)status('Escuta encerrada. Confira o texto ou toque em Falar.');}if($('voz-falar'))atualizarMic();}
function falar(){
 if(st.ocupado||st.aplicado||st.rec||!st.aberto)return;
 const C=w.SpeechRecognition||w.webkitSpeechRecognition;if(!C){status('Use o microfone do teclado do iPhone para ditar ou digite o pedido.');return;}
 invalidar();pararResposta();const r=new C();st.rec=r;r.lang='pt-BR';r.continuous=false;r.interimResults=true;
 let final='',ultimo=-1;r.onresult=e=>{if(st.rec!==r||!st.aberto)return;
  let parcial='';for(let n=e.resultIndex;n<e.results.length;n++){if(e.results[n].isFinal){if(n>ultimo){final+=(final?' ':'')+e.results[n][0].transcript;ultimo=n;}}else parcial+=e.results[n][0].transcript;}
  $('voz-texto').value=(final+' '+parcial).trim().slice(0,500);invalidar();status(final?'Confira o texto e toque em Conferir pedido.':'Ouvindo…');
 };
 r.onerror=e=>{if(st.rec!==r)return;st.rec=null;atualizarMic();status(e.error==='not-allowed'||e.error==='service-not-allowed'?'Permissão de voz negada. Você pode digitar ou usar o ditado do teclado.':'A fala não ficou disponível. Digite ou use o ditado do teclado.');};
 r.onend=()=>{if(st.rec!==r)return;st.rec=null;atualizarMic();if(st.aberto){if(final.trim())analisar();else status('Não ouvi um pedido completo. Toque em Falar ou digite.');}};
 try{r.start();status('Ouvindo em português…');atualizarMic();}catch(e){st.rec=null;atualizarMic();status('Não consegui iniciar a fala. Digite ou use o ditado do teclado.');}
}
function abrir(iniciarFala){
 if(!dono()){toast('Entre na conta do João para usar ações rápidas.');return;}
 fecharMais();if(st.aberto)return;st.epoca++;st.aberto=true;st.aplicado=false;st.ocupado=false;st.intencao=null;invalidar();st.confirmacao='';st.resultadoBase='';$('voz-resultado').textContent='';$('voz-resultado').hidden=true;$('voz-repetir').hidden=true;st.ultimoFoco=document.activeElement;st.pagina=document.body.dataset.pagina||'dash';
 $('voz-painel').hidden=false;document.body.classList.add('jv-voz-aberto');$('voz-texto').value='';$('voz-previa').hidden=true;$('voz-salvar').hidden=true;
 $('voz-acao').value='agendar';preencherAlunos();$('voz-data').value='';$('voz-hora').value='';$('voz-tipo').value='';$('voz-repo').checked=false;atualizarCampos();ocupado(false);
 limparConversa();mostrarCampos(false);saudacao();
 status(w.SpeechRecognition||w.webkitSpeechRecognition?'Toque em Falar ou escreva um pedido.':'Digite ou use o microfone do teclado do iPhone para ditar.');
 try{history.pushState(Object.assign({},history.state,{jvVoz:st.epoca}),'');}catch(e){}
 atualizarVisibilidade();if(iniciarFala===true){$('voz-circulo').focus();falar();}else $('voz-texto').focus();
}
function fechar(voltar){
 if(!st.aberto)return;const ep=st.epoca;st.epoca++;st.aberto=false;parar();pararResposta();st.confirmacao='';st.resultadoBase='';$('voz-resultado').textContent='';$('voz-resultado').hidden=true;$('voz-repetir').hidden=true;
 $('voz-painel').hidden=true;$('voz-texto').value='';$('voz-previa').replaceChildren();$('voz-consulta').hidden=true;$('voz-consulta-lista').replaceChildren();$('voz-consulta-resumo').textContent='';$('voz-consulta-nota').textContent='';st.consulta=false;st.intencao=null;limparConversa();mostrarCampos(false);document.body.classList.remove('jv-voz-aberto');
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
 $('voz-atalho').onclick=()=>abrir(true);$('voz-menu').onclick=()=>abrir();$('voz-circulo').onclick=()=>{if(st.rec)parar();else if(st.resposta)pararResposta();else falar();};$('voz-repetir').onclick=repetir;$('voz-ouvir').addEventListener('change',()=>{if(!$('voz-ouvir').checked)pararResposta();});$('voz-fechar').onclick=()=>fechar(false);$('voz-falar').onclick=falar;$('voz-parar').onclick=parar;
 $('voz-analisar').onclick=analisar;$('voz-conferir').onclick=preparar;$('voz-confirmar').onclick=executar;$('voz-salvar').onclick=salvar;
 $('voz-seguranca').onclick=()=>{fechar(false);go('seg',document.createElement('button'));};
 $('voz-texto').addEventListener('input',()=>{pararResposta();invalidar();});
 // Enter envia, como numa conversa; Shift+Enter quebra a linha
 $('voz-texto').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();analisar();}});
 if($('voz-manual'))$('voz-manual').onclick=()=>{if(st.ocupado||st.aplicado)return;invalidar();mostrarCampos(true);atualizarCampos();status('Escolha a ação, o aluno e o horário, e toque em Conferir campos escolhidos.');$('voz-campos').scrollIntoView({block:'nearest',behavior:'auto'});};
 ['voz-acao','voz-aluno','voz-data','voz-hora','voz-tipo','voz-repo','voz-marcacao'].forEach(id=>$(id).addEventListener('change',()=>{invalidar();if(id==='voz-aluno')$('voz-tipo').value='';atualizarCampos();}));
 $('voz-painel').addEventListener('click',e=>{if(e.target===$('voz-painel'))fechar(false);});
 $('voz-painel').addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();fechar(false);}
  if(e.key==='Tab'){const a=[...$('voz-painel').querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled])')].filter(x=>x.getClientRects().length);if(!a.length)return;
   if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a[a.length-1].focus();}else if(!e.shiftKey&&document.activeElement===a[a.length-1]){e.preventDefault();a[0].focus();}}
 });
 w.addEventListener('resize',()=>{if(st.aberto)rolarConversa();});   // girar o celular não esconde a última resposta
 w.addEventListener('popstate',()=>{if(st.aberto&&(!history.state||history.state.jvVoz!==st.epoca))fechar(true);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)fechar(false);});
 w.addEventListener('pagehide',()=>fechar(true));
 w.addEventListener('offline',()=>{parar();pararResposta();invalidar();if(st.aberto)status('Sem internet. Nenhuma nova ação será aplicada.');});
 let agendado=false;new MutationObserver(()=>{if(agendado)return;agendado=true;requestAnimationFrame(()=>{agendado=false;atualizarVisibilidade();});}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style','data-pagina']});
 atualizarVisibilidade();
}
w.JVAcoesVoz={abrir,fechar,interpretar,analisar,preparar,executar,parar,falar,conferirNuvem};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
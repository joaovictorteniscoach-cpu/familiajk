/* Família JK — assistente por voz (pedido do João em 22/10/2026).
   Mesmo jeito do assistente da Gestão: bolinha arrastável, saudação falada,
   escuta, conversa na tela e NADA gravado sem o toque em "Confirmar".
   - lançar: "gastei 80 reais de farmácia", "recebi 300 da aula"
   - perguntar/conferir: "quanto falta pagar?", "quanto gastei com mercado
     este mês?", "qual o valor da luz?", "quanto tenho investido?"
   - extrato: "importar extrato" mostra os botões de arquivo, foto ou texto
   Áudio, texto e conversa não são guardados: somem ao fechar. Usa as funções
   e os números do próprio app (as mesmas contas das abas). */
(function(){
'use strict';
const w=window,$=id=>document.getElementById(id);
const st={aberto:false,rec:null,resposta:null,falando:false,pend:null,vozLiberada:false};
const n=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const MES_ABR=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MES_EXT=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

/* ---------- período: "este mês", "mês passado", "em setembro", "este ano" ---------- */
function rotMes(ano,m){return MES_ABR[m]+'/'+String(ano).slice(2);}
function periodo(t){
  const hoje=new Date(),a=hoje.getFullYear(),m=hoje.getMonth();
  if(/\b(mes passado|ultimo mes)\b/.test(t)){const d=new Date(a,m-1,1);return {meses:[rotMes(d.getFullYear(),d.getMonth())],nome:'no mês passado'};}
  if(/\b(este ano|esse ano|no ano|neste ano|nesse ano|ano todo)\b/.test(t)){const ms=[];for(let i=0;i<=m;i++)ms.push(rotMes(a,i));return {meses:ms,nome:'em '+a};}
  for(let i=0;i<12;i++)if(new RegExp('\\b'+MES_EXT[i]+'\\b').test(t)){const ano=i>m?a-1:a;return {meses:[rotMes(ano,i)],nome:'em '+MES_EXT[i].replace('marco','março')};}
  return {meses:[rotMes(a,m)],nome:'este mês'};
}
/* quem: "a Kassiana", "ela", "o João", "eu" */
function pessoa(t){
  const pa=n(w.pesNome?w.pesNome('preta'):'kassiana').split(' ')[0],po=n(w.pesNome?w.pesNome('preto'):'joao').split(' ')[0];
  if(new RegExp('\\b('+pa+'|esposa|minha mulher|ela gastou)\\b').test(t))return 'preta';
  if(new RegExp('\\b('+po+'|eu gastei)\\b').test(t))return 'preto';
  return '';
}
/* categoria pedida: nome da categoria dito ou palavra que o app já reconhece */
function categoriaDe(t){
  const lista=cats();
  const dita=lista.find(c=>new RegExp('\\b'+n(c).replace(/[\/]/g,'.')+'\\b').test(t));if(dita)return {cat:dita};
  const m=t.match(/\b(?:com|de|em|no|na|nos|nas)\s+([a-z0-9 ]{3,40}?)(?:\s+(?:este|esse|neste|nesse|no|na|em|do|da|mes|ano|hoje)\b|[?!.]|$)/);
  const termo=m?m[1].replace(/\b(o|a|os|as)\b/g,'').trim():'';
  if(!termo||/^(mes|ano|casa|conta|contas)$/.test(termo))return {};
  const c=w.categorize?w.categorize(termo,-1):'Outros';
  return c&&c!=='Outros'?{cat:c,termo}:{termo};
}
const real=v=>(typeof brl==='function'?brl(v):'R$ '+(+v||0).toFixed(2));
const cats=()=>(typeof CATEGORIAS!=='undefined'?CATEGORIAS:[]);

/* ---------- respostas com os números do app (só leitura) ---------- */
function gastos(t){
  const p=periodo(t),q=pessoa(t),c=categoriaDe(t);
  const txs=(w.txSoma?w.txSoma(D.contas.transacoes||[]):[]).filter(x=>p.meses.includes(x.mes)&&(+x.amount||0)<0);
  const filtro=x=>c.cat?x.cat===c.cat:(c.termo?n(x.desc).includes(n(c.termo)):true);
  const sel=txs.filter(filtro);
  const val=x=>q?(w.valorDe?w.valorDe(x,q):0):Math.abs(+x.amount||0);
  const tot=sel.reduce((s,x)=>s+val(x),0);
  const sobre=c.cat?(' com '+c.cat):(c.termo?(' com “'+c.termo+'”'):'');
  const quem=q?(' de '+w.pesNome(q)):'';
  if(!txs.length)return {texto:'Ainda não há gastos importados '+p.nome+'. Importe o extrato ou lance pelo assistente.'};
  const top=sel.slice().sort((a,b)=>val(b)-val(a)).slice(0,5).map(x=>x.date+' · '+x.desc+' · '+real(val(x)));
  return {texto:'Gasto'+quem+sobre+' '+p.nome+': '+real(tot)+' em '+sel.length+' lançamento'+(sel.length===1?'':'s')+'.'+(q?' O que é dos dois conta pela metade.':''),itens:top};
}
function entradas(t){
  const p=periodo(t);
  const txs=(w.txSoma?w.txSoma(D.contas.transacoes||[]):[]).filter(x=>p.meses.includes(x.mes)&&(+x.amount||0)>0);
  const tot=txs.reduce((s,x)=>s+(+x.amount||0),0);
  return {texto:'Entradas '+p.nome+' (pelos extratos e lançamentos): '+real(tot)+' em '+txs.length+' lançamento'+(txs.length===1?'':'s')+'.'};
}
function emAberto(){
  const aberto=Math.max(0,contasMes()-pagoMes());
  const lista=(w.allBills?allBills():[]).filter(b=>!pagoGet(b.id)&&(+b.valor||0)>0)
    .map(b=>({...b,d:dueInfo(parseDay(b.venc))})).sort((a,b)=>(a.d==null?999:a.d)-(b.d==null?999:b.d));
  return {texto:'Falta pagar '+real(aberto)+' este mês, em '+lista.length+' conta'+(lista.length===1?'':'s')+'. Já foi pago '+real(pagoMes())+' de '+real(contasMes())+'.',
    itens:lista.slice(0,6).map(b=>b.nome+' ('+b.grupo+') · '+real(b.valor)+(b.d==null?'':b.d<0?' · venceu há '+(-b.d)+' dia(s)':b.d===0?' · vence hoje':' · vence em '+b.d+' dia(s)'))};
}
function vencimentos(){
  const lista=(w.allBills?allBills():[]).filter(b=>!pagoGet(b.id)&&(+b.valor||0)>0)
    .map(b=>({...b,d:dueInfo(parseDay(b.venc))})).filter(b=>b.d!=null&&b.d<=7).sort((a,b)=>a.d-b.d);
  if(!lista.length)return {texto:'Nenhuma conta em aberto vence nos próximos 7 dias.'};
  return {texto:lista.length+' conta'+(lista.length===1?' vence':'s vencem')+' até daqui a 7 dias (ou já venceram):',
    itens:lista.map(b=>b.nome+' ('+b.grupo+') · '+real(b.valor)+' · '+(b.d<0?'venceu há '+(-b.d)+' dia(s)':b.d===0?'vence hoje':'em '+b.d+' dia(s)'))};
}
function investimentos(t){
  if(/binance|cripto/.test(t))return {texto:'Na Binance: '+real(totBin())+'.'};
  if(/global|internacional|exterior|dolar|eua/.test(t))return {texto:'Na conta global: '+real(globBRL())+'.'};
  if(/nacional/.test(t))return {texto:'Na carteira nacional: '+real(totNac())+'.'};
  return {texto:'Total investido: '+real(invTotal())+'.',itens:['Nacional · '+real(totNac()),'Global · '+real(globBRL()),'Binance · '+real(totBin())]};
}
function aportes(t){
  const p=periodo(t);
  const lista=(D.invest.aportes||[]).filter(a=>p.meses.includes(a.mes));
  return {texto:'Aportes '+p.nome+': '+real(lista.reduce((s,a)=>s+(+a.valor||0),0))+' em '+lista.length+' aporte'+(lista.length===1?'':'s')+'.'};
}
/* "qual o valor da luz?", "conferir o aluguel", "quanto é a Copel?" */
const GRUPOS=[['casa','Casa'],['joao',null],['esposa',null],['empresa','Empresa JV'],['empresaKS','Studio'],['cartoes','Cartões']];
function contasCitadas(t){
  const achadas=[];const tipoT=w.tipoConta?tipoConta(t):'';
  GRUPOS.forEach(([k,rot])=>{(billsForMonth?billsForMonth(k):[]).forEach(b=>{
    const nb=n(b.nome);if(!nb)return;
    const porNome=nb.length>=3&&new RegExp('\\b'+nb.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b').test(t);
    const porTipo=tipoT&&w.tipoConta&&tipoConta(b.nome)===tipoT;
    if(porNome||porTipo)achadas.push({k,b,grupo:rot||(k==='esposa'?pesNome('preta'):pesNome('preto'))});
  });});
  return achadas;
}
function conferirConta(lista){
  const vistos=new Set();const itens=[];
  lista.forEach(({k,b,grupo})=>{
    if(['joao','esposa'].includes(k)&&w.ligacaoCasa){const orig=(D.contas[k]||[]).find(x=>x.id===b.id);if(orig&&ligacaoCasa(orig))return;}  // ligada: aparece pela Casa
    if(vistos.has(b.id))return;vistos.add(b.id);
    const v=k==='cartoes'?b.valor:b.valor,pg=pagoGet(b.id),d=dueInfo(parseDay(b.venc||b.melhorDia));
    const quem=k==='casa'&&w.quemPagaCasa?quemPagaCasa(b.id):'';
    itens.push(b.nome+' ('+grupo+') · '+real(v)+(b.venc?' · dia '+b.venc:'')+' · '+(pg?'paga':'em aberto'+(d!=null&&d<0?' (venceu)':''))+(quem?' · paga por '+quem:''));
  });
  if(!itens.length)return null;
  return {texto:itens.length===1?itens[0]+'.':'Achei '+itens.length+' contas com esse nome:',itens:itens.length>1?itens:null};
}
function sobra(){
  const r=rendaMes(),renda=(+r.joao||0)+(+r.esposa||0);
  if(!(renda>0))return {texto:'A renda do mês ainda não está cadastrada. Contas do mês: '+real(contasMes())+'.'};
  return {texto:'Renda '+real(renda)+' menos contas '+real(contasMes())+': sobra '+real(renda-contasMes())+' este mês.'};
}
const ABAS={'visao geral':'c-painel','resumo':'c-painel','painel':'c-painel','casa':'c-casa','cartoes':'c-cartao','cartao':'c-cartao','recebidos':'c-recebidos','categorias':'c-categorias',
  'kassiana':'c-esposa','joao':'c-joao','empresas':'c-empresa','patrimonio':'c-patrimonio','protecao':'c-protecao','anual':'c-anual','conselhos':'c-conselhos',
  'carteira':'i-carteira','aportes':'i-aportes','metas':'i-metas','investimentos':'i-painel','nuvem':'nuvem'};

/* ---------- entender a frase ---------- */
function entender(frase){
  const t=n(frase);if(!t)return {texto:'Fale ou escreva o que precisa.'};
  const pergunta=/\b(quanto|quantos|quantas|qual|quais|quando|falta|sobra|conferir|confere|confira|verificar|ver o valor|valor d[aeo]s?|tem quanto|o que vence)\b|\?/.test(t);
  if(/\b(extrato|extratos|fatura do banco|ofx|planilha|importar|enviar arquivo)\b/.test(t)&&!/\bquanto\b/.test(t))
    return {texto:'Como você quer mandar o extrato? Ele é lido aqui no aparelho e você confere antes de salvar.',acoes:[
      ['Arquivo do banco (OFX, CSV, PDF)',()=>{fechar();pickExtrato();}],['Foto do extrato',()=>{fechar();pickFotoExtrato();}],['Colar o texto',()=>{fechar();openPasteExtrato();}]]};
  const ab=t.match(/^(?:abrir|abre|abra|mostrar|mostra|mostre|ir para|vai para|va para)\s+(?:a |o |as |os |aba )?(.+)$/);
  if(ab){const k=Object.keys(ABAS).find(x=>n(ab[1]).startsWith(x));if(k){return {texto:'Abrindo '+k+'.',depois:()=>{fechar();irPara(ABAS[k]);}};}}
  if(pergunta){
    if(/\b(falta pagar|a pagar|em aberto|devendo|nao paguei|nao pago)\b/.test(t))return emAberto();
    if(/\b(vence|vencem|vencimento|proximas contas|proximos pagamentos)\b/.test(t)&&!contasCitadas(t).length)return vencimentos();
    if(/\b(sobra|sobrar|saldo previsto|renda)\b/.test(t))return sobra();
    if(/\b(aporte|aportes|aportei|aportamos|investi este|investimos este)\b/.test(t))return aportes(t);
    if(/\b(investido|investimento|investimentos|patrimonio|binance|cripto|carteira|global|nacional|exterior)\b/.test(t))return investimentos(t);
    if(/\b(ja paguei|ja pagamos|ja foi pago|pago este mes|paguei este mes)\b/.test(t))return {texto:'Já foi pago '+real(pagoMes())+' de '+real(contasMes())+' das contas deste mês.'};
    if(/\b(contas do mes|total das contas|total de contas|quanto sao as contas|contas este mes)\b/.test(t))return {texto:'Contas do mês: '+real(contasMes())+' (Casa '+real(casaTotal())+' + contas só de cada um). Já pago: '+real(pagoMes())+'.'};
    if(/\b(fatura|cartao|cartoes)\b/.test(t)&&!/\bgast/.test(t))return {texto:'Faturas dos cartões este mês: '+real(cartaoTotal())+'.'};
    if(/\b(recebi|recebemos|entrou|entraram|entradas|ganhei|ganhamos)\b/.test(t))return entradas(t);
    const cs=contasCitadas(t);
    if(cs.length&&!/\b(gastei|gastamos|gastou|gasto|gastos|despesa)\b/.test(t)){const r=conferirConta(cs);if(r)return r;}
    if(/\b(gastei|gastamos|gastou|gasto|gastos|despesa|despesas|paguei de|paguei com)\b/.test(t))return gastos(t);
    if(cs.length){const r=conferirConta(cs);if(r)return r;}
  }
  const l=w.parseLancamentoFalado?parseLancamentoFalado(frase):null;
  if(l&&!pergunta){
    return {texto:(l.tipo==='entrada'?'Entrada':'Gasto')+' de '+real(l.valor)+' em '+(l.tipo==='entrada'?'Entradas':l.cat)+'. Confere e confirme para salvar.'+(l.assumido?' Não ouvi “gastei” nem “recebi”, então assumi gasto.':''),
      lancamento:{tipo:l.tipo,valor:l.valor,desc:l.desc,cat:l.tipo==='entrada'?'Entradas':l.cat,date:hojeBR(),pes:pesDe(l.desc,D.contas.exPessoa),frase}};
  }
  return {texto:'Não entendi. Você pode lançar (“gastei 80 de farmácia”), perguntar (“quanto falta pagar?”, “quanto gastei com mercado este mês?”, “qual o valor da luz?”) ou mandar um extrato (“importar extrato”).'};
}

/* ---------- tela ---------- */
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function msg(quem,texto,itens){
  const box=$('jk-voz-conversa'),m=el('div','jk-voz-msg '+quem);m.append(el('p',null,texto));
  if(itens&&itens.length){const ul=el('ul');itens.forEach(i=>ul.append(el('li',null,i)));m.append(ul);}
  box.append(m);box.scrollTop=box.scrollHeight;return m;
}
function status(t){$('jk-voz-status').textContent=t||'';}
function sinal(){const p=$('jk-voz-painel'),b=$('jk-voz-botao'),o=String(!!st.rec),f=String(!!st.falando);
  p.dataset.ouvindo=o;p.dataset.falando=f;b.dataset.ouvindo=o;b.dataset.falando=f;
  $('jk-voz-falar').textContent=st.rec?'Parar de ouvir':'Falar';$('jk-voz-falar').setAttribute('aria-pressed',String(!!st.rec));}
const VOZES_MASC=['antonio','daniel','felipe','fabio','humberto','donato','julio','valerio','nicolau','thiago','eddy','reed','rocko','male','masculin'];
const VOZES_FEM=/luciana|francisca|fernanda|maria|heloisa|leticia|yara|camila|vitoria|thalita|brenda|elza|manuela|giovanna|leila|joana|catarina|flo\b|grandma|sandy|shelley|female|feminin|afs/;
function voz(u){
  let vs=[];try{vs=w.speechSynthesis.getVoices()||[];}catch(e){}
  const pt=vs.filter(v=>/^pt/i.test(v.lang||'')),br=pt.filter(v=>/br/i.test(v.lang||'')),nm=v=>n(v.name)+' '+n(v.voiceURI||'');
  let esc=null;for(const l of [br,pt])for(const m of VOZES_MASC){if(esc)break;esc=l.find(x=>nm(x).includes(m)&&!VOZES_FEM.test(nm(x)))||null;}
  const v=esc||br.find(x=>!VOZES_FEM.test(nm(x)))||br[0]||pt[0]||null;try{if(v)u.voice=v;}catch(e){}
  u.pitch=esc?0.95:0.8;u.lang='pt-BR';return u;
}
function podeFalar(){return $('jk-voz-ouvir').checked&&w.speechSynthesis&&w.SpeechSynthesisUtterance;}
function calar(){st.resposta=null;st.falando=false;try{if(w.speechSynthesis)w.speechSynthesis.cancel();}catch(e){}sinal();}
function dizer(texto,depois){
  if(!st.aberto||!texto||!podeFalar()){if(depois)depois();return;}
  calar();
  try{
    const u=voz(new w.SpeechSynthesisUtterance(String(texto).replace(/\s*[·—]\s*/g,', ')));st.resposta=u;
    let foi=false;const fim=()=>{if(foi)return;foi=true;if(st.resposta===u){st.resposta=null;st.falando=false;sinal();}if(depois)setTimeout(depois,300);};
    u.onstart=()=>{if(st.resposta===u){st.falando=true;sinal();}};u.onend=fim;u.onerror=fim;
    if(depois)setTimeout(fim,7000);   // se o aparelho não avisar o fim da fala
    w.speechSynthesis.speak(u);
  }catch(e){if(depois)depois();}
}
function microfoneOk(){return w.vozUsavel?vozUsavel():!!(w.SpeechRecognition||w.webkitSpeechRecognition);}
function ouvir(){
  if(st.rec){parar();return;}
  if(!microfoneOk()){status('Neste aparelho, toque no campo abaixo e use o microfone do teclado.');try{$('jk-voz-texto').focus();}catch(e){}return;}
  calar();
  const R=w.SpeechRecognition||w.webkitSpeechRecognition;let final='';
  try{
    const r=new R();st.rec=r;r.lang='pt-BR';r.interimResults=true;r.maxAlternatives=1;r.continuous=false;
    r.onresult=e=>{let parcial='';for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i];if(x.isFinal)final+=x[0].transcript;else parcial+=x[0].transcript;}
      $('jk-voz-texto').value=(final+parcial).trim();};
    r.onerror=e=>{status(e&&e.error==='not-allowed'?'O microfone não foi liberado. Use o microfone do teclado.':'Não consegui ouvir. Tente de novo ou escreva.');};
    r.onend=()=>{st.rec=null;sinal();const txt=$('jk-voz-texto').value.trim();if(final.trim()&&txt)enviar();else if(!txt)status('Não ouvi nada. Toque em Falar e fale de novo.');};
    r.start();status('Ouvindo… pode falar.');sinal();
  }catch(e){st.rec=null;sinal();status('Não consegui abrir o microfone. Use o microfone do teclado.');}
}
function parar(){try{if(st.rec)st.rec.stop();}catch(e){}st.rec=null;sinal();}
function limparPendente(){st.pend=null;$('jk-voz-previa').hidden=true;$('jk-voz-previa').replaceChildren();}
function previa(f){
  const box=$('jk-voz-previa');box.replaceChildren();box.hidden=false;st.pend={...f};
  const linha=(rot,campo,largo)=>{const l=el('label',largo?'jk-voz-largo':null,rot);l.append(campo);box.append(l);return campo;};
  const tipo=el('select');[['saida','Gasto'],['entrada','Entrada']].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;tipo.append(o);});tipo.value=f.tipo;
  const valor=el('input');valor.type='number';valor.step='0.01';valor.inputMode='decimal';valor.value=f.valor;
  const desc=el('input');desc.type='text';desc.maxLength=60;desc.value=f.desc;
  const cat=el('select');cats().forEach(c=>{const o=el('option',null,c);o.value=c;cat.append(o);});cat.value=f.cat;
  const quem=el('select');[['ambos','Os dois'],['preto',pesNome('preto')],['preta',pesNome('preta')]].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;quem.append(o);});quem.value=f.pes||'ambos';
  const data=el('input');data.type='text';data.value=f.date;data.inputMode='numeric';
  linha('Tipo',tipo);linha('Valor (R$)',valor);linha('Categoria',cat);linha('De quem',quem);linha('Descrição',desc);linha('Data',data);
  const sinc=()=>{st.pend={...st.pend,tipo:tipo.value,valor:+valor.value,desc:desc.value.trim(),cat:tipo.value==='entrada'?'Entradas':cat.value,pes:quem.value,date:data.value.trim()};if(tipo.value==='entrada')cat.value='Entradas';};
  [tipo,valor,desc,cat,quem,data].forEach(x=>x.addEventListener('input',sinc));[tipo,cat,quem].forEach(x=>x.addEventListener('change',sinc));
  const conf=el('button','jk-voz-confirmar','Confirmar e salvar');conf.type='button';conf.onclick=confirmar;
  const canc=el('button',null,'Cancelar');canc.type='button';canc.onclick=()=>{limparPendente();msg('assistente','Cancelado. Nada foi salvo.');status('');};
  const r=el('div','jk-voz-row');r.append(conf,canc);box.append(r);
  setTimeout(()=>{try{conf.focus({preventScroll:true});}catch(e){}},50);
}
function confirmar(){
  const f=st.pend;if(!f)return;
  if(!(f.valor>0)){status('Falta o valor.');return;}
  if(!/^\d{2}\/\d{2}\/\d{4}$/.test(f.date||'')){status('Confira a data: use dd/mm/aaaa.');return;}
  const r=gravarLancamentoFalado(f);limparPendente();
  const t=r.ok?(f.tipo==='entrada'?'Entrada':'Gasto')+' de '+real(f.valor)+' salvo em '+f.cat+'.'+(f.tipo==='entrada'?' Aparece em Recebidos e Categorias.':' Aparece em Categorias.')
    :'Esse lançamento já estava salvo. Nada foi duplicado.';
  msg('assistente',t);status(t);dizer(t);
}
function enviar(){
  const caixa=$('jk-voz-texto'),frase=caixa.value.trim();if(!frase){status('Fale ou escreva primeiro.');return;}
  parar();limparPendente();msg('voce',frase);caixa.value='';
  let r;try{r=entender(frase);}catch(e){r={texto:'Não consegui responder agora. Seus dados não foram alterados.'};}
  const m=msg('assistente',r.texto,r.itens);status('');
  if(r.acoes){const a=el('div','jk-voz-sugestoes');r.acoes.forEach(([rot,fn])=>{const b=el('button',null,rot);b.type='button';b.onclick=fn;a.append(b);});m.append(a);}
  if(r.lancamento)previa(r.lancamento);
  dizer(r.texto,r.depois);
}
function abrir(saudar){
  if(st.aberto)return;st.aberto=true;st.ultimoFoco=document.activeElement;
  $('jk-voz-painel').hidden=false;document.body.classList.add('jk-voz-aberto');
  if(!$('jk-voz-conversa').children.length)msg('assistente','Olá! Posso lançar um gasto ou uma entrada, responder sobre as contas e os investimentos, ou receber um extrato.');
  sugestoes();
  if(saudar){
    // a saudação libera a voz no iPhone (precisa vir de um toque) e, ao terminar, começa a ouvir
    dizer('Olá! Em que posso ajudar?',()=>{if(st.aberto&&!st.rec&&!st.pend)ouvir();});
    if(!podeFalar()&&microfoneOk())ouvir();
  }
  if(!microfoneOk())setTimeout(()=>{try{$('jk-voz-texto').focus();}catch(e){}},60);
}
function fechar(){
  if(!st.aberto)return;st.aberto=false;parar();calar();limparPendente();
  $('jk-voz-painel').hidden=true;document.body.classList.remove('jk-voz-aberto');
  $('jk-voz-conversa').replaceChildren();status('');$('jk-voz-texto').value='';   // nada da conversa fica guardado
  try{if(st.ultimoFoco&&st.ultimoFoco.focus)st.ultimoFoco.focus();}catch(e){}
}
const SUGESTOES=['Quanto falta pagar?','O que vence esta semana?','Quanto gastei com mercado este mês?','Qual o valor da luz?','Quanto tenho investido?','Importar extrato'];
function sugestoes(){
  const box=$('jk-voz-conversa');if(box.querySelector('.jk-voz-sugestoes.ini'))return;
  const s=el('div','jk-voz-sugestoes ini');SUGESTOES.forEach(t=>{const b=el('button',null,t);b.type='button';b.onclick=()=>{$('jk-voz-texto').value=t;enviar();};s.append(b);});box.append(s);
}
/* tocar abre; arrastar (mais de 8 px) muda o lugar, guardado só neste aparelho */
function arrastavel(bt,chave){
  let ini=null,arr=false,soltou=false;
  const lim=(x,y)=>{const m=8,wd=bt.offsetWidth||56,h=bt.offsetHeight||56;return [Math.min(Math.max(m,x),innerWidth-wd-m),Math.min(Math.max(48,y),innerHeight-h-m)];};
  const por=(x,y)=>{[x,y]=lim(x,y);bt.style.left=x+'px';bt.style.top=y+'px';bt.style.right='auto';bt.style.bottom='auto';};
  const lida=()=>{try{const p=JSON.parse(localStorage.getItem(chave)||'null');return p&&isFinite(p.x)&&isFinite(p.y)?p:null;}catch(e){return null;}};
  const aplicar=()=>{const p=lida();if(p&&bt.offsetWidth)por(p.x*innerWidth,p.y*innerHeight);};
  bt.style.touchAction='none';
  bt.addEventListener('pointerdown',e=>{if(e.button>0)return;const r=bt.getBoundingClientRect();ini={x:e.clientX,y:e.clientY,dx:e.clientX-r.left,dy:e.clientY-r.top,id:e.pointerId};arr=false;try{bt.setPointerCapture(e.pointerId);}catch(x){}});
  bt.addEventListener('pointermove',e=>{if(!ini||e.pointerId!==ini.id)return;if(!arr&&Math.hypot(e.clientX-ini.x,e.clientY-ini.y)<8)return;if(!arr){arr=true;bt.classList.add('arrastando');}e.preventDefault();por(e.clientX-ini.dx,e.clientY-ini.dy);});
  const solta=e=>{if(!ini||(e&&e.pointerId!==ini.id))return;if(arr){const r=bt.getBoundingClientRect();try{localStorage.setItem(chave,JSON.stringify({x:r.left/innerWidth,y:r.top/innerHeight}));}catch(x){}soltou=true;setTimeout(()=>{soltou=false;},350);}bt.classList.remove('arrastando');ini=null;arr=false;};
  bt.addEventListener('pointerup',solta);bt.addEventListener('pointercancel',solta);
  bt.addEventListener('click',e=>{if(soltou){soltou=false;e.stopImmediatePropagation();e.preventDefault();}},true);
  addEventListener('resize',aplicar);aplicar();
}
function init(){
  if(!$('jk-voz-botao'))return;
  arrastavel($('jk-voz-botao'),'jk-voz-posicao');
  $('jk-voz-botao').onclick=()=>abrir(true);
  $('jk-voz-fechar').onclick=fechar;
  $('jk-voz-circulo').onclick=()=>{if(st.falando)calar();else ouvir();};
  $('jk-voz-falar').onclick=ouvir;
  $('jk-voz-enviar').onclick=enviar;
  $('jk-voz-texto').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar();}});
  $('jk-voz-painel').addEventListener('click',e=>{if(e.target===$('jk-voz-painel'))fechar();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&st.aberto)fechar();});
  try{if(w.speechSynthesis)w.speechSynthesis.getVoices();}catch(e){}
  $('jk-voz-botao').hidden=false;
}
w.JKVoz={entender,abrir,fechar,enviar,confirmar};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

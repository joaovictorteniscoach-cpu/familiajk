'use strict';
/* Créditos fixos — cálculo isolado, sem acesso à nuvem, DOM ou cadastros.
 * Fase de conferência: este módulo NÃO é carregado pelos apps publicados.
 * Quantidades: milésimos de crédito; valores: centavos inteiros.
 */
const ESCALA=1000;
const clone=x=>JSON.parse(JSON.stringify(x));
const erro=m=>{throw new Error(m);};
function texto(x,n){if(typeof x!=='string'||!x.trim()||x.length>200)erro(n+' inválido');return x;}
function inteiro(x,n,min=0){if(!Number.isSafeInteger(x)||x<min)erro(n+' inválido');return x;}
function soma(xs){return xs.reduce((a,b)=>inteiro(a+b,'Soma'),0);}
function unidades(x){
 if(typeof x!=='number'||!Number.isFinite(x)||x<0||Math.abs(x*ESCALA-Math.round(x*ESCALA))>1e-7)erro('Quantidade exige até três casas decimais');
 return inteiro(Math.round(x*ESCALA),'Quantidade');
}
function competencia(x){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(x)||Number(x.slice(0,4))<1900)erro('Competência inválida');return x;}
function data(x){
 if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x))erro('Data inválida');
 competencia(x.slice(0,7));const [a,m,d]=x.split('-').map(Number),t=new Date(Date.UTC(a,m-1,d));
 if(t.getUTCFullYear()!==a||t.getUTCMonth()!==m-1||t.getUTCDate()!==d)erro('Data inválida');
 return x;
}
function arredondarRazao(n,d){
 if(n<0n||d<=0n)erro('Razão inválida');
 const r=(n+d/2n)/d;if(r>BigInt(Number.MAX_SAFE_INTEGER))erro('Valor excede o limite');
 return Number(r);
}
function valorExtra(valorCentavos,creditos,quantidade){
 inteiro(valorCentavos,'Valor do plano',1);const q=unidades(creditos),uso=unidades(quantidade);
 if(!q)erro('Plano sem créditos');
 return arredondarRazao(BigInt(valorCentavos)*BigInt(uso),BigInt(q));
}
function planosValidos(planos){
 if(!Array.isArray(planos)||!planos.length)erro('Informe os planos');
 const ids=new Set();
 return planos.map(p=>{
  texto(p.id,'Plano');texto(p.pagadorId,'Pagador');texto(p.modalidade,'Modalidade');
  if(ids.has(p.id))erro('Plano repetido');ids.add(p.id);
  const q=unidades(p.creditos);if(!q)erro('Plano sem créditos');
  inteiro(p.valorCentavos,'Valor do plano',1);
  if(!['pessoa','sessao'].includes(p.unidade))erro('Defina consumo por pessoa ou por sessão');
  if(!Array.isArray(p.alunoIds)||!p.alunoIds.length||new Set(p.alunoIds).size!==p.alunoIds.length)erro('Participantes inválidos');
  p.alunoIds.forEach(id=>texto(id,'Aluno'));
  return {...clone(p),q};
 });
}
/* Renovação apenas do novo modelo: adiciona, nunca zera o saldo anterior.
 * Uma competência/contrato entra uma vez. Repetição com valor diferente bloqueia.
 * Não é uma função de migração dos quatro saldos legados.
 */
function renovar(estado,planos,mes,validade){
 competencia(mes);const ps=planosValidos(planos);
 if(!validade||!Object.hasOwn(validade,'meses')||!(validade.meses===null||Number.isSafeInteger(validade.meses)&&validade.meses>0&&validade.meses<=120))erro('Defina a validade antes de renovar');
 const antes=clone(estado||{compras:[],lotes:[]}),e=clone(antes);
 if(!Array.isArray(e.compras)||!Array.isArray(e.lotes))erro('Estado inválido');
 for(const p of ps){
  const id=JSON.stringify([p.id,mes]),assinatura=JSON.stringify([p.pagadorId,p.modalidade,p.creditos,p.valorCentavos,p.unidade,p.alunoIds.slice().sort(),validade]);
  const ja=e.compras.find(c=>c.id===id);
  if(ja){if(ja.assinatura!==assinatura)erro('Renovação já existe com outro contrato');continue;}
  let venceEm=null;
  if(validade.meses!==null){
   const [a,m]=mes.split('-').map(Number),d=new Date(Date.UTC(a,m-1+validade.meses,0));
   venceEm=d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
  }
  if(e.lotes.some(l=>l.id===id))erro('Lote já existe sem compra correspondente');
  e.compras.push({id,assinatura,mes,planoId:p.id,pagadorId:p.pagadorId,valorCentavos:p.valorCentavos});
  e.lotes.push({id,planoId:p.id,modalidade:p.modalidade,quantidade:p.creditos,origem:mes,venceEm,uso:'regular-ou-extra'});
 }
 return e;
}
/* Simulação de UMA competência nova. saldoInicial contém só direitos trazidos
 * de antes dessa competência. As novas compras entram aqui exatamente uma vez.
 * A agenda precisa conter as primeiras datas, inclusive canceladas, para que
 * a quinta continue identificada como extra e um cancelamento libere o direito.
 * Aula agendada reserva; somente realizada é débito efetivo.
 */
function simular(entrada){
 const {mes,planos,lotes=[],aulas=[]}=entrada;competencia(mes);
 const ps=planosValidos(planos),map=new Map(ps.map(p=>[p.id,p]));
 if(!Array.isArray(lotes)||!Array.isArray(aulas))erro('Listas inválidas');
 const ids=new Set(),ls=lotes.map(l=>{
  texto(l.id,'Lote');if(ids.has(l.id))erro('Lote repetido');ids.add(l.id);
  const p=map.get(l.planoId);if(!p||l.modalidade!==p.modalidade)erro('Lote sem modalidade comprovada');
  if(l.origem!==null){competencia(l.origem);if(l.origem>=mes)erro('Saldo inicial já contém a compra do mês simulado');}
  if(!Object.hasOwn(l,'venceEm'))erro('Validade não informada');
  if(l.venceEm!==null)data(l.venceEm);
  return {...clone(l),restante:unidades(l.quantidade),usado:0,debito:0};
 });
 ls.sort((a,b)=>String(a.venceEm||'9999-12-31').localeCompare(String(b.venceEm||'9999-12-31'))||String(a.origem||'').localeCompare(String(b.origem||''))||a.id.localeCompare(b.id));
 const vistos=new Map(),sessoes=new Map(),aulasUnicas=[];
 for(const a of aulas){
  texto(a.id,'Aula');texto(a.alunoId,'Aluno');data(a.data);
  if(a.data.slice(0,7)!==mes)erro('Aula fora da competência');
  const p=map.get(a.planoId);if(!p||!p.alunoIds.includes(a.alunoId))erro('Aula fora do contrato');
  if(!['realizada','agendada','cancelada'].includes(a.estado))erro('Estado da aula inválido');
  if(a.extra!==undefined&&typeof a.extra!=='boolean')erro('Identificação de extra inválida');
  const c=unidades(a.custo===undefined?1:a.custo);if(!c)erro('Aula sem consumo');
  const assinatura=JSON.stringify(a);
  if(vistos.has(a.id)){if(vistos.get(a.id)!==assinatura)erro('Aula duplicada com dados diferentes');continue;}
  vistos.set(a.id,assinatura);
  if(p.unidade==='sessao'){
   texto(a.sessaoId,'Sessão familiar');
   const chave=JSON.stringify([p.id,a.sessaoId]),anterior=sessoes.get(chave);
   if(anterior){
    if(anterior.data!==a.data||anterior.estado!==a.estado||anterior.c!==c||!!anterior.extra!==!!a.extra)erro('Sessão familiar com informações divergentes');
    continue;
   }
   sessoes.set(chave,{...a,c});
  }
  aulasUnicas.push({...clone(a),c});
 }
 aulasUnicas.sort((a,b)=>a.data.localeCompare(b.data)||String(a.hora||'').localeCompare(String(b.hora||''))||a.id.localeCompare(b.id));
 const linhas=[],contas=[];
 for(const p of ps){
  let cobertura=p.q,regular=0,debitoRegular=0;
  const aa=aulasUnicas.filter(a=>a.planoId===p.id).map(a=>{
   const incluida=a.extra?0:Math.min(a.c,cobertura);cobertura-=incluida;
   if(a.estado!=='cancelada'){regular+=incluida;if(a.estado==='realizada')debitoRegular+=incluida;}
   return {...a,incluida};
  });
  let livrePlano=p.q-regular,planoExtra=0,debitoPlanoExtra=0,extraPago=0,extraRealizado=0,acumUsado=0;
  const alocadas=[];
  for(const a of aa){
   let falta=a.estado==='cancelada'?0:a.c-a.incluida;
   const partes=[];
   for(const l of ls){
    if(!falta)break;if(l.planoId!==p.id||l.venceEm&&l.venceEm<a.data)continue;
    const uso=Math.min(falta,l.restante);
    if(uso){l.restante-=uso;l.usado+=uso;if(a.estado==='realizada')l.debito+=uso;falta-=uso;acumUsado+=uso;partes.push({loteId:l.id,unidades:uso,origem:l.origem,venceEm:l.venceEm});}
   }
   const doPlano=Math.min(falta,livrePlano);livrePlano-=doPlano;planoExtra+=doPlano;falta-=doPlano;
   if(a.estado==='realizada'){debitoPlanoExtra+=doPlano;extraRealizado+=falta;}
   const anterior=valorExtra(p.valorCentavos,p.creditos,extraPago/ESCALA);
   extraPago+=falta;
   const cobrado=valorExtra(p.valorCentavos,p.creditos,extraPago/ESCALA)-anterior;
   const linha={id:a.id,planoId:p.id,alunoId:a.alunoId,data:a.data,estado:a.estado,custo:a.c/ESCALA,
    incluidos:a.estado==='cancelada'?0:a.incluida/ESCALA,acumulados:partes.reduce((n,l)=>n+l.unidades,0)/ESCALA,
    creditoLivreDoPlano:doPlano/ESCALA,extraAPagar:falta/ESCALA,valorExtraCentavos:cobrado,lotes:partes};
   linhas.push(linha);alocadas.push(linha);
  }
  const originais=ls.filter(l=>l.planoId===p.id);
  const saldoAnt=soma(originais.map(l=>unidades(l.quantidade)));
  const saldoFuturo=soma(originais.map(l=>l.restante))+livrePlano;
  const usadosEfetivos=soma(originais.map(l=>l.debito))+debitoRegular+debitoPlanoExtra;
  contas.push({planoId:p.id,pagadorId:p.pagadorId,modalidade:p.modalidade,
   saldoAnterior:saldoAnt/ESCALA,compraDoMes:p.creditos,regular:regular/ESCALA,extraComCredito:(acumUsado+planoExtra)/ESCALA,
   extraAPagar:extraPago/ESCALA,extraRealizado:extraRealizado/ESCALA,valorPlanoCentavos:p.valorCentavos,
   valorExtraPrevistoCentavos:valorExtra(p.valorCentavos,p.creditos,extraPago/ESCALA),
   valorExtraRealizadoCentavos:valorExtra(p.valorCentavos,p.creditos,extraRealizado/ESCALA),
   saldoAtual:(saldoAnt+p.q-usadosEfetivos)/ESCALA,saldoAposTodasAsAulas:saldoFuturo/ESCALA,
   reservados:alocadas.filter(a=>a.estado==='agendada').reduce((n,a)=>n+a.incluidos+a.acumulados+a.creditoLivreDoPlano,0)});
 }
 const pagadores=[...new Set(contas.map(c=>c.pagadorId))].map(id=>{
  const cs=contas.filter(c=>c.pagadorId===id);
  const base=soma(cs.map(c=>c.valorPlanoCentavos)),extra=soma(cs.map(c=>c.valorExtraPrevistoCentavos));
  return {pagadorId:id,mensalidadeCentavos:base,extrasPrevistosCentavos:extra,totalPrevistoCentavos:soma([base,extra]),
   extrasRealizadosCentavos:soma(cs.map(c=>c.valorExtraRealizadoCentavos))};
 });
 return {mes,contas,pagadores,linhas,lotes:ls.map(l=>({...l,quantidade:l.restante/ESCALA}))};
}
/* Conferência do extrato LEGADO. Não corrige; saldo inicial nunca é zero
 * presumido. Matemática consistente não prova a origem comercial do direito.
 * Um 'resumo' perdeu datas e pode mudar a validade; não é prova de migração.
 */
function auditar(aluno,movs){
 if(!aluno||!Array.isArray(movs))erro('Dados de conferência inválidos');
 const pendencias=[],campos=[];
 for(const campo of ['creditos','credGrupo','repos','locCred']){
  const saldo=Number(aluno[campo]===undefined?0:aluno[campo]);
  if(!Number.isFinite(saldo)){pendencias.push(campo+': saldo inválido');continue;}
  const ms=movs.filter(m=>m.alunoId===aluno.id&&m.campo===campo).slice().sort((a,b)=>a.ts-b.ts);
  if(saldo<0)pendencias.push(campo+': saldo negativo exige conciliar aulas e recebimentos');
  let anterior=null,abertura=null,fechamento=null;
  for(const m of ms){
   const nums=[m.de,m.delta,m.para];
   if(nums.some(n=>typeof n!=='number'||!Number.isFinite(n))||!Number.isFinite(m.ts)||m.ts<=0){pendencias.push(campo+': movimento sem valores/data comprovados');anterior=null;continue;}
   const [de,delta,para]=nums.map(n=>Math.round(n*ESCALA));
   if(nums.some((n,i)=>Math.abs(n*ESCALA-[de,delta,para][i])>1e-7))pendencias.push(campo+': precisão não suportada');
   if(de+delta!==para)pendencias.push(campo+': de + alteração difere de para');
   if(anterior!==null&&anterior!==de)pendencias.push(campo+': há intervalo sem movimento no extrato');
   if(abertura===null){abertura=de;if(de!==0)pendencias.push(campo+': saldo de abertura precisa de documento anterior');}
   anterior=para;fechamento=para;
   if(m.ref==='resumo')pendencias.push(campo+': extrato resumido perdeu origem e validade');
   if(!String(m.motivo||'').trim()||/^(ajuste|manual|saldo|corre[cç][aã]o|—)[.! ]*$/i.test(String(m.motivo).trim()))pendencias.push(campo+': ajuste sem razão específica');
  }
  if(!ms.length&&saldo!==0)pendencias.push(campo+': saldo sem extrato de origem');
  if(fechamento!==null&&fechamento!==Math.round(saldo*ESCALA))pendencias.push(campo+': cadastro difere do último movimento');
  campos.push({campo,saldo,abertura:abertura===null?null:abertura/ESCALA,fechamento:fechamento===null?null:fechamento/ESCALA,movimentos:ms.length});
 }
 if(Number(aluno.plano)>0&&Number(aluno.planoGrupo)>0)pendencias.push('Pacote misto: confirmar preço e lotes de cada modalidade; média proibida');
 if(aluno.responsavelId)pendencias.push('Família: conferir responsável e consumo por pessoa ou sessão');
 if(aluno.status==='parcial'&&!aluno.pagamentosExatos)pendencias.push('Pagamento parcial sem valor exato comprovado');
 if(Number(aluno.repos)>0)pendencias.push('Saldo antigo: comprovar modalidade e validade de cada lote');
 return {alunoId:aluno.id,campos,pendencias:[...new Set(pendencias)],podeMigrar:false,
  aviso:'Conferência somente. Não comprova pagamento nem autoriza migrar saldos.'};
}
module.exports=Object.freeze({ESCALA,unidades,valorExtra,renovar,simular,auditar});

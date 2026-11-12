'use strict';
const assert=require('node:assert/strict');
const {simular,renovar,valorExtra,auditar}=require('./creditos-fixos.cjs');
let feitos=0;
function teste(nome,fn){fn();feitos++;console.log('PASS '+nome);}
const plano=(mud={})=>({id:'p',pagadorId:'a',modalidade:'particular',creditos:4,valorCentavos:64000,unidade:'pessoa',alunoIds:['a'],...mud});
const aulas=(n,op={})=>Array.from({length:n},(_,i)=>({id:'a'+i,planoId:'p',alunoId:'a',data:'2027-01-'+String(2+i*4).padStart(2,'0'),estado:'realizada',...op}));
const lote=(q,op={})=>({id:'l',planoId:'p',modalidade:'particular',quantidade:q,origem:'2026-12',venceEm:'2027-03-31',...op});
const sim=(op={})=>simular({mes:'2027-01',planos:[plano()],lotes:[],aulas:aulas(5),...op});
teste('4 créditos, cinco aulas sem saldo: quinta pelo valor unitário',()=>{
 const x=sim();assert.equal(x.pagadores[0].totalPrevistoCentavos,80000);assert.equal(x.contas[0].extraAPagar,1);assert.equal(x.contas[0].saldoAposTodasAsAulas,0);
});
teste('saldo antigo cobre apenas a extra; mensalidade permanece integral',()=>{
 const x=sim({lotes:[lote(10)]});assert.equal(x.pagadores[0].totalPrevistoCentavos,64000);assert.equal(x.contas[0].saldoAposTodasAsAulas,9);assert.equal(x.contas[0].regular,4);
});
teste('cancelar uma das primeiras quatro libera crédito para a quinta',()=>{
 const aa=aulas(5);aa[1].estado='cancelada';const x=sim({aulas:aa});assert.equal(x.pagadores[0].totalPrevistoCentavos,64000);assert.equal(x.linhas[4].creditoLivreDoPlano,1);assert.equal(x.contas[0].saldoAposTodasAsAulas,0);
});
teste('aula não feita permanece, sem bônus por cancelamento ou chuva',()=>{
 const aa=aulas(4);aa[0].estado='cancelada';const x=sim({aulas:aa,lotes:[lote(1)]});assert.equal(x.contas[0].saldoAtual,2);assert.equal(x.contas[0].saldoAposTodasAsAulas,2);
});
teste('agendada reserva, não debita nem inventa recebimento',()=>{
 const x=sim({aulas:aulas(5,{estado:'agendada'}),lotes:[lote(1)]});assert.equal(x.contas[0].saldoAtual,5);assert.equal(x.contas[0].reservados,5);assert.equal(x.pagadores[0].extrasRealizadosCentavos,0);assert.equal(x.contas[0].saldoAposTodasAsAulas,0);
});
teste('dupla, trio, quarteto e família usam o unitário do próprio contrato',()=>{
 for(const modalidade of ['dupla','trio','quarteto','familia']){
  const x=sim({planos:[plano({modalidade,valorCentavos:27000})]});assert.equal(x.pagadores[0].totalPrevistoCentavos,33750);
 }
});
teste('família por sessão: dois participantes, uma mensalidade e uma aula extra',()=>{
 const p=plano({modalidade:'familia',unidade:'sessao',alunoIds:['a','b'],pagadorId:'r'});
 const aa=aulas(5).flatMap(a=>[{...a,sessaoId:a.id},{...a,id:a.id+'b',alunoId:'b',sessaoId:a.id}]);
 const x=sim({planos:[p],aulas:aa});assert.equal(x.pagadores.length,1);assert.equal(x.linhas.length,5);assert.equal(x.pagadores[0].totalPrevistoCentavos,80000);
});
teste('família por pessoa: consumo individual explícito e só um pagador',()=>{
 const ps=[plano({pagadorId:'r'}),plano({id:'p2',alunoIds:['b'],pagadorId:'r',valorCentavos:32000})];
 const aa=[...aulas(5),...aulas(4).map(a=>({...a,id:a.id+'b',alunoId:'b',planoId:'p2'}))];
 const x=sim({planos:ps,aulas:aa});assert.equal(x.pagadores.length,1);assert.equal(x.pagadores[0].mensalidadeCentavos,96000);assert.equal(x.pagadores[0].totalPrevistoCentavos,112000);
});
teste('família com sessão divergente bloqueia, não escolhe uma versão',()=>{
 const aa=aulas(1).flatMap(a=>[{...a,sessaoId:'s'},{...a,id:'b',alunoId:'b',sessaoId:'s',estado:'cancelada'}]);
 assert.throws(()=>sim({planos:[plano({unidade:'sessao',alunoIds:['a','b']})],aulas:aa}),/divergentes/);
});
teste('misto: particular e dupla não usam valor médio nem trocam créditos',()=>{
 const ps=[plano(),plano({id:'g',modalidade:'dupla',valorCentavos:32000})];
 const aa=[...aulas(5),...aulas(5).map(a=>({...a,id:'g'+a.id,planoId:'g'}))];
 const x=sim({planos:ps,aulas:aa,lotes:[lote(1)]});assert.equal(x.pagadores[0].totalPrevistoCentavos,104000);assert.equal(x.contas[0].extraAPagar,0);assert.equal(x.contas[1].extraAPagar,1);assert.equal(x.contas[1].valorExtraPrevistoCentavos,8000);
 assert.throws(()=>sim({lotes:[lote(1,{modalidade:'dupla'})]}),/modalidade/);
});
teste('735 / 4 = 183,75; 70 × 1,25 = 87,50',()=>{
 assert.equal(valorExtra(73500,4,1),18375);assert.equal(valorExtra(7000,1,1.25),8750);
});
teste('frações de centavo arredondam no total da modalidade: três extras dão 100',()=>{
 const x=sim({planos:[plano({creditos:3,valorCentavos:10000})],aulas:aulas(6)});assert.equal(x.pagadores[0].extrasPrevistosCentavos,10000);
 assert.equal(x.linhas.reduce((s,l)=>s+l.valorExtraCentavos,0),10000);
});
teste('lote vencido não paga aula; data de validade não é rejuvenescida',()=>{
 const l=lote(1,{venceEm:'2026-12-31'}),antes=JSON.stringify(l);const x=sim({lotes:[l]});assert.equal(x.contas[0].extraAPagar,1);assert.equal(JSON.stringify(l),antes);assert.equal(x.lotes[0].venceEm,'2026-12-31');
});
teste('validade inclui o último dia; FIFO usa vencimento mais próximo',()=>{
 const aa=aulas(1,{extra:true,data:'2027-01-02'});
 const x=sim({aulas:aa,lotes:[lote(1,{id:'mais',venceEm:'2027-03-31'}),lote(1,{id:'antes',venceEm:'2027-01-02'})]});assert.equal(x.linhas[0].lotes[0].loteId,'antes');
});
teste('origem antiga desconhecida fica preservada; falta de validade bloqueia',()=>{
 const x=sim({lotes:[lote(1,{origem:null,venceEm:null})]});assert.equal(x.contas[0].extraAPagar,0);assert.equal(x.lotes[0].origem,null);
 const l=lote(1);delete l.venceEm;assert.throws(()=>sim({lotes:[l]}),/Validade/);
});
teste('renovação soma pacote, preserva lote e repetições são idempotentes',()=>{
 const anterior={compras:[],lotes:[lote(2)]},antes=JSON.stringify(anterior),p=[plano()];
 const um=renovar(anterior,p,'2027-01',{meses:4}),dois=renovar(um,p,'2027-01',{meses:4});
 assert.equal(JSON.stringify(um),JSON.stringify(dois));assert.equal(um.lotes.reduce((s,l)=>s+l.quantidade,0),6);assert.equal(JSON.stringify(anterior),antes);assert.equal(um.lotes[0].venceEm,'2027-03-31');
});
teste('renovação em lote repetida após individual não duplica',()=>{
 const p1=plano(),p2=plano({id:'b',alunoIds:['b'],pagadorId:'b'});
 const um=renovar(null,[p1],'2027-01',{meses:4}),loteNovo=renovar(um,[p1,p2],'2027-01',{meses:4});
 assert.equal(loteNovo.compras.length,2);assert.equal(loteNovo.lotes.reduce((s,l)=>s+l.quantidade,0),8);
});
teste('mesma compra com outro valor ou modalidade bloqueia',()=>{
 const x=renovar(null,[plano()],'2027-01',{meses:4});
 assert.throws(()=>renovar(x,[plano({valorCentavos:65000})],'2027-01',{meses:4}),/outro contrato/);
});
teste('virada do ano não zera nem altera validade dos direitos antigos',()=>{
 const x=renovar(null,[plano()],'2026-12',{meses:4}),y=renovar(x,[plano()],'2027-01',{meses:4});
 assert.equal(y.lotes.length,2);assert.equal(y.lotes[0].quantidade,4);assert.equal(y.lotes[0].venceEm,'2027-03-31');assert.equal(y.compras.reduce((s,c)=>s+c.valorCentavos,0),128000);
});
teste('não impõe validade nova por omissão',()=>assert.throws(()=>renovar(null,[plano()],'2027-01'),/validade/));
teste('aula repetida idêntica não duplica; versão divergente é bloqueada',()=>{
 const aa=aulas(5),x=sim({aulas:aa.concat(aa[4])});assert.equal(x.linhas.length,5);
 assert.throws(()=>sim({aulas:aa.concat({...aa[4],estado:'cancelada'})}),/duplicada/);
});
teste('não aceita compra do mês duas vezes no saldo inicial',()=>{
 assert.throws(()=>sim({lotes:[lote(4,{origem:'2027-01'})]}),/compra do mês/);
});
teste('não aceita crédito negativo, valores inválidos, data impossível ou outro aluno',()=>{
 assert.throws(()=>valorExtra(1.5,4,1));assert.throws(()=>valorExtra(64000,0,1));assert.throws(()=>valorExtra(64000,4,-1));
 assert.throws(()=>sim({aulas:aulas(1,{data:'2027-01-32'})}));
 assert.throws(()=>sim({aulas:aulas(1,{alunoId:'intruso'})}));
});
teste('auditoria não presume saldo de abertura zero e nunca libera migração',()=>{
 const a={id:'a',creditos:3};const x=auditar(a,[{alunoId:'a',campo:'creditos',de:4,delta:-1,para:3,ts:1,motivo:'Aula realizada'}]);
 assert.ok(x.pendencias.some(p=>/abertura/.test(p)));assert.equal(x.podeMigrar,false);
});
teste('auditoria encontra cadeia interrompida, saldo divergente e resumo de lotes',()=>{
 const a={id:'a',repos:3};const ms=[{alunoId:'a',campo:'repos',de:0,delta:1,para:1,ts:1,motivo:'Chuva confirmada',ref:'resumo'},
 {alunoId:'a',campo:'repos',de:2,delta:2,para:4,ts:2,motivo:'ajuste'}];const x=auditar(a,ms);
 for(const t of ['intervalo','difere','resumido','razão','modalidade'])assert.ok(x.pendencias.some(p=>p.includes(t)));
});
teste('parcial sem recebimento exato não vira 50% confirmado',()=>{
 const x=auditar({id:'a',status:'parcial'},[]);assert.ok(x.pendencias.some(p=>/valor exato/.test(p)));
});
teste('entradas não mudam: planos, aulas, lotes e movimentos',()=>{
 const e={mes:'2027-01',planos:[plano()],lotes:[lote(1)],aulas:aulas(5)},antes=JSON.stringify(e);simular(e);assert.equal(JSON.stringify(e),antes);
 const a={id:'a',creditos:2},ms=[],src=JSON.stringify([a,ms]);auditar(a,ms);assert.equal(JSON.stringify([a,ms]),src);
});
teste('conservação de créditos em 600 combinações; fatura nunca abaixo da base',()=>{
 for(let saldo=0;saldo<10;saldo++)for(let n=0;n<10;n++)for(let canc=0;canc<6;canc++){
  const aa=aulas(n).map((a,i)=>({...a,data:'2027-01-'+String(i+1).padStart(2,'0'),estado:i<canc?'cancelada':'realizada'}));
  const x=sim({lotes:saldo?[lote(saldo)]:[],aulas:aa}),c=x.contas[0],usadas=aa.filter(a=>a.estado!=='cancelada').length;
  assert.equal(c.saldoAposTodasAsAulas,saldo+4+c.extraAPagar-usadas);assert.ok(c.saldoAposTodasAsAulas>=0);assert.ok(x.pagadores[0].totalPrevistoCentavos>=64000);
 }
});
console.log('Créditos fixos: '+feitos+' cenários aprovados. Dados fictícios; nenhuma migração.');

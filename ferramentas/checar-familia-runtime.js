/* Plano família: regressões financeiras com dados fictícios, sem rede. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const gest=fs.readFileSync(path.join(root,'app-gestao/lib/app-gestao.js'),'utf8');
const al=fs.readFileSync(path.join(root,'app-aluno/index.html'),'utf8');
function fn(source,name){
  const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);
  const endLine=source.indexOf('\n',start),first=source.slice(start,endLine);
  return first.endsWith('}')?first:source.slice(start,source.indexOf('\n}',start)+2);
}
let count=0;
function check(label,f){f();count++;console.log('✅ '+label);}
const payer={id:'fam-p',codigo:'9901',nome:'Responsável de Teste',tipo:'Particular',plano:4,creditos:2,repos:1,mensalidade:1200,status:'pendente',diaVenc:15,valorAula:160};
const child={id:'fam-c',codigo:'9902',nome:'Filho de Teste',tipo:'Particular',plano:3,creditos:1.5,repos:2,mensalidade:0,status:'pendente',valorAula:160,responsavelId:payer.id,parentesco:'Filho(a)'};
const spouse={...child,id:'fam-s',codigo:'9903',nome:'Cônjuge de Teste',parentesco:'Cônjuge',plano:4,creditos:3};
const single={...payer,id:'solo',codigo:'9904',nome:'Individual de Teste',mensalidade:640};
let resets=0;
const ctx=vm.createContext({DB:{alunos:[payer,child,spouse,single],lancamentos:[],movs:[]},Number,
  acaoRepetida:()=>false,toast:()=>{},confirm:()=>true,
  PM_CTX:null,fichaId:null,guardarVersoes:()=>{},logAct:()=>{},closeModal:()=>{},br:String,
  document:{getElementById:(()=>{const el={};return id=>el[id]||(el[id]={value:'',textContent:'',innerHTML:'',readOnly:false,style:{},classList:{add:()=>{}}});})()},
  monthKey:()=> '2026-10',mesReal:()=> '2026-10',dKey:()=> '2026-10-04',
  ehPersonalTipo:()=>false,persist:()=>{},renderAll:()=>{},descontoDoMes:()=>null,
  fmtRs:v=>'R$ '+v,fmt:v=>'R$ '+v,fmtCred:String,
  unificado:()=>false,profDoAluno:()=>'',profNome:()=>'',reposValidas:a=>a.repos,reposVencendo:()=>0,serieMensal:()=>[],
  agendaDoMes:()=>({total:6,part:6,grupo:0,valor:960}),mensalidadeDaAgenda:()=>({total:6,part:6,grupo:0,valor:960}),rmAgCache:{},rmEscolha:{},ehGrupoTipo:()=>false,
  perfilDe:()=> 'aluno',reposVencidas:()=>0,ehAtivoAluno:a=>!a.arquivado&&(a.plano>0||a.mensalidade>0),
  mover:(a,k,n)=>{a[k]=(Number(a[k])||0)+n;},purgarReposVencidas:()=>{},juntarGrupo:()=>{},
  fcAulasDoMes:(a)=>[{alunoId:a.id,custo:1}],fcFaltasDoMes:()=>1,fcAvisadosDoMes:()=>0});
const names=['centavosPagamento','dataPagamentoValida','pagamentosMensalidade','valorMensalidadeEm','situacaoMensalidade','saldoMensalidade','atualizarSituacaoExata','registrarPagamento','prepararPagamentoMes','resumoPagamentoExato','salvarPagamentoExato','dependentesFamilia','responsavelFamilia','ehDependenteFamilia','temFamilia','pagadorFamilia','statusFinanceiro','dadosFamiliaAluno','validarFamiliaAluno','valorDoMes','valorAulaDe','mensalidadesDoMes','cobrancaDoMes','marcarPago','alunoPublicado','publicacaoLegadaEnxuta','movsDe','mesDoTs','renovacoesDoMes','ajusteManualRenovacao','rmLinha','rmAplicarUm','fcDados','ehDoFechamento','situacaoPag','difSilenciada'];
vm.runInContext(names.map(n=>fn(gest,n)).join('\n'),ctx);
check('uma mensalidade por família e cobranças individuais preservadas',()=>{
 assert.equal(ctx.valorDoMes(payer),1200);assert.equal(ctx.valorDoMes(child),0);assert.equal(ctx.valorDoMes(spouse),0);assert.equal(ctx.valorDoMes(single),640);
 assert.equal(ctx.DB.alunos.reduce((s,a)=>s+ctx.valorDoMes(a),0),1840);
});
check('pagamento único muda a situação financeira dos dependentes, sem tocar nos saldos',()=>{
 const before=[payer,child,spouse].map(a=>[a.creditos,a.repos]);
 ctx.marcarPago(payer.id);assert.equal(ctx.DB.lancamentos.length,0);ctx.salvarPagamentoExato();
 assert.equal(ctx.DB.lancamentos.length,1);assert.equal(ctx.DB.lancamentos[0].alunoId,payer.id);assert.equal(ctx.DB.lancamentos[0].valor,1200);
 assert.equal(ctx.statusFinanceiro(child),'pago');assert.equal(ctx.situacaoPag(spouse),'pago');
 assert.deepEqual([payer,child,spouse].map(a=>[a.creditos,a.repos]),before);
});
check('dependente não gera segunda mensalidade mesmo em chamada direta',()=>{
 const before=JSON.stringify(ctx.DB);ctx.marcarPago(child.id);assert.equal(JSON.stringify(ctx.DB),before);
});
check('pagamento exato parcial e pendente são lidos do responsável',()=>{
 ctx.DB.lancamentos[0].valor=600;ctx.atualizarSituacaoExata(payer,'2026-10');assert.equal(ctx.statusFinanceiro(child),'parcial');assert.equal(ctx.saldoMensalidade(payer),600);
 ctx.DB.lancamentos[0].valor=0;ctx.atualizarSituacaoExata(payer,'2026-10');assert.equal(ctx.statusFinanceiro(spouse),'pendente');
 ctx.DB.lancamentos[0].valor=1200;ctx.atualizarSituacaoExata(payer,'2026-10');
});
check('vínculos inválidos, ciclos e transferência de responsável com dependentes são recusados',()=>{
 for(const [id,r]of [[child.id,child.id],[child.id,'missing'],[payer.id,child.id],[single.id,child.id],[payer.id,single.id]])assert.ok(ctx.validarFamiliaAluno(id,r));
 assert.equal(ctx.validarFamiliaAluno(child.id,payer.id),'');assert.equal(ctx.validarFamiliaAluno(child.id,''),'');
 payer.arquivado=true;assert.ok(ctx.validarFamiliaAluno(child.id,payer.id));delete payer.arquivado;
});
check('publicação mantém aulas próprias e herda pagamento e vencimento do pagador',()=>{
 payer.status='pago';payer.ultimoPago='2026-10';
 const pub=ctx.alunoPublicado(child);assert.equal(pub.status,'pago');assert.equal(pub.ultimoPago,'2026-10');assert.equal(pub.diaVenc,15);assert.equal(pub.creditos,1.5);assert.equal(pub.repos,2);assert.equal(pub.mensalidade,0);assert.equal(pub.familia.responsavelNome,payer.nome);
 const rootPub=ctx.alunoPublicado(payer);assert.equal(rootPub.mensalidade,1200);assert.equal(rootPub.familia.dependentes.length,2);
});
check('cópia legada não revela nomes dos familiares nem vínculo de parentesco',()=>{
 const pub={alunos:[ctx.alunoPublicado(child),ctx.alunoPublicado(payer)],historico:{dummy:[1]}};
 const leg=ctx.publicacaoLegadaEnxuta(pub);assert.equal(leg.alunos[0].familia.papel,'dependente');assert.equal(Object.keys(leg.alunos[0].familia).length,1);
 assert.equal(leg.alunos[0].mensalidade,null);assert.equal(Object.keys(leg.historico).length,0);
 assert.equal(pub.alunos[0].familia.responsavelNome,payer.nome);
});
check('renovação pela agenda mantém valor familiar e não reabre pagamento já quitado',()=>{
 for(const a of [payer,child]){
   ctx.rmEscolha[a.id]='agenda';const x=ctx.rmLinha(a);
   assert.equal(x.novo.mens,a===payer?1200:0);
   assert.equal(ctx.rmAplicarUm(x).ok,true);assert.equal(a.mensalidade,a===payer?1200:0);
 }
 assert.equal(payer.status,'pago');assert.equal(ctx.statusFinanceiro(child),'pago');assert.equal(child.creditos,6);
 assert.equal(ctx.valorAulaDe(payer),160);
});
check('fechamento fica no pagador e reúne as aulas de toda a família',()=>{
 assert.equal(ctx.ehDoFechamento(child),false);assert.equal(ctx.fcDados(payer,'2026-10').aulas.length,3);assert.equal(ctx.fcDados(payer,'2026-10').total,1200);assert.equal(ctx.fcDados(payer,'2026-10').faltas,3);assert.equal(ctx.fcDados(payer,'2026-10').avisados,0);
});
check('avisos por diferença de agenda não tentam recalcular total familiar',()=>{
 assert.equal(ctx.difSilenciada(payer),true);assert.equal(ctx.difSilenciada(child),true);
});
const actx=vm.createContext({EU:{familia:{papel:'dependente',responsavelNome:payer.nome},mensalidade:0},toast:()=>{resets++;},fmt:String,mensOculta:()=>false});
vm.runInContext(['dependenteAluno','familiaAluno','infoFamiliaAluno','avisoPagamentoFamilia','fmtMens','valorMensalAtual','pagarPix','pagarCartao','pagarDinheiro','confirmarRenovacao'].map(n=>fn(al,n)).join('\n'),actx);
check('dependente não abre Pix, cartão, dinheiro ou renovação própria',()=>{
 for(const n of ['pagarPix','pagarCartao','pagarDinheiro','confirmarRenovacao'])actx[n]();
 assert.equal(resets,4);assert.match(actx.fmtMens(),/família/);assert.equal(actx.valorMensalAtual(),0);
});
check('pagador renova pelo total familiar, individual mantém regra atual',()=>{
 actx.EU={familia:{papel:'responsavel'},mensalidade:1200};assert.equal(actx.valorMensalAtual(),1200);
 actx.EU={mensalidade:640,tipo:'Particular',plano:4};actx.planoValor=()=>640;assert.equal(actx.valorMensalAtual(),640);
});
console.log('\n'+count+' regressões de plano família · 0 falhas');

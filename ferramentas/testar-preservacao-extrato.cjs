'use strict';
/* Validade, FIFO e estorno devem sobreviver à compactação. Apenas dados fictícios.
 * Executa as funções reais do app, sem inicializar DOM ou acesso à nuvem. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const fonte=fs.readFileSync(path.resolve(__dirname,'../app-gestao/lib/app-gestao.js'),'utf8');
function extrair(nome){
 const m=new RegExp('(?:async )?function '+nome+'\\(').exec(fonte);if(!m)throw Error('Função ausente: '+nome);
 const resto=fonte.slice(m.index),fim=/\n(?:async )?function [\w$]+\(|\n(?:const|let|var) [\w$]/.exec(resto.slice(1));
 return fim?resto.slice(0,fim.index+1):resto;
}
function abrir(DB){
 const funcoes=['podarMovs','lotesRepos','reposPorIdade','movsDe','mesDoTs','mesesEntre'].map(extrair).join('\n');
 return new Function('DB',"const MOVS_TETO=600,MOVS_MANTER=500,REPOS_VALIDADE=4;const mesReal=()=>'2026-11';"+funcoes+
  ';return {podarMovs,lotesRepos,reposPorIdade};')(DB);
}
const copia=x=>JSON.parse(JSON.stringify(x)),junho=Date.UTC(2026,5,1,12),setembro=Date.UTC(2026,8,1,12),outubro=Date.UTC(2026,9,1,12);
const aluno={id:'a',creditos:0,credGrupo:0,repos:1,locCred:0};
const mov=(campo,delta,ts,ref='',id='a')=>({alunoId:id,campo,delta,ts,ref,de:0,para:delta,motivo:'Exemplo fictício'});
function banco(repos=[mov('repos',1,junho,'chuva-antiga')],qtd=1){
 return {alunos:[{...aluno,repos:qtd}],presencas:[],movs:repos.concat(Array.from({length:602},(_,i)=>mov('creditos',i%2?-1:1,outubro+i*1000,'c'+i)))};
}
let feitos=0;function teste(nome,fn){fn();feitos++;console.log('PASS '+nome);}
teste('compactar de verdade não faz reposição vencida ficar válida',()=>{
 const DB=banco(),api=abrir(DB),antes=api.reposPorIdade(DB.alunos[0],'2026-11'),n=DB.movs.length;
 api.podarMovs('a');assert.ok(DB.movs.length<n);assert.deepEqual(api.reposPorIdade(DB.alunos[0],'2026-11'),antes);
 assert.equal(antes.validas,0);assert.equal(antes.vencidas,1);assert.equal(DB.alunos[0].repos,1);
 assert.deepEqual(DB.movs.filter(m=>m.campo==='repos'),[mov('repos',1,junho,'chuva-antiga')]);
});
teste('FIFO mantém o lote restante e o vencimento original',()=>{
 const DB=banco([mov('repos',1,junho,'antiga'),mov('repos',2,setembro,'recente'),mov('repos',-1,outubro,'aula')],2),api=abrir(DB);
 const lotes=api.lotesRepos(DB.alunos[0]);api.podarMovs('a');assert.deepEqual(api.lotesRepos(DB.alunos[0]),lotes);
 assert.equal(api.reposPorIdade(DB.alunos[0],'2026-11').validas,2);
 assert.equal(api.reposPorIdade(DB.alunos[0],'2027-01').vencidas,2);
});
teste('desfazer anotação continua tirando seu próprio lote',()=>{
 const DB=banco([mov('repos',1,junho,'antiga'),mov('repos',1,outubro,'anot-exemplo'),mov('repos',-1,outubro+1,'anot-exemplo')],1),api=abrir(DB);
 api.podarMovs('a');assert.equal(api.reposPorIdade(DB.alunos[0],'2026-11').validas,0);assert.equal(api.reposPorIdade(DB.alunos[0],'2026-11').vencidas,1);
 assert.equal(api.lotesRepos(DB.alunos[0])[0].mes,'2026-06');
});
teste('referência de presença fica disponível ao estorno exato',()=>{
 const DB=banco(),deb=mov('credGrupo',-0.5,junho,'presenca-exemplo');DB.movs.unshift(deb);DB.presencas=[{k:'presenca-exemplo',alunoId:'a'}];
 const api=abrir(DB);api.podarMovs('a');assert.deepEqual(DB.movs.find(m=>m.ref==='presenca-exemplo'),deb);
 assert.equal(-DB.movs.filter(m=>m.ref==='presenca-exemplo').reduce((s,m)=>s+m.delta,0),0.5);
});
teste('referência de banco compartilhado também é preservada',()=>{
 const DB=banco(),deb=mov('creditos',-1,junho,'banco-conjunto');DB.movs.unshift(deb);
 DB.presencas=[{k:'participante',alunoId:'dependente',bancoRef:'banco-conjunto'}];
 abrir(DB).podarMovs('a');assert.deepEqual(DB.movs.find(m=>m.ref==='banco-conjunto'),deb);
});
teste('outro aluno e saldos brutos não são alterados',()=>{
 const DB=banco(),outro=mov('repos',5,junho,'outro','b');DB.movs.push(outro);
 const alunos=copia(DB.alunos);abrir(DB).podarMovs('a');assert.deepEqual(DB.alunos,alunos);assert.deepEqual(DB.movs.find(m=>m.alunoId==='b'),outro);
});
teste('muitos movimentos protegidos não causam compactações repetidas',()=>{
 const rs=Array.from({length:650},(_,i)=>mov('repos',1,junho+i*1000,'r'+i)),DB=banco(rs,650),api=abrir(DB);
 api.podarMovs('a');assert.deepEqual(DB.movs.filter(m=>m.campo==='repos'),rs);
 const antes=JSON.stringify(DB);api.podarMovs('a');assert.equal(JSON.stringify(DB),antes);
 assert.ok(DB.movs.length<1252);
});
teste('os demais campos ainda são resumidos, conservando cada soma',()=>{
 const DB=banco([],0);DB.movs=Array.from({length:606},(_,i)=>mov(['creditos','credGrupo','locCred'][i%3],i%2?-0.5:1,outubro+i*1000,'normal-'+i));
 const somas=()=>['creditos','credGrupo','locCred'].map(cp=>DB.movs.filter(m=>m.campo===cp).reduce((s,m)=>s+m.delta,0));
 const antes=somas();abrir(DB).podarMovs('a');assert.deepEqual(somas(),antes);assert.ok(DB.movs.length<606);assert.ok(DB.movs.some(m=>m.ref==='resumo'));
});
teste('origem desconhecida continua desconhecida, sem data inventada',()=>{
 const DB=banco([],5),api=abrir(DB),antes=api.lotesRepos(DB.alunos[0]);api.podarMovs('a');
 assert.deepEqual(api.lotesRepos(DB.alunos[0]),antes);assert.equal(antes[0].mes,null);assert.equal(DB.alunos[0].repos,5);
});
teste('registro vazio de presença não interrompe compactação nem estorno',()=>{
 const DB=banco(),deb=mov('creditos',-1,junho,'preserva');DB.movs.unshift(deb);
 DB.presencas=[null,{}, {k:'preserva'}];abrir(DB).podarMovs('a');
 assert.deepEqual(DB.movs.find(m=>m.ref==='preserva'),deb);
});
console.log('Preservação do extrato: '+feitos+' casos aprovados; nenhuma correção de dados reais.');

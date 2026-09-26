/* Confere DE QUE LADO a raquete fica em cada jogador dos desenhos.
   O lado sai de uma regra (ladoDoGolpe, no quadra.js), e regra errada nao da
   erro nenhum na tela: o aluno so' aparece batendo backhand num exercicio de
   forehand. Isto lista, para cada jogador com pose de golpe, o lado escolhido
   (FH/BH para ele, destro), as bolas que chegam (→) e saem (↗) dele, e marca
   com !! quando o tema e' de um golpe so' e o lado contradiz.
   Uso, a partir da raiz do repositorio:  node ferramentas/auditar-lado.js */
const fs=require('fs');
const sb={}; new Function('g', fs.readFileSync('app-exercicios/quadra.js','utf8')+
 ';g.lado=ladoDoGolpe;g.set=function(p){PECAS=p};g.R=RECORTES;')(sb);
const eb={}; new Function('g', fs.readFileSync('app-exercicios/exercicios.js','utf8')+';g.EX=EX;')(eb);
for(const e of eb.EX){
  sb.set(e.fig.el);
  const txt=(e.nome+' '+e.passos.join(' ')).toLowerCase();
  for(const el of e.fig.el){
    if(!['aluno','prof','colega'].includes(el[0])) continue;
    const [t,x,y,rot,pose]=el;
    const r=sb.R[pose]||sb.R[t]; const v=y>0?r.costas:r.frente;
    if(typeof v!=='object'||!r.lado||r.lado==='vai') continue;
    const q=r.lado==='fh'?y>0:r.lado==='bh'?!(y>0):sb.lado(x,y);   // raquete à direita da imagem?
    // lado do golpe para o próprio jogador (destro): de costas, dir=FH; de frente, esq=FH
    const fh = y>0 ? q : !q;
    // bolas que chegam e saem dele
    const chegam=e.fig.el.filter(b=>b[0]==='bola'&&Math.hypot(b[3]-x,b[4]-y)<5.5&&Math.hypot(b[1]-x,b[2]-y)>=1.6).map(b=>'→('+b[3]+','+b[4]+')');
    const saem=e.fig.el.filter(b=>b[0]==='bola'&&Math.hypot(b[1]-x,b[2]-y)<1.6).map(b=>'↗('+b[3]+','+b[4]+')');
    const temaFH=e.tema.includes('forehand'), temaBH=e.tema.includes('backhand');
    let alerta='';
    if(y>0 && t==='aluno'){
      if(temaBH&&!temaFH&&fh) alerta='!! tema BH mas FH';
      if(temaFH&&!temaBH&&!fh) alerta='!! tema FH mas BH';
      if(/backhand|revés/.test(txt)&&!/forehand/.test(txt)&&fh) alerta+=' ?texto BH';
      if(/forehand/.test(txt)&&!/backhand/.test(txt)&&!fh) alerta+=' ?texto FH';
    }
    console.log([e.id,t,x,y,pose||'-',y>0?'costas':'frente',fh?'FH':'BH',e.tema.join('/'),chegam.join(' '),saem.join(' '),alerta].join(' | '));
  }
}

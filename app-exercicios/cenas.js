/* Correções visuais, mantendo a montagem e os objetivos de cada exercício. */
EX.forEach(function(e){
  var semRaquete = /sem raquete|sem a raquete/i.test(e.montagem+' '+(e.fig.nota||''));
  e.fig.el.forEach(function(p){
    if(!['aluno','prof','colega'].includes(p[0])) return;
    if(semRaquete) p[4]='esperaLivre';
    else if(['BH2','BH5','BH11'].includes(e.id) && p[0]==='aluno') p[4]='backhand1';
    else if(e.id==='R23' || /voleio de backhand/i.test(e.nome)) { if(p[4]==='voleio') p[4]='voleioBackhand'; }
  });
});

/* A paralela mantém o corredor; a cruzada atravessa para o outro lado. */
var passada = EX.find(function(e){return e.id==='FH7';});
if(passada){
  passada.fig.el.forEach(function(p){
    if(p[0]==='bola' && p[6]==='paralela'){p[3]=2;p[4]=-9.4;p[5]=0;}
    if(p[0]==='bola' && p[6]==='cruzada'){p[3]=-3.4;p[4]=-9.4;p[5]=0;}
  });
  passada.fig.el.push(['zona',2,-9.4,1.6,2,'alvo paralelo'],['zona',-3.4,-9.4,1.6,2,'alvo cruzado']);
}

/* Fichas JV: a cena em metros continua sendo a fonte da montagem. */
function niveisDaFicha(e){
  var nomes = e.niveis.map(function(n){ return nivel(n).nome; });
  return nomes.length > 2 ? nomes[0] + ' a ' + nomes[nomes.length - 1] : nomes.join(' · ');
}
function cabecalhoDaFicha(e){
  var b = bloco(e.bloco), t = tema(e.tema[0]), c = camada(e.camada);
  return '<div class="ficha-toolbar"><span>FICHA DE TREINO <b>' + esc(e.id) + '</b></span>' +
    '<button class="fechar" data-fecha="fundoFicha" aria-label="Fechar ficha">✕</button></div>' +
    '<header class="ficha-capa"><div class="ficha-capa-texto"><span class="ficha-kicker">' + esc(b.nome) + ' · ' + esc(t ? t.nome : 'Treino transversal') + '</span>' +
    '<h2 id="fichaNome">' + esc(e.nome) + '</h2><p>' + esc(c.n) + '. ' + esc(c.nome) + '</p></div>' + marcaJV(false) + '</header>';
}
function dadosDaFicha(e){
  var materiais = e.mat.map(function(m){ var x=material(m);return x ? x.nome : m; }).join(' · ');
  var intensidade={baixa:'Baixa',media:'Média',alta:'Alta'}[e.int];
  return '<div class="sinais-ficha ficha-dados">' + [
    ['nivel','Nível',niveisDaFicha(e)],['relogio','Duração',(e.minFaixa||e.min)+' min'],
    ['gente','Jogadores',quantosJogadores(e)],['sobe','Intensidade',intensidade],['cone','Materiais',materiais]
  ].map(function(x){return '<div class="ficha-dado">'+icone(x[0])+'<div><small>'+x[1]+'</small><span>'+esc(x[2])+'</span></div></div>';}).join('')+'</div>';
}
function quadraDaFicha(e){
  var tiros=e.fig.el.filter(function(p){return p[0]==='bola'&&['cruzada','paralela','lob'].includes(p[6]);});
  var op={inteira:true,escalaFig:1.75};
  return '<div class="qd-cx" id="fichaQuadra" data-exercicio="'+esc(e.id)+'">' +
    '<div class="ficha-quadro-titulo"><b>Montagem em quadra</b><span>Toque para ampliar</span></div>' +
    svgQuadra(e.fig,op) +
    (tiros.length>1 ? '<div class="trajetorias" role="group" aria-label="Trajetórias da bola"><button type="button" data-trajetoria="todas" aria-pressed="true">Todas</button>'+tiros.map(function(p){return '<button type="button" data-trajetoria="'+p[6]+'" aria-pressed="false">'+p[6]+'</button>';}).join('')+'</div>' : '') +
    '<div class="qd-desc">'+esc(e.fig.nota||'')+'</div>'+ '<div class="qd-nota"><b>Montagem:</b> '+esc(e.montagem)+'</div>'+legendaQuadra()+'</div>';
}
function fotoDaFicha(e){
  if(!e.imagem&&!['FH1','FH16'].includes(e.id)) return '';
  return '<figure class="ficha-foto"><img src="forehand-jv-realista.png" alt="Referência de forehand de destro: jogador visto de costas, raquete na mão direita e contato à frente do corpo." decoding="async"><figcaption><span>Referência do golpe</span><b>Forehand de destro</b><p>Raquete na mão direita. Contato à frente do corpo, do lado dominante.</p><p>Observe a base e o equilíbrio durante o deslocamento. Após a batida, recupere a posição de espera.</p></figcaption></figure>';
}
document.addEventListener('click',function(ev){
  var botao=ev.target.closest('[data-trajetoria]'); if(!botao)return;
  var caixa=botao.closest('[data-exercicio]'),e=acharEx(caixa.dataset.exercicio),alvo=botao.dataset.trajetoria;
  var fig={base:e.fig.base,nota:e.fig.nota,el:e.fig.el.filter(function(p){return p[0]!=='bola'||alvo==='todas'||p[6]===alvo;})};
  caixa.querySelector('svg.qd').outerHTML=svgQuadra(fig,{inteira:true,escalaFig:1.75});
  caixa.querySelectorAll('[data-trajetoria]').forEach(function(b){b.setAttribute('aria-pressed',String(b===botao));});
});

/* Ficha completa: todos os campos pedagógicos permanecem visíveis. */
function listaEditorial(itens){return '<ul>'+itens.filter(Boolean).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';}
function painelEditorial(titulo,conteudo,classe){return '<section class="jv-painel '+(classe||'')+'"><h3>'+esc(titulo)+'</h3><div class="jv-painel-conteudo">'+conteudo+'</div></section>';}
function sequenciaDaFicha(e){
 if(!e.imagem&&!['FH1','FH16'].includes(e.id))return '';
 var fases=['Posição de espera','Deslocamento','Preparação','Contato','Finalização'];
 return '<section class="jv-sequencia"><h3>Sequência do movimento · Forehand de destro</h3><img src="forehand-jv-sequencia.png" alt="Cinco fases do forehand de destro: espera, deslocamento, preparação, contato e finalização."><ol>'+fases.map(function(f,i){return '<li><b>'+(i+1)+'.</b> '+f+'</li>';}).join('')+'</ol></section>';
}
function adaptacoesDaFicha(e){
 var ns=NIVEIS.filter(function(n){return e.prog&&e.prog[n.id];});
 return {facilitar:e.facilitar?listaEditorial(e.facilitar):(ns.length?'<p><b>'+esc(ns[0].nome)+':</b> '+esc(e.prog[ns[0].id])+'</p>':'<p>'+esc(e.objetivo)+'</p>'),variacoes:(e.variacoes?listaEditorial(e.variacoes):'')+(e.facilitar?ns:ns.slice(1)).map(function(n){return '<p><b>'+esc(n.nome)+':</b> '+esc(e.prog[n.id])+'</p>';}).join('')+(e.kids?'<p><b>Kids:</b> '+esc(e.kids)+'</p>':'')};
}
function fichaEditorial(e,focos){
 var t=tema(e.tema[0]),c=camada(e.camada),ad=adaptacoesDaFicha(e),foto=!!e.imagem||['FH1','FH16'].includes(e.id);
 var identidade='<header class="jv-identidade"><div class="jv-codigo"><b>Treino '+esc(e.numero||e.id)+'</b><span>'+esc(e.numero?'Código: '+e.id:bloco(e.bloco).nome)+'</span></div><h2 id="fichaNome">'+esc(e.nome)+'</h2><p>'+esc(e.objetivo)+'</p>'+marcaJV(false)+'</header>';
 var principal=foto?'<div class="jv-imagem-principal">'+identidade+'<img src="forehand-jv-realista.png" alt="Forehand de destro, atleta de corpo inteiro, visto de costas, raquete na mão direita."></div>':identidade+quadraDaFicha(e);
 var passos='<ol class="jv-passos">'+e.passos.map(function(p,i){return '<li><b>'+(i+1)+'</b><span>'+esc(p)+'</span></li>';}).join('')+'</ol>';
 var tags=e.tags||e.tema.map(function(id){var v=tema(id);return v?v.nome:id;}).concat(e.nec.map(function(id){var v=necessidade(id);return v?v.nome:id;}));
 return '<article class="jv-editorial"><div class="jv-ficha-grid"><div class="jv-principal">'+principal+sequenciaDaFicha(e)+'</div><div class="jv-instrucoes">'+
 '<div class="jv-classificacao">'+painelEditorial('Camada da pirâmide','<p>'+esc(c.n)+'. '+esc(c.nome)+'</p>')+painelEditorial('Níveis recomendados','<p>'+esc(e.nivelRecomendado?nivel(e.nivelRecomendado).nome:niveisDaFicha(e))+'</p>'+(e.nivelRecomendado?'<small>Adaptável para Impulso e Ascensão</small>':''))+'</div>'+
 painelEditorial('Objetivo','<p>'+esc(e.objetivo)+'</p>','jv-objetivo')+dadosDaFicha(e)+
 (focos||[]).filter(function(n){return e.prog&&e.prog[n];}).map(function(n){return painelEditorial('No nível '+nivel(n).nome,'<p>'+esc(e.prog[n])+'</p>','jv-nivel-selecionado');}).join('')+
 '<div class="jv-diagrama-passos">'+(foto?quadraDaFicha(e):painelEditorial('Montagem da atividade','<p>'+esc(e.montagem)+'</p>'))+painelEditorial('Passo a passo',passos)+'</div>'+
 '<div class="jv-coach">'+painelEditorial('Foco do treinador',listaEditorial(e.foco))+painelEditorial('Erros mais comuns',listaEditorial([e.erro].concat(e.erros)))+'</div>'+
 '<div class="jv-adaptacoes">'+painelEditorial('Como facilitar',ad.facilitar)+painelEditorial('Como dificultar',listaEditorial(e.dificultar))+painelEditorial('Variações por nível',ad.variacoes)+'</div></div></div>'+
 '<div class="jv-rodape-informacoes">'+painelEditorial('Aplicação em jogo real','<p>'+esc(e.execucao)+'</p>')+painelEditorial('Dica JV','<p>'+esc(e.dica)+'</p>','jv-dica')+painelEditorial('Frase pedagógica','<p>“'+esc(e.frasePedagogica||(t?t.frase:bloco(e.bloco).desc))+'”</p>')+painelEditorial('Tags','<div class="jv-tags">'+tags.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>')+'</div>'+
 painelEditorial('Funcionou se','<p>'+esc(e.sucesso)+'</p>','jv-sucesso')+
 '<div class="jv-formatos"><b>Formatos:</b> '+esc(e.form.map(function(id){var v=formato(id);return v?v.nome:id;}).join(' · '))+' <b>Intensidade:</b> '+esc({baixa:'Baixa',media:'Média',alta:'Alta'}[e.int])+'</div></article>';
}
function folhaComplemento(e,minutos){
 if(e.id === "D2-FH-03") return folhaInstrucoes22(e,minutos);
 var ad=adaptacoesDaFicha(e),t=tema(e.tema[0]);
 return '<section class="ft ft-complemento"><header><span>JV TÊNIS · FICHA COMPLETA</span><h1>'+esc(e.id)+' · '+esc(e.nome)+'</h1><p>Instruções e adaptações · '+esc(minutos||e.min)+' min · '+esc(niveisDaFicha(e))+' · '+esc(camada(e.camada).nome)+' · Intensidade '+esc({baixa:'Baixa',media:'Média',alta:'Alta'}[e.int])+'</p></header>'+sequenciaDaFicha(e)+
 '<div class="jv-papel-dados">'+painelEditorial('Objetivo completo','<p>'+esc(e.objetivo)+'</p>')+painelEditorial('Montagem','<p>'+esc(e.montagem)+'</p>')+painelEditorial('Execução e aplicação em jogo','<p>'+esc(e.execucao)+'</p>')+
 '<div class="jv-coach">'+painelEditorial('Como facilitar',ad.facilitar)+painelEditorial('Variações por nível',ad.variacoes)+'</div>'+
 painelEditorial('Materiais e formatos','<p>'+esc(e.mat.map(function(id){var v=material(id);return v?v.nome:id;}).join(' · '))+'</p><p>'+esc(e.form.map(function(id){var v=formato(id);return v?v.nome:id;}).join(' · '))+'</p>')+
 painelEditorial('Tags','<p>'+esc(e.tema.concat(e.nec).join(' · '))+'</p>')+painelEditorial('Frase pedagógica','<p>“'+esc(e.frasePedagogica||(t?t.frase:bloco(e.bloco).desc))+'”</p>')+painelEditorial('Funcionou se','<p>'+esc(e.sucesso)+'</p>','jv-sucesso')+'</div></section>';
}

function folhaOrientacoes(e){
 return '<section class="ft ft-complemento"><header><span>JV TÊNIS · ORIENTAÇÕES COMPLETAS</span><h1>'+esc(e.id)+' · '+esc(e.nome)+'</h1><p>Foco, observações técnicas e progressões</p></header><div class="jv-papel-dados">'+
 painelEditorial('Foco do treinador',listaEditorial(e.foco))+
 painelEditorial('Erro principal a observar','<p>'+esc(e.erro)+'</p>')+
 painelEditorial('Erros mais comuns',listaEditorial(e.erros))+
 painelEditorial('Como dificultar',listaEditorial(e.dificultar))+
 painelEditorial('Dica JV','<p>'+esc(e.dica)+'</p>','jv-dica')+'</div></section>';
}
// Se a síntese da primeira folha encurta uma orientação, acrescente o texto
// integral. O conteúdo pedagógico não é perdido para caber na página.
function paginasTreino(e,minutos,nivelSel,pagina){
 var paginas=[folhaTreino(e,minutos,nivelSel,pagina),folhaComplemento(e,minutos)];
 var html=paginas.join(''),orientacoes=[e.erro,e.dica].concat(e.foco,e.erros,e.dificultar);
 if(orientacoes.some(s=>!html.includes(esc(s))))paginas.push(folhaOrientacoes(e));
 return paginas;
}

/* A ficha de referência tem uma folha visual e outra com a aplicação completa. */
function cabecalhoPapel22(e){return '<header><span>TREINO '+esc(e.numero)+' · CÓDIGO '+esc(e.id)+' · ACADEMIA JV TÊNIS</span><h1>'+esc(e.nome)+'</h1><p>'+esc(camada(e.camada).n)+'. '+esc(camada(e.camada).nome)+' · '+esc(nivel(e.nivelRecomendado).nome)+'</p></header>';}
function folhaIlustrada22(e,minutos){
 return '<section class="ft ft-complemento ft-ilustrada22">'+cabecalhoPapel22(e)+
 painelEditorial('Objetivo','<p>'+esc(e.objetivo)+'</p>')+
 painelEditorial('Duração · Jogadores · Materiais','<p>'+(minutos&&minutos!==e.min?esc(minutos):esc(e.minFaixa))+' min · '+esc(e.jogadores)+' jogadores</p><p>'+esc(e.mat.map(function(id){var m=material(id);return m?m.nome:id;}).join(' · '))+'</p>')+
 '<figure class="jv-papel-foto"><img src="'+esc(e.imagem)+'" alt="Forehand de destro em movimento"><figcaption>Equilíbrio, contato à frente do corpo e profundidade.</figcaption></figure>'+sequenciaDaFicha(e)+
 painelEditorial('Dica JV','<p>'+esc(e.dica)+'</p>','jv-dica')+'</section>';
}
function folhaInstrucoes22(e,minutos){
 var ad=adaptacoesDaFicha(e);
 return '<section class="ft ft-complemento ft-instrucoes22">'+cabecalhoPapel22(e)+
 '<div class="jv-coach">'+painelEditorial('Diagrama da quadra',svgQuadra(e.fig,{inteira:true,escalaFig:1.75})+'<p>'+esc(e.montagem)+'</p>')+painelEditorial('Passo a passo','<ol class="jv-passos">'+e.passos.map(function(p,i){return '<li><b>'+(i+1)+'</b><span>'+esc(p)+'</span></li>';}).join('')+'</ol>')+'</div>'+
 '<div class="jv-coach">'+painelEditorial('Foco do treinador',listaEditorial(e.foco))+painelEditorial('Erros mais comuns',listaEditorial([e.erro].concat(e.erros)))+'</div>'+
 '<div class="jv-adaptacoes">'+painelEditorial('Como facilitar',ad.facilitar)+painelEditorial('Como dificultar',listaEditorial(e.dificultar))+painelEditorial('Variações',ad.variacoes)+'</div>'+
 '<div class="jv-coach">'+painelEditorial('Aplicação em jogo real','<p>'+esc(e.execucao)+'</p>')+painelEditorial('Frase pedagógica','<p>“'+esc(e.frasePedagogica)+'”</p><p><b>Tags:</b> '+esc(e.tags.join(' · '))+'</p>')+'</div>'+
 painelEditorial('Funcionou se','<p>'+esc(e.sucesso)+'</p>','jv-sucesso')+'</section>';
}

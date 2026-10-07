/* Ficha fornecida pelo treinador: Treino 22 · D2-FH-03. */
MATERIAIS.push({id:'bolas',nome:'Bolas'},{id:'raquetes',nome:'Raquetes'});
EX.push({
  id:'D2-FH-03', numero:22, nome:'Forehand em movimento', fonte:'apostila',
  tema:['forehand','movimentacao'], camada:2, bloco:'tema',
  niveis:['impulso','construcao','ascensao'], nivelRecomendado:'construcao',
  min:12, minFaixa:'10–15', jogadores:'2–4', int:'media',
  imagem:'forehand-jv-realista.png', sequencia:'forehand-jv-sequencia.png',
  objetivo:'Bater o forehand em movimento, após o deslocamento lateral, mantendo equilíbrio e profundidade.',
  montagem:'Professor do outro lado da rede, com cesta de bolas. Aluno no centro da linha de base. Cones marcam o centro e os deslocamentos laterais.',
  execucao:'Simule situações em que o jogador precisa se deslocar e manter a profundidade do forehand, como em trocas de fundo de quadra.',
  passos:[
    'Professor na cesta, enviando bolas em diferentes direções.',
    'Aluno parte da posição de espera (split-step).',
    'Desloca rapidamente para o lado indicado.',
    'Executa o forehand em movimento, visando profundidade.',
    'Retorna ao centro e repete para o lado oposto.'
  ],
  foco:['Primeiro passo e qualidade do deslocamento.','Equilíbrio no momento da batida.','Preparação curta e eficiente.','Profundidade e controle da direção.'],
  erro:'Chegar atrasado na bola.',
  erros:['Bater desequilibrado.','Preparação muito longa.','Bola curta.','Não retornar ao centro.'],
  facilitar:['Bolas mais lentas.','Menor distância lateral.','Alvos maiores.'],
  dificultar:['Bolas mais rápidas.','Maior distância lateral.','Variar altura e direção.','Incluir segunda bola.'],
  variacoes:['Definir alvo específico (zona de fundo).','Alternar forehand e backhand.','Adicionar tomada de decisão (aberto ou cruzado).'],
  prog:{
    impulso:'Bolas mais lentas, menor distância lateral e alvos maiores.',
    construcao:'Deslocamento lateral com equilíbrio, profundidade e retorno ao centro.',
    ascensao:'Maior velocidade, altura e direção variáveis; incluir segunda bola e tomada de decisão.'
  },
  dica:'Chegue com os pés, para bater com liberdade.',
  frasePedagogica:'Primeiro os pés, depois a raquete.',
  tags:['forehand','deslocamento','profundidade','fundo de quadra','movimento','construção'],
  sucesso:'Manter equilíbrio e profundidade na batida e recuperar a posição central após o golpe.',
  mat:['bolas','cones','cesta','raquetes'], form:['dupla','trio'],
  nec:['footwork','equilibrio','profundidade','recuperacao'],
  fig:{base:'inteira',el:[
    ['prof',0,-10.8,'cesta','espera'],['aluno',0,11.4,'posição de espera','espera'],
    ['cone',-3,9.3,''],['cone',0,10.4,''],['cone',3,9.3,''],
    ['mov',0,11.2,3,9.5,.2,'deslocamento'],
    ['mov',0,11.2,-3,9.5,-.2,'lado oposto'],
    ['mov',3,9.5,0,11.2,.15,'retorno'],
    ['bola',0,-10.4,3,9.5,.1,'envio'],
    ['bola',3,9.5,-2.8,-10.8,.1,'forehand profundo']
  ],nota:'Saia da posição de espera, desloque-se para a bola, bata com profundidade e retorne ao centro.'}
});

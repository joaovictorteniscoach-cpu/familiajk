# Banco de Exercícios JV — Da Base ao Topo

O app que o professor abre **em quadra**. Responde três perguntas, nessa ordem:

1. **Que mês é hoje?** → abre já no tema do mês (calendário da seção 5.5 da apostila);
2. **Quem é o aluno?** → filtra por nível da Trilha, formato de aula e necessidade específica;
3. **O que vou fazer nos 60 minutos?** → monta o plano nos quatro blocos da aula JV e imprime.

Endereço (Pages): `https://joaovictorteniscoach-cpu.github.io/familiajk/app-exercicios/`

## O que tem dentro

| Arquivo | O que é |
|---|---|
| `index.html` | a tela inteira (filtros, ficha, plano de aula, impressão) |
| `exercicios.js` | **o banco**: taxonomia + os exercícios. É aqui que se mexe no conteúdo |
| `quadra.js` | o **desenho da quadra**: transforma a montagem de cada exercício em figura |
| `sw-exercicios.js` | service worker: abre offline, porque saibro com sinal ruim é a regra |
| `manifest-exercicios.webmanifest` | ícone e nome ao adicionar na Tela de Início |

**Não fala com servidor nenhum.** Não tem Firebase, não tem biblioteca de fora, não
tem dado de aluno na nuvem. Favoritos e plano de aula ficam no próprio aparelho
(`localStorage`, chaves `jvex:favoritos` e `jvex:plano`). Trocar de celular começa
do zero — é o preço de não ter cadastro, e aqui vale a pena.

## Como o banco está organizado

Cada exercício é cruzado por **seis eixos**. É isso que permite achar o exercício
certo por caminhos diferentes:

| Eixo | Para quê serve |
|---|---|
| **Tema do mês** (6) | o calendário anual, dois ciclos por ano |
| **Camada da Pirâmide** (1–6) | o que se ensina, de baixo pra cima |
| **Nível da Trilha** (5) | para quem — Base, Impulso, Construção, Ascensão, Topo |
| **Bloco da aula** (4) | onde entra: ativação, tema do dia, jogo, fechamento |
| **Necessidade** (24) | o atalho do dia a dia: "esse aluno dá dupla falta", "chega atrasado" |
| **Formato e material** | Particular, Dupla, Trio, Kids, Personal · e o que você tem na mão |

Todo exercício traz **desenho da quadra, objetivo, montagem, passo a passo, dica
extra, a versão em cada nível** e as três colunas de rodapé — **foco do professor,
erros mais comuns e como dificultar** — além do **critério objetivo de sucesso**. Os 25 drills da apostila (D1–D25) estão aqui com o mesmo nome e o mesmo
conteúdo, marcados como `apostila`.

## Como a tela está organizada

**A lista é de desenhos, não de texto.** Cada linha traz a miniatura da quadra,
o nome e quatro sinais miúdos: o ícone do bloco da aula, a duração, a régua de
níveis (cinco pontos, acesos onde o exercício serve) e o código. O objetivo saiu
da lista — ele está na ficha, e a busca continua achando por ele. A ideia é
simples: **o professor reconhece o exercício pela forma antes de ler o nome.**

**O card inteiro abre a ficha.** Antes só o desenho e o texto abriam: a borda
de 10 px e o vão entre eles eram zona morta, e o dedo caía ali sem nada
acontecer. O `cursor:pointer` no card não é enfeite — sem ele o Safari do iPhone
não deixa o clique de um `<div>` subir até o `document`, que é onde o app escuta.

**Arrastar não vira toque.** Rolar as tiras de filtro de lado terminava
selecionando o que estava sob o dedo, porque o navegador manda um clique quando
o dedo quase não anda — e "quase" é generoso demais para uma tira que rola. O
gesto agora é medido: acima de 10 px é arrasto, e o clique seguinte é engolido.

**A ficha mostra o essencial e guarda o resto.** Em pé, sem tocar em nada:
desenho grande, **a frase que conta o que está desenhado**, montagem, os dados
da atividade, o objetivo em uma frase e o passo a passo. Essa frase existe para
os 116 exercícios e vivia só no `aria-label` — invisível para quem enxerga. É
ela que fecha a conta entre a figura e o nome: *"Sem bola: o professor canta a
sequência e o aluno executa em sombra, acelerando o canto."*

As três colunas viraram **abas** (Foco · Erros · Dificultar) — uma por vez. E a
versão Kids e os materiais ficam em **gavetas**, a um toque. Nada foi cortado;
o que mudou é o que aparece de primeira.

**Escolheu um nível na tira, a ficha muda com ele.** A variação daquele nível
sobe da gaveta para o corpo da ficha, logo abaixo do objetivo, com o nome do
nível no título. Marcando dois níveis, aparecem os dois — é o caso da turma
mista. A linha do resumo também passa a dizer qual nível está filtrando, para
não haver dúvida sobre de onde veio o número de exercícios.

## O desenho da quadra

Cada exercício tem uma figura que mostra **quem está onde, para onde a bola vai,
para onde o aluno corre e onde ficam cones e alvos**. São desenhos feitos na hora
em SVG, não imagens: pesam alguns bytes, ficam nítidos em qualquer zoom, saem na
impressão do plano e se editam mudando uma linha de texto — não um arquivo de
imagem que ninguém sabe abrir depois.

**A vista é de trás do fundo, com bonecos** — como quem está atrás do aluno
olhando para a rede. Antes era de cima. Um desenho visto de cima é uma planta:
mostra posição, mas não mostra a cena, e a pessoa vira uma bolinha com uma letra
dentro. Em perspectiva o professor reconhece o exercício como ele acontece.

Quem desenha é uma **câmera**: cada recorte tem uma posição (atrás da linha de
base, a alguns metros de altura) e um ponto para onde olha. Todo ponto da quadra
passa por essa projeção antes de virar SVG.

O saibro tem marca de vassoura, luz caindo do fundo para as bordas e poeira na
borda das linhas; os bonecos são montados em camadas (perna de trás, perna da
frente, short, camisa, braços, cabeça, raquete com corda), cada uma com um tom
de luz e um de sombra. É de onde vem o volume: uma silhueta de cor única, por
melhor desenhada que seja, continua parecendo pictograma.

**Isto é ilustração, não foto.** É o preço de o app pesar 300 KB, abrir offline
em quadra e desenhar os 116 na hora. Para trocar por foto de verdade, veja a
seção *Trocar o desenho por foto* mais abaixo. É isso que faz, de graça e sem
ajuste em exercício nenhum, o jogador do fundo sair menor que o da rede, a linha
de base de longe sair mais fina que a de perto, e a rede aparecer na frente de
quem está atrás dela e atrás de quem está na frente.

**Nada mudou no jeito de escrever os exercícios.** Eles continuam em metros de
quadra, exatamente como antes — foi o que permitiu virar os 116 desenhos de uma
vez, sem reescrever nenhum.

O desenho fica no campo `fig` do exercício:

```js
fig:{ base:'meia', el:[
  ['aluno', 0, 11.4, 'espera'],          // quem: aluno · prof · colega
  ['prof', 0, -1.8, 'bolas na mão'],
  ['bola', 0,-1.8, 3.6,8.4, .25, ''],    // trajeto da bola (tracejado)
  ['mov', 0,11.2, 3.4,8.8, .16, 'persegue'],   // deslocamento (linha cheia)
  ['cone', 0, 12.0, 'volta aqui'],
  ['zona', -3.2, -9, 3.2, 4, 'alvo cruzado'],
  ['marca', 3.6, 8.4, 'pega na altura do quadril'],
  ['escada', -2.8, 9.4, ''], ['corda', 'corda a 1 m'], ['texto', 0, 6, 'nota', .6]
], nota:`A frase que explica o desenho, abaixo dele.` }
```

O desenho aparece em dois tamanhos, do mesmo dado: **grande** na ficha e
**miniatura** na lista (`svgQuadra(fig, {mini:true})`). Na miniatura o rótulo
sai e o traço engrossa — nesse tamanho o texto viraria borrão, e o que importa é
a cena. Nos dois casos a moldura **enquadra a ação** em vez de mostrar o recorte
inteiro, mas nunca menos que 60% dele: sem esse mínimo, dois jogadores lado a
lado viravam um retrato deles, sem quadra em volta para dizer *onde* aquilo
acontece — que é metade do que o desenho serve para contar.

**As coordenadas são as medidas reais da quadra, em metros.** O `x` é 0 no meio
(±4,115 é a linha de simples, ±5,485 a de duplas) e o `y` é **0 na rede**, com o
lado do **aluno no positivo** (11,885 é a linha de base, 6,40 a linha de saque).
Quem olha o desenho está sempre atrás do aluno, de frente para a rede.

O `base` escolhe o recorte: `inteira` (as duas quadras), `meia` (o lado do aluno
com a rede), `mini` (os quadrados de saque) ou `fundo` (o fundo de quadra).
**Peça colocada fora do recorte não aparece** — e por isso o
`ferramentas/checar-exercicios.js` confere isso a cada mudança. Na primeira leva
ele pegou 13 desenhos assim, todos invisíveis e nenhum com erro na tela.

Dois cuidados ao desenhar: **rótulo curto** (o desenho encolhe o texto comprido
até caber, e aí ele fica pequeno) e **escolher o recorte pelo elemento mais
distante** — se o alvo está na quadra do adversário, a base é `inteira`.

Os rótulos são colocados depois de o desenho reservar o espaço de cada boneco e
de cada cone. Sem essa reserva o rótulo caía em cima do aluno, e um desenho com
o texto escrito por cima da pessoa não serve para nada. Quando não cabe embaixo,
ele sobe; quando também não cabe em cima, anda para o lado.

## Trocar o desenho por foto

O app **já está pronto para receber as fotos** — falta só tirá-las. Nada do
material de outro professor é usado: as pessoas têm que ser as da JV.

### Por que não são 116 fotos

Uma foto por exercício seriam 116 imagens de alta resolução, dezenas de
megabytes, num app que hoje tem 300 KB e abre offline em quadra. E imagem
gerada por IA não coloca o jogador no metro certo — e é exatamente o metro
certo que o desenho serve para dizer.

O jeito que funciona, e que o mercado usa, é **uma foto de fundo da quadra
vazia com as pessoas e as setas por cima**. A mesma foto serve nos 116. O que
muda de exercício para exercício é a camada de cima, que continua vindo dos
metros.

### Os três jogadores que estão ali agora são PROVISÓRIOS

`jog-golpe.png`, `jog-backhand.png` e `jog-saque.png` vieram de imagens
encontradas na internet e entraram a pedido, para ver o resultado funcionando.
**Eles não devem ficar no material vendido**, por dois motivos que valem
registrar antes que alguém esqueça:

- o de camisa turquesa é o **Roger Federer**, uma pessoa real e identificável.
  Usar a imagem dele num produto pago é direito de imagem do atleta;
- o de azul tem quatro logos da **Nike** (bandana, camisa, munhequeira, tênis),
  e ele e o de vermelho parecem render de videogame — o que traz junto o
  direito autoral de quem fez.

Trocar é uma linha em `RECORTES` por pose. Enquanto não houver foto da JV, a
alternativa segura é apagar as entradas de `RECORTES`: sem elas o desenho volta
sozinho para o boneco desenhado, que é nosso.

Uma marca técnica deles, que a foto da JV não vai ter: o **xadrez de
transparência ficou gravado por dentro da camisa** nos dois renders. Dá para
ver de perto, em quadradinhos no vermelho e no ombro do azul. Onde o xadrez caiu
por cima da pessoa não há recorte que resolva.

### As fotos que faltam

**1. A quadra vazia** — uma só, e é a mais importante.

- de **trás da linha de base**, no meio (em cima da marca central);
- câmera **o mais alta que der**: escada, arquibancada, bastão com o celular
  na ponta, alguém segurando o braço esticado em cima de um banco. Quanto mais
  alta, menos as pessoas vão se esconder atrás umas das outras no desenho;
- apontada para o **meio da rede**, mostrando a quadra inteira até a linha de
  base do outro lado;
- **sem pessoas, sem bolas, sem cestos**;
- **sem grande-angular** (no iPhone, o "1x", nunca o "0,5x"): a conta supõe
  lente sem distorção, e o 0,5x entorta as linhas retas;
- o celular **na horizontal**, o mais nivelado possível;
- quadra varrida, linhas limpas — ela vai aparecer em 116 telas.

**2. Os jogadores** — seis a oito fotos, cada uma de uma pessoa da JV:

| pose | para quê |
|---|---|
| de costas, em posição de espera | a posição mais comum do banco |
| de costas, batendo forehand | os exercícios de forehand |
| de costas, batendo backhand | os de backhand |
| de frente, na rede, voleando | approach e rede |
| de costas, sacando (braço em cima) | saque e devolução |
| de frente, com a cesta | o professor, no lado de lá |
| criança de costas, em espera | os exercícios Kids |

Em cada uma: **corpo inteiro**, dos pés à cabeça, de uns 6 a 8 metros de
distância, com a pessoa ocupando a altura do quadro. Se puderem estar com a
roupa da academia, melhor ainda.

**Não precisa procurar "PNG transparente" na internet.** O recorte é feito
aqui, por `ferramentas/recortar-jogador.py`: basta a pessoa estar contra um
fundo de **cor uniforme** — uma parede lisa, um tapume, o céu. A única
exigência é que a **roupa não seja da mesma cor do fundo**: jogador de branco
contra parede branca é o caso que não tem jeito, porque a conta não consegue
saber onde acaba a camisa e começa a parede.

Vale saber por que os "PNG transparentes" de banco de imagem quase nunca
servem: eles costumam vir salvos em JPG, e aí o **xadrez cinza-e-branco fica
gravado dentro do arquivo**. Aquilo não é transparência, é desenho — e onde o
xadrez caiu por cima da pessoa (numa camisa meio transparente, por exemplo)
não há conserto, ela sai quadriculada na quadra.

### O que acontece quando as fotos chegarem

```sh
python3 ferramentas/calibrar-foto.py foto-quadra.jpg \
  fundo-perto-esq=312,1402 fundo-perto-dir=2441,1402 \
  fundo-longe-esq=1012,388 fundo-longe-dir=1741,388 \
  rede-esq=380,980 rede-dir=2380,980
```

Ele descobre **qual câmera tirou aquela foto** — onde estava, que altura, para
onde olhava, que abertura — a partir de pontos da quadra que dá para apontar a
olho. Não é esticar imagem: é achar a câmera de verdade, e por isso o encaixe
vale também para o que sobe do chão (pessoa, cone, rede). Um encaixe que só
servisse para o chão deixaria todo mundo flutuando.

A saída é um bloco para colar em `FOTOS`, no `quadra.js`, e uma imagem de
conferência com a quadra desenhada por cima da foto. **O que prova o acerto são
as linhas que não entraram na conta**: se a linha de saque cair sozinha em cima
da linha de saque da foto, e os postes amarelos fecharem na altura da rede, a
câmera está certa. Conferido num teste com erro de dedo de 4 px em seis pontos:
a câmera voltou com 1,2 px de erro médio.

Os recortes de jogador entram em `RECORTES`, e cada exercício pode pedir a pose
que quiser (`['aluno', 0, 11.4, 'espera', 'backhand']`). Sem recorte, continua
o boneco desenhado — os dois convivem, então dá para começar com duas poses e
ir acrescentando.

O `gerar-zip.py` leva as fotos junto sozinho, e o `gerar-arquivo-unico.py`
embute cada uma como data URI (e avisa se o arquivo único passar de 1,5 MB, que
é quando vale mais publicar a pasta completa).

## Meus exercícios — criar e editar no celular

O botão **✎** no cabeçalho abre *Meus exercícios*. O que você cria ali fica
**neste aparelho** (localStorage) e entra em tudo: busca, filtros, aula pronta,
plano e impressão. Na lista os seus aparecem junto com os do banco; o filtro
**Só os meus** separa, e a ficha diz a origem.

**Os 116 do banco não se editam pelo celular, de propósito.** Eles vêm de
`exercicios.js` — são a metodologia, e mudá-los sem querer em quadra seria pior
que não poder mudá-los. Para alterar um deles, é no arquivo (seção acima).

O código dos seus sai como `JV01`, `JV02`… O banco usa D, F, M, FH, BH, R, S e
T, então não há risco de dois exercícios com o mesmo código.

**O desenho.** Desenhar uma quadra num celular pediria um editor de arrastar que
ninguém usaria em quadra. Em vez disso: escolha entre **oito cenas prontas**
(professor lança, dois peloteando, aluno na rede, cones no fundo, saque e
devolução, alvo do outro lado, mini quadra, quadra vazia) — ou **copie o desenho
de qualquer um dos 116** e escreva a frase que explica a cena. É a mesma frase
que aparece embaixo da figura na ficha, e é ela que faz o desenho ser entendido.

**Levar para o outro professor.** O app não fala com servidor nenhum — é isso
que o deixa abrir offline em quadra. Então a gaveta *Levar para outro aparelho*
gera um bloco de texto para copiar e mandar; do outro lado, cola no mesmo lugar
e toca em importar. A importação **confere cada registro**: o que vier
incompleto fica de fora em vez de entrar quebrado, e código que bata com um do
banco é renumerado.

## Acrescentar um exercício

Abra `exercicios.js`, copie um bloco inteiro de `EX`, cole no fim da seção do tema
e preencha. Os campos estão explicados no comentário do começo do arquivo. Duas
regras que valem a pena respeitar:

- **`sucesso` precisa ser um número.** "Melhorou" não é critério; "8 de 10" é.
- **`erro` é o erro mais baixo da cadeia.** Se o problema aparece no braço, olhe o pé.
- **`passos` são imperativos curtos**, de 3 a 6. É o que o professor lê de relance
  com a cesta na mão — não um parágrafo.
- **`execucao`** continua no banco, mas não aparece mais na ficha: quem conta o
  exercício na tela é o passo a passo. Ela serve à **busca** (procurar por uma
  palavra que só está no texto corrido continua funcionando).
- **`erro` é o principal; `erros` são os outros.** A ficha mostra os dois juntos,
  com o principal marcado como "olhe este primeiro" — que é a regra da apostila:
  uma correção por vez, a mais baixa da cadeia. Não repita o principal dentro de
  `erros`; o validador recusa a repetição.
- **`dificultar` é o "como dificultar" do exercício em si**; a progressão por
  nível (`prog`) continua sendo como o mesmo exercício sobe a Trilha. São coisas
  diferentes: uma aperta a atividade, a outra troca o degrau do aluno.

Campos obrigatórios de um exercício novo: os antigos mais `fig` (desenho),
`passos` (3 a 6), `foco` (3+), `erros` (3+), `dificultar` (2+) e `dica`.

Depois, sempre:

```sh
node ferramentas/checar-exercicios.js
```

Ele pega o erro que **não aparece na tela**: uma necessidade escrita errado
(`consistenciaX`) não dá erro nenhum — o exercício simplesmente desaparece da
busca. O script também confere a cobertura: se um tema do mês ficar sem exercício
para algum nível ou algum bloco da aula, ele avisa.

## O plano de aula

**A faixa ⚡ Aula pronta**, logo abaixo das tiras, mostra o tempo todo o que
sairia com o tema e o nível que estão escolhidos naquele momento — *"Forehand e
variações · nível Impulso · 5 exercícios · 51 min"* — sem tocar no plano que o
professor já tem na mão. Os botões **60′** e **90′** põem essa aula no plano e
abrem. É o caminho de dois toques: escolhe o nível, escolhe o tempo, tem aula.

Por isso o cálculo é uma função separada de quem o usa (`montarLista` devolve a
lista e não altera nada; `montarAuto` é quem grava). Conferido nas **72
combinações** de tema × nível × duração: todas saem com os quatro blocos, sem
exercício repetido dentro da mesma aula, entre 46 e 57 min no alvo de 60 e entre
62 e 87 min no alvo de 90.

**A aula sai para ser mexida.** Em cada exercício do plano:

- o **tempo é um campo**, não um rótulo — cortar de 10 para 7 quando a aula
  aperta não obriga mais a tirar o exercício inteiro. O total se refaz na hora,
  e vale no texto copiado e na folha impressa. Voltando ao tempo original, o
  ajuste some (não fica um número "preso" ali);
- **⇄ trocar** abre os outros exercícios do mesmo bloco, já no tema e no nível do
  plano, e troca no lugar com um toque;
- **+ acrescentar em <bloco>** faz o mesmo sem tirar ninguém.

Se não houver nada no tema e no nível para aquele bloco, a tela abre o bloco
inteiro e avisa na primeira linha — é melhor oferecer algo de fora do tema do
que uma lista vazia.

O botão **⚡ Montar aula** da barra de baixo faz o mesmo para 60 min. A montagem
segue as proporções da anatomia da aula JV (18% ativação, 40% tema, 33% jogo, 7%
fechamento), preferindo o que o professor marcou como favorito e depois os
drills da apostila. O plano sai **para ser editado** — tirar, trocar e reordenar
é a parte humana.

- **Copiar / enviar** → texto completo, pronto para o WhatsApp;
- **Imprimir** → uma folha com aluno, nível, data e a ficha completa de cada
  exercício (objetivo, montagem, execução, a variação do nível escolhido, o erro
  a observar e o critério de sucesso). É essa folha que vai para a quadra.

## Quem pode ver isto — decidir antes de divulgar

**Atenção, e é uma decisão de negócio, não técnica.** Este repositório é
**público** e o GitHub Pages publica a pasta inteira. Ou seja: assim que isto
chega ao `main`, o banco fica acessível por quem tiver o endereço — e o conteúdo
dele (os 116 exercícios com objetivo, progressão e critério) é justamente o miolo
da **formação de professores**, que é produto pago.

O que já está feito para reduzir o risco:

- o app leva `<meta name="robots" content="noindex,nofollow">` — não entra no Google;
- **nenhuma página pública aponta para ele** (nem `site/`, nem `site-pro/`);
- **o GitHub Pages não publica mais esta pasta**: o fluxo de publicação
  (`.github/workflows/pages.yml`) apaga `app-exercicios/` da cópia que vai para o
  ar, depois de conferi-la. O endereço `.../familiajk/app-exercicios/` deixa de
  existir — o material continua no repositório, versionado, mas fora do site.

Como usar o app, agora que ele não está mais no endereço público:

**O caminho escolhido: Netlify, como site separado.** No painel do Netlify, crie
um site novo e arraste a pasta `app-exercicios` inteira (o `index.html` precisa
ficar na raiz do que é arrastado — já está). Sai um endereço só seu, que dá para
**adicionar à Tela de Início** do celular e usar offline em quadra. Mexeu no
banco, arraste de novo: o repositório continua sendo a fonte única.

Para mandar a pasta pronta para alguém (ou para o seu próprio celular):

```sh
python3 ferramentas/gerar-zip.py
```

Ele gera `banco-exercicios-jv.zip` com a tela, os dois scripts, os cinco ícones,
o manifest, o service worker, o `robots.txt` e o `netlify.toml`. Os arquivos vão
na **raiz do zip**, sem pasta por cima — assim serve nos dois caminhos: soltando
o `.zip` direto no Netlify o `index.html` cai na raiz do site, e descompactando
antes o iPhone e o Mac criam a pasta sozinhos.

O `LEIA-ME.md` fica **de fora** do zip de propósito: ele traz estas notas
internas, inclusive a conversa sobre o material ser pago, e tudo que entra no
zip vai para o ar.

Se o site for ligado ao GitHub em vez de drag & drop, use *Base directory* =
`app-exercicios` — o `netlify.toml` da pasta já está pronto para isso.

**Do iPhone, em um arquivo só.** Não dá para enviar uma pasta pelo iPhone, e um
`.zip` vira pasta se você tocar nele. Para esse caso existe:

```sh
python3 ferramentas/gerar-arquivo-unico.py
```

Ele gera um `index.html` com tudo embutido — os dois scripts e o ícone da Tela de
Início. Esse arquivo abre com um toque no Safari e pode ser enviado sozinho ao
Netlify. **O nome precisa continuar `index.html`**: é ele que o Netlify serve na
raiz do site. A troca: essa versão **não funciona offline** (o service worker
precisa de um arquivo próprio ao lado). Para offline em quadra, publique a pasta
completa.

Outras opções, se um dia precisar:

- **Abrir o arquivo direto**: `app-exercicios/index.html` funciona aberto do
  próprio aparelho, sem servidor nenhum. Serve para conferir uma mudança.
- **Senha no Netlify**: a proteção por senha do painel é recurso de plano pago.
- **Repositório privado**: é o único jeito de fechar 100% — inclusive o histórico
  do Git, que guarda tudo o que já esteve aqui.

Vale saber: a **apostila** (`metodologia/apostila.md`) já está nesse mesmo
repositório público hoje, embora o README diga que ela fica fora do ar. Se a
decisão for fechar o banco, ela entra na mesma conversa.

## O ícone

O ícone é **próprio deste app**, e não uma cópia do da Gestão. Os apps da JV usam
todos o mesmo logo, e na tela de início do celular viravam três ícones iguais —
esse era o problema a resolver.

Ele se diferencia pelo **assunto**: a quadra de saibro vista de cima com o
trajeto da bola, que é exatamente a linguagem dos 116 desenhos do banco. A
família se mantém por três detalhes tirados do próprio ícone da Gestão: o preto
do fundo, o **verde-limão da marca** (`#CBDD4B`) na borda e a **pastilha com o
nome** encostada na borda de baixo — onde a Gestão escreve `GESTÃO` e o Aluno
escreve `ALUNO`, este escreve `EXERCÍCIOS`.

Os outros dois continuam com a arte original. Duas coisas mudaram lá: o **`JV`,
que era branco e agora é limão** (`#DDEE66`, o mesmo tom do risco sob a marca),
e a **palavra grande**, que é o que se lê primeiro na tela de início — no Aluno
o `TÊNIS` virou `ALUNOS`, e na Gestão o `TÊNIS` ficou e ganhou `GESTÃO` numa
linha nova embaixo. Agora cada app se identifica sem precisar da pastilha, que
no ícone de 60 px do iPhone já não se lê. Quem faz as duas coisas é:

```sh
python3 ferramentas/pintar-jv-limao.py
python3 ferramentas/escrever-nos-icones.py
```

em cima dos próprios PNGs (ícones e telas de abertura), e os dois podem ser
repetidos sem estragar nada.

Para gerar de novo, depois de mexer no desenho:

```sh
node ferramentas/gerar-icone-exercicios.js
```

Ele escreve os cinco arquivos direto nesta pasta: `-192`, `-512`, `-180`
(apple-touch), `-mask` (maskable, para o Android recortar em círculo) e o
`jv-icone-exercicios.png` do `<link rel="icon">`.

Dois detalhes que valem saber: os arquivos são **quadrados**, sem canto
arredondado — o iPhone e o Android aplicam a máscara deles, e arredondar aqui
também deixava uma casquinha preta na borda. E a versão `-mask` tem o desenho
menor, dentro da área segura, porque o Android corta as pontas.

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

### Leitura de outros métodos — 16 exercícios acrescentados

O banco tinha 116 exercícios e passou a **132**. Os 16 novos vieram de uma leitura do
que os outros programas de formação recomendam, com um filtro duro: **só entrou
o que não existia aqui** e o que aparece repetidamente em mais de um método.
Cada um foi reescrito na linguagem da metodologia — níveis da Trilha, blocos da
aula, erro mais baixo da cadeia primeiro — e não é cópia de texto de ninguém.

| De onde veio | O que entrou |
|---|---|
| ITF Play and Stay · Tennis10s (quadra vermelha, laranja, verde) | **T11** saca, troca e pontua desde a primeira aula · **T08** semáforo · **T10** equilibrista da raquete |
| USTA Net Generation (Red) | **T09** limpa a quadra (arremesso por cima do ombro = gesto do saque) |
| LTA Youth · Tennis Australia Hot Shots | **T07** roda-gigante (o "corre-corre") |
| Método espanhol — Pato Álvarez, Bruguera | **F14** equis · **D27** dois contra um · **FH16** dois cruzados e um paralelo |
| Repertório internacional de alto rendimento | **D26** oito deitado (figure-8) · **R18** guerra de voleios cruzados · **BH16** deixada e lob |
| Percepção de bola (linha do *bounce–hit*) | **M12** quica e bate |
| Aquecimento clássico e treino sozinho | **M13** mini-tênis de aquecimento · **FH15** frontão de trinta bolas |
| Correção clássica de trajetória do saque | **S17** saque de joelhos |
| Volta à calma | **T12** mini-troca leve + a frase do dia |

O que esses 16 corrigiram no banco, em número:

| | antes | agora |
|---|---|---|
| nível Base, no tema mais magro (rede) | 9 | 10 |
| nível Base, no tema mais forte (movimentação) | 15 | 23 |
| exercícios que servem turma Kids | 38 | 48 |
| ativação no mês do saque | 2 | 3 |
| fechamento, somando os seis temas | 13 | 19 |

O que **não** entrou, e por quê: *king of the court* (já é o **T05**), pega-pega
(**D5**), alvos e bambolês (**D14**), voleio de reflexo alimentado (**R09**),
saque + 1 (**S05**), zonas de ataque e defesa (**D18**) e placar de pressão
(**D22**). Todos já existiam com outro nome.

### Revisão exercício por exercício — 13 variações acrescentadas

Depois dos 16, o banco foi lido exercício por exercício procurando **a variação
que um treinador sente falta** quando monta a aula. São 13, e o banco tem
**145**:

| lacuna | o que entrou |
|---|---|
| o inside-out não tinha a outra metade | **FH17** inside-in: o paralelo invertido, com a mesma preparação |
| ninguém treinava tirar tempo do adversário | **FH18** na subida, em cima da linha (forehand e backhand) |
| defesa de forehand esticado | **FH19** defesa alta, que dá tempo |
| backhand só tinha cruzado fundo e paralelo | **BH17** ângulo curto de backhand |
| voleio tratado como um golpe só | **R19** voleio baixo × voleio alto · **R20** voleio de backhand, bloco firme |
| rede sem toque | **R21** deixada de voleio |
| lob e smash nunca se encontravam | **R22** lob e smash, valendo ponto |
| saque sem a jogada de rede | **S18** saque e voleio |
| devolução só defensiva | **S19** ataque ao segundo saque |
| **nenhum exercício de duplas de verdade** | **R23** o poach do jogador da rede · **R24** um em cima, um embaixo |
| transição defesa → ataque | **M14** defesa que vira ataque |

Nos exercícios de duplas com quatro pessoas no desenho, a folha diz
**4 (duplas)** em *Nº de jogadores*, em vez de "1 a 4".

## Como a tela está organizada

**O plano de aula também mostra o desenho.** Cada item do plano traz a
miniatura da quadra ao lado do nome, e tocar nela abre a ficha. Sem ela o plano
era uma lista de títulos: para lembrar qual era o exercício, o professor tinha
que abrir a ficha de cada um. No papel a miniatura sai — ali o desenho já vem
em tamanho grande, ao lado do passo a passo.

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

**A ficha é lida de cima para baixo, na ordem de uma folha de treino.** Essa
distribuição substituiu a anterior, que escondia parte do conteúdo atrás de
abas:

1. **faixa de dados** — níveis, duração, jogadores, intensidade e materiais,
   antes de tudo. É por ela que o professor decide se o exercício cabe na aula
   de hoje, sem ler mais nada;
2. **o objetivo**, em uma frase, em corpo maior;
3. **o desenho de um lado e o passo a passo do outro**. Abaixo da figura, a
   frase que conta o que está desenhado — ela existe para todos os exercícios
   do banco e vivia só no `aria-label`, invisível para quem enxerga: *"Sem
   bola: o professor canta a sequência e o aluno executa em sombra, acelerando
   o canto."* Depois dela vêm a montagem e a legenda. Do outro lado, os passos
   numerados e a **dica extra**. No celular as duas colunas viram uma, com o
   desenho em cima; a partir de 720 px ficam lado a lado;
4. **as três colunas do rodapé** — foco do professor, erros mais comuns e como
   dificultar —, as três à vista, cada uma com sua cor no topo. Eram abas, uma
   por vez: em quadra o professor quer bater o olho nas três sem ter que
   escolher qual ver;
5. **funcionou se**, o critério objetivo;
6. só o que não é de quadra fica em **gavetas**: a progressão por nível, a
   versão Kids e formatos/necessidades/tema.

O preço dessa ordem é uma ficha mais comprida no celular: nada está escondido,
então tudo rola. Foi a troca escolhida de propósito — é a distribuição de uma
folha de treino, e é assim que ela se lê.

**Escolheu um nível na tira, a ficha muda com ele.** A variação daquele nível
sobe da gaveta para o corpo da ficha, logo abaixo do objetivo, com o nome do
nível no título. Marcando dois níveis, aparecem os dois — é o caso da turma
mista. A linha do resumo também passa a dizer qual nível está filtrando, para
não haver dúvida sobre de onde veio o número de exercícios.

## A folha de treino — uma página A4 por exercício

O plano impresso mostra **a aula inteira**, em lista, numa folha. A folha de
treino é a outra coisa: **o exercício, um por página**, com tudo à vista e
nada atrás de um toque. É o que o professor leva para a quadra e o que o aluno
consegue ler sozinho — e é o formato que vira PDF.

Dois botões chamam a mesma função:

| onde | botão | o que sai |
|---|---|---|
| dentro da ficha | **🖨 folha** | uma página: aquele exercício |
| no plano de aula | **🖨 folhas** | uma página por exercício do plano, na ordem |
| no plano de aula | **🖨 plano** | o que já existia: a aula inteira numa folha |

Para virar PDF: imprimir e escolher *Salvar como PDF* (no iPhone, o botão de
compartilhar dentro da tela de impressão).

A ordem da página é a mesma da ficha: faixa de dados, objetivo, desenho e
passo a passo lado a lado, dica extra, as três colunas do rodapé, a espiral
dos níveis e o critério de sucesso. Nada é escrito à mão — sai tudo do banco,
então exercício novo já nasce com folha.

**O desenho da página segue a folha modelo que o João criou**
(`ferramentas/originais/modelo-folha-jv.jpg`):

- **barra do topo** preta: troféu verde-limão, a pílula com o critério de
  sucesso (*Funcionou se: …*) e a marca **JV TÊNIS** à direita;
- **cabeçalho** preto: tema e bloco com o fio verde-limão à esquerda, *TREINO
  FH1* enorme em itálico condensado, o nome em verde-limão, a linha de apoio
  em caixa alta (uma linha só: se não couber, fica com menos itens), a frase
  do tema entre aspas, os fios em zigue-zague, a marca JV TÊNIS grande e a
  bola;
- **faixa de dados** clara, com os ícones dentro de círculos verde-limão;
- a **quadra** à esquerda (61,5% da largura) e, à direita, **Como aplicar**
  (passos numerados em círculos limão) e a **Dica extra** num bloco limão;
- embaixo, **três cartões**: foco do treinador, erros mais comuns, como
  dificultar — e a página termina aí, como no modelo.

**A marca JV foi redesenhada em vetor** (`JV_PATH`, no index.html) a partir do
modelo: lá ela tem 118 px de largura, e ampliada para o papel sairia borrada.
O contorno foi tirado do modelo e depois limpo à mão, reta por reta.

**A quadra da folha** tem câmera própria (`CAMERAS.folha`), proporção **0,86**
e os jogadores com **escala de leitura 2,3** (`escalaFig`): em tamanho real
eles viram formigas numa quadra inteira vista do alto. Na tela do celular a
escala é 1,4. As **145 folhas cabem em A4** sem nada transbordar dos cartões —
medido com a fonte já carregada, que é o que conta.

**A letra é a Barlow Condensed** (`fonte-barlow-condensed-*.woff2`, licença SIL
OFL 1.1 em `LICENCA-FONTE-BARLOW.txt`), embutida no app e no arquivo único.
Sem ela a folha sai na fonte do sistema, mais larga, e os cartões de baixo
transbordam. Por isso ela está no cache do service worker.

A câmera da folha (`CAMERAS.folha`: 36 m atrás, 25 m de altura) foi achada
por busca para bater três medidas da quadra do modelo: largura do fundo de lá
/ de cá = 0,66, altura da quadra / largura do fundo de cá = 1,035 e a rede a
40% da altura.

**Detalhes que custaram para acertar:**

- `print-color-adjust:exact` na folha. Sem isso o Chrome e o Safari imprimem a
  faixa escura do cabeçalho em branco, porque fundo colorido, por padrão, não
  vai para o papel.
- As folhas são montadas **só na hora de imprimir** e desmontadas depois. Num
  plano de seis exercícios seriam seis quadras desenhadas à toa dentro da
  rolagem.
- O `onafterprint` não é confiável no Safari do iPhone, então um tempo de 4
  segundos é a rede de segurança que limpa a tela de qualquer jeito.
- A página cabe em A4 com folga (as folhas medidas ficaram entre 930 e 1025 px
  de 1040 úteis). Exercício com passo a passo muito longo é o que pode passar:
  se acontecer, encurte um passo, não o corpo da letra.

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
em quadra e desenhar todos eles na hora. Para trocar por foto de verdade, veja a
seção *Trocar o desenho por foto* mais abaixo. É isso que faz, de graça e sem
ajuste em exercício nenhum, o jogador do fundo sair menor que o da rede, a linha
de base de longe sair mais fina que a de perto, e a rede aparecer na frente de
quem está atrás dela e atrás de quem está na frente.

**Nada mudou no jeito de escrever os exercícios.** Eles continuam em metros de
quadra, exatamente como antes — foi o que permitiu virar todos os desenhos de uma
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

**Para que lado cada jogador olha, o desenho deduz sozinho.** Quem está no
começo de uma bola bate, e olha para onde ela vai; quem está no fim recebe, e
olha para de onde ela vem. Sem bola por perto, vale o deslocamento — num
exercício de footwork o aluno corre para onde a seta aponta, e é para lá que ele
tem que estar virado. Quando a bola vai reta para a rede não há lado, e a pose
fica como está.

Isso é deduzido em vez de marcado à mão em cada exercício porque marcar à mão
seria errar em algum e nunca descobrir. Dos **209 jogadores** dos desenhos, 128
têm direção clara e **61 são espelhados** para bater no lado certo.

### Os jogadores: as figuras que o João criou

Todos os jogadores do desenho saem da **prancha de poses da JV**
(`ferramentas/originais/prancha-poses-jv.png`), criada pelo João com autoria
própria: a mesma pessoa, de camisa preta JV, em vista de frente, de costas e
de perfil. O `ferramentas/recortar-poses-jv.py` recorta cada pose (camisa
preta sobre fundo preto não se recorta por cor: quem separa é o modelo
BiRefNet, do rembg), grava os `.webp` e imprime a altura, a proporção e onde
ficam os pés de cada um — os números da tabela `FIG`, no `quadra.js`.

**Quem é quem** fica no **aro colorido embaixo dos pés**, nas cores da legenda:
dourado o aluno, branco o professor, azul o colega. Repintar a camisa
estragaria o que a figura tem de mais reconhecível — a camisa preta com o JV.

**De frente ou de costas.** A câmera fica atrás da linha de base: quem está
do lado de cá (`y > 0`) aparece de costas; além da rede, de frente.

| pose (5º campo) | de costas (lado de cá) | de frente (além da rede) | lado |
|---|---|---|---|
| *(nenhuma)* / `espera` | espera de costas | espera de frente, raquete à frente | — |
| `prepara` | golpe de fundo de costas | golpe de fundo de frente | onde a bola chega |
| `forehand` / `backhand` | idem | idem | forçado pelo golpe |
| `voleio` | voleio de perfil | voleio de perfil | onde a bola chega |
| `saque` | saque de costas, raquete atrás da cabeça | saque de frente, bola lançada | destro |
| `aproxima` | aproximação à rede, de perfil | idem | para onde ele vai |
| `desloca` | deslocamento lateral, de perfil | idem | para onde ele vai |

**O lado da raquete** sai de onde a bola **chega** nele (`ladoDoGolpe`): bola
caindo à direita da imagem, raquete à direita. De costas isso é o forehand; de
frente, a raquete à esquerda da imagem é a direita dele — o forehand. A
prancha tem **os dois golpes de frente desenhados de verdade**, e o forehand
de costas; o backhand de costas (que na prancha esconde a raquete) e as poses
de perfil viradas para o outro lado são o espelho, **com o logo JV
desespelhado** — espelhar a pessoa troca a mão, mas o "JV" não pode virar
"VL". Nos exercícios de um golpe só, `forehand`/`backhand` forçam o lado: é o
que salva o inside-out (FH2) e o inside-in (FH17).

**A figura é ancorada pelos pés**, não pelo meio da imagem: a raquete
esticada para um lado empurrava a pessoa para o outro.

Para conferir o lado depois de mexer em desenho: `node ferramentas/auditar-lado.js`
— lista cada jogador, o lado escolhido, as bolas que chegam e saem, e marca
`!!` quando o tema é de um golpe só e o lado contradiz.

**Para trocar ou acrescentar uma pose:** acrescente a figura na prancha (ou
uma prancha nova), ponha a caixa dela em `POSES` no `recortar-poses-jv.py`,
rode, e copie a linha impressa para `FIG`.

## Trocar o desenho por foto

O app **já está pronto para receber as fotos** — falta só tirá-las. Nada do
material de outro professor é usado: as pessoas têm que ser as da JV.

### Por que não é uma foto por exercício

Uma foto por exercício seriam mais de cem imagens de alta resolução, dezenas de
megabytes, num app que hoje tem 300 KB e abre offline em quadra. E imagem
gerada por IA não coloca o jogador no metro certo — e é exatamente o metro
certo que o desenho serve para dizer.

O jeito que funciona, e que o mercado usa, é **uma foto de fundo da quadra
vazia com as pessoas e as setas por cima**. A mesma foto serve em todos. O que
muda de exercício para exercício é a camada de cima, que continua vindo dos
metros.

### A foto que falta

**A quadra vazia** — uma só. Com ela o desenho troca o saibro desenhado pela
foto da quadra da JV, com as figuras e as setas por cima.

- de **trás da linha de base**, no meio (em cima da marca central);
- câmera **o mais alta que der**: escada, arquibancada, bastão com o celular
  na ponta. Quanto mais alta, menos as pessoas se escondem umas atrás das
  outras no desenho;
- apontada para o **meio da rede**, mostrando a quadra inteira;
- **sem pessoas, sem bolas, sem cestos**;
- **sem grande-angular** (no iPhone, o "1x", nunca o "0,5x");
- o celular **na horizontal**, o mais nivelado possível.

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

As figuras continuam por cima da foto do mesmo jeito: quem as posiciona é a
mesma câmera, achada pelo `calibrar-foto.py`.

O `gerar-zip.py` leva as fotos junto sozinho, e o `gerar-arquivo-unico.py`
embute cada uma como data URI (e avisa se o arquivo único passar de 1,5 MB, que
é quando vale mais publicar a pasta completa).

## Meus exercícios — criar e editar no celular

O botão **✎** no cabeçalho abre *Meus exercícios*. O que você cria ali fica
**neste aparelho** (localStorage) e entra em tudo: busca, filtros, aula pronta,
plano e impressão. Na lista os seus aparecem junto com os do banco; o filtro
**Só os meus** separa, e a ficha diz a origem.

**Os exercícios do banco não se editam pelo celular, de propósito.** Eles vêm de
`exercicios.js` — são a metodologia, e mudá-los sem querer em quadra seria pior
que não poder mudá-los. Para alterar um deles, é no arquivo (seção acima).

O código dos seus sai como `JV01`, `JV02`… O banco usa D, F, M, FH, BH, R, S e
T, então não há risco de dois exercícios com o mesmo código.

**O desenho.** Desenhar uma quadra num celular pediria um editor de arrastar que
ninguém usaria em quadra. Em vez disso: escolha entre **oito cenas prontas**
(professor lança, dois peloteando, aluno na rede, cones no fundo, saque e
devolução, alvo do outro lado, mini quadra, quadra vazia) — ou **copie o desenho
de qualquer exercício do banco** e escreva a frase que explica a cena. É a mesma frase
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

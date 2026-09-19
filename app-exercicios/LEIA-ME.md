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
a forma. Nos dois casos a moldura **enquadra a ação** em vez de mostrar o recorte
inteiro: meia quadra vazia só empurra o texto para baixo da dobra.

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

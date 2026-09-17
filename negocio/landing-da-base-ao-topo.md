# Landing page · Tênis da Base ao Topo

Estrutura da página `site/da-base-ao-topo.html`. Documento de decisão: por que
cada seção existe, o que ela diz e como se comporta no celular.

## Decisões que valem antes de ler seção por seção

**Para quem é a página.** Para o **aluno e o pai/mãe de aluno** — alguém que quer
aprender ou voltar a jogar tênis em Curitiba. Não é a página de professores
(essa é `site-pro/curso.html`, que vende a formação). Se um dia a mesma estrutura
for apontada para professores, o que muda é a seção 2 (o problema passa a ser
"cada aula é uma aula") e a 7 (para quem é).

**Uma página, um objetivo.** Toda a página empurra para **uma** ação: marcar a
**aula de avaliação** pelo WhatsApp. Por isso ela não tem menu de navegação — LP
não oferece saída. O topo tem só a marca e o botão; o rodapé não distribui
visitas para o site.

**A régua da promessa.** Nada na página promete resultado que o método não
entrega: não tem "aprenda tênis em 30 dias". A promessa é de **ordem e critério** —
saber o que treinar, em que ordem e como medir. É o que a metodologia realmente
faz, e é o que sustenta preço premium sem depender de exagero.

**Números usados.** Todos verificáveis: 6 temas do mês em 2 ciclos por ano,
5 níveis da Trilha, 6 camadas da Pirâmide, 116 exercícios catalogados no banco,
nota 5,0 no Google. Nenhum número inventado.

**Depoimentos.** A página **não inventa depoimento**. A prova social publicada é
a nota real do Google. Os três cartões de depoimento estão prontos no HTML, mas
**comentados** — é colar a avaliação real (nome e texto) e descomentar. Enquanto
isso a página está completa e honesta.

**Mobile primeiro, de verdade.** Tudo foi desenhado para uma tela de 390 px e só
depois cresce. Regras que valem em toda a página:

- uma coluna sempre; grade só a partir de 720 px;
- nenhum bloco de texto passa de 3 linhas antes de um respiro visual;
- CTA tem 52 px de altura e ocupa a largura da tela; o botão do cabeçalho e cada
  pergunta do FAQ têm 44 px, o mínimo de área de toque;
- botão flutuante de WhatsApp fixo no canto, sempre alcançável pelo polegar;
- foto sempre em 3:4 (retrato), que é o formato que o celular já tem;
- nada de animação que atrase a leitura — só uma entrada suave, desligada quando
  o aparelho pede menos movimento. E ela é **opcional por construção**: o
  conteúdo é visível por padrão e só é escondido depois de o script confirmar
  que vai animar, com rede de segurança de 4 segundos. Página em branco por
  causa de animação é o pior defeito possível numa LP.

---

## 1 · Hero inicial

**Objetivo.** Em 3 segundos, dizer o que é, para quem é e por que é diferente — e
oferecer a primeira ação. É a única seção que a maioria vai ler inteira.

**Headline.** *Tênis da base ao topo.*
**Sub-headline.** *O método que começa nos pés — e leva você do primeiro contato
com a quadra até o jogo que não desmonta na pressão.*

**Texto curto.** Em Curitiba, na Academia JV Tênis: aula com método, ordem e
critério de evolução. Do primeiro dia à competição.

**Elementos visuais.** Foto vertical da quadra de saibro em escurecimento
(gradiente navy sobre a imagem, para o texto ter contraste). Etiqueta dourada
"Metodologia autoral · Curitiba". Selo da nota 5,0 do Google logo abaixo dos
botões — prova social antes de qualquer promessa.

**CTA.** Principal: **Marcar aula de avaliação** (WhatsApp).
Secundário, discreto: *ver como funciona ↓* (rola para a seção 4).

**Layout mobile.** Tela cheia de altura mínima 92svh, texto alinhado à esquerda,
headline em 2 linhas no máximo, botão principal com a largura da tela, secundário
como texto sublinhado. A foto entra como fundo, não como bloco separado.

---

## 2 · O problema do aluno

**Objetivo.** Fazer o visitante reconhecer a própria história em três frases. Sem
identificação, o resto da página não tem para que existir.

**Headline.** *Você não travou por falta de talento.*

**Texto curto.** A aula tradicional começa pela raquete: "segura assim, gira,
bate". Funciona enquanto a bola vem mansa. Quando o tênis vira jogo, aquela
técnica ensaiada na cesta desmonta — e a conclusão errada é sempre a mesma:
"não levo jeito".

**Elementos visuais.** Lista de 4 dores, cada uma num cartão com um ✕ vermelho
alinhado à esquerda:
- chega atrasado na bola e bate desequilibrado;
- treina há meses e não sabe dizer o que melhorou;
- na aula acerta, no jogo erra;
- cada aula parece um assunto novo, sem sequência.

Fecha com uma frase de virada em dourado: *O golpe é a parte visível. O erro está
três elos antes — nos pés.*

**CTA.** Nenhum. Aqui ainda se constrói o problema; vender agora quebra o ritmo.

**Layout mobile.** Cartões empilhados, um por linha, com 12 px de respiro. A
frase de virada isolada, com mais espaço em volta do que qualquer outro texto da
página — é o gancho para a seção 3.

---

## 3 · A metodologia

**Objetivo.** Apresentar o método como resposta direta ao problema da seção 2 e
estabelecer autoridade técnica: isso não é jeito de dar aula, é método com tese.

**Headline.** *Da Base ao Topo: o tênis ensinado na ordem em que o corpo executa.*

**Texto curto.** Primeiro os pés e a base. Depois a movimentação. Depois o
posicionamento. E só então a batida — aprendida com o corpo no lugar certo, no
tempo certo. O nome tem dois sentidos, e os dois são de propósito: da base do
corpo ao topo do gesto, e da primeira aula ao jogo competitivo.

**Elementos visuais.** A **Pirâmide** das 6 camadas desenhada de baixo pra cima
(blocos empilhados, cada um com cor e número, o de baixo mais largo). Ao lado
(ou abaixo, no celular), a citação do fundador com foto pequena e assinatura.

**CTA.** Nenhum — a seção 4 é a continuação natural.

**Layout mobile.** A pirâmide vira blocos empilhados em largura decrescente de
baixo para cima; toque em cada bloco não é necessário (é uma imagem-conceito, não
um menu). A citação fica depois, em cartão com borda dourada.

---

## 4 · Como funciona o método

**Objetivo.** Transformar "metodologia" em algo palpável e organizado. É a seção
que sustenta a percepção premium: o visitante entende que existe estrutura por
trás do preço.

**Headline.** *Três engrenagens que giram juntas.*

**Texto curto.** A Pirâmide diz **o que** se ensina. A Trilha diz **para quem**.
O calendário diz **quando**. Junto, isso responde a pergunta que quase nenhuma
academia responde: o que exatamente vai acontecer nas suas próximas 12 aulas.

**Elementos visuais.** Três cartões numerados:
1. **A Pirâmide — o conteúdo.** Seis camadas, de baixo pra cima.
2. **A Trilha — o seu lugar.** Cinco níveis, com régua objetiva de troca de bola.
3. **O calendário — o tema do mês.** Seis temas que rodam duas vezes por ano.

Depois, a **tabela do ano inteiro** (mês → tema), com o mês atual em destaque
dourado. É o elemento mais convincente da página: mostra organização em vez de
prometer organização.

**CTA.** Intermediário, sem peso: **Quero começar pelo meu nível** (WhatsApp).

**Layout mobile.** Cartões empilhados; a tabela do ano vira uma lista de 6 linhas
(mês à esquerda, tema à direita), com a linha do mês atual em destaque. Nada de
rolagem horizontal.

---

## 5 · Demonstração visual dos treinos

**Objetivo.** Provar aplicação prática. Sair do discurso e mostrar a aula
acontecendo — é a seção que separa esta página de qualquer folder genérico.

**Headline.** *É assim que a sua aula é montada.*

**Texto curto.** Toda aula tem a mesma espinha dorsal, em quatro blocos. O que
muda é o tema do mês e a intensidade do seu nível.

**Elementos visuais.**
- **Ficha de aula real**: os 4 blocos com tempo (Ativação 8–12 min · Tema do dia
  20–25 min · Aplicação em jogo 15–20 min · Fechamento 3–5 min), cada um com uma
  linha de exemplo do mês atual.
- **Cartão de exercício** de verdade, tirado do banco (nome, objetivo, o erro que
  o professor observa primeiro, e o critério de sucesso em número). Mostrar o
  *critério de sucesso* é o detalhe que comunica profissionalismo.
- **Foto** de treino na quadra ao lado.
- Faixa com três números: **6 temas · 5 níveis · 116 exercícios catalogados**.

**CTA.** Nenhum — deixar a prova respirar.

**Layout mobile.** Ficha de aula primeiro (é o que mais convence), foto depois,
cartão de exercício por último. Os três números em linha única, centralizados.

---

## 6 · Benefícios

**Objetivo.** Traduzir método em ganho pessoal. A seção 4 fala da estrutura; esta
fala do que o aluno leva.

**Headline.** *O que muda no seu tênis.*

**Texto curto.** Nenhum (os cartões falam sozinhos — texto aqui é ruído).

**Elementos visuais.** Seis cartões com ícone, título curto e uma linha:
- **Você chega na bola** — pé antes de braço, e o golpe fica fácil.
- **Sabe o que treinou** — sai de cada aula sabendo o que evoluiu e por quê.
- **Evolui com critério** — avança quem cumpre o critério, não quem faz tempo.
- **Joga desde o primeiro dia** — jogo adaptado ao que você já sustenta.
- **Aguenta a pressão** — técnica construída sobre base não desmonta no jogo.
- **Tem para onde ir** — Barragem interna, grupos A a D, do iniciante ao avançado.

**CTA.** Nenhum.

**Layout mobile.** Uma coluna, ícone acima do título. A partir de 720 px, três
colunas.

---

## 7 · Para quem é

**Objetivo.** Qualificar. Dizer com clareza para quem serve — e, por consequência,
para quem não serve. Página premium não tenta abraçar todo mundo.

**Headline.** *Para quem é.*

**Texto curto.** O método é o mesmo para todos; o caminho é de cada um.

**Elementos visuais.** Quatro cartões:
- **Nunca jogou** — começa aprendendo a estar em quadra, e joga na primeira aula;
- **Joga mas travou** — reconstrói a base e destrava o que não evoluía;
- **Criança (Kids)** — a mesma Trilha na linguagem da idade, tudo em forma de jogo;
- **Compete** — refinamento, padrões próprios e cabeça de jogo.

E uma linha honesta de exclusão, em cinza: *Se você procura só bater bola sem
método nem sequência, provavelmente não é aqui.*

**CTA.** **Qual é o meu nível?** (WhatsApp) — CTA de baixo compromisso, que
converte quem ainda tem dúvida sobre se "serve para mim".

**Layout mobile.** Cartões empilhados. A linha de exclusão em fonte menor, sem
cartão, depois dos quatro.

---

## 8 · Diferenciais da Academia JV Tênis

**Objetivo.** Sair do método e vender a **experiência**. É aqui que se justifica o
posicionamento premium: o que a academia entrega além da aula.

**Headline.** *Por que na JV Tênis.*

**Texto curto.** Quatro pilares que valem para toda aula: pontualidade,
profissionalismo, equilíbrio e aprendizado.

**Elementos visuais.** Grade de diferenciais, cada um em uma linha com ícone:
- **Metodologia autoral e documentada** — apostila própria, testada no saibro;
- **Saibro em Santa Felicidade** — quadra que ensina a se apoiar;
- **Turma pequena de verdade** — Particular, Dupla, Trio, Quarteto e Kids;
- **Sistema Flex** — remarcação com regra clara, sem aula perdida;
- **App do aluno** — agenda, presença e pagamento no celular;
- **Barragem** — torneio interno com grupos, do iniciante ao avançado;
- **Parceria Personal** — a parte física conversando com a fase do seu treino.

**CTA.** Nenhum (a seção 9 emenda com prova).

**Layout mobile.** Lista de linhas, não grade de cartões — lista rola melhor e
lê mais rápido no polegar.

---

## 9 · Prova social

**Objetivo.** Reduzir risco na hora da decisão, com prova que o visitante pode
conferir sozinho.

**Headline.** *Quem treina aqui.*

**Texto curto.** Nenhum.

**Elementos visuais.**
- **Selo Google 5,0** grande, com estrelas e link para as avaliações reais;
- os três números do método (6 temas · 5 níveis · 116 exercícios);
- **três cartões de depoimento** — prontos no HTML, comentados, para colar
  avaliação real. Não publicar depoimento inventado, em nenhuma hipótese.

**CTA.** Link discreto: *ver as avaliações no Google →*.

**Layout mobile.** Selo primeiro e centralizado; depoimentos (quando existirem)
empilhados, um por linha, com nome e a nota em estrelas.

---

## 10 · Perguntas frequentes

**Objetivo.** Derrubar as objeções que travam a mensagem no WhatsApp. Cada
pergunta aqui é uma objeção real, respondida sem enrolação.

**Headline.** *Perguntas que todo mundo faz.*

**Perguntas (7).**
1. Nunca joguei. Consigo acompanhar? → Sim; o nível Base existe exatamente para isso.
2. Preciso ter raquete? → Não na primeira aula; emprestamos e ajudamos a escolher depois.
3. Quanto tempo até eu jogar de verdade? → Você joga na primeira aula, em jogo adaptado.
4. Como sei que estou evoluindo? → Pela régua de troca de bola e pela ficha de avaliação, com números.
5. Aula é individual ou em grupo? → Particular, Dupla, Trio, Quarteto e Kids. O nível é do aluno, não da turma.
6. E se eu faltar? → Sistema Flex, com regra de remarcação clara e prazo definido.
7. Tem aula para criança? → Sim. A mesma Trilha na linguagem da idade.

**Elementos visuais.** Acordeão nativo (`<details>`), fechado por padrão, com
"+" que vira "–". Nada de biblioteca.

**CTA.** Nenhum — o próximo bloco é o CTA final.

**Layout mobile.** Cada pergunta com área de toque de 48 px; resposta em no
máximo 3 linhas.

---

## 11 · Chamada final

**Objetivo.** Converter quem leu tudo, com uma única ação e zero distração.

**Headline.** *Comece pela base. Chegue ao topo.*

**Texto curto.** Marque uma aula de avaliação: a gente mede seu nível, você
entende a Trilha e sai sabendo exatamente qual é o próximo passo.

**Elementos visuais.** Fundo navy mais escuro que o resto da página (fecha o
ritmo visual), headline grande, botão dourado único e, abaixo, endereço e
horário em texto pequeno — quem chega aqui quer saber se é perto.

**CTA.** **Marcar aula de avaliação** (WhatsApp, com mensagem já escrita).

**Layout mobile.** Tudo centralizado, botão com a largura da tela, endereço
clicável (abre o mapa). Botão flutuante de WhatsApp continua no canto.

---

## Ordem de leitura e por que ela é essa

1–2 cria identificação · 3–4 entrega autoridade e organização · 5 prova aplicação
prática · 6–7 traduz em ganho e qualifica · 8–9 sustenta o premium e reduz risco ·
10 derruba objeção · 11 converte.

A ordem importa: **prova (5) vem antes de benefício (6)**, porque benefício sem
prova soa a propaganda; e **qualificação (7) vem antes de diferencial (8)**,
porque quem já se reconheceu como público lê os diferenciais como vantagem, não
como preço.

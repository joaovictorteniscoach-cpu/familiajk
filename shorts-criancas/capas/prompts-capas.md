# Capas (thumbnails)

## Antes de tudo: em Short, a capa é duas coisas

1. **O primeiro quadro do vídeo** é o que aparece quando o Short entra no feed
   e começa a rodar sozinho. É ele que decide os 3 segundos. Por isso o bloco 1
   de cada episódio já abre com o objeto em movimento e o personagem em pose de
   surpresa — a "capa real" está dentro do vídeo.
2. **A capa personalizada** aparece na grade do canal, na busca e na aba
   Shorts. Ela é o que faz alguém abrir o vídeo *depois*, e é o que dá cara de
   canal para a grade inteira.

As duas precisam existir. Quem só cuida da capa personalizada perde o feed;
quem só cuida do primeiro quadro perde a grade.

## Regras de composição (para telas de 5 cm)

- **Um assunto só.** Um personagem, um objeto, nada mais.
- **O rosto grande**, ocupando pelo menos um terço da altura, olhando para a
  câmera.
- **Máximo 3 palavras** de texto, em caixa alta, fonte gorda e arredondada,
  com contorno branco grosso. O texto entra **depois, no editor** — nunca
  pedido ao gerador de imagem, que erra letra.
- **Contraste de fundo:** se o personagem é amarelo, o fundo é azul. Cor
  complementar, sempre.
- **Teste do polegar:** reduza a imagem para 200 px de largura. Se você não
  entende em meio segundo, refaça.
- **Sem seta vermelha, sem cara de choque, sem contagem regressiva.** Isso é
  linguagem de canal adulto e desalinha do público.

## Prompts

> `{ESTILO}` e `{PALETA}` vêm de [`../02-biblia-visual.md`](../02-biblia-visual.md).
> Proporção `9:16`. Sempre passar Zuzu e Bibi como referência para o personagem
> sair idêntico ao dos vídeos.

### Capa EP01 — o ovo

```
{ESTILO}
{PALETA}

Vertical poster composition. Centre: the huge striped egg, cracked at the top,
with two long soft rabbit ears sticking out and flopping over the shell. Zuzu
leans in from the bottom left corner, only his head and one raised ear in
frame, huge sparkling eyes looking straight at the camera with an amazed
expression. Deep sky-blue background with soft radial glow behind the egg,
generous empty space in the upper third. Big simple shapes, strong silhouette,
readable when very small. No text anywhere.
```

Texto a acrescentar no editor, terço superior: **QUEM TÁ AÍ?**

### Capa EP02 — as tintas

```
{ESTILO}
{PALETA}

Vertical poster composition. Centre: one open paint pot seen slightly from
above, the paint inside caught mid-swirl, half vivid sky-blue and half sunny
yellow twisting into each other with the first streaks of green. Zuzu leans in
from the bottom right, head and one ear in frame, eyes wide, looking straight
at the camera. Bibi hovers in the top left holding a small stick. Deep
cherry-red background with a soft radial glow, generous empty space in the
upper third. Big simple shapes, strong silhouette, readable when very small.
No text anywhere.
```

Texto no editor: **QUE COR?**

### Capa EP03 — as bananas

```
{ESTILO}
{PALETA}

Vertical poster composition. Centre: a bunch of five oversized glossy golden
bananas hanging and swinging. Zuzu is right below with his head tilted up and
one banana hidden behind his ear, visible to the viewer but not to him; he
looks straight at the camera with a big surprised smile. Deep cobalt-blue
background with a soft radial glow, generous empty space in the upper third.
Big simple shapes, strong silhouette, readable when very small. No text
anywhere.
```

Texto no editor: **CONTA COMIGO**

## Padrão da grade do canal

As três capas usam o mesmo esqueleto: objeto no centro, Zuzu entrando por um
canto de baixo olhando para a câmera, fundo chapado de cor complementar, texto
no terço superior. Repetir esse esqueleto em todos os episódios — é o que faz a
grade do canal parecer uma coleção, e coleção é o que faz assinar.

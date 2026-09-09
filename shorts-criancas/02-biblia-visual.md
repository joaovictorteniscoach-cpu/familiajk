# Bíblia visual — canal "Zuzu & Bibi"

Isto é gerado **uma vez** e reaproveitado em todos os episódios. É o que faz os
vídeos parecerem do mesmo canal, e é o que economiza crédito depois: cada
episódio novo só gera os blocos, nunca os personagens.

## Estilo travado: 3D colorido, saturação alta

Fórmula do estilo. Cole **idêntica, sem traduzir e sem editar**, em toda
geração de imagem e de vídeo:

```
colorful stylized 3D cartoon: deliberately rounded chunky character proportions
with oversized sparkling expressive eyes, wide warm smiles and clear readable
silhouettes, glossy toy-like clean surfaces, soft near-shadowless studio
lighting, cartoonish high-gloss CGI never photoreal, ULTRA-VIVID
high-saturation candy palette turned up bold and punchy (cherry red, sky blue,
sunny yellow, lime green, orange at full intensity — never muted, never
pastel), cozy storybook environments with rounded friendly shapes under a
bright blue sky with fluffy clouds, safe friendly upbeat mood with adventure
but no real danger, lively springy comedic motion accents (sweat drops,
surprise marks, whoosh effects).
```

**Trava de paleta** (acrescentar sempre):

```
PALETTE LOCK: vivid high-saturation candy primaries of the reference images,
turned up bold — no muted or pastel drift, no new colors; each recurring hero
keeps one consistent signature color.
```

Referências de estilo (importar as duas com `media_import_url` e passar como
`image_references` na geração da chave de estilo):

- `https://static.higgsfield.ai/faceless/colorful_3d_1.jpeg`
- `https://static.higgsfield.ai/faceless/colorful_3d_2.jpeg`

> As referências doam **só o traço e a paleta**. Nunca copiar os personagens
> delas, nunca usá-las como quadro do vídeo.

## Regras de prompt que não se quebram

- **Nunca escrever texto dentro da imagem.** Toda palavra na tela entra depois,
  na legenda. Modelo de imagem erra letra e destrói a capa.
- **Nunca usar as palavras `child`, `kid`, `childlike` no prompt.** Use
  `small`, `naive`, `simple`, `friendly`. É gatilho de bloqueio.
- **Nunca citar marca, estúdio ou personagem existente.** Descreva o traço.
- **Personagem não fala na tela.** Ele reage: acena, pisca, bate palma, olha
  para a câmera. A voz é sempre de fora, adicionada depois.
- **Fundo sempre cenário montado**, nunca objeto solto em fundo branco.

## Os mascotes

### Zuzu — o curioso (cor-assinatura: amarelo sol)

Bolinha redonda amarela do tamanho de uma bola de tênis, com duas orelhas
grandes e macias que se mexem sozinhas, olhos enormes e brilhantes, uma boca
pequenina de sorriso e dois pezinhos laranja. Não tem braços — usa as orelhas
para apontar. É o que faz a pergunta.

**Prompt do asset** (imagem, proporção `2:3`):

```
{FÓRMULA DO ESTILO}

Character reference sheet of "Zuzu": a small round bright yellow creature the
size of a tennis ball, two oversized soft floppy ears that curl at the tips,
huge sparkling round eyes with big black pupils and white glints, one tiny
curved smile, two small orange feet, no arms — the ears work as hands. Glossy
toy surface. Three views on one sheet: full body front, full body three-quarter,
and a close-up of the face with a curious raised-ear expression. Plain flat
sky-blue backdrop. No text anywhere.

PALETTE LOCK: {TRAVA DE PALETA}
```

### Bibi — a que sabe (cor-assinatura: vermelho cereja)

Joaninha vermelha com bolinhas pretas grandes, antenas com bolinha na ponta,
óculos redondos azuis e um sorrisão. É quem confirma a resposta e comemora.

**Prompt do asset** (imagem, proporção `2:3`):

```
{FÓRMULA DO ESTILO}

Character reference sheet of "Bibi": a round cherry-red ladybug with four big
black dots, two antennae topped with little round beads, oversized round blue
glasses, huge sparkling eyes behind the lenses, a wide happy smile, tiny black
legs, small glossy wings slightly open. Glossy toy surface. Three views on one
sheet: full body front, full body three-quarter, and a close-up of the face
mid-cheer with both antennae up. Plain flat sunny-yellow backdrop. No text
anywhere.

PALETTE LOCK: {TRAVA DE PALETA}
```

### Cenário fixo — a Clareira das Surpresas

**Prompt do asset** (imagem, proporção `9:16`):

```
{FÓRMULA DO ESTILO}

Location reference: a small round grassy clearing of lime-green grass with soft
rounded hills, three chunky rounded trees with candy-green foliage, a few
oversized red and orange flowers, smooth river stones, a bright blue sky with
big fluffy white clouds. Empty stage in the centre of the clearing with
generous room for characters. Sunny, warm, safe. No characters, no text.

PALETTE LOCK: {TRAVA DE PALETA}
```

### Objeto-condutor — o Ovo Surpresa

**Prompt do asset** (imagem, proporção `1:1`):

```
{FÓRMULA DO ESTILO}

Prop reference: one oversized glossy egg, taller than a person's knee, painted
in bold horizontal stripes of cherry red, sunny yellow and sky blue, with a
zig-zag crack starting near the top. Smooth toy-like shine, soft rounded
shadow beneath it. Three states side by side on one sheet: closed, cracked
open at the top, and fully open in two halves. Plain flat white backdrop. No
text.

PALETTE LOCK: {TRAVA DE PALETA}
```

## Assinatura sonora do canal

Sempre a mesma, em todos os vídeos — é o que a criança reconhece antes de olhar:

- **0,0s** — "ding!" de sininho subindo (duas notas).
- **Cada aparição do Zuzu** — "poc" macio.
- **Revelação** — acorde de marimba subindo + palminhas.
- **Fim** — o mesmo "ding!" da abertura, fechando o ciclo.

## Ordem em que os assets entram no prompt do vídeo

Sempre **cenário → personagens → objeto**. Trocar a ordem faz o modelo
reconstruir a cena e perder a identidade dos personagens. Máximo de 7
referências por bloco.

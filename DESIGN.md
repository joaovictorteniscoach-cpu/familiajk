---
# DESIGN.md — como as telas da academia devem parecer.
# Formato DESIGN.md (Google Stitch): tokens aqui em cima, regras em texto abaixo.
# Vale para a Gestão (app-gestao/) e o App do Aluno (app-aluno/), tema Saibro.
# Não vale para app-familia/ nem para site/ e site-pro/, que têm estilo próprio.
# Valores medidos nas telas publicadas (v2026-10-27-1, celular de 390 px).
nome: Academia João Victor Tênis — Gestão e App do Aluno
atualizado: 2026-10-27
tema_padrao: Saibro            # alternativa do usuário: "Verde clássico"
cores:
  fundo: "#091711"             # verde quase preto; topo com a foto da quadra de saibro
  cartao: "rgba(31,45,39,0.42)" # vidro escuro semitransparente (o fundo aparece)
  painel: "rgba(39,53,47,0.42)"
  texto: "#F8F5ED"             # creme
  texto_secundario: "#B9C2B8"
  linha: "rgba(232,214,190,0.25)" # areia, fina
  saibro: "#E0824F"            # destaque: aba ativa, link, número em destaque
  saibro_gradiente: ["#EAA27B", "#DE7034"] # segmento/botão escolhido; texto escuro por cima
  saibro_forte: "#B54E29"      # escolhido sobre fundo claro (aluno), texto branco
  bolinha: "#D4E157"           # positivo: "pago", subiu, entrou; texto escuro #1E2A0E sobre ela
  papel: "#F3EDE4"             # janelas que sobem de baixo (aluno)
  tinta: "#101E18"             # texto sobre papel e sobre botões claros
  livre: "#FFFFFF"             # horário livre na agenda do aluno, borda #BFDCC4
  fechado: "#E9E5DD"           # horário fechado na agenda do aluno, texto #5F584D
  status_bar: "#071E19"        # <meta name="theme-color">
fontes:
  texto: "DM Sans"             # pesos 300–700; tudo usa esta
  destaque: "Cormorant Garamond" # só a frase grande do topo do Início da Gestão
tamanhos:
  letra_minima_aluno: 12px     # células da grade da semana: 11px (coluna estreita)
  campo: 16px                  # evita o zoom automático do iPhone
  titulo_cartao: 16.5px/600
  numero_grande: 30px/700
  texto_secundario_gestao: 11.5px
cantos:
  cartao: 16–18px
  botao: 10px
  campo: 11px
  segmento: 7–9px
  janela_que_sobe: "20px 20px 0 0"
toque_minimo: 44px
sombra_cartao: "inset 0 1px 0 rgba(255,255,255,.08), 0 10px 26px rgba(0,0,0,.24)"
vidro: "backdrop-filter: blur(10px) saturate(1.5)"
---

# Como as telas da academia devem parecer

Guia para qualquer IA (Claude Code, Codex) ou pessoa que for criar ou mudar uma
tela. O objetivo é que uma tela nova pareça ter sido feita junto com as outras.
As regras de produto e segurança continuam em [CLAUDE.md](CLAUDE.md).

## Regra número 1: o visual está fechado

Em 27/10 o João decidiu que **o visual não muda mais** (as opções A/B/C e a
rodada 2 do visual sóbrio foram descartadas). Então:

- Tela nova = **montar com as peças que já existem** (cartão, segmento, botão,
  janela que sobe, linha da agenda). Não criar estilo novo.
- Não propor mudança de cor, fonte, ícone ou disposição sem ele pedir.
- **Ícone novo ou emoji novo, só se ele pedir.** Ele já reprovou ícones trocados
  ("ficaram ainda pior"). Use os desenhos de `lib/icones.js` (SVG próprio). O
  tempo/clima usa só SVG (`iconeClima`), nunca emoji.
- Antes de publicar qualquer tela, mandar **prévia em imagem** para ele aprovar.

## Personalidade

Escuro, calmo e "premium de clube": fundo verde quase preto, topo com a foto
da quadra de saibro, cartões de vidro escuro e um único tom quente de
destaque (o **saibro**). Sóbrio: nada de "cara de app feito por IA" (pedido de
24/10, `app-aluno/lib/visual-sobrio.css`), sem caixa-alta espaçada e sem
palavra em itálico de outra fonte nos títulos.

## Cores

- **Saibro** é a cor de destaque: aba ativa, item escolhido, link, botão de
  ação principal. Sobre o gradiente saibro, o texto é escuro (`tinta`).
- **Bolinha** (verde-amarelo da bola de tênis) só para o que é positivo:
  "pago", valor que entrou, número que subiu. Nunca para erro ou aviso.
- Cartões são **vidro**: fundo semitransparente, borda clara fina, desfoque
  do que está atrás. O "Vidro Aero" (fim do `estilo.css`, variáveis `--aero-*`)
  soma só brilho, borda e sombra; **nunca troca a cor de fundo**.
- No App do Aluno, a agenda e as janelas que sobem usam fundo claro (`papel`,
  `livre`) com texto escuro.

### Dois temas, um arquivo

- **Saibro** (padrão) e **Verde clássico** (Mais → Segurança e dados).
- O Saibro é **gerado**: `app-gestao/lib/estilo-saibro.css` e
  `app-aluno/lib/tema-saibro.css` saem de `estilo.css`, do `<style>` do aluno e
  de `visual-premium.css` por `python3 ferramentas/tema-saibro.py`.
  **Nunca edite os arquivos gerados**; mude a origem e rode o script
  (o `checar-tudo.sh` acusa se esquecer).
- Cor nova escrita direto no CSS precisa funcionar nos dois temas: confira o
  Verde clássico também.

## Letras

- **DM Sans** em tudo. **Cormorant Garamond** só na frase grande do topo do
  Início da Gestão ("Disciplina hoje, resultados sempre.").
- App do Aluno: letra **mínima de 12 px** (camada `app-aluno/lib/letras-maiores.css`,
  27/10); só as células da grade da semana ficam em 11 px.
- Campos de digitar: 16 px (menos que isso o iPhone dá zoom sozinho).
- Números grandes em negrito; texto de apoio menor e em `texto_secundario`.

## Peças que já existem (use estas)

| Peça | Onde ver | Como é |
|---|---|---|
| Cartão de vidro | Início da Gestão (`.jh-card`), Início do aluno (`.jv-home-card`) | canto 16–18 px, borda clara fina, sombra macia, desfoque |
| Segmento (abas pequenas) | "Semana / Mês / Ano", "Dia / Semana / Mês" | escolhido em saibro com texto escuro (Gestão) ou saibro forte com texto branco (aluno) |
| Barra de baixo | `.nav` nos dois apps | fundo escuro translúcido; ativa em saibro sobre leve saibro transparente |
| Botão | `.btn` | canto 10 px, altura mínima 44 px, peso 600 |
| Janela que sobe | `.overlay` / escolher horário no aluno | fundo `papel`, canto 20 px só em cima, opções em blocos grandes com uma linha de explicação embaixo |
| Linha de horário | agenda do dia | 44 px de altura, rótulo à esquerda e etiqueta pequena à direita |
| Texto longo | qualquer lista | encolhe em 2 linhas + "▾ ver mais" (`encurtarTextosLongos`; `data-enc="nao"` para não encolher) |

## Tamanho de toque e espaço

- Tudo que se toca: **pelo menos 44 px** de altura (a barra de baixo tem teste).
- Respeitar o entalhe do iPhone com `env(safe-area-inset-*)` no topo e embaixo.
- Nada pode passar da largura da tela (os testes conferem 320 e 390 px).

## Textos na tela

- Português simples, sem jargão. Verbo claro no botão ("Cancelar 8 marcações",
  "Avisar"), não "OK"/"Continuar".
- Valores: `fmt()` na tela do João (respeita "esconder valores"); `fmtRs()` em
  mensagem ao aluno e PDF. Mensagem ao aluno **nunca** fala de desconto.
- Datas como `dd/mm` ou "quinta 19/11"; data local com `dKey()`.
- O aluno vê o horário pelo que ele pode fazer ("Livre", "Fechado",
  "Reservado"), nunca o motivo interno ("Professor ausente", almoço,
  compromisso).
- Texto vindo de aluno ou da nuvem sempre com `esc()`; dentro de `onclick`, `argJs()`.

## Nomes de classe

Classe nova com prefixo próprio da tela (já usados: `al-`, `fic-`, `rm-`, `cx-`,
`jh-`, `pk-`, `enc-`, `va-`). `fx-` colide: não use.

## O que guarda este visual (rode antes de publicar)

- `sh ferramentas/checar-tudo.sh` (inclui o tema Saibro em dia e o premium)
- `ferramentas/testar-contraste-gestao-browser.cjs` e `testar-contraste-aluno-browser.cjs` (leitura)
- `ferramentas/testar-letras-aluno-browser.cjs` (letra mínima, nada passa da tela)
- `ferramentas/testar-vidro-aero-browser.cjs`, `testar-premium-browser.cjs`, `testar-textos-curtos-browser.cjs`
- Prévia em imagem para o João antes de publicar.

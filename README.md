# JV Tênis — Academia João Victor Tênis

Repositório com os projetos da academia (backup versionado dos arquivos
publicados no Netlify). Todos são **estáticos / PWA** e funcionam por
**drag & drop** ou **deploy automático via GitHub** no Netlify.

## Projetos

Cada pasta **publicável** vira um site separado no Netlify (mudando só a *Base
directory*). As pastas de **fonte** não são publicadas — guardam o material que
gera o conteúdo.

### Sites publicáveis

> O `app-exercicios/` é a exceção: fica no repositório e **não vai para o GitHub
> Pages** — o fluxo de publicação apaga a pasta antes de subir. É material da
> formação, de uso do João e dos professores formados.

| Pasta          | Público      | O que é                                                        |
|----------------|--------------|----------------------------------------------------------------|
| `site/`        | 🎾 Alunos    | **Site institucional** dos alunos: planos, Sistema Flex, avaliações, a **metodologia explicada para alunos** e o folder em PDF. |
| `site-pro/`    | 👔 Professores | **Site de vendas**: home + **landing page** premium `da-base-ao-topo.html` (a página de conversão do método) + página do **curso** (formação Da Base ao Topo) + página do **sistema/app** + `demo/` (cópia navegável do app de gestão, sem Firebase, dados fictícios — gerada por `site-pro/tools/build_demo.py`, rodar de novo sempre que `app-gestao/index.html` ganhar uma aba/funcionalidade nova). |
| `app-aluno/`   | Alunos       | App do **aluno** (agendamento, pagamentos). PWA + Firebase.    |
| `app-exercicios/` | 🔒 **Só professores** | **Banco de exercícios** da metodologia: 116 drills com **desenho da quadra**, passo a passo e dica, cruzados por tema do mês, camada da Pirâmide, nível da Trilha, bloco da aula e necessidade do aluno — com montador e impressão de plano de aula. PWA, 100% local (sem Firebase). **Não é publicado no Pages** (é material da formação): para usar, publique a pasta como site separado. Ver [`app-exercicios/LEIA-ME.md`](app-exercicios/LEIA-ME.md). |
| `app-gestao/`  | Professor    | App de **gestão** (agenda, alunos, caixa e financeiro). PWA + Firebase. |
| `app-familia/` | Pessoal      | App **da família JK** (contas da casa, cartões, investimentos). PWA + Firebase opcional. |

### Fontes (NÃO publicadas)

| Pasta          | O que é                                                        |
|----------------|----------------------------------------------------------------|
| `metodologia/` | **Fonte** da metodologia (`apostila.md`) + `folder.html` (folder comercial) + `export/`. A **apostila é produto pago** e fica fora do ar — o PDF é entregue sob demanda. Gera a página pública `site/metodologia.html`. |
| `negocio/`     | **Guia de vendas** (`guia-de-vendas.md`): como vender o app para academias e a metodologia como curso. Uso interno. Traz também `landing-da-base-ao-topo.md`, a estrutura seção por seção da landing page `site-pro/da-base-ao-topo.html`. |

## Última versão dos arquivos
- `app-exercicios/` — criado em 17/09/2026
- `app-gestao/index.html` — editado em 26/06/2026
- `app-aluno/index.html` — editado em 26/06/2026
- `app-familia/index.html` — editado em 29/06/2026
- `site/index.html` — editado em 24/06/2026

## Como publicar (Netlify, drag & drop)
1. Acesse o painel do Netlify e abra o site correspondente (cada projeto é um
   site separado no Netlify).
2. Vá em **Deploys** e arraste a **pasta** do projeto (ou o `.zip` dela) para a
   área de upload.
3. Importante: o `index.html` precisa ficar na **raiz** do que é arrastado —
   neste repositório cada pasta já está nesse formato correto.

## Observações técnicas
- **app-gestao** e **app-aluno** carregam o Firebase via CDN (`gstatic.com`) e
  registram service workers (`sw-gestao.js` / `sw-aluno.js`) — funciona em HTTPS
  (como no Netlify).
- **app-familia** é PWA (`sw-familia.js` + `manifest-familia.webmanifest`),
  guarda os dados no próprio aparelho (localStorage) e sincroniza opcionalmente
  via Firebase. Usa cotações ao vivo em HTTPS: câmbio USD→BRL pela AwesomeAPI e
  preços dos ETFs globais pela brapi.dev (o service worker não as intercepta).
  Os ícones/splash são **provisórios** (cópia do app-gestão) — troque pela arte
  "JK" quando tiver. Funciona offline depois da primeira abertura.
- **app-exercicios** é PWA (`sw-exercicios.js` + `manifest-exercicios.webmanifest`) e
  **não carrega nada de fora**: sem Firebase, sem biblioteca, sem fonte externa —
  funciona offline desde a primeira abertura. Favoritos, plano de aula e os
  **exercícios criados pelo professor** (botão ✎) ficam no aparelho; para passar
  ao outro professor há exportar/importar por texto, já que não há servidor. O ícone é próprio (quadra de saibro vista de cima, com `EXERCÍCIOS`
  escrito na pastilha de baixo) e se gera com
  `node ferramentas/gerar-icone-exercicios.js` — é o único app da JV que não usa
  o logo, justamente para não virar mais um ícone igual na tela de início.
- **Os três ícones da JV** se distinguem pela palavra grande — `JV TÊNIS
  GESTÃO`, `JV ALUNOS`, a quadra — e pela pastilha de baixo (`GESTÃO`, `ALUNO`,
  `EXERCÍCIOS`). Dois scripts fazem as mudanças em cima dos próprios PNGs, e
  os dois podem ser repetidos sem estragar nada:
  - `python3 ferramentas/pintar-jv-limao.py` deixa o `JV`, que era branco,
    **verde-limão** (`#DDEE66`) na Gestão e no Aluno, ícones e telas de abertura;
  - `python3 ferramentas/escrever-nos-icones.py` escreve o nome do app dentro
    do ícone, na letra da própria marca: no Aluno o `TÊNIS` sai e entra
    `ALUNOS`; na Gestão o `TÊNIS` fica e `GESTÃO` entra numa linha nova, no vão
    entre a linha fina e a pastilha. Mesma altura de caixa, espessura,
    inclinação e degradê do `TÊNIS` original — as medidas estão no cabeçalho do
    script, com o valor medido ao lado.
- O **site** tem as imagens embutidas em base64 no próprio `index.html`; a pasta
  `site/imagens/` é mantida apenas como cópia dos originais.

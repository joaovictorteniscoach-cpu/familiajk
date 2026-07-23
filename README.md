# JV Tênis — Academia João Victor Tênis

Repositório com os projetos da academia (backup versionado dos arquivos
publicados no Netlify). Todos são **estáticos / PWA** e funcionam por
**drag & drop** ou **deploy automático via GitHub** no Netlify.

## Projetos

Cada pasta **publicável** vira um site separado no Netlify (mudando só a *Base
directory*). As pastas de **fonte** não são publicadas — guardam o material que
gera o conteúdo.

### Sites publicáveis

| Pasta          | Público      | O que é                                                        |
|----------------|--------------|----------------------------------------------------------------|
| `site/`        | 🎾 Alunos    | **Site institucional** dos alunos: planos, Sistema Flex, avaliações, a **metodologia explicada para alunos** e o folder em PDF. |
| `site-pro/`    | 👔 Professores | **Site de vendas**: home + página do **curso** (formação Da Base ao Topo) + página do **sistema/app** + `demo/` (cópia navegável do app de gestão, sem Firebase, dados fictícios — gerada por `site-pro/tools/build_demo.py`, rodar de novo sempre que `app-gestao/index.html` ganhar uma aba/funcionalidade nova). |
| `app-aluno/`   | Alunos       | App do **aluno** (agendamento, pagamentos). PWA + Firebase.    |
| `app-gestao/`  | Professor    | App de **gestão** (agenda, alunos, caixa e financeiro). PWA + Firebase. |
| `app-familia/` | Pessoal      | App **da família JK** (contas da casa, cartões, investimentos). PWA + Firebase opcional. |

### Fontes (NÃO publicadas)

| Pasta          | O que é                                                        |
|----------------|----------------------------------------------------------------|
| `metodologia/` | **Fonte** da metodologia (`apostila.md`) + `folder.html` (folder comercial) + `export/`. A **apostila é produto pago** e fica fora do ar — o PDF é entregue sob demanda. Gera a página pública `site/metodologia.html`. |
| `negocio/`     | **Guia de vendas** (`guia-de-vendas.md`): como vender o app para academias e a metodologia como curso. Uso interno. |

## Última versão dos arquivos
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
- O **site** tem as imagens embutidas em base64 no próprio `index.html`; a pasta
  `site/imagens/` é mantida apenas como cópia dos originais.

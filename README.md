# JV Tênis — Academia João Victor Tênis

Repositório com os projetos da academia. Todos são **estáticos / PWA**, sem
etapa de build, e publicam **sozinhos** a cada merge na `main` (GitHub Pages
como endereço principal e Netlify como reserva).

- Estado atual e rotina do dia a dia: [`COMECAR-AQUI.md`](COMECAR-AQUI.md)
- Endereços e como a publicação funciona: [`PUBLICAR.md`](PUBLICAR.md)
- Banco de dados e regras: [`ferramentas/FIREBASE.md`](ferramentas/FIREBASE.md)
- Preparação profissional: [`ferramentas/PRONTIDAO.md`](ferramentas/PRONTIDAO.md)

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
| `app-exercicios/` | Professor | **Apostila revisada**: 145 exercícios originais e a referência D2-FH-03, com fichas completas e PDF. Publicação autorizada em 07/10/2026. |

### Fontes (NÃO publicadas)

| Pasta          | O que é                                                        |
|----------------|----------------------------------------------------------------|
| `metodologia/` | **Fonte** da metodologia (`apostila.md`) + `folder.html` (folder comercial) + `export/`. A **apostila é produto pago** e fica fora do ar — o PDF é entregue sob demanda. Gera a página pública `site/metodologia.html`. |
| `negocio/`     | **Guia de vendas** (`guia-de-vendas.md`): como vender o app para academias e a metodologia como curso. Uso interno. |

## Última versão dos arquivos
A data que vale é a do Git: `git log -1 --date=short -- <arquivo>`.

## Como publicar
A `main` é protegida: toda mudança entra por **pull request**. O PR roda a
checagem `validar` (a mesma do `bash ferramentas/checar-tudo.sh`); depois do
merge, o GitHub Pages e o Netlify republicam sozinhos em 1 a 2 minutos. Não é
mais preciso arrastar pastas no Netlify.

## Observações técnicas
- **app-gestao** e **app-aluno** carregam bibliotecas Firebase locais, com CDN de reserva, e
  registram service workers (`sw-gestao.js` / `sw-aluno.js`) — funciona em HTTPS
  (como no Netlify).
- **app-familia** é PWA (`sw-familia.js` + `manifest-familia.webmanifest`),
  guarda os dados no próprio aparelho (localStorage) e sincroniza opcionalmente
  via Firebase. Usa cotações ao vivo em HTTPS: câmbio USD→BRL pela AwesomeAPI e
  preços dos ETFs globais pela brapi.dev (o service worker não as intercepta).
  Os ícones/splash são **provisórios** (cópia do app-gestão) — troque pela arte
  "JK" quando tiver. Funciona offline depois da primeira abertura.
- O **site** carrega as imagens de `site/img/` (WebP). Não volte a colar imagem
  em base64 dentro do HTML (ver `PUBLICAR.md`). A imagem do **Tema do mês** tem
  nome fixo, `site/img/foco-do-mes.webp`: para trocar, suba outra com o mesmo nome.

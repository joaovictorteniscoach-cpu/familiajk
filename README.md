# JV Tênis — Academia João Victor Tênis

Repositório com os três projetos da academia (backup versionado dos arquivos
publicados no Netlify). Todos são **estáticos / PWA** e funcionam por
**drag & drop** no Netlify (basta arrastar a pasta ou o `.zip` correspondente).

## Projetos

| Pasta          | Título               | O que é                                                        |
|----------------|----------------------|----------------------------------------------------------------|
| `app-gestao/`  | JV Tênis · Gestão    | App de **gestão** (agenda, alunos, caixa e financeiro). PWA + Firebase Realtime Database. |
| `app-aluno/`   | JV Tênis · Aluno     | App do **aluno**. PWA + Firebase Realtime Database.            |
| `site/`        | Academia JV Tênis    | **Site** institucional com informações para alunos novos. Imagens embutidas (base64). |

## Última versão dos arquivos
- `app-gestao/index.html` — editado em 26/06/2026
- `app-aluno/index.html` — editado em 26/06/2026
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
- O **site** tem as imagens embutidas em base64 no próprio `index.html`; a pasta
  `site/imagens/` é mantida apenas como cópia dos originais.

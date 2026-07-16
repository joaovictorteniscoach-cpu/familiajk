# Metodologia Da Base ao Topo — fonte do conteúdo

Esta pasta guarda a **fonte em Markdown** do material da metodologia. Ela **não é
publicada** no Netlify (os sites publicam apenas as pastas `site/`, `app-aluno/`
e `app-gestao/`).

## Arquivos

| Arquivo | O que é |
|---|---|
| `apostila.md` | Texto completo da apostila de formação de professores (fonte única do conteúdo) |
| `folder.html` | Fonte do **folder comercial** para enviar a clientes (3 páginas A4, visual dark navy + dourado) |
| `export/` | Arquivos prontos para envio: `Metodologia-JV-Tenis.pdf` (3 páginas) e as versões em imagem PNG de alta resolução (páginas separadas e completa) |

> O PDF do folder também é **publicado no site**: existe uma cópia em
> `site/Metodologia-JV-Tenis.pdf` (URL pública `/Metodologia-JV-Tenis.pdf`,
> com botões de download na página `/metodologia.html`). Ao regenerar o folder,
> copie o novo PDF de `export/` para `site/` de novo.

## Onde o conteúdo aparece publicado

| Página | Público | O que é |
|---|---|---|
| `site/metodologia.html` | Alunos, pais, público geral | Página institucional da metodologia (linkada no menu do site) |
| `site/apostila.html` | Professores em formação | Apostila completa, **sem link no site** (URL para compartilhar por WhatsApp), com botão "Baixar em PDF" |

## Como editar o conteúdo

1. Edite `apostila.md` (é texto simples — qualquer editor serve).
2. Regenere o HTML da apostila. O `site/apostila.html` foi gerado a partir do
   `.md` com um script Python simples (python-markdown com extensões `tables`,
   `fenced_code` e `toc`, envolvido no template de capa/sumário/print que está
   dentro do próprio HTML). Para mudanças pequenas de texto, é seguro editar o
   trecho correspondente direto no `site/apostila.html`.
3. A página `site/metodologia.html` é editada à mão (é um resumo, não é gerada).
4. Publique como sempre: push no repositório ou drag & drop da pasta `site/` no
   Netlify (ver `DEPLOY-NETLIFY.md` na raiz).

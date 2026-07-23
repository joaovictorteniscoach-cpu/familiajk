# Metodologia Da Base ao Topo — fonte do conteúdo

Esta pasta guarda a **fonte em Markdown** do material da metodologia. Ela **não é
publicada** no Netlify (os sites publicam apenas as pastas `site/`, `app-aluno/`
e `app-gestao/`).

## Arquivos

| Arquivo | O que é |
|---|---|
| `apostila.md` | Texto completo da apostila de formação de professores (fonte única do conteúdo) |
| `folder.html` | Fonte do **folder comercial** para enviar a clientes (5 páginas A4, visual dark navy + dourado) |
| `export/` | Arquivos prontos para envio: `Metodologia-JV-Tenis.pdf` (5 páginas) e as versões em imagem PNG de alta resolução (páginas separadas e completa) |
| `tools/build_apostila_pdf.py` | Script que gera o **PDF privado da apostila** a partir de `apostila.md`, no mesmo visual dark navy + dourado do folder. Não roda sozinho — é executado sob demanda (`python3 metodologia/tools/build_apostila_pdf.py`) e o PDF resultante **não é commitado** (é entregue direto a quem tem direito). |

> O PDF do folder também é **publicado no site**: existe uma cópia em
> `site/Metodologia-JV-Tenis.pdf` (URL pública `/Metodologia-JV-Tenis.pdf`,
> com botões de download na página `/metodologia.html`). Ao regenerar o folder,
> copie o novo PDF de `export/` para `site/` de novo.

## Onde o conteúdo aparece publicado

| Página | Público | O que é |
|---|---|---|
| `site/metodologia.html` | Alunos, pais, público geral | Página institucional da metodologia (linkada no menu do site) |

> ⚠️ **A apostila NÃO fica no site.** É o material completo (produto pago / curso) e
> fica fora do ar de propósito. A fonte é `apostila.md`; o PDF é gerado sob demanda
> e entregue só a quem tem direito (aluno do curso, professor certificado). Não
> recolocar `apostila.html` em `site/`.

## Como editar o conteúdo

1. Edite `apostila.md` (é texto simples — qualquer editor serve).
2. Para gerar o PDF privado da apostila (para revisar ou entregar a um aluno
   do curso/professor certificado), rode `python3 metodologia/tools/build_apostila_pdf.py`
   — o script lê `apostila.md` direto e converte para PDF (python-markdown +
   Playwright print-to-pdf). Não recriar `apostila.html` dentro de `site/`.
3. Se o conteúdo novo também for relevante para o público geral, atualize à
   mão o resumo em `site/metodologia.html` e, se for algo que já existe no
   folder comercial, edite `folder.html` e regenere `export/` (Playwright
   print-to-pdf + screenshots por página).
4. Publique como sempre: push no repositório ou drag & drop da pasta `site/` no
   Netlify (ver `DEPLOY-NETLIFY.md` na raiz).

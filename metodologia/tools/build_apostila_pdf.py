# -*- coding: utf-8 -*-
"""Gera um PDF PRIVADO da apostila (metodologia/apostila.md) para revisão/entrega.

Não é publicado em nenhum site (a apostila é o produto pago) — o PDF é gerado
sob demanda e entregue direto a quem tem direito (aluno do curso, professor
certificado). Mesma identidade visual do folder.html: fundo azul-marinho
escuro + dourado do início ao fim.

Uso:
    pip install markdown   # se ainda não tiver
    python3 metodologia/tools/build_apostila_pdf.py [caminho_de_saida.pdf]

Requer Playwright com o Chromium já instalado (ver PLAYWRIGHT_BROWSERS_PATH
no ambiente, ou ajuste EXECUTABLE_PATH abaixo).
"""
import os
import sys
import markdown
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(REPO_ROOT, "metodologia", "apostila.md")
HTML_TMP = os.path.join(HERE, "_apostila-render.html")
PDF_OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "Apostila-Da-Base-ao-Topo.pdf")
EXECUTABLE_PATH = os.environ.get("PLAYWRIGHT_CHROMIUM", "/opt/pw-browsers/chromium")

md_text = open(SRC, encoding="utf-8").read()
start = md_text.index("# 1. Apresentação")
body_md = md_text[start:]

md = markdown.Markdown(extensions=["tables", "fenced_code", "toc"],
                       extension_configs={"toc": {"toc_depth": "1-2"}})
body_html = md.convert(body_md)
toc_items = ['<li><a href="#%s">%s</a></li>' % (t["id"], t["name"]) for t in md.toc_tokens]
toc_html = "\n      ".join(toc_items)

# versão exibida na capa: extraída da própria apostila (linha "**Versão:** X.Y — AAAA")
versao = "1.0 · 2026"
for line in md_text.splitlines():
    if line.strip().startswith("**Versão:**"):
        versao = line.split("**Versão:**", 1)[1].strip().replace("—", "·")
        break

TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Apostila — Metodologia Da Base ao Topo | Academia JV Tênis</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  --navy:#102438; --navy-2:#15304A; --navy-3:#1C3F5E; --deep:#0B1B2B;
  --gold:#D8B45C; --gold-2:#C49A3F; --gold-soft:#E7CE93;
  --cream:#F4EFE6; --muted:rgba(244,239,230,.7); --line:rgba(216,180,92,.25);
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{background:var(--navy)}
body{font-family:'Inter',sans-serif;color:var(--cream);font-size:11.5pt;line-height:1.68}
a{color:var(--gold-soft);text-decoration:none}

.cover{background:linear-gradient(150deg,var(--deep),var(--navy) 55%,var(--navy-3) 140%);color:var(--cream);padding:72px 64px;min-height:88vh;page-break-after:always}
.cover .eyebrow{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--gold-soft);border:1px solid var(--line);border-radius:999px;padding:6px 14px;margin-bottom:26px}
.cover h1{font-size:44px;font-weight:900;line-height:1.04;letter-spacing:-.02em;color:#fff}
.cover h1 em{color:var(--gold-soft);font-style:normal;display:block}
.cover .sub{font-size:16px;color:#E7E0D4;margin:16px 0 34px;max-width:520px}
.cover blockquote{background:transparent;border-radius:0;border-left:3px solid var(--gold);padding:6px 0 6px 18px;font-size:15px;font-weight:600;color:#fff;max-width:560px;margin-bottom:34px}
.cover blockquote span{display:block;font-size:12px;font-weight:700;color:var(--gold-soft);margin-top:8px}
.cover .meta{font-size:12.5px;color:#B9C6D1;line-height:1.9}
.cover .meta b{color:#fff}

.inner{padding:0 64px 40px}

.toc{background:var(--navy-2);border:1px solid var(--line);border-radius:12px;padding:26px 30px;margin:40px 0;page-break-after:always}
.toc h2{font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:12px}
.toc ol{list-style:none;columns:2;column-gap:34px}
.toc li{padding:4px 0;font-size:13px;font-weight:600;break-inside:avoid}
.toc a{color:var(--cream)}

h1{font-size:22pt;font-weight:900;letter-spacing:-.02em;color:#fff;margin:0 0 6px;padding-top:16px;border-top:3px solid var(--gold);page-break-before:always}
h1:first-of-type{page-break-before:avoid}
h2{font-size:15.5pt;font-weight:800;letter-spacing:-.01em;color:var(--gold-soft);margin:22px 0 8px;page-break-after:avoid}
h3{font-size:12.5pt;font-weight:800;color:var(--gold-soft);margin:16px 0 6px;page-break-after:avoid}
p{margin:0 0 10px;color:var(--cream)}
strong{color:#fff}
ul,ol{margin:0 0 12px 22px}
li{margin-bottom:4px}
li::marker{color:var(--gold-soft)}
blockquote{border-left:3px solid var(--gold);background:var(--navy-2);padding:10px 14px;border-radius:0 10px 10px 0;margin:0 0 14px;font-weight:600;color:#fff;page-break-inside:avoid}
hr{border:0;border-top:1px solid var(--line);margin:24px 0}
table{width:100%;border-collapse:collapse;margin:6px 0 16px;font-size:10.5pt;page-break-inside:avoid}
th{background:var(--deep);color:var(--gold-soft);text-align:left;padding:7px 10px;font-weight:700;border-bottom:1px solid var(--line)}
td{padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--cream)}
tr:nth-child(even) td{background:var(--navy-2)}
pre{background:var(--deep);color:var(--cream);border:1px solid var(--line);border-radius:10px;padding:14px;font-size:10pt;line-height:1.55;overflow-x:auto;margin:6px 0 16px;font-family:ui-monospace,Menlo,Consolas,monospace}
code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.92em;color:var(--gold-soft)}
p code,li code{background:var(--deep);border-radius:5px;padding:1.5px 6px}

.docfoot{margin-top:40px;padding-top:16px;border-top:3px solid var(--gold);font-size:10.5pt;color:var(--muted);text-align:center}
.docfoot b{color:#fff}

@page{size:A4;margin:18mm 16mm}
</style>
</head>
<body>
<div class="cover">
  <span class="eyebrow">Material de formação de professores · uso interno</span>
  <h1>Metodologia<em>Da Base ao Topo</em></h1>
  <p class="sub">O ensino do tênis de baixo pra cima — dos pés à raquete, da iniciação à competição.</p>
  <blockquote>"O tênis se aprende de baixo pra cima. Na base e nos pés, na movimentação e no posicionamento — antes da batida e dos fundamentos."<span>— João Victor</span></blockquote>
  <p class="meta">
    <b>João Victor</b> · Academia JV Tênis<br>
    Rua João Azolin, 795 — Santa Felicidade, Curitiba/PR<br>
    WhatsApp (41) 99541-5712 · Instagram @joaovictortenis<br>
    Versão __VERSAO__
  </p>
</div>
<div class="inner">
  <nav class="toc">
    <h2>Sumário</h2>
    <ol>
      __TOC__
    </ol>
  </nav>
  __BODY__
  <p class="docfoot"><b>Metodologia Da Base ao Topo</b> · Academia JV Tênis — João Victor<br>
  Este material é propriedade intelectual de João Victor. Reprodução e aplicação comercial somente com autorização.</p>
</div>
</body>
</html>
"""

html = (TEMPLATE
        .replace("__TOC__", toc_html)
        .replace("__BODY__", body_html)
        .replace("__VERSAO__", versao))
open(HTML_TMP, "w", encoding="utf-8").write(html)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXECUTABLE_PATH)
    pg = b.new_page()
    pg.goto(f"file://{HTML_TMP}")
    pg.wait_for_timeout(400)
    pg.pdf(path=PDF_OUT, print_background=True, prefer_css_page_size=True)
    b.close()

os.remove(HTML_TMP)
print("PDF gerado:", PDF_OUT)

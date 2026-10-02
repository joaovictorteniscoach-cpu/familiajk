#!/usr/bin/env python3
"""Gera o tema Saibro dos dois apps.

  Gestão: app-gestao/lib/estilo-saibro.css = estilo.css com as cores trocadas
          (o index troca um arquivo pelo outro).
  Aluno:  app-aluno/lib/tema-saibro.css = só as declarações de COR do <style>
          do index.html e de visual-premium.css, já trocadas, na mesma ordem.
          Carregado depois dos dois, reescreve as cores sem duplicar o resto
          (o <style> do aluno tem ~370 KB). Desligado = "Verde clássico".

O tema Saibro (escolhido pelo João em 2026-10-02) não é uma folha separada
escrita à mão: é a mesma estilo.css com as cores trocadas por regra. Assim
qualquer mudança no visual vale para os dois temas — basta rodar este script.

Regras (versão escolhida: "Saibro forte + bolinha nos valores"):
  1. Verdes escuros de fundo/cartão ficam mais escuros e menos saturados
     (sai o "verde em cima de verde"). Verdes de ação não entram.
  2. Dourado vira terra/saibro, no texto e nos botões selecionados.
  3. Verde-menta de TEXTO (valores que entraram, "pago") vira a cor da bolinha.
  4. As linhas finas esverdeadas viram areia.
  5. Laranja/argila dos botões fortes vai para o tom saibro da paleta.
  Por cima (EXTRA): botões de ação (Aula, Marcar pago, + Receita) na cor da
  bolinha com texto escuro; seleção em saibro; aba ativa em saibro.

Uso:  python3 ferramentas/tema-saibro.py           (gera)
      python3 ferramentas/tema-saibro.py --checar  (falha se estiver desatualizado)
"""
import colorsys, os, re, sys

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ORIG = os.path.join(RAIZ, "app-gestao", "lib", "estilo.css")
DEST = os.path.join(RAIZ, "app-gestao", "lib", "estilo-saibro.css")
AL_HTML = os.path.join(RAIZ, "app-aluno", "index.html")
AL_VP = os.path.join(RAIZ, "app-aluno", "lib", "visual-premium.css")
AL_DEST = os.path.join(RAIZ, "app-aluno", "lib", "tema-saibro.css")

CAB = ("/* GERADO por ferramentas/tema-saibro.py a partir de estilo.css — NÃO EDITE.\n"
       "   Mude estilo.css e rode o script de novo. */\n")

PROPS_TEXTO = ("color", "-webkit-text-fill-color", "caret-color")
BOLA, BOLA_TXT = "#D4E157", "#1E2A0E"   # verde-amarelo da bolinha e o texto escuro sobre ela
BOLA_RGB = (0xD4, 0xE1, 0x57)


def hls(r, g, b):
    return colorsys.rgb_to_hls(r / 255, g / 255, b / 255)


def rgb(h, l, s):
    r, g, b = colorsys.hls_to_rgb(h, max(0, min(1, l)), max(0, min(1, s)))
    return round(r * 255), round(g * 255), round(b * 255)


def troca(r, g, b, texto):
    """Nova cor (r,g,b) para o tema Saibro, ou None para manter."""
    h, l, s = hls(r, g, b)
    hue = h * 360
    # 1. superfícies verde-escuras
    if 120 <= hue <= 180 and l < 0.30 and not (s > 0.5 and l > 0.24):
        return rgb(155 / 360, l * 0.86, s * 0.72)
    # 3. verde-menta de texto -> bolinha
    if texto and 110 <= hue <= 165 and l > 0.5 and s > 0.45:
        return BOLA_RGB
    # 2. dourado (texto e fundo) -> terra
    if 34 <= hue <= 56 and s > 0.45 and 0.45 <= l <= 0.85:
        return rgb(21 / 360, l, min(s, 0.72))
    # 4. argila/laranja forte -> saibro
    if 8 <= hue <= 24 and s > 0.55 and 0.40 <= l <= 0.52:
        return rgb(17 / 360, 0.47, 0.62)
    return None


def hex_novo(m, texto):
    x = m.group(0)
    v = x[1:]
    if len(v) == 3:
        v = "".join(c * 2 for c in v)
    r, g, b = int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16)
    t = troca(r, g, b, texto)
    return x if t is None else "#%02X%02X%02X" % t


def rgba_novo(m, texto):
    r, g, b = int(m.group(2)), int(m.group(3)), int(m.group(4))
    # 3. linha fina esverdeada (borda translúcida) -> areia
    if (r, g, b) == (190, 211, 190):
        return "%s(232,214,190%s)" % (m.group(1), m.group(5))
    t = troca(r, g, b, texto)
    return m.group(0) if t is None else "%s(%d,%d,%d%s)" % (m.group(1), t[0], t[1], t[2], m.group(5))


HEX = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")
RGBA = re.compile(r"(rgba?)\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*((?:,\s*[\d.]+\s*)?)\)")
DECL = re.compile(r"([{;]\s*)([-a-zA-Z]+)(\s*:\s*)([^;{}]+)")


def gerar(css):
    def decl(m):
        prop = m.group(2).lower()
        texto = prop in PROPS_TEXTO
        val = HEX.sub(lambda x: hex_novo(x, texto), m.group(4))
        val = RGBA.sub(lambda x: rgba_novo(x, texto), val)
        return m.group(1) + m.group(2) + m.group(3) + val
    return CAB + DECL.sub(decl, css)


def troca_valor(prop, val):
    texto = prop.lower() in PROPS_TEXTO
    val = HEX.sub(lambda x: hex_novo(x, texto), val)
    return RGBA.sub(lambda x: rgba_novo(x, texto), val)


COR_LIT = re.compile(r"#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(")
PROPS_COR = {"color", "-webkit-text-fill-color", "caret-color", "background", "background-color",
             "background-image", "border", "border-top", "border-right", "border-bottom", "border-left",
             "border-color", "border-top-color", "border-right-color", "border-bottom-color",
             "border-left-color", "outline", "outline-color", "box-shadow", "text-shadow", "fill",
             "stroke", "accent-color", "text-decoration-color", "column-rule-color"}


def _fecha(css, i):
    """Índice logo depois da chave que fecha o bloco aberto em css[i-1]."""
    n, q = 1, None
    while i < len(css) and n:
        c = css[i]
        if q:
            if c == "\\":
                i += 1
            elif c == q:
                q = None
        elif c in "'\"":
            q = c
        elif c == "{":
            n += 1
        elif c == "}":
            n -= 1
        i += 1
    return i


def _decls(corpo):
    """Separa declarações por ';' fora de aspas e parênteses (data: URIs têm ';')."""
    out, cur, prof, q = [], "", 0, None
    for c in corpo:
        if q:
            cur += c
            if c == q:
                q = None
            continue
        if c in "'\"":
            q = c
        elif c == "(":
            prof += 1
        elif c == ")":
            prof -= 1
        elif c == ";" and prof == 0:
            out.append(cur)
            cur = ""
            continue
        cur += c
    if cur.strip():
        out.append(cur)
    return out


def so_cores(css):
    """Só as declarações de cor de cada regra, já trocadas, na ordem original.
    Restatar TODAS as de cor (mudadas ou não) mantém a cascata igual à do
    arquivo transformado inteiro."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    out, i = [], 0
    while i < len(css):
        j = css.find("{", i)
        if j < 0:
            break
        pre = css[i:j].strip()
        # @import/@charset soltos antes do bloco
        if ";" in pre and pre.lstrip().startswith("@"):
            pre = pre[pre.rfind(";") + 1:].strip()
        fim = _fecha(css, j + 1)
        corpo = css[j + 1:fim - 1]
        low = pre.lower()
        if low.startswith(("@media", "@supports", "@layer", "@container")):
            dentro = so_cores(corpo)
            if dentro.strip():
                out.append(pre + "{" + dentro + "}")
        elif "keyframes" in low:
            novo = DECL.sub(lambda m: m.group(1) + m.group(2) + m.group(3) + troca_valor(m.group(2), m.group(4)), "{" + corpo)[1:]
            if novo != corpo:
                out.append(pre + "{" + novo + "}")
        elif low.startswith("@"):
            pass                       # @font-face, @page: sem cor
        elif pre:
            ds = []
            for d in _decls(corpo):
                if ":" not in d:
                    continue
                prop, val = d.split(":", 1)
                prop = prop.strip()
                pl = prop.lower()
                novo = troca_valor(prop, val.strip())
                # variável com imagem (data: URI de 250 KB) e sem mudança: fica de fora
                if pl.startswith("--") and "url(" in val and novo == val.strip():
                    continue
                if pl.startswith("--") or pl in PROPS_COR or COR_LIT.search(val):
                    ds.append(prop + ":" + novo)
            if ds:
                out.append(pre + "{" + ";".join(ds) + "}")
        i = fim
    return "\n".join(out)


# Toques só do Saibro, por cima de tudo: aba ativa e seleção em saibro, fio
# saibro em cima da barra, botões de ação na cor da bolinha.
EXTRA = """
/* ===== Toques do tema Saibro ===== */
.nav,.nav:after{background:#0B1B14!important;border-top:1px solid rgba(194,88,46,.35)!important}
.nav button.on,.nav button.aberto,.jv-nav-3d button.on,.jv-nav-3d button.aberto{background:rgba(194,88,46,.16)!important;color:#EE9A6E!important;-webkit-text-fill-color:#EE9A6E!important}
.jv-nav-3d button.on:after,.jv-nav-3d button.aberto:after{background:#C2582E!important}
.sec-title em{color:#E08A5A!important;-webkit-text-fill-color:#E08A5A!important}
.btn-clay{background:#C2582E!important;color:#FFF!important;-webkit-text-fill-color:#FFF!important}
.seg button.on,.seg .on{background:#C2582E!important;color:#FFF!important;-webkit-text-fill-color:#FFF!important}
#pg-lanc .cx-filtros button.on{background:#C2582E!important;border-color:#C2582E!important;color:#FFF!important;-webkit-text-fill-color:#FFF!important}
/* bolinha nos botões de ação */
.al-aula,.fic-b.prim,.fic-b.prim2,.fic-b.ok,#pg-lanc .cx-ac.in{background:%(b)s!important;border-color:%(b)s!important;color:%(t)s!important;-webkit-text-fill-color:%(t)s!important}
.al-aula *,.fic-b.prim *,.fic-b.prim2 *,.fic-b.ok *,#pg-lanc .cx-ac.in *{color:%(t)s!important;-webkit-text-fill-color:%(t)s!important;stroke:%(t)s!important}
/* Caixa: valores dos atalhos também na cor da bolinha */
#pg-lanc .cx-at b{color:%(b)s!important;-webkit-text-fill-color:%(b)s!important}
""" % {"b": BOLA, "t": BOLA_TXT}

# Toque "air" (vidro fosco, como no iPhone e no Windows 11), nos dois apps:
# fundo com brilhos suaves de saibro, bolinha e verde parados atrás da tela, e
# os cartões levemente transparentes por cima. O desfoque (backdrop-filter)
# fica só nas peças grandes e poucas — barra, cabeçalho, ficha, cartões do
# início —; listas longas ganham só a transparência, para não pesar no celular.
VIDRO = """
/* ===== Vidro (toque air) ===== */
html{background:#0A1A14!important}
html body{background:transparent!important}
body:before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(120% 55% at 0% 0%,rgba(194,88,46,.22),transparent 58%),
    radial-gradient(80% 45% at 100% 38%,rgba(212,225,87,.08),transparent 62%),
    radial-gradient(120% 60% at 50% 108%,rgba(30,107,71,.26),transparent 62%),#0A1A14}
.nav,.nav:after{background:rgba(10,24,18,.70)!important;-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);border-top:1px solid rgba(255,255,255,.08)!important}
.ficha{background:rgba(10,26,20,.90)!important;-webkit-backdrop-filter:blur(26px) saturate(150%);backdrop-filter:blur(26px) saturate(150%)}
.jh-card,.jv-ref-kpi,.fin-card:not(.hero):not(.desp):not(.saldo),.chart,.fic-tile,.fic-nota,.ag-ferr,.empty,
.jv-home-card:not(.gold),.jv-pay-card,.jv-section-card,.jv-credit-panel,.jv-profile-card,.evo-xp,.evo-prio,
#pg-lanc .cx-dia,#pg-lanc .cx-res>div{
  background:linear-gradient(155deg,rgba(255,255,255,.075),rgba(255,255,255,.02) 60%),rgba(18,40,31,.55)!important;
  -webkit-backdrop-filter:blur(16px) saturate(150%);backdrop-filter:blur(16px) saturate(150%);
  border:1px solid rgba(255,255,255,.09)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 10px 26px rgba(0,0,0,.24)!important}
.al-row,.aluno,.comp-item,.pend-item,.cons,.mov-card,.graf-card,.dobra-cab,.dobra-corpo,.fech-card,.fq-linha,
#pg-lanc .cx-at,#pg-lanc .cx-mv,.seg{
  background:linear-gradient(155deg,rgba(255,255,255,.06),rgba(255,255,255,.015) 60%),rgba(18,40,31,.50)!important;
  border-color:rgba(255,255,255,.085)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important}
"""

# Só no app do aluno: botões de pagar na cor da bolinha, abas da agenda em saibro.
EXTRA_ALUNO = """
/* ===== Toques do tema Saibro no app do aluno ===== */
.lock-pay,.jv-pix-btn,#apg-inicio .jv-pix-btn{background:%(b)s!important;border-color:%(b)s!important;color:%(t)s!important;-webkit-text-fill-color:%(t)s!important}
.seg.jv-ref-ag-tabs button.on,.jv-ref-ag-tabs button.on{background:#C2582E!important;color:#FFF!important;-webkit-text-fill-color:#FFF!important}
""" % {"b": BOLA, "t": BOLA_TXT}

CAB_AL = ("/* GERADO por ferramentas/tema-saibro.py — NÃO EDITE. Só as cores do <style> de\n"
          "   app-aluno/index.html e de visual-premium.css, trocadas para o tema Saibro. */\n")


def gerar_aluno():
    h = open(AL_HTML, encoding="utf-8").read()
    a = h.index("<style>") + 7
    b = h.index("</style>", a)
    vp = open(AL_VP, encoding="utf-8").read()
    # o <style> do index resolve url() a partir de app-aluno/; o arquivo gerado
    # mora em app-aluno/lib/, então caminho relativo ganha "../"
    do_index = re.sub(r"""url\((['"]?)(?!data:|https?:|/|\.\./)""", r"url(\1../", so_cores(h[a:b]))
    return CAB_AL + do_index + "\n" + so_cores(vp) + "\n" + EXTRA + VIDRO + EXTRA_ALUNO


def main():
    saidas = [(DEST, gerar(open(ORIG, encoding="utf-8").read()) + EXTRA + VIDRO),
              (AL_DEST, gerar_aluno())]
    if "--checar" in sys.argv:
        ruins = [d for d, novo in saidas
                 if not os.path.exists(d) or open(d, encoding="utf-8").read() != novo]
        if ruins:
            print("❌ tema Saibro desatualizado (%s): rode python3 ferramentas/tema-saibro.py"
                  % ", ".join(os.path.relpath(d, RAIZ) for d in ruins))
            sys.exit(1)
        print("✅ tema Saibro em dia (Gestão e Aluno)")
        return
    for d, novo in saidas:
        open(d, "w", encoding="utf-8").write(novo)
        print("tema Saibro gerado em", os.path.relpath(d, RAIZ), "(%d KB)" % (len(novo) // 1024))


if __name__ == "__main__":
    main()

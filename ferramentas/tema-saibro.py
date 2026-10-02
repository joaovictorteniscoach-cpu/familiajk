#!/usr/bin/env python3
"""Gera app-gestao/lib/estilo-saibro.css a partir de estilo.css.

O tema Saibro (escolhido pelo João em 2026-10-02) não é uma folha separada
escrita à mão: é a mesma estilo.css com as cores trocadas por regra. Assim
qualquer mudança no visual vale para os dois temas — basta rodar este script.

Regras:
  1. Verdes escuros de fundo/cartão ficam mais escuros e menos saturados
     (sai o "verde em cima de verde"). Verdes de ação (botão de aula, pago)
     não entram: são claros ou saturados demais para serem fundo.
  2. Dourado usado como COR DE TEXTO (color / -webkit-text-fill-color) vira
     terra/saibro. Dourado de fundo e borda continua dourado: os botões
     dourados ficam.
  3. As linhas finas esverdeadas viram areia.
  4. Laranja/argila dos botões fortes vai para o tom saibro da paleta.

Uso:  python3 ferramentas/tema-saibro.py           (gera)
      python3 ferramentas/tema-saibro.py --checar  (falha se estiver desatualizado)
"""
import colorsys, os, re, sys

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ORIG = os.path.join(RAIZ, "app-gestao", "lib", "estilo.css")
DEST = os.path.join(RAIZ, "app-gestao", "lib", "estilo-saibro.css")

CAB = ("/* GERADO por ferramentas/tema-saibro.py a partir de estilo.css — NÃO EDITE.\n"
       "   Mude estilo.css e rode o script de novo. */\n")

PROPS_TEXTO = ("color", "-webkit-text-fill-color", "caret-color")


def hls(r, g, b):
    return colorsys.rgb_to_hls(r / 255, g / 255, b / 255)


def rgb(h, l, s):
    r, g, b = colorsys.hls_to_rgb(h, max(0, min(1, l)), max(0, min(1, s)))
    return round(r * 255), round(g * 255), round(b * 255)


def troca(r, g, b, texto):
    h, l, s = hls(r, g, b)
    hue = h * 360
    # 1. superfícies verde-escuras
    if 120 <= hue <= 180 and l < 0.30 and not (s > 0.5 and l > 0.24):
        return rgb(155 / 360, l * 0.86, s * 0.72)
    # 2. dourado como texto -> terra
    if texto and 34 <= hue <= 56 and s > 0.45 and 0.45 <= l <= 0.85:
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


# Toques só do Saibro, por cima de tudo: aba ativa da barra de baixo em saibro,
# fio saibro em cima da barra. Botões dourados e verdes de ação continuam.
EXTRA = """
/* ===== Toques do tema Saibro ===== */
.nav,.nav:after{background:#0B1B14!important;border-top:1px solid rgba(194,88,46,.35)!important}
.nav button.on,.nav button.aberto,.jv-nav-3d button.on,.jv-nav-3d button.aberto{background:rgba(194,88,46,.16)!important;color:#EE9A6E!important;-webkit-text-fill-color:#EE9A6E!important}
.jv-nav-3d button.on:after,.jv-nav-3d button.aberto:after{background:#C2582E!important}
.sec-title em{color:#E08A5A!important;-webkit-text-fill-color:#E08A5A!important}
.btn-clay{background:#C2582E!important;color:#FFF!important;-webkit-text-fill-color:#FFF!important}
"""


def main():
    novo = gerar(open(ORIG, encoding="utf-8").read()) + EXTRA
    if "--checar" in sys.argv:
        atual = open(DEST, encoding="utf-8").read() if os.path.exists(DEST) else ""
        if atual != novo:
            print("❌ estilo-saibro.css desatualizado: rode python3 ferramentas/tema-saibro.py")
            sys.exit(1)
        print("✅ tema Saibro em dia com estilo.css")
        return
    open(DEST, "w", encoding="utf-8").write(novo)
    print("tema Saibro gerado em app-gestao/lib/estilo-saibro.css")


if __name__ == "__main__":
    main()

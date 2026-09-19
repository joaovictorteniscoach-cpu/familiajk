#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Troca o "TENIS" verde do icone do App do Aluno por "ALUNOS".

   Por que existe: o icone do aluno era o mesmo da Gestao, com a palavra
   "TENIS" sob o "JV" e um rotulo "ALUNO" embaixo. Quem olha a tela de inicio
   le' primeiro a palavra grande. Com "ALUNOS" ali, o app se identifica de
   longe, sem precisar ler a pastilha.

   Como funciona, e por que nao e' um retoque a mao: a arte so' existe em PNG,
   entao o script (1) acha a moldura limao para saber em que escala aquele
   arquivo esta', (2) apaga a faixa da palavra reconstruindo o fundo por
   interpolacao entre uma linha limpa acima e outra abaixo, e (3) escreve
   "ALUNOS" com a mesma altura de caixa, a mesma espessura de haste, a mesma
   inclinacao e o mesmo degrade da palavra que saiu. Os numeros de (3) foram
   medidos no proprio "TENIS" do arquivo de 512 px — estao em MEDIDAS abaixo,
   com o valor medido ao lado.

   Como o desenho e' o mesmo em todos os tamanhos (o de 192, o -mask e as sete
   telas de abertura sao a mesma arte em outra escala), cada arquivo e' tratado
   na resolucao dele: a palavra e' desenhada grande e reduzida no fim, em vez
   de ampliar o icone de 512.

   Roda em cima dos proprios arquivos. Rodar de novo e' seguro: a faixa que ele
   apaga cobre "ALUNOS" inteiro, entao a segunda passada apaga e reescreve a
   mesma palavra no mesmo lugar.

   Uso, a partir da raiz do repositorio:
       python3 ferramentas/escrever-alunos.py
"""
import os
from PIL import Image, ImageChops, ImageDraw, ImageFont

FONTE = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
PALAVRA = 'ALUNOS'

# --- Medidas, em pixels do arquivo de 512 (o "unidade de icone" do resto) ----
# A moldura limao do icone de 512: e' ela que diz a escala de cada arquivo.
MOLDURA = (37, 31, 473, 475)

# A faixa que sai. Comeca em y=237 de proposito: o risco sob o "JV" termina
# em y=236, e o acento do "E" comeca em 238 — apagar a partir dai leva o
# acento junto e nao encosta no risco. A linha fina embaixo fica em y=316.
# Ela e' um pouco mais larga que o "TENIS" que sai (x 125..379) de proposito:
# "ALUNOS" ocupa x 98..405, e apagar a faixa inteira e' o que deixa o script
# poder rodar de novo por cima do proprio resultado.
FAIXA = (95, 237, 410, 292)
LINHA_LIMPA_CIMA, LINHA_LIMPA_BAIXO = 246, 293

# Onde a palavra nova e' desenhada. E' maior que FAIXA porque "ALUNOS" passa um
# pouco dos dois lados de onde estava o "TENIS" — e passa por cima de fundo
# limpo, o que nao atrapalha.
CAIXA_PALAVRA = (88, 238, 418, 296)

# A palavra: base em y=287 e altura de caixa 39, as mesmas do "TENIS".
BASE_Y, CAIXA = 287.0, 39.0
CENTRO_X = 255.0          # o "TENIS" estava centrado no painel (x 49..462)
INCLINACAO = 0.49         # medido na haste do "I": 18 px de recuo em 36 de altura

# Como chegar na mesma letra com a DejaVu Sans Bold: corpo 48.4, contorno de
# 1.385 e 1.33 de largura. O contorno engorda a letra (a DejaVu Bold sozinha e'
# leve demais) e vem ANTES do alargamento — e' por isso que a haste vertical
# fica com 15.6 e a barra horizontal com 9.2, a mesma diferenca do "TENIS".
# Atencao: o stroke_width do Pillow cresce para os dois lados, entao ele soma
# 2 x CONTORNO a' espessura, nao CONTORNO.
CORPO, CONTORNO, LARGURA = 48.4, 1.385, 1.33

# O degrade da palavra, ajustado por minimos quadrados nos 3.397 pixels de
# miolo do "TENIS" (erro medio de 2,4 niveis em 255): claro em cima e a
# esquerda, escuro embaixo e a direita.
COR = ((476.01, -0.1932, -0.9099),
       (449.16, -0.1581, -0.7683),
       (184.50, -0.0785, -0.3673))

ARQUIVOS = ['app-aluno/jv-icone-aluno.png',
            'app-aluno/jv-icone-aluno-192.png',
            'app-aluno/jv-icone-aluno-512.png',
            'app-aluno/jv-icone-aluno-mask.png']
ARQUIVOS += ['app-aluno/splash-aluno-%s.png' % t for t in
             ('750x1334', '828x1792', '1125x2436', '1170x2532',
              '1179x2556', '1242x2688', '1290x2796')]


def moldura_limao(im):
    """Onde esta' a moldura verde desta imagem — da' a escala e o deslocamento."""
    g, b = im.getchannel('G'), im.getchannel('B')
    claro = g.point(lambda v: 255 if v > 90 else 0)
    verde = ImageChops.subtract(g, b).point(lambda v: 255 if v > 40 else 0)
    return ImageChops.multiply(claro, verde).getbbox()


def escala(im):
    """(fator, deslocamento) que leva unidade-de-icone para pixel desta imagem."""
    x0, y0, x1, y1 = moldura_limao(im)
    mx0, my0, mx1, my1 = MOLDURA
    # getbbox() devolve o limite de fora, por isso o -1 nos dois cantos finais.
    sx = (x1 - 1 - x0) / (mx1 - mx0)
    sy = (y1 - 1 - y0) / (my1 - my0)
    s = (sx + sy) / 2                      # a arte e' quadrada: um fator so'
    if abs(sx - sy) > 0.01 * s:
        raise SystemExit('arte fora de esquadro neste arquivo: %.3f x %.3f' % (sx, sy))
    return s, (x0 - mx0 * s, y0 - my0 * s)


def tem_verde(cor):
    """Sobrou tinta da marca neste pixel? Usado para nao copiar letra por fundo."""
    r, g, b = cor[:3]
    return g > 40 and g > b + 25


def apagar_faixa(im, s, dx, dy):
    """Tira a palavra antiga e refaz o fundo entre duas linhas limpas.

       So' ha' duas linhas limpas acima da palavra (246 e 247 em unidade-de-
       icone, entre o acento do "E" e o alto das letras). Em arquivo ampliado,
       a borda suavizada do acento as vezes invade a de cima — e ai' a coluna
       inteira saia esverdeada. Por isso cada coluna e' conferida: se a
       referencia de cima ainda tem verde, aquela coluna e' preenchida so' com
       a de baixo, que tem folga de sobra (o fundo e' limpo de 289 a 315).
    """
    px = im.load()
    fx0, fy0, fx1, fy1 = FAIXA
    X0, X1 = int(round(fx0 * s + dx)), int(round(fx1 * s + dx))
    Y0, Y1 = int(round(fy0 * s + dy)), int(round(fy1 * s + dy))
    ya = int(round(LINHA_LIMPA_CIMA * s + dy))
    yb = int(round(LINHA_LIMPA_BAIXO * s + dy))
    sujas = 0
    for x in range(X0, X1 + 1):
        ca, cb = px[x, ya][:3], px[x, yb][:3]
        if tem_verde(ca):
            ca = cb
            sujas += 1
        for y in range(Y0, Y1 + 1):
            t = (y - ya) / (yb - ya)
            t = 0.0 if t < 0 else (1.0 if t > 1 else t)
            px[x, y] = tuple(int(round(a * (1 - t) + b * t)) for a, b in zip(ca, cb))
    return sujas


def mascara_palavra(s, dx, dy):
    """ALUNOS inclinado, em tom de cinza, no tamanho e no lugar desta imagem.

       Devolve (mascara, canto), com a mascara ja' do tamanho de CAIXA_PALAVRA
       em pixels da imagem — nunca da imagem inteira, senao a tela de abertura
       de 1290x2796 viraria um desenho de dezenas de milhoes de pixels.
    """
    SS = 8 if s >= 1 else 12               # quanto maior a reducao, mais amostra
    e = s * SS                             # pixel-de-icone -> pixel do desenho
    corpo = max(8, int(round(CORPO * e)))
    contorno = max(1, int(round(CONTORNO * e)))
    fonte = ImageFont.truetype(FONTE, corpo)

    # 1. a palavra em pe', ja' engordada
    folga = corpo * 3
    tela = Image.new('L', (int(corpo * len(PALAVRA) * 1.4) + folga * 2, corpo * 3), 0)
    d = ImageDraw.Draw(tela)
    ub, vb = folga, corpo * 2              # ancora: comeco da linha de base
    d.text((ub, vb), PALAVRA, font=fonte, fill=255,
           stroke_width=contorno, stroke_fill=255, anchor='ls')
    cx0, cy0, cx1, cy1 = tela.getbbox()

    # 2. largura, inclinacao e posicao, tudo numa transformacao so'
    larg = (cx1 - cx0) * LARGURA + INCLINACAO * (cy1 - cy0)
    X0 = (CENTRO_X * s + dx) * SS - larg / 2 - (cx0 - ub) * LARGURA
    Y0 = (BASE_Y * s + dy) * SS            # a linha de base, em pixel do desenho

    px0, py0, px1, py1 = CAIXA_PALAVRA
    canto = (int(px0 * s + dx), int(py0 * s + dy))
    tam = (int(round((px1 - px0) * s)) * SS, int(round((py1 - py0) * s)) * SS)

    # inverso de: X = X0 + (u-ub)*LARGURA + INCLINACAO*(Y0-Y) ; Y = Y0 + (v-vb)
    # com X,Y medidos a partir do canto da caixa.
    a = 1 / LARGURA
    b = INCLINACAO / LARGURA
    c = ub - (X0 + INCLINACAO * Y0) / LARGURA + a * canto[0] * SS + b * canto[1] * SS
    f = vb - Y0 + canto[1] * SS
    masc = tela.transform(tam, Image.AFFINE, (a, b, c, 0, 1, f), resample=Image.BILINEAR)
    return masc.resize((tam[0] // SS, tam[1] // SS), Image.LANCZOS), canto


def escrever(caminho):
    im = Image.open(caminho).convert('RGB')
    s, (dx, dy) = escala(im)
    sujas = apagar_faixa(im, s, dx, dy)

    masc, (ox, oy) = mascara_palavra(s, dx, dy)
    px, mp = im.load(), masc.load()
    larg, alt = im.size
    pintados = 0
    for y in range(masc.height):
        iy = (y + oy - dy) / s             # de volta para unidade-de-icone
        if not 0 <= y + oy < alt:
            continue
        for x in range(masc.width):
            al = mp[x, y]
            if al == 0 or not 0 <= x + ox < larg:
                continue
            ix = (x + ox - dx) / s
            cor = [c[0] + c[1] * ix + c[2] * iy for c in COR]
            t = al / 255
            px[x + ox, y + oy] = tuple(
                max(0, min(255, int(round(o * (1 - t) + c * t))))
                for o, c in zip(px[x + ox, y + oy], cor))
            pintados += 1
    im.save(caminho)
    return s, pintados, sujas


if __name__ == '__main__':
    for caminho in ARQUIVOS:
        if not os.path.exists(caminho):
            print('  faltando: %s' % caminho)
            continue
        s, n, sujas = escrever(caminho)
        print('  %-40s escala %.3f  %6d px de letra%s'
              % (caminho, s, n, '  (%d colunas so pela de baixo)' % sujas if sujas else ''))

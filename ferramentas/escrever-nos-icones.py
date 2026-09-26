#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Escreve o nome do app dentro do icone, na letra da propria marca.

   Por que existe: os tres apps da JV ficam lado a lado na tela de inicio, e
   quem olha le' primeiro a palavra grande sob o "JV". Ela era a mesma nos dois
   ("TENIS"), e o que separava os apps era a pastilha pequena embaixo — que no
   icone de 60 px do iPhone ja' nao se le'. Entao:

       App do Aluno   "TENIS" sai e entra "ALUNOS", no mesmo lugar
       Gestao         "TENIS" fica e "GESTAO" entra embaixo, numa linha nova

   Como funciona, e por que nao e' um retoque a mao: a arte so' existe em PNG.
   O script (1) acha a moldura limao para saber em que escala esta' aquele
   arquivo, (2) apaga a faixa onde a palavra vai ficar, reconstruindo o fundo
   por interpolacao entre uma linha limpa acima e outra abaixo, e (3) escreve a
   palavra com a mesma altura de caixa, a mesma espessura de haste, a mesma
   inclinacao e o mesmo degrade do "TENIS" original. Os numeros de (3) foram
   medidos no proprio "TENIS" do arquivo de 512 px e estao logo abaixo, com o
   valor medido ao lado.

   Como o desenho e' o mesmo em todos os tamanhos (o de 192, o -mask e as sete
   telas de abertura sao a mesma arte em outra escala), cada arquivo e' tratado
   na resolucao dele: a palavra e' desenhada grande e reduzida no fim, em vez
   de ampliar o icone de 512, que borraria o logo inteiro.

   Rodar de novo e' seguro: a faixa apagada cobre a palavra nova inteira, entao
   a segunda passada apaga e reescreve a mesma coisa no mesmo lugar (conferido:
   devolve arquivos byte a byte iguais).

   Uso, a partir da raiz do repositorio:
       python3 ferramentas/escrever-nos-icones.py
"""
import os
from PIL import Image, ImageChops, ImageDraw, ImageFont

FONTE = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

# --- Medidas, em pixels do arquivo de 512 (a "unidade de icone" do resto) ----
# A moldura limao do icone de 512: e' ela que diz a escala de cada arquivo.
MOLDURA = (37, 31, 473, 475)

BASE_TENIS = 287.0        # a linha de base do "TENIS", de onde vem tudo
CAIXA_TENIS = 39.0        # a altura de caixa dele
INCLINACAO = 0.49         # medido na haste do "I": 18 px de recuo em 36 de altura

# Como chegar na mesma letra com a DejaVu Sans Bold, para caixa 39: corpo 48.4,
# contorno de 1.385 e 1.33 de largura. O contorno engorda a letra (a DejaVu Bold
# sozinha e' leve demais) e vem ANTES do alargamento — e' por isso que a haste
# vertical fica com 15.6 e a barra horizontal com 9.2, a mesma diferenca que o
# "TENIS" tem. Atencao: o stroke_width do Pillow cresce para os dois lados,
# entao ele soma 2 x CONTORNO a' espessura, nao CONTORNO.
CORPO, CONTORNO, LARGURA = 48.4, 1.385, 1.33

# O degrade da palavra, ajustado por minimos quadrados nos 3.397 pixels de
# miolo do "TENIS" (erro medio de 2,4 niveis em 255): claro em cima e a
# esquerda, escuro embaixo e a direita. O y nao entra cru: e' medido a partir
# da linha de base da palavra e esticado para a caixa do "TENIS" — assim uma
# linha mais embaixo no icone nao sai preta, e uma linha menor percorre o mesmo
# claro-escuro da palavra original em vez de ficar so' com a parte escura.
COR = ((476.01, -0.1932, -0.9099),
       (449.16, -0.1581, -0.7683),
       (184.50, -0.0785, -0.3673))


def arquivos(pasta, nome):
    """Os onze arquivos de um app: os quatro icones e as sete splashes."""
    fora = ['%s/jv-icone-%s.png' % (pasta, nome),
            '%s/jv-icone-%s-192.png' % (pasta, nome),
            '%s/jv-icone-%s-512.png' % (pasta, nome),
            '%s/jv-icone-%s-mask.png' % (pasta, nome)]
    return fora + ['%s/splash-%s-%s.png' % (pasta, nome, t) for t in
                   ('750x1334', '828x1792', '1125x2436', '1170x2532',
                    '1179x2556', '1242x2688', '1290x2796')]


TRABALHOS = [
    # O App do Aluno: "ALUNOS" no lugar exato onde estava "TENIS".
    # A faixa comeca em y=237 de proposito — o risco sob o "JV" termina em 236
    # e o acento do "E" comeca em 238, entao apagar dali leva o acento junto e
    # nao encosta no risco. Ela e' mais larga que o "TENIS" que sai (x 125..379)
    # porque "ALUNOS" ocupa x 98..405. A linha fina do desenho fica em y=316.
    dict(nome='Aluno', palavra='ALUNOS', alvos=arquivos('app-aluno', 'aluno'),
         faixa=(95, 237, 410, 292), apagar='faixa',
         base=287.0, caixa=39.0, centro=255.0),

    # A Gestao: "TENIS" continua, e "GESTAO" entra numa linha nova, no vao
    # vazio entre a linha fina (y=316) e a pastilha (y=422). Caixa 32 e nao 39:
    # e' a terceira linha da marca, e tem que ler como terceira. A base em 390
    # deixa a mesma folga em cima e embaixo (32 px dos dois lados).
    # O vao esta' vazio, entao aqui nao se apaga nada: apagar seria refazer o
    # fundo por interpolacao, e isso alisaria as listras diagonais que o
    # desenho tem justamente nessa altura (elas chegam a 33 no canal verde —
    # some-las dava diferenca de ate' 55 niveis). Em troca, este trabalho so'
    # roda em arquivo ainda sem a palavra; se ja' houver tinta na faixa, ele
    # passa reto.
    dict(nome='Gestao', palavra='GESTÃO', alvos=arquivos('app-gestao', 'gestao'),
         faixa=(118, 338, 394, 398), apagar='vazio',
         base=390.0, caixa=32.0, centro=255.0),
]


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


def faixa_px(tr, s, dx, dy):
    """A faixa em pixel desta imagem. Uma conta so', usada por todo mundo: se a
       faixa que se apaga e a tela onde a palavra e' desenhada arredondassem
       diferente, sobraria uma coluna pintada fora da faixa — e ela seria
       pintada de novo, mais forte, a cada vez que o script rodasse."""
    fx0, fy0, fx1, fy1 = tr['faixa']
    return (int(round(fx0 * s + dx)), int(round(fy0 * s + dy)),
            int(round(fx1 * s + dx)), int(round(fy1 * s + dy)))


def tinta_na_faixa(im, tr, s, dx, dy):
    """Quantos pixels da faixa ja' tem tinta da marca."""
    px = im.load()
    X0, Y0, X1, Y1 = faixa_px(tr, s, dx, dy)
    return sum(1 for y in range(Y0, Y1 + 1) for x in range(X0, X1 + 1)
               if tem_verde(px[x, y]))


def apagar_faixa(im, tr, s, dx, dy):
    """Limpa a faixa da palavra, refazendo o fundo entre duas linhas limpas.

       As duas referencias sao as linhas de pixel logo fora da faixa — e nao
       linhas fixas do desenho. E' o que torna o resultado estavel: essas
       linhas nunca sao reescritas, entao rodar o script de novo le' exatamente
       os mesmos valores. Com linha fixa nao dava: no arquivo de 192 e nas
       splashes menores, a linha de referencia e a primeira linha da faixa
       caem no mesmo pixel.

       Ainda assim a de cima pode ter verde — e' onde termina o risco sob o
       "JV", e a borda suavizada dele desce um pouco. Por isso cada coluna e'
       conferida: se a de cima tem verde, aquela coluna e' preenchida so' com
       a de baixo, que e' fundo limpo.
    """
    px = im.load()
    X0, Y0, X1, Y1 = faixa_px(tr, s, dx, dy)
    ya, yb = Y0 - 1, Y1 + 1
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


def mascara_palavra(tr, s, dx, dy):
    """A palavra inclinada, em tom de cinza, no tamanho e no lugar desta imagem.

       Devolve (mascara, canto), com a mascara do tamanho da faixa em pixels da
       imagem — nunca da imagem inteira, senao a tela de abertura de 1290x2796
       viraria um desenho de dezenas de milhoes de pixels.
    """
    k = tr['caixa'] / CAIXA_TENIS          # esta palavra e' menor que o "TENIS"?
    SS = 8 if s >= 1 else 12               # quanto maior a reducao, mais amostra
    e = s * SS                             # pixel-de-icone -> pixel do desenho
    corpo = max(8, int(round(CORPO * k * e)))
    contorno = max(1, int(round(CONTORNO * k * e)))
    fonte = ImageFont.truetype(FONTE, corpo)

    # 1. a palavra em pe', ja' engordada
    folga = corpo * 3
    tela = Image.new('L', (int(corpo * len(tr['palavra']) * 1.4) + folga * 2,
                           corpo * 3), 0)
    d = ImageDraw.Draw(tela)
    ub, vb = folga, corpo * 2              # ancora: comeco da linha de base
    d.text((ub, vb), tr['palavra'], font=fonte, fill=255,
           stroke_width=contorno, stroke_fill=255, anchor='ls')
    cx0, cy0, cx1, cy1 = tela.getbbox()

    # 2. largura, inclinacao e posicao, tudo numa transformacao so'
    larg = (cx1 - cx0) * LARGURA + INCLINACAO * (cy1 - cy0)
    xp = (tr['centro'] * s + dx) * SS - larg / 2 - (cx0 - ub) * LARGURA
    yp = (tr['base'] * s + dy) * SS        # a linha de base, em pixel do desenho

    X0, Y0, X1, Y1 = faixa_px(tr, s, dx, dy)
    canto = (X0, Y0)
    tam = ((X1 - X0 + 1) * SS, (Y1 - Y0 + 1) * SS)

    # inverso de: X = xp + (u-ub)*LARGURA + INCLINACAO*(yp-Y) ; Y = yp + (v-vb)
    # com X,Y medidos a partir do canto da faixa.
    a = 1 / LARGURA
    b = INCLINACAO / LARGURA
    c = ub - (xp + INCLINACAO * yp) / LARGURA + (a * canto[0] + b * canto[1]) * SS
    f = vb - yp + canto[1] * SS
    masc = tela.transform(tam, Image.AFFINE, (a, b, c, 0, 1, f), resample=Image.BILINEAR)
    return masc.resize((tam[0] // SS, tam[1] // SS), Image.LANCZOS), canto


def escrever(caminho, tr):
    im = Image.open(caminho).convert('RGB')
    s, (dx, dy) = escala(im)
    if tr['apagar'] == 'faixa':
        sujas = apagar_faixa(im, tr, s, dx, dy)
    else:
        sujas = 0
        if tinta_na_faixa(im, tr, s, dx, dy) > 20:
            return s, None, 0          # ja' escrito: nao mexe

    masc, (ox, oy) = mascara_palavra(tr, s, dx, dy)
    k = tr['caixa'] / CAIXA_TENIS          # o degrade acompanha a palavra
    px, mp = im.load(), masc.load()
    larg, alt = im.size
    pintados = 0
    for y in range(masc.height):
        if not 0 <= y + oy < alt:
            continue
        iy = BASE_TENIS - (tr['base'] - (y + oy - dy) / s) / k
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
    for tr in TRABALHOS:
        print('%s — "%s"' % (tr['nome'], tr['palavra']))
        for caminho in tr['alvos']:
            if not os.path.exists(caminho):
                print('  faltando: %s' % caminho)
                continue
            s, n, sujas = escrever(caminho, tr)
            if n is None:
                print('  %-40s escala %.3f  ja escrito, nao mexi' % (caminho, s))
                continue
            print('  %-40s escala %.3f  %6d px de letra%s'
                  % (caminho, s, n,
                     '  (%d colunas so pela de baixo)' % sujas if sujas else ''))

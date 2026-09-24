#!/usr/bin/env python3
"""Tira a quadra da folha modelo do Joao e deixa ela vazia, para servir de
fundo de TODOS os exercicios.

A folha modelo (ferramentas/originais/modelo-folha-jv.jpg) tem uma foto de
quadra de saibro vista de tras e do alto, com dois jogadores, dois cones, as
setas e os rotulos do exercicio dela. O que fica e' so' a quadra; o resto e'
desenhado por cima, exercicio por exercicio, pelo quadra.js.

Como cada coisa sai:
  - os JOGADORES: o lugar deles e' coberto com saibro copiado do lado, na
    mesma altura da imagem. As linhas que passam atras deles (linha de base,
    linha de saque, a rede) sao horizontais — copiando na mesma altura, elas
    continuam sozinhas, com a mesma textura;
  - os ROTULOS: cobertos com um retalho de saibro limpo do fundo da quadra;
  - CONES e SETAS: cobertos com o pixel da mesma linha um pouco ao lado,
    tirado de onde nao ha marca nem linha — a textura do saibro e a malha da
    rede continuam iguais (inpaint borraria as duas);
  - a linha central que a foto tinha entre o fundo e o saque do lado de la
    sai: quadra de verdade so' tem a marca central ali;
  - por fim as LINHAS da quadra sao redesenhadas, mas so' dentro do que foi
    consertado: fora disso fica o pixel original.

    uso: python3 ferramentas/limpar-quadra-modelo.py [saida.webp]
    (precisa de opencv-python-headless, scipy e Pillow)
"""
import sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter

MODELO = 'ferramentas/originais/modelo-folha-jv.jpg'
CAIXA = (28, 511, 686, 1220)      # a foto da quadra dentro da folha modelo
K = 2                             # trabalha ampliado: linhas redesenhadas mais finas e lisas
APARA = 3                         # tira a borda arredondada da foto (px da folha)

# medidas em pixels da foto recortada (sem ampliar), tiradas das proprias linhas
LINHAS = [
    ((106, 82), (545, 82)),            # fundo de la
    ((143, 158), (511, 158)),          # saque de la
    ((326, 82), (326, 90)),            # marca central do lado de la
    ((326, 158), (326, 232)),          # linha central do lado de la
    ((326, 292), (326, 444)),          # linha central do lado de ca
    ((84, 444), (569, 444)),           # saque de ca
    ((-5, 640), (663, 640)),           # fundo de ca
    ((326, 626), (326, 640)),          # marca central
    ((159, 82), (44.5, 637)),          # simples, esquerda
    ((494.5, 82), (605, 637)),         # simples, direita
    ((106, 82), (-36.5, 640)),         # duplas, esquerda
    ((545, 82), (689, 640)),           # duplas, direita
]
COR_LINHA = (246, 238, 226)
REDE = (230, 294)                  # faixa da rede (y)


def cobrir(a, orig, alvo, evitar=None):
    """Cobre cada pixel marcado com o pixel da mesma linha um pouco ao lado,
    tirado de onde nao ha marca nem linha branca: a textura do saibro (e a
    malha da rede) continua a mesma. Sobrou algum, o inpaint fecha."""
    h, w = alvo.shape
    branco = cv2.dilate((a.min(2) > 105).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    ruim = alvo | branco
    if evitar is not None:
        ruim = ruim | evitar
    feito = np.zeros_like(alvo)
    for d in (26, -26, 40, -40, 56, -56, 76, -76, 100, -100, 130, -130):
        falta = alvo & ~feito
        if not falta.any():
            break
        ys, xs = np.where(falta)
        xs2 = xs + d
        ok = (xs2 >= 0) & (xs2 < w)
        ys, xs, xs2 = ys[ok], xs[ok], xs2[ok]
        bom = ~ruim[ys, xs2]
        a[ys[bom], xs[bom]] = a[ys[bom], xs2[bom]]
        feito[ys[bom], xs[bom]] = True
    resto = alvo & ~feito
    if resto.any():
        a[:] = cv2.inpaint(a, resto.astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)


def seguir(img, x0, y0, x1, y1, pular):
    """Pontos da linha branca entre (x0,y0) e (x1,y1), achados na foto: em
    cada altura, o meio do trecho branco mais perto da reta. Onde a foto foi
    consertada (ou nao ha branco), fica o ponto da reta interpolada."""
    branco = img.min(2) > 165
    h, w = branco.shape
    if abs(y1 - y0) < abs(x1 - x0):               # linha deitada: reta basta
        return [(x0, y0), (x1, y1)]
    ys = np.arange(y0, y1 + (3 if y1 > y0 else -3), 6 if y1 > y0 else -6, dtype=float)
    xs = np.full(len(ys), np.nan)
    for i, y in enumerate(ys):
        t = (y - y0) / (y1 - y0)
        xr = x0 + t * (x1 - x0)
        yi = int(round(y))
        if 0 <= yi < h and 12 <= xr < w - 12 and not pular[yi, int(xr)]:
            achou = np.where(branco[yi, int(xr) - 10:int(xr) + 11])[0]
            if len(achou):
                xs[i] = int(xr) - 10 + achou.mean()
    # onde a foto foi consertada, o ponto vem dos vizinhos ACHADOS (a linha
    # curva de leve); sem nenhum achado, fica a reta
    ok = ~np.isnan(xs)
    reta = x0 + (ys - y0) / (y1 - y0) * (x1 - x0)
    if ok.sum() >= 2:
        xs = np.interp(ys, ys[ok][::1 if ys[1] > ys[0] else -1], xs[ok][::1 if ys[1] > ys[0] else -1])
    else:
        xs = reta
    # suaviza: a media de 5 vizinhos tira o tremido sem perder a curva
    if len(xs) > 5:
        xs = np.convolve(np.pad(xs, 2, mode='edge'), np.ones(5) / 5, mode='valid')
    return [(float(x), float(y)) for x, y in zip(xs, ys)]


def ampliar(im):
    return im.resize((im.width * K, im.height * K), Image.LANCZOS)


def main(saida):
    foto = ampliar(Image.open(MODELO).convert('RGB').crop(CAIXA))
    a = np.array(foto).astype(np.uint8)
    h, w = a.shape[:2]
    orig = a.copy()
    conserto = np.zeros((h, w), bool)          # onde algo foi trocado

    def cx(v):
        return int(round(v * K))

    def copia_lado(*partes):
        """cobre as caixas com o que esta' `desloc` px para o lado, na mesma
        altura, por clonagem sem costura (seamlessClone): a luz da foto muda
        de um lugar para outro, e a copia crua deixava um retangulo visivel.
        As partes de um mesmo buraco entram JUNTAS: clonadas uma de cada vez,
        a borda de uma caia em cima do que ainda nao tinha sido limpo. A
        fonte e' a foto JA sem setas e cones: senao eles voltavam no retalho."""
        base = a.copy()
        fonte = base.copy()
        m = np.zeros((h, w), np.uint8)
        for x0, y0, x1, y1, desloc in partes:
            X0, Y0, X1, Y1, D = cx(x0), cx(y0), cx(x1), cx(y1), cx(desloc)
            fonte[Y0:Y1, X0:X1] = base[Y0:Y1, X0 + D:X1 + D]
            m[Y0:Y1, X0:X1] = 255
            conserto[Y0:Y1, X0:X1] = True
        ys, xs = np.where(m > 0)
        centro = ((xs.min() + xs.max() + 1) // 2, (ys.min() + ys.max() + 1) // 2)
        a[:] = cv2.seamlessClone(fonte, base, m, centro, cv2.NORMAL_CLONE)

    # 1. primeiro o que e' fino: setas (limao, com o brilho em volta) e a
    #    linha central que a foto tinha entre o fundo e o saque do lado de la
    #    (quadra de verdade so' tem a marca central ali). Os jogadores ficam
    #    de fora aqui: saem inteiros no passo 3.
    jog = np.zeros((h, w), bool)
    for (x0, y0, x1, y1) in ((244, 125, 406, 265),):
        jog[cx(y0):cx(y1), cx(x0):cx(x1)] = True
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    lima = (g > 100) & (g > 0.72 * r) & (g - b > 40)
    alvo = (cv2.dilate(lima.astype(np.uint8), np.ones((13, 13), np.uint8)) > 0) & ~jog
    alvo[cx(91):cx(155), cx(322):cx(331)] = True
    cobrir(a, orig, alvo, evitar=jog)     # nunca copiar o jogador para dentro da seta
    conserto |= alvo

    # 2. cones: saibro limpo do meio da quadra de la, clonado sem costura
    copia_lado((107, 97, 142, 152, +100))
    copia_lado((513, 97, 549, 152, -100))

    # 3. jogadores: duas metades, cada uma copiada do lado em que nao ha linha
    copia_lado((229, 460, 332, 704, -130), (332, 460, 435, 704, +130))   # o de perto
    copia_lado((244, 125, 326, 265, -88), (326, 125, 406, 265, +88))     # o de longe

    # rotulos: eles tem sombra, e qualquer clonagem "herda" a borda escura.
    # Aqui entra a cor de fundo tirada da vizinhanca (inpaint largo, depois
    # desfocado) mais a TEXTURA de um trecho limpo de saibro (so' o detalhe
    # fino dele, sem a cor). A linha de fundo volta no redesenho das linhas.
    txt = orig[cx(520):cx(620), cx(440):cx(572)].astype(np.float32)   # saibro sem linha nem seta
    detalhe = txt - cv2.GaussianBlur(txt, (0, 0), 3)
    for (x0, y0, x1, y1) in ((16, 29, 143, 97), (512, 29, 643, 97)):
        X0, Y0, X1, Y1 = cx(x0), cx(y0), cx(x1), cx(y1)
        m = np.zeros((h, w), np.uint8)
        m[Y0:Y1, X0:X1] = 255
        fundo = cv2.inpaint(a, m, 25, cv2.INPAINT_TELEA).astype(np.float32)
        fundo = cv2.GaussianBlur(fundo, (0, 0), 10)
        hh, ww = Y1 - Y0, X1 - X0
        det = np.tile(detalhe, (hh // detalhe.shape[0] + 1, ww // detalhe.shape[1] + 1, 1))[:hh, :ww]
        a[Y0:Y1, X0:X1] = np.clip(fundo[Y0:Y1, X0:X1] + det, 0, 255).astype(np.uint8)
        conserto[Y0:Y1, X0:X1] = True

    # 4. linhas redesenhadas, so' dentro do que foi consertado. A foto nao e'
    #    uma camera perfeita: as linhas fazem uma curva leve. Por isso cada
    #    linha e' SEGUIDA na foto original, linha por linha da imagem, e
    #    redesenhada pelos pontos achados — reta de ponta a ponta sairia
    #    deslocada de ate' 6 px no meio e a linha pareceria quebrada.
    cam = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(cam)
    for (x0, y0), (x1, y1) in LINHAS:
        pts = seguir(orig, x0 * K, y0 * K, x1 * K, y1 * K, conserto)
        d.line(pts, fill=255, width=int(2.6 * K), joint='curve')
    cam = np.array(cam.filter(ImageFilter.GaussianBlur(0.7))).astype(float) / 255
    peso = cam * cv2.GaussianBlur(conserto.astype(np.float32), (0, 0), 1.2)
    # a rede fica por cima das linhas: nada de linha desenhada na faixa da rede
    peso[cx(REDE[0]):cx(REDE[1])] = 0
    # ...mas a FITA branca do alto da rede e' redesenhada onde a seta passava:
    # ela cai uns 4 px no meio, como a de verdade
    fita = Image.new('L', (w, h), 0)
    df = ImageDraw.Draw(fita)
    xsf = np.linspace(26, 628, 60)
    df.line([(x * K, (233 + 4 * (1 - ((x - 327) / 305) ** 2)) * K) for x in xsf], fill=255, width=int(3 * K))
    fita = np.array(fita.filter(ImageFilter.GaussianBlur(0.6))).astype(float) / 255
    peso = np.maximum(peso, fita * cv2.GaussianBlur(conserto.astype(np.float32), (0, 0), 1.2))
    a = (a * (1 - peso[..., None]) + np.array(COR_LINHA) * peso[..., None] * 0.96).astype(np.uint8)

    # 5. costura: o conserto entra com a borda esfumada, sem degrau
    m = cv2.GaussianBlur(conserto.astype(np.float32), (0, 0), 3.0)[..., None]
    a = (a * m + orig * (1 - m)).astype(np.uint8)

    p = APARA * K
    out = Image.fromarray(a[p:h - p, p:w - p])
    out.save(saida, 'WEBP', quality=90, method=6)
    print('%s: %dx%d' % (saida, out.width, out.height))
    print('pixel da foto final = (pixel da foto recortada - %d) x %d' % (APARA, K))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'app-exercicios/quadra-jv.webp')

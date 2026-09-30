#!/usr/bin/env python3
"""Recorta as poses da prancha de figuras da JV e grava os arquivos do app.

A prancha (fundo preto, jogador de camisa preta JV) foi criada pelo Joao, com
autoria propria. Camisa preta contra fundo preto nao se recorta por cor: o
recorte e' feito pelo rembg (modelo birefnet-general-lite), que separa a pessoa
pelo formato. Precisa de:  pip install rembg onnxruntime
Dos tres modelos testados, o BiRefNet foi o unico que tirou o fundo escuro
entre as pernas da espera de costas e manteve a raquete do saque de costas
(o isnet deixava a sombra; o u2net_human_seg deixava um halo e apagava a
raquete).

    uso: python3 ferramentas/recortar-poses-jv.py PRANCHA.png [pasta-de-saida]

Para cada pose:
  1. corta a caixa da prancha e amplia 2x (Lanczos) antes do recorte — o
     modelo acerta melhor a borda do cabelo e da raquete em imagem maior;
  2. tira o fundo e joga fora os pedacinhos soltos (a raquete do vizinho
     que invadia a caixa);
  3. apara na pessoa, com uma folga de 4 px;
  4. quando a pose tem versao espelhada, espelha e DESESPELHA o logo JV da
     camisa: espelhar a pessoa troca o lado da raquete, mas o "JV" viraria
     "VL" ao contrario — e o logo e' o que mais aparece na figura.

Imprime, para cada arquivo, a altura real do topo da imagem em metros
(`altura` do RECORTES, no quadra.js) e a proporcao (`prop`). A altura sai da
escala de cada linha da prancha: em cada linha as figuras foram desenhadas na
mesma distancia, e a posicao de espera da linha vale 1,62 m (1,80 m de pessoa,
joelhos dobrados).
"""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

# caixa na prancha (1536 x 1024), linha da prancha, e se tem versao espelhada
POSES = {
    #  arquivo                 caixa                      linha  espelho
    'jv-espera-frente':      ((10, 55, 232, 372),        1, False),
    'jv-golpe-frente-fh':    ((205, 55, 462, 372),       1, False),
    'jv-golpe-frente-bh':    ((470, 55, 736, 372),       1, False),
    'jv-espera-costas':      ((785, 55, 1010, 372),      1, False),
    'jv-golpe-costas-fh':    ((1020, 55, 1290, 372),     1, 'jv-golpe-costas-bh'),
    'jv-voleio':             ((595, 460, 810, 725),      2, 'jv-voleio-esq'),
    'jv-saque-frente':       ((810, 415, 960, 725),      2, False),
    'jv-aproxima':           ((1150, 480, 1330, 725),    2, 'jv-aproxima-esq'),
    'jv-desloca':            ((1345, 490, 1500, 725),    2, 'jv-desloca-esq'),
    # na prancha o saque de costas tem a raquete a' esquerda; o destro, visto
    # de tras, leva a raquete para as costas do lado DIREITO: fica so' o espelho
    'jv-saque-costas':       ((994, 815, 1133, 1005),    3, 'so-espelho'),
}
# a posicao de espera de cada linha, que da' a escala (px por metro)
ESPERA = {1: (10, 55, 232, 372), 2: (15, 470, 195, 725), 3: (1337, 815, 1525, 1005)}
ALTURA_ESPERA = 1.62
# a prancha nao e' uma foto: a escala muda um pouco de figura para figura.
# Onde a conta da linha erra o bom senso, vale a altura medida a olho
# (topo da raquete no saque de costas, com a raquete atras da cabeca)
ALTURA_FIXA = {'jv-saque-costas': 1.80}
AMPLIA = 2


def recortar(prancha, caixa, sessao):
    from rembg import remove
    c = prancha.crop(caixa)
    c = c.resize((c.width * AMPLIA, c.height * AMPLIA), Image.LANCZOS)
    o = np.array(remove(c, session=sessao))
    a = o[..., 3] > 40
    rot, n = ndimage.label(a)
    if n > 1:
        areas = ndimage.sum(a, rot, range(1, n + 1))
        fica = [i + 1 for i, s in enumerate(areas) if s >= 0.015 * areas.max()]
        o[~np.isin(rot, fica), 3] = 0
    ys, xs = np.where(o[..., 3] > 40)
    y0, y1 = max(ys.min() - 4, 0), min(ys.max() + 5, o.shape[0])
    x0, x1 = max(xs.min() - 4, 0), min(xs.max() + 5, o.shape[1])
    return Image.fromarray(o[y0:y1, x0:x1])


def logo(a):
    """Caixa do logo JV da camisa: pixels verde-limao dentro do tronco.
    A raquete tambem e' limao, por isso so' conta o que cai no tronco e em
    manchas compactas; a maior mancha e' o logo."""
    r, g, b, al = [a[..., i].astype(int) for i in range(4)]
    lima = (al > 200) & (g > 150) & (r > 120) & (b < 110) & (g - b > 90)
    h, w = lima.shape
    tronco = np.zeros_like(lima)
    tronco[int(h * 0.10):int(h * 0.50), int(w * 0.15):int(w * 0.85)] = True
    lima &= tronco
    rot, n = ndimage.label(ndimage.binary_dilation(lima, iterations=3))
    if n == 0:
        return None
    melhor = None
    for i, sl in enumerate(ndimage.find_objects(rot)):
        hh, ww = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if hh > h * 0.12 or ww > w * 0.45:      # comprido demais: e' raquete
            continue
        area = (rot[sl] == i + 1).sum()
        if melhor is None or area > melhor[0]:
            melhor = (area, sl)
    return melhor[1] if melhor else None


def pes(img):
    """Onde estao os pes na largura da imagem (0 a 1): o meio do trecho
    ocupado nos 10% de baixo. E' esse ponto que vai em cima do lugar do
    jogador no desenho — o meio da imagem nao serve, porque a raquete
    esticada puxa a caixa para um lado."""
    a = np.array(img)[..., 3] > 128
    ys = np.where(a.any(1))[0]
    base = ys.max()
    xs = np.where(a[int(base - a.shape[0] * 0.10):base + 1].any(0))[0]
    return (xs.min() + xs.max()) / 2 / a.shape[1]


def espelhar(img):
    a = np.array(img)[:, ::-1].copy()
    sl = logo(a)
    if sl is not None:
        ys, xs = sl
        # o "TENIS" branco embaixo do JV das costas tambem e' letra: a faixa
        # desespelhada desce ate' ele (no peito nao ha' nada embaixo, e
        # desespelhar um pouco de camisa lisa nao muda nada)
        y0, y1 = ys.start, min(ys.stop + int((ys.stop - ys.start) * 0.9), int(a.shape[0] * 0.55))
        x0, x1 = max(xs.start - 2, 0), min(xs.stop + 2, a.shape[1])
        a[y0:y1, x0:x1] = a[y0:y1, x0:x1][:, ::-1]
    return Image.fromarray(a), sl is not None


def main(arq, saida):
    from rembg import new_session
    sessao = new_session('birefnet-general-lite')
    prancha = Image.open(arq).convert('RGB')
    escala = {}
    for linha, cx in ESPERA.items():
        e = recortar(prancha, cx, sessao)
        escala[linha] = (e.height / AMPLIA) / ALTURA_ESPERA        # px da prancha por metro
    for nome, (cx, linha, esp) in POSES.items():
        img = recortar(prancha, cx, sessao)
        altura = ALTURA_FIXA.get(nome) or (img.height / AMPLIA) / escala[linha]
        prop = img.width / img.height
        extra = ''
        if esp == 'so-espelho':
            img, achou = espelhar(img)
            extra = ' (espelhada%s)' % ('' if achou else ', logo nao achado')
            esp = False
        img.save(os.path.join(saida, nome + '.webp'), 'WEBP', quality=92, method=6)
        extra += ' pes:%.3f' % pes(img)
        if esp:
            m, achou = espelhar(img)
            m.save(os.path.join(saida, esp + '.webp'), 'WEBP', quality=92, method=6)
            extra += ' + %s pes:%.3f%s' % (esp, pes(m), '' if achou else ' (logo nao achado)')
        print('%-22s %4dx%-4d altura:%.2f prop:%.3f%s' % (nome, img.width, img.height, altura, prop, extra))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'app-exercicios')

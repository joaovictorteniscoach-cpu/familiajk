#!/usr/bin/env python3
"""Puxa a camisa do ALUNO para o dourado da legenda.

   O `pintar-camisa.py` gira o matiz preservando o brilho — e preservar o
   brilho de uma camisa azul-escura devolve um dourado escuro, que na quadra
   le como verde-oliva. A legenda diz que aluno e' dourado; se a camisa nao
   for dourada, a legenda mente. Este passo entra DEPOIS do giro de matiz e
   so' nos pixels que ja' estao na faixa do dourado: levanta a saturacao e o
   brilho deles, sem tocar em pele, cabelo, calca ou tenis.

   Uso:  python3 ferramentas/camisa-dourada.py entrada.png saida.png
"""
import sys
import colorsys
import numpy as np
from PIL import Image

MIN_H, MAX_H = 34.0, 62.0      # faixa de matiz do dourado, em graus
GANHO_S, GANHO_V = 1.75, 1.30  # quanto levantar saturacao e brilho


def dourar(entrada, saida):
    im = Image.open(entrada).convert('RGBA')
    a = np.array(im).astype(float) / 255.0
    rgb, al = a[:, :, :3], a[:, :, 3]
    mudou = 0
    h, w = al.shape
    for y in range(h):
        for x in range(w):
            if al[y, x] < 0.2:
                continue
            r, g, b = rgb[y, x]
            hh, ss, vv = colorsys.rgb_to_hsv(r, g, b)
            if ss < 0.12 or not (MIN_H <= hh * 360 <= MAX_H):
                continue
            ss = min(1.0, ss * GANHO_S)
            vv = min(1.0, vv * GANHO_V)
            rgb[y, x] = colorsys.hsv_to_rgb(hh, ss, vv)
            mudou += 1
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), 'RGBA').save(saida)
    print('%s -> %s  (%d pixels dourados)' % (entrada, saida, mudou))


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('uso: camisa-dourada.py entrada.png saida.png')
    dourar(sys.argv[1], sys.argv[2])

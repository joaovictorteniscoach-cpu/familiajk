#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Troca a cor da camisa de um recorte de jogador, mantendo a pessoa.

   Por que existe: o desenho usa cor para dizer QUEM E' QUEM — aluno, professor
   e colega. Com um recorte so', os tres papeis ficariam iguais e a legenda
   passaria a mentir. Em vez de procurar tres pessoas diferentes, pinta-se a
   camisa da mesma: o estilo fica igual nos tres (e' o que faz o desenho
   parecer de uma peca so') e o papel volta a ser reconhecivel pela cor.

   Como funciona: gira o MATIZ so' dos pixels que estao na faixa de cor da
   camisa e tem cor de verdade. Pele fica (o matiz dela esta' fora da faixa),
   short preto fica (nao tem cor), linha branca fica. O brilho de cada pixel e'
   preservado, entao a dobra do tecido e a sombra continuam onde estavam — e' o
   que separa isto de pintar por cima com um balde.

   Uso, a partir da raiz do repositorio:
       python3 ferramentas/pintar-camisa.py entrada.png saida.png --de 210 --para 45
       python3 ferramentas/pintar-camisa.py entrada.png saida.png --de 210 --para 0 --cinza

   --de     matiz da camisa hoje, em graus (0 vermelho, 120 verde, 240 azul)
   --para   matiz que ela vai ter
   --faixa  quanto do matiz em volta do --de entra junto (padrao 40 graus)
   --cinza  em vez de girar o matiz, tira a cor: camisa branca/cinza
"""
import colorsys
import os
import sys

from PIL import Image


def pintar(entrada, saida, de, para, faixa=40, cinza=False):
    im = Image.open(entrada).convert('RGBA')
    px = im.load()
    larg, alt = im.size
    trocados = 0
    for y in range(alt):
        for x in range(larg):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            if s < 0.18:            # sem cor: short preto, meia branca, linha
                continue
            graus = h * 360.0
            d = abs(((graus - de + 180) % 360) - 180)
            if d > faixa:
                continue
            if cinza:
                nr = ng = nb = v
                ns = 0.0
                nr, ng, nb = colorsys.hsv_to_rgb(0, 0, min(1.0, v * 1.12))
            else:
                nr, ng, nb = colorsys.hsv_to_rgb(((para + (graus - de)) % 360) / 360.0, s, v)
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
            trocados += 1
    # webp: a figura e' foto, e PNG de foto pesa cinco vezes mais. A
    # qualidade 88 nao se ve' no tamanho em que o jogador e' desenhado.
    im.save(saida, **({'quality': 88, 'method': 6}
                      if saida.lower().endswith('.webp') else {'optimize': True}))
    print('%s → %s' % (entrada, saida))
    print('  %d pixels repintados (%.1f%% da imagem)' % (trocados, 100.0 * trocados / (larg * alt)))
    if trocados < larg * alt * 0.02:
        print('  ATENCAO: repintou quase nada — confira o --de com o matiz real da camisa.')
    print('  %d KB' % (os.path.getsize(saida) // 1024))


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 1
    def num(nome, padrao):
        return float(argv[argv.index(nome) + 1]) if nome in argv else padrao
    pintar(argv[1], argv[2], num('--de', 210), num('--para', 45),
           num('--faixa', 40), '--cinza' in argv)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))

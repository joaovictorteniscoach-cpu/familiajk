#!/usr/bin/env python3
"""Gera as telas de abertura (splash) do iOS a partir do icone do app.

   Por que existe: sem elas, o app aberto da Tela de Inicio mostra uma tela
   BRANCA enquanto carrega — no iPhone isso parece travamento, ainda mais num
   app que abre offline em quadra. O Android nao precisa (usa o icone e a cor
   do manifest); o iOS precisa de uma imagem POR TAMANHO DE TELA, e e' por
   isso que sao sete arquivos e nao um.

   Uso:
       python3 ferramentas/gerar-splash.py app-exercicios/jv-icone-exercicios.png \\
           app-exercicios splash-exercicios --fundo "#102438"

   Imprime no fim o bloco de <link> pronto para colar no <head>.
"""
import argparse
import os
from PIL import Image

# largura x altura do arquivo, e a media query que o iOS usa para escolher
TELAS = [
    (1290, 2796, 430, 932, 3),
    (1179, 2556, 393, 852, 3),
    (1170, 2532, 390, 844, 3),
    (1242, 2688, 414, 896, 3),
    (1125, 2436, 375, 812, 3),
    (828, 1792, 414, 896, 2),
    (750, 1334, 375, 667, 2),
]
PARTE_DO_ICONE = 0.40      # quanto da largura da tela o icone ocupa


def cor(txt):
    txt = txt.lstrip('#')
    return tuple(int(txt[i:i + 2], 16) for i in (0, 2, 4))


def gerar(icone, pasta, prefixo, fundo):
    ic = Image.open(icone).convert('RGBA')
    feitos = []
    for w, h, dw, dh, dpr in TELAS:
        tela = Image.new('RGBA', (w, h), fundo + (255,))
        lado = int(w * PARTE_DO_ICONE)
        peca = ic.resize((lado, lado), Image.LANCZOS)
        tela.alpha_composite(peca, ((w - lado) // 2, (h - lado) // 2))
        nome = '%s-%dx%d.png' % (prefixo, w, h)
        tela.convert('RGB').save(os.path.join(pasta, nome), optimize=True)
        feitos.append((nome, dw, dh, dpr))
        print('  %s  %dx%d' % (nome, w, h))

    print('\nCole no <head> (a ordem importa: o iOS pega o primeiro que casar):')
    for nome, dw, dh, dpr in feitos:
        print('<link rel="apple-touch-startup-image" href="%s"\n'
              '      media="screen and (device-width:%dpx) and (device-height:%dpx) '
              'and (-webkit-device-pixel-ratio:%d) and (orientation:portrait)">'
              % (nome, dw, dh, dpr))


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('icone'); p.add_argument('pasta'); p.add_argument('prefixo')
    p.add_argument('--fundo', default='#0E0C08')
    o = p.parse_args()
    gerar(o.icone, o.pasta, o.prefixo, cor(o.fundo))

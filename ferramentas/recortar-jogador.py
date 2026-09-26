#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Recorta o fundo de uma foto de jogador e deixa o PNG pronto para o app.

   Por que existe: o desenho poe a pessoa em cima da quadra, entao ela precisa
   vir sem fundo. Isso NAO quer dizer que a foto tenha que chegar sem fundo —
   e' justamente o contrario: este script faz o recorte, entao basta fotografar
   o jogador de corpo inteiro contra uma parede lisa, um tapume, o ceu, o que
   for de cor uniforme. Nao precisa procurar "PNG transparente" na internet.

   Como funciona: espalha a partir das BORDAS da imagem, tirando so' o que
   estiver ligado a elas e parecido com elas. Espalhar pelas bordas, e nao por
   cor, e' o que impede que a camisa branca do jogador va' embora junto com o
   fundo branco — ela nao encosta na borda.

   Tambem tira o xadrez cinza-e-branco que sites de imagem gravam dentro do
   arquivo quando o "PNG transparente" e' salvo em JPG. Esse xadrez nao e'
   transparencia: e' desenho, e sem tirar ele o jogador aparece na quadra
   dentro de um quadrado quadriculado. Onde o xadrez aparece POR DENTRO do
   jogador — numa camisa meio transparente, por exemplo — nao ha' conserto:
   ali ele foi gravado por cima da pessoa, e sai quadriculado mesmo.

   A UNICA exigencia da foto: a roupa nao pode ser da mesma cor do fundo.
   Jogador de branco contra parede branca e' o caso que nao tem jeito — a
   conta nao consegue saber onde acaba a camisa e comeca a parede.

   Uso, a partir da raiz do repositorio:
       python3 ferramentas/recortar-jogador.py foto.jpg app-exercicios/jog-espera.png
       python3 ferramentas/recortar-jogador.py foto.jpg saida.png --tol 42 --alt 700
       python3 ferramentas/recortar-jogador.py foto.jpg saida.png --tirar-sombra 12

   --tol          quanto o fundo pode variar de cor (padrao 38; foto pequena
                  ou muito comprimida pede menos, uns 8 a 12)
   --alt          altura do PNG que sai (padrao 720)
   --tirar-sombra apaga a mancha clara do chao do estudio, nos N% de baixo
                  (use 100 quando ela subir entre as pernas)
"""
import os
import sys
from collections import deque

from PIL import Image


def recortar(entrada, saida, tol=38, alt_max=720, sombra=0):
    im = Image.open(entrada).convert('RGBA')
    larg, altura = im.size
    px = im.load()

    # As cores do fundo sao as das bordas. Guardar varias, e nao uma media,
    # e' o que faz o xadrez sair: ele tem dois tons, e a media dos dois nao e'
    # parecida o bastante com nenhum deles.
    amostras = []
    for x in range(0, larg, max(1, larg // 40)):
        amostras.append(px[x, 0][:3]); amostras.append(px[x, altura - 1][:3])
    for y in range(0, altura, max(1, altura // 40)):
        amostras.append(px[0, y][:3]); amostras.append(px[larg - 1, y][:3])

    def e_fundo(c):
        for a in amostras:
            if abs(c[0] - a[0]) + abs(c[1] - a[1]) + abs(c[2] - a[2]) <= tol * 3:
                return True
        return False

    visto = bytearray(larg * altura)
    fila = deque()
    for x in range(larg):
        for y in (0, altura - 1):
            fila.append((x, y))
    for y in range(altura):
        for x in (0, larg - 1):
            fila.append((x, y))

    while fila:
        x, y = fila.popleft()
        if x < 0 or y < 0 or x >= larg or y >= altura:
            continue
        i = y * larg + x
        if visto[i]:
            continue
        if not e_fundo(px[x, y][:3]):
            continue
        visto[i] = 1
        fila.append((x + 1, y)); fila.append((x - 1, y))
        fila.append((x, y + 1)); fila.append((x, y - 1))

    tirados = sum(visto)
    for y in range(altura):
        for x in range(larg):
            if visto[y * larg + x]:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)

    # A mancha clara que sobra DEBAIXO dos pes e' a sombra do chao do estudio,
    # gravada na foto. Ela nao encosta na borda (os tenis a cercam), entao o
    # espalhamento nao chega nela. Aqui ela e' apagada pelo que e': quase
    # branca, sem cor e na faixa de baixo da imagem.
    if sombra > 0:
        de = int(altura * (1 - sombra / 100.0))
        apagados = 0
        for y in range(de, altura):
            for x in range(larg):
                r, g, b, a = px[x, y]
                if a and min(r, g, b) > 226 and max(r, g, b) - min(r, g, b) < 12:
                    px[x, y] = (r, g, b, 0)
                    apagados += 1
        print('  sombra do chao: %d pixels apagados nos %d%% de baixo' % (apagados, sombra))

    caixa = im.getbbox()
    if not caixa:
        print('ERRO: sobrou imagem nenhuma — o fundo nao e uniforme o bastante.')
        return None
    im = im.crop(caixa)
    if im.height > alt_max:
        im = im.resize((round(im.width * alt_max / im.height), alt_max), Image.LANCZOS)
    # webp: a figura e' foto, e PNG de foto pesa cinco vezes mais. A
    # qualidade 88 nao se ve' no tamanho em que o jogador e' desenhado.
    im.save(saida, **({'quality': 88, 'method': 6}
                      if saida.lower().endswith('.webp') else {'optimize': True}))

    fatia = 100.0 * tirados / (larg * altura)
    print('%s → %s' % (entrada, saida))
    print('  fundo tirado: %.0f%% da imagem' % fatia)
    print('  sobrou: %dx%d px, %d KB' % (im.width, im.height, os.path.getsize(saida) // 1024))
    if fatia < 25:
        print('  ATENCAO: tirou pouco. O fundo provavelmente nao e uniforme —')
        print('  refaca a foto contra uma parede lisa, ou suba a tolerancia (--tol).')
    if fatia > 88:
        print('  ATENCAO: tirou quase tudo — a conta comeu o jogador junto com o')
        print('  fundo. Quase sempre e roupa da MESMA COR do fundo (jogador de')
        print('  branco contra parede branca e o caso classico). Fotografe contra')
        print('  uma parede de cor diferente da roupa; mudar --tol nao resolve.')
    fino = im.width / im.height
    if fino < 0.22:
        print('  ATENCAO: sobrou uma tira fina. Provavelmente so a raquete e o')
        print('  braco resistiram, e o corpo saiu junto com o fundo.')
    print('\n  entrada para RECORTES, no app-exercicios/quadra.js:')
    print("    <nome>: { arq:'%s', altura:1.78, pe:1.0, prop:%.2f }," %
          (os.path.basename(saida), im.width / im.height))
    print('    (altura = a altura real da pessoa, em metros;')
    print('     pe = 1.0 quando o pe encosta na base da imagem — menos que isso')
    print('     quando ela esta no ar, para nao grudar o salto no chao)')
    return im


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 1
    tol, alt, sombra = 38, 720, 0
    if '--tol' in argv:
        tol = int(argv[argv.index('--tol') + 1])
    if '--alt' in argv:
        alt = int(argv[argv.index('--alt') + 1])
    if '--tirar-sombra' in argv:
        sombra = int(argv[argv.index('--tirar-sombra') + 1])
    return 0 if recortar(argv[1], argv[2], tol, alt, sombra) else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv))

#!/usr/bin/env python3
"""Prepara uma foto recortada para virar figura do desenho da quadra.

   O redimensionamento cru estava jogando qualidade fora de tres maneiras:

   1. FRANJA. Recorte feito no celular deixa uma orla de pixels claros da
      parede em volta da pessoa. Sobre o saibro escuro ela vira um contorno
      branco — o que denuncia "colagem" antes de qualquer outra coisa.
   2. ESCALA. Ampliar sem nitidez devolve um borrao. Lanczos com mascara de
      nitidez recupera boa parte da aparencia de detalhe, porque o que falta
      nao e' informacao nova: e' contraste de borda.
   3. COMPRESSAO. WebP na qualidade 88 come justamente a borda da raquete, que
      e' fina e de alto contraste — o detalhe que mais conta no desenho.

   Uso:
       python3 ferramentas/preparar-recorte.py entrada.png saida.webp \
           [--alt 560] [--nitidez 1.0] [--franja 1.2] [--qualidade 92]
"""
import argparse
import numpy as np
from PIL import Image, ImageFilter


def sem_franja(im, forca):
    """Come a orla clara que sobra do recorte, e devolve o alfa suavizado.
    A cor dos pixels de borda tambem e' puxada para dentro, senao a franja
    continua la', so' que com menos opacidade."""
    a = np.array(im).astype(float)
    al = a[:, :, 3] / 255.0
    # encolhe o alfa: tudo que estava meio transparente perde forca
    novo = np.clip((al - 0.10 * forca) / (1 - 0.10 * forca), 0, 1)
    # a cor da borda vem de dentro: media dos vizinhos com alfa cheio
    dentro = Image.fromarray((a[:, :, :3]).astype(np.uint8), 'RGB').filter(
        ImageFilter.GaussianBlur(radius=1.4 * forca))
    d = np.array(dentro).astype(float)
    borda = (al > 0.02) & (al < 0.92)
    for c in range(3):
        canal = a[:, :, c]
        canal[borda] = d[:, :, c][borda]
    a[:, :, 3] = novo * 255
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')


def preparar(entrada, saida, alt=560, nitidez=1.0, franja=1.2, qualidade=92):
    im = Image.open(entrada).convert('RGBA')
    # 1. corta o vazio em volta: sobra de moldura vira escala errada depois
    caixa = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    if caixa:
        im = im.crop(caixa)
    antes = im.size
    # 2. tira a franja do recorte
    if franja > 0:
        im = sem_franja(im, franja)
    # 3. escala com Lanczos
    larg = max(1, int(round(im.width * alt / im.height)))
    im = im.resize((larg, alt), Image.LANCZOS)
    # 4. nitidez: so' no RGB, com o alfa preservado
    if nitidez > 0:
        rgb = im.convert('RGB').filter(
            ImageFilter.UnsharpMask(radius=1.8, percent=int(90 * nitidez), threshold=2))
        im = Image.merge('RGBA', (*rgb.split(), im.getchannel('A')))
    if saida.lower().endswith('.webp'):
        im.save(saida, 'WEBP', quality=qualidade, method=6)
    else:
        im.save(saida)
    print('%s -> %s   %dx%d -> %dx%d  (prop %.3f)' %
          (entrada, saida, antes[0], antes[1], im.width, im.height, im.width / im.height))
    return im


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('entrada'); p.add_argument('saida')
    p.add_argument('--alt', type=int, default=560)
    p.add_argument('--nitidez', type=float, default=1.0)
    p.add_argument('--franja', type=float, default=1.2)
    p.add_argument('--qualidade', type=int, default=92)
    o = p.parse_args()
    preparar(o.entrada, o.saida, o.alt, o.nitidez, o.franja, o.qualidade)

#!/usr/bin/env python3
"""Tira o fundo do topo dos apps da propria imagem modelo do Joao.

O Joao pediu o MESMO fundo do modelo aprovado (os tres celulares sobre a
quadra de saibro), nao uma quadra renderizada. O fundo inteiro atras dos
celulares nao da' para recuperar — os celulares cobrem quase tudo —, mas o
topo de cada celular mostra exatamente o fundo que o modelo quer no app.
Este script recorta o topo do celular do Aluno (o que tem a rede e a bola),
apaga o que e' interface (logo, nome da academia, botao do perfil, textos)
e amplia para o tamanho de tela de iPhone.

Como apaga: a letra e' mais clara que o fundo em volta. Dentro das caixas
onde ha' interface, marca o pixel que e' bem mais claro que a media da
vizinhanca, engrossa a marca e preenche pela vizinhanca (inpaint do OpenCV).
O logo e o botao do perfil (circulos) saem inteiros.

    uso: python3 ferramentas/extrair-fundo-topo.py MODELO.png
    grava app-gestao/assets/jv-topo-quadra.webp e app-aluno/assets/jv-topo-quadra.webp
"""
import os
import sys
import numpy as np
import cv2
from PIL import Image

CAIXA = (565, 188, 971, 345)          # topo do celular do Aluno, no modelo 1536x1024 (sem a borda)
K = 3                                  # ampliacao final
# o que e' interface, em pixels do recorte (413x157)
TEXTO = [(14, 8, 225, 52),             # logo + ACADEMIA / JOAO VICTOR TENIS
         (14, 60, 90, 95),             # Ola!
         (14, 96, 205, 120),           # Seu painel de treino
         (14, 121, 335, 146)]          # Cada aula te aproxima...
CIRCULOS = [(34, 30, 25)]             # logo (cx, cy, r)
# o botao do perfil fica sobre as arvores: la' o inpaint deixava uma mancha
# clara. Ele e' coberto com as folhas logo ao lado, com a borda esfumada.
PERFIL = (372, 30, 31, -62)            # cx, cy, r (com o anel), de onde copiar (dx)


def main(modelo):
    im = Image.open(modelo).convert('RGB').crop(CAIXA)
    a = np.array(im)
    h, w = a.shape[:2]
    lum = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(np.float32)
    viz = cv2.blur(lum, (15, 15))
    mask = np.zeros((h, w), np.uint8)
    for x0, y0, x1, y1 in TEXTO:
        sub = (lum[y0:y1, x0:x1] > viz[y0:y1, x0:x1] + 18) | (lum[y0:y1, x0:x1] > 150)
        mask[y0:y1, x0:x1][sub] = 255
    for cx, cy, r in CIRCULOS:
        cv2.circle(mask, (cx, cy), r, 255, -1)
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=2)
    limpo = cv2.inpaint(a, mask, 6, cv2.INPAINT_TELEA)
    cx, cy, r, dx = PERFIL
    fonte = np.roll(a, -dx, axis=1).astype(np.float32)
    mp = np.zeros((h, w), np.float32)
    cv2.circle(mp, (cx, cy), r, 1.0, -1)
    mp = cv2.GaussianBlur(mp, (0, 0), 3.0)[..., None]          # borda esfumada
    limpo = (limpo.astype(np.float32) * (1 - mp) + fonte * mp).astype(np.uint8)
    # o preenchimento sai liso demais: devolve um grao leve so' ali
    ruido = np.random.default_rng(3).normal(0, 3.0, a.shape)
    m3 = (cv2.GaussianBlur(mask.astype(np.float32) / 255, (0, 0), 1.2))[..., None]
    limpo = np.clip(limpo + ruido * m3, 0, 255).astype(np.uint8)
    out = Image.fromarray(limpo).resize((w * K, h * K), Image.LANCZOS)
    raiz = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    for app in ('app-gestao', 'app-aluno'):
        dest = os.path.join(raiz, app, 'assets', 'jv-topo-quadra.webp')
        out.save(dest, 'WEBP', quality=88, method=6)
        print('%s: %dx%d, %.0f KB' % (dest, out.width, out.height, os.path.getsize(dest) / 1024))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

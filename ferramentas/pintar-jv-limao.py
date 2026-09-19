#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pinta de verde-limao o "JV" dos icones e das splashes da JV Tenis.

   Por que existe: os tres apps (Gestao, Aluno e Exercicios) aparecem lado a
   lado na tela de inicio do celular. O "JV" branco era o mesmo nos dois
   primeiros; em verde-limao ele fica sendo a mesma marca, mas com a cor da
   casa, e o rotulo embaixo (GESTAO / ALUNO) continua separando um do outro.

   Como funciona: dentro da arte, so' o "JV" e' branco — o "TENIS", o risco e
   a borda ja' sao limao, e o fundo e' quase preto. Entao troca-se a cor de
   todo pixel claro e sem cor (cinza/branco), mantendo o brilho de cada um,
   para que a sombra e as bordas suavizadas do desenho continuem iguais.

   Rodar de novo e' seguro: depois da primeira passada sobram uns dez pixels
   da borda suavizada, que mudam de um tom e param — nao ha' acumulo.

   Uso, a partir da raiz do repositorio:
       python3 ferramentas/pintar-jv-limao.py            # arquivos do repo
       python3 ferramentas/pintar-jv-limao.py a.png b.png  # arquivos avulsos
"""
import sys, os, colorsys
from PIL import Image

# O limao claro, e nao o #CBDD4B da borda: assim o "JV" continua mais claro
# que o "TENIS" embaixo dele, como era quando o "JV" ainda era branco.
LIMA = (0xDD, 0xEE, 0x66)

# Ate' onde um pixel ainda conta como "sem cor" (0 = cinza puro, 1 = cor viva).
SAT_CHEIA, SAT_ZERO = 0.16, 0.30
VALOR_MIN = 0.28                 # abaixo disso e sombra do fundo, nao o logo

ARQUIVOS = [
    'app-gestao/jv-icone-gestao.png',
    'app-gestao/jv-icone-gestao-192.png',
    'app-gestao/jv-icone-gestao-512.png',
    'app-gestao/jv-icone-gestao-mask.png',
    'app-aluno/jv-icone-aluno.png',
    'app-aluno/jv-icone-aluno-192.png',
    'app-aluno/jv-icone-aluno-512.png',
    'app-aluno/jv-icone-aluno-mask.png',
]
ARQUIVOS += ['app-gestao/splash-gestao-%s.png' % t for t in
             ('750x1334', '828x1792', '1125x2436', '1170x2532',
              '1179x2556', '1242x2688', '1290x2796')]
ARQUIVOS += ['app-aluno/splash-aluno-%s.png' % t for t in
             ('750x1334', '828x1792', '1125x2436', '1170x2532',
              '1179x2556', '1242x2688', '1290x2796')]


def peso(sat):
    """1 quando o pixel e' cinza, 0 quando ja' tem cor propria."""
    if sat <= SAT_CHEIA:
        return 1.0
    if sat >= SAT_ZERO:
        return 0.0
    return (SAT_ZERO - sat) / (SAT_ZERO - SAT_CHEIA)


def pintar(caminho):
    im = Image.open(caminho)
    modo = im.mode
    px = im.convert('RGB').load()
    larg, alt = im.size
    saida = Image.new('RGB', im.size)
    sp = saida.load()
    trocados = 0
    for y in range(alt):
        for x in range(larg):
            r, g, b = px[x, y]
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            w = peso(s) if v >= VALOR_MIN else 0.0
            if w <= 0:
                sp[x, y] = (r, g, b)
                continue
            # o limao com o mesmo brilho do pixel original
            alvo = tuple(int(round(c * v)) for c in LIMA)
            sp[x, y] = tuple(int(round(o * (1 - w) + a * w))
                             for o, a in zip((r, g, b), alvo))
            trocados += 1
    if modo == 'RGBA':
        saida = saida.convert('RGBA')
        saida.putalpha(im.split()[-1])
    saida.save(caminho)
    return trocados, larg * alt


def main(argv):
    alvos = argv[1:] or ARQUIVOS
    for caminho in alvos:
        if not os.path.exists(caminho):
            print('  faltando: %s' % caminho)
            continue
        n, total = pintar(caminho)
        print('  %-40s %6d px  (%.2f%%)' % (caminho, n, 100 * n / total))


if __name__ == '__main__':
    main(sys.argv)

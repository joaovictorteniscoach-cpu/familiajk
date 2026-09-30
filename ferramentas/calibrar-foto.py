#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ajusta a camera do desenho a uma FOTO de verdade da quadra.

   Por que existe: os 116 exercicios estao escritos em metros de quadra, e o
   desenho projeta esses metros na tela com uma camera. Para o desenho sentar
   em cima de uma foto, basta que a camera do desenho seja a MESMA camera que
   tirou a foto. Este script descobre qual e' — a partir de pontos da quadra
   que da' para apontar na foto a olho.

   Nao e' um truque de esticar imagem: o resultado e' uma camera de verdade
   (onde estava, que altura, para onde olhava, que abertura), e por isso ela
   vale tambem para o que sobe do chao — pessoa, cone, rede. Um "encaixe" que
   so' servisse para o chao deixaria todo mundo flutuando.

   COMO USAR

   1. Abra a foto e anote o pixel de pelo menos seis pontos da quadra que voce
      consiga apontar com seguranca. Os nomes aceitos estao em PONTOS abaixo —
      os cantos sao os mais faceis.
   2. Rode, com os pontos no formato nome=x,y :

        python3 ferramentas/calibrar-foto.py foto.jpg \\
          fundo-perto-esq=312,1402  fundo-perto-dir=2441,1402 \\
          fundo-longe-esq=1012,388  fundo-longe-dir=1741,388 \\
          saque-perto-esq=600,980   saque-perto-dir=2150,980

   3. Ele imprime o bloco pronto para colar em FOTOS, no quadra.js, e grava
      uma imagem de conferencia com a quadra inteira desenhada por cima da
      foto. O que prova o ajuste sao as linhas que NAO foram usadas na conta:
      se a linha de saque cair sozinha em cima da linha de saque da foto, a
      camera esta' certa.

   O erro medio sai em pixels. Ate' uns 6 px numa foto de 2700 de largura o
   encaixe e' bom. Muito acima disso, quase sempre e' um ponto apontado errado
   ou lente grande-angular demais (a conta supoe lente sem distorcao) — vale
   refazer a foto com menos zoom-out.
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw

QD = dict(duplaX=5.485, simplesX=4.115, fundoY=11.885, saqueY=6.40)

# Pontos da quadra que da' para apontar numa foto, em metros.
# y positivo e' o lado de perto da camera; 0 e' a rede.
PONTOS = {
    'fundo-perto-esq':  (-QD['duplaX'],  QD['fundoY']),
    'fundo-perto-dir':  ( QD['duplaX'],  QD['fundoY']),
    'fundo-longe-esq':  (-QD['duplaX'], -QD['fundoY']),
    'fundo-longe-dir':  ( QD['duplaX'], -QD['fundoY']),
    'simples-perto-esq':(-QD['simplesX'], QD['fundoY']),
    'simples-perto-dir':( QD['simplesX'], QD['fundoY']),
    'saque-perto-esq':  (-QD['simplesX'], QD['saqueY']),
    'saque-perto-dir':  ( QD['simplesX'], QD['saqueY']),
    'saque-longe-esq':  (-QD['simplesX'],-QD['saqueY']),
    'saque-longe-dir':  ( QD['simplesX'],-QD['saqueY']),
    'centro-perto':     (0.0,  QD['fundoY']),
    'centro-longe':     (0.0, -QD['fundoY']),
    'rede-esq':         (-QD['duplaX'], 0.0),
    'rede-dir':         ( QD['duplaX'], 0.0),
}

# cam_x, cam_y, cam_alt, alvo, dist, cx, cy
CHUTE = np.array([0.0, 20.0, 7.0, 3.0, 1500.0, 1300.0, 600.0])


def projetar(p, xs, ys, zs):
    """Os mesmos numeros que o quadra.js usa, em numpy."""
    cam_x, cam_y, cam_alt, alvo, dist, cx, cy = p
    a = cam_y - ys
    b = cam_alt - zs
    d = math.hypot(cam_y - alvo, cam_alt) or 1e-9
    cos, sen = (cam_y - alvo) / d, cam_alt / d
    prof = np.maximum(a * cos + b * sen, 0.4)
    cima = a * sen - b * cos
    return cx + dist * (xs - cam_x) / prof, cy - dist * cima / prof


def erro(p, mundo, pixel):
    u, v = projetar(p, mundo[:, 0], mundo[:, 1], np.zeros(len(mundo)))
    return np.concatenate([u - pixel[:, 0], v - pixel[:, 1]])


def ajustar(mundo, pixel, chute=CHUTE, voltas=260):
    """Levenberg-Marquardt com derivada numerica. Sao sete numeros e uns
       poucos pontos: nao precisa de biblioteca de otimizacao para isso."""
    p = chute.copy()
    lam = 1e-3
    r = erro(p, mundo, pixel)
    custo = float(r @ r)
    for _ in range(voltas):
        J = np.zeros((len(r), len(p)))
        for i in range(len(p)):
            passo = max(abs(p[i]) * 1e-6, 1e-7)
            q = p.copy(); q[i] += passo
            J[:, i] = (erro(q, mundo, pixel) - r) / passo
        A = J.T @ J
        g = J.T @ r
        for _ in range(40):
            try:
                delta = np.linalg.solve(A + lam * np.diag(np.diag(A) + 1e-12), -g)
            except np.linalg.LinAlgError:
                lam *= 10; continue
            q = p + delta
            if q[1] <= q[3] + 1 or q[2] <= 0.5 or q[4] <= 1:
                lam *= 10; continue        # camera dentro da quadra ou de cabeca para baixo
            rq = erro(q, mundo, pixel)
            cq = float(rq @ rq)
            if cq < custo:
                p, r, custo, lam = q, rq, cq, max(lam * 0.3, 1e-9)
                break
            lam *= 10
        else:
            break
    return p, custo


def conferir(caminho, p, saida):
    """Desenha a quadra inteira por cima da foto. A prova sao as linhas que
       nao entraram na conta."""
    im = Image.open(caminho).convert('RGB')
    d = ImageDraw.Draw(im)
    dx, sx, fy, sy = QD['duplaX'], QD['simplesX'], QD['fundoY'], QD['saqueY']

    def reta(x1, y1, x2, y2, cor, larg=4):
        n = 24
        pts = []
        for i in range(n + 1):
            t = i / n
            u, v = projetar(p, np.array([x1 + (x2 - x1) * t]),
                            np.array([y1 + (y2 - y1) * t]), np.zeros(1))
            pts.append((float(u[0]), float(v[0])))
        d.line(pts, fill=cor, width=larg)

    usadas = (0, 220, 255)      # ciano: linhas que entraram na conta
    prova = (255, 40, 120)      # rosa: as que nao entraram — sao elas que provam
    for x in (-dx, dx):
        reta(x, -fy, x, fy, usadas)
    reta(-dx, fy, dx, fy, usadas)
    reta(-dx, -fy, dx, -fy, usadas)
    for x in (-sx, sx):
        reta(x, -fy, x, fy, prova)
    reta(-sx, sy, sx, sy, prova)
    reta(-sx, -sy, sx, -sy, prova)
    reta(0, -sy, 0, sy, prova)
    # a rede, que so' fecha se a altura tambem estiver certa
    for lado in (-1, 1):
        u0, v0 = projetar(p, np.array([lado * 6.4]), np.zeros(1), np.zeros(1))
        u1, v1 = projetar(p, np.array([lado * 6.4]), np.zeros(1), np.array([1.07]))
        d.line([(float(u0[0]), float(v0[0])), (float(u1[0]), float(v1[0]))], fill=(255, 220, 0), width=5)
    im.save(saida)


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 1
    foto = argv[1]
    nomes, mundo, pixel = [], [], []
    for arg in argv[2:]:
        nome, _, val = arg.partition('=')
        if nome not in PONTOS:
            print('ponto desconhecido: %s\nconhecidos: %s' % (nome, ', '.join(sorted(PONTOS))))
            return 1
        x, y = val.split(',')
        nomes.append(nome)
        mundo.append(PONTOS[nome])
        pixel.append((float(x), float(y)))
    if len(nomes) < 6:
        print('precisa de pelo menos 6 pontos; vieram %d' % len(nomes))
        return 1

    mundo, pixel = np.array(mundo), np.array(pixel)
    im = Image.open(foto)
    chute = CHUTE.copy()
    chute[4] = im.width * 0.55          # abertura tipica de celular
    chute[5], chute[6] = im.width / 2, im.height * 0.42
    p, custo = ajustar(mundo, pixel, chute)

    r = erro(p, mundo, pixel).reshape(2, -1)
    dist_px = np.hypot(r[0], r[1])
    print('erro por ponto, em pixels:')
    for nome, e in zip(nomes, dist_px):
        print('  %-20s %6.1f' % (nome, e))
    print('  %-20s %6.1f  (maior %.1f)' % ('MEDIO', dist_px.mean(), dist_px.max()))
    if dist_px.mean() > im.width * 0.004:
        print('\n  ATENCAO: erro alto. Quase sempre e um ponto apontado errado,')
        print('  ou lente grande-angular demais (a conta supoe lente sem distorcao).')

    saida = foto.rsplit('.', 1)[0] + '-conferir.jpg'
    conferir(foto, p, saida)
    print('\nconferencia: %s' % saida)
    print('  ciano  = linhas que entraram na conta')
    print('  rosa   = linhas que NAO entraram: sao elas que provam o encaixe')
    print('  amarelo= os postes, que so fecham se a altura tambem estiver certa')

    print('\ncole no FOTOS do app-exercicios/quadra.js:\n')
    print("  <recorte>: { arq:'%s', larg:%d, alt:%d," % (foto.split('/')[-1], im.width, im.height))
    print('              cam:{ x:%.3f, y:%.3f, alt:%.3f, alvo:%.3f,' % (p[0], p[1], p[2], p[3]))
    print('                    dist:%.1f, cx:%.1f, cy:%.1f } },' % (p[4], p[5], p[6]))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))

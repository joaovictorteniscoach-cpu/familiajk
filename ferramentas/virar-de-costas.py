#!/usr/bin/env python3
"""Vira um recorte de jogador DE FRENTE em um recorte DE COSTAS.

Por que isto existe
-------------------
A camera do desenho fica atras da linha de base. Quem esta do lado de ca
aparece DE COSTAS; quem esta alem da rede aparece DE FRENTE. As fotos que
temos sao todas de frente — usadas do lado de ca, o jogador fica olhando para
quem ve, ou seja, de costas para a rede, e parece bater na direcao contraria a
da bola. Espelhar nao resolve: o erro e de 180 graus, nao de lado.

No tamanho em que a figura aparece no desenho (60 a 140 px de altura) o unico
detalhe que grita "de frente" e o ROSTO. Camisa, bracos, pernas, tenis e
raquete leem igual dos dois lados. Entao a virada e feita so na cabeca: a
faixa de CABELO que esta acima da testeira e espelhada para baixo dela,
cobrindo o rosto. Sai uma nuca com a textura do proprio cabelo daquela foto —
nao um borrao marrom — e o resto da imagem fica intacto.

Uso:
    python3 ferramentas/virar-de-costas.py entrada.webp saida.webp \
        --testeira 30,48 --queixo 85 --colunas 72,138 --conferir prova.png

Sem os numeros ele tenta achar sozinho (serve para foto de frente, corpo
inteiro, cabeca no topo). Com raquete levantada acima da cabeca — o caso do
saque — passe os numeros na mao: medir uma vez e mais barato que adivinhar.
"""
import argparse
import numpy as np
from PIL import Image


def achar_cabeca(rgb, al):
    """(testeira_inicio, testeira_fim, queixo, coluna0, coluna1)."""
    ys = np.nonzero((al > 20).any(axis=1))[0]
    topo = ys.min()
    v = rgb.max(axis=2); s = v - rgb.min(axis=2)
    branco = (v > 195) & (s < 38) & (al > 60)
    conta = branco[topo:topo + 90].sum(axis=1)
    if conta.max() < 8:
        raise SystemExit('nao achei a testeira: passe --testeira')
    forte = np.nonzero(conta >= conta.max() * 0.25)[0]
    t1, t2 = topo + forte[0], topo + forte[-1]
    # o queixo e onde a largura salta: ali comecam os ombros
    larg = (al[topo:topo + 140] > 20).sum(axis=1)
    queixo = t2 + 4
    for i in range(t2 - topo + 4, len(larg) - 1):
        if larg[i + 1] > larg[i] * 1.12:
            queixo = topo + i
            break
    cols = np.nonzero((al[t1:t2] > 20).any(axis=0))[0]
    return t1, t2, queixo, cols.min(), cols.max()


def virar(entrada, saida, testeira=None, queixo=None, colunas=None, conferir=None):
    im = Image.open(entrada).convert('RGBA')
    a = np.array(im).astype(np.int16)
    rgb, al = a[:, :, :3], a[:, :, 3]

    auto = achar_cabeca(rgb, al)
    t1, t2 = testeira if testeira else (auto[0], auto[1])
    qx = queixo if queixo else auto[2]
    c0, c1 = colunas if colunas else (auto[3], auto[4])
    topo = np.nonzero((al > 20).any(axis=1))[0].min()
    if t1 <= topo or qx <= t2:
        raise SystemExit(f'{entrada}: cabeca fora de ordem (topo {topo}, testeira {t1}..{t2}, queixo {qx})')

    alto = qx - t2
    larg = c1 - c0 + 1
    cabelo = a[topo:t1, c0:c1 + 1]                 # a faixa de cabelo, com textura
    if (cabelo[:, :, 3] > 40).sum() < 50:
        raise SystemExit(f'{entrada}: cabelo de menos para espelhar')

    esp = Image.fromarray(cabelo.astype(np.uint8), 'RGBA').transpose(Image.FLIP_TOP_BOTTOM)
    esp = np.array(esp.resize((larg, alto), Image.LANCZOS)).astype(np.int16)
    # a nuca escurece de cima para baixo: e onde a luz do alto nao chega
    esp[:, :, :3] = np.clip(esp[:, :, :3] * np.linspace(1.0, 0.70, alto).reshape(-1, 1, 1), 0, 255)

    # A nuca e OVAL, nao retangular: larga na testeira e estreitando ate o
    # pescoco. Sem isto sobra uma caixa escura de canto reto sobre o ombro —
    # foi o primeiro resultado desta ferramenta, e denuncia a montagem na hora.
    lin = np.arange(alto).reshape(-1, 1) / max(1, alto - 1)
    meio = (larg - 1) / 2.0
    col = np.abs(np.arange(larg).reshape(1, -1) - meio) / max(1.0, meio)
    raio = np.sqrt(np.clip(1.0 - (lin * 0.92) ** 2, 0, 1))      # afina para baixo
    mascara = np.clip((raio - col) / 0.16, 0, 1)                # borda esfumada
    mascara = mascara * np.clip((1.0 - lin) / 0.14, 0, 1)       # some no pescoco
    mascara = mascara[:, :, None]

    rosto = a[t2:qx, c0:c1 + 1].astype(float)
    m = mascara * (rosto[:, :, 3:4] > 20) * (esp[:, :, 3:4] > 40)
    rosto[:, :, :3] = rosto[:, :, :3] * (1 - m) + esp[:, :, :3] * m
    a[t2:qx, c0:c1 + 1] = np.clip(rosto, 0, 255).astype(np.int16)

    fora = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    if saida.lower().endswith('.webp'):
        fora.save(saida, 'WEBP', quality=88, method=6)
    else:
        fora.save(saida)
    print(f'{entrada} -> {saida}   testeira {t1}..{t2} · queixo {qx} · colunas {c0}..{c1}')

    if conferir:
        p = Image.new('RGBA', (im.width * 2 + 30, im.height), (20, 45, 70, 255))
        p.alpha_composite(im, (0, 0)); p.alpha_composite(fora, (im.width + 30, 0))
        p.convert('RGB').save(conferir)
        print('comparativo:', conferir)


def par(t):
    a, b = t.split(','); return int(a), int(b)


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('entrada'); p.add_argument('saida')
    p.add_argument('--testeira', type=par, help='primeira,ultima linha da testeira')
    p.add_argument('--queixo', type=int, help='linha do queixo')
    p.add_argument('--colunas', type=par, help='primeira,ultima coluna da cabeca')
    p.add_argument('--conferir')
    o = p.parse_args()
    virar(o.entrada, o.saida, o.testeira, o.queixo, o.colunas, o.conferir)

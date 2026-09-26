#!/usr/bin/env python3
"""Renderiza a quadra de saibro em 3D que vai no fundo do topo dos apps.

O topo da Gestao e do App Aluno usava um SVG de 2 KB com degrades e meia
duzia de linhas — na tela aparecia como rabisco, nao como quadra. O modelo
aprovado pelo Joao mostra uma quadra de verdade: camera baixa atras da linha
de base, a rede atravessando na diagonal, arvores desfocadas ao fundo, luz de
fim de tarde e a bola no canto. Isto aqui calcula essa cena pixel a pixel
(nada de foto de terceiros), com:

  - saibro com textura em varias escalas (grao, manchas, marcas de vassoura)
    e a luz quente vindo da direita;
  - as linhas da quadra nas medidas oficiais, em perspectiva, com po' de
    saibro por cima, e suavizadas pelo tamanho do pixel no chao;
  - a rede com a malha, a fita branca, a cinta do meio, os postes e a
    sombra dela no chao;
  - tela de fundo e arvores com profundidade de campo (quanto mais longe,
    mais desfocado), como numa foto de lente clara;
  - a bola em primeiro plano, com feltro, costura e sombra de contato.

    uso: python3 ferramentas/renderizar-quadra-hero.py [saida.webp]
    grava tambem as copias usadas por app-gestao/ e app-aluno/.
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

W, H = 1600, 1000
RNG = np.random.default_rng(7)

# ----------------------------------------------------------------- camera
CAM = np.array([-1.6, 6.0, 1.25])    # no saibro de ca, perto da linha de saque, a esquerda
YAW = math.radians(-16)              # gira para a direita: a rede atravessa na diagonal
PITCH = math.radians(-6.0)           # olha levemente para baixo
FOCO = 1050.0                        # distancia focal em pixels
CX, CY = W * 0.50, H * 0.33

QD = dict(dx=5.485, sx=4.115, fy=11.885, sy=6.40)


def base_camera():
    cy, sy = math.cos(YAW), math.sin(YAW)
    cp, sp = math.cos(PITCH), math.sin(PITCH)
    frente = np.array([sy * cp, -cy * cp, sp])        # olhando para -y (a rede)
    direita = np.array([cy, sy, 0.0])
    cima = np.cross(frente, direita)
    return frente, direita, cima


FRENTE, DIREITA, CIMA = base_camera()


def raios():
    xs = (np.arange(W) + 0.5 - CX) / FOCO
    ys = (CY - (np.arange(H) + 0.5)) / FOCO
    gx, gy = np.meshgrid(xs, ys)
    d = FRENTE[None, None, :] + gx[..., None] * DIREITA + gy[..., None] * CIMA
    return d / np.linalg.norm(d, axis=2, keepdims=True)


def projetar(p):
    v = np.asarray(p, float) - CAM
    z = v @ FRENTE
    return CX + FOCO * (v @ DIREITA) / z, CY - FOCO * (v @ CIMA) / z, z


# ---------------------------------------------------------------- ruido
def ruido(escala, forma=(H, W), semente=0, oitavas=4):
    """Ruido de valor em varias oitavas, ampliado com interpolacao bicubica."""
    rng = np.random.default_rng(semente)
    tot = np.zeros(forma, np.float32)
    amp, soma = 1.0, 0.0
    for o in range(oitavas):
        n = max(2, int(escala * (2 ** o)))
        base = rng.random((n, int(n * forma[1] / forma[0]) + 2)).astype(np.float32)
        im = Image.fromarray((base * 255).astype(np.uint8)).resize((forma[1], forma[0]), Image.BICUBIC)
        tot += amp * (np.asarray(im, np.float32) / 255.0)
        soma += amp
        amp *= 0.5
    return tot / soma


def ruido_chao(X, Y, freq, semente):
    """Ruido amarrado ao CHAO (coordenadas em metros), para a textura do
    saibro encolher com a distancia em vez de ficar grudada na tela."""
    rng = np.random.default_rng(semente)
    n = 512
    tab = rng.random((n, n)).astype(np.float32)
    u = (X * freq) % n
    v = (Y * freq) % n
    i0, j0 = np.floor(u).astype(int), np.floor(v).astype(int)
    fu, fv = u - i0, v - j0
    fu = fu * fu * (3 - 2 * fu); fv = fv * fv * (3 - 2 * fv)
    i1, j1 = (i0 + 1) % n, (j0 + 1) % n
    a = tab[j0, i0] * (1 - fu) + tab[j0, i1] * fu
    b = tab[j1, i0] * (1 - fu) + tab[j1, i1] * fu
    return a * (1 - fv) + b * fv


# ---------------------------------------------------------------- cena
def main(saida):
    d = raios()
    dz = d[..., 2]
    # chao (z=0)
    t_chao = np.where(dz < -1e-4, -CAM[2] / np.minimum(dz, -1e-4), np.inf)
    tc = np.where(np.isfinite(t_chao), np.minimum(t_chao, 400.0), 400.0)   # ceu: um chao falso, bem longe
    X = CAM[0] + tc * d[..., 0]
    Y = CAM[1] + tc * d[..., 1]
    dist = np.where(np.isfinite(t_chao), t_chao, 1e3)
    # tamanho do pixel no chao (para suavizar as linhas sem serrilhado)
    pix = np.clip(dist / FOCO / np.maximum(np.abs(dz), 0.02), 0.002, 2.0)

    img = np.zeros((H, W, 3), np.float32)

    # ---- saibro
    clay_a = np.array([176, 84, 40], np.float32) / 255
    clay_b = np.array([196, 104, 54], np.float32) / 255
    clay_c = np.array([140, 62, 30], np.float32) / 255
    n1 = ruido_chao(X, Y, 0.35, 1)
    n2 = ruido_chao(X, Y, 2.2, 2)
    n3 = ruido_chao(X, Y, 18.0, 3)
    vassoura = ruido_chao(X * 0.25, Y * 14.0, 2.0, 4)          # marcas do arrasto, no sentido x
    mistura = np.clip(0.45 * n1 + 0.20 * n2 + 0.35 * vassoura, 0, 1)[..., None]
    chao = clay_a * (1 - mistura) + clay_b * mistura
    n4 = ruido_chao(X, Y, 55.0, 9)
    chao = chao * (0.90 + 0.12 * n3[..., None] + 0.12 * n4[..., None])
    manchas = np.clip((ruido_chao(X, Y, 0.9, 5) - 0.62) * 3, 0, 1)[..., None]
    chao = chao * (1 - 0.12 * manchas) + clay_c * 0.12 * manchas

    # ---- linhas (medidas oficiais), com po' de saibro por cima
    lw = 0.05

    def faixa(val, centro):
        dd = np.abs(val - centro) - lw / 2
        return np.clip(0.5 - dd / pix, 0, 1)

    dentro_y = (np.abs(Y) <= QD['fy'] + lw / 2)
    dentro_x = (np.abs(X) <= QD['dx'] + lw / 2)
    L = np.zeros((H, W), np.float32)
    for yy in (QD['fy'], -QD['fy']):
        L = np.maximum(L, faixa(Y, yy) * dentro_x)
    for yy in (QD['sy'], -QD['sy']):
        L = np.maximum(L, faixa(Y, yy) * (np.abs(X) <= QD['sx']))
    for xx in (QD['dx'], -QD['dx'], QD['sx'], -QD['sx']):
        L = np.maximum(L, faixa(X, xx) * dentro_y)
    L = np.maximum(L, faixa(X, 0.0) * (np.abs(Y) <= QD['sy']))
    for yy in (QD['fy'], -QD['fy']):
        L = np.maximum(L, faixa(X, 0.0) * (np.abs(np.abs(Y) - QD['fy']) < 0.10))
    po = np.clip(0.75 + 0.35 * ruido_chao(X, Y, 6.0, 8), 0, 1)
    linha = np.array([236, 226, 210], np.float32) / 255
    chao = chao * (1 - (L * po)[..., None]) + linha * (L * po)[..., None]

    # ---- luz: sol quente da direita, e a sombra da rede no chao
    luz = 0.78 + 0.34 * np.clip((X + 8) / 20, 0, 1) + 0.10 * np.clip((Y + 5) / 25, 0, 1)
    sombra_rede = np.exp(-((Y + 0.9 + 0.08 * X) ** 2) / 0.35) * (np.abs(X) < 6.4)
    luz = luz * (1 - 0.30 * sombra_rede)
    chao = chao * luz[..., None]
    chao = chao * np.array([1.04, 0.98, 0.92])            # dourado do fim de tarde
    # reflexo difuso do sol no saibro (mais forte na direita e perto da rede)
    halo = np.exp(-(((X - 3.5) / 6.0) ** 2 + ((Y - 1.5) / 5.0) ** 2))
    chao = chao + halo[..., None] * np.array([0.10, 0.06, 0.02])

    eh_chao = np.isfinite(t_chao) & (Y > -19.5)
    img[eh_chao] = chao[eh_chao]

    # ---- fundo: tela verde e arvores (depois desfocados)
    fundo = np.zeros((H, W, 3), np.float32)
    ceu = np.linspace(1, 0, H)[:, None, None] * np.array([0.30, 0.34, 0.24]) + np.array([0.05, 0.09, 0.06])
    fundo[:] = ceu
    folhas = ruido(6, semente=11, oitavas=5)
    folhas2 = ruido(22, semente=12, oitavas=3)
    verde_esc = np.array([0.05, 0.13, 0.07]); verde_cl = np.array([0.30, 0.42, 0.16])
    k = np.clip((folhas * 0.7 + folhas2 * 0.3 - 0.35) * 1.8, 0, 1)[..., None]
    arv = verde_esc * (1 - k) + verde_cl * k
    # luz do sol entre as folhas (canto de cima a direita)
    xs = np.linspace(0, 1, W)[None, :]; ys = np.linspace(0, 1, H)[:, None]
    sol = np.exp(-(((xs - 0.78) / 0.26) ** 2 + ((ys - 0.08) / 0.22) ** 2))
    brilho = np.clip((folhas2 - 0.62) * 4, 0, 1) * sol
    arv = arv + (0.75 * brilho + 0.30 * sol)[..., None] * np.array([1.0, 0.85, 0.5])
    fundo = arv
    # tela (windscreen) verde-escura na altura de 0 a 3 m, la' no fundo
    t_tela = (-19.5 - CAM[1]) / np.where(np.abs(d[..., 1]) > 1e-4, d[..., 1], -1e-4)
    zt = CAM[2] + t_tela * dz
    eh_tela = (t_tela > 0) & (zt >= 0) & (zt <= 3.2) & ~eh_chao
    malha_tela = 0.92 + 0.08 * ruido(60, semente=13, oitavas=1)
    tela = np.array([0.06, 0.17, 0.11])[None, None, :] * malha_tela[..., None]
    fundo[eh_tela] = tela[eh_tela]
    img[~eh_chao] = fundo[~eh_chao]

    # profundidade de campo: o fundo e o saibro distante desfocam
    prof = np.where(eh_chao, dist, 60.0)
    pil = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    camadas = [np.asarray(pil, np.float32) / 255]
    for r in (2.0, 5.0, 11.0):
        camadas.append(np.asarray(pil.filter(ImageFilter.GaussianBlur(r)), np.float32) / 255)
    foco_m = 6.5
    borrao = np.clip(np.abs(prof - foco_m) / 9.0, 0, 3.0)
    b0 = np.floor(borrao).astype(int); f = (borrao - b0)[..., None]
    b1 = np.minimum(b0 + 1, 3)
    pilha = np.stack(camadas)
    ii, jj = np.indices((H, W))
    img = pilha[b0, ii, jj] * (1 - f) + pilha[b1, ii, jj] * f

    # ---- rede (plano y=0), por cima do chao e do fundo
    t_rede = (0.0 - CAM[1]) / np.where(np.abs(d[..., 1]) > 1e-4, d[..., 1], -1e-4)
    Xr = CAM[0] + t_rede * d[..., 0]
    Zr = CAM[2] + t_rede * dz
    meia = 6.40
    altura = 0.914 + (1.07 - 0.914) * (Xr / meia) ** 2
    na_rede = (t_rede > 0) & (np.abs(Xr) <= meia) & (Zr >= 0) & (Zr <= altura)
    px_r = np.clip(t_rede / FOCO, 1e-4, 1)
    passo = 0.045
    fx = np.abs(((Xr / passo) % 1) - 0.5) * passo
    fz = np.abs(((Zr / passo) % 1) - 0.5) * passo
    fio = 0.0035
    cobre = np.maximum(np.clip(0.5 - (passo / 2 - fx - fio) / px_r, 0, 1),
                       np.clip(0.5 - (passo / 2 - fz - fio) / px_r, 0, 1))
    # onde a malha e' menor que o pixel, vira um veu escuro uniforme
    veu = np.clip(2 * fio / passo * 2.2, 0, 1)
    fino = np.clip(px_r / passo, 0, 1)
    alfa = (cobre * (1 - fino) + veu * fino) * 0.92
    fita = na_rede & (Zr >= altura - 0.065)
    cinta = na_rede & (np.abs(Xr) < 0.025)
    cor_rede = np.array([0.05, 0.06, 0.05])
    a3 = (alfa * na_rede)[..., None]
    img = img * (1 - a3) + cor_rede * a3
    branco = np.array([0.93, 0.92, 0.88]) * (0.85 + 0.15 * np.clip((Xr + 6) / 12, 0, 1))[..., None]
    img[fita] = branco[fita]
    img[cinta] = branco[cinta] * 0.95
    # postes
    for xp in (-6.40 - 0.05, 6.40 + 0.05):
        u0, v0, z0 = projetar([xp, 0, 0]); u1, v1, z1 = projetar([xp, 0, 1.07])
        if z0 <= 0:
            continue
        larg = max(2, 0.09 * FOCO / z0)
        x0, x1 = int(u0 - larg / 2), int(u0 + larg / 2) + 1
        y0, y1 = int(v1), int(v0)
        if x1 > 0 and x0 < W:
            x0, x1 = max(0, x0), min(W, x1)
            grad = np.linspace(0.55, 1.1, x1 - x0)[None, :, None]
            img[max(0, y0):min(H, y1), x0:x1] = np.array([0.05, 0.16, 0.10]) * grad

    # ---- bola em primeiro plano, a direita
    # a bola: 2,4 m a frente da camera e um pouco a direita, no chao
    pb = CAM + FRENTE * 4.4 + DIREITA * 1.75
    pb[2] = 0.034
    bx, by, bz = projetar(pb)
    # 3,4x o tamanho de verdade: e' a bola que diz "tenis" num topo pequeno
    r = 0.034 * FOCO / bz * 3.4
    yy, xx = np.mgrid[0:H, 0:W]
    dxb, dyb = (xx - bx) / r, (yy - by) / r
    rr = dxb ** 2 + dyb ** 2
    # sombra de contato
    somb = np.exp(-(((xx - bx - r * 0.5) / (r * 1.5)) ** 2 + ((yy - by - r * 0.95) / (r * 0.35)) ** 2))
    img = img * (1 - 0.55 * somb[..., None])
    dentro = rr <= 1
    nz = np.sqrt(np.clip(1 - rr, 0, 1))
    lum = np.clip(0.25 + 0.85 * (-0.45 * dxb - 0.55 * dyb + 0.70 * nz), 0.15, 1.15)
    feltro = 0.88 + 0.12 * ruido(160, semente=21, oitavas=2)
    cor_b = np.array([0.80, 0.90, 0.20])[None, None, :] * (lum * feltro)[..., None]
    cost = np.abs(np.sin(dxb * 2.3 + 0.8) * 0.55 - dyb * 0.9 + 0.1) < 0.07
    cor_b[cost] = np.array([0.95, 0.96, 0.88]) * lum[cost][..., None]
    borda = np.clip((1 - np.sqrt(rr)) * r / 1.2, 0, 1)
    ab = (dentro * borda)[..., None]
    img = img * (1 - ab) + cor_b * ab

    # ---- acabamento: vinheta, calor e grao
    vx = (xx / W - 0.5); vy = (yy / H - 0.45)
    vin = 1 - 0.45 * np.clip((vx ** 2 + vy ** 2) * 1.6, 0, 1)
    img = img * vin[..., None]
    img = img + RNG.normal(0, 0.012, img.shape).astype(np.float32)
    img = np.clip(img, 0, 1) ** 0.95

    out = Image.fromarray((img * 255).astype(np.uint8))
    out.save(saida, 'WEBP', quality=84, method=6)
    print('%s: %dx%d, %.0f KB' % (saida, W, H, os.path.getsize(saida) / 1024))


if __name__ == '__main__':
    raiz = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    alvo = sys.argv[1] if len(sys.argv) > 1 else os.path.join(raiz, 'app-gestao', 'assets', 'jv-quadra-3d.webp')
    main(alvo)

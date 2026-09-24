#!/usr/bin/env python3
"""Faz a versao DE FRENTE da foto de espera da JV, que foi tirada de costas.

Quem esta' alem da rede aparece de frente para a camera. So' existem fotos da
JV de frente no saque; para o resto, o desenho usava uma figura 3D da internet
fazendo backhand de duas maos, que (1) nao e' da JV e (2) mostrava um backhand
em todo jogador do outro lado, qualquer que fosse o golpe. A referencia que o
Joao mandou mostra o jogador do outro lado na posicao de espera, de frente,
com a raquete a' frente do corpo. E' isso que esta ferramenta monta, a partir
da propria foto de espera dele:

  - a nuca vira rosto: o cabelo fica no alto e nas laterais, o resto vira
    pele (no tom tirado das fotos de frente do saque), com sombreado e marcas
    discretas de sobrancelha, olhos, nariz e boca;
  - a gola de tras vira gola redonda da frente;
  - os antebracos vem para a frente e seguram a raquete a' frente da barriga,
    com a cabeca da raquete para cima, como na posicao de espera de verdade.

No tamanho em que o jogador do outro lado aparece (1 a 3 cm na folha), o que
diz "de frente" e' o rosto claro sob o cabelo e a raquete na frente do corpo.
Detalhe fino alem disso nao aparece e so' arriscaria parecer artificial.

    uso: python3 ferramentas/virar-de-frente.py espera.png espera-frente.png

As medidas sao proporcionais ao contorno da pessoa, entao valem para a mesma
foto em outra resolucao.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PELE = np.array([104, 74, 60], float)       # tom medio do rosto nas fotos de frente
PELE_SOMBRA = np.array([62, 42, 34], float)
CABELO = (18, 14, 14)


def contorno(a):
    """Linhas do topo da cabeca, do fim do pescoco e a largura dos ombros."""
    alfa = a[..., 3] > 128
    ys = np.where(alfa.any(1))[0]
    topo = ys[0]
    azul = (a[..., 2].astype(int) - a[..., 0].astype(int) > 25) & alfa
    # a camisa comeca na primeira linha com azul de verdade
    camisa = next(y for y in range(topo, a.shape[0]) if azul[y].sum() > 8)
    cab = alfa[topo:camisa]
    xs = np.where(cab.any(0))[0]
    return topo, camisa, xs[0], xs[-1]


def main(ent, sai):
    im = Image.open(ent).convert('RGBA')
    a = np.array(im)
    topo, camisa, cx0, cx1 = contorno(a)
    H = a.shape[0]
    alfa = a[..., 3] > 128
    hc = camisa - topo                       # altura da cabeca + pescoco
    cx = (cx0 + cx1) / 2.0
    rx = (cx1 - cx0) / 2.0

    # ---- rosto -----------------------------------------------------------
    y_cabelo = topo + hc * 0.36              # linha do cabelo na testa
    y_queixo = topo + hc * 0.86
    yy, xx = np.mgrid[0:H, 0:a.shape[1]]
    cabeca = alfa & (yy >= topo) & (yy < camisa)
    # rosto: elipse dentro da cabeca, abaixo da linha do cabelo
    fx = (xx - cx) / (rx * 0.80)
    fy = (yy - (y_cabelo + y_queixo) / 2) / ((y_queixo - y_cabelo) / 2)
    rosto = cabeca & (yy >= y_cabelo) & (fx * fx + fy * fy <= 1.0)
    # pescoco da frente, entre o queixo e a gola
    pesc = cabeca & (yy > y_queixo - hc * 0.08) & (np.abs(xx - cx) < rx * 0.52)
    # sombreado: mais escuro nas bordas e embaixo do queixo
    luz = 1 - 0.40 * np.clip(fx * fx, 0, 1) - 0.14 * np.clip(fy, 0, 1)
    cor_rosto = PELE[None, None, :] * luz[..., None]
    # mistura gradual na borda do rosto e na linha do cabelo: recorte duro
    # vira mascara, e o que se quer e' pele que nasce do cabelo
    borda = np.clip((1 - np.sqrt(fx * fx + fy * fy)) / 0.18, 0, 1)
    testa = np.clip((yy - y_cabelo) / (hc * 0.07), 0, 1)
    peso = (borda * testa)[..., None]
    mist = a[..., :3] * (1 - peso) + cor_rosto * peso
    a[rosto, :3] = np.clip(mist[rosto], 0, 255)
    sombra_pesc = np.clip((yy - y_queixo) / (hc * 0.15), 0, 1)
    cor_pesc = PELE_SOMBRA[None, None, :] * (1.15 - 0.25 * sombra_pesc[..., None])
    so_pesc = pesc & ~rosto
    a[so_pesc, :3] = np.clip(cor_pesc[so_pesc], 0, 255)

    img = Image.fromarray(a)
    # tracos em 4x, depois reduz — sem serrilhado
    k = 4
    big = img.resize((img.width * k, img.height * k), Image.LANCZOS)
    cam = Image.new('RGBA', big.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(cam)
    S = lambda v: v * k
    u = hc / 60.0                            # 1 unidade = 1 px na foto de 560 px

    # sobrancelhas, olhos, nariz, boca — discretos
    ye = y_cabelo + (y_queixo - y_cabelo) * 0.26
    for s in (-1, 1):
        ox = cx + s * rx * 0.34
        d.line([S(ox - 4.5 * u), S(ye - 1.2 * u), S(ox + 4.5 * u), S(ye - 2.0 * u + (s < 0) * 0.8 * u)],
               fill=(40, 28, 24), width=int(S(1.3 * u)))
        d.ellipse([S(ox - 2.6 * u), S(ye + 1.2 * u), S(ox + 2.6 * u), S(ye + 3.2 * u)], fill=(36, 26, 23))
    yn = y_cabelo + (y_queixo - y_cabelo) * 0.62
    d.line([S(cx + 0.6 * u), S(ye + 3 * u), S(cx + 1.4 * u), S(yn)], fill=(84, 60, 50), width=int(S(1.2 * u)))
    d.ellipse([S(cx - 3.2 * u), S(yn - 0.6 * u), S(cx + 3.2 * u), S(yn + 1.6 * u)], fill=(66, 45, 37))
    ym = y_cabelo + (y_queixo - y_cabelo) * 0.80
    d.line([S(cx - 4.5 * u), S(ym), S(cx + 4.5 * u), S(ym)], fill=(58, 38, 32), width=int(S(1.2 * u)))

    # ---- gola redonda da frente ------------------------------------------
    gy = camisa
    gl = rx * 0.62
    d.chord([S(cx - gl), S(gy - 6 * u), S(cx + gl), S(gy + 9 * u)], 0, 180, fill=(54, 64, 88))
    d.chord([S(cx - gl + 3 * u), S(gy - 6 * u), S(cx + gl - 3 * u), S(gy + 6 * u)], 0, 180,
            fill=tuple(int(c) for c in PELE_SOMBRA * 1.1))

    # ---- bracos para a frente e raquete ----------------------------------
    # ombros e cintura tirados do contorno da camisa
    linhas = [y for y in range(gy, H) if (a[y, :, 2].astype(int) - a[y, :, 0].astype(int) > 25).sum() > 8]
    y_cint = linhas[-1] if linhas else gy + 150 * u
    larg = [np.where(alfa[y])[0] for y in (int(gy + 60 * u),)]
    ox0, ox1 = larg[0][0], larg[0][-1]
    cot_y = y_cint - 32 * u                   # cotovelo junto a' cintura
    mao_y = y_cint - 16 * u
    mao_x0, mao_x1 = cx - 7 * u, cx + 7 * u
    # raquete: cabo nas maos, cabeca para cima e para o lado do forehand dele
    # (a esquerda de quem olha, porque ele esta' de frente)
    rc = (cx - 24 * u, mao_y - 80 * u)       # centro da cabeca da raquete
    ang = np.radians(-18)
    def rot(px, py):
        return (rc[0] + px * np.cos(ang) - py * np.sin(ang), rc[1] + px * np.sin(ang) + py * np.cos(ang))
    # cabo e garganta
    base = rot(0, 40 * u)
    d.line([S(cx), S(mao_y + 6 * u), S(base[0]), S(base[1])], fill=(24, 24, 26), width=int(S(4.2 * u)))
    for s in (-1, 1):
        g = rot(s * 14 * u, 30 * u)
        d.line([S(base[0]), S(base[1]), S(g[0]), S(g[1])], fill=(40, 40, 44), width=int(S(2.6 * u)))
    # aro
    pts = [rot(np.cos(t) * 26 * u, np.sin(t) * 33 * u) for t in np.linspace(0, 2 * np.pi, 90)]
    d.polygon([(S(x), S(y)) for x, y in pts], fill=None, outline=(28, 28, 30), width=int(S(3.2 * u)))
    # cordas: grade fina e clara
    corda = (200, 200, 194)
    for i in range(-5, 6):
        t = i / 6.0
        h2 = 33 * u * np.sqrt(max(0, 1 - t * t)) * 0.93
        p0, p1 = rot(t * 26 * u * 0.93, -h2), rot(t * 26 * u * 0.93, h2)
        d.line([S(p0[0]), S(p0[1]), S(p1[0]), S(p1[1])], fill=corda, width=int(S(0.7 * u)))
    for i in range(-6, 7):
        t = i / 7.0
        w2 = 26 * u * np.sqrt(max(0, 1 - t * t)) * 0.93
        p0, p1 = rot(-w2, t * 33 * u * 0.93), rot(w2, t * 33 * u * 0.93)
        d.line([S(p0[0]), S(p0[1]), S(p1[0]), S(p1[1])], fill=corda, width=int(S(0.7 * u)))
    # antebracos: do cotovelo (junto ao corpo) ate' as maos, na frente da camisa
    pele = tuple(int(c) for c in PELE * 0.92)
    esc = tuple(int(c) for c in PELE_SOMBRA)
    claro = tuple(int(c) for c in PELE * 1.12)
    for s, ombro_x, mao_x in ((-1, ox0 + 14 * u, mao_x0), (1, ox1 - 14 * u, mao_x1)):
        def braco(larg0, larg1, cor):
            # trapezio: largo no cotovelo, fino no pulso
            dx, dy = mao_x - ombro_x, mao_y - cot_y
            n = np.hypot(dx, dy); nx, ny = -dy / n, dx / n
            poly = [(ombro_x + nx * larg0, cot_y + ny * larg0), (mao_x + nx * larg1, mao_y + ny * larg1),
                    (mao_x - nx * larg1, mao_y - ny * larg1), (ombro_x - nx * larg0, cot_y - ny * larg0)]
            d.polygon([(S(x), S(y)) for x, y in poly], fill=cor)
            d.ellipse([S(ombro_x - larg0), S(cot_y - larg0), S(ombro_x + larg0), S(cot_y + larg0)], fill=cor)
        braco(8.6 * u, 6.2 * u, esc)
        braco(7.4 * u, 5.0 * u, pele)
        braco(2.6 * u, 1.6 * u, claro)
    # maos fechadas no cabo
    d.ellipse([S(cx - 10 * u), S(mao_y - 6 * u), S(cx + 10 * u), S(mao_y + 7 * u)],
              fill=tuple(int(c) for c in PELE * 1.02))
    d.line([S(cx - 11 * u), S(mao_y + 1 * u), S(cx + 11 * u), S(mao_y + 1 * u)], fill=(66, 46, 38),
           width=int(S(1.1 * u)))

    cam = cam.filter(ImageFilter.GaussianBlur(k * 0.45))
    big.alpha_composite(cam)
    out = big.resize(img.size, Image.LANCZOS)
    # o que foi desenhado fora da pessoa precisa ficar opaco
    o = np.array(out)
    novo = np.array(big.split()[3].resize(img.size, Image.LANCZOS))
    o[..., 3] = np.maximum(o[..., 3], novo)
    Image.fromarray(o).save(sai)
    print(f'{sai}: cabeca {topo}-{camisa}, rosto ate {y_queixo:.0f}, maos em {mao_y:.0f}')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])

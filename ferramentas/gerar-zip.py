#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Empacota o Banco de Exercicios para publicar no Netlify.

   Por que existe: o arquivo unico (gerar-arquivo-unico.py) resolve o caso do
   iPhone, mas NAO funciona offline — o service worker precisa de um arquivo
   proprio ao lado. Em quadra de saibro com sinal ruim, offline e' o que
   importa. Entao este aqui leva a pasta inteira: a tela, os dois scripts, os
   cinco icones, o manifest, o service worker, o robots e o netlify.toml.

   O LEIA-ME.md fica DE FORA de proposito: ele traz as notas internas (inclusive
   a conversa sobre o material ser pago), e tudo que entra no zip vai para o ar.

   Os arquivos vao na RAIZ do zip, sem pasta por cima. Assim serve nos dois
   caminhos: soltando o .zip direto no Netlify, o index.html cai na raiz do
   site; descompactando antes, o iPhone e o Mac criam a pasta sozinhos.

   Uso, a partir da raiz do repositorio:
       python3 ferramentas/gerar-zip.py [destino.zip]
"""
import os
import sys
import zipfile

PASTA = os.path.join(os.path.dirname(__file__), '..', 'app-exercicios')
FORA = {'LEIA-ME.md'}


def gerar(destino):
    base = os.path.abspath(PASTA)
    nomes = sorted(n for n in os.listdir(base)
                   if n not in FORA and os.path.isfile(os.path.join(base, n)))
    with zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as z:
        for n in nomes:
            z.write(os.path.join(base, n), n)
    return nomes


if __name__ == '__main__':
    destino = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), '..', 'banco-exercicios-jv.zip')
    nomes = gerar(destino)
    print('gerado: %s (%.0f KB)' % (os.path.abspath(destino),
                                    os.path.getsize(destino) / 1024))
    for n in nomes:
        print('  ' + n)
    print('LEIA-ME.md fica de fora: e nota interna, e o zip inteiro vai para o ar.')

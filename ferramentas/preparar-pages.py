#!/usr/bin/env python3
"""Monta o artefato do Pages sem publicar o restante do repositório."""
import argparse
from pathlib import Path
import shutil
import subprocess

RAIZ = Path(__file__).resolve().parent.parent
PUBLICOS = {'app-gestao', 'app-aluno', 'site', 'site-pro'}
EXTENSOES = {'.html', '.css', '.js', '.webmanifest', '.png', '.jpg', '.jpeg',
             '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf'}
# Fase 2b separada: revisar/remover este folder após validar a fase 2 no ar.
EXCECOES = {'site/Metodologia-JV-Tenis.pdf'}


def preparar(destino):
    destino = destino.resolve()
    if destino == RAIZ or RAIZ in destino.parents or destino in RAIZ.parents:
        raise ValueError('Use uma pasta temporária fora do repositório.')
    if destino.exists() and (not destino.is_dir() or any(destino.iterdir())):
        raise ValueError('O destino precisa ser uma pasta vazia ou nova.')
    arquivos = subprocess.check_output(
        ['git', 'ls-files', '-z', '--', *sorted(PUBLICOS)], cwd=RAIZ
    ).decode().split('\0')
    selecionados = []
    for nome in filter(None, arquivos):
        rel = Path(nome)
        if rel.parts[0] not in PUBLICOS or any(p.startswith('.') for p in rel.parts):
            raise ValueError(f'Caminho não permitido: {nome}')
        if rel.suffix.lower() not in EXTENSOES and nome not in EXCECOES:
            continue
        origem = RAIZ / rel
        if any(p.is_symlink() for p in [origem, *origem.parents]) or not origem.is_file():
            raise ValueError(f'Arquivo ausente ou link simbólico: {nome}')
        selecionados.append(rel)
    for pasta in PUBLICOS:
        if Path(pasta, 'index.html') not in selecionados:
            raise ValueError(f'Falta {pasta}/index.html no pacote.')
    destino.mkdir(parents=True, exist_ok=True)
    for rel in selecionados:
        alvo = destino / rel
        alvo.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(RAIZ / rel, alvo)
    (destino / '.nojekyll').touch()
    print(f'Pages: {len(selecionados)} arquivos; somente {", ".join(sorted(PUBLICOS))}.')
    print('Fora do pacote: Família JK, negócio, metodologia, exercícios e ferramentas.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destino', type=Path)
    args = parser.parse_args()
    try:
        preparar(args.destino)
    except (ValueError, OSError, subprocess.CalledProcessError) as erro:
        parser.exit(1, f'ERRO: {erro}\n')

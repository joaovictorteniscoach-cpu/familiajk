#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cobra o carimbo de versão dos apps.

Os apps vivem em dois endereços (GitHub Pages e Netlify) publicados em momentos
diferentes, e os dois gravam no MESMO banco. Cada app carrega uma constante
`VERSAO` e a compara com a da nuvem para avisar quando está rodando uma cópia
velha.

O carimbo é escrito na mão — não há etapa de build em nenhum dos dois lugares.
Logo, esquecer de subir o número é o modo natural de falhar: o aviso continua
existindo, mas passa a mentir, dizendo "atualizado" para uma cópia velha. Um
aviso que mente é pior que aviso nenhum, e daí este script.

Regra: se o arquivo mudou depois da data do carimbo, o carimbo está velho.

Rodar:  python3 ferramentas/checar-versao.py
"""
import re, subprocess, sys, os, datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS = ['app-gestao/index.html', 'app-aluno/index.html']


def git(*args):
    try:
        return subprocess.run(['git'] + list(args), cwd=RAIZ, capture_output=True,
                              text=True, timeout=20).stdout.strip()
    except Exception:
        return ''


def data_do_arquivo(rel):
    """Quando este arquivo mudou pela última vez (AAAA-MM-DD)."""
    # mexido e ainda não commitado conta como hoje
    if git('status', '--porcelain', '--', rel).strip():
        return datetime.date.today().isoformat(), 'ainda não commitado'
    d = git('log', '-1', '--format=%ad', '--date=format:%Y-%m-%d', '--', rel)
    return (d or '0000-00-00'), 'último commit'


def main():
    falhas = 0
    for rel in APPS:
        caminho = os.path.join(RAIZ, rel)
        if not os.path.exists(caminho):
            print('  ⚠️  %s não existe' % rel); falhas += 1; continue
        txt = open(caminho, encoding='utf-8', errors='replace').read()
        m = re.search(r"^const VERSAO\s*=\s*'([^']+)'", txt, re.M)
        if not m:
            print('  ❌ %-24s sem a constante VERSAO' % rel); falhas += 1; continue
        versao = m.group(1)
        if not re.match(r'^\d{4}-\d{2}-\d{2}(-\d+)?$', versao):
            print('  ❌ %-24s VERSAO fora do formato AAAA-MM-DD-N: %r' % (rel, versao))
            falhas += 1; continue
        d_arq, origem = data_do_arquivo(rel)
        d_ver = versao[:10]
        if d_arq > d_ver:
            print('  ❌ %-24s carimbo %s, mas o arquivo mudou em %s (%s)'
                  % (rel, versao, d_arq, origem))
            print('     → suba a VERSAO para %s-1' % d_arq)
            falhas += 1
        else:
            print('  ✅ %-24s %s' % (rel, versao))

    # os dois têm de andar juntos: endereços diferentes comparam o mesmo carimbo
    vs = []
    for rel in APPS:
        caminho = os.path.join(RAIZ, rel)
        if os.path.exists(caminho):
            m = re.search(r"^const VERSAO\s*=\s*'([^']+)'",
                          open(caminho, encoding='utf-8', errors='replace').read(), re.M)
            if m: vs.append((rel, m.group(1)))
    if len(vs) == 2 and vs[0][1] != vs[1][1]:
        print('  ⚠️  carimbos diferentes entre os apps: %s vs %s' % (vs[0][1], vs[1][1]))
        print('     (não é erro — mas o do aluno compara com o carimbo que a Gestão grava,')
        print('      então o da Gestão nunca pode ficar atrás do dele)')
        if vs[0][1] < vs[1][1]:
            print('  ❌ a Gestão está atrás do App do Aluno'); falhas += 1

    print('\n%d app(s) · %d falha(s)' % (len(APPS), falhas))
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(main())

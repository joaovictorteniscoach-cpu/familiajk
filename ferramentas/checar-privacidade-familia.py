#!/usr/bin/env python3
"""Família JK: o código é público (GitHub e Pages). Dado real da família mora
só no aparelho e na nuvem dela — nunca no código. Confere o que dá para
conferir sem citar o dado: documento (CPF/CNPJ) que não seja o de exemplo,
retrato de carteira gravado no código e link real de banco na nuvem."""
from pathlib import Path
import re, sys

RAIZ = Path(__file__).resolve().parent.parent / 'app-familia'
CPF = re.compile(r'\b\d{3}\.\d{3}\.\d{3}-\d{2}\b')
CNPJ = re.compile(r'\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b')
EXEMPLOS = {'000.000.000-00', '00.000.000/0001-00'}
RETRATO = re.compile(r'\bconst\s+SNAPSHOT_\w*\s*=')
NUVEM = re.compile(r'https://(?!SEU-PROJETO)[a-z0-9-]+(?:-default-rtdb)?\.(?:firebaseio\.com|firebasedatabase\.app)', re.I)

falhas = []
for arq in sorted(RAIZ.rglob('*')):
    if arq.suffix not in {'.html', '.js', '.css', '.md', '.json', '.webmanifest'} or 'vendor' in arq.parts:
        continue
    for n, linha in enumerate(arq.read_text(encoding='utf-8').splitlines(), 1):
        for doc in CPF.findall(linha) + CNPJ.findall(linha):
            if doc not in EXEMPLOS:
                falhas.append(f'{arq.name}:{n}: documento real ({doc[:3]}…) — use 000.000.000-00 ou 00.000.000/0001-00')
        if RETRATO.search(linha):
            falhas.append(f'{arq.name}:{n}: retrato de dados gravado no código (SNAPSHOT_…)')
        if NUVEM.search(linha):
            falhas.append(f'{arq.name}:{n}: link real do banco da nuvem no código')

for f in falhas:
    print('❌', f)
print('✅ Família JK sem documento, retrato de carteira ou link real de nuvem no código' if not falhas
      else f'{len(falhas)} problema(s) de privacidade no Família JK')
sys.exit(1 if falhas else 0)

# -*- coding: utf-8 -*-
"""Injeta os campos novos da ficha (desenho da quadra, passo a passo e dica)
dentro de cada exercicio de app-exercicios/exercicios.js.

Por que existe: o banco tem 116 registros e cada um recebeu tres campos novos.
Editar isso a mao e' onde o erro entra. Aqui o registro e' achado pelo id,
os campos sao inseridos sempre no mesmo lugar (antes do fecha-chaves) e o
script recusa o trabalho se algum id nao existir ou ja tiver o campo.

Uso: os lotes chamam `juntar(FICHAS)` — ver ferramentas/fichas-lote*.py
"""
import io, re, sys, os

CAMINHO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..',
                       'app-exercicios', 'exercicios.js')


def registros(texto):
    """Devolve [(id, inicio, fim)] de cada registro de exercicio."""
    achados = []
    for m in re.finditer(r"^\{ id:'([^']+)',", texto, re.M):
        ini = m.start()
        # o registro termina no primeiro "}" seguido de virgula/fim em coluna 0..2
        fim = texto.find('\n', ini)
        nivel = 0
        i = ini
        while i < len(texto):
            c = texto[i]
            if c == '`':                      # pula texto entre crases
                i = texto.find('`', i + 1)
                if i < 0:
                    raise SystemExit('crase sem par a partir de %d' % ini)
            elif c == '{':
                nivel += 1
            elif c == '}':
                nivel -= 1
                if nivel == 0:
                    fim = i
                    break
            i += 1
        achados.append((m.group(1), ini, fim))
    return achados


def juntar(fichas):
    texto = io.open(CAMINHO, encoding='utf-8').read()
    achados = registros(texto)
    porId = {i: (a, b) for i, a, b in achados}

    faltando = [i for i in fichas if i not in porId]
    if faltando:
        raise SystemExit('ids que nao existem no banco: %s' % ', '.join(faltando))

    # de tras para frente, para os deslocamentos nao invalidarem as posicoes
    feitos = 0
    for eid in sorted(fichas, key=lambda i: -porId[i][0]):
        ini, fim = porId[eid]
        corpo = texto[ini:fim]
        if 'fig:' in corpo:
            print('  (ja tinha ficha, pulando: %s)' % eid)
            continue
        fig, passos, dica = fichas[eid]
        novo = ',\n  fig:' + fig.strip()
        novo += ',\n  passos:[' + ', '.join('`%s`' % p for p in passos) + ']'
        if dica:
            novo += ',\n  dica:`%s`' % dica
        novo += ' '
        texto = texto[:fim] + novo + texto[fim:]
        feitos += 1

    io.open(CAMINHO, 'w', encoding='utf-8').write(texto)
    print('fichas juntadas: %d' % feitos)

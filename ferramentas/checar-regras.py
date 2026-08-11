#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Simula as regras do Realtime Database contra as operações reais dos apps.

Por que existe: regra errada não dá erro na tela. O app simplesmente para de
gravar e mostra "salvo só no aparelho" — ou, pior, o aluno manda um pedido que
nunca chega. Este script confere, antes de publicar as regras, que cada
operação que os apps realmente fazem continua permitida, e que as que não
devem ser possíveis continuam bloqueadas.

Como o Firebase avalia (o que este simulador reproduz):
  - um .read/.write verdadeiro em QUALQUER nó no caminho da raiz até o alvo
    libera o alvo inteiro, inclusive tudo abaixo dele;
  - regras ABAIXO do alvo não liberam o alvo;
  - $curinga casa com um segmento qualquer.

Rodar:  python3 ferramentas/checar-regras.py [arquivo.json]
"""
import json, re, sys, os

JOAO = 'XEulBs95uZV1JhfUuz6SmjUaeVv1'

# --- os três atores, do jeito que o Firebase os enxerga -----------------------
COACH    = {'uid': JOAO}          # João logado por e-mail e senha
ALUNO    = {'uid': 'anon-abc123'} # app do aluno, entrada anônima
NINGUEM  = None                   # site público, ou qualquer estranho


def avaliar(expr, auth, curingas, data_existe, new_existe):
    """Avalia o subconjunto de expressão usado nas nossas regras."""
    if expr is True:  return True
    if expr is False: return False
    e = str(expr)
    # auth
    e = re.sub(r'\bauth\s*!=\s*null\b', 'True' if auth else 'False', e)
    e = re.sub(r'\bauth\s*==\s*null\b', 'False' if auth else 'True', e)
    if 'auth.uid' in e:
        if not auth: return False          # auth nulo: acesso a .uid derruba a regra
        e = e.replace('auth.uid', repr(auth['uid']))
    # data / newData
    e = re.sub(r'!\s*data\.exists\(\)', 'True' if not data_existe else 'False', e)
    e = re.sub(r'\bdata\.exists\(\)',   'True' if data_existe else 'False', e)
    e = re.sub(r'\bnewData\.exists\(\)','True' if new_existe else 'False', e)
    # $curinga.beginsWith('x')
    def bw(m):
        val = curingas.get(m.group(1))
        return repr(val is not None and val.startswith(m.group(2)))
    e = re.sub(r"\$(\w+)\.beginsWith\('([^']*)'\)", bw, e)
    e = e.replace('===', '==').replace('&&', ' and ').replace('||', ' or ')
    e = re.sub(r'\$\w+', "''", e)
    try:
        return bool(eval(e, {'__builtins__': {}}, {}))
    except Exception:
        raise SystemExit('não consegui avaliar a expressão: %r' % expr)


def permite(regras, caminho, tipo, auth, data_existe=False, new_existe=True):
    """True se o Firebase permitiria .read/.write em `caminho`."""
    segs = [s for s in caminho.split('/') if s]
    no, curingas = regras, {}
    # a raiz das regras também pode conceder
    for i in range(len(segs) + 1):
        if isinstance(no, dict) and no.get('.' + tipo) is not None:
            if avaliar(no['.' + tipo], auth, curingas, data_existe, new_existe):
                return True
        if i == len(segs): break
        s = segs[i]
        if not isinstance(no, dict): return False
        if s in no:
            no = no[s]
        else:
            wc = [k for k in no if k.startswith('$')]
            if not wc: return False
            curingas[wc[0][1:]] = s
            no = no[wc[0]]
    return False


def main():
    arq = sys.argv[1] if len(sys.argv) > 1 else \
        os.path.join(os.path.dirname(__file__), 'firebase-regras-etapa2.json')
    regras = json.load(open(arq, encoding='utf-8'))['rules']
    print('conferindo:', os.path.basename(arq), '\n')

    J = 'jvtenis/'
    FILAS = ['fila_pedidos','fila_agendamentos','fila_autoaval',
             'fila_confirmacoes','fila_torneio','notificacoes']

    casos = []   # (grupo, descrição, ator, caminho, tipo, esperado, data_existe)

    # ---- Gestão: tudo que app-gestao/index.html realmente faz
    for cam in ['jvtenis-gestao-v1','jvtenis-app-aluno','jvtenis-agendamentos','precos_publicos',
                'v2/alunos','v2/movs','v2/presencas','v2/lancamentos','v2/agenda','v2/config',
                'v2/carimbos/savedAt','arquivo/2024/movs','backups/2026-08-11-12','backups']:
        casos.append(('Gestão (João logado)', 'grava '+cam, COACH, J+cam, 'write', True, True))
        casos.append(('Gestão (João logado)', 'lê '+cam,     COACH, J+cam, 'read',  True, True))
    for f in FILAS + ['fila_cadastros']:
        casos.append(('Gestão (João logado)', 'lê a fila '+f,      COACH, J+f, 'read',  True, True))
        casos.append(('Gestão (João logado)', 'apaga item de '+f,  COACH, J+f+'/-Nabc', 'write', True, True))
    casos.append(('Gestão (João logado)', 'limpa notificacoes inteira', COACH, J+'notificacoes', 'write', True, True))

    # ---- Aluno: o que app-aluno/index.html faz
    casos.append(('App do aluno (anônimo)', 'lê a publicação', ALUNO, J+'jvtenis-app-aluno', 'read', True, True))
    casos.append(('App do aluno (anônimo)', 'lê os próprios pedidos',  ALUNO, J+'jvt-aluno-meu-1111', 'read', True, True))
    casos.append(('App do aluno (anônimo)', 'grava os próprios pedidos',ALUNO, J+'jvt-aluno-meu-1111', 'write', True, True))
    for f in FILAS:
        casos.append(('App do aluno (anônimo)', 'manda pedido novo em '+f, ALUNO, J+f+'/-Nnovo', 'write', True, False))
    # ...e o que ele NÃO pode
    for f in FILAS:
        casos.append(('Aluno NÃO pode', 'ler a fila '+f,            ALUNO, J+f, 'read',  False, True))
        casos.append(('Aluno NÃO pode', 'apagar item de '+f,        ALUNO, J+f+'/-Nabc', 'write', False, True))
    casos.append(('Aluno NÃO pode', 'ler o banco da gestão',   ALUNO, J+'jvtenis-gestao-v1', 'read',  False, True))
    casos.append(('Aluno NÃO pode', 'gravar na publicação',    ALUNO, J+'jvtenis-app-aluno', 'write', False, True))
    casos.append(('Aluno NÃO pode', 'gravar em v2',            ALUNO, J+'v2/alunos', 'write', False, True))
    casos.append(('Aluno NÃO pode', 'ler os backups',          ALUNO, J+'backups', 'read',  False, True))

    # ---- Site público, sem login nenhum
    casos.append(('Site público (sem login)', 'lê os preços',        NINGUEM, J+'precos_publicos', 'read', True, True))
    casos.append(('Site público (sem login)', 'manda contato novo',  NINGUEM, J+'fila_cadastros/-Nnovo', 'write', True, False))

    # ---- Estranho
    casos.append(('Estranho NÃO pode', 'baixar tudo (/jvtenis)',  NINGUEM, 'jvtenis', 'read', False, True))
    casos.append(('Estranho NÃO pode', 'baixar a raiz (/)',       NINGUEM, '', 'read', False, True))
    casos.append(('Estranho NÃO pode', 'ler a publicação',        NINGUEM, J+'jvtenis-app-aluno', 'read', False, True))
    casos.append(('Estranho NÃO pode', 'ler o banco da gestão',   NINGUEM, J+'jvtenis-gestao-v1', 'read', False, True))
    casos.append(('Estranho NÃO pode', 'ler os telefones do site',NINGUEM, J+'fila_cadastros', 'read', False, True))
    casos.append(('Estranho NÃO pode', 'apagar os backups',       NINGUEM, J+'backups', 'write', False, True))
    casos.append(('Estranho NÃO pode', 'apagar tudo',             NINGUEM, 'jvtenis', 'write', False, True))
    casos.append(('Estranho NÃO pode', 'usar o banco de depósito',NINGUEM, 'lixo/arquivo', 'write', False, True))
    casos.append(('Estranho NÃO pode', 'ler pedido de um aluno',  NINGUEM, J+'jvt-aluno-meu-1111', 'read', False, True))

    falhas, grupo_atual = 0, None
    for grupo, desc, ator, cam, tipo, esperado, existe in casos:
        if grupo != grupo_atual:
            print('\n== %s' % grupo); grupo_atual = grupo
        real = permite(regras, cam, tipo, ator, data_existe=existe,
                       new_existe=True)
        ok = (real == esperado)
        if not ok: falhas += 1
        print('  %s %-34s %s' % ('✅' if ok else '❌', desc,
              '' if ok else '(esperado %s, deu %s)' % (
                  'permitir' if esperado else 'bloquear',
                  'permitiu' if real else 'bloqueou')))

    print('\n%d casos · %d falha(s)' % (len(casos), falhas))
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(main())

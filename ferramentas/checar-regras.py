#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Simula permissões relevantes do Firebase Realtime Database.

Mantém a cobertura histórica e entende os controles P0 (UID, vínculo ativo e
código correspondente). Rode contra a etapa 3 de transição e a etapa 4 final.
"""
import json, re, sys, os

JOAO = 'XEulBs95uZV1JhfUuz6SmjUaeVv1'
COACH   = {'uid': JOAO}
ALUNO   = {'uid': 'anon-abc123'}
ALUNO2  = {'uid': 'anon-xyz789'}
NINGUEM = None

ROOT_VINCULADO = {
    'jvtenis/aluno_vinculos/anon-abc123/ativo': True,
    'jvtenis/aluno_vinculos/anon-abc123/codigo': '1234',
}
PAYLOAD_OK = {'uid': 'anon-abc123', 'codigo': '1234'}
PAYLOAD_UID_FALSO = {'uid': 'anon-xyz789', 'codigo': '1234'}
PAYLOAD_COD_FALSO = {'uid': 'anon-abc123', 'codigo': '9999'}


def _resolver_path(expr, root_values):
    try:
        path = eval(expr, {'__builtins__': {}}, {})
    except Exception:
        raise SystemExit('não consegui resolver root.child(%r)' % expr)
    return root_values.get(path)


def avaliar(expr, auth, curingas, data_existe, new_existe, new_data=None, root_values=None):
    if expr is True: return True
    if expr is False: return False
    e = str(expr)
    new_data = new_data or {}
    root_values = root_values or {}

    e = re.sub(r'\bauth\s*!=\s*null\b', 'True' if auth else 'False', e)
    e = re.sub(r'\bauth\s*==\s*null\b', 'False' if auth else 'True', e)
    if 'auth.uid' in e:
        if not auth: return False
        e = e.replace('auth.uid', repr(auth['uid']))

    e = re.sub(r'!\s*data\.exists\(\)', 'True' if not data_existe else 'False', e)
    e = re.sub(r'\bdata\.exists\(\)', 'True' if data_existe else 'False', e)
    e = re.sub(r'\bnewData\.exists\(\)', 'True' if new_existe else 'False', e)

    def bw(m):
        val = curingas.get(m.group(1))
        return repr(val is not None and val.startswith(m.group(2)))
    e = re.sub(r"\$(\w+)\.beginsWith\('([^']*)'\)", bw, e)

    def cur(m):
        v = curingas.get(m.group(1))
        return repr(v) if v is not None else "''"
    e = re.sub(r'\$(\w+)', cur, e)

    e = re.sub(r"newData\.child\('([^']+)'\)\.val\(\)",
               lambda m: repr(new_data.get(m.group(1))), e)
    e = re.sub(r"root\.child\((.*?)\)\.val\(\)",
               lambda m: repr(_resolver_path(m.group(1), root_values)), e)
    e = re.sub(r"root\.child\((.*?)\)\.exists\(\)",
               lambda m: repr(_resolver_path(m.group(1), root_values) is not None), e)

    e = e.replace('===', '==').replace('&&', ' and ').replace('||', ' or ')
    e = re.sub(r'\btrue\b', 'True', e, flags=re.I)
    e = re.sub(r'\bfalse\b', 'False', e, flags=re.I)
    try:
        return bool(eval(e, {'__builtins__': {}}, {}))
    except Exception:
        raise SystemExit('não consegui avaliar a expressão: %r\nconvertida para: %r' % (expr, e))


def permite(regras, caminho, tipo, auth, data_existe=False, new_existe=True,
            new_data=None, root_values=None):
    segs = [s for s in caminho.split('/') if s]
    no, curingas = regras, {}
    for i in range(len(segs) + 1):
        if isinstance(no, dict) and no.get('.' + tipo) is not None:
            if avaliar(no['.' + tipo], auth, curingas, data_existe, new_existe,
                       new_data=new_data, root_values=root_values):
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
    arq = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), 'firebase-regras-etapa4-estrita.json')
    nome = os.path.basename(arq)
    final = 'etapa4' in nome
    transicao = 'etapa3' in nome
    regras = json.load(open(arq, encoding='utf-8'))['rules']
    print('conferindo:', nome, '\n')

    J = 'jvtenis/'
    FILAS = ['fila_pedidos','fila_agendamentos','fila_autoaval',
             'fila_confirmacoes','fila_torneio','notificacoes']
    casos = []

    def add(grupo, desc, ator, cam, tipo, esperado, data_existe=True,
            new_data=None, root_values=None):
        casos.append((grupo, desc, ator, cam, tipo, esperado, data_existe,
                      new_data, root_values))

    gestao = ['jvtenis-gestao-v1','jvtenis-app-aluno','jvtenis-agendamentos','precos_publicos',
              'v2/alunos','v2/movs','v2/presencas','v2/lancamentos','v2/agenda','v2/config',
              'v2/carimbos/savedAt','arquivo/2024/movs','backups/2026-08-11-12','backups']
    if transicao or final:
        gestao += ['jvtenis-app-publico','aluno_vinculos/anon-abc123',
                   'alunos_privados/anon-abc123','fila_vinculos/anon-abc123']
    for cam in gestao:
        add('Gestão (João logado)', 'grava '+cam, COACH, J+cam, 'write', True)
        add('Gestão (João logado)', 'lê '+cam, COACH, J+cam, 'read', True)
    for f in FILAS + ['fila_cadastros']:
        add('Gestão (João logado)', 'lê a fila '+f, COACH, J+f, 'read', True)
        add('Gestão (João logado)', 'apaga item de '+f, COACH, J+f+'/-Nabc', 'write', True)
    add('Gestão (João logado)', 'limpa notificacoes inteira', COACH, J+'notificacoes', 'write', True)
    add('Gestão (João logado)', 'não assume nó pessoal do aluno', COACH,
        J+'aluno-estado/anon-abc123', 'write', False)
    add('Gestão (João logado)', 'grava o carimbo de versão', COACH, J+'versao_app', 'write', True)
    add('Gestão (João logado)', 'lê o carimbo de versão', COACH, J+'versao_app', 'read', True)

    add('App do aluno (anônimo)', 'lê publicação legada conforme fase', ALUNO,
        J+'jvtenis-app-aluno', 'read', not final)
    if transicao or final:
        add('App do aluno (anônimo)', 'lê publicação segura', ALUNO, J+'jvtenis-app-publico', 'read', True)
        add('App do aluno (anônimo)', 'lê o próprio vínculo', ALUNO,
            J+'aluno_vinculos/anon-abc123', 'read', True)
        add('App do aluno (anônimo)', 'pede vínculo para o próprio UID', ALUNO,
            J+'fila_vinculos/anon-abc123', 'write', True, False,
            {'uid':'anon-abc123','codigo':'1234'}, ROOT_VINCULADO)
        add('App do aluno (anônimo)', 'lê dados privados quando vinculado', ALUNO,
            J+'alunos_privados/anon-abc123', 'read', True, True, None, ROOT_VINCULADO)
        add('Aluno NÃO pode', 'ler dados privados de outro UID', ALUNO,
            J+'alunos_privados/anon-xyz789', 'read', False, True, None, ROOT_VINCULADO)
        add('Aluno NÃO pode', 'listar todos os vínculos', ALUNO, J+'aluno_vinculos', 'read', False)
        add('Aluno NÃO pode', 'aprovar o próprio vínculo', ALUNO,
            J+'aluno_vinculos/anon-abc123', 'write', False)

    add('App do aluno (anônimo)', 'lê os próprios pedidos', ALUNO,
        J+'aluno-estado/anon-abc123', 'read', True)
    add('App do aluno (anônimo)', 'grava os próprios pedidos', ALUNO,
        J+'aluno-estado/anon-abc123', 'write', True)
    for f in FILAS:
        add('App do aluno (anônimo)', 'manda pedido válido em '+f, ALUNO,
            J+f+'/-Nnovo', 'write', True, False, PAYLOAD_OK, ROOT_VINCULADO)
        add('Aluno NÃO pode', 'forjar UID em '+f, ALUNO,
            J+f+'/-Nforjado', 'write', False, False, PAYLOAD_UID_FALSO, ROOT_VINCULADO)
        if final:
            add('Aluno NÃO pode', 'forjar código em '+f+' na regra final', ALUNO,
                J+f+'/-Ncodigo', 'write', False, False, PAYLOAD_COD_FALSO, ROOT_VINCULADO)
        add('Aluno NÃO pode', 'ler a fila '+f, ALUNO, J+f, 'read', False)
        add('Aluno NÃO pode', 'apagar item de '+f, ALUNO, J+f+'/-Nabc', 'write', False)
    add('App do aluno (anônimo)', 'lê o carimbo de versão', ALUNO, J+'versao_app', 'read', True)
    add('Aluno NÃO pode', 'ler espaço de OUTRO aluno', ALUNO,
        J+'aluno-estado/anon-xyz789', 'read', False)
    add('Aluno NÃO pode', 'gravar espaço de OUTRO aluno', ALUNO,
        J+'aluno-estado/anon-xyz789', 'write', False)
    add('Aluno NÃO pode', 'listar todos os espaços pessoais', ALUNO, J+'aluno-estado', 'read', False)
    add('Aluno NÃO pode', 'usar a chave antiga por código', ALUNO, J+'jvt-aluno-meu-1111', 'write', False)
    add('Aluno NÃO pode', 'usar a fila de cadastro do site', ALUNO,
        J+'fila_cadastros/-Nx', 'write', False, False)
    add('Aluno NÃO pode', 'ler o banco da gestão', ALUNO, J+'jvtenis-gestao-v1', 'read', False)
    add('Aluno NÃO pode', 'gravar na publicação legada', ALUNO, J+'jvtenis-app-aluno', 'write', False)
    add('Aluno NÃO pode', 'gravar em v2', ALUNO, J+'v2/alunos', 'write', False)
    add('Aluno NÃO pode', 'ler os backups', ALUNO, J+'backups', 'read', False)
    add('Aluno NÃO pode', 'mexer no carimbo de versão', ALUNO, J+'versao_app', 'write', False)

    add('Outro aluno NÃO pode', 'ler espaço pessoal do primeiro', ALUNO2,
        J+'aluno-estado/anon-abc123', 'read', False)
    add('Outro aluno NÃO pode', 'gravar espaço pessoal do primeiro', ALUNO2,
        J+'aluno-estado/anon-abc123', 'write', False)
    if final:
        add('Outro aluno NÃO pode', 'usar fila sem vínculo ativo na regra final', ALUNO2,
            J+'fila_pedidos/-Nnovo', 'write', False, False,
            {'uid':'anon-xyz789','codigo':'1234'}, ROOT_VINCULADO)

    add('Site público (sem login)', 'lê os preços', NINGUEM, J+'precos_publicos', 'read', True)
    add('Site público (sem login)', 'não grava cadastro sem se identificar', NINGUEM,
        J+'fila_cadastros/-Nnovo', 'write', False, False)
    add('Estranho NÃO pode', 'baixar tudo (/jvtenis)', NINGUEM, 'jvtenis', 'read', False)
    add('Estranho NÃO pode', 'baixar a raiz (/)', NINGUEM, '', 'read', False)
    add('Estranho NÃO pode', 'ler publicação legada', NINGUEM, J+'jvtenis-app-aluno', 'read', False)
    add('Estranho NÃO pode', 'ler banco da gestão', NINGUEM, J+'jvtenis-gestao-v1', 'read', False)
    add('Estranho NÃO pode', 'ler telefones do site', NINGUEM, J+'fila_cadastros', 'read', False)
    add('Estranho NÃO pode', 'apagar backups', NINGUEM, J+'backups', 'write', False)
    add('Estranho NÃO pode', 'apagar tudo', NINGUEM, 'jvtenis', 'write', False)
    add('Estranho NÃO pode', 'usar banco de depósito', NINGUEM, 'lixo/arquivo', 'write', False)
    add('Estranho NÃO pode', 'ler pedido de aluno', NINGUEM, J+'aluno-estado/anon-abc123', 'read', False)
    add('Estranho NÃO pode', 'gravar pedido de aluno', NINGUEM, J+'aluno-estado/anon-abc123', 'write', False)
    add('Estranho NÃO pode', 'usar chave antiga por código', NINGUEM, J+'jvt-aluno-meu-1111', 'read', False)
    add('Estranho NÃO pode', 'mexer no carimbo', NINGUEM, J+'versao_app', 'write', False)

    falhas, grupo_atual = 0, None
    for grupo, desc, ator, cam, tipo, esperado, existe, new_data, root_values in casos:
        if grupo != grupo_atual:
            print('\n== %s' % grupo); grupo_atual = grupo
        real = permite(regras, cam, tipo, ator, data_existe=existe,
                       new_existe=True, new_data=new_data, root_values=root_values)
        ok = (real == esperado)
        if not ok: falhas += 1
        print('  %s %-52s %s' % ('✅' if ok else '❌', desc,
              '' if ok else '(esperado %s, deu %s)' % (
                  'permitir' if esperado else 'bloquear',
                  'permitiu' if real else 'bloqueou')))

    print('\n%d casos · %d falha(s)' % (len(casos), falhas))
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(main())

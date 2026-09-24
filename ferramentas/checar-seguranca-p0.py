#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Checagem estática da migração de segurança P0.

Não substitui o simulador do Firebase nem o autoteste dentro do app; serve para
impedir que uma edição acidental reabra os pontos críticos antes de publicar.
"""
from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parent.parent
ADMIN='XEulBs95uZV1JhfUuz6SmjUaeVv1'

falhas=[]
def ok(cond,msg):
    print(('✅ ' if cond else '❌ ')+msg)
    if not cond: falhas.append(msg)

def load(name):
    return json.loads((ROOT/'ferramentas'/name).read_text(encoding='utf-8'))['rules']['jvtenis']

t=load('firebase-regras-etapa3-transicao.json')
s=load('firebase-regras-etapa4-estrita.json')

print('== Regras de transição')
ok(t['jvtenis-app-publico']['.read']=='auth != null','publicação segura exige identificação')
ok(t['jvtenis-app-aluno']['.read']=='auth != null','legado continua legível somente na transição')
ok('auth.uid === $uid' in t['fila_vinculos']['$uid']['.write'],'pedido de vínculo só pode ser gravado pelo próprio UID')
ok('auth.uid === $uid' in t['aluno_vinculos']['$uid']['.read'],'aluno só lê o próprio vínculo')
ok(ADMIN in t['aluno_vinculos']['$uid']['.write'],'só o administrador aprova vínculo')
ok('aluno_vinculos' in t['alunos_privados']['$uid']['.read'],'dados privados dependem de vínculo ativo')
for q in ['notificacoes','fila_pedidos','fila_agendamentos','fila_autoaval','fila_confirmacoes','fila_torneio']:
    w=t[q]['$item']['.write']
    ok("newData.child('uid').val() === auth.uid" in w,f'{q}: UID do payload precisa ser o UID autenticado')
ok('100000' in t['aluno-estado']['$uid']['.validate'],'estado pessoal tem limite de tamanho')
ok(t['mapa_quadra']['.read']!='auth != null','mapa da quadra não fica aberto a qualquer aluno autenticado')

print('\n== Regras finais')
ok(s['jvtenis-app-aluno']['.read']!= 'auth != null','blob legado deixa de ser legível pelos alunos')
for q in ['notificacoes','fila_pedidos','fila_agendamentos','fila_autoaval','fila_confirmacoes','fila_torneio']:
    w=s[q]['$item']['.write']
    ok('aluno_vinculos' in w and "child('codigo').val()" in w,f'{q}: escrita final exige vínculo + código correspondente')

print('\n== Código')
a=(ROOT/'app-aluno/index.html').read_text(encoding='utf-8')
g=(ROOT/'app-gestao/index.html').read_text(encoding='utf-8')
ok("const SECUREPUBKEY='jvtenis-app-publico'" in a,'App Aluno conhece a publicação segura')
ok('async function refreshSeguroRaw()' in a,'App Aluno tenta dados privados por UID')
ok("codigo:String((MEU&&MEU.codigo)||'')" in a,'filaPush sempre carrega UID e código do aluno')
ok('async function solicitarVinculo(codigo)' in a,'App Aluno solicita aprovação do aparelho')
ok('async function publicarSeguro(pub)' in g,'Gestão publica dados privados por UID')
ok('function pedidoConfiavel(p)' in g,'Gestão valida vínculo antes de processar solicitações')
ok('if(!pedidoConfiavel(p)){nb++;return;}' in g,'agenda ignora pedido sem vínculo confiável')
ok('id="vinculos-box"' in g,'Gestão tem painel para aprovar/revogar aparelhos')
ok('async function aprovarVinculosReconhecidos()' in g,'Gestão permite aprovar acessos reconhecidos em lote')
ok("window.fbDB.ref('jvtenis').update(updates)" in g,'aprovação em lote usa atualização atômica no Firebase')

print(f'\n{len(falhas)} falha(s)')
sys.exit(1 if falhas else 0)

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pathlib import Path
import json, sys, re
ROOT=Path(__file__).resolve().parent.parent
ADMIN='XEulBs95uZV1JhfUuz6SmjUaeVv1'
falhas=[]
def ok(c,m):
    print(('✅ ' if c else '❌ ')+m)
    if not c: falhas.append(m)
def load(n): return json.loads((ROOT/'ferramentas'/n).read_text(encoding='utf-8'))['rules']['jvtenis']
base=load('firebase-regras-etapa3.json'); t=load('firebase-regras-etapa3-transicao.json'); s=load('firebase-regras-etapa4-estrita.json')
print('== Preservação das regras atuais')
alterados={'jvtenis-app-aluno','jvtenis-app-publico','aluno_vinculos','alunos_privados','fila_vinculos','mapa_quadra','aluno-estado','notificacoes','fila_pedidos','fila_agendamentos','fila_autoaval','fila_confirmacoes','fila_torneio'}
for k,v in base.items():
    if k not in alterados: ok(t.get(k)==v and s.get(k)==v,f'{k}: preservado')
print('\n== Regras P0')
ok(t['jvtenis-app-publico']['.read']=='auth != null','publicação segura exige auth')
ok(t['jvtenis-app-aluno']['.read']=='auth != null','legado só na transição')
ok(s['jvtenis-app-aluno']['.read']!='auth != null','final fecha legado')
ok('auth.uid === $uid' in t['fila_vinculos']['$uid']['.write'],'pedido de vínculo pelo próprio UID')
ok(ADMIN in t['aluno_vinculos']['$uid']['.write'],'somente admin aprova vínculo')
ok('aluno_vinculos' in t['alunos_privados']['$uid']['.read'],'privado exige vínculo')
ok(t['mapa_quadra']['.read']!='auth != null','mapa interno fechado para aluno')
ok('100000' in t['aluno-estado']['$uid']['.validate'],'estado pessoal limitado')
for q in ['notificacoes','fila_pedidos','fila_agendamentos','fila_autoaval','fila_confirmacoes','fila_torneio']:
    ok("newData.child('uid').val() === auth.uid" in t[q]['$item']['.write'],f'{q}: UID autenticado na transição')
    ok('aluno_vinculos' in s[q]['$item']['.write'] and "child('codigo').val()" in s[q]['$item']['.write'],f'{q}: vínculo + código no final')
print('\n== Código modular')
a=(ROOT/'app-aluno/index.html').read_text(encoding='utf-8')
h=(ROOT/'app-gestao/index.html').read_text(encoding='utf-8')
g=(ROOT/'app-gestao/lib/app-gestao.js').read_text(encoding='utf-8')
sh=(ROOT/'ferramentas/checar-tudo.sh').read_text(encoding='utf-8')
ok('src="lib/app-gestao.js?v=' in h and len(h.encode())<150000,'Gestão continua modular')
mexp=re.search(r"var\s+ESPERADA='([^']+)'",h)
mver=re.search(r"const\s+VERSAO='([^']+)'",g)
ok(bool(mexp and mver and mexp.group(1)==mver.group(1)),'ESPERADA do HTML modular igual à VERSAO do app-gestao.js')
ok("const SECUREPUBKEY='jvtenis-app-publico'" in a and 'async function refreshSeguroRaw()' in a,'Aluno usa publicação segura')
ok("codigo:String((MEU&&MEU.codigo)||'')" in a,'filas do aluno levam UID + código')
ok("const SECUREPUBKEY='jvtenis-app-publico'" in g and 'async function publicarSeguro(pub)' in g,'Gestão modular publica seguro')
ok('function pedidoConfiavel(p)' in g and 'if(!pedidoConfiavel(p)){nb++;return;}' in g,'Gestão valida identidade nas solicitações')
ok('id="vinculos-box"' in h,'painel de vínculos no HTML modular')
ok('aprovarVinculosReconhecidos' not in g,'sem aprovação em lote por código')
ok('canal externo' in g and 'WhatsApp' in g,'aprovação exige confirmação externa')
grade=g.split('function gradePublicaSegura(g){',1)[1].split('async function publicarSeguro(pub)',1)[0]
ok('tipo:e.tipo' not in grade and 'motivo:e.motivo' not in grade,'grade pública não replica campos privados')
ok("?'bloqueio':'ocupado'" in grade and "out.motivo='chuva'" in grade,'grade pública só ocupado/bloqueio/chuva')
ok("profs:pub.profs||[]" in g,'multi-professor preservado na publicação segura')
ok("db2.ref('jvtenis/'+SECUREPUBKEY).get()" in g and "VINC_REQ_KEY+'/'+uid2" in g,'autoteste atualizado para P0')
i0=sh.find('checar-regras.py ferramentas/firebase-regras-etapa3.json')
i3=sh.find('checar-regras.py ferramentas/firebase-regras-etapa3-transicao.json')
i4=sh.find('checar-regras.py ferramentas/firebase-regras-etapa4-estrita.json')
ip=sh.find('checar-seguranca-p0.py')
ok(i0>=0 and i3>i0 and i4>i3 and ip>i4,'suíte preserva regressão atual e testa P0')
print(f'\n{len(falhas)} falha(s)')
sys.exit(1 if falhas else 0)

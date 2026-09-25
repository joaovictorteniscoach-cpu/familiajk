#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Portão leve para o redesign premium dos dois apps.

Não testa aparência por pixel. Garante apenas que os elementos estruturais
aprovados continuem presentes e que o redesign não desapareça silenciosamente
numa alteração futura.
"""
from pathlib import Path
import re, sys, json

ROOT=Path(__file__).resolve().parent.parent
falhas=[]

def ok(cond,msg):
    print(('✅ ' if cond else '❌ ')+msg)
    if not cond: falhas.append(msg)

a=(ROOT/'app-aluno/index.html').read_text(encoding='utf-8',errors='replace')
g=(ROOT/'app-gestao/index.html').read_text(encoding='utf-8',errors='replace')
gc=(ROOT/'app-gestao/lib/estilo.css').read_text(encoding='utf-8',errors='replace')
gj=(ROOT/'app-gestao/lib/app-gestao.js').read_text(encoding='utf-8',errors='replace')
ma=json.loads((ROOT/'app-aluno/manifest-aluno.webmanifest').read_text(encoding='utf-8'))
mg=json.loads((ROOT/'app-gestao/manifest-gestao.webmanifest').read_text(encoding='utf-8'))
saibro=ROOT/'assets/jv-saibro-premium.svg'

print('== App Aluno premium')
ok(saibro.exists(),'asset local de quadra de saibro existe')
ok("url('../assets/jv-saibro-premium.svg')" in a,'Aluno usa fundo local de saibro')
ok('jv-premium-hero' in a and 'Seu painel de <em>treino</em>' in a,'hero premium do aluno')
ok('Cada aula te aproxima do seu melhor tênis.' in a,'frase motivacional do aluno')
for x in ['home-prox-date','home-cred','home-plano','home-foco','home-mens','home-pix-btn']:
    ok(('id="'+x+'"') in a,'home do aluno contém '+x)
ok('id="apg-creditos"' in a and 'id="apg-perfil"' in a,'abas Créditos e Perfil existem')
ok('Minha <em>agenda</em>' in a and 'Organize suas aulas, jogos e reposições.' in a,'Agenda com cabeçalho premium')
ok('Sua <em>evolução</em>' in a and 'Acompanhe sua técnica, constância e progresso.' in a,'Evolução com cabeçalho premium')
ok("const AVATAR_ALUNO_KEY='jvt-avatar-aluno-v1'" in a and 'trocarAvatarAluno' in a,'foto de perfil local do aluno')
ok('Atualização de segurança pendente' in a and 'Verificar autorização' in a,'aviso P0 preservado')
nav=a.split('<nav class="nav">',1)[1].split('</nav>',1)[0]
for x in ['Início','Agenda','Evolução','Créditos','Perfil']:
    ok(x in nav,'navegação do aluno: '+x)

print('\n== Gestão premium')
ok('jv-premium-hero' in g and 'Painel de <em>gestão</em>' in g,'hero premium da Gestão')
ok('Pronto para mais um mês <em>de resultados?</em>' in g,'pergunta motivacional da Gestão')
ok('Disciplina hoje, grandes conquistas amanhã.' in g,'frase motivacional da Gestão')
ok("const AVATAR_GESTAO_KEY='jvt-avatar-gestao-v1'" in gj and 'trocarAvatarGestao' in gj,'foto de perfil local da Gestão')
ok("url('../../assets/jv-saibro-premium.svg')" in gc,'fundo de quadra de saibro no hero da Gestão')
ok('grid-template-columns:repeat(5,1fr)!important' in gc,'Gestão com navegação principal de 5 itens')
gnav=g.split('<nav class="nav">',1)[1].split('</nav>',1)[0]
for x in ['Início','Agenda','Alunos','Financeiro','Mais']:
    ok(x in gnav,'navegação da Gestão: '+x)
ok('id="vinculos-box"' in g,'painel de acessos P0 continua na Gestão')

print('\n== PWA premium')
ok(ma.get('theme_color')=='#06140F' and ma.get('background_color')=='#06140F','manifest do aluno no tema premium')
ok(mg.get('theme_color')=='#06140F' and mg.get('background_color')=='#06140F','manifest da Gestão no tema premium')

print('\n%d falha(s)' % len(falhas))
sys.exit(1 if falhas else 0)

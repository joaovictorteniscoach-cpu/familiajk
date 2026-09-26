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

def carimbo(txt,rotulo,alvo,msg):
    """Confere que um passe de design existe, SEM prender o numero da versao.

    Prender o numero fazia o portao ficar vermelho sozinho: a cada ajuste o
    carimbo vira -7, -8, e a linha 'JV Auditoria final 2026-09-25-6' deixava
    de casar mesmo com o passe inteiro no lugar. O que interessa e que o
    bloco continue ali - e agora o portao ainda diz qual versao encontrou.
    """
    m=re.search(r'JV\s+'+re.escape(rotulo)+r'\s+([0-9][0-9.\-]*)\s*·\s*([^\n=]*)',txt)
    achou=bool(m) and (alvo.lower() in m.group(2).lower() if alvo else True)
    ok(achou,msg+(' ('+m.group(1).strip()+')' if m else ''))


def nav_html(txt):
    m=re.search(r'<nav\s+class="[^"]*\bnav\b[^"]*"[^>]*>(.*?)</nav>',txt,re.S)
    return m.group(1) if m else ''

a=(ROOT/'app-aluno/index.html').read_text(encoding='utf-8',errors='replace')
g=(ROOT/'app-gestao/index.html').read_text(encoding='utf-8',errors='replace')
gc=(ROOT/'app-gestao/lib/estilo.css').read_text(encoding='utf-8',errors='replace')
gj=(ROOT/'app-gestao/lib/app-gestao.js').read_text(encoding='utf-8',errors='replace')
ma=json.loads((ROOT/'app-aluno/manifest-aluno.webmanifest').read_text(encoding='utf-8'))
mg=json.loads((ROOT/'app-gestao/manifest-gestao.webmanifest').read_text(encoding='utf-8'))
saibro=ROOT/'app-aluno/assets/jv-topo-quadra.webp'

print('== App Aluno premium')
ok(saibro.exists() and (ROOT/'app-gestao/assets/jv-topo-quadra.webp').exists(),'cada app inclui seu fundo no deploy independente')
ok("url('assets/jv-topo-quadra.webp')" in a,'Aluno usa a quadra de saibro renderizada (local)')
ok('jv-premium-hero' in a and 'Seu painel de <em>treino</em>' in a,'hero premium do aluno')
ok('Cada aula te aproxima do seu melhor tênis.' in a,'frase motivacional do aluno')
for x in ['home-prox-date','home-cred','home-plano','home-foco','home-mens','home-pix-btn']:
    ok(('id="'+x+'"') in a,'home do aluno contém '+x)
ok('id="apg-creditos"' in a and 'id="apg-perfil"' in a,'abas Créditos e Perfil existem')
ok('Minha <em>agenda</em>' in a and ('Aulas, treinos e disponibilidades.' in a or 'Organize suas aulas, jogos e reposições.' in a),'Agenda com cabeçalho premium')
ok('Sua <em>evolução</em>' in a and 'Acompanhe sua técnica, constância e progresso.' in a,'Evolução com cabeçalho premium')
ok("const AVATAR_ALUNO_KEY='jvt-avatar-aluno-v1'" in a and 'trocarAvatarAluno' in a,'foto de perfil local do aluno')
ok('Atualização de segurança pendente' in a and 'Verificar autorização' in a,'aviso P0 preservado')
nav=nav_html(a)
for x in ['Início','Agenda','Evolução','Créditos','Perfil']:
    ok(x in nav,'navegação do aluno: '+x)

print('\n== Gestão premium')
ok('jv-premium-hero' in g and 'Painel de <em>gestão</em>' in g,'hero premium da Gestão')
ok('Pronto para mais um mês <em>de resultados?</em>' in g,'pergunta motivacional da Gestão')
ok('Disciplina hoje, grandes conquistas amanhã.' in g,'frase motivacional da Gestão')
ok("const AVATAR_GESTAO_KEY='jvt-avatar-gestao-v1'" in gj and 'trocarAvatarGestao' in gj,'foto de perfil local da Gestão')
ok("url('../assets/jv-topo-quadra.webp')" in gc,'quadra de saibro renderizada no hero da Gestão')
ok('grid-template-columns:repeat(5,1fr)!important' in gc,'Gestão com navegação principal de 5 itens')
gnav=nav_html(g)
for x in ['Início','Agenda','Alunos','Caixa','Mais']:
    ok(x in gnav,'navegação da Gestão: '+x)
ok('Financeiro' in g and "irDoMais('fin')" in g,'Financeiro continua acessível pelo menu Mais')
ok('id="vinculos-box"' in g,'painel de acessos P0 continua na Gestão')
ok('Acessos do aluno' in g and 'function irAcessosAluno()' in gj,'menu Mais abre diretamente os acessos do App Aluno')

print('\n== Legibilidade e proporções')
carimbo(gc,'Legibilidade','Gestão','passe de contraste/legibilidade da Gestão presente')
ok('--jv-ink:#10261E' in gc and '.mov-l b' in gc and '.tg-name' in gc,'superfícies claras da Gestão têm tinta escura explícita')
ok('.wk th' in gc and 'background:#0B3C2B!important' in gc,'grade semanal mantém cabeçalho escuro de alto contraste')
carimbo(a,'Legibilidade','App Aluno','passe de contraste/legibilidade do Aluno presente')
ok('.jv-pay-card' in a and '.jv-home-card' in a and '.jv-quick button' in a,'Home do aluno mantém proporções premium')
carimbo(gc,'Auditoria final','contraste WCAG','auditoria final de contraste da Gestão presente')
ok('-webkit-text-fill-color:#10261E' in gc and '.tg-head .tg-title' in gc,'Torneio da Gestão fixa contraste claro/escuro no iPhone')
ok('.quick .q1,.quick .q2,.quick .q4' in gc and '.fin-card .l' in gc,'Caixa e Financeiro têm contraste explícito')
carimbo(a,'Auditoria final','App Aluno','auditoria final de contraste do App Aluno presente')
ok('#apg-inicio .jv-home-card .hc-sub' in a and '-webkit-text-fill-color:#D8D2C7' in a,'texto secundário da Home do aluno tem contraste explícito')
ok('@media (display-mode:standalone)' in a and '@media (display-mode:standalone)' in gc,'safe-area da Dynamic Island protegida nos dois apps')
ok('font-size:16px!important' in a and 'font-size:16px!important' in gc,'inputs mobile evitam zoom automático do Safari')

carimbo(gc,'Revisão iPhone','contraste','revisão iPhone da Gestão presente')
carimbo(a,'Revisão iPhone','App Aluno','revisão iPhone do App Aluno presente')
ok('#apg-agenda .ag-nav-label small' in a and '-webkit-text-fill-color:#D8D2C7' in a,'Agenda do aluno mantém texto secundário legível')
ok('#pg-torneio .tg-head .tg-title' in gc and '#pg-lanc .quick .q1' in gc,'correções específicas dos screenshots preservadas')

print('\n== PWA premium')
ok(ma.get('theme_color')=='#06140F' and ma.get('background_color')=='#06140F','manifest do aluno no tema premium')
ok(mg.get('theme_color')=='#06140F' and mg.get('background_color')=='#06140F','manifest da Gestão no tema premium')

print('\n%d falha(s)' % len(falhas))
sys.exit(1 if falhas else 0)

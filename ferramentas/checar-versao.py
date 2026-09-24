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



def locais_do_app(rel):
    """O HTML e os scripts locais que ele carrega, como caminhos relativos.

    A constante VERSAO e o codigo que mexe nela sairam do index.html para
    lib/app-gestao.js. Sem seguir o <script src>, este portao deixaria de achar
    o carimbo — e, pior, deixaria de perceber que o app mudou quando a mudanca
    for no arquivo de fora.
    """
    caminho = os.path.join(RAIZ, rel)
    saida = [rel]
    if not os.path.exists(caminho):
        return saida
    txt = open(caminho, encoding='utf-8', errors='replace').read()
    base = os.path.dirname(rel)
    for src in re.findall(r'<script[^>]*\bsrc="([^"]+)"', txt):
        src = src.split('?')[0]   # o endereco leva a versao; o arquivo no disco nao
        if src.startswith('http') or src.startswith('//'):
            continue
        if re.search(r'firebase-|jspdf|html2canvas', src):
            continue
        r2 = os.path.normpath(os.path.join(base, src))
        if os.path.exists(os.path.join(RAIZ, r2)):
            saida.append(r2)
    return saida


def texto_do_app(rel):
    return '\n'.join(open(os.path.join(RAIZ, r), encoding='utf-8', errors='replace').read()
                     for r in locais_do_app(rel))


def data_do_app(rel):
    """A data mais recente entre o HTML e os arquivos que ele carrega."""
    melhor, origem = '0000-00-00', 'sem commit'
    for r in locais_do_app(rel):
        d, o = data_do_arquivo(r)
        if d > melhor:
            melhor, origem = d, o + ' (' + r + ')'
    return melhor, origem


def main():
    falhas = 0
    for rel in APPS:
        caminho = os.path.join(RAIZ, rel)
        if not os.path.exists(caminho):
            print('  ⚠️  %s não existe' % rel); falhas += 1; continue
        txt = texto_do_app(rel)
        m = re.search(r"^const VERSAO\s*=\s*'([^']+)'", txt, re.M)
        if not m:
            print('  ❌ %-24s sem a constante VERSAO' % rel); falhas += 1; continue
        versao = m.group(1)
        if not re.match(r'^\d{4}-\d{2}-\d{2}(-\d+)?$', versao):
            print('  ❌ %-24s VERSAO fora do formato AAAA-MM-DD-N: %r' % (rel, versao))
            falhas += 1; continue
        d_arq, origem = data_do_app(rel)
        d_ver = versao[:10]
        if d_arq > d_ver:
            print('  ❌ %-24s carimbo %s, mas o arquivo mudou em %s (%s)'
                  % (rel, versao, d_arq, origem))
            print('     → suba a VERSAO para %s-1' % d_arq)
            falhas += 1
        else:
            print('  ✅ %-24s %s' % (rel, versao))

    # O endereço dos arquivos do app leva a versão (lib/app.js?v=AAAA-MM-DD-N).
    # É isso que impede o celular de servir um código velho junto de uma tela
    # nova — o par trocado abria o app com dados antigos e os botões mortos.
    # Se o "?v=" ficar para trás do VERSAO, TODO mundo cai na tela de socorro.
    for rel in APPS:
        caminho = os.path.join(RAIZ, rel)
        if not os.path.exists(caminho):
            continue
        html = open(caminho, encoding='utf-8', errors='replace').read()
        m = re.search(r"^const VERSAO\s*=\s*'([^']+)'", texto_do_app(rel), re.M)
        if not m:
            continue
        versao = m.group(1)
        marcas = set(re.findall(r'(?:src|href)="(?:lib/)?[^"]+\?v=([^"&]+)"', html))
        if not marcas:
            continue
        erradas = sorted(x for x in marcas if x != versao)
        if erradas:
            print('  ❌ %-24s carimbo %s, mas o endereço dos arquivos diz %s'
                  % (rel, versao, ', '.join(erradas)))
            print('     → o celular vai abrir a tela nova com o código velho.')
            print('        Deixe o "?v=" igual ao VERSAO nos dois lugares.')
            falhas += 1
        else:
            print('  ✅ %-24s endereço dos arquivos com ?v=%s' % (rel, versao))

    # os dois têm de andar IGUAIS: comparam com o mesmo carimbo na nuvem
    vs = []
    for rel in APPS:
        caminho = os.path.join(RAIZ, rel)
        if os.path.exists(caminho):
            m = re.search(r"^const VERSAO\s*=\s*'([^']+)'", texto_do_app(rel), re.M)
            if m: vs.append((rel, m.group(1)))
    if len(vs) == 2 and vs[0][1] != vs[1][1]:
        print('  ❌ carimbos diferentes: %s = %s, %s = %s'
              % (vs[0][0], vs[0][1], vs[1][0], vs[1][1]))
        print('     Os dois comparam com o MESMO carimbo na nuvem. Diferentes, o que')
        print('     estiver atrás mostra "desatualizado" sem estar. Deixe os dois iguais.')
        falhas += 1

    # A Gestão modular tem uma sentinela inline que compara a tela com o JS.
    # Se ficar um número atrás, o app abre a tela de socorro mesmo com os
    # arquivos corretos. O workflow do Pages roda este script antes de publicar.
    gestao_html = open(os.path.join(RAIZ, 'app-gestao/index.html'),
                       encoding='utf-8', errors='replace').read()
    gestao_js = open(os.path.join(RAIZ, 'app-gestao/lib/app-gestao.js'),
                     encoding='utf-8', errors='replace').read()
    me = re.search(r"var\s+ESPERADA='([^']+)'", gestao_html)
    mv = re.search(r"^const\s+VERSAO\s*=\s*'([^']+)'", gestao_js, re.M)
    if not me or not mv:
        print('  ❌ Gestão modular sem ESPERADA/VERSAO verificável')
        falhas += 1
    elif me.group(1) != mv.group(1):
        print('  ❌ Gestão modular: ESPERADA=%s, mas VERSAO=%s' % (me.group(1), mv.group(1)))
        falhas += 1
    else:
        print('  ✅ Gestão modular: ESPERADA e VERSAO = %s' % mv.group(1))

    # O PWA também precisa trocar o service worker quando a versão muda.
    # Sem isso, o ícone instalado na tela inicial pode continuar servindo a
    # reserva antiga mesmo depois do deploy novo.
    for pasta, sw_nome in [('app-gestao','sw-gestao.js'), ('app-aluno','sw-aluno.js')]:
        html = open(os.path.join(RAIZ, pasta, 'index.html'), encoding='utf-8', errors='replace').read()
        app_txt = texto_do_app(os.path.join(pasta, 'index.html'))
        ma = re.search(r"^const VERSAO\s*=\s*'([^']+)'", app_txt, re.M)
        reg = re.search(r"serviceWorker\.register\('"+re.escape(sw_nome)+r"\?v=([^']+)'\)", html)
        sw = open(os.path.join(RAIZ, pasta, sw_nome), encoding='utf-8', errors='replace').read()
        msw = re.search(r"^const V\s*=\s*'([^']+)'", sw, re.M)
        if not ma or not reg or not msw or ma.group(1) != reg.group(1) or ma.group(1) != msw.group(1):
            print('  ❌ %-24s service worker fora da versão do app' % pasta)
            falhas += 1
        else:
            print('  ✅ %-24s service worker %s' % (pasta, ma.group(1)))

    print('\n%d app(s) · %d falha(s)' % (len(APPS), falhas))
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(main())

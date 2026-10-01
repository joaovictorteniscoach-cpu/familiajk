# -*- coding: utf-8 -*-
"""Gera o banco de exercicios como UM arquivo .html so'.

Por que existe: no iPhone nao da' para enviar uma pasta, e o .zip, se a pessoa
tocar nele, vira pasta. Um arquivo unico abre com um toque no Safari e tambem
pode ser enviado sozinho para o Netlify.

O que muda em relacao a pasta completa:
  · o quadra.js e o exercicios.js entram embutidos no proprio HTML;
  · o icone da Tela de Inicio vira data URI (nao depende de arquivo ao lado);
  · sai o service worker e o manifest — sem arquivo ao lado, eles so' dariam 404.
    Ou seja: ESTA versao nao funciona offline. A pasta completa funciona.

Uso, a partir da raiz do repositorio:
    python3 ferramentas/gerar-arquivo-unico.py [destino.html]
"""
import base64, io, os, re, sys

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
APP = os.path.join(RAIZ, 'app-exercicios')
destino = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'banco-exercicios-jv.html')


def ler(nome):
    return io.open(os.path.join(APP, nome), encoding='utf-8').read()


def dataUri(nome, tipo='image/png'):
    with open(os.path.join(APP, nome), 'rb') as f:
        return 'data:%s;base64,%s' % (tipo, base64.b64encode(f.read()).decode('ascii'))


html = ler('index.html')

# 1. embute os dois scripts. A checagem existe porque um "</script>" dentro do
#    codigo fecharia o bloco no meio e quebraria a pagina inteira.
for nome in ('quadra.js', 'exercicios.js'):
    codigo = ler(nome)
    if '</script' in codigo.lower():
        raise SystemExit('%s contem </script> e nao pode ser embutido assim' % nome)
    tag = '<script src="%s"></script>' % nome
    if tag not in html:
        raise SystemExit('nao achei a tag de %s no index.html' % nome)
    html = html.replace(tag, '<script>\n/* ===== %s ===== */\n%s\n</script>' % (nome, codigo), 1)

# 2. icones viram data URI: sem arquivo ao lado, o icone da Tela de Inicio some
html = html.replace('href="jv-icone-exercicios.png"', 'href="%s"' % dataUri('jv-icone-exercicios-192.png'), 1)
html = html.replace('href="jv-icone-exercicios-180.png"', 'href="%s"' % dataUri('jv-icone-exercicios-180.png'), 1)

# 3. tira o que depende de arquivo ao lado (so' daria 404 nesta versao)
# a tela de abertura do iPhone e' uma imagem por tamanho de tela: embutir as
# sete pesaria mais que o app inteiro. Sem elas, o iPhone abre em fundo liso.
html = re.sub(r'<link rel="apple-touch-startup-image"[^>]*>\n?', '', html)
html = html.replace('<link rel="manifest" href="manifest-exercicios.webmanifest">\n', '', 1)
html = re.sub(
    r"  if \('serviceWorker' in navigator\) \{\n.*?\n  \}\n",
    "  // Versao de arquivo unico: sem service worker (ele precisa de um arquivo\n"
    "  // proprio ao lado). Para usar offline em quadra, publique a pasta completa.\n",
    html, count=1, flags=re.S)

# 3b. as fotos da quadra e os recortes de jogador, quando existirem, viram
#     data URI tambem. Sem isto o arquivo unico daria 404 em cada foto e o
#     desenho abriria sem fundo nenhum — e o 404 nao apareceria na conferencia
#     de baixo, porque o href da foto e' montado pelo JS, nao escrito no HTML.
# so' o codigo: os exemplos de arq:'...' escritos nos comentarios do quadra.js
# nao sao declaracao nenhuma, e apareciam como foto faltando
codigo = re.sub(r'/\*.*?\*/', '', html, flags=re.S)
codigo = '\n'.join(l for l in codigo.split('\n') if not l.lstrip().startswith('//'))
# Pega QUALQUER nome de arquivo de imagem escrito no codigo — `arq`, `costas`
# e os arquivos por papel dentro de `papel:{...}`. Casar campo por campo dava
# foto de fora toda vez que o quadra.js ganhava um campo novo, e o 404 so'
# aparecia em quadra. So' entra o que existe mesmo na pasta.
fotos = sorted(set(n for n in re.findall(r"'([A-Za-z0-9._-]+\.(?:webp|png|jpe?g))'", codigo)
                   if os.path.exists(os.path.join(APP, n))))
embutidas = []
for nome in fotos:
    caminho = os.path.join(APP, nome)
    if not os.path.exists(caminho):
        print('ATENCAO — foto declarada e nao encontrada: %s' % nome)
        continue
    n = nome.lower()
    tipo = ('image/png' if n.endswith('.png') else
            'image/webp' if n.endswith('.webp') else 'image/jpeg')
    html = html.replace("'%s'" % nome, "'%s'" % dataUri(nome, tipo))
    embutidas.append(nome)
if embutidas:
    print('fotos embutidas: %s' % ', '.join(embutidas))

# 3c. a letra da folha (Barlow Condensed) tambem entra embutida: sem ela a
#     folha A4 sai na fonte do sistema, mais larga, e o rodape cai para fora da
#     pagina. A licenca (SIL OFL 1.1) permite embutir; o aviso vai junto.
fontes = re.findall(r'url\((fonte-[A-Za-z0-9-]+\.woff2)\)', html)
for nome in sorted(set(fontes)):
    html = html.replace('url(%s)' % nome, 'url(%s)' % dataUri(nome, 'font/woff2'))
if fontes:
    html = html.replace('<style>', '<style>\n/* Fonte Barlow Condensed, Copyright 2017 The Barlow Project Authors\n'
                        '   (https://github.com/jpt/barlow), sob a SIL Open Font License 1.1\n'
                        '   (https://openfontlicense.org). */', 1)
    print('fontes embutidas: %s' % ', '.join(sorted(set(fontes))))

# 4. deixa registrado no proprio arquivo o que ele e'
html = html.replace('<meta name="robots" content="noindex,nofollow">',
    '<meta name="robots" content="noindex,nofollow">\n'
    '<!-- Versao de ARQUIVO UNICO, gerada por ferramentas/gerar-arquivo-unico.py.\n'
    '     Nao editar aqui: mexa em app-exercicios/ e gere de novo. -->', 1)

io.open(destino, 'w', encoding='utf-8').write(html)
tam = os.path.getsize(destino) / 1024
print('gerado: %s (%.0f KB)' % (destino, tam))
if tam > 1500:
    print('  o arquivo ficou grande para abrir por 4G em quadra — se incomodar,')
    print('  publique a pasta completa (o zip), que carrega a foto uma vez so.')
if 'src="' in re.sub(r'src="data:[^"]*"', '', html):
    sobrou = set(re.findall(r'src="(?!data:)([^"]+)"', html)) | set(re.findall(r'href="(?!data:|#|https?:)([^"]+)"', html))
    if sobrou:
        print('ATENCAO — ainda depende de arquivo ao lado: %s' % ', '.join(sobrou))
    else:
        print('nenhuma dependencia de arquivo ao lado: e um arquivo so mesmo.')
else:
    print('nenhuma dependencia de arquivo ao lado: e um arquivo so mesmo.')

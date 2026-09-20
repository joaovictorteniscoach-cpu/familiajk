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
fotos = sorted(set(re.findall(r"arq:'([^']+)'", codigo)))
embutidas = []
for nome in fotos:
    caminho = os.path.join(APP, nome)
    if not os.path.exists(caminho):
        print('ATENCAO — foto declarada e nao encontrada: %s' % nome)
        continue
    tipo = 'image/png' if nome.lower().endswith('.png') else 'image/jpeg'
    html = html.replace("arq:'%s'" % nome, "arq:'%s'" % dataUri(nome, tipo))
    embutidas.append(nome)
if embutidas:
    print('fotos embutidas: %s' % ', '.join(embutidas))

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

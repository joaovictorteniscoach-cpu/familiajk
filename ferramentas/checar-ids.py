import re,sys

def fontes_do_app(arq):
    """O HTML mais os scripts locais que ele manda carregar.

    Sem isto, tirar o codigo de dentro do index.html faria este portao olhar
    para um arquivo quase vazio e aprovar qualquer coisa — portao que para de
    olhar e pior que portao nenhum.
    """
    import os, re as _re
    txt = open(arq, encoding='utf-8').read()
    for src in _re.findall(r'<script[^>]*\bsrc="([^"]+)"', txt):
        if src.startswith('http') or src.startswith('//'):
            continue
        if _re.search(r'firebase-|jspdf|html2canvas', src):
            continue
        cam = os.path.join(os.path.dirname(arq), src)
        if os.path.exists(cam):
            # embrulhado em <script> porque quem le isto procura blocos de
            # script, nao texto solto
            txt += '\n<script>\n' + open(cam, encoding='utf-8').read() + '\n</script>\n'
        else:
            print('  AVISO: %s aponta para %s, que nao existe' % (arq, src))
    return txt

for arq in sys.argv[1:]:
    html=fontes_do_app(arq)
    # ids que existem: no markup estatico OU gerados por JS (id="x" dentro de string)
    existem=set(re.findall(r'\bid="([A-Za-z][\w-]*)"',html))
    existem|=set(re.findall(r"\bid='([A-Za-z][\w-]*)'",html))
    existem|=set(re.findall(r"id=\\?['\"]?([A-Za-z][\w-]*)",html))
    existem|=set(re.findall(r"\bid=([A-Za-z][\w-]*)",html))
    # ids procurados pelo JS
    proc={}
    for m in re.finditer(r"getElementById\(\s*['\"]([^'\"]+)['\"]",html): proc.setdefault(m.group(1),0); proc[m.group(1)]+=1
    for m in re.finditer(r"querySelector\(\s*['\"]#([A-Za-z][\w-]*)['\"]",html): proc.setdefault(m.group(1),0); proc[m.group(1)]+=1
    faltam={k:v for k,v in proc.items() if k not in existem}
    print('='*58); print(arq)
    print(f'  {len(existem)} ids no arquivo · {len(proc)} ids procurados pelo JS')
    if not faltam: print('  ✅ todo id procurado existe')
    else:
        print(f'  ⚠️  {len(faltam)} id(s) procurados que nao existem:')
        for k,v in sorted(faltam.items()): print(f'     - #{k}  ({v}x)')

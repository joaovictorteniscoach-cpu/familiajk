import re,sys

GLOBAIS=set("""
if for while switch catch try return typeof new delete void in of do else function
Array Object String Number Boolean Math JSON Date RegExp Error Promise Set Map Symbol
parseInt parseFloat isNaN isFinite encodeURIComponent decodeURIComponent encodeURI decodeURI
setTimeout setInterval clearTimeout clearInterval requestAnimationFrame cancelAnimationFrame
alert confirm prompt fetch console window document navigator localStorage sessionStorage
firebase html2canvas jspdf jsPDF URL Blob File FileReader FormData Image Notification
MouseEvent CustomEvent Event KeyboardEvent TouchEvent IntersectionObserver MutationObserver
eval Function structuredClone queueMicrotask atob btoa matchMedia getComputedStyle
Intl Uint8Array ArrayBuffer DataView WeakMap WeakSet Proxy Reflect BigInt super this
""".split())

def limpa(code):
    """Zera comentarios, textos e regex, mas MANTEM o miolo ${...} dos templates.
    Precisa contar chaves: sem isso o resto do arquivo vira 'texto' e some."""
    out=[];i=0;n=len(code);st='code';pilha=[]   # pilha: profundidade de { dentro de cada ${}
    ant=''                                       # ultimo caractere util (p/ distinguir regex de divisao)
    while i<n:
        c=code[i];d=code[i:i+2]
        if st=='code':
            if d=='//': st='lc';out.append('  ');i+=2;continue
            if d=='/*': st='bc';out.append('  ');i+=2;continue
            if c=='/' and (ant=='' or ant in '(,=:[!&|?{};+-*%~^<>'):
                st='re';out.append(' ');i+=1;continue
            if c in '"\'': st=c;out.append(' ');i+=1;continue
            if c=='`': st='tpl';pilha.append(None);out.append(' ');i+=1;continue
            if pilha and pilha[-1] is not None:
                if c=='{': pilha[-1]+=1
                elif c=='}':
                    if pilha[-1]==0: pilha[-1]=None;st='tpl';out.append(' ');i+=1;ant='';continue
                    pilha[-1]-=1
            out.append(c)
            if not c.isspace(): ant=c
            i+=1;continue
        if st=='lc':
            if c=='\n': st='code';out.append('\n')
            else: out.append(' ')
            i+=1;continue
        if st=='bc':
            if d=='*/': st='code';out.append('  ');i+=2;continue
            out.append('\n' if c=='\n' else ' ');i+=1;continue
        if st=='re':
            if c=='\\': out.append('  ');i+=2;continue
            if c=='/': st='code';ant='/'
            out.append(' ');i+=1;continue
        if st in '"\'':
            if c=='\\': out.append('  ');i+=2;continue
            if c==st: st='code';ant='"'
            out.append(' ');i+=1;continue
        if st=='tpl':
            if c=='\\': out.append('  ');i+=2;continue
            if d=='${': st='code';pilha[-1]=0;out.append('  ');i+=2;ant='';continue
            if c=='`': st='code';pilha.pop();ant='`'
            out.append('\n' if c=='\n' else ' ');i+=1;continue
    return ''.join(out)

def definidos(codes):
    d=set()
    for code in codes:
        d|=set(re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)',code))
        d|=set(re.findall(r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)',code))
        d|=set(re.findall(r'\b([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function',code))
        d|=set(re.findall(r'\bwindow\.([A-Za-z_$][\w$]*)\s*=',code))
        d|=set(re.findall(r'\bclass\s+([A-Za-z_$][\w$]*)',code))
        # parametros contam como definidos no escopo
        for ps in re.findall(r'function\s*[A-Za-z_$\w]*\s*\(([^)]*)\)',code): d|=set(re.findall(r'[A-Za-z_$][\w$]*',ps))
        for ps in re.findall(r'\(([^()]*)\)\s*=>',code):                      d|=set(re.findall(r'[A-Za-z_$][\w$]*',ps))
        d|=set(re.findall(r'\b([A-Za-z_$][\w$]*)\s*=>',code))
        d|=set(re.findall(r'\bcatch\s*\(\s*([A-Za-z_$][\w$]*)',code))
    return d

for arq in sys.argv[1:]:
    html=open(arq,encoding='utf-8').read()
    js=[limpa(m.group(1)) for m in re.finditer(r'<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)</script>',html)]
    attrs=[(m.group(1),limpa(m.group(2))) for m in re.finditer(r'\bon(\w+)\s*=\s*"([^"]*)"',html)]
    defs=definidos(js)
    usos={}
    def varre(code,origem):
        for m in re.finditer(r'(?:^|[^\w$.])([A-Za-z_$][\w$]*)\s*\(',code):
            nm=m.group(1)
            if nm not in GLOBAIS: usos.setdefault(nm,set()).add(origem)
    for c in js: varre(c,'js')
    for ev,c in attrs: varre(c,'on'+ev)
    faltando={n:sorted(o) for n,o in usos.items() if n not in defs}
    print('='*58);print(arq)
    print(f'  {len(js)} scripts · {len(attrs)} handlers inline · {len(defs)} nomes definidos · {len(usos)} chamados')
    if not faltando: print('  ✅ toda funcao chamada existe neste arquivo')
    else:
        print(f'  ⚠️  {len(faltando)} chamada(s) sem definicao:')
        for n,o in sorted(faltando.items()): print(f'     - {n}()   [{", ".join(o)}]')

import re,sys
for arq in sys.argv[1:]:
    html=open(arq,encoding='utf-8').read()
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

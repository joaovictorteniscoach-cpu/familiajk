"""Procura colisao de nome de classe no CSS.

O caso real: existe uma regra geral `.top` (o cabecalho das paginas, com a foto
da quadra de fundo) e, dentro da avaliacao, cada linha gerava um
`<div class="top">`. A regra especifica `.evo-row .top` so ajustava o
alinhamento e nao zerava `background` nem `padding` — resultado: toda linha
herdava a foto verde e o texto ficava ilegivel.

O script cruza cada classe usada como regra GERAL (`.x{...}`) com o mesmo nome
aparecendo aninhado (`.a .x{...}`) e avisa quando a regra aninhada nao
sobrescreve propriedades perigosas herdadas.

Atencao: nem todo aviso e bug. Quando a regra aninhada e o MESMO elemento em
outro estado (ex.: `.aluno.open .aluno-body`), herdar e o esperado. Conferir
caso a caso; o que importa e quando sao elementos DIFERENTES com o mesmo nome.

Uso:  python3 ferramentas/checar-css.py app-aluno/index.html app-gestao/index.html
"""
import re, sys

# propriedades que, herdadas por engano, quebram o visual de forma silenciosa
RISCO = {'background', 'background-image', 'background-color', 'padding',
         'display', 'height', 'width', 'position', 'color', 'margin',
         'grid-template-columns', 'flex-direction', 'overflow'}

def regras(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    return re.findall(r'([^{}]+)\{([^{}]*)\}', css)

for arq in sys.argv[1:]:
    src = open(arq, encoding='utf-8').read()
    css = '\n'.join(re.findall(r'<style>(.*?)</style>', src, re.S))
    geral, aninhada = {}, {}
    for sel, corpo in regras(css):
        for um in sel.split(','):
            um = um.strip()
            if not um or um.startswith('@') or um.startswith('%'):
                continue
            props = {p.split(':')[0].strip() for p in corpo.split(';') if ':' in p}
            if re.fullmatch(r'\.[A-Za-z0-9_-]+', um):
                geral.setdefault(um[1:], set()).update(props)
            m = re.fullmatch(r'(.+?[ >])\.([A-Za-z0-9_-]+)', um)
            if m:
                aninhada.setdefault(m.group(2), []).append((um, props))

    achados = []
    for cls, itens in aninhada.items():
        if cls not in geral:
            continue
        for sel, props in itens:
            herda = (geral[cls] - props) & RISCO
            if herda:
                achados.append((cls, sel, sorted(herda)))

    print('=' * 58)
    print(arq)
    print(f'  {len(geral)} classes com regra geral · {len(aninhada)} nomes reusados aninhados')
    if not achados:
        print('  OK: nenhuma classe aninhada herda propriedade perigosa')
    else:
        print(f'  ATENCAO: {len(achados)} caso(s) para conferir a olho:')
        for cls, sel, herda in achados:
            print(f'     - "{sel}" nao zera {herda} que vem de ".{cls}"')

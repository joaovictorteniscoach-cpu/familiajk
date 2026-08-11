# Ferramentas de conferência

Scripts para rodar **antes de publicar**. Não fazem parte dos apps: ficam fora
das pastas `app-aluno/`, `app-gestao/` e `site/`, então mexer aqui não dispara
deploy nenhum no Netlify.

Rodar tudo de uma vez, a partir da raiz do repositório:

```sh
sh ferramentas/checar-tudo.sh
```

## O que cada um pega

| Script | Pega | Exemplo real |
|---|---|---|
| `checar-sintaxe.js` | erro de sintaxe nos scripts | qualquer erro aqui derruba o app inteiro |
| `checar-funcoes.py` | função chamada que não existe naquele arquivo | o botão "Fechar" da autoavaliação chamava `closeModal()`, que só existia no app da Gestão — o aluno ficava preso no modal |
| `checar-ids.py` | `getElementById` de um id que não existe | devolve `null` e o código morre ali, sem erro visível |
| `checar-css.py` | classe interna com o mesmo nome de uma regra geral | `.top` das linhas da avaliação herdava a foto verde do cabeçalho e o texto ficava ilegível; `.seg` das barrinhas herdava a grade de 4 colunas e a barra sumia |

O que essas quatro falhas têm em comum: **nenhuma delas dá erro na tela**. O app
continua funcionando, só que uma parte para de responder ou fica ilegível — e
isso só aparece quando alguém usa. Daí os scripts.

## Como ler os resultados

- **Sintaxe**: tem que dar 0 erros. Se der erro, não publique.
- **Funções e ids**: o esperado é zero. Se aparecer algo, confira antes de
  descartar — os scripts marcam alguns falsos positivos conhecidos:
  - `async()` é a palavra-chave em `async(x)=>{}`, não uma chamada;
  - `qrcode()` é a biblioteca externa do QR do Pix, carregada sob demanda;
  - ids montados por concatenação (`'apg-'+id`) aparecem cortados no prefixo.
- **CSS**: aqui o normal é sobrar alguns avisos legítimos. Quando a regra
  aninhada é o **mesmo elemento** em outro estado (`.aluno.open .aluno-body`),
  herdar é o comportamento desejado. O que importa é quando são elementos
  **diferentes** com o mesmo nome de classe — foi assim nos dois bugs acima.

## Requisitos

`node` e `python3`. Nada mais: sem instalar dependência.

## As bibliotecas ficam dentro do app

Firebase, html2canvas, jsPDF e o gerador de QR **não vêm mais de servidores de
fora** — estão em `app-gestao/lib/` e `app-aluno/lib/`. Isso faz o
app funcionar completo offline e o protege de o CDN sair do ar. O endereço de
fora continua no código como **reserva**, para o caso de um deploy sair sem a
pasta `lib/`.

A troca consciente: elas **não se atualizam sozinhas**. Para atualizar:

```sh
npm pack firebase@10.12.2 html2canvas@1.4.1 jspdf@2.5.1 qrcode-generator@1.4.4
# extrair e copiar por cima:
#   package/firebase-app-compat.js        → lib/
#   package/firebase-auth-compat.js       → lib/  (app-gestao e app-aluno)
#   package/firebase-database-compat.js   → lib/
#   package/dist/html2canvas.min.js       → lib/
#   package/dist/jspdf.umd.min.js         → lib/
#   package/qrcode.js                     → app-aluno/lib/qrcode.min.js
```

Mudando a versão, ajuste também o endereço de reserva no HTML e a expressão em
`site-pro/tools/build_demo.py`, que usa `lib/firebase-app-compat.js` como âncora
para tirar o Firebase da demo.

### O site público não carrega biblioteca nenhuma

`site/` tinha 193 KB de SDK do Firebase para ler **três números** (os preços de
grupo). Num site público isso é caro: cada visita paga. Agora é um `fetch` no
endereço REST do Realtime Database — o mesmo dado, ~100 bytes, sem biblioteca.
Por isso não existe `site/lib/`.

Só funciona porque `jvtenis/precos_publicos` é leitura pública nas duas versões
das regras. Se um dia esse nó for fechado, o site volta aos valores fixos do
HTML — não quebra, só para de atualizar sozinho.

O único externo que sobra são as **fontes do Google**, e elas são só aparência:
sem elas o texto cai numa fonte do sistema e nada deixa de funcionar.

## Quem pode ler e gravar no banco

Está em [`FIREBASE.md`](FIREBASE.md), com as regras prontas para colar em
`firebase-regras-etapa1.json` (a cerca, já em uso) e
`firebase-regras-etapa2.json` (a tranca, depois que o login estiver testado).

## A trava que impede gravar antes de carregar

`CARREGADO` (em `app-gestao/index.html`) só vira `true` no fim do `load()`, e
`persist()`, `gravarAgora()`, `doPublish()` e o sincronizador de fundo se
recusam a rodar antes disso.

Vale saber por quê, porque é a falha mais cara que já apareceu aqui: quando o
servidor do Firebase está inalcançável — wi-fi que pede login na tela, rede
oscilando, pane do Google — o `ref().get()` **não devolve erro**. Ele fica
tentando reconectar e a promessa nunca termina. O `load()` parava no `await`,
o `DB` continuava vazio, e o `visibilitychange` de minimizar o app disparava
uma gravação **desse vazio** por cima do banco bom, no aparelho e na nuvem. A
tela, nesse meio-tempo, dizia "✓ salvo no aparelho".

Duas defesas, porque uma só não bastava:

- **prazo** (`comPrazo`, 6s): a leitura da nuvem sempre termina, e no pior caso
  o app abre com o dado do aparelho;
- **trava** (`CARREGADO`): mesmo que apareça outro travamento no futuro, o pior
  que acontece é o app não salvar — nunca apagar.

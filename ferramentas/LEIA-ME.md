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

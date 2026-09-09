# Produção — o que gerar, em que ordem, por quanto

## Custos reais (medidos na conta, não estimados)

| Peça | Modelo / configuração | Créditos |
|---|---|---|
| Imagem (estilo, personagem, cenário, capa) | imagem em 1k | **1,50** |
| Bloco de vídeo de 10s | vídeo 2K, 9:16 | **20,00** |
| Linha de narração | voz, uma linha | **0,15** |
| Trilha instrumental de 30s | música | **1,88** |

### Orçamento de um episódio de 30 segundos

| Etapa | Quantidade | Créditos |
|---|---|---|
| 3 blocos de vídeo | 3 × 20,00 | 60,00 |
| 3 linhas de narração | 3 × 0,15 | 0,45 |
| 1 trilha | 1 × 1,88 | 1,88 |
| **Total por episódio** | | **≈ 62,35** |

### Orçamento da identidade visual (uma vez só, serve para o canal inteiro)

| Item | Créditos |
|---|---|
| Chave de estilo | 1,50 |
| Personagem Zuzu | 1,50 |
| Personagem Bibi | 1,50 |
| Cenário da clareira | 1,50 |
| Objeto do episódio | 1,50 |
| **Total** | **7,50** |

### Capa

1,50 por capa. A capa é a peça de melhor retorno por crédito do pacote inteiro:
custa 1/40 de um episódio e é o que sustenta a grade do canal.

---

## Ordem das chamadas (a dependência é real, não é preferência)

```
1. chave de estilo ──► 2. assets (personagens, cenário, objeto)
                              │
                              ├──► 3. blocos de vídeo (referenciam os assets)
                              ├──► 4. narração (independente, pode ir junto)
                              └──► 5. trilha (independente)
                                        │
                                        ▼
                              6. montagem + legendas ──► 7. entrega
```

- **A chave de estilo vem primeiro** e é gerada a partir das duas imagens de
  referência do estilo. É ela que trava o traço. Sem ela, cada bloco sai com
  uma cara diferente.
- **Os assets vêm antes dos blocos.** Todo bloco compõe a partir dos assets já
  aprovados, na ordem cenário → personagens → objeto. Bloco gerado só a partir
  do texto perde a identidade do personagem.
- **Narração e trilha não dependem de nada visual** — podem ser geradas em
  paralelo com os blocos.

## Parâmetros que não mudam

| Parâmetro | Valor | Por quê |
|---|---|---|
| Proporção | `9:16` em tudo, **passada explicitamente** | não é herdada da chave de estilo; esquecer entrega vídeo deitado |
| Resolução das imagens | 1k | 4K só encarece; o Short é exibido em 1080 |
| Duração do bloco | 10s exatos | a narração é escrita para caber em 10s |
| Cortes por bloco | 4 | ritmo infantil; menos que isso vira slideshow |
| Volume da trilha | 5%, abaixando sob a voz | acima disso a narração some |

## Checagens antes de publicar

1. **Contar os cortes de cada bloco.** Se algum quadro ficou parado mais de 3
   segundos, o bloco é refeito com os tempos escritos plano a plano.
2. **Nenhum bloco pode abrir parado.** Movimento desde o primeiro quadro.
3. **Boca fechada.** Personagem não fala na tela — ele reage. A voz é sempre de
   fora.
4. **Nenhum texto gerado dentro da imagem.** Toda palavra entra na legenda.
5. **Legenda cronometrada pelo áudio**, nunca pelo roteiro. Legenda escrita "no
   olho" sai fora de sincronia.
6. **Assistir com o som no volume de celular.** É assim que a criança vai ver.

## Se faltar crédito no meio

A ordem de prioridade, do que mais rende para o que menos rende:

1. **Identidade visual** (7,50) — sem ela nada mais se aproveita.
2. **Capa** (1,50) — sustenta a grade e a busca.
3. **Um episódio inteiro** (62,35) — melhor um vídeo completo do que três pela
   metade. Vídeo incompleto não publica e não gera dado nenhum.

Nunca dividir o orçamento entre dois episódios pela metade: dois vídeos
inacabados valem zero, um vídeo pronto vale uma curva de retenção.

## Alternativa mais barata: modo "história em quadros"

Existe um modo em que o vídeo é montado com imagens paradas em sequência rápida
sobre uma narração contínua, em vez de blocos animados. Sai bem mais barato por
segundo, mas tem piso: a montagem exige **pelo menos um quadro a cada 1,5
segundo**, ou seja **20 imagens para 30 segundos** — cerca de **31 créditos**
por episódio, contra 62,35 do animado.

Serve para dobrar o número de vídeos com o mesmo orçamento. O animado continua
melhor para os três primeiros episódios, que são os que definem a cara do
canal.

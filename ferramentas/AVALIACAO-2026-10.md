# Avaliação do app em comparação com o mercado (27/10/2026)

Pedido do João: "avalie o app em comparação no mercado e dê uma nota, para
avaliarmos o quanto ele está bom e o que podemos melhorar". Ele não quer
pagar nada por enquanto (lojas ficam para depois).

**Como as notas foram dadas.** As notas do nosso app vêm do código, dos testes
e das telas. As dos líderes (Tecnofit, Next Fit, ABC Evo/W12) são uma
**estimativa** feita com informação pública (sites, lojas, guias), sem uso real
desses sistemas. Os pesos refletem o que mais importa para uma escola de tênis
pequena.

## Nota

| Critério | Peso | Nosso app | Líderes (estimativa) |
|---|---|---|---|
| App do aluno: agendar, cancelar, repor, saldo, pagar, torneio, evolução, espera, voz | 15 | 9,0 | 8,0 |
| Regras de escola de tênis: crédito por tipo, reposição com validade, família, locação, torneio, chuva, aula fora da quadra | 15 | 9,5 | 6,0 |
| Gestão do professor: agenda, caixa, fechamento, gráficos, desfazer | 10 | 8,5 | 8,5 |
| Cobrança e pagamento | 12 | 5,0 | 9,0 |
| Avisos e lembretes | 8 | 5,0 | 8,5 |
| Facilidade de uso no celular (inclui visual) | 10 | 7,0 | 8,0 |
| Entrada do aluno (cadastro e acesso) | 6 | 6,0 | 8,5 |
| Segurança e privacidade | 8 | 7,0 | 8,0 |
| Confiabilidade (testes, funciona sem internet) | 6 | 8,0 | 8,0 |
| Lojas e instalação | 4 | 5,0 | 9,5 |
| Custo mensal | 4 | 10 | 5,0 |
| Manutenção a longo prazo | 2 | 6,0 | 8,5 |
| **Nota final (média ponderada)** | 100 | **7,4** | **7,9** |

Com os itens 1 a 4 de "O que melhorar", todos sem custo, a nota estimada sobe
para **8,1**: acima da referência dos líderes, sem mensalidade.

## Onde o app já ganha do mercado

- **Feito para tênis.** Os sistemas de academia são genéricos e não têm, por
  exemplo:
  - crédito separado de aula particular e de grupo, com reposição só do mesmo tipo;
  - reposição com validade de 4 meses, gasta na ordem em que entrou;
  - plano família;
  - locação por hora;
  - torneio barragem com ranking;
  - aula cancelada por chuva;
  - aula do professor fora da quadra liberando a quadra.
- **Custo zero por mês.** Os líderes cobram por aluno ativo (Tecnofit: cerca de
  R$ 3,38 por aluno por mês, segundo o site dela) ou a partir de R$ 129 a
  R$ 239 por mês, conforme guias de 2025.
- **Assistente por voz** no app do aluno e na Gestão: recurso raro no segmento.
- **Dados e código são do João.** Ajuste sob medida, sem esperar fornecedor.
- **Testes:** 53 testes automáticos no navegador e 13 checadores rodam antes de
  cada publicação, e toda mudança tem prévia antes de ir ao ar.

## Onde fica atrás

1. **Cobrança manual.** O aluno paga por Pix ou cartão, mas o João confere e dá
   baixa à mão. Os líderes cobram sozinhos todo mês e dão baixa automática.
2. **Avisos com o app fechado ainda desligados.** O servidor está pronto, mas
   faltam o UID do robô e os segredos (`AVISOS-CLOUDFLARE.md`). Hoje o aviso
   depende do app aberto.
3. **Entrada do aluno com atrito.** Ele digita o código e espera o João aprovar
   o aparelho. É seguro, mas os líderes deixam o aluno entrar sozinho.
4. **Segurança em transição.** A regra final do Firebase (`etapa4-estrita`) e o
   App Check ainda não estão ligados, e o repositório é público (código, sem
   dados).
5. **Dívida técnica.** O app do aluno tem 2.380 regras de estilo "forçadas"
   (`!important`) e 5 camadas de redesign empilhadas. Cada ajuste visual briga
   com as anteriores, como se viu nesta semana. A Gestão concentra quase toda
   a lógica num arquivo de 13 mil linhas.
6. **Letras pequenas.** Há 77 tamanhos de letra abaixo de 11 px no app do
   aluno. O João decidiu não mexer mais no visual, então fica só registrado.
7. **Fora das lojas.** É instalado pelo navegador; ir para as lojas tem custo
   (ver `lojas/`).

## O que melhorar, em ordem (sem custo primeiro)

1. **Ligar os avisos com o app fechado:** lembrete de aula e de vencimento
   chegando mesmo com o app fechado. Grátis; falta o UID do robô e os segredos.
2. **Cobrança semiautomática:** lembrete automático de vencimento (3 dias
   antes, no dia e 3 dias depois) por aviso e mensagem pronta no WhatsApp.
   Baixa automática do Pix só com um provedor de pagamento, que cobra taxa:
   fica para depois.
3. **Fechar a segurança:** regra final do Firebase e App Check (grátis; precisa
   da autorização do João e da chave pública).
4. **Entrada por convite:** link enviado pelo WhatsApp que já libera aquele
   aluno, uma vez só e com prazo, sem aprovar aparelho depois.
5. **Limpeza interna sem mudar o visual:** juntar as camadas de estilo numa só,
   conferindo por foto, pixel a pixel, que nada mudou na tela. Menos erros e app
   mais leve.
6. **Medir o uso de forma anônima:** saber quais telas os alunos usam, para
   decidir melhorias com dado.
7. **Matrícula online (crescimento):** página em que o aluno novo se cadastra e
   escolhe o plano, e o João só confirma.
8. **Lojas:** quando o João quiser pagar (`lojas/PASSO-A-PASSO.md`).

## Fontes consultadas
- Tecnofit, preços: https://www.tecnofit.com.br/precos/
- Guia de softwares de academia 2025 (preços de ABC Evo e Fitsoft): https://bjjgirlsmag.com.br/2025/09/11/softwares-para-gestao-de-academias/
- Next Fit, recorrência e Pix: https://enotas.com.br/blog/sistemas-para-academia/
- Next Fit na Google Play: https://play.google.com/store/apps/details?id=br.com.fitastic.appaluno
- LetzPlay (raquete, nota 2,7 na App Store do Brasil): https://apps.apple.com/BR/app/id1262006308
- W12/ABC Evo para quadras: https://w12.com.br/software-para-beach-tennis-e-quadras-esportivas/
- Playtomic Manager: https://playtomic.com/pt/playtomic-manager

# Pagamento integrado (Mercado Pago) e lembretes automáticos

> **Atualização 15/10/2026 (tarde):** o João criou a conta do Mercado Pago e
> **autorizou a mudança de regra do Firebase** para os caminhos novos (pagamentos
> confirmados e tokens de aviso). **Não ativou o Blaze** e pediu opções **sem
> custo adicional por enquanto**. O desenho abaixo (Cloud Functions) fica em
> espera; ver "Caminho sem custo" no fim.

Decisões do João em 15/10/2026: **Mercado Pago**; servidor no **Firebase do
próprio app (plano Blaze)**; pagamento confirmado pelo banco **lança sozinho**
na mensalidade, com registro de quem/quando e opção de desfazer.

## Por que precisa de servidor
O app é estático (GitHub Pages). Duas coisas não podem rodar no celular:
1. **Chave secreta do Mercado Pago** — quem tem a chave cria cobrança e lê
   pagamentos; não pode ir para o código público.
2. **Aviso do banco (webhook) e lembretes com o app fechado** — alguém precisa
   estar "acordado" para receber o aviso e mandar a notificação.
Por isso: Cloud Functions no mesmo projeto Firebase.

## O que só o João pode fazer (contas no nome dele)
1. Firebase → plano **Blaze** (cartão de crédito no Google) e um **alerta de
   gasto** (ex.: R$ 20/mês). No volume da academia o custo esperado é ~zero.
2. Mercado Pago → conta de vendedor e uma **aplicação** em
   "Suas integrações": copiar o **Access Token de produção** e a **chave
   secreta do webhook** (assinatura). Nunca colar essas chaves em mensagem
   pública nem no código.
3. Autorizar a **mudança de regra do Firebase** para os caminhos novos
   (pagamentos confirmados e tokens de aviso), porque mudar regra exige
   autorização explícita (CLAUDE.md).
4. Publicação das funções: pelo terminal com o login dele (`firebase deploy
   --only functions`) ou por uma Action com uma conta de serviço guardada nos
   Secrets do GitHub (ele adiciona o segredo; ninguém vê o conteúdo).

## Desenho previsto
- `criarCobranca` (chamada pelo app do aluno, com o login do Firebase): o
  **valor sai do servidor** (mensalidade do mês no banco), nunca do celular;
  cria Pix (QR e copia e cola) ou link de cartão com
  `external_reference = codigo|AAAA-MM|id`.
- `webhookMercadoPago`: confere a assinatura, busca o pagamento na API do
  Mercado Pago (não confia no corpo do aviso), e se `approved` grava uma vez só
  em `jvtenis/pagamentos_banco/{idMP}` (idempotente).
- Gestão: ao abrir, lança cada pagamento do banco ainda não lançado como
  "Pix confirmado pelo banco" (mesma rotina de "Marcar pago", com versão salva
  antes, registro e botão desfazer). Mensagens ao aluno nunca citam desconto.
- Lembretes: o app do aluno guarda o token de aviso (Firebase Cloud Messaging)
  em `jvtenis/avisos_tokens/{uid}`; uma função agendada (todo dia de manhã, horário
  de Brasília) manda "aula amanhã às …", "mensalidade vence em 3 dias" e
  "vaga liberada" da lista de espera. No iPhone o aviso exige o app instalado
  na Tela de Início (iOS 16.4+).

## Já feito sem servidor
- Lista de espera (15/10): avisa dentro do app e mostra ao João quem avisar
  pelo WhatsApp. Quando os lembretes existirem, o mesmo `DB.espera` vira aviso
  no celular com o app fechado.

## Caminho sem custo (pedido do João em 15/10)
**Já funciona hoje, R$ 0:**
- Pix copia e cola e QR no app do aluno, com o valor certo e a chave do João
  (`pixBRCode`). Pix direto na chave não paga tarifa ao Mercado Pago.
- "Já paguei" manda o aviso para a fila de pedidos. Na Gestão o João toca em
  **Aceitar**, e a mensalidade é lançada com registro (`registrarPagamento`).
- Lembrete automático pela **agenda do celular** (V `2026-10-15-2`). O arquivo
  "aulas do mês" leva os alarmes:
  - cada aula futura avisa 1 dia antes e 1 hora antes;
  - o vencimento da mensalidade avisa 3 dias antes e no dia, às 9h:
    - entra o do mês, se ainda não pagou e não passou, e o do mês que vem;
    - fica fora para dependente da família e para quem tem a mensalidade escondida;
    - o texto não traz valor nem desconto.

  O aviso vem da agenda, então funciona com o app fechado. No iPhone os alarmes
  vêm no arquivo. No Google Agenda vale o aviso padrão da agenda.

**O que ainda exige servidor:** o aviso no celular sem o aluno fazer nada
(push) e o "lança sozinho" (confirmação do banco). Servidores grátis, sem Blaze:
- **Cloudflare Workers, plano gratuito:**
  - não pede cartão;
  - 100 mil acessos por dia, 5 tarefas agendadas por conta e 10 ms de
    processamento por chamada;
  - o código fica no repositório e é publicado por uma Action;
  - segredos guardados na Cloudflare: o token do Mercado Pago e uma conta de
    serviço do Firebase restrita ao Realtime Database e ao Cloud Messaging.
    O Cloud Messaging é grátis em qualquer plano.
- **Google Apps Script**, na conta Google do João:
  - não precisa de conta nova;
  - o código é colado à mão e precisa ser colado de novo a cada mudança;
  - não lê os cabeçalhos do aviso do Mercado Pago, então a confirmação seria
    por consulta a cada poucos minutos;
  - para mandar push, o script precisa usar o projeto do Firebase como
    projeto do Google Cloud.

**Custo que não é do servidor:** o Pix gerado pelo sistema do Mercado Pago,
necessário para a confirmação automática, tem tarifa. A página do link de
pagamento mostra 0,99% (consultado em 15/10/2026). Conferir na conta do João
antes de ligar. Pix direto na chave continua sem tarifa, mas o lançamento
depende do toque do João.

**Recomendação:**
1. Agora: Pix na chave, "Já paguei" e "Aceitar", mais o lembrete pela agenda. Tudo a R$ 0.
2. Se o João quiser o aviso no celular sem custo: Cloudflare Workers só para os
   lembretes, ainda R$ 0. Depende de ele criar a conta.
3. "Lança sozinho" só quando ele aceitar a tarifa do Mercado Pago.

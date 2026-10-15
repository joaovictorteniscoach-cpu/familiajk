# Pagamento integrado (Mercado Pago) e lembretes automáticos

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

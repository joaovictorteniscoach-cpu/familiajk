# Comparação de produto — JV Tênis e Atacante.App

Consulta em 12/11/2026 à [página pública para tênis](https://atacante.app/sistema-para-tenis/).
A página comercial foi lida; não foi feito login, cadastro, contato comercial ou teste de pagamento.
Os itens do Atacante abaixo são anunciados por ele, não uma certificação de funcionamento.

JV analisado na main `66a455948c42ce1906980ae48001b933a65e6246`, versão publicada 2026-11-11-6.
Trabalhos deste branch são separados; não contam como funções já no ar.

| Função | Atacante anuncia | JV hoje |
|---|---|---|
| Agenda do aluno, professor e quadra | Agenda tripla sem conflito | Agenda e mapa compartilhado da quadra com professores; não equivale a motor para várias quadras |
| Reservas e cancelamento pelo aluno | Remarcação dentro da regra | Reservas, próximas aulas, histórico do mês, confirmação/cancelamento com limite de 4 horas; pedidos passam pelo fluxo da academia |
| Particular, grupo, locação e torneio | Aulas, pacotes e locação | Particular exclusiva; dupla/trio/quarteto com 2/3/4; locação/torneio com compartilhamento da mesma atividade |
| App do aluno | Compra e reserva por link/app | PWA instalável, saldo, agenda, aulas, torneio e calendário |
| Pagamento Pix/cartão | Pagamento integrado antecipado | Pix e link de cartão; aviso do aluno e confirmação/registro do recebimento pelo dono |
| Mensalidade recorrente automática | Sim | Não foi identificada integração de cobrança recorrente e confirmação bancária automática |
| Reserva só após pagamento confirmado | Reserva e pagamento no link | Há bloqueio por situação financeira; não há checkout completo com confirmação bancária da reserva |
| Venda de pacotes para novo cliente | Compra no link público | Planos apresentados e cadastro gerido pela academia; não há checkout completo de compra e ativação |
| CRM/campanhas para horários vazios | WhatsApp segmentado e recuperação de alunos | Divulgação de horários e cobranças assistidas; não há motor de campanhas segmentadas com consentimento e medição |
| Atendimento de IA no WhatsApp | Tira dúvidas e envia link de reserva/pagamento | Assistente por voz dentro dos apps; não é atendente autônomo no WhatsApp |
| Indicadores | Ocupação por quadra, professor e horário | Início, financeiro, ocupação e relatórios; aprofundar recorte de receita/ocupação por faixa e professor |
| Várias quadras | Até 3 ou ilimitadas conforme plano | Fluxos atuais tratam a quadra como recurso único; expansão requer quadraId e ocupação por recurso |
| Catraca facial | Integração conforme disponibilidade | Não identificada |
| Plano família | Não detalhado nesta página | Responsável financeiro e dependentes já existem |
| Avaliação/evolução e relatório pedagógico | Não detalhado nesta página | Já existem |
| Torneio/ranking/homenagens | Não detalhado nesta página | Já existem |
| Comandos de voz para o gestor | Não detalhado nesta página | Já existem |

## Preços anunciados na página consultada

- Até 3 quadras: R$ 199/mês.
- A partir de 4: R$ 399/mês, quadras ilimitadas.
- Comissão anunciada de 0% para aula, mensalidade, locação e pacote.
- A própria página informa tarifas do meio de pagamento (Pix/cartão), detalhadas na conversa comercial.
- Sem taxa de adesão anunciada. Não confundir 0% de comissão do sistema com ausência de custos bancários.
- Percentuais promocionais de retorno/IA são alegações comerciais internas, não usados como prova de resultado.

## Prioridade para o JV

1. Concluir a regra de mensalidade fixa e créditos extras com reconciliação, cópia anterior e reversão; não liberar saldos sem prova.
2. Simplificar tarefas frequentes: abrir agenda em Dia; semana com domingo de locação; preservar ícones e visual aprovados.
3. Integrar confirmação bancária antes de automatizar cobrança, baixa e liberação de reserva. Identificador único de cobrança, valor/competência/pagador e tratamento de duplicidade/estorno são pré-requisitos.
4. Cobrança recorrente opcional com consentimento do pagador, cobrança familiar única e separação de extras.
5. Oferta de horários vagos e retorno de alunos, respeitando consentimento; medir ocupação e receita adicional.
6. Atendimento no WhatsApp só depois de estabilizar esses fluxos. A voz dentro do app permanece útil e diferente.

## Diretriz de facilidade pedida pelo João

- Professor: aulas de hoje, presença e pagamento com ação principal clara; ferramentas ocasionais em Mais ações.
- Aluno: próxima aula, créditos e agendamento em destaque; todas as regras explicadas antes de confirmar.
- Um nome visível para saldo: Créditos; extrato explica compra, uso e saldo sem linhas técnicas duplicadas.
- Menos passos para consultar. Mudança de dinheiro, saldo ou cancelamento deve ter conferência proporcional e possibilidade de desfazer.
- Visual e ícones dourados aprovados são preservados. Nenhuma função nova desta comparação foi autorizada automaticamente para implantação.

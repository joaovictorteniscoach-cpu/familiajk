# Agenda do aluno: Google e exportação mensal

## O que está preparado

Estado: versão 2026-10-07-6 em revisão, sem publicação até o João confirmar.

Na tela Minhas aulas:
- **Adicionar ao Google Agenda**, por aula: abre o evento preenchido.
  O aluno escolhe a conta/agenda e toca em Salvar.
- **Salvar horários do mês na agenda**: mostra a lista do mês e gera um único
  arquivo `aulas-AAAA-MM.ics`. Contém as marcações válidas do próprio aluno
  e as presenças registradas do mês; pedidos pendentes e aulas canceladas
  ficam fora. Não há recorrência infinita: cada data é um evento separado.

O aluno não precisa conceder acesso à conta Google para baixar esse arquivo.
Nenhum desses botões faz sincronização automática nem grava eventos pela API.

## Importar todos no Google Agenda

1. No app do aluno, abra **Minhas aulas**.
2. Toque em **Salvar horários do mês na agenda** e confira as datas.
3. Toque em **Baixar horários do mês**.
4. No computador, entre em [Google Agenda](https://calendar.google.com/),
   na conta em que deseja guardar as aulas.
5. Abra **Configurações → Importar e exportar → Importar**.
6. Selecione o arquivo baixado, escolha a agenda de destino e importe.

Referência oficial:
[Importar eventos para o Google Agenda](https://support.google.com/calendar/answer/37118?hl=pt-BR).

No celular, abrir um arquivo ICS depende do aplicativo de agenda instalado.
O Google orienta realizar a importação pelo computador. Para uma aula
individual, o botão Google Agenda continua abrindo o evento para salvar.

Importação não mantém uma conexão com o app. Se o João ou o aluno alterar ou
cancelar uma aula depois, atualizar também o evento externo. Antes de
reimportar, conferir os eventos existentes para evitar duplicação.
IDs estáveis ajudam agendas compatíveis a reconhecer a mesma aula, mas não
garantem que todo importador atualize um evento anterior.

## O login atual não conecta Google Agenda

O app do aluno usa identificação anônima do aparelho no Firebase e código do
cadastro, com aprovação do dispositivo. Não contém vínculo Google nem pedido
de permissão para escrever no Calendar. Entrar com Google em outro app não
autoriza este aplicativo a criar eventos no calendário pessoal.

Para sincronizar automaticamente no futuro seria necessário implementar:
- conexão escolhida por cada aluno e autorização específica do Google Agenda;
- preservação da identidade do aparelho já aprovado ao vincular a conta;
- eventos identificáveis e atualização/cancelamento de eventos já enviados;
- tratamento de permissão revogada, token vencido e conta/agenda de destino;
- serviço autenticado, configuração no Google Cloud e testes no aparelho real.

Essa integração não faz parte da exportação do mês. Nenhuma chave secreta ou
acesso à agenda de um cliente foi solicitado, colocado no site ou utilizado.

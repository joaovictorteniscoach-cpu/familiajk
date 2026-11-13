# Créditos fixos — preparação sem migração automática

Responsável: Codex. Base: `66a455948c42ce1906980ae48001b933a65e6246`.
Decisões: [issue #275](https://github.com/joaovictorteniscoach-cpu/familiajk/issues/275).

## Decisões do João — 13/11/2026 (valem para a implantação de dezembro)

- **Só créditos, sem reposição (palavra proibida nas telas e mensagens novas, pedido do João 13/11).** Aula não feita no
  mês continua como **crédito** do mesmo tipo na virada. O aluno usa os créditos guardados para **agendar aulas a mais**.
  Na passagem de dezembro, o saldo antigo de reposições aparece como "aulas antigas guardadas" e vira crédito.
- **Pacote fixo (João, 13/11: "sem ficar confuso"):** uma lista curta de pacotes; cada aluno escolhe um no cadastro e
  fica com ele até mudar. Básicos: **4, 8 e 12** aulas por mês (8 = dobro do valor do 4; 12 = triplo). Pacotes com
  locação ou com parte em grupo entram na mesma lista, definidos uma vez (aulas particulares, em grupo e locações por mês
  + valor). A renovação soma exatamente o que o pacote dá.
- **Pacotes com locação (4 alunos já usam):** "2 aulas + 2 locações" — o tipo das 2 aulas (particular ou grupo) é escolhido
  no cadastro de cada aluno. Locação vira mais um tipo de crédito dentro do pacote. "3 aulas em grupo" entra na lista
  como o João definir (conferir no backup como esses alunos estão hoje).
- **Cada crédito no seu tipo:** sobra de locação só serve para locação; de aula, só para aula (regra de hoje).
- **Hora de locação além do pacote:** preço de locação da tabela.
- **Quem já tem pacote fora de 4/8/12 fica com o que tem (13/11, após simulação com backup privado):** 2, 3, 6, 7, 10
  aulas ou particular + grupo continuam iguais, sem mudar preço em dezembro. 4, 8 e 12 são o padrão para aluno novo e
  para quem muda pelo app. Na simulação (só leitura, dados fora do repositório): 40 ativos, 8 sem nenhum ajuste,
  23 aulas antigas viram crédito e nenhuma vence na passagem; nenhuma família com saldo compartilhado ligado.
- **Telas aprovadas pelo João (13/11)** na prévia privada. Casos individuais da simulação (saldo a corrigir, tipo das
  aulas antigas de quem faz particular + grupo, família que usa um saldo só, aluno sem aula, pacote de grupo cadastrado
  errado) são resolvidos pelo João: na tela de passagem ele corrige o número final com motivo e escolhe o tipo; família
  com um saldo só usa "Configurar saldo compartilhado" (#279). Tudo fica no extrato, com versão salva e desfazer.
- **Entregas:** 1) antes do fim de novembro: passagem, validade, renovação automática, textos sem "reposição", pacote
  4/8/12 no cadastro e locação no pacote, publicada desligada; o aviso de fim de novembro já fala do modelo novo quando o
  João agendar dezembro. 2) logo depois: "Meus horários fixos" no app do aluno, com o valor na hora.
- **Renovação automática do mesmo pacote (13/11):** o pacote se repete todo mês, mas os créditos do mês só entram quando
  o aluno toca em **Manter** no app ou quando o João registra o pagamento. Nunca duas vezes no mesmo mês.
- **Aviso ao aluno na virada:** "continuar no mesmo pacote ou mudar os horários". O próprio aluno muda os horários fixos
  na agenda e vê o pacote e a mensalidade novos na hora (1x/semana = 4, 2x = 8, 3x = 12).
- **Quando vale a mudança:** no mês seguinte. Se o aluno mudar no começo do mês e ainda não tiver pago, já vale para o
  mês em curso.
- **Preço combinado diferente da tabela:** a mudança vai para o João aprovar; o app não troca sozinho valor combinado.
- **Validade: 6 meses**, contados do mês em que o crédito entrou. Os mais antigos são usados primeiro.
- **Reposições que já existem** viram créditos do tipo delas, com os 6 meses contados da **data original**.
  As que não têm data (de antes do extrato) passam a contar do mês da migração. As já vencidas e retiradas não voltam.
- **Desconto de até 25% acaba** a partir de dezembro: crédito só vale aula. Descontos já aplicados ficam no histórico.
- **Família:** mesmo horário, aula junta; cada aula tira **1 crédito do pacote da família**, venha quem vier.
- **Cancelamento:** regra de hoje. 4 h ou mais de antecedência, o crédito fica; menos de 4 h ou falta, conta como aula dada;
  chuva não desconta.
- **Aula além do saldo** (ex.: 5ª aula sem crédito guardado): valor unitário do plano (mensalidade ÷ aulas do plano).
- **Começo: dezembro de 2026.** A troca é uma ferramenta que o João aciona, com prévia aluno por aluno, versão salva antes
  e desfazer. Nada muda sozinho ao abrir o app.

## Regras implementadas no calculador isolado

- Mensalidade fixa compra X créditos do plano; saldo anterior não reduz essa compra.
- Aula realizada debita; agendada reserva; cancelada não cria crédito adicional.
- Saldo acumulado paga extras. Primeiro as X datas regulares do contrato; quinta data é extra em plano de quatro.
- Cancelar uma das quatro datas libera aquele crédito para a extra, sem reclassificar a quinta data.
- Extra sem saldo usa valor do plano / quantidade, separado por modalidade, com centavos.
- Famílias têm um pagador e consumo explicitamente por pessoa ou sessão. Nunca dividir a mensalidade ou assumir essa escolha.
- Renovação adiciona pacote; mesma competência não entra novamente após renovação individual ou em lote.
- Lotes conservam origem e validade. Validade nova deve ser informada; não há escolha por omissão.
- Nenhuma chamada ao Firebase, nem escrita em cadastro, pagamento ou saldo nos apps.

## Validação

`node ferramentas/testar-creditos-fixos.cjs`: 28 cenários, incluindo 600 combinações de conservação.
Também cobre duplas, trios, quartetos, família, pacotes mistos, ano novo, renovação repetida e valores fracionários de centavo.
Os exemplos são fictícios. Consistência da fórmula não prova saldos reais.

## Bloqueios para ativação real

1. Obter extrato completo e saldo anterior ao período auditado no ambiente autenticado do dono. Não publicar esses arquivos.
2. Identificar lotes antigos por modalidade, origem e validade. Resumo de extrato não prova a data; saldo de abertura nunca é zero presumido.
3. Conferir os recebimentos: status parcial legado não é comprovante de metade da mensalidade.
4. Confirmar consumo familiar por pessoa ou sessão e preço separado de cada parte dos pacotes mistos.
5. Integrar o modelo a TODOS os caminhos: presença e estorno, chuva, cancelamento, renovação individual/lote/virada, cadastro, comandos por voz, pedidos, cobrança, publicação privada e app do aluno.
6. Executar a integração completa com SDK e emulador, testar aparelho antigo/sessões concorrentes, revisar imagem da tela.
7. Mostrar prévia por conta, salvar cópia anterior confirmada, verificar fonte inalterada e permitir desfazer antes de ativar.

**Estado: calculador e auditor escritos; não integrados às operações dos aplicativos.** Não existe botão de ativação.
Não migrar cadastros com pendências. O auditor sempre retorna `podeMigrar:false`: ele lista indícios, não comprova pagamento nem corrige histórico.
A proposta não reativa os estudos antigos de descontos de 25%/50% ou mensalidades mínimas.

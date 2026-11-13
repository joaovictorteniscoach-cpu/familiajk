# Créditos fixos — preparação sem migração automática

Responsável: Codex. Base: `66a455948c42ce1906980ae48001b933a65e6246`.
Decisões: [issue #275](https://github.com/joaovictorteniscoach-cpu/familiajk/issues/275).

## Decisões do João — 13/11/2026 (valem para a implantação de dezembro)

- **Só créditos, sem reposição.** O que sobra no mês continua como crédito do mesmo tipo (particular ou grupo).
- **Planos:** 4 créditos por mês em todo plano; opção de **8 aulas pelo dobro do valor**. No misto, cada parte tem 4 ou 8.
- **Pacotes com locação (4 alunos já usam):** "2 aulas + 2 locações" — o tipo das 2 aulas (particular ou grupo) é escolhido
  no cadastro de cada aluno. Locação vira mais um tipo de crédito dentro dos 4 (ou 8). Há também "3 aulas em grupo";
  **falta confirmar** se fecha com 1 locação, 1 particular ou se é plano de 3.
- **Cada crédito no seu tipo:** sobra de locação só serve para locação; de aula, só para aula (regra de hoje).
- **Hora de locação além do pacote:** preço de locação da tabela.
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

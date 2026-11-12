# Créditos fixos — preparação sem migração automática

Responsável: Codex. Base: `66a455948c42ce1906980ae48001b933a65e6246`.
Decisões: [issue #275](https://github.com/joaovictorteniscoach-cpu/familiajk/issues/275).

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

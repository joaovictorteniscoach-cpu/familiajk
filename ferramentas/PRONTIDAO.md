# Preparação profissional dos aplicativos

Atualizado em 07/10/2026. Este roteiro distingue o que foi publicado, o que
depende de configuração externa e o que ainda precisa de validação.

## Recursos já publicados
Créditos e reposições em destaque; plano família com pagador único;
pagamento parcial por valor real; fechamento e cadastro sincronizados;
filtro de ativos pendentes/parciais; ordem alfabética; contraste; cópias
automáticas e proteção de gravação entre sessões.

## Renovação sem duplicar
Em **Renovar o mês**, a caixa marcada inclui o aluno; desmarcada preserva
tudo. Quem já foi renovado no mês fica bloqueado, mesmo se os créditos foram
consumidos depois. O registro também cobre saldo igual ao pacote e extrato arquivado.

Ajustes manuais de créditos, grupo ou reposições no cadastro durante o mês
pedem conferência e ficam fora do lote. Escolha **Já renovei manualmente**
para preservar os saldos e marcar o mês como concluído. Se foi somente uma
correção, escolha **Foi só correção · conferir renovação** e marque a caixa
apenas após conferir a prévia. Uma nova correção volta a exigir conferência.

Se o ajuste antigo não tiver registro no extrato, use **Já renovei manualmente ·
manter saldos** antes do lote. Não há reconstrução automática de valores.
A marca vale para o mês corrente; no mês seguinte o aluno volta à avaliação.

## Reservas particulares e grupo
Horário particular, personal ou bloqueio não aceita outra pessoa.
**Dupla, trio e quádrupla** admitem até dois, três e quatro alunos; locação e torneio admitem participantes
na mesma atividade, sem misturar tipos no horário. O aluno relê a grade online
antes de enviar. Locação continua como pedido ao João para confirmação;
não cria outra cobrança nem confirmação automática.

Pedidos particulares usam criação única na fila já protegida pelo Firebase;
duas tentativas simultâneas não sobrescrevem a mesma vaga. Um pedido fixo
protege as ocorrências na janela de 90 dias, com gravação atômica. A Gestão
também verifica as datas futuras conhecidas antes de criar um horário fixo.
A fila só é confirmada após a gravação durável da agenda; cancelar libera a
vaga depois da confirmação. A Gestão volta a conferir pedidos de apps antigos.

O envio é um pedido; a confirmação aparece na agenda. Uma recusa por
indisponibilidade chega somente ao próprio aluno no bloco privado.
Nenhuma reserva antiga foi removida automaticamente e as regras não mudaram.

## Etapa atual
- **App Check:** ativação autorizada pelo João; falta a chave pública e o
  registro do provedor no console. Iniciar em monitoramento. A exigência
  depende de adaptar as leituras REST do site e do teste de conexão.
  Veja [APP-CHECK.md](APP-CHECK.md).
- **Documentos:** guia de instalação atualizado para autenticação e banco
  bloqueado, operação e privacidade alinhadas com os recursos atuais.
- **Recuperação:** ensaio automatizado de backup, restauração, desfazer, importação de arquivo e cópia anterior confirmada no
  emulador, com dados fictícios. O resultado vem do check do PR; nenhuma
  restauração de produção faz parte desse ensaio.
- **Monitoramento:** workflow confere arquivos públicos após a publicação
  no Pages e a cada seis horas. Verifica HTTP, versão dos apps, JavaScript,
  service workers e folhas de estilo. Não consulta o Firebase e não captura
  nomes, valores ou outros dados dos alunos.

## Concluir a migração de acessos
1. Leia a regra realmente publicada no console; o Git não comprova isso.
2. Confira **Mais → Segurança e dados → Pronto para a regra final?**.
3. Confirme individualmente os aparelhos ainda pendentes.
4. Só com migração concluída, revisão e autorização explícita, publique a
   etapa 4. Veja [SEGURANCA-P0.md](SEGURANCA-P0.md).

A preparação do App Check não altera a etapa das regras.

## Acompanhar o monitor
Abra [Actions → Monitorar aplicativos publicados](https://github.com/joaovictorteniscoach-cpu/familiajk/actions/workflows/monitorar-publicacao.yml).
Uma falha deixa o workflow vermelho e informa a URL e o tipo de problema.
Configure no seu GitHub o recebimento de avisos de falhas de Actions.
Não foi conectado um serviço externo de e-mail, WhatsApp ou coleta de erros.

O monitor prova a disponibilidade dos arquivos públicos. Não comprova login,
regras, gravações, integridade do banco nem funcionamento em todos os
aparelhos. Os testes do PR cobrem os fluxos com dados fictícios.

## Recuperação em incidente real
Preserve o armazenamento do aparelho. Confira conta, conexão e confirmação
de nuvem. Exporte a cópia local antes de restaurar, compare a versão escolhida
e confira os números. Não reabra regras do banco para recuperar dados.
Uma cópia externa periódica sob controle do responsável continua recomendada;
o monitor público não garante a existência de backups do banco.

## Próximas configurações
- Adaptar os clientes REST e avaliar a exigência do App Check após as métricas.
- Completar os vínculos e confirmar a etapa final das regras.
- Configurar continuidade pelo Codex na nuvem.
- Definir automatização de cópia externa e, se desejado, coleta de erros de
  execução com minimização de dados.
- Avaliar integração bancária para confirmação automática de Pix.

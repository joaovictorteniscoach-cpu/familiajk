# Preparação profissional dos aplicativos

Atualizado em 06/10/2026. Este roteiro distingue o que foi publicado, o que
depende de configuração externa e o que ainda precisa de validação.

## Recursos já publicados
Créditos e reposições em destaque; plano família com pagador único;
pagamento parcial por valor real; fechamento e cadastro sincronizados;
filtro de ativos pendentes/parciais; ordem alfabética; contraste; cópias
automáticas e proteção de gravação entre sessões.

## Etapa atual
- **App Check:** ativação autorizada pelo João; falta a chave pública e o
  registro do provedor no console. Iniciar em monitoramento. A exigência
  depende de adaptar as leituras REST do site e do teste de conexão.
  Veja [APP-CHECK.md](APP-CHECK.md).
- **Documentos:** guia de instalação atualizado para autenticação e banco
  bloqueado, operação e privacidade alinhadas com os recursos atuais.
- **Recuperação:** ensaio automatizado de backup e restauração completa no
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

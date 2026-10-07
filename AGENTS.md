# Orientações comuns para agentes

Este repositório é mantido com Codex e Claude Code. O guia comum de produto,
segurança e publicação é [CLAUDE.md](CLAUDE.md), independentemente do agente.

Antes de editar:
1. Leia CLAUDE.md e [o registro de mudanças](ferramentas/REGISTRO-MUDANCAS.md).
2. Confira a main atual e os PRs abertos: título, arquivos, versão e estado dos testes.
   Mudanças ainda não publicadas não devem ser descritas como já disponíveis.
3. Trabalhe em um branch próprio, baseado na main atual. Preserve mudanças
   concorrentes. Se um PR aberto toca o mesmo fluxo, registre a dependência
   e prepare a integração; não substitua os arquivos por uma cópia antiga.
4. Siga a autorização e as preferências já dadas pelo João. Uma aprovação
   específica registrada em outro PR não se transfere automaticamente a outro
   conjunto de mudanças. Não peça novamente uma autorização já dada na sessão.
5. Antes de integrar, confira novamente a main, os PRs concorrentes, o diff e
   o resultado dos testes do commit exato. Conflitos de comportamento também
   precisam ser revistos quando o GitHub informa que o merge está limpo.

Ao terminar, acrescente ao registro: responsável, branch/PR, base usada,
o que mudou, testes, versão realmente publicada e pendências.
Separe explicitamente proposta, implementado, testado e publicado.
Conversa particular ou trabalho ainda não enviado ao GitHub não é visível
para o outro agente. Este guia e o registro são o ponto comum de consulta;
não representam comunicação automática entre as conversas.

Para a proposta de comandos por voz, leia
[ferramentas/ACOES-POR-VOZ.md](ferramentas/ACOES-POR-VOZ.md).

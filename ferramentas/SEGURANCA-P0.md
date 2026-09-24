# Segurança P0 — App Gestão + App Aluno

## Migração com confirmação de identidade

A Gestão reúne os aparelhos que pediram acesso, mas **não aprova nenhum deles automaticamente só porque o código de 4 dígitos existe**. Na etapa de transição o blob legado ainda pode revelar esses códigos a usuários autenticados, portanto cada novo UID deve ser aprovado individualmente somente depois de confirmação externa com o aluno (por exemplo, WhatsApp). Nenhum plano, crédito, agenda ou avaliação precisa ser recadastrado.


## Objetivo

Separar **identificação** de **autorização**. O código de 4 dígitos continua simples para o aluno, mas deixa de ser a credencial que libera dados. O acesso privado passa a depender do UID anônimo do Firebase, aprovado uma vez na Gestão.

## Arquitetura nova

```text
jvtenis/
  jvtenis-app-publico/       # dados compartilhados sem cadastro financeiro/técnico individual
  aluno_vinculos/<uid>/      # aparelho autorizado -> aluno
  alunos_privados/<uid>/     # cadastro privado visível somente ao próprio uid
  fila_vinculos/<uid>/       # novo aparelho pedindo autorização
```

A publicação compartilhada leva agenda somente como estado operacional **ocupado/bloqueio** (e o motivo controlado `chuva` quando aplicável), sem nome/código, categoria pessoal ou motivo livre. O bloco privado leva apenas o cadastro do aluno vinculado, histórico, horários próprios, avaliações, pagamento e demais dados individuais.

## O que foi alterado

- App do Aluno tenta primeiro a publicação segura e o bloco privado do próprio UID.
- Se o aparelho ainda não estiver vinculado, cria um pedido em `fila_vinculos/<uid>`.
- Na fase de transição, o app ainda pode usar o blob legado **somente online**, para não interromper o funcionamento enquanto os aparelhos são aprovados.
- Assim que a arquitetura nova é detectada, o cache legado com a lista completa é apagado do aparelho.
- Gestão ganhou painel **Acessos do App do Aluno** para aprovar individualmente, recusar e revogar aparelhos; o código sozinho nunca dispara aprovação em lote.
- Gestão publica automaticamente o bloco privado de cada aparelho autorizado.
- Toda fila passa a carregar `uid` + `codigo`.
- Gestão ignora pedidos cuja identidade não esteja vinculada.
- Agendamento é revalidado pela agenda oficial antes de ser aplicado; pedido inválido é descartado.
- `aluno-estado/<uid>` ganhou limite de tamanho.
- `mapa_quadra` deixa de ser legível por qualquer aluno anônimo e fica restrito a administrador/professores.

## Publicação segura em duas fases

### Fase A — transição (PUBLICAR AGORA, depois de subir os arquivos novos)

Arquivo:

`ferramentas/firebase-regras-etapa3-transicao.json`

Ela cria os novos caminhos e garante que o `uid` enviado em cada fila seja o mesmo UID autenticado. O blob antigo `jvtenis-app-aluno` continua legível temporariamente para que os aparelhos ainda não aprovados não parem de funcionar.

### Fase B — fechamento final

Arquivo:

`ferramentas/firebase-regras-etapa4-estrita.json`

Use somente depois que os aparelhos ativos dos alunos estiverem autorizados. Nessa fase:

- aluno não lê mais `jvtenis-app-aluno`;
- fila só aceita pedido se `auth.uid` estiver com vínculo ativo;
- `codigo` do pedido precisa ser exatamente o código do aluno vinculado àquele UID.

## Ordem recomendada

1. Publicar `app-gestao/index.html` e `app-aluno/index.html` novos.
2. Abrir a Gestão e confirmar que a versão mostra `2026-09-24-1`.
3. Publicar `firebase-regras-etapa3-transicao.json` no Realtime Database.
4. Na Gestão: Financeiro → Segurança → **Testar conexão**.
5. Pedir para 1 aluno piloto abrir o App do Aluno e entrar normalmente.
6. Na Gestão, aprovar o aparelho em **Acessos do App do Aluno**.
7. Confirmar: saldo, agenda, evolução, pagamento, pedido de agendamento e cancelamento.
8. Repetir a vinculação gradualmente com os demais alunos.
9. Quando os aparelhos ativos estiverem vinculados, publicar `firebase-regras-etapa4-estrita.json`.
10. Rodar novamente **Testar conexão**.

## App Check

App Check continua recomendado, mas entra **depois** desta migração. Primeiro ativar em modo de monitoramento, observar métricas e só então habilitar enforcement. Ele complementa o vínculo UID→aluno; não substitui autenticação/autorização.

## Verificação local

```sh
sh ferramentas/checar-tudo.sh
```

O pacote P0 foi preparado com sintaxe JS válida, carimbo igual nos dois apps e checagem estática dos controles críticos.

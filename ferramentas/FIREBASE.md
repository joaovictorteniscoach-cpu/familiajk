# Firebase — Academia JV Tênis

Projeto: **academia-jv-tenis**. Banco: **Realtime Database**.
Antes de qualquer alteração, confira a aba **Regras** no console e guarde uma
cópia do que está publicado. Um arquivo do Git não comprova a regra vigente.

## Estado e arquivos

O responsável informou que publicou a transição P0. A revisão de publicação
de 29/09/2026 não acessou o console autenticado para confirmar essa informação.
Não trocar regras com base somente neste documento ou no resultado dos checkers.

| Arquivo | Uso |
|---|---|
| `firebase-regras-etapa1.json` | histórico permissivo; **não usar para recuperação** |
| `firebase-regras-etapa2.json` | histórico anterior à migração P0 |
| `firebase-regras-etapa3.json` | referência dos testes anteriores à migração P0 |
| `firebase-regras-etapa3-transicao.json` | transição P0 informada pelo responsável |
| `firebase-regras-etapa4-estrita.json` | etapa futura; exige migração concluída e autorização explícita |

A etapa 1 permite leitura e escrita públicas em caminhos sensíveis. Publicá-la
para resolver um erro de acesso reabre essa exposição. Regras não apagam dados
diretamente, mas podem permitir alterações indevidas ou bloquear o funcionamento.

## Acesso dos alunos

O código de quatro dígitos é um localizador, não uma autorização. Cada aparelho
recebe UID anônimo e pede vínculo em `fila_vinculos/<uid>`. A Gestão confirma a
identidade por canal externo e aprova **cada aparelho individualmente**.

`aluno_vinculos/<uid>` registra o vínculo e `alunos_privados/<uid>` publica os
dados individuais. `jvtenis-app-publico` contém dados compartilhados sanitizados.
Na transição, o acesso legado ainda pode existir; a etapa final o fecha.
Não publicar a etapa final nesta correção de hospedagem.

## Erro de acesso à nuvem

1. Não reinstale o app nem limpe seu armazenamento. Exporte o backup local se
   a interface permitir e guarde a mensagem de erro.
2. Confira a internet, o endereço usado e a versão mostrada no app.
3. Confira se a Gestão está conectada com a conta autorizada da academia.
4. No console, leia a regra vigente e confira o UID autorizado em
   **Authentication → Users**. Não substitua regras nem recrie usuários para testar.
5. Diferencie falha de rede de `PERMISSION_DENIED`. A leitura de um caminho
   protegido sem autenticação pode ser recusada normalmente; isso não comprova
   perda de dados. Confirmar os dados privados exige acesso autorizado ao banco.
6. Se o problema começou após uma mudança de regras, compare com a cópia
   anterior validada. Qualquer restauração exige revisão e autorização; nunca
   use uma etapa antiga mais permissiva como atalho.

O botão **Testar conexão** da Gestão não é somente leitura: faz gravações e
remoções temporárias e usa uma sessão anônima de teste. O resultado deve ser
interpretado conforme a regra realmente publicada; não fixa uma etapa vigente.

## Validação local

```sh
bash ferramentas/checar-tudo.sh
```

A suíte testa os arquivos de regras, a segurança P0 no código, a arquitetura
modular e regressões dos apps. Não publica regras, não lê os dados privados da
nuvem e não comprova a integridade do banco em produção.

Detalhes do vínculo: [`SEGURANCA-P0.md`](SEGURANCA-P0.md).

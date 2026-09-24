# Segurança P0 — identidade do App do Aluno

O código de 4 dígitos localiza o cadastro, mas não autoriza acesso. O acesso privado depende do UID anônimo do Firebase, aprovado individualmente pela Gestão depois de confirmação externa com o aluno (por exemplo, WhatsApp).

A implementação preserva a arquitetura modular atual: `app-gestao/index.html` continua leve e a lógica fica em `app-gestao/lib/app-gestao.js`.

## Caminhos
```text
jvtenis-app-publico/       # compartilhado, sem cadastro individual
aluno_vinculos/<uid>/      # UID autorizado -> aluno
alunos_privados/<uid>/     # dados privados daquele UID
fila_vinculos/<uid>/       # solicitação de novo aparelho
```

A grade compartilhada contém apenas ocupado/bloqueio e, quando aplicável, o motivo controlado `chuva`. Nome, código, categoria pessoal e motivo livre ficam fora.

## Migração
1. Publique os apps com o mesmo carimbo.
2. Publique `firebase-regras-etapa3-transicao.json`.
3. Confirme externamente cada novo aparelho e aprove individualmente. Não existe aprovação em lote apenas pelo código.
4. Depois de migrar os aparelhos ativos, publique `firebase-regras-etapa4-estrita.json`.

Na fase final, o blob legado fecha para alunos e as filas exigem UID vinculado + código correspondente.

## Verificação
```sh
bash ferramentas/checar-tudo.sh
```
A suíte mantém os testes atuais, inclusive multi-professor, e acrescenta os casos P0.

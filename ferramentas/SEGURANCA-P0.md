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
2. Confira a regra vigente no console. A transição `firebase-regras-etapa3-transicao.json` foi informada pelo responsável; qualquer alteração exige revisão e autorização.
3. Confirme externamente cada novo aparelho e aprove individualmente. Não existe aprovação em lote apenas pelo código.
4. Depois de migrar os aparelhos ativos, a publicação de `firebase-regras-etapa4-estrita.json` exige revisão e autorização explícita. Não publicar nesta etapa.

Na fase final, o blob legado fecha para alunos e as filas exigem UID vinculado + código correspondente.

## Publicar a etapa 4 (só com autorização do João)
O código dos apps já está pronto para a regra estrita (conferido em 2026-10-02):
toda fila do App do Aluno vai com `uid` e `codigo`, o aparelho não aprovado só
vê o aviso "aguarde o João aprovar", e o teste de conexão continua válido. O que
decide é a migração dos aparelhos.

1. Gestão → Segurança → caixa **"Pronto para a regra final?"**. Só siga com o ✓
   ("Os N alunos ativos têm aparelho aprovado") e sem aviso de código fora do padrão.
2. Console do Firebase → Realtime Database → **Regras**: copie a regra atual e
   guarde (é o caminho de volta; deve ser igual a `firebase-regras-etapa3-transicao.json`).
3. Cole o conteúdo de `firebase-regras-etapa4-estrita.json` e **Publique**.
4. Gestão → Ferramentas → **Testar conexão**, e peça a um aluno para abrir o app
   e marcar um horário.
5. Deu errado? Cole de volta a regra guardada no passo 2 e publique. Regra só
   controla acesso: nenhum dado se perde ao ir ou voltar.
6. Depois, atualizar o CLAUDE.md: a regra publicada passa a ser a etapa 4.

## App Check (proteção contra robôs) — código pronto, desligado
Os dois apps carregam `lib/firebase-app-check-compat.js` (10.12.2, mesma versão
das outras bibliotecas) e chamam `ligarAppCheck()` logo depois de iniciar o
Firebase. Com `APPCHECK_SITE_KEY=''` (em `app-aluno/index.html` e
`app-gestao/index.html`) nada acontece.

Para ligar:
1. Google Cloud / reCAPTCHA: criar uma chave **reCAPTCHA v3** com os domínios
   `joaovictorteniscoach-cpu.github.io`, `appalunos.netlify.app` e
   `academiatenisjv.netlify.app`.
2. Firebase → App Check → Apps → app web → registrar com o provedor reCAPTCHA v3
   (chave secreta vai só no console).
3. Colar a chave do **site** (pública) em `APPCHECK_SITE_KEY` nos dois apps e
   publicar.
4. Deixar alguns dias em "monitorar" (Firebase → App Check → Realtime Database)
   e só depois **Impor/Enforce**.

Atenção ao impor:
- o site lê `precos_publicos/status_quadra` pela URL REST, sem App Check: com a
  exigência ligada no Realtime Database, o status da quadra some do site;
- o **Testar conexão** da Gestão cria uma segunda instância do Firebase para
  simular o aluno, sem App Check: os passos de aluno passam a falhar no teste
  (o app real do aluno continua funcionando).

## Verificação
```sh
bash ferramentas/checar-tudo.sh
```
A suíte mantém os testes locais, inclusive multi-professor e casos P0. Ela não consulta nem comprova as regras publicadas no Firebase.

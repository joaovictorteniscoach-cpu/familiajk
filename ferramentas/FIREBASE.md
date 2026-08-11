# Regras do banco de dados (Firebase)

As regras dizem **quem pode ler e quem pode gravar** no banco. Elas ficam em
`console.firebase.google.com` → projeto **academia-jv-tenis** → *Realtime
Database* → aba **Regras**. As cópias aqui existem para que elas não vivam só
no painel: se alguém trocar por engano, é só colar de volta.

Trocar as regras **não é arriscado**: nada é apagado, e voltar atrás leva
10 segundos na mesma tela. O acesso ao painel é pela conta Google do João e não
depende do app.

## As duas etapas

| Arquivo | O que faz | Precisa de quê |
|---|---|---|
| `firebase-regras-etapa1.json` | fecha a raiz e lista os caminhos que existem | nada |
| `firebase-regras-etapa2.json` | só o João grava; aluno só acrescenta | login criado e testado |

### Etapa 1 — a cerca

Antes: `.read` e `.write` valendo `true` na raiz. Qualquer pessoa com o endereço
do banco baixava **tudo** num pedido só (`.../jvtenis.json`) e podia apagar
tudo. Pior: podia **gravar** qualquer coisa em qualquer lugar — e um estranho
usando o banco como depósito estoura a cota do plano gratuito, o que derruba o
app sem o João ter feito nada.

Depois: a raiz fica fechada e só os 14 caminhos que os apps realmente usam
existem. Acaba o despejo num pedido só e acaba o depósito.

O que **não** resolve: quem souber o nome de um caminho continua lendo e
apagando. É uma cerca, não uma tranca — porque sem login **nenhuma regra
consegue distinguir o app do João do navegador de um estranho**: a chave do
banco está escrita na página, que é pública por necessidade (senão o app do
aluno não abriria).

### Etapa 2 — a tranca

Depende de duas coisas no painel:

1. **Authentication → Sign-in method**: ativar **E-mail/senha** e **Anônimo**.
2. **Authentication → Users → Add user**: criar a conta do João (e-mail e
   senha). Copiar o **UID** que aparece na lista.

Depois entrar no app da Gestão em *Financeiro → Segurança → Sua conta* e
confirmar que aparece **✅ Conectado**. Só então trocar as regras, substituindo
os `COLE_AQUI_O_UID_DO_JOAO` pelo UID copiado (são 14 lugares — usar
"substituir tudo" do editor, ou colar já trocado).

Quem pode o quê, depois disso:

| Caminho | João logado | App do aluno | Site público | Qualquer outro |
|---|---|---|---|---|
| `precos_publicos` | grava | lê | **lê** | lê |
| `jvtenis-app-aluno` (publicação) | grava | lê | — | nada |
| `jvtenis-gestao-v1`, `v2`, `arquivo`, `backups` | tudo | nada | — | nada |
| `notificacoes`, `fila_*` | lê e apaga | **só acrescenta** | — | nada |
| `fila_cadastros` | lê e apaga | — | **só acrescenta** | nada |
| `jvt-aluno-meu-<código>` | — | lê e grava | — | nada |

"Só acrescenta" é a regra `!data.exists()`: dá para criar um item novo, nunca
alterar ou apagar um que já existe. Então um aluno manda o pedido dele, mas não
lê nem apaga o pedido dos outros.

`fila_cadastros` é o formulário de contato do site, que é anônimo por
natureza — fica aberto para criar, fechado para ler. Igual a qualquer
formulário de contato da internet.

`precos_publicos` existe justamente para isso: o site precisava dos três preços
de grupo e, para pegá-los, lia a **publicação inteira** — que tem nome, código
e saldo de todos os alunos. Agora ele lê um nó de três números, e a publicação
pode ficar fechada.

## Conferir as regras antes de publicar

```sh
python3 ferramentas/checar-regras.py                       # etapa 2 (padrão)
python3 ferramentas/checar-regras.py ferramentas/firebase-regras-etapa1.json
```

Simula as regras contra **as 79 operações que os apps realmente fazem** — as que
têm de funcionar e as que têm de continuar bloqueadas. Regra errada não dá erro
na tela: o app só para de gravar e diz "salvo só no aparelho", ou o pedido do
aluno nunca chega. Daí o script.

Rodando contra as regras antigas (`.read`/`.write` na raiz), ele acusa 25
falhas, entre elas "baixar tudo" e "apagar tudo" — é assim que se sabe que ele
está mesmo conferindo, e não só dizendo que está tudo bem.

## Se algo parar de funcionar depois de trocar

O sintoma é sempre o mesmo: o app abre, mostra os dados do aparelho e avisa
`⚠ salvo só no aparelho`. **Nenhum dado se perde** — o app trabalha local e
sobe quando voltar. Para voltar atrás, cole o `etapa1.json` e publique.

Vale conferir, nessa ordem:

1. *Financeiro → Segurança → Sua conta* mostra **✅ Conectado**?
2. O UID nas regras é o mesmo que aparece em *Authentication → Users*?
3. Em *Sign-in method*, **Anônimo** está ativado? (sem ele o app do aluno não
   se identifica e para de mandar pedidos)

## Por que o login não pode ser obrigatório

O app precisa continuar abrindo e salvando **mesmo sem login e mesmo sem
internet** — é o que garante que nunca falte acesso aos dados. Por isso o
código trata a identificação como algo que *pode falhar*: espera no máximo 5
segundos, e o que não der certo não impede nada. Com as regras da etapa 2, o
que acontece sem login é o app trabalhar só no aparelho até conseguir entrar.

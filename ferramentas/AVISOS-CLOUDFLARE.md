# Avisos no celular com o app fechado (Cloudflare, grátis)

Pedido do João em 15/10/2026: lembrete automático sem custo, sem plano Blaze.

## O que o aluno e o João recebem
- **Aluno:**
  - "🎾 Aula amanhã às 18:00", às 19h da véspera. Vale também para aula em
    grupo, treino, locação e torneio ("🏆 Jogo do torneio amanhã às …").
  - "Sua mensalidade do tênis vence em 3 dias", "vence hoje" no dia e, 3 dias
    depois, "Lembrete: sua mensalidade do tênis venceu no dia X" (27/10), às 9h.
    Só para quem está pendente; quem paga sai da lista.
  - "🔔 Vaga liberada", quando abre um horário da lista de espera. À noite, o
    aviso espera até as 7h.
  - O responsável da família recebe os avisos do dependente com o nome dele.
- **João:** "💰 Fulano avisou pagamento da mensalidade" quando chega um pedido
  (o "Já paguei"), para aceitar logo.
- **Os textos nunca trazem valor nem desconto.** Nada muda em agenda, créditos
  ou valores. Os avisos só dizem o que já está na agenda.

## Como funciona
- **Gestão:** prepara os avisos dos próximos 3 dias em `jvtenis/avisos_saida`.
  - Só faz isso com o servidor ligado e o banco confirmado.
  - Grava de novo só quando alguma coisa mudou.
- **Servidor** (`servidor-avisos/`, Cloudflare Workers, plano grátis): roda a
  cada 2 minutos.
  - Entrega cada aviso cuja hora chegou para os aparelhos aprovados do aluno.
  - Anota em `avisos_enviados` o que já foi, para não repetir. A anotação é
    por aparelho (`<aviso>~<uid>~<app>`): se um aparelho recebe e outro dá erro
    passageiro (429, serviço fora), só o que falhou tenta de novo. O aviso
    fecha (`<aviso>`) quando não sobra aparelho por entregar.
  - Grava `avisos_estado` com a hora da rodada e a chave pública de push.
  - O padrão é o Web Push do próprio navegador (Chrome, Safari, Firefox). Não
    usa biblioteca de fora.
  - Entra no Firebase como **usuário robô** (e-mail e senha só dele). Escolha
    do João em 15/10, no lugar da chave de serviço:
    - é fácil de fazer no celular;
    - se a senha vazar, o estrago fica nos avisos. A chave de serviço mandaria
      no banco inteiro.
- **Aparelho:** quem toca em "Ativar avisos" com o servidor ligado é inscrito.
  - No app do aluno o botão fica no Perfil. Na Gestão, no sininho.
  - O endereço de aviso fica em `avisos_tokens/<uid>/aluno` ou `/gestao`.
  - Sem servidor, o botão faz o que sempre fez (aviso só com o app aberto).
  - **iPhone:** só com o app na Tela de Início (iOS 16.4 ou mais novo).
- **Custo zero:**
  - O plano grátis da Cloudflare dá 100 mil acessos por dia e 5 tarefas no relógio.
  - Cada rodada usa ~3 a 4 ms de processamento, medido no motor da Cloudflare
    (`workerd`) com 6 avisos. O limite é 10 ms.
  - Com isso, no máximo 6 envios (aparelhos) por rodada: 180 por hora. Um
    aviso com mais aparelhos manda 6 e o resto na rodada seguinte.
  - Leitura do Firebase: só os avisos que já estão na hora, e os vínculos
    guardados por 30 min. Fica bem abaixo da cota grátis.

## Passo a passo do João (tudo pelo celular)
Use o navegador do celular (Chrome ou Safari). O app do GitHub não tem estas
telas. Se alguma página vier cortada, use o menu do navegador → **Versão para
computador**. Tenha uma nota aberta para colar os códigos; apague a nota no fim.

**A. Cloudflare (conta grátis, não pede cartão)**
1. Abra **dash.cloudflare.com/sign-up** e cadastre e-mail e senha. Confirme o
   e-mail que chegar.
2. **Account ID:** depois de entrar, olhe o endereço no navegador. O código de
   32 letras e números logo depois de `dash.cloudflare.com/` é o Account ID.
   Copie para a nota.
3. **Token:**
   - Toque no ícone de pessoa no alto → **Perfil** → **API Tokens** →
     **Create Token**.
   - No modelo **Edit Cloudflare Workers**, toque **Use template**.
   - Em "Account Resources", escolha a sua conta. Em "Zone Resources",
     escolha **All zones**.
   - Toque **Continue to summary** → **Create Token** → **Copy**. Cole na nota.
     O token só aparece uma vez.

**B. Usuário robô do Firebase**
1. Abra **console.firebase.google.com** → projeto **academia-jv-tenis** →
   **Authentication** → aba **Users** → **Adicionar usuário**.
2. E-mail: `avisos@academia-jv-tenis.firebaseapp.com`. Ninguém recebe e-mail
   nesse endereço; é só o nome do robô.
3. Senha: pelo menos 12 caracteres, por exemplo 4 palavras e números. Anote
   na nota.
4. Na lista de usuários, copie o **UID do usuário** do robô e mande ao Claude.
   O UID não é segredo; é com ele que a regra reconhece o robô.

**C. Segredos no GitHub**
1. Abra **github.com/joaovictorteniscoach-cpu/familiajk/settings/secrets/actions**.
2. Para cada linha abaixo: toque **New repository secret**, escreva o Name,
   cole o Secret e toque **Add secret**.

   | Name | Secret |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | o token do passo A3 |
   | `CLOUDFLARE_ACCOUNT_ID` | o Account ID do passo A2 |
   | `AVISOS_EMAIL` | `avisos@academia-jv-tenis.firebaseapp.com` |
   | `AVISOS_SENHA` | a senha do passo B3 |

3. Ninguém consegue ler o segredo depois de salvo, nem o Claude. Apague a nota.

**D. Regra do Firebase** (o João autorizou em 15/10, depois de criar o robô)
1. Com o UID do robô, o Claude coloca a regra em
   `ferramentas/firebase-regras-etapa3-transicao.json` e publica no GitHub.
2. No celular, abra o arquivo no GitHub, toque **Raw**, selecione tudo e copie.
3. Abra Firebase → **Realtime Database** → **Regras**. Selecione tudo, cole por
   cima e toque **Publicar**.

**E. Ligar**
1. O Claude roda a Action **Servidor de avisos (Cloudflare)**.
   - Ela confere os segredos e **testa o login do robô** sem mostrar nada.
   - Depois publica o servidor e, só na primeira vez, cria a chave de push.
     A chave fica guardada apenas na Cloudflare.
2. Em até 2 minutos, o sininho da Gestão mostra "servidor ligado".
3. Toque em **Ativar avisos** e depois em **Enviar aviso de teste para mim**.
4. Os alunos ligam os avisos em Perfil → **Ativar avisos**.

## Se algo der errado
- **A Action diz que falta segredo:** confira os nomes do passo C, letra por letra.
- **"o Firebase recusou o login do robô":** a senha no GitHub não é igual à do
  passo B, ou o usuário não foi criado. Crie o segredo `AVISOS_SENHA` de novo.
- **"tem espaço no começo ou no fim":** o celular colou um espaço junto. Apague
  o segredo e cole de novo.
- **O sininho diz "servidor ainda não ligado":**
  - a regra do passo D não foi publicada; ou
  - o servidor não rodou: veja na Cloudflare → Workers → jv-avisos → **Logs**.
- **Para desligar tudo:** Cloudflare → Workers → jv-avisos → Settings → Delete.
  Os apps voltam sozinhos ao aviso só com o app aberto.
- **Se a senha do robô vazar:**
  1. Firebase → Authentication → robô → **Redefinir senha** (ou desative o usuário).
  2. Troque o segredo `AVISOS_SENHA` no GitHub.
  3. Rode a Action de novo.

## Mudança de regra (autorizada pelo João em 15/10, falta o UID do robô)
- Entra nas regras `etapa3-transicao` e `etapa4-estrita`.
- `ROBO_UID` é trocado pelo UID que o João mandar. O outro uid é o do João, o
  mesmo das outras regras.

Lugares novos, dentro de `"jvtenis"`:

```json
"avisos_tokens": {
  ".read": "auth != null && (auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1' || auth.uid === 'ROBO_UID')",
  "$uid": {
    "$app": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": "auth != null && ((auth.uid === $uid && (($app === 'gestao' && auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1') || ($app === 'aluno' && root.child('jvtenis/aluno_vinculos/' + auth.uid + '/ativo').val() === true))) || (auth.uid === 'ROBO_UID' && !newData.exists()))",
      ".validate": "newData.hasChildren(['e', 'p', 'a', 'ts']) && newData.child('e').isString() && newData.child('e').val().beginsWith('https://') && newData.child('e').val().length <= 800 && newData.child('p').isString() && newData.child('p').val().length <= 120 && newData.child('a').isString() && newData.child('a').val().length <= 40 && newData.child('ts').isNumber()",
      "$campo": { ".validate": "$campo === 'e' || $campo === 'p' || $campo === 'a' || $campo === 'ts'" }
    }
  }
},
"avisos_saida": {
  ".read": "auth != null && (auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1' || auth.uid === 'ROBO_UID')",
  ".write": "auth != null && auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1'",
  ".indexOn": ["quando"]
},
"avisos_enviados": {
  ".read": "auth != null && (auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1' || auth.uid === 'ROBO_UID')",
  ".write": "auth != null && (auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1' || auth.uid === 'ROBO_UID')"
},
"avisos_estado": {
  ".read": "auth != null",
  ".write": "auth != null && (auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1' || auth.uid === 'ROBO_UID')"
}
```

Leitura do robô em 3 lugares que já existem. Só o `.read` da raiz de cada um
ganha `|| auth.uid === 'ROBO_UID'`:
- **`aluno_vinculos`:** para saber de qual aluno é cada aparelho.
- **`fila_pedidos`:** para avisar o João do "Já paguei".
- **`fila_agendamentos`:** para não lembrar de aula que o aluno acabou de cancelar.

O que cada um pode fazer:
- **Aluno:** só grava o próprio endereço de aviso, e só se o aparelho já foi
  aprovado. Não lê o de ninguém.
- **Robô:**
  - **lê:** a fila de avisos, os endereços, os vínculos e as duas filas;
  - **grava:** só o que foi enviado, o estado e apaga endereço morto.
  - **Não grava** aviso, agenda, aluno, valor nem pedido.
- **João:** prepara a fila de avisos e lê tudo de avisos.
- **`avisos_estado`:** qualquer aparelho logado lê. Tem só a hora e a chave
  pública.

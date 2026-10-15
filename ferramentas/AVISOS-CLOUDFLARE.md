# Avisos no celular com o app fechado (Cloudflare, grátis)

Pedido do João em 15/10/2026: lembrete automático sem custo, sem plano Blaze.

## O que o aluno e o João recebem
- **Aluno:**
  - "🎾 Aula amanhã às 18:00", às 19h da véspera. Vale também para aula em
    grupo, treino, locação e torneio.
  - "Sua mensalidade do tênis vence em 3 dias", e "vence hoje" no dia, às 9h.
    Só para quem está pendente.
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
  - Anota em `avisos_enviados` o que já foi, para não repetir.
  - Grava `avisos_estado` com a hora da rodada e a chave pública de push.
  - O padrão é o Web Push do próprio navegador (Chrome, Safari, Firefox). Não
    usa biblioteca de fora.
- **Aparelho:** quem toca em "Ativar avisos" com o servidor ligado é inscrito.
  - No app do aluno o botão fica no Perfil. Na Gestão, no sininho.
  - O endereço de aviso fica em `avisos_tokens/<uid>/aluno` ou `/gestao`.
  - Sem servidor, o botão faz o que sempre fez (aviso só com o app aberto).
  - **iPhone:** só com o app na Tela de Início (iOS 16.4 ou mais novo).
- **Custo zero:**
  - O plano grátis da Cloudflare dá 100 mil acessos por dia e 5 tarefas no relógio.
  - Cada rodada usa ~4 ms de processamento, medido no motor da Cloudflare
    (`workerd`) com 6 avisos. O limite é 10 ms.
  - Com isso, no máximo 6 avisos por rodada: 180 por hora.
  - Leitura do Firebase: só os avisos que já estão na hora, e os vínculos
    guardados por 30 min. Fica bem abaixo da cota grátis.

## Passo a passo do João (melhor no computador)
**1. Conta grátis na Cloudflare**
- Abra dash.cloudflare.com/sign-up e cadastre e-mail e senha. Não pede cartão.
  Confirme o e-mail.
- No painel, abra **Workers e Pages** (ou "Compute"). O **Account ID**
  aparece à direita: copie.

**2. Chave de publicação (API Token)**
- Na Cloudflare, clique no boneco no canto de cima → **Perfil** → **API Tokens**.
- Clique em **Create Token**. No modelo **Edit Cloudflare Workers**, clique em
  **Use template**.
- Em **Account Resources**, escolha a sua conta. Em **Zone Resources**, deixe
  "All zones".
- Clique em **Continue** → **Create Token** e copie. Ela só aparece uma vez.

**3. Conta de serviço do Firebase (deixa o servidor ler e gravar os avisos)**
- Abra console.firebase.google.com → projeto **academia-jv-tenis** → ⚙️
  **Configurações do projeto** → **Contas de serviço**.
- Clique em **Gerar nova chave privada**. O navegador baixa um arquivo `.json`.
- **Não mande esse arquivo para ninguém, nem aqui no chat.** Ele vai só para o
  GitHub, no passo 4.

**4. Guardar os três segredos no GitHub**
- No GitHub, abra o repositório **familiajk** → **Settings** → **Secrets and
  variables** → **Actions** → **New repository secret**.
- Crie os três segredos:

  | Nome | O que colar |
  |---|---|
  | `CLOUDFLARE_API_TOKEN` | a chave do passo 2 |
  | `CLOUDFLARE_ACCOUNT_ID` | o Account ID do passo 1 |
  | `FIREBASE_SERVICE_ACCOUNT` | o conteúdo **inteiro** do arquivo `.json` do passo 3, abrindo no Bloco de Notas |

- Ninguém consegue ler o segredo depois de salvo, nem o Claude.

**5. Regra do Firebase (exige o seu OK)**
- O texto da regra está no fim deste arquivo, em "Mudança de regra proposta".
- Com o seu OK ela entra em `ferramentas/firebase-regras-etapa3-transicao.json`.
- Depois copie o arquivo inteiro em Firebase → **Realtime Database** →
  **Regras** → **Publicar**.

**6. Ligar**
- Diga "pronto" ao Claude, ou abra no GitHub **Actions** → **Servidor de
  avisos (Cloudflare)** → **Run workflow**.
- A Action confere a conta de serviço sem mostrar o conteúdo, publica o
  servidor e, só na primeira vez, cria a chave de push. A chave fica guardada
  apenas na Cloudflare.
- Em até 2 minutos, a Gestão mostra no sininho "servidor ligado".
- Toque em **Ativar avisos** e depois em **Enviar aviso de teste para mim**.
- Os alunos ligam em Perfil → **Ativar avisos**.

## Se algo der errado
- **A Action diz que falta segredo:** confira os nomes do passo 4, letra por letra.
- **"a conta de serviço é de outro projeto":** o `.json` não é do
  academia-jv-tenis.
- **O sininho diz "servidor ainda não ligado":**
  - a regra do passo 5 não foi publicada; ou
  - o servidor não rodou: veja na Cloudflare → Workers → jv-avisos → **Logs**.
- **Para desligar tudo:** Cloudflare → Workers → jv-avisos → Settings → Delete.
  Os apps voltam sozinhos ao aviso só com o app aberto.
- **Se a chave do Firebase vazar:** no Google Cloud → IAM → Contas de serviço,
  apague a chave. Depois gere outra e troque o segredo do passo 4.

## Mudança de regra proposta (aguarda autorização explícita do João)
- Acrescentar dentro de `"jvtenis"` nas regras `etapa3-transicao` e
  `etapa4-estrita`. O uid é o do João, já usado nas outras regras.

```json
"avisos_tokens": {
  ".read": "auth != null && auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1'",
  "$uid": {
    "$app": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": "auth != null && auth.uid === $uid && (($app === 'gestao' && auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1') || ($app === 'aluno' && root.child('jvtenis/aluno_vinculos/' + auth.uid + '/ativo').val() === true))",
      ".validate": "newData.hasChildren(['e', 'p', 'a', 'ts']) && newData.child('e').isString() && newData.child('e').val().beginsWith('https://') && newData.child('e').val().length <= 800 && newData.child('p').isString() && newData.child('p').val().length <= 120 && newData.child('a').isString() && newData.child('a').val().length <= 40 && newData.child('ts').isNumber()",
      "$campo": { ".validate": "$campo === 'e' || $campo === 'p' || $campo === 'a' || $campo === 'ts'" }
    }
  }
},
"avisos_saida": {
  ".read": "auth != null && auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1'",
  ".write": "auth != null && auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1'",
  ".indexOn": ["quando"]
},
"avisos_enviados": {
  ".read": "auth != null && auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1'",
  ".write": "auth != null && auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1'"
},
"avisos_estado": {
  ".read": "auth != null",
  ".write": "auth != null && auth.uid === 'XEulBs95uZV1JhfUuz6SmjUaeVv1'"
}
```

- **Aluno:** só grava o próprio endereço de aviso, e só se o aparelho já foi
  aprovado. Não lê o de ninguém.
- **João:** só ele lê a lista inteira e a fila de avisos.
- **Servidor:** entra com a conta de serviço, que não passa pelas regras.
- **`avisos_estado`:** qualquer aparelho logado lê. Tem só a hora e a chave
  pública.
- **Nada muda nos caminhos que já existem.**

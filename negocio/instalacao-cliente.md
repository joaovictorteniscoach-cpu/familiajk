# Guia de Instalação — Novo Cliente

## Como montar o sistema JV Tênis para uma academia que comprou

**Uso interno** — passo a passo para o João. Não publicar.
**Versão:** 1.0 — 2026

---

# A regra de ouro

**Cada cliente tem o banco de dados dele, separado de todos.** Nunca reaproveite o
seu Firebase (o `academia-jv-tenis`) para um cliente — os dados se misturariam.

Para cada cliente novo você cria: **1 projeto Firebase próprio** + **2 apps**
(gestão e aluno) com a configuração desse projeto, publicados no Netlify. Leva
15–20 minutos e você só faz isso **uma vez por cliente**.

> **Atalho:** você pode fazer só o **Passo 1** (criar o Firebase e copiar a
> configuração) e me mandar essa configuração — eu preparo os dois apps prontos
> para você só publicar. É a forma mais rápida e sem erro.

---

# O que o cliente recebe

- **App de Gestão** — o painel do professor/academia (agenda, alunos, caixa, financeiro).
- **App do Aluno** — onde os alunos dele agendam e veem pagamentos.
- **Banco de dados próprio** (Firebase) — os dados da academia dele, isolados.
- **Código de acesso** para os alunos entrarem.

---

# Passo 1 — Criar o Firebase do cliente

Você pode criar na **conta Google do próprio cliente** (ideal — os dados ficam no
nome dele) ou na sua e depois transferir. Recomendo criar já no e-mail do cliente,
com ele do lado, ou pedir para ele te dar acesso.

1. Acesse **console.firebase.google.com** e faça login.
2. Clique em **Adicionar projeto** (Add project).
3. Dê um nome, ex.: **academia-do-fulano**. Avance (pode desativar o Google
   Analytics — não é necessário). Clique em **Criar projeto**.
4. No menu à esquerda, vá em **Build → Realtime Database** → **Criar banco de dados**.
   - Local: **United States (us-central1)** (padrão).
   - Comece em **modo de teste** (test mode) — depois ajustamos as regras.
5. Aba **Regras (Rules)** do Realtime Database → apague o que estiver lá e cole
   as **regras do Anexo A** → **Publicar**.
6. Agora pegue a configuração: engrenagem ⚙ (canto superior) → **Configurações do
   projeto** → aba **Geral** → role até **Seus apps** → clique no ícone **</>** (Web).
   - Apelido do app: ex. "JV Tênis". Registre.
   - O Firebase mostra um bloco **`const firebaseConfig = { ... }`** — é isso que
     você precisa. **Copie o bloco inteiro** (do `{` até o `}`).

Guarde esse bloco — ele é a "chave" que liga os apps ao banco do cliente.

---

# Passo 2 — Colocar a configuração nos dois apps

Você tem os apps prontos no repositório: as pastas **`app-gestao`** e **`app-aluno`**.
Para o cliente, faça uma **cópia** de cada e troque a configuração.

Em cada arquivo `index.html` (o do gestão e o do aluno), procure o trecho que
começa com **`const firebaseConfig = {`** e **substitua o bloco inteiro** pela
configuração que você copiou no Passo 1.

- No **app-gestao/index.html** esse bloco está por volta da **linha 349**.
- No **app-aluno/index.html** por volta da **linha 250**.

Troque também o **nome da academia** (onde aparece "Academia João Victor Tênis")
pelo nome do cliente, se ele quiser a marca dele.

> **Não sabe editar HTML?** Sem problema: me mande a configuração do Passo 1 e o
> nome da academia do cliente, que eu te devolvo as duas pastas prontas.

---

# Passo 3 — Publicar no Netlify

Cada app vira um site no Netlify (como os seus já são). Duas opções:

**A) Drag & drop (mais simples):** em app.netlify.com → **Add new site → Deploy
manually** → arraste a pasta `app-gestao` do cliente. Repita para `app-aluno`.

**B) Pelo GitHub:** se preferir deploy automático, suba as pastas do cliente num
repositório e conecte (ver `DEPLOY-NETLIFY.md`).

Dê nomes claros aos sites, ex.: `gestao-fulano` e `alunos-fulano`. As URLs ficam
`gestao-fulano.netlify.app` e `alunos-fulano.netlify.app`.

---

# Passo 4 — Entregar ao cliente

1. Mande as duas URLs (gestão e app do aluno).
2. Ensine ele a **"Adicionar à Tela de Início"** no celular (vira app).
3. Faça um treino rápido: cadastrar os primeiros alunos, montar a agenda.
4. O **código de acesso** dos alunos é gerado dentro do painel — passe para ele
   divulgar aos alunos.
5. Combine a **mensalidade** do sistema (ver `guia-de-vendas.md`).

Cliente que aprende a usar não cancela — o Passo 4 é o que garante a recorrência.

---

# Anexo A — Regras do banco de dados (cole no Passo 1.5)

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**Sobre segurança:** o sistema não usa login/senha, então essas regras deixam o
banco aberto para quem souber a URL secreta do banco (que ninguém tem, além de
você e do cliente). É o padrão para esse tipo de app pequeno. Se um cliente pedir
mais segurança no futuro, dá para adicionar autenticação — me chame que a gente
evolui.

---

# Anexo B — Checklist rápido (por cliente)

- [ ] Projeto Firebase criado (de preferência no e-mail do cliente)
- [ ] Realtime Database criado
- [ ] Regras do Anexo A publicadas
- [ ] `firebaseConfig` copiado
- [ ] Config colada no `app-gestao` do cliente
- [ ] Config colada no `app-aluno` do cliente
- [ ] Nome da academia trocado (se o cliente quiser a marca dele)
- [ ] `app-gestao` publicado no Netlify
- [ ] `app-aluno` publicado no Netlify
- [ ] URLs + código de acesso entregues
- [ ] Treino feito com o cliente
- [ ] Mensalidade combinada

---

**JV Tênis** · João Victor · Santa Felicidade, Curitiba/PR
WhatsApp (41) 99541-5712 · Instagram @joaovictortenis

*Documento de uso interno.*

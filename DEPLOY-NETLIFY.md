# Deploy automático: Netlify (principal) e GitHub Pages (reserva)

## ⚠️ Se o Netlify parar, use o endereço reserva

Já aconteceu de os **créditos do Netlify acabarem** e nada ser publicado. Por
isso os mesmos apps também são publicados no **GitHub Pages**, que é gratuito e
não tem cota que acabe:

| | Principal (Netlify) | Reserva (GitHub Pages) |
|---|---|---|
| Gestão | o endereço que você já usa | `https://joaovictorteniscoach-cpu.github.io/familiajk/app-gestao/` |
| Aluno | idem | `.../familiajk/app-aluno/` |
| Site | idem | `.../familiajk/site/` |

**Os dados são os mesmos nos dois.** O Firebase é o mesmo banco — não são duas
academias, são duas portas para a mesma. Ao abrir o endereço reserva pela
primeira vez, ele baixa tudo da nuvem (cada endereço tem sua própria memória
local, então começa vazio e se enche sozinho).

**Ligar uma vez:** no GitHub, `Settings → Pages → Source: GitHub Actions`. Feito
isso, todo push na `main` publica nos dois lugares. O workflow está em
`.github/workflows/pages.yml` e confere a sintaxe dos apps antes de publicar —
se algum script estiver quebrado, ele não publica.

---

# Deploy automático: conectar o Netlify ao GitHub

Este repositório **já está no GitHub** (`joaovictorteniscoach-cpu/familiajk`) e a
branch de produção é a **`main`**. A ideia deste guia é ligar cada site do Netlify
ao repositório para que **qualquer mudança publicada na `main` republique sozinha**
— sem precisar arrastar arquivo nunca mais.

## Como tudo se conecta

```
Você edita (aqui comigo ou direto no GitHub)
        ↓
Mudança entra na branch main (via commit / Pull Request)
        ↓
Netlify percebe o push e republica sozinho
        ↓
Site no ar atualizado  ✅
```

Enquanto um site **não** estiver conectado ao GitHub, ele continua na última
versão enviada por drag & drop — por isso o passo abaixo é o que falta.

## Os sites (uma pasta = um site no Netlify)

Cada pasta é um site separado no Netlify, apontando para o **mesmo** repositório,
mudando só a **Base directory**. São estáticos: **não há build**.

| Pasta (Base directory) | Site no Netlify        | Público / Conteúdo                         |
|------------------------|------------------------|--------------------------------------------|
| `site`                 | informacoesjvtenis     | 🎾 Alunos — institucional + metodologia    |
| `site-pro`             | cursoecapacitacao      | 👔 Professores — venda do curso e do app   |
| `app-aluno`            | appalunos              | App do aluno (PWA)                          |
| `app-gestao`           | app de gestão          | App de gestão (PWA)                         |
| `app-familia`          | familiajk              | App pessoal da família (PWA)                |

> ⚠️ **Atenção ao Base directory:** ele tem que ser o **nome da pasta** (ex.: `site`,
> `site-pro`), NÃO o nome do site no Netlify. Se ficar errado (ex.: `cursoecapacitacao`),
> o deploy não acha o `index.html` e mostra "Page not found".

## Passo a passo — conectar um site que já existe (mantém a URL)

Use este fluxo para o **informacoesjvtenis** (e repita para os outros, trocando só
a Base directory).

1. Entre em https://app.netlify.com e abra o site **informacoesjvtenis**.
2. Vá em **Site configuration → Build & deploy → Continuous deployment**.
3. Em **Repository**, clique em **Link repository** (ou "Link to a Git provider").
4. Escolha **GitHub** e autorize o acesso (só na primeira vez).
5. Selecione o repositório **`joaovictorteniscoach-cpu/familiajk`**.
6. Configure:
   - **Branch to deploy:** `main`
   - **Base directory:** `site`
   - **Build command:** deixe **em branco**
   - **Publish directory:** `.` (só um ponto)
7. Salve. Na primeira vez o Netlify já publica a versão da `main`.

> A URL `informacoesjvtenis.netlify.app` continua a mesma — muda só a forma de
> publicar (agora automática).

## Criar um site novo do zero (se algum ainda não existir no Netlify)

1. Em https://app.netlify.com, clique em **Add new site → Import an existing project**.
2. Escolha **GitHub** → repositório **`joaovictorteniscoach-cpu/familiajk`**.
3. Preencha igual ao passo 6 acima (Branch `main`, a Base directory da pasta,
   Build command vazio, Publish `.`).
4. **Deploy**.

## A partir daí

Todo **push na `main`** faz o Netlify **republicar sozinho** — seja uma mudança
feita por aqui (que vira commit + Pull Request + merge na `main`) ou uma edição
feita direto no GitHub. 🎉

## Publicação manual (enquanto um site não estiver conectado)

Continua valendo: em **Deploys**, arraste a **pasta** do site (ou o `.zip` dela).
O `index.html` precisa estar na **raiz** do que é arrastado — cada pasta deste
repositório já está nesse formato.

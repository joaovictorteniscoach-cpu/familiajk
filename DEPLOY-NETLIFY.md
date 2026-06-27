# Como conectar este repositório ao Netlify (deploy automático)

Este repositório tem **3 sites** (cada um numa pasta). No Netlify, cada pasta
vira **um site separado** apontando para o mesmo repositório, mudando apenas a
**Base directory**. Como são estáticos, **não há build** — é só publicar a pasta.

| Site no Netlify | Base directory | Conteúdo            |
|-----------------|----------------|---------------------|
| Gestão          | `app-gestao`   | App de gestão (PWA) |
| Aluno           | `app-aluno`    | App do aluno (PWA)  |
| Site            | `site`         | Site institucional  |

## Passo a passo (repetir para cada um dos 3 sites)

1. Entre em https://app.netlify.com e clique em **Add new site → Import an existing project**.
2. Escolha **GitHub** e autorize o acesso (na primeira vez). Selecione o
   repositório **`joaovictorteniscoach-cpu/familiajk`**.
3. Em **Branch to deploy**, escolha a branch que você quer publicar
   (ex.: `main`, depois de fazer o merge — veja a observação no fim).
4. Em **Base directory**, digite a pasta do site (ex.: `app-gestao`).
5. **Build command**: deixe **em branco**. **Publish directory**: `.` (ponto)
   — o `netlify.toml` dentro de cada pasta já define isso.
6. Clique em **Deploy**. Pronto — o Netlify publica e fica observando o repo.

> Dica: para um site que já existe hoje (publicado por drag & drop), você pode
> conectá-lo ao Git em **Site configuration → Build & deploy → Link repository**,
> usando a mesma Base directory da tabela acima — assim mantém a URL atual.

## A partir daí
Toda vez que houver **push** no GitHub na branch escolhida, o Netlify
**republica sozinho** — sem precisar arrastar nada. 🎉

## Observação sobre a branch
Hoje os arquivos estão na branch `claude/recover-student-app-academy-site-8maqxw`.
O ideal é fazer o **merge dessa branch para `main`** (posso abrir um Pull Request
se você quiser) e conectar o Netlify à `main`. Assim a branch de produção fica
limpa e estável.

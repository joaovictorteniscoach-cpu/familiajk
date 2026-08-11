# Onde os apps ficam publicados

**Principal: GitHub Pages.** Gratuito, sem cota que acabe.

| | Endereço |
|---|---|
| Gestão | `https://joaovictorteniscoach-cpu.github.io/familiajk/app-gestao/` |
| Aluno | `https://joaovictorteniscoach-cpu.github.io/familiajk/app-aluno/` |
| Site | `https://joaovictorteniscoach-cpu.github.io/familiajk/site/` |

**Reserva: Netlify.** Continua publicando, mas o plano gratuito tem cota — e ela
já estourou duas vezes: uma parou de publicar, outra pausou o site ("This site
was paused as it reached its usage limits"). Por isso deixou de ser o principal.

**Os dados são os mesmos nos dois.** O Firebase é o mesmo banco — não são duas
academias, são duas portas para a mesma casa. Ao abrir um endereço pela primeira
vez ele baixa tudo da nuvem (cada endereço tem sua própria memória local, então
começa vazio e se enche sozinho).

## Se um dos dois cair

Abra o outro. É só isso — mesma conta, mesmos dados, mesmo login. Vale instalar
os **dois** na tela de início, para não depender de lembrar o endereço na hora
do aperto.

## O link do App do Aluno se ajusta sozinho

Os botões "Entrar" do site apontam para o Pages. Quando o site é servido do mesmo
lugar que o app, um trecho no fim de `site/index.html` troca para o caminho
irmão (`../app-aluno/`). Assim o link continua certo se o endereço mudar de novo
— inclusive se um dia apontar um domínio próprio — sem editar o HTML.

## Por que o site público é leve

Ele foi de **1.180 KB para 220 KB** na primeira tela (−81%). O que mudou:

- as imagens saíram de dentro do HTML (eram 953 KB em base64, mas só **4 fotos
  distintas** — a mesma foto aparecia 2× e o logo 4×). Agora são arquivos em
  `site/img/`, em WebP, que o navegador guarda em cache entre visitas;
- as de baixo da página só carregam se a pessoa rolar (`loading="lazy"`);
- os preços de grupo vinham de **193 KB de biblioteca do Firebase** para ler três
  números. Agora é um `fetch` de ~100 bytes no endereço REST.

Isso importa além da velocidade: menos dados servidos é menos chance de estourar
cota de novo, em qualquer hospedagem.

**Não volte a colar imagem dentro do HTML.** É o que inflou o site: dentro do
HTML a imagem não entra no cache do navegador nem carrega sob demanda, e a mesma
foto repetida conta de novo a cada cópia.

## Publicar

Todo push na `main` publica nos dois lugares. O workflow do Pages está em
`.github/workflows/pages.yml` e **confere a sintaxe dos três apps antes de
publicar** — se algum script estiver quebrado, ele não publica.

O Pages foi ligado uma vez em `Settings → Pages → Source: GitHub Actions`.

## Aliviar o Netlify

São seis projetos publicando a cada push. Como o Pages passou a ser o principal,
dá para **pausar no painel do Netlify** os que não forem mais necessários
(`Site configuration → General → Danger zone → Stop builds`). Pausar não apaga
nada: o endereço continua servindo a última versão publicada, só para de
reconstruir.

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

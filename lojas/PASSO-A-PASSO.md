# Passo a passo: app do aluno na Google Play

Guia para o João (27/10/2026). Por enquanto é só teoria: nada foi feito nas
lojas. O iPhone fica para depois (fim da página).

## Resumo

| | |
|---|---|
| Custo | US$ 25, uma vez só (cerca de R$ 150, conforme o dólar) |
| Prazo | 3 a 4 semanas, por causa dos 14 dias de teste |
| O app muda? | Não. A loja instala o app que já existe, em tela cheia |
| Atualizações | Automáticas: o que for publicado no site chega para quem instalou pela loja |
| Quem faz o quê | **Você**: conta, pagamento, documentos, testadores. **Claude**: arquivos, pacote do app, textos e imagens |

## Antes de começar, tenha em mãos

- A sua conta Google (o Gmail de sempre).
- Documento com foto (RG, CNH ou passaporte). O Google pode pedir também
  comprovante de endereço.
- Cartão de crédito que aceite compra internacional (US$ 25).
- **Um celular Android por alguns minutos.** Conta nova pode ter de ser
  confirmada pelo aplicativo "Google Play Console" instalado num Android de
  verdade. Como você usa iPhone, combine de pegar emprestado (família ou aluno).
- Uma lista de **12 alunos com Android** e o e-mail da conta Google de cada um.

## Fase 1 — Criar a conta de desenvolvedor (você)

Tempo: uns 30 minutos, mais de algumas horas a alguns dias de espera.

1. Entre em **play.google.com/console** com a sua conta Google.
2. Escolha **"Você mesmo"** (conta pessoal).
   - A conta de organização exige CNPJ e o número D-U-N-S, e demora mais. A
     vantagem dela é dispensar os 12 testadores.
3. Preencha nome completo, endereço, telefone e o **e-mail de contato**. O seu
   nome e esse e-mail aparecem na página do app na loja; o endereço não.
4. Pague os US$ 25.
5. Envie a foto do documento e confirme o telefone. Se o Google pedir, confirme
   também pelo app Play Console no Android emprestado.
6. Espere o e-mail de conta aprovada.

## Fase 2 — O que o Claude prepara (com prévia para você aprovar)

7. **Modo demonstração:** um código que abre o app com uma aluna fictícia, sem
   mexer na nuvem. O revisor do Google precisa entrar no app, e hoje ele
   dependeria de você aprovar o aparelho dele.
8. **Página "Como apagar meus dados":** o Google exige um link para isso.
9. **Repositório `joaovictorteniscoach-cpu.github.io`:** só com você autorizando.
   É o que tira a barra do navegador de cima do app. Não muda o endereço dos
   apps, nem login, nem dados.
10. **Pacote do app** (arquivo `.aab`) e a **chave de assinatura**.
    - A chave é entregue a você. Guarde em dois lugares (por exemplo, no seu
      Google Drive e num pendrive).
    - Ela **nunca** vai para o GitHub, que é público.
11. **Nome técnico do app:** `br.com.jvtenis.aluno`. Você confirma antes,
    porque depois do primeiro envio ele não muda nunca mais.

## Fase 3 — Cadastrar o app no Play Console (você, com o Claude guiando)

Tempo: cerca de 1 hora. Todos os textos estão prontos em `lojas/textos-google-play.md`.

12. **Criar app:** nome "Academia JV Tênis", idioma Português (Brasil), tipo
    App, Gratuito.
13. **Conteúdo do app** (formulários do Google):
    - política de privacidade: o link do site;
    - acesso ao app: o código de demonstração;
    - anúncios: não;
    - classificação: o questionário (deve dar "Livre");
    - público-alvo: 18 anos ou mais;
    - segurança dos dados: a tabela pronta.
14. **Ficha da loja:** copiar os textos e enviar o ícone, a imagem de destaque e
    as 6 fotos de tela (pasta `lojas/imagens/`).
15. **Teste fechado:** criar o teste, enviar o pacote `.aab`, cadastrar os e-mails
    dos 12 alunos e mandar para eles o link de convite (mensagem pronta).
16. **Impressão digital da chave:** copiar o código SHA-256 que o Play Console
    mostra (Integridade do app → Assinatura do app) e mandar ao Claude. É o que
    faz a barra do navegador sumir de vez.

## Fase 4 — 14 dias de teste (os alunos)

17. Cada aluno aceita o convite, instala pela Play Store e usa o app normalmente.
18. Mantenha pelo menos **12 inscritos o tempo todo**. Se cair para menos, a
    contagem dos 14 dias pode recomeçar. Convide 14 ou 15 para ter folga.
19. Anote o que eles acharem: o Google pergunta sobre o teste na fase seguinte.

## Fase 5 — Liberar para todos

20. Passados os 14 dias, clique em **"Solicitar acesso à produção"** e responda
    as perguntas sobre o teste.
21. O Google analisa, normalmente em até uma semana.
22. Aprovado: publique em **Produção**. Mande o link da loja para os alunos.

## Depois de publicado

- Melhorias no app chegam sozinhas: a loja só precisa de versão nova se mudar
  o nome, o ícone ou as cores do app.
- Não há mensalidade do Google.
- Quem já usa o app pelo navegador continua usando. Pode instalar pela loja
  quando quiser, com o mesmo código, sem perder nada.
- Alunos de iPhone continuam instalando pelo Safari ("Adicionar à Tela de Início").

## Cuidados

- **Nome técnico (`br.com.jvtenis.aluno`):** permanente.
- **Chave de assinatura:** guardar bem. Se perder, dá para pedir ao Google uma
  chave nova, mas atrasa as atualizações da loja.
- **Revisão do Google:** pode pedir ajustes (por exemplo, no formulário de
  dados). Nesse caso a gente corrige e reenvia; não é recusa definitiva.

## iPhone (App Store), para depois

- **Custo e conta:** US$ 99 por ano, numa conta Apple Developer.
- **Risco de recusa:** a Apple costuma recusar app que seja "só um site dentro
  de um app". Para passar, precisa de recursos do iPhone, como avisos nativos e
  funcionar sem internet. É um trabalho a mais no app.
- **Sem Mac:** o pacote pode ser montado na nuvem, sem custo.
- **Recomendação:** fazer só depois que o Android estiver no ar.

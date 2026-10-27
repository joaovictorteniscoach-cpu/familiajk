# App do aluno nas lojas (Google Play e App Store)

Kit preparado em 27/10/2026 a pedido do João ("prepare para colocar o app na App
Store e Google"). A análise no Floot não chegou a ser feita: o projeto de lá
ficou só com o pedido. Esta pasta **não é publicada** no site (não está em
`PUBLICOS` de `ferramentas/preparar-pages.py`).

Só vai para as lojas o **app do aluno**. A Gestão é só do João e continua como
está (aplicativo instalado pelo navegador).

## O caminho escolhido

O app atual continua sendo o mesmo. A loja instala um "invólucro" que abre o
endereço do GitHub Pages em tela cheia. Vantagens:

- Nada é reescrito, e toda melhoria publicada no Pages chega na hora para quem
  instalou pela loja, sem mandar versão nova para a loja.
- Login, avisos e dados continuam os mesmos.

Refazer o app no Floot (para usar o empacotador de lá) foi descartado: seria
reescrever cerca de 10 mil linhas, com risco alto de perder regras que já foram
acertadas (créditos, reposições, reservas).

## Android (Google Play) — primeiro

Tecnologia: *Trusted Web Activity* (Bubblewrap/PWABuilder, do Google). Os avisos
no celular continuam funcionando.

| Item | Situação |
|---|---|
| Conta de desenvolvedor Google Play | **João**: criar (US$ 25, uma vez só), verificar identidade |
| Nome do pacote (permanente) | Proposta: `br.com.jvtenis.aluno` — **João confirma** |
| Tirar a barra do navegador | Precisa do arquivo `/.well-known/assetlinks.json` na raiz de `joaovictorteniscoach-cpu.github.io`. Projeto do GitHub Pages não serve a raiz: é preciso um repositório novo chamado **`joaovictorteniscoach-cpu.github.io`** com os arquivos de `raiz-github-io/`. **João autoriza** a criação. Não muda o endereço dos apps, nem login, nem dados |
| Modo demonstração para o revisor do Google | **A fazer** (Claude): entrada com dados fictícios, sem nuvem, para o revisor ver o app sem aprovação de aparelho |
| Pedido de exclusão de dados | A política já diz como pedir (seção 7). O Google pede um link próprio: **a fazer** (Claude) uma página curta no site |
| Política de privacidade | Pronta: `site/privacidade.html` |
| Textos da loja e respostas dos formulários | Prontos: `textos-google-play.md` |
| Ícone, imagem de destaque e fotos de tela | Prontos em `imagens/` (dados fictícios). Refazer depois que o João escolher o visual novo |
| Teste fechado | Conta pessoal nova: **12 testadores por 14 dias seguidos** antes de liberar para todos ([regra do Google](https://support.google.com/googleplay/android-developer/answer/14151465)). Alunos com Android e conta Google servem |
| Pacote do app (.aab) | Claude gera (Bubblewrap) quando a conta existir. A chave de assinatura **nunca** vai para o repositório: fica com o João |

Prazo realista: 3 a 4 semanas (verificação da conta, 14 dias de teste, revisão).

## iPhone (App Store) — depois do Android

- Custo: US$ 99 por ano (Apple Developer Program).
- Risco: a Apple recusa app que seja "só um site dentro de um app" (regra 4.2).
  Para passar, o app precisa de recursos do próprio iPhone: avisos nativos,
  funcionar sem internet, navegação nativa.
- Os avisos atuais (do navegador) não funcionam dentro de um app da App Store:
  seria preciso ligar os avisos nativos da Apple.
- Não precisa de Mac: o pacote pode ser montado pelo GitHub Actions (máquina
  macOS na nuvem, sem custo para repositório público).
- Hoje o aluno de iPhone já instala pelo Safari ("Adicionar à Tela de Início"),
  com avisos (iOS 16.4 ou mais novo). Recomendação: só ir para a App Store
  depois que o Android estiver no ar.

## Ordem de trabalho

1. João: conta Google Play, confirmar o nome do pacote, autorizar o repositório
   `joaovictorteniscoach-cpu.github.io`.
2. Claude: modo demonstração e página de exclusão (com prévia para o João,
   publicação só com o OK dele).
3. Claude: gerar o pacote Android e o `assetlinks.json` com a impressão digital
   da chave que o Play Console mostrar.
4. João: subir o pacote no teste fechado e convidar 12 alunos; 14 dias depois,
   pedir a liberação para todos.
5. iPhone: decidir depois.

# Pacote Android (Trusted Web Activity)

`twa-manifest.json` é a configuração do [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
para o app do aluno. Ele abre `https://joaovictorteniscoach-cpu.github.io/familiajk/app-aluno/`
em tela cheia.

- `packageId` (`br.com.jvtenis.aluno`) é **permanente** depois do primeiro envio
  à Google Play: só usar depois que o João confirmar.
- A chave de assinatura (`chave-upload-jvtenis.keystore`) e as senhas **nunca**
  entram no repositório (ele é público). Ficam guardadas pelo João; o Play
  Console guarda a chave final ("Assinatura de apps do Google Play").
- Depois do primeiro envio, copiar a impressão digital SHA-256 da chave de
  assinatura do app (Play Console → Integridade do app) para
  `../raiz-github-io/.well-known/assetlinks.json`. Sem isso o app abre com a
  barra do navegador em cima.
- Versão nova na loja só é preciso para mudar nome, ícone ou cores do
  invólucro: as telas vêm sempre do GitHub Pages.

Comandos (máquina com Node e o Bubblewrap):

    npx @bubblewrap/cli build --manifest twa-manifest.json

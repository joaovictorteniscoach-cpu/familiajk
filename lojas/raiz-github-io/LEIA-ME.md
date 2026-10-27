# Arquivos para o repositório `joaovictorteniscoach-cpu.github.io`

O Google confere se o app Android pertence ao site lendo
`https://joaovictorteniscoach-cpu.github.io/.well-known/assetlinks.json` — na
**raiz** do endereço. Este repositório (`familiajk`) publica em `/familiajk/`,
não na raiz; por isso é preciso um repositório separado, público, com o nome
exato `joaovictorteniscoach-cpu.github.io`, contendo só:

- `.nojekyll` (sem ele o GitHub Pages esconde pastas que começam com ponto);
- `.well-known/assetlinks.json` (com a impressão digital SHA-256 preenchida).

Criar esse repositório não muda nada nos apps: os endereços continuam
`/familiajk/app-aluno/` e `/familiajk/app-gestao/`, com o mesmo login e os mesmos dados.

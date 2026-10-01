# Família JK — Black & Gold

Pacote completo do aplicativo com o visual escolhido: grafite e dourado. Revisão funcional de 25/09/2026, evolução r2. Base: app-familia da branch main, commit 360130ef3a1d27b3c4884b41f579f36bcc444f6d.

## O que mudou

- Resumo em quatro blocos: renda mensal prevista, contas, saldo previsto e valor a pagar. O saldo usa a renda cadastrada, não os valores ilustrativos das imagens.
- Progresso de pagamentos e vencimentos em destaque.
- Novo lançamento com atalhos para conta da casa, despesas pessoais e recebimentos.
- Investimentos com evolução do patrimônio, distribuição entre Nacional, Global e Binance, plano de aportes e atalho para registrar aportes.
- Menu inferior: Resumo, Contas, Cartões e Mais. Na área de investimentos: Resumo, Carteira, Aportes e Mais.
- As 25 telas anteriores continuam disponíveis, incluindo patrimônio, proteção, empresas, metas, importações, backups e sincronização.
- Cartões editáveis no celular, tabelas no computador, controles de tamanho e opção de colunas.
- Gráficos e leitura de planilhas incluídos no pacote para não depender de CDN na inicialização. OCR, voz, cotações e nuvem continuam sujeitos à conexão e ao suporte do navegador.
- Lixeira em Opções, com as últimas 20 exclusões, restauração individual e botão Desfazer. Inclui contas, cartões, recebimentos, investimentos e transações.
- Importação com identificador bancário e conta de origem; possíveis duplicidades sem identificação pedem conferência. Extratos grandes têm páginas para revisar todos os registros.
- Login por e-mail/senha na nuvem, sessão em memória e proteção contra alterações simultâneas. Diferenças entre versões pausam o envio automático e permitem baixar os dois backups antes de escolher.

## Ativar a nuvem

Leia CONFIGURAR-NUVEM.md e configure o Firebase da família. O modelo firebase-rules.exemplo.json inclui campos que precisam receber os UIDs de vocês. Nenhuma conta, regra ou serviço externo foi configurado automaticamente. O login não bloqueia o uso local do app; sem a configuração, as funções locais continuam disponíveis e a sincronização fica indisponível.

## Atualizar o app

1. Abra o app atual e faça um backup em Opções → Dados e versões salvas.
2. Extraia este ZIP. A pasta extraída deve conter index.html, layout.css, vendor, ícones, manifest e service worker.
3. Publique todo o conteúdo no MESMO site do Netlify. Não envie somente o index.html.
4. Reabra o app. Se o visual antigo aparecer, feche e abra novamente com internet.

A chave local familiajk_v1 foi mantida. Os dados do navegador não estão dentro deste ZIP. Se mudar o endereço do site, navegador ou aparelho, restaure seu backup.

Os meses de exemplo que já existiam no aplicativo permanecem identificados; revise-os em Evolução mensal. O redesign não substitui seus dados por números do mockup.

## Conferências realizadas

71 verificações automatizadas passaram: as 11 verificações de interface do redesign e 60 cenários de estabilidade. Incluem cálculos mensais, vencimentos, edição e persistência, importação/restauração de backups, CSV/OFX, planilhas, texto, lixeira, duplicidades, login, renovação de sessão e simulações de conflitos e falhas de armazenamento/rede.

Veja REVISAO-FUNCIONAL.md para as correções, limitações e próximas melhorias. Recebimentos antigos sem ano continuam na lista, mas precisam de data completa para entrar no fechamento. Datas que tinham o ano preservado no identificador do lançamento são recuperadas automaticamente.

Os testes de DOM usam um substituto para Chart.js e não certificam a renderização dos gráficos. A sintaxe JavaScript e os arquivos do pacote foram conferidos. A inspeção visual em navegador real ficou pendente porque a prévia esteve indisponível. Os serviços externos de voz, OCR e nuvem não foram acionados.

Esta entrega é um pacote para instalação. Não houve publicação no GitHub nem alteração do site em produção.

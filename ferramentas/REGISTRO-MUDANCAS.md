# Registro de mudanças — Gestão e App do Aluno

Diário do que foi publicado, por quem, o que substituiu o quê e o que ficou
pendente. Mais de uma inteligência trabalha neste repositório (Claude Code e
Codex): **leia este arquivo antes de começar e acrescente uma entrada ao
terminar**, para uma não desfazer o trabalho da outra sem saber.
Sem nomes reais de alunos ou de familiares aqui (o repositório é público).

---

## 2026-10-07 · Revisão das publicações de 04 a 07/10 (PRs #208–#221, feitas pelo Codex)

Revisão só de leitura (Claude Code), comparando `298416f` (fim do PR #207) com
`4b4de8c` (PR #221). Versão publicada nos dois apps: `2026-10-07-3`.
`checar-tudo.sh` 0 falhas e `fumaca.cjs` OK nessa versão. Regras do Firebase
**não mudaram** (nenhum `firebase-regras-*.json` alterado); `APPCHECK_SITE_KEY`
continua vazio.

### O que entrou

**Gestão**
- **Alunos:** lista em **ordem alfabética** (`listaAlfabetica`, f6aa30d) —
  substituiu o agrupamento por dia de aula (opção C, PR #200). Selos de família
  e "PARCIAL"; total pendente pelo saldo exato.
- **Plano família (#210):** responsável paga o total; dependente com
  mensalidade 0, créditos/reposições/agenda próprios. Vincular pede
  confirmação e salva versão antes; nenhum `mover()` no fluxo. Ver
  `PLANO-FAMILIA.md`.
- **Pagamentos (#215):** "Marcar pago" virou **Registrar pagamento**
  (competência, data, forma, valor parcial exato; recusa valor acima do saldo;
  versão salva antes). Aviso de pagamento do aluno abre a mesma janela.
- **Renovar o mês (#218):** segunda renovação no mesmo mês **bloqueada de vez**
  (antes: digitar RENOVAR). Ajuste manual no cadastro tira o aluno do lote até
  o João escolher "Já renovei manualmente" ou "Foi só correção". Ver `PRONTIDAO.md`.
- **Fechamento (#214, #216):** visão por família; total = mensalidade − desconto;
  "Saldos atuais do cadastro"; seletor e fila só com ativos **pendentes/parciais**
  (aluno pago não gera mais fechamento).
- **Caixa:** forma de pagamento e competência nas linhas; recalcula a situação
  ao lançar/editar/apagar; não aceita mensalidade em dependente. Atalhos,
  filtros, busca e faixa do dia (PR #206) intactos.
- **Sincronização (#215, #216):** cada gravação é uma transação que compara
  com a versão lida; se outra sessão gravou antes, abre "Confira as duas
  versões" e para envio, publicação e fila. Painéis `pd-status`/`pd-detalhes`
  em Segurança e dados. `sairEApagar` também exige nada pendente na nuvem.
- **Backup/restauração (#218):** importar valida a estrutura e pede
  confirmação; restaurar aborta se a cópia anterior não gravou; lembrete de
  backup considera a cópia automática ("depois" adia 7 dias).
- **Reservas na Gestão (#219, #221):** confere todas as datas de um fixo (90
  dias); particular exclusivo no horário; grupo 2/3/4; locação e torneio com
  participantes; fila só é consumida depois da agenda gravada na nuvem;
  resposta (confirmado/recusado) vai só ao aluno. O João também não consegue
  mais sobrepor marcações nem reduzir uma turma abaixo dos agendados.
- **Visual:** contraste do Saibro, janelas claras (`pd-`/`pm-`), service worker
  usa a cópia guardada em erro 5xx.

**App do Aluno**
- Cartões **Créditos** e **Reposições** lado a lado no início (#209); aba
  "Créditos e reposições" com saldo, "vencem no fim do mês" e "Agendar reposição".
- Pagamento parcial: mostra Recebido / Falta; Pix, cartão e dinheiro cobram só o que falta.
- Dependente vê "Incluída na família / pagamento por …", sem Pix nem renovação.
- Reservas: entrar em dupla/trio/quarteto, participar de locação/torneio,
  confirmação antes de enviar, releitura da grade online, aviso de recusa.
- Tela **Aulas** (próximas + realizadas dos últimos 60 dias), tema Saibro e
  `mensOculta` seguem como estavam (`fmtMens` só ganhou o caso família).

**Fora dos apps**
- `.github/workflows/monitorar-publicacao.yml`: confere os apps publicados a
  cada 6 h e após cada publicação (HTTP, versão, JS, SW, CSS). Só leitura.
- `validar-pr.yml`: ~11 testes de navegador (Playwright) e emulador do
  Firebase com a regra publicada `etapa3-transicao`, dados fictícios.
- Documentos novos: `PRONTIDAO.md`, `APP-CHECK.md`, `PLANO-FAMILIA.md`;
  `SEGURANCA-P0.md`/`LEIA-ME.md` atualizados; `negocio/instalacao-cliente.md` reescrito.
- Site: calculadora e layout no celular; `privacidade.html` atualizada.
- **Apostila publicada** em `app-exercicios/` (#220; `preparar-pages.py` inclui
  `app-exercicios` em `PUBLICOS`).
- App **Família JK** (#211–#213, #217): aportes, sincronização entre aparelhos
  (`sync-merge.js`), menu, histórico mensal, recuperação de OFX. Só registro.

### Defeitos confirmados (a corrigir)
1. **Alarme falso de "CRÉDITOS DUPLICADOS"** — `renovacoesDoMes`
   (`app-gestao.js` ~5217) devolve a marca `ultimaRenovacao` **mais** os
   movimentos "Renovação do mês"; `achadosDoAluno` (~9397) acusa `length>1`.
   Toda renovação normal aparece como duplicada em Conferir números. Só lista,
   não altera valores.
2. **Fila de reservas trava ao pedir e cancelar antes do sync** —
   `syncRequests` (~2484): no mesmo envio entram `reserva_X/processado: true`
   (aceite) e `reserva_X: null` (cancelamento). O SDK recusa caminho que é
   ancestral de outro; a agenda já foi gravada mas a fila não é limpa, o
   par é refeito a cada sync e a vaga fica travada para outros alunos até a
   data passar. Os testes não cobrem (simulam `update` sem essa validação).

### Riscos e decisões para o João
- **Grupo aberto a qualquer aluno:** aluno só de particular pode "Participar
  da aula em grupo"; a presença desconta de `credGrupo`, que fica negativo
  (sem pacote único). Torneio aceita qualquer aluno. Decidir se é desejado.
- **Fixo exige as 13 semanas livres:** um bloqueio, feriado ou aula avulsa em
  qualquer semana recusa o pedido inteiro. O app do aluno aceita semana "só
  locação" e a Gestão recusa (aluno vê "enviado" e depois "não confirmada").
- **Reposição no menu de reservas** usa `EU.repos>0` enquanto os cartões usam
  `reposValidas`: pode oferecer reposição com o cartão mostrando 0.
- **Fechamento enviado ao aluno** mostra mensalidade cheia e total menor sem
  explicar — não escreve "desconto", mas a diferença aparece. Conferir com a
  regra "mensagens ao aluno nunca citam desconto".
- **Relatório "pago no mês"** (`relPagoNoMes`): sem `pagamentosExatos`, conta
  pelo mês do caixa (pagamento de setembro recebido em outubro conta em outubro). Suspeita.
- **Peso da sincronização:** cada gravação lê o banco inteiro duas vezes e
  reenvia a árvore inteira (antes subia só o que mudou). Pode pesar no
  celular com dados móveis. Suspeita, medir.
- **Conflito entre aparelhos:** a única saída é carregar a versão da nuvem;
  não existe "manter a minha". Até resolver, nada sincroniza.
- **Pedido de aparelho não aprovado** não é limpo da fila; com a regra etapa 3
  qualquer login anônimo pode criar `reserva_*` que ninguém apaga. A etapa 4
  resolve.
- **Publicação não exige teste verde:** a `main` exige PR, mas nenhum check
  obrigatório (`required_status_checks` vazio); `pages.yml` roda só
  `checar-tudo.sh`. Um PR vermelho pode ser publicado.
- **Monitor depende do Netlify** (`monitorar-publicacao.cjs`): se a cota
  acabar, fica vermelho a cada 6 h mesmo com o Pages no ar. Não confere
  apostila nem Família JK.
- **CI da academia roda o teste do Família JK** (`validar-pr.yml`): quebra no
  app da família bloqueia PRs da Gestão/Aluno. Esse teste usa o primeiro nome
  real de uma familiar do dono (já presente no app da família antes).
- **Apostila:** o service worker baixa ~9 MB no primeiro acesso (PNGs + PDF).
- Código sem uso: `rotuloDiaAlunos`, `proximaAulaPorAluno`, CSS `.al-grupo-t`,
  `cobrancaDoMes`, `enviarLote`. `checar-tudo.sh` perdeu o bit de execução
  (sempre chamado com `sh`, sem efeito).

### Pendências
- **Pedidos do João ainda não feitos (03/10):** (1) Renovar o mês — nome do
  aluno abre a ficha; (2) Início — Taxa de ocupação e Locações abrem a agenda
  **do mês** (hoje abrem a do dia); (3) App do aluno — resumo do mês na tela
  Aulas (pacote, feitas com datas, agendadas, saldo) e atalho fácil até ela.
- **Dependem do João:** chave pública do App Check + registro no console
  (monitoramento primeiro; ver `APP-CHECK.md`); caixa "Pronto para a regra
  final?" em ✓ e autorização para a etapa 4; repositório público/privado;
  ligar aviso de falha das Actions no GitHub; marcar `validar` como check
  obrigatório na proteção da `main`.

---

## 2026-10-02 · Publicações do Claude Code (PRs #198–#207)

Ficha (botões perigosos, ajustes com desfazer, Cobrar no WhatsApp, "Renovado
em", barra de créditos); aba Alunos por dia de aula (depois trocada pelo #214);
segurança (cópia legada sem valores, "Sair e apagar", `argJs`, 4 correções da
auditoria do aluno/site); prontidão da regra final com convite e "Não usa o
app"; aba Segurança e dados; homenagens 1º/2º do torneio; Caixa nova
(atalhos, receita/despesa com data, desfazer, filtros, busca, faixa do dia);
tema Saibro + bolinha + vidro nos dois apps, gerado por `tema-saibro.py`, com
opção "Verde clássico".


---

## 2026-10-07 · Codex: coordenação com Claude e avaliação das ações por voz

**Estado: documentação; nenhum botão de voz implementado ou publicado.**
Base examinada: `e77844a1d440bf13d51a8d47c990045eebc28558`, versão publicada
**2026-10-07-4**. Consulte `ACOES-POR-VOZ.md` para escopo e evidências.

- #223 do Claude já está publicado: alarme falso de duplicação e conflito de
  caminhos na limpeza da fila corrigidos. A seção anterior “Defeitos
  confirmados (a corrigir)” é uma fotografia histórica anterior ao #223.
- #224 do Claude está aberto, com validar verde no head
  `57f2083c52ab70f35ac80b7ff4b2971f2fcd636d`, versão proposta
  **2026-10-07-5**, aguardando o OK de integração solicitado no corpo do PR.
  A implementação de voz deve considerar essa dependência.
- Publicação da main e monitor 37695062366 verdes: Gestão Pages, Aluno Pages
  e Aluno Netlify identificados como 2026-10-07-4. Não auditamos dados reais.
- AGENTS.md aponta o guia e diário comuns também para Codex, com consulta a
  PRs concorrentes e distinção entre proposta e publicação.
- Proposta: bolinha acima da navegação, painel de voz/texto, prévia e
  confirmação; cancelar uma ocorrência, agendar respeitando capacidade e
  renovar sem duplicar. Sem nova regra de crédito, pagamento ou Firebase.
- Arquivos desta entrega: AGENTS.md, ACOES-POR-VOZ.md e esta entrada do
  diário. Nenhuma alteração nas telas, versões, demo, regras ou dados.
- Verificação documental: regras e funções citadas conferidas na base acima;
  PR #224 e monitor público examinados. Compatibilidade de microfone ainda
  requer teste no aparelho real. CI desta entrega é registrado no próprio PR.

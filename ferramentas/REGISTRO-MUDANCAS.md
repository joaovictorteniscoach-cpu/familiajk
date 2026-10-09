# Registro de mudanças — Gestão e App do Aluno

Diário do que foi publicado, por quem, o que substituiu o quê e o que ficou
pendente. Mais de uma inteligência trabalha neste repositório (Claude Code e
Codex): **leia este arquivo antes de começar e acrescente uma entrada ao
terminar**, para uma não desfazer o trabalho da outra sem saber.
Sem nomes reais de alunos ou de familiares aqui (o repositório é público).

---

## 2026-10-09 · Claude Code: almoço e compromisso do João só bloqueiam aula

Pedido do João: "almoço ou bloqueio pessoal não deve impedir o aluno de agendar
locação ou torneio; o bloqueio pessoal só vale para aula presencial". Versão
`2026-10-09-1`, sobre a V12 (#237). Nenhum dado ou regra do Firebase alterado.

- **Regra:** `ehBloqueioPessoal` (Gestão) / `ehSoSemAula` (aluno) = tipo
  `pessoal` (inclui compromissos da agenda) ou `bloqueio` sem motivo chuva.
  Tira só aula/grupo/personal do horário; locação e torneio entram. Chuva
  continua bloqueando tudo. Para fechar a quadra para todos (manutenção), use
  "Fechado" no funcionamento do horário.
- **Gestão:** `podeAdicionarAoHorario` ignora o bloqueio pessoal para
  locação/torneio — vale para o lançamento manual (`saveSlot`), para os pedidos
  do app (`pedidoAgendaValido`) e para a voz. `aulasDoDia`: só chuva zera o
  horário; locação/torneio sob almoço entram em "fora da conta".
- **Publicação:** `gradePublicaSegura` manda `pessoal` como `bloqueio` (sem
  título); compromissos (`DB.compromissos`) saem como `bloqueio` em vez de
  `ocupado`. App antigo em cache segue restritivo (mostra "Indisponível").
- **App do aluno:** `slotState` devolve `{st:'loc',semAula:true}` ("Sem aula ·
  locação ou torneio"); o menu mostra só Alugar a quadra e torneio;
  `abrirBook` e a conferência do fixo recusam aula nesse horário.
- Teste: `testar-locacao-minhas-aulas-browser.cjs` (15) com os dois lados;
  falha na V12 com "Horário reservado".

---

## 2026-10-08 · Claude Code: locação na agenda e "Minhas aulas" no app do aluno

Pedido do João: cliente com horas de locação às vezes não conseguia marcar.
Versão `2026-10-08-12`, sobre a V11 (#236). Nenhum dado, saldo ou regra do
Firebase alterado; nada é corrigido automaticamente.

- **Causa (Gestão):** `slotPickAluno` trocava o Tipo para "aula" ao escolher o
  aluno, mesmo com Locação já escolhida ou cliente de perfil Locação. Horário
  "só locação" recusava ("não dá para agendar aula"); em horário de aula, a
  locação era gravada como aula e o ✓ descontava `creditos` em vez de
  `locCred` (e o saldo negativo podia travar o app do aluno). Agora: Locação e
  Torneio já escolhidos ficam; perfil Locação/Torneio e horário "só locação"
  vêm com Locação. O select de aluno mostra as horas de locação. Voz:
  `tipoAluno` respeita o perfil.
- **Aviso do sininho:** o pedido do app ("pediu locação 1h30") aparecia como
  "reservou ✅ — Aula". `ehPedidoLocacao`/`textoNotif` mostram "🔑 Fulano pediu
  locação (1h30) · toque para lançar na agenda"; `irDoAviso` abre o horário com
  cliente, Locação e "só nesta data" preenchidos — nada é gravado sem Adicionar.
- **Conferir números (só lista):** `achadosDoAluno` avisa cliente de locação
  (perfil, ou sem plano de aulas e com histórico de `locCred`) com aula
  descontada do pacote ou marcação futura como aula.
- **App do aluno:** "Alugar a quadra" mostra "usa suas horas de locação · você
  tem Xh" (`horasLocAluno`, `locBtnHtml`) e a mensagem pede para usá-las; sem
  saldo, segue o preço por hora. O pedido continua sendo aviso + WhatsApp
  (não entra na fila). Risco não testado aqui: o WhatsApp abre depois da
  conferência na nuvem e o iPhone pode bloquear; o aviso no sininho chega.
- **Minhas aulas:** aba própria na barra de baixo (6 botões, ícone da bolinha,
  `#nav-al-aulas`), botão laranja no topo do Início (`#home-minhas-aulas`, com
  "N feitas · N marcadas em <mês>") e `irMinhasAulas()` em todos os atalhos;
  o cartão do Início virou "Próxima aula ›". A página ganhou título e mostra a
  lista inteira do mês (sem a rolagem de 120px). Torneio segue no Perfil.
- **Abas em Minhas aulas** (pedido seguinte: sem rolagem longa, cada assunto
  no seu lugar): "Resumo do mês" (números, plano e todas as datas feitas e
  marcadas), "Próximas (N)" (confirmar, cancelar, Google Agenda, salvar o mês,
  agendar mais, falar com o João) e "Feitas (N)" (histórico). Estado em
  `aria-selected` (`abaMinhasAulas`); não usa `.seg`, porque o
  `setView` da agenda limpa o "on" de todos os `.seg`. Barra de baixo e botão
  laranja abrem o Resumo; "Próxima aula ›" abre Próximas. Em Próximas, as aulas
  dos meses seguintes ficam agrupadas num `<details>` fechado. Testes antigos
  (`testar-aulas-agenda-aluno`, `testar-trava-cancelamento`, `testar-3-pedidos`)
  passam a abrir a aba Próximas antes de mexer nos cartões; o de toque de 44px
  mede só os botões à vista.
- Teste novo `testar-locacao-minhas-aulas-browser.cjs` (12, no CI); falha na V11.
- `testar-contraste-fechamento-browser.cjs` falha neste ambiente local também na
  main (a lista de alunos fica vazia no teste); no CI passa. Não é desta mudança.
- **Codex:** a barra do aluno agora tem 6 colunas (`aulas-aluno.css`); se
  mexer na `.nav`, mantenha `repeat(6,…)`.

---

## 2026-10-08 · Claude Code: assistente por voz vira conversa e entende pedidos do dia a dia

Pedido do João com dois prints da V10 (#235 do Codex): “Quantas aulas eu tenho
agora de tarde das 16 até o final da noite” e “Abra os horários das 7h00 da
manhã até as 18h00 de domingo para locações” não funcionavam; o painel ficava
pedindo aluno em vez de mostrar uma conversa com a resposta ou o que foi feito.
Versão `2026-10-08-11`, sobre a V10 do Codex. Nenhum dado real, saldo ou regra
do Firebase alterado.

- **Conversa** (`#voz-conversa`, `msg`, `arquivarVivos`): pedido à direita,
  resposta à esquerda; `#voz-consulta` e `#voz-resultado` viraram o bloco vivo
  no fim da conversa (ids preservados). Some ao fechar; nada é guardado.
  Formulário de aluno escondido até ser preciso (`mostrarCampos`, botão
  `#voz-manual`); Confirmar só aparece com prévia. Enter envia; sugestões.
- **Entende mais** (`interpretarPergunta`, `lerFaixa`, `periodoLongo`):
  faixa de horário, “faltam hoje”, próxima aula, semana/mês/ano (conta do
  Início), horários livres, aluno (créditos, reposições válidas, próxima aula,
  horário fixo, mensalidade), financeiro (pendentes, recebido, a receber;
  respeita `hideVals`), ocupação, locações, preços e ajuda.
- **Ações novas com prévia e confirmação** (`interpretarAcaoEspecial`,
  `planoEspecial`, `executarEspecial`): funcionamento (aula / só locação /
  fechado) numa data (`horarioData`) ou toda semana (`horarioCfg`), com troca na
  prévia; chuva por data e faixa via `aplicarChuva`. Mesma barreira do Codex:
  nuvem conferida, `guardarVersoes`, plano recalculado idêntico, `gravarAgora`.
- **Extrato e histórico** (pedido seguinte do João, print “O aluno Alan tem
  quantas aulas agendadas neste mês de outubro”): `extratoAluno` lista cada
  aula do período com a situação pela presença (confirmada, sem confirmação,
  falta, avisou, agendada), mais desmarcadas (exceção de fixo, `NOTIF`
  “cancelou” do app) e chuva (`chuvaEm`, `DB.chuvas`); “já fez” soma desde
  `inicioRegistros`. Também: próximas aulas do aluno, choveu tal dia, aulas
  desmarcadas/quem cancelou, quem faltou, presenças por confirmar, quem tem
  reposição, alunos ativos. Verbo no passado (“cancelou”) é pergunta; ação
  exige imperativo/infinitivo (`AGIR_IMP`); marcar chuva exige pedido claro.
- **Presença, cobrança e resposta imediata** (terceiro pedido): “marcar
  presença da Ana hoje / de todos de hoje” usa o próprio `togglePresenca` com
  prévia do saldo e a mesma barreira (só aula já começada; pula presença,
  falta, aviso, aula do cartão e reposição sem saldo; `agDate` volta ao dia
  que estava aberto). “Cobrar a Ana / quem está devendo” chama `cobrar` no
  toque (sem `await` antes, por causa do iPhone) com o mês de hoje
  (`cobrarMesAtual`), sem alterar dados. Ao fim da fala, `avisarQueEntendeu`
  diz “Claro, João. Só um minuto.” e a resposta entra na fila
  (`pararMenosAviso`); `falar()` libera a voz do iPhone no toque.
- Depois de ação salva na nuvem, a conversa segue (`st.aplicado` volta a falso
  em `resultadoSalvo`); pendência continua bloqueando como antes.
- Testes: novo `testar-voz-conversa-browser.cjs` (21, no CI); o do Codex passa
  inteiro em Chromium com um ajuste: “Qual valor da aula?” agora responde os
  preços em vez de erro. Doc em `ACOES-POR-VOZ.md`.
- **Codex:** se for mexer em `acoes-voz.js`, parta desta versão; os ids e a
  API `JVAcoesVoz` continuam os mesmos.

---

## 2026-10-08 · Codex: perguntas à agenda pelo mesmo botão de fala

- Responsável: Codex; branch `codex/consultas-agenda-voz-2026-10-08`; base main `9489dea427d3a5d8f0f3576e6971d62c6d842e30` (V9 publicada por #234; preserva #232). Proposta de versão `2026-10-08-10`.
- Pedido do João: perguntar quantas aulas tem no dia, alunos do período da tarde
  ou quem está no horário das 16h, com resposta por áudio. Implementado no mesmo
  módulo/botão: consulta por dia (hoje como padrão), manhã/tarde/noite ou horário;
  data e horários explícitos em texto, áudio automático opcional e Ouvir resposta.
  Não é uma assistente para perguntas gerais: formatos delimitados de agenda.
- Usa aulasDoDia/comIndiceAgenda do #233: dupla/trio/quarteto = uma aula;
  respeita exceções, janela dos fixos, bloqueios e duplicatas. Identifica todos
  os participantes e lê o nome do cadastro atual quando vinculado. Personal
  entra no total. Locação/torneio/compromisso são explicados na consulta de
  horário, sem virar aula nem declarar quadra livre por falta de marcação.
- Consulta só lê dados atuais do dono: leitura da nuvem, mesma barreira de
  sessão/pendência/conflito, nenhum snapshot, persist, renovação ou escrita.
  Outra sessão mudando a base exige conferência em Segurança e dados.
  Resposta tardia após fechar/sair é ignorada; datas relativas usam São Paulo.
  Comandos continuam com prévia e confirmação, consulta responde diretamente.
- Preparados 124 testes de voz (31 por navegador/tema), incluindo os oito
  cenários novos de consulta, respostas simuladas, fronteiras 12h/18h, sem
  alteração de dados, replay, falha de leitura, silêncio, XSS e dia de São Paulo.
  CI completo e leitura das capturas do commit final serão exigidos antes do merge.
  Não acessa dados reais nem comprova hardware do iPhone; João já confirmou
  a captura da versão anterior no aparelho.
- Preservados #227/#229/#230/#231/#233/#232 e suas proteções; nenhum dado,
  saldo ou regra do Firebase alterado. Cinco carimbos/caches sincronizados,
  demo regenerada, sem mudanças no tema gerado.
- Integração: #234 foi publicado pelo Claude como V9 durante o CI. Reaplicado
  sobre main 9489dea427d3a5d8f0f3576e6971d62c6d842e30. Sua correção de contarAulasAluno,
  teste de 14 números do Início e todos os arquivos gerados foram preservados.
  V10 sucede V9. Se a main avançar antes deste merge, reaplicar e testar novamente.
- Publicação autorizada previamente na sessão; esta entrada registra
  implementação, ainda sem CI final/publicação. PR, CI, Pages e monitor serão
  acrescentados ao registro do PR após conclusão. App Check continua externo.

---

## 2026-10-08 · Claude Code: valor do mês pela agenda conta aula repetida uma vez

#233 publicado como `2026-10-08-7` (João confirmou que 19h/20h ficaram de 1 h).
Pedido seguinte do João ("pode resolver também"): o achado que ficou aberto.
Versão `2026-10-08-9` (o Codex publicou a V8 da fala, #232, enquanto este CI
rodava: integrada por merge, fala e testes dele preservados). Nenhum dado,
saldo ou regra alterado.

- `contarAulasAluno` (base de `mensalidadeDaAgenda`: sugestão da renovação,
  foco "valor da agenda" e previsão do mês) passa a contar pelas aulas de
  `aulasDoDia`, a mesma conta do Início: fixa + avulsa no mesmo horário e
  19:00 + 19:30 do mesmo aluno são 1 aula (antes 2). Horário bloqueado não
  conta, como no Início. Usa `comIndiceAgenda` (o Início ficou ainda mais
  rápido, porque a previsão do mês passa por aqui para cada aluno).
- `testar-numeros-inicio-browser.cjs` com 14 verificações (a nova falha na V8).

---

## 2026-10-08 · Codex: fala flutuante translúcida, brilho e menos toques

- Responsável: Codex; branch `codex/voz-topo-ondas-2026-10-08`,
  [PR #232](https://github.com/joaovictorteniscoach-cpu/familiajk/pull/232), base
  `f9dc2de66b5bd249a540739d84757bb4a1f7f87a` (V7 publicada);
  versão proposta `2026-10-08-8`.
- Escolha final do João após as fotos: opção 2 (posição flutuante atual,
  30% de transparência) com um pouco mais de brilho. A alternativa no topo
  e a faixa inferior foram só prévias. A espera pela posição está resolvida;
  publicação de mudanças validadas já foi autorizada na sessão.
- Implementado: mesmo círculo de 54px acima da navegação, 70% de opacidade,
  brilho suave e halo; dois temas. Cabeçalhos mantêm o layout da main.
  Transparência deixa discreto, mas não elimina a sobreposição da área de toque,
  limitação já apresentada ao João antes da escolha.
- Tocar inicia escuta; resultado final confere aluno, horário e nuvem
  automaticamente e apresenta a prévia, ainda exigindo confirmação explícita.
  Renovação mantém a confirmação nativa dos saldos. Ondas acompanham escuta
  ou reprodução real; respeitam movimento reduzido e encerram ao fechar/sair.
- Resposta automática opcional e Ouvir confirmação após nuvem confirmada,
  sem reaplicar a ação. Confirmado em texto junto do botão de ouvir; repetir
  salvamento pendente não executa novamente a marcação.
- Testes: localização/toque/visibilidade em 320/390/520/1280 e nos dois temas,
  92 verificações de fala em Chromium/WebKit, callbacks, ondas, silêncio,
  proteção de dados e de nuvem, sem acesso aos dados reais. O CI anterior
  37789324633 aprovou o fluxo; o head final com brilho precisa ser validado
  por completo e ter as capturas revisadas antes da integração.
- Preservados #227/#229/#230/#231/#233 (hora do servidor, Escritório, reposição,
  fixos, WhatsApp, números do Início e grade), CSS/temas/demo gerados e seus testes. Demo regenerada;
  cinco versões e caches sincronizados. Sem novas regras ou correção de saldos.
- Publicado como V8 em #232: merge `97a7a2d49e1a981b47117a5ab93a868337603d2c`,
  CI 37812074240 aprovado (92 voz + 17 Firebase/emulador), capturas finais
  revisadas, Pages 37814907078 e monitor 37814995695 aprovados. Monitor
  confirmou Gestão Pages, Aluno Pages e Aluno Netlify na V8.
  App Check permanece dependente da configuração externa.

- Integração final: #233 do Claude foi publicado como V7 durante o CI.
  Reaplicado sobre a main nova, preservando contagem sem duplicatas, grade de
  horas cheias, cancelamento de meia hora antiga, crédito integral e Ano.
  CSS/temas/demo gerados e teste de números do Início permanecem presentes.
  Nossa V8 sucede sua V7; validar de novo o head final antes de integrar.

---


## 2026-10-08 · Claude Code: números do Início, grade de horas cheias e comparativo do ano

#231 publicado como `2026-10-08-6`. Pedido do João: o total de "Aulas do dia" não
batia com a agenda; ver se alguma aula contava duas vezes e se havia outros
números errados. Versão `2026-10-08-7`. Nenhum dado, saldo ou regra alterado.

- **Contagem de aulas** (`aulasDoDia`, usada por `contarAulas`, "já dadas",
  comparativo e gráfico): continua 1 aula por horário (dupla = 1). Agora o mesmo
  aluno marcado duas vezes onde só cabe uma aula conta 1: fixa + avulsa no
  mesmo horário (inclusive tênis + personal, vale a avulsa) e horários que se
  sobrepõem (19:00 e 19:30, só aluno vinculado). Antes contava 2.
- **Conferência** (`abrirConferenciaAulas`, `#ov-conf-aulas`, classes `ca-`):
  link "conferir" sob os anéis (vira "⚠️ N repetidas na agenda") lista aula por
  aula, as repetições e o que está na agenda mas não é aula. Só lista.
- **Agenda do dia:** rótulo mostra "N aulas · M atendimentos" (atendimentos =
  cada pessoa + locação/torneio, o número antigo).
- **Ocupação:** aula de 1 h ocupa a meia hora vizinha (19:00 cobre 19:30); antes
  um dia cheio parava em 90%.
- **Créditos em aberto:** só ativos, saldo negativo não desconta, grupo do misto
  entra; reposições só as válidas (`reposValidas`), e o foco da lista bate.
- **Grade só de horas cheias** (pedido do João): 14:30, 15:30, 19:30 e 20:30
  saíram. `HORAS` continua com todas (é por ela que as contas passam, nada já
  marcado some); `HORAS_GRADE` é o que a agenda e a configuração mostram;
  `slotModo` devolve `fechado` para meia hora (pedido novo recusado; cancelar
  aula antiga continua valendo). Linha de meia hora só aparece onde ainda há
  algo marcado (`horasVisiveis`). App do aluno recebe `horasPublicadas()` e
  `semMeiaHora()` (meia hora fechada). Semente sem meia hora.
- **Crédito:** `creditoSlot` passa a ser calculado sobre a grade: toda aula vale
  1 (antes 14h, 15h, 19h e 20h valiam ½ no ✓ da agenda e no fechamento). Só
  daqui para a frente; presença já gravada mantém o custo dela.
- **Comparativo com Ano** (`trocarPeriodoCmp('ano')`, setas `navCmp`): 1º/jan
  até hoje contra o mesmo trecho do ano anterior; ano passado inteiro contra o
  anterior. Contas limitadas a `inicioRegistros()` (fixo antigo sem "desde"
  não inventa aula antes do app) e sem % se o ano anterior não está no app.
  `comIndiceAgenda` indexa a agenda por data durante contas longas (o Início
  ficou mais rápido que antes). Número de 3+ dígitos empilha a porcentagem.
- Teste novo `testar-numeros-inicio-browser.cjs` (13 verificações, no CI; falha
  na V6).
- **Achado para o João decidir (não mexi):** `contarAulasAluno` (valor do mês
  pela agenda) conta fixa + avulsa no mesmo horário como 2 aulas, enquanto o
  fechamento conta 1.

---

## 2026-10-08 · Claude Code: fechamento abre direto o WhatsApp do aluno

#230 (reposição + horário fixo) publicado como `2026-10-08-5`. Em seguida, pedido
do João: "quando eu enviar ou selecionar um aluno para o fechamento, fazer o
envio automático para o número de WhatsApp cadastrado". Versão `2026-10-08-6`.

- **Causa:** `enviarFechamento` esperava a imagem (`await _fechBlob()`,
  html2canvas) e só depois chamava `window.open(wa.me…)`; no celular a espera
  tira o "toque" e o navegador bloqueia a janela — nada abria, mas
  `marcarFechEnviado` marcava o aluno como enviado.
- **Agora:** a conversa abre dentro do toque (`window.open` antes de qualquer
  `await`); a imagem é salva logo depois (`salvarImagemFech`). Se a janela vier
  bloqueada (`null`), o aviso `#fc-envio-hint` vira um botão `a.fc-abrir` e só
  o toque nele marca o envio.
- **Selecionar já envia:** nome na fila "Quem falta" (`escolherEEnviarFech`,
  📲 via CSS para quem tem número) e o seletor `#fc-aluno` abrem a conversa.
  Aluno sem número: só mostra o fechamento e avisa (sem abrir lista de
  contatos ao selecionar). `escolherFech` removida (sem outro uso).
- WhatsApp não permite enviar sem o toque em "enviar" sem a API paga do
  WhatsApp Business: o app abre a conversa com o texto pronto.
- Teste novo `testar-fechamento-whatsapp-browser.cjs` (5 verificações, no CI;
  falha na V5). Nenhum dado, saldo ou regra alterado.

---

## 2026-10-08 · Claude Code: reposição no agendamento e horário fixo conferido antes de enviar

Itens 1 e 2 da lista de riscos, pedidos pelo João. Versão `2026-10-08-5`, sobre a
V4 do Codex (#228). Nenhum dado, saldo ou regra do Firebase alterado.

- **Reposição:** o menu de horários (`escolherSlot`), `abrirBook`, o resumo
  enviado ao João (`meuQuadro`) e o número do Início (`v-repos`) usavam
  `EU.repos` (inclui reposições vencidas); agora usam `saldoReposAluno()`, a
  mesma conta do cartão (`reposValidas`, zero vale).
- **Horário fixo:** `confirmarAgendamento` confere cada semana como a Gestão
  (`pedidoAgendaValido`): semana "só locação" passa a contar como conflito
  (antes aceita e recusada depois). Com conflito em outras semanas, pergunta
  e oferece marcar só a data escolhida (pedido vira `pontual`); recusa nada é
  enviado.
- **Gestão publica o que ela confere:** janela da grade do aluno de 60 → 90
  dias (a mesma do fixo) e compromissos do João como evento `ocupado` sem
  título (o aluno vê "Reservado"; a Gestão já recusava pedido nesses horários).
- Teste novo `testar-reposicao-fixo-browser.cjs` (7 verificações, no CI); as
  duas partes falham na V4. Teste de voz do Codex rodado só em Chromium aqui
  (WebKit não instalado no ambiente; roda no CI).

---

## 2026-10-08 · Codex: botão funcional de ações por voz

- Responsável: Codex. Branch `codex/acoes-voz-gestao-2026-10-08`, [PR #228](https://github.com/joaovictorteniscoach-cpu/familiajk/pull/228), base main
  `ab3aacb606588d134b538b1fdfb2aecaead19c8f` (V3 publicada); proposta `2026-10-08-4`.
- Implementado: atalho real em Início/Agenda/Alunos e Mais, painel com fala pt-BR,
  alternativa por texto/ditado, identificação explícita do cadastro, prévia e
  confirmação. Camada própria reutiliza agenda e renovação; não escreve outro
  modelo de dados nem muda regras do Firebase.
- Proteções: particular exclusivo/grupos com capacidade, uma ocorrência,
  ajuste manual/segunda renovação, cópia anterior confirmada, base e mapa
  atualizados, bloqueio de duplo envio, sucesso apenas com nuvem confirmada.
  A resposta pendente permite somente repetir o salvamento.
- Testado: 84 verificações próprias em Chromium/WebKit e nos dois temas,
  reconhecimento simulado, sem dados reais ou acesso à nuvem real. CI
  [37767393044](https://github.com/joaovictorteniscoach-cpu/familiajk/actions/runs/37767393044) aprovado
  no código `adb23d227ed18f0e85dfa3ae741b82bbbe2ef014`, incluindo fumaça,
  regressões de aulas/agenda, pagamentos, família, renovação e 17 verificações
  do SDK Firebase com regras publicadas no emulador. Imagens reais revisadas.
  Ajuste final de apresentação: ao conferir, rolar até a prévia/confirmar e manter
  o cabeçalho/fechar acessível; o CI do novo commit deve repetir a validação.
  Microfone real no iPhone/Safari/PWA continua pendente de ensaio no aparelho.
- Demo regenerada e novos arquivos no cache do app; versões dos cinco arquivos
  sincronizadas. Removida a verificação do protótipo isolado do teste de Aulas,
  substituída por verificações do botão que o aplicativo realmente carrega.
- Concorrência: #227 e #229 do Claude publicados durante a preparação.
  Reaplicado sobre `ab3aacb606588d134b538b1fdfb2aecaead19c8f`: preservados hora do servidor,
  retorno de cancelamento recusado, hora dos avisos e Escritório JV (somente
  leitura). Seus testes permanecem no CI e o gerador mantém Escritório oculto
  na demo. Versão V4 sucede a V3 do #229, evitando arquivos distintos com a
  mesma versão no cache. Nenhum outro trabalho foi duplicado.
- Publicação desta entrega: versão `2026-10-08-4` pelo PR #228, após seu CI
  final aprovado. João já autorizou publicar mudanças validadas na sessão.
  A versão pública anterior conferida era V3 de 08/10. A entrega é confirmada
  pelo merge do #228, workflow Pages e monitor da main identificando a V4;
  consultar esses registros antes de afirmar que já está no ar.
- App Check: sem mudança; depende da chave pública/console do João.

---

# 2026-10-08 · Resumo para o Escritório JV (Claude Code, branch `claude/escritorio-resumo`)

O Escritório JV (agentes de IA do João, hospedado no ChatGPT Sites, código fora
deste repositório) não lê o Firebase. Ponte criada sem mexer em regra:
**Mais → Segurança e dados → Escritório JV → Copiar resumo** gera um JSON
(`formato: jv-escritorio-resumo`, `versao: 1`) que o João cola no Escritório.

- `resumoParaEscritorio()` só lê. Usa `pendenteDoFechamento`/`saldoMensalidade`
  no **mês de hoje** (`mesReal`, não o mês aberto na tela), `vencDe`,
  `devidoExtraPart/Grupo`, `reposPorIdade`, `viradaPendente` (vira aviso).
  Dependente de família fica fora das mensalidades (cobra o responsável);
  inativo fica fora. Aula além do pacote sem preço cadastrado vai com valor 0
  (o Escritório avisa em vez de sumir com ela).
- Leva primeiro nome + inicial do sobrenome, `ref` = id interno e telefone de
  quem paga. O Escritório guarda criptografado e **não passa telefone à IA**.
- Tela usa `fmt()` (respeita valores ocultos); o JSON leva o número real.
- Teste: `ferramentas/testar-resumo-escritorio-browser.cjs` (fictício), no
  `validar-pr`. A lista de mensalidades usa `pendenteDoFechamento` (a mesma
  das Cobranças pendentes do Início, vinda do #226).
- **Contrato:** mudar campo/nome do JSON exige mudar `src/academia.mjs` do
  Escritório (validação estrita) e a fixture `tests/fixtures/resumo-gestao-exemplo.json` de lá.

Pendente: leitura automática (sem copiar/colar) exige uma regra nova no
Firebase só de leitura para uma conta do Escritório — depende de autorização do João.

---

## 2026-10-08 · Claude Code: trava de 4h do cancelamento à prova de relógio e fuso

Relato do João: aluna cancelou às 05:24 a aula das 08:00 (2h36 antes). Só existe
um caminho de cancelamento (`cancelarAula`, reescrito pelo Codex na V8 e
preservado), mas as duas travas usavam o relógio do celular: no app do aluno
`horasAte` (relógio e fuso do aparelho) e na Gestão `cancelamentoTardio` com o
`ts` mandado pelo celular. Celular com relógio atrasado ou em outro fuso (UTC-5
dá 4h36 para a mesma aula) passava. Versão `2026-10-08-1`.

- **Aluno:** `podeCancelarAula`/`horasParaAula` contam a aula no horário de
  Brasília (`msAulaBR`, via `Intl` com `America/Sao_Paulo`) contra a hora do
  servidor (`agoraReal` = relógio + `.info/serverTimeOffset`). Usado nas duas
  conferências de `cancelarAula`, no botão da lista e no da agenda. O pedido
  leva `id` e `tsServ` (`ServerValue.TIMESTAMP`); o `id` fica em
  `MEU.cancelados`.
- **Gestão:** `quandoAlunoEnviou` usa `tsServ` → hora embutida na chave do
  `push` (já corrigida pelo servidor, `tsDaChavePush`) → `ts` só em último
  caso. Cobre também quem ainda está com versão antiga do app.
- **Retorno à aluna:** com o `id`, a recusa "Cancelamento fora do prazo" agora
  chega (`respostasReservas`); `conferirRespostasReservas` tira o cancelamento
  de `MEU.cancelados`, a aula volta a aparecer marcada e ela vê o aviso. Antes
  a recusa não tinha `id`, a aula sumia só no celular dela. Toast da Gestão
  lista quem cancelou fora do prazo.
- Regras do Firebase **não mudaram**: a publicada já aceita campo extra; o
  emulador (`testar-salvamento-firebase-browser.cjs`, novo assert) confirma
  `tsServ` numérico. Endurecer (exigir `tsServ == now` na regra) fica como
  opção futura, só com autorização do João.
- Teste novo `testar-trava-cancelamento-browser.cjs` (no CI): caso real 05:24
  × 08:00, fuso UTC-5 e relógio 3h atrasado (a conta antiga liberava), prazo
  ok, recusa devolvendo a aula, e Gestão não aplicando o tardio. Nenhum dado,
  saldo ou cadastro alterado.
- **Depois do relato:** o cancelamento tinha sido feito às 23h da véspera
  (dentro do prazo); a Gestão só busca avisos aberta e o aviso "cancelou —
  Aula · 08/10 08:00" chegou às 05:24 sem dizer quando foi enviado. O João
  pediu para publicar a trava e melhorar o aviso (versão `2026-10-08-2`):
  `quandoEnviadoTxt` → pop-up "… · enviado ontem às 23:00" e, no sino,
  "enviado hoje/ontem/dia dd/mm às hh:mm" (antes "recebido", que confundia).
  O aviso do aluno leva `ts` pela hora do servidor (`agoraReal`). Na lista do
  sino o texto do aluno passou a ir por `esc()` (antes ia cru no innerHTML).

---

## 2026-10-07 · Claude Code: 2 defeitos corrigidos (#223) e os 3 pedidos de 03/10

- **#223 publicado (versão `2026-10-07-4`):** os dois defeitos da revisão
  abaixo. `renovacoesLancadasNoMes` conta só os lançamentos do mês para o
  alarme de duplicados (`renovacoesDoMes` segue igual para o bloqueio);
  `updatesFilaSemConflito` tira `reserva_X/processado` quando `reserva_X` é
  apagada no mesmo envio. Teste `testar-fila-renovacao-browser.cjs` (no CI).
- **3 pedidos (versão `2026-10-07-5`), aprovados por simulação:**
  (1) Renovar o mês: nome do aluno (`rmNomeLink`) abre a ficha; fechar a ficha
  volta à renovação com as mesmas marcações (popstate da renovação só fecha
  quando o estado deixa de ser `renova`); (2) Início: Taxa de ocupação e
  Locações chamam `verAgendaMes()`; (3) App do aluno: `resumoMesAluno` /
  `renderResumoMes` no topo da tela Aulas (feitas do mês pelo
  `PUB.historico`, marcadas pelos fixos/eventos da grade, saldo) e atalho
  `#cred-page-mes` em Créditos. Só leitura nos dois apps.
  Teste `testar-3-pedidos-browser.cjs` (relógio fixo, no CI).
- **Contraste das letras (versão `2026-10-07-6`, pedido do João):** varredura
  de todas as telas dos dois apps nos dois temas. Corrigido: data das próximas
  aulas e "Precisa falar com o João?" (letra clara em cartão branco), botão
  "Falar com o João", aviso e prioridade da Evolução, torneio vazio e "Aulas
  sem horário" (no Verde clássico ficava letra clara em fundo branco),
  cabeçalho dos dias da agenda do aluno e botão "Registro" da Avaliação na
  Gestão (no Saibro, o "meio ar" deixava fundo cinza). Regras no fim do
  `<style>` do aluno e em `EXTRA`/`EXTRA_ALUNO` do `tema-saibro.py`.
  Verificação de contraste incluída no `testar-3-pedidos-browser.cjs`.
  Na `2026-10-07-7`: etiqueta "vence em…" das Cobranças pendentes (Início
  da Gestão) — `.pend-item span{color:var(--jv-copy-soft)!important}`
  deixava a letra creme sobre a etiqueta creme; agora `.pend-item .venc-tag`
  tem letra escura por urgência. Varreduras de contraste devem abrir as
  seções dobráveis (`.dobra.on`), senão não enxergam essas listas.
  Ficaram como estão (no limite, 4,4:1): botões brancos sobre o saibro
  `#C2582E` (cor da marca).
- Nenhuma migração, nenhuma gravação nova, regras do Firebase intactas.

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

### Defeitos confirmados (corrigidos no #223, ver entrada acima)
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
- **Fixo exige as 13 semanas livres** (aviso antes de enviar desde 08/10, ver entrada): um bloqueio, feriado ou aula avulsa em
  qualquer semana recusa o pedido inteiro. O app do aluno aceita semana "só
  locação" e a Gestão recusa (aluno vê "enviado" e depois "não confirmada").
- **Reposição no menu de reservas** (corrigido em 08/10) usava `EU.repos>0` enquanto os cartões usam
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
- **Pedidos do João de 03/10 (feitos em 07/10, ver entrada acima):** (1) Renovar o mês — nome do
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

---

## 2026-10-07 · Codex: Aulas do aluno e horários do mês na agenda

**Estado: versão preparada 2026-10-07-6; não publicada.**
João pediu revisão antes de lançar. A integração na main depende dessa
confirmação, depois dos testes. Base: `893ecca78f5752d88193ab6e736825760e07769e`.

- Aulas: cada próxima marcação tem Confirmar presença, Cancelar aula e
  Adicionar ao Google Agenda; acesso pelo cartão do Início, Créditos e Perfil.
  Particular, grupo, Personal e dependente usam o mesmo acesso.
- Cancelamento até 4h antes (inclusive exatamente 4h), com nova conferência
  depois de ler a nuvem; envio deve confirmar na fila antes de mudar o estado
  local. Só a data escolhida é cancelada, preservando o fixo.
  Confirmação de presença continua disponível antes do início da aula.
- Histórico limitado ao mês atual e sem corte de 20/30 aulas. A Gestão
  publica todas as presenças válidas do mês; nenhuma presença ou saldo é
  corrigido/regravado por essa mudança.
- Cartões legíveis nos dois temas e ações com pelo menos 44px de toque.
  Folha nova `aulas-aluno.css`, carregada depois dos temas e guardada no SW.
  Os inputs do gerador Saibro não mudaram; folhas geradas permanecem idênticas.
  Demo regenerada pelo mesmo algoritmo, validado contra a saída anterior.
- Salvar horários do mês: prévia e um arquivo ICS com eventos individuais,
  horário de Curitiba, IDs estáveis, sem dados de outro aluno. Eventos do
  mês, fixos válidos e presenças registradas são deduplicados. Não é
  sincronização automática com Google; alterações/cancelamentos posteriores
  precisam ser atualizados na agenda externa.
- Conferência Google: o Aluno usa autenticação anônima do aparelho e código,
  não vinculação Google nem autorização de Calendar API. O atalho individual
  abre um evento preenchido; o aluno precisa salvar. Importação mensal no
  Google Agenda é feita no computador. Ver `GOOGLE-AGENDA-ALUNO.md`.
- Coordenação: #224 do Claude permanece separado, aguardando a aprovação
  pedida no próprio PR. Seu trecho do Aluno toca os mesmos fluxos/versões.
  Antes de integrá-lo, atualizar a base para preservar as ações desta entrega,
  o histórico mensal e os acessos; não substituir pelo index antigo.
  Os dois ajustes de navegação da Gestão do #224 não foram integrados aqui.
  A versão 2026-10-07-5 do #224 não deve baixar uma versão publicada mais nova.
- Teste novo `testar-aulas-agenda-aluno-browser.cjs`: período, privacidade,
  tipos de aluno, prazo exato/fora do prazo, revalidação, erro/atraso da fila,
  confirmação sem duplicar, ICS mensal, prévia desatualizada e telas nos dois
  temas em 320/390/520/1280px. Resultado e prints serão registrados no PR.

- Pedido adicional do João: pendências do Início, Caixa e conferência usam
  a mesma elegibilidade do fechamento (ativos, pagador, pendente/parcial,
  sem torneio). Status legado `inativo` também fica fora, mesmo com plano
  ou mensalidade mantidos. A lista oferece Registrar pagamento e, no valor
  zero, Marcar como pago. Quitação zero é manual e por competência, com
  versão salva antes, sem receita fictícia, renovação ou mudança de saldos.

- Responsável: Codex. Branch `codex/aulas-aluno-calendario-previa-2026-10-07`,
  PR #226. As 40 verificações específicas de aulas/agenda/quitacão passaram
  no commit `2604ffe43d68f58938cff7899afbd3730bbeb91b`; o teste financeiro
  anterior recebeu seletor explícito do botão de recebimento (a nova opção
  zero compartilha o estilo). Conferência geral final: consultar a CI do
  head no PR. Prévia de fala isolada, sem comandos no app publicado.
  Versão efetivamente publicada continua 2026-10-07-4; esta V6 e #224
  aguardam as confirmações respectivas, sem integração automática.


---

## 2026-10-07 · Codex: revisão solicitada pelo João e integração do trabalho do Claude

**Preparado, não publicado.** PR #226, branch `codex/aulas-aluno-calendario-previa-2026-10-07`.
Base atual conferida: `893ecca78f5752d88193ab6e736825760e07769e` (V4).
Trabalho do Claude preservado: #224, head `57f2083c52ab70f35ac80b7ff4b2971f2fcd636d`.
Esta entrada atualiza a pendência de integração registrada anteriormente.

- Aplicados apenas os trechos ainda ausentes do #224: nome abre ficha na
  renovação e voltar preserva as marcações; cartões de ocupação/locação abrem
  o mês; resumo mensal do aluno. Atalho em Créditos reutilizado, um único ID.
- Resumo reutiliza `historicoAlunoMesAtual` e `aulasAgendadasAluno`: não existe
  uma segunda projeção de reservas. Exclui duplicatas, pedidos pendentes,
  cancelados, exceções e outro mês. Plano e saldo consideram particular + grupo.
- Ações de aulas, prazo de 4h, calendário, histórico mensal, pendências e
  quitação zero do #226 preservados. Nenhum cadastro, saldo ou regra alterado.
- CSS de renovação e sua saída Saibro aproveitados do #224, demo regenerada.
  CSS de resumo fica na folha existente de Aulas, mantendo os inputs do
  gerador do Aluno intactos. Versão proposta continua V6, nunca retrocede a V5.
- Teste original dos 3 pedidos reaproveitado, sem criar outro equivalente.
  Teste de aulas agora verifica também a contagem única e saldo de grupo.
  CI e capturas devem estar aprovados no head final antes de publicar.
- O commit de integração inclui o head do #224 como segundo pai, para que
  a futura integração do #226 reconheça esse trabalho sem publicar V5 à parte.
  Não fazer merge separado do #224 nem reintroduzir seus arquivos antigos.
- App Check segue com chave pública vazia; configuração externa pendente em
  `APP-CHECK.md`. Fala é apenas prévia visual; microfone/comandos não ativados.
  Publicação aguarda a confirmação do João, conforme pedido anterior.


---

## 2026-10-07 · Codex: incluir também o contraste mais recente do Claude

**Preparado, não publicado.** A conferência final encontrou dois novos commits no
#224 durante os testes: `c60ebe05ba8ae9855684e3fb23b713f9fe82b734` e
`36fe0780db2172332cb9146cbfeceeae94feb04b`. Incorporados no #226 com o último head
como segundo pai; preservados fonte, gerador de tema e testes do Claude.

- Incluídas as correções novas de Evolução, contato, estados vazios, cabeçalho
  da agenda, botão Registro e etiquetas de vencimento. A folha de Aulas mantém
  os cartões escuros e as ações completas, com contraste medido pelo mesmo teste.
- Tema do Aluno gerado a partir do mesmo estilo do Claude sem as regras de
  resumo, que estão na folha externa de Aulas. A equivalência do tema anterior
  foi conferida; `tema-saibro.py --checar` valida a saída desta integração.
- Versão consolidada agora **2026-10-07-8**, superior às propostas V6/V7,
  com os cinco carimbos, reservas offline e demo atualizados juntos.
- A CI e as capturas do novo head substituem a aprovação do head V6 anterior.
  Publicação continua dependendo do OK de João; App Check e fala permanecem
  nas condições descritas na revisão. Não publicar #224 separadamente.


---

## 2026-10-08 · Codex: publicação do complemento autorizada pelo João

João autorizou conferir o que já estava no ar e publicar somente o restante.
O #224 já foi integrado em `5bf600d4e9a0bbc8d99e5a11bbd18a76cd41a4b2`.
Monitor 37705940943 confirmou V7 em Gestão Pages, Aluno Pages e Aluno Netlify,
e arquivos do site acessíveis. Todas as correções do Claude foram preservadas.

- O #226 é atualizado sobre essa main, resolvendo a sobreposição de versões
  com o conteúdo consolidado já validado em `71d4ddd4945519ea3d13054e75a79e3eebbf2543`.
  Nenhuma implementação do Claude é repetida; o diff passa a ser só o complemento.
- Versão proposta V8: ações de aulas, histórico mensal, calendário e pendências.
  A autorização anterior pendente foi atendida. Validar novamente o novo head
  antes do merge e verificar o monitor após a publicação; evidências no #226.
- Sem alterações de dados reais ou regras. App Check depende da configuração
  externa; fala continua protótipo visual isolado.

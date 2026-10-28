# Academia João Victor Tênis — guia para o Claude

Dono: João Victor (professor e dono da academia). Fale com ele em português simples,
sem jargão; ele usa o app no celular e decide pelo resultado, não pelo código.

## Regras inegociáveis
- **Nunca corrigir valores, créditos ou reposições automaticamente** sem ele saber.
  Correção de dado = ferramenta que ele aciona, com versão salva antes e jeito de desfazer.
- **Auditoria/conferência = só lista**, sem alterar nada, a menos que ele peça a correção.
- **Só publicar se tudo passar** (`checar-tudo.sh` + teste no navegador). Ver skill `publicar-versao`.
- **`app-familia/` (Família JK, finanças do casal): só mexer quando o João pedir explicitamente.**
  Nada de valor, conta ou documento real no código (é público): `checar-privacidade-familia.py` barra.
- **Nunca commitar backup, JSON exportado ou dado real de aluno.** Testes usam dados fictícios.
- Desconto de reposições é manual e só o João aplica; mensagens ao aluno nunca citam desconto.
- Regras do Firebase: a publicada é `ferramentas/firebase-regras-etapa3-transicao.json`.
  Mudar regra exige autorização explícita; a `etapa4-estrita` ainda não foi liberada.
- Trabalhe só no branch designado da sessão; PR → `validar-pr` verde → merge → Pages publica sozinho.
- Mais de uma IA trabalha aqui (Claude Code e Codex): **leia `ferramentas/REGISTRO-MUDANCAS.md` antes de começar e acrescente uma entrada ao terminar.**

## Mapa do repositório
| Pasta | O quê |
|---|---|
| `app-gestao/` | App do João (PWA). `index.html` (telas) + `lib/app-gestao.js` (toda a lógica, ~10 mil linhas) + `lib/estilo.css` + `lib/icones.js` + `sw-gestao.js` |
| `app-aluno/` | App dos alunos (`index.html` único + `sw-aluno.js`) |
| `site/`, `site-pro/` | Site da academia; `site-pro/demo/` é cópia **gerada** da gestão com dados fictícios |
| `app-exercicios/` | Apostila de exercícios — **publicada** no Pages desde 07/10 |
| `metodologia/`, `negocio/`, `investidor/` | Conteúdo de apoio |
| `ferramentas/` | Checadores (`checar-tudo.sh`), regras do Firebase, docs (`FIREBASE.md`, `SEGURANCA-P0.md`) |
| `servidor-avisos/` | Servidor de avisos (Cloudflare Workers, grátis): a cada 2 min manda os avisos que a Gestão prepara (`avisos_saida`). Publicado pela Action `avisos-cloudflare` só com os segredos. Ver `ferramentas/AVISOS-CLOUDFLARE.md` |
| `lojas/` | Kit para Google Play/App Store do app do aluno (não publicado): guia, textos, imagens, `twa-manifest.json`, arquivos do repo `joaovictorteniscoach-cpu.github.io` |
| `.claude/skills/` | Skills do projeto (ver `.claude/skills/README.md`) |

Sem build, sem npm: arquivos servidos como estão. Publicados: só as pastas em
`ferramentas/preparar-pages.py` (`PUBLICOS`). Todos os apps ficam na mesma origem
`joaovictorteniscoach-cpu.github.io` (dividem localStorage e login do Firebase).

## Como achar código em `app-gestao/lib/app-gestao.js` (não leia o arquivo inteiro)
Use `grep -n` pelos títulos de seção (`/* ===== Título =====`) ou pelo nome da função:
- Persistência/nuvem: `Camada de armazenamento`, `load()`, `persist()`, `Rede de segurança`, `Voltar a uma versão anterior`
- Ledger de saldos: `mover(a,campo,delta,motivo,ref,exato)` grava em `DB.movs`; `estornoPorRef`; campos `creditos`, `credGrupo`, `repos`, `locCred`
- Débito de aula no ✓/cartão: `debitarDoBanco` (saldo do tipo → reposição válida → só o resto vira extra; `textoDebito`). Reposição por tipo do plano: `tipoReposDe`/`reposServePara` (Gestão) e `tipoReposAluno`/`reposServeAqui` (aluno); misto = os dois
- Reposições: `REPOSIÇÕES` (lotes FIFO, validade 4 meses: `reposValidas`, `purgarReposVencidas`)
- Pacote único: `Pacote único` (`unificado(a)`, `pacoteDoAluno`, `DB.pacoteUnico`)
- Mês: `Renovar o mês`, `renovarMes(id)`, `Desconto de reposições`, `valorDoMes`, `Fechamento mensal`
- Alunos: `Lista de alunos + ficha do aluno` (`linhaAluno`, `renderFicha`, `abrirFicha`)
- Financeiro: `Caixa`; aba **Segurança e dados** (`pg-seg`, menu Mais): conta, acessos do aluno e ferramentas (`FERR_BOXES`, `abrirFerr`, `Conferir números`/`achadosDoAluno`)
- Alunos ↔ app do aluno: `Segurança P0` (`pedidoConfiavel`, `publicarSeguro`), `doPublish`, `FILA DE PEDIDOS`
- Navegação: `go(id)`; render geral: `renderAll()`

- Inativar aluno: `arquivarAluno` → `agendaFuturaDoAluno`/`encerrarAgendaFutura`/`desfazerInativar` (pergunta antes de encerrar horários)
- Reposições (Gráficos): `reposLiquidas`, `reposPorMes`, `renderGrafRepos`, `abrirReposMes` (só leem o extrato)
- Aula em família no ✓: `togglePresenca` (pergunta pelos outros da família em aula em GRUPO, só por quem está NO MESMO HORÁRIO: marcação própria ou nome escrito nele — `familiarNoHorario`/`nomeNoHorario`, 28/10) → `togglePresencaUm` (o ✓ de um só); `familiaDoAluno`
- Locação na contagem: `ehLocacao(e)` (tipo OU nome) em `aulasDoDia`, `ocupacao_`, `fcAulasDoMes`
- Extrato do aluno: `abrirExtrato` → `pintarExtrato` (resumido por padrão: `extratoResumido`, `EXT_ROTULO`; "Ver detalhado" = cru)
- Quadrinhos do Início: `abrirDetAlunos`, `abrirDetCreditos` (`validadeRepos`), `abrirDetOcupacao` (`slotsDoDia`), `abrirDetLocacoes` → `#ov-jh-det`
- Torneio: `campeoesDe`, `encerrarEtapa`, homenagens 1º/2º (`abrirHomenagens`, `homArte`, `homMensagem`)
- Campeão no app do aluno: `checarPremiacaoTor` → `celebraTorneioPremio` (uma vez por etapa encerrada) + `confeteBurst(cor,forte)` (canvas por cima do cartão); 1º pela mesma ordem da Gestão (`rankTorAl` = `rankPlayersTor`)
- Varredura de botões: `ferramentas/testar-todos-botoes-browser.cjs` (toca em tudo dos dois apps; falha com erro na página)
- Tempo em Curitiba: `climaDoCodigo`, `iconeClima` (SVG, mesmo desenho no app do aluno; nada de emoji), `abrirClimaGestao`/`pintarPrevisaoClima`
- Ocupação dia/mês/ano (janela do quadrinho): `ocupacaoTresPrazos`, `ocupacaoAno` (ano desde o 1º registro)
- Caixa, locação com tempo: `lancCatMudou`/`lancHorasMudou`/`lancHorasLidas` (grava `horas` no lançamento; não mexe em crédito)
- Diferença agenda × valor: `difSilenciada` (só volta na virada; `mesReal`), `limparDifNaRenovacao`
- Pacotes explicados: `pacotesPadrao`/`renderPacotesLista` (classes `pk-`); topo das outras páginas: bloco "Topo das outras páginas" no `estilo.css`
- Texto longo encolhido (2 linhas + "▾ ver mais"): `encurtarTextosLongos` (`ENC_SEL`, classes `enc-`; `data-enc="nao"` para não encolher)
- Vidro Aero (referência do João: Windows Vista/7): bloco "Vidro Aero" no fim do `estilo.css` (`--aero-*`); só brilho/borda/sombra, nunca troca cor de fundo
- Horário que o app do aluno não vê (código publicado ≠ do aluno): `codigoDaEntrada` (publicação usa), `horariosQueOAlunoNaoVe`/`nomeBateCom` (só lista), `ligarHorarioAoAluno` (botão com desfazer); `acharAlunoPorTitulo` prefere o ativo; `noAppDoAluno` (linha "📱 No app" no horário), `temAppAprovado` (VINCULOS)
- Cancelamento preso no app do aluno: `limparCancelados`/`minhaEntradaNaGrade` (app-aluno; resposta "cancelado", aula fora da agenda ou data passada); na Gestão, achado "cancelou pelo app e foi marcada de novo" (só lista)
- Letras do app do aluno: `app-aluno/lib/letras-maiores.css` (só tamanho; mínimo 12 px, células da grade da semana em 11 px; teste `testar-letras-aluno-browser.cjs`)
- Cancelar um período pela voz (viagem): `planoCancelarPeriodo`/`aplicarCancelarPeriodo`/`planoDesfazerPeriodo` (bloqueio "Professor ausente" `motivo:'fora'`: só tira aula, quadra aberta para locação/torneio; quadra Fechada só se o João pedir; registro em `DB.foras`; não mexe em crédito), `msgCancelPeriodo`; na voz `lerIntervalo`, ação `cancelarPeriodo`/`desfazerPeriodo`
- Assistente por voz do aluno: `app-aluno/lib/voz-aluno.js` (`JVVozAluno`: `interpretar`/`executar`; só abre `gotoBook`/`cancelarAula`/`abrirEspera`, nunca grava sozinho) + `voz-aluno.css` (`va-`); perguntas com dados do app: `infoResposta` (preços/planos com `st.pend`, mensalidade, repor, torneio…)
- Botão de voz arrastável (Gestão e aluno): `arrastavel(bt,chave)` em `acoes-voz.js` e `voz-aluno.js` (posição em `jv-voz-posicao`/`jv-va-posicao`; tocar abre, arrastar não)
- Varredura de atalhos: `ferramentas/testar-atalhos-gestao-browser.cjs` (tabela `DESTINOS`; atalho novo precisa entrar nela)
- Segurança na Gestão: `argJs`, `sairEApagar`, `prontidaoRegraFinal`, `uidCadastroLivre`, `cancelamentoTardio`, `publicacaoLegadaEnxuta`

Visual das telas (cores, letras, peças, o que não fazer): **`DESIGN.md`** na raiz. O visual está fechado;
tela nova usa as peças que já existem. Revisão pela lista da Vercel: `ferramentas/AUDITORIA-TELAS-2026-10.md` (só lista).

Convenções: `fmt()` mascara valores quando `hideVals` está ligado — em mensagem ao aluno
e PDF use `fmtRs()`. Datas locais com `dKey(new Date())` (nunca `toISOString().slice(0,10)`).
Classes CSS novas com prefixo próprio (já usados: `al-`, `fic-`, `rm-`, `cx-`; `fx-` colide).
Tema escuro premium: variáveis `--jv-*` em `estilo.css`. Tema **Saibro** (padrão; "Verde clássico" em Mais → Segurança e dados): `lib/estilo-saibro.css` é **gerado**; no app do aluno, `app-aluno/lib/tema-saibro.css` (só as cores, por cima). Mudou `estilo.css`, o `<style>` do aluno ou `visual-premium.css`, rode `python3 ferramentas/tema-saibro.py` (o `checar-tudo.sh` acusa se esquecer). Escape HTML com `esc()` em todo
texto vindo de aluno/nuvem; dentro de `onclick="f('…')"` use `argJs()` (escapa para JS e
depois HTML — só `esc()` não basta, o navegador desfaz o `&#39;` antes de rodar).
Nada de nome real de aluno ou compromisso pessoal no código: ele é público (Pages + GitHub).

## Decisões em vigor (atualizadas em 2026-10-20)
- Gestão fica no GitHub Pages, mesma origem do app do aluno: risco aceito pelo João para
  não depender da cota do Netlify. Não reabrir sem ele pedir.
- Cópia legada `jvtenis-app-aluno` vai sem `mensalidade`/`valorAula` (`valoresOcultos`).
- Regra `etapa4-estrita`: código pronto; publicar só com a caixa "Pronto para a regra final?"
  (Mais → Segurança e dados) em ✓ e autorização do João. Passo a passo em `ferramentas/SEGURANCA-P0.md`.
- Torneio (barragem): vitória 3, derrota 1, W.O. 3 para quem compareceu e 0 para quem faltou (decisão do João em 18/10, conferida com regulamentos de clubes). Mesma conta em `ptsEtapa`/`PTS_TOR` (Gestão) e `calcPtsTorAl` (aluno). Não mudar sem ele pedir.
- Reservas: particular ocupa a vaga inteira; dupla/trio/quarteto respeitam 2/3/4 alunos, locação e torneio compartilham só com a mesma atividade. Almoço/bloqueio/compromisso do João (não chuva) só impedem aula: locação e torneio entram (09/10); aula dele fora da quadra (`foraDaQuadra`, personal por padrão) também (26/10, `podeAdicionarAoHorario`, `fora:1` na grade, `ehSoSemAula` no aluno). Criação única na fila existente, gravação durável antes de consumir pedido, fixos com conferência futura. Não apagar reservas antigas automaticamente.
- Renovação: repetição no mesmo mês preserva os saldos. Ajuste manual no cadastro exige conferência no lote; a confirmação de renovação manual só marca o mês, sem alterar números. Ver `ferramentas/PRONTIDAO.md`.
- App Check: João autorizou preparar a ativação em 2026-10-06. `APPCHECK_SITE_KEY` ainda vazio: falta a chave pública e o registro no console. Começar em monitoramento; exigência só após adaptar site e leitura REST do teste. Ver `ferramentas/APP-CHECK.md`.
- Visual (27/10): o João não vai mudar mais o visual dos apps. As opções A/B/C e a rodada 2
  do visual sóbrio foram descartadas. Não propor mudança visual sem ele pedir.
- Saibro com bolinha (28/10, pedido do João): imagens geradas (`coresImg`, `homArte`, blocos
  `IMAGENS`/`COERENCIA` em `tema-saibro.py`), site/site-pro e pontos dos apps seguem o tema.
  Versão agência: saibro liso = cor da marca (botão principal, escolha, título); bolinha SÓ em
  detalhe (✓, pontinho, borda, "pago"), nunca em área grande; mais creme. Ver DESIGN.md.
  Verde clássico continua como antes.
- Repositório público: decisão pendente do João (privado exige GitHub Pro para manter o Pages).
- **Família JK sem login (20/10):** a nuvem continua só com o link da família, sem criar conta.
  Login com Google só se não exigir mexer no Firebase nem criar contas — como exige (ligar o
  provedor, autorizar o domínio e mudar a regra do banco), fica só o link. Não propor de novo
  sem ele pedir. Não mexer na regra do banco da família. O login por e-mail que já existe no
  app é opcional e continua como está.

## Verificar
- `sh ferramentas/checar-tudo.sh` — sintaxe, funções, ids, CSS, regras, P0, versão, premium. Tem de terminar com 0 falhas.
- Teste no navegador (Playwright já instalado; ver skill `publicar-versao`).

## Glossário mínimo
Crédito = aula particular paga do mês · Grupo (`credGrupo`) = aula em grupo ·
Reposição = aula não feita que vira crédito por até 4 meses · Virada = troca de mês
(sobra vira reposição) · Pacote único = um saldo só para quem não é misto ·
Misto = aluno com plano particular **e** de grupo · Desconto 25% = trocar reposições
por até 25% da mensalidade, só pelo João.

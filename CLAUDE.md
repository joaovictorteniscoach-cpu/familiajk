# Academia João Victor Tênis — guia para o Claude

Dono: João Victor (professor e dono da academia). Fale com ele em português simples,
sem jargão; ele usa o app no celular e decide pelo resultado, não pelo código.

## Regras inegociáveis
- **Nunca corrigir valores, créditos ou reposições automaticamente** sem ele saber.
  Correção de dado = ferramenta que ele aciona, com versão salva antes e jeito de desfazer.
- **Auditoria/conferência = só lista**, sem alterar nada, a menos que ele peça a correção.
- **Só publicar se tudo passar** (`checar-tudo.sh` + teste no navegador). Ver skill `publicar-versao`.
- **`app-familia/` é da esposa dele: não mexer.**
- **Nunca commitar backup, JSON exportado ou dado real de aluno.** Testes usam dados fictícios.
- Desconto de reposições é manual e só o João aplica; mensagens ao aluno nunca citam desconto.
- Regras do Firebase: a publicada é `ferramentas/firebase-regras-etapa3-transicao.json`.
  Mudar regra exige autorização explícita; a `etapa4-estrita` ainda não foi liberada.
- Trabalhe só no branch designado da sessão; PR → `validar-pr` verde → merge → Pages publica sozinho.

## Mapa do repositório
| Pasta | O quê |
|---|---|
| `app-gestao/` | App do João (PWA). `index.html` (telas) + `lib/app-gestao.js` (toda a lógica, ~10 mil linhas) + `lib/estilo.css` + `lib/icones.js` + `sw-gestao.js` |
| `app-aluno/` | App dos alunos (`index.html` único + `sw-aluno.js`) |
| `site/`, `site-pro/` | Site da academia; `site-pro/demo/` é cópia **gerada** da gestão com dados fictícios |
| `app-exercicios/`, `metodologia/`, `negocio/`, `investidor/` | Conteúdo de apoio |
| `ferramentas/` | Checadores (`checar-tudo.sh`), regras do Firebase, docs (`FIREBASE.md`, `SEGURANCA-P0.md`) |
| `.claude/skills/` | Skills do projeto (ver `.claude/skills/README.md`) |

Sem build, sem npm: arquivos servidos como estão. Publicados: só as pastas em
`ferramentas/preparar-pages.py` (`PUBLICOS`). Todos os apps ficam na mesma origem
`joaovictorteniscoach-cpu.github.io` (dividem localStorage e login do Firebase).

## Como achar código em `app-gestao/lib/app-gestao.js` (não leia o arquivo inteiro)
Use `grep -n` pelos títulos de seção (`/* ===== Título =====`) ou pelo nome da função:
- Persistência/nuvem: `Camada de armazenamento`, `load()`, `persist()`, `Rede de segurança`, `Voltar a uma versão anterior`
- Ledger de saldos: `mover(a,campo,delta,motivo,ref,exato)` grava em `DB.movs`; `estornoPorRef`; campos `creditos`, `credGrupo`, `repos`, `locCred`
- Reposições: `REPOSIÇÕES` (lotes FIFO, validade 4 meses: `reposValidas`, `purgarReposVencidas`)
- Pacote único: `Pacote único` (`unificado(a)`, `pacoteDoAluno`, `DB.pacoteUnico`)
- Mês: `Renovar o mês`, `renovarMes(id)`, `Desconto de reposições`, `valorDoMes`, `Fechamento mensal`
- Alunos: `Lista de alunos + ficha do aluno` (`linhaAluno`, `renderFicha`, `abrirFicha`)
- Financeiro: `Ferramentas do Financeiro` (`FERR_BOXES`, `abrirFerr`), `Conferir números` (`achadosDoAluno`), `Caixa`
- Alunos ↔ app do aluno: `Segurança P0` (`pedidoConfiavel`, `publicarSeguro`), `doPublish`, `FILA DE PEDIDOS`
- Navegação: `go(id)`; render geral: `renderAll()`

Convenções: `fmt()` mascara valores quando `hideVals` está ligado — em mensagem ao aluno
e PDF use `fmtRs()`. Datas locais com `dKey(new Date())` (nunca `toISOString().slice(0,10)`).
Classes CSS novas com prefixo próprio (já usados: `al-`, `fic-`, `rm-`, `cx-`; `fx-` colide).
Tema escuro premium: variáveis `--jv-*` em `estilo.css`. Escape HTML com `esc()` em todo
texto vindo de aluno/nuvem, inclusive em `onclick`.

## Verificar
- `sh ferramentas/checar-tudo.sh` — sintaxe, funções, ids, CSS, regras, P0, versão, premium. Tem de terminar com 0 falhas.
- Teste no navegador (Playwright já instalado; ver skill `publicar-versao`).

## Glossário mínimo
Crédito = aula particular paga do mês · Grupo (`credGrupo`) = aula em grupo ·
Reposição = aula não feita que vira crédito por até 4 meses · Virada = troca de mês
(sobra vira reposição) · Pacote único = um saldo só para quem não é misto ·
Misto = aluno com plano particular **e** de grupo · Desconto 25% = trocar reposições
por até 25% da mensalidade, só pelo João.

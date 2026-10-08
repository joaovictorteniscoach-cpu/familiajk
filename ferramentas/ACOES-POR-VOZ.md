# Consultas à agenda por voz — 2026-10-08-10

Usam o mesmo círculo flutuante e a conta do dono. Toque e pergunte:
- “Quantas aulas eu tenho hoje?”
- “Quem são os alunos que vão ter aula no período da tarde?”
- “Qual é o aluno das 16 horas?”
- “Quem tem aula amanhã de manhã?” ou “Quem tem aula às quatro da tarde?”

Sem dia, consulta hoje no horário de São Paulo. Manhã antes das 12h, tarde
das 12h até antes das 18h, noite a partir das 18h. A resposta deixa o período,
data e horários explícitos. Texto/ditado usa Conferir pedido. “Responder por
voz automaticamente” silencia; “Ouvir resposta” repete sem alterar a agenda.
A próxima pergunta usa o mesmo campo ou círculo, sem fechar o painel.

Consulta só lê a agenda do dono conferida na nuvem; pendência/conflito/leitura
indisponível não produzem uma resposta falsa. Outra versão deve ser conferida
na tela de Segurança e dados, sem substituir o banco automaticamente.
aulasDoDia mantém a mesma contagem do Início: grupo = uma aula, nomes de todos
os participantes, duplicatas/exceções/janela dos fixos respeitadas. Total do
dia inclui aulas passadas e futuras agendadas; não afirma que já ocorreram.
Locação/torneio/compromisso não entram no total de aulas e podem aparecer em
consultas de horário. Ausência na sua agenda não garante disponibilidade da
quadra. Não consulta nomes de alunos de outros professores.

Consulta não cria intenção de escrita e não pede Confirmar; agendar/cancelar/
renovar conservam prévia e confirmação. Não grava áudio, texto ou consultas
em histórico/localStorage/Firebase; sem modelo de IA ou serviço novo.
Perguntas gerais, financeiras, múltiplas datas e horários ambíguos pedem
reformulação. Testes com dados fictícios, reconhecimento/síntese simulados
em Chromium/WebKit nos dois temas; microfone físico é o do aparelho.

Responsável Codex, branch codex/consultas-agenda-voz-2026-10-08, base 9489dea427d3a5d8f0f3576e6971d62c6d842e30.
V8/#232 publicada com brilho/ondas permanece preservada. #234 do Claude
foi publicado como V9 sobre V8. Reaplicado sobre essa main; cálculo do mês,
14 testes de números e demo preservados. V10 sucede V9. Testar novamente
antes de integrar, sem substituir voz. Esta seção registra implementação;
estado de CI/publicação será registrado no PR ao concluir.

---

# Ações rápidas por voz — Gestão


## Conversa e pedidos do dia a dia (Claude, 08/10/2026, versão 2026-10-08-11)

Pedido do João (prints de 14:54/14:55): “Quantas aulas eu tenho agora de tarde
das 16 até o final da noite” e “Abra os horários das 7h00 da manhã até as 18h00
de domingo para locações” não funcionavam, e o painel ficava esperando escolher
um aluno. Agora o painel é uma **conversa**: o pedido aparece à direita e a
resposta (ou o que foi feito) à esquerda; a resposta atual fica no fim e as
anteriores sobem. Nada é guardado: a conversa some ao fechar. O formulário de
aluno só aparece para agendar/cancelar/renovar (ou pelo botão “pelos campos”).
Enter envia; há sugestões rápidas na saudação.

Perguntas (só leem, conferem a nuvem antes, como a consulta do Codex):
- aulas por dia, período, horário **ou faixa** (“das 16 até o fim da noite”,
  “a partir das 18”, “até o meio-dia”, “das 4 às 8 da noite”), “quantas faltam
  hoje”, “qual a próxima aula”;
- **semana, mês e ano** (“esta semana”, “semana que vem”, “em setembro”, “mês
  passado”, “no ano”), com a mesma conta do Início (`aulasDoDia`, limite de
  `inicioRegistros`), dizendo quantas já foram e quantas faltam;
- **horários livres** de um dia ou da semana (aula e “só locação”), sem nada
  marcado, sem outro professor e ainda por vir;
- **aluno**: créditos e reposições válidas, próxima aula, **próximas aulas**
  (lista), horário fixo, mensalidade do mês e **extrato** do período (dia,
  semana, mês ou ano; sem período, o mês atual): cada aula com a situação —
  presença confirmada, dada sem presença confirmada, faltou, avisou, agendada,
  desmarcada (exceção do fixo ou aviso do app) ou cancelada por chuva — e o
  total; “já fez” soma também desde o início dos registros;
- **histórico**: choveu em tal dia/semana, aulas desmarcadas (e quem cancelou),
  quem faltou, presenças por confirmar, quem tem reposição, quantos alunos
  ativos;
- **financeiro**: quem está devendo, quanto recebeu, quanto falta receber
  (respeita “valores ocultos”: não fala valor com o olho fechado);
- ocupação, locações e preços; “ajuda” lista o que sabe fazer.

Ações (prévia + confirmação, mesma barreira: nuvem, cópia anterior, plano
recalculado igual ao mostrado):
- **funcionamento**: abrir/liberar/fechar/bloquear horários para aula, só
  locação ou fechado, numa data (`horarioData`) ou toda semana (`horarioCfg`);
  “de domingo” vale só no próximo domingo, “todo domingo/domingos” vale a
  semana; a prévia permite trocar funcionamento e “Só em … / Toda …”, e avisa
  marcações que ficam em horário que mudou;
- **chuva**: data e faixa/período (“hoje à tarde”, “das 16 às 18”); “hoje” sem
  horário vale daqui para a frente; usa `aplicarChuva` (grade fixa continua,
  presença marcada devolve o crédito);
- agendar, cancelar e renovar continuam como antes.

Recusa (nada muda): frase com “não”, duas ações juntas, dia passado, horário
ambíguo (“às quatro”), nada para mudar. Depois de uma ação salva na nuvem, a
conversa continua para o próximo pedido; pendência na nuvem segue bloqueando.
Testes: `testar-voz-conversa-browser.cjs` (17) e o do Codex (31 por tema e
navegador; “Qual valor da aula?” agora responde os preços).

---

## Escolha final de 08/10/2026: flutuante, translúcido e com brilho

João confirmou funcionamento da fala no aparelho e escolheu a opção 2 das fotos:
círculo na posição flutuante atual, com 30% de transparência e um pouco mais
de brilho. A alternativa no topo e a faixa inferior não serão publicadas.
A transparência suaviza o visual; a área de toque flutuante ainda pode se
sobrepor ao conteúdo, limite apresentado ao usuário antes da escolha.

Na versão proposta `2026-10-08-8`, o círculo mantém 54px, canto inferior direito
acima da navegação e área segura; 70% de opacidade, luminosidade/halo suaves
nos dois temas. Cabeçalhos não recebem novos botões nem mudanças de layout.
Somente o dono conectado, em Início/Agenda/Alunos; acesso alternativo em Mais.
Tocar inicia a escuta. Ao terminar a fala, o pedido final é conferido
automaticamente com a nuvem e abre a prévia. Confirmar continua obrigatório.
Fluxo usual de agendar/cancelar completo: tocar/falar → prévia → confirmar.
Renovação mantém a confirmação nativa de saldos. Texto/ditado mantém Conferir pedido.

Ondas animam somente durante escuta ou reprodução efetiva da resposta.
Fechar, silenciar, voltar, mudar de tela ou iniciar nova captura interrompe a
voz. Movimento reduzido é respeitado. “Responder por voz automaticamente”
permite silenciar; após gravação confirmada, “Ouvir confirmação” repete o
resultado sem executar novamente a ação. Pendência não vira confirmação de
sucesso; tentar salvar somente reenvia a gravação e só confirma após sucesso.

Responsável: Codex; branch `codex/voz-topo-ondas-2026-10-08`, PR #232;
base `f9dc2de66b5bd249a540739d84757bb4a1f7f87a`.
Publicação autorizada pelo João nesta sessão, após CI completo do head final.
O relato de funcionamento no aparelho não equivale a validação de hardware
pelo CI. Preservadas as entregas concorrentes #230/#231. Testes e entrega
real serão registrados no PR; nenhuma alteração de dados reais ou regras.

Coordenação final: #233 do Claude foi publicado como V7 durante o CI. Esta
entrega foi reaplicada sobre a main nova, preservando contagem, grade de horas
cheias, marcações antigas, crédito integral, Ano, estilos/demo e testes.
V8 sucede V7. Conferir novamente no CI do head integrado antes de publicar.

---

## Implementação de 08/10/2026

Responsável: Codex, branch `codex/acoes-voz-gestao-2026-10-08`, base `ab3aacb606588d134b538b1fdfb2aecaead19c8f`.
Código funcional da versão `2026-10-08-4`, [PR #228](https://github.com/joaovictorteniscoach-cpu/familiajk/pull/228).
84 verificações de fala e CI completo aprovados no commit `adb23d2`; o ajuste
final de prévia visível precisa do CI do novo commit antes de integrar.
A entrega pública é confirmada pelo merge do #228 e monitor da main com V4. A integração final usa a V3 de 08/10, publicada pelo Claude no #229.
O botão não estava implementado nessa versão.

O atalho aparece acima da navegação, no canto direito de Início, Agenda e Alunos,
somente com a conta do dono autenticada. Também há acesso em Mais.
Os arquivos `lib/acoes-voz.js` e `lib/acoes-voz.css` são usados pelo aplicativo.
O protótipo visual antigo em ferramentas não é carregado em produção.

1. Abra o painel e toque em Falar; permita a voz/microfone se o navegador solicitar.
2. Diga um pedido, por exemplo “Agendar Nome Sobrenome amanhã às quatro da tarde”,
   “Cancelar Nome Sobrenome sexta às 16h” ou “Renovar o pacote de Nome Sobrenome”.
3. Confira o texto. Toque em Conferir pedido, escolha o cadastro se houver nomes
   parecidos e corrija os campos quando necessário.
4. Leia a prévia e confirme. Renovação mantém a confirmação nativa com saldos
   antes/depois. “Confirmado e salvo na nuvem” só aparece após gravação confirmada.
   Se estiver pendente, tentar salvar não executa novamente a ação.

A primeira versão usa comandos delimitados, sem modelo de IA ou backend novo.
Agendamento é uma ocorrência; cancelamento afeta apenas a marcação nessa data,
sem criar reposição ou alterar saldos. Horários particulares continuam exclusivos,
grupos respeitam 2/3/4, e locação/torneio compartilham apenas a mesma atividade.
A renovação usa o fluxo atual, bloqueia repetida/ajuste manual e não lança pagamento.
Antes de aplicar, exige leitura da nuvem, mapa da quadra e cópia anterior confirmada.

No iPhone, se o botão Falar não estiver disponível ou houver erro, toque no campo
Seu pedido e use o microfone do teclado do iOS, ou digite. O reconhecimento pode
usar o serviço do navegador; áudio e transcrição não são persistidos pelo app.
Captura real no iPhone/Safari e no app instalado continua pendente de ensaio no
aparelho do João. Chromium/WebKit com API simulada verificam fluxos, não provam
microfone real. Para esse ensaio, basta falar, conferir a transcrição e fechar:
nenhum comando é executado sem conferência e confirmação.

A publicação de mudanças validadas já foi autorizada pelo João nesta sessão.
O ensaio no aparelho será acompanhado separadamente e não será descrito como
concluído por causa de testes simulados. App Check é outra etapa; chave pública
continua pendente.

Coordenação: #224, #226, #227 e #229 estão publicados. #227 e #229 foram
integrados pelo Claude durante a preparação. A camada de fala foi reaplicada
sobre a main nova, preservando hora do servidor, retorno de cancelamento
recusado, horário de envio dos avisos e o resumo Escritório JV. Os testes e o
gerador de demo dessas alterações foram preservados. A V4 sucede a V3 do #229
para evitar conteúdos diferentes com o mesmo número de versão no cache.

---

## Especificação original (histórico de 07/10)

O texto abaixo registra a proposta inicial e seu plano de ensaios.

## Coordenação conferida em 07/10/2026

Base examinada: `e77844a1d440bf13d51a8d47c990045eebc28558`, versão **2026-10-07-4**.
Foram lidos o guia, o diário, os commits recentes, os PRs abertos, os arquivos
de agenda/renovação e os resultados das Actions.

- [PR #221](https://github.com/joaovictorteniscoach-cpu/familiajk/pull/221), Codex: particular exclusivo,
  dupla/trio/quarteto com 2/3/4 alunos e participação na mesma locação/torneio.
- [PR #222](https://github.com/joaovictorteniscoach-cpu/familiajk/pull/222), Claude: revisão e diário comum.
- [PR #223](https://github.com/joaovictorteniscoach-cpu/familiajk/pull/223), Claude, **publicado**:
  corrige o alarme falso de renovação duplicada e o envio da fila que apagava
  uma reserva e marcava um caminho interno no mesmo update.
  As duas correções estão na main; não foram desfeitas.
- [PR #224](https://github.com/joaovictorteniscoach-cpu/familiajk/pull/224), Claude, **aberto**:
  ficha acessível na renovação, atalhos para agenda do mês e resumo mensal
  do aluno. Head conferido: `57f2083c52ab70f35ac80b7ff4b2971f2fcd636d`.
  Versão proposta **2026-10-07-5**. Teste validar verde
  ([execução 37695573232](https://github.com/joaovictorteniscoach-cpu/familiajk/actions/runs/37695573232)).
  O corpo do PR pede o OK do João para integrar; aprovação da simulação e
  resultado verde não significam que a versão foi publicada.
- A publicação da main e o
  [monitor público 37695062366](https://github.com/joaovictorteniscoach-cpu/familiajk/actions/runs/37695062366)
  estão verdes. O monitor identificou **2026-10-07-4** na Gestão Pages,
  Aluno Pages e Aluno Netlify, e os arquivos do site Netlify acessíveis.
  Isso verifica entrega dos arquivos; não é uma auditoria dos dados reais.

Não foi encontrada reversão das regras de reservas/renovação nos commits
recentes examinados. Há **sobreposição potencial de arquivos** com o #224
(index da Gestão, lógica, CSS, versão e demo) se a voz for integrada em paralelo.
Esta entrega é documental e preserva o PR aberto.
Na implementação, partir da main atual depois de resolver essa dependência,
ou preparar explicitamente a integração conjunta e testar o resultado.
Não reservar antecipadamente o número da próxima versão.

Divergência documental observada: na main o diário ainda dizia que os dois
defeitos já corrigidos no #223 estavam por corrigir. A nova entrada ao fim do
diário esclarece o estado sem reescrever a revisão histórica.
O #224 também propõe esse esclarecimento; as duas entradas são complementares.

Limite: não há acesso às conversas privadas do Claude nem aos arquivos que
ainda não foram enviados ao repositório. Não há um canal automático entre
essas conversas. AGENTS.md passa a apontar o mesmo guia e diário para o Codex.

## Posição e aparência

Recomendação: uma bolinha de microfone com área de toque de pelo menos 48 px,
no canto inferior direito da área do app (que tem largura máxima de 520 px),
**acima da barra Início / Agenda / Alunos / Caixa / Mais**.
Respeitar a área segura do celular e reservar espaço para não cobrir a
última linha de conteúdo. Não acrescentar um sexto item à navegação.

Disponível nas telas Início, Agenda e Alunos para o dono conectado.
Enquanto ficha, renovação, outra janela ou menu Mais estiver aberto, esconder
o atalho para evitar sobreposição. O acesso alternativo fica em Mais:
“Ações rápidas”. A cor e os contornos seguem os temas Saibro e Verde clássico.

Ao tocar, abrir um painel com:
- bolinha animada somente durante escuta/processamento e texto de estado;
- texto reconhecido editável;
- a ação entendida, aluno, dia completo, horário e impacto;
- controles “Falar”, “Parar”, “Confirmar”, “Corrigir” e “Fechar”, conforme o estado.
O rótulo de Confirmar deve dizer a ação: “Confirmar cancelamento”, por exemplo.
Não depender apenas de cor/animação. Respeitar movimento reduzido, teclado,
leitor de tela, foco e botão Voltar.

Fluxo visível:

```text
Tocar → Falar → Conferir aluno/dia/horário → Confirmar → Resultado
                     ↘ informação incompleta → Perguntar → Conferir
```

A proposta de posição ainda precisa de prints com a tela real em 320/390/520 px
e computador; este documento não afirma que houve teste visual do novo botão.

## Primeiras ações

| Pedido de exemplo (nomes fictícios) | Prévia e comportamento |
|---|---|
| “Ana cancelou a aula de amanhã às 15 horas” | Encontrar a marcação de Ana naquela data/hora; mostrar “Cancelar apenas esta aula”. Para fixo, criar exceção só naquele dia, mantendo as outras semanas. |
| “Agendar Bruno sexta às 18 horas” | Mostrar a sexta-feira por extenso com data, professor, tipo de aula e horário. Criar **só nesta data**; se horário não estiver disponível, explicar e oferecer alternativas sem marcar sozinho. |
| “Renovar o pacote da Ana” | Abrir a prévia da renovação individual do mês vigente. Mostrar créditos e reposições antes/depois, usando o mesmo bloqueio de segunda renovação e a conferência de ajuste manual. |

Cancelar uma aula não deve criar reposição, alterar dinheiro ou declarar o
horário totalmente livre automaticamente: conferir a regra de cancelamento
aplicável e os outros participantes, se houver. Se a política não estiver
definida para aquela situação, o João escolhe na tela normal.
Na primeira versão, encaminhar ao fluxo existente para confirmar efeitos
sobre créditos/reposições; não inventar uma política financeira pela voz.

“Renovar” não significa “recebi a mensalidade”: não marcar pagamento.
“Já renovei manualmente” deve levar à opção que apenas registra o mês,
preservando os saldos, nunca ser interpretado como uma nova renovação.

## Entendimento e identificação

Começar com comandos delimitados para cancelar, agendar e renovar.
Transcrever voz e interpretar o pedido são etapas diferentes. Uma transcrição
do navegador não oferece, por si só, a compreensão geral de uma assistente
como a Siri. Datas e horários precisam aparecer na prévia.

- Identificar pelo ID do cadastro escolhido. Normalizar acentos só para busca.
  **Não usar acharAlunoPorTitulo sozinho:** ele escolhe o primeiro aluno com
  o mesmo primeiro nome. Havendo homônimos, mostrar opções e perguntar.
- Nunca escolher um familiar pelo nome do responsável pagante.
  Dependente mantém agenda e saldos próprios.
- Se faltar dia/hora, houver mais de uma aula ou a data for ambígua, perguntar.
  Não interpretar “às três” como 15h sem esclarecer.
- Datas locais, sem conversão para UTC; mostrar dia da semana, data e ano.
  “Sexta” vira uma data explícita antes da confirmação.
- Negação, autocorreção, pedidos com duas ações e frases não reconhecidas
  não autorizam execução. Pedir um comando por vez ou encaminhar à tela.
- Nunca executar um texto parcial recebido durante a fala.

## Reutilização dos fluxos atuais

A camada de voz prepara uma intenção estruturada e **não escreve diretamente
no Firebase nem altera DB**. A tela normal continua funcionando se a voz falhar.

Pontos conferidos na base examinada:
- `entriesFor`, `slotModo`, `ocupadoPorOutro`,
  `podeAdicionarAoHorario` e `saveSlot`: agenda e capacidade.
- `cancelarDia`: exceção de um fixo na data de `slotCtx`.
  Para evento pontual, o fluxo de remoção deve ser revisado e reaproveitado.
  Não chamar `removerFixo` para um pedido de cancelamento de uma data.
- `renovarMes`, `renovacoesDoMes`, `ajusteManualRenovacao`:
  renovação individual com prévia e barreiras.
- `persist` e confirmação durável das partes: controle de versão/conflito.
  `updatesFilaSemConflito` do #223 deve continuar no consumo da fila.

Essas funções dependem de contexto de tela/estado global e nem todas
retornam um resultado estruturado. Não basta chamar a função e falar “feito”.
Preparar um adaptador que forneça contexto explícito, preserve a confirmação
existente e diferencie cancelado pelo usuário, bloqueado, aplicado localmente,
pendente na nuvem, conflito e confirmado na nuvem.

Ao confirmar:
1. Conferir login/permissão e conexão; bloquear ação por voz se a base não foi
   conferida ou houver conflito/alterações pendentes que impeçam conferência.
2. Conferir novamente a versão atual e o alvo. Se algo mudou desde a prévia,
   invalidá-la e pedir uma nova confirmação do resultado atualizado.
3. Para agenda, aplicar particular 1, dupla 2, trio 3, quádrupla 4;
   locação/torneio só com a mesma atividade. Conferir agenda dos professores,
   horários fechados e o próprio aluno já reservado ali.
4. Usar os fluxos existentes com cópia anterior, histórico e desfazer onde
   aplicável. Nenhuma segunda rotina de créditos, caixa ou filas.
5. Bloquear duplo toque e repetição do mesmo resultado de reconhecimento.
   Manter ID da intenção, alvo e versão enquanto estiver em execução.
6. Responder “Confirmado e salvo na nuvem” somente com confirmação durável.
   Não executar novamente se a resposta demorar; mostrar o estado pendente.
   Desfazer deve seguir o controle de versão, preservando mudanças posteriores.

## Microfone e resposta falada

Primeira opção técnica: `SpeechRecognition` / `webkitSpeechRecognition`
quando disponíveis, com idioma `pt-BR`, iniciados por toque.
A resposta falada pode usar `speechSynthesis`, com opção de silenciar,
sempre acompanhada de texto. Parar reconhecimento enquanto a resposta é
falada para não reconhecer a própria voz do app.

Essa API tem disponibilidade limitada. Alguns navegadores usam serviço
externo para transcrição, exigindo internet; não prometer funcionamento offline
nem áudio sempre restrito ao aparelho.
Referência: [MDN — SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

Na primeira utilização, informar o uso do reconhecimento do navegador e a
possibilidade de processamento pelo provedor; só iniciar após o usuário
acionar a escuta. Não manter microfone ativo em segundo plano.
Fechar, trocar de página, bloquear a tela ou sair da conta interrompe a captura.

Se não suportado, permissão negada, falta de rede ou erro, oferecer digitação
no mesmo painel. O ditado do teclado do celular também pode preencher o texto.
Não guardar gravação nem transcrição integral na nuvem/localStorage/logs.
O histórico registra a ação e o resultado, pelo padrão atual do aplicativo.

Um backend de transcrição/IA é uma opção futura se os testes no aparelho
mostrarem necessidade. Isso exigiria serviço autenticado, tratamento de dados
e avaliação de custo; nunca colocar chave secreta no aplicativo público.

## Etapas para implementar sem disputar o trabalho atual

1. Resolver a integração do #224 e reler a main/diário antes de editar.
2. Criar camada opcional em arquivo próprio, interpretação limitada e painel,
   primeiro com dados fictícios; manter o botão desativado em produção.
3. Testar comandos corretos e incompletos, homônimos, negação, data ambígua,
   particular ocupado, grupos cheios, reservas simultâneas em dois aparelhos,
   cancelamento só de uma ocorrência e aluno já renovado/ajustado manualmente.
4. Testar permissão negada, falta de API/rede, repetição de reconhecimento,
   fechar durante fala, resposta atrasada, rollback/conflito e fallback por texto.
   Conferir que áudio/transcrição não são persistidos.
5. Testar microfone de verdade no aparelho/navegador do João, incluindo PWA.
   Testes com reconhecimento simulado não provam captura real.
6. Conferir as telas reais e os dois temas, regenerar demo/temas quando
   necessário, subir a versão dos cinco arquivos juntos e seguir publicar-versao.
7. Habilitar somente após esses resultados, sem mudar regras do Firebase.
   App Check continua uma etapa separada: a chave pública ainda está pendente.

Não há garantia de ausência total de defeitos: o objetivo é reduzir o risco
usando os mesmos fluxos, sem duplicar regras, com revisão e testes antes de publicar.

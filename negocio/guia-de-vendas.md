# Guia de Vendas — JV Tênis

## Como vender o app de gestão para outras academias e a metodologia como curso

**Autor:** João Victor · Academia JV Tênis
**Uso interno** — material estratégico, não publicar.
**Versão:** 1.0 — 2026

---

# Visão geral

Você construiu duas coisas que têm valor de mercado além da sua quadra:

1. **O App JV Tênis** — um sistema de gestão pronto (agenda, alunos, caixa, financeiro, app do aluno, Pix, ranking/Barragem). A maioria das academias e professores ainda controla tudo no caderno, no WhatsApp e na planilha. Você tem a solução deles pronta.
2. **A Metodologia Da Base ao Topo** — um método autoral, documentado na apostila. Isso vira **curso e certificação** para outros professores.

Este guia é o passo a passo para transformar cada um em **fonte de renda recorrente**. São dois produtos diferentes, com públicos que se cruzam — no fim, um alimenta o outro.

> **Regra de ouro:** venda **resultado**, não funcionalidade. O professor não quer "um app"; quer parar de perder aluno por desorganização, receber em dia e ter tempo pra dar aula. O aluno de curso não quer "uma apostila"; quer dar aula melhor e cobrar mais caro.

---

# PARTE 1 — Vender o App para academias e professores

## 1.1 O que você está vendendo (a proposta de valor)

Não é "um software". É:

- **Agenda que se organiza sozinha** — fim do caderno e do "esqueci quem tem aula hoje".
- **Recebimento em dia** — Pix integrado, cobrança e controle de quem pagou.
- **App do próprio aluno** — ele agenda, remarca e vê o que deve, sem encher seu WhatsApp.
- **Financeiro e caixa** — quanto entrou, quanto falta, quanto cada modalidade rende.
- **Ranking e torneio (Barragem)** — engajamento que segura o aluno na academia.
- **Feito por quem é da quadra** — não é empresa de tecnologia genérica; é um sistema que já roda numa academia de verdade.

**A frase de uma linha:** *"É o sistema que organiza sua academia inteira — agenda, alunos e dinheiro — e ainda dá um app pro seu aluno. Feito por professor, pra professor."*

## 1.2 Para quem vender (público-alvo)

Em ordem de facilidade de fechamento:

1. **Professores autônomos** que dão aula em clube/condomínio e vivem no caos do WhatsApp. (Decisão rápida, ticket menor.)
2. **Pequenas academias de tênis e beach tennis** (1 a 4 quadras). (Ticket maior, precisa de demo.)
3. **Clubes e condomínios** com quadra e professor contratado. (Ciclo mais longo, mas fideliza.)

Onde encontrá-los: grupos de WhatsApp/Facebook de professores, Instagram (hashtags #aulasdetenis #beachtennis), federações estaduais, torneios amadores, e o boca a boca da sua própria rede.

## 1.3 Modelos de cobrança (escolha um para começar)

Sugestões de valores — **ajuste ao seu mercado**. O importante é ter **recorrência**.

| Modelo | Como funciona | Sugestão de preço |
|---|---|---|
| **Mensalidade (SaaS) — recomendado** | Cliente paga por mês para usar o sistema | R$ 97 (professor autônomo) · R$ 197–397 (academia, por porte) |
| **Setup + mensalidade** | Taxa única de implantação + mensalidade menor | Setup R$ 300–800 + R$ 79–247/mês |
| **Licença anual** | Pagamento anual com desconto | 10 meses pelo preço de 12 |
| **White-label** | Sistema com a marca do cliente (logo/cores dele) | Mensalidade maior (+40–60%) ou valor sob consulta |

**Recomendação:** comece com **mensalidade simples**, 1 ou 2 planos ("Professor" e "Academia"). Menos opção = decisão mais rápida.

## 1.4 O passo a passo da venda

**Passo 1 — Prepare a demonstração.**
Monte um ambiente de demo com dados fictícios (alunos, agenda cheia, caixa). Nunca mostre dados reais dos seus alunos. Tenha o app do aluno aberto no celular para mostrar dos dois lados.

**Passo 2 — Faça a lista de prospecção.**
20 nomes para começar: professores e academias que você conhece ou segue. Anote nome, contato e "dor" provável (ex.: "vive reclamando de calote").

**Passo 3 — Aborde (mensagem modelo no fim deste guia).**
WhatsApp ou DM. Curto, sobre o problema dele, com convite pra uma demo de 15 min. Não venda no texto — venda a **conversa**.

**Passo 4 — Demonstração ao vivo (roteiro de 15 min).**
1. Comece pela dor: "como você controla agenda e pagamento hoje?"
2. Mostre a agenda e o cadastro de aluno (2 min).
3. Mostre o **app do aluno** agendando sozinho (o "uau" costuma ser aqui).
4. Mostre o financeiro/caixa: "no fim do mês você vê isso pronto".
5. Feche com o ranking/Barragem: "isso segura seu aluno".
6. Preço e próximo passo. Não termine sem marcar o que acontece depois.

**Passo 5 — Proposta e fechamento.**
Mande uma proposta de uma página: o que inclui, o plano, o preço, como começa. Ofereça **7 a 14 dias de teste** ou o **primeiro mês com desconto** para tirar o medo.

**Passo 6 — Onboarding (implantação).**
Este é o passo que garante que o cliente fica: configure o sistema para ele, ajude a cadastrar os primeiros alunos, faça um treino de 30–40 min. Cliente que aprende a usar não cancela.

**Passo 7 — Suporte e retenção.**
Um canal de suporte (WhatsApp) e um contato a cada 30–60 dias perguntando como está. Retenção é onde está o lucro do recorrente.

## 1.5 Como entregar tecnicamente (nota rápida)

Cada cliente precisa dos **dados dele separados dos seus**. Na prática: para cada academia, um **deploy próprio** (uma URL Netlify) e um **banco Firebase próprio** (projeto separado). Assim ninguém vê o dado de ninguém, e você cobra por instalação. Guarde uma checklist de implantação para repetir sempre igual (criar Firebase, publicar, configurar preços, treinar).

> Quando tiver muitos clientes, vale evoluir para um cadastro que separe as academias automaticamente (multiempresa). No começo, um deploy por cliente resolve e é mais simples.

## 1.6 Objeções comuns e como responder

- **"Já uso caderno/planilha e funciona."** → "Funciona até você perder um aluno por esquecer um horário ou um pagamento. Quanto vale um aluno por ano pra você?"
- **"É caro."** → "Um aluno mensalista paga o sistema inteiro. Ele se paga com o primeiro calote que você evita."
- **"Não sou bom de tecnologia."** → "Por isso eu instalo e treino você. Se seu aluno usa WhatsApp, ele usa o app."
- **"Vou pensar."** → "Fechado. Te deixo 7 dias de teste com seus alunos de verdade. Se não facilitar sua vida, você não paga nada."

## 1.7 Metas e funil (exemplo)

Funil realista para começar: **20 conversas → 8 demos → 3 clientes**. Com 3 clientes a R$ 197/mês = R$ 591/mês recorrente já no primeiro ciclo. A cada mês você só precisa somar, porque os antigos continuam pagando.

---

# PARTE 2 — Vender a Metodologia como curso e certificação

## 2.1 O que você vende

A **formação Da Base ao Topo**: o método (apostila) vira o material de um curso que forma outros professores e entrega uma **certificação** com a sua chancela. Você não vende a apostila solta — vende a **transformação** (o professor sai dando aula melhor) e o **selo** (certificado JV Tênis).

## 2.2 Formatos (do menor para o maior ticket)

| Formato | Como é | Sugestão de preço |
|---|---|---|
| **Curso online gravado** | Aulas gravadas + a apostila em PDF + grupo | R$ 297–697 |
| **Online + encontros ao vivo** | Gravado + 3–4 lives de dúvida por turma | R$ 697–1.200 |
| **Imersão presencial** | 1–2 dias na sua quadra, turma pequena, prática | R$ 900–1.800 |
| **Certificação completa** | Curso + as 5 etapas de certificação do cap. 8 da apostila | R$ 1.500–3.000 |

Comece pelo formato que você consegue entregar bem **agora** — provavelmente uma **turma piloto presencial pequena** ou um **online gravado simples**.

## 2.3 A estrutura do curso já está pronta

Os módulos do curso = os capítulos da apostila. Você não precisa criar conteúdo, só gravar/ensinar o que já escreveu:

1. **Módulo 1 — A filosofia** (cap. 1–2): por que de baixo pra cima.
2. **Módulo 2 — A Pirâmide** (cap. 3): as 6 camadas.
3. **Módulo 3 — A Trilha e a avaliação** (cap. 4 e 7): níveis e régua de troca de bola.
4. **Módulo 4 — A aula e o calendário** (cap. 5): anatomia da aula e os temas do mês.
5. **Módulo 5 — Os exercícios** (cap. 6): o banco de drills.
6. **Módulo 6 — Formar-se professor** (cap. 8): conduta e certificação.

## 2.4 Passo a passo de lançamento

**Passo 1 — Escolha o formato da primeira turma** (recomendo piloto pequeno, 5–10 professores).

**Passo 2 — Página de inscrição.** Uma página simples só para captar interesse e inscrição (pode ser no mesmo site, em `/curso`, ou um formulário + Pix). O conteúdo da apostila **continua fechado** — a página só vende.

**Passo 3 — Divulgação.** Instagram (bastidor das suas aulas é seu melhor anúncio), lista de professores conhecidos, parceria com lojas de material e federação. Use depoimentos dos seus próprios alunos como prova de que o método funciona.

**Passo 4 — Turma piloto.** Preço promocional de fundador em troca de **depoimento e estudo de caso**. Essa turma vira sua prova social para as próximas.

**Passo 5 — Entregue e certifique.** Aplique o curso, avalie pelas 5 etapas do cap. 8, entregue o certificado. Professor certificado vira divulgador seu.

**Passo 6 — Repita e suba o preço.** A cada turma nova, mais depoimentos, mais autoridade, preço maior.

## 2.5 Proteger o que é seu (importante)

- A **apostila completa só chega a quem pagou** — nunca por link público. (Por isso ela saiu do site.)
- Entregue o PDF **com o nome do aluno na capa/rodapé** (marca d'água) para desincentivar repasse.
- Tenha um **termo simples** de uso: o certificado autoriza aplicar o método; não autoriza revender o material nem formar outros por conta própria sem a sua chancela.
- A marca "Da Base ao Topo" e "JV Tênis" são seu ativo — use sempre, em todo material.

---

# PARTE 3 — Os dois juntos: o ecossistema JV Tênis

O app e a metodologia se puxam:

- Quem faz a **formação** ganha **desconto no app** (ou o primeiro mês grátis). Ele já aprendeu o método com você; usar o seu sistema é natural.
- Quem assina o **app** é convidado para a **formação**. Ele já confia na sua marca.
- **Combo "Academia JV"**: sistema + formação + certificação por um valor de pacote. É a sua oferta mais completa e mais lucrativa.

Assim você deixa de vender por hora de quadra e passa a ter **três fontes de renda**: aulas, mensalidade do app e turmas de curso — as duas últimas **recorrentes e escaláveis**.

---

# Anexos — modelos prontos

## Anexo 1 — Mensagem de prospecção (app)

> Fala, [nome]! Tudo certo? 🎾
> Vi que você dá aula em [lugar]. Montei um sistema que organiza a academia inteira — agenda, alunos e pagamento — e ainda dá um app pro aluno agendar sozinho. Tá rodando aqui na minha academia e mudou meu controle.
> Posso te mostrar em 15 min como fica? Se fizer sentido, você testa com seus alunos antes de decidir. Quando você tem um tempo essa semana?

## Anexo 2 — Mensagem de follow-up (quem sumiu)

> Opa [nome]! Passando só pra saber se você quer que eu te mostre aquele sistema de gestão. Deixo você testar 7 dias sem compromisso — se não facilitar sua vida, é só me falar. Bora marcar?

## Anexo 3 — Mensagem de lançamento do curso

> 🎾 Vou abrir uma turma da formação **Da Base ao Topo** — o método que uso pra levar o aluno do primeiro contato à competição, começando pelos pés.
> São [X] vagas, turma pequena, com certificação. Quem entrar nessa primeira turma pega condição de fundador.
> Quer o programa completo? Me chama que te mando.

## Anexo 4 — Roteiro de demo do app (15 min)

1. (2 min) A dor: como ele controla hoje.
2. (3 min) Agenda + cadastro de aluno.
3. (3 min) App do aluno agendando (o "uau").
4. (3 min) Financeiro e caixa.
5. (2 min) Ranking / Barragem.
6. (2 min) Preço e próximo passo (teste ou 1º mês com desconto).

## Anexo 5 — Tabela de preços (edite os valores)

**App**
- Professor: R$ 97/mês
- Academia: R$ 197–397/mês (por porte)
- Setup opcional: R$ 300–800
- White-label: +40–60%

**Curso**
- Online gravado: R$ 297–697
- Online + ao vivo: R$ 697–1.200
- Imersão presencial: R$ 900–1.800
- Certificação completa: R$ 1.500–3.000

**Combo Academia JV:** app + formação + certificação — monte o pacote com desconto sobre a soma.

---

**JV Tênis** · João Victor · Santa Felicidade, Curitiba/PR
WhatsApp (41) 99541-5712 · Instagram @joaovictortenis

*Documento de uso interno. Os valores são sugestões de partida — ajuste ao seu mercado e à sua realidade.*

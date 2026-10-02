---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

## Neste projeto (JV Tênis): tem prioridade sobre o de cima
- A sessão roda num container que é apagado: pasta temporária não sobrevive. Entregue o
  documento **na resposta**, em um bloco único que o João copia e cola no chat novo, e
  também salve no scratchpad.
- Curto (até ~60 linhas): objetivo, o que já foi feito (PRs/commits por número), o que
  falta, decisões do João, próximos passos. O resto está no `CLAUDE.md` — não repita.
- Sem dados de aluno, valores reais ou backup.
